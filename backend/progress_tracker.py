# Copyright (c) 2026 Krishna Mittal.
# All Rights Reserved.
# See LICENSE for usage restrictions.

"""
Progress Tracker — Phase 5
Aggregates skill scores across sessions, detects recurring weaknesses,
and generates a 7-day revision plan.
"""
from __future__ import annotations
import json
import os
import sqlite3
from typing import Any, Dict, List, Optional

DB_PATH = os.getenv("DB_PATH", "./aura_users.db")


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def get_skill_history(user_id: str) -> Dict[str, List[float]]:
    """
    Retrieve per-skill score history across all sessions for a user.
    Extracts from report_json (skill_evidence) as well as answers_json.
    Returns { skill_name: [score1, score2, ...] }
    """
    skill_history: Dict[str, List[float]] = {}
    try:
        conn = _get_conn()
        rows = conn.execute(
            "SELECT answers_json, report_json FROM interview_history WHERE user_id=? ORDER BY completed_at ASC",
            (user_id,),
        ).fetchall()
        conn.close()

        for row in rows:
            answers_json = row["answers_json"] if "answers_json" in row.keys() else row[0]
            report_json = row["report_json"] if "report_json" in row.keys() else row[1]

            # 1. From report_json (skill_evidence)
            if report_json:
                try:
                    rep = json.loads(report_json)
                    se = rep.get("skill_evidence", {})
                    for skill, entry in se.items():
                        if isinstance(entry, dict):
                            scores = entry.get("scores", [])
                            if scores:
                                skill_history.setdefault(skill, []).extend(scores)
                except Exception:
                    pass

            # 2. From answers_json (question types & topics)
            if answers_json:
                try:
                    answers = json.loads(answers_json)
                    for a in answers:
                        if not isinstance(a, dict):
                            continue
                        score = a.get("score")
                        if score is None:
                            score = (a.get("scores") or {}).get("overall")
                        if score is not None and isinstance(score, (int, float)):
                            q_type = a.get("type") or a.get("question_type") or "General"
                            skill_history.setdefault(q_type, []).append(round(float(score), 2))
                            # If topic exists
                            topic = a.get("topic")
                            if topic and isinstance(topic, str):
                                skill_history.setdefault(topic, []).append(round(float(score), 2))
                except Exception:
                    pass
    except Exception:
        pass

    return skill_history


def detect_recurring_weaknesses(
    skill_history: Dict[str, List[float]],
    threshold: float = 3.2,
    min_appearances: int = 1,
) -> List[Dict[str, Any]]:
    """
    Return skills that consistently score below threshold.
    """
    weak: List[Dict[str, Any]] = []
    for skill, scores in skill_history.items():
        if len(scores) < min_appearances:
            continue
        avg = sum(scores) / len(scores)
        if avg < threshold:
            weak.append({
                "skill": skill,
                "avg_score": round(avg, 2),
                "appearances": len(scores),
                "scores": [round(s, 2) for s in scores],
                "trend": "declining" if len(scores) > 1 and scores[-1] < scores[0] else "stable",
            })
    return sorted(weak, key=lambda x: x["avg_score"])


def generate_revision_plan(
    weaknesses: List[Dict[str, Any]],
    strengths: List[str],
) -> Dict[str, Any]:
    """
    Create a 7-day personalised study schedule focused on weak areas.
    """
    plan: Dict[str, Any] = {}
    days = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"]
    day_topics: List[Dict[str, Any]] = []

    # Prioritise weaknesses, spread over days
    for i, w in enumerate(weaknesses[:5]):
        day_topics.append({
            "day": days[i],
            "focus_skill": w["skill"],
            "current_avg": w["avg_score"],
            "target": min(round(w["avg_score"] + 0.8, 1), 5.0),
            "study_activities": _activities_for_skill(w["skill"]),
            "practice_questions": 3,
            "priority": "HIGH",
        })

    # Remaining days fill with mixed review and strengths
    while len(day_topics) < 6:
        idx = len(day_topics)
        day_topics.append({
            "day": days[idx],
            "focus_skill": "Mixed Topic Mastery",
            "skills_covered": [w["skill"] for w in weaknesses[:4]],
            "study_activities": ["Timed simulation on weak areas", "Review ideal answer structures"],
            "practice_questions": 4,
            "priority": "MEDIUM",
        })

    # Day 7: finalize and test strengths
    day_topics.append({
        "day": days[6],
        "focus_skill": "Comprehensive Mock Simulation",
        "skills_covered": strengths[:3] if strengths else ["Technical", "Behavioural"],
        "study_activities": [
            "Complete a full mock interview session",
            "Benchmark against target role standard",
            "Review vocal pacing & composure metrics",
        ],
        "practice_questions": 5,
        "priority": "LOW",
    })

    for entry in day_topics:
        plan[entry["day"]] = entry

    return {
        "plan": plan,
        "total_days": 7,
        "focus_skills": [w["skill"] for w in weaknesses],
        "summary": f"7-day plan targeting {len(weaknesses)} focus area(s): "
                   + ", ".join(w["skill"] for w in weaknesses[:4])
                   + ("." if len(weaknesses) <= 4 else "..."),
    }


def _activities_for_skill(skill: str) -> List[str]:
    s = skill.lower()
    activities_map = {
        "dsa":           ["Practice 2 LeetCode problems (Array/Tree)", "Explain space and time complexity aloud"],
        "system design": ["Design a distributed rate-limiter or cache", "Identify single points of failure"],
        "dbms":          ["Review B-Trees, WAL, and transaction isolation levels", "Compare SQL vs NoSQL trade-offs"],
        "oop":           ["Walk through SOLID principles with code examples", "Explain composition vs inheritance"],
        "docker":        ["Write a multi-stage Dockerfile", "Explain container isolation vs VMs"],
        "react":         ["Explain reconciliation, hooks lifecycle, and state batching", "Build a memoized component"],
        "python":        ["Review GIL, asyncio event loop, and generators", "Solve 2 performance profiling problems"],
        "behavioural":   ["Draft 3 STAR-method stories with quantifiable metrics", "Practice answering with 90-second pacing"],
        "hr":            ["Refine your 2-minute elevator pitch", "Structure answers around core company values"],
    }
    for key, acts in activities_map.items():
        if key in s:
            return acts
    return [
        f"Deep-dive foundational concepts of {skill}",
        f"Practice answering 2 architectural questions on {skill}",
        "Review edge cases and trade-offs of chosen approaches",
    ]
