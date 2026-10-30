"""The pre-sales funnel: PEOPLE_AND_PRESALES_SPEC.md Part A.

What these guard is not "the happy path works" but the three things the spec
says the old free-string `status` could not express:

* a no-go and a loss are different events with different remedies,
* a quotation the client holds is never edited, only superseded,
* a decision that overrides its own scorecard has to say why.

Each of those is a rule someone will eventually want to bypass under time
pressure, which is exactly why they are tested.
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
from modules.enquiries.models import (  # noqa: E402
    ALLOWED_TRANSITIONS,
    Enquiry,
    EnquiryStatus,
    GoNoGoDecision,
    ProposalRevision,
    ProposalStatus,
)
from modules.enquiries.reason_codes import ReasonCode  # noqa: E402
from modules.enquiries.service import (  # noqa: E402
    DEFAULT_CRITERIA,
    EnquiryService,
    PipelineService,
)
from modules.jobs.models import Job  # noqa: E402

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
        database=client["presales_test"],
        document_models=[
            Enquiry, GoNoGoDecision, ProposalRevision, ReasonCode,
            Job, AuditEntry, Sequence,
        ],
    )
    yield client


async def _enquiry(**kw) -> Enquiry:
    data = {"client_id": "CLI-001", "pipeline_value": 500000,
            "probability_pct": 50, **kw}
    return await EnquiryService.create(data, SITE, USER)


def _scorecard(score: int = 4) -> list[dict]:
    return [
        {"code": code, "label": label, "weight": weight, "score": score}
        for code, label, weight in DEFAULT_CRITERIA
    ]


async def _to_pending(eq: Enquiry) -> None:
    await EnquiryService.build_scorecard(eq.enquiry_id, SITE, USER, auto_score=False)


# ------------------------------------------------------------ state machine

@pytest.mark.asyncio
async def test_an_enquiry_starts_in_draft_with_its_history_begun(db):
    eq = await _enquiry()
    assert eq.status == EnquiryStatus.DRAFT
    assert eq.enquiry_id.startswith("ENQ-")
    assert [t.to_status for t in eq.status_history] == [EnquiryStatus.DRAFT]


@pytest.mark.asyncio
async def test_an_illegal_transition_is_refused_and_says_what_is_allowed(db):
    eq = await _enquiry()
    with pytest.raises(HTTPException) as e:
        # Straight from draft to won, skipping both gates.
        await EnquiryService.advance(eq.enquiry_id, EnquiryStatus.WON, SITE, USER)
    assert e.value.status_code == 409
    # The message has to be actionable, not just a refusal.
    assert "qualifying" in e.value.detail


@pytest.mark.asyncio
async def test_a_terminal_status_goes_nowhere(db):
    for status in (EnquiryStatus.CONVERTED, EnquiryStatus.CLOSED_LOST,
                   EnquiryStatus.CLOSED_NO_BID):
        assert ALLOWED_TRANSITIONS[status] == set()


@pytest.mark.asyncio
async def test_every_status_is_reachable_from_draft(db):
    """A state nothing can reach is a state that will never be tested in
    production either."""
    reached, frontier = {EnquiryStatus.DRAFT.value}, [EnquiryStatus.DRAFT.value]
    while frontier:
        for nxt in ALLOWED_TRANSITIONS.get(frontier.pop(), set()):
            if nxt not in reached:
                reached.add(nxt)
                frontier.append(nxt)
    unreachable = {s.value for s in EnquiryStatus} - reached
    assert not unreachable, f"unreachable from draft: {sorted(unreachable)}"


# -------------------------------------------------------------- gate 1

@pytest.mark.asyncio
async def test_a_no_go_without_a_reason_code_is_refused(db):
    eq = await _enquiry()
    await _to_pending(eq)
    with pytest.raises(HTTPException) as e:
        await EnquiryService.decide(
            eq.enquiry_id,
            {"decision": "no_go", "criteria": _scorecard(1)},
            SITE, USER,
        )
    assert e.value.status_code == 400
    assert "reason code" in e.value.detail


@pytest.mark.asyncio
async def test_overriding_the_scorecard_requires_a_reason(db):
    eq = await _enquiry()
    await _to_pending(eq)
    # A strong scorecard recommends go; deciding no_go contradicts it.
    with pytest.raises(HTTPException) as e:
        await EnquiryService.decide(
            eq.enquiry_id,
            {"decision": "no_go", "criteria": _scorecard(5),
             "reason_codes": ["BELOW_RATE_FLOOR"]},
            SITE, USER,
        )
    assert "override needs a reason" in e.value.detail

    decision = await EnquiryService.decide(
        eq.enquiry_id,
        {"decision": "no_go", "criteria": _scorecard(5),
         "reason_codes": ["BELOW_RATE_FLOOR"],
         "override_reason": "Client's framework rate is 18% under our floor."},
        SITE, USER,
    )
    # Both numbers survive, which is the point of recording them separately.
    assert decision["recommendation"] == "go"
    assert decision["decision"] == "no_go"
    assert decision["override_reason"]


@pytest.mark.asyncio
async def test_a_lost_code_cannot_be_used_to_decline_a_bid(db):
    """The two taxonomies must not mix: a LOST_* code on a no-go would make
    the loss-analysis rollup meaningless."""
    eq = await _enquiry()
    await _to_pending(eq)
    with pytest.raises(HTTPException) as e:
        await EnquiryService.decide(
            eq.enquiry_id,
            {"decision": "no_go", "criteria": _scorecard(1),
             "reason_codes": ["UNDERCUT_BY_COMPETITOR"]},
            SITE, USER,
        )
    assert "not why we declined" in e.value.detail


@pytest.mark.asyncio
async def test_unscored_criteria_drag_the_recommendation_down(db):
    """An unanswered "is there an impartiality conflict" must not be quietly
    excused from the denominator."""
    eq = await _enquiry()
    await _to_pending(eq)
    partial = _scorecard(5)
    for c in partial[2:]:
        c["score"] = None
    decision = await EnquiryService.decide(
        eq.enquiry_id,
        {"decision": "no_go", "criteria": partial,
         "reason_codes": ["NO_COMPETENT_INSPECTOR"]},
        SITE, USER,
    )
    assert decision["recommendation"] == "no_go"
    assert decision["weighted_score"] < decision["max_score"]


@pytest.mark.asyncio
async def test_a_no_go_can_be_remediated_and_re_decided(db):
    """The remedy loop - the path the old model could not express at all."""
    eq = await _enquiry()
    await _to_pending(eq)
    await EnquiryService.decide(
        eq.enquiry_id,
        {"decision": "no_go", "criteria": _scorecard(1),
         "reason_codes": ["NO_COMPETENT_INSPECTOR"],
         "remediation_plan": "Authorise two inspectors for UT Level II."},
        SITE, USER,
    )
    await EnquiryService.remediate(
        eq.enquiry_id,
        {"remediation_plan": "Two inspectors authorised on 2026-11-10."},
        SITE, USER,
    )
    second = await EnquiryService.decide(
        eq.enquiry_id, {"decision": "go", "criteria": _scorecard(4)}, SITE, USER
    )
    assert second["sequence"] == 2

    # Both decisions survive; the first is not overwritten.
    decisions = await GoNoGoDecision.find(
        GoNoGoDecision.enquiry_id == eq.enquiry_id
    ).to_list()
    assert len(decisions) == 2
    assert {d.decision for d in decisions} == {"go", "no_go"}

    refreshed = await EnquiryService.get(eq.enquiry_id, SITE)
    assert refreshed.status == EnquiryStatus.GO


@pytest.mark.asyncio
async def test_remediation_without_a_plan_is_refused(db):
    eq = await _enquiry()
    await _to_pending(eq)
    await EnquiryService.decide(
        eq.enquiry_id,
        {"decision": "no_go", "criteria": _scorecard(1),
         "reason_codes": ["CAPACITY_CLASH"]},
        SITE, USER,
    )
    with pytest.raises(HTTPException):
        await EnquiryService.remediate(eq.enquiry_id, {}, SITE, USER)


# ------------------------------------------------------------- proposals

async def _won_enquiry() -> Enquiry:
    eq = await _enquiry()
    await _to_pending(eq)
    await EnquiryService.decide(
        eq.enquiry_id, {"decision": "go", "criteria": _scorecard(4)}, SITE, USER
    )
    return await EnquiryService.get(eq.enquiry_id, SITE)


@pytest.mark.asyncio
async def test_the_total_is_computed_not_accepted(db):
    """A quotation whose total does not follow from its own line items cannot
    be defended, so the number a caller sends is not trusted."""
    eq = await _won_enquiry()
    rev = await EnquiryService.create_proposal(
        eq.enquiry_id,
        {"inspector_cost": 100000, "travel_cost": 20000,
         "overhead_pct": 10, "margin_pct": 15,
         "total_value": 1},            # a lie, and ignored
        SITE, USER,
    )
    # (100000 + 20000) * 1.10 * 1.15
    assert rev["total_value"] == pytest.approx(151800.0)


@pytest.mark.asyncio
async def test_an_issued_revision_is_frozen_and_the_next_supersedes_it(db):
    eq = await _won_enquiry()
    rev0 = await EnquiryService.create_proposal(
        eq.enquiry_id, {"inspector_cost": 100000}, SITE, USER
    )
    await EnquiryService.issue_revision(rev0["proposal_id"], 0, SITE, USER)

    # Issuing twice is refused: what the client holds does not change.
    with pytest.raises(HTTPException) as e:
        await EnquiryService.issue_revision(rev0["proposal_id"], 0, SITE, USER)
    assert "already" in e.value.detail

    rev1 = await EnquiryService.add_revision(
        rev0["proposal_id"],
        {"inspector_cost": 90000, "change_summary": "Rate reduced after review."},
        SITE, USER,
    )
    assert rev1["revision_no"] == 1

    stored0 = await ProposalRevision.find_one(
        ProposalRevision.proposal_id == rev0["proposal_id"],
        ProposalRevision.revision_no == 0,
    )
    # Rev 0 still carries the price the client received.
    assert stored0.total_value == rev0["total_value"]
    assert stored0.status == ProposalStatus.SUPERSEDED


@pytest.mark.asyncio
async def test_a_revision_needs_a_change_summary(db):
    eq = await _won_enquiry()
    rev0 = await EnquiryService.create_proposal(
        eq.enquiry_id, {"inspector_cost": 100000}, SITE, USER
    )
    with pytest.raises(HTTPException) as e:
        await EnquiryService.add_revision(
            rev0["proposal_id"], {"inspector_cost": 90000}, SITE, USER
        )
    assert "change summary" in e.value.detail


@pytest.mark.asyncio
async def test_a_revision_carries_forward_what_was_not_restated(db):
    eq = await _won_enquiry()
    rev0 = await EnquiryService.create_proposal(
        eq.enquiry_id,
        {"inspector_cost": 100000, "travel_cost": 20000, "margin_pct": 15,
         "estimated_mandays": 12},
        SITE, USER,
    )
    rev1 = await EnquiryService.add_revision(
        rev0["proposal_id"],
        {"margin_pct": 10, "change_summary": "Margin trimmed."},
        SITE, USER,
    )
    assert rev1["travel_cost"] == 20000      # not restated, carried
    assert rev1["estimated_mandays"] == 12
    assert rev1["margin_pct"] == 10          # restated, changed


@pytest.mark.asyncio
async def test_a_second_proposal_on_one_enquiry_is_refused(db):
    eq = await _won_enquiry()
    await EnquiryService.create_proposal(eq.enquiry_id, {}, SITE, USER)
    with pytest.raises(HTTPException) as e:
        await EnquiryService.create_proposal(eq.enquiry_id, {}, SITE, USER)
    assert "already has proposal" in e.value.detail


# --------------------------------------------------------------- gate 2

@pytest.mark.asyncio
async def test_a_loss_needs_a_reason_and_keeps_the_competitor(db):
    eq = await _won_enquiry()
    rev = await EnquiryService.create_proposal(
        eq.enquiry_id, {"inspector_cost": 100000}, SITE, USER
    )
    await EnquiryService.issue_revision(rev["proposal_id"], 0, SITE, USER)

    with pytest.raises(HTTPException):
        await EnquiryService.record_outcome(
            eq.enquiry_id, {"outcome": "lost"}, SITE, USER
        )

    out = await EnquiryService.record_outcome(
        eq.enquiry_id,
        {"outcome": "lost", "reason_codes": ["UNDERCUT_BY_COMPETITOR"],
         "competitor_names": ["TUV"]},
        SITE, USER,
    )
    assert out["status"] == EnquiryStatus.LOST
    assert out["competitor_names"] == ["TUV"]


@pytest.mark.asyncio
async def test_a_lost_enquiry_can_be_revived_without_erasing_the_loss(db):
    eq = await _won_enquiry()
    rev = await EnquiryService.create_proposal(eq.enquiry_id, {}, SITE, USER)
    await EnquiryService.issue_revision(rev["proposal_id"], 0, SITE, USER)
    await EnquiryService.record_outcome(
        eq.enquiry_id,
        {"outcome": "lost", "reason_codes": ["PROJECT_DEFERRED"]},
        SITE, USER,
    )
    revived = await EnquiryService.revive(eq.enquiry_id, {}, SITE, USER)
    assert revived["status"] == EnquiryStatus.REVIVED
    # The loss is still in the history and the reason still on the record.
    assert EnquiryStatus.LOST in [t["to_status"] for t in revived["status_history"]]
    assert revived["outcome_reason_codes"] == ["PROJECT_DEFERRED"]


@pytest.mark.asyncio
async def test_closing_files_the_right_kind_of_ending(db):
    """A no-bid and a loss must not be filed as each other, whatever the
    caller passes - the status decides, not the request body."""
    declined = await _enquiry()
    await _to_pending(declined)
    await EnquiryService.decide(
        declined.enquiry_id,
        {"decision": "no_go", "criteria": _scorecard(1),
         "reason_codes": ["IMPARTIALITY_CONFLICT"]},
        SITE, USER,
    )
    out = await EnquiryService.close(declined.enquiry_id, {}, SITE, USER)
    assert out["status"] == EnquiryStatus.CLOSED_NO_BID

    lost = await _won_enquiry()
    rev = await EnquiryService.create_proposal(lost.enquiry_id, {}, SITE, USER)
    await EnquiryService.issue_revision(rev["proposal_id"], 0, SITE, USER)
    await EnquiryService.record_outcome(
        lost.enquiry_id,
        {"outcome": "lost", "reason_codes": ["CLIENT_BUDGET_CUT"]},
        SITE, USER,
    )
    out = await EnquiryService.close(lost.enquiry_id, {}, SITE, USER)
    assert out["status"] == EnquiryStatus.CLOSED_LOST


# --------------------------------------------------------------- convert

@pytest.mark.asyncio
async def test_a_won_enquiry_becomes_a_job_budgeted_at_the_awarded_revision(db):
    eq = await _won_enquiry()
    rev = await EnquiryService.create_proposal(
        eq.enquiry_id, {"inspector_cost": 200000, "margin_pct": 20}, SITE, USER
    )
    await EnquiryService.issue_revision(rev["proposal_id"], 0, SITE, USER)
    await EnquiryService.record_outcome(
        eq.enquiry_id, {"outcome": "won", "award_reference": "LOI/2026/44"},
        SITE, USER,
    )
    result = await EnquiryService.convert(
        eq.enquiry_id, {"title": "Pipeline inspection"}, SITE, USER
    )

    job = await Job.find_one(Job.job_id == result["job_id"])
    assert job.client_id == eq.client_id
    # The budget follows the revision the client awarded, not a re-keyed number.
    assert job.budget_contract_amount == pytest.approx(240000.0)
    assert f"enquiry:{eq.enquiry_id}" in job.tags

    # Converting twice would create a second job for one award.
    with pytest.raises(HTTPException) as e:
        await EnquiryService.convert(eq.enquiry_id, {}, SITE, USER)
    assert "already" in e.value.detail


@pytest.mark.asyncio
async def test_an_unwon_enquiry_does_not_convert(db):
    eq = await _won_enquiry()          # status GO, not WON
    with pytest.raises(HTTPException) as e:
        await EnquiryService.convert(eq.enquiry_id, {}, SITE, USER)
    assert e.value.status_code == 409


# -------------------------------------------------------------- pipeline

@pytest.mark.asyncio
async def test_declined_work_is_not_counted_as_lost(db):
    """Folding gate-1 no-bids into the win rate would make a disciplined
    decision to decline look like a commercial defeat."""
    declined = await _enquiry()
    await _to_pending(declined)
    await EnquiryService.decide(
        declined.enquiry_id,
        {"decision": "no_go", "criteria": _scorecard(1),
         "reason_codes": ["OUTSIDE_ACCREDITATION"]},
        SITE, USER,
    )

    won = await _won_enquiry()
    rev = await EnquiryService.create_proposal(won.enquiry_id, {}, SITE, USER)
    await EnquiryService.issue_revision(rev["proposal_id"], 0, SITE, USER)
    await EnquiryService.record_outcome(won.enquiry_id, {"outcome": "won"}, SITE, USER)

    summary = await PipelineService.summary(SITE)
    assert summary["no_bid_count"] == 1
    assert summary["bid_count"] == 1        # only the one that was bid
    assert summary["win_rate_pct"] == 100.0


@pytest.mark.asyncio
async def test_loss_analysis_keeps_the_two_gates_apart(db):
    declined = await _enquiry()
    await _to_pending(declined)
    await EnquiryService.decide(
        declined.enquiry_id,
        {"decision": "no_go", "criteria": _scorecard(1),
         "reason_codes": ["NO_COMPETENT_INSPECTOR"]},
        SITE, USER,
    )

    lost = await _won_enquiry()
    rev = await EnquiryService.create_proposal(lost.enquiry_id, {}, SITE, USER)
    await EnquiryService.issue_revision(rev["proposal_id"], 0, SITE, USER)
    await EnquiryService.record_outcome(
        lost.enquiry_id,
        {"outcome": "lost", "reason_codes": ["UNDERCUT_BY_COMPETITOR"]},
        SITE, USER,
    )

    analysis = await PipelineService.loss_analysis(SITE)
    ours = {r["code"] for r in analysis["we_declined"]}
    theirs = {r["code"] for r in analysis["client_did_not_award"]}
    assert ours == {"NO_COMPETENT_INSPECTOR"}
    assert theirs == {"UNDERCUT_BY_COMPETITOR"}
    # Each line says what could be done about it.
    assert all(r["remedy_hint"] for r in analysis["we_declined"])


@pytest.mark.asyncio
async def test_a_zero_on_a_disqualifying_criterion_outranks_the_total(db):
    """An impartiality conflict is forbidden by ISO/IEC 17020 cl. 4.1 however
    attractive the rest of the work is. A weighted average would let six good
    scores outvote it, which is the wrong answer for a criterion that makes
    the inspection impossible to perform or certify."""
    for code in ("SCOPE_FIT", "COMPETENCE", "IMPARTIALITY"):
        eq = await _enquiry()
        await _to_pending(eq)
        card = _scorecard(5)
        for c in card:
            if c["code"] == code:
                c["score"] = 0
        decision = await EnquiryService.decide(
            eq.enquiry_id,
            {"decision": "no_go", "criteria": card,
             "reason_codes": ["OUTSIDE_ACCREDITATION"]},
            SITE, USER,
        )
        # Everything else scored 5, so the total is high - and it still
        # recommends no-go, which means no override reason was needed.
        assert decision["recommendation"] == "no_go", f"{code} did not disqualify"
        assert decision["weighted_score"] / decision["max_score"] > 0.6


@pytest.mark.asyncio
async def test_a_zero_on_a_weighted_criterion_does_not_disqualify_on_its_own(db):
    """The counterpart: a weak commercial position is a trade-off, not a bar."""
    eq = await _enquiry()
    await _to_pending(eq)
    card = _scorecard(5)
    for c in card:
        if c["code"] == "COMMERCIAL":
            c["score"] = 0
    decision = await EnquiryService.decide(
        eq.enquiry_id, {"decision": "go", "criteria": card}, SITE, USER
    )
    assert decision["recommendation"] == "go"
