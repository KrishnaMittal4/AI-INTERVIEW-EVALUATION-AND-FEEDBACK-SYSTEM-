"""
llm_router.py — Multi-Provider LLM Router with Automatic Failover
===================================================================
Cascade sequence:
  1. Primary: Groq (Ultra-fast inference, sub-second latency)
  2. Secondary: Google Gemini (High limits, 1,500 req/day free, zero downtime)
  3. Tertiary: OpenRouter (Free tier models: Nemotron, Liquid, Gemma)

If any provider hits rate-limits (HTTP 429), model 404, capacity overload (503),
or network timeout, the router seamlessly tries alternative models within the provider,
and then cascades to the next provider with zero crash.
"""

from __future__ import annotations
import os
import json
import logging
import re
import asyncio
import base64
from typing import Dict, List, Optional, Any, cast
import httpx
from dotenv import load_dotenv

# Ensure env vars are loaded
load_dotenv()

logger = logging.getLogger("llm_router")

# ── Configured API Keys & Models ─────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODELS = list(dict.fromkeys([
    os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"),
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
]))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODELS = list(dict.fromkeys([
    os.getenv("GEMINI_MODEL", "gemini-3-flash-preview"),
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
]))

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODELS = [
    os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-super-120b-a12b:free"),
    "liquid/lfm-2.5-2.6b:free",
]

GEMINI_AUDIO_MODELS = [
    os.getenv("GEMINI_AUDIO_MODEL", "gemini-flash-latest"),
    *GEMINI_MODELS,
]


# Reasoning models (gpt-oss, Gemini 3 thinking) spend part of the output budget
# on hidden reasoning; a small max_tokens then yields empty/truncated text.
_MIN_OUTPUT_TOKENS = 1200


def _budget(max_tokens: int) -> int:
    return max(int(max_tokens or 0), 0) + _MIN_OUTPUT_TOKENS


def _is_retryable(err_msg: str) -> bool:
    return any(k in err_msg for k in (
        "429", "rate limit", "overloaded", "model_not_found", "404", "503", "502",
        "500", "timeout", "timed out", "capacity", "413", "decommissioned",
        "no message content", "empty", "connection",
    ))


# ── Provider 1: Groq ─────────────────────────────────────────────────────────
async def _call_groq(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 600,
    json_mode: bool = False,
) -> str:
    from groq import AsyncGroq
    key = os.getenv("GROQ_API_KEY") or GROQ_API_KEY
    if not key:
        raise ValueError("GROQ_API_KEY not set")

    client = AsyncGroq(api_key=key)
    candidate_models = [model] if model else GROQ_MODELS

    last_err = None
    for m in candidate_models:
        if not m:
            continue
        try:
            extra: Dict[str, Any] = {"reasoning_effort": "low"} if "gpt-oss" in m else {}
            if json_mode:
                extra["response_format"] = {"type": "json_object"}
            try:
                resp = await client.chat.completions.create(
                    model=m,
                    messages=cast(Any, messages),
                    temperature=temperature,
                    max_tokens=_budget(max_tokens),
                    **extra,
                )
            except Exception as first_err:
                # Some models reject response_format; retry the same model without it.
                if json_mode and any(k in str(first_err).lower() for k in ("response_format", "json_object", "json mode")):
                    extra.pop("response_format", None)
                    resp = await client.chat.completions.create(
                        model=m,
                        messages=cast(Any, messages),
                        temperature=temperature,
                        max_tokens=_budget(max_tokens),
                        **extra,
                    )
                else:
                    raise
            content = resp.choices[0].message.content
            if content is None or not content.strip():
                raise RuntimeError(f"Groq model '{m}' returned no message content")
            return content.strip()
        except Exception as e:
            err_msg = str(e).lower()
            last_err = e
            # If rate limited, overloaded, or model not found, try next model
            if _is_retryable(err_msg):
                logger.warning(f"[llm_router] Groq model '{m}' failed ({e}). Trying next Groq model...")
                continue
            raise e

    raise last_err or RuntimeError("Groq calls failed")


# ── Provider 2: Google Gemini (AI Studio Native REST) ────────────────────────
async def _call_gemini(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 600,
    json_mode: bool = False,
) -> str:
    key = os.getenv("GEMINI_API_KEY") or GEMINI_API_KEY
    if not key:
        raise ValueError("GEMINI_API_KEY not set")

    # Format messages for Gemini API
    contents = []
    system_parts = []
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role == "system":
            system_parts.append({"text": content})
        elif role == "assistant":
            contents.append({"role": "model", "parts": [{"text": content}]})
        else:
            contents.append({"role": "user", "parts": [{"text": content}]})

    payload: Dict[str, Any] = {
        "contents": contents,
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": _budget(max_tokens),
        }
    }
    if json_mode:
        payload["generationConfig"]["responseMimeType"] = "application/json"
    if system_parts:
        payload["system_instruction"] = {"parts": system_parts}

    candidate_models = [model] if model else GEMINI_MODELS
    last_err = None

    async with httpx.AsyncClient(timeout=25.0) as client:
        for m in candidate_models:
            if not m:
                continue
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent"
            try:
                resp = await client.post(url, json=payload, headers={"x-goog-api-key": key})
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        text = "".join(
                            p.get("text", "") for p in parts
                            if isinstance(p, dict) and not p.get("thought")
                        ).strip()
                        if text:
                            return text
                    raise RuntimeError(
                        "Gemini returned no text (finishReason="
                        f"{(candidates[0].get('finishReason') if candidates else 'no_candidates')})"
                    )
                else:
                    err_text = resp.text[:200]
                    last_err = RuntimeError(f"Gemini API {resp.status_code}: {err_text}")
                    # If 404 (model not found) or 429 (quota), try next model
                    if resp.status_code in (400, 404, 408, 413, 429, 500, 502, 503, 504):
                        logger.warning(f"[llm_router] Gemini model '{m}' returned {resp.status_code}. Trying next Gemini model...")
                        continue
                    raise last_err
            except httpx.TimeoutException as te:
                last_err = te
                logger.warning(f"[llm_router] Gemini model '{m}' timed out. Trying next Gemini model...")
                continue
            except Exception as e:
                last_err = e
                logger.warning(f"[llm_router] Gemini model '{m}' error: {type(e).__name__}. Trying next Gemini model...")
                continue

    raise last_err or RuntimeError("All Gemini models failed")


async def _transcribe_gemini(audio_bytes: bytes, mime_type: str) -> str:
    """Transcribe via the standard generateContent endpoint with inline audio."""
    key = os.getenv("GEMINI_API_KEY") or GEMINI_API_KEY
    if not key:
        raise ValueError("GEMINI_API_KEY not set")

    payload = {
        "contents": [{
            "role": "user",
            "parts": [
                {"text": (
                    "Transcribe the spoken words in this audio accurately. "
                    "Return only the transcript, with no summary or commentary."
                )},
                {"inline_data": {
                    "mime_type": mime_type,
                    "data": base64.b64encode(audio_bytes).decode("ascii"),
                }},
            ],
        }],
        "generationConfig": {"temperature": 0.0, "maxOutputTokens": 4096},
    }
    last_error: Optional[Exception] = None
    async with httpx.AsyncClient(timeout=60.0) as client:
        for model_name in dict.fromkeys(GEMINI_AUDIO_MODELS):
            if not model_name:
                continue
            try:
                response = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent",
                    headers={"x-goog-api-key": key},
                    json=payload,
                )
                if response.status_code != 200:
                    last_error = RuntimeError(
                        f"Gemini transcription API {response.status_code}: {response.text[:200]}")
                    logger.warning("[llm_router] Gemini audio model '%s' failed with %s; trying next",
                                   model_name, response.status_code)
                    continue
                data = response.json()
                parts = (data.get("candidates") or [{}])[0].get("content", {}).get("parts", [])
                transcript = "".join(
                    p.get("text", "") for p in parts if isinstance(p, dict) and not p.get("thought")
                ).strip()
                if transcript:
                    return transcript
                last_error = RuntimeError("Gemini transcription returned no transcript text")
            except (httpx.HTTPError, ValueError) as exc:
                last_error = exc
                logger.warning("[llm_router] Gemini audio model '%s' request failed (%s); trying next",
                               model_name, type(exc).__name__)

    raise last_error or RuntimeError("All Gemini audio models failed")


async def transcribe_audio(audio_path: str) -> str:
    """Transcribe with Gemini first, then fall back to Groq Whisper."""
    groq_key = os.getenv("GROQ_API_KEY") or GROQ_API_KEY
    gemini_key = os.getenv("GEMINI_API_KEY") or GEMINI_API_KEY
    errors = []

    if gemini_key:
        import mimetypes

        extension = os.path.splitext(audio_path)[1].lower()
        mime_type = {
            ".m4a": "audio/mp4",
            ".mp4": "audio/mp4",
            ".mp3": "audio/mpeg",
            ".ogg": "audio/ogg",
            ".wav": "audio/wav",
            ".webm": "audio/webm",
        }.get(extension) or mimetypes.guess_type(audio_path)[0] or "audio/webm"
        try:
            with open(audio_path, "rb") as audio_file:
                return await _transcribe_gemini(audio_file.read(), mime_type)
        except Exception as exc:
            errors.append(exc)
            logger.warning(
                "[llm_router] Gemini transcription failed; trying Groq Whisper fallback: %s",
                exc,
            )

    if groq_key:
        from groq import AsyncGroq

        client = AsyncGroq(api_key=groq_key)
        for model_name in dict.fromkeys([
            os.getenv("GROQ_WHISPER_MODEL", "whisper-large-v3-turbo"),
            "whisper-large-v3",
        ]):
            try:
                with open(audio_path, "rb") as audio_file:
                    result = await client.audio.transcriptions.create(
                        file=(os.path.basename(audio_path), audio_file.read()),
                        model=model_name,
                        response_format="text",
                    )
                transcript = result.strip() if isinstance(result, str) else str(result).strip()
                if transcript:
                    return transcript
                raise RuntimeError(f"Groq Whisper model '{model_name}' returned no transcript")
            except Exception as exc:
                errors.append(exc)
                logger.warning(
                    "[llm_router] Groq Whisper model '%s' failed; trying fallback: %s",
                    model_name,
                    exc,
                )

    if errors:
        raise RuntimeError(
            "All configured cloud transcription providers failed"
        ) from errors[-1]
    raise RuntimeError(
        "No cloud transcription provider is configured. Set GROQ_API_KEY or GEMINI_API_KEY."
    )


# ── Provider 3: OpenRouter ───────────────────────────────────────────────────
async def _call_openrouter(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 600,
    json_mode: bool = False,   # accepted for symmetry; free models often reject response_format
) -> str:
    key = os.getenv("OPENROUTER_API_KEY") or OPENROUTER_API_KEY
    if not key:
        raise ValueError("OPENROUTER_API_KEY not set")

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "AI Interview Analyzer",
    }

    candidate_models = [model] if model else OPENROUTER_MODELS
    last_err = None

    async with httpx.AsyncClient(timeout=30.0) as client:
        for m in candidate_models:
            if not m:
                continue
            payload = {
                "model": m,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": _budget(max_tokens),
            }
            try:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    return data["choices"][0]["message"]["content"].strip()
                else:
                    last_err = RuntimeError(f"OpenRouter API error {resp.status_code}: {resp.text[:200]}")
                    if resp.status_code in (400, 404, 408, 413, 429, 500, 502, 503, 504):
                        logger.warning(f"[llm_router] OpenRouter model '{m}' returned {resp.status_code}. Trying next model...")
                        continue
                    raise last_err
            except httpx.TimeoutException as te:
                last_err = te
                logger.warning(f"[llm_router] OpenRouter model '{m}' timed out. Trying next model...")
                continue
            except Exception as e:
                last_err = e
                continue

    raise last_err or RuntimeError("All OpenRouter models failed")


# ── Central Unified Dispatcher with Automatic Cascading ──────────────────────
async def route_llm(
    messages: List[Dict[str, str]],
    temperature: float = 0.7,
    max_tokens: int = 600,
    prefer_provider: Optional[str] = None,
    json_mode: bool = False,
) -> str:
    """
    Executes chat completion with automatic provider cascading:
      Groq -> Google Gemini -> OpenRouter
    Returns raw response text from the first provider that succeeds.
    """
    providers = ["groq", "gemini", "openrouter"]
    if prefer_provider and prefer_provider in providers:
        providers.remove(prefer_provider)
        providers.insert(0, prefer_provider)

    last_error = None
    for prov in providers:
        try:
            if prov == "groq":
                key = os.getenv("GROQ_API_KEY") or GROQ_API_KEY
                if not key:
                    continue
                return await _call_groq(messages, temperature=temperature, max_tokens=max_tokens, json_mode=json_mode)

            elif prov == "gemini":
                key = os.getenv("GEMINI_API_KEY") or GEMINI_API_KEY
                if not key:
                    continue
                logger.info("[LLM Router] Cascading to Google Gemini...")
                return await _call_gemini(messages, temperature=temperature, max_tokens=max_tokens, json_mode=json_mode)

            elif prov == "openrouter":
                key = os.getenv("OPENROUTER_API_KEY") or OPENROUTER_API_KEY
                if not key:
                    continue
                logger.info("[LLM Router] Cascading to OpenRouter...")
                return await _call_openrouter(messages, temperature=temperature, max_tokens=max_tokens)

        except Exception as e:
            logger.warning(f"[LLM Router] Provider '{prov}' failed: {e}. Trying next provider...")
            last_error = e

    raise RuntimeError(f"All configured LLM providers failed. Last error: {last_error}")


def route_llm_sync(
    messages: List[Dict[str, str]],
    temperature: float = 0.7,
    max_tokens: int = 600,
    prefer_provider: Optional[str] = None,
    json_mode: bool = False,
) -> str:
    """Synchronous wrapper around route_llm (never re-runs a failed call)."""
    try:
        asyncio.get_running_loop()
        in_loop = True
    except RuntimeError:
        in_loop = False

    def _run() -> str:
        return asyncio.run(route_llm(messages, temperature, max_tokens, prefer_provider, json_mode))

    if in_loop:
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            return pool.submit(_run).result()
    return _run()


def clean_json_response(raw: str) -> str:
    """Strips markdown code blocks, backticks, and extra whitespace from LLM JSON responses."""
    text = raw.strip()
    text = re.sub(r'^```(?:json)?\s*', '', text)
    text = re.sub(r'\s*```$', '', text)
    # Extract outermost JSON object or list if there is commentary
    match = re.search(r'(\{[\s\S]*\}|\[[\s\S]*\])', text)
    if match:
        return match.group(0)
    return text


async def route_llm_json(
    messages: List[Dict[str, str]],
    temperature: float = 0.7,
    max_tokens: int = 600,
    prefer_provider: Optional[str] = None,
    retries: int = 1,
) -> Any:
    """Calls route_llm in JSON mode and parses the output; retries once on bad JSON."""
    last: Optional[Exception] = None
    for _ in range(retries + 1):
        raw = await route_llm(messages, temperature=temperature, max_tokens=max_tokens,
                              prefer_provider=prefer_provider, json_mode=True)
        try:
            return json.loads(clean_json_response(raw))
        except json.JSONDecodeError as exc:
            last = exc
            logger.warning("[llm_router] JSON parse failed (%s); retrying", exc)
    raise last or ValueError("route_llm_json failed")


# ── Drop-in OpenAI / Groq SDK Compatibility Wrappers ─────────────────────────
def _wants_json(kwargs: Dict[str, Any]) -> bool:
    rf = kwargs.get("response_format")
    return isinstance(rf, dict) and rf.get("type") in ("json_object", "json_schema")


class _RouterMessage:
    def __init__(self, content: str):
        self.content = content


class _RouterChoice:
    def __init__(self, content: str):
        self.message = _RouterMessage(content)


class _RouterChatCompletionResponse:
    def __init__(self, content: str):
        self.choices = [_RouterChoice(content)]


class _AsyncChatCompletions:
    async def create(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 600,
        **kwargs,
    ) -> _RouterChatCompletionResponse:
        content = await route_llm(
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            json_mode=_wants_json(kwargs),
        )
        return _RouterChatCompletionResponse(content)


class _SyncChatCompletions:
    def create(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 600,
        **kwargs,
    ) -> _RouterChatCompletionResponse:
        content = route_llm_sync(
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            json_mode=_wants_json(kwargs),
        )
        return _RouterChatCompletionResponse(content)


class _AsyncRouterChat:
    def __init__(self) -> None:
        self.completions = _AsyncChatCompletions()


class _SyncRouterChat:
    def __init__(self) -> None:
        self.completions = _SyncChatCompletions()


class AsyncRouterClient:
    """Drop-in async replacement for AsyncGroq or AsyncOpenAI client."""
    def __init__(self, api_key: Optional[str] = None, **kwargs):
        self.chat = _AsyncRouterChat()


class SyncRouterClient:
    """Drop-in synchronous replacement for Groq or OpenAI client."""
    def __init__(self, api_key: Optional[str] = None, **kwargs):
        self.chat = _SyncRouterChat()


async def probe_providers(timeout: float = 20.0) -> Dict[str, Any]:
    """Live health check: one tiny real call per configured provider (never raises)."""
    msgs = [{"role": "user", "content": "Reply with the single word: ok"}]
    out: Dict[str, Any] = {}
    for name, fn, key_env in (("groq", _call_groq, "GROQ_API_KEY"),
                              ("gemini", _call_gemini, "GEMINI_API_KEY"),
                              ("openrouter", _call_openrouter, "OPENROUTER_API_KEY")):
        if not os.getenv(key_env):
            out[name] = {"configured": False}
            continue
        t0 = asyncio.get_running_loop().time()
        try:
            text = await asyncio.wait_for(fn(msgs, temperature=0.0, max_tokens=16), timeout=timeout)
            out[name] = {"configured": True, "ok": bool(text),
                         "latency_ms": round((asyncio.get_running_loop().time() - t0) * 1000)}
        except Exception as exc:
            out[name] = {"configured": True, "ok": False, "error": f"{type(exc).__name__}: {str(exc)[:160]}"}
    return out
