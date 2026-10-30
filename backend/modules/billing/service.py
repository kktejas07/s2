from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import HTTPException

from core.audit import AuditAction, record as audit
from core.sequences import next_identifier
from modules.billing.models import (
    BillingFrequency,
    BillingTerms,
    InvoiceLineItem,
    PaymentTerms,
    ageing_bucket,
    due_date_for,
    is_overdue,
)
from modules.certifications.models import Certification, CertificationStatus
from modules.certifications.service import CertificationService
from modules.invoices.models import Invoice
from modules.work_packages.models import WorkPackage
from modules.work_packages.service import WorkPackageService

VALID_TERMS = {t.value for t in PaymentTerms}
VALID_FREQUENCIES = {f.value for f in BillingFrequency}


def _round2(v: float) -> float:
    return round(v + 0.0, 2)


def compute_invoice_totals(
    lines: list[InvoiceLineItem],
    gst_percentage: float = 18.0,
    tds_percentage: float = 0.0,
    retention_pct: float = 0.0,
    advance_recovery_pct: float = 0.0,
    intra_state: bool = True,
) -> dict:
    """Work an invoice out from its lines.

    Pure arithmetic so the money can be verified without a database.

    Order matters and follows Indian contracting practice: retention and advance
    recovery come off the taxable base, GST applies to what remains, and TDS is
    withheld from the gross.
    """
    subtotal = sum(li.amount for li in lines)
    retention = subtotal * (retention_pct / 100.0)
    advance_recovery = subtotal * (advance_recovery_pct / 100.0)
    taxable = subtotal - retention - advance_recovery

    cgst = sgst = igst = 0.0
    if intra_state:
        cgst = sgst = taxable * (gst_percentage / 200.0)   # split equally
    else:
        igst = taxable * (gst_percentage / 100.0)

    gross = taxable + cgst + sgst + igst
    tds = gross * (tds_percentage / 100.0)

    return {
        "subtotal": _round2(subtotal),
        "retention_value": _round2(retention),
        "advance_recovery_value": _round2(advance_recovery),
        "taxable_value": _round2(taxable),
        "cgst": _round2(cgst),
        "sgst": _round2(sgst),
        "igst": _round2(igst),
        "tds": _round2(tds),
        "grand_total": _round2(gross - tds),
    }


async def _next_id(model, site_id: str, prefix_root: str, field: str) -> str:
    """PREFIX-YYYY-NNNN, allocated atomically. See core/sequences.py."""
    return await next_identifier(
        model, field, site_id, prefix_root, kind=f"billing:{prefix_root}"
    )


class BillingService:

    # ------------------------------------------------------------ terms

    @staticmethod
    async def get_terms(so_id: str, site_id: str = "SITE-01") -> Optional[BillingTerms]:
        return await BillingTerms.find_one(
            BillingTerms.so_id == so_id, BillingTerms.site_id == site_id
        )

    @staticmethod
    async def set_terms(so_id: str, data: dict, site_id: str = "SITE-01", user_id: str = "USR-001"):
        code = data.get("payment_terms_code")
        if code and code not in VALID_TERMS:
            raise HTTPException(400, f"Invalid payment_terms_code '{code}'. Expected one of: {sorted(VALID_TERMS)}")
        freq = data.get("billing_frequency")
        if freq and freq not in VALID_FREQUENCIES:
            raise HTTPException(400, f"Invalid billing_frequency '{freq}'. Expected one of: {sorted(VALID_FREQUENCIES)}")
        for pct_field in ("retention_pct", "advance_pct", "advance_recovered_pct", "gst_percentage", "tds_percentage"):
            v = data.get(pct_field)
            if v is not None and not (0 <= float(v) <= 100):
                raise HTTPException(400, f"{pct_field} must be between 0 and 100")

        existing = await BillingService.get_terms(so_id, site_id)
        if existing:
            for k, v in data.items():
                if k not in ("terms_id", "so_id", "site_id", "created_by", "created_at", "id") and hasattr(existing, k):
                    setattr(existing, k, v)
            existing.updated_at = datetime.now()
            await existing.save()
            return existing

        data["so_id"] = so_id
        data["site_id"] = site_id
        data["created_by"] = user_id
        data["terms_id"] = await _next_id(BillingTerms, site_id, "BT", "terms_id")
        terms = BillingTerms(**data)
        await terms.insert()
        return terms

    @staticmethod
    async def term_options():
        return {
            "payment_terms": sorted(VALID_TERMS),
            "billing_frequencies": sorted(VALID_FREQUENCIES),
        }

    # --------------------------------------------------------- billable

    @staticmethod
    async def billable_queue(site_id: str = "SITE-01", job_id: str = ""):
        """Certifications issued and not yet invoiced, grouped by job.

        This is the finance work queue: verified value waiting to be billed.
        """
        query: dict = {
            "site_id": site_id,
            "status": CertificationStatus.ISSUED.value,
            "billed_invoice_id": None,
        }
        if job_id:
            query["job_id"] = job_id

        certs = await Certification.find(query).sort(-Certification.certified_at).to_list()

        by_job: dict[str, dict] = {}
        for c in certs:
            entry = by_job.setdefault(
                c.job_id,
                {"job_id": c.job_id, "certification_count": 0, "billable_value": 0.0,
                 "currency": c.currency, "certifications": []},
            )
            entry["certification_count"] += 1
            entry["billable_value"] = _round2(entry["billable_value"] + c.net_payable_value)
            entry["certifications"].append({
                "certification_id": c.certification_id,
                "work_package_id": c.work_package_id,
                "reference_bill_no": c.reference_bill_no,
                "certified_value": c.certified_value,
                "net_payable_value": c.net_payable_value,
                "certified_at": c.certified_at,
            })

        jobs = sorted(by_job.values(), key=lambda j: -j["billable_value"])
        return {
            "total_billable_value": _round2(sum(j["billable_value"] for j in jobs)),
            "total_certifications": len(certs),
            "jobs": jobs,
        }

    # -------------------------------------------------------- invoicing

    @staticmethod
    async def raise_invoice_from_certifications(
        certification_ids: list[str],
        site_id: str = "SITE-01",
        user_id: str = "USR-001",
        so_id: Optional[str] = None,
        intra_state: bool = True,
    ):
        """Create a draft invoice from issued certifications.

        Every line traces to the certification that authorised it, and each
        certification is consumed so the same certified value cannot be billed
        twice.
        """
        if not certification_ids:
            raise HTTPException(400, "Select at least one certification to bill")

        certs: list[Certification] = []
        for cid in certification_ids:
            c = await CertificationService.get(cid, site_id)
            if c.status != CertificationStatus.ISSUED.value:
                raise HTTPException(409, f"{cid} is {c.status}; only an issued certification can be billed")
            if c.billed_invoice_id:
                raise HTTPException(409, f"{cid} is already billed on {c.billed_invoice_id}")
            certs.append(c)

        job_ids = {c.job_id for c in certs}
        if len(job_ids) > 1:
            raise HTTPException(
                400,
                f"Certifications span {len(job_ids)} jobs ({', '.join(sorted(job_ids))}). "
                "Raise one invoice per job.",
            )
        job_id = certs[0].job_id
        currency = certs[0].currency

        # Terms: from the service order if one is given, else sensible defaults.
        terms = await BillingService.get_terms(so_id, site_id) if so_id else None
        gst = terms.gst_percentage if terms else 18.0
        tds = terms.tds_percentage if terms else 0.0
        advance_recovery = terms.advance_recovered_pct if terms else 0.0
        payment_terms_code = terms.payment_terms_code if terms else PaymentTerms.NET_30.value
        custom_days = terms.custom_term_days if terms else None

        lines: list[InvoiceLineItem] = []
        for i, c in enumerate(certs, start=1):
            wp = await WorkPackage.find_one(
                WorkPackage.work_package_id == c.work_package_id,
                WorkPackage.site_id == site_id,
            )
            lines.append(
                InvoiceLineItem(
                    line_id=f"IL-{i:03d}",
                    description=(wp.title if wp else c.work_package_id)
                    + (f" — bill {c.reference_bill_no}" if c.reference_bill_no else ""),
                    source_type="certification",
                    source_id=c.certification_id,
                    work_package_id=c.work_package_id,
                    rate_basis=wp.rate_basis if wp else None,
                    quantity=c.certified_quantity,
                    uom=c.uom,
                    rate=wp.rate if wp else 0.0,
                    # Retention is already deducted inside the certification, so
                    # the invoice bills net payable and does not retain again.
                    amount=c.net_payable_value,
                )
            )

        totals = compute_invoice_totals(
            lines, gst_percentage=gst, tds_percentage=tds,
            retention_pct=0.0,                      # see note above
            advance_recovery_pct=advance_recovery,
            intra_state=intra_state,
        )

        invoice_date = datetime.now()
        invoice_id = await _next_id(Invoice, site_id, "INV", "invoice_id")

        invoice = Invoice(
            invoice_id=invoice_id,
            invoice_number=invoice_id,
            job_id=job_id,
            site_id=site_id,
            status="draft",
            invoice_date=invoice_date,
            due_date=due_date_for(invoice_date, payment_terms_code, custom_days),
            billing_type="certified",
            gst_percentage=gst,
            subtotal=totals["subtotal"],
            cgst=totals["cgst"],
            sgst=totals["sgst"],
            igst=totals["igst"],
            tds=totals["tds"],
            grand_total=totals["grand_total"],
            created_by=user_id,
        )
        await invoice.insert()

        await audit(
            "invoice", invoice.invoice_id, AuditAction.BILL,
            actor={"user_id": user_id},
            note=f"Raised from {len(certs)} certification(s)",
            context={
                "job_id": invoice.job_id,
                "certification_ids": [c.certification_id for c in certs],
                "grand_total": invoice.grand_total,
            },
            site_id=site_id,
        )

        # Consume the certifications and advance their work packages.
        for c in certs:
            await CertificationService.mark_billed(c.certification_id, invoice_id, site_id)
            wp = await WorkPackage.find_one(
                WorkPackage.work_package_id == c.work_package_id,
                WorkPackage.site_id == site_id,
            )
            if wp and wp.status == "certified":
                await WorkPackageService.transition(
                    wp.work_package_id, "billed", site_id, user_id,
                    f"invoiced on {invoice_id}",
                )

        return {
            "invoice_id": invoice_id,
            "job_id": job_id,
            "currency": currency,
            "payment_terms_code": payment_terms_code,
            "due_date": invoice.due_date,
            "line_count": len(lines),
            "lines": [li.model_dump() for li in lines],
            **totals,
            "certifications_billed": [c.certification_id for c in certs],
        }

    # -------------------------------------------------------- receivable

    @staticmethod
    async def receivables(site_id: str = "SITE-01"):
        """Outstanding invoices by ageing bucket."""
        invoices = await Invoice.find(
            Invoice.site_id == site_id, {"cancelled": {"$ne": True}}
        ).to_list()

        buckets: dict[str, dict] = {}
        overdue_value = 0.0
        outstanding = 0.0

        for inv in invoices:
            status = inv.payment_status or "unpaid"
            bucket = ageing_bucket(inv.due_date, status)
            b = buckets.setdefault(bucket, {"bucket": bucket, "count": 0, "value": 0.0})
            b["count"] += 1
            b["value"] = _round2(b["value"] + inv.grand_total)
            if status != "paid":
                outstanding += inv.grand_total
                if is_overdue(inv.due_date, status):
                    overdue_value += inv.grand_total

        order = ["current", "1_30", "31_60", "61_90", "90_plus", "no_due_date", "paid"]
        return {
            "outstanding_value": _round2(outstanding),
            "overdue_value": _round2(overdue_value),
            "buckets": [buckets[k] for k in order if k in buckets],
        }
