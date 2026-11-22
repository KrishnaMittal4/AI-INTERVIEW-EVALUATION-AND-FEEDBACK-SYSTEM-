import pytest
from interview_memory import (
    extract_memory_delta,
    merge_memory,
    empty_memory,
    build_memory_context_string,
)


def test_extract_memory_delta():
    answer = (
        "In our Smart Courtroom project, I used Docker and FastAPI for the backend services. "
        "I implemented hybrid retrieval with FAISS and BM25, and scaled the API to handle 10k users. "
        "A major challenge was cache invalidation in Redis under high concurrency."
    )
    delta = extract_memory_delta(answer, "Tell me about your project.")
    
    # Technologies detected
    techs = [t.lower() for t in delta["technologies"]]
    assert "docker" in techs
    assert "fastapi" in techs
    assert "faiss" in techs
    assert "redis" in techs

    # Claims or projects detected
    assert len(delta["claims"]) > 0 or len(delta["projects"]) > 0
    assert len(delta["follow_up_candidates"]) > 0


def test_merge_memory():
    base = empty_memory()
    delta1 = {
        "technologies": ["Docker", "FastAPI"],
        "projects": ["Smart Courtroom"],
        "claims": ["I deployed with Docker"],
        "achievements": [],
        "challenges": [],
        "follow_up_candidates": ["Docker"],
    }
    m1 = merge_memory(base, delta1)
    assert len(m1["technologies"]) == 2
    assert "Docker" in m1["technologies"]

    # Deduplication on merge
    delta2 = {
        "technologies": ["docker", "PostgreSQL"],
        "projects": [],
        "claims": [],
        "achievements": ["Scaled to 10k users"],
        "challenges": [],
        "follow_up_candidates": [],
    }
    m2 = merge_memory(m1, delta2)
    assert len(m2["technologies"]) == 3
    assert len(m2["achievements"]) == 1


def test_build_memory_context_string():
    memory = {
        "technologies": ["React", "FastAPI"],
        "projects": ["AlphaPortal"],
        "claims": ["built authentication"],
        "achievements": ["reduced latency by 40%"],
        "strengths": ["Architecture"],
        "weak_topics": ["SQL"],
    }
    ctx = build_memory_context_string(memory)
    assert "React" in ctx
    assert "AlphaPortal" in ctx
    assert "Architecture" in ctx
