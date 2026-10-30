"""The external provider register (ISO/IEC 17020:2026).

What these guard is the set of ways a provider becomes unusable without
anyone noticing: an approval nobody revisited, a calibration laboratory whose
own accreditation lapsed, a subcontractor the client never agreed to. Each one
is silent, and each one reaches backwards into work already certified.
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
from modules.providers.models import (  # noqa: E402
    EvaluationRecord,
    ExternalProvider,
    PerformanceRecord,
    ProviderCategory,
    ProviderStatus,
    SubcontractConsent,
)
from modules.providers.service import (  # noqa: E402
    ProviderService,
    accreditation_state,
    approval_state,
    is_usable,
)

SITE = "SITE-01"
USER = "EMP-TM"


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
        database=client["providers_test"],
        document_models=[
            ExternalProvider, EvaluationRecord, PerformanceRecord,
            SubcontractConsent, AuditEntry, Sequence,
        ],
    )
    yield client


async def _register(**kw) -> dict:
    data = {"name": "Sigma Metrology", "category": ProviderCategory.CALIBRATION_LAB, **kw}
    return await ProviderService.register(data, SITE, USER)


async def _approve(provider_id: str, **kw) -> dict:
    payload = {
        "outcome": "APPROVED",
        "rationale": "NABL scope covers the ranges we use; two witnessed jobs clean.",
        "approved_services": ["Calibration of UT gauges"],
        **kw,
    }
    return await ProviderService.evaluate(provider_id, payload, SITE, USER)


# ------------------------------------------------------------- registration

@pytest.mark.asyncio
async def test_registering_does_not_approve(db):
    """A provider enters the register unusable. The alternative - present
    therefore usable - is how an unevaluated subcontractor ends up on a job."""
    p = await _register()
    assert p["status"] == ProviderStatus.PENDING_EVALUATION
    stored = await ProviderService.get(p["provider_id"], SITE)
    usable, reason = is_usable(stored)
    assert usable is False
    assert "pending evaluation" in reason


@pytest.mark.asyncio
async def test_an_evaluation_needs_its_reasoning(db):
    p = await _register()
    with pytest.raises(HTTPException) as e:
        await ProviderService.evaluate(
            p["provider_id"],
            {"outcome": "APPROVED", "approved_services": ["x"]},
            SITE, USER,
        )
    assert "signature, not an assessment" in e.value.detail


@pytest.mark.asyncio
async def test_an_approval_must_say_what_it_covers(db):
    """An unscoped approval approves everything, which is never what was
    meant."""
    p = await _register()
    with pytest.raises(HTTPException) as e:
        await ProviderService.evaluate(
            p["provider_id"],
            {"outcome": "APPROVED", "rationale": "Looks fine."},
            SITE, USER,
        )
    assert "approves everything" in e.value.detail


@pytest.mark.asyncio
async def test_conditional_approval_must_state_the_conditions(db):
    p = await _register()
    with pytest.raises(HTTPException):
        await ProviderService.evaluate(
            p["provider_id"],
            {"outcome": "APPROVED_WITH_CONDITIONS", "rationale": "Mostly good.",
             "approved_services": ["Calibration of UT gauges"]},
            SITE, USER,
        )


@pytest.mark.asyncio
async def test_approval_outside_its_scope_is_refused(db):
    # Accredited, so the scope check is what this test reaches rather than
    # the traceability check tripping first.
    p = await _register(accreditation={
        "body": "NABL", "valid_until": datetime.now() + timedelta(days=200),
    })
    await _approve(p["provider_id"])
    stored = await ProviderService.get(p["provider_id"], SITE)

    ok, _ = is_usable(stored, service="Calibration of UT gauges")
    assert ok

    ok, reason = is_usable(stored, service="Radiographic testing")
    assert ok is False
    assert "not Radiographic testing" in reason


# ------------------------------------------------------- approval expiry

@pytest.mark.asyncio
async def test_an_approval_nobody_revisited_stops_counting(db):
    """An approval from 2019 that nobody has revisited is evidence of the
    absence of monitoring, not of its presence."""
    p = await _register()
    await _approve(
        p["provider_id"], next_review_on=datetime.now() - timedelta(days=40)
    )
    stored = await ProviderService.get(p["provider_id"], SITE)

    state = approval_state(stored)
    assert state["current"] is False
    assert "overdue" in state["reason"]

    usable, reason = is_usable(stored)
    assert usable is False
    assert "overdue" in reason


@pytest.mark.asyncio
async def test_approval_state_is_computed_not_stored(db):
    """Same reasoning as equipment calibration: a stored flag is wrong the
    morning after it was written."""
    p = await _register()
    await _approve(p["provider_id"], next_review_on=datetime.now() + timedelta(days=1))
    stored = await ProviderService.get(p["provider_id"], SITE)

    assert approval_state(stored)["current"] is True
    # Nothing is written; only the clock moves.
    later = approval_state(stored, at=datetime.now() + timedelta(days=5))
    assert later["current"] is False


# -------------------------------------------------- the traceability chain

@pytest.mark.asyncio
async def test_a_lapsed_calibration_lab_cannot_be_relied_on(db):
    """The traceability chain behind every measurement IQE certifies runs
    through this provider. A lapse there is not their paperwork problem."""
    p = await _register(accreditation={
        "body": "NABL", "certificate_number": "CC-1182",
        "valid_until": datetime.now() - timedelta(days=5),
    })
    await _approve(p["provider_id"])
    stored = await ProviderService.get(p["provider_id"], SITE)

    acc = accreditation_state(stored)
    assert acc["critical"] is True
    assert acc["valid"] is False

    usable, reason = is_usable(stored)
    assert usable is False
    assert "accreditation lapsed" in reason


@pytest.mark.asyncio
async def test_a_calibration_lab_with_no_accreditation_is_refused(db):
    p = await _register()           # no accreditation supplied
    await _approve(p["provider_id"])
    stored = await ProviderService.get(p["provider_id"], SITE)
    usable, reason = is_usable(stored)
    assert usable is False
    assert "measurement IQE certifies" in reason


@pytest.mark.asyncio
async def test_accreditation_is_not_demanded_of_providers_that_do_not_measure(db):
    """A training provider or an equipment hire company has no traceability
    role, so requiring accreditation of them would be noise."""
    p = await _register(name="Crane Hire Co", category=ProviderCategory.EQUIPMENT_HIRE)
    await _approve(p["provider_id"], approved_services=["Access equipment"])
    stored = await ProviderService.get(p["provider_id"], SITE)

    assert accreditation_state(stored)["critical"] is False
    usable, reason = is_usable(stored)
    assert usable is True, reason


# --------------------------------------------------------- client consent

@pytest.mark.asyncio
async def test_subcontracting_without_client_consent_is_blocked(db):
    p = await _register(name="Apex NDT", category=ProviderCategory.NDT_SERVICE,
                        accreditation={"body": "NABL",
                                       "valid_until": datetime.now() + timedelta(days=200)})
    await _approve(p["provider_id"], approved_services=["UT"])

    check = await ProviderService.check_may_subcontract(
        "JOB-2026-0001", p["provider_id"], SITE
    )
    assert check["may_subcontract"] is False
    assert check["provider_usable"] is True
    assert any("has not agreed" in b for b in check["blockers"])

    await ProviderService.record_consent(
        {"job_id": "JOB-2026-0001", "provider_id": p["provider_id"],
         "granted_by": "K. Ramesh", "reference": "email 14.10.2026"},
        SITE, USER,
    )
    check = await ProviderService.check_may_subcontract(
        "JOB-2026-0001", p["provider_id"], SITE
    )
    assert check["may_subcontract"] is True


@pytest.mark.asyncio
async def test_consent_is_per_job_not_blanket(db):
    """Agreeing to a subcontractor on one job is not agreeing to them on the
    next one."""
    p = await _register(name="Apex NDT", category=ProviderCategory.NDT_SERVICE,
                        accreditation={"body": "NABL",
                                       "valid_until": datetime.now() + timedelta(days=200)})
    await _approve(p["provider_id"], approved_services=["UT"])
    await ProviderService.record_consent(
        {"job_id": "JOB-A", "provider_id": p["provider_id"], "granted_by": "X"},
        SITE, USER,
    )
    other = await ProviderService.check_may_subcontract("JOB-B", p["provider_id"], SITE)
    assert other["may_subcontract"] is False


@pytest.mark.asyncio
async def test_both_blockers_are_reported_together(db):
    """Fixing one and discovering the other is a wasted round trip."""
    p = await _register()           # calibration lab, no accreditation
    await _approve(p["provider_id"])
    check = await ProviderService.check_may_subcontract("JOB-X", p["provider_id"], SITE)
    assert len(check["blockers"]) == 2


# ------------------------------------------------------------- monitoring

@pytest.mark.asyncio
async def test_a_serious_observation_brings_the_review_forward(db):
    """A flag waits for someone to notice it. Moving the review date makes
    the provider unusable until it is dealt with."""
    p = await _register(category=ProviderCategory.EQUIPMENT_HIRE)
    await _approve(p["provider_id"], approved_services=["Access equipment"],
                   next_review_on=datetime.now() + timedelta(days=300))
    stored = await ProviderService.get(p["provider_id"], SITE)
    assert is_usable(stored)[0] is True

    await ProviderService.record_performance(
        p["provider_id"],
        {"note": "Platform delivered with an expired inspection sticker.",
         "rating": -2, "triggers_review": True},
        SITE, USER,
    )
    stored = await ProviderService.get(p["provider_id"], SITE)
    usable, reason = is_usable(stored, at=datetime.now() + timedelta(seconds=1))
    assert usable is False
    assert "overdue" in reason


@pytest.mark.asyncio
async def test_suspension_reports_what_it_touches(db):
    """Same question that follows quarantining an instrument: what work does
    this reach?"""
    p = await _register(category=ProviderCategory.NDT_SERVICE,
                        accreditation={"body": "NABL",
                                       "valid_until": datetime.now() + timedelta(days=200)})
    await _approve(p["provider_id"], approved_services=["UT"])
    for job in ("JOB-A", "JOB-B"):
        await ProviderService.record_consent(
            {"job_id": job, "provider_id": p["provider_id"], "granted_by": "X"},
            SITE, USER,
        )

    out = await ProviderService.set_status(
        p["provider_id"], ProviderStatus.SUSPENDED,
        "Two reports with no traceable instrument reference.", SITE, USER,
    )
    assert out["affected_jobs"] == ["JOB-A", "JOB-B"]


@pytest.mark.asyncio
async def test_a_status_change_needs_a_reason(db):
    p = await _register()
    with pytest.raises(HTTPException):
        await ProviderService.set_status(
            p["provider_id"], ProviderStatus.SUSPENDED, "", SITE, USER
        )


@pytest.mark.asyncio
async def test_evaluations_accumulate_rather_than_overwrite(db):
    p = await _register(category=ProviderCategory.TRAINING)
    await _approve(p["provider_id"], approved_services=["NDT Level II course"])
    await ProviderService.evaluate(
        p["provider_id"],
        {"outcome": "APPROVED_WITH_CONDITIONS",
         "rationale": "Trainer changed; narrowing until the new one is observed.",
         "conditions": "Level II only, witnessed by IQE for the first two cohorts.",
         "approved_services": ["NDT Level II course"]},
        SITE, USER,
    )
    detail = await ProviderService.detail(p["provider_id"], SITE)
    assert len(detail["evaluations"]) == 2
    assert [e["sequence"] for e in detail["evaluations"]] == [2, 1]
    assert detail["provider"]["status"] == ProviderStatus.CONDITIONAL


@pytest.mark.asyncio
async def test_review_due_separates_the_three_problems(db):
    """Never evaluated, overdue, and due soon are different pieces of work."""
    never = await _register(name="Unassessed Co", category=ProviderCategory.TRAINING)
    overdue = await _register(name="Stale Co", category=ProviderCategory.TRAINING)
    await _approve(overdue["provider_id"], approved_services=["x"],
                   next_review_on=datetime.now() - timedelta(days=10))
    soon = await _register(name="Soon Co", category=ProviderCategory.TRAINING)
    await _approve(soon["provider_id"], approved_services=["x"],
                   next_review_on=datetime.now() + timedelta(days=20))

    due = await ProviderService.due_for_review(SITE, horizon_days=60)
    assert [r["provider_id"] for r in due["never_evaluated"]] == [never["provider_id"]]
    assert [r["provider_id"] for r in due["overdue_review"]] == [overdue["provider_id"]]
    assert [r["provider_id"] for r in due["due_within_horizon"]] == [soon["provider_id"]]
