"""Why work did not arrive.

The spec calls this "the main commercial payoff of the whole pre-sales
module", and it is right: a firm that records *why* it declined or lost work
can act on the pattern. A firm that records only "closed" cannot.

The grouping carries the distinction the funnel is built around. NOGO_* codes
are IQE's own decision at gate 1 and point at something IQE could change -
hire an inspector, extend the scope of accreditation, revisit the rate floor.
LOST_* codes are the client's decision at gate 2 and point at the market. A
rollup that mixed them would average a capability gap with a price defeat and
suggest neither remedy.

Codes are data, not an enum, so a site can add one without a deployment; the
defaults are seeded on first use. A code is retired by marking it inactive -
deleting it would orphan the decisions that cite it.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from beanie import Document
from pydantic import Field


class ReasonCode(Document):
    code: str
    group: str
    label: str
    #: What a remedy would have to address. Not decoration: this is the column
    #: a quarterly review reads.
    remedy_hint: Optional[str] = None
    site_id: str = "SITE-01"
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "reason_codes"
        indexes = ["site_id", "code", "group"]


#: group, code, label, remedy hint
DEFAULT_REASON_CODES: list[tuple[str, str, str, str]] = [
    # ---- Gate 1: our decision, and all of it is within IQE's control.
    ("NOGO_SCOPE", "OUTSIDE_ACCREDITATION", "Outside accreditation scope",
     "Extend the scope of accreditation, or subcontract to an accredited body."),
    ("NOGO_SCOPE", "DISCIPLINE_NOT_COVERED", "Discipline not covered",
     "Build or buy the discipline if it recurs."),
    ("NOGO_SCOPE", "UNSAFE_OR_UNINSURABLE", "Unsafe or uninsurable work",
     "No remedy; record so the same enquiry is not re-opened."),

    ("NOGO_RESOURCE", "NO_COMPETENT_INSPECTOR", "No competent inspector",
     "Raise a requisition, or authorise an existing person for the method."),
    ("NOGO_RESOURCE", "NONE_IN_GEOGRAPHY", "No inspector in that geography",
     "Recruit locally, or price the travel and re-approach."),
    ("NOGO_RESOURCE", "CAPACITY_CLASH", "No capacity in the window",
     "Re-approach when the window clears; check whether it was a real clash."),

    ("NOGO_COMMERCIAL", "BELOW_RATE_FLOOR", "Rate below floor",
     "Re-price, or decline consistently so the floor means something."),
    ("NOGO_COMMERCIAL", "PAYMENT_TERMS", "Payment terms unacceptable",
     "Negotiate terms; escalate if the client is otherwise worth having."),
    ("NOGO_COMMERCIAL", "CLIENT_CREDIT_RISK", "Client credit risk",
     "Advance payment or a bank guarantee."),

    ("NOGO_ETHICS", "IMPARTIALITY_CONFLICT", "Impartiality conflict",
     "None - ISO/IEC 17020 cl. 4.1 forbids it. Record and decline."),
    ("NOGO_ETHICS", "PRIOR_DESIGN_INVOLVEMENT", "Prior design involvement",
     "None for this scope; a different scope may still be inspectable."),

    # ---- Gate 2: the client's decision, and mostly outside IQE's control.
    ("LOST_PRICE", "UNDERCUT_BY_COMPETITOR", "Undercut by a competitor",
     "Record the competitor and the gap; it is the only pricing data there is."),
    ("LOST_PRICE", "CLIENT_BUDGET_CUT", "Client budget cut",
     "Park and revive when the budget returns."),

    ("LOST_TECHNICAL", "SPEC_NON_COMPLIANCE", "Specification non-compliance",
     "Find what was missed; it is often answerable next time."),
    ("LOST_TECHNICAL", "CERTIFICATION_NOT_ACCEPTED", "Certification not accepted",
     "Check whether the accreditation the client wanted is obtainable."),

    ("LOST_TIMING", "PROJECT_DEFERRED", "Project deferred",
     "Revive on the client's revised date rather than closing."),
    ("LOST_TIMING", "PROJECT_CANCELLED", "Project cancelled",
     "Close; nothing to remedy."),
    ("LOST_TIMING", "RESPONDED_LATE", "We responded late",
     "Entirely ours. Look at the time from enquiry to issue."),

    ("LOST_RELATIONSHIP", "INCUMBENT_RETAINED", "Incumbent retained",
     "Approach earlier in the next cycle."),
    ("LOST_RELATIONSHIP", "CLIENT_POLICY", "Client policy or panel restriction",
     "Find out what empanelment requires."),
]

NOGO_GROUPS = {"NOGO_SCOPE", "NOGO_RESOURCE", "NOGO_COMMERCIAL", "NOGO_ETHICS"}
LOST_GROUPS = {"LOST_PRICE", "LOST_TECHNICAL", "LOST_TIMING", "LOST_RELATIONSHIP"}


async def seed(site_id: str = "SITE-01") -> int:
    """Insert any default code this site does not have. Idempotent."""
    existing = {
        r.code for r in await ReasonCode.find(ReasonCode.site_id == site_id).to_list()
    }
    new = [
        ReasonCode(code=code, group=group, label=label,
                   remedy_hint=hint, site_id=site_id)
        for group, code, label, hint in DEFAULT_REASON_CODES
        if code not in existing
    ]
    if new:
        await ReasonCode.insert_many(new)
    return len(new)


def group_of(code: str) -> Optional[str]:
    for group, c, _, _ in DEFAULT_REASON_CODES:
        if c == code:
            return group
    return None


def is_nogo_code(code: str) -> bool:
    return (group_of(code) or "") in NOGO_GROUPS


def is_lost_code(code: str) -> bool:
    return (group_of(code) or "") in LOST_GROUPS
