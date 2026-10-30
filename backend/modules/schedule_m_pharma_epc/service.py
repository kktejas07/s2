from datetime import datetime
from typing import List, Optional
from modules.schedule_m_pharma_epc.models import (
    ScheduleMPharmaEPCProject,
    ScheduleMChecklistItem,
    ScheduleMRequirementsRegister,
    ScheduleMRFIRegister,
    ScheduleMURSTraceability,
    ScheduleMExpertGap,
    ScheduleMTechnicalBenchmark,
    ScheduleMRedFlagCheck,
    ScheduleMQuantityMeasurement,
    ScheduleMBOQReconciliation,
    ScheduleMRABillReview,
    ScheduleMNCRCAPA,
    ScheduleMChangeRegister,
    ScheduleMCalibration,
    ScheduleMPunchList,
    ScheduleMTurnoverDossier,
    ScheduleMInspectionReport,
)
from modules.schedule_m_pharma_epc.extracted_data import (
    CHECKLISTS,
    REQUIREMENTS,
    D16_RED_FLAGS,
    EXPERT_GAPS,
    TECHNICAL_BENCHMARKS,
)


def get_default_checklists() -> List[ScheduleMChecklistItem]:
    items = []
    for c in CHECKLISTS:
        items.append(ScheduleMChecklistItem(**c))
    return items


def get_default_requirements() -> List[ScheduleMRequirementsRegister]:
    items = []
    for r in REQUIREMENTS:
        items.append(ScheduleMRequirementsRegister(**r))
    return items


def get_default_red_flags() -> List[ScheduleMRedFlagCheck]:
    items = []
    for rf in D16_RED_FLAGS:
        items.append(ScheduleMRedFlagCheck(**rf))
    return items


def get_default_expert_gaps() -> List[ScheduleMExpertGap]:
    items = []
    for g in EXPERT_GAPS:
        items.append(ScheduleMExpertGap(**g))
    return items


def get_default_technical_benchmarks() -> List[ScheduleMTechnicalBenchmark]:
    items = []
    for b in TECHNICAL_BENCHMARKS:
        items.append(ScheduleMTechnicalBenchmark(**b))
    return items


def get_default_urs_traceability() -> List[ScheduleMURSTraceability]:
    return [
        ScheduleMURSTraceability(
            urs_id="URS-HVAC-01",
            urs_requirement="Aseptic filling suite must maintain ISO 5 (Grade A) laminar air velocity 0.45 m/s ± 20%",
            design_ref="DWG-HVA-102 Rev C",
            verification_method="Air velocity profile & smoke visualization per ISO 14644-3",
            test_protocol_ref="PROT-OQ-HVA-01",
            evidence_ref="REP-VEL-2026-09",
            finding="Terminal HEPA velocity measured at 0.44 m/s. Smoke study showed unidirectional laminar flow over vial stopper bowl.",
            risk="Critical",
            compliance_status="COMPLIANT",
        ),
        ScheduleMURSTraceability(
            urs_id="URS-HVAC-02",
            urs_requirement="Differential pressure cascade: Grade B (+45Pa), Grade C (+30Pa), Grade D (+15Pa), CNC (0Pa)",
            design_ref="BOD-HVAC-004 Rev B",
            verification_method="BMS differential pressure sensor calibration and room balancing record",
            test_protocol_ref="PROT-IQ-BMS-03",
            evidence_ref="CAL-DP-001 to 012",
            finding="All cascading steps maintain 15 Pa minimum delta. Magnehelic gauges calibrated.",
            risk="High",
            compliance_status="COMPLIANT",
        ),
        ScheduleMURSTraceability(
            urs_id="URS-WFI-01",
            urs_requirement="WFI generation & loop distribution at 80°C continuous circulation with zero dead-legs > 1.5D",
            design_ref="P&ID-WFI-001 Rev D",
            verification_method="Borescope inspection of all orbitally welded tee branches & temperature trend logs",
            test_protocol_ref="PROT-OQ-WFI-02",
            evidence_ref="BORE-WFI-LOG-01",
            finding="All branch run ratios verified <= 1.5D. Loop return temperature consistently > 82°C.",
            risk="Critical",
            compliance_status="COMPLIANT",
        ),
        ScheduleMURSTraceability(
            urs_id="URS-AUTO-01",
            urs_requirement="BMS / EMS must provide 21 CFR Part 11 / GAMP 5 compliant secure audit trails with time synchronization",
            design_ref="SPEC-AUT-007 Rev A",
            verification_method="Software security & audit trail challenge test",
            test_protocol_ref="PROT-CSV-BMS-01",
            evidence_ref="CSV-REP-2026-04",
            finding="NTP server synchronization active. User action, alarm acknowledgement and parameter change audit trails verified non-editable.",
            risk="High",
            compliance_status="COMPLIANT",
        ),
        ScheduleMURSTraceability(
            urs_id="URS-CIV-01",
            urs_requirement="Cleanroom partition walls and ceiling flush walkable with silicone/aluminum R=50mm coving",
            design_ref="DWG-CIV-501 Rev C",
            verification_method="Physical dimension check and air tightness test",
            test_protocol_ref="PROT-IQ-CIV-02",
            evidence_ref="IR-CIV-042",
            finding="Flush double-glazed vision panels and airtight ceiling seals verified.",
            risk="Medium",
            compliance_status="COMPLIANT",
        ),
    ]


def get_default_rfis() -> List[ScheduleMRFIRegister]:
    return [
        ScheduleMRFIRegister(
            rfi_id="RFI-001",
            date_raised="2026-09-20",
            raised_by="R. Patel (Lead Piping Inspector)",
            discipline="Process & Piping",
            doc_ref="P&ID-WFI-001 Rev C",
            query="Clarification requested on WFI point-of-use sample valve type: whether zero dead leg block valve or radial diaphragm valve is required at user point UP-08.",
            impact="GMP / Quality",
            addressed_to="Turnkey EPC Design Engineering Team",
            response="Confirmed: Zero dead-leg radial diaphragm valve with 316L Ra < 0.4 um electropolished finish must be used at all sterile user points.",
            status="CLOSED",
            closed_date="2026-09-22",
        ),
        ScheduleMRFIRegister(
            rfi_id="RFI-002",
            date_raised="2026-09-25",
            raised_by="S. Mehta (Cleanroom Inspector)",
            discipline="Civil & Cleanroom",
            doc_ref="DWG-CIV-503 Rev B",
            query="Door interlock delay timer setting for Personnel Air Lock PAL-02 (Grade C to Grade B transition): confirm whether 30-second purge timer is integrated with door maglock release.",
            impact="Schedule / Commissioning",
            addressed_to="HVAC & Automation Lead",
            response="30-second delay is hardcoded in BMS interlock controller. Emergency override push button is provided inside airlock with tamper seal.",
            status="CLOSED",
            closed_date="2026-09-27",
        ),
        ScheduleMRFIRegister(
            rfi_id="RFI-003",
            date_raised="2026-09-28",
            raised_by="V. Sharma (E&I Engineer)",
            discipline="E&I",
            doc_ref="SCHEM-MCC-02",
            query="Clarification on hazardous area flameproof certification (Ex d IIB T4) for exhaust blower motors in solvent dispensing booth.",
            impact="Safety / Statutory",
            addressed_to="Electrical EPC Consultant",
            response="Pending PESO / ATEX certificate submission by contractor.",
            status="OPEN",
            closed_date=None,
        ),
    ]


def get_default_quantity_measurements() -> List[ScheduleMQuantityMeasurement]:
    return [
        ScheduleMQuantityMeasurement(
            sl_no=1,
            project="SunPharma BioTech EPC",
            package="Civil & Cleanrooms",
            sheet_no="M-CIV-001",
            date="2026-09-22",
            boq_item="BOQ-CIV-04",
            description="50mm thick modular cleanroom wall panels with PIR insulation and anti-microbial coating",
            unit="Sqm",
            rate=3850.0,
            location_grid_room_tag="Grade B Fill Suite Room 104, Grid A3-B4",
            drawing_rev="DWG-CIV-501 Rev C",
            variation_ref=None,
            length=18.5,
            width=3.2,
            height_depth=0.0,
            calculated_qty=59.2,
            total_amount=227920.0,
            status="VERIFIED",
        ),
        ScheduleMQuantityMeasurement(
            sl_no=2,
            project="SunPharma BioTech EPC",
            package="HVAC & Ducting",
            sheet_no="M-HVA-002",
            date="2026-09-24",
            boq_item="BOQ-HVA-12",
            description="GI factory fabricated rectangular ductwork 18G with nitrile rubber insulation",
            unit="Sqm",
            rate=1450.0,
            location_grid_room_tag="AHU-04 Supply Header Corridor Grade C",
            drawing_rev="DWG-HVA-202 Rev B",
            variation_ref=None,
            length=42.0,
            width=1.6,
            height_depth=0.0,
            calculated_qty=67.2,
            total_amount=97440.0,
            status="VERIFIED",
        ),
        ScheduleMQuantityMeasurement(
            sl_no=3,
            project="SunPharma BioTech EPC",
            package="Process Piping",
            sheet_no="M-PIP-003",
            date="2026-09-26",
            boq_item="BOQ-PIP-08",
            description="SS 316L electro-polished hygienic piping 1.5 inch OD with orbital welding & tri-clover clamps",
            unit="Rm",
            rate=2800.0,
            location_grid_room_tag="WFI Loop Header Return to Storage Tank",
            drawing_rev="ISO-WFI-101 Rev 02",
            variation_ref=None,
            length=85.0,
            width=1.0,
            height_depth=0.0,
            calculated_qty=85.0,
            total_amount=238000.0,
            status="VERIFIED",
        ),
    ]


def get_default_boq_reconciliations() -> List[ScheduleMBOQReconciliation]:
    return [
        ScheduleMBOQReconciliation(
            boq_item="BOQ-CIV-04",
            description="Modular cleanroom partition wall panels 50mm",
            unit="Sqm",
            contract_qty=1200.0,
            approved_variation_qty=150.0,
            revised_qty=1350.0,
            previous_certified_qty=850.0,
            current_measured_qty=320.0,
            cumulative_qty=1170.0,
            balance_qty=180.0,
            rate=3850.0,
            current_value=1232000.0,
            cumulative_value=4504500.0,
            evidence_remarks="Joint measurement sheet M-CIV-001 verified with site survey markups",
        ),
        ScheduleMBOQReconciliation(
            boq_item="BOQ-HVA-12",
            description="GI fabricated rectangular ducting 18G & insulation",
            unit="Sqm",
            contract_qty=4500.0,
            approved_variation_qty=0.0,
            revised_qty=4500.0,
            previous_certified_qty=3100.0,
            current_measured_qty=650.0,
            cumulative_qty=3750.0,
            balance_qty=750.0,
            rate=1450.0,
            current_value=942500.0,
            cumulative_value=5437500.0,
            evidence_remarks="Duct pressure leak test certificate verified prior to certification",
        ),
        ScheduleMBOQReconciliation(
            boq_item="BOQ-PIP-08",
            description="SS 316L hygienic electro-polished piping 1.5 inch OD",
            unit="Rm",
            contract_qty=600.0,
            approved_variation_qty=50.0,
            revised_qty=650.0,
            previous_certified_qty=420.0,
            current_measured_qty=140.0,
            cumulative_qty=560.0,
            balance_qty=90.0,
            rate=2800.0,
            current_value=392000.0,
            cumulative_value=1568000.0,
            evidence_remarks="100% weld log & borescope inspection reports attached",
        ),
    ]


def get_default_ra_bill_reviews() -> List[ScheduleMRABillReview]:
    return [
        ScheduleMRABillReview(
            sl_no=1,
            project="SunPharma BioTech EPC",
            contractor="Turnkey Cleanroom EPC Ltd.",
            package="Civil & Cleanrooms",
            ra_bill_no="RA-04",
            period="September 2026",
            received_date="2026-09-25",
            boq_item="BOQ-CIV-04",
            description="Modular cleanroom wall panels 50mm",
            unit="Sqm",
            claimed_qty=350.0,
            verified_qty=320.0,
            rate=3850.0,
            claimed_value=1347500.0,
            verified_value=1232000.0,
            variance_qty=30.0,
            variance_value=115500.0,
            status="DISCREPANCY_FLAGGED",
            remarks="Contractor claimed 30 Sqm in Corridor 102 where panels are not yet aligned and coving is incomplete. Deducted ₹1,15,500.",
        ),
        ScheduleMRABillReview(
            sl_no=2,
            project="SunPharma BioTech EPC",
            contractor="Turnkey Cleanroom EPC Ltd.",
            package="HVAC & Ducting",
            ra_bill_no="RA-04",
            period="September 2026",
            received_date="2026-09-25",
            boq_item="BOQ-HVA-12",
            description="GI fabricated rectangular ducting 18G & insulation",
            unit="Sqm",
            claimed_qty=650.0,
            verified_qty=650.0,
            rate=1450.0,
            claimed_value=942500.0,
            verified_value=942500.0,
            variance_qty=0.0,
            variance_value=0.0,
            status="VERIFIED",
            remarks="100% physically measured and leak tested per DWG-HVA-202. Fully approved.",
        ),
        ScheduleMRABillReview(
            sl_no=3,
            project="SunPharma BioTech EPC",
            contractor="Turnkey Cleanroom EPC Ltd.",
            package="Process Piping",
            ra_bill_no="RA-04",
            period="September 2026",
            received_date="2026-09-25",
            boq_item="BOQ-PIP-08",
            description="SS 316L hygienic piping 1.5 inch OD",
            unit="Rm",
            claimed_qty=155.0,
            verified_qty=140.0,
            rate=2800.0,
            claimed_value=434000.0,
            verified_value=392000.0,
            variance_qty=15.0,
            variance_value=42000.0,
            status="DISCREPANCY_FLAGGED",
            remarks="15 Rm in loop sub-header lack weld radiography/borescope reports. Withheld ₹42,000 pending QA documentation.",
        ),
    ]


def get_default_ncrs() -> List[ScheduleMNCRCAPA]:
    return [
        ScheduleMNCRCAPA(
            ncr_id="NCR-PIP-001",
            date="2026-09-22",
            discipline="Process & Piping",
            location_tag="WFI Storage Tank Return Line WFI-L01",
            requirement_source="Schedule M Revised Clause 4.3 & ASME BPE",
            objective_evidence="Borescope video record BS-WFI-08 shows root concavity and lack of penetration at weld W-14.",
            risk_impact="CRITICAL",
            severity="Critical",
            target_resolution_hours=24,
            containment="Immediate stop work issued on WFI loop segment 3. Weld W-14 tagged Out of Service.",
            root_cause="Argon purge dam slipped during orbital weld cycle resulting in inadequate shielding gas at weld root.",
            disposition_approved_by="Dr. A. V. Kumar (IQE QA Director)",
            corrective_action="Cut out spool piece, re-face pipe ends, verify oxygen content < 10 ppm with calibrated purge monitor, and re-weld with 100% borescope re-inspection.",
            owner="Turnkey Mechanical EPC Lead",
            due_date="2026-09-29",
            status="IN_PROGRESS",
            ir_ref="IR-PIP-2026-08",
            reinspection_date=None,
        ),
        ScheduleMNCRCAPA(
            ncr_id="NCR-CIV-002",
            date="2026-09-25",
            discipline="Civil & Cleanroom",
            location_tag="Gowning Airlock PAL-01 (Grade D to C)",
            requirement_source="Schedule M Part I Clause 3.1 & ISPE Cleanroom Guide",
            objective_evidence="Floor-to-wall coving shows 1.5mm gap and adhesive detachment at North corner.",
            risk_impact="MEDIUM",
            severity="Major",
            target_resolution_hours=48,
            containment="Air lock flagged for rework prior to cleanroom HVAC air balancing.",
            root_cause="Surface moisture in epoxy screed substrate prior to silicone coving installation.",
            disposition_approved_by="S. Mehta (Lead Inspector)",
            corrective_action="Strip detached coving, moisture test substrate (< 4%), apply epoxy primer, install continuous aluminum backing coving with antifungal pharma sealant.",
            owner="Civil Finishes In-Charge",
            due_date="2026-10-02",
            status="OPEN",
            ir_ref="IR-CIV-2026-15",
            reinspection_date=None,
        ),
        ScheduleMNCRCAPA(
            ncr_id="NCR-E&I-001",
            date="2026-09-18",
            discipline="E&I",
            location_tag="Control Panel CP-04 Cleanroom Corridor",
            requirement_source="ISPE / IEEE Segregation Standards",
            objective_evidence="24V DC analog sensor cable bundled in same raceway with 415V AC motor power cables.",
            risk_impact="LOW",
            severity="Minor",
            target_resolution_hours=720,
            containment="Sensor cables segregated temporarily.",
            root_cause="Contractor wireman routed both through single panel penetration.",
            disposition_approved_by="V. Sharma (E&I Lead)",
            corrective_action="Installed physical galvanized metal divider barrier inside wireway and re-terminated analog cables with separate shielded conduit.",
            owner="Electrical Subcontractor",
            due_date="2026-09-24",
            status="CLOSED",
            ir_ref="IR-E&I-2026-03",
            reinspection_date="2026-09-24",
        ),
    ]


def get_default_calibrations() -> List[ScheduleMCalibration]:
    return [
        ScheduleMCalibration(
            instrument_id="CAL-PHOTO-01",
            description="ATI Aerosol Photometer 2i for HEPA Integrity Leak Testing",
            range_spec="0.0001% to 100% aerosol concentration",
            serial_no="ATI-2I-98442",
            certificate_no="NABL-CAL-2026-8812",
            calibration_date="2026-06-15",
            due_date="2027-06-14",
            status="VALID",
            report_refs="CERT-ATI-2026-01",
            out_of_calibration_action="Tag instrument and quarantine; re-verify all filters tested within past 30 days if calibration drift exceeds 1%.",
        ),
        ScheduleMCalibration(
            instrument_id="CAL-VELO-02",
            description="TSI Anemometer Air Velocity / Volume Meter",
            range_spec="0.15 m/s to 30.0 m/s (± 0.01 m/s)",
            serial_no="TSI-VEL-4410",
            certificate_no="NABL-CAL-2026-5419",
            calibration_date="2026-05-10",
            due_date="2027-05-09",
            status="VALID",
            report_refs="CERT-TSI-2026-04",
            out_of_calibration_action="None",
        ),
        ScheduleMCalibration(
            instrument_id="CAL-PART-03",
            description="MetOne Airborne Laser Particle Counter (0.5 & 5.0 µm)",
            range_spec="1 CFM Flow rate; 0.3 to 10 µm channels",
            serial_no="MO-PC-3400-09",
            certificate_no="NABL-CAL-2026-3391",
            calibration_date="2026-04-20",
            due_date="2027-04-19",
            status="VALID",
            report_refs="CERT-METONE-09",
            out_of_calibration_action="None",
        ),
        ScheduleMCalibration(
            instrument_id="CAL-PRESS-04",
            description="Fluke Precision Digital Manometer / Differential Pressure Calibrator",
            range_spec="-250 Pa to +250 Pa (± 0.5 Pa)",
            serial_no="FLK-DP-8821",
            certificate_no="NABL-CAL-2025-1029",
            calibration_date="2025-10-15",
            due_date="2026-10-14",
            status="DUE_SOON",
            report_refs="CERT-FLUKE-2025-10",
            out_of_calibration_action="Send for re-calibration before 14-Oct-2026.",
        ),
    ]


def get_default_punch_lists() -> List[ScheduleMPunchList]:
    return [
        ScheduleMPunchList(
            item_id="PL-HVA-01",
            system="HVAC & Cleanrooms",
            category="CAT_A",
            location_tag="Grade A Filling Suite AHU-04",
            description="Terminal HEPA filter H-07 PAO scan shows marginal leak 0.012% (threshold <= 0.01%). Filter must be re-torqued or replaced before Qualification protocol execution.",
            raised_by_date="2026-09-24",
            owner="HVAC Contractor Lead",
            due_date="2026-09-30",
            prerequisite_impact="Handover-blocking for OQ Smoke Study & Particle Counting",
            closure_evidence=None,
            verified_by_date=None,
            status="OPEN",
            days_open=4,
        ),
        ScheduleMPunchList(
            item_id="PL-CIV-02",
            system="Civil & Cleanroom",
            category="CAT_B",
            location_tag="Pass Box PB-03 between Grade C and B",
            description="Interlock indicator LED light green on both doors simultaneously when power reset occurred. Relay contactor wiring requires diode isolation.",
            raised_by_date="2026-09-26",
            owner="Automation & Cleanroom Vendor",
            due_date="2026-10-04",
            prerequisite_impact="Commissioning Handover",
            closure_evidence=None,
            verified_by_date=None,
            status="OPEN",
            days_open=2,
        ),
        ScheduleMPunchList(
            item_id="PL-PIP-03",
            system="Process Piping",
            category="CAT_C",
            location_tag="WFI Loop Sampling Station SS-02",
            description="Direction of flow marker arrow label missing on return pipe insulation jacket.",
            raised_by_date="2026-09-27",
            owner="Insulation Subcontractor",
            due_date="2026-10-05",
            prerequisite_impact="Minor Punch / As-built handover",
            closure_evidence=None,
            verified_by_date=None,
            status="OPEN",
            days_open=1,
        ),
    ]


def get_default_turnover_dossiers() -> List[ScheduleMTurnoverDossier]:
    return [
        ScheduleMTurnoverDossier(
            dossier_id="TOP-HVA-01",
            system_package="HVAC Cleanroom AHU-01 to 06",
            record_category="As-Built Drawings & TAB Reports",
            required_document="Approved As-Built Ducting Layouts, TAB Air Balancing Balance Sheet, Filter Integrity Test Certificates",
            reference_revision="TOP-HVA-DWG-REV-D",
            responsible_party="Turnkey HVAC Contractor",
            submitted_date="2026-09-20",
            reviewed_by_date="2026-09-25",
            status="APPROVED",
            gap_action="None - all 120 HEPA test certificates attached and verified",
            closure_evidence="Signed Handover Certificate TOP-HVA-CERT-01",
        ),
        ScheduleMTurnoverDossier(
            dossier_id="TOP-WFI-02",
            system_package="High Purity Water & Pure Steam System",
            record_category="Metallurgy & Weld Turnover Dossier",
            required_document="Mill Test Certificates (3.1), Orbital Weld Logs, 100% Borescope Inspection Video USB, Passivation Chemical Test Records",
            reference_revision="TOP-WFI-MTR-01",
            responsible_party="Piping EPC Specialist",
            submitted_date="2026-09-24",
            reviewed_by_date="2026-09-27",
            status="SUBMITTED",
            gap_action="Pending 4 borescope video attachments for branch tee UP-08 to UP-12",
            closure_evidence=None,
        ),
        ScheduleMTurnoverDossier(
            dossier_id="TOP-BMS-03",
            system_package="Building Management System (BMS/EMS)",
            record_category="Computerized System Validation (CSV)",
            required_document="Functional Design Spec (FDS), Traceability Matrix (RTM), 21 CFR Part 11 Assessment, IQ/OQ Protocols & Reports",
            reference_revision="TOP-BMS-CSV-02",
            responsible_party="BMS Automation System Integrator",
            submitted_date="2026-09-26",
            reviewed_by_date="2026-09-28",
            status="SUBMITTED",
            gap_action="Audit trail review signature from Client QA Unit pending",
            closure_evidence=None,
        ),
    ]


def get_default_inspection_reports() -> List[ScheduleMInspectionReport]:
    return [
        ScheduleMInspectionReport(
            report_no="IR-2026-001",
            project_client_epc="SunPharma BioTech Ltd. / Ideal Pharma EPC",
            discipline_system_location="HVAC Cleanroom Area A (Grade B Fill Suite Room 104)",
            ir_no_itp_point="ITP-HVA-05 (HEPA Integrity Leak Testing)",
            inspection_datetime="2026-09-27 10:30",
            inspector_attendees="Er. S. Mehta (IQE Lead Inspector), R. Gupta (EPC QC Manager), P. Nair (SunPharma QA)",
            drawing_spec_rev="DWG-HVA-101 Rev C & URS-HVAC-01",
            method_procedure="PAO Aerosol Filter Integrity Test per ISO 14644-3 Clause B.7",
            instrument_ids_validity="Aerosol Photometer ATI-2I-98442 (Cal Valid to June 2027)",
            scope_inspected="12 Nos Terminal Gel-Seal HEPA Filters (Filters H-01 to H-12 Grade A/B filling zone)",
            acceptance_criteria="Penetration leak < 0.01% with 25 µg/L Emery 3004 upstream aerosol challenge",
            actual_results="All 12 filters scanned across frame, gel seal, and face media. Filters H-01 to H-06 & H-08 to H-12 passed (< 0.002% max). Filter H-07 showed 0.012% edge pinhole leak; logged in Punch List PL-HVA-01.",
            photo_evidence_refs="Photo-Log IR-HVA-01 (18 geotagged photos)",
            ncr_obs_rfi_refs="Punch List Item PL-HVA-01 raised for Filter H-07",
            limitations_not_inspected="Aseptic filling line machine isolator enclosure not yet seated; only room ceiling filters tested.",
            disposition_next_action="CONDITIONAL PASS - Room cleared for rough air balancing; re-scan Filter H-07 after contractor torquing.",
            inspector_sign="S. Mehta (Lead Inspector, IQE)",
            technical_reviewer_sign="Dr. A. V. Kumar (Director QA, IQE)",
            client_ack="Accepted by P. Nair (Quality Assurance, SunPharma)",
            overall_result="CONFORMING",
            highest_nc_severity="MINOR",
            report_status="APPROVED",
        ),
    ]


async def seed_schedule_m_pharma_epc_project() -> ScheduleMPharmaEPCProject:
    """Seed or update the active Schedule M Pharma EPC project with comprehensive data from Rev 1 Excel and Expert Docx."""
    existing = await ScheduleMPharmaEPCProject.find_one(
        ScheduleMPharmaEPCProject.project_id == "PRJ-SCH-M-2026-01"
    )
    if existing:
        await existing.delete()

    checklists = get_default_checklists()
    reqs = get_default_requirements()
    red_flags = get_default_red_flags()
    gaps = get_default_expert_gaps()
    benchmarks = get_default_technical_benchmarks()
    urs = get_default_urs_traceability()
    rfis = get_default_rfis()
    measurements = get_default_quantity_measurements()
    boqs = get_default_boq_reconciliations()
    bills = get_default_ra_bill_reviews()
    ncrs = get_default_ncrs()
    calibrations = get_default_calibrations()
    punch_lists = get_default_punch_lists()
    turnovers = get_default_turnover_dossiers()
    reports = get_default_inspection_reports()

    total_checklists = len(checklists)
    passed_checklists = sum(1 for c in checklists if c.status == "PASS")
    score = round((passed_checklists / total_checklists * 100), 1) if total_checklists > 0 else 94.5

    project = ScheduleMPharmaEPCProject(
        project_id="PRJ-SCH-M-2026-01",
        project_name="Schedule M Revised Formulation & Sterile Facility EPC",
        client_name="SunPharma BioTech Ltd.",
        epc_contractor="Ideal Pharma EPC Solutions Pvt. Ltd.",
        facility_location="Baddi Pharma Hub, Himachal Pradesh",
        facility_type="Formulation & Sterile Injectables Facility",
        licence_authority="CDSCO / State FDA (Revised Schedule M 2024)",
        schedule_m_verified_by_date="Dr. A. V. Kumar (Director QA) / 28-Sep-2026",
        requirements_register_ref="REQ-SCH-M-2026-01",
        urs_design_basis_rev="BOD-REV-02 / URS-QA-2026-01 Rev C",
        quality_plan_itp_rev="ITP-PH-EPC-001 Rev 1.0",
        hold_point_notice_rules="Minimum 1 working day advance written notice for witness / hold point",
        report_numbering_repo="IR-2026-XXX (Controlled IQE Cloud Repository)",
        retention_rule="5% retention until final completion certificate and TOP acceptance",
        iqe_project_lead="Er. S. Mehta (Lead QA/QC Inspector)",
        client_qa_contact="P. Nair (Head QA, SunPharma)",
        design_authority="PharmEng Solutions Consulting",
        client_commercial_approver="R. K. Verma (VP Finance & Contracts)",
        boq_measurement_rules="IS 1200 / Standard Method of Measurement for Pharma Cleanrooms",
        bill_review_turnaround="5 to 7 working days from formal submission",
        escalation_route="Lead Inspector -> IQE Technical Director -> Client Steering Committee",
        cut_off_date="2026-09-28",
        minimum_ir_notice_days=1,
        measurement_rounding_places=2,
        nc_response_critical_days=1,
        nc_response_major_days=5,
        nc_response_minor_days=30,
        overclaim_review_threshold_percent=10.0,
        calibration_alert_window_days=30,
        revision_no="REV-1.0 (28-Sep-2026)",
        schedule_m_compliance_score=score,
        checklists=checklists,
        requirements_registers=reqs,
        rfi_registers=rfis,
        urs_traceabilities=urs,
        expert_gaps=gaps,
        technical_benchmarks=benchmarks,
        bill_red_flags=red_flags,
        quantity_measurements=measurements,
        boq_reconciliations=boqs,
        ra_bill_reviews=bills,
        ncr_capas=ncrs,
        change_registers=[],
        calibrations=calibrations,
        punch_lists=punch_lists,
        turnover_dossiers=turnovers,
        inspection_reports=reports,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    await project.insert()
    return project
