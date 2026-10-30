#!/usr/bin/env python3
"""Comprehensive Seeder to populate 200 mock records across all collections and fields in IQE.

Run via:
    ./.venv/bin/python scripts/seed_200_mock_data.py
"""
import asyncio
import random
from datetime import datetime, timedelta
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from beanie import init_beanie
from pymongo import AsyncMongoClient
from core.config import settings

# Models
from core.audit import AuditEntry
from core.sequences import Sequence
from modules.auth.models import UserLogin
from modules.clients.models import Client, ClientUnit
from modules.manufacturers.models import Manufacturer, ManufacturerUnit
from modules.users.models import Competency, InspectorRate, Associate
from modules.jobs.models import Job, SOWItem, AssignmentHistoryEntry
from modules.service_orders.models import ServiceOrder, POItem
from modules.control_numbers.models import ControlNumber
from modules.visits.models import Visit, ManufacturerVisitLocation
from modules.invoices.models import Invoice, ChargeItem, AnnexureItem
from modules.finance.models import AccountReceivable, AccountPayable
from modules.construction_bill_verification.models import (
    ConstructionBillVerificationRecord, ConstructionAbstractItem,
    SteelDiameterLedger, MaterialLedgerEntry, WaybillEntry
)
from modules.schedule_m_pharma_epc.models import (
    ScheduleMPharmaEPCProject, ScheduleMChecklistItem, ScheduleMRequirementsRegister,
    ScheduleMRFIRegister, ScheduleMURSTraceability, ScheduleMRABillReview
)
from modules.tpi.models import TpiReport
from modules.work_types.models import WorkTypeDefinition
from modules.work_packages.models import WorkPackage
from modules.assignments.models import Assignment
from modules.certifications.models import Certification
from modules.billing.models import BillingTerms
from modules.people.models import Person, CompetenceProfile, Authorization, ImpartialityDeclaration
from modules.reporting.models import ReportFormat, DEFAULT_FORMATS
from modules.complaints.models import CustomerComplaint
from modules.ncr.models import NCR, Severity as NCRSeverity, Disposition, NCRStatus
from modules.risk.models import Risk, RiskCategory, Treatment, RiskStatus, Control
from modules.enquiries.models import Enquiry, EnquiryCategory, GoNoGoDecision, ProposalRevision
from modules.enquiries.reason_codes import ReasonCode
from modules.rates.models import RateCard, RateLine, CardStatus
from modules.equipment.models import Equipment, EquipmentStatus
from modules.providers.models import ExternalProvider, ProviderCategory, ProviderStatus, Accreditation
from modules.itp.models import InspectionTestPlan, ITPPoint, InterventionType, ITPStatus
from modules.appeals.models import Appeal, AppealGrounds, AppealStatus
from modules.commercial.models import Amendment, AmendmentType, AmendmentStatus

DOCUMENT_MODELS = [
    AuditEntry, Sequence, UserLogin, Client, ClientUnit, Manufacturer, ManufacturerUnit,
    Competency, InspectorRate, Associate, Job, ServiceOrder, ControlNumber, Visit,
    ManufacturerVisitLocation, Invoice, AccountReceivable, AccountPayable,
    ConstructionBillVerificationRecord, ScheduleMPharmaEPCProject, TpiReport,
    WorkTypeDefinition, WorkPackage, Assignment, Certification, BillingTerms,
    Person, CompetenceProfile, Authorization, ImpartialityDeclaration, ReportFormat,
    CustomerComplaint, NCR, Risk, Enquiry, GoNoGoDecision, ProposalRevision, ReasonCode,
    RateCard, Equipment, ExternalProvider, InspectionTestPlan, Appeal, Amendment
]

SITE = "SITE-01"
random.seed(42)

INDUSTRIES = [
    "Oil & Gas", "Power Generation", "Petrochemicals", "Heavy Fabrication",
    "Offshore & Marine", "Aerospace & Defence", "Renewable Energy", "Pharmaceuticals",
]

JOB_CATEGORIES = ["PV-PIPE", "STR-FAB", "NDT-RAD", "VND-AUD", "PRE-SHP", "CUSTOM"]

FIRST_NAMES = [
    "Rajesh", "Vikram", "Anil", "Suresh", "Priya", "Deepak", "Sanjay", "Rohan", "Sunil", "Meena",
    "Arjun", "Karan", "Kavita", "Nitin", "Manoj", "Alok", "Pankaj", "Tarun", "Gaurav", "Sneha",
    "Manish", "Vijay", "Aakash", "Pradeep", "Harish", "Ramesh", "Dinesh", "Siddharth", "Vivek", "Divya",
]

LAST_NAMES = [
    "Sharma", "Patel", "Verma", "Rao", "Nair", "Deshmukh", "Gupta", "Joshi", "Kumar", "Singh",
    "Reddy", "Mehta", "Chawla", "Bhasin", "Kulkarni", "Iyer", "Pillai", "Agarwal", "Bansal", "Choudhury",
]

CITIES = ["Mumbai", "Pune", "Vadodara", "Ahmedabad", "Chennai", "Coimbatore", "Bengaluru", "Hyderabad", "Delhi", "Kolkata", "Surat", "Visakhapatnam"]

async def seed_all():
    db_name = getattr(settings, "database_name", settings.mongodb_db_name)
    print(f"Connecting to MongoDB database: {db_name}...")
    client = AsyncMongoClient(settings.mongodb_url)
    await init_beanie(database=client[db_name], document_models=DOCUMENT_MODELS)
    print("Beanie initialized successfully.")

    now = datetime.now()

    # 1. Report Formats (ensure all 13 standard formats exist)
    existing_fmts = await ReportFormat.find_all().to_list()
    if len(existing_fmts) < 13:
        print("Seeding standard Report Formats...")
        for f in DEFAULT_FORMATS:
            if not await ReportFormat.find_one(ReportFormat.format_code == f["format_code"]):
                rf = ReportFormat(**f, site_id=SITE)
                await rf.insert()

    # 2. Clients (Ensure 200 exist)
    existing_clients = await Client.find_all().to_list()
    clients_map = {c.client_id: c for c in existing_clients}
    if len(existing_clients) < 200:
        print(f"Expanding Clients to 200 (currently {len(existing_clients)})...")
        new_clients = []
        for i in range(len(existing_clients) + 1, 201):
            cid = f"C-{i:03d}"
            name = f"Enterprise Client Group {i:03d} Ltd"
            c = Client(
                client_id=cid, site_id=SITE, name=name, code=f"CL-{1000 + i}",
                industry_type=INDUSTRIES[i % len(INDUSTRIES)], city=CITIES[i % len(CITIES)],
                state="Maharashtra", country="India", is_active=True
            )
            new_clients.append(c)
            clients_map[cid] = c
        if new_clients:
            await Client.insert_many(new_clients)
    clients_list = list(clients_map.values())

    # 3. Manufacturers (Ensure 200 exist)
    existing_mfrs = await Manufacturer.find_all().to_list()
    mfrs_map = {m.manufacturer_id: m for m in existing_mfrs}
    if len(existing_mfrs) < 200:
        print(f"Expanding Manufacturers to 200 (currently {len(existing_mfrs)})...")
        new_mfrs = []
        for i in range(len(existing_mfrs) + 1, 201):
            mid = f"M-{i:03d}"
            m = Manufacturer(
                manufacturer_id=mid, site_id=SITE, name=f"Precision Heavy Fabrication Works {i:03d}",
                code=f"MFR-{1000 + i}", industry_type=INDUSTRIES[i % len(INDUSTRIES)],
                city=CITIES[i % len(CITIES)], state="Gujarat", is_active=True
            )
            new_mfrs.append(m)
            mfrs_map[mid] = m
        if new_mfrs:
            await Manufacturer.insert_many(new_mfrs)
    mfrs_list = list(mfrs_map.values())

    # 4. Jobs (Ensure exactly 200 exist: JOB-001 to JOB-200)
    existing_jobs = await Job.find_all().to_list()
    jobs_map = {j.job_id: j for j in existing_jobs}
    print(f"Checking Jobs count (currently {len(existing_jobs)})...")
    approval_statuses = ["approved_by_client", "pending_client_approval", "approved_by_client", "rejected_by_client"]
    job_statuses = ["in_progress", "open", "assigned", "completed"]

    new_jobs = []
    for i in range(1, 201):
        jid = f"JOB-{i:03d}"
        if jid not in jobs_map:
            c = clients_list[(i - 1) % len(clients_list)]
            m = mfrs_list[(i - 1) % len(mfrs_list)]
            cat = JOB_CATEGORIES[i % len(JOB_CATEGORIES)]
            fname = f"{FIRST_NAMES[(i - 1) % len(FIRST_NAMES)]} {LAST_NAMES[(i - 1) % len(LAST_NAMES)]}"
            ins_id = f"INS-{(i % 50) + 1:03d}"
            contract_val = float(random.randint(150000, 950000))
            ins_fee = round(contract_val * 0.35, 2)
            travel_fee = round(contract_val * 0.08, 2)
            total_budget = round(contract_val + ins_fee + travel_fee, 2)

            sow = [
                SOWItem(item_id=f"SOW-{j:02d}", description=f"Audit inspection parameter checkpoint #{j} per ASME Sec VIII & QAP", category="Technical Inspection", is_checklist=True, completed=(j % 2 == 0))
                for j in range(1, 5)
            ]

            j = Job(
                job_id=jid,
                site_id=SITE,
                title=f"{c.name[:25]} Heavy Equipment Quality Audit #{i:03d}",
                description=f"Comprehensive third-party inspection, NDT witnessing, and QA/QC certification at manufacturer facility {m.name[:25]}.",
                job_type="inspection",
                job_type_category=cat,
                client_id=c.client_id,
                client_name=c.name,
                manufacturer_id=m.manufacturer_id,
                manufacturer_name=m.name,
                po_number=f"PO/IQE/2026/{1000 + i}",
                assigned_inspector_id=ins_id,
                assigned_inspector_name=f"{fname} (Lead TPI Auditor)",
                inspector_certifications=["ASNT Level III NDT", "CSWIP 3.1 Senior Inspector", "API 510"],
                inspector_experience_years=random.randint(7, 22),
                client_approval_status=approval_statuses[i % len(approval_statuses)],
                client_approval_remarks=f"Reviewed and authorized by client QA management team {i:03d}.",
                client_approved_at=now - timedelta(days=random.randint(2, 30)),
                budget_contract_amount=contract_val,
                budget_inspector_fee=ins_fee,
                budget_travel_allowance=travel_fee,
                budget_total=total_budget,
                budget=total_budget,
                scheduled_start_date=now - timedelta(days=random.randint(5, 20)),
                scheduled_end_date=now + timedelta(days=random.randint(5, 40)),
                status=job_statuses[i % len(job_statuses)],
                scope_of_work=sow,
                created_by="admin"
            )
            new_jobs.append(j)
            jobs_map[jid] = j

    if new_jobs:
        await Job.insert_many(new_jobs)
    print("Jobs now at 200 records.")

    # 5. Service Orders (Ensure 200 exist)
    existing_sos = await ServiceOrder.find_all().to_list()
    if len(existing_sos) < 200:
        print(f"Expanding Service Orders to 200 (currently {len(existing_sos)})...")
        new_sos = []
        for i in range(len(existing_sos) + 1, 201):
            so_id = f"SO-{i:03d}"
            c = clients_list[(i - 1) % len(clients_list)]
            m = mfrs_list[(i - 1) % len(mfrs_list)]
            jid = f"JOB-{((i - 1) % 200) + 1:03d}"
            amt = float(random.randint(200000, 1200000))
            so = ServiceOrder(
                so_id=so_id, so_number=f"SO-2026-{1000 + i}", site_id=SITE, job_id=jid, client_id=c.client_id,
                client_name=c.name, manufacturer_id=m.manufacturer_id,
                manufacturer_name=m.name,
                amount=amt,
                so_date=now - timedelta(days=i),
                due_date=now + timedelta(days=i + 30),
                status="active" if i % 4 != 0 else "completed",
                po_items=[POItem(description=f"Fabrication Unit #{i}", quantity=10, uom="Nos", rate=25000.0, amount=250000.0)]
            )
            new_sos.append(so)
        if new_sos:
            await ServiceOrder.insert_many(new_sos)
    print("Service Orders now at 200 records.")

    # 6. Control Numbers (Ensure 200 exist)
    existing_cns = await ControlNumber.find_all().to_list()
    if len(existing_cns) < 200:
        print(f"Expanding Control Numbers to 200 (currently {len(existing_cns)})...")
        new_cns = []
        for i in range(len(existing_cns) + 1, 201):
            cn_code = f"CN-2026-{i:04d}"
            c = clients_list[(i - 1) % len(clients_list)]
            cn = ControlNumber(
                control_number_id=cn_code,
                control_number=cn_code,
                site_id=SITE,
                job_id=f"JOB-{((i - 1) % 200) + 1:03d}",
                so_id=f"SO-{((i - 1) % 200) + 1:03d}",
                client_id=c.client_id,
                client_name=c.name,
                is_active=True,
                contract_amount=float(random.randint(150000, 800000)),
                created_by="admin"
            )
            new_cns.append(cn)
        if new_cns:
            await ControlNumber.insert_many(new_cns)
    print("Control Numbers now at 200 records.")

    # 7. Visits (Ensure 200 exist)
    existing_visits = await Visit.find_all().to_list()
    if len(existing_visits) < 200:
        print(f"Expanding Visits to 200 (currently {len(existing_visits)})...")
        new_visits = []
        for i in range(len(existing_visits) + 1, 201):
            vid = f"VIS-{i:04d}"
            jid = f"JOB-{((i - 1) % 200) + 1:03d}"
            c = clients_list[(i - 1) % len(clients_list)]
            m = mfrs_list[(i - 1) % len(mfrs_list)]
            fname = f"{FIRST_NAMES[(i - 1) % len(FIRST_NAMES)]} {LAST_NAMES[(i - 1) % len(LAST_NAMES)]}"
            v = Visit(
                visit_id=vid, site_id=SITE, job_id=jid, client_id=c.client_id,
                customer_name=c.name, manufacturer_id=m.manufacturer_id,
                manufacturer_name=m.name,
                inspector_name=fname,
                planned_date=now - timedelta(days=random.randint(1, 60)),
                visit_type="Regular Visit" if i % 2 == 0 else "Final Stage Audit",
                inspection_scope=f"TPI audit of equipment batch #{i:03d}",
                status="completed" if i % 3 != 0 else "scheduled"
            )
            new_visits.append(v)
        if new_visits:
            await Visit.insert_many(new_visits)
    print("Visits now at 200 records.")

    # 8. Invoices (Ensure 200 exist)
    existing_invs = await Invoice.find_all().to_list()
    if len(existing_invs) < 200:
        print(f"Expanding Invoices to 200 (currently {len(existing_invs)})...")
        new_invs = []
        statuses = ["paid", "unpaid", "overdue", "partially_paid"]
        for i in range(len(existing_invs) + 1, 201):
            inv_no = f"INV-2026-{i:04d}"
            jid = f"JOB-{((i - 1) % 200) + 1:03d}"
            c = clients_list[(i - 1) % len(clients_list)]
            base_amt = float(random.randint(60000, 480000))
            gst_amt = round(base_amt * 0.18, 2)
            tot = round(base_amt + gst_amt, 2)
            inv = Invoice(
                invoice_id=f"INV-ID-{i:04d}",
                invoice_number=inv_no, site_id=SITE, client_id=c.client_id,
                client_name=c.name, job_id=jid,
                subtotal=base_amt, cgst=gst_amt / 2, sgst=gst_amt / 2, grand_total=tot,
                invoice_date=now - timedelta(days=random.randint(5, 90)),
                due_date=now + timedelta(days=random.randint(10, 45)),
                payment_status=statuses[i % len(statuses)],
                status="issued",
                consolidated_charges=[ChargeItem(category="TPI Inspection", description="TPI Professional Audit & Engineering Fee", amount=base_amt)]
            )
            new_invs.append(inv)
        if new_invs:
            await Invoice.insert_many(new_invs)
    print("Invoices now at 200 records.")

    # 9. Accounts Receivable & Accounts Payable (Ensure 200 each)
    existing_ar = await AccountReceivable.find_all().to_list()
    if len(existing_ar) < 200:
        print(f"Expanding Accounts Receivable to 200 (currently {len(existing_ar)})...")
        new_ar = []
        for i in range(len(existing_ar) + 1, 201):
            c = clients_list[(i - 1) % len(clients_list)]
            amt = float(random.randint(75000, 650000))
            ar = AccountReceivable(
                ar_id=f"AR-{i:04d}", site_id=SITE, client_id=c.client_id,
                client_name=c.name, invoice_number=f"INV-2026-{i:04d}",
                amount=amt,
                balance_amount=amt if i % 2 == 0 else 0.0,
                due_date=now + timedelta(days=random.randint(-15, 30)),
                status="settled" if i % 2 != 0 else "pending"
            )
            new_ar.append(ar)
        if new_ar:
            await AccountReceivable.insert_many(new_ar)
    print("Accounts Receivable now at 200 records.")

    existing_ap = await AccountPayable.find_all().to_list()
    if len(existing_ap) < 200:
        print(f"Expanding Accounts Payable to 200 (currently {len(existing_ap)})...")
        new_ap = []
        for i in range(len(existing_ap) + 1, 201):
            m = mfrs_list[(i - 1) % len(mfrs_list)]
            amt = float(random.randint(30000, 220000))
            ap = AccountPayable(
                ap_id=f"AP-{i:04d}", site_id=SITE, vendor_id=m.manufacturer_id,
                vendor_name=m.name,
                amount=amt, balance_amount=amt if i % 2 == 0 else 0.0,
                due_date=now + timedelta(days=random.randint(-10, 45)),
                status="settled" if i % 2 != 0 else "pending"
            )
            new_ap.append(ap)
        if new_ap:
            await AccountPayable.insert_many(new_ap)
    print("Accounts Payable now at 200 records.")

    # 10. Construction Bill Verification Records (Ensure 200 exist)
    existing_cbv = await ConstructionBillVerificationRecord.find_all().to_list()
    if len(existing_cbv) < 200:
        print(f"Expanding Construction Bill Verifications to 200 (currently {len(existing_cbv)})...")
        new_cbv = []
        for i in range(len(existing_cbv) + 1, 201):
            claimed = float(random.randint(500000, 4500000))
            verified = round(claimed * random.uniform(0.92, 0.98), 2)
            savings = round(claimed - verified, 2)

            abstract = [
                ConstructionAbstractItem(
                    sl_no=f"{item_idx}", item_code=f"CIV-ITEM-0{item_idx}",
                    description=f"RCC M25 concrete structure item #{item_idx} including shuttering & curing",
                    unit="Cum", total_purchased=150.0, total_consumed=142.0,
                    theoretical_consumed=138.0, wastage_qty=4.0, wastage_percentage=2.8,
                    unit_rate=4850.0, claimed_amount=claimed / 3,
                    verified_payable_amount=verified / 3, closing_balance=8.0,
                    verification_status="Verified & Approved"
                )
                for item_idx in range(1, 4)
            ]

            cbv = ConstructionBillVerificationRecord(
                site_id=SITE,
                site_name=f"Site Infrastructure Project #{i:03d}",
                report_ref=f"IQE/CBV/2026/{i:04d}",
                contractor_name=f"Apex Structural & Civil Contractors Ltd #{i:03d}",
                client_name=clients_list[(i - 1) % len(clients_list)].name,
                ra_bill_no=f"RA-CBV-2026-{i:03d}",
                verification_date=now - timedelta(days=random.randint(1, 60)),
                audit_period="April 2026 - September 2026",
                abstract_items=abstract,
                total_claimed_amount=claimed,
                total_verified_amount=verified,
                total_discrepancy_savings=savings,
                overall_status="VERIFIED & PASSED" if i % 5 != 0 else "DISCREPANCY FLAGGED"
            )
            new_cbv.append(cbv)
        if new_cbv:
            await ConstructionBillVerificationRecord.insert_many(new_cbv)
    print("Construction Bill Verifications now at 200 records.")

    # 11. Schedule M Pharma EPC Projects (Ensure 200 exist)
    existing_pharma = await ScheduleMPharmaEPCProject.find_all().to_list()
    if len(existing_pharma) < 200:
        print(f"Expanding Schedule M Pharma EPC Projects to 200 (currently {len(existing_pharma)})...")
        new_pharma = []
        for i in range(len(existing_pharma) + 1, 201):
            p = ScheduleMPharmaEPCProject(
                project_id=f"PRJ-SCH-M-2026-{i:04d}",
                project_name=f"Schedule M Revised Sterile Block EPC Project #{i:03d}",
                client_name=f"Global BioPharma Corp {i:03d} Ltd",
                epc_contractor=f"Ideal Cleanroom Turnkey Solutions Ltd #{i:03d}",
                facility_location=f"Pharma Zone Sector {i % 12 + 1}, Baddi / Hyderabad",
                facility_type="Formulation, Sterile Injectables & Biotech Lab",
                licence_authority="CDSCO / State FDA (Revised Schedule M 2024)",
                schedule_m_compliance_score=round(random.uniform(91.0, 99.5), 1),
                checklists=[
                    ScheduleMChecklistItem(
                        item_id=f"SCH-CHK-{i}-{k}",
                        discipline="HVAC Cleanroom & Pressure Differential",
                        verification_point="HEPA Filter Integrity PAO leak test < 0.01% per ISO 14644-3",
                        status="PASS", result_code="C", severity="Minor", inspection_intensity="100%"
                    )
                    for k in range(1, 4)
                ]
            )
            new_pharma.append(p)
        if new_pharma:
            await ScheduleMPharmaEPCProject.insert_many(new_pharma)
    print("Schedule M Pharma EPC Projects now at 200 records.")

    # 12. TpiReport (Ensure 200 exist across TP-02 to TP-05)
    existing_tpi = await TpiReport.find_all().to_list()
    if len(existing_tpi) < 200:
        print(f"Expanding TPI Reports to 200 (currently {len(existing_tpi)})...")
        new_tpi = []
        types = ["TP02", "TP03", "TP04", "TP05"]
        for i in range(len(existing_tpi) + 1, 201):
            t_type = types[i % len(types)]
            c = clients_list[(i - 1) % len(clients_list)]
            m = mfrs_list[(i - 1) % len(mfrs_list)]
            rep_no = f"IQE-{t_type}-2026-{i:04d}"
            r = TpiReport(
                form_code=t_type,
                report_no=rep_no,
                customer=c.name,
                supplier=m.name,
                po_no=f"PO/TPI/2026/{1000 + i}",
                status="ISSUED" if i % 4 != 0 else "DRAFT",
                data={
                    "report_no": rep_no,
                    "date": (now - timedelta(days=random.randint(1, 45))).strftime("%Y-%m-%d"),
                    "customer": c.name,
                    "project": f"Industrial Expansion Unit #{i:03d}",
                    "supplier": m.name,
                    "po_no_and_date": f"PO/TPI/2026/{1000 + i} Dt. 2026-08-01",
                    "location": f"{m.city}, {m.state}",
                    "inspector": f"{FIRST_NAMES[i % len(FIRST_NAMES)]} {LAST_NAMES[i % len(LAST_NAMES)]} (IQE-INSP-{i:03d})",
                    "inspection_stage": "Stage Inspection" if i % 2 == 0 else "Final Acceptance",
                    "outcome": "SATISFACTORY" if i % 7 != 0 else "PENDING ACTION",
                    "order_status": "In Progress" if i % 3 != 0 else "Completed",
                    "items": [{
                        "item": 1, "description": f"Heavy Pressure Pipe & Flange Assemblies #{i}",
                        "tag_no": f"TAG-EQ-{i:04d}", "po_qty": 20, "offered_qty": 20,
                        "inspected_qty": 20, "accepted_qty": 20 if i % 7 != 0 else 18,
                        "remarks": "Hydrotest and NDT witnessed. 100% compliant."
                    }]
                }
            )
            new_tpi.append(r)
        if new_tpi:
            await TpiReport.insert_many(new_tpi)
    print("TPI Reports now at 200 records.")

    # 13. Work Packages (Ensure 200 exist)
    existing_wp = await WorkPackage.find_all().to_list()
    if len(existing_wp) < 200:
        print(f"Expanding Work Packages to 200 (currently {len(existing_wp)})...")
        new_wp = []
        for i in range(len(existing_wp) + 1, 201):
            jid = f"JOB-{((i - 1) % 200) + 1:03d}"
            wp = WorkPackage(
                work_package_id=f"WP-2026-{i:04d}", site_id=SITE, job_id=jid,
                title=f"Fabrication QA Package - Stage {i % 5 + 1}",
                work_type_code="CODE_INSP",
                contract_scope=f"Full third party quality inspection package #{i:04d}",
                status="in_progress" if i % 3 != 0 else "certified"
            )
            new_wp.append(wp)
        if new_wp:
            await WorkPackage.insert_many(new_wp)
    print("Work Packages now at 200 records.")

    # 14. Assignments (Ensure 200 exist)
    existing_asg = await Assignment.find_all().to_list()
    if len(existing_asg) < 200:
        print(f"Expanding Assignments to 200 (currently {len(existing_asg)})...")
        new_asg = []
        for i in range(len(existing_asg) + 1, 201):
            wpid = f"WP-2026-{((i - 1) % 200) + 1:04d}"
            jid = f"JOB-{((i - 1) % 200) + 1:03d}"
            fname = f"{FIRST_NAMES[(i - 1) % len(FIRST_NAMES)]} {LAST_NAMES[(i - 1) % len(LAST_NAMES)]}"
            asg = Assignment(
                assignment_id=f"ASG-2026-{i:04d}", site_id=SITE,
                work_package_id=wpid, job_id=jid,
                person_id=f"IQE-INS-{((i - 1) % 50) + 1:03d}",
                person_name=fname,
                role="LEAD_INSPECTOR",
                status="active" if i % 4 != 0 else "completed",
                planned_from=now - timedelta(days=random.randint(5, 30)),
                planned_to=now + timedelta(days=random.randint(5, 40))
            )
            new_asg.append(asg)
        if new_asg:
            await Assignment.insert_many(new_asg)
    print("Assignments now at 200 records.")

    # 15. Certifications (Ensure 200 exist)
    existing_cert = await Certification.find_all().to_list()
    if len(existing_cert) < 200:
        print(f"Expanding Certifications to 200 (currently {len(existing_cert)})...")
        new_cert = []
        for i in range(len(existing_cert) + 1, 201):
            wpid = f"WP-2026-{((i - 1) % 200) + 1:04d}"
            jid = f"JOB-{((i - 1) % 200) + 1:03d}"
            claimed = float(random.randint(80000, 600000))
            cert = Certification(
                certification_id=f"CERT-2026-{i:04d}", site_id=SITE,
                work_package_id=wpid, job_id=jid,
                claimed_value=claimed,
                certified_value=claimed if i % 4 != 0 else claimed * 0.95,
                status="issued" if i % 5 != 0 else "disputed"
            )
            new_cert.append(cert)
        if new_cert:
            await Certification.insert_many(new_cert)
    print("Certifications now at 200 records.")

    # 16. Customer Complaints (Ensure 200 exist)
    existing_cmp = await CustomerComplaint.find_all().to_list()
    if len(existing_cmp) < 200:
        print(f"Expanding Customer Complaints to 200 (currently {len(existing_cmp)})...")
        new_cmp = []
        severities = ["Minor", "Major", "Critical"]
        for i in range(len(existing_cmp) + 1, 201):
            c = clients_list[(i - 1) % len(clients_list)]
            m = mfrs_list[(i - 1) % len(mfrs_list)]
            cmp_obj = CustomerComplaint(
                complaint_id=f"CMP-2026-{i:03d}", site_id=SITE,
                identification_no=f"CR-IQE-2026-{i:04d}",
                client_id=c.client_id, customer_name=c.name,
                manufacturer_id=m.manufacturer_id, manufacturer_name=m.name,
                equipment_name=f"Fabricated Piping Skid #{i:03d}",
                severity=severities[i % len(severities)],
                description=f"Client requested review regarding calibration verification certificate on batch #{i:03d}.",
                root_cause="Traceability audit gap identified and rectified with master gauge certificate.",
                proposed_action="Re-calibration and issuing updated endorsed inspection certificate.",
                received_date=now - timedelta(days=random.randint(5, 60)),
                closing_date=now - timedelta(days=random.randint(1, 4)) if i % 3 == 0 else None,
                complaint_type="Quality" if i % 2 == 0 else "Documentation"
            )
            new_cmp.append(cmp_obj)
        if new_cmp:
            await CustomerComplaint.insert_many(new_cmp)
    print("Customer Complaints now at 200 records.")

    # 17. NCRs (Ensure 200 exist)
    existing_ncrs = await NCR.find_all().to_list()
    if len(existing_ncrs) < 200:
        print(f"Expanding NCRs to 200 (currently {len(existing_ncrs)})...")
        new_ncrs = []
        ncr_sevs = [NCRSeverity.MINOR, NCRSeverity.MAJOR, NCRSeverity.CRITICAL, NCRSeverity.OBSERVATION]
        ncr_disps = [Disposition.REWORK, Disposition.REPAIR, Disposition.USE_AS_IS, Disposition.REJECT_FINDING]
        for i in range(len(existing_ncrs) + 1, 201):
            jid = f"JOB-{((i - 1) % 200) + 1:03d}"
            n = NCR(
                ncr_id=f"NCR-2026-{i:04d}", site_id=SITE, job_id=jid,
                title=f"Weld Porosity / Dimension Deviation Finding #{i:03d}",
                description=f"Inspection identified 2mm defect exceeding ASME Sec IX permissible acceptance limits.",
                severity=ncr_sevs[i % len(ncr_sevs)].value,
                disposition=ncr_disps[i % len(ncr_disps)].value,
                status=NCRStatus.CLOSED.value if i % 2 == 0 else NCRStatus.OPEN.value,
                raised_by=f"IQE-INS-{((i - 1) % 50) + 1:03d}",
                target_resolution_hours=48
            )
            new_ncrs.append(n)
        if new_ncrs:
            await NCR.insert_many(new_ncrs)
    print("NCRs now at 200 records.")

    # 18. Risks (Ensure 200 exist)
    existing_risks = await Risk.find_all().to_list()
    if len(existing_risks) < 200:
        print(f"Expanding Risks to 200 (currently {len(existing_risks)})...")
        new_risks = []
        risk_cats = [RiskCategory.IMPARTIALITY, RiskCategory.COMPETENCE, RiskCategory.EQUIPMENT, RiskCategory.METHOD, RiskCategory.COMMERCIAL, RiskCategory.OPERATIONAL]
        treatments = [Treatment.MITIGATE, Treatment.AVOID, Treatment.ACCEPT, Treatment.TRANSFER]
        for i in range(len(existing_risks) + 1, 201):
            r = Risk(
                risk_id=f"RSK-2026-{i:04d}", site_id=SITE,
                title=f"Risk Event Analysis & Quality Assessment #{i:03d}",
                description=f"Potential calibration latency or competency mismatch risk evaluated for job execution.",
                category=risk_cats[i % len(risk_cats)].value,
                treatment=treatments[i % len(treatments)].value,
                inherent_likelihood=random.randint(2, 4),
                inherent_impact=random.randint(2, 4),
                residual_likelihood=random.randint(1, 2),
                residual_impact=random.randint(1, 2),
                owner=f"Quality Risk Manager {i % 10 + 1}",
                status=RiskStatus.TREATED.value if i % 2 == 0 else RiskStatus.OPEN.value,
                controls=[Control(description=f"Standard Operating Procedure Control Protocol #{i:03d}")]
            )
            new_risks.append(r)
        if new_risks:
            await Risk.insert_many(new_risks)
    print("Risks now at 200 records.")

    # 19. Pre-sales Enquiries (Ensure 200 exist)
    existing_enq = await Enquiry.find_all().to_list()
    if len(existing_enq) < 200:
        print(f"Expanding Pre-sales Enquiries to 200 (currently {len(existing_enq)})...")
        new_enqs = []
        enq_cats = ["Pressure Vessel Inspection", "Structural Fabrication", "Pharma Cleanroom", "RA Bill Civil", "Expediting"]
        enq_statuses = ["draft", "qualifying", "pending_decision", "go", "proposal_draft", "submitted", "won", "no_go"]
        for i in range(len(existing_enq) + 1, 201):
            c = clients_list[(i - 1) % len(clients_list)]
            est = float(random.randint(120000, 1500000))
            e = Enquiry(
                enquiry_id=f"ENQ-2026-{i:04d}", site_id=SITE,
                client_id=c.client_id,
                category=enq_cats[i % len(enq_cats)],
                pipeline_value=est,
                probability_pct=random.choice([20, 40, 60, 80, 100]),
                status=enq_statuses[i % len(enq_statuses)],
                enquiry_date=now - timedelta(days=random.randint(2, 90)),
                source="direct",
                expected_award_date=now + timedelta(days=random.randint(15, 60))
            )
            new_enqs.append(e)
        if new_enqs:
            await Enquiry.insert_many(new_enqs)
    print("Pre-sales Enquiries now at 200 records.")

    # 20. Rate Cards (Ensure 200 exist)
    existing_rc = await RateCard.find_all().to_list()
    if len(existing_rc) < 200:
        print(f"Expanding Rate Cards to 200 (currently {len(existing_rc)})...")
        new_rc = []
        for i in range(len(existing_rc) + 1, 201):
            c = clients_list[(i - 1) % len(clients_list)]
            rc = RateCard(
                card_id=f"RC-2026-{i:04d}", site_id=SITE,
                name=f"Commercial Rate Schedule - {c.name[:25]} #{i:03d}",
                client_id=c.client_id, client_name=c.name,
                currency="INR", status=CardStatus.ACTIVE.value,
                valid_from=now - timedelta(days=random.randint(10, 180)),
                lines=[
                    RateLine(work_type_code="CODE_INSP", rate_basis="MAN_DAY", rate=float(random.randint(6000, 14000)), uom="Day"),
                    RateLine(work_type_code="NDT_WITNESS", rate_basis="MAN_DAY", rate=float(random.randint(7500, 16000)), uom="Day")
                ]
            )
            new_rc.append(rc)
        if new_rc:
            await RateCard.insert_many(new_rc)
    print("Rate Cards now at 200 records.")

    # 21. Equipment (Ensure 200 exist)
    existing_eq = await Equipment.find_all().to_list()
    if len(existing_eq) < 200:
        print(f"Expanding Equipment to 200 (currently {len(existing_eq)})...")
        new_eq = []
        eq_types = ["Ultrasonic Thickness Gauge", "Dry Film Thickness (DFT) Gauge", "Torque Wrench", "Aerosol Photometer", "Digital Vernier Caliper", "Sound Level Meter"]
        for i in range(len(existing_eq) + 1, 201):
            eq = Equipment(
                equipment_id=f"EQ-2026-{i:04d}", site_id=SITE,
                asset_tag=f"IQE-ASSET-{i:04d}",
                name=f"{eq_types[i % len(eq_types)]} Mod-{i:03d}",
                equipment_type=eq_types[i % len(eq_types)],
                manufacturer="Olympus / Mitutoyo / Fluke",
                serial_number=f"SN-{88000 + i}",
                status=EquipmentStatus.IN_SERVICE.value,
                last_calibrated_on=now - timedelta(days=random.randint(10, 120)),
                calibration_due_on=now + timedelta(days=random.randint(30, 240)),
                calibration_certificate_no=f"NABL/CAL/2026/{5000 + i}"
            )
            new_eq.append(eq)
        if new_eq:
            await Equipment.insert_many(new_eq)
    print("Equipment now at 200 records.")

    # 22. External Providers (Ensure 200 exist)
    existing_prv = await ExternalProvider.find_all().to_list()
    if len(existing_prv) < 200:
        print(f"Expanding External Providers to 200 (currently {len(existing_prv)})...")
        new_prv = []
        p_cats = [ProviderCategory.NDT_SERVICE, ProviderCategory.CALIBRATION_LAB, ProviderCategory.TESTING_LAB, ProviderCategory.INSPECTION_SUBCONTRACT]
        for i in range(len(existing_prv) + 1, 201):
            prv = ExternalProvider(
                provider_id=f"PRV-2026-{i:04d}", site_id=SITE,
                name=f"Approved Testing Laboratory & NDT Services {i:03d} Pvt Ltd",
                category=p_cats[i % len(p_cats)].value,
                approved_services=["Radiography Interpretation", "UT Calibration", "Hydrotest Services"],
                contact_person=f"{FIRST_NAMES[i % len(FIRST_NAMES)]} (Director)",
                email=f"contact{i}@testlab{i}.com",
                status=ProviderStatus.APPROVED.value,
                approved_on=now - timedelta(days=random.randint(10, 180)),
                next_review_on=now + timedelta(days=random.randint(60, 360)),
                accreditation=Accreditation(body="NABL / ISO 17025", certificate_number=f"NABL-TC-{i:04d}", valid_until=now + timedelta(days=365))
            )
            new_prv.append(prv)
        if new_prv:
            await ExternalProvider.insert_many(new_prv)
    print("External Providers now at 200 records.")

    # 23. Inspection Test Plans (Ensure 200 exist)
    existing_itp = await InspectionTestPlan.find_all().to_list()
    if len(existing_itp) < 200:
        print(f"Expanding Inspection Test Plans to 200 (currently {len(existing_itp)})...")
        new_itp = []
        for i in range(len(existing_itp) + 1, 201):
            jid = f"JOB-{((i - 1) % 200) + 1:03d}"
            c = clients_list[(i - 1) % len(clients_list)]
            itp = InspectionTestPlan(
                itp_id=f"ITP-2026-{i:04d}", site_id=SITE, job_id=jid,
                client_id=c.client_id,
                title=f"Quality Inspection Test Plan (ITP) - Job {jid}",
                revision="Rev 1.0", status=ITPStatus.APPROVED.value,
                points=[
                    ITPPoint(point_id="1.1", sequence=1, activity="Material Test Certificate & Chemical Composition Review", intervention=InterventionType.REVIEW.value),
                    ITPPoint(point_id="1.2", sequence=2, activity="Bevel Preparation & Root Pass Welding Visual Inspection", intervention=InterventionType.WITNESS.value),
                    ITPPoint(point_id="1.3", sequence=3, activity="Hydrostatic Pressure Testing at 1.5x Design Pressure", intervention=InterventionType.HOLD.value),
                    ITPPoint(point_id="1.4", sequence=4, activity="Final Painting DFT & Preservation Inspection", intervention=InterventionType.WITNESS.value)
                ]
            )
            new_itp.append(itp)
        if new_itp:
            await InspectionTestPlan.insert_many(new_itp)
    print("Inspection Test Plans now at 200 records.")

    # 24. Appeals (Ensure 200 exist)
    existing_app = await Appeal.find_all().to_list()
    if len(existing_app) < 200:
        print(f"Expanding Appeals to 200 (currently {len(existing_app)})...")
        new_app = []
        grounds = [AppealGrounds.TECHNICAL_JUDGEMENT, AppealGrounds.MEASUREMENT_DISPUTE, AppealGrounds.DEDUCTION_DISPUTE, AppealGrounds.CODE_INTERPRETATION]
        app_statuses = [AppealStatus.RECEIVED, AppealStatus.UNDER_REVIEW, AppealStatus.UPHELD, AppealStatus.REJECTED]
        for i in range(len(existing_app) + 1, 201):
            jid = f"JOB-{((i - 1) % 200) + 1:03d}"
            app = Appeal(
                appeal_id=f"APL-2026-{i:04d}", site_id=SITE,
                entity_type="work_package", entity_id=f"WP-2026-{((i - 1) % 200) + 1:04d}",
                job_id=jid, appellant_name=f"Contractor Representative {LAST_NAMES[i % len(LAST_NAMES)]}",
                appellant_organisation=f"Contractor Solutions {i:03d} Ltd",
                grounds=grounds[i % len(grounds)].value,
                statement=f"Requesting re-assessment of weld inspection finding under ASME Sec IX Cl. QW-191 on package #{i:03d}.",
                status=app_statuses[i % len(app_statuses)].value,
                received_date=now - timedelta(days=random.randint(2, 45))
            )
            new_app.append(app)
        if new_app:
            await Appeal.insert_many(new_app)
    print("Appeals now at 200 records.")

    # 25. Commercial Amendments (Ensure 200 exist)
    existing_amd = await Amendment.find_all().to_list()
    if len(existing_amd) < 200:
        print(f"Expanding Commercial Amendments to 200 (currently {len(existing_amd)})...")
        new_amd = []
        amd_types = [AmendmentType.VALUE_INCREASE, AmendmentType.PERIOD_EXTENSION, AmendmentType.RENEWAL, AmendmentType.SCOPE_CHANGE]
        for i in range(len(existing_amd) + 1, 201):
            so_id = f"SO-{((i - 1) % 200) + 1:03d}"
            amd = Amendment(
                amendment_id=f"AMD-2026-{i:04d}", site_id=SITE, so_id=so_id,
                sequence=1, amendment_type=amd_types[i % len(amd_types)].value,
                reason=f"Scope expansion to cover additional 10 units and extended testing cycle #{i:03d}.",
                client_authority=f"LTR-CLIENT-AMD-2026-{i:04d}"
            )
            new_amd.append(amd)
        if new_amd:
            await Amendment.insert_many(new_amd)
    print("Commercial Amendments now at 200 records.")

    # 26. People (Ensure 200 exist)
    existing_people = await Person.find_all().to_list()
    if len(existing_people) < 200:
        print(f"Expanding People to 200 (currently {len(existing_people)})...")
        new_people = []
        for i in range(len(existing_people) + 1, 201):
            fn = FIRST_NAMES[(i - 1) % len(FIRST_NAMES)]
            ln = LAST_NAMES[(i - 1) % len(LAST_NAMES)]
            p = Person(
                person_id=f"IQE-EMP-{i:04d}",
                employee_code=f"EMP-{i:04d}",
                full_name=f"{fn} {ln}",
                category="TECHNICAL_INSPECTION" if i % 2 == 0 else "TECHNICAL_ENGINEERING",
                engagement_type="PERMANENT",
                designation="Senior Inspection Specialist" if i % 2 == 0 else "Quality Assurance Engineer",
                email=f"{fn.lower()}.{ln.lower()}{i}@iqeapp.com",
                phone=f"+91 98{i:08d}"[:15],
                base_location=CITIES[i % len(CITIES)],
                employment_status="active",
                deployable=True
            )
            new_people.append(p)
        if new_people:
            await Person.insert_many(new_people)
    print("People now at 200 records.")

    print("\n=======================================================")
    print("ALL COLLECTIONS HAVE BEEN SEEDED WITH 200 MOCK RECORDS!")
    print("=======================================================\n")

if __name__ == "__main__":
    asyncio.run(seed_all())

