import asyncio
import random
from datetime import datetime, timedelta
from pymongo import AsyncMongoClient
from beanie import init_beanie
from core.config import settings

from modules.clients.models import Client
from modules.manufacturers.models import Manufacturer
from modules.jobs.models import Job
from modules.service_orders.models import ServiceOrder, POItem
from modules.control_numbers.models import ControlNumber
from modules.visits.models import Visit, Expense, Photo, Finding
from modules.invoices.models import Invoice, ChargeItem, AnnexureItem
from modules.auth.models import UserLogin
from core.audit import AuditEntry
from core.sequences import Sequence

EQUIPMENT_NAMES = [
    "High-Pressure Steam Boiler Shell",
    "Hydrocracker Vessel Heavy Forging",
    "3-Stage Centrifugal Gas Compressor",
    "Heat Exchanger Tube Bundle Assembly",
    "Offshore Pipeline Gate Valve 24-inch",
    "Main Power Transformer 220kV Switchgear",
    "Cryogenic Storage Tank Inner Liner",
    "Turbine Rotor Shaft & Dynamic Balancing",
    "Chemical Reactor Agitator Skid",
    "Subsea Wellhead Tree Assembly",
]

INSPECTION_ACTIVITIES = [
    "Visual & Dimensional Verification",
    "Ultrasonic Non-Destructive Testing (NDT)",
    "Radiographic Film Interpretation",
    "Hydrostatic Pressure Testing 150%",
    "Positive Material Identification (PMI)",
    "Magnetic Particle Testing (MPT)",
    "Dye Penetrant Testing (DPT)",
    "Final Assembly Factory Acceptance Test (FAT)",
]

EXPENSE_TYPES = ["travel", "mileage", "hotel", "food", "per_diem"]
FINDING_SEVERITIES = ["observation", "minor_nc", "major_nc", "critical"]


async def seed():
    print("Connecting to MongoDB for Full Pipeline Seeding...")
    client = AsyncMongoClient(settings.mongodb_url)
    await init_beanie(
        database=client[settings.mongodb_db_name],
        document_models=[
            AuditEntry,
            Sequence,
            Client, Manufacturer, Job, ServiceOrder, ControlNumber, Visit, Invoice, UserLogin
        ],
    )

    site_id = "SITE-01"
    random.seed(42)
    now = datetime.now()

    # Load existing reference documents
    jobs = await Job.find_all().to_list()
    clients = await Client.find_all().to_list()
    mfrs = await Manufacturer.find_all().to_list()
    inspectors = await UserLogin.find(UserLogin.role_id == 2).to_list()

    if not jobs or not clients or not mfrs or not inspectors:
        print("Required base data missing. Run seed_clients_manufacturers.py and seed_inspectors_jobs.py first.")
        return

    # 1. Seed 50 Service Orders (SO-001 to SO-050)
    print("Seeding 50 Service Orders...")
    await ServiceOrder.find_all().delete()
    so_list = []
    for i in range(1, 51):
        job = jobs[(i - 1) % len(jobs)]
        client_obj = clients[(i - 1) % len(clients)]
        mfr_obj = mfrs[(i - 1) % len(mfrs)]
        so_id = f"SO-{i:03d}"
        so_num = f"SO/2026/{100 + i}"
        amount = round(random.uniform(75000.0, 500000.0), 2)

        items = [
            POItem(
                description=random.choice(INSPECTION_ACTIVITIES),
                quantity=float(random.randint(5, 20)),
                uom="Mandays",
                rate=round(amount / 10, 2),
                amount=amount,
                remarks="Client approved scope",
            )
        ]

        so = ServiceOrder(
            so_id=so_id,
            job_id=job.job_id,
            site_id=site_id,
            status="active" if i % 5 != 0 else "closed",
            client_id=client_obj.client_id,
            client_name=client_obj.name,
            manufacturer_id=mfr_obj.manufacturer_id,
            manufacturer_name=mfr_obj.name,
            so_type="SO",
            so_number=so_num,
            so_date=now - timedelta(days=30 - i),
            due_date=now + timedelta(days=60 + i),
            amount=amount,
            currency="INR",
            po_items=items,
            project_number=f"PRJ-2026-{500 + i}",
            project_name=f"Project {job.title}",
            comments="Seeded mock service order",
            is_active=True,
            created_by="admin",
        )
        so_list.append(so)

    await ServiceOrder.insert_many(so_list)
    print("Successfully seeded 50 Service Orders!")

    # 2. Seed 50 Control Numbers (CN-001 to CN-050)
    print("Seeding 50 Control Numbers...")
    await ControlNumber.find_all().delete()
    cn_list = []
    for i in range(1, 51):
        so_obj = so_list[i - 1]
        cn_id = f"CN-{i:03d}"
        cn_num = f"CN/2026/{500 + i}"
        eq_name = EQUIPMENT_NAMES[(i - 1) % len(EQUIPMENT_NAMES)]

        cn = ControlNumber(
            control_number_id=cn_id,
            job_id=so_obj.job_id,
            so_id=so_obj.so_id,
            site_id=site_id,
            control_number=cn_num,
            equipment_name=eq_name,
            client_id=so_obj.client_id,
            client_name=so_obj.client_name,
            manufacturer_id=so_obj.manufacturer_id,
            manufacturer_name=so_obj.manufacturer_name,
            location=f"Unit {1 + (i % 4)}, Industrial Park, Gujarat",
            work_scope=f"Full stage-wise TPI quality inspection for {eq_name}",
            is_active=True,
            created_by="admin",
        )
        cn_list.append(cn)

    await ControlNumber.insert_many(cn_list)
    print("Successfully seeded 50 Control Numbers!")

    # 3. Seed 100 Visits (VST-2026-001 to VST-2026-100)
    print("Seeding 100 Inspection Visits...")
    await Visit.find_all().delete()
    visit_list = []
    statuses = ["scheduled", "in_progress", "submitted", "qc_approved", "finance_approved", "invoiced"]

    for i in range(1, 101):
        vis_id = f"VST-2026-{i:03d}"
        cn_obj = cn_list[(i - 1) % len(cn_list)]
        inspector = inspectors[(i - 1) % len(inspectors)]
        status = statuses[i % len(statuses)]
        vis_date = now - timedelta(days=random.randint(1, 45))

        exp1 = Expense(
            expense_id=f"EXP-{i:03d}-1",
            type="travel",
            description="Taxi & Inter-city Rail",
            amount=float(random.randint(1200, 4500)),
            currency="INR",
        )
        exp2 = Expense(
            expense_id=f"EXP-{i:03d}-2",
            type="mileage",
            description="Site inspection travel",
            km=float(random.randint(40, 180)),
            amount=float(random.randint(480, 2160)),
            currency="INR",
        )

        photos = [
            Photo(
                photo_id=f"PHT-{i:03d}-1",
                url=f"https://picsum.photos/seed/vis{i}/800/600",
                thumbnail_url=f"https://picsum.photos/seed/vis{i}/200/150",
                caption=f"Visual Inspection Photo {i}",
                category="visual",
                ai_tags=["weld_joint", "hydro_gauge", "surface_finish"],
                defect_found=(i % 4 == 0),
            )
        ]

        findings = []
        if i % 3 == 0:
            findings.append(
                Finding(
                    finding_id=f"FND-{i:03d}-1",
                    description="Minor surface undercut detected along weld seam W-04 during DPT testing.",
                    severity=random.choice(FINDING_SEVERITIES),
                    category="welding",
                    inspector_notes="Grinding & re-welding requested before hydrostatic pressure test.",
                    ai_suggested=(i % 2 == 0),
                )
            )

        v = Visit(
            visit_id=vis_id,
            job_id=cn_obj.job_id,
            control_number_id=cn_obj.control_number_id,
            so_id=cn_obj.so_id,
            site_id=site_id,
            status=status,
            planned_date=vis_date,
            rfi_date=vis_date - timedelta(days=2),
            visited_from=vis_date,
            visited_to=vis_date + timedelta(days=1),
            inspector_id=inspector.user_id,
            inspector_name=inspector.full_name,
            inspection_report_no=f"IR/2026/{1000 + i}",
            comments=f"Field visit completed successfully for {cn_obj.equipment_name}.",
            expenses=[exp1, exp2],
            photos=photos,
            findings=findings,
            quality_check_status="approved" if status in ["qc_approved", "finance_approved", "invoiced"] else "pending",
            quality_check_by="QA Lead - Admin",
            finance_status="approved" if status in ["finance_approved", "invoiced"] else "pending",
            finance_by="Finance Admin",
            is_invoiced=(status == "invoiced"),
            created_by=inspector.user_id,
        )
        visit_list.append(v)

    await Visit.insert_many(visit_list)
    print("Successfully seeded 100 Inspection Visits!")

    # 4. Seed 30 Invoices (INV-001 to INV-030)
    print("Seeding 30 Customer Invoices...")
    await Invoice.find_all().delete()
    inv_list = []
    inv_statuses = ["draft", "issued", "paid", "partially_paid"]

    for i in range(1, 31):
        inv_id = f"INV-{i:03d}"
        inv_num = f"INV/2026/{200 + i}"
        client_obj = clients[(i - 1) % len(clients)]
        matching_visits = [v for v in visit_list if v.status == "invoiced"][(i - 1) * 2 : i * 2]
        vis_ids = [v.visit_id for v in matching_visits] if matching_visits else [f"VST-2026-{i:03d}"]

        subtotal = float(random.randint(150000, 450000))
        gst = round(subtotal * 0.18, 2)
        grand = subtotal + gst

        charges = [
            ChargeItem(
                sno=1,
                category="Inspection Fee",
                description=f"Third Party Quality Inspection & Audit Charges for {client_obj.name}",
                uom="Visits",
                rate=subtotal,
                amount=subtotal,
            )
        ]

        inv = Invoice(
            invoice_id=inv_id,
            job_id=jobs[(i - 1) % len(jobs)].job_id,
            site_id=site_id,
            status=inv_statuses[i % len(inv_statuses)],
            client_id=client_obj.client_id,
            client_name=client_obj.name,
            invoice_type="customer",
            invoice_number=inv_num,
            invoice_date=now - timedelta(days=20 - i),
            visit_ids=vis_ids,
            consolidated_charges=charges,
            subtotal=subtotal,
            cgst=round(gst / 2, 2),
            sgst=round(gst / 2, 2),
            igst=0.0,
            grand_total=grand,
            gst_percentage=18.0,
            frozen=(i % 2 == 0),
            created_by="finance_admin",
        )
        inv_list.append(inv)

    await Invoice.insert_many(inv_list)
    print("Successfully seeded 30 Invoices!")

    total_so = await ServiceOrder.find_all().count()
    total_cn = await ControlNumber.find_all().count()
    total_vis = await Visit.find_all().count()
    total_inv = await Invoice.find_all().count()

    print("\n--- SEED SUMMARY ---")
    print(f"Service Orders: {total_so}")
    print(f"Control Numbers: {total_cn}")
    print(f"Visits: {total_vis}")
    print(f"Invoices: {total_inv}")
    print("ALL MOCK DATA SEEDED SUCCESSFULLY!")


if __name__ == "__main__":
    asyncio.run(seed())
