from typing import List, Dict, Tuple, Optional
import numpy as np
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer
import chromadb
from dkt import knowledge_tracer


class HybridRetriever:
    """Combines BM25 sparse retrieval + dense ChromaDB retrieval with RRF fusion."""
    
    def __init__(self, persist_dir: str = "chroma_db"):
        self.persist_dir = persist_dir
        self.embedding_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        self.chroma_client = chromadb.PersistentClient(path=persist_dir)
        self._bm25_cache: Dict[str, BM25Okapi] = {}
        self._docs_cache: Dict[str, List[Dict]] = {}
    
    def _tokenize(self, text: str) -> List[str]:
        """Simple whitespace tokenizer for BM25."""
        return text.lower().split()
    
    def _build_bm25_index(self, session_id: str):
        """Build BM25 index from all documents in the session collection."""
        if session_id in self._bm25_cache:
            return
        
        collection_name = f"session_{session_id}"
        try:
            collection = self.chroma_client.get_collection(collection_name)
        except:
            return
        
        # Get all documents
        results = collection.get(include=["documents", "metadatas"])
        
        if not results["documents"]:
            return
        
        docs = []
        doc_infos = []
        
        for i, doc in enumerate(results["documents"]):
            metadata = results["metadatas"][i] if results["metadatas"] else {}
            docs.append(self._tokenize(doc))
            doc_infos.append({
                "text": doc,
                "metadata": metadata,
                "id": results["ids"][i] if results["ids"] else f"doc_{i}"
            })
        
        if docs:
            self._bm25_cache[session_id] = BM25Okapi(docs)
            self._docs_cache[session_id] = doc_infos
    
    def _bm25_search(self, session_id: str, query: str, top_k: int = 20) -> List[Tuple[Dict, float]]:
        """Search using BM25 sparse retrieval."""
        self._build_bm25_index(session_id)
        
        if session_id not in self._bm25_cache:
            return []
        
        tokenized_query = self._tokenize(query)
        scores = self._bm25_cache[session_id].get_scores(tokenized_query)
        
        # Get top-k results
        top_indices = np.argsort(scores)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            if scores[idx] > 0:
                results.append((self._docs_cache[session_id][idx], float(scores[idx])))
        
        return results
    
    def _dense_search(self, session_id: str, query: str, top_k: int = 20) -> List[Tuple[Dict, float]]:
        """Search using dense ChromaDB retrieval."""
        collection_name = f"session_{session_id}"
        try:
            collection = self.chroma_client.get_collection(collection_name)
        except:
            return []
        
        # Generate query embedding
        query_embedding = self.embedding_model.encode([query]).tolist()
        
        # Query ChromaDB
        results = collection.query(
            query_embeddings=query_embedding,
            n_results=min(top_k, collection.count()),
            include=["documents", "metadatas", "distances"]
        )
        
        if not results["documents"] or not results["documents"][0]:
            return []
        
        search_results = []
        for i, doc in enumerate(results["documents"][0]):
            metadata = results["metadatas"][0][i] if results["metadatas"] else {}
            distance = results["distances"][0][i] if results["distances"] else 0
            # Convert cosine distance to similarity score
            score = 1.0 - distance
            
            search_results.append(({
                "text": doc,
                "metadata": metadata,
                "id": results["ids"][0][i] if results["ids"] else f"doc_{i}"
            }, float(score)))
        
        return search_results
    
    def _reciprocal_rank_fusion(
        self, 
        bm25_results: List[Tuple[Dict, float]], 
        dense_results: List[Tuple[Dict, float]],
        k: int = 60
    ) -> List[Tuple[Dict, float]]:
        """Merge BM25 and dense results using Reciprocal Rank Fusion."""
        scores: Dict[str, Tuple[Dict, float]] = {}
        
        # Process BM25 results
        for rank, (doc_info, _) in enumerate(bm25_results):
            doc_id = doc_info["id"]
            rrf_score = 1.0 / (k + rank + 1)
            if doc_id in scores:
                scores[doc_id] = (scores[doc_id][0], scores[doc_id][1] + rrf_score)
            else:
                scores[doc_id] = (doc_info, rrf_score)
        
        # Process dense results
        for rank, (doc_info, _) in enumerate(dense_results):
            doc_id = doc_info["id"]
            rrf_score = 1.0 / (k + rank + 1)
            if doc_id in scores:
                scores[doc_id] = (scores[doc_id][0], scores[doc_id][1] + rrf_score)
            else:
                scores[doc_id] = (doc_info, rrf_score)
        
        # Sort by RRF score
        sorted_results = sorted(scores.values(), key=lambda x: x[1], reverse=True)
        return sorted_results
    
    def _rerank_by_knowledge(
        self, 
        results: List[Tuple[Dict, float]], 
        session_id: str,
        query_concepts: Optional[List[str]] = None
    ) -> List[Tuple[Dict, float]]:
        """Rerank results based on student's knowledge state."""
        if not query_concepts or not session_id:
            return results
        
        reranked = []
        
        for doc_info, score in results:
            metadata = doc_info.get("metadata", {})
            doc_concepts = metadata.get("concepts", "").split(", ")
            section_title = metadata.get("section_title", "").lower()
            
            # Calculate relevance to query concepts
            concept_overlap = 0
            for qc in query_concepts:
                qc_lower = qc.lower()
                for dc in doc_concepts:
                    if qc_lower in dc.lower() or dc.lower() in qc_lower:
                        concept_overlap += 1
                        break
            
            # Get average knowledge for relevant concepts
            avg_knowledge = 0.5
            if query_concepts:
                knowledge_scores = [
                    knowledge_tracer.get_knowledge_for_concept(session_id, c)
                    for c in query_concepts
                ]
                avg_knowledge = np.mean(knowledge_scores) if knowledge_scores else 0.5
            
            # Adjust score based on knowledge level and document complexity
            adjustment = 1.0
            if avg_knowledge < 0.4:
                # Prefer simpler/foundational chunks
                if "introduction" in section_title or "basic" in section_title or "overview" in section_title:
                    adjustment = 1.3
                elif "advanced" in section_title or "analysis" in section_title:
                    adjustment = 0.7
            elif avg_knowledge > 0.7:
                # Prefer advanced chunks
                if "advanced" in section_title or "analysis" in section_title:
                    adjustment = 1.3
                elif "introduction" in section_title or "basic" in section_title:
                    adjustment = 0.8
            
            # Boost documents with high concept overlap
            if concept_overlap > 0:
                adjustment *= (1 + 0.1 * concept_overlap)
            
            final_score = score * adjustment
            reranked.append((doc_info, final_score))
        
        # Sort by adjusted score
        reranked.sort(key=lambda x: x[1], reverse=True)
        return reranked
    
    def retrieve(
        self, 
        query: str, 
        session_id: str,
        top_k: int = 5,
        query_concepts: Optional[List[str]] = None
    ) -> List[Dict]:
        """
        Hybrid retrieval: BM25 + Dense + RRF + Knowledge-aware reranking.
        Returns top-k chunks with page citations.
        """
        # Run both retrievers
        bm25_results = self._bm25_search(session_id, query, top_k=20)
        dense_results = self._dense_search(session_id, query, top_k=20)
        
        # Merge with RRF
        fused_results = self._reciprocal_rank_fusion(bm25_results, dense_results)
        
        # Rerank by knowledge state
        reranked = self._rerank_by_knowledge(fused_results, session_id, query_concepts)
        
        # Return top-k
        final_results = []
        for doc_info, score in reranked[:top_k]:
            metadata = doc_info.get("metadata", {})
            final_results.append({
                "text": doc_info["text"],
                "page_number": metadata.get("page_number", 0),
                "section_title": metadata.get("section_title", "General"),
                "concepts": metadata.get("concepts", ""),
                "filename": metadata.get("filename", ""),
                "relevance_score": float(score)
            })
        
        return final_results
    
    def invalidate_cache(self, session_id: str):
        """Clear BM25 cache when new documents are added."""
        if session_id in self._bm25_cache:
            del self._bm25_cache[session_id]
        if session_id in self._docs_cache:
            del self._docs_cache[session_id]


# Global retriever instance
retriever = HybridRetriever()
