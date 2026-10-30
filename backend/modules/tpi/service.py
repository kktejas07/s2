from __future__ import annotations
import uuid
import datetime
from typing import Optional, List, Dict, Any, Tuple
from fastapi import HTTPException
from modules.tpi.models import TpiReport, TpiPhoto, TpiSignature
from modules.tpi.schemas import (
    CreateReportRequest,
    UpdateReportRequest,
    SignReportRequest,
)
from app.pdf.service import render_pdf, render_html


async def generate_report_number(form_code: str) -> str:
    year = datetime.datetime.utcnow().year
    code_formatted = form_code.upper().replace("IQE-", "").replace("-", "")
    prefix = f"IQE-{code_formatted}-{year}-"
    count = await TpiReport.find({"report_no": {"$regex": f"^{prefix}"}}).count()
    return f"{prefix}{str(count + 1).zfill(4)}"


def compute_balance_quantities(data: Dict[str, Any]) -> Dict[str, Any]:
    """Auto-computes balance_qty = po_qty - prev_released - current_released for TP-04 if not overridden."""
    items = data.get("release_items", [])
    if isinstance(items, list):
        for it in items:
            if isinstance(it, dict) and it.get("balance_qty") is None:
                po = float(it.get("po_qty") or 0.0)
                prev = float(it.get("prev_released") or 0.0)
                curr = float(it.get("current_released") or 0.0)
                it["balance_qty"] = max(0.0, po - prev - curr)
    return data


def validate_report_data(form_code: str, data: Dict[str, Any]) -> List[str]:
    """Validates report rules and generates non-blocking warnings."""
    warnings = []
    code = form_code.upper().replace("IQE-", "").replace("-", "")

    # Quantity checks: accepted <= inspected <= offered <= po
    item_key = "release_items" if code == "TP04" else "items"
    items = data.get(item_key, [])
    if isinstance(items, list):
        for idx, item in enumerate(items):
            if isinstance(item, dict):
                po = float(item.get("po_qty") or 0)
                offered = float(item.get("offered_qty") or 0)
                inspected = float(item.get("inspected_qty") or 0)
                accepted = float(item.get("accepted_qty") or 0)

                if offered > po > 0:
                    warnings.append(f"Row {idx+1}: Offered quantity ({offered}) exceeds PO quantity ({po})")
                if inspected > offered > 0:
                    warnings.append(f"Row {idx+1}: Inspected quantity ({inspected}) exceeds offered quantity ({offered})")
                if accepted > inspected > 0:
                    warnings.append(f"Row {idx+1}: Accepted quantity ({accepted}) exceeds inspected quantity ({inspected})")

    return warnings


async def create_draft(form_code: str, req: CreateReportRequest) -> TpiReport:
    code = form_code.upper().replace("IQE-", "").replace("-", "")
    report_no = await generate_report_number(code)

    payload = dict(req.data or {})
    payload["report_no"] = report_no
    payload["customer"] = req.customer or payload.get("customer", "")
    payload["supplier"] = req.supplier or payload.get("supplier", "")
    payload["po_no"] = req.po_no or payload.get("po_no", "")

    if code == "TP04":
        payload = compute_balance_quantities(payload)

    report = TpiReport(
        form_code=code,
        report_no=report_no,
        revision="00",
        status="DRAFT",
        project_id=req.project_id,
        customer=payload["customer"],
        supplier=payload["supplier"],
        po_no=payload["po_no"],
        data=payload,
    )
    await report.insert()
    return report


async def get_report(report_id: str) -> Optional[TpiReport]:
    return await TpiReport.get(report_id)


async def list_reports(
    form_code: Optional[str] = None,
    project_id: Optional[str] = None,
    status: Optional[str] = None,
    supplier: Optional[str] = None,
    po_no: Optional[str] = None,
) -> List[TpiReport]:
    query: Dict[str, Any] = {}
    if form_code:
        query["form_code"] = form_code.upper().replace("IQE-", "").replace("-", "")
    if project_id:
        query["project_id"] = project_id
    if status:
        query["status"] = status
    if supplier:
        query["supplier"] = {"$regex": supplier, "$options": "i"}
    if po_no:
        query["po_no"] = {"$regex": po_no, "$options": "i"}

    return await TpiReport.find(query).sort("-created_at").to_list()


async def update_draft(report_id: str, req: UpdateReportRequest) -> Tuple[TpiReport, List[str]]:
    report = await TpiReport.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="TPI Report not found")
    if report.status != "DRAFT":
        raise HTTPException(status_code=400, detail="Only DRAFT reports can be modified")

    updated_data = dict(req.data)
    # Ensure report_no remains consistent
    updated_data["report_no"] = report.report_no

    if report.form_code == "TP04":
        updated_data = compute_balance_quantities(updated_data)

    warnings = validate_report_data(report.form_code, updated_data)

    report.data = updated_data
    if req.customer:
        report.customer = req.customer
    if req.supplier:
        report.supplier = req.supplier
    if req.po_no:
        report.po_no = req.po_no
    report.updated_at = datetime.datetime.utcnow()

    await report.save()
    return report, warnings


async def submit_report(report_id: str) -> TpiReport:
    report = await TpiReport.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="TPI Report not found")

    data = report.data or {}
    # Validation checks before submit
    if not data.get("customer") or not data.get("supplier"):
        raise HTTPException(status_code=400, detail="Customer and Supplier are mandatory for submit")

    if report.form_code == "TP02" and not data.get("outcome"):
        raise HTTPException(status_code=400, detail="Inspection outcome is required for TP-02")
    if report.form_code == "TP03" and not data.get("status"):
        raise HTTPException(status_code=400, detail="Inspection status is required for TP-03")
    if report.form_code == "TP04":
        if not data.get("release_decision") or not data.get("release_type"):
            raise HTTPException(status_code=400, detail="Release decision and release type are required for TP-04")
        # Check referenced TP-03 reports
        if data.get("release_decision") == "RELEASED FOR DISPATCH":
            refs = data.get("report_refs", [])
            for r in refs:
                ref_no = r.get("report_no")
                if ref_no:
                    linked = await TpiReport.find_one({"report_no": ref_no})
                    if linked and linked.data.get("status") in ["NOT ACCEPTED", "HOLD / RE-INSPECTION REQUIRED"]:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Cannot release for dispatch: referenced report {ref_no} is marked {linked.data.get('status')}"
                        )
    if report.form_code == "TP05" and data.get("overall_completion_pct") is None:
        raise HTTPException(status_code=400, detail="Overall completion % is required for TP-05")

    report.status = "SUBMITTED"
    report.updated_at = datetime.datetime.utcnow()
    await report.save()
    return report


async def sign_report(report_id: str, req: SignReportRequest) -> TpiReport:
    report = await TpiReport.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="TPI Report not found")

    sig = TpiSignature(
        party=req.party,
        name=req.name,
        designation=req.designation,
        signature_image_url=req.signature_image_url,
        stamp_image_url=req.stamp_image_url,
    )
    report.signatures.append(sig)

    # Update data dictionary for PDF rendering
    sigs = report.data.get("signatures", {})
    if req.party == "SUPPLIER":
        sigs["supplier_name"] = req.name
        sigs["supplier_designation"] = req.designation
        sigs["supplier_sig_img"] = req.signature_image_url
        sigs["supplier_stamp_img"] = req.stamp_image_url
        sigs["supplier_date"] = datetime.datetime.utcnow().strftime("%Y-%m-%d")
    else:
        sigs["iqe_name"] = req.name
        sigs["iqe_inspector"] = req.name
        sigs["iqe_sig_img"] = req.signature_image_url
        sigs["iqe_stamp_img"] = req.stamp_image_url
        sigs["iqe_date"] = datetime.datetime.utcnow().strftime("%Y-%m-%d")
    report.data["signatures"] = sigs

    # If both parties have signed, update status to SIGNED
    parties = {s.party for s in report.signatures}
    if "SUPPLIER" in parties and "IQE" in parties:
        report.status = "SIGNED"

    report.updated_at = datetime.datetime.utcnow()
    await report.save()
    return report


async def issue_report(report_id: str) -> TpiReport:
    report = await TpiReport.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="TPI Report not found")

    # Generate final immutable PDF
    pdf_bytes = render_pdf(report.form_code, report.data, is_blank=False, is_draft=False)

    # Save to local storage
    media_dir = "backend/media/tpi_pdfs"
    import os
    os.makedirs(media_dir, exist_ok=True)
    pdf_filename = f"{report.report_no}_Rev{report.revision}.pdf"
    pdf_path = os.path.join(media_dir, pdf_filename)
    with open(pdf_path, "wb") as f:
        f.write(pdf_bytes)

    report.status = "ISSUED"
    report.issued_at = datetime.datetime.utcnow()
    report.pdf_url = f"/media/tpi_pdfs/{pdf_filename}"
    report.updated_at = datetime.datetime.utcnow()
    await report.save()
    return report


async def promote_tp02_to_tp03(report_id: str) -> TpiReport:
    """Promotes a Flash Inspection Report (TP-02) to an Inspection Visit Report (TP-03)."""
    tp02 = await TpiReport.get(report_id)
    if not tp02 or tp02.form_code != "TP02":
        raise HTTPException(status_code=404, detail="Valid TP-02 Flash Report not found")

    new_report_no = await generate_report_number("TP03")
    old_data = tp02.data or {}

    tp03_data: Dict[str, Any] = {
        "report_no": new_report_no,
        "inspection_date": old_data.get("date"),
        "report_date": datetime.datetime.utcnow().strftime("%Y-%m-%d"),
        "rfi_no_and_date": old_data.get("rfi_ref_and_date"),
        "inspection_stage": old_data.get("inspection_stage", "Stage"),
        "location": old_data.get("location"),
        "customer": old_data.get("customer"),
        "project": old_data.get("project"),
        "supplier": old_data.get("supplier"),
        "sub_supplier": old_data.get("sub_supplier"),
        "po_no_and_date": old_data.get("po_no_and_date"),
        "inspector": old_data.get("inspector"),
        "items": [],
        "findings": [],
        "punch_list": [],
        "status": "ACCEPTED" if old_data.get("outcome") == "SATISFACTORY" else "ACCEPTED WITH COMMENTS",
        "conclusion": old_data.get("remarks"),
    }

    # Map items
    for it in old_data.get("items", []):
        tp03_data["items"].append({
            "sl_no": it.get("item", 1),
            "description": it.get("description", ""),
            "tag_no": it.get("tag_no", ""),
            "po_qty": it.get("po_qty"),
            "offered_qty": it.get("offered_qty"),
            "inspected_qty": it.get("inspected_qty"),
            "accepted_qty": it.get("accepted_qty"),
            "rejected_qty": 0.0,
            "remarks": it.get("remarks", ""),
        })

    # Map findings to punch list
    for f in old_data.get("findings", []):
        tp03_data["punch_list"].append({
            "sl_no": f.get("sl_no", 1),
            "observation": f.get("finding", ""),
            "reference": f.get("reference", ""),
            "action": f.get("action", ""),
            "status": "Open",
        })

    tp03 = TpiReport(
        form_code="TP03",
        report_no=new_report_no,
        revision="00",
        status="DRAFT",
        project_id=tp02.project_id,
        customer=tp03_data["customer"],
        supplier=tp03_data["supplier"],
        po_no=tp03_data.get("po_no_and_date"),
        data=tp03_data,
    )
    await tp03.insert()
    return tp03
