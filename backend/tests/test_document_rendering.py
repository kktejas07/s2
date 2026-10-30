"""Colour in rendered documents.

Colour here carries meaning: a reader scanning an inspection report should find
the non-conformance without reading every row. That makes a wrong colour worse
than none - a failure tinted green is a document that misleads a client.

These assert the mapping holds, that colour is never the only carrier of
meaning (the label is always printed too, for greyscale and colour-blind
readers), and that an unrecognised value is left uncoloured rather than guessed.
"""
import re
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.pdf.service import render_html, render_pdf  # noqa: E402

BASE = {"report_no": "T-1", "client": "Test Client", "date": "2026-10-23"}


def _render_with_status(status: str) -> str:
    return render_html("GMP_COMPLIANCE", {
        **BASE,
        "requirements": [
            {"req_id": "R1", "clause": "C1", "statement": "A point", "status": status},
        ],
    })


@pytest.mark.parametrize("status,tone", [
    ("CONFORMING", "ok"),
    ("PASS", "ok"),
    ("ACCEPTED", "ok"),
    ("NON-CONFORMING", "bad"),
    ("FAIL", "bad"),
    ("REJECTED", "bad"),
    ("PARTIAL", "warn"),
    ("PENDING", "warn"),
    ("OBSERVATION", "warn"),
    ("NA", "idle"),
])
def test_status_values_get_the_right_tone(status, tone):
    html = _render_with_status(status)
    assert f'pill pill-{tone}' in html, f"{status} did not render as {tone}"


def test_a_failure_is_never_rendered_as_a_pass():
    """The defect that would matter most."""
    for bad in ("FAIL", "NON-CONFORMING", "REJECTED"):
        html = _render_with_status(bad)
        pill = re.search(r'pill pill-(\w+)', html)
        assert pill and pill.group(1) == "bad", f"{bad} rendered as {pill}"


def test_the_label_is_printed_alongside_the_colour():
    """Colour must never be the only carrier of meaning - these documents are
    photocopied in greyscale and read by colour-blind engineers."""
    html = _render_with_status("NON-CONFORMING")
    assert "NON-CONFORMING" in html, "the status word itself must still appear"


def test_an_unrecognised_status_is_left_uncoloured():
    """Guessing a tone for a word we do not know would be asserting an outcome
    nobody recorded."""
    html = _render_with_status("AWAITING THIRD PARTY REVIEW")
    assert "AWAITING THIRD PARTY REVIEW" in html
    assert "pill pill-" not in html


def test_only_status_columns_are_coloured():
    """A description containing the word 'fail' must not tint the cell."""
    html = render_html("GMP_COMPLIANCE", {
        **BASE,
        "requirements": [
            {"req_id": "R1", "clause": "C1",
             "statement": "Verify that the pump does not fail under load",
             "status": "CONFORMING"},
        ],
    })
    assert html.count("pill pill-") == 1, "only the status cell should be tinted"
    assert "pill pill-ok" in html


def test_brand_colours_not_word_defaults():
    """The documents used Word's default blues, which belong to no brand.

    Checks every stylesheet, not just base.css: three per-form sheets
    re-declared the heading colour and silently shadowed the brand change.
    Comments are stripped first so a note *about* the old colour does not
    count as a use of it.
    """
    styles = Path(__file__).resolve().parent.parent / "app" / "pdf" / "styles"
    base = (styles / "base.css").read_text()
    assert "#0084bf" in base, "IQE blue missing from base.css"
    assert "#e35f14" in base, "IQE orange missing from base.css"

    offenders = []
    for sheet in sorted(styles.glob("*.css")):
        rules = re.sub(r"/\*.*?\*/", "", sheet.read_text(), flags=re.S)
        for word_default in ("#365F91", "#D9E2F3"):
            if word_default.lower() in rules.lower():
                offenders.append(f"{sheet.name} still uses {word_default}")
    assert not offenders, "; ".join(offenders)


def test_documents_still_render_to_pdf():
    """Colour changes must not break rendering for any format."""
    for code in ("GMP_COMPLIANCE", "TP02", "IVR", "PROJECT_REPORT"):
        payload = BASE if code != "PROJECT_REPORT" else {
            "generated_at": "2026-10-23",
            "project_header": {"job_id": "J1", "title": "T", "client_name": "C",
                               "manufacturer_name": "M", "status": "active", "location": "L"},
            "work_packages": {"total": 1, "by_status": {"certified": 1},
                              "by_discipline": {"Civil": [
                                  {"work_package_id": "WP-1", "title": "t",
                                   "work_type_code": "BILL_VERIF", "status": "certified"}]}},
            "certified_position": {"certifications_issued": 1, "claimed_value": 100.0,
                                   "certified_value": 90.0, "deduction_value": 10.0,
                                   "deduction_pct": 10.0, "retention_held": 0.0},
            "deductions_by_reason": {}, "people_deployed": {"count": 0, "total_days": 0, "detail": []},
            "billing_position": {"invoices_raised": 0, "invoiced_value": 0.0, "paid_value": 0.0,
                                 "outstanding_value": 0.0, "certified_not_billed_value": 0.0},
        }
        pdf = render_pdf(code, payload=payload)
        assert pdf[:4] == b"%PDF", f"{code} did not render"


def test_the_scope_bar_segments_sum_to_the_whole_width():
    """A bar whose segments do not add to 100% misrepresents progress."""
    html = render_html("PROJECT_REPORT", {
        "generated_at": "2026-10-23",
        "project_header": {"job_id": "J1", "title": "T", "client_name": "C",
                           "manufacturer_name": "M", "status": "active", "location": "L"},
        "work_packages": {"total": 8,
                          "by_status": {"certified": 3, "in_progress": 4, "planned": 1},
                          "by_discipline": {}},
        "certified_position": {"certifications_issued": 0, "claimed_value": 0.0,
                               "certified_value": 0.0, "deduction_value": 0.0,
                               "deduction_pct": 0.0, "retention_held": 0.0},
        "deductions_by_reason": {}, "people_deployed": {"count": 0, "total_days": 0, "detail": []},
        "billing_position": {"invoices_raised": 0, "invoiced_value": 0.0, "paid_value": 0.0,
                             "outstanding_value": 0.0, "certified_not_billed_value": 0.0},
    })
    # Only the widths inside the scope bar itself; the surrounding tables have
    # column widths that would otherwise be counted as segments.
    bar = re.search(r'<table class="scope-bar">.*?</table>', html, re.S)
    assert bar, "no scope bar rendered"
    segments = [float(w) for w in re.findall(r'width:\s*([\d.]+)%', bar.group(0))]
    assert len(segments) == 3, f"expected 3 segments, got {segments}"
    assert abs(sum(segments) - 100.0) < 0.1, f"segments sum to {sum(segments)}%, not 100%"
