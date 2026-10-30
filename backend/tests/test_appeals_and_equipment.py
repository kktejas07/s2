"""Appeals (ISO/IEC 17020 cl. 7.6) and equipment calibration (cl. 6.2).

Both clauses were unrepresented. Appeals were being treated as complaints,
which misses the point: a complaint is about service, an appeal contests the
technical decision and must be decided by people who were not party to it.
Calibration existed only as a configuration field inside the pharma vertical,
so nothing stopped a measurement being recorded with a lapsed instrument.
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

from core.audit import AuditEntry, history  # noqa: E402
from core.sequences import Sequence  # noqa: E402
from modules.appeals.models import Appeal  # noqa: E402
from modules.appeals.service import AppealService  # noqa: E402
from modules.certifications.models import Certification  # noqa: E402
from modules.equipment.models import (  # noqa: E402
    CalibrationRecord, Equipment, EquipmentUsage,
)
from modules.equipment.service import (  # noqa: E402
    EquipmentService, calibration_state, is_usable,
)

SITE = "SITE-01"
USER = "USR-TEST"


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
        database=client["appeals_equipment_test"],
        document_models=[
            Appeal, Certification, Equipment, CalibrationRecord, EquipmentUsage,
            AuditEntry, Sequence,
        ],
    )
    yield client


# ------------------------------------------------------------- appeals

async def seed_certification() -> Certification:
    cert = Certification(
        certification_id="CERT-2026-0001", site_id=SITE,
        work_package_id="WP-2026-0001", job_id="JOB-2026-0001",
        prepared_by="EMP-00001", certified_by_person_id="EMP-00002",
        status="issued",
    )
    await cert.insert()
    return cert


@pytest.mark.asyncio
async def test_an_appeal_captures_who_made_the_contested_decision(db):
    """Captured at the moment the appeal is raised, because that is what makes
    the independence check possible later."""
    await seed_certification()
    appeal = await AppealService.raise_appeal(
        {
            "entity_type": "certification", "entity_id": "CERT-2026-0001",
            "appellant_name": "Suguna Metals", "grounds": "DEDUCTION_DISPUTE",
            "statement": "The 8 cum deduction is not supported by the joint measurement.",
        },
        SITE, USER,
    )
    assert set(appeal.original_decision_by) == {"EMP-00001", "EMP-00002"}
    assert appeal.job_id == "JOB-2026-0001"
    assert appeal.status == "RECEIVED"


@pytest.mark.asyncio
async def test_the_original_decision_makers_cannot_review_their_own_decision(db):
    """The substance of clause 7.6: an inspector reviewing their own rejection
    is not an independent review."""
    await seed_certification()
    appeal = await AppealService.raise_appeal(
        {"entity_type": "certification", "entity_id": "CERT-2026-0001",
         "appellant_name": "Suguna Metals", "statement": "Contested."},
        SITE, USER,
    )
    with pytest.raises(HTTPException) as exc:
        await AppealService.assign_reviewers(
            appeal.appeal_id, ["EMP-00002", "EMP-00009"], SITE, USER
        )
    assert exc.value.status_code == 409
    assert "EMP-00002" in exc.value.detail


@pytest.mark.asyncio
async def test_an_independent_panel_is_accepted(db):
    await seed_certification()
    appeal = await AppealService.raise_appeal(
        {"entity_type": "certification", "entity_id": "CERT-2026-0001",
         "appellant_name": "X", "statement": "Contested."}, SITE, USER,
    )
    updated = await AppealService.assign_reviewers(
        appeal.appeal_id, ["EMP-00007", "EMP-00008"], SITE, USER
    )
    assert updated.status == "UNDER_REVIEW"
    assert updated.acknowledged_at is not None


@pytest.mark.asyncio
async def test_a_decision_by_someone_outside_the_panel_is_refused(db):
    await seed_certification()
    appeal = await AppealService.raise_appeal(
        {"entity_type": "certification", "entity_id": "CERT-2026-0001",
         "appellant_name": "X", "statement": "Contested."}, SITE, USER,
    )
    await AppealService.assign_reviewers(appeal.appeal_id, ["EMP-00007"], SITE, USER)

    with pytest.raises(HTTPException):
        await AppealService.decide(
            appeal.appeal_id, "REJECTED", "Original stands.", "EMP-00001", SITE
        )
    with pytest.raises(HTTPException):
        await AppealService.decide(
            appeal.appeal_id, "REJECTED", "Original stands.", "EMP-00099", SITE
        )


@pytest.mark.asyncio
async def test_an_upheld_appeal_records_its_reasoning_and_remedy(db):
    await seed_certification()
    appeal = await AppealService.raise_appeal(
        {"entity_type": "certification", "entity_id": "CERT-2026-0001",
         "appellant_name": "X", "statement": "Contested."}, SITE, USER,
    )
    await AppealService.assign_reviewers(appeal.appeal_id, ["EMP-00007"], SITE, USER)
    decided = await AppealService.decide(
        appeal.appeal_id, "UPHELD",
        "Joint measurement sheet located; the deduction is reversed.",
        "EMP-00007", SITE, remedy_reference="CERT-2026-0004",
    )
    assert decided.status == "UPHELD"
    assert decided.remedy_reference == "CERT-2026-0004"
    assert decided.decided_at is not None

    entries = await history("appeal", appeal.appeal_id, SITE)
    assert any(e.note and "Joint measurement" in e.note for e in entries)


@pytest.mark.asyncio
async def test_a_decision_needs_reasoning(db):
    """The appellant is entitled to know why."""
    await seed_certification()
    appeal = await AppealService.raise_appeal(
        {"entity_type": "certification", "entity_id": "CERT-2026-0001",
         "appellant_name": "X", "statement": "Contested."}, SITE, USER,
    )
    await AppealService.assign_reviewers(appeal.appeal_id, ["EMP-00007"], SITE, USER)
    with pytest.raises(HTTPException) as exc:
        await AppealService.decide(appeal.appeal_id, "REJECTED", "   ", "EMP-00007", SITE)
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_a_closed_appeal_is_not_re_decided(db):
    await seed_certification()
    appeal = await AppealService.raise_appeal(
        {"entity_type": "certification", "entity_id": "CERT-2026-0001",
         "appellant_name": "X", "statement": "Contested."}, SITE, USER,
    )
    await AppealService.assign_reviewers(appeal.appeal_id, ["EMP-00007"], SITE, USER)
    await AppealService.decide(appeal.appeal_id, "REJECTED", "Stands.", "EMP-00007", SITE)
    with pytest.raises(HTTPException) as exc:
        await AppealService.decide(appeal.appeal_id, "UPHELD", "Changed mind.", "EMP-00007", SITE)
    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_summary_reports_the_upheld_rate(db):
    """How often IQE's original decision was wrong - a management review figure."""
    await seed_certification()
    for i, outcome in enumerate(("UPHELD", "REJECTED", "REJECTED")):
        a = await AppealService.raise_appeal(
            {"entity_type": "certification", "entity_id": "CERT-2026-0001",
             "appellant_name": f"Appellant {i}", "statement": "Contested."}, SITE, USER,
        )
        await AppealService.assign_reviewers(a.appeal_id, ["EMP-00007"], SITE, USER)
        await AppealService.decide(a.appeal_id, outcome, "Reasoned.", "EMP-00007", SITE)

    summary = await AppealService.summary(SITE)
    assert summary["total"] == 3
    assert summary["upheld_or_partially"] == 1
    assert summary["upheld_rate_pct"] == 33.3
    assert summary["open"] == 0


# ----------------------------------------------------------- equipment

async def seed_gauge(**overrides) -> Equipment:
    data = {
        "asset_tag": "UT-001", "name": "UT thickness gauge",
        "equipment_type": "Ultrasonic thickness gauge",
        "applicable_work_types": ["CODE_INSP"],
        "calibration_interval_months": 12,
    }
    data.update(overrides)
    return await EquipmentService.create(data, SITE, USER)


@pytest.mark.asyncio
async def test_calibration_state_is_computed_not_stored(db):
    """A stored is_calibrated flag is wrong the morning after it was written."""
    item = await seed_gauge()
    assert calibration_state(item)["in_calibration"] is False
    assert "no calibration" in calibration_state(item)["reason"]

    await EquipmentService.record_calibration(
        item.equipment_id,
        {"calibrated_on": datetime.now(), "result": "PASS", "certificate_no": "NABL/1"},
        SITE, USER,
    )
    refreshed = await EquipmentService.get(item.equipment_id, SITE)
    state = calibration_state(refreshed)
    assert state["in_calibration"] is True
    assert state["days_remaining"] > 300

    # The same record, read a year later, is lapsed - without anything being
    # rewritten.
    future = datetime.now() + timedelta(days=400)
    assert calibration_state(refreshed, at=future)["in_calibration"] is False


@pytest.mark.asyncio
async def test_a_lapsed_instrument_cannot_be_used(db):
    item = await seed_gauge()
    await EquipmentService.record_calibration(
        item.equipment_id,
        {"calibrated_on": datetime.now() - timedelta(days=400),
         "due_on": datetime.now() - timedelta(days=35), "result": "PASS"},
        SITE, USER,
    )
    with pytest.raises(HTTPException) as exc:
        await EquipmentService.record_usage(
            item.equipment_id, work_package_id="WP-1", site_id=SITE
        )
    assert exc.value.status_code == 409
    assert "lapsed" in exc.value.detail


@pytest.mark.asyncio
async def test_a_use_that_already_happened_can_still_be_recorded(db):
    """Reality intrudes: an instrument may be used before a lapse is noticed,
    and the record should reflect what happened rather than hide it."""
    item = await seed_gauge()
    await EquipmentService.record_calibration(
        item.equipment_id,
        {"calibrated_on": datetime.now() - timedelta(days=400),
         "due_on": datetime.now() - timedelta(days=35), "result": "PASS"},
        SITE, USER,
    )
    usage = await EquipmentService.record_usage(
        item.equipment_id, work_package_id="WP-1", site_id=SITE,
        allow_out_of_calibration=True,
    )
    assert usage.was_in_calibration is False
    assert "lapsed" in (usage.notes or "")


@pytest.mark.asyncio
async def test_a_failed_calibration_quarantines_and_names_affected_work(db):
    """The question a drifted gauge raises is 'which inspections does this
    affect', and it should have an answer."""
    item = await seed_gauge()
    await EquipmentService.record_calibration(
        item.equipment_id, {"calibrated_on": datetime.now() - timedelta(days=200),
                            "result": "PASS"}, SITE, USER,
    )
    for wp in ("WP-1", "WP-2", "WP-1"):
        await EquipmentService.record_usage(item.equipment_id, work_package_id=wp, site_id=SITE)

    outcome = await EquipmentService.record_calibration(
        item.equipment_id,
        {"calibrated_on": datetime.now(), "result": "FAIL",
         "deviation_found": "Reading 0.4mm high across the range"},
        SITE, USER,
    )
    assert outcome["equipment"]["status"] == "QUARANTINED"
    assert outcome["affected_work_packages"] == ["WP-1", "WP-2"]


@pytest.mark.asyncio
async def test_a_quarantined_instrument_cannot_be_used(db):
    item = await seed_gauge()
    await EquipmentService.record_calibration(
        item.equipment_id, {"calibrated_on": datetime.now(), "result": "PASS"}, SITE, USER
    )
    await EquipmentService.set_status(item.equipment_id, "QUARANTINED", "suspect drift", SITE, USER)
    refreshed = await EquipmentService.get(item.equipment_id, SITE)
    usable, reason = is_usable(refreshed)
    assert usable is False
    assert "quarantined" in reason


@pytest.mark.asyncio
async def test_due_for_calibration_separates_lapsed_from_upcoming(db):
    """Two different problems for a technical manager."""
    lapsed = await seed_gauge(asset_tag="UT-002")
    await EquipmentService.record_calibration(
        lapsed.equipment_id, {"calibrated_on": datetime.now() - timedelta(days=400),
                              "due_on": datetime.now() - timedelta(days=10),
                              "result": "PASS"}, SITE, USER)
    soon = await seed_gauge(asset_tag="UT-003")
    await EquipmentService.record_calibration(
        soon.equipment_id, {"calibrated_on": datetime.now() - timedelta(days=350),
                            "due_on": datetime.now() + timedelta(days=12),
                            "result": "PASS"}, SITE, USER)
    await seed_gauge(asset_tag="UT-004")   # never calibrated

    due = await EquipmentService.due_for_calibration(SITE, horizon_days=30)
    assert [r["asset_tag"] for r in due["lapsed"]] == ["UT-002"]
    assert [r["asset_tag"] for r in due["due_within_horizon"]] == ["UT-003"]
    assert [r["asset_tag"] for r in due["never_calibrated"]] == ["UT-004"]


@pytest.mark.asyncio
async def test_asset_tags_are_unique(db):
    await seed_gauge()
    with pytest.raises(HTTPException) as exc:
        await seed_gauge()
    assert exc.value.status_code == 409
