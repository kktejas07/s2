"""Nonconformities: raising, dispositioning, verifying, and the certificate
gate.

`Certification.ncr_ids` and `InspectionCall.ncr_refs` were lists of strings
pointing at nothing, so a certificate could carry NCR references that
resolved to no record - worse than carrying none, because it reads as though
the nonconformities were tracked.

Two rules define the module and most of these tests guard them:

* **Use-as-is is the client's call.** A concession against the client's own
  specification is theirs to grant, not the contractor's and not IQE's.
* **The raiser does not close it.** The contractor says it is fixed; IQE
  checks. Verification is a separate act from asserting completion.
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
from modules.ncr.models import NCR, NCRStatus, Severity  # noqa: E402
from modules.ncr.service import NCRService  # noqa: E402

SITE = "SITE-01"
INSPECTOR = "EMP-00006"
CONTRACTOR = "SUGUNA-QA"
REVIEWER = "EMP-TECHMGR"


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
        database=client["ncr_test"],
        document_models=[NCR, AuditEntry, Sequence],
    )
    yield client


async def _raise(severity="MAJOR", **kw):
    return await NCRService.raise_ncr(
        {
            "job_id": "JOB-2026-0003",
            "work_package_id": "WP-2026-0001",
            "title": "Concrete cover below specification",
            "description": "Cover to the top mat is short along the eastern edge.",
            "discipline": "Civil",
            "requirement_source": "SHMIC/STR/104",
            "requirement_revision": "Rev C",
            "requirement_clause": "5.2.1",
            "objective_evidence": (
                "Cover meter readings of 22, 24, 21, 23, 22 and 25mm at six of "
                "ten positions checked, against 40mm +/- 5mm specified."
            ),
            "severity": severity,
            **kw,
        },
        SITE, INSPECTOR,
    )


async def _to_correction(ncr_id, disposition="REWORK", **accept):
    await NCRService.propose_disposition(
        ncr_id, {"disposition": disposition, "note": "Will cut out and recast."},
        SITE, CONTRACTOR,
    )
    return await NCRService.accept_disposition(ncr_id, accept, SITE, REVIEWER)


# ------------------------------------------------------------- raising

@pytest.mark.asyncio
async def test_a_major_finding_needs_objective_evidence(db):
    """What was measured, as distinct from the conclusion drawn from it. A
    finding without it cannot be defended when the contractor disputes it."""
    with pytest.raises(HTTPException) as e:
        await NCRService.raise_ncr(
            {"title": "Cover short", "description": "Looks wrong.",
             "severity": "MAJOR"},
            SITE, INSPECTOR,
        )
    assert "as distinct from the conclusion" in e.value.detail


@pytest.mark.asyncio
async def test_an_observation_needs_no_evidence_and_blocks_nothing(db):
    """An observation is a note, not a finding."""
    out = await NCRService.raise_ncr(
        {"title": "Housekeeping", "description": "Offcuts left near the edge.",
         "severity": "OBSERVATION", "work_package_id": "WP-2026-0001"},
        SITE, INSPECTOR,
    )
    assert out["blocks_certification"] is False
    gate = await NCRService.open_against(SITE, work_package_id="WP-2026-0001")
    assert gate["may_certify"] is True


@pytest.mark.asyncio
async def test_the_requirement_revision_is_kept(db):
    """Inspecting to Rev B when the client issued Rev C is among the most
    expensive mistakes in this industry, and an NCR that does not name the
    revision cannot be argued either way."""
    out = await _raise()
    assert out["requirement_source"] == "SHMIC/STR/104"
    assert out["requirement_revision"] == "Rev C"
    assert out["requirement_clause"] == "5.2.1"


@pytest.mark.asyncio
async def test_severity_sets_the_clock(db):
    """A critical nonconformity on a live site is not a next-week problem."""
    critical = await _raise(severity="CRITICAL")
    major = await _raise(severity="MAJOR")
    observation = await _raise(severity="OBSERVATION",
                               objective_evidence=None, title="Note")

    assert (critical["due_by"] - critical["raised_on"]) == timedelta(hours=24)
    assert (major["due_by"] - major["raised_on"]) == timedelta(hours=72)
    assert observation["due_by"] is None


# --------------------------------------------------- the concession rule

@pytest.mark.asyncio
async def test_use_as_is_needs_the_clients_authority(db):
    """The line the module turns on. IQE reports the deviation; it does not
    decide the client will live with it."""
    out = await _raise()
    await NCRService.propose_disposition(
        out["ncr_id"],
        {"disposition": "USE_AS_IS",
         "note": "Cover shortfall is local and the element is not exposed."},
        SITE, CONTRACTOR,
    )
    with pytest.raises(HTTPException) as e:
        await NCRService.accept_disposition(out["ncr_id"], {}, SITE, REVIEWER)
    assert e.value.status_code == 409
    assert "does not decide the client will live with it" in e.value.detail


@pytest.mark.asyncio
async def test_a_client_can_grant_the_concession_on_the_record(db):
    out = await _raise()
    await NCRService.propose_disposition(
        out["ncr_id"], {"disposition": "USE_AS_IS", "note": "Local shortfall."},
        SITE, CONTRACTOR,
    )
    done = await NCRService.accept_disposition(
        out["ncr_id"],
        {"concession_authority": "SHMIC/CON/2026/09",
         "concession_approved_by": "K. Ramesh, SHMIC"},
        SITE, REVIEWER,
    )
    assert done["status"] == NCRStatus.IN_CORRECTION
    assert done["concession_authority"] == "SHMIC/CON/2026/09"


@pytest.mark.asyncio
async def test_repair_is_also_a_concession(db):
    """Making it fit for purpose without meeting the specification is still a
    departure from what the client specified."""
    out = await _raise()
    proposed = await NCRService.propose_disposition(
        out["ncr_id"], {"disposition": "REPAIR", "note": "Patch and re-test."},
        SITE, CONTRACTOR,
    )
    assert proposed["needs_client_concession"] is True
    with pytest.raises(HTTPException):
        await NCRService.accept_disposition(out["ncr_id"], {}, SITE, REVIEWER)


@pytest.mark.asyncio
async def test_rework_needs_no_concession(db):
    """Bringing it back to specification is not a departure from it."""
    out = await _raise()
    proposed = await NCRService.propose_disposition(
        out["ncr_id"], {"disposition": "REWORK", "note": "Cut out and recast."},
        SITE, CONTRACTOR,
    )
    assert proposed["needs_client_concession"] is False
    done = await NCRService.accept_disposition(out["ncr_id"], {}, SITE, REVIEWER)
    assert done["status"] == NCRStatus.IN_CORRECTION


@pytest.mark.asyncio
async def test_a_disposition_needs_a_note(db):
    out = await _raise()
    with pytest.raises(HTTPException) as e:
        await NCRService.propose_disposition(
            out["ncr_id"], {"disposition": "REWORK"}, SITE, CONTRACTOR
        )
    assert "what will be done and why" in e.value.detail


@pytest.mark.asyncio
async def test_withdrawing_a_finding_needs_a_reason(db):
    """An NCR withdrawn without one is indistinguishable from one that was
    argued away."""
    out = await _raise()
    await NCRService.propose_disposition(
        out["ncr_id"],
        {"disposition": "REJECT_FINDING", "note": "Readings taken on green concrete."},
        SITE, CONTRACTOR,
    )
    with pytest.raises(HTTPException) as e:
        await NCRService.accept_disposition(out["ncr_id"], {}, SITE, REVIEWER)
    assert "argued away" in e.value.detail

    done = await NCRService.accept_disposition(
        out["ncr_id"],
        {"reason": "Cover meter was uncalibrated; re-measured at 41mm."},
        SITE, REVIEWER,
    )
    assert done["status"] == NCRStatus.CLOSED


# --------------------------------------------------- the verification rule

@pytest.mark.asyncio
async def test_the_person_who_said_it_was_fixed_cannot_verify_it(db):
    """The only thing standing between 'closed' and 'fixed'."""
    out = await _raise()
    await _to_correction(out["ncr_id"])
    await NCRService.submit_for_verification(
        out["ncr_id"], {"note": "Recast and cured."}, SITE, CONTRACTOR
    )
    with pytest.raises(HTTPException) as e:
        await NCRService.verify(
            out["ncr_id"], {"accepted": True, "note": "Looks fine."},
            SITE, CONTRACTOR,
        )
    assert e.value.status_code == 409
    assert "an assertion repeated, not a check" in e.value.detail


@pytest.mark.asyncio
async def test_a_different_person_can_verify_and_close_it(db):
    out = await _raise()
    await _to_correction(out["ncr_id"])
    await NCRService.submit_for_verification(
        out["ncr_id"], {"note": "Recast and cured."}, SITE, CONTRACTOR
    )
    done = await NCRService.verify(
        out["ncr_id"],
        {"accepted": True,
         "note": "Re-measured at ten positions, 38-43mm throughout.",
         "verification_evidence_ids": ["EV-2026-00044"]},
        SITE, INSPECTOR,
    )
    assert done["status"] == NCRStatus.CLOSED
    assert done["verified_by"] == INSPECTOR
    assert done["verification_evidence_ids"] == ["EV-2026-00044"]


@pytest.mark.asyncio
async def test_a_failed_verification_sends_it_back(db):
    out = await _raise()
    await _to_correction(out["ncr_id"])
    await NCRService.submit_for_verification(
        out["ncr_id"], {"note": "Done."}, SITE, CONTRACTOR
    )
    done = await NCRService.verify(
        out["ncr_id"],
        {"accepted": False, "note": "Two positions still at 29mm."},
        SITE, INSPECTOR,
    )
    assert done["status"] == NCRStatus.IN_CORRECTION


@pytest.mark.asyncio
async def test_verification_needs_a_note_of_what_was_checked(db):
    """'Closed' with no record of what was looked at is an assertion, not a
    verification."""
    out = await _raise()
    await _to_correction(out["ncr_id"])
    await NCRService.submit_for_verification(
        out["ncr_id"], {"note": "Done."}, SITE, CONTRACTOR
    )
    with pytest.raises(HTTPException) as e:
        await NCRService.verify(out["ncr_id"], {"accepted": True}, SITE, INSPECTOR)
    assert "an assertion, not a verification" in e.value.detail


@pytest.mark.asyncio
async def test_an_ncr_cannot_skip_straight_to_closed(db):
    out = await _raise()
    with pytest.raises(HTTPException) as e:
        NCRService._move(
            await NCRService.get(out["ncr_id"], SITE),
            NCRStatus.CLOSED.value, INSPECTOR,
        )
    assert "cannot move to closed" in e.value.detail


@pytest.mark.asyncio
async def test_every_move_is_kept_in_order(db):
    out = await _raise()
    await _to_correction(out["ncr_id"])
    await NCRService.submit_for_verification(
        out["ncr_id"], {"note": "Done."}, SITE, CONTRACTOR
    )
    await NCRService.verify(
        out["ncr_id"], {"accepted": True, "note": "Re-measured."}, SITE, INSPECTOR
    )
    stored = await NCRService.get(out["ncr_id"], SITE)
    assert [e.to_status for e in stored.history] == [
        "OPEN", "DISPOSITION_PROPOSED", "IN_CORRECTION",
        "AWAITING_VERIFICATION", "CLOSED",
    ]
    assert [e.sequence for e in stored.history] == [1, 2, 3, 4, 5]


@pytest.mark.asyncio
async def test_a_voided_ncr_is_kept_with_its_reason(db):
    out = await _raise()
    done = await NCRService.void(
        out["ncr_id"], {"reason": "Raised against the wrong work package."},
        SITE, INSPECTOR,
    )
    assert done["status"] == NCRStatus.VOID
    assert "wrong work package" in done["void_reason"]
    gate = await NCRService.open_against(SITE, work_package_id="WP-2026-0001")
    assert gate["may_certify"] is True


# ------------------------------------------------------- the certificate gate

@pytest.mark.asyncio
async def test_an_open_major_blocks_certification(db):
    """A certificate issued over one would state that the work conformed when
    IQE's own record says it did not."""
    await _raise(severity="MAJOR")
    gate = await NCRService.open_against(SITE, work_package_id="WP-2026-0001")
    assert gate["may_certify"] is False
    assert len(gate["blocking"]) == 1
    assert "says it did not" in gate["note"]


@pytest.mark.asyncio
async def test_a_minor_does_not_block_but_is_still_reported(db):
    """A departure that does not affect fitness for purpose is reported on the
    certificate, not a reason to withhold it."""
    await _raise(severity="MINOR")
    gate = await NCRService.open_against(SITE, work_package_id="WP-2026-0001")
    assert gate["may_certify"] is True
    assert len(gate["open"]) == 1


@pytest.mark.asyncio
async def test_a_closed_major_stops_blocking(db):
    out = await _raise(severity="MAJOR")
    await _to_correction(out["ncr_id"])
    await NCRService.submit_for_verification(
        out["ncr_id"], {"note": "Done."}, SITE, CONTRACTOR
    )
    await NCRService.verify(
        out["ncr_id"], {"accepted": True, "note": "Re-measured."}, SITE, INSPECTOR
    )
    gate = await NCRService.open_against(SITE, work_package_id="WP-2026-0001")
    assert gate["may_certify"] is True


@pytest.mark.asyncio
async def test_overdue_nonconformities_are_reported(db):
    out = await _raise(severity="CRITICAL")
    stored = await NCRService.get(out["ncr_id"], SITE)
    stored.due_by = datetime.now() - timedelta(hours=6)
    await stored.save()

    gate = await NCRService.open_against(SITE, work_package_id="WP-2026-0001")
    assert len(gate["overdue"]) == 1
    assert gate["overdue"][0]["hours_late"] >= 5.9


@pytest.mark.asyncio
async def test_the_gate_scopes_to_the_work_package(db):
    """An NCR on another package is not this certificate's problem."""
    await _raise(severity="MAJOR", work_package_id="WP-2026-0002")
    gate = await NCRService.open_against(SITE, work_package_id="WP-2026-0001")
    assert gate["may_certify"] is True
