import pytest
from claim_verifier import (
    generate_claim_question,
    get_skill_evidence_summary,
    build_skill_evidence_registry,
    update_skill_evidence,
)


def test_claim_question_levels():
    q1 = generate_claim_question("Docker", 1)
    assert "What is Docker" in q1["question"]
    assert q1["level_label"] == "FUNDAMENTAL"

    q3 = generate_claim_question("Docker", 3)
    assert "implementation" in q3["question"].lower() or "details" in q3["question"].lower()
    assert q3["level_label"] == "IMPLEMENTATION"

    q5 = generate_claim_question("Docker", 5)
    assert "production failure" in q5["question"].lower() or "fix" in q5["question"].lower()
    assert q5["level_label"] == "SCENARIO"


def test_skill_evidence_summary():
    # Not evaluated
    summary0 = get_skill_evidence_summary("Docker", 0, [])
    assert summary0["evidence_level"] == "not_evaluated"

    # Strong evidence: high scores
    summary_strong = get_skill_evidence_summary("Docker", 3, [4.2, 4.0, 4.5])
    assert summary_strong["evidence_level"] == "strong"
    assert len(summary_strong["demonstrated_aspects"]) == 3

    # Limited evidence: low scores
    summary_limited = get_skill_evidence_summary("Docker", 2, [2.1, 2.0])
    assert summary_limited["evidence_level"] == "limited"


def test_skill_evidence_registry_lifecycle():
    skills = ["Docker", "Kubernetes"]
    reg = build_skill_evidence_registry(skills)
    assert "Docker" in reg
    assert reg["Docker"]["questions_asked"] == 0

    update_skill_evidence(reg, "Docker", 4.2)
    assert reg["Docker"]["questions_asked"] == 1
    assert reg["Docker"]["avg_score"] == 4.2
    assert reg["Docker"]["evidence_level"] == "strong"
