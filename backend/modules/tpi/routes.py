import logging
import os
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form, Response

logger = logging.getLogger("tpi.pdf")
from modules.tpi.schemas import (
    CreateReportRequest,
    UpdateReportRequest,
    SignReportRequest,
)
from modules.tpi import service
from app.pdf.service import render_pdf
from modules.tpi.models import TpiPhoto

router = APIRouter(prefix="/api/tpi", tags=["TPI Forms"])


@router.post("/{form_code}")
async def create_draft_report(form_code: str, req: CreateReportRequest):
    return await service.create_draft(form_code, req)


@router.get("/blank/{form_code}.pdf")
async def get_blank_pdf(form_code: str):
    code = form_code.upper().replace("IQE-", "").replace("-", "").replace(".PDF", "")
    try:
        pdf_bytes = render_pdf(code, payload={}, is_blank=True, is_draft=False)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename={form_code}_Blank.pdf"}
        )
    except Exception as e:
        logger.exception("Failed to generate blank PDF for %s", form_code)
        raise HTTPException(status_code=500, detail=f"Failed to generate blank PDF: {str(e)}")


@router.get("/preview/{form_code}.pdf")
async def get_preview_pdf(form_code: str):
    code = form_code.upper().replace("IQE-", "").replace("-", "").replace(".PDF", "")
    try:
        pdf_bytes = render_pdf(code, payload={}, is_blank=True, is_draft=False)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename={form_code}_Controlled.pdf"}
        )
    except Exception as e:
        logger.exception("Failed to generate preview PDF for %s", form_code)
        raise HTTPException(status_code=500, detail=f"Failed to generate preview PDF: {str(e)}")


@router.post("/render/{form_code}.pdf")
async def render_live_pdf_post(form_code: str, payload: dict = {}):
    code = form_code.upper().replace("IQE-", "").replace("-", "").replace(".PDF", "")
    try:
        pdf_bytes = render_pdf(code, payload=payload, is_blank=False, is_draft=False)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename={form_code}.pdf"}
        )
    except Exception as e:
        logger.exception("Failed to render live PDF for %s", form_code)
        raise HTTPException(status_code=500, detail=f"Failed to render live PDF: {str(e)}")


@router.get("/report/{id}")
async def get_report_by_id(id: str):
    report = await service.get_report(id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.put("/report/{id}")
async def update_report(id: str, req: UpdateReportRequest):
    report, warnings = await service.update_draft(id, req)
    return {"report": report, "warnings": warnings}


@router.post("/report/{id}/submit")
async def submit_report(id: str):
    return await service.submit_report(id)


@router.post("/report/{id}/sign")
async def sign_report(id: str, req: SignReportRequest):
    return await service.sign_report(id, req)


@router.post("/report/{id}/issue")
async def issue_report(id: str):
    return await service.issue_report(id)


@router.get("/report/{id}/pdf")
async def get_report_pdf(id: str, draft: bool = True):
    report = await service.get_report(id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    is_draft = draft and (report.status != "ISSUED")
    try:
        from core.qr import verify_url
        qr_url = verify_url(
            title=f"{report.form_code} Inspection Report",
            ref=report.report_no or "",
            form=report.form_code,
            status=str(report.status),
            pdf_path=f"/api/tpi/report/{id}/pdf?draft={str(draft).lower()}",
        )
        pdf_bytes = render_pdf(report.form_code, report.data, is_blank=False, is_draft=is_draft, qr_url=qr_url)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename={report.report_no}.pdf"}
        )
    except Exception as e:
        logger.exception("Failed to render PDF for report %s", id)
        raise HTTPException(status_code=500, detail=f"Failed to render PDF: {str(e)}")


@router.post("/report/{id}/photos")
async def upload_photo(
    id: str,
    file: UploadFile = File(...),
    slot: int = Form(1),
    caption: str = Form(""),
):
    report = await service.get_report(id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    media_dir = "backend/media/photos"
    os.makedirs(media_dir, exist_ok=True)
    filename = f"{report.id}_slot_{slot}_{file.filename}"
    file_path = os.path.join(media_dir, filename)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    photo_url = f"/media/photos/{filename}"
    photo = TpiPhoto(slot=slot, url=photo_url, caption=caption)
    report.photos.append(photo)

    # Also update data.photos array for PDF rendering
    report_photos = report.data.get("photos", [])
    report_photos.append({"slot": slot, "url": photo_url, "caption": caption})
    report.data["photos"] = report_photos

    await report.save()
    return {"message": "Photo uploaded", "photo": photo}


@router.post("/report/{id}/promote")
async def promote_tp02(id: str):
    return await service.promote_tp02_to_tp03(id)


@router.get("/{form_code}")
async def list_reports(
    form_code: str,
    project_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    supplier: Optional[str] = Query(None),
    po_no: Optional[str] = Query(None),
):
    return await service.list_reports(
        form_code=form_code,
        project_id=project_id,
        status=status,
        supplier=supplier,
        po_no=po_no,
    )
