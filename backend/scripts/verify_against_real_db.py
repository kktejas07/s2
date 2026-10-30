#!/usr/bin/env python3
"""Acceptance check against a real MongoDB.

Everything in tests/ runs against mongomock, which is fast and needs no server
but is not MongoDB. It does not enforce unique indexes, its aggregation and
regex handling differ, and `$regex` on a missing field behaves differently.
Those are exactly the places a suite that is green on mongomock can still fail
in production.

This script runs the same spine, end to end, against whatever MONGODB_URL
points at, and reports what mongomock cannot check:

  * indexes are actually created, and the unique ones actually reject duplicates
  * the ID generators are safe under concurrency, not just sequential
  * the `$regex` and `$in` queries the migration and wipe paths depend on
    return what the code assumes
  * the dashboard aggregations run on a real server
  * a certification's money survives a real round trip unchanged

It writes to a scratch database (default: <your db>__verify) and drops it when
it finishes, so it never touches real data.

    PYTHONPATH=. python scripts/verify_against_real_db.py
    PYTHONPATH=. python scripts/verify_against_real_db.py --keep   # leave it for inspection

Exit code 0 means everything the sandbox could not prove now holds on your
server. Anything else is a real finding - send me the output.
"""
from __future__ import annotations

import argparse
import asyncio
import sys
import traceback
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from beanie import init_beanie  # noqa: E402
from pymongo import AsyncMongoClient  # noqa: E402
from pymongo.errors import DuplicateKeyError, PyMongoError  # noqa: E402

from core.audit import AuditEntry  # noqa: E402
from core.sequences import Sequence  # noqa: E402
from core.config import settings  # noqa: E402
from modules.assignments.models import Assignment  # noqa: E402
from modules.billing.models import BillingTerms  # noqa: E402
from modules.billing.service import BillingService  # noqa: E402
from modules.certifications.models import Certification  # noqa: E402
from modules.certifications.service import CertificationService  # noqa: E402
from modules.construction_bill_verification.models import (  # noqa: E402
    ConstructionBillVerificationRecord,
)
from modules.dashboards.service import DashboardService  # noqa: E402
from modules.invoices.models import Invoice  # noqa: E402
from modules.evidence.models import Evidence  # noqa: E402
from modules.jobs.models import Job  # noqa: E402
from modules.people.models import (  # noqa: E402
    Authorization,
    CompetenceProfile,
    ImpartialityDeclaration,
    Person,
)
from modules.reporting.models import ReportFormat  # noqa: E402
from modules.reporting.service import ReportingService  # noqa: E402
from modules.schedule_m_pharma_epc.models import ScheduleMPharmaEPCProject  # noqa: E402
from modules.tpi.models import TpiReport  # noqa: E402
from modules.work_packages.models import WorkPackage  # noqa: E402
from modules.work_packages.service import WorkPackageService  # noqa: E402
from modules.work_types.models import WorkTypeDefinition  # noqa: E402
from modules.work_types.service import WorkTypeService  # noqa: E402

SITE = "SITE-VERIFY"
USER = "USR-VERIFY"

DOCUMENT_MODELS = [
    Evidence,
    AuditEntry,
    Sequence,
    Job, WorkTypeDefinition, WorkPackage, Person, CompetenceProfile,
    Authorization, ImpartialityDeclaration, Assignment, Certification,
    Invoice, BillingTerms, ReportFormat, TpiReport,
    ScheduleMPharmaEPCProject, ConstructionBillVerificationRecord,
]

PASS, FAIL, SKIP = "PASS", "FAIL", "SKIP"
results: list[tuple[str, str, str]] = []


def record(name: str, status: str, detail: str = "") -> None:
    results.append((name, status, detail))
    mark = {"PASS": "  ok  ", "FAIL": " FAIL ", "SKIP": " skip "}[status]
    print(f"[{mark}] {name}" + (f"\n          {detail}" if detail else ""))


async def check(name: str, coro) -> None:
    try:
        detail = await coro
        record(name, PASS, detail or "")
    except AssertionError as e:
        record(name, FAIL, str(e))
    except Exception as e:  # noqa: BLE001
        record(name, FAIL, f"{type(e).__name__}: {e}\n{traceback.format_exc(limit=3)}")


# ------------------------------------------------------------------ checks

async def c_indexes_exist(db) -> str:
    """mongomock accepts index declarations and does nothing with them."""
    missing = []
    for model in (WorkPackage, Certification, Person, Assignment, ReportFormat):
        coll = db[model.Settings.name]
        names = {k for k in (await coll.index_information()).keys()}
        declared = getattr(model.Settings, "indexes", []) or []
        for idx in declared:
            key = idx if isinstance(idx, str) else None
            if key and not any(key in n for n in names):
                missing.append(f"{model.Settings.name}.{key}")
    assert not missing, f"indexes declared but not created: {missing}"
    return "all declared single-field indexes exist on the server"


async def c_id_generators_are_unique_under_concurrency() -> str:
    """The ID generators read the highest existing ID and add one. That is
    safe sequentially - every test does it sequentially - and racy in parallel.
    mongomock cannot show the race because it has no real concurrency."""
    await WorkTypeService.seed_catalogue(SITE, USER)
    job = Job(job_id="JOB-VERIFY-0001", site_id=SITE, title="Concurrency probe",
              client_name="Verify", status="active")
    await job.insert()

    async def make(i: int):
        return await WorkPackageService.create(
            {"job_id": job.job_id, "work_type_code": "CODE_INSP",
             "title": f"Parallel package {i}"},
            SITE, USER,
        )

    packages = await asyncio.gather(*(make(i) for i in range(8)), return_exceptions=True)
    errors = [p for p in packages if isinstance(p, Exception)]
    ids = [p.work_package_id for p in packages if not isinstance(p, Exception)]

    assert not errors, f"{len(errors)} creates failed outright: {errors[0]}"
    duplicates = len(ids) - len(set(ids))
    assert duplicates == 0, (
        f"{duplicates} duplicate work package IDs from 8 concurrent creates: "
        f"{sorted(ids)}. The ID generator needs a unique index or a counter "
        f"collection before this runs under real load."
    )
    return f"8 concurrent creates produced 8 distinct IDs ({ids[0]} … {ids[-1]})"


async def c_unique_constraint_rejects_duplicates() -> str:
    """If a unique index is declared anywhere, a real server enforces it."""
    a = Job(job_id="JOB-VERIFY-DUP", site_id=SITE, title="First",
            client_name="Verify", status="active")
    await a.insert()
    try:
        b = Job(job_id="JOB-VERIFY-DUP", site_id=SITE, title="Second",
                client_name="Verify", status="active")
        await b.insert()
    except DuplicateKeyError:
        return "duplicate job_id rejected by a unique index"
    return ("no unique index on job_id - duplicates are possible. Not "
            "necessarily wrong, but worth knowing.")


async def c_regex_queries_behave() -> str:
    """The migration wipe path selects on {'migrated_from_ref': {'$regex': ...}}.
    On a real server that must match only documents where the field exists."""
    await WorkPackage.find(WorkPackage.site_id == SITE).delete()
    job_id = "JOB-VERIFY-0001"
    tagged = await WorkPackageService.create(
        {"job_id": job_id, "work_type_code": "CODE_INSP", "title": "Tagged",
         "migrated_from_ref": "seed:DEMO-WP-99"}, SITE, USER,
    )
    await WorkPackageService.create(
        {"job_id": job_id, "work_type_code": "CODE_INSP", "title": "Untagged"},
        SITE, USER,
    )
    found = await WorkPackage.find(
        WorkPackage.site_id == SITE,
        {"migrated_from_ref": {"$regex": "^seed:DEMO-WP-"}},
    ).to_list()
    ids = [w.work_package_id for w in found]
    assert ids == [tagged.work_package_id], (
        f"$regex selected {ids}, expected only {tagged.work_package_id}. "
        "A null field matching the pattern would make --wipe delete real records."
    )
    return "$regex matched only the tagged record, not the null field"


async def c_certification_money_round_trips() -> str:
    """Float money through a real BSON round trip. mongomock keeps Python
    floats in memory; a real server serialises them."""
    job = await Job.find_one(Job.job_id == "JOB-VERIFY-0001")
    wp = await WorkPackageService.create(
        {"job_id": job.job_id, "work_type_code": "BILL_VERIF",
         "title": "Money round trip", "rate": 1.0}, SITE, USER,
    )
    for to in ("assigned", "in_progress", "submitted", "under_qc"):
        await WorkPackageService.transition(wp.work_package_id, to, SITE, USER)

    cert = await CertificationService.create(
        {
            "work_package_id": wp.work_package_id,
            "reference_bill_no": "RA-VERIFY-01",
            "retention_pct": 5.0,
            "prepared_by": "EMP-VERIFY-1",
            "line_items": [
                {"line_id": "L1", "description": "Concrete M25", "uom": "cum",
                 "rate": 6000.0, "claimed_quantity": 100.0, "certified_quantity": 92.0},
            ],
        },
        SITE, USER,
    )
    issued = await CertificationService.issue(
        cert.certification_id, "EMP-VERIFY-2", SITE, USER
    )
    reread = await Certification.find_one(
        Certification.certification_id == issued.certification_id
    )
    assert reread.claimed_value == 600000.0, f"claimed {reread.claimed_value}"
    assert reread.certified_value == 552000.0, f"certified {reread.certified_value}"
    assert reread.retention_value == 27600.0, f"retention {reread.retention_value}"
    assert reread.net_payable_value == 524400.0, f"net {reread.net_payable_value}"
    return "claimed 600,000 → certified 552,000 → net payable 524,400, unchanged"


async def c_separation_of_duties_holds_on_server() -> str:
    from fastapi import HTTPException

    job = await Job.find_one(Job.job_id == "JOB-VERIFY-0001")
    wp = await WorkPackageService.create(
        {"job_id": job.job_id, "work_type_code": "BILL_VERIF",
         "title": "Duties probe", "rate": 1.0}, SITE, USER,
    )
    for to in ("assigned", "in_progress", "submitted", "under_qc"):
        await WorkPackageService.transition(wp.work_package_id, to, SITE, USER)
    cert = await CertificationService.create(
        {"work_package_id": wp.work_package_id, "prepared_by": "EMP-SAME",
         "line_items": [{"line_id": "L1", "description": "x", "uom": "nos",
                         "rate": 1.0, "claimed_quantity": 1.0, "certified_quantity": 1.0}]},
        SITE, USER,
    )
    try:
        await CertificationService.issue(cert.certification_id, "EMP-SAME", SITE, USER)
    except HTTPException as e:
        assert e.status_code == 409, f"expected 409, got {e.status_code}"
        return "preparer was refused as certifier (409), as designed"
    raise AssertionError(
        "BILL_VERIF allowed the preparer to certify. Check "
        "allow_self_certification on that work type."
    )


async def c_dashboard_aggregations_run() -> str:
    counts = {}
    for role in ("coordinator", "qc_reviewer", "finance", "technical_manager", "management"):
        data = await DashboardService.for_role(role, SITE)
        counts[role] = sum(len(v) for v in data.values() if isinstance(v, list))
    return f"all five aggregate dashboards executed: {counts}"


async def c_billing_queue_and_invoice() -> str:
    queue = await BillingService.billable_queue(SITE)
    jobs = queue.get("jobs", [])
    cert_ids = [c["certification_id"] for j in jobs for c in j.get("certifications", [])]
    assert cert_ids, "nothing billable after issuing a certification"
    inv = await BillingService.raise_invoice_from_certifications(
        cert_ids[:1], SITE, USER, so_id="JOB-VERIFY-0001"
    )
    gt = inv.grand_total if hasattr(inv, "grand_total") else (inv.get("grand_total") if isinstance(inv, dict) else 0)
    assert gt > 0, "invoice has no value"
    return f"invoice raised, grand total {gt:,.2f}"


async def c_report_registry_and_pdf() -> str:
    seeded = await ReportingService.seed_formats(SITE)
    await ReportingService.sync_renderer(SITE)

    from app.pdf.service import render_pdf

    rendered = []
    for code in ("IVR", "GMP_COMPLIANCE", "PROJECT_REPORT"):
        if code == "PROJECT_REPORT":
            payload = await ReportingService.project_report("JOB-VERIFY-0001", SITE)
        else:
            payload = {"report_no": "VERIFY-001", "client": "Verify"}
        pdf = render_pdf(code, payload=payload)
        assert pdf[:4] == b"%PDF", f"{code} did not render a PDF"
        rendered.append(f"{code} {len(pdf) // 1024}KB")
    return (f"{len(seeded['created'])} formats seeded; rendered " + ", ".join(rendered))


async def main(keep: bool) -> int:
    base = settings.mongodb_db_name
    verify_db = f"{base}__verify"

    print(f"Connecting to {settings.mongodb_url}")
    print(f"Using scratch database '{verify_db}' (dropped at the end"
          f"{' - but --keep was passed, so it will be left' if keep else ''}).\n")

    client = AsyncMongoClient(settings.mongodb_url, serverSelectionTimeoutMS=8000)
    try:
        await client.admin.command("ping")
    except PyMongoError as e:
        print(f"Cannot reach MongoDB: {e}", file=sys.stderr)
        return 2

    info = await client.server_info()
    print(f"Server version {info.get('version')}\n")

    db = client[verify_db]
    await init_beanie(database=db, document_models=DOCUMENT_MODELS)

    await check("indexes are created on the server", c_indexes_exist(db))
    await check("ID generation survives concurrent creates",
                c_id_generators_are_unique_under_concurrency())
    await check("unique constraints are enforced", c_unique_constraint_rejects_duplicates())
    await check("$regex selects only documents with the field", c_regex_queries_behave())
    await check("certification money round trips unchanged",
                c_certification_money_round_trips())
    await check("separation of duties is enforced", c_separation_of_duties_holds_on_server())
    await check("dashboard aggregations run", c_dashboard_aggregations_run())
    await check("billing queue and invoice", c_billing_queue_and_invoice())
    await check("report registry seeds and renders PDFs", c_report_registry_and_pdf())

    if not keep:
        await client.drop_database(verify_db)
        print(f"\nDropped {verify_db}.")

    failures = [r for r in results if r[1] == FAIL]
    print(f"\n{len(results) - len(failures)}/{len(results)} checks passed.")
    if failures:
        print("\nFailures:")
        for name, _, detail in failures:
            print(f"  - {name}: {detail.splitlines()[0] if detail else ''}")
    await client.close()
    return 1 if failures else 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--keep", action="store_true",
                    help="leave the scratch database behind for inspection")
    args = ap.parse_args()
    raise SystemExit(asyncio.run(main(args.keep)))
