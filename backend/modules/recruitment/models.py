"""HR recruitment and onboarding pipeline (IQEIPL workflow H1-H6).

H1  Manpower request — triggered when a job is won (step 4) and no
    authorised inspector is available.
H2  Budget gate — MD approves when headcount exceeds P&L budget.
H3  Source candidates — portals, referrals, pool.
H4  TM technical interview — gate before any offer.
H5  Offer and appointment — FL-01 (appointment) / FL-02 (associate).
H6  Induction and declarations — confidentiality (MS-10), impartiality
    (cl. 4.1, 4.2), safety, IT access.

QMS: SOP-19 · PFC-11 · Manual 5.3, 8.4 · Annexure 3, 3A, 3B, 5 · cl. 6.1
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from beanie import Document
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# H1 + H2: Manpower Request
# ---------------------------------------------------------------------------

class ManpowerRequestStatus(str, Enum):
    DRAFT = "draft"
    PENDING_BUDGET = "pending_budget"
    BUDGET_APPROVED = "budget_approved"
    BUDGET_REJECTED = "budget_rejected"
    SOURCING = "sourcing"
    FILLED = "filled"
    CANCELLED = "cancelled"


class ManpowerRequest(Document):
    request_id: str                                # MPR-YYYY-XXXX
    site_id: str = "SITE-01"
    job_id: Optional[str] = None                   # won job that triggered this
    region_code: Optional[str] = None              # N, S, E, W

    requested_by: str                              # person_id of requester
    approved_by: Optional[str] = None              # MD for over-budget

    position_title: str
    category: str = "TECHNICAL_INSPECTION"         # PersonCategory values
    engagement_type: str = "PERMANENT"             # EngagementType values

    required_qualifications: list[str] = []
    required_experience_years: float = 0.0
    required_authorization_types: list[str] = []   # links to WorkType codes

    headcount: int = 1
    budget_per_head: float = 0.0
    within_budget: bool = False                    # H2 gate
    budget_approved: bool = False
    budget_remarks: Optional[str] = None

    priority: str = "normal"                       # urgent, normal, low
    status: str = ManpowerRequestStatus.DRAFT.value
    filled_count: int = 0
    target_date: Optional[datetime] = None

    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "manpower_requests"
        indexes = ["site_id", "request_id", "status", "job_id"]


# ---------------------------------------------------------------------------
# H3: Candidate sourcing
# ---------------------------------------------------------------------------

class CandidateStatus(str, Enum):
    NEW = "new"
    SCREENING = "screening"
    TM_INTERVIEW = "tm_interview"
    TECHNICALLY_FIT = "technically_fit"
    NOT_FIT = "not_fit"
    OFFER_SENT = "offer_sent"
    OFFER_ACCEPTED = "offer_accepted"
    OFFER_DECLINED = "offer_declined"
    JOINED = "joined"
    WITHDRAWN = "withdrawn"


class CandidateQualification(BaseModel):
    name: str
    issuing_body: Optional[str] = None
    year: Optional[int] = None


class Candidate(Document):
    candidate_id: str                              # CND-YYYY-XXXX
    site_id: str = "SITE-01"
    request_id: Optional[str] = None               # ManpowerRequest link

    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None

    source: str = "portal"                         # portal, referral, pool, direct
    source_detail: Optional[str] = None
    resume_document_id: Optional[str] = None

    qualifications: list[CandidateQualification] = []
    experience_years: float = 0.0
    current_employer: Optional[str] = None
    current_designation: Optional[str] = None
    expected_ctc: float = 0.0

    status: str = CandidateStatus.NEW.value
    screening_notes: Optional[str] = None

    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "candidates"
        indexes = ["site_id", "candidate_id", "request_id", "status"]


# ---------------------------------------------------------------------------
# H4: Technical interview (TM gate)
# ---------------------------------------------------------------------------

class InterviewRecommendation(str, Enum):
    PENDING = "pending"
    FIT = "fit"
    NOT_FIT = "not_fit"
    CONDITIONAL = "conditional"


class TechnicalInterview(Document):
    interview_id: str                              # INT-YYYY-XXXX
    candidate_id: str
    request_id: Optional[str] = None
    site_id: str = "SITE-01"

    interviewer_person_id: str                     # TM who interviews
    interview_date: Optional[datetime] = None
    interview_mode: str = "in_person"              # in_person, video, phone

    technical_score: Optional[int] = None          # 0-10
    domain_knowledge: Optional[int] = None         # 0-10
    practical_assessment: Optional[int] = None     # 0-10
    communication: Optional[int] = None            # 0-10

    overall_recommendation: str = InterviewRecommendation.PENDING.value
    condition_notes: Optional[str] = None
    remarks: Optional[str] = None

    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "technical_interviews"
        indexes = ["candidate_id", "site_id", "interview_id"]


# ---------------------------------------------------------------------------
# H5: Offer and appointment
# ---------------------------------------------------------------------------

class OfferStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"


class OfferLetter(Document):
    offer_id: str                                  # OFR-YYYY-XXXX
    candidate_id: str
    request_id: Optional[str] = None
    site_id: str = "SITE-01"

    offer_type: str = "appointment"                # appointment (FL-01), associate (FL-02)
    designation: str
    department: Optional[str] = None
    engagement_type: str = "PERMANENT"

    ctc_offered: float = 0.0
    joining_date: Optional[datetime] = None
    probation_months: int = 6
    reporting_to_person_id: Optional[str] = None
    terms: Optional[str] = None

    status: str = OfferStatus.DRAFT.value
    sent_on: Optional[datetime] = None
    responded_on: Optional[datetime] = None
    decline_reason: Optional[str] = None

    person_id: Optional[str] = None                # set when they join
    document_id: Optional[str] = None

    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "offer_letters"
        indexes = ["candidate_id", "site_id", "offer_id", "status"]


# ---------------------------------------------------------------------------
# H6: Induction and declarations
# ---------------------------------------------------------------------------

class InductionItem(BaseModel):
    item_code: str
    description: str
    completed: bool = False
    completed_on: Optional[datetime] = None
    completed_by: Optional[str] = None


DEFAULT_INDUCTION_ITEMS = [
    InductionItem(item_code="WELCOME", description="Welcome briefing and office tour"),
    InductionItem(item_code="QMS_INTRO", description="QMS manual and quality policy introduction"),
    InductionItem(item_code="SAFETY", description="Safety and emergency procedures briefing"),
    InductionItem(item_code="IT_ACCESS", description="IT systems access and training"),
    InductionItem(item_code="TOOLS", description="Equipment and tools familiarisation"),
    InductionItem(item_code="REPORTING", description="Reporting procedures and formats"),
    InductionItem(item_code="CONFID", description="Confidentiality agreement (MS-10)"),
    InductionItem(item_code="IMPART", description="Impartiality declaration (cl. 4.1, 4.2)"),
    InductionItem(item_code="CODE", description="Code of conduct acknowledgement"),
    InductionItem(item_code="ID_CARD", description="ID card and PPE issued"),
]


class InductionChecklist(Document):
    induction_id: str                              # IND-YYYY-XXXX
    person_id: str
    site_id: str = "SITE-01"

    checklist_items: list[InductionItem] = []

    confidentiality_signed: bool = False
    confidentiality_signed_on: Optional[datetime] = None
    impartiality_declared: bool = False
    impartiality_declaration_id: Optional[str] = None
    safety_briefing_done: bool = False
    it_access_provisioned: bool = False
    id_card_issued: bool = False

    completed: bool = False
    completed_on: Optional[datetime] = None
    inducted_by: Optional[str] = None

    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "induction_checklists"
        indexes = ["person_id", "site_id", "induction_id"]
