from pipeline import query_collection
from llm import call_llm


def answer_question(question: str, session_id: str) -> dict:
    """
    Answer *question* using RAG: retrieve relevant chunks, then ask Ollama LLM.
    """
    chunks = query_collection(question, session_id, n_results=5)

    if not chunks:
        return {
            "answer": "No document found for this session. Please upload a PDF first.",
            "sources": [],
            "has_context": False,
        }

    context = "\n\n".join(f"[Page {c['page']}]: {c['text']}" for c in chunks)
    sources = list({c["page"] for c in chunks})

    system = (
        "You are a helpful study tutor. Answer the student's question "
        "using ONLY the provided context from their study material. "
        "Be clear, educational, and concise. "
        "Always mention which page(s) your answer comes from. "
        "If the context doesn't contain the answer, say so honestly."
    )

    user = (
        f"Context from study material:\n{context}\n\n"
        f"Student question: {question}\n\n"
        f"Answer clearly and cite page numbers."
    )

    answer = call_llm(system, user, temperature=0.3)

    return {
        "answer": answer,
        "sources": sources,
        "has_context": True,
        "chunks_used": len(chunks),
    }
