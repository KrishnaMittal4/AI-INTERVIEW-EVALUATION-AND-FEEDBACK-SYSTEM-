import json
from types import SimpleNamespace

import pytest

import main


def test_wpm_is_unavailable_when_answer_duration_is_not_measured():
    assert main._calc_wpm("one two three", 0) is None


def test_wpm_uses_the_measured_duration():
    assert main._calc_wpm("one two three", 60) == 3


def test_typed_answer_duration_is_not_used_as_speaking_pace():
    assert main._speech_duration_for_scoring("typed", 30) == 0
    assert main._speech_duration_for_scoring("browser_stt", 30) == 30


class FakeGroqClient:
    def __init__(self, content):
        self.chat = SimpleNamespace(
            completions=SimpleNamespace(create=self._create)
        )
        self.contents = content if isinstance(content, list) else [content]
        self.request = None
        self.requests = []

    async def _create(self, **kwargs):
        self.request = kwargs
        self.requests.append(kwargs)
        content = self.contents[min(len(self.requests) - 1, len(self.contents) - 1)]
        return SimpleNamespace(
            choices=[
                SimpleNamespace(message=SimpleNamespace(content=content))
            ]
        )


@pytest.mark.asyncio
async def test_generate_question_accepts_a_list_with_a_question_object():
    question = {
        "question": "Describe a difficult situation you handled.",
        "type": "Behavioural",
        "difficulty": "medium",
        "keywords": ["action", "result"],
    }

    result = await main._generate_question(
        FakeGroqClient(json.dumps([question])),
        role="Software Engineer",
        difficulty="medium",
        q_type="Behavioural",
        avoid=[],
    )

    assert result == question


@pytest.mark.asyncio
async def test_generate_question_includes_resume_and_aptitude_instructions():
    question = {
        "question": "A service has 80 requests per second and traffic grows by 25%. Estimate the new rate.",
        "type": "Aptitude",
        "difficulty": "medium",
        "keywords": ["percentage", "reasoning"],
    }
    client = FakeGroqClient(json.dumps(question))

    await main._generate_question(
        client,
        role="Backend Developer",
        difficulty="medium",
        q_type="Aptitude",
        avoid=[],
        resume_context="Built a Python API and PostgreSQL service.",
    )

    prompt = client.request["messages"][1]["content"]
    assert "Python API and PostgreSQL" in prompt
    assert "aptitude problem" in prompt


def test_duplicate_question_detection_normalizes_text_and_catches_near_repeats():
    previous = "A service handles 80 requests per second. What is the new rate?"

    assert main._is_duplicate_question(
        "A service handles 80 requests per second! What is the new rate?",
        [previous],
    )
    assert not main._is_duplicate_question(
        "How does a database index improve query performance?",
        [previous],
    )


@pytest.mark.asyncio
async def test_next_question_does_not_return_repeated_fallback(monkeypatch):
    session_id = "repeat-fallback-test"
    repeated_question = (
        "A project has 120 users and usage grows by 25%. How many users should "
        "you plan for next, and how did you calculate it?"
    )
    main.SESSIONS[session_id] = {
        "role": "Software Engineer",
        "difficulty": "medium",
        "company_pack": "no_pack",
        "questions_asked": [repeated_question],
        "current_question": {"question": repeated_question, "type": "Aptitude"},
        "q_index": 0,
        "rl_hint": {"type": "Aptitude", "difficulty": "medium", "follow_up": False},
    }
    monkeypatch.setattr(main.analyzer, "groq_client", None)
    try:
        with pytest.raises(main.HTTPException) as exc:
            await main.next_question(
                main.NextQuestionRequest(session_id=session_id, q_index=1)
            )
        assert exc.value.status_code == 503
        assert "unique question" in exc.value.detail
        assert main.SESSIONS[session_id]["questions_asked"] == [repeated_question]
    finally:
        main.SESSIONS.pop(session_id, None)


@pytest.mark.asyncio
async def test_next_question_retries_a_repeated_candidate_until_it_is_unique(monkeypatch):
    session_id = "repeat-candidate-test"
    repeated_question = "Explain the architectural design decision you made."
    unique_question = "How would you diagnose a sudden increase in API latency?"
    main.SESSIONS[session_id] = {
        "role": "Software Engineer",
        "difficulty": "medium",
        "company_pack": "no_pack",
        "questions_asked": [repeated_question],
        "current_question": {"question": repeated_question, "type": "Technical"},
        "q_index": 0,
        "rl_hint": {"type": "Technical", "difficulty": "medium", "follow_up": False},
    }
    client = FakeGroqClient([
        json.dumps({"question": repeated_question, "type": "Technical"}),
        json.dumps({"question": unique_question, "type": "Technical"}),
    ])
    monkeypatch.setattr(main.analyzer, "groq_client", client)
    try:
        response = await main.next_question(
            main.NextQuestionRequest(session_id=session_id, q_index=1)
        )
        body = json.loads(response.body)

        assert body["question"]["question"] == unique_question
        assert len(client.requests) == 2
        assert repeated_question in client.requests[0]["messages"][1]["content"]
        assert unique_question in main.SESSIONS[session_id]["questions_asked"]
    finally:
        main.SESSIONS.pop(session_id, None)


@pytest.mark.asyncio
async def test_standard_session_still_allows_skipping_resume(monkeypatch):
    question = {
        "question": "Explain a design decision you made.",
        "type": "Technical",
        "difficulty": "medium",
        "keywords": ["design"],
    }
    monkeypatch.setattr(main, "_make_sequencer", lambda _role: SimpleNamespace(
        get_first_action=lambda **_kwargs: SimpleNamespace(
            difficulty="medium",
            q_type="technical",
            label=lambda: "technical/medium",
        )
    ))
    monkeypatch.setattr(main.analyzer, "groq_client", FakeGroqClient(json.dumps(question)))

    response = await main.session_start(
        role="Software Engineer",
        difficulty="medium",
        num_questions=3,
        resume_text="",
        resume_parsed_json="",
        company_pack="no_pack",
    )

    body = json.loads(response.body)
    session_id = body["session_id"]
    try:
        assert body["question"]["question"] == question["question"]
        assert main.SESSIONS[session_id]["resume_parsed"] == {}
        assert "practice_mode" not in main.SESSIONS[session_id]
    finally:
        main.SESSIONS.pop(session_id, None)


@pytest.mark.asyncio
async def test_generate_question_rejects_list_without_question_objects():
    with pytest.raises(ValueError, match="question object"):
        await main._generate_question(
            FakeGroqClient(json.dumps(["not a question object"])),
            role="Software Engineer",
            difficulty="medium",
            q_type="Behavioural",
            avoid=[],
        )
