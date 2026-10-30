"""Reading an ITP out of the client's document, and the gate that stops a
machine's reading becoming the agreement.

An ITP is contractual. The acceptance criteria on a hold point is what a
contractor is held to and what IQE's inspector signs against, so extraction is
allowed to save typing and nothing else: it proposes a draft, a person
confirms it, and only then can the plan be approved. These tests pin that
boundary and the two ways the model is distrusted — it may not invent a hold
point, and anything malformed is dropped with a reason rather than filled in.
"""
import sys
from pathlib import Path

import pytest
import pytest_asyncio
from beanie import init_beanie
from fastapi import HTTPException
from mongomock_motor import AsyncMongoMockClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core import llm  # noqa: E402
from core.audit import AuditEntry  # noqa: E402
from core.sequences import Sequence  # noqa: E402
from modules.itp import extraction  # noqa: E402
from modules.itp.models import (  # noqa: E402
    InspectionCall,
    InspectionTestPlan,
    ITPStatus,
)
from modules.itp.service import ITPService  # noqa: E402

SITE = "SITE-01"
USER = "EMP-COORD"


def _patch_mongomock():
    from mongomock_motor import AsyncMongoMockDatabase

    original = AsyncMongoMockDatabase.list_collection_names

    async def patched(self, *args, **kwargs):
        kwargs.pop("authorizedCollections", None)
        kwargs.pop("nameOnly", None)
        return await original(self, *args, **kwargs)

    AsyncMongoMockDatabase.list_collection_names = patched


@pytest_asyncio.fixture
async def db():
    _patch_mongomock()
    client = AsyncMongoMockClient()
    await init_beanie(
        database=client["itp_extract_test"],
        document_models=[InspectionTestPlan, InspectionCall, AuditEntry, Sequence],
    )
    yield client


def _reply(text: str):
    """Stand in for the model. Returns what complete() would have returned."""
    async def fake(system, user, **kwargs):
        return llm.LLMResult(ok=True, text=text, model="test")
    return fake


# --------------------------------------------------------- unconfigured

@pytest.mark.asyncio
async def test_no_model_configured_refuses_rather_than_inventing(monkeypatch):
    """For a contractual document an invented plan is the worst output
    available, so the honest refusal matters more here than elsewhere."""
    monkeypatch.setattr(llm, "is_configured", lambda: False)
    out = await extraction.extract("4.1 Pour slab H ...")
    assert out["ok"] is False
    assert out["status"] == "not_configured"
    assert out["points"] == []
    assert "AZURE_OPENAI_ENDPOINT" in out["note"]


@pytest.mark.asyncio
async def test_no_document_text_is_its_own_answer(monkeypatch):
    monkeypatch.setattr(llm, "is_configured", lambda: True)
    out = await extraction.extract("   ")
    assert out["status"] == "no_input"
    assert out["points"] == []


@pytest.mark.asyncio
async def test_a_model_failure_is_reported_not_swallowed(monkeypatch):
    monkeypatch.setattr(llm, "is_configured", lambda: True)

    async def fail(system, user, **kwargs):
        return llm.LLMResult(ok=False, status="error", detail="Gateway timeout.")

    monkeypatch.setattr(llm, "complete", fail)
    out = await extraction.extract("4.1 Pour slab")
    assert out["ok"] is False
    assert out["status"] == "error"
    assert out["note"] == "Gateway timeout."


# ------------------------------------------------------------- parsing

@pytest.mark.asyncio
async def test_a_clean_table_comes_back_as_a_draft(monkeypatch):
    monkeypatch.setattr(llm, "is_configured", lambda: True)
    monkeypatch.setattr(llm, "complete", _reply("""[
      {"point_id": "4.3.2", "activity": "Concrete pour, Block B slab",
       "discipline": "Civil", "reference_document": "SHMIC/STR/104",
       "reference_revision": "Rev C",
       "acceptance_criteria": "Cover 40mm +/- 5mm.",
       "intervention": "H", "client_intervention": "H", "uncertain": []},
      {"point_id": "4.3.3", "activity": "Cube sampling", "discipline": "Civil",
       "acceptance_criteria": "Six cubes per 50m3.",
       "intervention": "W", "uncertain": []}
    ]"""))
    out = await extraction.extract("...the client's ITP...", source="SHMIC/ITP/07.pdf")

    assert out["status"] == "draft"
    assert out["summary"] == {"read": 2, "dropped": 0, "flagged": 0, "hold_points": 1}
    assert out["source"] == "SHMIC/ITP/07.pdf"
    hold = out["points"][0]
    assert hold["intervention"] == "H"
    assert hold["reference_revision"] == "Rev C"
    assert hold["notice_days"] == 5          # hold-point default applied
    # The draft does not claim to be right.
    assert "nothing is saved until someone confirms it" in out["note"]


@pytest.mark.asyncio
async def test_a_fenced_reply_is_still_read(monkeypatch):
    """Models fence JSON regardless of instructions."""
    monkeypatch.setattr(llm, "is_configured", lambda: True)
    monkeypatch.setattr(llm, "complete", _reply(
        '```json\n[{"point_id": "1", "activity": "Weld visual", '
        '"intervention": "W"}]\n```'
    ))
    out = await extraction.extract("x")
    assert out["summary"]["read"] == 1


@pytest.mark.asyncio
async def test_an_unreadable_intervention_never_becomes_a_hold_point(monkeypatch):
    """A guessed hold point stops a contractor's work for no reason, so the
    fallback is a witness point and the field is flagged."""
    monkeypatch.setattr(llm, "is_configured", lambda: True)
    monkeypatch.setattr(llm, "complete", _reply(
        '[{"point_id": "7.2", "activity": "Hydrotest", "intervention": "?"}]'
    ))
    out = await extraction.extract("x")
    point = out["points"][0]
    assert point["intervention"] == "W"
    assert "intervention" in point["uncertain"]
    assert out["summary"]["hold_points"] == 0
    assert out["summary"]["flagged"] == 1


@pytest.mark.asyncio
async def test_long_form_intervention_words_are_understood(monkeypatch):
    monkeypatch.setattr(llm, "is_configured", lambda: True)
    monkeypatch.setattr(llm, "complete", _reply(
        '[{"point_id": "1", "activity": "Pour", "intervention": "Hold Point", '
        ' "acceptance_criteria": "As drawing."}]'
    ))
    out = await extraction.extract("x")
    assert out["points"][0]["intervention"] == "H"
    assert out["points"][0]["uncertain"] == []


@pytest.mark.asyncio
async def test_a_hold_point_without_criteria_is_flagged_where_it_can_be_seen(
    monkeypatch,
):
    """Validation would refuse it on save; flagging it in the draft is how the
    reviewer finds out why before that happens."""
    monkeypatch.setattr(llm, "is_configured", lambda: True)
    monkeypatch.setattr(llm, "complete", _reply(
        '[{"point_id": "4.1", "activity": "Pour", "intervention": "H", '
        ' "acceptance_criteria": null}]'
    ))
    out = await extraction.extract("x")
    assert "acceptance_criteria" in out["points"][0]["uncertain"]


@pytest.mark.asyncio
async def test_malformed_rows_are_dropped_with_a_reason(monkeypatch):
    """A point with no reference cannot have a call raised against it, so
    filling one in would put dead weight in a contractual document."""
    monkeypatch.setattr(llm, "is_configured", lambda: True)
    monkeypatch.setattr(llm, "complete", _reply("""[
      {"point_id": "", "activity": "Something"},
      {"point_id": "4.2", "activity": ""},
      "a heading row",
      {"point_id": "4.3", "activity": "Weld visual", "intervention": "W"}
    ]"""))
    out = await extraction.extract("x")
    assert out["summary"] == {"read": 1, "dropped": 3, "flagged": 0, "hold_points": 0}
    assert "no point reference" in out["rejected"][0]
    assert "no activity" in out["rejected"][1]
    assert "not an object" in out["rejected"][2]


@pytest.mark.asyncio
async def test_a_reply_that_is_not_json_yields_nothing(monkeypatch):
    monkeypatch.setattr(llm, "is_configured", lambda: True)
    monkeypatch.setattr(llm, "complete", _reply("I found the following points:"))
    out = await extraction.extract("x")
    assert out["points"] == []
    assert "not JSON" in out["rejected"][0]


@pytest.mark.asyncio
async def test_nothing_flagged_is_not_claimed_to_mean_nothing_wrong(monkeypatch):
    monkeypatch.setattr(llm, "is_configured", lambda: True)
    monkeypatch.setattr(llm, "complete", _reply(
        '[{"point_id": "1", "activity": "Weld visual", "intervention": "W"}]'
    ))
    out = await extraction.extract("x")
    assert "not the same as nothing being wrong" in out["note"]


# ------------------------------------------------------- the confirmation gate

@pytest.mark.asyncio
async def test_an_extracted_plan_cannot_be_approved_until_someone_confirms_it(db):
    """The gate the whole feature rests on. Approving a machine's reading
    unread would make that reading the contract."""
    plan = await ITPService.create(
        {"job_id": "JOB-2026-0003", "title": "Block B structure",
         "extracted_from_document": "SHMIC/ITP/07.pdf",
         "points": [{"point_id": "4.3.2", "activity": "Pour", "intervention": "H",
                     "acceptance_criteria": "Cover 40mm."}]},
        SITE, USER,
    )
    with pytest.raises(HTTPException) as e:
        await ITPService.approve(plan["itp_id"], SITE, USER)
    assert e.value.status_code == 409
    assert "read out of" in e.value.detail
    assert "SHMIC/ITP/07.pdf" in e.value.detail

    await ITPService.confirm_extraction(plan["itp_id"], SITE, "EMP-TECHMGR")
    out = await ITPService.approve(plan["itp_id"], SITE, USER)
    assert out["status"] == ITPStatus.APPROVED
    assert out["extraction_confirmed_by"] == "EMP-TECHMGR"


@pytest.mark.asyncio
async def test_a_hand_keyed_plan_needs_no_confirmation(db):
    """The gate exists because a machine read it, not as general ceremony."""
    plan = await ITPService.create(
        {"job_id": "JOB-1", "title": "x",
         "points": [{"point_id": "1", "activity": "Weld visual",
                     "intervention": "W"}]},
        SITE, USER,
    )
    out = await ITPService.approve(plan["itp_id"], SITE, USER)
    assert out["status"] == ITPStatus.APPROVED
