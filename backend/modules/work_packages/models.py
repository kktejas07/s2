"""Work packages.

A WorkPackage is the unit of work that assignment, measurement, certification and
billing all hang off. It replaces the thin embedded Job.scope_of_work checklist,
which could not carry a type, a schedule position, a rate or a status.

See SOW_EXECUTION_ARCHITECTURE.md section 3.1.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from beanie import Document
from pydantic import BaseModel, Field


class WorkPackageStatus(str, Enum):
    PLANNED = "planned"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    UNDER_QC = "under_qc"
    CERTIFIED = "certified"
    BILLED = "billed"
    CLOSED = "closed"
    ON_HOLD = "on_hold"
    CANCELLED = "cancelled"


# Permitted transitions. Anything not listed is rejected by the service, so a
# package cannot be billed before it is certified.
ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    WorkPackageStatus.PLANNED.value:     {"assigned", "on_hold", "cancelled"},
    WorkPackageStatus.ASSIGNED.value:    {"in_progress", "planned", "on_hold", "cancelled"},
    WorkPackageStatus.IN_PROGRESS.value: {"submitted", "on_hold", "cancelled"},
    WorkPackageStatus.SUBMITTED.value:   {"under_qc", "in_progress"},
    WorkPackageStatus.UNDER_QC.value:    {"certified", "in_progress"},      # rework goes back
    WorkPackageStatus.CERTIFIED.value:   {"billed", "under_qc"},            # re-open for revision
    WorkPackageStatus.BILLED.value:      {"closed", "certified"},
    WorkPackageStatus.CLOSED.value:      set(),
    WorkPackageStatus.ON_HOLD.value:     {"planned", "assigned", "in_progress", "cancelled"},
    WorkPackageStatus.CANCELLED.value:   set(),
}


class StatusTransition(BaseModel):
    from_status: Optional[str] = None
    to_status: str
    changed_by: Optional[str] = None
    changed_at: datetime = Field(default_factory=datetime.now)
    reason: Optional[str] = None


class WorkPackage(Document):
    work_package_id: str                      # WP-YYYY-XXXX
    site_id: str = "SITE-01"
    job_id: str
    so_id: Optional[str] = None
    control_number_id: Optional[str] = None
    parent_package_id: Optional[str] = None   # supports WBS nesting

    work_type_code: str                       # drives capture, eligibility, billing, reporting
    title: str
    description: Optional[str] = None
    discipline: Optional[str] = None

    # counterparty and location
    client_id: Optional[str] = None
    client_name: Optional[str] = None
    manufacturer_id: Optional[str] = None
    manufacturer_name: Optional[str] = None
    location: Optional[str] = None

    # planning - binds to an imported client schedule (MS Project / P6) where available
    planned_start: Optional[datetime] = None
    planned_finish: Optional[datetime] = None
    predecessor_package_ids: list[str] = []
    external_schedule_ref: Optional[str] = None
    planned_quantity: float = 0.0
    planned_uom: Optional[str] = None
    planned_effort_mandays: float = 0.0

    # commercial - inherits the work type default, overridable per package
    rate_basis: Optional[str] = None
    rate: float = 0.0
    currency: str = "INR"
    ceiling_value: Optional[float] = None

    status: str = WorkPackageStatus.PLANNED.value
    status_history: list[StatusTransition] = []
    percent_complete: float = 0.0

    # provenance for packages migrated out of Job.scope_of_work
    migrated_from_sow_item_id: Optional[str] = None

    #: Provenance for records promoted out of a legacy vertical collection,
    #: formatted "<collection>:<record key>". Migration is idempotent on this,
    #: so a half-finished run can simply be re-run.
    migrated_from_ref: Optional[str] = None

    #: Optimistic lock. A caller that read version N must present N to save;
    #: see core/concurrency.py.
    version: int = 0

    is_active: bool = True
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "work_packages"
        indexes = [
            "site_id",
            "job_id",
            "work_type_code",
            "status",
            "planned_start",
            "work_package_id",
            "migrated_from_ref",
        ]
