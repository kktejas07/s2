"""
Bulk-seed gap-fill collections with high volumes for realistic testing.
Drops existing gap-fill data and re-inserts with target counts.

Run:  cd backend && .venv/bin/python scripts/bulk_seed_gap_fill.py
"""
import asyncio
import random
import string
from datetime import datetime, timedelta

from pymongo import AsyncMongoClient
from beanie import init_beanie

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from core.config import settings

# ── Core models (for beanie init) ──
from modules.auth.models import UserLogin
from modules.clients.models import Client, ClientUnit
from modules.manufacturers.models import Manufacturer, ManufacturerUnit
from modules.users.models import Competency, InspectorRate, Associate
from modules.jobs.models import Job
from modules.service_orders.models import ServiceOrder
from modules.purchase_orders.models import PurchaseOrder
from modules.visits.models import Visit
from modules.invoices.models import Invoice
from modules.payments.models import Payment, DunningRecord
from modules.enquiries.models import Enquiry, GoNoGoDecision, ProposalRevision
from modules.enquiries.reason_codes import ReasonCode
from modules.providers.models import ExternalProvider, EvaluationRecord, PerformanceRecord, SubcontractConsent
from modules.complaints.models import CustomerComplaint
from modules.documents.models import Document as DocModel
from modules.analytics.models import AnalyticsEvent
from modules.finance.models import AccountReceivable, AccountPayable
from modules.control_numbers.models import ControlNumber
from modules.risk.models import Risk, RiskReview, InternalAudit
from modules.ncr.models import NCR
from modules.rates.models import RateCard, RateFloor
from modules.commercial.models import Amendment
from modules.itp.models import InspectionCall, InspectionTestPlan
from modules.construction_bill_verification.models import ConstructionBillVerificationRecord
from modules.schedule_m_pharma_epc.models import ScheduleMPharmaEPCProject
from modules.tpi.models import TpiReport
from modules.work_types.models import WorkTypeDefinition
from modules.work_packages.models import WorkPackage
from modules.certifications.models import Certification
from modules.billing.models import BillingTerms
from modules.people.models import Person, CompetenceProfile, Authorization, ImpartialityDeclaration
from modules.assignments.models import Assignment
from modules.equipment.models import CalibrationRecord, Equipment, EquipmentUsage
from modules.evidence.models import Evidence
from modules.reporting.models import ReportFormat
from modules.appeals.models import Appeal
from core.audit import AuditEntry
from core.sequences import Sequence

# ── Gap-fill models ──
from modules.regions.models import Region, Office, InterOfficeSettlement, InspectorLoan, DeputyCoverage
from modules.recruitment.models import (
    ManpowerRequest, Candidate, TechnicalInterview, OfferLetter,
    InductionChecklist, InductionItem, CandidateQualification, DEFAULT_INDUCTION_ITEMS,
)
from modules.leave_attendance.models import LeaveRequest, AttendanceRecord, Timesheet, TimesheetEntry
from modules.payroll.models import PayrollRun, Payslip
from modules.appraisal.models import Appraisal, WitnessedInspection, KPIScore, CompetenceAssessment
from modules.exit_management.models import ExitProcess, ExitChecklistItem, DEFAULT_EXIT_CHECKLIST
from modules.purchasing.models import PurchaseRequisition, VendorPayment, PurchaseItem
from modules.rfi.models import RFI
from modules.punch_list.models import PunchItem
from modules.release_notes.models import InspectionReleaseNote
from modules.feedback.models import ClientFeedback, MRMAgendaItem
from modules.job_handoff.models import JobConversion
from modules.signoff.models import ReportSignoff
from modules.win_loss.models import WinLossRecord
from modules.notifications.models import EmailLog, NotificationPreference, InAppNotification

SITE = "SITE-01"
NOW = datetime.now()

def dt(days_ago: int = 0) -> datetime:
    return NOW - timedelta(days=days_ago)

def future(days: int) -> datetime:
    return NOW + timedelta(days=days)

def rdt(max_days_ago=365):
    return dt(random.randint(0, max_days_ago))

def rc(lst):
    return random.choice(lst)

# ── Reference data ──
REGIONS = ["N", "S", "E", "W"]
REGION_NAMES = {"N": "North", "S": "South", "E": "East", "W": "West"}

INDIAN_CITIES = [
    ("New Delhi", "Delhi", "N"), ("Noida", "Uttar Pradesh", "N"), ("Gurgaon", "Haryana", "N"),
    ("Lucknow", "Uttar Pradesh", "N"), ("Chandigarh", "Punjab", "N"), ("Jaipur", "Rajasthan", "N"),
    ("Dehradun", "Uttarakhand", "N"), ("Agra", "Uttar Pradesh", "N"), ("Kanpur", "Uttar Pradesh", "N"),
    ("Varanasi", "Uttar Pradesh", "N"), ("Amritsar", "Punjab", "N"), ("Meerut", "Uttar Pradesh", "N"),
    ("Ghaziabad", "Uttar Pradesh", "N"), ("Faridabad", "Haryana", "N"), ("Panipat", "Haryana", "N"),
    ("Ambala", "Haryana", "N"), ("Shimla", "Himachal Pradesh", "N"), ("Jammu", "Jammu & Kashmir", "N"),
    ("Ludhiana", "Punjab", "N"), ("Patiala", "Punjab", "N"), ("Jodhpur", "Rajasthan", "N"),
    ("Udaipur", "Rajasthan", "N"), ("Bikaner", "Rajasthan", "N"), ("Kota", "Rajasthan", "N"),
    ("Mathura", "Uttar Pradesh", "N"), ("Bareilly", "Uttar Pradesh", "N"), ("Allahabad", "Uttar Pradesh", "N"),
    ("Gorakhpur", "Uttar Pradesh", "N"), ("Aligarh", "Uttar Pradesh", "N"), ("Moradabad", "Uttar Pradesh", "N"),
    ("Rishikesh", "Uttarakhand", "N"), ("Haridwar", "Uttarakhand", "N"), ("Haldwani", "Uttarakhand", "N"),
    ("Sonipat", "Haryana", "N"), ("Karnal", "Haryana", "N"), ("Hisar", "Haryana", "N"),
    ("Rohtak", "Haryana", "N"), ("Bathinda", "Punjab", "N"), ("Jalandhar", "Punjab", "N"),
    ("Pathankot", "Punjab", "N"), ("Sri Ganganagar", "Rajasthan", "N"), ("Ajmer", "Rajasthan", "N"),
    ("Bhilwara", "Rajasthan", "N"), ("Alwar", "Rajasthan", "N"), ("Sikar", "Rajasthan", "N"),
    ("Muzaffarnagar", "Uttar Pradesh", "N"), ("Saharanpur", "Uttar Pradesh", "N"),
    ("Firozabad", "Uttar Pradesh", "N"), ("Etawah", "Uttar Pradesh", "N"), ("Rae Bareli", "Uttar Pradesh", "N"),
    ("Hyderabad", "Telangana", "S"), ("Chennai", "Tamil Nadu", "S"), ("Bengaluru", "Karnataka", "S"),
    ("Visakhapatnam", "Andhra Pradesh", "S"), ("Coimbatore", "Tamil Nadu", "S"),
    ("Kochi", "Kerala", "S"), ("Thiruvananthapuram", "Kerala", "S"), ("Madurai", "Tamil Nadu", "S"),
    ("Vijayawada", "Andhra Pradesh", "S"), ("Mysuru", "Karnataka", "S"),
    ("Mangaluru", "Karnataka", "S"), ("Tiruchirappalli", "Tamil Nadu", "S"),
    ("Tirupati", "Andhra Pradesh", "S"), ("Hubballi", "Karnataka", "S"),
    ("Salem", "Tamil Nadu", "S"), ("Nellore", "Andhra Pradesh", "S"),
    ("Rajahmundry", "Andhra Pradesh", "S"), ("Warangal", "Telangana", "S"),
    ("Nizamabad", "Telangana", "S"), ("Karimnagar", "Telangana", "S"),
    ("Guntur", "Andhra Pradesh", "S"), ("Kakinada", "Andhra Pradesh", "S"),
    ("Thrissur", "Kerala", "S"), ("Kozhikode", "Kerala", "S"), ("Kollam", "Kerala", "S"),
    ("Bellary", "Karnataka", "S"), ("Davangere", "Karnataka", "S"), ("Shimoga", "Karnataka", "S"),
    ("Tumkur", "Karnataka", "S"), ("Erode", "Tamil Nadu", "S"), ("Vellore", "Tamil Nadu", "S"),
    ("Thanjavur", "Tamil Nadu", "S"), ("Thoothukudi", "Tamil Nadu", "S"), ("Dindigul", "Tamil Nadu", "S"),
    ("Tirunelveli", "Tamil Nadu", "S"), ("Kurnool", "Andhra Pradesh", "S"),
    ("Anantapur", "Andhra Pradesh", "S"), ("Ongole", "Andhra Pradesh", "S"),
    ("Eluru", "Andhra Pradesh", "S"), ("Srikakulam", "Andhra Pradesh", "S"),
    ("Secunderabad", "Telangana", "S"), ("Khammam", "Telangana", "S"),
    ("Mahbubnagar", "Telangana", "S"), ("Nalgonda", "Telangana", "S"),
    ("Kannur", "Kerala", "S"), ("Palakkad", "Kerala", "S"),
    ("Malappuram", "Kerala", "S"), ("Alappuzha", "Kerala", "S"),
    ("Kottayam", "Kerala", "S"), ("Idukki", "Kerala", "S"),
    ("Kolkata", "West Bengal", "E"), ("Bhubaneswar", "Odisha", "E"),
    ("Patna", "Bihar", "E"), ("Ranchi", "Jharkhand", "E"), ("Guwahati", "Assam", "E"),
    ("Jamshedpur", "Jharkhand", "E"), ("Cuttack", "Odisha", "E"), ("Rourkela", "Odisha", "E"),
    ("Siliguri", "West Bengal", "E"), ("Durgapur", "West Bengal", "E"),
    ("Asansol", "West Bengal", "E"), ("Bokaro", "Jharkhand", "E"),
    ("Dhanbad", "Jharkhand", "E"), ("Muzaffarpur", "Bihar", "E"),
    ("Bhagalpur", "Bihar", "E"), ("Gaya", "Bihar", "E"),
    ("Berhampur", "Odisha", "E"), ("Sambalpur", "Odisha", "E"),
    ("Puri", "Odisha", "E"), ("Balasore", "Odisha", "E"),
    ("Imphal", "Manipur", "E"), ("Shillong", "Meghalaya", "E"),
    ("Agartala", "Tripura", "E"), ("Dibrugarh", "Assam", "E"),
    ("Jorhat", "Assam", "E"), ("Tezpur", "Assam", "E"),
    ("Silchar", "Assam", "E"), ("Howrah", "West Bengal", "E"),
    ("Haldia", "West Bengal", "E"), ("Kalyani", "West Bengal", "E"),
    ("Baharampur", "West Bengal", "E"), ("Kharagpur", "West Bengal", "E"),
    ("Purnia", "Bihar", "E"), ("Darbhanga", "Bihar", "E"),
    ("Arrah", "Bihar", "E"), ("Sasaram", "Bihar", "E"),
    ("Hazaribagh", "Jharkhand", "E"), ("Deoghar", "Jharkhand", "E"),
    ("Giridih", "Jharkhand", "E"), ("Angul", "Odisha", "E"),
    ("Jharsuguda", "Odisha", "E"), ("Paradip", "Odisha", "E"),
    ("Naharlagun", "Arunachal Pradesh", "E"), ("Gangtok", "Sikkim", "E"),
    ("Aizawl", "Mizoram", "E"), ("Kohima", "Nagaland", "E"),
    ("Itanagar", "Arunachal Pradesh", "E"), ("Dimapur", "Nagaland", "E"),
    ("Mumbai", "Maharashtra", "W"), ("Pune", "Maharashtra", "W"),
    ("Ahmedabad", "Gujarat", "W"), ("Surat", "Gujarat", "W"),
    ("Vadodara", "Gujarat", "W"), ("Nagpur", "Maharashtra", "W"),
    ("Nashik", "Maharashtra", "W"), ("Rajkot", "Gujarat", "W"),
    ("Thane", "Maharashtra", "W"), ("Bhopal", "Madhya Pradesh", "W"),
    ("Indore", "Madhya Pradesh", "W"), ("Goa", "Goa", "W"),
    ("Aurangabad", "Maharashtra", "W"), ("Kolhapur", "Maharashtra", "W"),
    ("Solapur", "Maharashtra", "W"), ("Bhavnagar", "Gujarat", "W"),
    ("Jamnagar", "Gujarat", "W"), ("Junagadh", "Gujarat", "W"),
    ("Gandhinagar", "Gujarat", "W"), ("Anand", "Gujarat", "W"),
    ("Navi Mumbai", "Maharashtra", "W"), ("Pimpri-Chinchwad", "Maharashtra", "W"),
    ("Raipur", "Chhattisgarh", "W"), ("Bilaspur", "Chhattisgarh", "W"),
    ("Jabalpur", "Madhya Pradesh", "W"), ("Gwalior", "Madhya Pradesh", "W"),
    ("Ujjain", "Madhya Pradesh", "W"), ("Dewas", "Madhya Pradesh", "W"),
    ("Satna", "Madhya Pradesh", "W"), ("Ratlam", "Madhya Pradesh", "W"),
    ("Korba", "Chhattisgarh", "W"), ("Bhilai", "Chhattisgarh", "W"),
    ("Durg", "Chhattisgarh", "W"), ("Jagdalpur", "Chhattisgarh", "W"),
    ("Sangli", "Maharashtra", "W"), ("Ahmednagar", "Maharashtra", "W"),
    ("Latur", "Maharashtra", "W"), ("Akola", "Maharashtra", "W"),
    ("Amravati", "Maharashtra", "W"), ("Chandrapur", "Maharashtra", "W"),
    ("Nanded", "Maharashtra", "W"), ("Jalgaon", "Maharashtra", "W"),
    ("Dhule", "Maharashtra", "W"), ("Vapi", "Gujarat", "W"),
    ("Navsari", "Gujarat", "W"), ("Mehsana", "Gujarat", "W"),
    ("Morbi", "Gujarat", "W"), ("Gandhidham", "Gujarat", "W"),
    ("Bharuch", "Gujarat", "W"), ("Surendranagar", "Gujarat", "W"),
    ("Patan", "Gujarat", "W"), ("Porbandar", "Gujarat", "W"),
    ("Sagar", "Madhya Pradesh", "W"), ("Damoh", "Madhya Pradesh", "W"),
]

FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan",
    "Krishna", "Ishaan", "Rohan", "Amit", "Rajesh", "Suresh", "Vikram", "Rahul",
    "Deepak", "Manoj", "Pradeep", "Sunil", "Anil", "Ravi", "Sanjay", "Mukesh",
    "Priya", "Sneha", "Anita", "Kavita", "Sunita", "Neha", "Pooja", "Swati",
    "Divya", "Asha", "Meena", "Lakshmi", "Rekha", "Sarita", "Geeta", "Usha",
    "Kiran", "Ajay", "Vijay", "Nitin", "Gaurav", "Saurabh", "Pankaj", "Naveen",
    "Harish", "Dinesh", "Mahesh", "Ramesh", "Yogesh", "Rakesh", "Hitesh", "Jitesh",
    "Ashok", "Gopal", "Mohan", "Shyam", "Ganesh", "Naresh", "Paresh", "Girish",
    "Ankita", "Shruti", "Pallavi", "Tanvi", "Mansi", "Jyoti", "Ritu", "Seema",
    "Nisha", "Smita", "Shilpa", "Rashmi", "Archana", "Vandana", "Sapna", "Meghna",
]

LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Reddy", "Nair",
    "Iyer", "Menon", "Joshi", "Mishra", "Pandey", "Tiwari", "Dubey", "Rao",
    "Pillai", "Das", "Chatterjee", "Banerjee", "Mukherjee", "Dey", "Roy", "Bose",
    "Deshmukh", "Patil", "Kulkarni", "Jadhav", "Pawar", "Shinde", "More", "Kadam",
    "Shah", "Mehta", "Dave", "Bhatt", "Thakur", "Chauhan", "Yadav", "Saxena",
]

QUALIFICATIONS = [
    ("ASNT NDT Level II - UT", "ASNT"), ("ASNT NDT Level II - RT", "ASNT"),
    ("ASNT NDT Level II - MT", "ASNT"), ("ASNT NDT Level II - PT", "ASNT"),
    ("CSWIP 3.1", "TWI"), ("CSWIP 3.2", "TWI"), ("AWS CWI", "AWS"),
    ("API 510", "API"), ("API 570", "API"), ("API 653", "API"),
    ("B.E. Mechanical", "University"), ("B.Tech Mechanical", "IIT"),
    ("B.E. Electrical", "University"), ("B.E. Civil", "University"),
    ("M.Tech Materials", "University"), ("Diploma Mechanical", "Polytechnic"),
    ("NACE CIP Level 1", "NACE"), ("NACE CIP Level 2", "NACE"),
    ("BGAS Grade 2", "BGAS-CSWIP"), ("PCN Level 2 UT", "BINDT"),
]

DISCIPLINES = ["Pressure Vessels", "Piping", "Rotating Equipment", "Electrical",
               "NDT", "Welding", "Coatings", "Civil/Structural", "Instrumentation",
               "Valves", "Heat Exchangers", "Storage Tanks", "Forgings", "Castings",
               "Boilers", "Documentation", "Fired Heaters"]

INSPECTION_COMPANIES = [
    "Bureau Veritas India", "TUV SUD India", "SGS India", "DNV GL India",
    "Lloyd's Register India", "Intertek India", "TUV Rheinland India",
    "RINA India", "ABS India", "Element Materials Technology",
]

VENDORS = [
    "Welding Research Institute", "Safety Solutions Pvt Ltd", "Calibration Services India",
    "NDT Equipment Suppliers", "PPE World India", "TechCal Instruments",
    "Quality Tools & Equipment", "Industrial Safety Corp", "MetroCal Labs",
    "PrecisionTest India", "NDT Systems & Services", "SafetyFirst India",
    "IndusTech Solutions", "CalibRight Services", "ToolMaster India",
]

SERVICE_LINES = ["PART_A", "PART_B", "PART_C"]
SECTORS = ["oil_gas", "pharma", "power", "infrastructure", "chemicals", "metals", "fertilizers", "refinery"]
LEAVE_TYPES = ["casual", "sick", "earned", "unpaid", "comp_off"]
LEAVE_STATUSES = ["pending", "approved", "rejected", "cancelled"]
ATT_STATUSES = ["present", "absent", "half_day", "on_leave", "holiday", "weekly_off"]
EXIT_TYPES = ["resignation", "termination", "retirement", "contract_end"]
NOTIF_CATEGORIES = [
    "visit_schedule", "enquiry_update", "invoice_raised", "payment_received",
    "dunning_reminder", "leave_request", "leave_approved", "appraisal_due",
    "authorization_expiry", "rfi_scheduled", "punch_item_raised",
    "signoff_pending", "complaint_raised", "ncr_raised", "general",
]

MRM_CATEGORIES = ["win_loss", "kpi", "complaints", "feedback", "ncr", "audit", "risk", "manpower", "budget"]


def rand_name():
    return f"{rc(FIRST_NAMES)} {rc(LAST_NAMES)}"

def rand_email(name):
    clean = name.lower().replace(" ", ".").replace("'", "")
    return f"{clean}{random.randint(1,999)}@{'gmail.com' if random.random() > 0.5 else 'outlook.com'}"

def rand_phone():
    return f"+91-{random.randint(7000000000, 9999999999)}"


async def bulk_insert(docs, label, batch_size=500):
    """Insert documents in batches to avoid memory issues."""
    total = len(docs)
    for i in range(0, total, batch_size):
        batch = docs[i:i+batch_size]
        for doc in batch:
            await doc.insert()
    print(f"     {total} {label}")


async def seed():
    client = AsyncMongoClient(settings.mongodb_url)
    db = client[settings.mongodb_db_name]

    all_models = [
        Appeal, Equipment, CalibrationRecord, EquipmentUsage, Evidence,
        AuditEntry, Sequence,
        UserLogin, Client, ClientUnit, Manufacturer, ManufacturerUnit,
        Competency, InspectorRate, Associate, Job, ServiceOrder,
        ControlNumber, Visit, Invoice, PurchaseOrder, Payment,
        Enquiry, GoNoGoDecision, ProposalRevision, ReasonCode,
        ExternalProvider, EvaluationRecord, PerformanceRecord, SubcontractConsent,
        Risk, RiskReview, InternalAudit,
        InspectionTestPlan, InspectionCall,
        Amendment, RateCard, RateFloor, NCR,
        CustomerComplaint, DocModel, AnalyticsEvent,
        AccountReceivable, AccountPayable,
        ConstructionBillVerificationRecord, ScheduleMPharmaEPCProject,
        TpiReport, WorkTypeDefinition, WorkPackage,
        Certification, BillingTerms,
        Person, CompetenceProfile, Authorization, ImpartialityDeclaration,
        Assignment, ReportFormat,
        DunningRecord,
        Region, Office, InterOfficeSettlement, InspectorLoan, DeputyCoverage,
        ManpowerRequest, Candidate, TechnicalInterview, OfferLetter, InductionChecklist,
        LeaveRequest, AttendanceRecord, Timesheet,
        PayrollRun, Payslip,
        Appraisal, WitnessedInspection,
        ExitProcess,
        PurchaseRequisition, VendorPayment,
        RFI, PunchItem, InspectionReleaseNote,
        ClientFeedback, MRMAgendaItem,
        JobConversion, ReportSignoff, WinLossRecord,
        EmailLog, NotificationPreference, InAppNotification,
    ]
    await init_beanie(database=db, document_models=all_models)

    # ── Grab existing core IDs ──
    people_ids = [p["person_id"] async for p in db["people"].find({}, {"person_id": 1})]
    people_names = {}
    async for p in db["people"].find({}, {"person_id": 1, "full_name": 1}):
        people_names[p["person_id"]] = p.get("full_name", "Inspector")

    client_data = []
    async for c in db["clients"].find({}, {"client_id": 1, "name": 1}):
        client_data.append((c["client_id"], c.get("name", "Client")))

    job_ids = [j["job_id"] async for j in db["jobs"].find({}, {"job_id": 1})]
    visit_ids = [v["visit_id"] async for v in db["visits"].find({}, {"visit_id": 1})]
    enquiry_ids = [e["enquiry_id"] async for e in db["enquiries"].find({}, {"enquiry_id": 1})]
    invoice_ids = [i["invoice_id"] async for i in db["invoices"].find({}, {"invoice_id": 1})]
    mfr_data = []
    async for m in db["manufacturers"].find({}, {"manufacturer_id": 1, "name": 1}):
        mfr_data.append((m["manufacturer_id"], m.get("name", "Manufacturer")))

    print(f"Core data: {len(people_ids)} people, {len(client_data)} clients, "
          f"{len(job_ids)} jobs, {len(visit_ids)} visits, {len(enquiry_ids)} enquiries")

    def pid(): return rc(people_ids)
    def pname(p): return people_names.get(p, "Inspector")
    def cid_name(): return rc(client_data)
    def jid(): return rc(job_ids)
    def vid(): return rc(visit_ids)
    def eid(): return rc(enquiry_ids)
    def iid(): return rc(invoice_ids)
    def mid_name(): return rc(mfr_data) if mfr_data else ("MFR-001", "Manufacturer")

    # ── Drop gap-fill collections ──
    gap_collections = [
        "regions", "offices", "inter_office_settlements", "inspector_loans", "deputy_coverages",
        "manpower_requests", "candidates", "technical_interviews", "offer_letters", "induction_checklists",
        "leave_requests", "attendance_records", "timesheets",
        "payroll_runs", "payslips",
        "appraisals", "witnessed_inspections",
        "exit_processes",
        "purchase_requisitions", "vendor_payments", "dunning_records",
        "rfis", "punch_items", "inspection_release_notes",
        "client_feedback", "mrm_agenda",
        "job_conversions", "report_signoffs", "win_loss_records",
        "email_logs", "notification_preferences", "in_app_notifications",
    ]
    print("\nDropping gap-fill collections...")
    for name in gap_collections:
        await db[name].drop()
    print("Done.\n")

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 1. REGIONS (4) + OFFICES (200) + SETTLEMENTS (200)                ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Regions & offices...")
    for code in REGIONS:
        await Region(
            region_code=code, name=REGION_NAMES[code],
            head_office=(code == "S"),
            regional_head_person_id=pid(),
            technical_manager_person_id=pid(),
            inspection_coordinator_person_id=pid() if random.random() > 0.3 else None,
        ).insert()

    office_docs = []
    for i, (city, state, reg) in enumerate(INDIAN_CITIES[:200]):
        office_docs.append(Office(
            office_id=f"OFF-{reg}-{i+1:03d}", region_code=reg,
            name=f"{city} Office", city=city, state=state,
            address=f"Plot {random.randint(1,200)}, Industrial Area, {city}",
            is_head_office=(city == "Hyderabad" and i == 50),
        ))
    await bulk_insert(office_docs, "offices")

    settle_docs = []
    idx = 0
    for yr in [2024, 2025, 2026]:
        for month in range(1, 13):
            for reg in ["N", "E", "W"]:
                if idx >= 200:
                    break
                fee = random.randint(500000, 5000000)
                ho = fee * 0.25
                settle_docs.append(InterOfficeSettlement(
                    settlement_id=f"IOS-{yr%100:02d}{(yr+1)%100:02d}-{month:02d}-{reg}",
                    period_month=month, period_year=yr, from_region=reg, to_region="S",
                    fee_collected=fee, ho_pool_share=ho, region_share=fee - ho,
                    net_payable_to_ho=ho,
                    status=rc(["draft", "submitted", "settled"]),
                    created_by=pid(),
                ))
                idx += 1
    await bulk_insert(settle_docs[:200], "settlements")

    # Inspector loans: 50
    loan_docs = []
    for i in range(50):
        home = rc(REGIONS)
        borrow = rc([r for r in REGIONS if r != home])
        loan_docs.append(InspectorLoan(
            loan_id=f"LOAN-2627-{i+1:03d}",
            inspector_person_id=pid(), home_region=home, borrowing_region=borrow,
            job_id=jid(), rate_card_rate=random.randint(5000, 15000),
            start_date=rdt(180), end_date=future(random.randint(10, 90)),
            status=rc(["active", "completed", "cancelled"]),
            approved_by=pid(),
        ))
    await bulk_insert(loan_docs, "inspector loans")

    # Deputy coverages: 50
    dep_docs = []
    for i in range(50):
        dep_docs.append(DeputyCoverage(
            coverage_id=f"DEP-2627-{i+1:03d}",
            absent_role=rc(["IC", "TM", "RH", "BD", "RECRUITER"]),
            absent_person_id=pid(), region_code=rc(REGIONS),
            deputy_person_id=pid(), deputy_role=rc(["IC", "TM", "RH"]),
            scope_limits="Within authorised scope" if random.random() > 0.3 else None,
            arranged_by=pid(), valid_from=rdt(60), valid_until=future(random.randint(5, 60)),
        ))
    await bulk_insert(dep_docs, "deputy coverages")
    print(f"     4 regions, {len(office_docs)} offices, {len(settle_docs[:200])} settlements, 50 loans, 50 coverages")

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 2. RECRUITMENT                                                    ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Recruitment...")
    positions = [
        "Senior Inspection Officer", "Inspection Officer", "NDT Technician",
        "Welding Inspector", "Coating Inspector", "QC Engineer",
        "Piping Inspector", "Electrical Inspector", "Rotating Equipment Inspector",
        "Civil/Structural Inspector", "Documentation Controller", "Site QC Manager",
    ]
    mpr_ids = []
    mpr_docs = []
    for i in range(100):
        rid = f"MPR-2627-{i+1:04d}"
        mpr_ids.append(rid)
        mpr_docs.append(ManpowerRequest(
            request_id=rid, site_id=SITE,
            job_id=jid() if random.random() > 0.3 else None,
            region_code=rc(REGIONS), requested_by=pid(),
            position_title=f"{rc(positions)} - {rc(DISCIPLINES)}",
            category=rc(["TECHNICAL_INSPECTION", "TECHNICAL_SUPPORT", "ADMINISTRATIVE"]),
            engagement_type=rc(["PERMANENT", "CONTRACT", "ASSOCIATE"]),
            required_qualifications=[q[0] for q in random.sample(QUALIFICATIONS, random.randint(1, 3))],
            required_experience_years=random.randint(2, 20),
            headcount=random.randint(1, 3),
            budget_per_head=random.randint(40000, 200000),
            within_budget=random.random() > 0.2,
            budget_approved=random.random() > 0.3,
            approved_by=pid() if random.random() > 0.3 else None,
            priority=rc(["urgent", "normal", "low"]),
            status=rc(["draft", "pending_budget", "budget_approved", "sourcing", "filled", "cancelled"]),
            target_date=future(random.randint(15, 120)),
        ))
    await bulk_insert(mpr_docs, "manpower requests")

    cand_ids = []
    cand_docs = []
    for i in range(500):
        cid = f"CND-2627-{i+1:04d}"
        cand_ids.append(cid)
        name = rand_name()
        quals = [CandidateQualification(name=q[0], issuing_body=q[1], year=random.randint(2010, 2025))
                 for q in random.sample(QUALIFICATIONS, random.randint(1, 3))]
        cand_docs.append(Candidate(
            candidate_id=cid, site_id=SITE,
            request_id=rc(mpr_ids),
            full_name=name, email=rand_email(name), phone=rand_phone(),
            source=rc(["portal", "referral", "pool", "direct"]),
            source_detail=rc(["Naukri.com", "LinkedIn", "Indeed", "Employee Referral", "IQE Database"]),
            qualifications=quals,
            experience_years=random.randint(1, 25),
            current_employer=rc(INSPECTION_COMPANIES + ["Self-employed", "Fresher"]),
            current_designation=rc(positions),
            expected_ctc=random.randint(300000, 2500000),
            status=rc(["new", "screening", "tm_interview", "technically_fit", "not_fit",
                       "offer_sent", "offer_accepted", "offer_declined", "joined", "withdrawn"]),
        ))
    await bulk_insert(cand_docs, "candidates")

    int_docs = []
    for i in range(300):
        int_docs.append(TechnicalInterview(
            interview_id=f"INT-2627-{i+1:04d}",
            candidate_id=rc(cand_ids), request_id=rc(mpr_ids), site_id=SITE,
            interviewer_person_id=pid(),
            interview_date=rdt(180),
            interview_mode=rc(["in_person", "video", "phone"]),
            technical_score=random.randint(3, 10),
            domain_knowledge=random.randint(3, 10),
            practical_assessment=random.randint(2, 10),
            communication=random.randint(4, 10),
            overall_recommendation=rc(["pending", "fit", "not_fit", "conditional"]),
            remarks=rc(["Strong candidate", "Needs more exposure", "Good fundamentals",
                        "Excellent domain knowledge", "Communication needs work", "Recommended for hire"]),
        ))
    await bulk_insert(int_docs, "technical interviews")

    ofr_docs = []
    for i in range(150):
        ofr_docs.append(OfferLetter(
            offer_id=f"OFR-2627-{i+1:04d}",
            candidate_id=rc(cand_ids), request_id=rc(mpr_ids), site_id=SITE,
            offer_type=rc(["appointment", "associate"]),
            designation=f"{rc(positions)} - {rc(DISCIPLINES)}",
            department=rc(["Inspection", "NDT", "QC", "Operations"]),
            engagement_type=rc(["PERMANENT", "CONTRACT", "ASSOCIATE"]),
            ctc_offered=random.randint(400000, 2500000),
            joining_date=future(random.randint(15, 90)),
            probation_months=rc([3, 6]),
            reporting_to_person_id=pid(),
            status=rc(["draft", "sent", "accepted", "declined", "expired"]),
            sent_on=rdt(60) if random.random() > 0.3 else None,
        ))
    await bulk_insert(ofr_docs, "offer letters")

    ind_docs = []
    for i in range(100):
        items = [InductionItem(
            item_code=item.item_code, description=item.description,
            completed=random.random() > 0.3,
            completed_on=rdt(30) if random.random() > 0.3 else None,
        ) for item in DEFAULT_INDUCTION_ITEMS]
        all_done = all(it.completed for it in items)
        ind_docs.append(InductionChecklist(
            induction_id=f"IND-2627-{i+1:04d}",
            person_id=pid(), site_id=SITE,
            checklist_items=items,
            confidentiality_signed=random.random() > 0.2,
            impartiality_declared=random.random() > 0.2,
            safety_briefing_done=random.random() > 0.2,
            it_access_provisioned=random.random() > 0.3,
            id_card_issued=random.random() > 0.4,
            completed=all_done, completed_on=rdt(20) if all_done else None,
            inducted_by=pid(),
        ))
    await bulk_insert(ind_docs, "induction checklists")

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 3. LEAVE & ATTENDANCE                                             ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Leave & attendance...")
    lv_docs = []
    for i in range(500):
        days = random.randint(1, 10)
        from_d = rdt(random.randint(0, 300))
        status = rc(LEAVE_STATUSES)
        approver = pid() if status in ("approved", "rejected") else None
        lv_docs.append(LeaveRequest(
            leave_id=f"LV-2627-{i+1:04d}",
            person_id=pid(), site_id=SITE,
            leave_type=rc(LEAVE_TYPES),
            from_date=from_d, to_date=from_d + timedelta(days=days), days=days,
            reason=rc(["Annual vacation", "Personal work", "Fever", "Family function",
                       "Medical appointment", "Wedding", "Travel", "Emergency",
                       "Child's school event", "Religious festival"]),
            status=status, approved_by=approver,
        ))
    await bulk_insert(lv_docs, "leave requests")

    att_docs = []
    sample_people = random.sample(people_ids, min(35, len(people_ids)))
    for i in range(700):
        p = rc(sample_people)
        status = rc(["present"] * 7 + ["half_day", "on_leave", "absent"])
        hrs = 8.0 + random.random() * 2 if status == "present" else (4.0 if status == "half_day" else 0)
        att_docs.append(AttendanceRecord(
            attendance_id=f"ATT-{i+1:05d}",
            person_id=p, site_id=SITE,
            date=rdt(random.randint(0, 90)),
            status=status,
            hours_worked=round(hrs, 1),
            job_id=jid() if status == "present" else None,
            region_code=rc(REGIONS),
        ))
    await bulk_insert(att_docs, "attendance records")

    ts_docs = []
    for i in range(300):
        p = rc(people_ids)
        yr = rc([2025, 2026])
        month = random.randint(1, 12)
        entries = [TimesheetEntry(
            date=datetime(yr, month, min(d+1, 28)),
            job_id=jid(), hours=random.randint(6, 10),
            activity_type=rc(["inspection", "travel", "training", "admin"]),
        ) for d in range(random.randint(15, 25))]
        total_hrs = sum(e.hours for e in entries)
        ts_docs.append(Timesheet(
            timesheet_id=f"TS-{yr%100:02d}-{p[-3:]}-{month:02d}-{i:03d}",
            person_id=p, site_id=SITE,
            period_month=month, period_year=yr,
            home_region=rc(REGIONS), working_region=rc(REGIONS),
            entries=entries, total_days=len(entries), total_hours=total_hrs,
            status=rc(["draft", "submitted", "approved", "rejected"]),
            created_by=p,
        ))
    await bulk_insert(ts_docs, "timesheets")

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 4. PAYROLL                                                        ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Payroll...")
    run_ids = []
    pr_docs = []
    for i in range(100):
        yr = 2024 + (i // 48)
        month = (i % 12) + 1
        reg = rc(REGIONS)
        rid = f"PR-{yr%100:02d}{(yr+1)%100:02d}-{month:02d}-{reg}-{i:03d}"
        run_ids.append(rid)
        headcount = random.randint(5, 25)
        total_gross = headcount * random.randint(60000, 150000)
        total_ded = total_gross * random.uniform(0.15, 0.25)
        pr_docs.append(PayrollRun(
            run_id=rid, site_id=SITE, region_code=reg,
            period_month=month, period_year=yr,
            status=rc(["draft", "processing", "approved", "disbursed"]),
            total_gross=round(total_gross), total_deductions=round(total_ded),
            total_net=round(total_gross - total_ded), headcount=headcount,
            processed_by=pid(), approved_by=pid() if random.random() > 0.3 else None,
        ))
    await bulk_insert(pr_docs, "payroll runs")

    ps_docs = []
    for i in range(2000):
        basic = random.randint(25000, 120000)
        hra = round(basic * 0.4)
        conv = 3200
        special = round(basic * random.uniform(0.1, 0.2))
        gross = basic + hra + conv + special
        pf = round(basic * 0.12)
        esi = round(gross * 0.0075) if gross < 42000 else 0
        pt = 200
        tds = round(gross * random.uniform(0.05, 0.15))
        deductions = pf + esi + pt + tds
        ps_docs.append(Payslip(
            payslip_id=f"PS-{i+1:05d}",
            run_id=rc(run_ids), person_id=pid(), site_id=SITE,
            period_month=random.randint(1, 12), period_year=rc([2024, 2025, 2026]),
            basic_salary=basic, hra=hra, conveyance=conv, special_allowance=special,
            gross_salary=gross, pf_employee=pf, pf_employer=pf,
            esi_employee=esi, professional_tax=pt, tds=tds,
            total_deductions=deductions, net_salary=gross - deductions,
            days_present=random.randint(18, 26),
            days_absent=random.randint(0, 4),
            payment_mode=rc(["NEFT", "RTGS", "UPI"]),
            paid_on=rdt(90) if random.random() > 0.2 else None,
        ))
    await bulk_insert(ps_docs, "payslips")

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 5. APPRAISALS                                                     ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Appraisals...")
    kpi_templates = [
        ("INSP_QUALITY", "Inspection Report Quality", 2.0),
        ("TIMELINESS", "Report Turnaround Time", 1.5),
        ("CLIENT_SAT", "Client Satisfaction Rating", 1.5),
        ("SAFETY", "Safety Compliance", 2.0),
        ("NCR_CLOSE", "NCR Closure Rate", 1.0),
        ("KNOWLEDGE", "Technical Knowledge Update", 1.0),
        ("TEAMWORK", "Team Collaboration", 1.0),
    ]
    apr_docs = []
    for i in range(150):
        kpis = [KPIScore(
            kpi_code=k[0], kpi_name=k[1], weight=k[2],
            target=str(random.randint(80, 100)) + "%",
            actual=str(random.randint(60, 100)) + "%",
            score=random.randint(1, 5),
        ) for k in kpi_templates]
        apr_docs.append(Appraisal(
            appraisal_id=f"APR-2627-{i+1:04d}",
            person_id=pid(), site_id=SITE,
            appraisal_period=rc(["2024-2025", "2025-2026", "2026-2027"]),
            reviewer_person_id=pid(),
            kpi_scores=kpis,
            overall_rating=random.randint(1, 5),
            strengths=rc(["Excellent technical skills", "Strong client communication",
                          "Good report quality", "Reliable and punctual", "Leadership qualities"]),
            improvement_areas=rc(["Time management", "Documentation speed", "Cross-training needed",
                                  "Communication with contractors", "None identified"]),
            training_needs=random.sample(["Advanced NDT", "API 510 refresher", "Leadership", "Safety",
                                          "Report writing", "Client management"], random.randint(0, 3)),
            authorization_recommendation=rc(["maintain", "extend", "restrict"]),
            status=rc(["draft", "self_review", "manager_review", "completed"]),
        ))
    await bulk_insert(apr_docs, "appraisals")

    wit_docs = []
    for i in range(100):
        areas = [CompetenceAssessment(area=a, rating=random.randint(1, 5))
                 for a in random.sample(["NDT interpretation", "Procedure adherence", "Report writing",
                                          "Safety awareness", "Equipment handling", "Client interaction",
                                          "Technical knowledge", "Problem solving"], random.randint(3, 6))]
        wit_docs.append(WitnessedInspection(
            witness_id=f"WIT-2627-{i+1:04d}",
            person_id=pid(), site_id=SITE,
            witnessed_by=pid(), visit_id=vid(), job_id=jid(),
            inspection_type=rc(DISCIPLINES),
            date=rdt(180),
            competence_areas=areas,
            overall_result=rc(["satisfactory", "needs_improvement", "unsatisfactory", "pending"]),
            follow_up_required=random.random() > 0.6,
        ))
    await bulk_insert(wit_docs, "witnessed inspections")

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 6. RFIs (200)                                                     ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → RFIs & punch list & release notes...")
    rfi_docs = []
    for i in range(200):
        m_id, m_name = mid_name()
        status = rc(["open", "scheduled", "inspected", "closed", "cancelled"])
        rfi_docs.append(RFI(
            rfi_id=f"RFI-2627-{i+1:04d}", site_id=SITE,
            job_id=jid(), contractor_name=m_name,
            inspection_point_type=rc(["hold", "witness", "surveillance", "review"]),
            discipline=rc(DISCIPLINES),
            description=f"Inspection point: {rc(DISCIPLINES)} - {rc(['Hydrostatic test', 'RT interpretation', 'Visual inspection', 'Dimensional check', 'Pressure test', 'Hardness test', 'PMI check', 'DFT measurement', 'Torque check', 'Load test', 'FAT', 'SAT', 'MDR review', 'Material verification', 'Welding procedure qualification'])}",
            location=f"Bay {random.randint(1,10)}, {rc(['Fabrication Shop', 'Assembly Hall', 'Test Bay', 'Warehouse', 'Pipe Yard'])}",
            requested_date=future(random.randint(1, 60)) if status == "open" else None,
            scheduled_date=rdt(30) if status in ("scheduled", "inspected", "closed") else None,
            scheduled_by=pid() if status != "open" else None,
            inspector_person_id=pid() if status != "open" else None,
            tm_confirmed=status in ("inspected", "closed"),
            tm_confirmed_by=pid() if status in ("inspected", "closed") else None,
            inspection_date=rdt(30) if status in ("inspected", "closed") else None,
            result=rc(["accepted", "rejected", "conditional"]) if status in ("inspected", "closed") else None,
            visit_id=vid() if status == "inspected" else None,
            turnaround_hours=random.choice([24, 48, 72]) if status != "open" else None,
            status=status,
        ))
    await bulk_insert(rfi_docs, "RFIs")

    # Punch items: 200
    punch_docs = []
    for i in range(200):
        status = rc(["open", "corrected", "re_inspected", "closed", "waived"])
        punch_docs.append(PunchItem(
            punch_id=f"PUN-2627-{i+1:04d}", site_id=SITE,
            job_id=jid(), category=rc(["A", "B", "C"]),
            discipline=rc(DISCIPLINES),
            location=f"{rc(['PV', 'HX', 'PP', 'TK', 'VL', 'PM'])}-{random.randint(100,999)}, {rc(['Nozzle', 'Shell', 'Weld Joint', 'Flange', 'Support', 'Foundation'])} {random.randint(1,20)}",
            description=rc([
                "Weld repair required - incomplete root penetration",
                "Missing identification stamp on plate",
                "Paint DFT below minimum specification",
                "UT calibration certificate expired",
                "Seat leakage during pressure test",
                "Dimensional non-conformance on flange face",
                "PWHT chart shows temperature excursion",
                "RT film density below minimum",
                "Gasket surface finish out of tolerance",
                "Bolt torque values not recorded",
                "Material test certificate mismatch",
                "Hydrotest pressure gauge calibration overdue",
                "Coating holiday detected in DFT check",
                "Misalignment of nozzle exceeds tolerance",
                "Hardness value exceeds maximum limit",
            ]),
            raised_by=pid(),
            responsible_contractor=mid_name()[1] if random.random() > 0.3 else None,
            target_date=future(random.randint(5, 30)) if status == "open" else None,
            corrected_on=rdt(15) if status in ("corrected", "re_inspected", "closed") else None,
            re_inspected=status in ("re_inspected", "closed"),
            re_inspected_by=pid() if status in ("re_inspected", "closed") else None,
            re_inspection_result=rc(["accepted", "rejected"]) if status in ("re_inspected", "closed") else None,
            status=status,
            closed_on=rdt(5) if status == "closed" else None,
            closed_by=pid() if status == "closed" else None,
        ))
    await bulk_insert(punch_docs, "punch items")

    # Release notes: 100
    rel_docs = []
    for i in range(100):
        hp_total = random.randint(3, 15)
        hp_signed = random.randint(0, hp_total)
        ncr_total = random.randint(0, 8)
        ncr_closed = random.randint(0, ncr_total)
        cat_a_total = random.randint(0, 5)
        cat_a_closed = random.randint(0, cat_a_total)
        status = rc(["draft", "preconditions_checked", "recommended", "approved", "released", "rejected"])
        rel_docs.append(InspectionReleaseNote(
            irn_id=f"IRN-2627-{i+1:04d}", site_id=SITE,
            job_id=jid(),
            description=f"Release note for {rc(DISCIPLINES)} inspection - {rc(['Phase 1', 'Phase 2', 'Final', 'Interim', 'Partial'])}",
            scope_summary=f"Covers {random.randint(1, 10)} items in work package",
            hold_points_signed=(hp_signed == hp_total), hold_points_count=hp_total, hold_points_signed_count=hp_signed,
            ncrs_closed=(ncr_closed == ncr_total), ncr_total=ncr_total, ncr_closed_count=ncr_closed,
            cat_a_punch_closed=(cat_a_closed == cat_a_total), cat_a_total=cat_a_total, cat_a_closed_count=cat_a_closed,
            recommended_by=pid() if status not in ("draft",) else None,
            approved_by=pid() if status in ("approved", "released") else None,
            released=status == "released",
            release_date=rdt(10) if status == "released" else None,
            status=status,
        ))
    await bulk_insert(rel_docs, "release notes")

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 7. FEEDBACK (200) + MRM (100)                                     ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Client feedback & MRM...")
    fb_docs = []
    for i in range(200):
        c_id, c_name = cid_name()
        overall = random.randint(1, 5)
        fb_docs.append(ClientFeedback(
            feedback_id=f"FBK-2627-{i+1:04d}", site_id=SITE,
            client_id=c_id, client_name=c_name, job_id=jid(),
            overall_rating=overall,
            timeliness_rating=random.randint(1, 5),
            report_quality_rating=random.randint(1, 5),
            inspector_competence_rating=random.randint(1, 5),
            communication_rating=random.randint(1, 5),
            comments=rc([
                "Excellent service and timely reports", "Good inspector but delays in scheduling",
                "Report quality needs improvement", "Very professional team",
                "Outstanding technical expertise", "Communication could be better",
                "Prompt response to RFIs", "Inspector knowledge was exceptional",
                "Some issues with report formatting", "Overall satisfactory experience",
                "Need better coordination on multi-site jobs", "Impressed with NDT capabilities",
            ]),
            requires_escalation=overall <= 2,
            escalated_to_mrm=overall <= 2 and random.random() > 0.3,
            mrm_ref=f"MRM-2627-{random.randint(1,100):04d}" if overall <= 2 else None,
            corrective_action=("Review and improve scheduling process" if overall <= 2 else None),
            responded_by=pid() if random.random() > 0.4 else None,
        ))
    await bulk_insert(fb_docs, "client feedback")

    mrm_docs = []
    for i in range(100):
        cat = rc(MRM_CATEGORIES)
        mrm_docs.append(MRMAgendaItem(
            mrm_id=f"MRM-2627-{i+1:04d}", site_id=SITE,
            meeting_date=rdt(random.randint(0, 180)),
            period=rc(["2025-Q4", "2026-Q1", "2026-Q2", "2026-Q3", "2026-Q4"]),
            category=cat,
            title=f"{cat.replace('_', ' ').title()} - {rc(['Action Required', 'Status Update', 'Review', 'Analysis', 'Improvement Plan'])}",
            description=f"Review of {cat.replace('_', ' ')} metrics for the period",
            presenter=pid(),
            decision=rc(["Approved action plan", "Further review needed", "Escalate to MD", None]),
            action_items=[f"Action item {j+1}" for j in range(random.randint(0, 4))],
            action_owner=pid() if random.random() > 0.3 else None,
            status=rc(["draft", "presented", "actioned", "closed"]),
        ))
    await bulk_insert(mrm_docs, "MRM agenda items")

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 8. JOB CONVERSIONS (200), SIGNOFFS (200), WIN/LOSS (200)          ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Job conversions, signoffs, win/loss...")
    jc_docs = []
    for i in range(200):
        jc_docs.append(JobConversion(
            conversion_id=f"CNV-2627-{i+1:04d}", site_id=SITE,
            enquiry_id=eid(), job_id=jid() if random.random() > 0.2 else None,
            j_no=f"{rc(['N','S','E','W'])}-2627-{random.randint(1,500):04d}" if random.random() > 0.3 else None,
            award_value=random.randint(200000, 10000000),
            award_date=rdt(180),
            converted_by=pid(),
        ))
    await bulk_insert(jc_docs, "job conversions")

    sgn_docs = []
    for i in range(200):
        result = rc(["pending", "approved", "rework_required", "rejected"])
        sgn_docs.append(ReportSignoff(
            signoff_id=f"SGN-2627-{i+1:04d}", site_id=SITE,
            job_id=jid(), visit_id=vid(),
            report_ref=f"IQE/RPT-{random.randint(1,500):04d}",
            assigned_tm_person_id=pid(),
            signed_by_person_id=pid() if result != "pending" else None,
            signed_by_role=rc(["tm", "deputy_rh", "cross_region_tm"]),
            is_deputy=random.random() > 0.7,
            result=result,
            rework_notes="Please correct findings section" if result == "rework_required" else None,
            rework_count=random.randint(0, 3) if result == "rework_required" else 0,
            scope_verified=result == "approved",
            coi_checked=result == "approved",
            signed_on=rdt(30) if result != "pending" else None,
            status=rc(["pending", "under_review", "approved", "rework", "rejected"]),
        ))
    await bulk_insert(sgn_docs, "report signoffs")

    wl_docs = []
    for i in range(200):
        outcome = rc(["won", "lost", "no_go", "closed_no_bid"])
        c_id, c_name = cid_name()
        proposal_val = random.randint(500000, 15000000)
        wl_docs.append(WinLossRecord(
            record_id=f"WL-2627-{i+1:04d}", site_id=SITE,
            enquiry_id=eid(), client_id=c_id, client_name=c_name,
            outcome=outcome,
            outcome_date=rdt(180),
            j_no=f"{rc(REGIONS)}-2627-{random.randint(1,500):04d}" if outcome == "won" else None,
            award_value=proposal_val * random.uniform(0.85, 1.1) if outcome == "won" else 0,
            competitor_name=rc(INSPECTION_COMPANIES) if outcome == "lost" else None,
            lost_reason_codes=["PRICE_TOO_HIGH", "TECHNICAL_CAPABILITY"] if outcome == "lost" else [],
            price_gap_pct=random.uniform(5, 25) if outcome == "lost" else None,
            no_go_reason_codes=["SCOPE_OUTSIDE_ACCREDITATION"] if outcome == "no_go" else [],
            service_line=rc(SERVICE_LINES),
            region_code=rc(REGIONS),
            sector=rc(SECTORS),
            proposal_value=proposal_val,
            margin_pct=random.uniform(10, 35) if outcome == "won" else 0,
            cycle_days=random.randint(10, 90),
        ))
    await bulk_insert(wl_docs, "win/loss records")

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 9. EXIT MANAGEMENT (50)                                           ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Exit management...")
    exit_docs = []
    for i in range(50):
        exit_type = rc(EXIT_TYPES)
        status = rc(["initiated", "in_progress", "completed"])
        items = [ExitChecklistItem(
            item_code=item.item_code, description=item.description, department=item.department,
            completed=random.random() > 0.4 if status != "initiated" else False,
            completed_on=rdt(30) if random.random() > 0.5 else None,
            completed_by=pid() if random.random() > 0.5 else None,
        ) for item in DEFAULT_EXIT_CHECKLIST]
        exit_docs.append(ExitProcess(
            exit_id=f"EXT-2627-{i+1:04d}",
            person_id=pid(), site_id=SITE,
            exit_type=exit_type,
            notice_date=rdt(90),
            last_working_date=rdt(30) if status != "initiated" else None,
            reason=rc(["Better opportunity", "Personal reasons", "Relocation",
                       "Health reasons", "Contract completion", "Higher studies",
                       "Performance", "Company restructuring"]),
            checklist=items,
            authorization_withdrawn=status == "completed",
            system_access_removed=status == "completed",
            assets_returned=status in ("in_progress", "completed"),
            final_settlement_amount=random.randint(50000, 500000) if status == "completed" else 0,
            final_settlement_status=rc(["pending", "calculated", "approved", "paid"]),
            handover_person_id=pid() if status != "initiated" else None,
            exit_interview_done=status == "completed",
            status=status,
            processed_by=pid(),
        ))
    await bulk_insert(exit_docs, "exit processes")

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 10. PURCHASING (200 + 200 + 100)                                  ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Purchasing & dunning...")
    prq_ids = []
    prq_docs = []
    purposes = [
        "NDT equipment calibration", "PPE procurement", "Safety supplies",
        "Calibration services", "Office supplies", "IT equipment",
        "Vehicle maintenance", "Training materials", "Travel booking",
        "Equipment repair", "Stationery", "Communication equipment",
    ]
    for i in range(200):
        rid = f"PRQ-2627-{i+1:04d}"
        prq_ids.append(rid)
        vendor = rc(VENDORS)
        n_items = random.randint(1, 5)
        items = [PurchaseItem(
            item_no=j+1,
            description=f"Item {j+1} - {rc(['Calibration', 'PPE', 'Tools', 'Consumables', 'Services'])}",
            quantity=random.randint(1, 20),
            rate=random.randint(500, 50000),
            amount=0,
        ) for j in range(n_items)]
        for item in items:
            item.amount = item.quantity * item.rate
        total = sum(item.amount for item in items)
        is_msme = random.random() > 0.6
        prq_docs.append(PurchaseRequisition(
            requisition_id=rid, site_id=SITE,
            vendor_name=vendor, vendor_type=rc(["manufacturer", "service_provider", "supplier"]),
            purpose=rc(purposes), job_id=jid() if random.random() > 0.4 else None,
            items=items, total_amount=total,
            requested_by=pid(),
            approved_by=pid() if random.random() > 0.3 else None,
            status=rc(["draft", "pending", "approved", "rejected", "completed"]),
            is_msme=is_msme,
            msme_registration=f"UDYAM-{rc(['MH','GJ','TN','KA','DL'])}-{random.randint(10,99)}-{random.randint(1000000,9999999)}" if is_msme else None,
        ))
    await bulk_insert(prq_docs, "purchase requisitions")

    vp_docs = []
    for i in range(200):
        amount = random.randint(5000, 500000)
        tds = round(amount * 0.1)
        vp_docs.append(VendorPayment(
            vp_id=f"VP-2627-{i+1:04d}", site_id=SITE,
            vendor_name=rc(VENDORS),
            vendor_type=rc(["manufacturer", "service_provider", "supplier"]),
            requisition_id=rc(prq_ids) if random.random() > 0.3 else None,
            invoice_number=f"{rc(['WRI','SSL','CSI','NES','PPW'])}/{random.randint(2024,2027)}/{random.randint(100,9999):04d}",
            invoice_date=rdt(90), job_id=jid() if random.random() > 0.4 else None,
            tm_approved=random.random() > 0.3,
            tm_approved_by=pid() if random.random() > 0.3 else None,
            amount=amount, tds_deducted=tds, net_payable=amount - tds,
            due_date=future(random.randint(15, 60)),
            status=rc(["pending", "approved", "paid", "overdue"]),
            is_msme=random.random() > 0.6,
            msme_45day_compliant=random.random() > 0.2,
        ))
    await bulk_insert(vp_docs, "vendor payments")

    dun_docs = []
    for i in range(100):
        overdue = random.randint(5, 120)
        dun_docs.append(DunningRecord(
            dunning_id=f"DUN-2627-{i+1:04d}", site_id=SITE,
            invoice_id=rc(invoice_ids), client_id=cid_name()[0],
            dunning_level=random.randint(1, 4),
            due_date=rdt(overdue + 30),
            overdue_days=overdue,
            amount_outstanding=random.randint(50000, 5000000),
            action_taken=rc(["Email reminder sent", "Phone follow-up", "Formal notice issued",
                            "Escalated to management", "Legal notice initiated", "Payment plan agreed"]),
            action_by=pid(),
            next_action_date=future(random.randint(7, 30)),
            response=rc(["Payment promised by month-end", "Dispute raised", "No response",
                         "Partial payment received", "Payment in process", None]),
            status=rc(["open", "closed", "escalated"]),
        ))
    await bulk_insert(dun_docs, "dunning records")

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 11. NOTIFICATIONS (200 + 200 + 500)                               ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Notifications...")
    eml_docs = []
    subjects = [
        "Payment reminder: Invoice overdue", "New RFI assigned", "Offer Letter - IQE Inspection Pvt Ltd",
        "Visit scheduled", "Report ready for review", "Leave request notification",
        "Payroll disbursement confirmation", "NCR raised", "Qualification expiry reminder",
        "Authorization renewal due", "Meeting invitation: MRM Q3", "Calibration due reminder",
    ]
    for i in range(200):
        cat = rc(NOTIF_CATEGORIES)
        eml_docs.append(EmailLog(
            log_id=f"EML-{i+1:04d}", site_id=SITE,
            category=cat, channel="email",
            to_addresses=[rand_email(rand_name())],
            subject=rc(subjects),
            body_template=f"Automated notification for {cat.replace('_', ' ')}",
            related_entity_type=rc(["invoice", "rfi", "visit", "leave", "payroll", "ncr"]),
            related_entity_id=f"REF-{random.randint(1,999):04d}",
            status=rc(["queued", "sent", "delivered", "failed", "bounced"]),
            sent_at=rdt(30) if random.random() > 0.2 else None,
            triggered_by=pid(),
        ))
    await bulk_insert(eml_docs, "email logs")

    np_docs = []
    sample_for_prefs = random.sample(people_ids, min(200, len(people_ids)))
    for i, p in enumerate(sample_for_prefs):
        np_docs.append(NotificationPreference(
            preference_id=f"NP-{i+1:04d}",
            person_id=p, site_id=SITE,
            email=rand_email(people_names.get(p, "user")),
            phone=rand_phone(),
            channel_preferences={"email": True, "in_app": True,
                                 "sms": random.random() > 0.5, "whatsapp": random.random() > 0.7},
            timezone="Asia/Kolkata",
            is_admin_recipient=random.random() > 0.9,
            receives_daily_digest=random.random() > 0.5,
            receives_weekly_summary=random.random() > 0.7,
        ))
    await bulk_insert(np_docs, "notification preferences")

    notif_docs = []
    notif_messages = [
        ("New RFI assigned", "A new Request for Inspection has been assigned to you", "/rfis"),
        ("Report pending sign-off", "Report awaiting your TM approval", "/signoffs"),
        ("Invoice overdue", "Payment overdue - follow-up required", "/invoices"),
        ("New assignment", "You have been assigned to a new job", "/jobs"),
        ("Interview feedback", "Technical interview feedback received", "/recruitment"),
        ("Leave request", "Leave request pending your approval", "/leave-attendance"),
        ("Payroll ready", "Payroll run ready for your approval", "/payroll"),
        ("NCR raised", "A new NCR has been raised on your job", "/ncrs"),
        ("Qualification expiry", "Your qualification is expiring soon", "/people"),
        ("Visit scheduled", "A new visit has been scheduled", "/visits"),
        ("Punch item raised", "A new punch item has been raised", "/punch-list"),
        ("Client feedback", "New client feedback received", "/feedback"),
    ]
    for i in range(500):
        title, msg, link = rc(notif_messages)
        notif_docs.append(InAppNotification(
            notification_id=f"NTF-{i+1:04d}", site_id=SITE,
            person_id=pid(),
            category=rc(NOTIF_CATEGORIES),
            title=title, message=msg, link=link,
            is_read=random.random() > 0.4,
            read_at=rdt(10) if random.random() > 0.5 else None,
        ))
    await bulk_insert(notif_docs, "in-app notifications")

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ FINAL SUMMARY                                                     ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("\n" + "=" * 60)
    print("BULK SEED COMPLETE — Final collection counts:")
    print("=" * 60)
    total = 0
    for name in gap_collections:
        count = await db[name].count_documents({})
        print(f"  {name:35s} {count:>6}")
        total += count
    print(f"  {'─' * 42}")
    print(f"  {'TOTAL':35s} {total:>6}")
    print(f"\nAll gap-fill collections seeded. Test at http://localhost:3000")

    await client.close()


if __name__ == "__main__":
    asyncio.run(seed())
