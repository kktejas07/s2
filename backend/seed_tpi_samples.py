"""
Seed script to populate one realistic filled sample for each TPI form (TP-02, TP-03, TP-04, TP-05).
Run via: PYTHONPATH=backend python backend/seed_tpi_samples.py
"""
import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from core.config import settings
from modules.tpi.models import TpiReport, TpiPhoto, TpiSignature


async def seed_samples():
    client = AsyncIOMotorClient(settings.mongodb_url)
    await init_beanie(
        database=client[settings.mongodb_db_name],
        document_models=[TpiReport],
    )

    print("Checking existing TPI sample reports...")

    # 1. TP-02 Sample
    existing_tp02 = await TpiReport.find_one({"report_no": "IQE-TP02-2026-0001"})
    if not existing_tp02:
        tp02_data = {
            "report_no": "IQE-TP02-2026-0001",
            "date": "2026-09-29",
            "customer": "Granules India Limited",
            "project": "Bulk Drug Expansion Project Phase-II",
            "supplier": "L&T Valves Limited",
            "sub_supplier": "Flowtech Castings Pvt Ltd",
            "po_no_and_date": "PO-GIL-2026-9812 Dt. 2026-08-15",
            "location": "Coimbatore Works, Tamil Nadu",
            "rfi_ref_and_date": "RFI-LTV-042 Dt. 2026-09-27",
            "next_visit": "2026-10-10",
            "inspector": "R. Sundararajan (IQE-INSP-044)",
            "inspection_stage": "Stage",
            "activities": {
                "meeting_review": ["Pre-Inspection Meeting", "Review Certificates / Documents"],
                "inspection_testing": ["Dimension & Workmanship", "Pressure Tests", "NDT"],
                "surface_preservation": ["Coating & Painting"],
                "other": "PMI Verification on body castings",
            },
            "items": [
                {
                    "item": 1,
                    "description": "Gate Valve 6 inch Class 150 WCB Body Flanged RF",
                    "tag_no": "GV-101-A/B/C",
                    "po_qty": 15,
                    "offered_qty": 15,
                    "inspected_qty": 15,
                    "accepted_qty": 15,
                    "remarks": "Hydro shell test witnessed @ 30 bar. Satisfactory.",
                },
                {
                    "item": 2,
                    "description": "Globe Valve 4 inch Class 300 CF8M Body Flanged RF",
                    "tag_no": "GLV-201 to 205",
                    "po_qty": 5,
                    "offered_qty": 5,
                    "inspected_qty": 5,
                    "accepted_qty": 5,
                    "remarks": "Seat leakage test witnessed per API 598. Zero leakage.",
                },
            ],
            "outcome": "SATISFACTORY",
            "order_status": "Partially Completed",
            "findings": [
                {
                    "sl_no": 1,
                    "finding": "MTC heat numbers verified against body stamping: Heat #H7821 matched EN 10204 3.1 cert.",
                    "reference": "QAP Cl 4.2",
                    "action": "Complete final assembly and proceed to paint clearance.",
                }
            ],
            "immediate_action": {
                "action": "Supplier to provide calibration certificate of master pressure gauge PG-04.",
                "target_date": "2026-10-02",
                "follow_up": "IQE inspector to review during next visit.",
            },
            "remarks": "All pressure test parameters conformed to API 598. Body hydrostatic test held for 120 seconds without pressure drop.",
            "photos": [
                {"slot": 1, "url": "", "caption": "Hydrostatic pressure testing of 6 inch Gate Valve at 30 bar test rig."},
                {"slot": 2, "url": "", "caption": "Identification stamping & heat number verification on valve flange."},
            ],
            "signatures": {
                "supplier_name": "M. Karthikeyan",
                "supplier_designation": "QA/QC Manager",
                "supplier_date": "2026-09-29",
                "iqe_inspector": "R. Sundararajan",
                "iqe_date": "2026-09-29",
            },
        }

        tp02 = TpiReport(
            form_code="TP02",
            report_no="IQE-TP02-2026-0001",
            revision="00",
            status="SUBMITTED",
            customer="Granules India Limited",
            supplier="L&T Valves Limited",
            po_no="PO-GIL-2026-9812",
            data=tp02_data,
        )
        await tp02.insert()
        print("  Created sample TP-02: IQE-TP02-2026-0001")

    # 2. TP-03 Sample
    existing_tp03 = await TpiReport.find_one({"report_no": "IQE-TP03-2026-0001"})
    if not existing_tp03:
        tp03_data = {
            "report_no": "IQE-TP03-2026-0001",
            "inspection_date": "2026-09-29",
            "rfi_no_and_date": "RFI-LTV-042 Dt. 2026-09-27",
            "inspection_stage": "Final",
            "report_date": "2026-09-29",
            "location": "Coimbatore Works, Tamil Nadu",
            "customer": "Granules India Limited",
            "project": "Bulk Drug Expansion Project Phase-II",
            "supplier": "L&T Valves Limited",
            "sub_supplier": "Flowtech Castings Pvt Ltd",
            "po_no_and_date": "PO-GIL-2026-9812 Dt. 2026-08-15",
            "inspector": "R. Sundararajan (IQE-INSP-044)",
            "qap_no": "QAP-LTV-GIL-001 Rev 02",
            "spec_no": "TS-VALVE-004 Rev 01",
            "items": [
                {
                    "sl_no": 1,
                    "description": "Gate Valve 6 inch Class 150 WCB Body Flanged RF",
                    "tag_no": "GV-101-A/B/C",
                    "po_qty": 15,
                    "offered_qty": 15,
                    "inspected_qty": 15,
                    "accepted_qty": 15,
                    "rejected_qty": 0,
                    "remarks": "Visual, dimensional, hydro shell & seat test accepted.",
                }
            ],
            "documents_reviewed": [
                {"sl_no": 1, "doc_name": "Purchase Order", "doc_no": "PO-GIL-2026-9812", "rev": "00", "status": "Available", "approval_status": "Approved", "remarks": "Scope verified"},
                {"sl_no": 2, "doc_name": "Approved Drawing", "doc_no": "DWG-GV-6-150-01", "rev": "03", "status": "Available", "approval_status": "Approved", "remarks": "Face-to-face 267 mm verified"},
                {"sl_no": 3, "doc_name": "QAP / ITP", "doc_no": "QAP-LTV-GIL-001", "rev": "02", "status": "Available", "approval_status": "Approved", "remarks": "TPI witness points completed"},
                {"sl_no": 4, "doc_name": "Specification / Datasheet", "doc_no": "TS-VALVE-004", "rev": "01", "status": "Available", "approval_status": "Approved", "remarks": "Materials verified"},
                {"sl_no": 5, "doc_name": "MTC / Test Certificate", "doc_no": "MTC-FT-9912", "rev": "00", "status": "Available", "approval_status": "Approved", "remarks": "EN 10204 Type 3.1"},
                {"sl_no": 6, "doc_name": "Procedure / Method Statement", "doc_no": "PR-HYD-002", "rev": "01", "status": "Available", "approval_status": "Approved", "remarks": "API 598 procedure"},
                {"sl_no": 7, "doc_name": "Other", "doc_no": "CAL-PG-04", "rev": "00", "status": "Available", "approval_status": "Approved", "remarks": "Gauge calibration valid up to 2026-12-15"},
            ],
            "scope_activities": [
                {
                    "sl_no": 1,
                    "activity": "Visual & Dimensional Inspection",
                    "reference": "ASME B16.10 / B16.5",
                    "tpi_scope": "Witness & 100% check",
                    "result_status": "Satisfactory",
                    "remarks": "F-to-F dimension 267mm (tol +/- 2mm), flange thickness 25.4mm verified.",
                },
                {
                    "sl_no": 2,
                    "activity": "Hydrostatic Shell & Seat Leakage Test",
                    "reference": "API 598 / QAP Cl 6.1",
                    "tpi_scope": "100% Witness",
                    "result_status": "Satisfactory",
                    "remarks": "Hydro shell @ 30 bar for 120s, seat test @ 22 bar for 60s. Zero leakage.",
                }
            ],
            "findings": [
                {
                    "sl_no": 1,
                    "finding": "All 15 valves showed clean casting surface free from cracks, porosity or cold shuts.",
                    "reference": "MSS-SP-55",
                    "evidence": "Visual inspection log VIL-09",
                    "status": "Accepted",
                }
            ],
            "punch_list": [],
            "instruments": [
                {
                    "instrument": "Master Pressure Gauge",
                    "make": "WIKA",
                    "model": "232.50",
                    "serial_no": "WIKA-PG-04",
                    "range": "0 - 60 bar",
                    "accuracy": "0.5% FSD",
                    "cal_cert_no": "NABL-CAL-9821",
                    "cal_due": "2026-12-15",
                }
            ],
            "status": "ACCEPTED",
            "conclusion": "The 15 numbers of 6 inch Class 150 Gate Valves offered for inspection meet the requirements of PO-GIL-2026-9812, API 600, ASME B16.34 and approved QAP. Recommended for dispatch clearance under IRN.",
            "attachments": [
                {"sl_no": 1, "description": "Manufacturer Hydro Test Certificate", "ref_pages": "HTC-2026-881 (2 pages)", "remarks": "Countersigned by IQE"},
                {"sl_no": 2, "description": "Dimensional Inspection Report", "ref_pages": "DIR-015 (1 page)", "remarks": "Signed"},
            ],
            "photos": [
                {"slot": 1, "url": "", "caption": "Overall view of offered Gate Valves on inspection bay."},
                {"slot": 2, "url": "", "caption": "Hydrostatic test setup with calibrated master gauge."},
            ],
            "signatures": {
                "supplier_name": "M. Karthikeyan",
                "supplier_designation": "QA/QC Manager",
                "supplier_date": "2026-09-29",
                "iqe_inspector": "R. Sundararajan",
                "iqe_date": "2026-09-29",
            },
        }

        tp03 = TpiReport(
            form_code="TP03",
            report_no="IQE-TP03-2026-0001",
            revision="00",
            status="SUBMITTED",
            customer="Granules India Limited",
            supplier="L&T Valves Limited",
            po_no="PO-GIL-2026-9812",
            data=tp03_data,
        )
        await tp03.insert()
        print("  Created sample TP-03: IQE-TP03-2026-0001")

    # 3. TP-04 Sample (IRN)
    existing_tp04 = await TpiReport.find_one({"report_no": "IQE-TP04-2026-0001"})
    if not existing_tp04:
        tp04_data = {
            "irn_no": "IQE-TP04-2026-0001",
            "report_no": "IQE-TP04-2026-0001",
            "date": "2026-09-29",
            "contract_ref": "CNT-GIL-EXP-2026",
            "po_no_and_date": "PO-GIL-2026-9812 Dt. 2026-08-15",
            "customer": "Granules India Limited",
            "supplier": "L&T Valves Limited",
            "project": "Bulk Drug Expansion Project Phase-II",
            "location": "Coimbatore Works, Tamil Nadu",
            "rfi_no_and_date": "RFI-LTV-042 Dt. 2026-09-27",
            "inspector": "R. Sundararajan (IQE-INSP-044)",
            "po_status": "Partially Completed",
            "release_type": "Partial",
            "release_decision": "RELEASED FOR DISPATCH",
            "total_qty_released": "15 Nos. (Fifteen Numbers only)",
            "report_refs": [
                {
                    "sl_no": 1,
                    "report_no": "IQE-TP03-2026-0001",
                    "date": "2026-09-29",
                    "stage": "Final Inspection",
                    "remarks": "Accepted per API 598",
                }
            ],
            "deviation_refs": [
                {
                    "sl_no": 1,
                    "concession_no": "NIL",
                    "date": "2026-09-29",
                    "status": "NIL",
                    "remarks": "No deviations reported. Fully compliant.",
                }
            ],
            "release_items": [
                {
                    "item_no": 1,
                    "description": "Gate Valve 6 inch Class 150 WCB Body Flanged RF",
                    "drawing_no": "DWG-GV-6-150-01 Rev 03",
                    "tag_no": "GV-101-A/B/C",
                    "po_qty": 15,
                    "prev_released": 0,
                    "inspected_qty": 15,
                    "accepted_qty": 15,
                    "current_released": 15,
                    "balance_qty": 0,
                    "remarks": "Full quantity of Item 1 released.",
                }
            ],
            "basis_of_release": {
                "po_requirements": True,
                "approved_qap": True,
                "approved_drawings": True,
                "inspection_reports": True,
                "compliance_deviation": True,
                "client_clearance": False,
                "other": "NIL",
            },
            "traceability": {
                "tag_plate": "Yes",
                "tag_details": "SS316 riveted tag plate",
                "serial_no": "Yes",
                "serial_details": "Sl Nos: GV-001 to GV-015 hard punched",
                "hard_stamping": "Yes",
                "hard_stamp_details": "IQE Inspection Hard Stamp circled on flange rim",
                "paint_marking": "Yes",
                "paint_details": "Heat # and PO # stencil marked in white paint",
            },
            "dispatch_instructions": {
                "packing": True,
                "machined_surfaces": True,
                "nameplate": True,
                "nozzle_covers": True,
                "nitrogen_purging": False,
                "as_built_drawings": True,
                "om_manuals": True,
                "dispatch_immediately": True,
                "dispatch_after_clearance": False,
            },
            "remarks": "Release is issued based on successful witness of final hydrostatic, pneumatic seat and dimensional checks per IQE-TP03-2026-0001.",
            "signatures": {
                "supplier_name": "M. Karthikeyan",
                "supplier_designation": "QA/QC Manager",
                "supplier_date": "2026-09-29",
                "iqe_inspector": "R. Sundararajan",
                "iqe_date": "2026-09-29",
            },
        }

        tp04 = TpiReport(
            form_code="TP04",
            report_no="IQE-TP04-2026-0001",
            revision="00",
            status="SUBMITTED",
            customer="Granules India Limited",
            supplier="L&T Valves Limited",
            po_no="PO-GIL-2026-9812",
            data=tp04_data,
        )
        await tp04.insert()
        print("  Created sample TP-04: IQE-TP04-2026-0001")

    # 4. TP-05 Sample (Expediting Report)
    existing_tp05 = await TpiReport.find_one({"report_no": "IQE-TP05-2026-0001"})
    if not existing_tp05:
        tp05_data = {
            "report_no": "IQE-TP05-2026-0001",
            "date": "2026-09-29",
            "visit_ref_and_date": "EXP-LTV-01 Dt. 2026-09-28",
            "prev_visit_date": "2026-09-10",
            "next_visit_date": "2026-10-15",
            "location": "Coimbatore Works, Tamil Nadu",
            "customer": "Granules India Limited",
            "supplier": "L&T Valves Limited",
            "project": "Bulk Drug Expansion Project Phase-II",
            "sub_supplier": "Flowtech Castings Pvt Ltd",
            "po_no_and_date": "PO-GIL-2026-9812 Dt. 2026-08-15",
            "expeditor": "V. Senthil Kumar (IQE-EXP-018)",
            "items": [
                {
                    "item_no": 1,
                    "description": "Gate Valve 6 inch Class 150 WCB Body Flanged RF",
                    "po_qty": 15,
                    "tag_no": "GV-101-A/B/C",
                    "promised_delivery": "2026-10-05",
                    "current_expected_delivery": "2026-10-02",
                    "qty_available": 15,
                    "status": "Completed",
                    "remarks": "Inspection completed, dispatch packing in progress.",
                },
                {
                    "item_no": 2,
                    "description": "Globe Valve 4 inch Class 300 CF8M Body Flanged RF",
                    "po_qty": 5,
                    "tag_no": "GLV-201 to 205",
                    "promised_delivery": "2026-10-20",
                    "current_expected_delivery": "2026-10-18",
                    "qty_available": 5,
                    "status": "On Schedule",
                    "remarks": "Assembly 100% complete, hydro test scheduled 2026-10-05.",
                },
            ],
            "progress_status": {
                "order_status": "Partially Completed",
                "engineering": {"status": "Complete", "pct": 100, "remarks": "Drawings approved"},
                "procurement": {"status": "Complete", "pct": 100, "remarks": "All forgings and castings received"},
                "manufacturing": {"status": "In Progress", "pct": 85, "remarks": "Item 1 finished, Item 2 assembly complete"},
                "inspection": {"status": "In Progress", "pct": 75, "remarks": "Item 1 cleared, Item 2 hydro pending"},
                "documentation": {"status": "In Progress", "pct": 70, "remarks": "Dossier under compilation"},
                "overall": {"status": "On Schedule", "pct": 82, "remarks": "Expected dispatch 5 days ahead of schedule"},
            },
            "overall_completion_pct": 82,
            "summary": "Overall progress is satisfactory and slightly ahead of contractual schedule. Body castings for all items have passed NDT and machining. Item 1 (15 nos Gate Valves) has successfully passed final TPI inspection and is undergoing painting/packing. Item 2 is in final testing.",
            "personnel": [
                {"sl_no": 1, "name": "K. Rajesh", "designation": "VP - Manufacturing", "company": "L&T Valves Ltd", "role": "Plant Operations"},
                {"sl_no": 2, "name": "M. Karthikeyan", "designation": "QA/QC Manager", "company": "L&T Valves Ltd", "role": "Quality Assurance"},
                {"sl_no": 3, "name": "V. Senthil Kumar", "designation": "Lead Expeditor", "company": "IQE Pvt Ltd", "role": "Expediting & Progress Verification"},
            ],
            "documentation": [
                {"sl_no": 1, "doc_name": "Quality Dossier Index", "doc_no": "QDI-LTV-01", "rev": "01", "status": "Under Compilation", "approval_status": "Approved", "remarks": "Final dossier 70% complete"},
            ],
            "sub_orders": [
                {
                    "sl_no": 1,
                    "component": "Body & Bonnet Castings (WCB)",
                    "supplier": "Flowtech Castings Pvt Ltd",
                    "order_ref": "SO-LTV-4412",
                    "qty_ordered": "15 Sets",
                    "qty_received": "15 Sets",
                    "balance": "0",
                    "status": "100% in stock and machined",
                }
            ],
            "manufacturing_status": [
                {
                    "sl_no": 1,
                    "activity": "CNC Body Machining",
                    "planned_finish": "2026-09-15",
                    "actual_finish": "2026-09-14",
                    "pct_complete": 100,
                    "status": "Completed",
                    "remarks": "Zero rejections recorded",
                },
                {
                    "sl_no": 2,
                    "activity": "Final Valve Assembly",
                    "planned_finish": "2026-09-25",
                    "actual_finish": "2026-09-24",
                    "pct_complete": 100,
                    "status": "Completed",
                    "remarks": "Assembled with Graphoil gland packing",
                }
            ],
            "inspection_status": [
                {
                    "sl_no": 1,
                    "activity": "Hydrostatic Testing (Item 1)",
                    "planned_date": "2026-09-28",
                    "actual_date": "2026-09-29",
                    "status": "Completed",
                    "rfi_ref": "RFI-LTV-042",
                    "remarks": "Passed per API 598",
                }
            ],
            "schedule_assessment": {
                "delivery_against_po": "On Schedule",
                "critical_path": "None",
                "recovery_plan_required": "No",
                "supplier_commitment": "Supplier confirmed dispatch of Item 1 on 2026-10-02 and Item 2 by 2026-10-18.",
                "iqe_assessment": "Satisfactory",
            },
            "actions": [
                {
                    "sl_no": 1,
                    "action": "Complete export seaworthy packing for Item 1 and send packing list to Granules India logistics.",
                    "responsibility": "M. Karthikeyan (Supplier QA)",
                    "target_date": "2026-10-02",
                    "status": "Open",
                    "remarks": "Packing box inspection by IQE on 2026-10-02.",
                }
            ],
            "conclusion": "Fabrication, assembly and testing of the valves under PO-GIL-2026-9812 are proceeding on schedule. Critical materials are 100% in stock. Item 1 is ready for dispatch; Item 2 will be offered for hydro test on 2026-10-05.",
            "photos": [
                {"slot": 1, "url": "", "caption": "Assembly line for 4 inch Globe Valves."},
                {"slot": 2, "url": "", "caption": "Packed valves in treated wooden crates ready for dispatch."},
            ],
            "signatures": {
                "supplier_name": "M. Karthikeyan",
                "supplier_designation": "QA/QC Manager",
                "supplier_date": "2026-09-29",
                "iqe_expeditor": "V. Senthil Kumar",
                "iqe_date": "2026-09-29",
            },
        }

        tp05 = TpiReport(
            form_code="TP05",
            report_no="IQE-TP05-2026-0001",
            revision="00",
            status="SUBMITTED",
            customer="Granules India Limited",
            supplier="L&T Valves Limited",
            po_no="PO-GIL-2026-9812",
            data=tp05_data,
        )
        await tp05.insert()
        print("  Created sample TP-05: IQE-TP05-2026-0001")

    print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(seed_samples())
