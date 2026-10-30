from __future__ import annotations
from datetime import datetime
from fastapi import HTTPException
from core.audit import AuditAction, record as audit
from core.sequences import next_value
from modules.job_handoff.models import JobConversion


def _financial_year_code() -> str:
    """Return a 4-char FY code (e.g. '2627' for April 2026 – March 2027)."""
    now = datetime.now()
    if now.month >= 4:
        return f"{str(now.year)[-2:]}{str(now.year + 1)[-2:]}"
    return f"{str(now.year - 1)[-2:]}{str(now.year)[-2:]}"


class JobHandoffService:

    @staticmethod
    async def convert_enquiry_to_job(data: dict, site_id: str, user_id: str):
        from modules.enquiries.models import Enquiry, EnquiryStatus
        from modules.jobs.models import Job

        enquiry_id = data.get("enquiry_id")
        enquiry = await Enquiry.find_one({"enquiry_id": enquiry_id, "site_id": site_id})
        if not enquiry:
            raise HTTPException(status_code=404, detail="Enquiry not found")
        if enquiry.status != EnquiryStatus.WON.value:
            raise HTTPException(
                status_code=400,
                detail=f"Enquiry must be in WON status, currently {enquiry.status}",
            )
        if enquiry.won_job_id:
            raise HTTPException(status_code=409, detail="Enquiry already converted")

        region_code = data.get("region_code", "S")
        fy = _financial_year_code()
        seq_key = f"{site_id}:JNO:{region_code}-{fy}"
        seq_num = await next_value(seq_key, seed=0)
        j_no = f"{region_code}-{fy}-{seq_num:04d}"

        job = Job(
            job_id=f"JOB-{j_no}",
            site_id=site_id,
            j_no=j_no,
            enquiry_id=enquiry_id,
            region_code=region_code,
            financial_year=f"20{fy[:2]}-{fy[2:]}",
            service_line=data.get("service_line", "PART_B"),
            client_id=enquiry.client_id,
            title=data.get("title", f"Job from {enquiry_id}"),
            description=data.get("description"),
            po_number=data.get("po_number"),
            budget_contract_amount=data.get("award_value", enquiry.pipeline_value),
            status="draft",
            created_by=user_id,
        )
        await job.insert()

        conversion = JobConversion(
            conversion_id=f"CNV-{j_no}",
            site_id=site_id,
            enquiry_id=enquiry_id,
            proposal_id=enquiry.current_proposal_id,
            revision_no=enquiry.current_revision_no,
            award_reference=data.get("award_reference"),
            award_date=data.get("award_date"),
            award_value=data.get("award_value", 0),
            job_id=job.job_id,
            j_no=j_no,
            converted_by=user_id,
        )
        await conversion.insert()

        enquiry.status = EnquiryStatus.CONVERTED.value
        enquiry.won_job_id = job.job_id
        enquiry.award_reference = data.get("award_reference")
        enquiry.updated_at = datetime.now()
        await enquiry.save()

        await audit(AuditAction.CREATE, "job_conversion", conversion.conversion_id, user_id, site_id)
        return {"conversion": conversion.dict(), "job": job.dict(), "j_no": j_no}

    @staticmethod
    async def list_conversions(site_id: str, page: int = 1, per_page: int = 50):
        query = {"site_id": site_id}
        total = await JobConversion.find(query).count()
        items = (
            await JobConversion.find(query)
            .sort(-JobConversion.converted_at)
            .skip((page - 1) * per_page)
            .limit(per_page)
            .to_list()
        )
        return {"total": total, "items": [i.dict() for i in items]}

    @staticmethod
    async def get_conversion(conversion_id: str, site_id: str):
        c = await JobConversion.find_one({"conversion_id": conversion_id, "site_id": site_id})
        if not c:
            raise HTTPException(status_code=404, detail="Conversion not found")
        return c.dict()
