"""Risk and opportunity register.

ISO/IEC 17020:2026 replaced preventive action with risk and opportunity
management, and made internal auditing risk-based. Those two changes are one
change: the register is not a document produced for the assessor, it is the
thing that decides what gets audited.

The part that makes this different from a generic corporate risk register is
impartiality. For an inspection body, impartiality risk is not one category
among several - the standard requires that identified threats be eliminated or
minimised, and work that cannot be brought within tolerance is work the body
does not take. So `ACCEPT` is available for a commercial risk and refused for
an impartiality risk above tolerance. A register that let someone tick
"accepted" on a conflict of interest would be worse than no register, because
it would make the decision look considered.

Scores are 1-5 on each axis, multiplied. Two numbers are kept: inherent (before
controls) and residual (after). Keeping only the residual loses the reason the
controls exist, which is the first thing asked when someone proposes removing
one.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from beanie import Document
from pydantic import BaseModel, Field


class RiskCategory(str, Enum):
    IMPARTIALITY = "IMPARTIALITY"
    COMPETENCE = "COMPETENCE"
    EQUIPMENT = "EQUIPMENT"
    METHOD = "METHOD"
    DATA_SECURITY = "DATA_SECURITY"
    SUBCONTRACTING = "SUBCONTRACTING"
    COMMERCIAL = "COMMERCIAL"
    LEGAL = "LEGAL"
    OPERATIONAL = "OPERATIONAL"
    #: The revision asks for opportunities too, not only threats.
    OPPORTUNITY = "OPPORTUNITY"


class Treatment(str, Enum):
    ACCEPT = "ACCEPT"
    MITIGATE = "MITIGATE"
    TRANSFER = "TRANSFER"
    AVOID = "AVOID"
    #: For opportunities.
    PURSUE = "PURSUE"


class RiskStatus(str, Enum):
    OPEN = "OPEN"
    TREATED = "TREATED"
    ACCEPTED = "ACCEPTED"
    CLOSED = "CLOSED"


#: Above this residual score a risk is material enough to drive the audit plan
#: and to need a named owner's sign-off before it can be accepted.
MATERIAL_THRESHOLD = 9

#: An impartiality risk at or above this cannot be accepted. ISO/IEC 17020
#: requires threats to impartiality to be eliminated or minimised; where they
#: cannot be, the inspection is not performed. "Accepted" is not one of the
#: available answers.
IMPARTIALITY_TOLERANCE = 6


class Control(BaseModel):
    """Something actually in place, not something intended.

    `evidence` is required so that "we have a control" can be checked rather
    than believed - it is the first thing an auditor asks for.
    """

    description: str
    owner: Optional[str] = None
    evidence: Optional[str] = None
    implemented_on: Optional[datetime] = None


class RiskReview(Document):
    """One review of a risk. Append-only.

    Kept separate from the risk so that how the assessment moved over time
    survives, which is what shows the register is live rather than written
    once before an assessment.
    """

    review_id: str                             # RVW-YYYY-XXXX
    risk_id: str
    site_id: str = "SITE-01"
    sequence: int = 1

    reviewed_on: datetime = Field(default_factory=datetime.now)
    reviewed_by: str
    #: What changed and why. A review that records no reasoning is a date.
    note: str
    residual_likelihood: Optional[int] = None
    residual_impact: Optional[int] = None
    status_after: Optional[str] = None
    next_review_on: Optional[datetime] = None

    created_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "risk_reviews"
        indexes = ["site_id", "risk_id", "reviewed_on"]


class Risk(Document):
    risk_id: str                               # RSK-YYYY-XXXX
    site_id: str = "SITE-01"

    title: str
    description: str
    category: str = RiskCategory.OPERATIONAL.value
    #: Where it came from: an audit finding, a complaint, an appeal, a near
    #: miss, a management review. Risks that appear from nowhere tend to be
    #: invented for the assessor.
    source: Optional[str] = None

    inherent_likelihood: int = 3               # 1-5
    inherent_impact: int = 3                   # 1-5
    treatment: str = Treatment.MITIGATE.value
    controls: list[Control] = []
    residual_likelihood: int = 3
    residual_impact: int = 3

    #: A risk with no owner is nobody's.
    owner: str
    status: str = RiskStatus.OPEN.value
    #: Required when a material risk is accepted rather than treated.
    acceptance_rationale: Optional[str] = None
    accepted_by: Optional[str] = None

    next_review_on: Optional[datetime] = None
    last_audited_on: Optional[datetime] = None

    #: What this risk attaches to, where it attaches to something concrete.
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[str] = None

    is_active: bool = True
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "risks"
        indexes = ["site_id", "risk_id", "category", "status"]


class AuditStatus(str, Enum):
    PLANNED = "PLANNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class InternalAudit(Document):
    """An internal audit, planned against the register rather than a calendar.

    The independence rule is the one worth enforcing in code: an auditor may
    not audit their own work. It is the same shape as the appeals rule - the
    person who made the decision cannot be the person who reviews it - and it
    fails the same way in practice, quietly, when a small team is busy.
    """

    audit_id: str                              # IAU-YYYY-XXXX
    site_id: str = "SITE-01"

    title: str
    #: The areas in scope, by risk category.
    scope_categories: list[str] = []
    #: The specific risks this audit is testing. This is what makes it
    #: risk-based rather than a tour of the quality manual.
    risks_covered: list[str] = []

    auditor: str
    #: Areas this auditor owns risks in, captured at planning time so the
    #: independence check is against the position when it was made.
    auditor_excluded_from: list[str] = []

    planned_for: Optional[datetime] = None
    conducted_on: Optional[datetime] = None
    status: str = AuditStatus.PLANNED.value
    findings: list[str] = []
    conclusion: Optional[str] = None

    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "internal_audits"
        indexes = ["site_id", "audit_id", "status"]
