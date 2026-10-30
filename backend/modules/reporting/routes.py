from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.responses import Response

from core.auth import get_current_user
from modules.reporting.service import ReportingService

router = APIRouter(prefix="/reporting", tags=["Reporting"])


@router.get("/formats")
async def list_formats(
    work_type_code: str = "",
    kind: str = "",
    is_active: Optional[bool] = True,
    user: dict = Depends(get_current_user),
):
    return await ReportingService.list_formats(
        user.get("site_id", "SITE-01"), work_type_code, kind, is_active
    )


@router.post("/formats/seed")
async def seed_formats(user: dict = Depends(get_current_user)):
    """Load the standard format registry. Idempotent per site."""
    return await ReportingService.seed_formats(user.get("site_id", "SITE-01"))


@router.get("/formats/for-work-type/{work_type_code}")
async def formats_for_work_type(work_type_code: str, user: dict = Depends(get_current_user)):
    """Which reports a package of this work type can produce."""
    return await ReportingService.formats_for_work_type(
        work_type_code, user.get("site_id", "SITE-01")
    )


@router.get("/formats/{format_code}")
async def get_format(format_code: str, user: dict = Depends(get_current_user)):
    return await ReportingService.get_format(format_code, user.get("site_id", "SITE-01"))


@router.get("/project-report/{job_id}")
async def project_report(job_id: str, user: dict = Depends(get_current_user)):
    """End-to-end project report, composed from the execution spine."""
    return await ReportingService.project_report(job_id, user.get("site_id", "SITE-01"))


@router.post("/sync-renderer")
async def sync_renderer(user: dict = Depends(get_current_user)):
    """Push the registry into the PDF renderer. Runs at startup; exposed here
    so a format change can take effect without a restart."""
    return await ReportingService.sync_renderer(user.get("site_id", "SITE-01"))


@router.post("/formats/{format_code}/client-override")
async def create_client_override(
    format_code: str,
    client_id: str,
    overrides: dict = Body(default={}),
    user: dict = Depends(get_current_user),
):
    """Register a client's own layout for a standard format.

    Set only what differs; everything else inherits from the parent, so a
    later change to the standard format reaches this variant too.
    """
    fmt = await ReportingService.create_client_override(
        format_code, client_id, overrides, user.get("site_id", "SITE-01")
    )
    return fmt.model_dump(exclude={"id"})


@router.get("/formats/{format_code}/pdf")
async def format_pdf(
    format_code: str,
    client_id: str = "",
    blank: bool = True,
    entity_type: str = "",
    entity_id: str = "",
    user: dict = Depends(get_current_user),
):
    """The format rendered as a PDF - blank by default, which is the pro forma
    an inspector prints and fills by hand."""
    from app.pdf.service import render_pdf

    site_id = user.get("site_id", "SITE-01")
    await ReportingService.sync_renderer(site_id)

    payload: dict = {}
    # A format rendered against a real record carries that record's evidence.
    if not blank and entity_type and entity_id:
        from modules.evidence.service import EvidenceService

        payload["photos"] = await EvidenceService.photos_for_report(
            entity_type, entity_id, site_id
        )

    try:
        pdf = render_pdf(format_code, payload=payload, is_blank=blank,
                         client_id=client_id or None)
    except ValueError as e:
        raise HTTPException(404, str(e))

    name = f"{format_code}{'-' + client_id if client_id else ''}.pdf"
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{name}"'},
    )


@router.get("/project-report/{job_id}/pdf")
async def project_report_pdf(
    job_id: str,
    client_id: str = "",
    user: dict = Depends(get_current_user),
):
    """The end-to-end project report as a PDF, composed from live records."""
    from app.pdf.service import render_pdf

    site_id = user.get("site_id", "SITE-01")
    report = await ReportingService.project_report(job_id, site_id)
    await ReportingService.sync_renderer(site_id)

    # Photographs the inspectors actually captured, so the annexure is the
    # evidence rather than an empty grid.
    from modules.evidence.service import EvidenceService

    report["photos"] = await EvidenceService.photos_for_report("job", job_id, site_id)
    pdf = render_pdf("PROJECT_REPORT", payload=report, client_id=client_id or None)

    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="project-report-{job_id}.pdf"'},
    )
