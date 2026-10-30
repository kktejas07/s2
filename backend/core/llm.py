"""A language model client, or an honest refusal.

`modules/ai` composed prompt strings and returned them without calling
anything, which meant a screen labelled "AI generated report" displayed a
prompt. That is worse than having no feature: it tells an inspector a draft
exists when none does.

This module calls Azure OpenAI when it is configured and says so plainly when
it is not. It never fabricates a response, and it never returns a prompt in
place of a completion.

Design notes:

* **Configuration is checked, not assumed.** `is_configured()` is the single
  place that decides, so every caller reports availability the same way.
* **Failures are returned, not raised.** A model being slow or rate-limited
  should degrade a convenience feature, not fail the request an inspector was
  actually making. Callers get a result object and decide.
* **Inspection content is not sent anywhere by default.** Nothing calls this
  unless a key is set, so a deployment with no key sends no client data to a
  third party. Worth stating because inspection reports contain commercially
  sensitive material.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Optional

import httpx

from core.config import settings

logger = logging.getLogger(__name__)

DEFAULT_TIMEOUT_SECONDS = 45.0
DEFAULT_API_VERSION = "2024-06-01"


@dataclass
class LLMResult:
    """What came back, or why nothing did."""

    ok: bool
    text: Optional[str] = None
    status: str = "ok"          # ok | not_configured | error
    detail: Optional[str] = None
    model: Optional[str] = None
    usage: Optional[dict] = None

    def as_dict(self) -> dict[str, Any]:
        return {
            "ok": self.ok, "status": self.status, "text": self.text,
            "detail": self.detail, "model": self.model, "usage": self.usage,
        }


def is_configured() -> bool:
    """Whether a model can actually be called."""
    return bool(settings.azure_openai_endpoint and settings.azure_openai_api_key)


def not_configured(what: str) -> LLMResult:
    return LLMResult(
        ok=False,
        status="not_configured",
        detail=(
            f"{what} needs a language model. Set AZURE_OPENAI_ENDPOINT and "
            f"AZURE_OPENAI_API_KEY to enable it. Nothing is generated until "
            f"then - a fabricated result would be worse than none."
        ),
    )


async def complete(
    system: str,
    user: str,
    *,
    temperature: float = 0.2,
    max_tokens: int = 1200,
    timeout: float = DEFAULT_TIMEOUT_SECONDS,
) -> LLMResult:
    """One completion.

    Temperature defaults low: this is used to summarise findings that were
    recorded by an inspector, where invention is the failure mode.
    """
    if not is_configured():
        return not_configured("This feature")

    endpoint = str(settings.azure_openai_endpoint).rstrip("/")
    deployment = settings.azure_openai_deployment
    url = (
        f"{endpoint}/openai/deployments/{deployment}/chat/completions"
        f"?api-version={DEFAULT_API_VERSION}"
    )

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                url,
                headers={
                    "api-key": str(settings.azure_openai_api_key),
                    "Content-Type": "application/json",
                },
                json={
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
            )
    except Exception as exc:  # noqa: BLE001
        # Returned rather than raised: a slow model should degrade a
        # convenience feature, not fail the inspector's actual request.
        logger.warning("Language model call failed: %s", exc)
        return LLMResult(ok=False, status="error", detail=f"Model unreachable: {exc}")

    if response.status_code >= 400:
        logger.warning("Language model returned %s: %s", response.status_code, response.text[:400])
        return LLMResult(
            ok=False, status="error",
            detail=f"Model returned {response.status_code}.",
        )

    try:
        payload = response.json()
        text = payload["choices"][0]["message"]["content"]
    except Exception as exc:  # noqa: BLE001
        return LLMResult(ok=False, status="error", detail=f"Unreadable model response: {exc}")

    return LLMResult(
        ok=True, text=text, model=payload.get("model") or deployment,
        usage=payload.get("usage"),
    )
