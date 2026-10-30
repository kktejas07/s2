from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict, Any
from datetime import datetime

from modules.schedule_m_pharma_epc.models import (
    ScheduleMPharmaEPCProject,
    ScheduleMChecklistItem,
    ScheduleMRequirementsRegister,
    ScheduleMRFIRegister,
    ScheduleMURSTraceability,
    ScheduleMExpertGap,
    ScheduleMTechnicalBenchmark,
    ScheduleMRedFlagCheck,
    ScheduleMQuantityMeasurement,
    ScheduleMBOQReconciliation,
    ScheduleMRABillReview,
    ScheduleMNCRCAPA,
    ScheduleMChangeRegister,
    ScheduleMCalibration,
    ScheduleMPunchList,
    ScheduleMTurnoverDossier,
    ScheduleMInspectionReport,
)
from modules.schedule_m_pharma_epc.service import seed_schedule_m_pharma_epc_project

router = APIRouter(tags=["Schedule M Pharma EPC"])


@router.get("/schedule-m-pharma-epc/project")
async def get_project():
    """Get active Schedule M Pharma EPC project data or auto-seed if none exists."""
    project = await ScheduleMPharmaEPCProject.find_one(
        ScheduleMPharmaEPCProject.project_id == "PRJ-SCH-M-2026-01"
    )
    if not project or not project.checklists or len(project.checklists) < 50:
        project = await seed_schedule_m_pharma_epc_project()
    return project


@router.post("/schedule-m-pharma-epc/seed")
async def trigger_seed():
    """Re-seed active project with full Rev 1 Excel and Expert Review Docx data."""
    project = await seed_schedule_m_pharma_epc_project()
    return {
        "status": "success",
        "message": "Schedule M Pharma EPC Project template upgraded & re-seeded with 191 checklists, 12 requirements, 10 red flags, and 14 expert gaps",
        "project_id": project.project_id,
        "total_checklists": len(project.checklists),
        "total_requirements": len(project.requirements_registers),
    }


@router.put("/schedule-m-pharma-epc/checklists/{item_id}")
async def update_checklist_item(
    item_id: str,
    status: Optional[str] = None,
    result_code: Optional[str] = None,
    severity: Optional[str] = None,
    comments: Optional[str] = None,
    evidence_ref: Optional[str] = None,
    ncr_id: Optional[str] = None,
):
    project = await get_project()
    updated = False
    for item in project.checklists:
        if item.item_id == item_id:
            if status is not None:
                item.status = status
                if status == "PASS":
                    item.result_code = "C"
                elif status == "FAIL":
                    item.result_code = "NC"
                elif status == "NA":
                    item.result_code = "NA"
                elif status == "PENDING":
                    item.result_code = "PND"
            if result_code is not None:
                item.result_code = result_code
                if result_code == "C":
                    item.status = "PASS"
                elif result_code == "NC":
                    item.status = "FAIL"
                elif result_code == "NA":
                    item.status = "NA"
                elif result_code == "PND":
                    item.status = "PENDING"
            if severity is not None:
                item.severity = severity
            if comments is not None:
                item.comments = comments
            if evidence_ref is not None:
                item.evidence_ref = evidence_ref
            if ncr_id is not None:
                item.ncr_id = ncr_id
            updated = True
            break
    if not updated:
        raise HTTPException(status_code=404, detail=f"Checklist item {item_id} not found")

    # Recalculate compliance score
    total = len(project.checklists)
    passed = sum(1 for c in project.checklists if c.status == "PASS")
    project.schedule_m_compliance_score = round((passed / total * 100), 1) if total > 0 else 100.0
    project.updated_at = datetime.now()
    await project.save()
    return {
        "status": "success",
        "item_id": item_id,
        "new_compliance_score": project.schedule_m_compliance_score,
    }


@router.put("/schedule-m-pharma-epc/requirements/{req_id}")
async def update_requirement(
    req_id: str,
    compliance_status: Optional[str] = None,
    applicability: Optional[str] = None,
    rationale: Optional[str] = None,
):
    project = await get_project()
    updated = False
    for r in project.requirements_registers:
        if r.req_id == req_id:
            if compliance_status is not None:
                r.compliance_status = compliance_status
            if applicability is not None:
                r.applicability = applicability
            if rationale is not None:
                r.rationale = rationale
            updated = True
            break
    if not updated:
        raise HTTPException(status_code=404, detail=f"Requirement {req_id} not found")
    project.updated_at = datetime.now()
    await project.save()
    return {"status": "success", "req_id": req_id}


@router.post("/schedule-m-pharma-epc/rfis")
async def add_rfi(entry: ScheduleMRFIRegister):
    project = await get_project()
    project.rfi_registers.append(entry)
    project.updated_at = datetime.now()
    await project.save()
    return {"status": "success", "entry": entry}


@router.put("/schedule-m-pharma-epc/rfis/{rfi_id}")
async def update_rfi(
    rfi_id: str,
    response: Optional[str] = None,
    status: Optional[str] = None,
):
    project = await get_project()
    updated = False
    for r in project.rfi_registers:
        if r.rfi_id == rfi_id:
            if response is not None:
                r.response = response
            if status is not None:
                r.status = status
                if status == "CLOSED":
                    r.closed_date = datetime.now().strftime("%Y-%m-%d")
            updated = True
            break
    if not updated:
        raise HTTPException(status_code=404, detail=f"RFI {rfi_id} not found")
    project.updated_at = datetime.now()
    await project.save()
    return {"status": "success", "rfi_id": rfi_id}


@router.put("/schedule-m-pharma-epc/urs-traceability/{urs_id}")
async def update_urs_traceability(
    urs_id: str,
    finding: Optional[str] = None,
    risk: Optional[str] = None,
    compliance_status: Optional[str] = None,
):
    project = await get_project()
    updated = False
    for u in project.urs_traceabilities:
        if u.urs_id == urs_id:
            if finding is not None:
                u.finding = finding
            if risk is not None:
                u.risk = risk
            if compliance_status is not None:
                u.compliance_status = compliance_status
            updated = True
            break
    if not updated:
        raise HTTPException(status_code=404, detail=f"URS Trace item {urs_id} not found")
    project.updated_at = datetime.now()
    await project.save()
    return {"status": "success", "urs_id": urs_id}


@router.put("/schedule-m-pharma-epc/red-flags/{check_id}")
async def update_red_flag_check(
    check_id: str,
    result: str,
    evidence_remarks: Optional[str] = None,
):
    project = await get_project()
    updated = False
    for rf in project.bill_red_flags:
        if rf.check_id == check_id:
            rf.result = result
            if evidence_remarks is not None:
                rf.evidence_remarks = evidence_remarks
            updated = True
            break
    if not updated:
        raise HTTPException(status_code=404, detail=f"Red flag check {check_id} not found")
    project.updated_at = datetime.now()
    await project.save()
    return {"status": "success", "check_id": check_id, "result": result}


@router.post("/schedule-m-pharma-epc/measurements")
async def add_measurement(entry: ScheduleMQuantityMeasurement):
    project = await get_project()
    if entry.length > 0 and entry.width > 0:
        if entry.height_depth > 0:
            entry.calculated_qty = round(entry.length * entry.width * entry.height_depth, 2)
        else:
            entry.calculated_qty = round(entry.length * entry.width, 2)
    entry.total_amount = round(entry.calculated_qty * entry.rate, 2)

    project.quantity_measurements.append(entry)
    project.updated_at = datetime.now()
    await project.save()
    return {"status": "success", "entry": entry}


@router.post("/schedule-m-pharma-epc/boq-reconciliation")
async def add_boq_reconciliation(entry: ScheduleMBOQReconciliation):
    project = await get_project()
    entry.revised_qty = round(entry.contract_qty + entry.approved_variation_qty, 2)
    entry.cumulative_qty = round(entry.previous_certified_qty + entry.current_measured_qty, 2)
    entry.balance_qty = round(entry.revised_qty - entry.cumulative_qty, 2)
    entry.current_value = round(entry.current_measured_qty * entry.rate, 2)
    entry.cumulative_value = round(entry.cumulative_qty * entry.rate, 2)

    project.boq_reconciliations.append(entry)
    project.updated_at = datetime.now()
    await project.save()
    return {"status": "success", "entry": entry}


@router.post("/schedule-m-pharma-epc/ra-bill-review")
async def add_ra_bill_review(entry: ScheduleMRABillReview):
    project = await get_project()
    entry.claimed_value = round(entry.claimed_qty * entry.rate, 2)
    entry.verified_value = round(entry.verified_qty * entry.rate, 2)
    entry.variance_qty = round(entry.claimed_qty - entry.verified_qty, 2)
    entry.variance_value = round(entry.claimed_value - entry.verified_value, 2)
    if entry.variance_value > 0:
        entry.status = "DISCREPANCY_FLAGGED"

    project.ra_bill_reviews.append(entry)
    project.updated_at = datetime.now()
    await project.save()
    return {"status": "success", "entry": entry}


@router.post("/schedule-m-pharma-epc/ncrs")
async def add_ncr(entry: ScheduleMNCRCAPA):
    project = await get_project()
    project.ncr_capas.append(entry)
    project.updated_at = datetime.now()
    await project.save()
    return {"status": "success", "entry": entry}


@router.put("/schedule-m-pharma-epc/ncrs/{ncr_id}")
async def update_ncr(
    ncr_id: str,
    status: str,
    severity: Optional[str] = None,
    corrective_action: Optional[str] = None,
    containment: Optional[str] = None,
):
    project = await get_project()
    updated = False
    for item in project.ncr_capas:
        if item.ncr_id == ncr_id:
            item.status = status
            if severity:
                item.severity = severity
            if corrective_action:
                item.corrective_action = corrective_action
            if containment:
                item.containment = containment
            if status == "CLOSED":
                item.reinspection_date = datetime.now().strftime("%Y-%m-%d")
            updated = True
            break
    if not updated:
        raise HTTPException(status_code=404, detail=f"NCR {ncr_id} not found")
    project.updated_at = datetime.now()
    await project.save()
    return {"status": "success", "ncr_id": ncr_id, "new_status": status}


@router.post("/schedule-m-pharma-epc/punch-items")
async def add_punch_item(entry: ScheduleMPunchList):
    project = await get_project()
    project.punch_lists.append(entry)
    project.updated_at = datetime.now()
    await project.save()
    return {"status": "success", "entry": entry}


@router.put("/schedule-m-pharma-epc/punch-items/{item_id}")
async def update_punch_item(
    item_id: str,
    status: str,
    category: Optional[str] = None,
    closure_evidence: Optional[str] = None,
):
    project = await get_project()
    updated = False
    for item in project.punch_lists:
        if item.item_id == item_id:
            item.status = status
            if category:
                item.category = category
            if closure_evidence:
                item.closure_evidence = closure_evidence
            if status == "CLOSED":
                item.verified_by_date = datetime.now().strftime("%Y-%m-%d")
            updated = True
            break
    if not updated:
        raise HTTPException(status_code=404, detail=f"Punch item {item_id} not found")
    project.updated_at = datetime.now()
    await project.save()
    return {"status": "success", "item_id": item_id, "new_status": status}


@router.post("/schedule-m-pharma-epc/calibrations")
async def add_calibration(entry: ScheduleMCalibration):
    project = await get_project()
    project.calibrations.append(entry)
    project.updated_at = datetime.now()
    await project.save()
    return {"status": "success", "entry": entry}


@router.put("/schedule-m-pharma-epc/calibrations/{instrument_id}")
async def update_calibration_status(instrument_id: str, status: str):
    project = await get_project()
    updated = False
    for c in project.calibrations:
        if c.instrument_id == instrument_id:
            c.status = status
            updated = True
            break
    if not updated:
        raise HTTPException(status_code=404, detail=f"Instrument {instrument_id} not found")
    project.updated_at = datetime.now()
    await project.save()
    return {"status": "success", "instrument_id": instrument_id, "status": status}


@router.post("/schedule-m-pharma-epc/turnover-dossiers")
async def add_turnover_dossier(entry: ScheduleMTurnoverDossier):
    project = await get_project()
    project.turnover_dossiers.append(entry)
    project.updated_at = datetime.now()
    await project.save()
    return {"status": "success", "entry": entry}


@router.put("/schedule-m-pharma-epc/turnover-dossiers/{dossier_id}")
async def update_turnover_dossier(dossier_id: str, status: str, closure_evidence: Optional[str] = None):
    project = await get_project()
    updated = False
    for t in project.turnover_dossiers:
        if t.dossier_id == dossier_id:
            t.status = status
            if closure_evidence:
                t.closure_evidence = closure_evidence
            updated = True
            break
    if not updated:
        raise HTTPException(status_code=404, detail=f"Dossier {dossier_id} not found")
    project.updated_at = datetime.now()
    await project.save()
    return {"status": "success", "dossier_id": dossier_id, "status": status}


@router.post("/schedule-m-pharma-epc/inspection-reports")
async def create_inspection_report(report: ScheduleMInspectionReport):
    project = await get_project()
    project.inspection_reports.append(report)
    project.updated_at = datetime.now()
    await project.save()
    return {"status": "success", "report": report}


@router.get("/schedule-m-pharma-epc/summary")
async def get_summary():
    project = await get_project()

    disciplines: Dict[str, Dict[str, int]] = {}
    for item in project.checklists:
        d = item.discipline
        if d not in disciplines:
            disciplines[d] = {"total": 0, "pass": 0, "fail": 0, "pending": 0}
        disciplines[d]["total"] += 1
        st = item.status.lower()
        if st in disciplines[d]:
            disciplines[d][st] += 1

    open_ncrs = sum(1 for n in project.ncr_capas if n.status == "OPEN")
    in_progress_ncrs = sum(1 for n in project.ncr_capas if n.status == "IN_PROGRESS")
    closed_ncrs = sum(1 for n in project.ncr_capas if n.status == "CLOSED")

    critical_ncrs = sum(1 for n in project.ncr_capas if n.severity.lower() == "critical" and n.status != "CLOSED")
    major_ncrs = sum(1 for n in project.ncr_capas if n.severity.lower() == "major" and n.status != "CLOSED")
    minor_ncrs = sum(1 for n in project.ncr_capas if n.severity.lower() == "minor" and n.status != "CLOSED")

    cat_a_punch = sum(1 for p in project.punch_lists if p.category == "CAT_A" and p.status == "OPEN")
    cat_b_punch = sum(1 for p in project.punch_lists if p.category == "CAT_B" and p.status == "OPEN")
    cat_c_punch = sum(1 for p in project.punch_lists if p.category == "CAT_C" and p.status == "OPEN")

    total_claimed = sum(r.claimed_value for r in project.ra_bill_reviews)
    total_verified = sum(r.verified_value for r in project.ra_bill_reviews)
    discrepancy_savings = sum(r.variance_value for r in project.ra_bill_reviews)

    red_flags_clear = sum(1 for rf in project.bill_red_flags if rf.result == "CLEAR")
    red_flags_flagged = sum(1 for rf in project.bill_red_flags if rf.result != "CLEAR")

    rfi_open = sum(1 for r in project.rfi_registers if r.status == "OPEN")
    rfi_closed = sum(1 for r in project.rfi_registers if r.status == "CLOSED")

    top_dossiers_approved = sum(1 for t in project.turnover_dossiers if t.status == "APPROVED")
    top_dossiers_total = len(project.turnover_dossiers)

    implemented_gaps = sum(1 for g in project.expert_gaps if g.status == "IMPLEMENTED")

    return {
        "project_id": project.project_id,
        "project_name": project.project_name,
        "client_name": project.client_name,
        "facility_location": project.facility_location,
        "facility_type": project.facility_type,
        "licence_authority": project.licence_authority,
        "cut_off_date": project.cut_off_date,
        "revision_no": project.revision_no,
        "compliance_score": project.schedule_m_compliance_score,
        "total_checklists": len(project.checklists),
        "total_requirements": len(project.requirements_registers),
        "checklist_discipline_breakdown": disciplines,
        "nc_severity_breakdown": {
            "critical_open": critical_ncrs,
            "major_open": major_ncrs,
            "minor_open": minor_ncrs,
            "open_total": open_ncrs + in_progress_ncrs,
            "closed_total": closed_ncrs,
            "total": len(project.ncr_capas),
        },
        "punch_summary": {
            "cat_a_open": cat_a_punch,
            "cat_b_open": cat_b_punch,
            "cat_c_open": cat_c_punch,
            "total_open": cat_a_punch + cat_b_punch + cat_c_punch,
            "total": len(project.punch_lists),
        },
        "commercial_summary": {
            "total_claimed_value": total_claimed,
            "total_verified_value": total_verified,
            "discrepancy_withheld": discrepancy_savings,
            "net_recommended_payable": total_verified,
        },
        "red_flag_summary": {
            "total": len(project.bill_red_flags),
            "clear": red_flags_clear,
            "flagged": red_flags_flagged,
        },
        "rfi_summary": {
            "open": rfi_open,
            "closed": rfi_closed,
            "total": len(project.rfi_registers),
        },
        "expert_gaps_summary": {
            "total": len(project.expert_gaps),
            "implemented": implemented_gaps,
            "p1_count": sum(1 for g in project.expert_gaps if g.priority == "P1"),
            "p2_count": sum(1 for g in project.expert_gaps if g.priority == "P2"),
            "p3_count": sum(1 for g in project.expert_gaps if g.priority == "P3"),
        },
        "cqv_handover_readiness": round((top_dossiers_approved / top_dossiers_total * 100), 1) if top_dossiers_total > 0 else 0.0,
    }
