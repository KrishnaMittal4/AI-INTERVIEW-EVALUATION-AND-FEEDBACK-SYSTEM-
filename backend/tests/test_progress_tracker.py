import pytest
from progress_tracker import (
    detect_recurring_weaknesses,
    generate_revision_plan,
)


def test_detect_recurring_weaknesses():
    history = {
        "Docker": [4.0, 4.2],
        "System Design": [2.2, 2.5],
        "DBMS": [2.8],
    }
    weaknesses = detect_recurring_weaknesses(history, threshold=3.0, min_appearances=1)
    weak_skills = [w["skill"] for w in weaknesses]
    assert "System Design" in weak_skills
    assert "DBMS" in weak_skills
    assert "Docker" not in weak_skills


def test_generate_revision_plan():
    weaknesses = [
        {"skill": "System Design", "avg_score": 2.3, "appearances": 2, "scores": [2.2, 2.4], "trend": "stable"},
        {"skill": "DBMS", "avg_score": 2.8, "appearances": 1, "scores": [2.8], "trend": "stable"},
    ]
    strengths = ["Docker", "Python"]

    plan = generate_revision_plan(weaknesses, strengths)
    assert plan["total_days"] == 7
    assert "Day 1" in plan["plan"]
    assert "Day 7" in plan["plan"]
    assert "System Design" in plan["plan"]["Day 1"]["focus_skill"]
