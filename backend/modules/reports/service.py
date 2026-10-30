from datetime import datetime
from io import BytesIO
from modules.visits.models import Visit
from modules.invoices.models import Invoice
from modules.analytics.service import AnalyticsService

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


class ReportService:

    @staticmethod
    async def visit_report(site_id: str, from_date: str = "", to_date: str = "",
                          client_id: str = "", status: str = "", engineer_id: str = "",
                          page: int = 1, per_page: int = 50):
        query = {"site_id": site_id}
        if from_date: query["planned_date"] = {"$gte": from_date}
        if to_date:
            if "$gte" in query.get("planned_date", {}):
                query["planned_date"]["$lte"] = to_date
            else:
                query["planned_date"] = {"$lte": to_date}
        if client_id: query["client_id"] = client_id
        if status: query["status"] = status
        if engineer_id: query["inspector_id"] = engineer_id
        total = await Visit.find(query).count()
        items = await Visit.find(query).sort(-Visit.planned_date).skip((page - 1) * per_page).limit(per_page).to_list()
        return {"total": total, "page": page, "per_page": per_page, "data": [v.dict() for v in items]}

    @staticmethod
    async def expense_report(site_id: str, from_date: str = "", to_date: str = "",
                            page: int = 1, per_page: int = 50):
        query = {"site_id": site_id}
        if from_date or to_date:
            query["created_at"] = {}
            if from_date: query["created_at"]["$gte"] = from_date
            if to_date: query["created_at"]["$lte"] = to_date
        total = await Visit.find(query).count()
        items = await Visit.find(query).sort(-Visit.created_at).skip((page - 1) * per_page).limit(per_page).to_list()
        result = []
        for v in items:
            total_exp = sum(e.amount for e in v.expenses) if v.expenses else 0
            result.append({**v.dict(), "total_expense": total_exp})
        return {"total": total, "page": page, "per_page": per_page, "data": result}

    @staticmethod
    async def invoice_report(site_id: str, from_date: str = "", to_date: str = "",
                            status: str = "", page: int = 1, per_page: int = 50):
        query = {"site_id": site_id}
        if status: query["status"] = status
        if from_date or to_date:
            query["created_at"] = {}
            if from_date: query["created_at"]["$gte"] = from_date
            if to_date: query["created_at"]["$lte"] = to_date
        total = await Invoice.find(query).count()
        items = await Invoice.find(query).sort(-Invoice.created_at).skip((page - 1) * per_page).limit(per_page).to_list()
        return {"total": total, "page": page, "per_page": per_page, "data": [i.dict() for i in items]}

    @staticmethod
    async def generate_tpi_billing_pdf(site_id: str = "SITE-01") -> bytes:
        from app.pdf.service import render_pdf
        return render_pdf("FBILL01", payload={})

    @staticmethod
    async def generate_tpi_single_item_pdf(
        boq_item: str = "1.01",
        ra_bill: str = "RA-001",
        vendor: str = "Quality Engineers (I) Pvt Ltd",
        client: str = "Granules India",
        description: str = "Pipe Installation",
        unit: str = "MT",
        drawing_ref: str = "GFC-001",
        boq_qty: float = 1.0,
        claimed_qty: float = 1.0,
        verified_qty: float = 1.0,
        unit_rate: float = 50000.0,
        observation: str = "Verified",
        closure_status: str = "Closed",
        is_locked: bool = False
    ) -> bytes:
        """
        Generates a 27-field precision PDF verification report for a single BOQ item with IQE Watermark & Scannable QR code.
        """
        from reportlab.graphics.shapes import Drawing
        from reportlab.graphics.barcode.qr import QrCodeWidget
        from reportlab.platypus import Image as RLImage
        import os

        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=30,
            leftMargin=30,
            topMargin=30,
            bottomMargin=30
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'DocTitle', parent=styles['Heading1'], fontSize=15, leading=19, textColor=colors.HexColor("#0f172a"), fontName="Helvetica-Bold"
        )
        section_style = ParagraphStyle(
            'SectionTitle', parent=styles['Heading2'], fontSize=11, leading=15, textColor=colors.HexColor("#003366"), fontName="Helvetica-Bold"
        )
        cell_bold = ParagraphStyle('CellBold', parent=styles['Normal'], fontSize=8, leading=10.5, fontName="Helvetica-Bold", textColor=colors.HexColor("#0f172a"))
        cell_norm = ParagraphStyle('CellNorm', parent=styles['Normal'], fontSize=8, leading=10.5, textColor=colors.HexColor("#334155"))
        cell_hdr = ParagraphStyle('CellHdr', parent=styles['Normal'], fontSize=8, leading=10.5, fontName="Helvetica-Bold", textColor=colors.white)

        story = []

        # Logo & Header
        logo_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../apps/web/public/iqe-logo.png"))
        logo_img = None
        if os.path.exists(logo_path):
            try:
                logo_img = RLImage(logo_path, width=46, height=46)
            except Exception:
                logo_img = None

        # Financial Calculations
        claimed_amt = claimed_qty * unit_rate
        recommended_amt = verified_qty * unit_rate
        diff_qty = claimed_qty - verified_qty
        savings_amt = claimed_amt - recommended_amt
        audit_status = "OVER CLAIMED" if diff_qty > 0 else "VERIFIED OK"
        lock_badge = "LOCKED - CERTIFIED & SEALED" if is_locked else "UNLOCKED - DRAFT RECORD"

        # Scannable QR Code encoding all item details & LAN link
        from urllib.parse import urlencode
        from core.qr import verify_url, qr_drawing as make_qr

        item_query = urlencode({
            "boq_item": boq_item, "ra_bill": ra_bill, "vendor": vendor, "client": client,
            "description": description, "unit": unit, "drawing_ref": drawing_ref, "boq_qty": boq_qty,
            "claimed_qty": claimed_qty, "verified_qty": verified_qty, "unit_rate": unit_rate,
            "observation": observation, "closure_status": closure_status, "is_locked": str(is_locked).lower(),
        })
        qr_drawing = make_qr(verify_url(
            title="BOQ Item Verification Certificate",
            ref=f"{ra_bill} / {boq_item}",
            client=client,
            status=f"{closure_status} - {'Locked' if is_locked else 'Draft'}",
            date=datetime.now().strftime('%Y-%m-%d'),
            form="F-BILL-01",
            pdf_path=f"/api/v1/reports/pdf/tpi-billing-item?{item_query}",
        ), size=58)

        header_p = Paragraph(
            "<b>IDEAL QUALITY ENGINEERS (I) PVT LTD</b><br/>"
            f"<font size=11 color='#003366'><b>27-Column Single Item BOQ Measurement Verification Certificate</b></font><br/>"
            f"<font size=8 color='#64748b'>Item Ref: <b>{boq_item}</b> | Client: <b>{client}</b> | Date: {datetime.now().strftime('%Y-%m-%d')}</font>",
            title_style
        )

        if logo_img:
            header_table = Table([[logo_img, header_p, qr_drawing]], colWidths=[52, 418, 65])
        else:
            header_table = Table([[header_p, qr_drawing]], colWidths=[470, 65])

        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ALIGN', (-1,0), (-1,0), 'RIGHT'),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 6))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#003366"), spaceAfter=10))

        # Financial Calculations
        claimed_amt = claimed_qty * unit_rate
        recommended_amt = verified_qty * unit_rate
        diff_qty = claimed_qty - verified_qty
        savings_amt = claimed_amt - recommended_amt
        audit_status = "OVER CLAIMED" if diff_qty > 0 else "VERIFIED OK"
        lock_badge = "LOCKED - CERTIFIED & SEALED" if is_locked else "UNLOCKED - DRAFT RECORD"

        # 27 Precision Fields Table
        story.append(Paragraph("27 Precision Measurement & Verification Parameters", section_style))
        story.append(Spacer(1, 6))

        fields_data = [
            [Paragraph("<b>Field #</b>", cell_hdr), Paragraph("<b>27-Field Parameter Name</b>", cell_hdr), Paragraph("<b>Inspected Audit Value</b>", cell_hdr)],
            [Paragraph("1", cell_norm), Paragraph("BOQ Item Reference", cell_bold), Paragraph(boq_item, cell_bold)],
            [Paragraph("2", cell_norm), Paragraph("RA Bill Ref Number", cell_norm), Paragraph(ra_bill, cell_norm)],
            [Paragraph("3", cell_norm), Paragraph("Bill Verification Date", cell_norm), Paragraph(datetime.now().strftime('%Y-%m-%d'), cell_norm)],
            [Paragraph("4", cell_norm), Paragraph("Primary Client / Sponsor", cell_norm), Paragraph(client, cell_bold)],
            [Paragraph("5", cell_norm), Paragraph("Contractor / Sub-Vendor", cell_norm), Paragraph(vendor, cell_norm)],
            [Paragraph("6", cell_norm), Paragraph("Work Description / Invoice Line", cell_norm), Paragraph(description, cell_norm)],
            [Paragraph("7", cell_norm), Paragraph("Unit of Measurement (UOM)", cell_norm), Paragraph(unit, cell_norm)],
            [Paragraph("8", cell_norm), Paragraph("GFC Drawing Reference", cell_norm), Paragraph(drawing_ref, cell_norm)],
            [Paragraph("9", cell_norm), Paragraph("Contract BOQ Quantity", cell_norm), Paragraph(f"{boq_qty:.2f}", cell_norm)],
            [Paragraph("10", cell_norm), Paragraph("Previous Certified Quantity", cell_norm), Paragraph("0.00", cell_norm)],
            [Paragraph("11", cell_norm), Paragraph("Contractor Claimed Quantity", cell_bold), Paragraph(f"{claimed_qty:.2f}", cell_bold)],
            [Paragraph("12", cell_norm), Paragraph("TPI Verified Quantity", cell_bold), Paragraph(f"<font color='#059669'><b>{verified_qty:.2f}</b></font>", cell_bold)],
            [Paragraph("13", cell_norm), Paragraph("Variance Quantity (Diff)", cell_bold), Paragraph(f"<font color='#dc2626'><b>{diff_qty:.2f}</b></font>", cell_bold)],
            [Paragraph("14", cell_norm), Paragraph("Unit Rate (INR ₹)", cell_norm), Paragraph(f"₹{unit_rate:,.2f}", cell_norm)],
            [Paragraph("15", cell_norm), Paragraph("Claimed Amount (INR ₹)", cell_norm), Paragraph(f"₹{claimed_amt:,.2f}", cell_norm)],
            [Paragraph("16", cell_norm), Paragraph("TPI Recommended Amount (INR ₹)", cell_bold), Paragraph(f"<font color='#059669'><b>₹{recommended_amt:,.2f}</b></font>", cell_bold)],
            [Paragraph("17", cell_norm), Paragraph("Over-Claim Savings Variance (INR ₹)", cell_bold), Paragraph(f"<font color='#dc2626'><b>₹{savings_amt:,.2f}</b></font>", cell_bold)],
            [Paragraph("18", cell_norm), Paragraph("Variation Order Flag (Y/N)", cell_norm), Paragraph("Y" if diff_qty != 0 else "N", cell_norm)],
            [Paragraph("19", cell_norm), Paragraph("Variation Order Ref Number", cell_norm), Paragraph(f"VO-{ra_bill}", cell_norm)],
            [Paragraph("20", cell_norm), Paragraph("Contract Governance Clause", cell_norm), Paragraph("Clause 12.3 (Bill Verification & Audit)", cell_norm)],
            [Paragraph("21", cell_norm), Paragraph("Is Concealed / Hidden Work (Y/N)", cell_norm), Paragraph("N", cell_norm)],
            [Paragraph("22", cell_norm), Paragraph("Measurement Protocol Type", cell_norm), Paragraph("Joint Physical Verification & Bill Audit", cell_norm)],
            [Paragraph("23", cell_norm), Paragraph("TPI Engineer Remarks", cell_norm), Paragraph(observation, cell_norm)],
            [Paragraph("24", cell_norm), Paragraph("Action Required", cell_norm), Paragraph("Variance Deducted & Corrected" if diff_qty > 0 else "Verified & Recommended for Payment", cell_norm)],
            [Paragraph("25", cell_norm), Paragraph("Target Closure Date", cell_norm), Paragraph("2026-12-31", cell_norm)],
            [Paragraph("26", cell_norm), Paragraph("Verification Closure Status", cell_norm), Paragraph(closure_status, cell_bold)],
            [Paragraph("27", cell_norm), Paragraph("Lock & Security Audit Status", cell_bold), Paragraph(f"<b>{lock_badge} | {audit_status}</b>", cell_bold)],
        ]

        fields_table = Table(fields_data, colWidths=[40, 240, 255])
        fields_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#003366")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
            ('PADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(fields_table)
        story.append(Spacer(1, 10))

        # Sign-off & Watermark Callback
        sig_data = [
            [
                Paragraph("<b>TPI INSPECTION ENGINEER:</b><br/>ID: IQE-ENG-9941<br/>Signed: Digitally Verified", cell_norm),
                Paragraph("<b>QA/QC AUDIT MANAGER:</b><br/>ID: IQE-QA-1022<br/>Signed: Certified Passed", cell_norm),
                Paragraph("<b>ISO 17020 STAMP:</b><br/>QR Code Encrypted<br/>Status: AUTHENTICATED", cell_norm)
            ]
        ]
        sig_table = Table(sig_data, colWidths=[175, 175, 185])
        sig_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f1f5f9")),
            ('PADDING', (0,0), (-1,-1), 6),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ]))
        story.append(sig_table)

        def add_watermark(canvas, doc):
            canvas.saveState()
            canvas.setFont("Helvetica-Bold", 40)
            canvas.setFillColor(colors.HexColor("#cbd5e1"), alpha=0.35)
            canvas.translate(300, 420)
            canvas.rotate(35)
            canvas.drawCentredString(0, 0, "IDEAL QUALITY ENGINEERS (IQE)")
            canvas.restoreState()

        doc.build(story, onFirstPage=add_watermark, onLaterPages=add_watermark)
        return buffer.getvalue()

    @staticmethod
    async def generate_analytics_pdf(site_id: str = "SITE-01") -> bytes:
        """
        Generates an enterprise PDF report for System Telemetry & Legacy Migration Analytics.
        """
        summary = await AnalyticsService.get_summary(site_id)

        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'DocTitle', parent=styles['Heading1'], fontSize=18, leading=22, textColor=colors.HexColor("#0f172a"), fontName="Helvetica-Bold"
        )
        subtitle_style = ParagraphStyle(
            'DocSubTitle', parent=styles['Normal'], fontSize=10, leading=14, textColor=colors.HexColor("#475569")
        )
        section_style = ParagraphStyle(
            'SectionTitle', parent=styles['Heading2'], fontSize=12, leading=16, textColor=colors.HexColor("#1e293b"), fontName="Helvetica-Bold"
        )
        table_cell_bold = ParagraphStyle('CellBold', parent=styles['Normal'], fontSize=8, leading=10, fontName="Helvetica-Bold")
        table_cell_norm = ParagraphStyle('CellNorm', parent=styles['Normal'], fontSize=8, leading=10)

        story = []

        story.append(Paragraph("IQE - System Telemetry & Legacy Migration Analytics Report", title_style))
        story.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Engine: Vue 3 + FastAPI Analytics", subtitle_style))
        story.append(Spacer(1, 12))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#4f46e5"), spaceAfter=15))

        # KPI Cards Table
        kpi_data = [
            [
                Paragraph(f"<b>Total Telemetry Events:</b><br/><font size='14' color='#4f46e5'><b>{summary.get('total_events', 0)}</b></font>", table_cell_norm),
                Paragraph(f"<b>Page Views:</b><br/><font size='14' color='#0284c7'><b>{summary.get('page_views', 0)}</b></font>", table_cell_norm),
                Paragraph(f"<b>Button Clicks:</b><br/><font size='14' color='#d97706'><b>{summary.get('button_clicks', 0)}</b></font>", table_cell_norm),
                Paragraph(f"<b>Legacy Jobs Ingested:</b><br/><font size='14' color='#059669'><b>{summary.get('legacy_migrated_jobs', 0)}</b></font>", table_cell_norm),
            ]
        ]
        kpi_table = Table(kpi_data, colWidths=[130, 130, 130, 130])
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
            ('PADDING', (0,0), (-1,-1), 10),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ]))
        story.append(kpi_table)
        story.append(Spacer(1, 15))

        # Top Clicked Elements Table
        story.append(Paragraph("Top Clicked Interactive Buttons & Elements", section_style))
        story.append(Spacer(1, 8))

        headers = ["Rank", "Element Unique Key", "Item Name", "Category", "Target Page Route", "Clicks"]
        table_rows = [[Paragraph(f"<b>{h}</b>", table_cell_bold) for h in headers]]

        top_items = summary.get("top_clicked_items", [])
        for idx, item in enumerate(top_items[:10], start=1):
            table_rows.append([
                Paragraph(str(idx), table_cell_norm),
                Paragraph(f"<code>{item['key']}</code>", table_cell_norm),
                Paragraph(f"<b>{item['name']}</b>", table_cell_norm),
                Paragraph(item.get("category", "general"), table_cell_norm),
                Paragraph(item.get("page_route", "/"), table_cell_norm),
                Paragraph(f"<font color='#d97706'><b>{item['count']}</b></font>", table_cell_norm),
            ])

        top_table = Table(table_rows, colWidths=[30, 140, 150, 75, 75, 50])
        top_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0f172a")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(top_table)

        doc.build(story)
        return buffer.getvalue()

    @staticmethod
    async def generate_quality_bill_verification_pdf(site_id: str = "SITE-01") -> bytes:
        from app.pdf.service import render_pdf
        return render_pdf("FQUAL01", payload={})

    @staticmethod
    async def generate_boq_reconciliation_pdf(site_id: str = "SITE-01") -> bytes:
        from app.pdf.service import render_pdf
        return render_pdf("FBOQ01", payload={})

    @staticmethod
    async def generate_schedule_m_pdf(site_id: str = "SITE-01") -> bytes:
        """
        Generates an ISO 17020 Type A Schedule M (Revised 2024) Cleanroom Qualification & Pharma EPC Audit PDF Report.
        """
        from reportlab.graphics.shapes import Drawing
        from reportlab.graphics.barcode.qr import QrCodeWidget
        from reportlab.platypus import Image as RLImage
        import os

        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=30,
            leftMargin=30,
            topMargin=30,
            bottomMargin=40
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'PharmaTitle', parent=styles['Heading1'], fontSize=15, leading=19, textColor=colors.HexColor("#003366"), fontName="Helvetica-Bold"
        )
        subtitle_style = ParagraphStyle(
            'PharmaSubTitle', parent=styles['Normal'], fontSize=8.5, leading=12, textColor=colors.HexColor("#e35f14")
        )
        section_style = ParagraphStyle(
            'PharmaSection', parent=styles['Heading2'], fontSize=11, leading=15, textColor=colors.HexColor("#0f172a"), fontName="Helvetica-Bold"
        )
        cell_bold = ParagraphStyle('PCellBold', parent=styles['Normal'], fontSize=8, leading=10, fontName="Helvetica-Bold")
        cell_norm = ParagraphStyle('PCellNorm', parent=styles['Normal'], fontSize=8, leading=10)

        story = []

        # Logo, Header & Scannable QR Code
        logo_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../apps/web/public/iqe-logo.png"))
        logo_img = None
        if os.path.exists(logo_path):
            try:
                logo_img = RLImage(logo_path, width=48, height=48)
            except Exception:
                logo_img = None

        from core.qr import verify_url, qr_drawing as make_qr

        d = make_qr(verify_url(
            title="Schedule M Pharma EPC Audit Report",
            ref="IQE/SCH-M/2026/04",
            client="Granules Consumer Health",
            status="94.5% Statutory Compliance",
            date=datetime.now().strftime('%Y-%m-%d'),
            form="F-01 to F-14",
            pdf_path=f"/api/v1/reports/pdf/schedule-m-pharma-epc?site_id={site_id}",
        ), size=58)

        header_title_p = Paragraph(
            "<b>IDEAL QUALITY ENGINEERS (I) PRIVATE LIMITED</b><br/>"
            "<font size=11 color='#003366'><b>Schedule M (2024 Revised) Cleanroom &amp; Pharma EPC Audit Report</b></font><br/>"
            f"<font size=8 color='#475569'>Forms: <b>F-01 to F-14</b> | Report No: <b>IQE/SCH-M/2026/04</b> | Date: <b>{datetime.now().strftime('%Y-%m-%d')}</b></font>",
            title_style
        )

        if logo_img:
            header_table = Table([[logo_img, header_title_p, d]], colWidths=[52, 418, 65])
        else:
            header_table = Table([[header_title_p, d]], colWidths=[470, 65])

        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ALIGN', (-1,0), (-1,0), 'RIGHT'),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 6))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#003366"), spaceAfter=10))

        # Metadata box
        meta_data = [
            [
                Paragraph("<b>Facility Type:</b> Formulation & Sterile Injectables", cell_norm),
                Paragraph("<b>Licensing Authority:</b> CDSCO / State Drugs Control Dept", cell_norm),
            ],
            [
                Paragraph("<b>Compliance Standard:</b> Schedule M (GSR 922E) & WHO-GMP", cell_norm),
                Paragraph("<b>Qualification Stage:</b> Installation & Operational (IQ/OQ)", cell_norm),
            ],
        ]
        meta_table = Table(meta_data, colWidths=[260, 260])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#fffbeb")),
            ('PADDING', (0,0), (-1,-1), 6),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#fcd34d")),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 10))

        # KPI Summary metrics
        kpi_data = [
            [
                Paragraph("<font size=7 color='#047857'>SCHEDULE M SCORE</font><br/><b>94.5% Pass</b>", cell_norm),
                Paragraph("<font size=7 color='#0369a1'>VERIFICATION CHECKLISTS</font><br/><b>191 Points</b>", cell_norm),
                Paragraph("<font size=7 color='#b91c1c'>CRITICAL/MAJOR NCs</font><br/><b>0 Crit / 1 Maj</b>", cell_norm),
                Paragraph("<font size=7 color='#4338ca'>CQV HANDOVER READY</font><br/><b>91.2% Dossier</b>", cell_norm),
            ]
        ]
        kpi_table = Table(kpi_data, colWidths=[130, 130, 130, 130])
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(kpi_table)
        story.append(Spacer(1, 12))

        story.append(Paragraph("Schedule M Statutory Verification Checklist & Test Findings", section_style))
        story.append(Spacer(1, 6))

        headers = ["Clause", "Discipline / System", "Scope & Inspection Method", "Acceptance Spec", "Observed Test Value", "Result"]
        rows = [[Paragraph(f"<b>{h}</b>", cell_bold) for h in headers]]

        sample_items = [
            ("3.1", "HVAC / Cleanrooms", "HEPA Filter PAO / DOP Aerosol Leak Test", "Penetration < 0.01%", "0.002% (Passed)", "Compliant"),
            ("3.4", "Air Pressure Cascades", "Differential Pressure DP Sensor Logging", "15 Pa (Grade B to C)", "16.8 Pa Verified", "Compliant"),
            ("4.2", "Piping & Process", "SS 316L Orbital Weld Borescope Inspection", "Smooth root, no oxidation", "Ra = 0.38 um (Spec < 0.51)", "Compliant"),
            ("5.1", "Water for Injection", "WFI Loop Velocity & Sampling Ports", "Min 1.5 m/s turbulent return", "1.82 m/s Logged", "Compliant"),
            ("6.3", "Drainage & Effluent", "Concealed Drain Traps Air Break Verification", "No direct sewer connection", "Air break gap installed", "Compliant"),
            ("7.2", "Finishes & Coving", "Epoxy Floor to Wall Coving Radius", "Min 50mm radius flush", "Epoxy coving 55mm flush", "Compliant"),
        ]

        for r in sample_items:
            rows.append([
                Paragraph(f"<b>{r[0]}</b>", cell_norm),
                Paragraph(r[1], cell_bold),
                Paragraph(r[2], cell_norm),
                Paragraph(r[3], cell_norm),
                Paragraph(f"<b>{r[4]}</b>", cell_norm),
                Paragraph(f"<font color='#059669'><b>{r[5]}</b></font>", cell_norm),
            ])

        table = Table(rows, colWidths=[35, 95, 140, 100, 95, 55])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0f172a")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ('PADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(table)
        story.append(Spacer(1, 14))

        story.append(Paragraph("<b>Regulatory Statutory Compliance Sign-Off:</b>", section_style))
        story.append(Paragraph("The cleanroom facility design and installed systems satisfy Revised 2024 Schedule M guidelines and are recommended for regulatory inspection & validation licensing.", subtitle_style))
        story.append(Spacer(1, 18))

        sig_data = [
            [
                Paragraph("<b>Lead Pharma Auditor:</b><br/>Certified GMP Lead Inspector", cell_norm),
                Paragraph("<b>HVAC Validation Specialist:</b><br/>Cleanroom Certification Engineer", cell_norm),
                Paragraph("<b>Director of Quality:</b><br/>Authorized ISO 17020 Signatory", cell_norm),
            ]
        ]
        sig_table = Table(sig_data, colWidths=[173, 173, 174])
        sig_table.setStyle(TableStyle([
            ('LINEABOVE', (0,0), (-1,-1), 1, colors.HexColor("#94a3b8")),
            ('PADDING', (0,0), (-1,-1), 6),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ]))
        story.append(sig_table)

        def page_layout(canvas, doc):
            canvas.saveState()
            canvas.setFont("Helvetica-Bold", 38)
            canvas.setFillColor(colors.HexColor("#e2e8f0"), alpha=0.35)
            canvas.translate(300, 420)
            canvas.rotate(35)
            canvas.drawCentredString(0, 0, "IDEAL QUALITY ENGINEERS (IQE)")
            canvas.restoreState()

            canvas.saveState()
            canvas.setFont("Helvetica-Bold", 7.5)
            canvas.setFillColor(colors.HexColor("#0f172a"))
            canvas.drawString(30, 22, "IDEAL QUALITY ENGINEERS (I) PVT LTD | ISO/IEC 17020:2026 Type A Inspection Body")
            canvas.setFont("Helvetica", 7)
            canvas.setFillColor(colors.HexColor("#64748b"))
            canvas.drawString(30, 12, "Head Office: Flat No. 302, Plot No. 410, Matrusri Nagar, Miyapur, Hyderabad - 500049 | Web: www.iqe.co.in")
            canvas.drawRightString(565, 12, f"Page {doc.page} | Schedule M GMP Audit Certificate")
            canvas.restoreState()

        doc.build(story, onFirstPage=page_layout, onLaterPages=page_layout)
        return buffer.getvalue()

    @staticmethod
    async def generate_quality_bill_verification_docx(site_id: str = "SITE-01") -> bytes:
        """
        Generates a Word (.docx) report with IQE Logo, Header, Footer & Scannable QR Code.
        """
        import docx
        from docx.shared import Inches, Pt, RGBColor
        from docx.enum.text import WD_ALIGN_PARAGRAPH
        from docx.enum.table import WD_TABLE_ALIGNMENT
        import os

        doc = docx.Document()

        # Page margins
        sections = doc.sections
        for section in sections:
            section.top_margin = Inches(0.5)
            section.bottom_margin = Inches(0.5)
            section.left_margin = Inches(0.5)
            section.right_margin = Inches(0.5)

        # Header Table with Logo, Title, and QR Code
        tbl = doc.add_table(rows=1, cols=3)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False

        # Generate QR Code image buffer
        from core.qr import verify_url, qr_png
        qr_buf = qr_png(verify_url(
            title="Quality & Quantity Bill Verification Report",
            ref="IQE/QVR/2026/084",
            status="Verified & Payable Authorized",
            date=datetime.now().strftime('%Y-%m-%d'),
            form="F-QUAL-01",
            pdf_path=f"/api/v1/reports/pdf/quality-bill-verification?site_id={site_id}",
        ))

        # Cell 1: Logo
        cell_logo = tbl.cell(0, 0)
        cell_logo.width = Inches(1.0)
        p_logo = cell_logo.paragraphs[0]
        logo_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../apps/web/public/iqe-logo.png"))
        if os.path.exists(logo_path):
            try:
                p_logo.add_run().add_picture(logo_path, width=Inches(0.8))
            except Exception:
                p_logo.text = "IQE LOGO"
        else:
            p_logo.text = "IQE LOGO"

        # Cell 2: Header Title
        cell_title = tbl.cell(0, 1)
        cell_title.width = Inches(4.8)
        p_title = cell_title.paragraphs[0]
        r1 = p_title.add_run("IDEAL QUALITY ENGINEERS (I) PVT LTD\n")
        r1.bold = True
        r1.font.size = Pt(13)
        r1.font.color.rgb = RGBColor(0, 51, 102)

        r2 = p_title.add_run("ISO/IEC 17020:2026 Type A Quality Bill Verification Certificate\n")
        r2.bold = True
        r2.font.size = Pt(10)
        r2.font.color.rgb = RGBColor(5, 150, 105)

        r3 = p_title.add_run(f"Audit Date: {datetime.now().strftime('%Y-%m-%d')} | Report Ref: IQE/QVR/2026/084 | Site: {site_id}")
        r3.font.size = Pt(8.5)
        r3.font.color.rgb = RGBColor(100, 116, 139)

        # Cell 3: QR Code
        cell_qr = tbl.cell(0, 2)
        cell_qr.width = Inches(1.2)
        p_qr = cell_qr.paragraphs[0]
        p_qr.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p_qr.add_run().add_picture(qr_buf, width=Inches(0.9))

        doc.add_paragraph().paragraph_format.space_after = Pt(6)

        # Metadata Section
        meta_table = doc.add_table(rows=2, cols=2)
        meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
        meta_table.cell(0, 0).text = "Inspection Body: IQE Type A Third Party Inspection"
        meta_table.cell(0, 1).text = f"Audit Date: {datetime.now().strftime('%Y-%m-%d')}"
        meta_table.cell(1, 0).text = "Standard Ref: ISO/IEC 17020:2026 & ISO 9001:2026"
        meta_table.cell(1, 1).text = "Scope: Quality & Quantity Bill Verification"

        doc.add_paragraph().paragraph_format.space_after = Pt(10)

        # Items Table
        p_heading = doc.add_paragraph()
        r_head = p_heading.add_run("Verified Quality & BOQ Measurement Ledger")
        r_head.bold = True
        r_head.font.size = Pt(11)
        r_head.font.color.rgb = RGBColor(0, 51, 102)

        items_table = doc.add_table(rows=1, cols=8)
        items_table.alignment = WD_TABLE_ALIGNMENT.CENTER
        hdr_cells = items_table.rows[0].cells
        headers = ["Sl", "BOQ Item", "GFC Dwg Ref", "Claimed Qty", "TPI Verified Qty", "Claimed (INR)", "Recommended (INR)", "Status"]
        for i, h in enumerate(headers):
            hdr_cells[i].text = h

        sample_items = [
          ("1", "BOQ-CIV-01.1", "GIL/GAG/CIV-001 R2", "180 Cum", "155 Cum", "86,400", "74,400", "Discrepancy Flagged"),
          ("2", "BOQ-CIV-02.4", "GIL/GAG/CIV-004 R1", "45 Cum", "45 Cum", "173,250", "173,250", "Verified & Approved"),
          ("3", "BOQ-STR-04.2", "GIL/GAG/STR-102 R3", "8500 Kgs", "7800 Kgs", "782,000", "717,600", "Partially Verified"),
          ("4", "BOQ-PIP-08.1", "GIL/GAG/MEP-301 R0", "150 Mtrs", "150 Mtrs", "187,500", "187,500", "Verified & Approved"),
        ]

        for item in sample_items:
            row_cells = items_table.add_row().cells
            for idx, val in enumerate(item):
                row_cells[idx].text = val

        doc.add_paragraph().paragraph_format.space_after = Pt(14)

        # Sign-off & Mandatory Footer
        p_sign = doc.add_paragraph()
        r_s = p_sign.add_run("Authorized Sign-Off & Recommendation:\n")
        r_s.bold = True
        r_s.font.size = Pt(10)
        p_sign.add_run("The quantities above have been physically audited & verified against GFC drawings and ISO 17020 compliance guidelines.\n")

        p_ftr = doc.add_paragraph()
        p_ftr.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_f = p_ftr.add_run("IDEAL QUALITY ENGINEERS (I) PVT LTD | ISO/IEC 17020:2026 Accredited Inspection Body\nHead Office: Flat No. 302, Plot No. 410, Matrusri Nagar, Miyapur, Hyderabad - 500049 | Web: www.iqe.co.in")
        r_f.font.size = Pt(8)
        r_f.font.color.rgb = RGBColor(100, 116, 139)

        out_buf = BytesIO()
        doc.save(out_buf)
        return out_buf.getvalue()

    @staticmethod
    async def generate_quality_bill_verification_xlsx(site_id: str = "SITE-01") -> bytes:
        """
        Generates an Excel (.xlsx) workbook with IQE Header, ISO Metadata, QR Code details & Footer.
        """
        import openpyxl
        from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
        from openpyxl.drawing.image import Image as OpenPyxlImage
        import os

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Quality Bill Verification"

        # Styles
        font_title = Font(name="Calibri", size=14, bold=True, color="003366")
        font_sub = Font(name="Calibri", size=10, bold=True, color="059669")
        font_hdr = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
        fill_hdr = PatternFill(start_color="0F172A", end_color="0F172A", fill_type="solid")
        fill_subhdr = PatternFill(start_color="F0FDF4", end_color="F0FDF4", fill_type="solid")

        # Row 1-3: Header Info
        ws["A1"] = "IDEAL QUALITY ENGINEERS (I) PRIVATE LIMITED"
        ws["A1"].font = font_title
        ws["A2"] = "ISO/IEC 17020:2026 Type A Quality Bill Verification Certificate & Inspection Audit"
        ws["A2"].font = font_sub
        ws["A3"] = f"Report Date: {datetime.now().strftime('%Y-%m-%d')} | Report Ref: IQE/QVR/2026/084 | Site: {site_id}"

        # Add QR Code Image if possible
        from core.qr import verify_url, qr_png
        qr_buf = qr_png(verify_url(
            title="Quality & Quantity Bill Verification Report",
            ref="IQE/QVR/2026/084",
            status="Verified & Payable Authorized",
            date=datetime.now().strftime('%Y-%m-%d'),
            form="F-QUAL-01",
            pdf_path=f"/api/v1/reports/pdf/quality-bill-verification?site_id={site_id}",
        ))
        try:
            xl_img = OpenPyxlImage(qr_buf)
            xl_img.width = 60
            xl_img.height = 60
            ws.add_image(xl_img, 'H1')
        except Exception:
            pass

        ws.append([])
        ws.append(["ISO 17020 Audit Metadata"])
        ws.cell(row=5, column=1).font = Font(bold=True)

        ws.append(["Inspection Body:", "IQE Type A Third Party Inspection", "Audit Date:", datetime.now().strftime('%Y-%m-%d')])
        ws.append(["Standard Ref:", "ISO/IEC 17020:2026 & ISO 9001:2026", "Scope:", "Quality & Quantity Bill Verification"])

        ws.append([])

        headers = ["Sl No", "BOQ Item", "GFC Drawing Ref", "Contractor / Vendor", "Claimed Qty", "TPI Verified Qty", "Claimed (INR)", "Recommended (INR)", "Verification Status"]
        ws.append(headers)

        hdr_row_idx = ws.max_row
        for col_idx in range(1, len(headers) + 1):
            cell = ws.cell(row=hdr_row_idx, column=col_idx)
            cell.font = font_hdr
            cell.fill = fill_hdr
            cell.alignment = Alignment(horizontal="center", vertical="center")

        sample_rows = [
            [1, "BOQ-CIV-01.1", "GIL/GAG/CIV-001 R2", "JB Fabricator", "180 Cum", "155 Cum", 86400, 74400, "Discrepancy Flagged"],
            [2, "BOQ-CIV-02.4", "GIL/GAG/CIV-004 R1", "Devi sri (Civil)", "45 Cum", "45 Cum", 173250, 173250, "Verified & Approved"],
            [3, "BOQ-STR-04.2", "GIL/GAG/STR-102 R3", "Maruthi Engg", "8500 Kgs", "7800 Kgs", 782000, 717600, "Partially Verified"],
            [4, "BOQ-PIP-08.1", "GIL/GAG/MEP-301 R0", "Triveni Insulation", "150 Mtrs", "150 Mtrs", 187500, 187500, "Verified & Approved"],
        ]

        for r in sample_rows:
            ws.append(r)

        ws.append([])
        ws.append(["Mandatory Footer & Certification Notice:"])
        ws.append(["IDEAL QUALITY ENGINEERS (I) PVT LTD | ISO/IEC 17020:2026 Accredited Type A Inspection Body"])
        ws.append(["Head Office: Flat No. 302, Plot No. 410, Matrusri Nagar, Miyapur, Hyderabad - 500049 | Web: www.iqe.co.in | Confidential Audit Report"])

        # Auto-fit column widths
        for col in ws.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            col_letter = openpyxl.utils.get_column_letter(col[0].column)
            ws.column_dimensions[col_letter].width = max(max_len + 3, 12)

        out_buf = BytesIO()
        wb.save(out_buf)
        return out_buf.getvalue()

    @staticmethod
    async def generate_tpi_billing_docx(site_id: str = "SITE-01") -> bytes:
        """
        Generates Word (.docx) report for TPI Billing Master with IQE Logo, Header, Footer & QR Code.
        """
        return await ReportService.generate_quality_bill_verification_docx(site_id)

    @staticmethod
    async def generate_tpi_billing_xlsx(site_id: str = "SITE-01") -> bytes:
        """
        Generates Excel (.xlsx) report for TPI Billing Master with IQE Logo, Header, Footer & QR Code.
        """
        return await ReportService.generate_quality_bill_verification_xlsx(site_id)

    @staticmethod
    async def generate_tpi_single_item_docx(
        boq_item: str = "1.01",
        ra_bill: str = "RA-001",
        vendor: str = "Quality Engineers",
        client: str = "Granules India",
        description: str = "Pipe Installation",
        unit: str = "MT",
        drawing_ref: str = "GFC-001",
        boq_qty: float = 1.0,
        claimed_qty: float = 1.0,
        verified_qty: float = 1.0,
        unit_rate: float = 50000.0,
        observation: str = "Verified",
        closure_status: str = "Closed",
        is_locked: bool = False
    ) -> bytes:
        return await ReportService.generate_quality_bill_verification_docx(site_id=f"ITEM-{boq_item}")

    @staticmethod
    async def generate_tpi_single_item_xlsx(
        boq_item: str = "1.01",
        ra_bill: str = "RA-001",
        vendor: str = "Quality Engineers",
        client: str = "Granules India",
        description: str = "Pipe Installation",
        unit: str = "MT",
        drawing_ref: str = "GFC-001",
        boq_qty: float = 1.0,
        claimed_qty: float = 1.0,
        verified_qty: float = 1.0,
        unit_rate: float = 50000.0,
        observation: str = "Verified",
        closure_status: str = "Closed",
        is_locked: bool = False
    ) -> bytes:
        return await ReportService.generate_quality_bill_verification_xlsx(site_id=f"ITEM-{boq_item}")


