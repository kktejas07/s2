"""Promoting the three legacy verticals onto the execution spine.

`modules/tpi`, `modules/schedule_m_pharma_epc` and
`modules/construction_bill_verification` each re-model the same five concepts:
a piece of scoped work, who performed it, what was measured, what was
certified, and what is billable. The spine now models those once. This module
reads each vertical and writes the equivalent spine records.

Three properties this holds to, because a migration you cannot re-run is a
migration you cannot recover:

1. **Dry run by default.** Every entry point defaults to dry_run=True and
   returns exactly what it would write, so the plan is reviewable before
   anything is created.
2. **Idempotent.** Everything written carries migrated_from_ref
   ("<collection>:<key>") and is looked up on that first. A run interrupted
   halfway is fixed by running it again.
3. **Non-destructive.** The legacy records are read, never written or deleted.
   The old routes keep working, which is what makes the cut-over reversible -
   if the spine records are wrong, delete them and re-run.

What this does NOT do is judge whether the legacy data is right. A claimed
value that was wrong in the vertical is still wrong after migration; it is
simply wrong in one place instead of four.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from fastapi import HTTPException

from modules.certifications.models import Certification, CertificationStatus
from modules.certifications.service import CertificationService
from modules.construction_bill_verification.models import (
    ConstructionBillVerificationRecord,
)
from modules.jobs.models import Job
from modules.schedule_m_pharma_epc.models import ScheduleMPharmaEPCProject
from modules.tpi.models import TpiReport
from modules.work_packages.models import WorkPackage
from modules.work_packages.service import WorkPackageService
from modules.work_types.models import WorkTypeDefinition


def _round2(v: float) -> float:
    return round(v + 0.0, 2)


async def _require_work_type(code: str, site_id: str) -> WorkTypeDefinition:
    wt = await WorkTypeDefinition.find_one(
        WorkTypeDefinition.work_type_code == code,
        WorkTypeDefinition.site_id == site_id,
    )
    if not wt:
        raise HTTPException(
            400,
            f"Work type '{code}' is not in the catalogue for {site_id}. "
            "Seed the catalogue before migrating (POST /work-types/seed).",
        )
    return wt


async def _find_by_ref(model, ref: str, site_id: str):
    return await model.find_one(model.migrated_from_ref == ref, model.site_id == site_id)


async def _ensure_job(
    *,
    job_id: str,
    title: str,
    client_name: str,
    manufacturer_name: Optional[str] = None,
    location: Optional[str] = None,
    site_id: str = "SITE-01",
    dry_run: bool = True,
) -> tuple[str, bool]:
    """Returns (job_id, created). Jobs are keyed on the deterministic job_id,
    so re-running finds the one from the previous run rather than making a
    second."""
    existing = await Job.find_one(Job.job_id == job_id, Job.site_id == site_id)
    if existing:
        return existing.job_id, False
    if dry_run:
        return job_id, True
    job = Job(
        job_id=job_id,
        site_id=site_id,
        title=title,
        client_name=client_name,
        manufacturer_name=manufacturer_name,
        location_address=location,
        status="active",
    )
    await job.insert()
    return job.job_id, True


# --------------------------------------------------------------------- TPI

#: A TPI form code says what kind of inspection it reported.
TPI_FORM_TO_WORK_TYPE = {
    "TP02": "CODE_INSP",      # flash inspection report
    "TP03": "CODE_INSP",      # inspection visit report
    "TP04": "CODE_INSP",      # inspection release note
    "TP05": "EXPEDITING",     # expediting visit report
}

#: Where a legacy report sat in its own lifecycle, expressed as a spine status.
#: An ISSUED report is work that was done and signed off, so the package is
#: carried to under_qc - not to certified, because nothing in the vertical
#: recorded a separate certifying act and inventing one would be a lie about
#: the evidence.
TPI_STATUS_TO_PACKAGE_PATH = {
    "DRAFT": [],
    "SUBMITTED": ["assigned", "in_progress", "submitted"],
    "SIGNED": ["assigned", "in_progress", "submitted", "under_qc"],
    "ISSUED": ["assigned", "in_progress", "submitted", "under_qc"],
    "SUPERSEDED": ["assigned", "in_progress", "submitted"],
}


async def migrate_tpi_reports(
    site_id: str = "SITE-01",
    user_id: str = "USR-MIGRATION",
    dry_run: bool = True,
    limit: int = 0,
) -> dict:
    """Each TPI report becomes a work package under a job for its customer."""
    for code in set(TPI_FORM_TO_WORK_TYPE.values()):
        await _require_work_type(code, site_id)

    reports = await TpiReport.find_all().to_list()
    if limit:
        reports = reports[:limit]

    planned: list[dict] = []
    skipped: list[dict] = []
    unmapped: list[dict] = []
    jobs_touched: set[str] = set()

    for r in reports:
        ref = f"tpi_reports:{r.id}"
        existing = await _find_by_ref(WorkPackage, ref, site_id)
        if existing:
            skipped.append({"ref": ref, "work_package_id": existing.work_package_id})
            continue

        work_type = TPI_FORM_TO_WORK_TYPE.get(r.form_code)
        if not work_type:
            unmapped.append({
                "ref": ref,
                "form_code": r.form_code,
                "reason": "form code has no work type mapping; add it to TPI_FORM_TO_WORK_TYPE",
            })
            continue

        # A deterministic job id per customer keeps every report for one
        # customer under one job instead of one job per report.
        customer = (r.customer or "Unknown customer").strip()
        job_key = "".join(ch for ch in customer.upper() if ch.isalnum())[:12] or "UNKNOWN"
        job_id = f"JOB-MIG-TPI-{job_key}"
        job_id, _ = await _ensure_job(
            job_id=job_id,
            title=f"{customer} - third party inspection (migrated)",
            client_name=customer,
            manufacturer_name=r.supplier,
            site_id=site_id,
            dry_run=dry_run,
        )
        jobs_touched.add(job_id)

        payload = {
            "job_id": job_id,
            "work_type_code": work_type,
            "title": r.report_no or f"{r.form_code} report",
            "description": (
                f"Migrated from TPI {r.form_code} report {r.report_no} "
                f"(revision {r.revision}, PO {r.po_no or 'n/a'})."
            ),
            "migrated_from_ref": ref,
        }
        path = TPI_STATUS_TO_PACKAGE_PATH.get(r.status, [])

        if dry_run:
            planned.append({**payload, "status_path": path, "legacy_status": r.status})
            continue

        wp = await WorkPackageService.create(payload, site_id, user_id)
        for to in path:
            await WorkPackageService.transition(
                wp.work_package_id, to, site_id, user_id,
                f"migrated: legacy TPI status {r.status}",
            )
        planned.append({
            "work_package_id": wp.work_package_id, **payload,
            "status_path": path, "legacy_status": r.status,
        })

    return {
        "source": "tpi_reports",
        "dry_run": dry_run,
        "records_read": len(reports),
        "work_packages": planned,
        "skipped_already_migrated": skipped,
        "unmapped": unmapped,
        "jobs_touched": sorted(jobs_touched),
    }


# ------------------------------------------------------- Schedule M pharma EPC


async def migrate_schedule_m_projects(
    site_id: str = "SITE-01",
    user_id: str = "USR-MIGRATION",
    dry_run: bool = True,
) -> dict:
    """One Schedule M project becomes a job; each discipline in its checklist
    becomes a work package; each RA bill review becomes a certification.

    Grouping by discipline rather than by checklist line is deliberate: a
    checklist item is a verification point, not a scoped piece of work, and one
    package per line would produce hundreds of packages nobody can schedule.
    """
    await _require_work_type("GMP_SCHEDM", site_id)
    await _require_work_type("BILL_VERIF", site_id)

    projects = await ScheduleMPharmaEPCProject.find_all().to_list()
    planned_packages: list[dict] = []
    planned_certs: list[dict] = []
    skipped: list[dict] = []
    jobs_touched: set[str] = set()

    for proj in projects:
        job_id = f"JOB-MIG-SCHM-{proj.project_id}"
        job_id, _ = await _ensure_job(
            job_id=job_id,
            title=proj.project_name,
            client_name=proj.client_name,
            manufacturer_name=proj.epc_contractor,
            location=proj.facility_location,
            site_id=site_id,
            dry_run=dry_run,
        )
        jobs_touched.add(job_id)

        # --- one package per discipline present in the checklist
        by_discipline: dict[str, list] = {}
        for item in proj.checklists or []:
            by_discipline.setdefault(item.discipline or "Unassigned", []).append(item)

        for discipline, items in sorted(by_discipline.items()):
            ref = f"schedule_m_pharma_epc:{proj.project_id}:discipline:{discipline}"
            existing = await _find_by_ref(WorkPackage, ref, site_id)
            if existing:
                skipped.append({"ref": ref, "work_package_id": existing.work_package_id})
                continue

            # Status reflects the evidence: everything verified means the work
            # was done, but certification was a separate act the vertical did
            # not record, so it stops at under_qc.
            pending = [i for i in items if i.status in ("PENDING", "FAIL")]
            if not items:
                path = []
            elif pending:
                path = ["assigned", "in_progress"]
            else:
                path = ["assigned", "in_progress", "submitted", "under_qc"]

            payload = {
                "job_id": job_id,
                "work_type_code": "GMP_SCHEDM",
                "title": f"{discipline} - Schedule M verification",
                "description": (
                    f"{len(items)} verification point(s) migrated from "
                    f"{proj.project_id}; {len(pending)} still open."
                ),
                "discipline": discipline,
                "migrated_from_ref": ref,
            }

            if dry_run:
                planned_packages.append({
                    **payload, "status_path": path,
                    "verification_points": len(items), "open_points": len(pending),
                })
                continue

            wp = await WorkPackageService.create(payload, site_id, user_id)
            for to in path:
                await WorkPackageService.transition(
                    wp.work_package_id, to, site_id, user_id, "migrated from Schedule M checklist",
                )
            planned_packages.append({
                "work_package_id": wp.work_package_id, **payload,
                "status_path": path,
                "verification_points": len(items), "open_points": len(pending),
            })

        # --- RA bill reviews become certifications, one per bill
        # A review row is a single BOQ line, and several rows share one
        # ra_bill_no. Grouping by bill is what makes each certification the
        # claim it actually certifies rather than a fragment of one.
        bills: dict[str, list] = {}
        for review in getattr(proj, "ra_bill_reviews", None) or []:
            bills.setdefault(getattr(review, "ra_bill_no", None) or "unnumbered", []).append(review)

        for bill_no, rows in sorted(bills.items()):
            ref = f"schedule_m_pharma_epc:{proj.project_id}:ra_bill:{bill_no}"
            existing_cert = await _find_by_ref(Certification, ref, site_id)
            if existing_cert:
                skipped.append({"ref": ref, "certification_id": existing_cert.certification_id})
                continue

            priced = [
                r for r in rows
                if _first_number(r, ("claimed_value", "claimed_amount")) is not None
                and _first_number(
                    r, ("verified_value", "certified_value", "verified_payable_amount"),
                ) is not None
            ]
            if not priced:
                planned_certs.append({
                    "ref": ref, "skipped": True,
                    "reason": (
                        "no claimed/verified pair on any line of this bill - a certification "
                        "without those two numbers would assert a value nobody verified"
                    ),
                })
                continue

            claimed = sum(
                _first_number(r, ("claimed_value", "claimed_amount")) or 0.0 for r in priced
            )
            certified = sum(
                _first_number(r, ("verified_value", "certified_value", "verified_payable_amount"))
                or 0.0
                for r in priced
            )
            planned_certs.append({
                "ref": ref,
                "reference_bill_no": bill_no,
                "line_items": len(priced),
                "lines_without_values": len(rows) - len(priced),
                "packages": sorted({getattr(r, "package", "") for r in priced if getattr(r, "package", "")}),
                "claimed_value": _round2(claimed),
                "certified_value": _round2(certified),
                "deduction_value": _round2(claimed - certified),
                "needs_work_package": True,
            })

    return {
        "source": "schedule_m_pharma_epc",
        "dry_run": dry_run,
        "records_read": len(projects),
        "work_packages": planned_packages,
        "certifications": planned_certs,
        "skipped_already_migrated": skipped,
        "jobs_touched": sorted(jobs_touched),
        "note": (
            "RA bill reviews are reported but not written: each needs a work package to "
            "attach to, and which discipline's package a bill belongs to is a judgement "
            "the legacy data does not record. Review the list, then create them against "
            "the right package."
        ),
    }


# -------------------------------------------- construction bill verification


async def migrate_construction_bill_verifications(
    site_id: str = "SITE-01",
    user_id: str = "USR-MIGRATION",
    dry_run: bool = True,
) -> dict:
    """Each CBV record becomes a BILL_VERIF package plus the certification that
    records what was claimed against what was found payable.

    This is the vertical that maps most cleanly, because its abstract items
    already hold claimed_amount and verified_payable_amount per line - the
    exact shape a certification line item takes.
    """
    await _require_work_type("BILL_VERIF", site_id)

    records = await ConstructionBillVerificationRecord.find_all().to_list()
    planned: list[dict] = []
    skipped: list[dict] = []
    jobs_touched: set[str] = set()

    for rec in records:
        wp_ref = f"construction_bill_verification:{rec.report_ref}"
        existing = await _find_by_ref(WorkPackage, wp_ref, site_id)
        if existing:
            skipped.append({"ref": wp_ref, "work_package_id": existing.work_package_id})
            continue

        job_key = "".join(ch for ch in (rec.site_name or "SITE").upper() if ch.isalnum())[:12]
        job_id = f"JOB-MIG-CBV-{job_key or 'UNKNOWN'}"
        job_id, _ = await _ensure_job(
            job_id=job_id,
            title=f"{rec.site_name} - bill verification (migrated)",
            client_name=rec.client_name,
            manufacturer_name=rec.contractor_name,
            location=rec.site_name,
            site_id=site_id,
            dry_run=dry_run,
        )
        jobs_touched.add(job_id)

        items = rec.abstract_items or []
        line_items = [
            {
                "line_id": it.item_code or it.sl_no or f"L{i + 1}",
                "description": it.description,
                "uom": it.unit,
                "rate": it.unit_rate,
                # Quantities are derived from value and rate so the certified
                # value matches the legacy figure exactly rather than being
                # recomputed from quantities that may not reconcile.
                "claimed_quantity": _qty_from(it.claimed_amount, it.unit_rate, it.total_consumed),
                "certified_quantity": _qty_from(
                    it.verified_payable_amount, it.unit_rate, it.total_consumed,
                ),
            }
            for i, it in enumerate(items)
        ]
        claimed = _round2(sum(it.claimed_amount for it in items))
        certified = _round2(sum(it.verified_payable_amount for it in items))

        wp_payload = {
            "job_id": job_id,
            "work_type_code": "BILL_VERIF",
            "title": f"{rec.ra_bill_no} verification",
            "description": (
                f"Migrated from {rec.report_ref}; audit period {rec.audit_period}; "
                f"{len(items)} abstract item(s)."
            ),
            "discipline": "Civil",
            "migrated_from_ref": wp_ref,
        }
        cert_summary = {
            "reference_bill_no": rec.ra_bill_no,
            "line_items": len(line_items),
            "claimed_value": claimed,
            "certified_value": certified,
            "deduction_value": _round2(claimed - certified),
        }

        if dry_run:
            planned.append({**wp_payload, "certification": cert_summary})
            continue

        wp = await WorkPackageService.create(wp_payload, site_id, user_id)
        for to in ("assigned", "in_progress", "submitted", "under_qc"):
            await WorkPackageService.transition(
                wp.work_package_id, to, site_id, user_id, "migrated from CBV record",
            )

        cert = await CertificationService.create(
            {
                "work_package_id": wp.work_package_id,
                "reference_bill_no": rec.ra_bill_no,
                "line_items": line_items,
                "prepared_by": user_id,
                "migrated_from_ref": wp_ref,
            },
            site_id, user_id,
        )
        # Left as a draft on purpose. Issuing would stamp IQE's certification on
        # a figure this migration has not re-verified, and the separation-of-duties
        # rule exists precisely to stop a single actor doing that.
        planned.append({
            "work_package_id": wp.work_package_id, **wp_payload,
            "certification": {**cert_summary, "certification_id": cert.certification_id,
                              "status": cert.status},
        })

    return {
        "source": "construction_bill_verification",
        "dry_run": dry_run,
        "records_read": len(records),
        "work_packages": planned,
        "skipped_already_migrated": skipped,
        "jobs_touched": sorted(jobs_touched),
        "note": (
            "Certifications are created as drafts. Issuing them requires a named "
            f"certifier who is not {user_id}, which is the separation-of-duties rule "
            "working as intended - a migration must not certify value on IQE's behalf."
        ),
    }


# ------------------------------------------------------------------ helpers


def _first_number(obj: Any, names: tuple[str, ...]) -> Optional[float]:
    for n in names:
        v = getattr(obj, n, None)
        if isinstance(v, (int, float)) and not isinstance(v, bool):
            return float(v)
    return None


def _qty_from(value: float, rate: float, fallback_qty: float) -> float:
    """Quantity implied by a value and a rate.

    The legacy records carry both amounts and quantities, and they do not always
    reconcile. Deriving quantity from the amount keeps the money exact, which is
    what gets argued over; where no rate exists the recorded quantity is used.
    """
    if rate:
        return _round2(value / rate)
    return _round2(fallback_qty or 0.0)


async def migrate_all(
    site_id: str = "SITE-01",
    user_id: str = "USR-MIGRATION",
    dry_run: bool = True,
) -> dict:
    """All three verticals in one pass. Dry run by default."""
    tpi = await migrate_tpi_reports(site_id, user_id, dry_run)
    schm = await migrate_schedule_m_projects(site_id, user_id, dry_run)
    cbv = await migrate_construction_bill_verifications(site_id, user_id, dry_run)
    return {
        "dry_run": dry_run,
        "ran_at": datetime.now(),
        "verticals": [tpi, schm, cbv],
        "totals": {
            "records_read": tpi["records_read"] + schm["records_read"] + cbv["records_read"],
            "work_packages": (
                len(tpi["work_packages"]) + len(schm["work_packages"]) + len(cbv["work_packages"])
            ),
            "skipped_already_migrated": (
                len(tpi["skipped_already_migrated"])
                + len(schm["skipped_already_migrated"])
                + len(cbv["skipped_already_migrated"])
            ),
        },
    }
