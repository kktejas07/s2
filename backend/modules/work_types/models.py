"""Work type definitions.

A WorkTypeDefinition is the single configurable record that decides, for a given
piece of work: what is captured, who may perform it, how it is measured, how it
bills, what report comes out, and which AI assists apply.

Adding a work type is configuration plus a report template - not a new module.
See SOW_EXECUTION_ARCHITECTURE.md section 2.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from beanie import Document
from pydantic import Field


class RateBasis(str, Enum):
    """How work of this type is charged."""
    HOURLY = "HOURLY"                            # verified hours
    MAN_DAY = "MAN_DAY"                          # days deployed
    PER_VISIT = "PER_VISIT"                      # visits performed
    PER_UNIT = "PER_UNIT"                        # units measured x rate
    LUMP_SUM = "LUMP_SUM"                        # fixed package, milestone-released
    PCT_CERTIFIED_VALUE = "PCT_CERTIFIED_VALUE"  # % of value certified (BOQ, bill verification)
    RETAINER = "RETAINER"                        # fixed monthly


class AIAssist(str, Enum):
    """AI capabilities that may be enabled per work type."""
    DOC_EXTRACT = "DOC_EXTRACT"          # intelligent document processing (MTC, RA bills)
    CHECKLIST_GEN = "CHECKLIST_GEN"      # scope-specific checklist generation
    REPORT_DRAFT = "REPORT_DRAFT"        # draft report from captured field data
    VALIDATION = "VALIDATION"            # pre-submission completeness/error checks
    PHOTO_TAG = "PHOTO_TAG"              # photo tagging and defect hinting
    ANOMALY = "ANOMALY"                  # quantity/wastage/rate outlier detection


class WorkTypeDefinition(Document):
    work_type_code: str
    site_id: str = "SITE-01"
    name: str
    description: Optional[str] = None
    discipline_tags: list[str] = []

    # --- what governs it ---
    applicable_codes: list[str] = []
    acceptance_basis: Optional[str] = None

    # --- who may perform it (hard eligibility gate) ---
    required_authorization_types: list[str] = []
    required_qualifications: list[str] = []
    min_experience_years: float = 0.0

    # --- how it is captured ---
    capture_schema_id: Optional[str] = None
    checklist_template_id: Optional[str] = None
    requires_photos: bool = True
    requires_measurements: bool = False

    # --- how it is measured ---
    measurement_uom: Optional[str] = None
    measurement_method: Optional[str] = None

    # --- how it bills ---
    default_rate_basis: str = RateBasis.PER_VISIT.value
    certification_required_before_billing: bool = True

    #: Whether the person who performed the work may also certify it.
    #: Defaults to False: under ISO/IEC 17020 the safer position is that
    #: certification is a separate act from execution. Sites where the
    #: performing inspector is the competent certifying authority can set this
    #: True per work type. See SOW_EXECUTION_ARCHITECTURE.md open decision 3.
    allow_self_certification: bool = False

    # --- what comes out ---
    report_format_code: Optional[str] = None
    annexure_format_codes: list[str] = []

    # --- AI assists permitted for this work type ---
    ai_assists: list[str] = []

    # --- assignment automation ---
    # Top candidate must clear this score before the engine may auto-assign.
    # None = recommend only, never auto-assign. See SOW_EXECUTION_ARCHITECTURE.md section 5.
    auto_assign_threshold: Optional[float] = None

    is_active: bool = True
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "work_type_definitions"
        indexes = ["site_id", "work_type_code", "is_active"]
