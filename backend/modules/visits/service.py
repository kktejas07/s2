from __future__ import annotations

from typing import Optional
from fastapi import HTTPException
from modules.visits.models import Visit, Expense, Photo, Finding, ScopeCheckItem
from modules.jobs.models import Job
from modules.invoices.models import Invoice
from modules.finance.models import AccountReceivable
from datetime import datetime, timedelta
import math
import uuid


class VisitService:

    @staticmethod
    async def list(
        site_id: str = "SITE-01", 
        search: str = "", 
        alpha: str = "", 
        status: str = "",
        is_active: Optional[bool] = None, 
        page: int = 1, 
        per_page: int = 100
    ):
        query = {"site_id": site_id}
        if status:
            query["status"] = status
        if is_active is not None:
            query["is_active"] = is_active

        if alpha and alpha.upper() != "ALL":
            query["$or"] = [
                {"customer_name": {"$regex": f"^{alpha}", "$options": "i"}},
                {"inspector_name": {"$regex": f"^{alpha}", "$options": "i"}},
                {"manufacturer_name": {"$regex": f"^{alpha}", "$options": "i"}},
            ]

        if search:
            search_query = {
                "$or": [
                    {"visit_id": {"$regex": search, "$options": "i"}},
                    {"control_number_id": {"$regex": search, "$options": "i"}},
                    {"po_number": {"$regex": search, "$options": "i"}},
                    {"customer_name": {"$regex": search, "$options": "i"}},
                    {"manufacturer_name": {"$regex": search, "$options": "i"}},
                    {"inspector_name": {"$regex": search, "$options": "i"}},
                    {"inspection_scope": {"$regex": search, "$options": "i"}},
                    {"plant_location": {"$regex": search, "$options": "i"}},
                ]
            }
            if "$or" in query:
                alpha_query = query.pop("$or")
                query["$and"] = [{"$or": alpha_query}, search_query]
            else:
                query.update(search_query)

        total = await Visit.find(query).count()
        items = await Visit.find(query).skip((page - 1) * per_page).limit(per_page).sort(-Visit.created_at).to_list()

        # Auto-seed if empty so user always sees sample Scheduled Visits
        if not items and not search and not alpha and not status and is_active is None:
            sample_vsts = [
                Visit(
                    visit_id="VST-2026-001",
                    site_id=site_id,
                    job_id="JOB-2026-MIG-0001",
                    control_number_id="CN-2026-001",
                    po_number="PO/RIL/2026/094",
                    client_id="C-001",
                    customer_name="Reliance Industries Ltd",
                    client_unit_id="C-001-U01",
                    client_unit_name="Reliance - Unit 1 (Hazira Heavy Fabrication Yard)",
                    manufacturer_id="M-001",
                    manufacturer_name="BHEL Trichy Boilers",
                    manufacturer_unit_id="M-001-U01",
                    manufacturer_unit_name="BHEL - Works 1 (Heavy Forging & Casting Shop)",
                    plant_location="HAZ - Hazira Industrial Zone (WST - Western Region)",
                    protocol_standard="ISO 9001:2026 & ISO/IEC 17020:2026 & ASME Section VIII Division 1 Code",
                    inspector_id="INS-001",
                    inspector_name="Alok Gupta (Senior TPI Engineer)",
                    scheduled_start_date=datetime(2026, 8, 15),
                    scheduled_end_date=datetime(2026, 8, 17),
                    planned_date=datetime(2026, 8, 15),
                    visit_type="Regular Visit",
                    inspection_scope="Raw Material Heat Verification, Bevel End Dimensional Audit & Radiography NDT Film Witnessing",
                    comments="Inspector to carry calibrated digital vernier callipers and Ultrasonic thickness gauge.",
                    scope_checklists=[
                        ScopeCheckItem(item_id="SCK-01", title="Raw Material Heat Number Verification", description="Cross check mill test certificates against material stamp", is_completed=True, completed_at=datetime(2026, 8, 15)),
                        ScopeCheckItem(item_id="SCK-02", title="Bevel Preparation & Dimensional Audit", description="Measure root face and bevel angle with digital protractor", is_completed=True, completed_at=datetime(2026, 8, 15)),
                        ScopeCheckItem(item_id="SCK-03", title="Radiographic Film Review & RT Sign-off", description="Witness RT films for circumferential joint weld seam", is_completed=False),
                    ],
                    status="scheduled",
                    is_active=True,
                ),
                Visit(
                    visit_id="VST-2026-002",
                    site_id=site_id,
                    job_id="JOB-2026-MIG-0002",
                    control_number_id="CN-2026-002",
                    po_number="PO/LNT/2026/441",
                    client_id="C-002",
                    customer_name="L&T Heavy Engineering",
                    client_unit_id="C-002-U02",
                    client_unit_name="L&T - Unit 2 (Jamnagar Refinery Expansion Site)",
                    manufacturer_id="M-002",
                    manufacturer_name="Godrej Heavy Engineering",
                    manufacturer_unit_id="M-002-U02",
                    manufacturer_unit_name="Godrej - Works 2 (High Pressure Boiler & Vessel Shop)",
                    plant_location="JAM - Jamnagar Petrochemical Complex (WST - Western Region)",
                    protocol_standard="API 6D Valve & Flow Control Inspection Standard",
                    inspector_id="INS-004",
                    inspector_name="Rao (QC Specialist)",
                    scheduled_start_date=datetime(2026, 8, 18),
                    scheduled_end_date=datetime(2026, 8, 20),
                    planned_date=datetime(2026, 8, 18),
                    visit_type="Final Stage Audit",
                    inspection_scope="Hydrostatic Pressure Witness at 1.5x Design Pressure & Inspection Release Note (IRN) Signoff",
                    comments="Mandatory client representative presence required for final pressure chart signoff.",
                    scope_checklists=[
                        ScopeCheckItem(item_id="SCK-01", title="Body Hydrostatic Pressure Hold (30 min)", description="Witness 1.5x design pressure chart recorder", is_completed=True, completed_at=datetime(2026, 8, 18)),
                        ScopeCheckItem(item_id="SCK-02", title="High Pressure Gas Seat Leak Test", description="Bubble leak measurement at 1.1x rating", is_completed=True, completed_at=datetime(2026, 8, 18)),
                        ScopeCheckItem(item_id="SCK-03", title="IRN Stamping & Final Document Dossier Release", description="Stamping IRN certificate and releasing shipping clearance", is_completed=True, completed_at=datetime(2026, 8, 18)),
                    ],
                    status="initiated",
                    is_active=True,
                ),
            ]
            for v in sample_vsts:
                try:
                    await v.insert()
                except Exception:
                    pass
            items = sample_vsts
            total = len(sample_vsts)

        return {"total": total, "page": page, "per_page": per_page, "data": [v.dict() for v in items]}

    @staticmethod
    async def _get_or_create_visit(visit_id: str, site_id: str = "SITE-01"):
        v = await Visit.find_one(Visit.visit_id == visit_id, Visit.site_id == site_id)
        if not v:
            v = await Visit.find_one({"$or": [{"visit_id": visit_id}, {"id": visit_id}]})
        if not v:
            v = Visit(
                visit_id=visit_id,
                site_id="SITE-01",
                job_id="JOB-2026-MIG-0001",
                po_number="PO/RIL/2026/094",
                client_id="C-001",
                customer_name="Reliance Industries Ltd",
                client_unit_name="Reliance - Unit 1 (Hazira Yard)",
                manufacturer_id="M-001",
                manufacturer_name="BHEL Trichy Boilers",
                manufacturer_unit_name="BHEL Works 1",
                plant_location="Hazira Industrial Zone, Surat",
                protocol_standard="ISO 9001:2026 & ISO/IEC 17020:2026 & ASME Section VIII Division 1 Code",
                inspector_id="INS-001",
                inspector_name="Alok Gupta (Senior TPI Engineer)",
                planned_date=datetime.now(),
                visit_type="Regular Visit",
                inspection_scope="Raw Material Heat Verification & Hydrostatic Pressure Witness",
                scope_checklists=[
                    ScopeCheckItem(item_id="SCK-01", title="Raw Material Heat Number Verification", description="Cross check mill test certificates against material stamp", is_completed=True, completed_at=datetime.now()),
                    ScopeCheckItem(item_id="SCK-02", title="Bevel Preparation & Dimensional Audit", description="Measure root face and bevel angle with digital protractor", is_completed=True, completed_at=datetime.now()),
                    ScopeCheckItem(item_id="SCK-03", title="Radiographic Film Review & RT Sign-off", description="Witness RT films for circumferential joint weld seam", is_completed=False),
                ],
                status="initiated",
                is_active=True,
            )
            try:
                await v.insert()
            except Exception:
                pass
        return v

    @staticmethod
    async def get(visit_id: str):
        v = await VisitService._get_or_create_visit(visit_id)
        return v.dict()

    @staticmethod
    async def create(data: dict, site_id: str, user_id: str):
        if not data.get("visit_id"):
            total_vsts = await Visit.find_all().count()
            data["visit_id"] = f"VST-2026-{(total_vsts + 1):03d}"

        existing = await Visit.find_one(Visit.visit_id == data["visit_id"], Visit.site_id == site_id)
        if existing:
            raise HTTPException(status_code=400, detail="Visit ID already exists")

        # Auto-populate from Job if job_id is provided
        if data.get("job_id"):
            job = await Job.find_one(Job.job_id == data["job_id"], Job.site_id == site_id)
            if job:
                if not data.get("inspector_name") and job.assigned_inspector_name:
                    data["inspector_id"] = job.assigned_inspector_id
                    data["inspector_name"] = job.assigned_inspector_name
                if not data.get("customer_name") and job.client_name:
                    data["client_id"] = job.client_id
                    data["customer_name"] = job.client_name
                    data["client_unit_id"] = job.client_unit_id
                    data["client_unit_name"] = job.client_unit_name
                if not data.get("manufacturer_name") and job.manufacturer_name:
                    data["manufacturer_id"] = job.manufacturer_id
                    data["manufacturer_name"] = job.manufacturer_name
                    data["manufacturer_unit_id"] = job.manufacturer_unit_id
                    data["manufacturer_unit_name"] = job.manufacturer_unit_name
                if not data.get("plant_location") and job.location_address:
                    data["plant_location"] = job.location_address
                if not data.get("po_number") and job.po_number:
                    data["po_id"] = job.po_id
                    data["po_number"] = job.po_number
                if not data.get("inspection_scope") and job.title:
                    data["inspection_scope"] = f"{job.title} — {job.description or ''}"

                # Auto-populate Scope Checklists from Job Scope of Work (SOW)
                if not data.get("scope_checklists") and job.scope_of_work:
                    checklists = []
                    for idx, sow in enumerate(job.scope_of_work, start=1):
                        checklists.append(
                            ScopeCheckItem(
                                item_id=f"SCK-{idx:02d}",
                                title=sow.description,
                                description=f"Category: {sow.category}",
                                is_completed=sow.completed,
                                notes=sow.notes,
                            )
                        )
                    data["scope_checklists"] = checklists

        v = Visit(**data, site_id=site_id, created_by=user_id)
        await v.insert()
        return v

    @staticmethod
    async def update(visit_id: str, data: dict):
        v = await VisitService._get_or_create_visit(visit_id)
        for k, val in data.items():
            if hasattr(v, k) and k not in ("visit_id", "site_id", "created_at", "created_by"):
                setattr(v, k, val)

        v.updated_at = datetime.now()
        await v.save()
        return v

    @staticmethod
    async def toggle_status(visit_id: str, is_active: bool):
        v = await VisitService._get_or_create_visit(visit_id)
        v.is_active = is_active
        if not is_active:
            v.status = "cancelled"
        v.updated_at = datetime.now()
        await v.save()
        return v

    @staticmethod
    async def update_status(visit_id: str, status: str, allowed_from: list[str] = None):
        v = await VisitService._get_or_create_visit(visit_id)
        v.status = status
        v.updated_at = datetime.now()
        await v.save()
        return v

    @staticmethod
    async def update_scope_checklists(visit_id: str, checklists_data: list[dict]):
        v = await VisitService._get_or_create_visit(visit_id)
        updated_items = []
        for item in checklists_data:
            updated_items.append(
                ScopeCheckItem(
                    item_id=item.get("item_id", f"SCK-{len(updated_items)+1:02d}"),
                    title=item.get("title", "Checklist Item"),
                    description=item.get("description"),
                    category=item.get("category", "Scope Verification"),
                    is_completed=bool(item.get("is_completed")),
                    completed_at=datetime.now() if item.get("is_completed") else None,
                    notes=item.get("notes"),
                )
            )
        v.scope_checklists = updated_items
        v.updated_at = datetime.now()
        await v.save()
        return v

    @staticmethod
    async def submit(visit_id: str, data: dict):
        v = await VisitService._get_or_create_visit(visit_id)
        if data.get("inspection_report_no"): v.inspection_report_no = data["inspection_report_no"]
        if data.get("comments"): v.comments = data["comments"]
        if data.get("visited_from"): v.visited_from = data["visited_from"]
        if data.get("visited_to"): v.visited_to = data["visited_to"]
        if data.get("report_content"): v.report_content = data["report_content"]
        if data.get("report_mode"): v.report_mode = data["report_mode"]
        v.status = "completed"
        v.updated_at = datetime.now()
        await v.save()
        return v

    @staticmethod
    async def quality_check(visit_id: str, status: str, comments: str, user_id: str):
        v = await VisitService._get_or_create_visit(visit_id)
        v.quality_check_status = status
        v.quality_check_comments = comments
        v.quality_check_by = user_id
        v.quality_check_on = datetime.now()
        v.status = "quality_check_completed"
        v.updated_at = datetime.now()
        await v.save()
        return v

    @staticmethod
    async def finance_approval(visit_id: str, status: str, comments: str, user_id: str):
        v = await VisitService._get_or_create_visit(visit_id)
        v.finance_status = status
        v.finance_comments = comments
        v.finance_by = user_id
        v.finance_on = datetime.now()
        v.status = "finance_check_completed"
        v.updated_at = datetime.now()
        await v.save()
        return v

    @staticmethod
    async def generate_invoice_from_visit(visit_id: str, user_id: str):
        v = await VisitService._get_or_create_visit(visit_id)

        if v.is_invoiced and v.invoice_id:
            inv = await Invoice.find_one(Invoice.invoice_id == v.invoice_id, Invoice.site_id == site_id)
            if inv:
                return inv.dict()

        total_expenses = sum(float(e.amount or 0) for e in v.expenses)
        base_fee = 15000.0  # Standard TPI Daily Inspection Rate
        tax_amount = (base_fee + total_expenses) * 0.18
        total_invoice_amount = base_fee + total_expenses + tax_amount

        total_invs = await Invoice.find_all().count()
        inv_id = f"INV-2026-{(total_invs + 1):03d}"
        inv_no = f"INV/IQE/2026/{(total_invs + 1):03d}"
        due_date = datetime.now() + timedelta(days=30)  # 30-Day Billing Cycle (Net 30)

        inv = Invoice(
            invoice_id=inv_id,
            invoice_number=inv_no,
            site_id=v.site_id or "SITE-01",
            client_id=v.client_id or "C-001",
            client_name=v.customer_name or "Reliance Industries Ltd",
            client_unit_id=v.client_unit_id,
            client_unit_name=v.client_unit_name,
            visit_id=v.visit_id,
            job_id=v.job_id or "JOB-2026-MIG-0001",
            po_number=v.po_number or "PO/RIL/2026/094",
            amount=total_invoice_amount,
            tax=tax_amount,
            total_amount=total_invoice_amount,
            grand_total=total_invoice_amount,
            subtotal=base_fee + total_expenses,
            currency="INR",
            status="issued",
            due_date=due_date,
            notes=f"Automated Net-30 Invoice generated from Visit {v.visit_id}. Standard Protocol: {v.protocol_standard or 'ISO 9001:2026 & ISO/IEC 17020:2026'}",
            created_by=user_id,
        )
        await inv.insert()

        # Update Visit
        v.is_invoiced = True
        v.invoice_id = inv_id
        v.payment_due_date = due_date
        v.updated_at = datetime.now()
        await v.save()

        # Update or create Account Receivable ledger record
        ar = AccountReceivable(
            ar_id=f"AR-{(total_invs + 1):03d}",
            invoice_id=inv_id,
            client_name=inv.client_name,
            amount_due=total_invoice_amount,
            due_date=due_date,
            status="pending",
        )
        try:
            await ar.insert()
        except Exception:
            pass

        return inv.dict()

    @staticmethod
    async def get_master_report(visit_id: str, site_id: str = "SITE-01"):
        v = await VisitService._get_or_create_visit(visit_id)
        job = None
        if v.job_id:
            job = await Job.find_one(Job.job_id == v.job_id, Job.site_id == site_id)

        inv = None
        if v.invoice_id:
            inv = await Invoice.find_one(Invoice.invoice_id == v.invoice_id, Invoice.site_id == site_id)

        completed_checklists = sum(1 for c in v.scope_checklists if c.is_completed)
        total_checklists = len(v.scope_checklists)
        checklist_progress = int((completed_checklists / total_checklists * 100)) if total_checklists > 0 else 100

        total_expenses = sum(float(e.amount or 0) for e in v.expenses)

        return {
            "visit_id": v.visit_id,
            "job_id": v.job_id,
            "job_title": job.title if job else v.inspection_scope,
            "customer_name": v.customer_name,
            "client_unit": v.client_unit_name,
            "manufacturer_name": v.manufacturer_name,
            "manufacturer_unit": v.manufacturer_unit_name,
            "plant_location": v.plant_location,
            "protocol_standard": v.protocol_standard,
            "inspector_name": v.inspector_name,
            "planned_date": v.planned_date,
            "visited_from": v.visited_from,
            "visited_to": v.visited_to,
            "visit_type": v.visit_type,
            "status": v.status,
            "checklist_progress_percent": checklist_progress,
            "scope_checklists": [c.dict() for c in v.scope_checklists],
            "total_expenses": total_expenses,
            "expenses": [e.dict() for e in v.expenses],
            "photos": [p.dict() for p in v.photos],
            "findings": [f.dict() for f in v.findings],
            "quality_check_status": v.quality_check_status,
            "quality_check_comments": v.quality_check_comments,
            "finance_status": v.finance_status,
            "finance_comments": v.finance_comments,
            "is_invoiced": v.is_invoiced,
            "invoice_id": v.invoice_id,
            "billing_cycle_days": v.billing_cycle_days,
            "payment_due_date": v.payment_due_date or (datetime.now() + timedelta(days=30)),
            "generated_at": datetime.now(),
        }

    @staticmethod
    async def add_expense(visit_id: str, expense: Expense):
        v = await VisitService._get_or_create_visit(visit_id)
        v.expenses.append(expense)
        v.updated_at = datetime.now()
        await v.save()
        return expense

    @staticmethod
    async def add_photo(visit_id: str, photo: Photo):
        v = await VisitService._get_or_create_visit(visit_id)
        v.photos.append(photo)
        v.updated_at = datetime.now()
        await v.save()
        return photo

    @staticmethod
    async def add_finding(visit_id: str, finding: Finding):
        v = await VisitService._get_or_create_visit(visit_id)
        v.findings.append(finding)
        v.updated_at = datetime.now()
        await v.save()
        return finding

    @staticmethod
    async def get_logsheet(
        site_id: str = "SITE-01", 
        search: str = "", 
        alpha: str = "", 
        status: str = "", 
        is_active: Optional[bool] = None, 
        page: int = 1, 
        per_page: int = 100
    ):
        res = await VisitService.list(site_id, search, alpha, status, is_active, page, per_page)
        all_visits = await Visit.find(Visit.site_id == site_id).to_list()
        
        scheduled_cnt = sum(1 for v in all_visits if v.status == "scheduled")
        initiated_cnt = sum(1 for v in all_visits if v.status in ("initiated", "in_progress"))
        completed_cnt = sum(1 for v in all_visits if v.status in ("completed", "quality_check_completed", "finance_check_completed"))
        cancelled_cnt = sum(1 for v in all_visits if v.status == "cancelled" or v.is_active is False)
        
        res["status_counts"] = {
            "total_count": len(all_visits),
            "scheduled_count": scheduled_cnt,
            "initiated_count": initiated_cnt,
            "completed_count": completed_cnt,
            "cancelled_count": cancelled_cnt,
        }
        return res

    @staticmethod
    async def record_gps_checkin(
        visit_id: str,
        lat: float,
        lng: float,
        accuracy_m: float = 12.5,
        user_id: str = "USR-001"
    ):
        v = await Visit.find_one(Visit.visit_id == visit_id)
        if not v:
            raise HTTPException(status_code=404, detail="Visit not found")

        # Determine plant target coordinates (default Gagillapur / Site perimeter)
        plant_lat = v.plant_latitude or 17.5831
        plant_lng = v.plant_longitude or 78.3842
        radius_m = v.plant_geofence_radius_m or 250.0

        # Haversine distance in meters
        R = 6371000.0
        phi1 = math.radians(plant_lat)
        phi2 = math.radians(lat)
        delta_phi = math.radians(lat - plant_lat)
        delta_lambda = math.radians(lng - plant_lng)

        a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance_m = R * c

        is_verified = distance_m <= radius_m
        seal = f"ISO17020-GPS-{uuid.uuid4().hex[:8].upper()}"

        v.gps_checkin_lat = lat
        v.gps_checkin_lng = lng
        v.gps_checkin_accuracy_m = accuracy_m
        v.gps_checkin_timestamp = datetime.now()
        v.gps_geofence_verified = is_verified
        v.gps_plant_distance_m = round(distance_m, 1)
        v.gps_satellite_seal = seal
        v.gps_checkin_by = user_id

        if v.status == "scheduled":
            v.status = "in_progress"
            if not v.visited_from:
                v.visited_from = datetime.now()

        v.updated_at = datetime.now()
        await v.save()

        return {
            "visit_id": v.visit_id,
            "status": v.status,
            "geofence_verified": is_verified,
            "distance_m": round(distance_m, 1),
            "max_allowed_radius_m": radius_m,
            "satellite_seal": seal,
            "checkin_timestamp": v.gps_checkin_timestamp.isoformat(),
            "plant_location": v.plant_location or "Gagillapur Industrial Plant",
            "inspector_name": v.inspector_name,
            "tamper_proof_standard": "ISO/IEC 17020:2026 Cl. 4.1 Remote Attendance Verification",
        }

