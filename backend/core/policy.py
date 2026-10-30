"""The RBAC matrix, as code.

ARCHITECTURE_AND_E2E_FLOW.md §6.2 sets out who may do what across thirteen
areas of the system. Until now it described nothing: `require_roles` existed
and was applied to no route, so the matrix was documentation of an intention.

Guarding ~195 endpoints by editing each signature would be a large change with
a large surface for mistakes, and the result would be a policy scattered across
thirty files where no one could read it. Instead the matrix lives here, in one
table, and a single dependency applies it by matching the request's method and
path prefix.

Two deliberate choices:

* **Unlisted areas are allowed to any authenticated caller, not denied.**
  Default-deny on a running system means discovering the gaps by breaking
  production. Everything in the table is enforced; everything else still
  requires authentication, which is already a large step up from where this
  started. Areas are added to the table as their permissions are confirmed
  with IQE.
* **Reads and writes are separated.** Most of the matrix's nuance is that a
  role can see something it cannot change - Finance views certifications,
  Inspectors view their own work. Collapsing that into one permission would
  lose the distinction that makes the matrix useful.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from fastapi import HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials

from core.auth import Role, get_current_user

READ_METHODS = {"GET", "HEAD", "OPTIONS"}

#: Everyone who is not a client of IQE. Used where the matrix says a role may
#: look but the client portal may not.
ALL_INTERNAL = [
    Role.ADMIN, Role.COORDINATOR, Role.INSPECTOR, Role.QC_AUDITOR,
    Role.FINANCE, Role.TECHNICAL_MANAGER,
]


@dataclass(frozen=True)
class Rule:
    """Who may read, and who may write, in one area of the system."""

    prefix: str
    read: list[Role] = field(default_factory=lambda: list(ALL_INTERNAL))
    write: list[Role] = field(default_factory=lambda: [Role.ADMIN])
    #: Why these roles, in the words of the matrix - so a 403 can be explained
    #: and a future change can tell whether it contradicts a decision.
    note: str = ""


#: Ordered longest-prefix-first at match time, so "/people/authorizations"
#: beats "/people".
MATRIX: list[Rule] = [
    Rule(
        prefix="/people/authorizations",
        read=ALL_INTERNAL,
        write=[Role.ADMIN, Role.TECHNICAL_MANAGER],
        note="Authorizing inspection personnel sits with a named competent "
             "technical function under ISO/IEC 17020, not with administration.",
    ),
    Rule(
        prefix="/certifications",
        read=ALL_INTERNAL,
        write=[Role.ADMIN, Role.COORDINATOR, Role.INSPECTOR, Role.QC_AUDITOR],
        note="Coordinators and inspectors prepare; the QC auditor issues. "
             "Issue itself carries its own stricter guard on the route.",
    ),
    Rule(
        prefix="/billing",
        read=[Role.ADMIN, Role.FINANCE, Role.QC_AUDITOR, Role.COORDINATOR,
              Role.TECHNICAL_MANAGER],
        write=[Role.ADMIN, Role.FINANCE],
        note="Generate Invoice & Rates: Finance full, others view.",
    ),
    Rule(
        prefix="/invoices",
        read=[Role.ADMIN, Role.FINANCE, Role.QC_AUDITOR, Role.COORDINATOR,
              Role.TECHNICAL_MANAGER],
        write=[Role.ADMIN, Role.FINANCE],
        note="As billing.",
    ),
    Rule(
        prefix="/payments",
        read=[Role.ADMIN, Role.FINANCE],
        write=[Role.ADMIN, Role.FINANCE],
        note="Money in and out is Finance's alone.",
    ),
    Rule(
        prefix="/assignments",
        read=ALL_INTERNAL,
        write=[Role.ADMIN, Role.COORDINATOR, Role.TECHNICAL_MANAGER],
        note="Coordinators assign; the technical manager may override.",
    ),
    Rule(
        prefix="/work-packages",
        read=ALL_INTERNAL,
        write=[Role.ADMIN, Role.COORDINATOR, Role.INSPECTOR],
        note="Coordinators scope the work, inspectors progress it.",
    ),
    Rule(
        prefix="/work-types",
        read=ALL_INTERNAL,
        write=[Role.ADMIN, Role.TECHNICAL_MANAGER],
        note="A work type sets competence requirements, so changing one is a "
             "technical decision.",
    ),
    Rule(
        prefix="/people",
        read=ALL_INTERNAL,
        write=[Role.ADMIN, Role.TECHNICAL_MANAGER],
        note="Manage Users & Masters: Admin full, others read.",
    ),
    Rule(
        prefix="/equipment",
        read=ALL_INTERNAL,
        write=[Role.ADMIN, Role.TECHNICAL_MANAGER, Role.QC_AUDITOR],
        note="Calibration status is a technical control.",
    ),
    Rule(
        prefix="/appeals",
        read=ALL_INTERNAL,
        write=[Role.ADMIN, Role.QC_AUDITOR, Role.TECHNICAL_MANAGER],
        note="An appeal is decided by people independent of the original "
             "decision; the route checks that independently of role.",
    ),
    Rule(
        prefix="/migration",
        read=[Role.ADMIN],
        write=[Role.ADMIN],
        note="Migration rewrites the shape of live data.",
    ),
    Rule(
        prefix="/users",
        read=ALL_INTERNAL,
        write=[Role.ADMIN],
        note="Manage Users & Masters: Admin full, others read.",
    ),
    Rule(
        prefix="/masters",
        read=ALL_INTERNAL,
        write=[Role.ADMIN],
        note="As users.",
    ),

    # --- Jobs and the commercial chain -------------------------------
    Rule(
        prefix="/jobs",
        read=ALL_INTERNAL + [Role.CLIENT],
        write=[Role.ADMIN, Role.COORDINATOR],
        note="Create Job & Service Order: Admin and Coordinator full, everyone "
             "else read, including the client portal.",
    ),
    Rule(
        prefix="/service-orders",
        read=ALL_INTERNAL + [Role.CLIENT],
        write=[Role.ADMIN, Role.COORDINATOR],
        note="As jobs.",
    ),
    Rule(
        prefix="/enquiries",
        read=ALL_INTERNAL,
        write=[Role.ADMIN, Role.COORDINATOR],
        note="Enquiry & Proposal: Admin and Coordinator full, Finance and the "
             "technical manager view for go/no-go input.",
    ),
    Rule(
        prefix="/ncrs",
        read=ALL_INTERNAL + [Role.CLIENT],
        write=[Role.ADMIN, Role.COORDINATOR, Role.TECHNICAL_MANAGER,
               Role.INSPECTOR, Role.QC_AUDITOR],
        note="Nonconformities. Clients read because a finding against their "
             "contractor is theirs to act on, and a concession against their "
             "specification is theirs to grant. Inspectors write because "
             "raising one is the inspector's own act at the point of "
             "inspection.",
    ),
    Rule(
        prefix="/rates",
        read=ALL_INTERNAL,
        write=[Role.ADMIN, Role.FINANCE],
        note="Rate cards and the floor. Not client-readable: another "
             "client's card and IQE's own cost base are both in here. "
             "Writing is finance, because the floor is a cost question.",
    ),
    Rule(
        prefix="/commercial",
        read=ALL_INTERNAL + [Role.CLIENT],
        write=[Role.ADMIN, Role.COORDINATOR, Role.FINANCE],
        note="Order terms, consumption and amendments. Clients read because "
             "the envelope is theirs - they authorised the value and the "
             "period, and an amendment is a change to their commitment. "
             "Writing is commercial, not technical: a technical manager does "
             "not move a ceiling.",
    ),
    Rule(
        prefix="/itps",
        read=ALL_INTERNAL + [Role.CLIENT],
        write=[Role.ADMIN, Role.COORDINATOR, Role.TECHNICAL_MANAGER],
        note="Inspection and Test Plans. Clients read them because the plan "
             "is theirs - they imposed the hold points and are entitled to "
             "see what was agreed. Writing is held to the people who agree "
             "the plan with them.",
    ),
    Rule(
        prefix="/inspection-calls",
        read=ALL_INTERNAL + [Role.CLIENT],
        write=[Role.ADMIN, Role.COORDINATOR, Role.INSPECTOR],
        note="Calls against those points. Inspectors write because recording "
             "attendance and its outcome is the inspector's own act, at the "
             "point it happens, not something a coordinator transcribes later.",
    ),
    Rule(
        prefix="/risks",
        read=ALL_INTERNAL,
        write=[Role.ADMIN, Role.TECHNICAL_MANAGER, Role.QC_AUDITOR],
        note="The risk and opportunity register (ISO/IEC 17020:2026, which "
             "replaced preventive action with it). Readable by any internal "
             "role, because a risk nobody can see is one nobody raises "
             "against; owned and scored by the quality function.",
    ),
    Rule(
        prefix="/internal-audits",
        read=[Role.ADMIN, Role.TECHNICAL_MANAGER, Role.QC_AUDITOR],
        write=[Role.ADMIN, Role.QC_AUDITOR],
        note="Internal audit, now planned from the register rather than a "
             "calendar. Narrower than the register itself: an audit in "
             "progress names the areas suspected of weakness, which is not "
             "something to circulate before it is concluded.",
    ),
    Rule(
        prefix="/providers",
        read=ALL_INTERNAL,
        write=[Role.ADMIN, Role.TECHNICAL_MANAGER, Role.QC_AUDITOR],
        note="The register of externally provided services (ISO/IEC 17020:2026). "
             "Any internal role may read it - an inspector about to rely on a "
             "subcontractor needs to see whether they are approved. Approving "
             "one is a technical judgement about competence and accreditation, "
             "so writing is held to the same roles that authorise personnel.",
    ),
    Rule(
        prefix="/proposals",
        read=ALL_INTERNAL,
        write=[Role.ADMIN, Role.COORDINATOR, Role.FINANCE],
        note="A quotation is a priced commitment, so Finance can revise and "
             "issue alongside the coordinator who drafted it. Clients do not "
             "read this: they receive the revision that was issued to them, "
             "not the drafts and the margin behind it.",
    ),
    Rule(
        prefix="/pipeline",
        read=[Role.ADMIN, Role.COORDINATOR, Role.FINANCE, Role.TECHNICAL_MANAGER],
        write=[Role.ADMIN],
        note="Win rates, pipeline value and why work was lost. Commercially "
             "sensitive and of no use to an inspector or a QC auditor, so it "
             "is not opened to all internal roles the way most reads are.",
    ),
    Rule(
        prefix="/purchase-orders",
        read=[Role.ADMIN, Role.FINANCE, Role.COORDINATOR],
        write=[Role.ADMIN, Role.FINANCE, Role.COORDINATOR],
        note="Commercial documents, handled by the same people who raise them.",
    ),
    Rule(
        prefix="/finance",
        read=[Role.ADMIN, Role.FINANCE],
        write=[Role.ADMIN, Role.FINANCE],
        note="Receivables and payables are Finance's alone.",
    ),

    # --- Execution ----------------------------------------------------
    Rule(
        prefix="/visits",
        read=ALL_INTERNAL + [Role.CLIENT],
        write=[Role.ADMIN, Role.COORDINATOR, Role.INSPECTOR],
        note="Execute Visit & Upload Data: inspectors full on assigned work, "
             "coordinators edit, everyone else view.",
    ),
    Rule(
        prefix="/evidence",
        read=ALL_INTERNAL,
        write=[Role.ADMIN, Role.COORDINATOR, Role.INSPECTOR, Role.QC_AUDITOR],
        note="Whoever performs or reviews the work attaches its evidence.",
    ),
    Rule(
        prefix="/control-numbers",
        read=ALL_INTERNAL,
        write=[Role.ADMIN, Role.COORDINATOR],
        note="Control number allocation is a coordination act.",
    ),
    Rule(
        prefix="/construction-bill-verification",
        read=ALL_INTERNAL,
        write=[Role.ADMIN, Role.COORDINATOR, Role.INSPECTOR],
        note="Legacy vertical; same permissions as the work packages that "
             "supersede it.",
    ),
    Rule(
        prefix="/schedule-m-pharma-epc",
        read=ALL_INTERNAL,
        write=[Role.ADMIN, Role.COORDINATOR, Role.INSPECTOR],
        note="As the construction vertical.",
    ),

    # --- Masters ------------------------------------------------------
    Rule(
        prefix="/clients",
        read=ALL_INTERNAL,
        write=[Role.ADMIN],
        note="Manage Users & Masters: Admin full, others read.",
    ),
    Rule(
        prefix="/manufacturers",
        read=ALL_INTERNAL,
        write=[Role.ADMIN],
        note="As clients.",
    ),
    Rule(
        prefix="/documents",
        read=ALL_INTERNAL,
        write=[Role.ADMIN, Role.QC_AUDITOR],
        note="The controlled-document register. Issuing a revision is a "
             "quality act, not an administrative one.",
    ),

    # --- Quality -------------------------------------------------------
    Rule(
        prefix="/complaints",
        read=ALL_INTERNAL,
        write=[Role.ADMIN, Role.COORDINATOR, Role.QC_AUDITOR],
        note="Complaints concern service and are handled by whoever owns the "
             "relationship; appeals contest the decision and are separate.",
    ),
    Rule(
        prefix="/audit",
        read=ALL_INTERNAL,
        write=[Role.ADMIN],
        note="The trail is append-only and written by the system; no route "
             "writes to it. Searching across it is restricted on the route.",
    ),

    # --- Reporting and analysis ----------------------------------------
    Rule(
        prefix="/reporting",
        read=ALL_INTERNAL + [Role.CLIENT],
        write=[Role.ADMIN, Role.QC_AUDITOR],
        note="Executive Reports: everyone reads what they are entitled to; "
             "changing a report format is a quality decision.",
    ),
    Rule(
        prefix="/reports",
        read=ALL_INTERNAL + [Role.CLIENT],
        write=[Role.ADMIN, Role.COORDINATOR, Role.INSPECTOR, Role.QC_AUDITOR],
        note="The legacy report screens; written by whoever performs the work.",
    ),
    Rule(
        prefix="/dashboards",
        read=ALL_INTERNAL,
        write=[Role.ADMIN],
        note="Role dashboards are read-only views over other modules.",
    ),
    Rule(
        prefix="/dashboard",
        read=ALL_INTERNAL,
        write=[Role.ADMIN],
        note="As dashboards.",
    ),
    Rule(
        prefix="/analytics",
        read=ALL_INTERNAL,
        write=[Role.ADMIN],
        note="Executive Reports.",
    ),

    # --- Assists --------------------------------------------------------
    Rule(
        prefix="/ai-assist",
        read=ALL_INTERNAL,
        write=[Role.ADMIN, Role.COORDINATOR, Role.INSPECTOR, Role.QC_AUDITOR],
        note="Assists run against work the caller is performing or reviewing.",
    ),
    Rule(
        prefix="/ai",
        read=ALL_INTERNAL,
        write=[Role.ADMIN, Role.COORDINATOR, Role.INSPECTOR, Role.QC_AUDITOR],
        note="As ai-assist. Note /ai is the superseded facade module.",
    ),

    # --- Legacy TPI form routes (mounted under /api, not /api/v1) -------
    Rule(
        prefix="/tpi",
        read=ALL_INTERNAL + [Role.CLIENT],
        write=[Role.ADMIN, Role.COORDINATOR, Role.INSPECTOR, Role.QC_AUDITOR],
        note="The TPI form lifecycle. Issuing carries its own check in the "
             "service; this stops a client or finance user editing a report.",
    ),
    Rule(
        prefix="/pdf",
        read=ALL_INTERNAL + [Role.CLIENT],
        write=[Role.ADMIN, Role.COORDINATOR, Role.INSPECTOR, Role.QC_AUDITOR],
        note="Rendering a document is a read; generating one belongs to "
             "whoever performs the work.",
    ),

    # --- Self-service --------------------------------------------------
    Rule(
        prefix="/auth",
        read=ALL_INTERNAL + [Role.CLIENT],
        write=ALL_INTERNAL + [Role.CLIENT],
        note="Changing your own password is self-service for any authenticated "
             "role. Login and refresh are exempt from authentication entirely, "
             "since they are how a token is obtained.",
    ),
]

#: Longest prefix wins, so a specific area is not shadowed by a general one.
_ORDERED = sorted(MATRIX, key=lambda r: len(r.prefix), reverse=True)


def rule_for(path: str) -> Optional[Rule]:
    """The rule governing this path, if the matrix covers it."""
    # Strip the API version prefix so the table reads like the matrix.
    for marker in ("/api/v1", "/api"):
        if path.startswith(marker):
            path = path[len(marker):]
            break
    for rule in _ORDERED:
        if path == rule.prefix or path.startswith(rule.prefix + "/"):
            return rule
    return None


def allows(rule: Rule, method: str, role_id: Optional[int]) -> bool:
    permitted = rule.read if method.upper() in READ_METHODS else rule.write
    return role_id in {int(r) for r in permitted}


#: Paths that must stay reachable without a token, or nobody can obtain one.
#: Checked by prefix against the full request path.
UNAUTHENTICATED_PATHS: tuple[str, ...] = (
    "/api/v1/auth/login",
    "/api/v1/auth/refresh",
    "/health",
    "/healthz",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/files/",            # served static evidence and report assets
    "/media",             # served report and signature assets
    "/api/v1/verify/",    # the verification endpoint itself: a client
                          # scanning a certificate has no IQE account and
                          # should not need one.
    "/v/",                # scan-to-verify: a client checks a report from the
                          # QR code on it, without an account. Open by design.
)


def is_open(path: str) -> bool:
    return any(path == p or path.startswith(p) for p in UNAUTHENTICATED_PATHS)


async def enforce_policy(request: Request) -> Optional[dict]:
    """Apply the matrix to this request.

    Registered once on the application, so every route is covered without
    thirty files having to remember. Resolves the caller itself rather than
    depending on get_current_user, because the exempt paths must not trigger
    authentication at all - a login route that requires a token cannot issue
    one.
    """
    if is_open(request.url.path):
        return None

    user = await get_current_user(await _credentials(request))
    rule = rule_for(request.url.path)
    if rule is None:
        return user   # authenticated, but this area is not in the matrix yet

    if not allows(rule, request.method, user.get("role_id")):
        action = "read" if request.method.upper() in READ_METHODS else "change"
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Your role may not {action} {rule.prefix.lstrip('/')}."
                + (f" {rule.note}" if rule.note else "")
            ),
        )
    return user


async def _credentials(request: Request) -> Optional[HTTPAuthorizationCredentials]:
    """Pull the bearer token off the request.

    Done by hand rather than through the HTTPBearer dependency so that the
    exempt paths above can skip authentication entirely.
    """
    header = request.headers.get("Authorization") or ""
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        return None
    return HTTPAuthorizationCredentials(scheme=scheme, credentials=token.strip())
