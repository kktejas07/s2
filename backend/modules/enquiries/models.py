"""Pre-sales: the gated funnel from enquiry to work order.

PEOPLE_AND_PRESALES_SPEC.md Part A. The existing model carried a free-string
`status` defaulting to "pending", which cannot express the thing that matters
most about this pipeline: **there are two different "no"s and they are not
interchangeable.**

A NO_GO is IQE declining to bid - outside accreditation scope, no competent
inspector in that geography, rate below the floor, an impartiality conflict.
The remedy is to fix the constraint and re-approach. A LOST is the client
awarding elsewhere. The remedy is to re-price or wait for the project to
revive. Collapsing both into "closed" destroys the firm's only record of why
work does not arrive, which is the commercial payoff of modelling this at all.

Two further decisions the spec is explicit about:

**Revisions are immutable.** In tendering a resubmission is never an edit; it
is Rev 0, Rev 1, Rev 2, each with its own price and date, because that is how
the client refers to it in correspondence and how a dispute is settled two
years later. Overwriting a quotation in place is the most damaging modelling
error in this domain, so `issue()` freezes a revision and the next change
copies it forward.

**Go/No-Go is scored, not toggled.** A weighted scorecard takes under a
minute, produces a defensible record, and accumulates into the firm's best
source of pricing intelligence. Where the human overrides the score, the
reason is mandatory - an override with no rationale is the decision nobody can
defend later.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from beanie import Document
from pydantic import BaseModel, Field


class EnquiryStatus(str, Enum):
    DRAFT = "draft"
    QUALIFYING = "qualifying"
    PENDING_DECISION = "pending_decision"
    # Gate 1 outcomes - our decision.
    NO_GO = "no_go"
    REMEDIATION = "remediation"
    CLOSED_NO_BID = "closed_no_bid"
    GO = "go"
    # Estimation and proposal.
    ESTIMATING = "estimating"
    PROPOSAL_DRAFT = "proposal_draft"
    SUBMITTED = "submitted"
    UNDER_CLARIFICATION = "under_clarification"
    # Gate 2 outcomes - the client's decision.
    LOST = "lost"
    REVIVED = "revived"
    CLOSED_LOST = "closed_lost"
    WON = "won"
    CONVERTED = "converted"


#: The state machine, exactly as drawn in the spec. Anything not listed here is
#: refused, so a status cannot be set to something the funnel has no path to.
ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    EnquiryStatus.DRAFT: {EnquiryStatus.QUALIFYING},
    EnquiryStatus.QUALIFYING: {EnquiryStatus.PENDING_DECISION},
    EnquiryStatus.PENDING_DECISION: {EnquiryStatus.GO, EnquiryStatus.NO_GO},
    # The remedy loop: a no-go is not an ending unless someone closes it.
    EnquiryStatus.NO_GO: {EnquiryStatus.REMEDIATION, EnquiryStatus.CLOSED_NO_BID},
    EnquiryStatus.REMEDIATION: {EnquiryStatus.PENDING_DECISION, EnquiryStatus.CLOSED_NO_BID},
    EnquiryStatus.GO: {EnquiryStatus.ESTIMATING},
    EnquiryStatus.ESTIMATING: {EnquiryStatus.PROPOSAL_DRAFT},
    EnquiryStatus.PROPOSAL_DRAFT: {EnquiryStatus.SUBMITTED},
    EnquiryStatus.SUBMITTED: {
        EnquiryStatus.UNDER_CLARIFICATION,
        EnquiryStatus.WON,
        EnquiryStatus.LOST,
    },
    # A clarification produces a new revision, which is submitted again.
    EnquiryStatus.UNDER_CLARIFICATION: {EnquiryStatus.SUBMITTED, EnquiryStatus.LOST},
    EnquiryStatus.LOST: {EnquiryStatus.REVIVED, EnquiryStatus.CLOSED_LOST},
    EnquiryStatus.REVIVED: {EnquiryStatus.SUBMITTED, EnquiryStatus.CLOSED_LOST},
    EnquiryStatus.WON: {EnquiryStatus.CONVERTED},
    # Terminal.
    EnquiryStatus.CONVERTED: set(),
    EnquiryStatus.CLOSED_NO_BID: set(),
    EnquiryStatus.CLOSED_LOST: set(),
}

#: Where the funnel stops counting as live pipeline.
TERMINAL_STATUSES = {
    EnquiryStatus.CONVERTED,
    EnquiryStatus.CLOSED_NO_BID,
    EnquiryStatus.CLOSED_LOST,
}


class EnquirySource(str, Enum):
    TENDER_PORTAL = "tender_portal"
    DIRECT = "direct"
    REPEAT_CLIENT = "repeat_client"
    REFERRAL = "referral"
    OTHER = "other"


class EnquiryCategory(BaseModel):
    """A line of the enquiry's scope. Reused as a proposal line item."""

    enquiry_category_id: str
    sno: Optional[int] = None
    details: str
    scope: Optional[str] = None
    uom: Optional[str] = None
    qty: float = 0.0
    applicable_codes: Optional[str] = None
    qualification: Optional[str] = None
    experience: Optional[str] = None
    duration: Optional[str] = None
    budget: float = 0.0
    remarks: Optional[str] = None
    #: Set on a proposal line; absent on the enquiry's own scope.
    rate: Optional[float] = None


class StatusTransition(BaseModel):
    """One move through the funnel. Appended, never rewritten - the sequence
    of states is as much a record as the states themselves."""

    from_status: Optional[str] = None
    to_status: str
    at: datetime = Field(default_factory=datetime.now)
    by: Optional[str] = None
    note: Optional[str] = None


class ScorecardCriterion(BaseModel):
    """One weighted line of the bid/no-bid scorecard.

    `auto_score` is kept separate from `score` on purpose: when a human
    disagrees with the system, both numbers survive, and the gap between them
    over time is what says whether the scoring is any good.
    """

    code: str
    label: str
    weight: float = 1.0
    score: Optional[int] = None          # 0-5; None = not yet assessed
    auto_score: Optional[int] = None
    auto_rationale: Optional[str] = None
    remarks: Optional[str] = None


class GoNoGoDecision(Document):
    """Gate 1. One per decision - a re-run after remediation is sequence 2."""

    decision_id: str                     # GNG-YYYY-XXXX
    enquiry_id: str
    site_id: str = "SITE-01"
    sequence: int = 1

    criteria: list[ScorecardCriterion] = []
    weighted_score: float = 0.0
    max_score: float = 0.0
    recommendation: str                  # go | no_go - what the score said
    decision: str                        # go | no_go - what the human said
    #: Mandatory when decision != recommendation. Enforced in the service.
    override_reason: Optional[str] = None
    #: Mandatory on a no_go: "we declined" with no reason is not a record.
    reason_codes: list[str] = []

    decided_by: str
    decided_at: datetime = Field(default_factory=datetime.now)

    remediation_plan: Optional[str] = None
    remediation_owner: Optional[str] = None
    remediation_due: Optional[datetime] = None
    linked_requisition_id: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "go_no_go_decisions"
        indexes = ["site_id", "enquiry_id", "decision_id", "decision"]


class ProposalStatus(str, Enum):
    DRAFT = "draft"
    ISSUED = "issued"
    SUPERSEDED = "superseded"


class ProposalRevision(Document):
    """One revision of a quotation. Immutable once issued.

    A proposal_id groups the revisions; revision_no orders them. Rev 0 is the
    first submission, and every clarification produces the next number rather
    than editing what the client already has.
    """

    proposal_id: str                     # QTN-YYYY-XXXX
    revision_no: int = 0
    enquiry_id: str
    site_id: str = "SITE-01"
    status: str = ProposalStatus.DRAFT.value

    currency: str = "INR"
    line_items: list[EnquiryCategory] = []

    estimated_mandays: float = 0.0
    inspector_cost: float = 0.0
    travel_cost: float = 0.0
    overhead_pct: float = 0.0
    margin_pct: float = 0.0
    total_value: float = 0.0

    validity_days: int = 30
    issued_at: Optional[datetime] = None
    issued_by: Optional[str] = None
    #: Why this revision exists. Required from Rev 1 onward - "what changed
    #: between Rev 2 and Rev 3" is the first question in any dispute.
    change_summary: Optional[str] = None
    document_id: Optional[str] = None

    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "proposal_revisions"
        indexes = ["site_id", "enquiry_id", "proposal_id", "status"]


class Enquiry(Document):
    enquiry_id: str
    client_id: str
    site_id: str = "SITE-01"

    enquiry_date: Optional[datetime] = None
    category: Optional[str] = None
    quotation_no: Optional[str] = None
    proposal_owner: Optional[str] = None
    categories: list[EnquiryCategory] = []

    status: str = EnquiryStatus.DRAFT.value
    status_history: list[StatusTransition] = []

    #: Pre-sales intelligence. pipeline_value times probability_pct is the
    #: weighted forecast; both are the firm's own estimate, not a client figure.
    source: str = EnquirySource.DIRECT.value
    pipeline_value: float = 0.0
    probability_pct: int = 0
    expected_award_date: Optional[datetime] = None
    competitor_names: list[str] = []

    current_proposal_id: Optional[str] = None
    current_revision_no: Optional[int] = None
    #: Why it ended, whichever way it ended.
    outcome_reason_codes: list[str] = []
    award_reference: Optional[str] = None
    won_job_id: Optional[str] = None

    is_active: bool = True
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "enquiries"
        indexes = ["site_id", "enquiry_id", "client_id", "status"]
