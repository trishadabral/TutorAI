import json
import os
import time
from typing import Dict, List, Optional

import numpy as np

from rag import answer_question
from dkt import get_full_knowledge_state


class Evaluator:
    """Evaluates RAG pipeline and DKT model performance."""

    def __init__(self, results_path: str = "eval_results.json"):
        self.results_path = results_path
        self.results: Optional[Dict] = None
        self._load_results()

    def _load_results(self):
        if os.path.exists(self.results_path):
            with open(self.results_path) as f:
                self.results = json.load(f)

    def _save_results(self):
        with open(self.results_path, "w") as f:
            json.dump(self.results, f, indent=2)

    # ---------- RAG metrics (RAGAs-style) ----------

    def evaluate_rag(
        self,
        test_qa_pairs: List[Dict],
        session_id: str = "eval_session",
        max_pairs: int = 50,
    ) -> Dict:
        pairs = test_qa_pairs[:max_pairs]

        faithfulness_scores: list[float] = []
        relevancy_scores: list[float] = []
        recall_scores: list[float] = []

        for pair in pairs:
            question = pair.get("question", "")
            ground_context = pair.get("context", "")
            if not question:
                continue

            result = answer_question(question, session_id)
            generated_answer = result.get("answer", "")

            faithfulness_scores.append(
                self._compute_faithfulness(generated_answer, result.get("sources", []))
            )
            relevancy_scores.append(
                self._compute_relevancy(generated_answer, question)
            )
            recall_scores.append(
                self._compute_context_recall(ground_context, result.get("sources", []))
            )

        return {
            "faithfulness": float(np.mean(faithfulness_scores)) if faithfulness_scores else 0.0,
            "answer_relevancy": float(np.mean(relevancy_scores)) if relevancy_scores else 0.0,
            "context_recall": float(np.mean(recall_scores)) if recall_scores else 0.0,
            "num_evaluated": len(faithfulness_scores),
        }

    @staticmethod
    def _compute_faithfulness(answer: str, sources: list) -> float:
        if not answer or not sources:
            return 0.0
        stop = {"the", "a", "an", "is", "are", "was", "were", "be", "been",
                "being", "have", "has", "had", "do", "does", "did", "will",
                "would", "could", "should", "may", "might", "can", "shall",
                "to", "of", "in", "for", "on", "with", "at", "by", "from",
                "as", "into", "through", "during", "before", "after", "and",
                "but", "or", "not", "no", "so", "that", "this", "it", "its"}
        answer_words = set(answer.lower().split()) - stop
        if not answer_words:
            return 0.5
        source_words = set(" ".join(str(s) for s in sources).lower().split())
        return len(answer_words & source_words) / len(answer_words)

    @staticmethod
    def _compute_relevancy(answer: str, question: str) -> float:
        if not answer or not question:
            return 0.0
        qwords = set(question.lower().split()) - {
            "what", "how", "why", "when", "where", "who", "which",
            "is", "are", "the", "a", "an", "do", "does", "did",
            "can", "could", "would", "should", "will",
        }
        if not qwords:
            return 0.5
        overlap = qwords & set(answer.lower().split())
        return min(1.0, len(overlap) / max(1, len(qwords) * 0.5))

    @staticmethod
    def _compute_context_recall(ground_context: str, sources: list) -> float:
        if not ground_context or not sources:
            return 0.0
        stop = {"the", "a", "an", "is", "are", "was", "were", "be", "been",
                "to", "of", "in", "for", "on", "with", "at", "by", "from",
                "and", "but", "or", "not", "so", "that", "this", "it"}
        meaningful = set(ground_context.lower().split()) - stop
        if not meaningful:
            return 0.5
        source_words = set(" ".join(str(s) for s in sources).lower().split())
        return min(1.0, len(meaningful & source_words) / max(1, len(meaningful) * 0.3))

    # ---------- DKT metrics ----------

    @staticmethod
    def evaluate_dkt(session_id: str) -> Dict:
        state = get_full_knowledge_state(session_id)
        return {
            "total_interactions": state["total_interactions"],
            "num_concepts": len(state["concepts"]),
            "weak": len(state["weak_topics"]),
            "medium": len(state["medium_topics"]),
            "strong": len(state["strong_topics"]),
        }

    # ---------- Full evaluation ----------

    def run_full_evaluation(
        self,
        test_qa_pairs: Optional[List[Dict]] = None,
        session_id: str = "eval_session",
    ) -> Dict:
        results: dict = {"timestamp": time.time()}

        sample_qa = test_qa_pairs or self._generate_sample_qa()
        results["rag_metrics"] = self.evaluate_rag(sample_qa, session_id)
        results["dkt_metrics"] = self.evaluate_dkt(session_id)

        self.results = results
        self._save_results()
        return results

    @staticmethod
    def _generate_sample_qa() -> List[Dict]:
        topics = [
            "What is machine learning?",
            "Explain neural networks",
            "What is deep learning?",
            "Define natural language processing",
            "What is supervised learning?",
            "Explain gradient descent",
            "What is overfitting?",
            "Define regularization",
            "What is cross-validation?",
            "Explain bias-variance tradeoff",
        ]
        return [
            {
                "question": t,
                "answer": f"Sample answer about: {t}",
                "context": f"Machine learning concepts related to: {t}",
            }
            for t in topics
        ]

    def get_results(self) -> Dict:
        if self.results:
            return self.results
        return {
            "rag_metrics": {
                "faithfulness": 0.0,
                "answer_relevancy": 0.0,
                "context_recall": 0.0,
                "num_evaluated": 0,
            },
            "dkt_metrics": {"total_interactions": 0, "num_concepts": 0},
            "note": "Evaluation not yet run. Use POST /eval/run.",
        }


# Global evaluator instance
evaluator = Evaluator()
