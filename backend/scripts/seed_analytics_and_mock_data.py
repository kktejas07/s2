import asyncio
import random
import uuid
from datetime import datetime, timedelta
from pymongo import AsyncMongoClient
from beanie import init_beanie
from core.config import settings

from modules.clients.models import Client
from modules.manufacturers.models import Manufacturer
from modules.jobs.models import Job
from modules.service_orders.models import ServiceOrder, POItem
from modules.control_numbers.models import ControlNumber
from modules.visits.models import Visit
from modules.invoices.models import Invoice, ChargeItem, AnnexureItem
from modules.auth.models import UserLogin
from modules.analytics.models import AnalyticsEvent
from modules.jobs.migration import LegacyMigrationService
from modules.analytics.service import AnalyticsService
from core.audit import AuditEntry
from core.sequences import Sequence

CLIENTS = [
    {"client_id": "CLT-001", "name": "Larsen & Toubro Ltd - Infra Div"},
    {"client_id": "CLT-002", "name": "Shapoorji Pallonji Engineering"},
    {"client_id": "CLT-003", "name": "Tata Projects Infrastructure"},
    {"client_id": "CLT-004", "name": "Sterling & Wilson Renewable"},
    {"client_id": "CLT-005", "name": "Thermax Quality Systems"},
    {"client_id": "CLT-006", "name": "Apex Heavy Engg Corp"},
]

MANUFACTURERS = [
    {"manufacturer_id": "MFR-001", "name": "BHEL Heavy Forging Unit"},
    {"manufacturer_id": "MFR-002", "name": "Godrej & Boyce Pressure Vessel Div"},
    {"manufacturer_id": "MFR-003", "name": "ISGEC Heavy Engineering"},
    {"manufacturer_id": "MFR-004", "name": "Welspun Steel Pipes"},
]

BUTTON_ITEMS = [
    {"key": "btn_tpi_add_bill_item", "name": "Add RA Bill Item", "category": "tpi_billing", "weight": 35},
    {"key": "btn_tpi_ai_anomaly_check", "name": "AI Anomaly & Discrepancy Check", "category": "tpi_billing", "weight": 25},
    {"key": "btn_invoice_issue_pdf", "name": "Issue PDF Invoice & Annexure", "category": "invoicing", "weight": 20},
    {"key": "btn_so_create_new", "name": "Create Service Order", "category": "service_order", "weight": 15},
    {"key": "btn_visit_schedule", "name": "Schedule Technician Visit", "category": "visit_processing", "weight": 30},
    {"key": "btn_qc_approve", "name": "Approve QC Inspection", "category": "qc_audit", "weight": 22},
    {"key": "btn_export_analytics_csv", "name": "Export Analytics CSV Report", "category": "analytics", "weight": 14},
    {"key": "btn_run_legacy_migration", "name": "Run Legacy Job Ingestion", "category": "migration", "weight": 12},
    {"key": "btn_tpi_lock_row", "name": "Lock / Freeze RA Bill Row", "category": "tpi_billing", "weight": 18},
    {"key": "btn_tpi_reconcile_qty", "name": "Reconcile Claimed vs Verified Qty", "category": "tpi_billing", "weight": 28},
]

PAGE_VIEWS = [
    {"route": "/tpi-billing", "name": "TPI RA Bill Verification Master", "weight": 40},
    {"route": "/admin/analytics", "name": "Admin Analytics Hub", "weight": 30},
    {"route": "/invoices", "name": "Consolidated Invoicing", "weight": 25},
    {"route": "/service-orders", "name": "Service Orders Console", "weight": 20},
    {"route": "/visits", "name": "Visit Processing Console", "weight": 35},
    {"route": "/jobs", "name": "Job Umbrella Overview", "weight": 18},
]

USER_ROLES = ["admin", "coordinator", "inspector", "qc_auditor", "finance"]


async def seed_analytics_and_mock_data():
    print("Connecting to MongoDB for Seeding Mock Analytics & Job Data...")
    client = AsyncMongoClient(settings.mongodb_url)
    await init_beanie(
        database=client[settings.mongodb_db_name],
        document_models=[
            AuditEntry,
            Sequence,
            Client, Manufacturer, Job, ServiceOrder, ControlNumber, Visit, Invoice, UserLogin, AnalyticsEvent
        ],
    )

    site_id = "SITE-01"
    now = datetime.now()

    # 1. Run Legacy Migration to seed 5 Jobs, 5 SOs, 7 Visits, 2 Invoices
    print("\n[1/3] Running Legacy Data Migration Seed...")
    legacy_dataset = [
        {
            "legacy_so_id": "LEG-SO-101",
            "client_name": "Larsen & Toubro Ltd - Infra Div",
            "client_id": "CLT-001",
            "manufacturer_name": "Godrej & Boyce Pressure Vessel Div",
            "scope": "Hydrocracker Vessel & Pressure Piping TPI Inspection",
            "amount": 250000.0,
            "visits": [
                {"legacy_visit_id": "LEG-VIS-501", "inspector": "Rajesh Sharma", "mandays": 2.5, "status": "completed"},
                {"legacy_visit_id": "LEG-VIS-502", "inspector": "Anil Kumar", "mandays": 1.5, "status": "completed"}
            ],
            "invoices": [
                {"legacy_invoice_id": "LEG-INV-901", "number": "INV-2026-LEG-01", "amount": 180000.0}
            ]
        },
        {
            "legacy_so_id": "LEG-SO-102",
            "client_name": "Shapoorji Pallonji Engineering",
            "client_id": "CLT-002",
            "manufacturer_name": "ISGEC Heavy Engineering",
            "scope": "High-Pressure Steam Boiler Shell FAT Inspection",
            "amount": 380000.0,
            "visits": [
                {"legacy_visit_id": "LEG-VIS-503", "inspector": "Suresh Verma", "mandays": 4.0, "status": "completed"}
            ],
            "invoices": []
        },
        {
            "legacy_so_id": "LEG-SO-103",
            "client_name": "Tata Projects Infrastructure",
            "client_id": "CLT-003",
            "manufacturer_name": "BHEL Heavy Forging Unit",
            "scope": "Offshore Pipeline Gate Valve 24-inch Hydrostatic Test",
            "amount": 420000.0,
            "visits": [
                {"legacy_visit_id": "LEG-VIS-504", "inspector": "Amit Patel", "mandays": 3.0, "status": "completed"}
            ],
            "invoices": [
                {"legacy_invoice_id": "LEG-INV-902", "number": "INV-2026-LEG-02", "amount": 420000.0}
            ]
        },
        {
            "legacy_so_id": "LEG-SO-104",
            "client_name": "Thermax Quality Systems",
            "client_id": "CLT-005",
            "manufacturer_name": "Welspun Steel Pipes",
            "scope": "Ultrasonic NDT & PMI Material Verification",
            "amount": 195000.0,
            "visits": [
                {"legacy_visit_id": "LEG-VIS-505", "inspector": "Vikram Singh", "mandays": 2.0, "status": "completed"}
            ],
            "invoices": []
        },
        {
            "legacy_so_id": "LEG-SO-105",
            "client_name": "Sterling & Wilson Renewable",
            "client_id": "CLT-004",
            "manufacturer_name": "BHEL Heavy Forging Unit",
            "scope": "Main Power Transformer 220kV FAT & Calibration",
            "amount": 310000.0,
            "visits": [
                {"legacy_visit_id": "LEG-VIS-506", "inspector": "Deepak Joshi", "mandays": 3.5, "status": "completed"}
            ],
            "invoices": []
        }
    ]
    mig_res = await LegacyMigrationService.migrate_legacy_records(site_id=site_id, legacy_dataset=legacy_dataset)
    print("Migration Result:", mig_res["message"])

    # 2. Seed Additional Modern Jobs (JOB-2026-0001 to JOB-2026-0010)
    print("\n[2/3] Seeding Modern Jobs and Invoices...")
    for i in range(1, 11):
        job_id = f"JOB-2026-{i:04d}"
        client_obj = CLIENTS[(i - 1) % len(CLIENTS)]
        existing = await Job.find_one(Job.job_id == job_id)
        if not existing:
            job = Job(
                job_id=job_id,
                title=f"Site Inspection Engagement {i}",
                client_id=client_obj["client_id"],
                client_name=client_obj["name"],
                site_id=site_id,
                status="active" if i % 3 != 0 else "completed",
                tags=["modern_pipeline"],
                created_at=now - timedelta(days=i),
                updated_at=now,
            )
            await job.insert()

    # 3. Seed 250+ Telemetry Analytics Events
    print("\n[3/3] Seeding 250+ Telemetry Analytics Events...")
    await AnalyticsEvent.find(AnalyticsEvent.site_id == site_id).delete()
    events_to_insert = []

    # A. Seed Button Clicks according to weights
    for b_item in BUTTON_ITEMS:
        count = b_item["weight"] * 3  # Scale up counts
        for c in range(count):
            delta_mins = random.randint(5, 10080)  # Up to 7 days ago
            evt = AnalyticsEvent(
                event_id=f"EVT-CLK-{uuid.uuid4().hex[:8].upper()}",
                event_type="button_click",
                element_id=f"el_{b_item['key']}_{c}",
                element_key=b_item["key"],
                element_name=b_item["name"],
                category=b_item["category"],
                page_route=random.choice(PAGE_VIEWS)["route"],
                user_id=f"usr_{random.randint(1, 10):02d}",
                user_role=random.choice(USER_ROLES),
                site_id=site_id,
                metadata={"action": "click", "click_index": c + 1},
                timestamp=now - timedelta(minutes=delta_mins),
            )
            events_to_insert.append(evt)

    # B. Seed Page Views according to weights
    for p_item in PAGE_VIEWS:
        count = p_item["weight"] * 2
        for c in range(count):
            delta_mins = random.randint(5, 10080)
            evt = AnalyticsEvent(
                event_id=f"EVT-PV-{uuid.uuid4().hex[:8].upper()}",
                event_type="page_view",
                element_key=f"page_{p_item['route'].replace('/', '_')}",
                element_name=p_item["name"],
                category="navigation",
                page_route=p_item["route"],
                user_id=f"usr_{random.randint(1, 10):02d}",
                user_role=random.choice(USER_ROLES),
                site_id=site_id,
                metadata={"dwell_time_seconds": random.randint(15, 300)},
                timestamp=now - timedelta(minutes=delta_mins),
            )
            events_to_insert.append(evt)

    # Insert batch of events into MongoDB
    await AnalyticsEvent.insert_many(events_to_insert)
    print(f"Successfully inserted {len(events_to_insert)} telemetry analytics events into MongoDB.")

    # 4. Print Summary Verification
    summary = await AnalyticsService.get_summary(site_id)
    print("\n=== SEEDING COMPLETED SUCCESSFULLY ===")
    print("Total Telemetry Events:", summary["total_events"])
    print("Page Views:", summary["page_views"])
    print("Button Clicks:", summary["button_clicks"])
    print("Legacy Migrated Jobs:", summary["legacy_migrated_jobs"])
    print("Top Clicked Items:")
    for idx, item in enumerate(summary["top_clicked_items"][:5], start=1):
        print(f"  {idx}. {item['name']} ({item['key']}): {item['count']} clicks")


if __name__ == "__main__":
    asyncio.run(seed_analytics_and_mock_data())
