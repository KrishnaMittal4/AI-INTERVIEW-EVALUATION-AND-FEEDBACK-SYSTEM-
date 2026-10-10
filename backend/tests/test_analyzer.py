"""
Tests for AI Interview Analyzer
Run with: pytest tests/ -v
"""

import pytest
import asyncio
from analyzer import InterviewAnalyzer


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
        result = analyzer._score_confidence(text)
        assert result["score"] >= 70

    def test_weak_language_lowers_score(self, analyzer):
        text = "I think maybe I tried to help, I guess it probably worked sort of."
        result = analyzer._score_confidence(text)
        assert result["score"] <= 40

    def test_mixed_language(self, analyzer):
        text = "I implemented the solution, but I think maybe the results could improve."
        result = analyzer._score_confidence(text)
        assert 30 <= result["score"] <= 80


# ─── Structure Scoring ────────────────────────────────────
class TestStructureScoring:
    def test_star_method_detection(self, analyzer):
        text = """When I was working at Acme, I was responsible for reducing server costs.
        I decided to implement a caching layer and migrated to serverless.
        This resulted in a 40% cost reduction."""
        result = analyzer._score_structure(text, "behavioral")
        assert result["framework"] == "STAR"
        assert result["score"] >= 50

    def test_technical_framework(self, analyzer):
        text = """The problem with REST is coupling. My approach was GraphQL.
        However, the trade-off is increased query complexity."""
        result = analyzer._score_structure(text, "technical")
        assert result["framework"] == "Problem-Solution-Trade-offs"


# ─── Clarity Scoring ─────────────────────────────────────
class TestClarityScoring:
    def test_ideal_sentence_length(self, analyzer):
        text = "I led the backend migration to Kubernetes. The team completed it in three months. We achieved zero downtime throughout the process."
        score = analyzer._score_clarity(text)
        assert score >= 60

    def test_empty_text(self, analyzer):
        score = analyzer._score_clarity("")
        assert score == 50


# ─── Full Local Analysis ──────────────────────────────────
class TestLocalAnalysis:
    def test_full_analysis_returns_all_keys(self, analyzer):
        text = "I led a team of five engineers to build a payment system. We used microservices."
        result = analyzer._local_analysis(text, "technical")
        assert "overall_score" in result
        assert "confidence" in result
        assert "fillers" in result
        assert "structure" in result
        assert "clarity_score" in result

    def test_overall_score_in_range(self, analyzer):
        text = "I successfully implemented a distributed caching solution using Redis."
        result = analyzer._local_analysis(text, "technical")
        assert 0 <= result["overall_score"] <= 100


# ─── Integration (async) ─────────────────────────────────
class TestAnalyzeOrchestration:
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
