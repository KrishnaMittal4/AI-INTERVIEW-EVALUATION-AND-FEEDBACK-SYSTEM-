# Copyright (c) 2026 Krishna Mittal.
# All Rights Reserved.
# See LICENSE for usage restrictions.

"""
Interview Memory — Phase 2
Extracts structured facts from each answer and maintains session-level memory.
"""
from __future__ import annotations
import re
from typing import Any, Dict, List

# ── Patterns for lightweight regex extraction ─────────────────────────────────
_TECH_PATTERNS = re.compile(
    r"\b(React|Vue|Angular|Next\.js|Vite|Redux|Tailwind|"
    r"FastAPI|Django|Flask|Express|Node\.js|Spring Boot|Rails|"
    r"Python|JavaScript|TypeScript|Java|Go|Rust|C\+\+|C#|Kotlin|Swift|"
    r"PostgreSQL|MySQL|MongoDB|Redis|SQLite|DynamoDB|Cassandra|"
    r"Docker|Kubernetes|k8s|Terraform|Ansible|CI/CD|GitHub Actions|Jenkins|"
    r"AWS|GCP|Azure|Vercel|Netlify|Render|Heroku|"
    r"TensorFlow|PyTorch|scikit-learn|LangChain|LangGraph|FAISS|BM25|"
    r"Groq|OpenAI|Gemini|Claude|LLM|RAG|Whisper|"
    r"GraphQL|REST|gRPC|WebSocket|Kafka|RabbitMQ|Celery|"
    r"Git|Linux|Nginx|Apache|Prometheus|Grafana|Elasticsearch)\b",
    re.IGNORECASE,
)

_PROJECT_PATTERNS = re.compile(
    r"(?:my|our|the|built|developed|created|worked on|designed)\s+"
    r"(?:a |an |the )?(?P<project>[A-Z][A-Za-z0-9 \-]{3,40}?)(?:\s+(?:project|app|system|platform|tool|service|pipeline|dashboard|api|bot|agent))?",
    re.IGNORECASE,
)

_CLAIM_PATTERNS = [
    re.compile(r"I\s+(?:used|implemented|built|designed|developed|created|wrote|deployed|integrated|trained|led|managed|architected)\s+(.{10,80})", re.IGNORECASE),
    re.compile(r"(?:we|our team)\s+(?:used|implemented|built|designed|deployed|integrated)\s+(.{10,80})", re.IGNORECASE),
]

_ACHIEVEMENT_PATTERNS = re.compile(
    r"(?:reduced|improved|increased|achieved|saved|cut|doubled|tripled|scaled|delivered|launched|shipped)\s+.{5,100}",
    re.IGNORECASE,
)

_CHALLENGE_PATTERNS = re.compile(
    r"(?:challenge|problem|issue|difficulty|struggled|failed|blocked|bottleneck|limitation)\s*.{5,100}",
    re.IGNORECASE,
)


def extract_memory_delta(answer: str, question: str) -> Dict[str, List[str]]:
    """
    Extract structured interview facts from a single answer.
    Returns a delta dict with new items found (may overlap with existing memory;
    deduplication happens in merge_memory).
    """
    text = answer.strip()
    delta: Dict[str, List[str]] = {
        "technologies": [],
        "projects": [],
        "claims": [],
        "achievements": [],
        "challenges": [],
        "follow_up_candidates": [],
    }

    # Technologies
    techs = set(m.group(0) for m in _TECH_PATTERNS.finditer(text))
    delta["technologies"] = sorted(techs)

    # Projects (heuristic — not always accurate but useful)
    seen_projects = set()
    for m in _PROJECT_PATTERNS.finditer(text):
        p = m.group("project").strip().title()
        if 3 < len(p) < 60 and p not in seen_projects:
            seen_projects.add(p)
            delta["projects"].append(p)

    # Claims (I used / I built / we deployed …)
    for pat in _CLAIM_PATTERNS:
        for m in pat.finditer(text):
            claim = m.group(1).strip().rstrip(".,;")
            if 10 < len(claim) < 160:
                delta["claims"].append(claim)

    # Achievements
    for m in _ACHIEVEMENT_PATTERNS.finditer(text):
        ach = m.group(0).strip().rstrip(".,;")
        if len(ach) > 10:
            delta["achievements"].append(ach)

    # Challenges
    for m in _CHALLENGE_PATTERNS.finditer(text):
        ch = m.group(0).strip().rstrip(".,;")
        if len(ch) > 10:
            delta["challenges"].append(ch)

    # Follow-up candidates: technologies mentioned = good follow-up fodder
    delta["follow_up_candidates"] = delta["technologies"][:5]

    # Deduplicate within delta
    for k in delta:
        seen: set = set()
        unique = []
        for item in delta[k]:
            key = item.lower()
            if key not in seen:
                seen.add(key)
                unique.append(item)
        delta[k] = unique

    return delta


def merge_memory(existing: Dict[str, Any], delta: Dict[str, Any]) -> Dict[str, Any]:
    """
    Merge a new delta into the existing session memory, deduplicating by lowercase.
    """
    merged = dict(existing)
    list_keys = ["technologies", "projects", "claims", "achievements", "challenges", "follow_up_candidates"]
    for key in list_keys:
        current = merged.get(key, [])
        new_items = delta.get(key, [])
        existing_lower = {x.lower() for x in current}
        for item in new_items:
            if item.lower() not in existing_lower:
                current.append(item)
                existing_lower.add(item.lower())
        merged[key] = current
    return merged


def empty_memory() -> Dict[str, Any]:
    return {
        "technologies": [],
        "projects": [],
        "claims": [],
        "achievements": [],
        "challenges": [],
        "follow_up_candidates": [],
        "strengths": [],       # populated by /evaluate when score is high
        "weak_topics": [],     # populated by /evaluate when score is low
    }


def build_memory_context_string(memory: Dict[str, Any], max_chars: int = 600) -> str:
    """
    Produce a compact text summary of session memory for injection into LLM prompts.
    """
    parts = []
    if memory.get("technologies"):
        parts.append("Technologies mentioned: " + ", ".join(memory["technologies"][:8]))
    if memory.get("projects"):
        parts.append("Projects discussed: " + ", ".join(memory["projects"][:4]))
    if memory.get("claims"):
        parts.append("Candidate claims: " + "; ".join(memory["claims"][:3]))
    if memory.get("achievements"):
        parts.append("Achievements: " + "; ".join(memory["achievements"][:2]))
    if memory.get("strengths"):
        parts.append("Strong areas: " + ", ".join(memory["strengths"][:4]))
    if memory.get("weak_topics"):
        parts.append("Needs improvement: " + ", ".join(memory["weak_topics"][:4]))

    result = "\n".join(parts)
    return result[:max_chars] if len(result) > max_chars else result
