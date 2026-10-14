"""
Tests for AI Interview Analyzer
Run with: pytest tests/ -v
"""

import pytest
import asyncio
from types import SimpleNamespace

import analyzer as analyzer_module
from analyzer import InterviewAnalyzer, _compute_star_score_v3


@pytest.fixture
def analyzer():
    return InterviewAnalyzer()


# ─── Filler Word Detection ────────────────────────────────
class TestFillerDetection:
    def test_detects_basic_fillers(self, analyzer):
        text = "Um, so I basically, like, worked on the project, you know?"
        result = analyzer._detect_fillers(text)
        assert result["total_count"] >= 3
        assert result["filler_rate_percent"] > 0

    def test_no_fillers_in_clean_text(self, analyzer):
        text = "I designed a microservices architecture that reduced latency by 40%."
        result = analyzer._detect_fillers(text)
        assert result["total_count"] == 0

    def test_filler_rate_calculation(self, analyzer):
        text = "um um um um"  # 4 fillers in 4 words = 100%
        result = analyzer._detect_fillers(text)
        assert result["filler_rate_percent"] == 100.0

    def test_categorizes_fillers(self, analyzer):
        text = "uh like basically you know um"
        result = analyzer._detect_fillers(text)
        assert "hesitation" in result["by_category"] or "vague" in result["by_category"]


# ─── Confidence Scoring ───────────────────────────────────
class TestConfidenceScoring:
    def test_strong_language_boosts_score(self, analyzer):
        text = "I successfully led a team and delivered a 30% improvement in performance."
        result = analyzer._score_language_confidence(text)
        assert result["score"] >= 70

    def test_weak_language_lowers_score(self, analyzer):
        text = "I think maybe I tried to help, I guess it probably worked sort of."
        result = analyzer._score_language_confidence(text)
        assert result["score"] <= 40

    def test_mixed_language(self, analyzer):
        text = "I implemented the solution, but I think maybe the results could improve."
        result = analyzer._score_language_confidence(text)
        assert 30 <= result["score"] <= 80


# ─── Structure Scoring ────────────────────────────────────
class TestStructureScoring:
    def test_star_method_detection(self, analyzer):
        text = """When I was working at Acme, I was responsible for reducing server costs.
        I decided to implement a caching layer and migrated to serverless.
        This resulted in a 40% cost reduction."""
        score, components, _, _ = _compute_star_score_v3(text.lower())
        assert score >= 3.5
        assert components["Situation"]
        assert components["Task"]
        assert components["Action"]

    def test_short_answer_does_not_receive_star_structure_credit(self, analyzer):
        text = """The problem with REST is coupling. My approach was GraphQL.
        However, the trade-off is increased query complexity."""
        score, components, _, _ = _compute_star_score_v3(text.lower())
        assert score == 0
        assert not any(components.values())


# ─── Clarity Scoring ─────────────────────────────────────
class TestClarityScoring:
    def test_ideal_sentence_length(self, analyzer):
        text = (
            "I led the backend migration to Kubernetes, coordinating five engineers "
            "and defining a phased rollout plan. The team completed the migration "
            "in three months while maintaining service availability for every customer. "
            "We achieved zero downtime throughout the process and reduced deployment "
            "time by forty percent."
        )
        score = analyzer._score_clarity(text)
        assert score >= 60

    def test_empty_text(self, analyzer):
        score = analyzer._score_clarity("")
        assert score == 50


# ─── Full Local Analysis ──────────────────────────────────
class TestLocalNlp:
    def test_local_nlp_returns_expected_metrics(self, analyzer):
        text = "I led a team of five engineers to build a payment system. We used microservices."
        result = analyzer._run_local_nlp(text, "technical", [], "medium", 0.0)
        assert {"filler_count", "fluency_sc", "depth_sc", "star_sc", "ocean"} <= result.keys()

    def test_local_score_dimensions_stay_in_range(self, analyzer):
        text = "I successfully implemented a distributed caching solution using Redis."
        result = analyzer._run_local_nlp(text, "technical", [], "medium", 0.0)
        assert 1 <= result["fluency_sc"] <= 5
        assert 1 <= result["depth_sc"] <= 5
        assert 1 <= result["depth_flu"] <= 5
        assert -3 <= result["sentiment"] <= 3


# ─── Integration (async) ─────────────────────────────────
class TestAnalyzeOrchestration:
    @pytest.mark.asyncio
    async def test_relevance_without_reference_answer_uses_question_only(
        self, analyzer, monkeypatch
    ):
        prompts = []

        class FakeCompletions:
            async def create(self, **kwargs):
                prompts.append(kwargs["messages"][0]["content"])
                return SimpleNamespace(
                    choices=[
                        SimpleNamespace(
                            message=SimpleNamespace(content='{"relevance": 0.85}')
                        )
                    ]
                )

        fake_client = SimpleNamespace(
            chat=SimpleNamespace(completions=FakeCompletions())
        )
        monkeypatch.setattr(analyzer, "groq_client", fake_client)

        def unexpected_sas_call(*args, **kwargs):
            raise AssertionError("SAS must not compare an answer without a reference")

        monkeypatch.setattr(analyzer_module.sas_scorer, "score", unexpected_sas_call)

        score, source = await analyzer._groq_relevance(
            "I handled the production incident by coordinating the response.",
            "",
            "Tell me about a difficult situation.",
            "behavioural",
        )

        assert score == 0.85
        assert source == "api_groq_question_only"
        assert "Tell me about a difficult situation." in prompts[0]
        assert "[Not provided; evaluate against the question.]" in prompts[0]

    @pytest.mark.asyncio
    async def test_analyze_returns_structure(self, analyzer):
        """Test full analyze() call (uses fallback without API key)."""
        result = await analyzer.analyze(
            transcript="I think I kind of implemented a solution that basically worked.",
            question="Tell me about a technical challenge.",
            question_type="technical",
        )
        assert result["success"] is True
        assert "scores" in result
        assert "grade" in result
        assert "hr_feedback" in result
        assert "nlp" in result
        assert "ai_evaluation" in result

    @pytest.mark.asyncio
    async def test_filler_heavy_answer_lower_score(self, analyzer):
        result = await analyzer.analyze(
            transcript="Um like so basically I uh kind of you know tried to um implement something.",
            question="What did you build?",
            question_type="behavioral",
        )
        assert result["scores"]["confidence"] < 70

    @pytest.mark.asyncio
    async def test_numeric_score_controls_grade_not_ai_grade(self, analyzer, monkeypatch):
        answer = (
            "In my previous role, our team faced a serious production outage. "
            "My task was to lead the incident response. I investigated the database, "
            "built a caching solution, coordinated with the team, and reduced latency "
            "by 40 percent. As a result, the service recovered within two hours and "
            "customer complaints dropped. I learned to communicate clearly and measure "
            "outcomes. "
        ) * 4

        async def high_relevance(*args, **kwargs):
            return 1.0, "test"

        async def failing_grade(*args, **kwargs):
            return {
                "technical_score": 0,
                "relevance_score": 0,
                "grade": "F",
                "grade_reasoning": "The answer does not address the question.",
            }

        monkeypatch.setattr(analyzer, "_groq_relevance", high_relevance)
        monkeypatch.setattr(analyzer, "_groq_hr_feedback", failing_grade)

        result = await analyzer.analyze(
            transcript=answer,
            question="Tell me about a difficult situation.",
            question_type="behavioral",
            keywords=["team", "task", "investigated", "built", "reduced latency", "result", "customer"],
            duration_s=160,
        )

        assert result["grade"] == analyzer_module._grade_for_score(result["scores"]["overall"])
        assert result["scores"]["knowledge_1_5"] > 1.5
        assert result["hr_feedback"]["recommendation"] == (
            analyzer_module._recommendation_for_score(result["scores"]["overall"])
        )
        assert result["scores"]["star_quality_1_5"] == result["nlp"]["star_quality_1_5"]
        assert 0 <= result["scores"]["grammar_0_5"] <= 5
        assert result["scores"]["overall"] == result["scores"]["session_final"]
