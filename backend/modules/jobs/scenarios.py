from typing import List, Dict, Any

PREDEFINED_SOW_TEMPLATES: List[Dict[str, Any]] = [
    {
        "code": "NDT-ASNT",
        "topic": "NDT & Flaw Detection",
        "method_name": "Non-Destructive Examination (UT / RT / MPI / DPT)",
        "applicable_codes": ["ASNT SNT-TC-1A", "ASME Sec V", "ISO 9712"],
        "stage_hold_point": "Witness & Review",
        "description": "Standardized non-destructive testing witness, film density evaluation, ultrasonic calibration, and surface crack detection.",
        "checklist_items": [
            {
                "item_id": "SOW-NDT-01",
                "description": "Verify NDT Operator Certifications (ASNT/ISNT Level II/III) & Equipment Calibration Certificates",
                "category": "Documentation & Personnel Audit",
                "is_checklist": True,
                "completed": False,
                "notes": "Verify validity of calibration blocks (V1/V2) and probe frequency certificates."
            },
            {
                "item_id": "SOW-NDT-02",
                "description": "Surface Preparation Audit — Sa 2.5 blast cleaning & degreasing prior to dye penetrant / magnetic particle application",
                "category": "Surface Preparation Audit",
                "is_checklist": True,
                "completed": False,
                "notes": "Ensure surface roughness Ra <= 6.3 µm for UT probe coupling."
            },
            {
                "item_id": "SOW-NDT-03",
                "description": "Radiographic Film Review — Optical density check (2.0 to 4.0 H&D) & IQI Wire Sensitivity Verification",
                "category": "Radiography (RT) Audit",
                "is_checklist": True,
                "completed": False,
                "notes": "Check for film artifacts, backscatter radiation 'B' image, and contrast resolution."
            },
            {
                "item_id": "SOW-NDT-04",
                "description": "Ultrasonic Flaw Sizing & DAC Curve Verification for Weld Seams",
                "category": "Ultrasonic (UT) Audit",
                "is_checklist": True,
                "completed": False,
                "notes": "Record indication amplitude relative to 100% Distance Amplitude Curve (DAC)."
            }
        ]
    },
    {
        "code": "PV-ASME",
        "topic": "Pressure Vessels & Piping",
        "method_name": "ASME Pressure Vessel & Heavy Piping Audit",
        "applicable_codes": ["ASME Sec VIII Div 1", "API 510", "ASME B31.3"],
        "stage_hold_point": "Stage Inspection & Hydrotest Witness",
        "description": "Full stage quality assurance for pressure vessels, heat exchangers, and high-pressure process piping.",
        "checklist_items": [
            {
                "item_id": "SOW-PV-01",
                "description": "Raw Material Mill Test Report (MTR) & Heat Traceability Transfer Audit for Shell & Dish Ends",
                "category": "Material & Heat Traceability",
                "is_checklist": True,
                "completed": False,
                "notes": "Verify chemical composition & mechanical tensile/impact properties against SA-516 Gr 70."
            },
            {
                "item_id": "SOW-PV-02",
                "description": "Shell Plate Rolling & Longitudinal Seam Root Gap / Bevel Angle Fit-up Check",
                "category": "Dimensional & Fit-up Audit",
                "is_checklist": True,
                "completed": False,
                "notes": "Root gap tolerance +/- 1.0mm, bevel angle 37.5° +/- 2.5°."
            },
            {
                "item_id": "SOW-PV-03",
                "description": "Post Weld Heat Treatment (PWHT) Chart Review — Heating rate, hold temperature & soak time audit",
                "category": "Heat Treatment Audit",
                "is_checklist": True,
                "completed": False,
                "notes": "Soak temperature 620°C +/- 15°C for 2.5 hours per ASME Sec VIII Div 1 UCS-56."
            },
            {
                "item_id": "SOW-PV-04",
                "description": "Hydrostatic Pressure Test Witnessing at 1.3x - 1.5x Design Pressure with Calibrated Gauges",
                "category": "Pressure Test Witness",
                "is_checklist": True,
                "completed": False,
                "notes": "Hold pressure for minimum 60 minutes; verify zero pressure drop & zero flange leakage."
            }
        ]
    },
    {
        "code": "STR-AWS",
        "topic": "Structural Steel & Fabrication",
        "method_name": "Structural Steelwork & Heavy Weld Quality Audit",
        "applicable_codes": ["AWS D1.1", "EN 1090-2 (EXC3)", "ISO 3834"],
        "stage_hold_point": "Fit-up & Surface Coating Witness",
        "description": "Structural steel fabrication inspection, bolt torque verification, weld visual standards, and protective coating DFT.",
        "checklist_items": [
            {
                "item_id": "SOW-STR-01",
                "description": "Structural Steel Section & Gusset Plate Dimension & Squareness Audit",
                "category": "Dimensional Audit",
                "is_checklist": True,
                "completed": False,
                "notes": "Check camber, sweep, and column length tolerances per AWS D1.1 Clause 5.23."
            },
            {
                "item_id": "SOW-STR-02",
                "description": "High-Strength Friction Grip (HSFG) Bolt Hole Clearance & Center-to-Center Pitch Audit",
                "category": "Bolting & Assembly Audit",
                "is_checklist": True,
                "completed": False,
                "notes": "Torque tension check using calibrated torque wrench per AISC specification."
            },
            {
                "item_id": "SOW-STR-03",
                "description": "Weld Visual Inspection — Undercut depth, throat thickness, porosity & undercut check",
                "category": "Welding Visual Audit",
                "is_checklist": True,
                "completed": False,
                "notes": "Max allowable undercut 0.8mm for statically loaded structures."
            },
            {
                "item_id": "SOW-STR-04",
                "description": "Blasting Surface Profile (Grit Sa 2.5) & Primer Coat Dry Film Thickness (DFT) Gauge Measurement",
                "category": "Surface & Coating Audit",
                "is_checklist": True,
                "completed": False,
                "notes": "Measure DFT at 5 spot locations per 10m² using magnetic thickness gauge."
            }
        ]
    },
    {
        "code": "ELE-IEC",
        "topic": "Electrical & Control Panels",
        "method_name": "Electrical Equipment, Switchgear & ATEX Panel Audit",
        "applicable_codes": ["IEC 61439", "ATEX Ex-d", "IEEE 43"],
        "stage_hold_point": "FAT & Insulation Test Witness",
        "description": "Factory Acceptance Testing (FAT) for low/medium voltage switchgear panels, ATEX explosion-proof enclosures, and Megger insulation testing.",
        "checklist_items": [
            {
                "item_id": "SOW-ELE-01",
                "description": "Enclosure Ingress Protection (IP65 / IP66) & Flameproof Gland Thread Engagement Verification",
                "category": "Enclosure & Mechanical Audit",
                "is_checklist": True,
                "completed": False,
                "notes": "Check gasket integrity and ATEX flameproof joint gap clearance."
            },
            {
                "item_id": "SOW-ELE-02",
                "description": "Busbar Clearance, Creepage Distance & Torque Mark Audit on Power Terminals",
                "category": "Busbar & Wiring Audit",
                "is_checklist": True,
                "completed": False,
                "notes": "Phase-to-phase and phase-to-earth clearance >= 14mm."
            },
            {
                "item_id": "SOW-ELE-03",
                "description": "High Voltage Dielectric Withstand (Hi-Pot Test) & Insulation Resistance Megger Audit (1000V DC)",
                "category": "Electrical Insulation Audit",
                "is_checklist": True,
                "completed": False,
                "notes": "Insulation resistance > 100 MΩ prior to and after Hi-Pot test."
            },
            {
                "item_id": "SOW-ELE-04",
                "description": "Functional Protection Relay Injection & Interlock Trip Sequence Verification",
                "category": "Functional Control Audit",
                "is_checklist": True,
                "completed": False,
                "notes": "Inject primary/secondary current to verify trip timing of circuit breaker."
            }
        ]
    },
    {
        "code": "VAL-API",
        "topic": "Valves & Flow Control",
        "method_name": "Industrial Valves Pressure & Fire-Safe Seat Leakage Audit",
        "applicable_codes": ["API 600", "API 598", "ISO 10497"],
        "stage_hold_point": "Hydrostatic Shell & Seat Witness",
        "description": "Gate, Globe, Check, and Ball valve pressure testing, low-pressure air seat test, and fire-safe seal verification.",
        "checklist_items": [
            {
                "item_id": "SOW-VAL-01",
                "description": "Valve Casting & Forging Visual Quality — Radiography / Dye Penetrant Audit on Critical Wall Thickness",
                "category": "Casting Integrity Audit",
                "is_checklist": True,
                "completed": False,
                "notes": "Check wall thickness using ultrasonic thickness gauge per API 600 Table 3."
            },
            {
                "item_id": "SOW-VAL-02",
                "description": "High Pressure Hydrostatic Shell Test at 1.5x CWP (Cold Working Pressure)",
                "category": "Shell Pressure Test",
                "is_checklist": True,
                "completed": False,
                "notes": "Zero visible leakage through body wall or bonnet joint."
            },
            {
                "item_id": "SOW-VAL-03",
                "description": "High Pressure Hydrostatic & Low Pressure Air (80 psi) Seat Leakage Test Witnessing",
                "category": "Seat Leakage Test",
                "is_checklist": True,
                "completed": False,
                "notes": "Allowable seat leakage rate per API 598 Table 6 (Metal-to-Metal vs Soft Seat)."
            }
        ]
    }
]
