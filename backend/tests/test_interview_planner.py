import pytest
from interview_planner import (
    generate_interview_plan,
    adapt_skill_difficulty,
    select_followup_type,
    get_followup_prompt_instruction,
)


def test_interview_plan_generation():
    plan = generate_interview_plan(
        role="Software Engineer",
        resume_text="Senior Software Engineer with 5 years experience in React, Python, Docker.",
        duration_minutes=30,
        mode="practice",
        num_questions=10,
    )
    assert plan["role"] == "Software Engineer"
    assert plan["num_questions"] == 10
    assert "topic_distribution" in plan
    
    # Check weights sum close to 1.0
    total_w = sum(t["weight"] for t in plan["topic_distribution"].values())
    assert 0.95 <= total_w <= 1.05

    # Check per-skill difficulty initialized
    assert "Docker" in plan["skill_difficulty"] or "OOP" in plan["skill_difficulty"]


def test_adapt_skill_difficulty():
    sd = {"Docker": "intermediate", "DSA": "intermediate"}
    
    # High score promotes difficulty
    sd = adapt_skill_difficulty(sd, "Docker", 4.5)
    assert sd["Docker"] == "advanced"

    # Low score demotes difficulty
    sd = adapt_skill_difficulty(sd, "DSA", 2.0)
    assert sd["DSA"] == "easy"


def test_select_followup_taxonomy():
    # Low score triggers clarification
    f_clarify = select_followup_type(1.8, "technical")
    assert f_clarify == "CLARIFICATION"

    # Mid score triggers depth
    f_depth = select_followup_type(2.6, "technical")
    assert f_depth == "DEPTH"

    # High score on behavioral triggers result probe
    f_res = select_followup_type(4.2, "behavioural")
    assert f_res == "RESULT_PROBE"

    # High score on technical triggers scenario or trade-off
    f_tech = select_followup_type(4.6, "technical")
    assert f_tech == "SCENARIO"

    # Verify instruction exists
    assert len(get_followup_prompt_instruction(f_tech)) > 10
