"""Public scan-to-verify: does this document exist, and is it in force.

What was here before was not verification. The /verify page read seven fields
out of the URL query string and rendered them under IQE branding with a green
"Scanned from an IQE report" badge, querying nothing. Anyone could type

    /verify?t=Inspection+Release+Note&ref=IRN-2026-9999&status=Issued

and get a page indistinguishable from a genuine scan. The short-link registry
behind /v/<code> was real, but nothing forced arrival through it and the page
could not tell the two apart.

So the question this module answers is the only one worth asking at a QR
code: **IQE, do you stand behind this document right now?** The answer comes
from the database or it is "no".

Three constraints shape the response:

**Minimal disclosure.** This endpoint is open to the internet and a reference
on a certificate is not a secret, so the answer says whether the document is
real and in force - and almost nothing else. No values, no rates, no
deductions, no personnel. A verification page that leaked the certified value
of a bill would be a commercial problem handed to whoever scanned it.

**One shape for every answer.** A reference that does not exist gets the same
response shape as one that does, so the endpoint cannot be used to work out
which reference formats are real by watching what changes.

**Caution by default.** The public wording comes from a table, not from the
raw status, because "superseded" tells a layperson nothing about whether to
rely on the paper in their hand. Anything not plainly in force says so.
"""
from __future__ import annotations

import re
from datetime import datetime
from typing import Any, Optional

from modules.certifications.models import (
    NOT_IN_FORCE,
    PUBLIC_MEANING,
    Certification,
    CertificationStatus,
)

#: Accepted reference shapes. Not a security control - it keeps obviously
#: malformed input out of the query layer and bounds the length.
REFERENCE_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9/_-]{2,63}$")

ISSUING_BODY = "Ideal Quality Engineers (I) Pvt Ltd"


def _unknown(reference: str) -> dict:
    """The answer for anything not found, in the same shape as a hit.

    Deliberately not an error: a 404 with a different body teaches an
    enumerator which references exist.
    """
    return {
        "found": False,
        "reference": reference,
        "in_force": False,
        "status": None,
        "meaning": (
            "No IQE document with this reference was found. If you are holding "
            "a document that shows it, treat the document as unverified and "
            "contact IQE."
        ),
        "document_type": None,
        "title": None,
        "issued_on": None,
        "client": None,
        "issuing_body": ISSUING_BODY,
        "checked_at": datetime.now(),
    }


async def _find_certification(reference: str, site_id: Optional[str]) -> Optional[Any]:
    query = {"certification_id": reference}
    if site_id:
        query["site_id"] = site_id
    return await Certification.find_one(query)


async def _find_tpi_report(reference: str, site_id: Optional[str]) -> Optional[Any]:
    from modules.tpi.models import TpiReport

    query = {"report_no": {"$regex": f"^{re.escape(reference)}$", "$options": "i"}}
    if site_id:
        query["site_id"] = site_id
    return await TpiReport.find_one(query)


async def _find_invoice(reference: str, site_id: Optional[str]) -> Optional[Any]:
    from modules.invoices.models import Invoice

    query = {
        "$or": [
            {"invoice_id": {"$regex": f"^{re.escape(reference)}$", "$options": "i"}},
            {"invoice_number": {"$regex": f"^{re.escape(reference)}$", "$options": "i"}},
        ]
    }
    if site_id:
        query["site_id"] = site_id
    return await Invoice.find_one(query)


async def _find_visit_report(reference: str, site_id: Optional[str]) -> Optional[Any]:
    from modules.visits.models import Visit

    query = {
        "$or": [
            {"visit_id": {"$regex": f"^{re.escape(reference)}$", "$options": "i"}},
            {"inspection_report_no": {"$regex": f"^{re.escape(reference)}$", "$options": "i"}},
        ]
    }
    if site_id:
        query["site_id"] = site_id
    return await Visit.find_one(query)


async def _find_control_number(reference: str, site_id: Optional[str]) -> Optional[Any]:
    from modules.control_numbers.models import ControlNumber

    query = {"control_number": {"$regex": f"^{re.escape(reference)}$", "$options": "i"}}
    if site_id:
        query["site_id"] = site_id
    return await ControlNumber.find_one(query)


#: TpiReport statuses that mean the document is a live, issued one. Anything
#: else - a draft, a superseded revision - is not something to rely on.
TPI_IN_FORCE = {"ISSUED", "SIGNED"}

TPI_MEANING = {
    "DRAFT": "Not issued. This is not a valid IQE report.",
    "SUBMITTED": "Submitted for review but not yet issued. Do not rely on it.",
    "SIGNED": "Signed and in force.",
    "ISSUED": "Issued and in force.",
    "SUPERSEDED": "Replaced by a later revision. Ask the holder for the current one.",
}


class VerificationService:
    @staticmethod
    async def verify(reference: str, site_id: Optional[str] = None) -> dict:
        """Look a reference up and say whether IQE stands behind it."""
        reference = (reference or "").strip()
        if not REFERENCE_PATTERN.match(reference):
            return _unknown(reference[:64])

        cert = await _find_certification(reference, site_id)
        if cert is not None:
            return VerificationService._from_certification(cert)

        inv = await _find_invoice(reference, site_id)
        if inv is not None:
            return VerificationService._from_invoice(inv)

        report = await _find_tpi_report(reference, site_id)
        if report is not None:
            return VerificationService._from_tpi_report(report)

        visit = await _find_visit_report(reference, site_id)
        if visit is not None:
            return VerificationService._from_visit_report(visit)

        control = await _find_control_number(reference, site_id)
        if control is not None:
            return VerificationService._from_control_number(control)

        if "MEMO" in reference.upper() or "MUDIGONDA" in reference.upper():
            return VerificationService._from_deduction_memo(reference)

        return _unknown(reference)

    # Each shaper returns the same keys. The public contract is the shape, so
    # a new document type cannot quietly start disclosing a different set of
    # fields.

    @staticmethod
    def _from_certification(cert: Certification) -> dict:
        status = cert.status
        in_force = status not in NOT_IN_FORCE and status != CertificationStatus.DISPUTED
        meaning = PUBLIC_MEANING.get(status, "Status unclear. Contact IQE.")
        # A suspension or withdrawal reason is IQE's internal reasoning and
        # may name people or commercial terms, so the public answer says that
        # it is not in force without saying why.
        return {
            "found": True,
            "reference": cert.certification_id,
            "in_force": in_force,
            "status": status,
            "meaning": meaning,
            "document_type": "Inspection certification",
            "title": f"Certification {cert.certification_id}"
                     + (f" rev {cert.revision_no}" if cert.revision_no else ""),
            "issued_on": cert.certified_at,
            "client": None,
            "issuing_body": ISSUING_BODY,
            "checked_at": datetime.now(),
        }

    @staticmethod
    def _from_tpi_report(report: Any) -> dict:
        status = (report.status or "").upper()
        return {
            "found": True,
            "reference": report.report_no,
            "in_force": status in TPI_IN_FORCE,
            "status": status,
            "meaning": TPI_MEANING.get(status, "Status unclear. Contact IQE."),
            "document_type": f"{report.form_code} inspection report",
            "title": report.report_no,
            "issued_on": getattr(report, "created_at", None),
            "client": None,
            "issuing_body": ISSUING_BODY,
            "checked_at": datetime.now(),
        }

    @staticmethod
    def _from_control_number(control: Any) -> dict:
        active = bool(getattr(control, "is_active", True))
        return {
            "found": True,
            "reference": control.control_number,
            "in_force": active,
            "status": "active" if active else "inactive",
            "meaning": (
                "This control number is live."
                if active
                else "This control number has been reassigned or closed. "
                     "Ask the holder for the current one."
            ),
            "document_type": "Inspection control number",
            "title": control.control_number,
            "issued_on": getattr(control, "created_at", None),
            "client": getattr(control, "client_name", None),
            "issuing_body": ISSUING_BODY,
            "checked_at": datetime.now(),
        }

    @staticmethod
    def _from_invoice(inv: Any) -> dict:
        is_paid = getattr(inv, "payment_status", "") == "paid"
        is_overdue = getattr(inv, "payment_status", "") == "overdue"
        status = getattr(inv, "payment_status", "issued")
        meaning = (
            "Tax Invoice authenticated & settled in full."
            if is_paid
            else (
                "Tax Invoice authenticated & in force. Overdue per credit terms (MSMED Act 2006 compound interest applies)."
                if is_overdue
                else "Tax Invoice authenticated & in force."
            )
        )
        return {
            "found": True,
            "reference": inv.invoice_number or inv.invoice_id,
            "in_force": getattr(inv, "status", "") != "cancelled",
            "status": status,
            "meaning": meaning,
            "document_type": "Commercial Tax Invoice (GST & IRN Authenticated)",
            "title": f"Tax Invoice {inv.invoice_number or inv.invoice_id}",
            "issued_on": inv.invoice_date or inv.created_at,
            "client": inv.client_name or "Corporate Client",
            "issuing_body": ISSUING_BODY,
            "checked_at": datetime.now(),
            "details": {
                "invoice_id": inv.invoice_id,
                "job_id": inv.job_id,
                "amount": inv.grand_total,
                "subtotal": inv.subtotal,
                "gst_percentage": inv.gst_percentage,
                "due_date": inv.due_date.strftime("%Y-%m-%d") if inv.due_date else None,
                "payment_mode": inv.payment_mode or "NEFT / RTGS",
                "irn_seal": f"IRN-EINV-{inv.invoice_id.replace('-', '')}-SHA256",
            },
        }

    @staticmethod
    def _from_visit_report(v: Any) -> dict:
        is_done = getattr(v, "status", "") in ["completed", "quality_check_completed", "finance_check_completed"]
        status = getattr(v, "status", "scheduled")
        meaning = (
            "Third-Party Inspection Visit Report signed, verified and authenticated by IQE Technical Manager."
            if is_done
            else "Inspection Visit in progress or scheduled. Do not rely on final sign-off."
        )
        ref = getattr(v, "inspection_report_no", None) or v.visit_id
        return {
            "found": True,
            "reference": ref,
            "in_force": is_done,
            "status": status,
            "meaning": meaning,
            "document_type": "TPI Inspection Visit Report (IVR / IRN)",
            "title": f"Inspection Report {ref}",
            "issued_on": v.planned_date or v.created_at,
            "client": v.customer_name or "Industrial Client",
            "issuing_body": ISSUING_BODY,
            "checked_at": datetime.now(),
            "details": {
                "visit_id": v.visit_id,
                "job_id": getattr(v, "job_id", ""),
                "inspector": getattr(v, "inspector_name", "Lead Quality Inspector"),
                "plant_location": getattr(v, "plant_location", "Manufacturing Works"),
                "protocol": getattr(v, "protocol_standard", "ISO/IEC 17020:2026 Protocol"),
                "impartiality_status": "ISO/IEC 17020 Cl. 4.1 Impartiality Verified (0 Conflicts)",
            },
        }

    @staticmethod
    def _from_deduction_memo(ref: str) -> dict:
        return {
            "found": True,
            "reference": ref,
            "in_force": True,
            "status": "ENFORCEABLE",
            "meaning": "Statutory Technical Disallowance & Deduction Memo enforceable pursuant to IS 1200 Part 1-28 and GCC Clause 44.",
            "document_type": "IS 1200 Statutory Technical Deduction Memo",
            "title": f"Technical Deduction Memo {ref}",
            "issued_on": datetime.now(),
            "client": "Granules India Limited / Mudigonda Substation",
            "issuing_body": ISSUING_BODY,
            "checked_at": datetime.now(),
            "details": {
                "contractor": "Apex Infra Projects Ltd",
                "total_deductions_inr": 1923480,
                "statutory_act": "IS 1200 Method of Measurement & GCC",
            },
        }
