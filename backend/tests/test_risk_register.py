"""The risk register and the audit plan derived from it.

ISO/IEC 17020:2026 replaced preventive action with risk and opportunity
management and made internal auditing risk-based. The tests that matter here
are the ones stopping the register from becoming a document written for the
assessor: an impartiality risk cannot be waved through as "accepted", controls
cannot claim to leave a risk worse than they found it, and an auditor cannot
audit their own work.
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
from modules.risk.models import (  # noqa: E402
    MATERIAL_THRESHOLD,
    InternalAudit,
    Risk,
    RiskCategory,
    RiskReview,
    RiskStatus,
    Treatment,
)
from modules.risk.service import (  # noqa: E402
    AuditPlanService,
    RiskService,
    review_state,
    score,
)

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
        database=client["risk_test"],
        document_models=[Risk, RiskReview, InternalAudit, AuditEntry, Sequence],
    )
    yield client


async def _risk(**kw) -> dict:
    data = {
        "title": "Single inspector authorised for UT",
        "description": "One person covers every UT job; absence stops the work.",
        "category": RiskCategory.COMPETENCE,
        "owner": "EMP-TM",
        "inherent_likelihood": 4, "inherent_impact": 4,
        "residual_likelihood": 3, "residual_impact": 3,
        **kw,
    }
    return await RiskService.create(data, SITE, USER)


# ---------------------------------------------------------------- basics

@pytest.mark.asyncio
async def test_a_risk_needs_an_owner(db):
    with pytest.raises(HTTPException) as e:
        await _risk(owner="")
    assert "nobody's" in e.value.detail


@pytest.mark.asyncio
async def test_both_scores_are_kept(db):
    """Keeping only the residual loses the reason the controls exist, which
    is the first thing asked when someone proposes removing one."""
    r = await _risk()
    assert r["inherent_score"] == 16
    assert r["residual_score"] == 9
    assert r["material"] is True


@pytest.mark.asyncio
async def test_controls_cannot_claim_to_make_a_risk_worse(db):
    with pytest.raises(HTTPException) as e:
        await _risk(residual_likelihood=5, residual_impact=5)
    assert "not a treatment" in e.value.detail


# -------------------------------------------------------- impartiality

@pytest.mark.asyncio
async def test_a_material_impartiality_risk_cannot_be_accepted(db):
    """A register that let someone tick "accepted" on a conflict of interest
    would be worse than no register - it would make the decision look
    considered."""
    with pytest.raises(HTTPException) as e:
        await _risk(
            title="Inspector previously employed by the contractor",
            category=RiskCategory.IMPARTIALITY,
            treatment=Treatment.ACCEPT,
            inherent_likelihood=4, inherent_impact=4,
            residual_likelihood=3, residual_impact=3,
            acceptance_rationale="Long time ago, should be fine.",
        )
    assert e.value.status_code == 409
    assert "eliminated or minimised" in e.value.detail


@pytest.mark.asyncio
async def test_an_impartiality_risk_can_be_avoided_or_reduced(db):
    """The point is not that impartiality risks are forbidden - it is that
    accepting one is not among the available answers."""
    avoided = await _risk(
        title="Inspector previously employed by the contractor",
        category=RiskCategory.IMPARTIALITY,
        treatment=Treatment.AVOID,
        residual_likelihood=1, residual_impact=3,
    )
    assert avoided["treatment"] == Treatment.AVOID

    reduced = await _risk(
        title="Reviewer shares an office with the inspection team",
        category=RiskCategory.IMPARTIALITY,
        treatment=Treatment.ACCEPT,
        inherent_likelihood=2, inherent_impact=2,
        residual_likelihood=1, residual_impact=2,   # score 2, under tolerance
    )
    assert reduced["residual_score"] == 2


@pytest.mark.asyncio
async def test_accepting_a_material_risk_needs_a_rationale(db):
    with pytest.raises(HTTPException) as e:
        await _risk(
            category=RiskCategory.COMMERCIAL,
            treatment=Treatment.ACCEPT,
            inherent_likelihood=4, inherent_impact=4,
            residual_likelihood=3, residual_impact=3,
        )
    assert "nobody owns the decision" in e.value.detail


@pytest.mark.asyncio
async def test_a_small_risk_can_be_accepted_without_ceremony(db):
    """The threshold has to cut both ways, or everything becomes a form."""
    r = await _risk(
        category=RiskCategory.COMMERCIAL,
        treatment=Treatment.ACCEPT,
        inherent_likelihood=2, inherent_impact=2,
        residual_likelihood=2, residual_impact=2,
    )
    assert r["status"] == RiskStatus.ACCEPTED
    assert r["residual_score"] < MATERIAL_THRESHOLD


# -------------------------------------------------------------- reviews

@pytest.mark.asyncio
async def test_a_review_needs_its_reasoning(db):
    r = await _risk()
    with pytest.raises(HTTPException) as e:
        await RiskService.review(r["risk_id"], {"residual_impact": 2}, SITE, USER)
    assert "is a date" in e.value.detail


@pytest.mark.asyncio
async def test_reviews_accumulate_and_move_the_score(db):
    r = await _risk()
    await RiskService.review(
        r["risk_id"],
        {"note": "Second inspector authorised on 12.10.2026.",
         "residual_likelihood": 2, "residual_impact": 3},
        SITE, USER,
    )
    detail = await RiskService.detail(r["risk_id"], SITE)
    assert detail["risk"]["residual_score"] == 6
    assert len(detail["reviews"]) == 1
    # The inherent score does not move: the risk was always that size.
    assert detail["risk"]["inherent_score"] == 16


@pytest.mark.asyncio
async def test_review_state_is_computed(db):
    r = await _risk(next_review_on=datetime.now() + timedelta(days=2))
    stored = await RiskService.get(r["risk_id"], SITE)
    assert review_state(stored)["current"] is True
    assert review_state(stored, at=datetime.now() + timedelta(days=5))["current"] is False


@pytest.mark.asyncio
async def test_overdue_reports_what_the_register_is_failing_at(db):
    await _risk(title="Stale", next_review_on=datetime.now() - timedelta(days=5))
    await _risk(title="Fresh", next_review_on=datetime.now() + timedelta(days=90))
    out = await RiskService.overdue(SITE)
    assert [r["title"] for r in out["overdue_review"]] == ["Stale"]
    # Both are material and neither has been audited.
    assert len(out["material_never_audited"]) == 2


# ---------------------------------------------------------- audit plan

@pytest.mark.asyncio
async def test_an_empty_register_produces_an_obviously_useless_plan(db):
    """A register nobody maintains should degrade visibly rather than
    producing a plausible plan."""
    plan = await AuditPlanService.propose_plan(SITE)
    assert plan["proposed"] == []
    assert "nothing to base an audit plan on" in plan["note"]


@pytest.mark.asyncio
async def test_the_plan_ranks_by_risk_then_by_neglect(db):
    """A high risk audited last month should not crowd out a moderate one
    nobody has looked at in two years."""
    high = await _risk(category=RiskCategory.COMPETENCE,
                       residual_likelihood=4, residual_impact=4)
    await _risk(category=RiskCategory.DATA_SECURITY,
                residual_likelihood=3, residual_impact=3)

    # The highest risk was audited recently.
    stored = await RiskService.get(high["risk_id"], SITE)
    stored.last_audited_on = datetime.now() - timedelta(days=20)
    await stored.save()

    plan = await AuditPlanService.propose_plan(SITE, slots=2)
    categories = [p["category"] for p in plan["proposed"]]
    assert categories[0] == RiskCategory.COMPETENCE      # still highest scoring
    # ...but the never-audited area is reported as such, which is what makes
    # the ranking legible rather than arbitrary.
    data_sec = next(p for p in plan["proposed"] if p["category"] == RiskCategory.DATA_SECURITY)
    assert data_sec["never_audited"] is True
    assert "never audited" in data_sec["why"]


@pytest.mark.asyncio
async def test_each_proposal_says_why(db):
    await _risk()
    plan = await AuditPlanService.propose_plan(SITE)
    assert all(p["why"] for p in plan["proposed"])


# --------------------------------------------------------- independence

@pytest.mark.asyncio
async def test_an_auditor_cannot_audit_their_own_area(db):
    """The same failure as an appeal reviewed by the person who made the
    decision, and it fails the same way: quietly, when a small team is busy."""
    await _risk(owner="EMP-TM", category=RiskCategory.COMPETENCE)
    with pytest.raises(HTTPException) as e:
        await AuditPlanService.plan_audit(
            {"title": "Competence review", "auditor": "EMP-TM",
             "scope_categories": [RiskCategory.COMPETENCE]},
            SITE, USER,
        )
    assert e.value.status_code == 409
    assert "cannot audit it" in e.value.detail


@pytest.mark.asyncio
async def test_an_independent_auditor_is_accepted_and_exclusions_recorded(db):
    await _risk(owner="EMP-TM", category=RiskCategory.COMPETENCE)
    await _risk(owner="EMP-QA", category=RiskCategory.DATA_SECURITY,
                title="Backups never restored-tested",
                description="No restore has been attempted.")

    a = await AuditPlanService.plan_audit(
        {"title": "Competence review", "auditor": "EMP-QA",
         "scope_categories": [RiskCategory.COMPETENCE]},
        SITE, USER,
    )
    # What the auditor was excluded from is captured at planning time, so the
    # independence check can be read back against the position as it stood.
    assert a["auditor_excluded_from"] == [RiskCategory.DATA_SECURITY]


@pytest.mark.asyncio
async def test_an_audit_must_say_what_it_tests(db):
    with pytest.raises(HTTPException) as e:
        await AuditPlanService.plan_audit(
            {"title": "Annual audit", "auditor": "EMP-QA"}, SITE, USER
        )
    assert "is a visit" in e.value.detail


@pytest.mark.asyncio
async def test_completing_an_audit_stamps_the_risks_it_tested(db):
    """Without this the next plan cannot tell a tested area from an
    untested one, and the ranking silently stops working."""
    r = await _risk(owner="EMP-TM")
    a = await AuditPlanService.plan_audit(
        {"title": "Competence review", "auditor": "EMP-QA",
         "risks_covered": [r["risk_id"]]},
        SITE, USER,
    )
    out = await AuditPlanService.complete_audit(
        a["audit_id"],
        {"conclusion": "Second inspector authorised; cover is adequate.",
         "findings": ["Authorisation records were not countersigned."]},
        SITE, USER,
    )
    assert out["risks_stamped"] == 1

    stored = await RiskService.get(r["risk_id"], SITE)
    assert stored.last_audited_on is not None

    plan = await AuditPlanService.propose_plan(SITE)
    competence = next(p for p in plan["proposed"]
                      if p["category"] == RiskCategory.COMPETENCE)
    assert competence["never_audited"] is False


@pytest.mark.asyncio
async def test_an_audit_cannot_be_completed_twice(db):
    r = await _risk(owner="EMP-TM")
    a = await AuditPlanService.plan_audit(
        {"title": "x", "auditor": "EMP-QA", "risks_covered": [r["risk_id"]]},
        SITE, USER,
    )
    await AuditPlanService.complete_audit(
        a["audit_id"], {"conclusion": "Done."}, SITE, USER
    )
    with pytest.raises(HTTPException):
        await AuditPlanService.complete_audit(
            a["audit_id"], {"conclusion": "Done again."}, SITE, USER
        )


def test_score_is_the_product():
    assert score(4, 4) == 16
    assert score(1, 5) == 5
