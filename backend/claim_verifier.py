# Copyright (c) 2026 Krishna Mittal.
# All Rights Reserved.
# See LICENSE for usage restrictions.

"""
Claim Verifier — Phase 2
Generates 5-level depth challenge questions for skills claimed on the resume
and tracks skill evidence based on answer scores.
"""
from __future__ import annotations
from typing import Any, Dict, List, Optional

# ── 5-Level depth templates ───────────────────────────────────────────────────
# Each level key maps to a prompt template.
# {skill} and {context} are substituted at call time.

_DEPTH_TEMPLATES: Dict[int, str] = {
    1: "What is {skill} and what problem does it solve?",
    2: "Where did you use {skill} in your projects? Walk me through that use-case.",
    3: "Describe the specific implementation details when you used {skill}. What configuration or code did that involve?",
    4: "Why did you choose {skill} over alternatives? What trade-offs did you accept?",
    5: "Suppose you encounter a production failure specific to {skill}. How would you diagnose and fix it?",
}

_DEPTH_LABELS: Dict[int, str] = {
    1: "FUNDAMENTAL",
    2: "APPLIED",
    3: "IMPLEMENTATION",
    4: "TRADE_OFF",
    5: "SCENARIO",
}

# Evidence thresholds
_EVIDENCE_BANDS = [
    (3.8, "strong",    "Strong evidence"),
    (2.8, "moderate",  "Moderate evidence"),
    (1.8, "limited",   "Limited evidence"),
    (0.0, "not_evaluated", "Not yet evaluated"),
]


def generate_claim_question(
    skill: str,
    level: int,
    context: str = "",
    custom_intro: str = "",
) -> Dict[str, str]:
    """
    Generate a depth challenge question for a claimed skill.

    Args:
        skill: e.g. "Docker"
        level: 1–5
        context: optional extra context (previous answer summary)
        custom_intro: optional interviewer transition ("You mentioned Docker earlier…")

    Returns:
        { question, level_label, level_num, skill }
    """
    level = max(1, min(5, level))
    template = _DEPTH_TEMPLATES[level]
    q_text = template.format(skill=skill, context=context or skill)

    if custom_intro:
        q_text = custom_intro.rstrip(". ") + ". " + q_text

    return {
        "question": q_text,
        "level_label": _DEPTH_LABELS[level],
        "level_num": level,
        "skill": skill,
        "question_type": "Technical",
        "difficulty": {1: "easy", 2: "easy", 3: "medium", 4: "hard", 5: "hard"}.get(level, "medium"),
    }


def get_skill_evidence_summary(
    skill: str,
    questions_asked: int,
    scores: List[float],
) -> Dict[str, Any]:
    """
    Summarise evidence for a skill based on how many questions were asked
    and what scores were achieved.

    Args:
        skill: skill name
        questions_asked: number of depth questions asked for this skill
        scores: list of answer scores (1–5 scale)

    Returns:
        {
            skill, questions_asked, avg_score,
            evidence_level, evidence_label,
            demonstrated_aspects, unverified_aspects
        }
    """
    if not scores or questions_asked == 0:
        return {
            "skill": skill,
            "questions_asked": 0,
            "avg_score": None,
            "evidence_level": "not_evaluated",
            "evidence_label": "Not yet evaluated",
            "demonstrated_aspects": [],
            "unverified_aspects": list(_DEPTH_LABELS.values()),
        }

    avg = round(sum(scores) / len(scores), 2)
    evidence_level = "not_evaluated"
    evidence_label = "Not yet evaluated"
    for threshold, level, label in _EVIDENCE_BANDS:
        if avg >= threshold:
            evidence_level = level
            evidence_label = label
            break

    # Aspects are levels 1–N that were actually asked
    demonstrated = [_DEPTH_LABELS[i] for i in range(1, questions_asked + 1) if scores[i - 1] >= 2.8] if scores else []
    unverified = [_DEPTH_LABELS[i] for i in range(questions_asked + 1, 6)]

    return {
        "skill": skill,
        "questions_asked": questions_asked,
        "avg_score": avg,
        "evidence_level": evidence_level,
        "evidence_label": evidence_label,
        "demonstrated_aspects": demonstrated,
        "unverified_aspects": unverified,
    }


def build_skill_evidence_registry(resume_claims: List[str]) -> Dict[str, Any]:
    """
    Initialise an evidence registry for each claimed skill.
    Call once at session start with the list of skills from resume.
    """
    return {
        skill: {
            "skill": skill,
            "questions_asked": 0,
            "scores": [],
            "evidence_level": "not_evaluated",
            "evidence_label": "Not yet evaluated",
        }
        for skill in resume_claims
    }


def update_skill_evidence(
    registry: Dict[str, Any],
    skill: str,
    score: float,
) -> Dict[str, Any]:
    """
    Record a new score for a skill in the registry and recompute evidence.
    """
    if skill not in registry:
        registry[skill] = {
            "skill": skill,
            "questions_asked": 0,
            "scores": [],
            "evidence_level": "not_evaluated",
            "evidence_label": "Not yet evaluated",
        }

    entry = registry[skill]
    entry["questions_asked"] += 1
    entry["scores"].append(round(score, 2))

    summary = get_skill_evidence_summary(skill, entry["questions_asked"], entry["scores"])
    entry.update(summary)
    return registry
