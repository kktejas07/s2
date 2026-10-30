"""One place that decides how a report format renders.

Before this module the mapping from a report to its template lived in two
places: `FORM_CONFIGS` in app/pdf/service.py, keyed on legacy form codes
(TP02, FBILL01), and `ReportFormat` in modules/reporting, keyed on report codes
(IVR, RA_BILL_CERT). Both described the same seven templates, so they could
disagree - and did, which is how GMP_COMPLIANCE ended up pointed at the
quantity survey template.

The registry is now authoritative and this module is how the renderer reads it.
Two constraints shaped the design:

* **Rendering stays synchronous.** WeasyPrint is sync and `render_html` is
  called from many places. Making it async to await a database would ripple
  through everything. So the registry is pushed *into* this module by an async
  caller (`load_overlay`), and resolution is a dictionary lookup.
* **Nothing breaks if the overlay is never loaded.** The legacy configs remain
  the base layer, so a process that renders without ever touching MongoDB
  behaves exactly as it did before.

Resolution order for `resolve(code, client_id)`:

1. a client-specific override for that client, if one exists
2. the registry entry for the format
3. the legacy base config
4. the generic section-driven template, for a format with no template of its own

Client overrides inherit: a child sets only what differs (its own letterhead,
a reordered section list) and everything else comes from its parent. IQE's
larger clients mandate their own layouts, so this is the common case, not an
edge one.
"""
from __future__ import annotations

from dataclasses import dataclass, field, replace
from typing import Any, Optional

#: Rendered when a format declares sections but no template of its own.
GENERIC_TEMPLATE = "generic.html"
GENERIC_STYLESHEET = "generic.css"

#: The composed project report has its own layout; it is not a form.
PROJECT_REPORT_TEMPLATE = "project_report.html"
PROJECT_REPORT_STYLESHEET = "project_report.css"


@dataclass(frozen=True)
class FormatSpec:
    """Everything the renderer needs to produce one document."""

    code: str
    display_title: str
    title: str                      # the all-caps heading printed on the page
    form_code: str                  # IQE-TP-02, F-BILL-01 - what the form is called
    template: str
    stylesheet: str
    sections: tuple[str, ...] = ()
    requires_signatures: tuple[str, ...] = ()
    annexures: tuple[str, ...] = ()
    header_subline: str = "Third Party Inspection Services"
    description: str = ""
    revision: str = "00"
    client_id: Optional[str] = None
    inherits_from: Optional[str] = None
    #: True when no bespoke template exists and the generic renderer is in use.
    is_generic: bool = False
    extra: dict[str, Any] = field(default_factory=dict)


# --------------------------------------------------------------- base layer

#: The seven templates that existed before the registry. Kept as the base layer
#: so rendering works with no database, and so legacy form codes keep resolving.
LEGACY_FORM_CONFIGS: dict[str, dict] = {
    "TP02": {
        "display_title": "Flash Inspection Report",
        "template": "tp02.html", "stylesheet": "tp02.css",
        "title": "FLASH INSPECTION REPORT", "form_code": "IQE-TP-02",
    },
    "TP03": {
        "display_title": "Inspection Visit Report",
        "template": "tp03.html", "stylesheet": "tp03.css",
        "title": "INSPECTION VISIT REPORT", "form_code": "IQE-TP-03",
    },
    "TP04": {
        "display_title": "Inspection Release Note",
        "template": "tp04.html", "stylesheet": "tp04.css",
        "title": "INSPECTION RELEASE NOTE", "form_code": "IQE-TP-04",
    },
    "TP05": {
        "display_title": "Expediting Visit Report",
        "template": "tp05.html", "stylesheet": "tp05.css",
        "title": "EXPEDITING VISIT REPORT", "form_code": "IQE-TP-05",
    },
    "FBILL01": {
        "display_title": "TPI Bill Verification Report",
        "template": "fbill01.html", "stylesheet": "fbill01.css",
        "title": "TPI BILL VERIFICATION REPORT", "form_code": "F-BILL-01",
    },
    "FQUAL01": {
        "display_title": "Quantity Verification & Survey Report",
        "template": "fqual01.html", "stylesheet": "fqual01.css",
        "title": "QUANTITY VERIFICATION & SURVEY REPORT", "form_code": "F-QUAL-01",
    },
    "FBOQ01": {
        "display_title": "BOQ Reconciliation & Material Audit Report",
        "template": "fboq01.html", "stylesheet": "fboq01.css",
        "title": "BOQ RECONCILIATION & MATERIAL AUDIT REPORT", "form_code": "F-BOQ-01",
    },
}

#: Registry format code -> legacy code, for the templates that predate the
#: registry. Lets either naming system resolve to the same document.
REGISTRY_TO_LEGACY: dict[str, str] = {
    "FIR": "TP02",
    "IVR": "TP03",
    "IRN": "TP04",
    "EVR": "TP05",
    "RA_BILL_CERT": "FBILL01",
    "QTY_SURVEY": "FQUAL01",
    "BOQ_RECON": "FBOQ01",
}
LEGACY_TO_REGISTRY: dict[str, str] = {v: k for k, v in REGISTRY_TO_LEGACY.items()}


def _spec_from_legacy(code: str, cfg: dict) -> FormatSpec:
    return FormatSpec(
        code=code,
        display_title=cfg["display_title"],
        title=cfg["title"],
        form_code=cfg["form_code"],
        template=cfg["template"],
        stylesheet=cfg["stylesheet"],
    )


BASE_SPECS: dict[str, FormatSpec] = {
    code: _spec_from_legacy(code, cfg) for code, cfg in LEGACY_FORM_CONFIGS.items()
}


# ------------------------------------------------------------- registry overlay

#: Populated by load_overlay(). format_code -> FormatSpec.
_OVERLAY: dict[str, FormatSpec] = {}
#: (parent_format_code, client_id) -> FormatSpec for client-specific variants.
_CLIENT_OVERLAY: dict[tuple[str, str], FormatSpec] = {}


def _stylesheet_for(template: str, declared: Optional[str]) -> str:
    """A template and its stylesheet are named alike unless told otherwise."""
    if declared:
        return declared
    if template == GENERIC_TEMPLATE:
        return GENERIC_STYLESHEET
    if template == PROJECT_REPORT_TEMPLATE:
        return PROJECT_REPORT_STYLESHEET
    if template.endswith(".html"):
        return template[: -len(".html")] + ".css"
    return GENERIC_STYLESHEET


def spec_from_registry(entry: dict) -> FormatSpec:
    """Turn one ReportFormat record into a render spec.

    A format with no template renders through the generic section-driven
    template rather than failing, which is what gives the eight formats that
    never had a template a PDF at all.
    """
    code = entry["format_code"]
    legacy = BASE_SPECS.get(REGISTRY_TO_LEGACY.get(code, ""))

    template = entry.get("template_path") or (legacy.template if legacy else None)
    is_generic = False
    if not template:
        template = (
            PROJECT_REPORT_TEMPLATE if code == "PROJECT_REPORT" else GENERIC_TEMPLATE
        )
        is_generic = True

    name = entry.get("name") or (legacy.display_title if legacy else code)
    return FormatSpec(
        code=code,
        display_title=name,
        title=(entry.get("document_title") or name).upper(),
        form_code=entry.get("legacy_form_code")
        or (legacy.form_code if legacy else f"IQE-{code}"),
        template=template,
        stylesheet=_stylesheet_for(template, entry.get("stylesheet_path")),
        sections=tuple(entry.get("sections") or ()),
        requires_signatures=tuple(entry.get("requires_signatures") or ()),
        annexures=tuple(entry.get("annexures") or ()),
        header_subline=entry.get("header_subline") or "Third Party Inspection Services",
        description=entry.get("description") or "",
        revision=entry.get("revision_no") or "00",
        client_id=entry.get("client_id"),
        inherits_from=entry.get("inherits_from"),
        is_generic=is_generic,
    )


def load_overlay(entries: list[dict]) -> dict:
    """Push registry records into the renderer. Call this from an async layer.

    Replaces the overlay wholesale rather than merging, so a format deactivated
    in the registry stops resolving instead of lingering in a stale cache.
    """
    _OVERLAY.clear()
    _CLIENT_OVERLAY.clear()

    specs = [spec_from_registry(e) for e in entries]
    for spec in specs:
        if spec.client_id and spec.inherits_from:
            _CLIENT_OVERLAY[(spec.inherits_from, spec.client_id)] = spec
        else:
            _OVERLAY[spec.code] = spec

    return {
        "formats_loaded": len(_OVERLAY),
        "client_overrides_loaded": len(_CLIENT_OVERLAY),
        "generic_rendered": sorted(s.code for s in specs if s.is_generic),
    }


def clear_overlay() -> None:
    _OVERLAY.clear()
    _CLIENT_OVERLAY.clear()
    _STATIC_FALLBACK.clear()


#: The registry's shipped definitions, loaded lazily the first time a code
#: misses. Without this, a format that exists only in the registry (GMP
#: compliance, the project report) cannot render until something has talked to
#: MongoDB - which would make a PDF depend on database availability for a
#: mapping that is actually static.
_STATIC_FALLBACK: dict[str, FormatSpec] = {}


def _load_static_fallback() -> None:
    """Imported inside the function on purpose - but not for the reason an
    earlier version of this comment claimed.

    There is no import cycle here: modules.reporting.models imports nothing
    from app.pdf. The deferral earns its place differently. This is a
    load-once cache, and the import sits inside the try so that a registry
    that fails to import degrades to the generic renderer rather than taking
    the whole PDF subsystem down with it. A module-level import could not
    fail that way.
    """
    if _STATIC_FALLBACK:
        return
    try:
        from modules.reporting.models import DEFAULT_FORMATS
    except Exception:
        return
    for entry in DEFAULT_FORMATS:
        spec = spec_from_registry(entry)
        if not spec.client_id:
            _STATIC_FALLBACK[spec.code] = spec


def overlay_is_loaded() -> bool:
    return bool(_OVERLAY)


# -------------------------------------------------------------------- resolve

def normalize_code(code: str) -> str:
    """Accepts 'TP02', 'tp-02', 'IQE-TP-02.pdf' and registry codes alike."""
    raw = (code or "").strip()
    _load_static_fallback()
    registry_codes = set(_OVERLAY) | set(REGISTRY_TO_LEGACY) | set(_STATIC_FALLBACK)

    if raw.upper() in registry_codes:
        return raw.upper()

    cleaned = raw.upper().replace(".PDF", "").replace("_", "").replace("-", "").strip()
    if cleaned.startswith("IQE"):
        cleaned = cleaned[3:]
    # A registry code like RA_BILL_CERT survives normalization as RABILLCERT;
    # map it back rather than failing on punctuation.
    if cleaned not in BASE_SPECS:
        for known in registry_codes:
            if known.replace("_", "") == cleaned:
                return known
    return cleaned


def _merge(parent: FormatSpec, child: FormatSpec) -> FormatSpec:
    """Child wins where it sets something; parent fills the rest."""
    changes: dict[str, Any] = {}
    for f in ("display_title", "title", "form_code", "template", "stylesheet",
              "header_subline", "description", "revision"):
        value = getattr(child, f)
        if value:
            changes[f] = value
    for f in ("sections", "requires_signatures", "annexures"):
        value = getattr(child, f)
        if value:
            changes[f] = value
    changes["code"] = child.code
    changes["client_id"] = child.client_id
    changes["inherits_from"] = child.inherits_from
    changes["is_generic"] = child.is_generic
    return replace(parent, **changes)


def resolve(code: str, client_id: Optional[str] = None) -> FormatSpec:
    """The render spec for this format, for this client.

    Raises ValueError for an unknown code - the same failure the old
    FORM_CONFIGS lookup produced, so callers need no new error handling.
    """
    normalized = normalize_code(code)

    # Try the registry code and its legacy alias, in that order.
    candidates = [normalized]
    if normalized in LEGACY_TO_REGISTRY:
        candidates.append(LEGACY_TO_REGISTRY[normalized])
    if normalized in REGISTRY_TO_LEGACY:
        candidates.append(REGISTRY_TO_LEGACY[normalized])

    base: Optional[FormatSpec] = None
    for c in candidates:
        if c in _OVERLAY:
            base = _OVERLAY[c]
            break
        if c in BASE_SPECS:
            base = BASE_SPECS[c]
            break

    if base is None:
        _load_static_fallback()
        for c in candidates:
            if c in _STATIC_FALLBACK:
                base = _STATIC_FALLBACK[c]
                break

    if base is None:
        raise ValueError(f"Unknown form code: {code}")

    if client_id:
        for c in candidates:
            override = _CLIENT_OVERLAY.get((c, client_id))
            if override:
                return _merge(base, override)

    return base


def known_codes() -> list[str]:
    """Every code that resolves, registry and legacy alike."""
    _load_static_fallback()
    return sorted(
        set(_OVERLAY) | set(BASE_SPECS) | set(REGISTRY_TO_LEGACY) | set(_STATIC_FALLBACK)
    )


def client_overrides_for(code: str) -> list[str]:
    """Which clients have their own variant of this format."""
    normalized = normalize_code(code)
    aliases = {normalized, LEGACY_TO_REGISTRY.get(normalized, ""),
               REGISTRY_TO_LEGACY.get(normalized, "")}
    return sorted(
        client for (parent, client) in _CLIENT_OVERLAY if parent in aliases
    )
