"""Certification — the link between verified work and an invoice.

Unifies what modules/schedule_m_pharma_epc (claimed_qty / verified_qty) and
modules/construction_bill_verification (claimed_amount / verified_payable_amount)
each model separately: a contractor claims a quantity, IQE verifies it, and the
difference is an itemised deduction with reasons.

The certified_value this produces is what billing keys off. Where the work type
sets certification_required_before_billing, no invoice line may be raised until a
certification here is issued.

See SOW_EXECUTION_ARCHITECTURE.md section 4.2.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from beanie import Document
from pydantic import BaseModel, Field


class CertificationStatus(str, Enum):
    DRAFT = "draft"
    ISSUED = "issued"
    DISPUTED = "disputed"
    SUPERSEDED = "superseded"   # replaced by a later revision
    #: Temporarily not to be relied on - the conditions it was issued against
    #: have lapsed, or something has come to light that is still being
    #: investigated. Reversible.
    SUSPENDED = "suspended"
    #: Permanently void. Not reversible: a certificate that should never have
    #: been issued is replaced by a corrected one, never quietly reinstated.
    WITHDRAWN = "withdrawn"


#: What a certificate in each state means to someone holding it. The public
#: verification endpoint returns this wording rather than the raw status,
#: because "superseded" tells a layperson nothing about whether to rely on it.
PUBLIC_MEANING: dict[str, str] = {
    CertificationStatus.DRAFT: "Not issued. This is not a valid IQE certificate.",
    CertificationStatus.ISSUED: "Valid and in force.",
    CertificationStatus.DISPUTED: (
        "Issued, but under dispute. Contact IQE before relying on it."
    ),
    CertificationStatus.SUPERSEDED: (
        "Replaced by a later revision. Ask the holder for the current one."
    ),
    CertificationStatus.SUSPENDED: (
        "Suspended. Do not rely on this certificate while it is suspended."
    ),
    CertificationStatus.WITHDRAWN: (
        "Withdrawn. This certificate is void and must not be relied on."
    ),
}

#: States in which a certificate should not be relied on. Everything that is
#: not plainly in force is listed here deliberately: the default for a public
#: verification is caution, not optimism.
NOT_IN_FORCE = {
    CertificationStatus.DRAFT,
    CertificationStatus.SUSPENDED,
    CertificationStatus.WITHDRAWN,
    CertificationStatus.SUPERSEDED,
}


class LifecycleEvent(BaseModel):
    """One change in whether a certificate is in force.

    Append-only. Suspension is reversible and withdrawal is not, but both
    have to stay on the record either way: the question asked later is never
    "is it valid now" but "was it valid on the day we relied on it".
    """

    event: str                      # SUSPENDED | RESTORED | WITHDRAWN
    at: datetime = Field(default_factory=datetime.now)
    by: Optional[str] = None
    reason: str
    status_before: Optional[str] = None
    status_after: Optional[str] = None


class DeductionReason(str, Enum):
    """Why claimed quantity was not certified in full."""
    NOT_EXECUTED = "NOT_EXECUTED"              # claimed but not done
    QUALITY_REJECTED = "QUALITY_REJECTED"      # done but failed acceptance
    MEASUREMENT_VARIANCE = "MEASUREMENT_VARIANCE"  # joint measurement differs
    RATE_VARIANCE = "RATE_VARIANCE"            # rate applied is not contractual
    DUPLICATE_CLAIM = "DUPLICATE_CLAIM"        # already certified in an earlier bill
    OUTSIDE_SCOPE = "OUTSIDE_SCOPE"            # not in the BOQ or approved variation
    MATERIAL_SHORTFALL = "MATERIAL_SHORTFALL"  # ledger reconciliation gap
    DOCUMENTATION_MISSING = "DOCUMENTATION_MISSING"
    OTHER = "OTHER"


class DeductionLine(BaseModel):
    reason_code: str
    quantity: float = 0.0
    value: float = 0.0
    narrative: Optional[str] = None
    evidence_ref: Optional[str] = None


class CertificationLineItem(BaseModel):
    """One BOQ item / measured line within a certification."""
    line_id: str
    boq_item_ref: Optional[str] = None
    description: str
    uom: Optional[str] = None
    rate: float = 0.0

    claimed_quantity: float = 0.0
    certified_quantity: float = 0.0

    previous_certified_quantity: float = 0.0   # cumulative position before this cert
    remarks: Optional[str] = None

    @property
    def rejected_quantity(self) -> float:
        return round(self.claimed_quantity - self.certified_quantity, 4)

    @property
    def claimed_value(self) -> float:
        return round(self.claimed_quantity * self.rate, 2)

    @property
    def certified_value(self) -> float:
        return round(self.certified_quantity * self.rate, 2)


class Certification(Document):
    certification_id: str                   # CERT-YYYY-XXXX
    site_id: str = "SITE-01"
    work_package_id: str
    job_id: str

    # revision chain - certifications get revised, never silently edited
    revision_no: int = 0
    supersedes_certification_id: Optional[str] = None

    # what is being certified against
    reference_bill_no: Optional[str] = None       # contractor RA bill reference
    period_from: Optional[datetime] = None
    period_to: Optional[datetime] = None

    line_items: list[CertificationLineItem] = []
    deductions: list[DeductionLine] = []

    # rolled up from line items by the service - stored so historical figures
    # stay fixed even if a rate master changes later
    claimed_quantity: float = 0.0
    certified_quantity: float = 0.0
    rejected_quantity: float = 0.0
    uom: Optional[str] = None

    claimed_value: float = 0.0
    certified_value: float = 0.0            # the number billing keys off
    deduction_value: float = 0.0
    currency: str = "INR"

    # EPC contracts commonly retain a percentage against defects
    retention_pct: float = 0.0
    retention_value: float = 0.0
    net_payable_value: float = 0.0          # certified less retention

    measurement_sheet_refs: list[str] = []
    ncr_ids: list[str] = []
    evidence_document_ids: list[str] = []

    status: str = CertificationStatus.DRAFT.value
    prepared_by: Optional[str] = None

    #: See WorkPackage.migrated_from_ref - "<collection>:<record key>".
    migrated_from_ref: Optional[str] = None

    #: Optimistic lock. A caller that read version N must present N to save;
    #: see core/concurrency.py.
    version: int = 0
    certified_by_person_id: Optional[str] = None
    certified_at: Optional[datetime] = None
    dispute_note: Optional[str] = None

    #: Suspension and withdrawal. Reason is mandatory at the service layer -
    #: a certificate pulled out of force without a recorded reason cannot be
    #: explained to the holder, who is the person it hurts.
    suspended_at: Optional[datetime] = None
    suspended_by: Optional[str] = None
    suspension_reason: Optional[str] = None
    withdrawn_at: Optional[datetime] = None
    withdrawn_by: Optional[str] = None
    withdrawal_reason: Optional[str] = None
    #: Append-only: every suspension, restoration and withdrawal, so the
    #: question "was this in force on 14 October" has an answer.
    lifecycle_events: list["LifecycleEvent"] = []

    # set when an invoice consumes this certification, so the same certified
    # value cannot be billed twice
    billed_invoice_id: Optional[str] = None
    billed_at: Optional[datetime] = None

    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "certifications"
        indexes = [
            "site_id",
            "work_package_id",
            "job_id",
            "status",
            "certification_id",
            "billed_invoice_id",
            "migrated_from_ref",
        ]
