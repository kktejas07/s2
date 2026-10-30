from fastapi import APIRouter, Response, Query
from modules.construction_bill_verification.service import ConstructionBillVerificationService

router = APIRouter(prefix="/construction-bill-verification", tags=["Construction Bill Verification"])


@router.get("/abstract")
async def get_construction_abstract(site_id: str = "SITE-MUDIGONDA-01"):
    return ConstructionBillVerificationService.get_abstract(site_id)


@router.get("/reconciliation-audit")
async def get_reconciliation_audit(site_id: str = "SITE-MUDIGONDA-01"):
    return ConstructionBillVerificationService.get_reconciliation_audit(site_id)


@router.get("/reconciliation-audit/", include_in_schema=False)
async def get_reconciliation_audit_slash(site_id: str = "SITE-MUDIGONDA-01"):
    return ConstructionBillVerificationService.get_reconciliation_audit(site_id)


@router.get("/steel")
async def get_steel_ledger(site_id: str = "SITE-MUDIGONDA-01"):
    return ConstructionBillVerificationService.get_steel_ledger(site_id)


@router.get("/waybills")
async def get_waybills(site_id: str = "SITE-MUDIGONDA-01"):
    return ConstructionBillVerificationService.get_waybills(site_id)


@router.get("/daily-logs")
async def get_daily_logs(site_id: str = "SITE-MUDIGONDA-01"):
    return ConstructionBillVerificationService.get_daily_logs(site_id)


@router.post("/parse-waybill")
async def parse_waybill(slip_type: str = "steel_tmt"):
    return ConstructionBillVerificationService.parse_weighbridge_slip(slip_type)


@router.post("/parse-waybill/", include_in_schema=False)
async def parse_waybill_slash(slip_type: str = "steel_tmt"):
    return ConstructionBillVerificationService.parse_weighbridge_slip(slip_type)



@router.get("/export/pdf")
async def export_construction_pdf(site_id: str = "SITE-MUDIGONDA-01", disposition: str = "inline"):
    pdf_bytes = await ConstructionBillVerificationService.generate_pdf_report(site_id)
    disp = "attachment" if disposition == "attachment" else "inline"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'{disp}; filename="Construction_Company_Bill_Verification_Report_{site_id}.pdf"'}
    )


@router.get("/export/excel")
async def export_construction_excel(site_id: str = "SITE-MUDIGONDA-01"):
    xlsx_bytes = await ConstructionBillVerificationService.generate_excel_report(site_id)
    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="Mudigonda_CHC_Daily_Material_Report_{site_id}.xlsx"'}
    )


@router.get("/export/docx")
async def export_construction_docx(site_id: str = "SITE-MUDIGONDA-01"):
    docx_bytes = await ConstructionBillVerificationService.generate_docx_report(site_id)
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="Construction_Company_Bill_Verification_Report_{site_id}.docx"'}
    )
