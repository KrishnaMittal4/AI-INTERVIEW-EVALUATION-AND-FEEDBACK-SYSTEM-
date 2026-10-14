import pytest

import resume_rephraser_api as rephraser


def test_rephrase_fails_explicitly_when_provider_returns_no_json(monkeypatch):
    monkeypatch.setattr(rephraser, "_call_groq_json", lambda *args, **kwargs: {})

    with pytest.raises(RuntimeError, match="valid rephrased resume"):
        rephraser.rephrase_resume({"summary": "Built an API"})


def test_rephrase_prompt_prohibits_invented_metrics_and_preserves_missing_fields(monkeypatch):
    captured = {}

    def fake_call(prompt, system):
        captured["prompt"] = prompt
        captured["system"] = system
        return {"summary": "Engineered an API"}

    monkeypatch.setattr(rephraser, "_call_groq_json", fake_call)
    parsed = {
        "summary": "Built an API",
        "experience": [{"company": "Example Co", "duration": "2022-2024"}],
    }

    result = rephraser.rephrase_resume(parsed, "Software Engineer")

    assert result["summary"] == "Engineered an API"
    assert result["experience"] == parsed["experience"]
    assert "Never add or estimate metrics" in captured["prompt"]
    assert "Never invent" in captured["system"]
