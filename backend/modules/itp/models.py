"""Inspection and Test Plans: hold points, witness points, and the calls
against them.

This is how inspection demand actually arrives in third-party inspection, and
it was the largest gap in the flow. The client's ITP marks each activity with
an intervention point; the contractor gives notice before reaching one; IQE
confirms and attends. Everything downstream — the visit, the report, the
certificate — follows from a call against a point.

The `/itps` screen existed with four hardcoded numbers and no backend at all,
so the system could not answer "what inspections are due next week" except by
someone typing them in.

**What makes a hold point a hold point** is not that it is important. It is
that the work cannot lawfully proceed past it without the inspection body, and
that only the party who imposed it — the client — can waive it. A system where
IQE can wave its own hold point has not modelled a hold point; it has modelled
a reminder. So:

* a HOLD point is waived only with the client's authority recorded against it,
* a HOLD point that passed unattended and unwaived blocks the work package,
* a WITNESS point may be declined by IQE and the work proceeds, which is
  exactly the difference and is why the two are not one field with a flag.

Intervention type drives behaviour here the way work type drives it elsewhere:
new client conventions are configuration, not new code.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from beanie import Document
from pydantic import BaseModel, Field


class InterventionType(str, Enum):
    """The four marks that appear on every ITP in this industry."""

    HOLD = "H"        # work stops; cannot proceed without the inspection body
    WITNESS = "W"     # notified and may attend; work proceeds either way
    REVIEW = "R"      # documents reviewed after the fact, no attendance
    MONITOR = "M"     # attendance at discretion, no notice obligation


#: Attendance is owed. The distinction the whole module turns on.
REQUIRES_ATTENDANCE = {InterventionType.HOLD, InterventionType.WITNESS}
#: Work physically stops. Only HOLD.
BLOCKS_PROGRESS = {InterventionType.HOLD}

#: Default contractual notice, in days, by intervention type. Overridden per
#: point, because a client's contract is the authority and this is only what
#: the industry does when the contract is silent.
DEFAULT_NOTICE_DAYS = {
    InterventionType.HOLD: 5,
    InterventionType.WITNESS: 3,
    InterventionType.REVIEW: 0,
    InterventionType.MONITOR: 0,
}


class ITPStatus(str, Enum):
    DRAFT = "DRAFT"
    #: Agreed with the client. Points cannot be edited after this without a
    #: revision, because the ITP is a contractual document.
    APPROVED = "APPROVED"
    SUPERSEDED = "SUPERSEDED"


class CallStatus(str, Enum):
    RAISED = "RAISED"               # the contractor has given notice
    ACKNOWLEDGED = "ACKNOWLEDGED"   # IQE has seen it
    CONFIRMED = "CONFIRMED"         # an inspector is assigned and attending
    ATTENDED = "ATTENDED"           # the inspection happened
    DECLINED = "DECLINED"           # witness point IQE will not attend
    WAIVED = "WAIVED"               # the client released the point
    MISSED = "MISSED"               # the date passed with nobody there
    CANCELLED = "CANCELLED"         # the contractor withdrew it


OPEN_CALL_STATUSES = {
    CallStatus.RAISED, CallStatus.ACKNOWLEDGED, CallStatus.CONFIRMED,
}


class CallOutcome(str, Enum):
    ACCEPTED = "ACCEPTED"
    ACCEPTED_WITH_COMMENTS = "ACCEPTED_WITH_COMMENTS"
    REJECTED = "REJECTED"
    NOT_READY = "NOT_READY"         # the work was not at the stage claimed


class ITPPoint(BaseModel):
    """One line of the plan."""

    point_id: str                                  # e.g. "4.3.2" from the client's ITP
    sequence: int = 0
    activity: str
    discipline: Optional[str] = None               # Civil, Mechanical, Welding, NDT

    #: The document the work is inspected against, at a revision. Getting this
    #: wrong — inspecting to Rev B when the client issued Rev C — is among the
    #: most expensive mistakes in this industry, so the revision is a field
    #: rather than a note.
    reference_document: Optional[str] = None
    reference_revision: Optional[str] = None
    acceptance_criteria: Optional[str] = None

    intervention: str = InterventionType.WITNESS.value
    #: Who else attends. Recorded because a hold point released without the
    #: client present is a different event from one they attended.
    client_intervention: Optional[str] = None      # the client's own H/W/R/M
    contractor_responsible: Optional[str] = None

    notice_days: Optional[int] = None              # None → the type's default
    verifying_document: Optional[str] = None       # what the point produces

    is_active: bool = True


class InspectionTestPlan(Document):
    itp_id: str                                    # ITP-YYYY-XXXX
    site_id: str = "SITE-01"
    job_id: str
    client_id: Optional[str] = None

    title: str
    #: The client's own reference and revision for this plan.
    client_reference: Optional[str] = None
    revision: str = "Rev 0"
    status: str = ITPStatus.DRAFT.value

    points: list[ITPPoint] = []

    approved_by: Optional[str] = None
    approved_on: Optional[datetime] = None
    supersedes_itp_id: Optional[str] = None

    #: Set when the points came from a document rather than being keyed in, so
    #: a reviewer knows which ones to check hardest.
    extracted_from_document: Optional[str] = None
    extraction_confirmed_by: Optional[str] = None

    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "inspection_test_plans"
        indexes = ["site_id", "itp_id", "job_id", "status"]


class InspectionCall(Document):
    """A contractor's notice that work is reaching an intervention point."""

    call_id: str                                   # ICN-YYYY-XXXX
    site_id: str = "SITE-01"
    itp_id: str
    point_id: str
    job_id: str
    work_package_id: Optional[str] = None

    intervention: str = InterventionType.WITNESS.value
    activity: str
    discipline: Optional[str] = None

    raised_by: Optional[str] = None                # the contractor's representative
    raised_on: datetime = Field(default_factory=datetime.now)
    requested_date: datetime
    location: Optional[str] = None

    #: Notice actually given, and what was owed. Both stored: a short-notice
    #: call is the thing a contractor disputes afterwards, and recomputing it
    #: later from dates that have since been edited proves nothing.
    notice_given_days: Optional[float] = None
    notice_required_days: Optional[int] = None
    short_notice: bool = False

    status: str = CallStatus.RAISED.value
    assigned_person_id: Optional[str] = None
    assigned_on: Optional[datetime] = None

    attended_on: Optional[datetime] = None
    outcome: Optional[str] = None
    outcome_note: Optional[str] = None
    visit_id: Optional[str] = None
    ncr_refs: list[str] = []

    #: Waiver. A hold point needs the client's authority; the service refuses
    #: to let IQE waive one on its own say-so.
    waived_by: Optional[str] = None
    waiver_authority: Optional[str] = None         # the client's reference
    waived_on: Optional[datetime] = None
    waiver_reason: Optional[str] = None

    declined_reason: Optional[str] = None
    cancelled_reason: Optional[str] = None

    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "inspection_calls"
        indexes = [
            "site_id", "call_id", "itp_id", "job_id", "status",
            "requested_date", "assigned_person_id",
        ]
