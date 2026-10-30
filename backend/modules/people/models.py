"""Person master and the ISO/IEC 17020 competence chain.

The legacy ASP.NET app holds a rich person model (IQEApp.Domain/UserDomain,
121-property UserViewModel) that the FastAPI rewrite never carried across -
statutory, banking, qualification, secondment and empanelment data all have no
home in the new stack. This restores it, and adds what neither stack had:
authorization, impartiality and a structured employment lifecycle.

Field names here map to the legacy CreateUser stored-procedure parameters; see
scripts/migrate_legacy_people.py for the column mapping.

See PEOPLE_AND_PRESALES_SPEC.md section 6.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from beanie import Document
from pydantic import BaseModel, Field


class PersonCategory(str, Enum):
    """Selects which profile extensions apply. Widens the legacy EmployeeType master."""
    TECHNICAL_INSPECTION = "TECHNICAL_INSPECTION"
    TECHNICAL_ENGINEERING = "TECHNICAL_ENGINEERING"
    SITE_LABOUR = "SITE_LABOUR"
    ADMIN_SUPPORT = "ADMIN_SUPPORT"
    CORPORATE_FUNCTION = "CORPORATE_FUNCTION"


class EngagementType(str, Enum):
    """Independent of category. A retired NDT specialist is TECHNICAL_INSPECTION + ASSOCIATE."""
    PERMANENT = "PERMANENT"
    CONTRACT = "CONTRACT"
    ASSOCIATE = "ASSOCIATE"        # subcontracted; the legacy Associate link
    SECONDMENT = "SECONDMENT"      # legacy IsSecondment, promoted from a boolean
    DAILY_WAGE = "DAILY_WAGE"
    TRAINEE = "TRAINEE"
    CONSULTANT = "CONSULTANT"


class EmploymentStatus(str, Enum):
    ONBOARDING = "onboarding"
    ACTIVE = "active"
    ON_BENCH = "on_bench"
    DEPLOYED = "deployed"
    ON_LEAVE = "on_leave"
    SUSPENDED = "suspended"
    EXITED = "exited"


#: Statuses from which a person may be assigned work at all.
DEPLOYABLE_STATUSES = {
    EmploymentStatus.ACTIVE.value,
    EmploymentStatus.ON_BENCH.value,
    EmploymentStatus.DEPLOYED.value,
}


class AuthorizationStatus(str, Enum):
    PENDING = "pending"
    AUTHORIZED = "authorized"
    SUSPENDED = "suspended"
    WITHDRAWN = "withdrawn"
    EXPIRED = "expired"


class QualificationType(str, Enum):
    DEGREE = "DEGREE"
    CERTIFICATION = "CERTIFICATION"
    LICENCE = "LICENCE"
    TRAINING = "TRAINING"


#: Qualification types whose lapse makes a person undeployable.
EXPIRY_CRITICAL_TYPES = {QualificationType.CERTIFICATION.value, QualificationType.LICENCE.value}


class Qualification(BaseModel):
    qualification_type: str
    name: str                                  # "ASNT NDT Level II - UT", "CSWIP 3.1"
    issuing_body: Optional[str] = None
    certificate_no: Optional[str] = None
    issued_on: Optional[datetime] = None
    expires_on: Optional[datetime] = None
    verified: bool = False
    verified_by: Optional[str] = None
    verified_on: Optional[datetime] = None
    document_id: Optional[str] = None


class Person(Document):
    person_id: str                             # EMP-XXXXX
    site_id: str = "SITE-01"
    user_id: Optional[str] = None              # link to auth.UserLogin if they sign in
    employee_code: Optional[str] = None

    title_id: Optional[int] = None
    full_name: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None
    phone: Optional[str] = None                # legacy EmpContactNumber
    email: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    address: Optional[str] = None
    country_id: Optional[int] = None
    state_id: Optional[int] = None
    city_name: Optional[str] = None
    base_location: Optional[str] = None        # drives geography matching
    willing_to_travel: bool = True
    passport_no: Optional[str] = None
    passport_expiry: Optional[datetime] = None
    photo_document_id: Optional[str] = None

    category: str = PersonCategory.TECHNICAL_INSPECTION.value
    engagement_type: str = EngagementType.PERMANENT.value
    designation_id: Optional[int] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    reports_to_person_id: Optional[str] = None
    date_of_joining: Optional[datetime] = None
    probation_end: Optional[datetime] = None
    contract_end: Optional[datetime] = None

    # --- carried forward from the legacy model; dropped by the first rewrite ---
    inspector_code: Optional[str] = None       # "Inspector Stamp No", distinct from employee_code
    skill_sets: Optional[str] = None
    qualification_text: Optional[str] = None   # legacy Qualification
    prof_qualification: Optional[str] = None   # legacy discipline
    experience_text: Optional[str] = None
    certifications_text: Optional[str] = None
    other_professional: Optional[str] = None
    associate_id: Optional[str] = None
    associate_name: Optional[str] = None
    contact_person: Optional[str] = None
    bank_account: Optional[str] = None
    ifsc_code: Optional[str] = None
    bank_branch: Optional[str] = None
    pan: Optional[str] = None
    aadhaar: Optional[str] = None
    esi_no: Optional[str] = None
    pf_no: Optional[str] = None
    pa_no: Optional[str] = None
    medical_ref: Optional[str] = None
    # --------------------------------------------------------------------------

    seconded_to_client_id: Optional[str] = None   # was IsSecondment (boolean)
    seconded_from: Optional[datetime] = None
    seconded_until: Optional[datetime] = None

    employment_status: str = EmploymentStatus.ONBOARDING.value

    #: Derived only - set by evaluate_deployability(), never written by hand.
    deployable: bool = False
    deployability_reason: Optional[str] = None

    exit_date: Optional[datetime] = None
    exit_reason: Optional[str] = None

    documents: list[str] = []
    migrated_from_legacy_user_id: Optional[int] = None
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "people"
        indexes = ["site_id", "category", "employment_status", "deployable", "person_id"]


class CompetenceProfile(Document):
    """Evidence and currency behind a person's competence."""
    profile_id: str
    person_id: str
    site_id: str = "SITE-01"
    competency_id: Optional[str] = None        # existing users.Competency doc
    qualifications: list[Qualification] = []
    years_experience: float = 0.0
    disciplines: list[str] = []
    equipment_categories: list[str] = []
    languages: list[str] = []
    last_reviewed_on: Optional[datetime] = None
    next_review_due: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "competence_profiles"
        indexes = ["person_id", "site_id"]


class Authorization(Document):
    """The gate between onboarded and deployable.

    Formalises the legacy CompentenceActive flag by giving it scope (which
    inspection types), evidence (what was checked), expiry and surveillance.
    """
    authorization_id: str                      # ATH-YYYY-XXXX
    person_id: str
    site_id: str = "SITE-01"

    inspection_types: list[str] = []           # what they may sign off, specifically
    scope_limits: Optional[str] = None

    status: str = AuthorizationStatus.PENDING.value
    qualification_verified: bool = False
    training_completed: bool = False
    supervised_inspections_count: int = 0
    supervised_required: int = 3
    witnessed_assessment_passed: bool = False
    witnessed_by: Optional[str] = None
    witnessed_on: Optional[datetime] = None

    authorized_by: Optional[str] = None        # technical manager
    authorized_on: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    next_surveillance_due: Optional[datetime] = None
    suspension_reason: Optional[str] = None
    evidence_document_ids: list[str] = []

    #: True for records migrated from legacy CompentenceActive with no evidence
    #: behind them. These must be re-evidenced at next review rather than trusted.
    unverified_legacy_grant: bool = False

    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "authorizations"
        indexes = ["person_id", "status", "next_surveillance_due", "site_id"]


class ImpartialityDeclaration(Document):
    """Strengthened in ISO/IEC 17020:2026; also a go/no-go scorecard input."""
    declaration_id: str
    person_id: str
    site_id: str = "SITE-01"
    declared_on: datetime = Field(default_factory=datetime.now)
    conflicted_client_ids: list[str] = []
    conflicted_manufacturer_ids: list[str] = []
    prior_employment: Optional[str] = None
    notes: Optional[str] = None
    valid_until: Optional[datetime] = None

    class Settings:
        name = "impartiality_declarations"
        indexes = ["person_id", "site_id"]


def evaluate_deployability(
    person_status: str,
    authorization: Optional[dict],
    qualifications: list[dict],
    as_of: Optional[datetime] = None,
) -> tuple[bool, str]:
    """Decide whether a person may be assigned work, and say why not.

    Pure so the rule can be reasoned about and tested without a database. This
    is the ISO/IEC 17020 gate: onboarded is not the same as deployable.
    """
    now = as_of or datetime.now()

    if person_status not in DEPLOYABLE_STATUSES:
        return False, f"Employment status is {person_status}"

    if not authorization:
        return False, "No authorization on record"

    if authorization.get("status") != AuthorizationStatus.AUTHORIZED.value:
        return False, f"Authorization is {authorization.get('status')}"

    valid_until = authorization.get("valid_until")
    if valid_until and valid_until < now:
        return False, "Authorization has expired"

    for q in qualifications:
        if q.get("qualification_type") not in EXPIRY_CRITICAL_TYPES:
            continue
        expires = q.get("expires_on")
        if expires and expires < now:
            return False, f"{q.get('name')} lapsed on {expires:%d %b %Y}"

    return True, "Authorized and current"
