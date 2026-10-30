import os
import sys
from pathlib import Path

# Ensure macOS dynamic loader finds homebrew-installed pango/cairo/gobject libraries
if sys.platform == "darwin":
    current_fallback = os.environ.get("DYLD_FALLBACK_LIBRARY_PATH", "")
    if "/usr/local/lib" not in current_fallback:
        os.environ["DYLD_FALLBACK_LIBRARY_PATH"] = f"/usr/local/lib:{current_fallback}".strip(":")
from typing import Dict, Any, Optional
from jinja2 import Environment, FileSystemLoader

BASE_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = BASE_DIR / "templates"
STYLES_DIR = BASE_DIR / "styles"

jinja_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=True,
    trim_blocks=True,
    lstrip_blocks=True,
)

from app.pdf.formats import (  # noqa: E402
    LEGACY_FORM_CONFIGS,
    clear_overlay,
    known_codes,
    load_overlay,
    normalize_code,
    overlay_is_loaded,
    resolve,
)

#: Kept as a module attribute because other modules and tests read it. It is
#: now the base layer only - the authoritative mapping lives in the report
#: format registry and is resolved through app.pdf.formats.
FORM_CONFIGS = LEGACY_FORM_CONFIGS

__all__ = [
    "FORM_CONFIGS", "render_html", "render_pdf", "normalize_form_code",
    "load_overlay", "clear_overlay", "overlay_is_loaded", "known_codes",
    "resolve", "default_qr_url",
]


def normalize_form_code(form_code: str) -> str:
    """Delegates to the resolver so there is one normalization rule, not two."""
    return normalize_code(form_code)

# Where the verify page can re-fetch each form's PDF when no stored report id exists
FORM_PDF_PATHS = {
    "FBILL01": "/api/v1/reports/pdf/tpi-billing",
    "FQUAL01": "/api/v1/reports/pdf/quality-bill-verification",
    "FBOQ01": "/api/v1/reports/pdf/boq-reconciliation",
}


def default_qr_url(code: str, payload: Dict[str, Any], is_blank: bool) -> Optional[str]:
    """Scan-to-verify link for a form; blank templates get no QR (nothing to verify)."""
    if is_blank:
        return None
    from core.qr import verify_url

    spec = resolve(code)
    report_id = payload.get("id") or payload.get("_id")
    pdf_path = f"/api/tpi/report/{report_id}/pdf" if report_id else FORM_PDF_PATHS.get(code)
    return verify_url(
        title=spec.display_title or spec.title,
        ref=str(payload.get("report_no") or ""),
        form=spec.form_code,
        client=str(payload.get("client") or payload.get("client_name") or ""),
        date=str(payload.get("date") or payload.get("report_date") or ""),
        pdf_path=pdf_path,
    )


def render_html(form_code: str, payload: Dict[str, Any], is_blank: bool = False, is_draft: bool = False,
                qr_url: Optional[str] = None, client_id: Optional[str] = None) -> str:
    """Render a form to HTML.

    `client_id` selects that client's mandated variant of the format when one
    is registered; without it, or with no variant on file, the standard format
    renders.
    """
    spec = resolve(form_code, client_id)
    code = spec.code

    template = jinja_env.get_template(spec.template)
    context = dict(payload)
    for key in [
        "signatures", "activities", "immediate_action", "basis_of_release",
        "traceability", "dispatch_instructions", "progress_status", "schedule_assessment"
    ]:
        context.setdefault(key, {})
    for key in [
        "photos", "items", "findings", "punch_list", "documents_reviewed",
        "scope_activities", "instruments", "attachments", "report_refs",
        "deviation_refs", "release_items", "actions", "personnel",
        "documentation", "sub_orders", "manufacturing_status", "inspection_status"
    ]:
        context.setdefault(key, [])

    context["form_code"] = spec.form_code
    context["title"] = spec.title
    context["stylesheet_url"] = f"../styles/{spec.stylesheet}"
    context["is_blank"] = is_blank
    context["is_draft"] = is_draft

    # The generic and project-report templates are driven by the spec itself
    # rather than by a bespoke layout, so they need it in the context.
    context["spec"] = spec
    context.setdefault("display_title", spec.display_title)
    context.setdefault("sections", list(spec.sections))
    context.setdefault("requires_signatures", list(spec.requires_signatures))
    context.setdefault("annexures", list(spec.annexures))
    context.setdefault("header_subline", spec.header_subline)
    context.setdefault("format_description", spec.description)
    context.setdefault("revision", spec.revision)
    # The generic template looks each declared section up by its own key, which
    # needs the payload addressable as a mapping rather than only splatted into
    # the context.
    context["context_data"] = dict(payload)

    url = qr_url if qr_url is not None else default_qr_url(code, payload, is_blank)
    if url:
        from core.qr import qr_data_uri
        context["qr_url"] = url
        context["qr_data_uri"] = qr_data_uri(url)

    return template.render(**context)

def render_pdf(form_code: str, payload: Optional[Dict[str, Any]] = None, is_blank: bool = False, is_draft: bool = False,
               qr_url: Optional[str] = None, client_id: Optional[str] = None) -> bytes:
    try:
        # Deferred because it costs ~2.5s to import and binds to the system
        # cairo/pango libraries. Paying that at startup would slow every
        # process that never renders a PDF, and would stop the API booting at
        # all on a host without those libraries. Not a cycle workaround.
        import weasyprint
    except Exception as e:
        raise RuntimeError(f"WeasyPrint is not available: {e}")

    spec = resolve(form_code, client_id)   # raises ValueError on an unknown code

    data = payload or {}
    html_content = render_html(
        spec.code, data, is_blank=is_blank, is_draft=is_draft,
        qr_url=qr_url, client_id=client_id,
    )

    base_url = str(TEMPLATES_DIR)
    html = weasyprint.HTML(string=html_content, base_url=base_url)
    return html.write_pdf()
