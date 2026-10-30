"""Nonconformity reports: what IQE found wrong, and what was done about it.

`Certification.ncr_ids` and `InspectionCall.ncr_refs` were both lists of
strings pointing at nothing. The only real NCR structure in the codebase was
embedded in the pharma vertical as a plain model, usable by one work type and
nothing else. So a certificate could be issued carrying NCR references that
resolved to no record, which is worse than carrying none: it reads as though
the nonconformities were tracked.

Two rules define this module, and both are versions of a rule that already
holds elsewhere in the system.

**Use-as-is is the client's call.** When work does not meet the specification,
the contractor may propose to leave it as it is. That is a concession against
the client's own specification, and neither the contractor nor IQE can grant
it - IQE's job is to report the deviation, not to decide the client will live
with it. This is the same line as a hold point waiver, for the same reason.

**The raiser does not close it.** A nonconformity is closed by verifying that
the corrective action worked, and verification is a separate act from
asserting completion. The contractor says it is fixed; IQE checks.
"""
from __future__ import annotations

from datetime import datetime, timedelta
from enum import Enum
from typing import Optional

from beanie import Document
from pydantic import BaseModel, Field


class Severity(str, Enum):
    #: Safety, or a defect that cannot be corrected once work proceeds.
    CRITICAL = "CRITICAL"
    #: Fails the specification and must be corrected.
    MAJOR = "MAJOR"
    #: Departs from the specification without affecting fitness for purpose.
    MINOR = "MINOR"
    #: Not a nonconformity. Recorded so it is not re-raised as one.
    OBSERVATION = "OBSERVATION"


#: How long before the correction is overdue. Hours, because a critical
#: nonconformity on a live site is not a next-week problem.
TARGET_HOURS = {
    Severity.CRITICAL: 24,
    Severity.MAJOR: 72,
    Severity.MINOR: 720,          # 30 days
    Severity.OBSERVATION: 0,      # no clock
}

#: An observation is a note, not a finding. It does not block anything and
#: does not need a disposition.
BLOCKS_CERTIFICATION = {Severity.CRITICAL, Severity.MAJOR}


class Disposition(str, Enum):
    #: Bring it back to specification.
    REWORK = "REWORK"
    #: Make it fit for purpose without fully meeting the specification.
    REPAIR = "REPAIR"
    #: Leave it. A concession against the client's specification.
    USE_AS_IS = "USE_AS_IS"
    #: Remove it.
    SCRAP = "SCRAP"
    #: The finding was wrong.
    REJECT_FINDING = "REJECT_FINDING"


#: A concession against the client's own specification. Neither the
#: contractor nor IQE can grant one.
NEEDS_CLIENT_CONCESSION = {Disposition.USE_AS_IS, Disposition.REPAIR}


class NCRStatus(str, Enum):
    OPEN = "OPEN"
    #: A disposition has been proposed and is awaiting acceptance.
    DISPOSITION_PROPOSED = "DISPOSITION_PROPOSED"
    #: Accepted; the correction is being carried out.
    IN_CORRECTION = "IN_CORRECTION"
    #: The contractor says it is done. Not yet checked.
    AWAITING_VERIFICATION = "AWAITING_VERIFICATION"
    CLOSED = "CLOSED"
    #: Raised in error, with a reason. Never deleted.
    VOID = "VOID"


OPEN_STATUSES = {
    NCRStatus.OPEN, NCRStatus.DISPOSITION_PROPOSED,
    NCRStatus.IN_CORRECTION, NCRStatus.AWAITING_VERIFICATION,
}

ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    NCRStatus.OPEN.value: {
        NCRStatus.DISPOSITION_PROPOSED.value, NCRStatus.VOID.value,
    },
    NCRStatus.DISPOSITION_PROPOSED.value: {
        NCRStatus.IN_CORRECTION.value, NCRStatus.OPEN.value,
        NCRStatus.CLOSED.value,          # a rejected finding closes here
        NCRStatus.VOID.value,
    },
    NCRStatus.IN_CORRECTION.value: {
        NCRStatus.AWAITING_VERIFICATION.value, NCRStatus.VOID.value,
    },
    NCRStatus.AWAITING_VERIFICATION.value: {
        NCRStatus.CLOSED.value,
        NCRStatus.IN_CORRECTION.value,   # verification failed; back it goes
    },
    NCRStatus.CLOSED.value: set(),       # terminal
    NCRStatus.VOID.value: set(),
}


class NCREvent(BaseModel):
    """Append-only. What happened, when, and who said so."""

    sequence: int
    at: datetime = Field(default_factory=datetime.now)
    actor: Optional[str] = None
    from_status: Optional[str] = None
    to_status: str
    note: Optional[str] = None


class NCR(Document):
    ncr_id: str                                    # NCR-YYYY-NNNN
    site_id: str = "SITE-01"

    job_id: Optional[str] = None
    work_package_id: Optional[str] = None
    #: Where it was found. A nonconformity raised at a hold point is the most
    #: expensive kind, because work is stopped behind it.
    inspection_call_id: Optional[str] = None
    certification_id: Optional[str] = None

    client_id: Optional[str] = None
    manufacturer_id: Optional[str] = None
    #: Who has to fix it. Often the manufacturer, sometimes a subcontractor.
    responsible_party: Optional[str] = None

    title: str
    description: str
    discipline: Optional[str] = None
    location: Optional[str] = None

    #: What it fails against. The revision matters: inspecting to Rev B when
    #: the client issued Rev C is among the most expensive mistakes in this
    #: industry, and an NCR that does not name the revision cannot be argued
    #: either way.
    requirement_source: Optional[str] = None
    requirement_revision: Optional[str] = None
    requirement_clause: Optional[str] = None

    #: What was actually observed, as distinct from the conclusion drawn.
    objective_evidence: Optional[str] = None
    evidence_ids: list[str] = []

    severity: str = Severity.MAJOR.value
    status: str = NCRStatus.OPEN.value

    raised_by: Optional[str] = None
    raised_on: datetime = Field(default_factory=datetime.now)
    due_by: Optional[datetime] = None

    #: The disposition the responsible party proposed, and who agreed it.
    disposition: Optional[str] = None
    disposition_proposed_by: Optional[str] = None
    disposition_note: Optional[str] = None
    #: Required for a concession. The client's reference, not IQE's.
    concession_authority: Optional[str] = None
    concession_approved_by: Optional[str] = None

    root_cause: Optional[str] = None
    corrective_action: Optional[str] = None
    #: Stopping it happening again, as opposed to fixing this instance.
    preventive_action: Optional[str] = None

    #: Closure. Verified by someone other than whoever asserted completion.
    verified_by: Optional[str] = None
    verified_on: Optional[datetime] = None
    verification_note: Optional[str] = None
    verification_evidence_ids: list[str] = []

    void_reason: Optional[str] = None
    history: list[NCREvent] = []

    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "ncrs"
        indexes = ["site_id", "status", "job_id", "ncr_id", "severity"]


def target_due(severity: str, raised: datetime) -> Optional[datetime]:
    hours = TARGET_HOURS.get(Severity(severity), 0)
    return raised + timedelta(hours=hours) if hours else None
