from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import HTTPException

from modules.assignments.models import Assignment
from modules.certifications.models import Certification, CertificationStatus
from modules.invoices.models import Invoice
from modules.jobs.models import Job
from modules.reporting.models import DEFAULT_FORMATS, ReportFormat, ReportKind
from modules.work_packages.models import WorkPackage

VALID_KINDS = {k.value for k in ReportKind}


def _round2(v: float) -> float:
    return round(v + 0.0, 2)


class ReportingService:

    # ------------------------------------------------------------ registry

    @staticmethod
    async def list_formats(
        site_id: str = "SITE-01",
        work_type_code: str = "",
        kind: str = "",
        is_active: Optional[bool] = True,
    ):
        query: dict = {"site_id": site_id}
        if is_active is not None:
            query["is_active"] = is_active
        if kind:
            query["kind"] = kind
        if work_type_code:
            query["work_type_codes"] = work_type_code

        items = await ReportFormat.find(query).sort(ReportFormat.format_code).to_list()
        return {"total": len(items), "data": [i.model_dump(exclude={"id"}) for i in items]}

    @staticmethod
    async def get_format(format_code: str, site_id: str = "SITE-01") -> ReportFormat:
        fmt = await ReportFormat.find_one(
            ReportFormat.format_code == format_code, ReportFormat.site_id == site_id
        )
        if not fmt:
            raise HTTPException(404, f"Report format '{format_code}' not found")
        return fmt

    @staticmethod
    async def seed_formats(site_id: str = "SITE-01"):
        """Idempotent on (site_id, format_code)."""
        created, skipped = [], []
        for entry in DEFAULT_FORMATS:
            code = entry["format_code"]
            existing = await ReportFormat.find_one(
                ReportFormat.format_code == code, ReportFormat.site_id == site_id
            )
            if existing:
                skipped.append(code)
                continue
            await ReportFormat(**{**entry, "site_id": site_id}).insert()
            created.append(code)
        await ReportingService.sync_renderer(site_id)
        return {
            "created": created,
            "skipped_existing": skipped,
            "total_in_registry": len(DEFAULT_FORMATS),
        }

    @staticmethod
    async def sync_renderer(site_id: str = "SITE-01") -> dict:
        """Push the registry into the PDF renderer.

        Called at startup and after any change to a format. The renderer is
        synchronous, so it cannot read MongoDB itself; this is the one place
        that crosses from the async world into it. Imported locally to keep
        app.pdf free of a module-level dependency on this package.
        """
        from app.pdf.formats import load_overlay

        items = await ReportFormat.find(
            ReportFormat.site_id == site_id,
            ReportFormat.is_active == True,  # noqa: E712
        ).to_list()
        return load_overlay([i.model_dump(exclude={"id"}) for i in items])

    @staticmethod
    async def create_client_override(
        parent_format_code: str,
        client_id: str,
        overrides: dict,
        site_id: str = "SITE-01",
    ) -> ReportFormat:
        """Register a client's own layout for a standard format.

        Only the fields that differ need setting; the rest resolve from the
        parent at render time, so a change to the standard format reaches every
        client variant that did not deliberately override it.
        """
        parent = await ReportingService.get_format(parent_format_code, site_id)

        code = overrides.get("format_code") or f"{parent.format_code}__{client_id}"
        existing = await ReportFormat.find_one(
            ReportFormat.format_code == code, ReportFormat.site_id == site_id
        )
        if existing:
            raise HTTPException(409, f"Format '{code}' already exists")

        payload = {
            "format_code": code,
            "site_id": site_id,
            "name": overrides.get("name") or f"{parent.name} ({client_id})",
            "kind": parent.kind,
            "description": overrides.get("description") or parent.description,
            "work_type_codes": parent.work_type_codes,
            "is_client_specific": True,
            "client_id": client_id,
            "inherits_from": parent.format_code,
        }
        # Only carry across what the caller actually set. An override that
        # copied every parent field would stop inheriting future changes, which
        # is the whole point of the parent link.
        for field in ("template_path", "stylesheet_path", "legacy_form_code",
                      "document_title", "header_subline", "sections",
                      "requires_signatures", "annexures", "revision"):
            if overrides.get(field):
                payload[field] = overrides[field]

        fmt = ReportFormat(**payload)
        await fmt.insert()
        await ReportingService.sync_renderer(site_id)
        return fmt

    @staticmethod
    async def formats_for_work_type(work_type_code: str, site_id: str = "SITE-01"):
        """Which reports a package of this type can produce."""
        items = await ReportFormat.find(
            ReportFormat.site_id == site_id,
            ReportFormat.is_active == True,  # noqa: E712
            {"work_type_codes": work_type_code},
        ).to_list()
        return {"work_type_code": work_type_code, "total": len(items),
                "data": [i.model_dump(exclude={"id"}) for i in items]}

    # ------------------------------------------- composed project report

    @staticmethod
    async def project_report(job_id: str, site_id: str = "SITE-01"):
        """The end-to-end project report, composed from the spine.

        Not a new document type - a composition of what the other modules
        already hold, which is why it needed the spine to exist first.
        """
        # Scoped to the caller's site: without this a caller could read another
        # site's job header by guessing its identifier.
        job = await Job.find_one(Job.job_id == job_id, Job.site_id == site_id)
        if not job:
            raise HTTPException(404, f"Job '{job_id}' not found")

        packages = await WorkPackage.find(
            WorkPackage.job_id == job_id,
            WorkPackage.site_id == site_id,
            WorkPackage.is_active == True,  # noqa: E712
        ).to_list()

        certs = await Certification.find(
            Certification.job_id == job_id, Certification.site_id == site_id
        ).to_list()
        issued = [c for c in certs if c.status == CertificationStatus.ISSUED.value]

        assignments = await Assignment.find(
            Assignment.job_id == job_id, Assignment.site_id == site_id
        ).to_list()

        invoices = await Invoice.find(
            Invoice.job_id == job_id, Invoice.site_id == site_id,
            {"cancelled": {"$ne": True}},
        ).to_list()

        # --- work packages, grouped the way a project review reads them
        by_discipline: dict[str, list] = {}
        by_status: dict[str, int] = {}
        for wp in packages:
            by_status[wp.status] = by_status.get(wp.status, 0) + 1
            by_discipline.setdefault(wp.discipline or "Unassigned", []).append({
                "work_package_id": wp.work_package_id,
                "title": wp.title,
                "work_type_code": wp.work_type_code,
                "status": wp.status,
                "planned_start": wp.planned_start,
                "planned_finish": wp.planned_finish,
                "percent_complete": wp.percent_complete,
            })

        # --- certified position
        claimed = sum(c.claimed_value for c in issued)
        certified = sum(c.certified_value for c in issued)
        retention = sum(c.retention_value for c in issued)
        unbilled = [c for c in issued if not c.billed_invoice_id]

        deduction_reasons: dict[str, float] = {}
        for c in issued:
            for d in c.deductions:
                deduction_reasons[d.reason_code] = _round2(
                    deduction_reasons.get(d.reason_code, 0.0) + d.value
                )

        # --- people deployed
        people: dict[str, dict] = {}
        for a in assignments:
            e = people.setdefault(a.person_id, {
                "person_id": a.person_id, "person_name": a.person_name,
                "roles": set(), "assignments": 0, "days": 0,
            })
            e["roles"].add(a.role)
            e["assignments"] += 1
            if a.planned_from and a.planned_to:
                e["days"] += max(0, (a.planned_to - a.planned_from).days)
        for e in people.values():
            e["roles"] = sorted(e["roles"])

        # --- billing position
        invoiced = sum(i.grand_total for i in invoices)
        paid = sum(i.grand_total for i in invoices if i.payment_status == "paid")

        return {
            "format_code": "PROJECT_REPORT",
            "generated_at": datetime.now(),
            "project_header": {
                "job_id": job.job_id,
                "title": job.title,
                "client_name": job.client_name,
                "manufacturer_name": job.manufacturer_name,
                "status": job.status,
                "location": job.location_address,
            },
            "work_packages": {
                "total": len(packages),
                "by_status": by_status,
                "by_discipline": by_discipline,
            },
            "certified_position": {
                "certifications_issued": len(issued),
                "claimed_value": _round2(claimed),
                "certified_value": _round2(certified),
                "deduction_value": _round2(claimed - certified),
                "deduction_pct": round((claimed - certified) / claimed * 100, 2) if claimed else 0.0,
                "retention_held": _round2(retention),
            },
            "deductions_by_reason": deduction_reasons,
            "people_deployed": {
                "count": len(people),
                "total_days": sum(e["days"] for e in people.values()),
                "detail": list(people.values()),
            },
            "billing_position": {
                "invoices_raised": len(invoices),
                "invoiced_value": _round2(invoiced),
                "paid_value": _round2(paid),
                "outstanding_value": _round2(invoiced - paid),
                "certified_not_billed_value": _round2(sum(c.net_payable_value for c in unbilled)),
            },
        }
