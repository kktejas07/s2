from datetime import datetime
import uuid
from typing import List, Dict, Any
from modules.jobs.models import Job
from modules.service_orders.models import ServiceOrder, POItem
from modules.visits.models import Visit
from modules.invoices.models import Invoice, ChargeItem, AnnexureItem
from modules.analytics.models import AnalyticsEvent


class LegacyMigrationService:

    @staticmethod
    async def migrate_legacy_records(
        site_id: str = "SITE-01",
        legacy_dataset: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Ingests legacy UAT records (from ASP.NET MVC / IQEIMSUAT endpoint data)
        and converts them into unified Job Umbrella containers (JOB-YYYY-XXXX),
        mapping legacy Service Orders, Visits, and Invoices under parent Job IDs.
        """
        if not legacy_dataset:
            # Default simulation of legacy data extracted from https://iqe.edataus.com/IQEIMSUAT
            legacy_dataset = [
                {
                    "legacy_so_id": "LEG-SO-101",
                    "client_name": "Larsen & Toubro Ltd - Infra Div",
                    "client_id": "CLT-001",
                    "manufacturer_name": "Apex Heavy Engineering",
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
                    "manufacturer_name": "Thermax Quality Systems",
                    "scope": "High-Pressure Steam Boiler Shell FAT Inspection",
                    "amount": 380000.0,
                    "visits": [
                        {"legacy_visit_id": "LEG-VIS-503", "inspector": "Suresh Verma", "mandays": 4.0, "status": "completed"}
                    ],
                    "invoices": []
                }
            ]

        migrated_jobs = []
        for index, item in enumerate(legacy_dataset, start=1):
            job_id = f"JOB-2026-MIG-{index:04d}"
            so_id = f"SO-MIG-{index:03d}"

            # 1. Create Umbrella Job
            job = Job(
                job_id=job_id,
                title=f"Migrated Job: {item['scope']}",
                client_id=item["client_id"],
                client_name=item["client_name"],
                site_id=site_id,
                status="active",
                tags=["legacy_imported", "migration_v1"],
                created_at=datetime.now(),
                updated_at=datetime.now(),
            )

            # Check if job already exists
            existing_job = await Job.find_one(Job.job_id == job_id)
            if not existing_job:
                await job.insert()
                migrated_jobs.append(job_id)

            # 2. Create Service Order linked to Job
            existing_so = await ServiceOrder.find_one(ServiceOrder.so_id == so_id)
            if not existing_so:
                so = ServiceOrder(
                    so_id=so_id,
                    so_number=f"SO/2026/LEG-{index:03d}",
                    job_id=job_id,
                    site_id=site_id,
                    status="active",
                    client_id=item["client_id"],
                    client_name=item["client_name"],
                    manufacturer_name=item["manufacturer_name"],
                    po_items=[
                        POItem(
                            description=item["scope"],
                            quantity=1.0,
                            uom="Job Lot",
                            rate=item["amount"],
                            amount=item["amount"],
                            remarks=f"Imported from legacy record {item['legacy_so_id']}"
                        )
                    ],
                    created_at=datetime.now(),
                    updated_at=datetime.now(),
                )
                await so.insert()

            # 3. Create Visits linked to Job
            for v_idx, v_item in enumerate(item.get("visits", []), start=1):
                visit_id = f"VIS-MIG-{index:03d}-{v_idx}"
                existing_v = await Visit.find_one(Visit.visit_id == visit_id)
                if not existing_v:
                    v = Visit(
                        visit_id=visit_id,
                        job_id=job_id,
                        control_number_id=f"CN-MIG-{index:03d}",
                        so_id=so_id,
                        site_id=site_id,
                        status="finance_check_completed",
                        inspector_name=v_item["inspector"],
                        actual_mandays=v_item["mandays"],
                        created_at=datetime.now(),
                        updated_at=datetime.now(),
                    )
                    await v.insert()

            # 4. Create Invoices linked to Job if present
            for inv_idx, inv_item in enumerate(item.get("invoices", []), start=1):
                inv_id = f"INV-MIG-{index:03d}-{inv_idx}"
                existing_inv = await Invoice.find_one(Invoice.invoice_id == inv_id)
                if not existing_inv:
                    inv = Invoice(
                        invoice_id=inv_id,
                        job_id=job_id,
                        site_id=site_id,
                        client_id=item["client_id"],
                        client_name=item["client_name"],
                        invoice_number=inv_item["number"],
                        status="issued",
                        grand_total=inv_item["amount"],
                        consolidated_charges=[
                            ChargeItem(
                                sno=1,
                                category="Legacy TPI Inspection Charge",
                                description=f"Imported from {inv_item['legacy_invoice_id']}",
                                amount=inv_item["amount"]
                            )
                        ],
                        created_at=datetime.now(),
                        updated_at=datetime.now(),
                    )
                    await inv.insert()

            # Record telemetry event for migration
            evt = AnalyticsEvent(
                event_id=f"EVT-MIG-{uuid.uuid4().hex[:8].upper()}",
                event_type="legacy_job_migrated",
                element_id=job_id,
                element_key="migration_job_import",
                element_name=f"Imported {item['legacy_so_id']}",
                category="data_migration",
                page_route="/admin/migration",
                site_id=site_id,
                metadata={
                    "legacy_so_id": item["legacy_so_id"],
                    "new_job_id": job_id,
                    "so_id": so_id,
                },
                timestamp=datetime.now(),
            )
            await evt.insert()

        return {
            "status": "success",
            "message": f"Successfully ingested {len(migrated_jobs)} legacy jobs into Job Umbrella structure.",
            "migrated_job_ids": migrated_jobs,
        }
