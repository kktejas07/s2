"""Report format registry.

Each of the three verticals owns its own report path today, and the web app has
nine separate report screens. A format registry keyed by work type replaces that
with one renderer: the work type names its format, the format names its template
and sections.

This does not rewrite the nine existing screens. It gives new formats one home
and provides the composed project report, which had no home at all.

See SOW_EXECUTION_ARCHITECTURE.md section 6.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from beanie import Document
from pydantic import Field


class ReportKind(str, Enum):
    VISIT = "VISIT"                 # one inspection event
    CERTIFICATE = "CERTIFICATE"     # a signed assurance
    MEASUREMENT = "MEASUREMENT"     # quantities
    REGISTER = "REGISTER"           # a running list (NCR, punch, calibration)
    COMPOSED = "COMPOSED"           # built from other records, e.g. project report


class ReportFormat(Document):
    format_code: str                        # IVR, FIR, IRN, EVR, LOGSHEET, …
    site_id: str = "SITE-01"
    name: str
    kind: str = ReportKind.VISIT.value
    description: Optional[str] = None

    work_type_codes: list[str] = []         # which work types produce this
    template_path: Optional[str] = None     # app/pdf/templates/…
    sections: list[str] = []
    requires_signatures: list[str] = []     # inspector, qc_reviewer, client_witness
    annexures: list[str] = []

    # --- render details the PDF layer needs ---
    #: Defaults to template_path with a .css extension when unset.
    stylesheet_path: Optional[str] = None
    #: The form number printed in the letterhead (IQE-TP-02, F-BILL-01).
    legacy_form_code: Optional[str] = None
    #: The all-caps heading on the page; falls back to `name`.
    document_title: Optional[str] = None
    header_subline: str = "Third Party Inspection Services"

    #: Clients routinely mandate their own layouts. A client-specific format
    #: sets client_id and inherits_from, and overrides only the fields that
    #: differ - letterhead, section order, its own template. Everything else
    #: comes from the parent, so a change to the standard format reaches every
    #: client variant that did not deliberately override it.
    is_client_specific: bool = False
    client_id: Optional[str] = None
    inherits_from: Optional[str] = None     # parent format_code

    revision: str = "Rev 0"
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "report_formats"
        indexes = ["site_id", "format_code", "is_active", "client_id", "inherits_from"]


#: Seeded from the report screens that already exist in apps/web, plus the
#: formats the new modules produce. Template paths point at app/pdf/templates
#: where one already exists; the rest render from sections until a template is
#: authored.
DEFAULT_FORMATS: list[dict] = [
    {
        "format_code": "IVR", "name": "Inspection Visit Report",
        "kind": ReportKind.VISIT.value,
        "description": "Record of a single inspection visit, its findings and evidence.",
        "work_type_codes": ["CODE_INSP"],
        "template_path": "tp03.html",
        "sections": ["header", "scope", "checklist", "findings", "photographs", "conclusion"],
        "requires_signatures": ["inspector", "qc_reviewer"],
        "annexures": ["PHOTO_ANNEX"],
    },
    {
        "format_code": "FIR", "name": "Flash Inspection Report",
        "kind": ReportKind.VISIT.value,
        "description": "Short-form report issued immediately after a visit.",
        "work_type_codes": ["CODE_INSP", "EXPEDITING"],
        "template_path": "tp02.html",
        "sections": ["header", "observation", "action_required"],
        "requires_signatures": ["inspector"],
    },
    {
        "format_code": "IRN", "name": "Inspection Release Note",
        "kind": ReportKind.CERTIFICATE.value,
        "description": "Releases inspected material for despatch.",
        "work_type_codes": ["CODE_INSP"],
        "template_path": "tp04.html",
        "sections": ["header", "material", "basis_of_release", "limitations"],
        "requires_signatures": ["inspector", "qc_reviewer"],
    },
    {
        "format_code": "EVR", "name": "Expediting Visit Report",
        "kind": ReportKind.VISIT.value,
        "description": "Progress against delivery milestones, with constraints raised.",
        "work_type_codes": ["EXPEDITING"],
        "template_path": "tp05.html",
        "sections": ["header", "progress", "constraints", "recovery_plan"],
        "requires_signatures": ["inspector"],
    },
    {
        "format_code": "LOGSHEET", "name": "Site Daily Logsheet",
        "kind": ReportKind.REGISTER.value,
        "legacy_form_code": "IQE-TP-06",
        "description": "Daily record of a deputed engineer's activity.",
        "work_type_codes": ["STAFF_DEPUT"],
        "sections": ["header", "activity", "hours", "remarks"],
        "requires_signatures": ["inspector", "client_witness"],
    },
    {
        "format_code": "MEASUREMENT_SHEET", "name": "Measurement Sheet",
        "kind": ReportKind.MEASUREMENT.value,
        "legacy_form_code": "F-MEAS-01",
        "description": "Joint measurement backing a certified quantity.",
        "work_type_codes": ["BOQ_RECON", "BILL_VERIF"],
        "sections": ["header", "measured_items", "summary"],
        "requires_signatures": ["inspector", "client_witness"],
    },
    {
        "format_code": "QTY_SURVEY", "name": "Quantity Verification & Survey Report",
        "kind": ReportKind.MEASUREMENT.value,
        "description": "Measured quantity verified against claim, with survey basis.",
        "work_type_codes": ["BOQ_RECON", "BILL_VERIF"],
        "template_path": "fqual01.html",
        "sections": ["header", "survey_basis", "verified_quantities", "summary"],
        "requires_signatures": ["inspector", "qc_reviewer"],
        "annexures": ["MEASUREMENT_SHEET"],
    },
    {
        "format_code": "BOQ_RECON", "name": "BOQ Reconciliation",
        "kind": ReportKind.MEASUREMENT.value,
        "description": "Contract quantity against measured and certified quantity.",
        "work_type_codes": ["BOQ_RECON"],
        "template_path": "fboq01.html",
        "sections": ["header", "reconciliation", "variation", "summary"],
        "requires_signatures": ["inspector", "qc_reviewer"],
        "annexures": ["MEASUREMENT_SHEET"],
    },
    {
        "format_code": "RA_BILL_CERT", "name": "RA Bill Verification Certificate",
        "kind": ReportKind.CERTIFICATE.value,
        "description": "Claimed against certified value, with itemised deductions.",
        "work_type_codes": ["BILL_VERIF"],
        "template_path": "fbill01.html",
        "sections": ["header", "claimed_vs_certified", "deductions", "recommendation"],
        "requires_signatures": ["inspector", "qc_reviewer"],
        "annexures": ["MEASUREMENT_SHEET", "MATERIAL_LEDGER"],
    },
    {
        "format_code": "GMP_COMPLIANCE", "name": "Schedule M Compliance Report",
        "kind": ReportKind.REGISTER.value,
        "legacy_form_code": "F-GMP-01",
        "description": "Compliance position against Schedule M and WHO-GMP.",
        "work_type_codes": ["GMP_SCHEDM"],
        # No template authored yet. It previously pointed at fqual01.html, which
        # is the quantity survey form - a wrong template renders a confidently
        # mislabelled document, which is worse than none.
        "sections": ["header", "requirements", "findings", "ncr_summary", "conclusion"],
        "requires_signatures": ["inspector", "qc_reviewer"],
        "annexures": ["NCR", "PUNCH_LIST"],
    },
    {
        "format_code": "SAT_CERT", "name": "Site Acceptance Test Certificate",
        "kind": ReportKind.CERTIFICATE.value,
        "legacy_form_code": "F-SAT-01",
        "description": "Equipment acceptance against the approved SAT protocol.",
        "work_type_codes": ["SAT_COMM"],
        "sections": ["header", "equipment", "tests_performed", "results", "acceptance"],
        "requires_signatures": ["inspector", "client_witness"],
    },
    {
        "format_code": "VENDOR_AUDIT", "name": "Vendor Assessment Report",
        "kind": ReportKind.REGISTER.value,
        "legacy_form_code": "F-VEND-01",
        "description": "Vendor capability against client approval criteria.",
        "work_type_codes": ["VENDOR_AUDIT"],
        "sections": ["header", "capability", "quality_system", "findings", "recommendation"],
        "requires_signatures": ["inspector"],
        "annexures": ["NCR"],
    },
    {
        "format_code": "PROJECT_REPORT", "name": "End-to-End Project Report",
        "kind": ReportKind.COMPOSED.value,
        "legacy_form_code": "F-PROJ-01",
        "description": (
            "Composed per job: work packages by discipline and status, certified "
            "quantities and values against BOQ, NCRs, inspector man-days, and the "
            "billing and payment position."
        ),
        "work_type_codes": [],          # spans every work type
        "sections": [
            "project_header", "work_packages", "certified_position",
            "deductions", "people_deployed", "billing_position", "photographs",
        ],
        "requires_signatures": ["qc_reviewer"],
    },
]
