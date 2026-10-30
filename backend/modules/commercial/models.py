"""The commercial envelope around a service order, and the amendments to it.

A service order is a promise with two edges: an amount and a period. Work
drawn against it consumes the first; time consumes the second. Almost every
commercial failure in inspection work is one of those two edges being crossed
without anyone noticing - an inspector attends against an order that expired
last month, or a work package is raised that takes the order past its ceiling,
and the invoice is then unrecoverable because the client never authorised the
excess.

So the envelope is modelled explicitly and enforced, rather than left as two
fields nobody reads.

The distinction the whole module turns on:

* **More money or more time on the same scope is an amendment.** It attaches
  to the existing order, carries the client's authority, and the order's
  effective ceiling and validity move with it.
* **New scope is a new order.** It gets its own envelope, and may inherit the
  previous one's shape, but it does not quietly extend an agreement the client
  signed for something else.

A system that blurs those two ends up with one order that has been amended
fourteen times and no longer resembles what was agreed.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from beanie import Document
from pydantic import BaseModel, Field


class TermType(str, Enum):
    """How the order's period is bounded."""

    #: Runs for a stated window and then stops. The renewal case.
    FIXED_PERIOD = "FIXED_PERIOD"
    #: Runs until the work it covers is finished, however long that takes.
    PROJECT = "PROJECT"
    #: No end date. What the client means by "lifetime" - a standing
    #: arrangement, typically rate-carded, drawn against as work arises.
    OPEN_ENDED = "OPEN_ENDED"


#: Only a fixed period can expire, so only a fixed period can be renewed or
#: extended. Asking to extend an open-ended order is a sign the person means
#: something else, and is refused rather than silently accepted.
EXPIRES = {TermType.FIXED_PERIOD}


class OrderRole(str, Enum):
    """How an order relates to the others.

    The structure most third-party inspection work actually has is a
    framework: one agreement with a client carrying a ceiling and a term,
    drawn against by many call-offs across sites and years. Modelled as flat
    orders, every call-off looks healthy while the framework behind them is
    exhausted - which is discovered when the client refuses the invoice.
    """

    #: An order that stands alone. The default, and most small work.
    STANDALONE = "STANDALONE"
    #: Carries the ceiling and the term; no work is done directly against it.
    FRAMEWORK = "FRAMEWORK"
    #: Draws against a framework. Has its own ceiling, inside the parent's.
    CALL_OFF = "CALL_OFF"


#: Work is done against these. A framework is a container, and a work package
#: raised directly against one would consume the ceiling without appearing in
#: any call-off - the exact invisibility this structure exists to prevent.
TAKES_WORK = {OrderRole.STANDALONE, OrderRole.CALL_OFF}


class AmendmentType(str, Enum):
    #: More money on the same scope. Scenario: a work package would take the
    #: order past its ceiling.
    VALUE_INCREASE = "VALUE_INCREASE"
    #: More time on the same scope and the same money. Scenario: the window
    #: is closing with the inspection not done.
    PERIOD_EXTENSION = "PERIOD_EXTENSION"
    #: A fixed-period order taken into its next term.
    RENEWAL = "RENEWAL"
    #: What is covered changes without the order being replaced. Narrow by
    #: design: a genuinely new scope is a new order.
    SCOPE_CHANGE = "SCOPE_CHANGE"
    #: The rate card moves; the ceiling may or may not move with it.
    RATE_REVISION = "RATE_REVISION"
    #: The order is closed early. Recorded as an amendment because it is a
    #: change to the agreement, and the reason matters later.
    CURTAILMENT = "CURTAILMENT"


#: These change what the order is worth.
MOVES_VALUE = {
    AmendmentType.VALUE_INCREASE,
    AmendmentType.RATE_REVISION,
    AmendmentType.CURTAILMENT,
}

#: These change how long it runs.
MOVES_PERIOD = {
    AmendmentType.PERIOD_EXTENSION,
    AmendmentType.RENEWAL,
    AmendmentType.CURTAILMENT,
}

#: An amendment that can only apply to something with an end date.
NEEDS_AN_END_DATE = {AmendmentType.PERIOD_EXTENSION, AmendmentType.RENEWAL}


class AmendmentStatus(str, Enum):
    #: Raised internally. Changes nothing about the envelope yet.
    PROPOSED = "PROPOSED"
    #: The client has authorised it. Only now does the envelope move.
    APPROVED = "APPROVED"
    #: The client said no, or it was withdrawn. Kept, never deleted.
    REJECTED = "REJECTED"


#: Only an approved amendment moves the envelope. A proposed one is a request,
#: and treating a request as authority is how a body ends up doing work the
#: client never agreed to pay for.
IN_FORCE = {AmendmentStatus.APPROVED}


class Amendment(Document):
    """One authorised change to an order. Append-only: superseded by a later
    amendment, never edited, because the audit question is always "what was
    agreed, and when"."""

    amendment_id: str                              # AMD-YYYY-NNNN
    site_id: str = "SITE-01"
    so_id: str
    sequence: int = 1                              # 1st, 2nd amendment ...

    amendment_type: str
    status: str = AmendmentStatus.PROPOSED.value

    #: What moves. Both optional: a period extension moves no money, a value
    #: increase moves no dates.
    value_delta: float = 0.0                       # may be negative
    new_valid_until: Optional[datetime] = None
    new_rate_basis: Optional[str] = None
    scope_note: Optional[str] = None

    #: Why. Mandatory on every amendment, because an amendment with no reason
    #: is indistinguishable from a mistake when it is read back in two years.
    reason: str

    #: The client's authority. An amendment is a change to a bilateral
    #: agreement; IQE amending its own order unilaterally is not an amendment.
    client_authority: Optional[str] = None         # their letter or email ref
    approved_by_client: Optional[str] = None       # named person
    approved_on: Optional[datetime] = None

    rejected_reason: Optional[str] = None

    #: What prompted it, when the system raised it rather than a person.
    triggered_by: Optional[str] = None             # e.g. "WP-2026-0012"
    trigger_rule: Optional[str] = None             # e.g. "CEILING_BREACH"

    raised_by: Optional[str] = None
    effective_from: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "amendments"
        indexes = ["site_id", "so_id", "status", "amendment_id"]


class RenewalAlert(BaseModel):
    """What the system noticed about an order's expiry. Not stored - computed
    from the order every time it is asked for, so it cannot go stale."""

    expires: bool
    valid_until: Optional[datetime] = None
    days_remaining: Optional[int] = None
    within_lead_time: bool = False
    expired: bool = False
    note: str = ""


class EnvelopeState(BaseModel):
    """Where an order stands against both its edges.

    Computed, never stored. A stored balance is a balance that disagrees with
    the work by Thursday.
    """

    #: Money
    base_value: float = 0.0
    amended_value: float = 0.0                     # sum of approved deltas
    effective_ceiling: float = 0.0
    committed: float = 0.0                         # work packages drawn
    invoiced: float = 0.0
    consumed: float = 0.0                          # the greater of the two
    remaining: float = 0.0
    percent_consumed: float = 0.0
    over_ceiling: bool = False

    #: Time
    term_type: str = TermType.FIXED_PERIOD.value
    valid_from: Optional[datetime] = None
    base_valid_until: Optional[datetime] = None
    effective_valid_until: Optional[datetime] = None
    renewal: Optional[RenewalAlert] = None

    #: Whether work may be drawn against it at all, and if not, why.
    usable: bool = True
    blocked_because: Optional[str] = None

    #: What the numbers imply rather than state.
    burn_per_day: Optional[float] = None
    projected_exhaustion: Optional[datetime] = None
    will_expire_underspent: bool = False
    unbilled_at_risk: float = 0.0

    amendment_count: int = 0

    #: Where this order sits in a framework, if it is in one.
    order_role: str = OrderRole.STANDALONE.value
    parent_so_id: Optional[str] = None
    #: Framework only: what its call-offs have carved out and used.
    call_off_count: int = 0
    #: Call-off only: how much room is left in the parent, which may be less
    #: than this order's own remaining. The binding constraint is whichever
    #: is smaller, and reporting only the local figure is what lets a
    #: framework be exhausted invisibly.
    parent_remaining: Optional[float] = None

    note: str = ""
