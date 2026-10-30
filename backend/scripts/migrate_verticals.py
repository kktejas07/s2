#!/usr/bin/env python3
"""Promote the three legacy verticals onto the execution spine.

Dry run by default. Nothing is written until you pass --apply, and because
everything written is idempotent on migrated_from_ref, an interrupted run is
fixed by running it again rather than by cleaning up.

    # see the plan, write nothing
    python scripts/migrate_verticals.py

    # one vertical at a time, which is how to do it the first time
    python scripts/migrate_verticals.py --only tpi
    python scripts/migrate_verticals.py --only tpi --apply

    # everything
    python scripts/migrate_verticals.py --apply

Reads MONGODB_URL from the environment via core.config, the same as the API.
The legacy collections are read and never written to, so the old routes keep
working throughout - which is what makes the cut-over reversible.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from beanie import init_beanie  # noqa: E402
from pymongo import AsyncMongoClient  # noqa: E402

from core.config import settings  # noqa: E402
from modules.assignments.models import Assignment  # noqa: E402
from modules.billing.models import BillingTerms  # noqa: E402
from modules.certifications.models import Certification  # noqa: E402
from modules.construction_bill_verification.models import (  # noqa: E402
    ConstructionBillVerificationRecord,
)
from modules.invoices.models import Invoice  # noqa: E402
from modules.jobs.models import Job  # noqa: E402
from modules.migration import service as migration  # noqa: E402
from modules.people.models import (  # noqa: E402
    Authorization,
    CompetenceProfile,
    ImpartialityDeclaration,
    Person,
)
from modules.schedule_m_pharma_epc.models import ScheduleMPharmaEPCProject  # noqa: E402
from modules.tpi.models import TpiReport  # noqa: E402
from modules.work_packages.models import WorkPackage  # noqa: E402
from modules.work_types.models import WorkTypeDefinition  # noqa: E402
from core.audit import AuditEntry  # noqa: E402
from core.sequences import Sequence  # noqa: E402

RUNNERS = {
    "tpi": migration.migrate_tpi_reports,
    "schedule-m": migration.migrate_schedule_m_projects,
    "cbv": migration.migrate_construction_bill_verifications,
    "all": migration.migrate_all,
}


async def main(which: str, site_id: str, user_id: str, apply: bool) -> int:
    client = AsyncMongoClient(settings.mongodb_url)
    await init_beanie(
        database=client[settings.mongodb_db_name],
        document_models=[
            AuditEntry,
            Sequence,
            Job, WorkTypeDefinition, WorkPackage, Person, CompetenceProfile,
            Authorization, ImpartialityDeclaration, Assignment, Certification,
            Invoice, BillingTerms, TpiReport, ScheduleMPharmaEPCProject,
            ConstructionBillVerificationRecord,
        ],
    )

    result = await RUNNERS[which](site_id, user_id, not apply)
    print(json.dumps(result, indent=2, default=str))

    if not apply:
        print(
            "\nDRY RUN - nothing was written. Re-run with --apply to write it.",
            file=sys.stderr,
        )
    await client.close()
    return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--only", dest="which", choices=sorted(RUNNERS), default="all",
                    help="which vertical to migrate (default: all)")
    ap.add_argument("--site-id", default="SITE-01")
    ap.add_argument("--user-id", default="USR-MIGRATION")
    ap.add_argument("--apply", action="store_true",
                    help="actually write. Without this, prints the plan and exits.")
    args = ap.parse_args()
    raise SystemExit(asyncio.run(main(args.which, args.site_id, args.user_id, args.apply)))
