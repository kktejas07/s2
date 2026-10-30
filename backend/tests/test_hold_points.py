"""Hold points, witness points, and the calls raised against them.

The whole module turns on one distinction: a hold point stops the
contractor's work and only the client can release it; a witness point does
not and IQE may decline. A system where IQE can wave its own hold point has
modelled a reminder, so most of what follows guards that line.

The rest covers the failure this exists to prevent: a hold point that quietly
lapses, work proceeding past it, and nobody noticing until the certificate is
questioned.
"""
import sys
from datetime import datetime, timedelta
from pathlib import Path

import pytest
import pytest_asyncio
from beanie import init_beanie
from fastapi import HTTPException
from mongomock_motor import AsyncMongoMockClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.audit import AuditEntry  # noqa: E402
from core.sequences import Sequence  # noqa: E402
from modules.itp.models import (  # noqa: E402
    CallStatus,
    InspectionCall,
    InspectionTestPlan,
    InterventionType,
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
        database=client["itp_test"],
        document_models=[
            InspectionTestPlan, InspectionCall, AuditEntry, Sequence,
        ],
    )
    yield client


HOLD = {
    "point_id": "4.3.2", "activity": "Concrete pour, Block B slab",
    "discipline": "Civil", "intervention": "H",
    "reference_document": "SHMIC/STR/104", "reference_revision": "Rev C",
    "acceptance_criteria": "Reinforcement as drawing; cover 40mm +/- 5mm.",
}
WITNESS = {
    "point_id": "4.3.3", "activity": "Cube sampling",
    "discipline": "Civil", "intervention": "W",
    "acceptance_criteria": "Six cubes per 50m3.",
}


async def _plan(points=None, approve=True) -> dict:
    plan = await ITPService.create(
        {"job_id": "JOB-2026-0003", "title": "Block B structure",
         "client_reference": "SHMIC/ITP/07", "revision": "Rev 1",
         "points": points if points is not None else [HOLD, WITNESS]},
        SITE, USER,
    )
    if approve:
        await ITPService.approve(plan["itp_id"], SITE, USER)
    return plan


async def _call(itp_id: str, point_id: str, days_ahead: float = 7, **kw) -> dict:
    return await ITPService.raise_call(
        {"itp_id": itp_id, "point_id": point_id,
         "requested_date": datetime.now() + timedelta(days=days_ahead),
         "raised_by": "Suguna site office", **kw},
        SITE, USER,
    )


# ----------------------------------------------------------------- plans

@pytest.mark.asyncio
async def test_a_hold_point_needs_acceptance_criteria(db):
    """Work stops there, so what releases it has to be written down."""
    with pytest.raises(HTTPException) as e:
        await ITPService.create(
            {"job_id": "JOB-1", "title": "x",
             "points": [{**HOLD, "acceptance_criteria": None}]},
            SITE, USER,
        )
    assert "written down" in e.value.detail


@pytest.mark.asyncio
async def test_duplicate_point_references_are_refused(db):
    """Calls are raised against a point reference; duplicates make the call
    ambiguous."""
    with pytest.raises(HTTPException) as e:
        await ITPService.create(
            {"job_id": "JOB-1", "title": "x", "points": [HOLD, dict(HOLD)]},
            SITE, USER,
        )
    assert "appears twice" in e.value.detail


@pytest.mark.asyncio
async def test_the_reference_revision_is_kept(db):
    """Inspecting to Rev B when the client issued Rev C is among the most
    expensive mistakes in this industry, so the revision is a field."""
    plan = await _plan()
    stored = await ITPService.get(plan["itp_id"], SITE)
    point = next(p for p in stored.points if p.point_id == "4.3.2")
    assert point.reference_document == "SHMIC/STR/104"
    assert point.reference_revision == "Rev C"


@pytest.mark.asyncio
async def test_calls_cannot_be_raised_against_a_draft(db):
    """Against a draft nobody has agreed what the point requires."""
    plan = await _plan(approve=False)
    with pytest.raises(HTTPException) as e:
        await _call(plan["itp_id"], "4.3.2")
    assert e.value.status_code == 409
    assert "approved plan" in e.value.detail


# ----------------------------------------------------------- the notice

@pytest.mark.asyncio
async def test_short_notice_is_recorded_not_refused(db):
    """A contractor who cannot raise a short-notice call raises none and
    carries on without inspection, which is worse than an attended one with
    the shortfall on file."""
    plan = await _plan()
    call = await _call(plan["itp_id"], "4.3.2", days_ahead=1)
    assert call["short_notice"] is True
    assert call["notice_required_days"] == 5        # hold-point default
    assert call["notice_given_days"] < 5
    assert "against 5 required" in call["warning"]


@pytest.mark.asyncio
async def test_adequate_notice_is_not_flagged(db):
    plan = await _plan()
    call = await _call(plan["itp_id"], "4.3.2", days_ahead=9)
    assert call["short_notice"] is False
    assert call["warning"] is None


@pytest.mark.asyncio
async def test_witness_points_carry_a_shorter_default_notice(db):
    plan = await _plan()
    witness = await _call(plan["itp_id"], "4.3.3", days_ahead=4)
    assert witness["notice_required_days"] == 3
    assert witness["short_notice"] is False


# ------------------------------------------------- hold versus witness

@pytest.mark.asyncio
async def test_iqe_cannot_waive_its_own_hold_point(db):
    """The line the whole module turns on."""
    plan = await _plan()
    call = await _call(plan["itp_id"], "4.3.2")
    with pytest.raises(HTTPException) as e:
        await ITPService.waive(
            call["call_id"], {"reason": "Running short of inspectors."},
            SITE, USER,
        )
    assert e.value.status_code == 409
    assert "Only the client can release one" in e.value.detail


@pytest.mark.asyncio
async def test_a_client_can_waive_a_hold_point_on_the_record(db):
    plan = await _plan()
    call = await _call(plan["itp_id"], "4.3.2")
    out = await ITPService.waive(
        call["call_id"],
        {"reason": "Client accepted contractor's own records for this pour.",
         "waived_by": "K. Ramesh, SHMIC", "waiver_authority": "SHMIC/LTR/2026/221"},
        SITE, USER,
    )
    assert out["status"] == CallStatus.WAIVED
    assert out["waiver_authority"] == "SHMIC/LTR/2026/221"
    assert out["waived_by"] == "K. Ramesh, SHMIC"


@pytest.mark.asyncio
async def test_a_hold_point_cannot_be_declined(db):
    """Declining is available for a witness point and refused for a hold
    point, which is exactly the difference between them."""
    plan = await _plan()
    call = await _call(plan["itp_id"], "4.3.2")
    with pytest.raises(HTTPException) as e:
        await ITPService.decline(
            call["call_id"], {"reason": "No inspector free."}, SITE, USER
        )
    assert "work cannot proceed without it" in e.value.detail


@pytest.mark.asyncio
async def test_a_witness_point_can_be_declined(db):
    plan = await _plan()
    call = await _call(plan["itp_id"], "4.3.3")
    out = await ITPService.decline(
        call["call_id"],
        {"reason": "Attended the previous two pours; sampling is consistent."},
        SITE, USER,
    )
    assert out["status"] == CallStatus.DECLINED


# ------------------------------------------------------------ attendance

@pytest.mark.asyncio
async def test_anything_but_a_clean_acceptance_needs_a_note(db):
    """It is what the contractor acts on."""
    plan = await _plan()
    call = await _call(plan["itp_id"], "4.3.2")
    with pytest.raises(HTTPException) as e:
        await ITPService.record_attendance(
            call["call_id"], {"outcome": "REJECTED"}, SITE, USER
        )
    assert "what was found" in e.value.detail

    out = await ITPService.record_attendance(
        call["call_id"],
        {"outcome": "REJECTED",
         "outcome_note": "Cover measured 22mm against 40mm specified.",
         "ncr_refs": ["NCR-2026-0014"]},
        SITE, USER,
    )
    assert out["status"] == CallStatus.ATTENDED
    assert out["ncr_refs"] == ["NCR-2026-0014"]


@pytest.mark.asyncio
async def test_a_clean_acceptance_needs_no_note(db):
    plan = await _plan()
    call = await _call(plan["itp_id"], "4.3.3")
    out = await ITPService.record_attendance(
        call["call_id"], {"outcome": "ACCEPTED"}, SITE, USER
    )
    assert out["outcome"] == "ACCEPTED"


# ------------------------------------------------------------ automation

@pytest.mark.asyncio
async def test_a_lapsed_hold_point_is_caught_and_reported_as_blocking(db):
    """The failure this module exists to prevent: work proceeded past a point
    that was supposed to stop it and nobody noticed."""
    plan = await _plan()
    lapsed = await _call(plan["itp_id"], "4.3.2", days_ahead=-3)
    await _call(plan["itp_id"], "4.3.3", days_ahead=-2)

    out = await ITPService.sweep_missed(SITE)
    assert len(out["missed"]) == 2
    # Only the hold point blocks.
    assert [r["call_id"] for r in out["blocking_progress"]] == [lapsed["call_id"]]
    assert "cannot be certified" in out["note"]

    stored = await ITPService.get_call(lapsed["call_id"], SITE)
    assert stored.status == CallStatus.MISSED


@pytest.mark.asyncio
async def test_the_sweep_leaves_future_and_closed_calls_alone(db):
    plan = await _plan()
    future = await _call(plan["itp_id"], "4.3.2", days_ahead=5)
    waived = await _call(plan["itp_id"], "4.3.3", days_ahead=-4)
    await ITPService.decline(waived["call_id"], {"reason": "Not needed."}, SITE, USER)

    out = await ITPService.sweep_missed(SITE)
    assert out["missed"] == []
    assert (await ITPService.get_call(future["call_id"], SITE)).status == CallStatus.RAISED


@pytest.mark.asyncio
async def test_the_forecast_separates_hold_points_from_witness_points(db):
    """A missed hold point stops the contractor's work; a missed witness point
    costs IQE the attendance. Summing them would hide which is which."""
    plan = await _plan()
    await _call(plan["itp_id"], "4.3.2", days_ahead=4)
    await _call(plan["itp_id"], "4.3.3", days_ahead=6)

    out = await ITPService.forecast(SITE, days=14)
    assert out["calls_due"] == 2
    assert out["hold_points_due"] == 1
    assert out["unassigned"] == 2
    assert out["by_discipline"]["Civil"]["hold_points"] == 1


@pytest.mark.asyncio
async def test_the_forecast_ignores_calls_beyond_the_horizon(db):
    plan = await _plan()
    await _call(plan["itp_id"], "4.3.2", days_ahead=40)
    out = await ITPService.forecast(SITE, days=14)
    assert out["calls_due"] == 0


@pytest.mark.asyncio
async def test_the_forecast_says_so_when_capacity_cannot_be_read(db, monkeypatch):
    """A forecast that silently reported no capacity figure would read as
    nobody being available, which is a different thing and would be acted on
    differently."""
    from modules.people.service import PeopleService

    async def unavailable(site_id):
        raise RuntimeError("people collection unavailable")

    monkeypatch.setattr(PeopleService, "deployable_pool", unavailable)

    plan = await _plan()
    await _call(plan["itp_id"], "4.3.2", days_ahead=4)
    out = await ITPService.forecast(SITE, days=14)
    assert out["deployable_people"] is None
    assert out["calls_per_person"] is None
    assert "could not be read" in out["note"]
    # The demand side still works; only the capacity comparison is missing.
    assert out["calls_due"] == 1


@pytest.mark.asyncio
async def test_an_empty_pool_is_not_the_same_as_an_unreadable_one(db, monkeypatch):
    """Nobody deployable is a real answer and reads differently from a
    capacity figure that could not be fetched."""
    from modules.people.service import PeopleService

    async def empty(site_id):
        return {"data": []}

    monkeypatch.setattr(PeopleService, "deployable_pool", empty)

    plan = await _plan()
    await _call(plan["itp_id"], "4.3.2", days_ahead=4)
    out = await ITPService.forecast(SITE, days=14)
    assert out["deployable_people"] == 0
    assert "could not be read" not in out["note"]
    assert "against 0 deployable people" in out["note"]


@pytest.mark.asyncio
async def test_a_suggestion_without_a_work_package_declines_to_guess(db):
    """Competence is checked against the work type the package carries.
    Without one there is no requirement to check against."""
    plan = await _plan()
    call = await _call(plan["itp_id"], "4.3.2")
    out = await ITPService.suggest_inspector(call["call_id"], SITE)
    assert out["candidates"] == []
    assert "guessing would be worse" in out["note"]


@pytest.mark.asyncio
async def test_assignment_confirms_the_call_and_puts_a_visit_in_front_of_them(
    db, monkeypatch,
):
    """An inspector looks at their visit list. A confirmed call that lived only
    in the ITP module would be a second inbox, and the second inbox is the one
    nobody opens."""
    from modules.visits.service import VisitService

    raised: list[dict] = []

    async def fake_create(data, site_id, user_id):
        raised.append(data)
        return {"visit_id": "VST-2026-044"}

    monkeypatch.setattr(VisitService, "create", fake_create)

    plan = await _plan()
    call = await _call(plan["itp_id"], "4.3.2", days_ahead=1)
    out = await ITPService.assign(call["call_id"], "EMP-00006", SITE, USER)

    assert out["status"] == CallStatus.CONFIRMED
    assert out["assigned_person_id"] == "EMP-00006"
    assert out["visit_id"] == "VST-2026-044"
    assert out["visit_warning"] is None

    # The visit carries enough to know what is being attended and why it
    # matters, without opening the plan.
    visit = raised[0]
    assert visit["visit_type"] == "Hold Point"
    assert "4.3.2" in visit["inspection_scope"]
    assert "Concrete pour" in visit["inspection_scope"]
    assert visit["inspector_id"] == "EMP-00006"
    assert "Short notice" in visit["comments"]


@pytest.mark.asyncio
async def test_a_witness_point_visit_is_labelled_as_one(db, monkeypatch):
    from modules.visits.service import VisitService

    raised: list[dict] = []

    async def fake_create(data, site_id, user_id):
        raised.append(data)
        return {"visit_id": "VST-2026-045"}

    monkeypatch.setattr(VisitService, "create", fake_create)
    plan = await _plan()
    call = await _call(plan["itp_id"], "4.3.3")
    await ITPService.assign(call["call_id"], "EMP-00006", SITE, USER)
    assert raised[0]["visit_type"] == "Witness Point"
    assert "Short notice" not in raised[0]["comments"]


@pytest.mark.asyncio
async def test_a_failed_visit_does_not_lose_the_assignment_but_is_reported(
    db, monkeypatch,
):
    """The assignment is the decision the coordinator made, so it stands. But
    silently failing to raise the visit would leave an inspector who never
    hears about a hold point, so it is said out loud."""
    from modules.visits.service import VisitService

    async def fail(data, site_id, user_id):
        raise RuntimeError("job JOB-2026-0003 not found")

    monkeypatch.setattr(VisitService, "create", fail)

    plan = await _plan()
    call = await _call(plan["itp_id"], "4.3.2")
    out = await ITPService.assign(call["call_id"], "EMP-00006", SITE, USER)

    assert out["status"] == CallStatus.CONFIRMED
    assert out["assigned_person_id"] == "EMP-00006"
    assert out["visit_id"] is None
    assert "will not appear on their visit list" in out["visit_warning"]
    assert "Schedule the visit by hand" in out["visit_warning"]


@pytest.mark.asyncio
async def test_an_open_call_is_reported_as_blocking_progress(db):
    plan = await _plan()
    await _call(plan["itp_id"], "4.3.2", days_ahead=3)
    await _call(plan["itp_id"], "4.3.3", days_ahead=3)
    out = await ITPService.list_calls(SITE, open_only=True)
    blocking = [c for c in out["data"] if c["blocks_progress"]]
    assert len(blocking) == 1
    assert blocking[0]["intervention"] == InterventionType.HOLD
