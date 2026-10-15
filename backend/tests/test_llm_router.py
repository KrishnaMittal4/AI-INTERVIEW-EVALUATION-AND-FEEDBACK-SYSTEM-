import asyncio
import base64

import groq

from llm_router import _transcribe_gemini, transcribe_audio


def test_transcribe_audio_uses_groq_whisper_when_gemini_is_unset(tmp_path, monkeypatch):
    audio_path = tmp_path / "sample.webm"
    audio_path.write_bytes(b"audio")
    calls = []

    class FakeTranscriptions:
        async def create(self, **kwargs):
            calls.append(kwargs)
            return "recognized speech"

    class FakeGroqClient:
        def __init__(self, api_key):
            self.audio = type(
                "Audio", (), {"transcriptions": FakeTranscriptions()}
            )()

    monkeypatch.setattr(groq, "AsyncGroq", FakeGroqClient)
    monkeypatch.setenv("GROQ_API_KEY", "test-key")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.setattr("llm_router.GEMINI_API_KEY", "")

    transcript = asyncio.run(transcribe_audio(str(audio_path)))

    assert transcript == "recognized speech"
    assert calls[0]["model"] == "whisper-large-v3-turbo"
    assert calls[0]["file"] == ("sample.webm", b"audio")


def test_transcribe_audio_prefers_gemini(tmp_path, monkeypatch):
    audio_path = tmp_path / "sample.webm"
    audio_path.write_bytes(b"audio")
    fallback_calls = []
    groq_calls = []

    class FakeTranscriptions:
        async def create(self, **kwargs):
            groq_calls.append(kwargs)
            return "Groq fallback transcript"

    class FakeGroqClient:
        def __init__(self, api_key):
            self.audio = type(
                "Audio", (), {"transcriptions": FakeTranscriptions()}
            )()

    async def fake_gemini(audio_bytes, mime_type):
        fallback_calls.append((audio_bytes, mime_type))
        return "Gemini transcript"

    monkeypatch.setattr(groq, "AsyncGroq", FakeGroqClient)
    monkeypatch.setattr("llm_router._transcribe_gemini", fake_gemini)
    monkeypatch.setenv("GROQ_API_KEY", "test-key")
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")

    transcript = asyncio.run(transcribe_audio(str(audio_path)))

    assert transcript == "Gemini transcript"
    assert fallback_calls == [(b"audio", "audio/webm")]
    assert groq_calls == []


def test_transcribe_audio_falls_back_to_groq(tmp_path, monkeypatch):
    audio_path = tmp_path / "sample.webm"
    audio_path.write_bytes(b"audio")

    class FakeTranscriptions:
        async def create(self, **kwargs):
            return "Groq fallback transcript"

    class FakeGroqClient:
        def __init__(self, api_key):
            self.audio = type(
                "Audio", (), {"transcriptions": FakeTranscriptions()}
            )()

    async def unavailable_gemini(audio_bytes, mime_type):
        raise RuntimeError("Gemini unavailable")

    monkeypatch.setattr(groq, "AsyncGroq", FakeGroqClient)
    monkeypatch.setattr("llm_router._transcribe_gemini", unavailable_gemini)
    monkeypatch.setattr("llm_router.GEMINI_API_KEY", "test-key")
    monkeypatch.setenv("GROQ_API_KEY", "test-key")
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")

    transcript = asyncio.run(transcribe_audio(str(audio_path)))

    assert transcript == "Groq fallback transcript"


def test_gemini_transcription_sends_inline_audio(monkeypatch):
    request_data = {}

    class FakeResponse:
        status_code = 200

        def json(self):
            return {"candidates": [{"content": {"parts": [{"text": "spoken words"}]}}]}

    class FakeAsyncClient:
        def __init__(self, timeout):
            assert timeout == 60.0

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, traceback):
            return False

        async def post(self, url, headers, json):
            request_data.update(url=url, headers=headers, payload=json)
            return FakeResponse()

    monkeypatch.setattr("llm_router.httpx.AsyncClient", FakeAsyncClient)
    monkeypatch.setattr("llm_router.GEMINI_AUDIO_MODELS", ["test-audio-model"])
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")

    transcript = asyncio.run(_transcribe_gemini(b"audio", "audio/webm"))

    assert transcript == "spoken words"
    assert request_data["url"].endswith("/models/test-audio-model:generateContent")
    assert request_data["headers"] == {"x-goog-api-key": "test-key"}
    parts = request_data["payload"]["contents"][0]["parts"]
    assert parts[1] == {"inline_data": {
        "mime_type": "audio/webm",
        "data": base64.b64encode(b"audio").decode("ascii"),
    }}
