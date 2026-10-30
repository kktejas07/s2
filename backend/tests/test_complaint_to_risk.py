"""A complaint's preventive half becomes a risk.

ISO/IEC 17020:2026 abolished preventive action in favour of risk management.
That leaves a gap rather than closing one: the complaint record still has a
field commented "Corrective & Preventive Action", the corrective half still
belongs there, and "stop this recurring" now has nowhere to live unless it
lands in the register with an owner, a review date and a place in the audit
plan.

The tests that matter are the two ways this goes wrong: the same complaint
quietly raising three near-identical risks, and the complaint text being
copied straight across, which turns the register into a list of incidents
that have already happened.
"""
import sys
from pathlib import Path

import pytest
import pytest_asyncio
from beanie import init_beanie
from fastapi import HTTPException
from mongomock_motor import AsyncMongoMockClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.audit import AuditEntry  # noqa: E402
from core.sequences import Sequence  # noqa: E402
from modules.complaints.models import CustomerComplaint  # noqa: E402
from modules.complaints.service import ComplaintService  # noqa: E402
from modules.risk.models import InternalAudit, Risk, RiskReview  # noqa: E402
from modules.risk.service import RiskService  # noqa: E402

SITE = "SITE-01"
USER = "EMP-QA"


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
        database=client["capa_test"],
        document_models=[
            CustomerComplaint, Risk, RiskReview, InternalAudit, AuditEntry, Sequence,
        ],
    )
    yield client


async def _complaint(severity: str = "Major", **kw) -> CustomerComplaint:
    c = CustomerComplaint(
        complaint_id=kw.pop("complaint_id", "CMP-2026-0007"),
        site_id=SITE,
        description="Release note issued against a weld that had not been re-tested.",
        root_cause="Inspector relied on a verbal assurance from the contractor.",
        proposed_action="Release note withdrawn and reissued after re-test.",
        action_by="EMP-00002",
        severity=severity,
        **kw,
    )
    await c.insert()
    return c


DESCRIPTION = (
    "Inspectors may accept verbal assurances in place of test records when "
    "the contractor is under schedule pressure, producing release notes that "
    "cannot be defended."
)


@pytest.mark.asyncio
async def test_a_complaint_raises_a_risk_carrying_its_provenance(db):
    """A register entry with no traceable origin tends to be one invented for
    the assessor."""
    c = await _complaint()
    out = await ComplaintService.escalate_to_risk(
        c.complaint_id,
        {"description": DESCRIPTION, "category": "METHOD"},
        SITE, USER,
    )
    risk = out["risk"]
    assert risk["source"] == f"Complaint {c.complaint_id}"
    assert risk["related_entity_type"] == "complaint"
    assert risk["related_entity_id"] == c.complaint_id
    assert risk["category"] == "METHOD"

    # The link is visible from the complaint too, not only from the risk.
    stored = await ComplaintService.get(c.complaint_id, SITE)
    assert stored["raised_risk_id"] == risk["risk_id"]


@pytest.mark.asyncio
async def test_the_same_complaint_cannot_raise_two_risks(db):
    c = await _complaint()
    await ComplaintService.escalate_to_risk(
        c.complaint_id, {"description": DESCRIPTION}, SITE, USER
    )
    with pytest.raises(HTTPException) as e:
        await ComplaintService.escalate_to_risk(
            c.complaint_id, {"description": DESCRIPTION}, SITE, USER
        )
    assert e.value.status_code == 409
    assert "rather than raising a second one" in e.value.detail


@pytest.mark.asyncio
async def test_the_complaint_text_is_not_copied_across(db):
    """The complaint says what happened once; a risk says what could happen
    again. Defaulting one to the other produces a register of incidents."""
    c = await _complaint()
    with pytest.raises(HTTPException) as e:
        await ComplaintService.escalate_to_risk(c.complaint_id, {}, SITE, USER)
    assert e.value.status_code == 400
    assert "a different sentence" in e.value.detail


@pytest.mark.asyncio
async def test_severity_sets_the_impact_and_can_be_overridden(db):
    """Severity is evidence of how bad a recurrence would be, so it is a
    sensible default - but only the person raising it knows whether this was
    a one-off or the third time this quarter."""
    critical = await _complaint(severity="Critical", complaint_id="CMP-2026-0001")
    out = await ComplaintService.escalate_to_risk(
        critical.complaint_id, {"description": DESCRIPTION}, SITE, USER
    )
    assert out["risk"]["inherent_impact"] == 5

    minor = await _complaint(severity="Minor", complaint_id="CMP-2026-0002")
    out = await ComplaintService.escalate_to_risk(
        minor.complaint_id, {"description": DESCRIPTION}, SITE, USER
    )
    assert out["risk"]["inherent_impact"] == 2

    override = await _complaint(severity="Minor", complaint_id="CMP-2026-0003")
    out = await ComplaintService.escalate_to_risk(
        override.complaint_id,
        {"description": DESCRIPTION, "inherent_impact": 5, "inherent_likelihood": 4},
        SITE, USER,
    )
    assert out["risk"]["inherent_impact"] == 5
    assert out["risk"]["inherent_likelihood"] == 4


@pytest.mark.asyncio
async def test_the_owner_falls_back_to_whoever_actioned_the_complaint(db):
    c = await _complaint()
    out = await ComplaintService.escalate_to_risk(
        c.complaint_id, {"description": DESCRIPTION}, SITE, USER
    )
    assert out["risk"]["owner"] == "EMP-00002"


@pytest.mark.asyncio
async def test_a_risk_with_no_owner_anywhere_is_refused(db):
    c = await _complaint(complaint_id="CMP-2026-0004")
    c.action_by = None
    await c.save()
    with pytest.raises(HTTPException) as e:
        await ComplaintService.escalate_to_risk(
            c.complaint_id, {"description": DESCRIPTION}, SITE, USER
        )
    assert "needs an owner" in e.value.detail


@pytest.mark.asyncio
async def test_the_raised_risk_reaches_the_audit_plan(db):
    """The point of putting it in the register rather than on the complaint:
    it gets audited."""
    from modules.risk.service import AuditPlanService

    c = await _complaint(severity="Critical")
    await ComplaintService.escalate_to_risk(
        c.complaint_id,
        {"description": DESCRIPTION, "category": "METHOD", "inherent_likelihood": 4},
        SITE, USER,
    )
    plan = await AuditPlanService.propose_plan(SITE)
    categories = [p["category"] for p in plan["proposed"]]
    assert "METHOD" in categories
    method = next(p for p in plan["proposed"] if p["category"] == "METHOD")
    assert method["never_audited"] is True


@pytest.mark.asyncio
async def test_an_impartiality_complaint_cannot_be_escalated_as_accepted(db):
    """The register's own rule still applies to risks arriving this way - a
    conflict of interest cannot be ticked "accepted" just because it came in
    through a complaint."""
    c = await _complaint(severity="Critical")
    with pytest.raises(HTTPException) as e:
        await ComplaintService.escalate_to_risk(
            c.complaint_id,
            {"description": DESCRIPTION, "category": "IMPARTIALITY",
             "treatment": "ACCEPT"},
            SITE, USER,
        )
    assert "eliminated or minimised" in e.value.detail
