"""Migrate the legacy SQL Server user master into the Person collection.

WHY THIS EXISTS
---------------
The FastAPI rewrite carried over only Competency, InspectorRate and Associate.
The legacy ASP.NET app (IQEApp.Domain/UserDomain, IQEApp.Service/UserService)
holds considerably more: statutory IDs, banking, qualifications, secondment and
empanelment. This moves that across without losing it.

HOW TO RUN
----------
This script needs network access to the SQL Server, which the cloud sandbox does
not have. Run it from a machine that can reach the database:

    pip install pyodbc motor beanie
    export LEGACY_SQL_DSN="Driver={ODBC Driver 18 for SQL Server};Server=tcp:HOST,1433;Database=DB;UID=USER;PWD=PASS;Encrypt=yes"
    export MONGODB_URL="mongodb://localhost:27017"
    export MONGODB_DB_NAME="iqeapp_dev"

    python scripts/migrate_legacy_people.py --dry-run     # inspect first
    python scripts/migrate_legacy_people.py --commit      # then write

Credentials come from the environment only. Do not put a connection string in
this file or anywhere in the repository.

SAFETY
------
- Read-only against SQL Server. No UPDATE, DELETE or DDL is issued.
- Idempotent on migrated_from_legacy_user_id, so a re-run updates rather than
  duplicates.
- --dry-run is the default; writing requires --commit explicitly.
- Legacy CompentenceActive becomes an Authorization flagged
  unverified_legacy_grant=True. Those grants have no evidence behind them and
  must be re-evidenced at next review rather than silently trusted.
"""
from __future__ import annotations

import argparse
import re
import asyncio
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.audit import AuditEntry  # noqa: E402
from core.sequences import Sequence  # noqa: E402
from modules.people.models import (  # noqa: E402
    Authorization,
    AuthorizationStatus,
    CompetenceProfile,
    EngagementType,
    Person,
    PersonCategory,
)

# ---------------------------------------------------------------- SQL source

#: Read-only. Column list mirrors the legacy CreateUser / GetUserListDetails
#: stored procedures and IQEApp.Domain/UserDomain/UserDomainModel.cs.
LEGACY_QUERY = """
SELECT
    u.UserId,
    u.SiteId,
    u.TitleId,
    u.FirstName,
    u.LastName,
    u.EmailId,
    u.LoginName,
    u.Address,
    u.City                AS CityName,
    u.CountryId,
    u.StateId,
    u.DateofBirth,
    u.ContactNumber,
    u.EmployeeCode,
    u.InspectorCode,
    u.EmployeeTypeId,
    u.RoleID,
    u.DesignationId,
    u.Experience,
    u.Certifications,
    u.SkillSet,
    u.OtherProfessional,
    u.Qualification,
    u.ProfQualification,
    u.AssociateId,
    u.AssociateName,
    u.ContactPerson,
    u.ESI,
    u.PF,
    u.PA,
    u.Medical,
    u.BankAcc,
    u.IFSCCode,
    u.Branch,
    u.PAN,
    u.Aadhar,
    u.IsUserActive,
    u.IsSecondment,
    u.CompentenceActive
FROM Users AS u
WHERE u.SiteId = ?
"""


def fetch_legacy_rows(dsn: str, site_id_numeric: int) -> list[dict[str, Any]]:
    try:
        import pyodbc
    except ImportError:
        raise SystemExit(
            "pyodbc is not installed. Run: pip install pyodbc\n"
            "(also needs the Microsoft ODBC Driver for SQL Server)"
        )

    with pyodbc.connect(dsn, timeout=30, readonly=True) as conn:
        cur = conn.cursor()

        # Derive the category mapping from the live master first, so the rows
        # below are mapped from fact rather than from hardcoded ids.
        for note in load_employee_type_master(cur):
            print(note)
        print()

        cur.execute(LEGACY_QUERY, site_id_numeric)
        columns = [c[0] for c in cur.description]
        return [dict(zip(columns, row)) for row in cur.fetchall()]


# ------------------------------------------------------------------ mapping

#: Last-resort mapping, used only when the EmployeeType master cannot be read.
#: These ids are installation-specific, so this is a guess and the script says
#: so loudly whenever it has to fall back to it.
FALLBACK_TYPE_TO_CATEGORY: dict[int, str] = {
    1: PersonCategory.TECHNICAL_INSPECTION.value,
    2: PersonCategory.TECHNICAL_ENGINEERING.value,
    3: PersonCategory.ADMIN_SUPPORT.value,
    4: PersonCategory.CORPORATE_FUNCTION.value,
    5: PersonCategory.SITE_LABOUR.value,
}

#: Populated at runtime from the EmployeeType master. Derived mappings are
#: authoritative; FALLBACK_TYPE_TO_CATEGORY is only consulted when this is
#: empty.
EMPLOYEE_TYPE_TO_CATEGORY: dict[int, str] = {}

#: Kept for the run report, so a human can see what each id was called.
EMPLOYEE_TYPE_NAMES: dict[int, str] = {}

DEFAULT_CATEGORY = PersonCategory.TECHNICAL_INSPECTION.value

#: Word -> category. A type's name is matched against these; the first category
#: with any matching word wins, checked in the order listed so that a specific
#: word beats a generic one ("QA Engineer" is inspection, not engineering).
CATEGORY_KEYWORDS: list[tuple[str, tuple[str, ...]]] = [
    (PersonCategory.TECHNICAL_INSPECTION.value, (
        "inspect", "inspector", "ndt", "weld", "qa", "qc", "quality",
        "auditor", "witness", "tpi",
    )),
    (PersonCategory.CORPORATE_FUNCTION.value, (
        "hr", "human resource", "finance", "account", "payroll", "legal",
        "marketing", "sales", "director", "management", "manager", "it",
        "software", "developer", "admin manager",
    )),
    (PersonCategory.TECHNICAL_ENGINEERING.value, (
        "engineer", "engineering", "design", "draft", "planning", "commission",
        "estimator", "technical", "surveyor", "quantity", "billing",
    )),
    (PersonCategory.SITE_LABOUR.value, (
        "labour", "labor", "helper", "worker", "mason", "fitter", "rigger",
        "technician", "operator", "site staff", "daily wage",
    )),
    (PersonCategory.ADMIN_SUPPORT.value, (
        "admin", "office", "clerk", "peon", "driver", "receptionist",
        "store", "assistant", "support", "secretary",
    )),
]


def category_for_type_name(name: str) -> Optional[str]:
    """Best category for an employee type, from its name.

    Matching is anchored at a word boundary, not a bare substring. Plain
    substring matching classified "Site Helper" as a corporate function,
    because "it" occurs inside "site" - the kind of error that would quietly
    put a labourer in the wrong category for every report thereafter. A prefix
    match from the boundary is still allowed, so "account" matches "Accounts".
    """
    low = (name or "").strip().lower()
    if not low:
        return None
    for category, words in CATEGORY_KEYWORDS:
        for w in words:
            if re.search(r"\b" + re.escape(w), low):
                return category
    return None


#: Column pair that identifies the EmployeeType master, whatever it is called.
EMPLOYEE_TYPE_DISCOVERY = """
SELECT c1.TABLE_SCHEMA, c1.TABLE_NAME
FROM INFORMATION_SCHEMA.COLUMNS c1
JOIN INFORMATION_SCHEMA.COLUMNS c2
  ON c1.TABLE_SCHEMA = c2.TABLE_SCHEMA AND c1.TABLE_NAME = c2.TABLE_NAME
WHERE c1.COLUMN_NAME = 'EmployeeTypeId'
  AND c2.COLUMN_NAME = 'EmployeeTypeName'
"""


def load_employee_type_master(cursor) -> list[str]:
    """Read the EmployeeType master and derive the category mapping from it.

    The master's table name is discovered rather than assumed: this schema puts
    some masters in a generic mstSection/mstDetails pair and others in their own
    table, and hardcoding the wrong name is how the original guess happened.

    Returns a list of human-readable notes for the run report.
    """
    notes: list[str] = []
    try:
        cursor.execute(EMPLOYEE_TYPE_DISCOVERY)
        tables = [(r[0], r[1]) for r in cursor.fetchall()]
    except Exception as e:  # noqa: BLE001
        notes.append(f"Could not inspect the schema for an EmployeeType master: {e}")
        return notes

    if not tables:
        notes.append(
            "No table carries both EmployeeTypeId and EmployeeTypeName. The "
            "category mapping will fall back to hardcoded ids, which are a guess."
        )
        return notes

    if len(tables) > 1:
        notes.append(
            f"Several candidate masters found ({tables}); reading the first. "
            "Check that is the right one."
        )

    schema, table = tables[0]
    try:
        cursor.execute(
            f"SELECT EmployeeTypeId, EmployeeTypeName FROM [{schema}].[{table}]"
        )
        rows = cursor.fetchall()
    except Exception as e:  # noqa: BLE001
        notes.append(f"Found [{schema}].[{table}] but could not read it: {e}")
        return notes

    notes.append(f"EmployeeType master: [{schema}].[{table}] ({len(rows)} rows)")
    unmatched: list[str] = []
    for type_id, type_name in rows:
        if type_id is None:
            continue
        tid = int(type_id)
        EMPLOYEE_TYPE_NAMES[tid] = str(type_name or "")
        category = category_for_type_name(str(type_name or ""))
        if category:
            EMPLOYEE_TYPE_TO_CATEGORY[tid] = category
        else:
            unmatched.append(f"{tid}={type_name!r}")

    for tid, category in sorted(EMPLOYEE_TYPE_TO_CATEGORY.items()):
        notes.append(f"  {tid:>3}  {EMPLOYEE_TYPE_NAMES[tid]:<32} -> {category}")
    if unmatched:
        notes.append(
            "  No keyword matched these, so they will take the default "
            f"({DEFAULT_CATEGORY}): {', '.join(unmatched)}"
        )
        notes.append(
            "  Add a keyword to CATEGORY_KEYWORDS for each before applying."
        )
    return notes


def _clean(v: Any) -> Optional[str]:
    if v is None:
        return None
    s = str(v).strip()
    return s or None


def map_row(row: dict[str, Any], site_id: str) -> dict[str, Any]:
    """Legacy row -> Person payload."""
    first = _clean(row.get("FirstName")) or ""
    last = _clean(row.get("LastName")) or ""
    full_name = f"{first} {last}".strip() or _clean(row.get("LoginName")) or "Unnamed"

    emp_type = row.get("EmployeeTypeId")
    tid = int(emp_type) if emp_type is not None else -1
    # Derived from the master when it could be read; the hardcoded ids are a
    # fallback only, and the run report says which was used.
    table = EMPLOYEE_TYPE_TO_CATEGORY or FALLBACK_TYPE_TO_CATEGORY
    category = table.get(tid, DEFAULT_CATEGORY)

    if row.get("IsSecondment"):
        engagement = EngagementType.SECONDMENT.value
    elif row.get("AssociateId") or _clean(row.get("AssociateName")):
        engagement = EngagementType.ASSOCIATE.value
    else:
        engagement = EngagementType.PERMANENT.value

    return {
        "site_id": site_id,
        "migrated_from_legacy_user_id": int(row["UserId"]),
        "employee_code": _clean(row.get("EmployeeCode")),
        "title_id": row.get("TitleId"),
        "full_name": full_name,
        "first_name": first or None,
        "last_name": last or None,
        "date_of_birth": row.get("DateofBirth"),
        "phone": _clean(row.get("ContactNumber")),
        "email": _clean(row.get("EmailId")),
        "address": _clean(row.get("Address")),
        "country_id": row.get("CountryId"),
        "state_id": row.get("StateId"),
        "city_name": _clean(row.get("CityName")),
        "base_location": _clean(row.get("CityName")),
        "category": category,
        "engagement_type": engagement,
        "designation_id": row.get("DesignationId"),
        "inspector_code": _clean(row.get("InspectorCode")),
        "skill_sets": _clean(row.get("SkillSet")),
        "qualification_text": _clean(row.get("Qualification")),
        "prof_qualification": _clean(row.get("ProfQualification")),
        "experience_text": _clean(row.get("Experience")),
        "certifications_text": _clean(row.get("Certifications")),
        "other_professional": _clean(row.get("OtherProfessional")),
        "associate_id": _clean(row.get("AssociateId")),
        "associate_name": _clean(row.get("AssociateName")),
        "contact_person": _clean(row.get("ContactPerson")),
        "bank_account": _clean(row.get("BankAcc")),
        "ifsc_code": _clean(row.get("IFSCCode")),
        "bank_branch": _clean(row.get("Branch")),
        "pan": _clean(row.get("PAN")),
        "aadhaar": _clean(row.get("Aadhar")),
        "esi_no": _clean(row.get("ESI")),
        "pf_no": _clean(row.get("PF")),
        "pa_no": _clean(row.get("PA")),
        "medical_ref": _clean(row.get("Medical")),
        "employment_status": "active" if row.get("IsUserActive") else "exited",
    }


# ------------------------------------------------------------------- runner

async def run(dsn: str, site_id: str, site_id_numeric: int, commit: bool, limit: int):
    from beanie import init_beanie
    from pymongo import AsyncMongoClient

    rows = fetch_legacy_rows(dsn, site_id_numeric)
    if limit:
        rows = rows[:limit]
    print(f"Read {len(rows)} legacy user rows for site {site_id_numeric}.\n")

    if not commit:
        print("DRY RUN — nothing will be written. Sample of the mapping:\n")
        for row in rows[:5]:
            m = map_row(row, site_id)
            print(f"  legacy UserId {m['migrated_from_legacy_user_id']}: "
                  f"{m['full_name']} | {m['category']} | {m['engagement_type']} | "
                  f"emp={m['employee_code']} insp={m['inspector_code']}")
        unmapped = {
            int(r["EmployeeTypeId"]) for r in rows
            if r.get("EmployeeTypeId") is not None
            and int(r["EmployeeTypeId"])
            not in (EMPLOYEE_TYPE_TO_CATEGORY or FALLBACK_TYPE_TO_CATEGORY)
        }
        if EMPLOYEE_TYPE_TO_CATEGORY:
            print(f"\n  Categories derived from the EmployeeType master "
                  f"({len(EMPLOYEE_TYPE_TO_CATEGORY)} types).")
        else:
            print("\n  WARNING: the EmployeeType master could not be read, so "
                  "categories came from hardcoded ids, which are a GUESS. "
                  "Do not --commit on this basis.")

        if unmapped:
            print(f"\n  WARNING: EmployeeTypeId values with no category mapping: "
                  f"{sorted(unmapped)} — these default to {DEFAULT_CATEGORY}.")
            print("  Check them against the EmployeeType master before committing.")
        legacy_grants = sum(1 for r in rows if r.get("CompentenceActive"))
        print(f"\n  {legacy_grants} rows carry CompentenceActive and would become "
              f"authorizations flagged unverified_legacy_grant.")
        print("\nRe-run with --commit to write.")
        return

    client = AsyncMongoClient(os.environ.get("MONGODB_URL", "mongodb://localhost:27017"))
    await init_beanie(
        database=client[os.environ.get("MONGODB_DB_NAME", "iqeapp_dev")],
        document_models=[
            AuditEntry,
            Sequence,Person, CompetenceProfile, Authorization],
    )

    created = updated = grants = 0
    seq = await Person.find(Person.site_id == site_id).count()

    for row in rows:
        payload = map_row(row, site_id)
        legacy_id = payload["migrated_from_legacy_user_id"]

        existing = await Person.find_one(
            Person.migrated_from_legacy_user_id == legacy_id,
            Person.site_id == site_id,
        )
        if existing:
            for k, v in payload.items():
                if k not in ("site_id", "migrated_from_legacy_user_id") and hasattr(existing, k):
                    setattr(existing, k, v)
            existing.updated_at = datetime.now()
            await existing.save()
            person = existing
            updated += 1
        else:
            seq += 1
            payload["person_id"] = f"EMP-{seq:05d}"
            payload["created_by"] = "legacy-migration"
            person = Person(**payload)
            await person.insert()
            created += 1

        # CompentenceActive -> an authorization, explicitly marked as unevidenced.
        if row.get("CompentenceActive"):
            has_auth = await Authorization.find_one(
                Authorization.person_id == person.person_id,
                Authorization.site_id == site_id,
            )
            if not has_auth:
                await Authorization(
                    authorization_id=f"ATH-{datetime.now().year}-{grants + 1:04d}",
                    person_id=person.person_id,
                    site_id=site_id,
                    inspection_types=[],
                    status=AuthorizationStatus.AUTHORIZED.value,
                    unverified_legacy_grant=True,
                    authorized_by="legacy-migration",
                    authorized_on=datetime.now(),
                ).insert()
                grants += 1

    print(f"Created {created} people, updated {updated}.")
    print(f"Created {grants} authorizations flagged unverified_legacy_grant.")
    print("\nNext: review those grants, set their inspection_types, and re-evidence")
    print("them before relying on deployability. Then run the deployability sweep.")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--commit", action="store_true", help="write to MongoDB (default is a dry run)")
    ap.add_argument("--site-id", default="SITE-01", help="target site_id in the new system")
    ap.add_argument("--legacy-site-id", type=int, default=1, help="numeric SiteId in SQL Server")
    ap.add_argument("--limit", type=int, default=0, help="only process the first N rows")
    args = ap.parse_args()

    dsn = os.environ.get("LEGACY_SQL_DSN")
    if not dsn:
        raise SystemExit(
            "LEGACY_SQL_DSN is not set.\n\n"
            "Export it first, for example:\n"
            '  export LEGACY_SQL_DSN="Driver={ODBC Driver 18 for SQL Server};'
            'Server=tcp:HOST,1433;Database=DB;UID=USER;PWD=PASS;Encrypt=yes"\n\n'
            "Never commit a connection string to the repository."
        )

    asyncio.run(run(dsn, args.site_id, args.legacy_site_id, args.commit, args.limit))


if __name__ == "__main__":
    main()
