from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

FormCode = Literal["TP02", "TP03", "TP04", "TP05"]
ReportStatus = Literal["DRAFT", "SUBMITTED", "SIGNED", "ISSUED", "SUPERSEDED"]
PartyType = Literal["SUPPLIER", "IQE"]

# ----------------------------------------------------
# IQE-TP-02 Schemas (Flash Inspection Report)
# ----------------------------------------------------
class TP02Item(BaseModel):
  item: int = 1
  description: str = ""
  tag_no: str = ""
  po_qty: Optional[float] = None
  offered_qty: Optional[float] = None
  inspected_qty: Optional[float] = None
  accepted_qty: Optional[float] = None
  remarks: str = ""

class TP02Finding(BaseModel):
  sl_no: int = 1
  finding: str = ""
  reference: str = ""
  action: str = ""

class TP02Action(BaseModel):
  action: str = ""
  target_date: str = ""
  follow_up: str = ""

class TP02Payload(BaseModel):
  report_no: Optional[str] = None
  date: Optional[str] = None
  customer: Optional[str] = None
  project: Optional[str] = None
  supplier: Optional[str] = None
  sub_supplier: Optional[str] = None
  po_no_and_date: Optional[str] = None
  location: Optional[str] = None
  rfi_ref_and_date: Optional[str] = None
  next_visit: Optional[str] = None
  inspector: Optional[str] = None
  inspection_stage: Optional[Literal["Stage", "Final", "Re-inspection"]] = "Stage"
  visit_activities: List[str] = Field(default_factory=list)
  other_activity: Optional[str] = None
  items: List[TP02Item] = Field(default_factory=list)
  outcome: Optional[Literal[
      "SATISFACTORY",
      "SATISFACTORY WITH COMMENTS",
      "NON-COMPLIANCE OBSERVED",
      "RE-INSPECTION REQUIRED",
      "INSPECTION ON HOLD"
  ]] = "SATISFACTORY"
  order_status: Optional[Literal["Complete", "Incomplete", "Partially Completed"]] = "Partially Completed"
  findings: List[TP02Finding] = Field(default_factory=list)
  actions: List[TP02Action] = Field(default_factory=list)
  remarks: Optional[str] = None
  photos: List[Dict[str, Any]] = Field(default_factory=list)
  signatures: Dict[str, Any] = Field(default_factory=dict)

# ----------------------------------------------------
# IQE-TP-03 Schemas (Inspection Visit Report)
# ----------------------------------------------------
class TP03Item(BaseModel):
  sl_no: int = 1
  description: str = ""
  tag_no: str = ""
  po_qty: Optional[float] = None
  offered_qty: Optional[float] = None
  inspected_qty: Optional[float] = None
  accepted_qty: Optional[float] = None
  rejected_qty: Optional[float] = None
  remarks: str = ""

class TP03Document(BaseModel):
  sl_no: int = 1
  doc_name: str = ""
  doc_no: str = ""
  rev: str = ""
  status: str = ""
  approval_status: str = ""
  remarks: str = ""

class TP03Activity(BaseModel):
  sl_no: int = 1
  activity: str = ""
  reference: str = ""
  tpi_scope: str = ""
  result: str = ""
  remarks: str = ""

class TP03Finding(BaseModel):
  sl_no: int = 1
  finding: str = ""
  reference: str = ""
  evidence: str = ""
  status: str = ""

class TP03Punch(BaseModel):
  sl_no: int = 1
  observation: str = ""
  reference: str = ""
  action: str = ""
  status: str = ""

class TP03Calibration(BaseModel):
  instrument: str = ""
  manufacturer: str = ""
  model: str = ""
  serial_no: str = ""
  range: str = ""
  accuracy: str = ""
  cert_no: str = ""
  due_date: str = ""

class TP03Attachment(BaseModel):
  sl_no: int = 1
  description: str = ""
  reference_pages: str = ""
  remarks: str = ""

class TP03Payload(BaseModel):
  report_no: Optional[str] = None
  inspection_date: Optional[str] = None
  report_date: Optional[str] = None
  rfi_no_and_date: Optional[str] = None
  inspection_stage: Optional[Literal["Stage", "Final", "Re-inspection"]] = "Stage"
  location: Optional[str] = None
  customer: Optional[str] = None
  project: Optional[str] = None
  supplier: Optional[str] = None
  sub_supplier: Optional[str] = None
  po_no_and_date: Optional[str] = None
  inspector: Optional[str] = None
  applicable_qap: Optional[str] = None
  applicable_spec: Optional[str] = None
  items: List[TP03Item] = Field(default_factory=list)
  documents: List[TP03Document] = Field(default_factory=list)
  activities: List[TP03Activity] = Field(default_factory=list)
  findings: List[TP03Finding] = Field(default_factory=list)
  punch_list: List[TP03Punch] = Field(default_factory=list)
  calibrations: List[TP03Calibration] = Field(default_factory=list)
  status: Optional[Literal[
      "ACCEPTED",
      "ACCEPTED WITH COMMENTS",
      "PARTIALLY ACCEPTED",
      "NOT ACCEPTED",
      "HOLD / RE-INSPECTION REQUIRED"
  ]] = "ACCEPTED"
  conclusion: Optional[str] = None
  attachments: List[TP03Attachment] = Field(default_factory=list)
  photos: List[Dict[str, Any]] = Field(default_factory=list)
  signatures: Dict[str, Any] = Field(default_factory=dict)
  supplier_comments: Optional[str] = None

# ----------------------------------------------------
# IQE-TP-04 Schemas (Inspection Release Note)
# ----------------------------------------------------
class TP04ReportRef(BaseModel):
  sl_no: int = 1
  report_no: str = ""
  date: str = ""
  stage: str = ""
  remarks: str = ""

class TP04DeviationRef(BaseModel):
  sl_no: int = 1
  concession_no: str = ""
  date: str = ""
  status: str = ""
  remarks: str = ""

class TP04ReleaseItem(BaseModel):
  po_item: int = 1
  description: str = ""
  drawing_rev: str = ""
  tag_no: str = ""
  po_qty: Optional[float] = None
  prev_released: Optional[float] = 0.0
  inspected_qty: Optional[float] = None
  accepted_qty: Optional[float] = None
  current_released: Optional[float] = None
  balance_qty: Optional[float] = None
  remarks: str = ""

class TP04Payload(BaseModel):
  report_no: Optional[str] = None
  date: Optional[str] = None
  contract_ref: Optional[str] = None
  po_no_and_date: Optional[str] = None
  customer: Optional[str] = None
  supplier: Optional[str] = None
  project: Optional[str] = None
  location: Optional[str] = None
  rfi_no_and_date: Optional[str] = None
  inspector: Optional[str] = None
  po_status: Optional[Literal["Complete", "Partially Completed", "Balance Pending"]] = "Partially Completed"
  release_type: Optional[Literal["Full", "Partial", "Conditional"]] = "Full"
  release_decision: Optional[Literal[
      "RELEASED FOR DISPATCH",
      "RELEASED WITH COMMENTS / CONDITIONS",
      "HOLD – CLIENT CLEARANCE REQUIRED",
      "NOT RELEASED"
  ]] = "RELEASED FOR DISPATCH"
  total_quantity_released: Optional[str] = None
  report_refs: List[TP04ReportRef] = Field(default_factory=list)
  deviation_refs: List[TP04DeviationRef] = Field(default_factory=list)
  release_items: List[TP04ReleaseItem] = Field(default_factory=list)
  selected_basis: List[str] = Field(default_factory=list)
  other_basis: Optional[str] = None
  traceability: Dict[str, Any] = Field(default_factory=dict)
  dispatch_instructions: List[str] = Field(default_factory=list)
  other_dispatch_instruction: Optional[str] = None
  remarks: Optional[str] = None
  signatures: Dict[str, Any] = Field(default_factory=dict)
  supplier_comments: Optional[str] = None
  tp04_liability_text: Optional[str] = None

# ----------------------------------------------------
# IQE-TP-05 Schemas (Expediting Visit Report)
# ----------------------------------------------------
class TP05Item(BaseModel):
  item_no: int = 1
  description: str = ""
  po_qty: Optional[float] = None
  tag_no: str = ""
  promised_delivery: str = ""
  expected_delivery: str = ""
  qty_available: Optional[float] = None
  status: str = ""
  remarks: str = ""

class TP05Personnel(BaseModel):
  sl: int = 1
  name: str = ""
  designation: str = ""
  company: str = ""
  role: str = ""

class TP05DocDetail(BaseModel):
  sl: int = 1
  doc_name: str = ""
  doc_no: str = ""
  rev: str = ""
  status: str = ""
  approval_status: str = ""
  remarks: str = ""

class TP05SubOrder(BaseModel):
  sl: int = 1
  component: str = ""
  sub_supplier: str = ""
  order_ref: str = ""
  qty_ordered: Optional[float] = None
  qty_received: Optional[float] = None
  expected_balance: Optional[float] = None
  status_remarks: str = ""

class TP05MfgStatus(BaseModel):
  sl: int = 1
  activity: str = ""
  planned_finish: str = ""
  actual_finish: str = ""
  pct: Optional[float] = None
  status: str = ""
  remarks: str = ""

class TP05InspTesting(BaseModel):
  sl: int = 1
  activity: str = ""
  planned_date: str = ""
  actual_date: str = ""
  status: str = ""
  ref: str = ""
  remarks: str = ""

class TP05Action(BaseModel):
  sl: int = 1
  action: str = ""
  responsibility: str = ""
  target_date: str = ""
  status: Literal["Open", "Closed"] = "Open"
  remarks: str = ""

class TP05Payload(BaseModel):
  report_no: Optional[str] = None
  date: Optional[str] = None
  visit_ref_and_date: Optional[str] = None
  previous_visit: Optional[str] = None
  next_planned_visit: Optional[str] = None
  location: Optional[str] = None
  customer: Optional[str] = None
  supplier: Optional[str] = None
  project: Optional[str] = None
  sub_supplier: Optional[str] = None
  po_no_and_date: Optional[str] = None
  expeditor: Optional[str] = None
  items: List[TP05Item] = Field(default_factory=list)
  order_status: Optional[Literal["Complete", "Incomplete", "Partially Completed"]] = "Partially Completed"
  order_status_remarks: Optional[str] = None
  engineering_pct: Optional[float] = None
  engineering_remarks: Optional[str] = None
  procurement_pct: Optional[float] = None
  procurement_remarks: Optional[str] = None
  manufacturing_pct: Optional[float] = None
  manufacturing_remarks: Optional[str] = None
  inspection_pct: Optional[float] = None
  inspection_remarks: Optional[str] = None
  documentation_pct: Optional[float] = None
  documentation_remarks: Optional[str] = None
  overall_completion_pct: Optional[float] = None
  overall_remarks: Optional[str] = None
  summary: Optional[str] = None
  personnel: List[TP05Personnel] = Field(default_factory=list)
  doc_details: List[TP05DocDetail] = Field(default_factory=list)
  sub_orders: List[TP05SubOrder] = Field(default_factory=list)
  mfg_status: List[TP05MfgStatus] = Field(default_factory=list)
  insp_testing: List[TP05InspTesting] = Field(default_factory=list)
  delivery_status: Optional[Literal["On Schedule", "At Risk", "Delayed"]] = "On Schedule"
  delivery_remarks: Optional[str] = None
  critical_path: Optional[Literal["None", "Identified"]] = "None"
  critical_path_remarks: Optional[str] = None
  recovery_plan: Optional[Literal["No", "Yes"]] = "No"
  recovery_plan_remarks: Optional[str] = None
  supplier_commitment: Optional[str] = None
  iqe_assessment: Optional[Literal["Satisfactory", "Concern", "Critical"]] = "Satisfactory"
  iqe_assessment_remarks: Optional[str] = None
  actions: List[TP05Action] = Field(default_factory=list)
  conclusion: Optional[str] = None
  photos: List[Dict[str, Any]] = Field(default_factory=list)
  signatures: Dict[str, Any] = Field(default_factory=dict)
  supplier_comments: Optional[str] = None

# Request / Response Schemas
class CreateReportRequest(BaseModel):
  project_id: Optional[str] = None
  customer: Optional[str] = None
  supplier: Optional[str] = None
  po_no: Optional[str] = None
  data: Optional[Dict[str, Any]] = Field(default_factory=dict)

class UpdateReportRequest(BaseModel):
  customer: Optional[str] = None
  supplier: Optional[str] = None
  po_no: Optional[str] = None
  data: Dict[str, Any]

class SignReportRequest(BaseModel):
  party: PartyType
  name: str
  designation: str
  signature_image_url: Optional[str] = None
  stamp_image_url: Optional[str] = None
