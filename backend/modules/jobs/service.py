from __future__ import annotations

from fastapi import HTTPException
from modules.jobs.models import Job, SOWItem, AssignmentHistoryEntry
from modules.service_orders.models import ServiceOrder
from modules.control_numbers.models import ControlNumber
from modules.visits.models import Visit
from modules.invoices.models import Invoice
from datetime import datetime, timedelta
from typing import Optional


class JobService:

    @staticmethod
    async def list(site_id: str = "SITE-01", search: str = "", status: str = "", page: int = 1, per_page: int = 100):
        query = {"site_id": site_id}
        if status:
            query["status"] = status
        if search:
            query["$or"] = [
                {"job_id": {"$regex": search, "$options": "i"}},
                {"title": {"$regex": search, "$options": "i"}},
                {"client_name": {"$regex": search, "$options": "i"}},
            ]
        total = await Job.find(query).count()
        items = await Job.find(query).sort(-Job.created_at).skip((page - 1) * per_page).limit(per_page).to_list()

        # Auto-seed sample jobs if empty
        if not items and not search and not status:
            now = datetime.now()
            sample_jobs = [
                Job(
                    job_id="JOB-2026-001",
                    site_id=site_id,
                    title="Reliance Hazira Heavy Pressure Vessel Audit",
                    description="Full Stage NDT & Hydrostatic Pressure Audit for 15 Subsea Vessel Units",
                    job_type_category="PV-PIPE",
                    client_id="C-001",
                    client_name="Reliance Industries Ltd",
                    client_unit_id="C-001-U01",
                    client_unit_name="Reliance - Unit 1 (Hazira Heavy Fabrication Yard)",
                    manufacturer_id="M-001",
                    manufacturer_name="BHEL Trichy Boilers",
                    manufacturer_unit_id="M-001-U01",
                    manufacturer_unit_name="BHEL - Works 1 (Heavy Forging & Casting Shop)",
                    po_number="PO/RIL/2026/094",
                    assigned_inspector_id="INS-001",
                    assigned_inspector_name="Alok Gupta (Senior TPI Engineer)",
                    inspector_certifications=["ASNT Level III NDT", "API 510 Pressure Vessel Inspector"],
                    inspector_experience_years=14,
                    client_approval_status="approved_by_client",
                    client_approval_remarks="Approved by Reliance Lead Quality Manager",
                    client_approved_at=now - timedelta(days=5),
                    budget_contract_amount=250000.0,
                    budget_inspector_fee=80000.0,
                    budget_travel_allowance=15000.0,
                    budget_total=345000.0,
                    budget=345000.0,
                    scheduled_start_date=now + timedelta(days=5),
                    scheduled_end_date=now + timedelta(days=10),
                    status="in_progress",
                    scope_of_work=[
                        SOWItem(item_id="SOW-01", description="Raw Material Heat & Mill Certificate Verification", category="Material Audit", is_checklist=True, completed=True),
                        SOWItem(item_id="SOW-02", description="Bevel End Preparation & Root Gap Dimensional Check", category="Dimensional Audit", is_checklist=True, completed=True),
                        SOWItem(item_id="SOW-03", description="100% Magnetic Particle Test (MPT) & Radiography Witness", category="NDT Audit", is_checklist=True, completed=False),
                        SOWItem(item_id="SOW-04", description="Hydrostatic Pressure Witness at 1.5x Design Pressure", category="Pressure Audit", is_checklist=True, completed=False),
                    ],
                ),
                Job(
                    job_id="JOB-2026-002",
                    site_id=site_id,
                    title="L&T Jamnagar Refinery Heat Exchanger Tube Audit",
                    description="Eddy Current Testing & Dimensional Inspection for High Pressure Boiler Tube Bundle",
                    job_type_category="NDT-RAD",
                    client_id="C-002",
                    client_name="L&T Heavy Engineering",
                    client_unit_id="C-002-U02",
                    client_unit_name="L&T - Unit 2 (Jamnagar Refinery Expansion Site)",
                    manufacturer_id="M-002",
                    manufacturer_name="Godrej Heavy Engineering",
                    manufacturer_unit_id="M-002-U02",
                    manufacturer_unit_name="Godrej - Works 2 (High Pressure Boiler & Vessel Shop)",
                    po_number="PO/LNT/2026/441",
                    assigned_inspector_id="INS-002",
                    assigned_inspector_name="S. Sundaram (Subsea & NDT Inspector)",
                    inspector_certifications=["CSWIP 3.1 Senior Welding Inspector", "ISNT Level II UT/MT/PT"],
                    inspector_experience_years=11,
                    client_approval_status="pending_client_approval",
                    budget_contract_amount=180000.0,
                    budget_inspector_fee=60000.0,
                    budget_travel_allowance=12000.0,
                    budget_total=252000.0,
                    budget=252000.0,
                    scheduled_start_date=now + timedelta(days=8),
                    scheduled_end_date=now + timedelta(days=12),
                    status="open",
                    scope_of_work=[
                        SOWItem(item_id="SOW-01", description="Eddy Current Tube Testing & Wall Thickness Audit", category="NDT Audit", is_checklist=True, completed=False),
                        SOWItem(item_id="SOW-02", description="Tube-to-Tubesheet Weld Joint Dye Penetrant Audit", category="Welding Audit", is_checklist=True, completed=False),
                    ],
                ),
            ]
            for j in sample_jobs:
                try:
                    await j.insert()
                except Exception:
                    pass
            items = sample_jobs
            total = len(sample_jobs)

        return {"total": total, "page": page, "per_page": per_page, "data": [j.dict() for j in items]}

    @staticmethod
    async def get(job_id: str, site_id: str = "SITE-01", include: str = ""):
        job = await Job.find_one(Job.job_id == job_id, Job.site_id == site_id)
        if not job:
            raise HTTPException(404, "Job not found")
        result = job.dict()
        if "service-orders" in include:
            result["service_orders"] = [s.dict() for s in await ServiceOrder.find(ServiceOrder.job_id == job_id).to_list()]
        if "control-numbers" in include:
            result["control_numbers"] = [c.dict() for c in await ControlNumber.find(ControlNumber.job_id == job_id).to_list()]
        if "visits" in include:
            result["visits"] = [v.dict() for v in await Visit.find(Visit.job_id == job_id).to_list()]
        if "invoices" in include:
            result["invoices"] = [i.dict() for i in await Invoice.find(Invoice.job_id == job_id).to_list()]
        return result

    @staticmethod
    async def create(data: dict, site_id: str, user_id: str):
        if not data.get("job_id"):
            total_jobs = await Job.find_all().count()
            data["job_id"] = f"JOB-2026-{(total_jobs + 1):03d}"

        existing = await Job.find_one(Job.job_id == data["job_id"], Job.site_id == site_id)
        if existing:
            raise HTTPException(400, "Job ID already exists")
            
        # Default Scope of Work Checklists based on job_type_category
        cat = data.get("job_type_category", "PV-PIPE")
        if not data.get("scope_of_work"):
            if cat == "PV-PIPE":
                data["scope_of_work"] = [
                    SOWItem(item_id="SOW-01", description="Raw Material Heat & Mill Certificate Verification", category="Material Audit").dict(),
                    SOWItem(item_id="SOW-02", description="Bevel End Preparation & Root Gap Dimensional Check", category="Dimensional Audit").dict(),
                    SOWItem(item_id="SOW-03", description="100% Magnetic Particle Test (MPT) & Radiography Witness", category="NDT Audit").dict(),
                    SOWItem(item_id="SOW-04", description="Hydrostatic Pressure Witness at 1.5x Design Pressure", category="Pressure Audit").dict(),
                ]
            elif cat == "STR-FAB":
                data["scope_of_work"] = [
                    SOWItem(item_id="SOW-01", description="Structural Steel Plate & Section Material Identification", category="Material Audit").dict(),
                    SOWItem(item_id="SOW-02", description="Fit-up Alignment & Bolt Hole Center-to-Center Clearance Check", category="Dimensional Audit").dict(),
                    SOWItem(item_id="SOW-03", description="Weld Visual & Ultrasonic NDT Witnessing", category="Welding Audit").dict(),
                    SOWItem(item_id="SOW-04", description="Surface Preparation (Sa 2.5) & Primer Coating DFT Measurement", category="Coating Audit").dict(),
                ]
            else:
                data["scope_of_work"] = [
                    SOWItem(item_id="SOW-01", description="Equipment Dimensional Verification Against Approved QAP", category="General Inspection").dict(),
                    SOWItem(item_id="SOW-02", description="Stage Inspection Witnessing & Calibration Verification", category="General Inspection").dict(),
                ]

        job = Job(**data, site_id=site_id, created_by=user_id)
        await job.insert()
        return job

    @staticmethod
    async def assign_inspector_for_approval(
        job_id: str,
        inspector_id: str,
        inspector_name: str,
        certifications: list[str],
        experience_years: int,
        site_id: str = "SITE-01"
    ):
        job = await Job.find_one(Job.job_id == job_id, Job.site_id == site_id)
        if not job:
            raise HTTPException(404, "Job not found")
        job.assigned_inspector_id = inspector_id
        job.assigned_inspector_name = inspector_name
        job.inspector_certifications = certifications
        job.inspector_experience_years = experience_years
        job.client_approval_status = "pending_client_approval"
        job.client_approval_remarks = None

        # Append to Audit History Roadmap
        attempt_no = len(job.inspector_assignment_history) + 1
        history_entry = AssignmentHistoryEntry(
            entry_id=f"ATTEMPT-{(attempt_no):02d}",
            inspector_id=inspector_id,
            inspector_name=inspector_name,
            certifications=certifications,
            experience_years=experience_years,
            submitted_at=datetime.now(),
            status="pending_client_approval",
        )
        job.inspector_assignment_history.append(history_entry)

        job.updated_at = datetime.now()
        await job.save()
        return job

    @staticmethod
    async def client_approve_inspector(
        job_id: str,
        approved: bool,
        remarks: str = "",
        site_id: str = "SITE-01"
    ):
        job = await Job.find_one(Job.job_id == job_id, Job.site_id == site_id)
        if not job:
            raise HTTPException(404, "Job not found")
        
        status_str = "approved_by_client" if approved else "rejected_by_client"
        job.client_approval_status = status_str
        job.client_approval_remarks = remarks

        if approved:
            job.client_approved_at = datetime.now()
            job.status = "assigned"

        # Update latest history entry in Roadmap
        if job.inspector_assignment_history:
            latest = job.inspector_assignment_history[-1]
            latest.status = status_str
            latest.client_remarks = remarks
            latest.decided_at = datetime.now()

        job.updated_at = datetime.now()
        await job.save()
        return job

    @staticmethod
    async def get_assignment_roadmap(job_id: str, site_id: str = "SITE-01"):
        job = await Job.find_one(Job.job_id == job_id, Job.site_id == site_id)
        if not job:
            raise HTTPException(404, "Job not found")
        return {
            "job_id": job.job_id,
            "title": job.title,
            "client_name": job.client_name,
            "current_status": job.client_approval_status,
            "current_inspector": job.assigned_inspector_name,
            "roadmap": [h.dict() for h in job.inspector_assignment_history]
        }

    @staticmethod
    async def update_budget_and_schedule(
        job_id: str,
        contract_amount: float,
        inspector_fee: float,
        travel_allowance: float,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        site_id: str = "SITE-01"
    ):
        job = await Job.find_one(Job.job_id == job_id, Job.site_id == site_id)
        if not job:
            raise HTTPException(404, "Job not found")
        job.budget_contract_amount = contract_amount
        job.budget_inspector_fee = inspector_fee
        job.budget_travel_allowance = travel_allowance
        job.budget_total = contract_amount + inspector_fee + travel_allowance
        job.budget = job.budget_total

        if start_date:
            try:
                job.scheduled_start_date = datetime.fromisoformat(start_date.replace("Z", ""))
            except Exception:
                pass
        if end_date:
            try:
                job.scheduled_end_date = datetime.fromisoformat(end_date.replace("Z", ""))
            except Exception:
                pass

        job.updated_at = datetime.now()
        await job.save()
        return job

    @staticmethod
    async def get_sow_templates():
        from modules.jobs.scenarios import PREDEFINED_SOW_TEMPLATES
        return PREDEFINED_SOW_TEMPLATES

    @staticmethod
    async def apply_sow_template_to_job(
        job_id: str,
        template_code: str,
        append: bool = True,
        site_id: str = "SITE-01"
    ):
        from modules.jobs.scenarios import PREDEFINED_SOW_TEMPLATES
        job = await Job.find_one(Job.job_id == job_id, Job.site_id == site_id)
        if not job:
            raise HTTPException(404, "Job not found")

        template = next((t for t in PREDEFINED_SOW_TEMPLATES if t["code"] == template_code), None)
        if not template:
            raise HTTPException(400, "Invalid SOW scenario template code")

        template_items = [SOWItem(**item) for item in template["checklist_items"]]

        if append and job.scope_of_work:
            existing_ids = {s.item_id for s in job.scope_of_work}
            for t_item in template_items:
                if t_item.item_id not in existing_ids:
                    job.scope_of_work.append(t_item)
        else:
            job.scope_of_work = template_items

        job.updated_at = datetime.now()
        await job.save()
        return {
            "job_id": job.job_id,
            "applied_template": template["method_name"],
            "applicable_codes": template["applicable_codes"],
            "total_sow_items": len(job.scope_of_work),
            "scope_of_work": [s.dict() for s in job.scope_of_work]
        }

    @staticmethod
    async def update(job_id: str, data: dict, site_id: str = "SITE-01"):
        job = await Job.find_one(Job.job_id == job_id, Job.site_id == site_id)
        if not job:
            raise HTTPException(404, "Job not found")
        for k, v in data.items():
            if hasattr(job, k) and k not in ("job_id", "site_id", "created_at", "created_by"):
                setattr(job, k, v)
        job.updated_at = datetime.now()
        await job.save()
        return job

    @staticmethod
    async def dashboard(site_id: str = "SITE-01"):
        jobs = await Job.find(Job.site_id == site_id).to_list()
        return {
            "total": len(jobs),
            "open": sum(1 for j in jobs if j.status in ("draft", "open")),
            "in_progress": sum(1 for j in jobs if j.status in ("assigned", "in_progress")),
            "qc_pending": sum(1 for j in jobs if j.status == "submitted"),
            "approved": sum(1 for j in jobs if j.status in ("qc_approved", "approved")),
            "invoiced": sum(1 for j in jobs if j.status == "invoiced"),
            "closed": sum(1 for j in jobs if j.status in ("closed", "cancelled")),
        }

