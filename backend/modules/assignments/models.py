"""Assignment — putting an inspection officer on a work package.

Two things make this different from a simple foreign key:

1. Eligibility is a hard gate, not a weighted factor. A nearby, available,
   lightly-loaded inspector who is not authorized for the inspection type scores
   zero, not sixty percent. Weighted-sum scoring alone would surface that person.

2. The authorization evidence is snapshotted onto the assignment rather than
   derived live. A certificate valid on the inspection date but expired now must
   still show the inspection was validly performed.

See SOW_EXECUTION_ARCHITECTURE.md sections 3.2 and 5.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from beanie import Document
from pydantic import BaseModel, Field


class AssignmentRole(str, Enum):
    INSPECTION_OFFICER = "INSPECTION_OFFICER"
    LEAD_INSPECTOR = "LEAD_INSPECTOR"
    QUANTITY_SURVEYOR = "QUANTITY_SURVEYOR"
    BILL_VERIFIER = "BILL_VERIFIER"
    QC_REVIEWER = "QC_REVIEWER"
    WITNESS = "WITNESS"
    TRAINEE_UNDER_SUPERVISION = "TRAINEE_UNDER_SUPERVISION"


class AssignmentStatus(str, Enum):
    PROPOSED = "proposed"
    PENDING_CLIENT_APPROVAL = "pending_client_approval"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    ACTIVE = "active"
    COMPLETED = "completed"
    WITHDRAWN = "withdrawn"


ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    AssignmentStatus.PROPOSED.value: {"pending_client_approval", "accepted", "withdrawn"},
    AssignmentStatus.PENDING_CLIENT_APPROVAL.value: {"accepted", "rejected", "withdrawn"},
    AssignmentStatus.ACCEPTED.value: {"active", "withdrawn"},
    AssignmentStatus.REJECTED.value: {"proposed", "withdrawn"},   # propose someone else
    AssignmentStatus.ACTIVE.value: {"completed", "withdrawn"},
    AssignmentStatus.COMPLETED.value: set(),
    AssignmentStatus.WITHDRAWN.value: set(),
}


class AssignmentMethod(str, Enum):
    MANUAL = "manual"
    AI_RECOMMENDED = "ai_recommended"   # engine ranked, a person chose
    AI_AUTO = "ai_auto"                 # engine assigned above threshold


class ScoreBreakdown(BaseModel):
    """Why a candidate scored what they did. Every score must be explainable."""
    skill_depth: float = 0.0
    proximity: float = 0.0
    availability: float = 0.0
    workload: float = 0.0
    past_performance: float = 0.0
    total: float = 0.0
    narrative: Optional[str] = None


class ConsideredCandidate(BaseModel):
    """Audit trail of who else was in the running."""
    person_id: str
    full_name: Optional[str] = None
    score: float = 0.0
    rank: int = 0


class Assignment(Document):
    assignment_id: str                     # ASG-YYYY-XXXX
    site_id: str = "SITE-01"
    work_package_id: str
    job_id: str
    person_id: str
    person_name: Optional[str] = None

    role: str = AssignmentRole.INSPECTION_OFFICER.value
    is_primary: bool = True
    supervised_by_person_id: Optional[str] = None   # required for TRAINEE_*

    # provenance — how this person came to be here
    assigned_by: Optional[str] = None
    assignment_method: str = AssignmentMethod.MANUAL.value
    ai_score: Optional[float] = None
    ai_breakdown: Optional[ScoreBreakdown] = None
    ai_rationale: Optional[str] = None
    alternatives_considered: list[ConsideredCandidate] = []

    # eligibility evidence captured AT ASSIGNMENT TIME, not derived later
    authorization_id: Optional[str] = None
    authorization_valid_until: Optional[datetime] = None
    inspection_types_covered: list[str] = []
    impartiality_checked: bool = False
    impartiality_conflict_found: bool = False

    planned_from: Optional[datetime] = None
    planned_to: Optional[datetime] = None

    status: str = AssignmentStatus.PROPOSED.value
    client_approval_required: bool = False
    client_approved_at: Optional[datetime] = None
    client_remarks: Optional[str] = None
    withdrawn_reason: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "assignments"
        indexes = [
            "site_id", "work_package_id", "person_id", "status", "planned_from", "job_id",
        ]


# --------------------------------------------------------------- the engine

#: Weights for ranking among already-eligible candidates. These never decide
#: eligibility — see score_candidate.
WEIGHTS = {
    "skill_depth": 0.40,
    "proximity": 0.25,
    "availability": 0.20,
    "workload": 0.10,
    "past_performance": 0.05,
}


def check_eligibility(
    person: dict,
    authorization: Optional[dict],
    required_inspection_types: list[str],
    work_from: Optional[datetime],
    has_impartiality_conflict: bool,
    has_calendar_clash: bool,
) -> tuple[bool, Optional[str]]:
    """Stage one: the hard gate. Returns (eligible, reason_if_not).

    Nothing here is weighted or tradeable. Failing any check means the person
    cannot do this work, however convenient they otherwise are.
    """
    if not person.get("deployable"):
        return False, person.get("deployability_reason") or "Not deployable"

    if not authorization:
        return False, "No current authorization"

    covered = set(authorization.get("inspection_types") or [])
    missing = set(required_inspection_types) - covered
    if missing:
        return False, f"Not authorized for {', '.join(sorted(missing))}"

    valid_until = authorization.get("valid_until")
    if valid_until and work_from and valid_until < work_from:
        return False, f"Authorization lapses {valid_until:%d %b %Y}, before the work starts"

    if has_impartiality_conflict:
        return False, "Impartiality conflict with this client or vendor"

    if has_calendar_clash:
        return False, "Already committed in this window"

    return True, None


def score_candidate(
    skill_depth: float,
    proximity: float,
    availability: float,
    workload: float,
    past_performance: float,
) -> ScoreBreakdown:
    """Stage two: rank the eligible. Each input is 0.0–1.0.

    This only ever runs on candidates that already passed check_eligibility, so
    a high score can never substitute for being authorized.
    """
    clamp = lambda v: max(0.0, min(1.0, float(v)))  # noqa: E731
    parts = {
        "skill_depth": clamp(skill_depth) * WEIGHTS["skill_depth"],
        "proximity": clamp(proximity) * WEIGHTS["proximity"],
        "availability": clamp(availability) * WEIGHTS["availability"],
        "workload": clamp(workload) * WEIGHTS["workload"],
        "past_performance": clamp(past_performance) * WEIGHTS["past_performance"],
    }
    total = round(sum(parts.values()), 4)
    return ScoreBreakdown(**{k: round(v, 4) for k, v in parts.items()}, total=total)


def should_auto_assign(
    ranked: list[dict], threshold: Optional[float], min_margin: float = 0.05
) -> tuple[bool, str]:
    """Whether the engine may assign without a human.

    Three modes, selected by the work type's auto_assign_threshold:

    * ``None``  - recommend only; a human always assigns.
    * ``0.0``   - full auto: assign the top-ranked candidate whenever anyone is
      eligible. The hard eligibility gate still runs, so this means "the best
      eligible person, without review" and never "anyone". The near-tie guard
      is deliberately skipped here: when two candidates are equally ranked and
      both eligible, either is a correct choice, and falling back to a human
      would make the mode quietly partial.
    * ``> 0.0`` - auto above a confidence threshold, with a clear gap to second
      place. A near-tie is a decision for a coordinator, not a machine.
    """
    if threshold is None:
        return False, "Auto-assign is off for this work type"
    if not ranked:
        return False, "No eligible candidates"
    top = ranked[0]["score"]
    if threshold == 0.0:
        return True, (
            f"Full auto: {len(ranked)} eligible, assigning top-ranked "
            f"candidate (score {top})"
        )
    if top < threshold:
        return False, f"Top score {top} is below the {threshold} threshold"
    if len(ranked) > 1:
        margin = round(top - ranked[1]["score"], 4)
        if margin < min_margin:
            return False, f"Top two are within {margin}; too close to decide automatically"
    return True, f"Top score {top} clears {threshold}"
