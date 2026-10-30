"""Appeals against an inspection decision.

ISO/IEC 17020 treats appeals and complaints as different things, and the
distinction is substantive rather than terminological:

* A **complaint** (clause 7.5) is dissatisfaction with the service - a late
  report, an unprofessional inspector, a billing error. `modules/complaints`
  already handles these.
* An **appeal** (clause 7.6) contests the *inspection decision itself*. A
  contractor whose weld was rejected, or whose claimed quantity was deducted,
  is not complaining about service; they are saying the technical conclusion
  was wrong.

They need different handling. An appeal must be decided by people who were not
involved in the original decision, because an inspector reviewing their own
rejection is not an independent review - which is the whole point of the
clause. That is enforced here rather than left to procedure: recording a
decision by anyone who took part in the original is refused.

An appeal is also attached to the record it contests, so the outcome can be
traced back to the certification or work package that caused it.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from beanie import Document
from pydantic import Field


class AppealGrounds(str, Enum):
    """What the appellant says is wrong. Chosen from a list because 'the
    inspector was wrong' is not reviewable, while these are."""
    TECHNICAL_JUDGEMENT = "TECHNICAL_JUDGEMENT"      # the acceptance decision
    MEASUREMENT_DISPUTE = "MEASUREMENT_DISPUTE"      # quantity or dimension
    CODE_INTERPRETATION = "CODE_INTERPRETATION"      # which clause applies
    DEDUCTION_DISPUTE = "DEDUCTION_DISPUTE"          # value deducted from a claim
    SCOPE_DISPUTE = "SCOPE_DISPUTE"                  # what was contracted
    PROCEDURAL = "PROCEDURAL"                        # the process was not followed
    OTHER = "OTHER"


class AppealStatus(str, Enum):
    RECEIVED = "RECEIVED"
    UNDER_REVIEW = "UNDER_REVIEW"
    UPHELD = "UPHELD"            # the appellant was right; the decision changes
    PARTIALLY_UPHELD = "PARTIALLY_UPHELD"
    REJECTED = "REJECTED"        # the original decision stands
    WITHDRAWN = "WITHDRAWN"      # the appellant withdrew it


#: Terminal states. An appeal in one of these is not re-decided; a further
#: challenge is a new appeal, so the history of each decision stays intact.
CLOSED_STATUSES = {
    AppealStatus.UPHELD.value,
    AppealStatus.PARTIALLY_UPHELD.value,
    AppealStatus.REJECTED.value,
    AppealStatus.WITHDRAWN.value,
}


class Appeal(Document):
    appeal_id: str
    site_id: str = "SITE-01"

    #: What is being contested. Same addressing as the audit trail and
    #: evidence, so an appeal attaches to a certification, a work package or a
    #: visit without three separate models.
    entity_type: str                      # certification | work_package | visit
    entity_id: str
    job_id: Optional[str] = None

    appellant_name: str
    appellant_organisation: Optional[str] = None
    appellant_contact: Optional[str] = None

    grounds: str = AppealGrounds.TECHNICAL_JUDGEMENT.value
    statement: str                        # what they say is wrong, and why
    received_date: datetime = Field(default_factory=datetime.now)

    #: Everyone who took part in the decision being contested. Populated when
    #: the appeal is raised and used to refuse a non-independent review.
    original_decision_by: list[str] = []

    status: str = AppealStatus.RECEIVED.value
    reviewers: list[str] = []             # who is conducting the review
    acknowledged_at: Optional[datetime] = None

    outcome: Optional[str] = None         # the reasoning, in full
    decided_by: Optional[str] = None
    decided_at: Optional[datetime] = None
    #: What changed as a result - a superseding certification, a re-inspection.
    remedy_reference: Optional[str] = None

    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "appeals"
        indexes = ["site_id", "entity_type", "entity_id", "status", "appeal_id", "job_id"]
