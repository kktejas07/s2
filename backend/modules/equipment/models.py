"""Inspection equipment and its calibration.

ISO/IEC 17020 clause 6.2 requires an inspection body to have the equipment its
work needs, and to keep it calibrated, maintained and identifiable. The
practical consequence is sharper than the clause sounds: a measurement taken
with an instrument whose calibration had lapsed is not a defensible
measurement, and a client who discovers that after the fact can reopen every
inspection the instrument touched.

Calibration appeared in this codebase only as a `calibration_alert_window_days`
field inside the pharma vertical. There was no register, no due dates, and
nothing stopping an inspector recording a thickness reading with an
out-of-calibration gauge.

Two deliberate decisions:

* **Lapsed is computed, never stored.** A stored `is_calibrated` flag is wrong
  the morning after it was written. The due date is the fact; everything else
  is derived from it and the current date.
* **Usage is recorded against work.** `EquipmentUsage` links an instrument to
  the package it was used on, so when a gauge is found to have drifted, the
  question "which inspections does this affect" has an answer.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from beanie import Document
from pydantic import Field


class EquipmentStatus(str, Enum):
    IN_SERVICE = "IN_SERVICE"
    OUT_FOR_CALIBRATION = "OUT_FOR_CALIBRATION"
    UNDER_REPAIR = "UNDER_REPAIR"
    QUARANTINED = "QUARANTINED"        # suspect: do not use pending investigation
    RETIRED = "RETIRED"


class CalibrationResult(str, Enum):
    PASS = "PASS"
    PASS_WITH_ADJUSTMENT = "PASS_WITH_ADJUSTMENT"
    FAIL = "FAIL"


class Equipment(Document):
    equipment_id: str
    site_id: str = "SITE-01"

    #: What is stamped on the instrument - the identification the clause asks
    #: for, and what an inspector writes on a report.
    asset_tag: str
    name: str
    equipment_type: Optional[str] = None      # UT thickness gauge, DFT gauge, torque wrench
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None

    #: Which work types may be performed with it. An empty list means "any",
    #: which is right for a tape measure and wrong for a UT set.
    applicable_work_types: list[str] = []

    measurement_range: Optional[str] = None
    accuracy: Optional[str] = None
    resolution: Optional[str] = None

    #: Calibration. due_date is the fact; lapsed-ness is computed from it.
    calibration_interval_months: int = 12
    last_calibrated_on: Optional[datetime] = None
    calibration_due_on: Optional[datetime] = None
    calibration_certificate_no: Optional[str] = None
    calibrated_by: Optional[str] = None            # the external laboratory
    traceable_to: Optional[str] = None             # NABL, NIST - the traceability chain

    status: str = EquipmentStatus.IN_SERVICE.value
    custodian_person_id: Optional[str] = None
    location: Optional[str] = None

    quarantine_reason: Optional[str] = None
    notes: Optional[str] = None

    is_active: bool = True
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "equipment"
        indexes = ["site_id", "equipment_id", "asset_tag", "status", "calibration_due_on"]


class CalibrationRecord(Document):
    """One calibration event. Append-only history, like the audit trail."""

    record_id: str
    site_id: str = "SITE-01"
    equipment_id: str

    calibrated_on: datetime
    due_on: datetime
    result: str = CalibrationResult.PASS.value
    certificate_no: Optional[str] = None
    calibrated_by: Optional[str] = None
    traceable_to: Optional[str] = None
    deviation_found: Optional[str] = None
    #: Set when a FAIL means earlier readings are suspect.
    impact_assessment: Optional[str] = None

    recorded_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "calibration_records"
        indexes = ["site_id", "equipment_id", "calibrated_on"]


class EquipmentUsage(Document):
    """Which instrument was used on which work.

    This is what makes a drifted gauge tractable: without it, discovering a
    calibration failure means re-examining everything, rather than the
    inspections that actually used the instrument.
    """

    usage_id: str
    site_id: str = "SITE-01"
    equipment_id: str
    work_package_id: Optional[str] = None
    job_id: Optional[str] = None
    used_by_person_id: Optional[str] = None
    used_on: datetime = Field(default_factory=datetime.now)
    #: The calibration due date at the moment of use, so a later lapse does not
    #: rewrite history in either direction.
    calibration_due_at_use: Optional[datetime] = None
    was_in_calibration: bool = True
    notes: Optional[str] = None

    class Settings:
        name = "equipment_usage"
        indexes = ["site_id", "equipment_id", "work_package_id", "job_id", "used_on"]
