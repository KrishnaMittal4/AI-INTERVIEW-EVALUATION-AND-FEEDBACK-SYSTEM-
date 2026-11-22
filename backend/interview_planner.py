"""
Dynamic Interview Planner — Phase 3
Generates a topic/time plan before the interview starts and maintains
per-skill difficulty tracking.
"""
from __future__ import annotations
import re
from typing import Any, Dict, List, Optional

# ── Default topic distributions per role ─────────────────────────────────────
_ROLE_DISTRIBUTIONS: Dict[str, Dict[str, float]] = {
    "default": {
        "Resume / Projects": 0.20,
        "Core Technical": 0.25,
        "DSA / Problem Solving": 0.15,
        "System Design": 0.15,
        "Role-Specific Skills": 0.15,
        "Behavioural": 0.10,
    },
    "software engineer": {
        "Resume / Projects": 0.20,
        "Programming": 0.20,
        "DSA": 0.20,
        "OOP / DBMS": 0.15,
        "System Design": 0.15,
        "Behavioural": 0.10,
    },
    "data scientist": {
        "Resume / Projects": 0.20,
        "ML / Statistics": 0.25,
        "Data Engineering": 0.20,
        "Python / SQL": 0.15,
        "System Design": 0.10,
        "Behavioural": 0.10,
    },
    "product manager": {
        "Resume / Projects": 0.15,
        "Product Thinking": 0.25,
        "Metrics / Analytics": 0.20,
        "Stakeholder / Communication": 0.20,
        "Technical Basics": 0.10,
        "Behavioural": 0.10,
    },
    "frontend engineer": {
        "Resume / Projects": 0.20,
        "JavaScript / TypeScript": 0.25,
        "React / Frameworks": 0.20,
        "CSS / Accessibility": 0.15,
        "Performance / Tooling": 0.10,
        "Behavioural": 0.10,
    },
    "backend engineer": {
        "Resume / Projects": 0.20,
        "APIs / Architecture": 0.25,
        "Databases / SQL": 0.20,
        "System Design": 0.20,
        "Security / DevOps": 0.05,
        "Behavioural": 0.10,
    },
    "ml engineer": {
        "Resume / Projects": 0.20,
        "ML Theory / Math": 0.20,
        "Model Training / Evaluation": 0.20,
        "Data Pipelines": 0.15,
        "Deployment / MLOps": 0.15,
        "Behavioural": 0.10,
    },
}

_DIFFICULTY_SCALE = ["foundational", "easy", "intermediate", "advanced", "expert"]


def _normalise_role(role: str) -> str:
    return role.strip().lower()


def generate_interview_plan(
    role: str,
    resume_text: str = "",
    jd_text: str = "",
    duration_minutes: int = 30,
    mode: str = "practice",
    num_questions: int = 10,
) -> Dict[str, Any]:
    """
    Generate a pre-interview plan.

    Returns:
    {
        role, duration_minutes, mode,
        topic_distribution: {topic: {weight, question_count, difficulty_target}},
        total_questions,
        skill_difficulty: {skill: difficulty_level},
        summary_text
    }
    """
    normalised = _normalise_role(role)
    dist = _ROLE_DISTRIBUTIONS.get(normalised, _ROLE_DISTRIBUTIONS["default"])

    # Adjust for duration: short sessions collapse topics
    if duration_minutes <= 15:
        dist = dict(list(dist.items())[:4])
        total = sum(dist.values())
        dist = {k: round(v / total, 3) for k, v in dist.items()}

    topic_distribution = {}
    for topic, weight in dist.items():
        q_count = max(1, round(weight * num_questions))
        topic_distribution[topic] = {
            "weight": weight,
            "question_count": q_count,
            "difficulty_target": "intermediate",
            "questions_asked": 0,
            "avg_score": None,
        }

    # Initial per-skill difficulty from resume keywords
    skill_difficulty = _init_skill_difficulty(resume_text, role)

    summary_lines = [f"📋 Interview Plan — {role} ({mode.upper()})"]
    summary_lines.append(f"Duration: {duration_minutes} min  |  Questions: {num_questions}")
    summary_lines.append("")
    for topic, info in topic_distribution.items():
        pct = int(info["weight"] * 100)
        summary_lines.append(f"  {topic:<30} {pct:>3}%  ({info['question_count']} questions)")

    return {
        "role": role,
        "duration_minutes": duration_minutes,
        "mode": mode,
        "num_questions": num_questions,
        "topic_distribution": topic_distribution,
        "skill_difficulty": skill_difficulty,
        "summary_text": "\n".join(summary_lines),
    }


def _init_skill_difficulty(resume_text: str, role: str) -> Dict[str, str]:
    """
    Set an initial difficulty level per detected skill based on resume content.
    If resume mentions 'senior' / 'lead' → start at advanced; default intermediate.
    """
    is_senior = bool(re.search(r"\b(senior|lead|principal|staff|architect)\b", resume_text, re.I))
    default_level = "advanced" if is_senior else "intermediate"

    tech_re = re.compile(
        r"\b(React|Vue|Angular|Next\.js|FastAPI|Django|Flask|Python|JavaScript|TypeScript|"
        r"Java|Go|Rust|C\+\+|PostgreSQL|MySQL|MongoDB|Redis|Docker|Kubernetes|"
        r"AWS|GCP|Azure|TensorFlow|PyTorch|scikit-learn|GraphQL|Kafka|Git|Linux)\b",
        re.IGNORECASE,
    )

    skill_difficulty: Dict[str, str] = {}
    for m in tech_re.finditer(resume_text):
        skill = m.group(0)
        if skill not in skill_difficulty:
            skill_difficulty[skill] = default_level

    # Always seed OOP, DSA, DBMS, System Design
    for base_topic in ["OOP", "DSA", "DBMS", "System Design", "Behavioural"]:
        skill_difficulty.setdefault(base_topic, "intermediate")

    return skill_difficulty


def adapt_skill_difficulty(
    skill_difficulty: Dict[str, str],
    skill: str,
    score_1_5: float,
) -> Dict[str, str]:
    """
    After an answer on a topic, adapt the difficulty for that skill.
    Score ≥ 4   → move up one level
    Score ≤ 2.5 → move down one level
    """
    idx = _DIFFICULTY_SCALE.index(
        skill_difficulty.get(skill, "intermediate")
        if skill_difficulty.get(skill, "intermediate") in _DIFFICULTY_SCALE
        else "intermediate"
    )

    if score_1_5 >= 4.0:
        new_idx = min(len(_DIFFICULTY_SCALE) - 1, idx + 1)
    elif score_1_5 <= 2.5:
        new_idx = max(0, idx - 1)
    else:
        new_idx = idx

    skill_difficulty[skill] = _DIFFICULTY_SCALE[new_idx]
    return skill_difficulty


def select_followup_type(
    answer_score: float,
    q_type: str,
    prev_answer_summary: str = "",
) -> str:
    """
    Choose the most appropriate follow-up question taxonomy based on the answer.

    Returns one of:
        CLARIFICATION | DEPTH | TRADE_OFF | SCENARIO | DEBUGGING |
        ALTERNATIVE | BEHAVIORAL_PROBE | RESULT_PROBE
    """
    q_lower = q_type.lower()

    if answer_score < 2.0:
        return "CLARIFICATION"
    if answer_score < 3.0:
        return "DEPTH"

    if "behavioural" in q_lower or "behavioral" in q_lower or "hr" in q_lower:
        if answer_score >= 4.0:
            return "RESULT_PROBE"
        return "BEHAVIORAL_PROBE"

    if "technical" in q_lower or "system" in q_lower:
        if answer_score >= 4.5:
            return "SCENARIO"
        if answer_score >= 4.0:
            return "TRADE_OFF"
        if answer_score >= 3.5:
            return "ALTERNATIVE"
        return "DEBUGGING"

    return "DEPTH"


_FOLLOWUP_PROMPTS: Dict[str, str] = {
    "CLARIFICATION": "Ask the candidate to clarify what they meant by a vague or ambiguous part of their answer.",
    "DEPTH": "Ask the candidate to explain the internals or implementation details more deeply.",
    "TRADE_OFF": "Challenge the candidate: what are the disadvantages or trade-offs of the approach they described?",
    "SCENARIO": "Give the candidate a realistic failure or scale scenario based on what they described. Ask how they would handle it.",
    "DEBUGGING": "Ask the candidate how they would debug or diagnose the specific issue or failure mode in their described approach.",
    "ALTERNATIVE": "Ask what alternative approach they could have used and why they did not.",
    "BEHAVIORAL_PROBE": "Ask specifically what the candidate's personal contribution was (not the team's).",
    "RESULT_PROBE": "Ask what measurable outcome or business result their described work produced.",
}


def get_followup_prompt_instruction(followup_type: str) -> str:
    return _FOLLOWUP_PROMPTS.get(followup_type, _FOLLOWUP_PROMPTS["DEPTH"])
