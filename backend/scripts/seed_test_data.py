"""
Comprehensive seed script for IQEIPL application.

Populates ALL collections with realistic test data matching IQE Inspection Pvt Ltd's
actual business: third-party inspection for oil & gas, pharma, power, infrastructure.

Run:  cd backend && .venv/bin/python scripts/seed_test_data.py
"""
import asyncio
import random
from datetime import datetime, timedelta
from pymongo import AsyncMongoClient
from beanie import init_beanie

# ── All Document models ──────────────────────────────────────────────────────
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from core.config import settings

from modules.auth.models import UserLogin
from modules.clients.models import Client, ClientUnit
from modules.manufacturers.models import Manufacturer, ManufacturerUnit
from modules.users.models import Competency, InspectorRate, Associate
from modules.jobs.models import Job, SOWItem
from modules.service_orders.models import ServiceOrder, POItem
from modules.purchase_orders.models import PurchaseOrder, POItemDetail
from modules.visits.models import Visit, Expense, Finding, ScopeCheckItem
from modules.invoices.models import Invoice, ChargeItem
from modules.payments.models import Payment, DunningRecord
from modules.enquiries.models import Enquiry, EnquiryCategory, GoNoGoDecision, ProposalRevision, ScorecardCriterion
from modules.people.models import Person, CompetenceProfile, Authorization, Qualification, ImpartialityDeclaration
from modules.assignments.models import Assignment
from modules.finance.models import AccountReceivable, AccountPayable
from modules.regions.models import Region, Office, InterOfficeSettlement, InspectorLoan, DeputyCoverage
from modules.recruitment.models import ManpowerRequest, Candidate, TechnicalInterview, OfferLetter, InductionChecklist
from modules.recruitment.models import InductionItem, CandidateQualification, DEFAULT_INDUCTION_ITEMS
from modules.leave_attendance.models import LeaveRequest, AttendanceRecord, Timesheet, TimesheetEntry
from modules.payroll.models import PayrollRun, Payslip
from modules.appraisal.models import Appraisal, WitnessedInspection
from modules.exit_management.models import ExitProcess
from modules.purchasing.models import PurchaseRequisition, VendorPayment, PurchaseItem
from modules.rfi.models import RFI
from modules.punch_list.models import PunchItem
from modules.release_notes.models import InspectionReleaseNote
from modules.feedback.models import ClientFeedback, MRMAgendaItem
from modules.job_handoff.models import JobConversion
from modules.signoff.models import ReportSignoff
from modules.win_loss.models import WinLossRecord
from modules.notifications.models import EmailLog, NotificationPreference, InAppNotification
from modules.providers.models import ExternalProvider, EvaluationRecord
from modules.ncr.models import NCR
from modules.risk.models import Risk, InternalAudit
from modules.equipment.models import Equipment, CalibrationRecord
from modules.work_packages.models import WorkPackage
from modules.itp.models import InspectionTestPlan, InspectionCall


# ── Helpers ──────────────────────────────────────────────────────────────────
def dt(days_ago: int = 0, hours: int = 9) -> datetime:
    return datetime.now() - timedelta(days=days_ago, hours=random.randint(0, 4)) + timedelta(hours=hours)

def future(days: int) -> datetime:
    return datetime.now() + timedelta(days=days)

SITE = "SITE-01"


# ── Master data ──────────────────────────────────────────────────────────────

# --- PEOPLE (inspectors, managers, coordinators) ---
PEOPLE_DATA = [
    {"person_id": "EMP-00001", "full_name": "Rajesh Kumar Sharma", "first_name": "Rajesh", "last_name": "Sharma",
     "designation": "Regional Head - North", "department": "Operations", "category": "CORPORATE_FUNCTION",
     "engagement_type": "PERMANENT", "employment_status": "active", "deployable": True,
     "email": "rajesh.sharma@iqeipl.com", "phone": "+91-9876543210", "base_location": "Delhi",
     "inspector_code": "IQE-N-001", "pan": "ABCPS1234K", "date_of_joining": dt(1800)},

    {"person_id": "EMP-00002", "full_name": "Suresh Babu Naidu", "first_name": "Suresh", "last_name": "Naidu",
     "designation": "Technical Manager - South", "department": "Technical", "category": "TECHNICAL_INSPECTION",
     "engagement_type": "PERMANENT", "employment_status": "active", "deployable": True,
     "email": "suresh.naidu@iqeipl.com", "phone": "+91-9876543211", "base_location": "Hyderabad",
     "inspector_code": "IQE-S-001", "pan": "DEFPN5678L", "date_of_joining": dt(2100)},

    {"person_id": "EMP-00003", "full_name": "Anita Desai", "first_name": "Anita", "last_name": "Desai",
     "designation": "Inspection Coordinator - West", "department": "Operations", "category": "ADMIN_SUPPORT",
     "engagement_type": "PERMANENT", "employment_status": "active", "deployable": True,
     "email": "anita.desai@iqeipl.com", "phone": "+91-9876543212", "base_location": "Mumbai",
     "inspector_code": "IQE-W-001", "pan": "GHIPD9012M", "date_of_joining": dt(1500)},

    {"person_id": "EMP-00004", "full_name": "Vikram Singh Rathore", "first_name": "Vikram", "last_name": "Rathore",
     "designation": "Senior Inspection Officer", "department": "Inspection", "category": "TECHNICAL_INSPECTION",
     "engagement_type": "PERMANENT", "employment_status": "deployed", "deployable": True,
     "email": "vikram.rathore@iqeipl.com", "phone": "+91-9876543213", "base_location": "Jamnagar",
     "inspector_code": "IQE-W-002", "pan": "JKLVR3456N", "date_of_joining": dt(900),
     "skill_sets": "Pressure Vessels, Heat Exchangers, Piping", "experience_text": "15 years"},

    {"person_id": "EMP-00005", "full_name": "Mohammed Irfan Khan", "first_name": "Mohammed", "last_name": "Khan",
     "designation": "Inspection Officer", "department": "Inspection", "category": "TECHNICAL_INSPECTION",
     "engagement_type": "PERMANENT", "employment_status": "deployed", "deployable": True,
     "email": "irfan.khan@iqeipl.com", "phone": "+91-9876543214", "base_location": "Visakhapatnam",
     "inspector_code": "IQE-E-001", "pan": "MNOMK7890P", "date_of_joining": dt(600),
     "skill_sets": "NDT, Welding Inspection, Coatings", "experience_text": "10 years"},

    {"person_id": "EMP-00006", "full_name": "Priya Venkatesh", "first_name": "Priya", "last_name": "Venkatesh",
     "designation": "QC Reviewer", "department": "Quality", "category": "TECHNICAL_INSPECTION",
     "engagement_type": "PERMANENT", "employment_status": "active", "deployable": True,
     "email": "priya.v@iqeipl.com", "phone": "+91-9876543215", "base_location": "Chennai",
     "inspector_code": "IQE-S-002", "pan": "PQRPV1234Q", "date_of_joining": dt(700)},

    {"person_id": "EMP-00007", "full_name": "Amit Patel", "first_name": "Amit", "last_name": "Patel",
     "designation": "Inspection Officer - Electrical", "department": "Inspection", "category": "TECHNICAL_INSPECTION",
     "engagement_type": "PERMANENT", "employment_status": "deployed", "deployable": True,
     "email": "amit.patel@iqeipl.com", "phone": "+91-9876543216", "base_location": "Baroda",
     "inspector_code": "IQE-W-003", "pan": "STUAP5678R", "date_of_joining": dt(450),
     "skill_sets": "Switchgear, Transformers, Motors, Cables", "experience_text": "8 years"},

    {"person_id": "EMP-00008", "full_name": "Deepak Mishra", "first_name": "Deepak", "last_name": "Mishra",
     "designation": "Country Manager", "department": "Management", "category": "CORPORATE_FUNCTION",
     "engagement_type": "PERMANENT", "employment_status": "active", "deployable": False,
     "email": "deepak.mishra@iqeipl.com", "phone": "+91-9876543217", "base_location": "Hyderabad",
     "pan": "VWXDM9012S", "date_of_joining": dt(3000)},

    {"person_id": "EMP-00009", "full_name": "Sanjay Kulkarni", "first_name": "Sanjay", "last_name": "Kulkarni",
     "designation": "BD Manager - West", "department": "Business Development", "category": "CORPORATE_FUNCTION",
     "engagement_type": "PERMANENT", "employment_status": "active", "deployable": False,
     "email": "sanjay.kulkarni@iqeipl.com", "phone": "+91-9876543218", "base_location": "Mumbai",
     "pan": "YZASK3456T", "date_of_joining": dt(1200)},

    {"person_id": "EMP-00010", "full_name": "Lakshmi Narayan", "first_name": "Lakshmi", "last_name": "Narayan",
     "designation": "Finance Manager", "department": "Finance", "category": "ADMIN_SUPPORT",
     "engagement_type": "PERMANENT", "employment_status": "active", "deployable": False,
     "email": "lakshmi.n@iqeipl.com", "phone": "+91-9876543219", "base_location": "Hyderabad",
     "pan": "BCDLN7890U", "date_of_joining": dt(2200)},

    {"person_id": "EMP-00011", "full_name": "Ravi Shankar Gupta", "first_name": "Ravi", "last_name": "Gupta",
     "designation": "Inspection Officer - Rotating", "department": "Inspection", "category": "TECHNICAL_INSPECTION",
     "engagement_type": "ASSOCIATE", "employment_status": "deployed", "deployable": True,
     "email": "ravi.gupta@iqeipl.com", "phone": "+91-9876543220", "base_location": "Haldia",
     "inspector_code": "IQE-E-002", "pan": "EFGRG1234V", "date_of_joining": dt(300),
     "skill_sets": "Pumps, Compressors, Turbines, Gears", "experience_text": "12 years"},

    {"person_id": "EMP-00012", "full_name": "Kavitha Reddy", "first_name": "Kavitha", "last_name": "Reddy",
     "designation": "HR Manager", "department": "Human Resources", "category": "ADMIN_SUPPORT",
     "engagement_type": "PERMANENT", "employment_status": "active", "deployable": False,
     "email": "kavitha.reddy@iqeipl.com", "phone": "+91-9876543221", "base_location": "Hyderabad",
     "pan": "GHIKR5678W", "date_of_joining": dt(1000)},
]

# --- CLIENTS ---
CLIENTS_DATA = [
    {"client_id": "CLT-001", "name": "Reliance Industries Limited", "code": "RIL",
     "industry_type": "Oil & Gas", "annual_revenue": 850000000000.0,
     "city": "Mumbai", "state": "Maharashtra", "country": "India",
     "contact_person": "Mukesh Patel", "email": "procurement@ril.com", "phone": "+91-22-44773000"},
    {"client_id": "CLT-002", "name": "Larsen & Toubro Limited", "code": "LNT",
     "industry_type": "Infrastructure & EPC", "annual_revenue": 210000000000.0,
     "city": "Mumbai", "state": "Maharashtra", "country": "India",
     "contact_person": "Arun Mehta", "email": "qc@lnt.com", "phone": "+91-22-66525656"},
    {"client_id": "CLT-003", "name": "BHEL - Bharat Heavy Electricals Ltd", "code": "BHEL",
     "industry_type": "Power & Heavy Engineering", "annual_revenue": 250000000000.0,
     "city": "New Delhi", "state": "Delhi", "country": "India",
     "contact_person": "Ramesh Tiwari", "email": "vendor-inspection@bhel.in", "phone": "+91-11-26001234"},
    {"client_id": "CLT-004", "name": "Indian Oil Corporation Limited", "code": "IOCL",
     "industry_type": "Oil & Gas (Refining)", "annual_revenue": 750000000000.0,
     "city": "New Delhi", "state": "Delhi", "country": "India",
     "contact_person": "Sunil Sharma", "email": "tpi@iocl.co.in", "phone": "+91-11-26267110"},
    {"client_id": "CLT-005", "name": "HPCL-Mittal Energy Limited", "code": "HMEL",
     "industry_type": "Oil & Gas (Refining)", "annual_revenue": 350000000000.0,
     "city": "Bathinda", "state": "Punjab", "country": "India",
     "contact_person": "Jaspal Singh", "email": "quality@hmel.in", "phone": "+91-164-2290001"},
    {"client_id": "CLT-006", "name": "Cipla Limited", "code": "CIPLA",
     "industry_type": "Pharmaceutical", "annual_revenue": 220000000000.0,
     "city": "Mumbai", "state": "Maharashtra", "country": "India",
     "contact_person": "Dr. Neha Joshi", "email": "engg-procurement@cipla.com", "phone": "+91-22-25086000"},
    {"client_id": "CLT-007", "name": "Tata Steel Limited", "code": "TSTL",
     "industry_type": "Metals & Mining", "annual_revenue": 240000000000.0,
     "city": "Jamshedpur", "state": "Jharkhand", "country": "India",
     "contact_person": "Abhijit Roy", "email": "vendor-quality@tatasteel.com", "phone": "+91-657-2432121"},
    {"client_id": "CLT-008", "name": "NTPC Limited", "code": "NTPC",
     "industry_type": "Power Generation", "annual_revenue": 170000000000.0,
     "city": "New Delhi", "state": "Delhi", "country": "India",
     "contact_person": "K.P. Singh", "email": "epc-quality@ntpc.co.in", "phone": "+91-11-24360100"},
]

# --- MANUFACTURERS / VENDORS ---
MANUFACTURERS_DATA = [
    {"manufacturer_id": "MFR-001", "name": "Godrej Process Equipment", "code": "GPE",
     "equipment_category": "Pressure Vessels & Heat Exchangers",
     "city": "Mumbai", "state": "Maharashtra", "contact_person": "Nikhil Godrej",
     "email": "sales@gpe.godrej.com", "gst": "27AABCG1234A1Z5"},
    {"manufacturer_id": "MFR-002", "name": "Thermax Limited", "code": "THRX",
     "equipment_category": "Boilers & Heating Equipment",
     "city": "Pune", "state": "Maharashtra", "contact_person": "Meher Padumjee",
     "email": "quality@thermax.com", "gst": "27AABCT5678B1Z3"},
    {"manufacturer_id": "MFR-003", "name": "L&T Valves", "code": "LNTV",
     "equipment_category": "Valves & Actuators",
     "city": "Coimbatore", "state": "Tamil Nadu", "contact_person": "Rajan S.",
     "email": "qc@lntvalves.com", "gst": "33AABCL9012C1Z1"},
    {"manufacturer_id": "MFR-004", "name": "Bharat Forge Limited", "code": "BHFG",
     "equipment_category": "Forgings & Castings",
     "city": "Pune", "state": "Maharashtra", "contact_person": "Kalyani B.",
     "email": "inspection@bharatforge.com", "gst": "27AABCB3456D1Z9"},
    {"manufacturer_id": "MFR-005", "name": "Siemens Energy India", "code": "SIEN",
     "equipment_category": "Turbines & Compressors",
     "city": "Vadodara", "state": "Gujarat", "contact_person": "Michael D'Souza",
     "email": "quality@siemens-energy.com", "gst": "24AABCS7890E1Z7"},
    {"manufacturer_id": "MFR-006", "name": "ABB India Limited", "code": "ABB",
     "equipment_category": "Switchgear & Transformers",
     "city": "Bengaluru", "state": "Karnataka", "contact_person": "Sanjeev Rao",
     "email": "qms@abb.com", "gst": "29AABCA1234F1Z5"},
]

# --- CLIENT UNITS (fabrication yards / plant sites) ---
CLIENT_UNITS_DATA = [
    {"client_unit_id": "CU-001", "client_id": "CLT-001", "name": "RIL Jamnagar Refinery", "unit_type": "Refinery",
     "region": "Western Region", "city": "Jamnagar", "state": "Gujarat", "contact_person": "Prakash Shah",
     "gst": "24AABCR1234G1Z3"},
    {"client_unit_id": "CU-002", "client_id": "CLT-001", "name": "RIL KG-D6 Basin", "unit_type": "Offshore Platform",
     "region": "Eastern Region", "city": "Kakinada", "state": "Andhra Pradesh", "contact_person": "V. Rao"},
    {"client_unit_id": "CU-003", "client_id": "CLT-002", "name": "L&T Hazira Works", "unit_type": "Fabrication Yard",
     "region": "Western Region", "city": "Hazira", "state": "Gujarat", "contact_person": "D.K. Jain",
     "gst": "24AABCL5678H1Z1"},
    {"client_unit_id": "CU-004", "client_id": "CLT-003", "name": "BHEL Haridwar Plant", "unit_type": "Manufacturing Facility",
     "region": "Northern Region", "city": "Haridwar", "state": "Uttarakhand", "contact_person": "S.N. Mishra"},
    {"client_unit_id": "CU-005", "client_id": "CLT-004", "name": "IOCL Paradip Refinery", "unit_type": "Refinery",
     "region": "Eastern Region", "city": "Paradip", "state": "Odisha", "contact_person": "A.K. Das"},
    {"client_unit_id": "CU-006", "client_id": "CLT-005", "name": "HMEL Bathinda Refinery", "unit_type": "Refinery",
     "region": "Northern Region", "city": "Bathinda", "state": "Punjab", "contact_person": "Harjinder Singh"},
    {"client_unit_id": "CU-007", "client_id": "CLT-006", "name": "Cipla Goa API Plant", "unit_type": "Pharma Manufacturing",
     "region": "Western Region", "city": "Verna", "state": "Goa", "contact_person": "Dr. A. Patil"},
    {"client_unit_id": "CU-008", "client_id": "CLT-007", "name": "Tata Steel Jamshedpur Works", "unit_type": "Steel Plant",
     "region": "Eastern Region", "city": "Jamshedpur", "state": "Jharkhand", "contact_person": "P.K. Ghosh"},
]

# --- MANUFACTURER UNITS ---
MANUFACTURER_UNITS_DATA = [
    {"manufacturer_unit_id": "MU-001", "manufacturer_id": "MFR-001", "name": "Godrej Vikhroli Works",
     "unit_type": "Fabrication Shop", "city": "Mumbai", "state": "Maharashtra"},
    {"manufacturer_unit_id": "MU-002", "manufacturer_id": "MFR-002", "name": "Thermax Chinchwad Plant",
     "unit_type": "Boiler Manufacturing", "city": "Pune", "state": "Maharashtra"},
    {"manufacturer_unit_id": "MU-003", "manufacturer_id": "MFR-003", "name": "L&T Valves Coimbatore",
     "unit_type": "Valve Manufacturing", "city": "Coimbatore", "state": "Tamil Nadu"},
    {"manufacturer_unit_id": "MU-004", "manufacturer_id": "MFR-005", "name": "Siemens Vadodara Works",
     "unit_type": "Turbine Assembly", "city": "Vadodara", "state": "Gujarat"},
    {"manufacturer_unit_id": "MU-005", "manufacturer_id": "MFR-006", "name": "ABB Peenya Factory",
     "unit_type": "Switchgear Manufacturing", "city": "Bengaluru", "state": "Karnataka"},
]


async def seed():
    client = AsyncMongoClient(settings.mongodb_url)
    db = client[settings.mongodb_db_name]

    # Check if gap-fill modules already seeded
    existing_regions = await db["regions"].count_documents({})
    if existing_regions >= 4:
        print(f"Gap-fill data already seeded ({existing_regions} regions found).")
        print("To re-seed gap-fill: drop specific collections or the whole DB.")
        return

    # Check if core data exists (from enrich_200_mock_data.py)
    existing_people = await db["people"].count_documents({})
    has_core_data = existing_people >= 50
    print(f"   Core data: {'YES' if has_core_data else 'NO'} ({existing_people} people)")
    print(f"   Mode: {'Gap-fill only' if has_core_data else 'Full seed'}")

    print("🌱 Seeding IQEIPL test data...")

    # Import ALL document models for Beanie init
    from modules.control_numbers.models import ControlNumber
    from modules.complaints.models import CustomerComplaint
    from modules.documents.models import Document as DocModel
    from modules.analytics.models import AnalyticsEvent
    from modules.construction_bill_verification.models import ConstructionBillVerificationRecord
    from modules.schedule_m_pharma_epc.models import ScheduleMPharmaEPCProject
    from modules.tpi.models import TpiReport
    from modules.work_types.models import WorkTypeDefinition
    from modules.certifications.models import Certification
    from modules.billing.models import BillingTerms
    from modules.evidence.models import Evidence
    from modules.reporting.models import ReportFormat
    from modules.rates.models import RateCard, RateFloor
    from modules.commercial.models import Amendment
    from core.audit import AuditEntry
    from core.sequences import Sequence
    from modules.enquiries.reason_codes import ReasonCode

    await init_beanie(
        database=db,
        document_models=[
            UserLogin, Client, ClientUnit, Manufacturer, ManufacturerUnit,
            Competency, InspectorRate, Associate, Job, ServiceOrder,
            ControlNumber, Visit, Invoice, PurchaseOrder, Payment,
            Enquiry, GoNoGoDecision, ProposalRevision, ReasonCode,
            ExternalProvider, EvaluationRecord,
            Risk, InternalAudit, NCR,
            InspectionTestPlan, InspectionCall,
            Amendment, RateCard, RateFloor,
            CustomerComplaint, DocModel, AnalyticsEvent,
            AccountReceivable, AccountPayable,
            ConstructionBillVerificationRecord, ScheduleMPharmaEPCProject,
            TpiReport, WorkTypeDefinition, WorkPackage,
            Certification, BillingTerms,
            Person, CompetenceProfile, Authorization, ImpartialityDeclaration,
            Assignment, ReportFormat, Evidence, Equipment, CalibrationRecord,
            AuditEntry, Sequence,
            # Gap-fill modules
            Region, Office, InterOfficeSettlement, InspectorLoan, DeputyCoverage,
            ManpowerRequest, Candidate, TechnicalInterview, OfferLetter, InductionChecklist,
            LeaveRequest, AttendanceRecord, Timesheet,
            PayrollRun, Payslip,
            Appraisal, WitnessedInspection,
            ExitProcess,
            DunningRecord,
            PurchaseRequisition, VendorPayment,
            RFI, PunchItem, InspectionReleaseNote,
            ClientFeedback, MRMAgendaItem,
            JobConversion, ReportSignoff, WinLossRecord,
            EmailLog, NotificationPreference, InAppNotification,
            # needed for ManufacturerVisitLocation
        ],
    )

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 1-4. CORE DATA (People, Logins, Clients, Manufacturers)           ║
    # ║ Only inserted when the DB is fresh (no existing enriched data)    ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    if not has_core_data:
        print("  → People...")
        for p in PEOPLE_DATA:
            await Person(site_id=SITE, **p).insert()

        # Logins are owned by scripts/seed_users.py, which writes the real
        # UserLogin schema (user_id/login_name/login_password/role_id) and is
        # idempotent per login_name. Seeding them here as well produced
        # duplicate login_name rows for "admin", which makes login ambiguous.
        print("  → User logins... (handled by scripts/seed_users.py)")

        print("  → Clients & units...")
        for c in CLIENTS_DATA:
            await Client(site_id=SITE, total_units=2, is_active=True, **c).insert()
        for cu in CLIENT_UNITS_DATA:
            await ClientUnit(site_id=SITE, is_active=True, **cu).insert()

        print("  → Manufacturers & units...")
        for m in MANUFACTURERS_DATA:
            await Manufacturer(site_id=SITE, is_active=True, total_units=1, **m).insert()
        for mu in MANUFACTURER_UNITS_DATA:
            await ManufacturerUnit(site_id=SITE, is_active=True, **mu).insert()
    else:
        print("  → Core data exists, skipping People/Clients/Manufacturers...")

    # When core data exists, grab real IDs from existing records for FK references
    if has_core_data:
        sample_person = await db["people"].find_one({"employment_status": "active"})
        sample_client = await db["clients"].find_one({})
        sample_job = await db["jobs"].find_one({"status": "in_progress"}) or await db["jobs"].find_one({})
        sample_visit = await db["visits"].find_one({})
        sample_invoice = await db["invoices"].find_one({})
        # Use real IDs from existing data for cross-references
        REAL_PERSON_IDS = []
        async for p in db["people"].find({}, {"person_id": 1}).limit(12):
            REAL_PERSON_IDS.append(p.get("person_id", "EMP-00001"))
        REAL_CLIENT_IDS = []
        async for c in db["clients"].find({}, {"client_id": 1}).limit(8):
            REAL_CLIENT_IDS.append(c.get("client_id", "CLT-001"))
        REAL_JOB_IDS = []
        async for j in db["jobs"].find({}, {"job_id": 1}).limit(5):
            REAL_JOB_IDS.append(j.get("job_id", "JOB-001"))
        print(f"   Using existing IDs: {len(REAL_PERSON_IDS)} people, {len(REAL_CLIENT_IDS)} clients, {len(REAL_JOB_IDS)} jobs")

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 5. REGIONS, OFFICES, SETTLEMENTS                                  ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Regions & offices...")
    regions = [
        {"region_code": "N", "name": "North", "head_office": False,
         "regional_head_person_id": "EMP-00001", "technical_manager_person_id": "EMP-00002",
         "inspection_coordinator_person_id": "EMP-00003"},
        {"region_code": "S", "name": "South", "head_office": True,
         "regional_head_person_id": "EMP-00008", "technical_manager_person_id": "EMP-00002",
         "inspection_coordinator_person_id": "EMP-00006"},
        {"region_code": "E", "name": "East", "head_office": False,
         "regional_head_person_id": "EMP-00001", "technical_manager_person_id": "EMP-00005"},
        {"region_code": "W", "name": "West", "head_office": False,
         "regional_head_person_id": "EMP-00009", "technical_manager_person_id": "EMP-00002",
         "inspection_coordinator_person_id": "EMP-00003"},
    ]
    for r in regions:
        await Region(**r).insert()

    offices = [
        {"office_id": "OFF-N-01", "region_code": "N", "name": "Delhi Office",
         "city": "New Delhi", "state": "Delhi", "address": "B-12, Sector 63, Noida"},
        {"office_id": "OFF-S-01", "region_code": "S", "name": "Hyderabad Head Office",
         "city": "Hyderabad", "state": "Telangana", "is_head_office": True,
         "address": "Plot 45, Hitec City, Madhapur", "site_ids": ["SITE-01"]},
        {"office_id": "OFF-S-02", "region_code": "S", "name": "Chennai Branch",
         "city": "Chennai", "state": "Tamil Nadu", "address": "No. 18, Anna Salai"},
        {"office_id": "OFF-E-01", "region_code": "E", "name": "Kolkata Office",
         "city": "Kolkata", "state": "West Bengal", "address": "Salt Lake Sector V"},
        {"office_id": "OFF-W-01", "region_code": "W", "name": "Mumbai Office",
         "city": "Mumbai", "state": "Maharashtra", "address": "Andheri East, MIDC"},
        {"office_id": "OFF-W-02", "region_code": "W", "name": "Baroda Branch",
         "city": "Vadodara", "state": "Gujarat", "address": "Alkapuri, Race Course Road"},
    ]
    for o in offices:
        await Office(**o).insert()

    # Inter-office settlement
    await InterOfficeSettlement(
        settlement_id="IOS-2627-09", period_month=9, period_year=2026,
        from_region="W", to_region="S", fee_collected=2500000,
        ho_pool_share=625000, region_share=1875000, net_payable_to_ho=625000,
        status="submitted", created_by="EMP-00010"
    ).insert()
    await InterOfficeSettlement(
        settlement_id="IOS-2627-10", period_month=10, period_year=2026,
        from_region="N", to_region="S", fee_collected=1800000,
        ho_pool_share=450000, region_share=1350000, net_payable_to_ho=450000,
        status="draft", created_by="EMP-00010"
    ).insert()

    # From here on, use real IDs if core data exists, otherwise our seed IDs
    if has_core_data:
        P = lambda i: REAL_PERSON_IDS[i % len(REAL_PERSON_IDS)]
        C = lambda i: REAL_CLIENT_IDS[i % len(REAL_CLIENT_IDS)]
        J = lambda i: REAL_JOB_IDS[i % len(REAL_JOB_IDS)]
        # Get some names
        pname = {}
        async for p in db["people"].find({}, {"person_id": 1, "full_name": 1}).limit(12):
            pname[p["person_id"]] = p.get("full_name", "Inspector")
        cname = {}
        async for c in db["clients"].find({}, {"client_id": 1, "name": 1}).limit(8):
            cname[c["client_id"]] = c.get("name", "Client")
    else:
        P = lambda i: PEOPLE_DATA[i % len(PEOPLE_DATA)]["person_id"]
        C = lambda i: CLIENTS_DATA[i % len(CLIENTS_DATA)]["client_id"]
        J = lambda i: f"JOB-2627-{i+1:03d}"
        pname = {p["person_id"]: p["full_name"] for p in PEOPLE_DATA}
        cname = {c["client_id"]: c["name"] for c in CLIENTS_DATA}

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 6-14. CORE TRANSACTIONAL DATA (Enquiries through Assignments)     ║
    # ║ Only inserted when the DB is fresh                                ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    if not has_core_data:
        print("  → Enquiries...")
    enquiries = [
        {"enquiry_id": "ENQ-2627-001", "client_id": "CLT-001", "status": "converted",
         "pipeline_value": 3500000, "probability_pct": 100, "source": "repeat_client",
         "enquiry_date": dt(120), "won_job_id": "JOB-2627-001",
         "categories": [EnquiryCategory(enquiry_category_id="EC-001", details="TPI for PV & HX at Jamnagar",
                                         scope="Pressure Vessels and Heat Exchangers", qty=15, budget=3500000)]},
        {"enquiry_id": "ENQ-2627-002", "client_id": "CLT-002", "status": "submitted",
         "pipeline_value": 5200000, "probability_pct": 70, "source": "tender_portal",
         "enquiry_date": dt(45),
         "categories": [EnquiryCategory(enquiry_category_id="EC-002", details="Structural fabrication inspection",
                                         scope="Structural Steel for LNG Terminal", qty=25, budget=5200000)]},
        {"enquiry_id": "ENQ-2627-003", "client_id": "CLT-004", "status": "go",
         "pipeline_value": 1800000, "probability_pct": 60, "source": "direct",
         "enquiry_date": dt(30)},
        {"enquiry_id": "ENQ-2627-004", "client_id": "CLT-006", "status": "no_go",
         "pipeline_value": 800000, "probability_pct": 0, "source": "tender_portal",
         "enquiry_date": dt(60)},
        {"enquiry_id": "ENQ-2627-005", "client_id": "CLT-007", "status": "qualifying",
         "pipeline_value": 4200000, "probability_pct": 40, "source": "referral",
         "enquiry_date": dt(10)},
    ]
    for e in enquiries:
        await Enquiry(site_id=SITE, is_active=True, **e).insert()

    # Go/No-Go decisions
    await GoNoGoDecision(
        decision_id="GNG-2627-001", enquiry_id="ENQ-2627-001", sequence=1,
        weighted_score=4.2, max_score=5.0, recommendation="go", decision="go",
        decided_by="EMP-00008",
        criteria=[
            ScorecardCriterion(code="SCOPE", label="Within accreditation scope", weight=2, score=5),
            ScorecardCriterion(code="COMPETENCE", label="Inspector availability", weight=1.5, score=4),
            ScorecardCriterion(code="RATE", label="Rate above floor", weight=1, score=4),
            ScorecardCriterion(code="IMPARTIALITY", label="No conflicts", weight=1, score=5),
        ]
    ).insert()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 7. JOBS                                                            ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Jobs...")
    jobs = [
        {"job_id": "JOB-2627-001", "title": "TPI - Pressure Vessels for RIL Jamnagar DTA Expansion",
         "status": "in_progress", "client_id": "CLT-001", "client_name": "Reliance Industries Limited",
         "client_unit_id": "CU-001", "client_unit_name": "RIL Jamnagar Refinery",
         "manufacturer_id": "MFR-001", "manufacturer_name": "Godrej Process Equipment",
         "job_type": "inspection", "job_type_category": "PV-PIPE",
         "service_line": "PART_B", "region_code": "W", "financial_year": "2627",
         "j_no": "W-2627-0001", "enquiry_id": "ENQ-2627-001",
         "budget_contract_amount": 3500000, "budget_inspector_fee": 2800000,
         "budget_travel_allowance": 700000, "budget_total": 3500000, "budget": 3500000,
         "assigned_inspector_id": "EMP-00004", "assigned_inspector_name": "Vikram Singh Rathore",
         "client_approval_status": "approved_by_client",
         "scope_of_work": [
             SOWItem(item_id="SOW-001", description="Material inspection & test certificates review",
                     category="Material Verification"),
             SOWItem(item_id="SOW-002", description="Welding procedure & welder qualification review",
                     category="Welding Inspection"),
             SOWItem(item_id="SOW-003", description="Dimensional check per ASME drawings",
                     category="Dimensional Inspection"),
             SOWItem(item_id="SOW-004", description="NDT witness (UT/RT/MT/PT)",
                     category="NDT Verification"),
             SOWItem(item_id="SOW-005", description="Hydrostatic test witness",
                     category="Pressure Test"),
             SOWItem(item_id="SOW-006", description="Final inspection & documentation review",
                     category="Final Inspection"),
         ],
         "scheduled_start_date": dt(90), "scheduled_end_date": future(60),
         "location_address": "Godrej Vikhroli Works, Mumbai, Maharashtra",
         "created_by": "EMP-00009"},

        {"job_id": "JOB-2627-002", "title": "Vendor Audit - L&T Valves for IOCL Paradip",
         "status": "in_progress", "client_id": "CLT-004", "client_name": "Indian Oil Corporation Limited",
         "client_unit_id": "CU-005", "client_unit_name": "IOCL Paradip Refinery",
         "manufacturer_id": "MFR-003", "manufacturer_name": "L&T Valves",
         "job_type": "inspection", "job_type_category": "VND-AUD",
         "service_line": "PART_A", "region_code": "S", "financial_year": "2627",
         "j_no": "S-2627-0001",
         "budget_contract_amount": 1200000, "budget_total": 1200000, "budget": 1200000,
         "assigned_inspector_id": "EMP-00006", "assigned_inspector_name": "Priya Venkatesh",
         "client_approval_status": "approved_by_client",
         "scheduled_start_date": dt(60), "scheduled_end_date": future(30),
         "location_address": "L&T Valves, Coimbatore, Tamil Nadu",
         "created_by": "EMP-00002"},

        {"job_id": "JOB-2627-003", "title": "NDT Radiography Services - BHEL Haridwar Turbine Shop",
         "status": "in_progress", "client_id": "CLT-003", "client_name": "BHEL",
         "client_unit_id": "CU-004", "client_unit_name": "BHEL Haridwar Plant",
         "manufacturer_id": "MFR-004", "manufacturer_name": "Bharat Forge Limited",
         "job_type": "inspection", "job_type_category": "NDT-RAD",
         "service_line": "PART_B", "region_code": "N", "financial_year": "2627",
         "j_no": "N-2627-0001",
         "budget_contract_amount": 2100000, "budget_total": 2100000, "budget": 2100000,
         "assigned_inspector_id": "EMP-00005", "assigned_inspector_name": "Mohammed Irfan Khan",
         "client_approval_status": "approved_by_client",
         "scheduled_start_date": dt(45), "scheduled_end_date": future(45),
         "created_by": "EMP-00001"},

        {"job_id": "JOB-2627-004", "title": "Electrical Equipment Inspection - ABB for HMEL Bathinda",
         "status": "in_progress", "client_id": "CLT-005", "client_name": "HPCL-Mittal Energy Limited",
         "client_unit_id": "CU-006", "client_unit_name": "HMEL Bathinda Refinery",
         "manufacturer_id": "MFR-006", "manufacturer_name": "ABB India Limited",
         "job_type": "inspection", "job_type_category": "PV-PIPE",
         "service_line": "PART_B", "region_code": "N", "financial_year": "2627",
         "j_no": "N-2627-0002",
         "budget_contract_amount": 1500000, "budget_total": 1500000, "budget": 1500000,
         "assigned_inspector_id": "EMP-00007", "assigned_inspector_name": "Amit Patel",
         "client_approval_status": "approved_by_client",
         "scheduled_start_date": dt(30), "scheduled_end_date": future(90),
         "created_by": "EMP-00001"},

        {"job_id": "JOB-2627-005", "title": "Pre-Shipment Inspection - Siemens Turbines for NTPC",
         "status": "draft", "client_id": "CLT-008", "client_name": "NTPC Limited",
         "manufacturer_id": "MFR-005", "manufacturer_name": "Siemens Energy India",
         "job_type": "inspection", "job_type_category": "PRE-SHP",
         "service_line": "PART_A", "region_code": "W", "financial_year": "2627",
         "j_no": "W-2627-0002",
         "budget_contract_amount": 2800000, "budget_total": 2800000, "budget": 2800000,
         "created_by": "EMP-00009"},
    ]
    for j in jobs:
        await Job(site_id=SITE, **j).insert()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 8. SERVICE ORDERS & PURCHASE ORDERS                               ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Service orders & POs...")
    await ServiceOrder(
        so_id="SO-2627-001", job_id="JOB-2627-001", site_id=SITE, status="active",
        client_id="CLT-001", client_name="Reliance Industries Limited",
        so_type="SO", so_number="IQE/RIL/2627/001", so_date=dt(100),
        amount=3500000, valid_from=dt(100), valid_until=future(180),
        term_type="PROJECT", created_by="EMP-00009"
    ).insert()
    await ServiceOrder(
        so_id="SO-2627-002", job_id="JOB-2627-002", site_id=SITE, status="active",
        client_id="CLT-004", client_name="Indian Oil Corporation Limited",
        so_type="SO", so_number="IQE/IOCL/2627/002", so_date=dt(55),
        amount=1200000, term_type="FIXED_PERIOD", created_by="EMP-00002"
    ).insert()

    await PurchaseOrder(
        po_id="PO-001", job_id="JOB-2627-001", site_id=SITE,
        po_number="PO/RIL/2626/094", po_date=dt(95),
        client_id="CLT-001", client_name="Reliance Industries Limited",
        client_unit_id="CU-001", client_unit_name="RIL Jamnagar Refinery",
        manufacturer_id="MFR-001", manufacturer_name="Godrej Process Equipment",
        po_amount=3500000, total_items=3,
        items=[
            POItemDetail(po_item_id="PI-001", item_no=1, description="PV Shell Inspection",
                         quantity=8, rate=150000, amount=1200000),
            POItemDetail(po_item_id="PI-002", item_no=2, description="HX Tube Bundle Inspection",
                         quantity=5, rate=200000, amount=1000000),
            POItemDetail(po_item_id="PI-003", item_no=3, description="NDT Witnessing",
                         quantity=15, rate=86667, amount=1300000),
        ],
        created_by="EMP-00009"
    ).insert()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 9. VISITS (inspection visits with findings)                       ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Visits...")
    visits = [
        {"visit_id": "VST-2627-001", "job_id": "JOB-2627-001", "po_id": "PO-001",
         "client_id": "CLT-001", "customer_name": "Reliance Industries Limited",
         "client_unit_id": "CU-001", "client_unit_name": "RIL Jamnagar Refinery",
         "manufacturer_id": "MFR-001", "manufacturer_name": "Godrej Process Equipment",
         "inspector_id": "EMP-00004", "inspector_name": "Vikram Singh Rathore",
         "status": "completed", "visit_type": "Regular Visit",
         "inspection_scope": "Material verification & WPS review for PV-101/102",
         "inspection_report_no": "IQE/RIL/2627/RPT-001",
         "visited_from": dt(80), "visited_to": dt(80),
         "quality_check_status": "approved", "quality_check_by": "EMP-00006",
         "finance_status": "approved", "finance_by": "EMP-00010",
         "expenses": [Expense(expense_id="EXP-001", type="travel", amount=4500, description="Mumbai to Vikhroli cab"),
                      Expense(expense_id="EXP-002", type="food", amount=800, description="Lunch allowance")],
         "findings": [Finding(finding_id="FND-001", description="Mill test certificate for SA-516 Gr.70 plate verified - conforms",
                              severity="observation", category="material")],
         "created_by": "EMP-00004"},

        {"visit_id": "VST-2627-002", "job_id": "JOB-2627-001", "po_id": "PO-001",
         "client_id": "CLT-001", "customer_name": "Reliance Industries Limited",
         "manufacturer_id": "MFR-001", "manufacturer_name": "Godrej Process Equipment",
         "inspector_id": "EMP-00004", "inspector_name": "Vikram Singh Rathore",
         "status": "completed", "visit_type": "Regular Visit",
         "inspection_scope": "Welding inspection & NDT witnessing PV-101 longitudinal seams",
         "inspection_report_no": "IQE/RIL/2627/RPT-002",
         "visited_from": dt(65), "visited_to": dt(65),
         "quality_check_status": "approved", "quality_check_by": "EMP-00006",
         "findings": [
             Finding(finding_id="FND-002", description="Root pass penetration insufficient at weld joint WJ-05",
                     severity="major", category="welding"),
             Finding(finding_id="FND-003", description="RT film interpretation - slag inclusion at location 120mm from datum",
                     severity="minor", category="ndt"),
         ],
         "created_by": "EMP-00004"},

        {"visit_id": "VST-2627-003", "job_id": "JOB-2627-001", "po_id": "PO-001",
         "client_id": "CLT-001", "customer_name": "Reliance Industries Limited",
         "manufacturer_id": "MFR-001", "manufacturer_name": "Godrej Process Equipment",
         "inspector_id": "EMP-00004", "inspector_name": "Vikram Singh Rathore",
         "status": "in_progress", "visit_type": "Regular Visit",
         "inspection_scope": "Hydrostatic test witness for PV-101",
         "visited_from": dt(5), "created_by": "EMP-00004"},

        {"visit_id": "VST-2627-004", "job_id": "JOB-2627-002",
         "client_id": "CLT-004", "customer_name": "Indian Oil Corporation Limited",
         "manufacturer_id": "MFR-003", "manufacturer_name": "L&T Valves",
         "inspector_id": "EMP-00006", "inspector_name": "Priya Venkatesh",
         "status": "completed", "visit_type": "Regular Visit",
         "inspection_scope": "Gate valve assembly inspection - 16\" 600# CS",
         "inspection_report_no": "IQE/IOCL/2627/RPT-001",
         "visited_from": dt(40), "visited_to": dt(40),
         "quality_check_status": "approved",
         "created_by": "EMP-00006"},

        {"visit_id": "VST-2627-005", "job_id": "JOB-2627-003",
         "client_id": "CLT-003", "customer_name": "BHEL",
         "manufacturer_id": "MFR-004", "manufacturer_name": "Bharat Forge Limited",
         "inspector_id": "EMP-00005", "inspector_name": "Mohammed Irfan Khan",
         "status": "scheduled", "visit_type": "Regular Visit",
         "inspection_scope": "Forging inspection and UT testing for HP turbine rotor",
         "planned_date": future(5), "created_by": "EMP-00001"},
    ]
    for v in visits:
        await Visit(site_id=SITE, **v).insert()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 10. INVOICES                                                      ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Invoices...")
    invoices = [
        {"invoice_id": "INV-2627-001", "job_id": "JOB-2627-001", "client_id": "CLT-001",
         "client_name": "Reliance Industries Limited", "invoice_number": "IQE/2627/001",
         "invoice_date": dt(70), "due_date": dt(40), "payment_status": "paid",
         "subtotal": 350000, "cgst": 31500, "sgst": 31500, "grand_total": 413000,
         "gstin_seller": "36AABCI1234A1Z5", "gstin_buyer": "24AABCR1234G1Z3",
         "hsn_sac_code": "998346", "tds_rate": 10.0, "tds_amount": 35000,
         "financial_year": "2627", "visit_ids": ["VST-2627-001"],
         "status": "approved", "created_by": "EMP-00010"},
        {"invoice_id": "INV-2627-002", "job_id": "JOB-2627-001", "client_id": "CLT-001",
         "client_name": "Reliance Industries Limited", "invoice_number": "IQE/2627/002",
         "invoice_date": dt(50), "due_date": dt(20), "payment_status": "unpaid",
         "subtotal": 450000, "cgst": 40500, "sgst": 40500, "grand_total": 531000,
         "gstin_seller": "36AABCI1234A1Z5", "gstin_buyer": "24AABCR1234G1Z3",
         "tds_rate": 10.0, "tds_amount": 45000, "financial_year": "2627",
         "visit_ids": ["VST-2627-002"],
         "status": "approved", "overdue_alert": True, "created_by": "EMP-00010"},
        {"invoice_id": "INV-2627-003", "job_id": "JOB-2627-002", "client_id": "CLT-004",
         "client_name": "Indian Oil Corporation Limited", "invoice_number": "IQE/2627/003",
         "invoice_date": dt(30), "due_date": future(0), "payment_status": "unpaid",
         "subtotal": 180000, "igst": 32400, "grand_total": 212400,
         "financial_year": "2627", "visit_ids": ["VST-2627-004"],
         "status": "approved", "created_by": "EMP-00010"},
    ]
    for inv in invoices:
        await Invoice(site_id=SITE, **inv).insert()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 11. PAYMENTS                                                      ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Payments...")
    await Payment(
        payment_id="PAY-2627-001", site_id=SITE, invoice_id="INV-2627-001",
        job_id="JOB-2627-001", client_id="CLT-001", client_name="Reliance Industries Limited",
        payment_date=dt(35), payment_mode="NEFT", transaction_ref="NEFT/RIL/2627/4521",
        bank_name="HDFC Bank", amount_received=413000, tds_deducted=35000, net_received=378000,
        tds_certificate_received=True, tds_26as_verified=True,
        created_by="EMP-00010"
    ).insert()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 12. FINANCE (AR / AP)                                             ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Finance AR/AP...")
    await AccountReceivable(
        ar_id="AR-2627-001", site_id=SITE, client_id="CLT-001",
        client_name="Reliance Industries Limited", invoice_id="INV-2627-002",
        invoice_number="IQE/2627/002", invoice_date=dt(50), due_date=dt(20),
        amount=531000, received=0, balance=531000,
        ageing_bucket="31-60", status="overdue",
        ho_pool_amount=132750, region_share_amount=398250,
        created_at=dt(50)
    ).insert()
    await AccountPayable(
        ap_id="AP-2627-001", site_id=SITE, vendor_id="MFR-001",
        vendor_name="Godrej Process Equipment", invoice_number="GPE/IQE/2627/001",
        invoice_date=dt(60), due_date=dt(15), amount=85000, paid=0, balance=85000,
        status="pending", created_at=dt(60)
    ).insert()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 13. AUTHORIZATIONS & COMPETENCE PROFILES                          ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Authorizations & competence...")
    inspectors = ["EMP-00004", "EMP-00005", "EMP-00006", "EMP-00007", "EMP-00011"]
    inspection_types_map = {
        "EMP-00004": ["pressure_vessels", "heat_exchangers", "piping", "welding", "ndt_witness"],
        "EMP-00005": ["ndt_radiography", "ndt_ultrasonic", "ndt_magnetic", "welding", "coatings"],
        "EMP-00006": ["pressure_vessels", "valves", "piping", "qc_review", "document_review"],
        "EMP-00007": ["switchgear", "transformers", "motors", "cables", "ex_equipment"],
        "EMP-00011": ["pumps", "compressors", "turbines", "gears", "rotating_equipment"],
    }
    for pid in inspectors:
        await Authorization(
            authorization_id=f"ATH-2627-{pid[-3:]}", person_id=pid, site_id=SITE,
            inspection_types=inspection_types_map[pid], status="authorized",
            qualification_verified=True, training_completed=True,
            supervised_inspections_count=5, supervised_required=3,
            witnessed_assessment_passed=True, witnessed_by="EMP-00002",
            authorized_by="EMP-00002", authorized_on=dt(200),
            valid_until=future(365),
        ).insert()

        await CompetenceProfile(
            profile_id=f"CP-{pid[-3:]}", person_id=pid, site_id=SITE,
            years_experience=random.randint(8, 20),
            disciplines=inspection_types_map[pid][:3],
            qualifications=[
                Qualification(qualification_type="CERTIFICATION", name="ASNT NDT Level II",
                              issuing_body="ASNT", expires_on=future(300), verified=True),
            ],
        ).insert()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 14. ASSIGNMENTS                                                   ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Assignments...")
    assignments = [
        {"assignment_id": "ASG-2627-001", "work_package_id": "WP-001", "job_id": "JOB-2627-001",
         "person_id": "EMP-00004", "person_name": "Vikram Singh Rathore",
         "role": "INSPECTION_OFFICER", "status": "active",
         "client_approval_required": True, "client_approved_at": dt(88)},
        {"assignment_id": "ASG-2627-002", "work_package_id": "WP-002", "job_id": "JOB-2627-002",
         "person_id": "EMP-00006", "person_name": "Priya Venkatesh",
         "role": "INSPECTION_OFFICER", "status": "active"},
        {"assignment_id": "ASG-2627-003", "work_package_id": "WP-003", "job_id": "JOB-2627-003",
         "person_id": "EMP-00005", "person_name": "Mohammed Irfan Khan",
         "role": "INSPECTION_OFFICER", "status": "active"},
        {"assignment_id": "ASG-2627-004", "work_package_id": "WP-004", "job_id": "JOB-2627-004",
         "person_id": "EMP-00007", "person_name": "Amit Patel",
         "role": "INSPECTION_OFFICER", "status": "active"},
    ]
    for a in assignments:
        await Assignment(site_id=SITE, **a).insert()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 15. RFIs                                                          ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → RFIs...")
    rfis = [
        {"rfi_id": "RFI-2627-001", "job_id": "JOB-2627-001",
         "contractor_name": "Godrej Process Equipment", "raised_by": "Nikhil Godrej",
         "inspection_point_type": "hold", "discipline": "Pressure Vessels",
         "description": "Hold point: Hydrostatic test PV-101 at 1.5x design pressure (24 bar)",
         "location": "Vikhroli Works Bay 3", "requested_date": dt(7),
         "scheduled_date": dt(5), "scheduled_by": "EMP-00003",
         "inspector_person_id": "EMP-00004", "tm_confirmed": True, "tm_confirmed_by": "EMP-00002",
         "status": "scheduled", "turnaround_hours": 48},
        {"rfi_id": "RFI-2627-002", "job_id": "JOB-2627-001",
         "contractor_name": "Godrej Process Equipment",
         "inspection_point_type": "witness", "discipline": "NDT",
         "description": "Witness point: RT of circumferential weld seams PV-101",
         "status": "inspected", "result": "accepted",
         "inspection_date": dt(65), "visit_id": "VST-2627-002", "turnaround_hours": 24},
        {"rfi_id": "RFI-2627-003", "job_id": "JOB-2627-002",
         "contractor_name": "L&T Valves",
         "inspection_point_type": "hold", "discipline": "Valves",
         "description": "Hold point: FAT for 16\" 600# gate valve - body pressure test",
         "status": "open", "requested_date": future(10)},
    ]
    for r in rfis:
        await RFI(site_id=SITE, **r).insert()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 16. PUNCH LIST                                                    ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Punch list...")
    punches = [
        {"punch_id": "PL-2627-001", "job_id": "JOB-2627-001",
         "description": "Weld repair required at joint WJ-05 per NCR-001 - re-weld root pass",
         "category": "A", "discipline": "Welding", "location": "PV-101, Longitudinal Seam 3",
         "raised_by": "EMP-00004", "assigned_to": "MFR-001",
         "status": "open", "due_date": future(7)},
        {"punch_id": "PL-2627-002", "job_id": "JOB-2627-001",
         "description": "Missing identification stamp on SA-516 plate batch #4521",
         "category": "B", "discipline": "Material", "location": "Raw Material Store",
         "raised_by": "EMP-00004", "status": "corrected", "corrected_on": dt(10)},
        {"punch_id": "PL-2627-003", "job_id": "JOB-2627-002",
         "description": "Seat leakage during low-pressure test - valve SN LTV-2627-048",
         "category": "A", "discipline": "Valves", "location": "Test Bay 2",
         "raised_by": "EMP-00006", "status": "open", "due_date": future(14)},
    ]
    for p in punches:
        await PunchItem(site_id=SITE, **p).insert()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 17. RELEASE NOTES                                                 ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Release notes...")
    await InspectionReleaseNote(
        irn_id="IRN-2627-001", site_id=SITE, job_id="JOB-2627-001",
        description="Pressure Vessel - Naphtha Splitter Overhead Drum (PV-101)",
        hold_points_signed=True, ncrs_closed=True, cat_a_punch_closed=False,
        recommended_by="EMP-00002", recommended_on=dt(8),
        status="recommended"
    ).insert()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 18. CLIENT FEEDBACK                                               ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Client feedback...")
    feedbacks = [
        {"feedback_id": "FBK-2627-001", "client_id": "CLT-001", "client_name": "Reliance Industries Limited",
         "job_id": "JOB-2627-001", "overall_rating": 4, "timeliness_rating": 4,
         "report_quality_rating": 5, "inspector_competence_rating": 5, "communication_rating": 4,
         "comments": "Vikram's expertise on PV inspection is excellent. Reports are thorough."},
        {"feedback_id": "FBK-2627-002", "client_id": "CLT-004", "client_name": "Indian Oil Corporation Limited",
         "job_id": "JOB-2627-002", "overall_rating": 3, "timeliness_rating": 2,
         "report_quality_rating": 4, "inspector_competence_rating": 4, "communication_rating": 3,
         "comments": "Report quality is good but scheduling delays need improvement.",
         "requires_escalation": True, "escalated_to_mrm": True, "mrm_ref": "MRM-2627-001"},
    ]
    for f in feedbacks:
        await ClientFeedback(site_id=SITE, **f).insert()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 19. JOB HANDOFF (Enquiry → Job conversion)                        ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Job handoff...")
    await JobConversion(
        conversion_id="JC-2627-001", site_id=SITE,
        enquiry_id="ENQ-2627-001", job_id="JOB-2627-001",
        j_no="W-2627-0001", client_id="CLT-001", client_name="Reliance Industries Limited",
        service_line="PART_B", region_code="W", award_value=3500000,
        converted_by="EMP-00009", converted_on=dt(95),
        handoff_checklist={"so_created": True, "po_received": True, "inspector_assigned": True,
                           "itp_approved": True, "kickoff_done": True},
        status="completed"
    ).insert()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 20. REPORT SIGN-OFFS                                              ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Report sign-offs...")
    signoffs = [
        {"signoff_id": "SGN-2627-001", "job_id": "JOB-2627-001", "visit_id": "VST-2627-001",
         "report_ref": "IQE/RIL/2627/RPT-001", "report_type": "inspection_report",
         "inspector_person_id": "EMP-00004", "inspector_name": "Vikram Singh Rathore",
         "reviewer_person_id": "EMP-00006", "reviewer_name": "Priya Venkatesh",
         "tm_person_id": "EMP-00002", "tm_name": "Suresh Babu Naidu",
         "inspector_signed_on": dt(79), "reviewer_signed_on": dt(78),
         "tm_signed_on": dt(77), "status": "approved"},
        {"signoff_id": "SGN-2627-002", "job_id": "JOB-2627-001", "visit_id": "VST-2627-002",
         "report_ref": "IQE/RIL/2627/RPT-002", "report_type": "inspection_report",
         "inspector_person_id": "EMP-00004",
         "reviewer_person_id": "EMP-00006",
         "inspector_signed_on": dt(64), "status": "pending_tm"},
    ]
    for s in signoffs:
        await ReportSignoff(site_id=SITE, **s).insert()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 21. WIN/LOSS RECORDS                                              ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Win/Loss records...")
    wl = [
        {"record_id": "WL-2627-001", "enquiry_id": "ENQ-2627-001", "client_id": "CLT-001",
         "client_name": "Reliance Industries Limited", "outcome": "won",
         "j_no": "W-2627-0001", "award_value": 3500000, "proposal_value": 3500000,
         "service_line": "PART_B", "region_code": "W", "sector": "oil_gas",
         "margin_pct": 22.5, "cycle_days": 25},
        {"record_id": "WL-2627-002", "enquiry_id": "ENQ-2627-004", "client_id": "CLT-006",
         "client_name": "Cipla Limited", "outcome": "no_go",
         "no_go_reason_codes": ["SCOPE_OUTSIDE_ACCREDITATION", "NO_PHARMA_INSPECTOR"],
         "service_line": "PART_A", "region_code": "W", "sector": "pharma",
         "proposal_value": 800000, "cycle_days": 15},
    ]
    for w in wl:
        await WinLossRecord(site_id=SITE, **w).insert()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 22. RECRUITMENT PIPELINE                                          ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Recruitment...")
    await ManpowerRequest(
        request_id="MPR-2627-001", site_id=SITE, job_id="JOB-2627-005",
        region_code="W", requested_by="EMP-00009",
        position_title="Senior Inspection Officer - Rotating Equipment",
        category="TECHNICAL_INSPECTION", engagement_type="PERMANENT",
        required_qualifications=["ASNT NDT Level II", "CSWIP 3.1"],
        required_experience_years=10, headcount=1, budget_per_head=120000,
        within_budget=True, budget_approved=True, approved_by="EMP-00008",
        priority="urgent", status="sourcing", target_date=future(30)
    ).insert()

    candidates = [
        {"candidate_id": "CND-2627-001", "request_id": "MPR-2627-001",
         "full_name": "Arun Krishnamurthy", "email": "arun.k@gmail.com", "phone": "+91-9812345670",
         "source": "portal", "source_detail": "Naukri.com",
         "experience_years": 12, "current_employer": "Bureau Veritas India",
         "current_designation": "Senior Inspector", "expected_ctc": 1400000,
         "qualifications": [CandidateQualification(name="ASNT NDT Level II - UT", issuing_body="ASNT", year=2018)],
         "status": "tm_interview"},
        {"candidate_id": "CND-2627-002", "request_id": "MPR-2627-001",
         "full_name": "Manoj Tiwari", "email": "manoj.t@outlook.com", "phone": "+91-9812345671",
         "source": "referral", "source_detail": "Referred by EMP-00004 (Vikram)",
         "experience_years": 8, "current_employer": "TUV SUD India",
         "current_designation": "Inspection Engineer", "expected_ctc": 1100000,
         "qualifications": [CandidateQualification(name="CSWIP 3.1", issuing_body="TWI", year=2020)],
         "status": "screening"},
    ]
    for c in candidates:
        await Candidate(site_id=SITE, **c).insert()

    await TechnicalInterview(
        interview_id="INT-2627-001", candidate_id="CND-2627-001", request_id="MPR-2627-001",
        site_id=SITE, interviewer_person_id="EMP-00002",
        interview_date=dt(5), interview_mode="video",
        technical_score=8, domain_knowledge=9, practical_assessment=7, communication=7,
        overall_recommendation="fit",
        remarks="Strong rotating equipment experience. Recommended for offer."
    ).insert()

    await OfferLetter(
        offer_id="OFR-2627-001", candidate_id="CND-2627-001", request_id="MPR-2627-001",
        site_id=SITE, offer_type="appointment", designation="Senior Inspection Officer",
        department="Inspection", engagement_type="PERMANENT",
        ctc_offered=1350000, joining_date=future(30), probation_months=6,
        reporting_to_person_id="EMP-00002", status="sent", sent_on=dt(2)
    ).insert()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 23. LEAVE & ATTENDANCE                                            ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Leave & attendance...")
    await LeaveRequest(
        leave_id="LV-2627-001", person_id="EMP-00004", site_id=SITE,
        leave_type="earned", from_date=future(15), to_date=future(19),
        days=5, reason="Annual vacation", status="approved",
        approved_by="EMP-00001", approved_on=dt(3)
    ).insert()
    await LeaveRequest(
        leave_id="LV-2627-002", person_id="EMP-00005", site_id=SITE,
        leave_type="sick", from_date=dt(10), to_date=dt(9),
        days=2, reason="Fever", status="approved", approved_by="EMP-00001"
    ).insert()

    # Attendance for last 5 days for 2 inspectors
    for day_offset in range(5):
        for pid, name in [("EMP-00004", "Vikram"), ("EMP-00005", "Irfan")]:
            await AttendanceRecord(
                attendance_id=f"ATT-{pid[-3:]}-{day_offset}",
                person_id=pid, site_id=SITE,
                date=dt(day_offset), status="present",
                check_in=dt(day_offset) - timedelta(hours=1),
                check_out=dt(day_offset) + timedelta(hours=8),
                hours_worked=8.0 + random.random(),
                region_code="W" if pid == "EMP-00004" else "E"
            ).insert()

    await Timesheet(
        timesheet_id="TS-2627-004-10", person_id="EMP-00004", site_id=SITE,
        period_month=10, period_year=2026, home_region="W", working_region="W",
        entries=[
            TimesheetEntry(date=dt(d), job_id="JOB-2627-001", hours=8, activity_type="inspection")
            for d in range(20)
        ],
        total_days=20, total_hours=160, status="submitted",
        created_by="EMP-00004"
    ).insert()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 24. PAYROLL                                                       ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Payroll...")
    await PayrollRun(
        run_id="PR-2627-09", site_id=SITE, region_code="W",
        period_month=9, period_year=2026, status="disbursed",
        total_gross=1200000, total_deductions=240000, total_net=960000, headcount=8,
        processed_by="EMP-00010", processed_on=dt(35),
        approved_by="EMP-00008", approved_on=dt(33), disbursed_on=dt(30)
    ).insert()
    await PayrollRun(
        run_id="PR-2627-10", site_id=SITE, period_month=10, period_year=2026,
        status="processing", total_gross=1250000, total_deductions=250000,
        total_net=1000000, headcount=8, processed_by="EMP-00010"
    ).insert()

    # Payslips for Sep
    for pid, name, basic in [("EMP-00004", "Vikram", 85000), ("EMP-00005", "Irfan", 75000),
                              ("EMP-00007", "Amit", 70000)]:
        hra = basic * 0.4; conv = 3200; special = basic * 0.15
        gross = basic + hra + conv + special
        pf = basic * 0.12; esi = gross * 0.0075; pt = 200; tds = gross * 0.1
        deductions = pf + esi + pt + tds
        await Payslip(
            payslip_id=f"PS-2627-09-{pid[-3:]}", run_id="PR-2627-09",
            person_id=pid, site_id=SITE, period_month=9, period_year=2026,
            basic_salary=basic, hra=hra, conveyance=conv, special_allowance=special,
            gross_salary=gross, pf_employee=pf, pf_employer=pf,
            esi_employee=esi, professional_tax=pt, tds=tds,
            total_deductions=deductions, net_salary=gross - deductions,
            days_present=22, payment_mode="NEFT", paid_on=dt(30)
        ).insert()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 25. APPRAISALS                                                    ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Appraisals...")
    await Appraisal(
        appraisal_id="APR-2627-001", person_id="EMP-00004", site_id=SITE,
        period="2025-26", appraisal_type="annual",
        appraiser_person_id="EMP-00002", reviewer_person_id="EMP-00001",
        technical_score=9, quality_score=9, timeliness_score=8,
        communication_score=7, safety_score=10,
        overall_rating=8.6, overall_grade="A",
        strengths="Excellent PV and HX inspection expertise. Very thorough documentation.",
        areas_for_improvement="Could improve client communication turnaround.",
        recommendations="Recommend for Technical Manager track. Consider for Team Lead role.",
        status="completed"
    ).insert()

    await WitnessedInspection(
        witness_id="WIT-2627-001", person_id="EMP-00011",
        site_id=SITE, job_id="JOB-2627-001", visit_id="VST-2627-002",
        witness_person_id="EMP-00002",
        discipline="Rotating Equipment", inspection_type="pumps",
        performance_score=7, knowledge_score=8, procedure_adherence_score=8,
        recommendation="satisfactory",
        remarks="Good grasp of pump inspection. Needs more exposure to high-speed compressors.",
        witness_date=dt(65)
    ).insert()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 26. PURCHASING                                                    ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Purchasing...")
    await PurchaseRequisition(
        requisition_id="PRQ-2627-001", site_id=SITE,
        vendor_name="Welding Research Institute", vendor_type="service_provider",
        purpose="Annual calibration of NDT equipment - UT flaw detector & thickness gauge",
        items=[
            PurchaseItem(item_no=1, description="UT Flaw Detector Calibration", quantity=2, rate=15000, amount=30000),
            PurchaseItem(item_no=2, description="Thickness Gauge Calibration", quantity=4, rate=8000, amount=32000),
        ],
        total_amount=62000, requested_by="EMP-00005", status="approved",
        approved_by="EMP-00002", approved_on=dt(20), is_msme=True,
        msme_registration="UDYAM-MH-12-0012345"
    ).insert()

    await VendorPayment(
        vp_id="VP-2627-001", site_id=SITE,
        vendor_name="Welding Research Institute", vendor_type="service_provider",
        requisition_id="PRQ-2627-001", invoice_number="WRI/2627/0145",
        invoice_date=dt(15), amount=62000, tds_deducted=6200, net_payable=55800,
        due_date=future(15), status="pending", tm_approved=True,
        tm_approved_by="EMP-00002", is_msme=True, msme_45day_compliant=True
    ).insert()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 27. INSPECTOR LOANS & DEPUTY COVERAGE                            ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Inspector loans & deputy coverage...")
    await InspectorLoan(
        loan_id="LOAN-2627-001", inspector_person_id="EMP-00005",
        home_region="E", borrowing_region="N", job_id="JOB-2627-003",
        rate_card_rate=8500, start_date=dt(45), end_date=future(45),
        status="active", approved_by="EMP-00001",
        remarks="Loaned for NDT work at BHEL Haridwar"
    ).insert()

    await DeputyCoverage(
        coverage_id="DEP-2627-001", absent_role="IC", region_code="W",
        absent_person_id="EMP-00003",
        deputy_person_id="EMP-00001", deputy_role="RH",
        scope_limits="Within authorized scope; escalate to TM for new service lines",
        arranged_by="EMP-00008", notes="Anita on 2-week leave, Rajesh covers IC duties",
        valid_from=dt(5), valid_until=future(10)
    ).insert()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 28. MRM AGENDA                                                    ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → MRM agenda...")
    mrm_items = [
        {"mrm_id": "MRM-2627-001", "meeting_date": future(15), "period": "2026-Q3",
         "category": "feedback", "title": "IOCL scheduling delay feedback - action required",
         "description": "Client rated timeliness 2/5. Root cause: IC was on leave, no deputy coverage.",
         "presenter": "EMP-00002", "status": "draft",
         "action_items": ["Implement mandatory deputy coverage for IC role", "Review scheduling SLA"]},
        {"mrm_id": "MRM-2627-002", "meeting_date": future(15), "period": "2026-Q3",
         "category": "win_loss", "title": "Q3 Win/Loss Analysis - 65% win rate",
         "presenter": "EMP-00009", "status": "draft"},
        {"mrm_id": "MRM-2627-003", "meeting_date": future(15), "period": "2026-Q3",
         "category": "kpi", "title": "RFI turnaround KPI - avg 36hrs (target: 48hrs)",
         "presenter": "EMP-00003", "status": "draft"},
    ]
    for m in mrm_items:
        await MRMAgendaItem(site_id=SITE, **m).insert()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 29. NCRs                                                          ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → NCRs...")
    await NCR(
        ncr_id="NCR-2627-001", site_id=SITE, job_id="JOB-2627-001",
        visit_id="VST-2627-002", title="Welding defect - incomplete root penetration WJ-05",
        description="During RT examination of PV-101 longitudinal seam, incomplete root penetration found at WJ-05. Defect length approx 45mm.",
        severity="major", category="welding",
        raised_by="EMP-00004", raised_on=dt(65),
        status="open", corrective_action_required=True,
        root_cause="Insufficient heat input during root pass. Welder used incorrect parameters.",
        corrective_action="Re-weld root pass per approved WPS. Re-examine by RT.",
        created_at=dt(65)
    ).insert()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 30. EQUIPMENT & CALIBRATION                                       ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Equipment...")
    equip = [
        {"equipment_id": "EQ-001", "name": "UT Flaw Detector - Olympus EPOCH 650",
         "serial_number": "EP650-2024-0892", "category": "NDT",
         "assigned_to": "EMP-00005", "calibration_status": "valid",
         "next_calibration_due": future(180)},
        {"equipment_id": "EQ-002", "name": "Digital Thickness Gauge - DM5E",
         "serial_number": "DM5E-2023-1456", "category": "NDT",
         "assigned_to": "EMP-00005", "calibration_status": "valid",
         "next_calibration_due": future(90)},
        {"equipment_id": "EQ-003", "name": "Welding Gauge Set - Cambridge Type",
         "serial_number": "WGS-2022-0234", "category": "Welding Inspection",
         "assigned_to": "EMP-00004", "calibration_status": "valid",
         "next_calibration_due": future(120)},
    ]
    for eq in equip:
        await Equipment(site_id=SITE, is_active=True, **eq).insert()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 31. EXTERNAL PROVIDERS (subcontractors)                           ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → External providers...")
    await ExternalProvider(
        provider_id="EP-001", site_id=SITE, name="NDT Specialists India Pvt Ltd",
        provider_type="subcontractor", services=["RT", "UT", "MT", "PT"],
        city="Mumbai", state="Maharashtra", contact_person="Rajiv Mehta",
        email="info@ndtspecialists.in", phone="+91-22-28457890",
        status="approved", approved_on=dt(365), next_evaluation_due=future(90)
    ).insert()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 32. NOTIFICATIONS                                                 ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Notifications...")
    notifications = [
        {"notification_id": "NTF-001", "person_id": "EMP-00004", "category": "rfi_raised",
         "title": "New RFI: Hydrostatic Test PV-101", "message": "RFI-2627-001 raised by Godrej for hold point inspection",
         "link": "/rfis", "is_read": False},
        {"notification_id": "NTF-002", "person_id": "EMP-00002", "category": "report_signoff",
         "title": "Report pending TM sign-off", "message": "Report IQE/RIL/2627/RPT-002 awaiting your approval",
         "link": "/signoffs", "is_read": False},
        {"notification_id": "NTF-003", "person_id": "EMP-00010", "category": "invoice_overdue",
         "title": "Invoice overdue: IQE/2627/002", "message": "₹5,31,000 overdue from RIL by 20 days",
         "link": "/invoices", "is_read": False},
        {"notification_id": "NTF-004", "person_id": "EMP-00004", "category": "assignment",
         "title": "New assignment: JOB-2627-001", "message": "You have been assigned as Inspection Officer for RIL Jamnagar PV inspection",
         "link": "/jobs", "is_read": True},
        {"notification_id": "NTF-005", "person_id": "EMP-00012", "category": "recruitment",
         "title": "Interview feedback received", "message": "TM recommends Arun Krishnamurthy (CND-2627-001) as fit",
         "link": "/recruitment", "is_read": False},
    ]
    for n in notifications:
        await InAppNotification(**n).insert()

    await EmailLog(
        log_id="EML-001", category="invoice_reminder", channel="email",
        to_addresses=["procurement@ril.com"], subject="Payment reminder: Invoice IQE/2627/002",
        body_template="Dear Sir/Madam, this is a reminder for invoice IQE/2627/002 dated...",
        status="sent", sent_at=dt(5)
    ).insert()

    await NotificationPreference(
        person_id="EMP-00004",
        channel_preferences={"email": True, "in_app": True, "sms": False},
        category_subscriptions={"rfi_raised": True, "assignment": True, "report_signoff": True,
                                 "invoice_overdue": False},
        timezone="Asia/Kolkata", receives_daily_digest=True
    ).insert()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 33. ASSOCIATES                                                    ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Associates...")
    await Associate(
        associate_id="ASC-001", site_id=SITE, name="NDT Specialists India Pvt Ltd",
        contact_person="Rajiv Mehta", contact_number="+91-22-28457890",
        email="accounts@ndtspecialists.in", mileage_per_km=12.0, cost=8500,
        bank_account="1234567890", ifsc_code="HDFC0001234",
        pan="AABCN1234A", is_active=True
    ).insert()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 34. RISKS & INTERNAL AUDITS                                       ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Risks & audits...")
    await Risk(
        risk_id="RSK-2627-001", site_id=SITE,
        title="Inspector availability crunch in North region",
        description="Only 2 inspectors authorized for PV work in North. BHEL and HMEL jobs overlap.",
        category="operational", likelihood=4, impact=3, risk_score=12,
        mitigation="Cross-region loan from West (EMP-00004). Recruitment in progress (MPR-2627-001).",
        owner="EMP-00001", status="mitigating", created_at=dt(30)
    ).insert()

    await InternalAudit(
        audit_id="IA-2627-001", site_id=SITE,
        title="QMS Surveillance Audit - West Region",
        audit_type="surveillance", scope="ISO/IEC 17020 clauses 5, 6, 7",
        auditee_region="W", lead_auditor="EMP-00002",
        planned_date=future(30), status="planned",
        created_by="EMP-00008"
    ).insert()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ DONE                                                              ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    counts = {
        "people": await db["people"].count_documents({}),
        "clients": await db["clients"].count_documents({}),
        "client_units": await db["client_units"].count_documents({}),
        "manufacturers": await db["manufacturers"].count_documents({}),
        "jobs": await db["jobs"].count_documents({}),
        "enquiries": await db["enquiries"].count_documents({}),
        "visits": await db["visits"].count_documents({}),
        "invoices": await db["invoices"].count_documents({}),
        "payments": await db["payments"].count_documents({}),
        "regions": await db["regions"].count_documents({}),
        "rfis": await db["rfis"].count_documents({}),
        "punch_items": await db["punch_items"].count_documents({}),
        "assignments": await db["assignments"].count_documents({}),
        "candidates": await db["candidates"].count_documents({}),
        "payroll_runs": await db["payroll_runs"].count_documents({}),
        "notifications": await db["in_app_notifications"].count_documents({}),
    }

    print("\n✅ Seed complete! Collection counts:")
    for name, count in counts.items():
        print(f"   {name}: {count}")

    print(f"\n📊 Total records: {sum(counts.values())}+")
    print("\n🔑 Test logins:")
    print("   admin / admin@iqeipl.com (System Admin)")
    print("   rajesh.sharma (Regional Head - North)")
    print("   suresh.naidu (Technical Manager - South)")
    print("   vikram.rathore (Senior Inspector)")
    print("   irfan.khan (Inspector)")
    print("   lakshmi.n (Finance Manager)")
    print("\n💡 AUTH_ALLOW_ANONYMOUS=true means all API calls work without login in dev mode.")


if __name__ == "__main__":
    asyncio.run(seed())
