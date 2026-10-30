"""
Seed ONLY the gap-fill module collections (15 new modules from Oct 2026 build).
Uses existing IDs from the core collections (people, clients, jobs, etc.)

Run:  cd backend && .venv/bin/python scripts/seed_gap_fill_data.py
"""
import asyncio
import random
from datetime import datetime, timedelta
from pymongo import AsyncMongoClient
from beanie import init_beanie

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from core.config import settings

# All document models needed for beanie init
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

# Gap-fill models
from modules.regions.models import Region, Office, InterOfficeSettlement, InspectorLoan, DeputyCoverage
from modules.recruitment.models import (
    ManpowerRequest, Candidate, TechnicalInterview, OfferLetter,
    InductionChecklist, InductionItem, CandidateQualification, DEFAULT_INDUCTION_ITEMS,
)
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


def dt(days_ago: int = 0) -> datetime:
    return datetime.now() - timedelta(days=days_ago) + timedelta(hours=9)

def future(days: int) -> datetime:
    return datetime.now() + timedelta(days=days)

SITE = "SITE-01"


async def seed():
    client = AsyncMongoClient(settings.mongodb_url)
    db = client[settings.mongodb_db_name]

    # Check if gap-fill already seeded
    existing = await db["regions"].count_documents({})
    if existing >= 4:
        print(f"Gap-fill already seeded ({existing} regions). Drop collections to re-seed:")
        print("  mongosh iqeapp_dev --eval 'db.regions.drop(); db.offices.drop(); ...'")
        return

    # Init beanie with ALL document models
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
        # Gap-fill
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
    ]
    await init_beanie(database=db, document_models=all_models)

    # ── Grab real IDs from existing core data ──
    people = []
    async for p in db["people"].find({}, {"person_id": 1, "full_name": 1, "designation": 1, "employment_status": 1, "base_location": 1}).limit(20):
        people.append(p)
    clients = []
    async for c in db["clients"].find({}, {"client_id": 1, "name": 1}).limit(10):
        clients.append(c)
    jobs = []
    async for j in db["jobs"].find({}, {"job_id": 1, "title": 1, "client_id": 1, "client_name": 1, "status": 1}).limit(10):
        jobs.append(j)
    visits_list = []
    async for v in db["visits"].find({}, {"visit_id": 1, "job_id": 1, "inspector_id": 1, "inspector_name": 1}).limit(10):
        visits_list.append(v)
    enquiries = []
    async for e in db["enquiries"].find({}, {"enquiry_id": 1, "client_id": 1, "status": 1}).limit(10):
        enquiries.append(e)
    invoices_list = []
    async for i in db["invoices"].find({}, {"invoice_id": 1, "job_id": 1, "client_id": 1, "client_name": 1, "invoice_number": 1}).limit(5):
        invoices_list.append(i)
    manufacturers = []
    async for m in db["manufacturers"].find({}, {"manufacturer_id": 1, "name": 1}).limit(6):
        manufacturers.append(m)

    if not people or not clients or not jobs:
        print("ERROR: Core data not found. Run enrich_200_mock_data.py first.")
        return

    print(f"Found: {len(people)} people, {len(clients)} clients, {len(jobs)} jobs, {len(visits_list)} visits")
    print()

    def pid(i): return people[i % len(people)]["person_id"]
    def pname(i): return people[i % len(people)].get("full_name", "Inspector")
    def cid(i): return clients[i % len(clients)]["client_id"]
    def cname(i): return clients[i % len(clients)].get("name", "Client")
    def jid(i): return jobs[i % len(jobs)]["job_id"]
    def vid(i): return visits_list[i % len(visits_list)]["visit_id"] if visits_list else "VST-001"
    def eid(i): return enquiries[i % len(enquiries)]["enquiry_id"] if enquiries else "ENQ-001"
    def iid(i): return invoices_list[i % len(invoices_list)]["invoice_id"] if invoices_list else "INV-001"
    def mid(i): return manufacturers[i % len(manufacturers)]["manufacturer_id"] if manufacturers else "MFR-001"
    def mname(i): return manufacturers[i % len(manufacturers)].get("name", "Manufacturer") if manufacturers else "Manufacturer"

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 1. REGIONS & OFFICES                                              ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Regions & offices...")
    regions_data = [
        {"region_code": "N", "name": "North", "head_office": False,
         "regional_head_person_id": pid(0), "technical_manager_person_id": pid(1)},
        {"region_code": "S", "name": "South", "head_office": True,
         "regional_head_person_id": pid(2), "technical_manager_person_id": pid(1),
         "inspection_coordinator_person_id": pid(5)},
        {"region_code": "E", "name": "East", "head_office": False,
         "regional_head_person_id": pid(0), "technical_manager_person_id": pid(4)},
        {"region_code": "W", "name": "West", "head_office": False,
         "regional_head_person_id": pid(8), "technical_manager_person_id": pid(1),
         "inspection_coordinator_person_id": pid(2)},
    ]
    for r in regions_data:
        await Region(**r).insert()

    offices_data = [
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
    for o in offices_data:
        await Office(**o).insert()

    # Inter-office settlements
    for month, from_r, fee in [(9, "W", 2500000), (9, "N", 1800000), (9, "E", 950000),
                                 (10, "W", 2700000), (10, "N", 1650000)]:
        ho = fee * 0.25
        await InterOfficeSettlement(
            settlement_id=f"IOS-2627-{month:02d}-{from_r}",
            period_month=month, period_year=2026, from_region=from_r, to_region="S",
            fee_collected=fee, ho_pool_share=ho, region_share=fee - ho,
            net_payable_to_ho=ho,
            status="settled" if month == 9 else "submitted",
            settled_by=pid(9) if month == 9 else None,
            created_by=pid(9)
        ).insert()
    print(f"     4 regions, 6 offices, 5 settlements")

    # Inspector loan
    await InspectorLoan(
        loan_id="LOAN-2627-001", inspector_person_id=pid(4),
        home_region="E", borrowing_region="N", job_id=jid(2),
        rate_card_rate=8500, start_date=dt(45), end_date=future(45),
        status="active", approved_by=pid(0),
        remarks="Loaned for NDT work at northern project"
    ).insert()

    # Deputy coverage
    await DeputyCoverage(
        coverage_id="DEP-2627-001", absent_role="IC", region_code="W",
        absent_person_id=pid(2), deputy_person_id=pid(0), deputy_role="RH",
        scope_limits="Within authorised scope; escalate to TM for new service lines",
        arranged_by=pid(7), valid_from=dt(5), valid_until=future(10),
        notes="IC on leave, RH covers scheduling duties"
    ).insert()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 2. RFIs                                                           ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → RFIs...")
    rfis = [
        {"rfi_id": "RFI-2627-001", "job_id": jid(0),
         "contractor_name": mname(0), "raised_by": "Site QC",
         "inspection_point_type": "hold", "discipline": "Pressure Vessels",
         "description": "Hold point: Hydrostatic test at 1.5x design pressure (24 bar)",
         "location": "Bay 3, Fabrication Shop",
         "scheduled_date": dt(5), "scheduled_by": pid(2),
         "inspector_person_id": pid(3), "tm_confirmed": True, "tm_confirmed_by": pid(1),
         "status": "scheduled", "turnaround_hours": 48},
        {"rfi_id": "RFI-2627-002", "job_id": jid(0),
         "contractor_name": mname(0),
         "inspection_point_type": "witness", "discipline": "NDT",
         "description": "Witness point: RT of circumferential weld seams",
         "status": "inspected", "result": "accepted",
         "inspection_date": dt(65), "visit_id": vid(1), "turnaround_hours": 24},
        {"rfi_id": "RFI-2627-003", "job_id": jid(1),
         "contractor_name": mname(2),
         "inspection_point_type": "hold", "discipline": "Valves",
         "description": "Hold point: Factory acceptance test for 16\" 600# gate valve",
         "status": "open", "requested_date": future(10)},
        {"rfi_id": "RFI-2627-004", "job_id": jid(2),
         "contractor_name": mname(3),
         "inspection_point_type": "surveillance", "discipline": "Forgings",
         "description": "Surveillance: Forging heat treatment verification for HP turbine rotor disc",
         "status": "open", "requested_date": future(3)},
        {"rfi_id": "RFI-2627-005", "job_id": jid(0),
         "contractor_name": mname(0),
         "inspection_point_type": "review", "discipline": "Documentation",
         "description": "Document review: Final MDR package for PV-101/102",
         "status": "closed", "result": "accepted", "inspection_date": dt(20), "turnaround_hours": 72},
    ]
    for r in rfis:
        await RFI(site_id=SITE, **r).insert()
    print(f"     {len(rfis)} RFIs")

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 3. PUNCH LIST                                                     ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Punch list...")
    punches = [
        {"punch_id": "PL-2627-001", "job_id": jid(0),
         "description": "Weld repair required at joint WJ-05 — incomplete root penetration",
         "category": "A", "discipline": "Welding", "location": "PV-101, Longitudinal Seam 3",
         "raised_by": pid(3), "assigned_to": mid(0), "status": "open", "due_date": future(7)},
        {"punch_id": "PL-2627-002", "job_id": jid(0),
         "description": "Missing identification stamp on plate batch #4521",
         "category": "B", "discipline": "Material", "location": "Raw Material Store",
         "raised_by": pid(3), "status": "corrected", "corrected_on": dt(10)},
        {"punch_id": "PL-2627-003", "job_id": jid(1),
         "description": "Seat leakage during low-pressure test — valve SN LTV-2627-048",
         "category": "A", "discipline": "Valves", "location": "Test Bay 2",
         "raised_by": pid(5), "status": "open", "due_date": future(14)},
        {"punch_id": "PL-2627-004", "job_id": jid(0),
         "description": "Paint DFT below minimum spec on nozzle N3 — requires re-coat",
         "category": "B", "discipline": "Coatings", "location": "PV-102, Nozzle area",
         "raised_by": pid(3), "status": "open", "due_date": future(10)},
        {"punch_id": "PL-2627-005", "job_id": jid(2),
         "description": "UT calibration certificate expired for flaw detector EP650",
         "category": "C", "discipline": "NDT", "location": "NDT Lab",
         "raised_by": pid(4), "status": "corrected", "corrected_on": dt(5)},
    ]
    for p in punches:
        await PunchItem(site_id=SITE, **p).insert()
    print(f"     {len(punches)} punch items")

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 4. RELEASE NOTES                                                  ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Release notes...")
    releases = [
        {"irn_id": "IRN-2627-001", "job_id": jid(0),
         "description": "Naphtha Splitter Overhead Drum (PV-101)",
         "scope_summary": "Final inspection and release of pressure vessel PV-101.",
         "hold_points_signed": True, "hold_points_count": 6, "hold_points_signed_count": 6,
         "ncrs_closed": True, "ncr_total": 2, "ncr_closed_count": 2,
         "cat_a_punch_closed": False, "cat_a_total": 3, "cat_a_closed_count": 2,
         "cat_a_open_ids": ["PUN-001"],
         "recommended_by": pid(1), "recommended_on": dt(8),
         "status": "recommended"},
        {"irn_id": "IRN-2627-002", "job_id": jid(0),
         "description": "Crude Column Reflux Drum (PV-102)",
         "scope_summary": "Final inspection and release of pressure vessel PV-102.",
         "hold_points_signed": True, "hold_points_count": 8, "hold_points_signed_count": 8,
         "ncrs_closed": True, "ncr_total": 1, "ncr_closed_count": 1,
         "cat_a_punch_closed": True, "cat_a_total": 2, "cat_a_closed_count": 2,
         "recommended_by": pid(1), "recommended_on": dt(6),
         "approved_by": pid(0), "approved_on": dt(5),
         "released": True, "release_date": dt(4),
         "status": "released"},
    ]
    for r in releases:
        await InspectionReleaseNote(site_id=SITE, **r).insert()
    print(f"     {len(releases)} release notes")

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 5. CLIENT FEEDBACK                                                ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Client feedback...")
    feedbacks = [
        {"feedback_id": "FBK-2627-001", "client_id": cid(0), "client_name": cname(0),
         "job_id": jid(0), "overall_rating": 5, "timeliness_rating": 4,
         "report_quality_rating": 5, "inspector_competence_rating": 5, "communication_rating": 4,
         "comments": "Inspector's expertise is excellent. Reports are thorough and well-documented."},
        {"feedback_id": "FBK-2627-002", "client_id": cid(1), "client_name": cname(1),
         "job_id": jid(1), "overall_rating": 3, "timeliness_rating": 2,
         "report_quality_rating": 4, "inspector_competence_rating": 4, "communication_rating": 3,
         "comments": "Report quality is good but scheduling delays need improvement.",
         "requires_escalation": True, "escalated_to_mrm": True, "mrm_ref": "MRM-2627-001"},
        {"feedback_id": "FBK-2627-003", "client_id": cid(2), "client_name": cname(2),
         "job_id": jid(2), "overall_rating": 4, "timeliness_rating": 5,
         "report_quality_rating": 4, "inspector_competence_rating": 4, "communication_rating": 5,
         "comments": "Very responsive team. Minor formatting issues in reports."},
        {"feedback_id": "FBK-2627-004", "client_id": cid(3), "client_name": cname(3),
         "job_id": jid(3), "overall_rating": 2, "timeliness_rating": 1,
         "report_quality_rating": 3, "inspector_competence_rating": 3, "communication_rating": 2,
         "comments": "Significant delays in scheduling. Inspector changed midway without notice.",
         "requires_escalation": True, "escalated_to_mrm": True, "mrm_ref": "MRM-2627-002",
         "corrective_action": "Review scheduling process. Implement change management protocol."},
    ]
    for f in feedbacks:
        await ClientFeedback(site_id=SITE, **f).insert()
    print(f"     {len(feedbacks)} feedback records")

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 6. JOB HANDOFF (Enquiry → Job conversions)                        ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Job handoff...")
    conversions = [
        {"conversion_id": "JC-2627-001", "enquiry_id": eid(0), "job_id": jid(0),
         "j_no": "W-2627-0001", "client_id": cid(0), "client_name": cname(0),
         "service_line": "PART_B", "region_code": "W", "award_value": 3500000,
         "converted_by": pid(8), "converted_on": dt(95),
         "handoff_checklist": {"so_created": True, "po_received": True, "inspector_assigned": True,
                               "itp_approved": True, "kickoff_done": True},
         "status": "completed"},
        {"conversion_id": "JC-2627-002", "enquiry_id": eid(1), "job_id": jid(1),
         "client_id": cid(1), "client_name": cname(1),
         "service_line": "PART_A", "region_code": "S", "award_value": 1200000,
         "converted_by": pid(1), "converted_on": dt(60),
         "handoff_checklist": {"so_created": True, "po_received": True, "inspector_assigned": True,
                               "itp_approved": False, "kickoff_done": False},
         "status": "in_progress"},
    ]
    for c in conversions:
        await JobConversion(site_id=SITE, **c).insert()
    print(f"     {len(conversions)} job conversions")

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 7. REPORT SIGN-OFFS                                               ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Report sign-offs...")
    signoffs = [
        {"signoff_id": "SGN-2627-001", "job_id": jid(0), "visit_id": vid(0),
         "report_ref": "IQE/RPT-001", "report_type": "inspection_report",
         "inspector_person_id": pid(3), "inspector_name": pname(3),
         "reviewer_person_id": pid(5), "reviewer_name": pname(5),
         "tm_person_id": pid(1), "tm_name": pname(1),
         "inspector_signed_on": dt(79), "reviewer_signed_on": dt(78),
         "tm_signed_on": dt(77), "status": "approved"},
        {"signoff_id": "SGN-2627-002", "job_id": jid(0), "visit_id": vid(1),
         "report_ref": "IQE/RPT-002", "report_type": "inspection_report",
         "inspector_person_id": pid(3),
         "reviewer_person_id": pid(5),
         "inspector_signed_on": dt(64), "status": "pending_tm"},
        {"signoff_id": "SGN-2627-003", "job_id": jid(1), "visit_id": vid(3),
         "report_ref": "IQE/RPT-003", "report_type": "vendor_audit_report",
         "inspector_person_id": pid(5),
         "status": "pending_reviewer"},
    ]
    for s in signoffs:
        await ReportSignoff(site_id=SITE, **s).insert()
    print(f"     {len(signoffs)} sign-offs")

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 8. WIN/LOSS RECORDS                                               ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Win/Loss records...")
    wl = [
        {"record_id": "WL-2627-001", "enquiry_id": eid(0), "client_id": cid(0),
         "client_name": cname(0), "outcome": "won",
         "j_no": "W-2627-0001", "award_value": 3500000, "proposal_value": 3500000,
         "service_line": "PART_B", "region_code": "W", "sector": "oil_gas",
         "margin_pct": 22.5, "cycle_days": 25},
        {"record_id": "WL-2627-002", "enquiry_id": eid(3), "client_id": cid(5),
         "client_name": cname(5), "outcome": "no_go",
         "no_go_reason_codes": ["SCOPE_OUTSIDE_ACCREDITATION", "NO_PHARMA_INSPECTOR"],
         "service_line": "PART_A", "region_code": "W", "sector": "pharma",
         "proposal_value": 800000, "cycle_days": 15},
        {"record_id": "WL-2627-003", "enquiry_id": eid(1), "client_id": cid(1),
         "client_name": cname(1), "outcome": "won",
         "award_value": 5200000, "proposal_value": 5000000,
         "service_line": "PART_B", "region_code": "W", "sector": "infrastructure",
         "margin_pct": 18.0, "cycle_days": 45},
        {"record_id": "WL-2627-004", "enquiry_id": eid(4), "client_id": cid(6),
         "client_name": cname(6), "outcome": "lost",
         "competitor_name": "Bureau Veritas India", "lost_reason_codes": ["PRICE_TOO_HIGH"],
         "price_gap_pct": 12.0, "service_line": "PART_A", "region_code": "E", "sector": "metals",
         "proposal_value": 4200000, "cycle_days": 60},
    ]
    for w in wl:
        await WinLossRecord(site_id=SITE, **w).insert()
    print(f"     {len(wl)} win/loss records")

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 9. RECRUITMENT PIPELINE                                           ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Recruitment...")
    mpr = [
        {"request_id": "MPR-2627-001", "job_id": jid(4), "region_code": "W",
         "requested_by": pid(8), "position_title": "Senior Inspection Officer - Rotating Equipment",
         "category": "TECHNICAL_INSPECTION", "engagement_type": "PERMANENT",
         "required_qualifications": ["ASNT NDT Level II", "CSWIP 3.1"],
         "required_experience_years": 10, "headcount": 1, "budget_per_head": 120000,
         "within_budget": True, "budget_approved": True, "approved_by": pid(7),
         "priority": "urgent", "status": "sourcing", "target_date": future(30)},
        {"request_id": "MPR-2627-002", "region_code": "N",
         "requested_by": pid(0), "position_title": "Inspection Officer - Electrical",
         "category": "TECHNICAL_INSPECTION", "engagement_type": "CONTRACT",
         "required_qualifications": ["B.E. Electrical"],
         "required_experience_years": 5, "headcount": 2, "budget_per_head": 80000,
         "within_budget": True, "budget_approved": True,
         "priority": "normal", "status": "sourcing", "target_date": future(45)},
    ]
    for m in mpr:
        await ManpowerRequest(site_id=SITE, **m).insert()

    candidates = [
        {"candidate_id": "CND-2627-001", "request_id": "MPR-2627-001",
         "full_name": "Arun Krishnamurthy", "email": "arun.k@gmail.com", "phone": "+91-9812345670",
         "source": "portal", "source_detail": "Naukri.com",
         "experience_years": 12, "current_employer": "Bureau Veritas India",
         "current_designation": "Senior Inspector", "expected_ctc": 1400000,
         "qualifications": [CandidateQualification(name="ASNT NDT Level II - UT", issuing_body="ASNT", year=2018)],
         "status": "offer_sent"},
        {"candidate_id": "CND-2627-002", "request_id": "MPR-2627-001",
         "full_name": "Manoj Tiwari", "email": "manoj.t@outlook.com", "phone": "+91-9812345671",
         "source": "referral", "source_detail": f"Referred by {pname(3)}",
         "experience_years": 8, "current_employer": "TUV SUD India",
         "current_designation": "Inspection Engineer", "expected_ctc": 1100000,
         "qualifications": [CandidateQualification(name="CSWIP 3.1", issuing_body="TWI", year=2020)],
         "status": "not_fit"},
        {"candidate_id": "CND-2627-003", "request_id": "MPR-2627-002",
         "full_name": "Priyanka Mehta", "email": "priyanka.m@yahoo.com", "phone": "+91-9812345672",
         "source": "portal", "source_detail": "LinkedIn",
         "experience_years": 6, "current_employer": "Siemens Energy India",
         "current_designation": "Electrical QC Engineer", "expected_ctc": 950000,
         "qualifications": [CandidateQualification(name="B.E. Electrical", issuing_body="VTU", year=2018)],
         "status": "screening"},
        {"candidate_id": "CND-2627-004", "request_id": "MPR-2627-002",
         "full_name": "Rahul Verma", "email": "rahul.v@gmail.com", "phone": "+91-9812345673",
         "source": "pool", "source_detail": "IQE candidate database",
         "experience_years": 7, "current_employer": "ABB India",
         "current_designation": "Test Engineer", "expected_ctc": 1000000,
         "qualifications": [CandidateQualification(name="B.Tech Electrical", issuing_body="IIT Roorkee", year=2017)],
         "status": "tm_interview"},
    ]
    for c in candidates:
        await Candidate(site_id=SITE, **c).insert()

    # Technical interviews
    await TechnicalInterview(
        interview_id="INT-2627-001", candidate_id="CND-2627-001", request_id="MPR-2627-001",
        site_id=SITE, interviewer_person_id=pid(1),
        interview_date=dt(8), interview_mode="video",
        technical_score=8, domain_knowledge=9, practical_assessment=7, communication=7,
        overall_recommendation="fit",
        remarks="Strong rotating equipment experience. Recommended for offer."
    ).insert()
    await TechnicalInterview(
        interview_id="INT-2627-002", candidate_id="CND-2627-002", request_id="MPR-2627-001",
        site_id=SITE, interviewer_person_id=pid(1),
        interview_date=dt(6), interview_mode="in_person",
        technical_score=5, domain_knowledge=6, practical_assessment=4, communication=6,
        overall_recommendation="not_fit",
        remarks="Insufficient hands-on experience with high-speed rotating equipment."
    ).insert()

    # Offer letter
    await OfferLetter(
        offer_id="OFR-2627-001", candidate_id="CND-2627-001", request_id="MPR-2627-001",
        site_id=SITE, offer_type="appointment",
        designation="Senior Inspection Officer - Rotating Equipment",
        department="Inspection", engagement_type="PERMANENT",
        ctc_offered=1350000, joining_date=future(30), probation_months=6,
        reporting_to_person_id=pid(1), status="sent", sent_on=dt(2)
    ).insert()

    # Induction (for a recently joined person)
    items = [InductionItem(item_code=i.item_code, description=i.description,
                           completed=idx < 6, completed_on=dt(15-idx) if idx < 6 else None)
             for idx, i in enumerate(DEFAULT_INDUCTION_ITEMS)]
    await InductionChecklist(
        induction_id="IND-2627-001", person_id=pid(10), site_id=SITE,
        checklist_items=items,
        confidentiality_signed=True, confidentiality_signed_on=dt(14),
        impartiality_declared=True, safety_briefing_done=True,
        it_access_provisioned=True, id_card_issued=False,
        completed=False, inducted_by=pid(11)
    ).insert()
    print(f"     2 requests, {len(candidates)} candidates, 2 interviews, 1 offer, 1 induction")

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 10. LEAVE & ATTENDANCE                                            ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Leave & attendance...")
    leaves = [
        {"leave_id": "LV-2627-001", "person_id": pid(3), "leave_type": "earned",
         "from_date": future(15), "to_date": future(19), "days": 5,
         "reason": "Annual vacation", "status": "approved", "approved_by": pid(0)},
        {"leave_id": "LV-2627-002", "person_id": pid(4), "leave_type": "sick",
         "from_date": dt(10), "to_date": dt(9), "days": 2,
         "reason": "Fever and cold", "status": "approved", "approved_by": pid(0)},
        {"leave_id": "LV-2627-003", "person_id": pid(6), "leave_type": "casual",
         "from_date": future(5), "to_date": future(5), "days": 1,
         "reason": "Personal work", "status": "pending"},
        {"leave_id": "LV-2627-004", "person_id": pid(2), "leave_type": "earned",
         "from_date": dt(5), "to_date": future(5), "days": 10,
         "reason": "Extended leave - family function", "status": "approved", "approved_by": pid(7)},
    ]
    for l in leaves:
        await LeaveRequest(site_id=SITE, **l).insert()

    # Attendance for last 7 days for 4 inspectors
    att_count = 0
    for day_offset in range(7):
        for idx in [3, 4, 5, 6]:
            status = "present" if random.random() > 0.15 else "half_day"
            hrs = 8.0 + random.random() if status == "present" else 4.0
            await AttendanceRecord(
                attendance_id=f"ATT-{idx:02d}-D{day_offset}",
                person_id=pid(idx), site_id=SITE,
                date=dt(day_offset), status=status,
                check_in=dt(day_offset) - timedelta(hours=1),
                check_out=dt(day_offset) + timedelta(hours=int(hrs)),
                hours_worked=round(hrs, 1),
                region_code=["W", "E", "S", "N"][idx % 4]
            ).insert()
            att_count += 1

    # Timesheets for Oct 2026
    for idx in [3, 4, 5]:
        entries = [
            TimesheetEntry(date=dt(d), job_id=jid(idx-3), hours=8,
                          activity_type="inspection" if d % 5 != 0 else "travel")
            for d in range(22)
        ]
        await Timesheet(
            timesheet_id=f"TS-2627-{pid(idx)[-3:]}-10",
            person_id=pid(idx), site_id=SITE,
            period_month=10, period_year=2026,
            home_region=["W", "E", "S"][idx-3], working_region=["W", "E", "S"][idx-3],
            entries=entries, total_days=22, total_hours=176,
            status="submitted" if idx == 3 else "draft",
            created_by=pid(idx)
        ).insert()
    print(f"     {len(leaves)} leaves, {att_count} attendance records, 3 timesheets")

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 11. PAYROLL                                                       ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Payroll...")
    # Sep payroll (disbursed)
    await PayrollRun(
        run_id="PR-2627-09", site_id=SITE,
        period_month=9, period_year=2026, status="disbursed",
        total_gross=1200000, total_deductions=240000, total_net=960000, headcount=8,
        processed_by=pid(9), processed_on=dt(35),
        approved_by=pid(7), approved_on=dt(33), disbursed_on=dt(30)
    ).insert()
    # Oct payroll (in processing)
    await PayrollRun(
        run_id="PR-2627-10", site_id=SITE,
        period_month=10, period_year=2026, status="processing",
        total_gross=1250000, total_deductions=250000, total_net=1000000, headcount=8,
        processed_by=pid(9)
    ).insert()

    # Payslips for Sep for 4 inspectors
    for idx, basic in [(3, 85000), (4, 75000), (5, 72000), (6, 70000)]:
        hra = basic * 0.4
        conv = 3200
        special = basic * 0.15
        gross = basic + hra + conv + special
        pf = basic * 0.12
        esi = gross * 0.0075 if gross < 21000 * 2 else 0
        pt = 200
        tds = gross * 0.1
        deductions = pf + esi + pt + tds
        await Payslip(
            payslip_id=f"PS-2627-09-{pid(idx)[-3:]}",
            run_id="PR-2627-09", person_id=pid(idx), site_id=SITE,
            period_month=9, period_year=2026,
            basic_salary=basic, hra=hra, conveyance=conv, special_allowance=special,
            gross_salary=gross, pf_employee=pf, pf_employer=pf,
            esi_employee=esi, professional_tax=pt, tds=tds,
            total_deductions=deductions, net_salary=gross - deductions,
            days_present=22, payment_mode="NEFT", paid_on=dt(30)
        ).insert()
    print(f"     2 payroll runs, 4 payslips")

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 12. APPRAISALS                                                    ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Appraisals...")
    appraisals = [
        {"appraisal_id": "APR-2627-001", "person_id": pid(3),
         "period": "2025-26", "appraisal_type": "annual",
         "appraiser_person_id": pid(1), "reviewer_person_id": pid(0),
         "technical_score": 9, "quality_score": 9, "timeliness_score": 8,
         "communication_score": 7, "safety_score": 10,
         "overall_rating": 8.6, "overall_grade": "A",
         "strengths": "Excellent PV/HX inspection expertise. Thorough documentation.",
         "areas_for_improvement": "Client communication turnaround could improve.",
         "recommendations": "Recommend for TM track. Consider for Team Lead role.",
         "status": "completed"},
        {"appraisal_id": "APR-2627-002", "person_id": pid(4),
         "period": "2025-26", "appraisal_type": "annual",
         "appraiser_person_id": pid(1),
         "technical_score": 8, "quality_score": 8, "timeliness_score": 9,
         "communication_score": 8, "safety_score": 9,
         "overall_rating": 8.4, "overall_grade": "A",
         "strengths": "Excellent NDT skills. Fast turnaround on RT interpretation.",
         "status": "completed"},
        {"appraisal_id": "APR-2627-003", "person_id": pid(6),
         "period": "2025-26", "appraisal_type": "mid_year",
         "appraiser_person_id": pid(1),
         "technical_score": 7, "quality_score": 7, "timeliness_score": 6,
         "overall_rating": 6.7, "overall_grade": "B",
         "areas_for_improvement": "Needs to improve time management on multi-site visits.",
         "status": "in_review"},
    ]
    for a in appraisals:
        await Appraisal(site_id=SITE, **a).insert()

    await WitnessedInspection(
        witness_id="WIT-2627-001", person_id=pid(10),
        site_id=SITE, job_id=jid(0), visit_id=vid(1),
        witness_person_id=pid(1),
        discipline="Rotating Equipment", inspection_type="pumps",
        performance_score=7, knowledge_score=8, procedure_adherence_score=8,
        recommendation="satisfactory",
        remarks="Good grasp of pump inspection. Needs more exposure to high-speed compressors.",
        witness_date=dt(65)
    ).insert()
    print(f"     {len(appraisals)} appraisals, 1 witnessed inspection")

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 13. EXIT MANAGEMENT                                               ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Exit management...")
    await ExitProcess(
        exit_id="EXIT-2627-001", person_id=pid(10), site_id=SITE,
        exit_type="resignation", notice_date=dt(45), last_working_date=dt(15),
        reason="Better opportunity", status="settlement_pending",
        checklist={"laptop_returned": True, "id_card_returned": True,
                   "knowledge_transfer": True, "exit_interview": True,
                   "fnf_calculated": False, "relieving_letter": False},
        fnf_amount=0, initiated_by=pid(11)
    ).insert()
    print(f"     1 exit process")

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 14. PURCHASING                                                    ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Purchasing...")
    await PurchaseRequisition(
        requisition_id="PRQ-2627-001", site_id=SITE,
        vendor_name="Welding Research Institute", vendor_type="service_provider",
        purpose="Annual calibration of NDT equipment",
        items=[
            PurchaseItem(item_no=1, description="UT Flaw Detector Calibration", quantity=2, rate=15000, amount=30000),
            PurchaseItem(item_no=2, description="Thickness Gauge Calibration", quantity=4, rate=8000, amount=32000),
        ],
        total_amount=62000, requested_by=pid(4), status="approved",
        approved_by=pid(1), approved_on=dt(20), is_msme=True,
        msme_registration="UDYAM-MH-12-0012345"
    ).insert()
    await PurchaseRequisition(
        requisition_id="PRQ-2627-002", site_id=SITE,
        vendor_name="Safety Solutions Pvt Ltd", vendor_type="supplier",
        purpose="PPE procurement for new inspectors",
        items=[
            PurchaseItem(item_no=1, description="Safety Helmets (ISI)", quantity=10, rate=1200, amount=12000),
            PurchaseItem(item_no=2, description="Safety Shoes (IS 15298)", quantity=10, rate=2500, amount=25000),
            PurchaseItem(item_no=3, description="Fire Retardant Coveralls", quantity=10, rate=3500, amount=35000),
        ],
        total_amount=72000, requested_by=pid(11), status="pending",
    ).insert()

    await VendorPayment(
        vp_id="VP-2627-001", site_id=SITE,
        vendor_name="Welding Research Institute", vendor_type="service_provider",
        requisition_id="PRQ-2627-001", invoice_number="WRI/2627/0145",
        invoice_date=dt(15), amount=62000, tds_deducted=6200, net_payable=55800,
        due_date=future(15), status="pending", tm_approved=True,
        tm_approved_by=pid(1), is_msme=True, msme_45day_compliant=True
    ).insert()

    # Dunning record for overdue invoice
    if invoices_list:
        inv = invoices_list[0]
        await DunningRecord(
            dunning_id="DUN-2627-001", site_id=SITE,
            invoice_id=inv["invoice_id"], client_id=inv.get("client_id"),
            dunning_level=1, due_date=dt(20), overdue_days=20,
            amount_outstanding=531000, action_taken="Email reminder sent",
            action_by=pid(9), next_action_date=future(7),
            status="open"
        ).insert()
    print(f"     2 requisitions, 1 vendor payment, 1 dunning record")

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 15. MRM AGENDA                                                    ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → MRM agenda...")
    mrm_items = [
        {"mrm_id": "MRM-2627-001", "meeting_date": future(15), "period": "2026-Q3",
         "category": "feedback", "title": "Client scheduling delay — action required",
         "description": "Client rated timeliness 2/5. Root cause: IC on leave, no deputy coverage.",
         "presenter": pid(1), "status": "draft",
         "action_items": ["Implement mandatory deputy coverage for IC role", "Review scheduling SLA"]},
        {"mrm_id": "MRM-2627-002", "meeting_date": future(15), "period": "2026-Q3",
         "category": "win_loss", "title": "Q3 Win/Loss Analysis — 65% win rate",
         "presenter": pid(8), "status": "draft"},
        {"mrm_id": "MRM-2627-003", "meeting_date": future(15), "period": "2026-Q3",
         "category": "kpi", "title": "RFI turnaround KPI — avg 36hrs (target: 48hrs)",
         "presenter": pid(2), "status": "draft"},
        {"mrm_id": "MRM-2627-004", "meeting_date": future(15), "period": "2026-Q3",
         "category": "manpower", "title": "North region inspector shortage — critical",
         "description": "2 open MPRs, 1 loan active. Need 3 more authorized inspectors by Q4.",
         "presenter": pid(11), "status": "draft",
         "action_items": ["Fast-track hiring for MPR-2627-001/002", "Evaluate associate empanelment"]},
    ]
    for m in mrm_items:
        await MRMAgendaItem(site_id=SITE, **m).insert()
    print(f"     {len(mrm_items)} MRM agenda items")

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ 16. NOTIFICATIONS                                                 ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print("  → Notifications...")
    notifications = [
        {"notification_id": "NTF-001", "person_id": pid(3), "category": "rfi_raised",
         "title": "New RFI: Hydrostatic Test", "message": "RFI-2627-001 raised for hold point inspection",
         "link": "/rfis", "is_read": False},
        {"notification_id": "NTF-002", "person_id": pid(1), "category": "report_signoff",
         "title": "Report pending TM sign-off", "message": "Report IQE/RPT-002 awaiting your approval",
         "link": "/signoffs", "is_read": False},
        {"notification_id": "NTF-003", "person_id": pid(9), "category": "invoice_overdue",
         "title": "Invoice overdue", "message": "₹5,31,000 overdue by 20 days",
         "link": "/invoices", "is_read": False},
        {"notification_id": "NTF-004", "person_id": pid(3), "category": "assignment",
         "title": f"New assignment: {jid(0)}", "message": "You have been assigned as Inspection Officer",
         "link": "/jobs", "is_read": True},
        {"notification_id": "NTF-005", "person_id": pid(11), "category": "recruitment",
         "title": "Interview feedback received", "message": "TM recommends Arun Krishnamurthy as fit",
         "link": "/recruitment", "is_read": False},
        {"notification_id": "NTF-006", "person_id": pid(1), "category": "leave_request",
         "title": "Leave request pending", "message": f"{pname(6)} requested 1 day casual leave",
         "link": "/leave-attendance", "is_read": False},
        {"notification_id": "NTF-007", "person_id": pid(7), "category": "payroll",
         "title": "Payroll ready for approval", "message": "Oct 2026 payroll run ready for your sign-off",
         "link": "/payroll", "is_read": False},
    ]
    for n in notifications:
        await InAppNotification(**n).insert()

    # Email logs
    emails = [
        {"log_id": "EML-001", "category": "invoice_reminder", "channel": "email",
         "to_addresses": ["procurement@client.com"], "subject": "Payment reminder: Invoice overdue",
         "body_template": "Dear Sir/Madam, this is a reminder for the outstanding invoice...",
         "status": "sent", "sent_at": dt(5)},
        {"log_id": "EML-002", "category": "rfi_notification", "channel": "email",
         "to_addresses": [f"{pname(3).lower().replace(' ', '.')}@iqeipl.com"],
         "subject": "New RFI assigned: RFI-2627-001",
         "body_template": "A new Request for Inspection has been assigned to you...",
         "status": "delivered", "sent_at": dt(7)},
        {"log_id": "EML-003", "category": "offer_letter", "channel": "email",
         "to_addresses": ["arun.k@gmail.com"], "subject": "Offer Letter - IQE Inspection Pvt Ltd",
         "body_template": "Dear Arun, we are pleased to offer you the position of...",
         "status": "sent", "sent_at": dt(2)},
    ]
    for e in emails:
        await EmailLog(**e).insert()

    # Notification preferences
    for idx in [3, 4, 5, 1, 9]:
        await NotificationPreference(
            person_id=pid(idx),
            channel_preferences={"email": True, "in_app": True, "sms": idx in [3, 4]},
            category_subscriptions={
                "rfi_raised": True, "assignment": True, "report_signoff": True,
                "invoice_overdue": idx == 9, "leave_request": idx in [0, 1],
                "recruitment": idx == 11, "payroll": idx in [7, 9],
            },
            timezone="Asia/Kolkata", receives_daily_digest=True,
            receives_weekly_summary=idx in [1, 7]
        ).insert()
    print(f"     {len(notifications)} notifications, {len(emails)} email logs, 5 preferences")

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║ SUMMARY                                                           ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    print()
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
    total = 0
    print("✅ Gap-fill seed complete! New collection counts:")
    for name in gap_collections:
        count = await db[name].count_documents({})
        if count > 0:
            print(f"   {name}: {count}")
            total += count

    print(f"\n📊 Total new records: {total}")
    print("\n💡 Test the application at http://localhost:3000")
    print("   AUTH_ALLOW_ANONYMOUS=true → all API calls work without login in dev mode")

    await client.close()


if __name__ == "__main__":
    asyncio.run(seed())
