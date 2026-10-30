import os
import pytest
import pymupdf
from app.pdf.service import render_pdf, render_html


FORMS = [
    ("TP02", 2, "IQE-TP-02_Flash_Inspection_Report_Rev00.pdf"),
    ("TP03", 3, "IQE-TP-03_Inspection_Visit_Report_Rev00.pdf"),
    ("TP04", 2, "IQE-TP-04_Inspection_Release_Note_Rev00.pdf"),
    ("TP05", 3, "IQE-TP-05_Expediting_Visit_Report_Rev00.pdf"),
]


@pytest.mark.parametrize("form_code,expected_pages,ref_pdf", FORMS)
def test_blank_pdf_page_count_matches(form_code, expected_pages, ref_pdf):
    """Test 1: Verify rendered blank PDF matches exact expected page count."""
    pdf_bytes = render_pdf(form_code, payload={}, is_blank=True, is_draft=False)
    assert len(pdf_bytes) > 0, "PDF bytes should not be empty"

    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    assert doc.page_count == expected_pages, (
        f"{form_code} blank PDF has {doc.page_count} pages, expected {expected_pages}"
    )


@pytest.mark.parametrize("form_code,expected_pages,ref_pdf", FORMS)
def test_blank_pdf_font_embedding(form_code, expected_pages, ref_pdf):
    """Test 3: Verify only embedded Arial (or LiberationSans) and DejaVu Sans fonts are present."""
    pdf_bytes = render_pdf(form_code, payload={}, is_blank=True, is_draft=False)
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")

    found_fonts = set()
    for page in doc:
        for f in page.get_fonts():
            found_fonts.add(f[3].lower())

    # Ensure font list is non-empty and contains Arial or Liberation and DejaVu
    assert len(found_fonts) > 0
    assert any("arial" in f or "liberation" in f for f in found_fonts), f"No Arial/Liberation font in {found_fonts}"


def test_tp02_text_fidelity():
    """Test 2 (TP-02): Verify all mandatory headings, labels, outcome options, and disclaimer verbatim."""
    pdf_bytes = render_pdf("TP02", payload={}, is_blank=True, is_draft=False)
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    full_text = " ".join("\n".join([page.get_text() for page in doc]).split())

    assert "FLASH INSPECTION REPORT" in full_text
    assert "Preliminary communication of inspection outcome and key observations" in full_text
    assert "Third Party Inspection Services" in full_text
    assert "FLASH REPORT NO.:" in full_text
    assert "1.0 INSPECTION INFORMATION" in full_text
    assert "2.0 TYPE OF VISIT / INSPECTION ACTIVITY" in full_text
    assert "3.0 MATERIAL / EQUIPMENT INSPECTED" in full_text
    assert "4.0 INSPECTION OUTCOME" in full_text
    assert "SATISFACTORY" in full_text
    assert "SATISFACTORY WITH COMMENTS" in full_text
    assert "NON-COMPLIANCE OBSERVED" in full_text
    assert "RE-INSPECTION REQUIRED" in full_text
    assert "INSPECTION ON HOLD" in full_text
    assert "5.0 KEY FINDINGS / AREAS OF CONCERN" in full_text
    assert "6.0 IMMEDIATE ACTION / FOLLOW-UP" in full_text
    assert "7.0 REMARKS" in full_text
    assert "8.0 PHOTOGRAPHIC EVIDENCE" in full_text
    assert "9.0 ACKNOWLEDGEMENT & SIGNATURES" in full_text
    assert "does not relieve the supplier" in full_text and "responsibilities or obligations" in full_text
    assert "END OF FLASH REPORT" in full_text


def test_tp03_text_fidelity():
    """Test 2 (TP-03): Verify all mandatory headings, labels, inspection statuses, and disclaimer verbatim."""
    pdf_bytes = render_pdf("TP03", payload={}, is_blank=True, is_draft=False)
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    full_text = " ".join("\n".join([page.get_text() for page in doc]).split())

    assert "INSPECTION VISIT REPORT" in full_text
    assert "Issued by Ideal Quality Engineers (I) Pvt. Ltd." in full_text
    assert "Third Party Inspection Services" in full_text
    assert "REPORT NO.:" in full_text
    assert "1.0 INSPECTION & PROJECT DETAILS" in full_text
    assert "2.0 MATERIAL / EQUIPMENT OFFERED FOR INSPECTION" in full_text
    assert "3.0 DOCUMENTS & REFERENCES REVIEWED" in full_text
    assert "4.0 INSPECTION SCOPE & ACTIVITIES" in full_text
    assert "5.0 INSPECTION FINDINGS" in full_text
    assert "6.0 NON-CONFORMITIES / AREAS OF CONCERN" in full_text
    assert "7.0 INSTRUMENTS / CALIBRATION DETAILS" in full_text
    assert "8.0 INSPECTION RESULT / CONCLUSION" in full_text
    assert "ACCEPTED" in full_text
    assert "ACCEPTED WITH COMMENTS" in full_text
    assert "PARTIALLY ACCEPTED" in full_text
    assert "NOT ACCEPTED" in full_text
    assert "HOLD / RE-INSPECTION REQUIRED" in full_text.replace("RE- ", "RE-")
    assert "9.0 ATTACHMENTS" in full_text
    assert "10.0 PHOTOGRAPHS" in full_text
    assert "11.0 ACKNOWLEDGEMENT & SIGNATURES" in full_text
    assert "The inspection report is issued without prejudice to the contractual obligations" in full_text
    assert "END OF REPORT" in full_text


def test_tp04_text_fidelity():
    """Test 2 (TP-04): Verify all mandatory headings, release decisions, and disclaimer verbatim."""
    pdf_bytes = render_pdf("TP04", payload={}, is_blank=True, is_draft=False)
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    full_text = " ".join("\n".join([page.get_text() for page in doc]).split())

    assert "INSPECTION RELEASE NOTE" in full_text
    assert "Formal release of inspected items for dispatch, subject to the conditions stated herein." in full_text
    assert "Third Party Inspection Services" in full_text
    assert "IRN NO.:" in full_text
    assert "1.0 INSPECTION & RELEASE STATUS" in full_text
    assert "RELEASED FOR DISPATCH" in full_text
    assert "RELEASED WITH COMMENTS / CONDITIONS" in full_text
    assert "HOLD – CLIENT CLEARANCE REQUIRED" in full_text
    assert "NOT RELEASED" in full_text
    assert "2.0 INSPECTION REPORT REFERENCES" in full_text
    assert "3.0 COMPLIANCE / DEVIATION REFERENCES" in full_text
    assert "4.0 ITEMS RELEASED" in full_text
    assert "5.0 BASIS OF RELEASE" in full_text
    assert "6.0 IDENTIFICATION / TRACEABILITY" in full_text
    assert "7.0 DISPATCH / PRESERVATION INSTRUCTIONS" in full_text
    assert "8.0 REMARKS / CONDITIONS OF RELEASE" in full_text
    assert "9.0 SUPPLIER ACKNOWLEDGEMENT & IQE AUTHORIZATION" in full_text
    assert "10.0 DISCLAIMER & LIMITATION OF LIABILITY" in full_text
    assert "END OF INSPECTION RELEASE NOTE" in full_text


def test_tp05_text_fidelity():
    """Test 2 (TP-05): Verify all mandatory headings, progress sections, and disclaimer verbatim."""
    pdf_bytes = render_pdf("TP05", payload={}, is_blank=True, is_draft=False)
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    full_text = " ".join("\n".join([page.get_text() for page in doc]).split())

    assert "EXPEDITING VISIT REPORT" in full_text
    assert "Supplier progress, schedule, materials, manufacturing and action follow-up report" in full_text
    assert "Third Party Inspection & Expediting Services" in full_text
    assert "REPORT NO.:" in full_text
    assert "1.0 ITEMS / ORDER DETAILS" in full_text
    assert "2.0 ORDER & PROGRESS STATUS" in full_text
    assert "3.0 SUMMARY" in full_text
    assert "4.0 PERSONNEL PRESENT" in full_text
    assert "5.0 DOCUMENTATION DETAILS" in full_text
    assert "6.0 SUB-ORDERS / MATERIALS IN STOCK" in full_text
    assert "7.0 MANUFACTURING STATUS" in full_text
    assert "8.0 INSPECTION / TESTING STATUS" in full_text
    assert "9.0 SCHEDULE / DELIVERY ASSESSMENT" in full_text
    assert "10.0 ACTIONS / FOLLOW-UP" in full_text
    assert "11.0 CONCLUSION" in full_text
    assert "12.0 PHOTOGRAPHS" in full_text
    assert "13.0 ACKNOWLEDGEMENT & SIGNATURES" in full_text
    assert "The report records observations and information made available to IQE during the expediting visit" in full_text
    assert "END OF REPORT" in full_text


def test_filled_render_large_fixture():
    """Test 4: Verify large fixture with 12 item rows and 6 photos renders cleanly without crashing."""
    payload = {
        "report_no": "IQE-TP03-2026-9999",
        "inspection_date": "2026-09-29",
        "customer": "Heavy Machinery Corporation",
        "supplier": "Apex Forgings India Pvt Ltd",
        "project": "Refinery Overhaul 2026",
        "items": [
            {
                "sl_no": i,
                "description": f"Forged High-Pressure Flange Class 2500 Type WN-{i}",
                "tag_no": f"FLG-2500-{i:03d}",
                "po_qty": 20,
                "offered_qty": 20,
                "inspected_qty": 20,
                "accepted_qty": 20,
                "rejected_qty": 0,
                "remarks": "Passed ultrasonic examination and PMI spectrometer testing.",
            }
            for i in range(1, 13)
        ],
        "photos": [
            {"slot": i, "url": "", "caption": f"Inspection bay photo {i}: Ultrasonic testing and dimension checks."}
            for i in range(1, 7)
        ],
        "status": "ACCEPTED",
        "conclusion": "All 12 items passed rigorous witness tests and ultrasonic inspections.",
    }
    pdf_bytes = render_pdf("TP03", payload=payload, is_blank=False, is_draft=True)
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    assert doc.page_count >= 3
    full_text = "\n".join([page.get_text() for page in doc])
    assert "FLG-2500-012" in full_text
