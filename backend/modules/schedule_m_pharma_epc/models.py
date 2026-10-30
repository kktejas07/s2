from __future__ import annotations
from typing import Optional, List
from datetime import datetime
from beanie import Document
from pydantic import BaseModel, Field


class ScheduleMChecklistItem(BaseModel):
    item_id: str  # e.g., SCH-001, DES-001, HVA-005, CIV-002, D13.1
    discipline: str  # e.g., HVAC, Civil & Cleanroom, Process & Piping, Sterile Add-on, QC Lab, Warehouse & Env, etc.
    verification_point: str
    requirement_source: Optional[str] = "Schedule M / WHO-GMP / ISPE"
    drawing_spec_ref: Optional[str] = "Ref Spec Rev A"
    acceptance_criteria: Optional[str] = "Per approved ITP & URS"
    method_stage: Optional[str] = "Per approved ITP"
    evidence_ref: Optional[str] = None
    status: str = "PASS"  # PASS, FAIL, PENDING, NA
    result_code: str = "C"  # C (Conforming), NC (Non-conforming), OBS (Observation), PND (Pending), NA (Not applicable)
    severity: Optional[str] = "Minor"  # Critical, Major, Minor, None
    inspection_intensity: Optional[str] = "Risk-based sample"  # 100%, Risk-based sample, Record review, Witness test, Spot
    ir_report_ref: Optional[str] = None
    sub_category: Optional[str] = None
    ncr_id: Optional[str] = None
    owner: Optional[str] = "Lead QA/QC Engineer"
    due_date: Optional[str] = None
    comments: Optional[str] = None


class ScheduleMRequirementsRegister(BaseModel):
    req_id: str  # REQ-001 to REQ-012
    theme: str
    clause: str
    statement: str
    applicability: str = "Applicable"
    rationale: Optional[str] = "Mandatory Schedule M statutory requirement"
    system_location: Optional[str] = "Facility-wide"
    design_ref: Optional[str] = "BOD / URS Rev B"
    compliance_status: str = "CONFORMING"  # CONFORMING, PARTIAL, PENDING, NON_CONFORMING


class ScheduleMRFIRegister(BaseModel):
    rfi_id: str  # RFI-001
    date_raised: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))
    raised_by: str = "Site QA Engineer"
    discipline: str = "HVAC / Piping"
    doc_ref: str = "DWG-HVA-102 Rev B"
    query: str
    impact: str = "Quality / Schedule"
    addressed_to: str = "EPC Consultant Lead"
    response: Optional[str] = None
    status: str = "OPEN"  # OPEN, ANSWERED, CLOSED
    closed_date: Optional[str] = None


class ScheduleMURSTraceability(BaseModel):
    urs_id: str  # URS-001
    urs_requirement: str
    design_ref: str
    verification_method: str
    test_protocol_ref: str
    evidence_ref: Optional[str] = None
    finding: Optional[str] = None
    risk: str = "Medium"  # Low, Medium, High, Critical
    compliance_status: str = "COMPLIANT"  # COMPLIANT, IN_PROGRESS, NON_COMPLIANT


class ScheduleMExpertGap(BaseModel):
    gap_no: int
    gap_title: str
    why_it_matters: str
    recommended_fix: str
    priority: str = "P1"  # P1, P2, P3
    status: str = "IMPLEMENTED"  # IMPLEMENTED, IN_PROGRESS, OPEN


class ScheduleMTechnicalBenchmark(BaseModel):
    parameter: str
    commonly_referenced_value: str
    typical_source: str
    category: str  # HVAC & Cleanrooms, Critical Utilities, Process Piping & Metallurgy, Civil & Architecture


class ScheduleMRedFlagCheck(BaseModel):
    check_id: str  # D16.1 to D16.10
    check_item: str
    result: str = "CLEAR"  # CLEAR, FLAGGED, INVESTIGATING
    risk_impact: str = "HIGH"
    evidence_remarks: Optional[str] = None


class ScheduleMQuantityMeasurement(BaseModel):
    sl_no: Optional[int] = 1
    project: str = "Pharma EPC Facility"
    package: str = "Cleanroom & HVAC"
    sheet_no: str = "M-001"
    date: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))
    boq_item: str
    description: str
    unit: str  # Sqm, Rm, Cum, Nos, Kg
    rate: float = 0.0
    location_grid_room_tag: str
    drawing_rev: Optional[str] = "REV-01"
    variation_ref: Optional[str] = None
    length: float = 0.0
    width: float = 0.0
    height_depth: float = 0.0
    calculated_qty: float = 0.0  # length * width * height or length * width
    total_amount: float = 0.0
    status: str = "VERIFIED"


class ScheduleMBOQReconciliation(BaseModel):
    boq_item: str
    description: str
    unit: str
    contract_qty: float = 0.0
    approved_variation_qty: float = 0.0
    revised_qty: float = 0.0
    previous_certified_qty: float = 0.0
    current_measured_qty: float = 0.0
    cumulative_qty: float = 0.0
    balance_qty: float = 0.0
    rate: float = 0.0
    current_value: float = 0.0
    cumulative_value: float = 0.0
    evidence_remarks: Optional[str] = None


class ScheduleMRABillReview(BaseModel):
    sl_no: int = 1
    project: str = "Pharma EPC Facility"
    contractor: str = "Turnkey Cleanroom EPC Ltd."
    package: str = "HVAC & Piping"
    ra_bill_no: str = "RA-01"
    period: str = "Current Month"
    received_date: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))
    boq_item: str
    description: str
    unit: str
    claimed_qty: float = 0.0
    verified_qty: float = 0.0
    rate: float = 0.0
    claimed_value: float = 0.0
    verified_value: float = 0.0
    variance_qty: float = 0.0
    variance_value: float = 0.0
    status: str = "VERIFIED"  # VERIFIED, DISCREPANCY, APPROVED
    remarks: Optional[str] = None


class ScheduleMNCRCAPA(BaseModel):
    ncr_id: str  # NCR-CIV-001
    date: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))
    discipline: str
    location_tag: str
    requirement_source: str
    objective_evidence: str
    risk_impact: str = "MEDIUM"  # LOW, MEDIUM, HIGH, CRITICAL
    severity: str = "Major"  # Critical, Major, Minor
    target_resolution_hours: int = 48  # Critical: 24h, Major: 48h, Minor: 720h (30d)
    containment: str
    root_cause: str
    disposition_approved_by: str = "QA Manager"
    corrective_action: str
    owner: str
    due_date: str
    status: str = "OPEN"  # OPEN, IN_PROGRESS, CLOSED
    ir_ref: Optional[str] = None
    reinspection_date: Optional[str] = None


class ScheduleMChangeRegister(BaseModel):
    change_id: str  # CR-001
    date: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))
    originator: str
    description: str
    reason: str
    affected_systems: str
    gmp_quality_risk: str = "LOW"
    safety_impact: str = "NONE"
    cost_impact: float = 0.0
    schedule_impact_days: int = 0
    technical_approval: str = "APPROVED"
    quality_approval: str = "APPROVED"
    commercial_approval: str = "APPROVED"
    implementation_evidence: Optional[str] = None


class ScheduleMCalibration(BaseModel):
    instrument_id: str  # CAL-TEMP-01
    description: str
    range_spec: str
    serial_no: str
    certificate_no: str
    calibration_date: str
    due_date: str
    status: str = "VALID"  # VALID, DUE_SOON, OUT_OF_CAL
    report_refs: str
    out_of_calibration_action: Optional[str] = "None"


class ScheduleMPunchList(BaseModel):
    item_id: str  # PL-HVA-01
    system: str
    category: str = "CAT_B"  # CAT_A (Critical/Handover-blocking), CAT_B (Major), CAT_C (Minor)
    location_tag: str
    description: str
    raised_by_date: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))
    owner: str
    due_date: str
    prerequisite_impact: str = "Commissioning"
    closure_evidence: Optional[str] = None
    verified_by_date: Optional[str] = None
    status: str = "OPEN"  # OPEN, CLOSED
    days_open: int = 0


class ScheduleMTurnoverDossier(BaseModel):
    dossier_id: str  # TOP-HVA-01
    system_package: str
    record_category: str  # As-Built, Calibration, Qualification, Certificates
    required_document: str
    reference_revision: str
    responsible_party: str
    submitted_date: str
    reviewed_by_date: str
    status: str = "SUBMITTED"  # PENDING, SUBMITTED, APPROVED
    gap_action: Optional[str] = None
    closure_evidence: Optional[str] = None


class ScheduleMInspectionReport(BaseModel):
    report_no: str = "IR-2026-001"
    project_client_epc: str = "IQE / SunPharma BioTech / Ideal EPC"
    discipline_system_location: str = "HVAC Cleanroom Area A (Grade B Background)"
    ir_no_itp_point: str = "ITP-HVA-05"
    inspection_datetime: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d %H:%M"))
    inspector_attendees: str = "Er. S. Mehta (IQE Lead Inspector), R. Gupta (EPC QC Manager)"
    drawing_spec_rev: str = "DWG-HVA-101 Rev C"
    method_procedure: str = "PAO Filter Integrity Test ISO 14644-3"
    instrument_ids_validity: str = "Aerosol Photometer PH-04 (Cal Valid: Nov 2026)"
    scope_inspected: str = "12 Nos Terminal HEPA Filters Grade A/B Fill Suite"
    acceptance_criteria: str = "Penetration < 0.01% with Emery 3004 challenge"
    actual_results: str = "All 12 filters passed. Max leakage 0.002% on Filter H-08"
    photo_evidence_refs: str = "IMG_8891.jpg to IMG_8902.jpg attached"
    ncr_obs_rfi_refs: str = "None"
    limitations_not_inspected: str = "None"
    disposition_next_action: str = "PASSED & APPROVED FOR AIR VELOCITY / BALANCING"
    inspector_sign: str = "S. Mehta (IQE Inspector)"
    technical_reviewer_sign: str = "Dr. A. V. Kumar (IQE Technical Reviewer)"
    client_ack: str = "Accepted (Client Representative)"
    overall_result: str = "CONFORMING"  # CONFORMING, NON_CONFORMING, HOLD, NOT_INSPECTED
    highest_nc_severity: str = "NONE"  # CRITICAL, MAJOR, MINOR, NONE
    report_status: str = "APPROVED"


class ScheduleMPharmaEPCProject(Document):
    project_id: str = "PRJ-SCH-M-2026-01"
    project_name: str = "Schedule M Revised Formulation & Sterile Facility EPC"
    client_name: str = "SunPharma BioTech Ltd."
    epc_contractor: str = "Ideal Pharma EPC Solutions Pvt. Ltd."
    facility_location: str = "Baddi Pharma Hub, Himachal Pradesh"
    facility_type: str = "Formulation & Sterile Injectables Facility"
    licence_authority: str = "CDSCO / State FDA (Revised Schedule M 2024)"
    schedule_m_verified_by_date: str = "Dr. A. V. Kumar (Director QA) / 28-Sep-2026"
    requirements_register_ref: str = "REQ-SCH-M-2026-01"
    urs_design_basis_rev: str = "BOD-REV-02 / URS-QA-2026-01 Rev C"
    quality_plan_itp_rev: str = "ITP-PH-EPC-001 Rev 1.0"
    hold_point_notice_rules: str = "Minimum 1 working day advance written notice for witness / hold point"
    report_numbering_repo: str = "IR-2026-XXX (Controlled IQE Cloud Repository)"
    retention_rule: str = "5% retention until final completion certificate and TOP acceptance"
    iqe_project_lead: str = "Er. S. Mehta (Lead QA/QC Inspector)"
    client_qa_contact: str = "P. Nair (Head QA, SunPharma)"
    design_authority: str = "PharmEng Solutions Consulting"
    client_commercial_approver: str = "R. K. Verma (VP Finance & Contracts)"
    boq_measurement_rules: str = "IS 1200 / Standard Method of Measurement for Pharma Cleanrooms"
    bill_review_turnaround: str = "5 to 7 working days from formal submission"
    escalation_route: str = "Lead Inspector -> IQE Technical Director -> Client Steering Committee"
    cut_off_date: str = "2026-09-28"
    minimum_ir_notice_days: int = 1
    measurement_rounding_places: int = 2
    nc_response_critical_days: int = 1
    nc_response_major_days: int = 5
    nc_response_minor_days: int = 30
    overclaim_review_threshold_percent: float = 10.0
    calibration_alert_window_days: int = 30
    revision_no: str = "REV-1.0 (28-Sep-2026)"
    schedule_m_compliance_score: float = 94.5

    checklists: List[ScheduleMChecklistItem] = []
    requirements_registers: List[ScheduleMRequirementsRegister] = []
    rfi_registers: List[ScheduleMRFIRegister] = []
    urs_traceabilities: List[ScheduleMURSTraceability] = []
    expert_gaps: List[ScheduleMExpertGap] = []
    technical_benchmarks: List[ScheduleMTechnicalBenchmark] = []
    bill_red_flags: List[ScheduleMRedFlagCheck] = []

    quantity_measurements: List[ScheduleMQuantityMeasurement] = []
    boq_reconciliations: List[ScheduleMBOQReconciliation] = []
    ra_bill_reviews: List[ScheduleMRABillReview] = []
    ncr_capas: List[ScheduleMNCRCAPA] = []
    change_registers: List[ScheduleMChangeRegister] = []
    calibrations: List[ScheduleMCalibration] = []
    punch_lists: List[ScheduleMPunchList] = []
    turnover_dossiers: List[ScheduleMTurnoverDossier] = []
    inspection_reports: List[ScheduleMInspectionReport] = []

    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "schedule_m_pharma_epc_projects"
