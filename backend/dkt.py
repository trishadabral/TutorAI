import json
import os
from pathlib import Path

KNOWLEDGE_DIR = os.getenv("KNOWLEDGE_DIR", "./knowledge_states")
Path(KNOWLEDGE_DIR).mkdir(exist_ok=True)


def _load_state(session_id: str) -> dict:
    path = f"{KNOWLEDGE_DIR}/{session_id}.json"
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return {"concepts": {}, "history": []}


def _save_state(session_id: str, state: dict):
    with open(f"{KNOWLEDGE_DIR}/{session_id}.json", "w") as f:
        json.dump(state, f, indent=2)


# ---------- Public API ----------

def get_knowledge_score(session_id: str, concept: str) -> float:
    """Return the student's knowledge probability (0-1) for *concept*."""
    state = _load_state(session_id)
    return state["concepts"].get(concept, 0.5)


def update_knowledge(session_id: str, concept: str, correct: bool) -> dict:
    """
    Update the student's knowledge for *concept* after answering a question.
    Uses a simplified Bayesian Knowledge Tracing update.
    Also tracks per-concept difficulty progression.
    """
    state = _load_state(session_id)

    current = state["concepts"].get(concept, 0.5)

    # BKT parameters
    p_learn = 0.3
    p_forget = 0.05
    p_guess = 0.25
    p_slip = 0.1

    if correct:
        p_correct_given_known = 1 - p_slip
        p_correct_given_unknown = p_guess
    else:
        p_correct_given_known = p_slip
        p_correct_given_unknown = 1 - p_guess

    # Bayes update
    numerator = current * p_correct_given_known
    denominator = numerator + (1 - current) * p_correct_given_unknown
    posterior = numerator / denominator if denominator > 0 else current

    # Apply learning / forgetting
    new_score = posterior + (1 - posterior) * p_learn
    new_score = new_score * (1 - p_forget)  # slight forgetting
    new_score = max(0.0, min(1.0, new_score))

    state["concepts"][concept] = round(new_score, 3)
    state["history"].append({
        "concept": concept,
        "correct": correct,
        "score_before": round(current, 3),
        "score_after": round(new_score, 3),
    })

    # --- Per-concept difficulty tracking ---
    if "concept_details" not in state:
        state["concept_details"] = {}
    if concept not in state["concept_details"]:
        state["concept_details"][concept] = {
            "total_attempts": 0,
            "total_correct": 0,
            "current_difficulty": "conceptual",
        }

    details = state["concept_details"][concept]
    details["total_attempts"] += 1
    if correct:
        details["total_correct"] += 1

    attempts = details["total_attempts"]
    score = new_score
    current_diff = details["current_difficulty"]

    # Difficulty progression rules
    if current_diff == "conceptual" and score > 0.5 and attempts >= 2:
        details["current_difficulty"] = "application"
    elif current_diff == "application" and score > 0.7 and attempts >= 4:
        details["current_difficulty"] = "analytical"
    elif score < 0.35 and attempts >= 3:
        # Student is struggling — drop back down
        details["current_difficulty"] = "conceptual"

    state["concept_details"][concept] = details

    _save_state(session_id, state)
    return state


def get_full_knowledge_state(session_id: str) -> dict:
    """Return the complete knowledge state with categorised topics."""
    state = _load_state(session_id)
    concepts = state["concepts"]

    weak = [c for c, s in concepts.items() if s < 0.4]
    medium = [c for c, s in concepts.items() if 0.4 <= s < 0.7]
    strong = [c for c, s in concepts.items() if s >= 0.7]

    return {
        "concepts": concepts,
        "concept_details": state.get("concept_details", {}),
        "weak_topics": weak,
        "medium_topics": medium,
        "strong_topics": strong,
        "total_interactions": len(state["history"]),
        "history": state["history"][-20:],
    }


# ---------- Difficulty & Question Tracking ----------

def get_concept_difficulty(session_id: str, concept: str) -> str:
    """Return the current adaptive difficulty level for a concept."""
    state = _load_state(session_id)
    concept_data = state.get("concept_details", {}).get(concept, {})
    return concept_data.get("current_difficulty", "conceptual")


def get_previous_questions(session_id: str, concept: str) -> list:
    """Return previously asked questions for a concept."""
    state = _load_state(session_id)
    return state.get("asked_questions", {}).get(concept, [])


def save_question(session_id: str, concept: str, question: str):
    """Save a question to the asked-questions tracker (keeps last 10)."""
    state = _load_state(session_id)
    if "asked_questions" not in state:
        state["asked_questions"] = {}
    if concept not in state["asked_questions"]:
        state["asked_questions"][concept] = []
    state["asked_questions"][concept].append(question)
    state["asked_questions"][concept] = state["asked_questions"][concept][-10:]
    _save_state(session_id, state)
