"""The language model client.

modules/ai used to compose a prompt string and return it under the key
"prompt" with status "draft", so a screen labelled AI-generated report showed a
prompt. This client either calls a model or says it cannot - it never returns a
prompt in place of a completion, and never fabricates one.
"""
import sys
from pathlib import Path

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core import llm  # noqa: E402
from core.config import settings  # noqa: E402


@pytest.fixture
def configured(monkeypatch):
    monkeypatch.setattr(settings, "azure_openai_endpoint", "https://example.invalid")
    monkeypatch.setattr(settings, "azure_openai_api_key", "test-key")
    monkeypatch.setattr(settings, "azure_openai_deployment", "gpt-4o")
    yield


@pytest.fixture
def unconfigured(monkeypatch):
    monkeypatch.setattr(settings, "azure_openai_endpoint", None)
    monkeypatch.setattr(settings, "azure_openai_api_key", None)
    yield


def _mock_transport(monkeypatch, handler):
    """Swap httpx's transport so no network is touched."""
    class FakeClient:
        def __init__(self, *a, **k):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *a):
            return False

        async def post(self, url, headers=None, json=None):
            return handler(url, headers or {}, json or {})

    monkeypatch.setattr(llm.httpx, "AsyncClient", FakeClient)


def _response(status: int, payload: dict | str):
    request = httpx.Request("POST", "https://example.invalid")
    if isinstance(payload, str):
        return httpx.Response(status, text=payload, request=request)
    return httpx.Response(status, json=payload, request=request)


def test_configuration_is_checked_in_one_place(unconfigured):
    assert llm.is_configured() is False


def test_configured_when_both_endpoint_and_key_are_set(configured):
    assert llm.is_configured() is True


@pytest.mark.asyncio
async def test_without_configuration_nothing_is_called_or_invented(unconfigured, monkeypatch):
    called = False

    def handler(*_a, **_k):
        nonlocal called
        called = True
        return _response(200, {})

    _mock_transport(monkeypatch, handler)
    result = await llm.complete("sys", "user")

    assert result.ok is False
    assert result.status == "not_configured"
    assert result.text is None
    assert called is False, "no request should be made without configuration"


@pytest.mark.asyncio
async def test_a_successful_completion_returns_its_text(configured, monkeypatch):
    _mock_transport(monkeypatch, lambda *_a, **_k: _response(200, {
        "model": "gpt-4o",
        "choices": [{"message": {"content": "Drafted narrative."}}],
        "usage": {"total_tokens": 42},
    }))
    result = await llm.complete("sys", "user")
    assert result.ok is True
    assert result.text == "Drafted narrative."
    assert result.usage["total_tokens"] == 42


@pytest.mark.asyncio
async def test_inspection_content_is_sent_only_to_the_configured_deployment(
    configured, monkeypatch
):
    """Inspection reports carry commercially sensitive material, so where it
    goes is worth asserting."""
    seen = {}

    def handler(url, headers, json):
        seen["url"] = url
        seen["key"] = headers.get("api-key")
        seen["messages"] = json["messages"]
        return _response(200, {"choices": [{"message": {"content": "ok"}}]})

    _mock_transport(monkeypatch, handler)
    await llm.complete("the system prompt", "the inspection facts")

    assert seen["url"].startswith("https://example.invalid/openai/deployments/gpt-4o/")
    assert seen["key"] == "test-key"
    assert seen["messages"][1]["content"] == "the inspection facts"


@pytest.mark.asyncio
async def test_a_model_error_degrades_rather_than_raises(configured, monkeypatch):
    """A slow or rate-limited model should not fail the request an inspector
    was actually making."""
    _mock_transport(monkeypatch, lambda *_a, **_k: _response(429, "rate limited"))
    result = await llm.complete("sys", "user")
    assert result.ok is False
    assert result.status == "error"
    assert result.text is None


@pytest.mark.asyncio
async def test_an_unreachable_model_degrades_rather_than_raises(configured, monkeypatch):
    def handler(*_a, **_k):
        raise httpx.ConnectError("no route to host")

    _mock_transport(monkeypatch, handler)
    result = await llm.complete("sys", "user")
    assert result.ok is False
    assert result.status == "error"
    assert "unreachable" in result.detail.lower()


@pytest.mark.asyncio
async def test_an_unreadable_response_is_not_passed_off_as_a_draft(configured, monkeypatch):
    _mock_transport(monkeypatch, lambda *_a, **_k: _response(200, {"unexpected": "shape"}))
    result = await llm.complete("sys", "user")
    assert result.ok is False
    assert result.text is None


@pytest.mark.asyncio
async def test_temperature_defaults_low(configured, monkeypatch):
    """This summarises findings an inspector recorded; invention is the
    failure mode."""
    seen = {}

    def handler(url, headers, json):
        seen.update(json)
        return _response(200, {"choices": [{"message": {"content": "ok"}}]})

    _mock_transport(monkeypatch, handler)
    await llm.complete("sys", "user")
    assert seen["temperature"] <= 0.3
