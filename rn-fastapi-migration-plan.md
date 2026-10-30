# IQEApp → Fieldglass-Style Job Platform

## Target Flow

```
Job ID Created ──▶ Client / Client ID ──▶ Service Order ──▶ Control Number ──▶ Visit Scheduled
                                                                                    │
                                                                              Inspector Accepts
                                                                                    │
                                                                              Inspector Captures
                                                                              (expenses, docs, photos)
                                                                                    │
                                                                              Quality Check
                                                                                    │
                                                                              Finance Approval
                                                                                    │
                                                                              Invoice Generated
```

**The Job ID is the single reference number** that the client uses to track everything from start to finish. It wraps all existing entities (Service Order, Control Number, Visit, Invoice) under one umbrella — nothing is replaced, everything is linked.

---

## Every Entity Has Its Own Unique ID

| Entity | ID Field | Example | Parent |
|--------|----------|---------|--------|
| **Site** | `site_id` | `SITE-01` | — |
| **Client** | `client_id` | `CLT-001` | Site |
| **Client Unit** | `client_unit_id` | `CU-001` | Client |
| **Manufacturer** | `manufacturer_id` | `MFR-003` | Site |
| **Manufacturer Unit** | `manufacturer_unit_id` | `MU-003` | Manufacturer |
| **User / Inspector** | `user_id` | `USR-042` | Site |
| **Associate** | `associate_id` | `ASC-001` | Site |
| **Job** | `job_id` | `JOB-2026-0001` | Client |
| **Service Order** | `so_id` | `SO-2026-0044` | Job |
| **Control Number** | `control_number_id` | `CN-2026-0033` | Job |
| **Purchase Order** | `po_id` | `PO-2026-0042` | Job |
| **PO Item** | `po_item_id` | `POI-001` | Purchase Order |
| **Visit** | `visit_id` | `VST-2026-0123` | Job |
| **Visit Expense** | `expense_id` | `EXP-001` | Visit |
| **Visit Photo** | `photo_id` | `PHO-001` | Visit |
| **Inspector Assignment** | `assignment_id` | `ASN-001` | Visit |
| **Competency** | `competency_id` | `COM-001` | User |
| **Inspector Rate** | `rate_id` | `RATE-001` | User |
| **Enquiry** | `enquiry_id` | `ENQ-2026-0001` | Client |
| **Enquiry Category** | `enquiry_category_id` | `EC-001` | Enquiry |
| **Customer Complaint** | `complaint_id` | `CMP-2026-0001` | Client |
| **Invoice** | `invoice_id` | `INV-2026-0001` | Job |
| **Invoice Line Item** | `line_item_id` | `LI-001` | Invoice |
| **Payment** | `payment_id` | `PAY-2026-0001` | Invoice |
| **Document** | `document_id` | `DOC-001` | Site |
| **File** | `file_id` | `FILE-001` | Any entity |

Every entity carries its own unique ID plus the parent `job_id`. The flow remains identical — each step creates or references its own entity with its own identifier.

---

## Architecture

```
Web App (React / Next.js)           Mobile App (React Native)
  Coordinator Dashboard               Inspector App (offline-first)
  Admin / Finance screens             Coordinator App (on-the-go)
  Reports & Analytics                 Photo capture, GPS, barcode
         │                                       │
         └──────────────┬────────────────────────┘
                        │
                  FastAPI (Python 3.12)
                        │
         ┌──────────────┼──────────────────┐
         │              │                  │
    MongoDB Atlas  Azure Blob        AI Services
    (All entities)   (Photos,     (LangChain, GPT-4o,
                      Reports)     Vision, RAG, Atlas Search)
```

### Web + Mobile Strategy

| Aspect | Web (Next.js / React) | Mobile (React Native) |
|--------|-----------------------|----------------------|
| **Users** | Coordinators, Admin, Finance, QC | Inspectors (field), Coordinators (on-the-go) |
| **Offline** | Not required | Critical — WatermelonDB sync |
| **Complex forms** | Full keyboard + mouse | Simplified, step-by-step |
| **Camera/GPS** | Optional (webcam) | Primary (native camera, GPS) |
| **Reports** | Charts, tables, PDF preview | Summary view, PDF download |
| **Code sharing** | Shared Zustand stores, API client, Zod schemas | Same shared logic via monorepo |
| **Auth** | Same JWT (cookie or header) | Same JWT (header) |

Both share the **exact same FastAPI backend** — no duplication.

---

## Core Document Model

### Job (Umbrella Container — Single Reference Number)

```python
class Job(Document):
    job_id: str                              # "JOB-2026-0001" — single ref for client
    site_id: str
    status: JobStatus

    # Who it's for
    client: ClientRef                        # embedded
    client_unit: ClientUnitRef | None

    # What it covers
    title: str
    description: str
    job_type: JobType                        # inspection / calibration / audit

    # Schedule
    requested_start: datetime
    requested_end: datetime
    location: Location

    # Commercial
    po_number: str | None
    budget: Decimal
    currency: str

    # Workflow config (per-client)
    workflow: JobWorkflowConfig              # which approval stages needed
    tags: list[str]

    created_by: str
    created_at: datetime
    updated_at: datetime
```

### ServiceOrder (Under a Job)

```python
class ServiceOrder(Document):
    so_id: str
    job_id: str                              # ref to Job
    site_id: str
    status: SOStatus

    # Client & Manufacturer
    client: ClientRef
    client_unit: ClientUnitRef | None
    manufacturer: ManufacturerRef | None
    manufacturer_unit: ManufacturerUnitRef | None

    # Commercial
    so_type: SOType                          # LOI / SO
    so_number: str
    so_date: datetime
    due_date: datetime
    amount: Decimal
    currency: str
    po_items: list[POItem] = []              # embedded scope line items

    # Control
    project_number: str | None
    project_name: str | None

    # Files
    uploaded_files: list[FileRef] = []

    created_by: str
    created_at: datetime
```

### ControlNumber (Assigned Under a Job)

```python
class ControlNumber(Document):
    control_number_id: str                   # "CN-2026-0033"
    job_id: str                              # ref to Job
    so_id: str                               # ref to ServiceOrder
    site_id: str

    client: ClientRef
    client_unit: ClientUnitRef | None
    manufacturer: ManufacturerRef | None
    manufacturer_unit: ManufacturerUnitRef | None

    control_number: str                      # display number (may differ from id)
    equipment_name: str | None
    po_items: list[POItemRef] = []           # linked PO items

    is_active: bool
    reassignment_history: list[Reassignment] = []

    created_at: datetime
```

### Visit (Scheduled Under a Job)

```python
class Visit(Document):
    visit_id: str
    job_id: str                              # ref to Job
    control_number_id: str                   # ref to ControlNumber
    so_id: str                               # ref to ServiceOrder (denormalized)
    site_id: str
    status: VisitStatus

    # Schedule
    planned_date: datetime
    rfi_date: datetime | None
    visited_from: datetime | None
    visited_to: datetime | None

    # Inspector
    inspector: UserRef                       # assigned inspector

    # Work capture
    inspection_report_no: str | None
    comments: str | None
    expenses: list[Expense] = []             # embedded
    photos: list[Photo] = []                 # embedded
    technical_docs: list[Document] = []      # embedded
    travel_docs: list[Document] = []         # embedded
    po_items_covered: list[POItemRef] = []   # selected PO items for this visit

    # AI
    ai_report: AIReportSummary | None
    findings: list[Finding] = []

    # Approval chain
    quality_check: Approval | None
    finance_approval: Approval | None

    # Invoice linkage
    is_invoiced: bool = False
    invoice_id: str | None

    # Audit
    created_by: str
    created_at: datetime
    updated_at: datetime
```

### Invoice (Generated From Visits)

```python
class Invoice(Document):
    invoice_id: str                          # "INV-2026-0001"
    job_id: str                              # ref to Job
    site_id: str
    status: InvoiceStatus

    # Who
    client: ClientRef
    invoice_type: InvoiceType                # customer / supplier

    # Line items from visits
    visit_ids: list[str]                     # visits billed
    consolidated_charges: list[ChargeItem]   # embedded
    annexure: list[AnnexureItem]             # embedded

    # Amounts
    amounts: InvoiceAmounts
    gst: GSTDetails

    # Document
    invoice_number: str                      # display number
    pdf_path: str | None
    frozen: bool = False
    cancellation: CancellationInfo | None

    created_at: datetime
```

---

## Sub-Division Document Models

### Client → ClientUnit

```python
class ClientUnit(Document):
    client_unit_id: str                        # "CU-001"
    client_id: str                             # ref to Client
    site_id: str

    name: str
    address: Address
    phone: str | None
    contact_person: str | None
    gst: str | None
    sgst: float = 0.0
    cgst: float = 0.0
    igst: float = 0.0
    is_sez: bool = False
    is_overseas: bool = False

    is_active: bool
    created_at: datetime
```

### Manufacturer → ManufacturerUnit

```python
class ManufacturerUnit(Document):
    manufacturer_unit_id: str                  # "MU-003"
    manufacturer_id: str                       # ref to Manufacturer
    site_id: str

    name: str
    address: Address
    phone: str | None
    contact_person: str | None
    email: str | None

    is_active: bool
    created_at: datetime
```

### Visit → Manufacturer Visit Location (Cross-Entity)

```python
class ManufacturerVisitLocation(Document):
    visit_id: str                              # ref to Visit
    manufacturer_id: str                       # ref to Manufacturer
    location_details: str
    is_sub_manufacturer: bool = False
    sub_manufacturer_details: str | None
    contact_no: str | None
    cost: float = 0.0

    created_at: datetime
```

### Visit → Expenses, Photos, Findings (Embedded Sub-Documents)

```python
class Expense(BaseModel):
    expense_id: str                            # "EXP-001"
    expense_type: str                          # travel / food / hotel / mileage / other
    description: str | None
    amount: float
    km: float | None = None
    currency: str = "INR"
    receipt_file: FileRef | None = None
    notes: str | None

class Photo(BaseModel):
    photo_id: str                              # "PHO-001"
    url: str                                   # Azure Blob URL
    thumbnail_url: str | None
    caption: str | None
    category: str                              # visual / defect / measurement / environment
    ai_tags: list[str] = []                    # auto-classified
    defect_found: bool | None = None
    gps_coords: GeoPoint | None = None
    captured_at: datetime

class Finding(BaseModel):
    finding_id: str
    description: str
    severity: str                              # critical / major / minor / observation
    category: str                              # weld / pressure / dimension / material / other
    photo_ids: list[str] = []
    inspector_notes: str | None
    ai_suggested: bool = False
```

### PurchaseOrder → POItem

```python
class POItem(BaseModel):
    po_item_id: str                            # "POI-001"
    po_id: str                                 # ref to PurchaseOrder
    item_no: int
    description: str
    quantity: float
    uom: str                                   # unit of measure
    inspection_activity: str | None
    number_of_visits: int | None
    rate: float = 0.0
    amount: float = 0.0
    remarks: str | None
```

### User → Competency

```python
class Competency(Document):
    competency_id: str                         # "COM-001"
    user_id: str                               # ref to User
    site_id: str

    # Materials & Welding
    materials: bool = False
    welding: bool = False
    nde: bool = False

    # Piping & Valves
    line_pipe_inspection: bool = False
    fabricated_piping: bool = False
    valves_actuators: bool = False
    fittings: bool = False
    gaskets: bool = False
    coatings_painting: bool = False

    # Pressure & Structural
    steel_structures_fabrication: bool = False
    pressure_vessels: bool = False
    heat_exchangers: bool = False
    boilers: bool = False
    tanks: bool = False
    skid_packages: bool = False

    # Rotating Equipment
    rotating_equipment_pumps: bool = False
    rotating_equipment_compressors: bool = False
    rotating_equipment_turbines: bool = False
    rotating_equipment_gears: bool = False

    # HVAC & Lifting
    hvac: bool = False
    lifting_equipment: bool = False
    generators: bool = False
    motors: bool = False

    # Electrical Power
    switchboards_pmccs_mccs: bool = False
    transformers: bool = False
    switchgears_switchyard_substation: bool = False
    cables_conductors: bool = False
    ac_dc_drives: bool = False
    battery_chargers_ups: bool = False
    battery_cells_banks: bool = False
    capacitors: bool = False
    ex_equipment: bool = False
    dg_sets: bool = False
    solar_pv_modules: bool = False

    # Control & Instrumentation
    control_systems: bool = False
    field_instruments: bool = False
    dcs_plc_scada: bool = False

    # Discipline
    onshore: bool = False
    offshore: bool = False
    civil_infrastructure: bool = False

    # Other
    others: bool = False
    others_text: str | None = None

    created_at: datetime
```

### User → InspectorRate

```python
class InspectorRate(Document):
    rate_id: str                               # "RATE-001"
    user_id: str                               # ref to User
    site_id: str

    discipline: str | None
    currency: str = "INR"
    inspection_fee_per_hour: float = 0.0
    inspection_fee_per_day: float = 0.0
    travel_charges_per_hour: float = 0.0
    travel_charges_lumsum: float = 0.0
    mileage_per_km: float = 0.0
    mileage_beyond_50km: float = 0.0
    other_charges: float = 0.0

    documents: list[FileRef] = []
    is_active: bool
    created_at: datetime
```

### Associate (Third-Party Inspection Agency)

```python
class Associate(Document):
    associate_id: str                          # "ASC-001"
    site_id: str

    name: str
    address: Address
    contact_person: str | None
    contact_number: str | None
    email: str | None
    website: str | None

    currency: str = "INR"
    mileage_per_km: float = 0.0
    cost: float = 0.0

    bank_account: str | None
    bank_name: str | None
    ifsc_code: str | None
    branch: str | None
    swift_code: str | None
    iban: str | None
    beneficiary_name: str | None
    pan: str | None
    aadhar: str | None

    is_active: bool
    created_at: datetime
```

### Enquiry → EnquiryCategory

```python
class Enquiry(Document):
    enquiry_id: str                            # "ENQ-2026-0001"
    client_id: str
    site_id: str

    enquiry_date: datetime
    category: str | None
    quotation_no: str | None
    quotation_date: datetime | None
    status: EnquiryStatus                      # won / lost / pending / declined

    proposal_owner: str | None
    submit_status: str | None

    categories: list[EnquiryCategory] = []     # embedded
    uploaded_files: list[FileRef] = []

    created_at: datetime

class EnquiryCategory(BaseModel):
    enquiry_category_id: str
    details: str
    scope: str | None
    position: str | None
    uom: str | None
    qty: float = 0.0
    applicable_codes: str | None
    qualification: str | None
    competence: str | None
    experience: str | None
    duration: str | None
    attendees: int | None
    response_time: str | None
    location: str | None
    remarks: str | None
    budget: float = 0.0
```

### CustomerComplaint

```python
class CustomerComplaint(Document):
    complaint_id: str                          # "CMP-2026-0001"
    client_id: str
    site_id: str

    identification_no: str
    description: str
    received_date: datetime
    issue_date: datetime | None
    issue_no: str | None
    po_wo_number: str | None
    equipment_offered_qty: str | None

    root_cause: str | None
    proposed_action: str | None
    action_by: str | None
    closing_date: datetime | None
    remarks: str | None

    complaint_mode: str | None                 # master data
    complaint_type: str | None                 # master data
    status: str                                # master data
    responsible_party: str | None              # master data

    uploaded_files: list[FileRef] = []
    is_active: bool
    created_at: datetime
```

### Document

```python
class Document(Document):
    document_id: str                           # "DOC-001"
    site_id: str

    category: str | None                       # master data
    name: str
    number: str | None
    issue_no: str | None
    issue_date: datetime | None
    revision_no: str | None
    revision_date: datetime | None
    responsibility: str | None
    retention_period: str | None

    file: FileRef | None
    created_at: datetime
```

### Payment

```python
class Payment(Document):
    payment_id: str                            # "PAY-2026-0001"
    invoice_id: str                            # ref to Invoice
    site_id: str

    payment_mode: str                          # master data
    receipt_number: str | None
    payment_date: datetime
    challan_number: str | None
    amount: float
    is_credit_note: bool = False
    comments: str | None

    created_at: datetime
```

## Entity Relationship — Full Hierarchy

```
Site: "SITE-01"
  │
  ├── Client: "CLT-001"
  │     ├── ClientUnit: "CU-001" / "CU-002"
  │     ├── Enquiry: "ENQ-2026-0001"
  │     │     └── EnquiryCategory (embedded)
  │     ├── CustomerComplaint: "CMP-2026-0001"
  │     │
  │     └── Job: "JOB-2026-0001"
  │             ├── Manufacturer: "MFR-003"
  │             │     └── ManufacturerUnit: "MU-003"
  │             │
  │             ├── ServiceOrder: "SO-2026-0044"
  │             │     └── PO Items (embedded scope items)
  │             │
  │             ├── PurchaseOrder: "PO-2026-0042"
  │             │     └── POItem: "POI-001" / "POI-002" (line items)
  │             │
  │             ├── ControlNumber: "CN-2026-0033"
  │             │     ├── Linked PO Items (refs)
  │             │     └── Reassignment History (embedded)
  │             │
  │             ├── Visit: "VST-2026-0123"
  │             │     ├── Inspector: User "USR-042"
  │             │     ├── Expenses (embedded — travel/food/hotel/mileage)
  │             │     ├── Photos (embedded — visual/defect/measurement)
  │             │     ├── Findings (embedded — critical/major/minor)
  │             │     ├── ManufacturerVisitLocation (linked)
  │             │     ├── Quality Check (embedded approval)
  │             │     └── Finance Approval (embedded approval)
  │             │
  │             └── Invoice: "INV-2026-0001"
  │                   ├── Consolidated Charges (embedded line items)
  │                   ├── Annexure (embedded per-visit details)
  │                   ├── Payment: "PAY-2026-0001"
  │                   └── Invoice Type: customer / supplier
  │
  ├── User: "USR-042"
  │     ├── Competency: "COM-001" (40+ inspection skill categories)
  │     ├── InspectorRate: "RATE-001" (fee per hr/day, mileage, travel)
  │     ├── Associate (optional): "ASC-001" (third-party agency)
  │     └── Role: admin / coordinator / inspector / qc / finance
  │
  └── Document: "DOC-001" (QMS documents)
```

Every entity carries its own unique ID. Flow entities also carry `job_id`.

---

## Status Flow — Visit Statuses (Same as Today)

The existing 11 status values remain unchanged. Only the entity they live on changes.

| ID | Current Name | Maps To |
|----|-------------|---------|
| 1 | VisitScheduled | Visit.status = scheduled |
| 2 | VisitInitiated | Visit.status = initiated |
| 3 | VisitCompleted | Visit.status = completed |
| 4 | QualityCheckCompleted | Visit.quality_check.status = approved |
| 5 | FinanceCheckCompleted | Visit.finance_approval.status = approved |
| 6 | InvoiceInitiated | Visit.is_invoiced = true |
| 7 | InvoiceCompleted | Invoice.status = completed |
| 8 | InvoiceCancelled | Invoice.status = cancelled |
| 9 | PaymentInitiated | Invoice.status = paid |

---

## How the Flow Works in MongoDB

### Step 1: Create Job ID

```
POST /api/v1/jobs
{
  "client_id": "CLT-001",
  "title": "NDT Inspection — Pipeline Section A",
  "requested_start": "2026-07-20",
  "requested_end": "2026-07-25",
  "location": { "address": "Site A, Hyderabad", "lat": 17.38, "lng": 78.48 },
  "po_number": "PO-2026-0042",
  "budget": 150000,
  "currency": "INR",
  "workflow": { "requires_qc": true, "requires_finance": true }
}

→ Returns: job_id = "JOB-2026-0001"
```

```
MongoDB: jobs collection
{
  _id: ObjectId,
  job_id: "JOB-2026-0001",
  client: { id: "CLT-001", name: "Acme Corp", ... },
  status: "draft",
  ...
}
```

### Step 2: Create Service Order Under the Job

```
POST /api/v1/jobs/JOB-2026-0001/service-orders
{
  "so_type": "LOI",
  "so_number": "LOI-2026-0088",
  "so_date": "2026-07-18",
  "manufacturer_id": "MFR-003",
  "amount": 150000,
  "po_items": [
    { "description": "Visual inspection of welds", "qty": 10, "rate": 5000 },
    { "description": "Pressure test", "qty": 5, "rate": 20000 }
  ]
}
```

```
MongoDB: service_orders collection
{
  _id: ObjectId,
  so_id: "SO-2026-0044",
  job_id: "JOB-2026-0001",
  client: { id: "CLT-001", name: "Acme Corp" },
  manufacturer: { id: "MFR-003", name: "Beta Works" },
  po_items: [ ... ],
  status: "active"
}
```

### Step 3: Assign Control Number

```
POST /api/v1/jobs/JOB-2026-0001/control-numbers
{
  "so_id": "SO-2026-0044",
  "equipment_name": "Pipeline Section A - Welds",
  "po_item_ids": ["item-1", "item-2"]
}
```

```
MongoDB: control_numbers collection
{
  _id: ObjectId,
  control_number_id: "CN-2026-0033",
  job_id: "JOB-2026-0001",
  so_id: "SO-2026-0044",
  control_number: "CN-2026-0033",
  equipment_name: "Pipeline Section A - Welds",
  is_active: true
}
```

### Step 4: Schedule Visit

```
POST /api/v1/jobs/JOB-2026-0001/visits
{
  "control_number_id": "CN-2026-0033",
  "planned_date": "2026-07-22",
  "inspector_id": "USR-042",
  "po_items_covered": ["item-1", "item-2"]
}

→ Visit created with status = "scheduled"
```

```
MongoDB: visits collection
{
  _id: ObjectId,
  visit_id: "VST-2026-0123",
  job_id: "JOB-2026-0001",
  control_number_id: "CN-2026-0033",
  so_id: "SO-2026-0044",
  inspector: { id: "USR-042", name: "Rajesh Kumar" },
  status: "scheduled",
  planned_date: "2026-07-22",
  po_items_covered: ["item-1", "item-2"],
  expenses: [],
  photos: [],
  quality_check: null,
  finance_approval: null,
  is_invoiced: false
}
```

### Step 5: Inspector Accepts

```
PATCH /api/v1/visits/VST-2026-0123/accept

→ status changes to "initiated"
```

### Step 6: Inspector Captures Work

```
# Time log
POST /api/v1/visits/VST-2026-0123/time
{ "start": "2026-07-22T09:00", "end": "2026-07-22T17:00" }

# Expense
POST /api/v1/visits/VST-2026-0123/expenses
{ "type": "travel", "km": 120, "amount": 2400 }

# Photo
POST /api/v1/visits/VST-2026-0123/photos
(file upload → Azure Blob → metadata saved)

# Submit
POST /api/v1/visits/VST-2026-0123/submit
{
  "inspection_report_no": "IR-2026-088",
  "comments": "All welds inspected. 2 minor defects found."
}

→ status changes to "completed"
```

### Steps 7-8: Quality Check → Finance Approval

```
# Quality check
POST /api/v1/visits/VST-2026-0123/quality-check
{ "status": "approved", "comments": "All docs verified" }

→ Visit.quality_check = { status: "approved", by: "USR-005", on: "...", comments: "..." }
→ status changes to "quality_check_completed"

# Finance approval
POST /api/v1/visits/VST-2026-0123/finance-approval
{ "status": "approved", "comments": "Expenses within budget" }

→ Visit.finance_approval = { status: "approved", by: "USR-008", on: "...", comments: "..." }
→ status changes to "finance_check_completed"
```

### Step 9: Invoice Generated

```
POST /api/v1/invoices
{
  "job_id": "JOB-2026-0001",
  "visit_ids": ["VST-2026-0123"],
  "invoice_type": "customer",
  "consolidated_charges": [
    { "description": "Inspection Charges", "amount": 100000 },
    { "description": "Travel Charges", "amount": 2400 }
  ]
}

→ Invoice created
→ Visit.is_invoiced = true, Visit.invoice_id = "INV-2026-0001"
```

### Query: Get Everything for a Job ID (Single API Call)

```
GET /api/v1/jobs/JOB-2026-0001?include=service-orders,visits,invoices
```

FastAPI aggregates from multiple collections:

```python
@app.get("/api/v1/jobs/{job_id}")
async def get_job(job_id: str, include: str = ""):
    job = await Job.find_one(Job.job_id == job_id)
    result = job.dict()

    if "service-orders" in include:
        result["service_orders"] = await ServiceOrder.find(
            ServiceOrder.job_id == job_id
        ).to_list()

    if "visits" in include:
        result["visits"] = await Visit.find(
            Visit.job_id == job_id
        ).to_list()

    if "invoices" in include:
        result["invoices"] = await Invoice.find(
            Invoice.job_id == job_id
        ).to_list()

    return result
```

---

## Comparison: Current vs Target

| Aspect | Current (SQL Server) | Target (MongoDB) |
|--------|---------------------|------------------|
| **How client tracks a job** | Multiple numbers: SONo, ControlNo, VisitId, InvoiceNo | **Single Job ID** — one number to give the client |
| **Entities** | ServiceOrder + ControlDetails + VisitDetails + Invoice | Same entities, all carry `job_id` |
| **Getting full picture** | Join 5+ tables with SPs | One query on `job_id` across collections |
| **Adding a new entity** | New table + SP + migration | New Beanie document with `job_id` field |
| **Status** | Visit has 11 statuses | Same 11 statuses, on Visit document |
| **Approval** | Columns on Visit table | Embedded Approval sub-documents |
| **Workflow config** | Hardcoded per-client logic | `Job.workflow` config — QC/finance toggle per client |

---

## Tech Stack (Web + Mobile + Backend)

| Layer | Technology | Used By |
|-------|-----------|---------|
| **Web Frontend** | Next.js 15 + Tailwind + shadcn/ui | Web app |
| **Mobile Frontend** | React Native (Expo) + NativeWind | Mobile app |
| **State** | Zustand + TanStack Query | Web + Mobile |
| **Forms** | React Hook Form + Zod | Web + Mobile |
| **Shared Types** | Zod schemas in `/packages/shared-types` | Web + Mobile |
| **Offline** | WatermelonDB | Mobile only |
| **Backend** | FastAPI (Python 3.12) | Both |
| **Database** | MongoDB Atlas + Beanie ODM | Both |
| **Files** | Azure Blob Storage | Both |
| **AI** | LangChain + Azure OpenAI + Atlas Search | Both |
| **PDF** | WeasyPrint (HTML → PDF via Jinja2) | Both |
| **Excel** | openpyxl | Web (reports) |
| **Auth** | JWT (python-jose + passlib) | Both |
| **Background** | Celery + Redis | Backend |
| **Real-time** | Socket.IO | Both |

---

## Data Migration: SQL Server → MongoDB

### Collection Mapping

```
SQL Table                          MongoDB Collection
─────────────────                  ─────────────────
SiteDetails                        sites
UserDetails + Login                users
RoleDetails + ScreenFeatureMapping roles
ClientDetails + ClientUnits        clients
ManufacturerDetails + Units        manufacturers
ServiceOrderDetails                service_orders  ← job_id added
ControlDetails                     control_numbers ← job_id added
VisitDetails + VisitEmpMapping     visits          ← job_id added
PurchaseOrder*                     purchase_orders
Invoice* + Annexure*               invoices        ← job_id added
PaymentDetails                     payments
FileDetails                        files
Log                                logs
```

### Migration: Add job_id to Existing Data

Since ServiceOrders, ControlNumbers, Visits, and Invoices already form a hierarchy through foreign keys, the migration groups them per Service Order and assigns a Job ID:

```python
async def assign_job_ids():
    sos = await execute_sql("SELECT * FROM ServiceOrderDetails")
    for so in sos:
        job_id = f"JOB-{so.SOId[:8]}"       # deterministic from existing data
        controls = await execute_sql(f"SELECT * FROM ControlDetails WHERE SOId = '{so.SOId}'")
        visits = await execute_sql(f"SELECT * FROM VisitDetails WHERE SOId = '{so.SOId}'")

        # Create Job document
        await jobs.insert_one({
            "job_id": job_id,
            "client": await get_client_ref(so.ClientId),
            "title": so.ProjectName or f"Job for {so.ClientName}",
            "status": derive_job_status(visits),
            ...
        })

        # Update ServiceOrder with job_id
        await service_orders.update_one(
            {"so_id": so.SOId},
            {"$set": {"job_id": job_id}}
        )

        # Update each ControlNumber with job_id
        for c in controls:
            await control_numbers.update_one(
                {"control_number_id": c.ControlNo},
                {"$set": {"job_id": job_id}}
            )

        # Update each Visit with job_id
        for v in visits:
            await visits.update_one(
                {"visit_id": v.VisitId},
                {"$set": {"job_id": job_id}}
            )
```

---

## Project Structure (Monorepo — Web + Mobile + Backend)

```
IQEApp/
├── apps/
│   ├── web/                           # Web app (Next.js)
│   │   ├── src/
│   │   │   ├── app/                   # App Router pages
│   │   │   │   ├── (auth)/login/
│   │   │   │   ├── (dashboard)/
│   │   │   │   ├── jobs/
│   │   │   │   ├── visits/
│   │   │   │   ├── invoices/
│   │   │   │   ├── clients/
│   │   │   │   ├── manufacturers/
│   │   │   │   ├── enquiries/
│   │   │   │   ├── complaints/
│   │   │   │   ├── reports/
│   │   │   │   ├── users/
│   │   │   │   └── documents/
│   │   │   ├── components/
│   │   │   └── lib/
│   │   └── package.json
│   │
│   └── mobile/                        # React Native (Expo)
│       ├── app/
│       │   ├── (coordinator)/         # Admin/Coordinator screens
│       │   │   ├── jobs/
│       │   │   ├── approvals/
│       │   │   └── invoices/
│       │   └── (inspector)/           # Field inspector screens
│       │       └── jobs/
│       │           ├── index.tsx
│       │           ├── [id].tsx
│       │           └── [id]/capture.tsx
│       ├── stores/                    # Zustand
│       ├── api/                       # API client
│       ├── model/                     # WatermelonDB (offline)
│       └── app.json
│
├── packages/                          # Shared between web + mobile
│   ├── shared-types/                  # Zod schemas, TypeScript types
│   └── api-client/                    # Axios + JWT handling
│
├── backend/                           # FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── api/v1/                    # Route handlers
│   │   │   ├── jobs.py / visits.py / invoices.py
│   │   │   ├── clients.py / manufacturers.py
│   │   │   ├── service_orders.py / control_numbers.py
│   │   │   ├── purchase_orders.py / enquiries.py
│   │   │   ├── complaints.py / users.py
│   │   │   ├── documents.py / payments.py
│   │   │   ├── reports.py / masters.py
│   │   │   ├── sync.py               # Offline sync
│   │   │   └── ai.py                 # AI endpoints
│   │   ├── models/                    # Beanie documents
│   │   ├── schemas/                   # Pydantic
│   │   ├── services/                  # Business logic
│   │   ├── ai/                        # LangChain, Vision
│   │   └── core/                      # Auth, cache
│   ├── tests/
│   └── Dockerfile
│
└── docker-compose.yml                 # FastAPI + Redis + Celery
```

---

## Key Difference From the Old Plan

**The current file now keeps all existing entities** (Service Order, Control Number, Visit, Invoice) intact. The only addition is:

1. **Job ID** as the umbrella reference number that wraps everything
2. Every entity gets a `job_id` field
3. The status flow stays exactly as the user described (Job ID → Client → Service Order → Control Number → Visit → Inspector → QC → Finance → Invoice)
4. MongoDB replaces SQL Server but the data model preserves the same relationships
