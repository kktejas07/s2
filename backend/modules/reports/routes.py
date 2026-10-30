from fastapi import APIRouter, Depends, Response
from core.auth import get_current_user
from modules.reports.service import ReportService

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/visits")
async def visit_report(from_date: str = "", to_date: str = "", client_id: str = "",
                      status: str = "", engineer_id: str = "",
                      page: int = 1, per_page: int = 50, user: dict = Depends(get_current_user)):
    return await ReportService.visit_report(user["site_id"], from_date, to_date, client_id, status, engineer_id, page, per_page)


@router.get("/expenses")
async def expense_report(from_date: str = "", to_date: str = "",
                         page: int = 1, per_page: int = 50, user: dict = Depends(get_current_user)):
    return await ReportService.expense_report(user["site_id"], from_date, to_date, page, per_page)


@router.get("/invoices")
async def invoice_report(from_date: str = "", to_date: str = "", status: str = "",
                         page: int = 1, per_page: int = 50, user: dict = Depends(get_current_user)):
    return await ReportService.invoice_report(user["site_id"], from_date, to_date, status, page, per_page)


@router.get("/pdf/tpi-billing")
async def export_tpi_billing_pdf(site_id: str = "SITE-01", disposition: str = "inline"):
    pdf_bytes = await ReportService.generate_tpi_billing_pdf(site_id)
    disp = "attachment" if disposition == "attachment" else "inline"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'{disp}; filename="IQE_TPI_Billing_Report.pdf"'}
    )


@router.get("/pdf/tpi-billing-item")
async def export_tpi_single_item_pdf(
    boq_item: str = "1.01",
    ra_bill: str = "RA-001",
    vendor: str = "Quality Engineers (I) Pvt Ltd",
    client: str = "Granules India",
    description: str = "Pipe Installation",
    unit: str = "MT",
    drawing_ref: str = "GFC-001",
    boq_qty: float = 1.0,
    claimed_qty: float = 1.0,
    verified_qty: float = 1.0,
    unit_rate: float = 50000.0,
    observation: str = "Verified",
    closure_status: str = "Closed",
    is_locked: bool = False,
    disposition: str = "inline"
):
    pdf_bytes = await ReportService.generate_tpi_single_item_pdf(
        boq_item=boq_item,
        ra_bill=ra_bill,
        vendor=vendor,
        client=client,
        description=description,
        unit=unit,
        drawing_ref=drawing_ref,
        boq_qty=boq_qty,
        claimed_qty=claimed_qty,
        verified_qty=verified_qty,
        unit_rate=unit_rate,
        observation=observation,
        closure_status=closure_status,
        is_locked=is_locked
    )
    disp = "attachment" if disposition == "attachment" else "inline"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'{disp}; filename="IQE_BOQ_Item_{boq_item.replace(".", "_")}_Precision_Report.pdf"'}
    )


@router.get("/pdf/analytics")
async def export_analytics_pdf(site_id: str = "SITE-01", disposition: str = "inline"):
    pdf_bytes = await ReportService.generate_analytics_pdf(site_id)
    disp = "attachment" if disposition == "attachment" else "inline"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'{disp}; filename="IQE_System_Analytics_Report.pdf"'}
    )


@router.get("/pdf/quality-bill-verification")
async def export_quality_bill_verification_pdf(site_id: str = "SITE-01", disposition: str = "inline"):
    pdf_bytes = await ReportService.generate_quality_bill_verification_pdf(site_id)
    disp = "attachment" if disposition == "attachment" else "inline"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'{disp}; filename="ISO17020_Quality_Bill_Verification_Report.pdf"'}
    )


@router.get("/pdf/boq-reconciliation")
async def export_boq_reconciliation_pdf(site_id: str = "SITE-01", disposition: str = "inline"):
    pdf_bytes = await ReportService.generate_boq_reconciliation_pdf(site_id)
    disp = "attachment" if disposition == "attachment" else "inline"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'{disp}; filename="F_BOQ_01_BOQ_Reconciliation_Audit_Report.pdf"'}
    )


@router.get("/pdf/schedule-m-pharma-epc")
async def export_schedule_m_pdf(site_id: str = "SITE-01", disposition: str = "inline"):
    pdf_bytes = await ReportService.generate_schedule_m_pdf(site_id)
    disp = "attachment" if disposition == "attachment" else "inline"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'{disp}; filename="Schedule_M_Pharma_EPC_Audit_Report.pdf"'}
    )


@router.get("/docx/quality-bill-verification")
async def export_quality_bill_verification_docx(site_id: str = "SITE-01"):
    docx_bytes = await ReportService.generate_quality_bill_verification_docx(site_id)
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": 'attachment; filename="ISO17020_Quality_Bill_Verification_Report.docx"'}
    )


@router.get("/excel/quality-bill-verification")
async def export_quality_bill_verification_excel(site_id: str = "SITE-01"):
    xlsx_bytes = await ReportService.generate_quality_bill_verification_xlsx(site_id)
    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="ISO17020_Quality_Bill_Verification_Report.xlsx"'}
    )


@router.get("/docx/tpi-billing")
async def export_tpi_billing_docx(site_id: str = "SITE-01"):
    docx_bytes = await ReportService.generate_tpi_billing_docx(site_id)
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": 'attachment; filename="IQE_TPI_Billing_Report.docx"'}
    )


@router.get("/excel/tpi-billing")
async def export_tpi_billing_excel(site_id: str = "SITE-01"):
    xlsx_bytes = await ReportService.generate_tpi_billing_xlsx(site_id)
    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="IQE_TPI_Billing_Report.xlsx"'}
    )


@router.get("/docx/tpi-billing-item")
async def export_tpi_single_item_docx(boq_item: str = "1.01"):
    docx_bytes = await ReportService.generate_tpi_single_item_docx(boq_item=boq_item)
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="IQE_Item_{boq_item.replace(".", "_")}.docx"'}
    )


@router.get("/excel/tpi-billing-item")
async def export_tpi_single_item_excel(boq_item: str = "1.01"):
    xlsx_bytes = await ReportService.generate_tpi_single_item_xlsx(boq_item=boq_item)
    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="IQE_Item_{boq_item.replace(".", "_")}.xlsx"'}
    )




# Inspection formats opened from the web pages' "PDF" buttons. They render the
# controlled TP-02..TP-05 templates (with the scan-to-verify QR in the header).
_INSPECTION_FORMS = {
    "flash-inspection-report": ("TP02", "IQE_Flash_Inspection_Report.pdf"),
    "inspection-visit-report": ("TP03", "IQE_Inspection_Visit_Report.pdf"),
    "inspection-release-note": ("TP04", "IQE_Inspection_Release_Note.pdf"),
    "expediting-visit-report": ("TP05", "IQE_Expediting_Visit_Report.pdf"),
}


def _inspection_pdf_response(form_code: str, filename: str, disposition: str) -> Response:
    from app.pdf.service import render_pdf

    disp = "attachment" if disposition == "attachment" else "inline"
    return Response(
        content=render_pdf(form_code, payload={}),
        media_type="application/pdf",
        headers={"Content-Disposition": f'{disp}; filename="{filename}"'},
    )


@router.get("/pdf/{report_slug}")
async def export_inspection_form_pdf(report_slug: str, disposition: str = "inline"):
    from fastapi import HTTPException

    if report_slug not in _INSPECTION_FORMS:
        raise HTTPException(status_code=404, detail=f"Unknown report: {report_slug}")
    form_code, filename = _INSPECTION_FORMS[report_slug]
    return _inspection_pdf_response(form_code, filename, disposition)
