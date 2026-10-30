"""External providers: who IQE relies on, and whether that reliance is defensible.

ISO/IEC 17020:2026 broadened the controls on externally provided products and
services and made a register of providers mandatory. The 2012 edition treated
subcontracting more narrowly; the revision covers anything the inspection
result depends on - a subcontracted inspector, the laboratory that calibrates
the gauges, a specialist NDT house, a hired crawler camera.

There is already an `Associate` record in modules/users. It is a payee: bank
account, PAN, mileage rate, cost. It says nothing about whether the associate
is competent, accredited, approved, or still approved. Those are different
questions and they belong in a different record, so this links to the
Associate rather than extending it - the finance view of a provider and the
quality view of one have no reason to share a lifecycle.

Three decisions worth stating:

**Approval expires.** An approval granted in 2019 that nobody has revisited is
not evidence of monitoring, it is evidence of its absence. `approval_state` is
computed from the review date the same way equipment calibration is computed
from its due date - a stored "approved" flag is wrong the morning after.

**Accreditation is tracked separately from approval.** IQE can approve a
provider commercially while that provider's own accreditation lapses. For a
calibration laboratory that matters acutely: the traceability chain behind
every measurement IQE certifies runs through it, and a lapsed lab breaks the
chain retroactively.

**The client has to agree to subcontracted inspection.** That consent is a
record, not an assumption, so it is held per job and the service refuses to
record subcontracted work on a job that has none.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from beanie import Document
from pydantic import BaseModel, Field


class ProviderCategory(str, Enum):
    INSPECTION_SUBCONTRACT = "INSPECTION_SUBCONTRACT"
    CALIBRATION_LAB = "CALIBRATION_LAB"
    TESTING_LAB = "TESTING_LAB"
    NDT_SERVICE = "NDT_SERVICE"
    EQUIPMENT_HIRE = "EQUIPMENT_HIRE"
    TRAINING = "TRAINING"
    SOFTWARE_OR_DATA = "SOFTWARE_OR_DATA"
    OTHER = "OTHER"


#: Categories whose output feeds a measurement IQE certifies. For these the
#: provider's own accreditation is the traceability chain, so a lapse is not a
#: paperwork problem - it undermines results already issued.
TRACEABILITY_CRITICAL = {
    ProviderCategory.CALIBRATION_LAB,
    ProviderCategory.TESTING_LAB,
    ProviderCategory.NDT_SERVICE,
}


class ProviderStatus(str, Enum):
    PENDING_EVALUATION = "PENDING_EVALUATION"
    APPROVED = "APPROVED"
    #: Approved for a narrower scope, or subject to conditions.
    CONDITIONAL = "CONDITIONAL"
    SUSPENDED = "SUSPENDED"
    #: Never deleted. A removed provider's past work still has to be explicable.
    REMOVED = "REMOVED"


USABLE_STATUSES = {ProviderStatus.APPROVED, ProviderStatus.CONDITIONAL}


class EvaluationOutcome(str, Enum):
    APPROVED = "APPROVED"
    APPROVED_WITH_CONDITIONS = "APPROVED_WITH_CONDITIONS"
    REJECTED = "REJECTED"


class Accreditation(BaseModel):
    """The provider's own accreditation, where it has one."""

    body: str                                  # NABL, UKAS, A2LA, ...
    certificate_number: Optional[str] = None
    scope_reference: Optional[str] = None      # which methods and ranges
    valid_until: Optional[datetime] = None


class EvaluationRecord(Document):
    """One evaluation of a provider. Append-only, like the audit trail.

    Kept as its own document rather than a list on the provider so that the
    history survives whatever happens to the provider record, and so the
    reviewer's reasoning is a first-class thing rather than a field that the
    next evaluation overwrites.
    """

    evaluation_id: str                         # PEV-YYYY-XXXX
    provider_id: str
    site_id: str = "SITE-01"
    sequence: int = 1

    evaluated_on: datetime = Field(default_factory=datetime.now)
    evaluated_by: str
    #: What was actually checked. Free-form on purpose: what matters for a
    #: calibration lab is not what matters for a subcontracted inspector.
    criteria_assessed: list[str] = []
    outcome: str = EvaluationOutcome.APPROVED.value
    conditions: Optional[str] = None
    #: Why. An outcome with no reasoning is not an evaluation.
    rationale: str
    approved_services: list[str] = []
    next_review_on: Optional[datetime] = None

    created_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "provider_evaluations"
        indexes = ["site_id", "provider_id", "evaluated_on"]


class PerformanceRecord(Document):
    """Monitoring between evaluations.

    The revision asks for providers to be monitored, not merely approved once.
    These are the observations that make the next evaluation evidence-based
    instead of a re-signature.
    """

    record_id: str                             # PMR-YYYY-XXXX
    provider_id: str
    site_id: str = "SITE-01"

    observed_on: datetime = Field(default_factory=datetime.now)
    observed_by: str
    job_id: Optional[str] = None
    work_package_id: Optional[str] = None
    #: -2 to +2. Deliberately small and signed: a five-point scale invites a
    #: default of 3, which records nothing.
    rating: int = 0
    note: str
    #: Set when the observation is serious enough to act on before the next
    #: scheduled review.
    triggers_review: bool = False

    created_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "provider_performance"
        indexes = ["site_id", "provider_id", "observed_on"]


class SubcontractConsent(Document):
    """The client's agreement to subcontracted inspection on a job.

    ISO/IEC 17020 has always required the client to be informed and to agree.
    Holding it as a record rather than an assumption means the service can
    refuse to log subcontracted work where no consent exists, which is the
    only way the requirement survives a busy week.
    """

    consent_id: str                            # PSC-YYYY-XXXX
    site_id: str = "SITE-01"
    job_id: str
    provider_id: str

    granted: bool = True
    granted_by: str                            # the client's representative
    granted_on: datetime = Field(default_factory=datetime.now)
    scope: Optional[str] = None                # what may be subcontracted
    reference: Optional[str] = None            # email, letter, contract clause
    recorded_by: Optional[str] = None
    withdrawn_on: Optional[datetime] = None
    withdrawn_reason: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "subcontract_consents"
        indexes = ["site_id", "job_id", "provider_id"]


class ExternalProvider(Document):
    provider_id: str                           # PRV-YYYY-XXXX
    site_id: str = "SITE-01"

    name: str
    category: str = ProviderCategory.OTHER.value
    #: What this provider is approved to do. Empty means nothing is approved
    #: yet, not that everything is.
    approved_services: list[str] = []

    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

    accreditation: Optional[Accreditation] = None

    status: str = ProviderStatus.PENDING_EVALUATION.value
    status_reason: Optional[str] = None
    #: Computed from the latest evaluation, not set by hand.
    approved_on: Optional[datetime] = None
    next_review_on: Optional[datetime] = None
    conditions: Optional[str] = None

    #: The finance-side record for the same organisation, where one exists.
    #: Linked rather than merged: a payee and an approved provider are
    #: different questions with different lifecycles.
    associate_id: Optional[str] = None

    is_active: bool = True
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "external_providers"
        indexes = ["site_id", "provider_id", "category", "status"]
