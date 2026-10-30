from typing import Optional
from datetime import datetime
from fastapi import HTTPException
from core.audit import AuditAction, record as audit
from modules.release_notes.models import InspectionReleaseNote
from modules.ncr.models import NCR
from modules.punch_list.models import PunchItem


class ReleaseNoteService:

    @staticmethod
    async def list(site_id: str = "SITE-01", job_id: Optional[str] = None, status: Optional[str] = None, page: int = 1, per_page: int = 100):
        query: dict = {"site_id": site_id}
        if job_id:
            query["job_id"] = job_id
        if status:
            query["status"] = status
        total = await InspectionReleaseNote.find(query).count()
        items = (
            await InspectionReleaseNote.find(query)
            .skip((page - 1) * per_page)
            .limit(per_page)
            .sort(-InspectionReleaseNote.created_at)
            .to_list()
        )
        return {"total": total, "items": [i.dict() for i in items], "page": page, "per_page": per_page}

    @staticmethod
    async def get(irn_id: str, site_id: str):
        irn = await InspectionReleaseNote.find_one({"irn_id": irn_id, "site_id": site_id})
        if not irn:
            raise HTTPException(status_code=404, detail="Release note not found")
        return irn.dict()

    @staticmethod
    async def create(data: dict, site_id: str, user_id: str):
        count = await InspectionReleaseNote.find({"site_id": site_id}).count()
        year = datetime.now().year
        irn_id = f"IRN-{year}-{count + 1:04d}"
        irn = InspectionReleaseNote(irn_id=irn_id, site_id=site_id, **{
            k: v for k, v in data.items()
            if k in InspectionReleaseNote.model_fields and k not in ("irn_id", "site_id")
        })
        await irn.insert()
        await audit(AuditAction.CREATE, "release_note", irn_id, user_id, site_id, after=irn.dict())
        return irn.dict()

    @staticmethod
    async def check_preconditions(irn_id: str, site_id: str, user_id: str):
        irn = await InspectionReleaseNote.find_one({"irn_id": irn_id, "site_id": site_id})
        if not irn:
            raise HTTPException(status_code=404, detail="Release note not found")

        # Check NCRs for this job
        all_ncrs = await NCR.find({"job_id": irn.job_id, "site_id": site_id}).to_list()
        closed_ncrs = [n for n in all_ncrs if n.status in ("closed", "verified")]
        open_ncr_ids = [n.ncr_id for n in all_ncrs if n.status not in ("closed", "verified")]
        irn.ncr_total = len(all_ncrs)
        irn.ncr_closed_count = len(closed_ncrs)
        irn.ncr_open_ids = open_ncr_ids
        irn.ncrs_closed = len(open_ncr_ids) == 0

        # Check cat A punch items
        all_punch_a = await PunchItem.find({"job_id": irn.job_id, "site_id": site_id, "category": "A"}).to_list()
        closed_a = [p for p in all_punch_a if p.status in ("closed", "waived")]
        open_a_ids = [p.punch_id for p in all_punch_a if p.status not in ("closed", "waived")]
        irn.cat_a_total = len(all_punch_a)
        irn.cat_a_closed_count = len(closed_a)
        irn.cat_a_open_ids = open_a_ids
        irn.cat_a_punch_closed = len(open_a_ids) == 0

        # Hold points — checked from RFIs with type "hold"
        from modules.rfi.models import RFI
        hold_rfis = await RFI.find({"job_id": irn.job_id, "site_id": site_id, "inspection_point_type": "hold"}).to_list()
        signed = [r for r in hold_rfis if r.status in ("inspected", "closed")]
        irn.hold_points_count = len(hold_rfis)
        irn.hold_points_signed_count = len(signed)
        irn.hold_points_signed = len(hold_rfis) == len(signed) and len(hold_rfis) > 0

        all_clear = irn.ncrs_closed and irn.cat_a_punch_closed and irn.hold_points_signed
        if all_clear:
            irn.status = "preconditions_checked"
        irn.updated_at = datetime.now()
        await irn.save()
        await audit(AuditAction.UPDATE, "release_note", irn_id, user_id, site_id, after={"preconditions_met": all_clear})
        return {**irn.dict(), "preconditions_met": all_clear}

    @staticmethod
    async def recommend(irn_id: str, site_id: str, user_id: str):
        irn = await InspectionReleaseNote.find_one({"irn_id": irn_id, "site_id": site_id})
        if not irn:
            raise HTTPException(status_code=404, detail="Release note not found")
        if irn.status != "preconditions_checked":
            raise HTTPException(status_code=400, detail="Preconditions not yet verified")
        irn.recommended_by = user_id
        irn.recommended_on = datetime.now()
        irn.status = "recommended"
        irn.updated_at = datetime.now()
        await irn.save()
        await audit(AuditAction.UPDATE, "release_note", irn_id, user_id, site_id, after={"status": "recommended"})
        return irn.dict()

    @staticmethod
    async def approve(irn_id: str, site_id: str, user_id: str):
        irn = await InspectionReleaseNote.find_one({"irn_id": irn_id, "site_id": site_id})
        if not irn:
            raise HTTPException(status_code=404, detail="Release note not found")
        if irn.status != "recommended":
            raise HTTPException(status_code=400, detail="Must be recommended by TM first")
        irn.approved_by = user_id
        irn.approved_on = datetime.now()
        irn.status = "approved"
        irn.updated_at = datetime.now()
        await irn.save()
        await audit(AuditAction.UPDATE, "release_note", irn_id, user_id, site_id, after={"status": "approved"})
        return irn.dict()

    @staticmethod
    async def release(irn_id: str, data: dict, site_id: str, user_id: str):
        irn = await InspectionReleaseNote.find_one({"irn_id": irn_id, "site_id": site_id})
        if not irn:
            raise HTTPException(status_code=404, detail="Release note not found")
        if irn.status != "approved":
            raise HTTPException(status_code=400, detail="Must be approved by Country Manager first")
        irn.released = True
        irn.release_date = datetime.now()
        irn.release_certificate_doc_id = data.get("release_certificate_doc_id")
        irn.status = "released"
        irn.updated_at = datetime.now()
        await irn.save()
        await audit(AuditAction.UPDATE, "release_note", irn_id, user_id, site_id, after={"status": "released"})
        return irn.dict()
