import random
import json
from pipeline import query_collection
from llm import call_llm
from dkt import (
    get_knowledge_score,
    get_concept_difficulty,
    get_previous_questions,
    save_question,
)


def generate_mcq(topic: str, session_id: str) -> dict:
    """
    Generate an adaptive MCQ for *topic* using real difficulty tracking,
    random chunk sampling, and anti-repeat logic.
    """
    # Adaptive difficulty from DKT
    difficulty = get_concept_difficulty(session_id, topic)
    knowledge_score = get_knowledge_score(session_id, topic)

    # Previous questions to avoid repeats
    previous_qs = get_previous_questions(session_id, topic)

    # Retrieve MORE chunks then randomly sample for variety
    all_chunks = query_collection(topic, session_id, n_results=10)
    if not all_chunks:
        return {"error": "No study material found. Upload a PDF first."}

    sample_size = min(3, len(all_chunks))
    chunks = random.sample(all_chunks, sample_size)
    context = "\n\n".join(f"[Page {c['page']}]: {c['text']}" for c in chunks)

    # Difficulty-specific instructions
    difficulty_instructions = {
        "conceptual": "Create a basic definition or concept-recall question. Single idea. Easy language. No calculations.",
        "application": "Create a question requiring the student to APPLY this concept to a new scenario. Moderate complexity.",
        "analytical": "Create a challenging multi-step analytical question requiring reasoning, comparison or problem-solving. Make it hard.",
    }

    avoid_section = ""
    if previous_qs:
        avoid_section = "\n\nDO NOT repeat any of these previously asked questions:\n" + "\n".join(
            f"- {q}" for q in previous_qs[-8:]
        )

    system = (
        "You are an expert educator. You create unique, varied MCQ questions.\n"
        "You ALWAYS respond with valid JSON only. No markdown. No extra text."
    )

    user = f"""Generate question variant #{random.randint(1, 9999)} on topic: "{topic}"

Difficulty level: {difficulty.upper()}
Instruction: {difficulty_instructions.get(difficulty, difficulty_instructions["conceptual"])}
Student knowledge score: {knowledge_score:.2f}/1.0

Study material context:
{context}
{avoid_section}

Respond ONLY with this exact JSON (no markdown, no backticks):
{{
    "question": "unique question text here",
    "options": {{
        "A": "first option",
        "B": "second option",
        "C": "third option",
        "D": "fourth option"
    }},
    "correct": "A",
    "explanation": "clear explanation of why this is correct",
    "concept": "{topic}",
    "difficulty": "{difficulty}"
}}

Rules:
- All 4 options must be plausible
- Wrong options should be common misconceptions
- Question must be different from previously asked questions
- Question must be appropriate for {difficulty} level"""

    response = call_llm(system, user, temperature=0.9)

    try:
        clean = response.strip().replace("```json", "").replace("```", "").strip()
        start = clean.find("{")
        end = clean.rfind("}") + 1
        if start != -1 and end > start:
            clean = clean[start:end]
        mcq = json.loads(clean)

        # Save question to avoid future repeats
        save_question(session_id, topic, mcq.get("question", ""))
        return mcq
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}\nRaw response: {response}")
        return _generate_mcq_retry(topic, session_id, difficulty)


def _generate_mcq_retry(topic: str, session_id: str, difficulty: str) -> dict:
    """Fallback with simpler prompt if JSON parsing failed."""
    system = "Respond with ONLY a JSON object. Absolutely nothing else."
    user = (
        f'Topic: {topic}, Difficulty: {difficulty}\n\n'
        f'Return ONLY this JSON:\n'
        f'{{"question":"?","options":{{"A":"","B":"","C":"","D":""}},'
        f'"correct":"A","explanation":"",'
        f'"concept":"{topic}","difficulty":"{difficulty}"}}'
    )

    response = call_llm(system, user, temperature=0.5)
    try:
        clean = response.strip()
        start = clean.find("{")
        end = clean.rfind("}") + 1
        return json.loads(clean[start:end])
    except Exception:
        return {"error": "Could not generate MCQ. Please try again."}
