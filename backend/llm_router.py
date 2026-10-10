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
from typing import Dict, List, Optional, Any
import httpx
from dotenv import load_dotenv

# Ensure env vars are loaded
load_dotenv()

logger = logging.getLogger("llm_router")

# ── Configured API Keys & Models ─────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODELS = [
    os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b"),
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
]

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODELS = [
    os.getenv("GEMINI_MODEL", "gemini-3-flash-preview"),
    "gemini-flash-lite-latest",
    "gemini-3.1-flash-lite-preview",
]

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODELS = [
    os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-super-120b-a12b:free"),
    "liquid/lfm-2.5-2.6b:free",
]


# ── Provider 1: Groq ─────────────────────────────────────────────────────────
async def _call_groq(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 600,
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
            resp = await client.chat.completions.create(
                model=m,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return resp.choices[0].message.content.strip()
        except Exception as e:
            err_msg = str(e).lower()
            last_err = e
            # If rate limited, overloaded, or model not found, try next model
            if any(k in err_msg for k in ["429", "rate limit", "overloaded", "model_not_found", "404", "503"]):
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
            "maxOutputTokens": max_tokens,
        }
    }
    if system_parts:
        payload["system_instruction"] = {"parts": system_parts}

    candidate_models = [model] if model else GEMINI_MODELS
    last_err = None

    async with httpx.AsyncClient(timeout=25.0) as client:
        for m in candidate_models:
            if not m:
                continue
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={key}"
            try:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            return parts[0]["text"].strip()
                    raise RuntimeError(f"Unexpected Gemini response structure: {data}")
                else:
                    err_text = resp.text[:200]
                    last_err = RuntimeError(f"Gemini API {resp.status_code}: {err_text}")
                    # If 404 (model not found) or 429 (quota), try next model
                    if resp.status_code in (404, 429, 503):
                        logger.warning(f"[llm_router] Gemini model '{m}' returned {resp.status_code}. Trying next Gemini model...")
                        continue
                    raise last_err
            except httpx.TimeoutException as te:
                last_err = te
                logger.warning(f"[llm_router] Gemini model '{m}' timed out. Trying next Gemini model...")
                continue
            except Exception as e:
                last_err = e
                logger.warning(f"[llm_router] Gemini model '{m}' error: {e}. Trying next Gemini model...")
                continue

    raise last_err or RuntimeError("All Gemini models failed")


# ── Provider 3: OpenRouter ───────────────────────────────────────────────────
async def _call_openrouter(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 600,
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
                "max_tokens": max_tokens,
            }
            try:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    return data["choices"][0]["message"]["content"].strip()
                else:
                    last_err = RuntimeError(f"OpenRouter API error {resp.status_code}: {resp.text[:200]}")
                    if resp.status_code in (404, 429, 503):
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
                return await _call_groq(messages, temperature=temperature, max_tokens=max_tokens)

            elif prov == "gemini":
                key = os.getenv("GEMINI_API_KEY") or GEMINI_API_KEY
                if not key:
                    continue
                logger.info("[LLM Router] Cascading to Google Gemini...")
                return await _call_gemini(messages, temperature=temperature, max_tokens=max_tokens)

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
) -> str:
    """Synchronous wrapper around route_llm."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                future = pool.submit(asyncio.run, route_llm(messages, temperature, max_tokens, prefer_provider))
                return future.result()
        else:
            return loop.run_until_complete(route_llm(messages, temperature, max_tokens, prefer_provider))
    except RuntimeError:
        return asyncio.run(route_llm(messages, temperature, max_tokens, prefer_provider))


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
) -> Any:
    """Calls route_llm and parses the output as JSON."""
    raw = await route_llm(messages, temperature=temperature, max_tokens=max_tokens, prefer_provider=prefer_provider)
    cleaned = clean_json_response(raw)
    return json.loads(cleaned)


# ── Drop-in OpenAI / Groq SDK Compatibility Wrappers ─────────────────────────
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
        )
        return _RouterChatCompletionResponse(content)


class AsyncRouterClient:
    """Drop-in async replacement for AsyncGroq or AsyncOpenAI client."""
    def __init__(self, api_key: Optional[str] = None, **kwargs):
        self.chat = type("Chat", (), {"completions": _AsyncChatCompletions()})()


class SyncRouterClient:
    """Drop-in synchronous replacement for Groq or OpenAI client."""
    def __init__(self, api_key: Optional[str] = None, **kwargs):
        self.chat = type("Chat", (), {"completions": _SyncChatCompletions()})()

