"use client";

import { API_BASE } from "@/lib/config";
import { useState, useMemo, useEffect } from "react";
import { trackButtonClick } from "@/lib/analytics";
import { downloadPdfFile } from "@/lib/downloadPdf";
import { IQELoader } from "@/components/IQELoader";
import { PdfPreviewModal } from "@/components/PdfPreviewModal";
import {
  ShieldCheck,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Save,
  Eye,
  Users,
  Search,
  Check,
  ShieldAlert,
  Award,
  BookOpen,
  Scale,
  Lock,
  Unlock,
  LayoutGrid,
  Table as TableIcon,
  X,
  Paperclip,
  CheckSquare,
  Tag,
  Camera,
  Signature,
  Edit3,
  Plus,
  FileCode,
  CheckCircle,
  Loader2,
} from "@/components/icons";

export interface HybridQVRItem {
  id: number;
  slNo: number;
  boqItem: string;
  description: string;
  vendor: string;
  techSpec: string;
  unit: string;
  contractQty: number;
  receivedQty: number;
  prevCertifiedQty: number;
  currentClaimedQty: number;
  currentVerifiedQty: number;
  materialTagNo: string;
  drawingRef: string;
  receiptInvoiceRef: string;
  measurementDetails: string;
  photoEvidenceRef: string;
  verificationStatus: "Verified & Approved" | "Partially Verified / Pending Evidence" | "Discrepancy Flagged" | "Rejected / Non-Conforming";
  remarks: string;
  isLocked: boolean;
  attachments: string[];
}

export interface QVRMetadata {
  reportNo: string;
  revision: string;
  reportDate: string;
  verificationDate: string;
  verificationPeriod: string;
  client: string;
  project: string;
  epcContractor: string;
  packageContract: string;
  location: string;
  poWoNo: string;
  poWoDate: string;
  drawingRef: string;
  iqeInspector: string;
  discipline: string;
  purposeOfVerification: string;
  measurementBasis: string;
  raBillNo: string;
  previousReportNo: string;
}

const GRANULES_HYBRID_ITEMS: HybridQVRItem[] = [
  {
    id: 1,
    slNo: 1,
    boqItem: "BOQ-CIV-01.1",
    description: "Earthwork excavation in all types of soil for equipment foundation including shoring, strutting and dewatering",
    vendor: "JB Fabricator / Devi Sri Civil",
    techSpec: "IS 1200 Part 1 / GFC GIL/GAG/CIV-001 R2",
    unit: "Cum",
    contractQty: 450,
    receivedQty: 335,
    prevCertifiedQty: 200,
    currentClaimedQty: 180,
    currentVerifiedQty: 155,
    materialTagNo: "SOIL-SITE-BL-01",
    drawingRef: "GIL/GAG/CIV-001 R2",
    receiptInvoiceRef: "CH-2025-8812 / INV-9901",
    measurementDetails: "Joint physical pit depth survey with Total Station. Over-excavation depth of 25 Cum excluded.",
    photoEvidenceRef: "IMG_EXC_012_014.jpg",
    verificationStatus: "Discrepancy Flagged",
    remarks: "Deducted 25 Cum unapproved over-excavation. Backfill with M10 Lean concrete required.",
    isLocked: false,
    attachments: ["JMS-CIV-012.pdf", "Soil_Density_Test_04.pdf"],
  },
  {
    id: 2,
    slNo: 2,
    boqItem: "BOQ-CIV-02.4",
    description: "Supplying and laying PCC 1:4:8 under foundations including levelling, compacting and curing complete",
    vendor: "Devi sri(Civil)",
    techSpec: "M10 Grade / IS 456:2000 / Spec GIL-PCC-02",
    unit: "Cum",
    contractQty: 120,
    receivedQty: 95,
    prevCertifiedQty: 50,
    currentClaimedQty: 45,
    currentVerifiedQty: 45,
    materialTagNo: "PCC-M10-BATCH-08",
    drawingRef: "GIL/GAG/CIV-004 R1",
    receiptInvoiceRef: "RMC-DC-400192",
    measurementDetails: "100mm thickness physical grid measurement verified prior to footing rebar placement.",
    photoEvidenceRef: "IMG_PCC_015_018.jpg",
    verificationStatus: "Verified & Approved",
    remarks: "PCC thickness verified 100mm. Cube test 7-day strength achieved 12.5 MPa.",
    isLocked: true,
    attachments: ["PCC_Cube_Test_Rpt.pdf", "JMS-CIV-015.pdf"],
  },
  {
    id: 3,
    slNo: 3,
    boqItem: "BOQ-STR-04.2",
    description: "Fabrication & erection of structural steel framing members (ISMB 300 / ISMC 250) including shop primer 50um DFT",
    vendor: "Maruthi Engg",
    techSpec: "IS 2062 Gr B / Epoxy Primer 50 Microns",
    unit: "Kgs",
    contractQty: 25000,
    receivedQty: 20500,
    prevCertifiedQty: 12000,
    currentClaimedQty: 8500,
    currentVerifiedQty: 7800,
    materialTagNo: "HEAT-SAIL-2025-998A",
    drawingRef: "GIL/GAG/STR-102 R3",
    receiptInvoiceRef: "INV-ME-2025-104",
    measurementDetails: "Weighbridge slip count verified. DFT gauge audit recorded average 35 microns (below 50um spec).",
    photoEvidenceRef: "IMG_STEEL_DFT_35UM.jpg",
    verificationStatus: "Partially Verified / Pending Evidence",
    remarks: "Deducted 700 Kgs for unapproved WPS/PQR welding logs and under-thickness primer coat.",
    isLocked: false,
    attachments: ["Steel_Mill_TC_300.pdf", "WPS_PQR_Audit.pdf"],
  },
  {
    id: 4,
    slNo: 4,
    boqItem: "BOQ-PIP-08.1",
    description: "Supply and application of 50mm thick Rockwool thermal pipe insulation with 24G Aluminum cladding for chilled water",
    vendor: "Triveni Insulation",
    techSpec: "Density 100 kg/m3 / IS 8183 / 24G Alum",
    unit: "Mtrs",
    contractQty: 600,
    receivedQty: 400,
    prevCertifiedQty: 250,
    currentClaimedQty: 150,
    currentVerifiedQty: 150,
    materialTagNo: "RW-100K-LOT-881",
    drawingRef: "GIL/GAG/MEP-301 R0",
    receiptInvoiceRef: "INV-TRIV-882",
    measurementDetails: "Linear length measured along pipe centerline. Density test certificate verified.",
    photoEvidenceRef: "IMG_INSUL_301.jpg",
    verificationStatus: "Verified & Approved",
    remarks: "Thermal conductivity test passed. Approved for 100% certification.",
    isLocked: true,
    attachments: ["Rockwool_Test_Cert.pdf"],
  },
  {
    id: 5,
    slNo: 5,
    boqItem: "BOQ-ELE-12.1",
    description: "Supply & laying of 4C x 240 sq.mm XLPE armored aluminum power cable in pre-formed trenches including terminations",
    vendor: "Polycab Wires / Sterling Wilson",
    techSpec: "IS 7098 Part 2 / 1.1kV Grade / XLPE Insulated",
    unit: "Mtrs",
    contractQty: 1200,
    receivedQty: 950,
    prevCertifiedQty: 600,
    currentClaimedQty: 200,
    currentVerifiedQty: 200,
    materialTagNo: "CBL-4C240-LOT-992",
    drawingRef: "GIL/GAG/ELE-401 R1",
    receiptInvoiceRef: "INV-POLY-4412",
    measurementDetails: "Megger insulation resistance test & hi-pot test witnessed. Verified 200m laid and terminated.",
    photoEvidenceRef: "IMG_ELE_CBL_200M.jpg",
    verificationStatus: "Verified & Approved",
    remarks: "Insulation resistance >100 Mega-ohms verified. Terminal crimping inspected with calibrated torque wrench.",
    isLocked: true,
    attachments: ["Megger_Test_Report.pdf", "Cable_TC_Polycab.pdf"],
  },
  {
    id: 6,
    slNo: 6,
    boqItem: "BOQ-HVAC-03.2",
    description: "Supply and installation of GI ducting 20G with neoprene gasket joints for cleanroom AHU-02 distribution",
    vendor: "Airtech Systems Ltd",
    techSpec: "SMACNA Class 3 / 20G G90 Galvanized",
    unit: "Sqm",
    contractQty: 450,
    receivedQty: 320,
    prevCertifiedQty: 150,
    currentClaimedQty: 120,
    currentVerifiedQty: 95,
    materialTagNo: "DUCT-GI-20G-LOT-11",
    drawingRef: "GIL/GAG/HVAC-202 R2",
    receiptInvoiceRef: "INV-AIRTECH-991",
    measurementDetails: "Light test and smoke leak audit conducted. Deducted 25 Sqm for joint leakage at riser branches.",
    photoEvidenceRef: "IMG_HVAC_LEAK_02.jpg",
    verificationStatus: "Discrepancy Flagged",
    remarks: "Deducted 25 Sqm pending rectification of mastic sealing and re-test of riser branch flanges.",
    isLocked: false,
    attachments: ["Duct_Leakage_Report.pdf"],
  },
  {
    id: 7,
    slNo: 7,
    boqItem: "BOQ-PNT-06.3",
    description: "Application of 3-coat heavy duty anti-corrosive epoxy paint over primer for outdoor process steel structures",
    vendor: "Asian Paints / Devi Sri Civil",
    techSpec: "Epoxy High Build / 150 Micron Total DFT / IS 1477",
    unit: "Sqm",
    contractQty: 2200,
    receivedQty: 1800,
    prevCertifiedQty: 1000,
    currentClaimedQty: 600,
    currentVerifiedQty: 600,
    materialTagNo: "PNT-EPX-BATCH-890",
    drawingRef: "GIL/GAG/PNT-001 R0",
    receiptInvoiceRef: "INV-AP-1024",
    measurementDetails: "Elcometer DFT gauge check conducted across 40 test grid spots. Average 158 microns recorded.",
    photoEvidenceRef: "IMG_PNT_DFT_ELCO.jpg",
    verificationStatus: "Verified & Approved",
    remarks: "Surface finish and cross-hatch adhesion test passed (Class 4B). Certified for payment.",
    isLocked: true,
    attachments: ["DFT_Inspection_Log.pdf", "Cross_Hatch_Adhesion.pdf"],
  },
];

const ATOM_HYBRID_ITEMS: HybridQVRItem[] = [
  {
    id: 101,
    slNo: 1,
    boqItem: "BOQ-ATM-01.01",
    description: "Design, supply & installation of heavy duty industrial scaffolding for process building height 24 meters",
    vendor: "Quality Engineers (I) Pvt Ltd",
    techSpec: "BS EN 12811 / OSHA Heavy Duty",
    unit: "Sqm",
    contractQty: 1800,
    receivedQty: 1150,
    prevCertifiedQty: 600,
    currentClaimedQty: 550,
    currentVerifiedQty: 500,
    materialTagNo: "SCAF-TAG-ATM-09",
    drawingRef: "ATOM/PKG01/SAF-01 R1",
    receiptInvoiceRef: "INV-QE-2026-089",
    measurementDetails: "Facade area elevation survey. 50 Sqm lacked green safety tag clearance.",
    photoEvidenceRef: "IMG_SCAF_ATM_001.jpg",
    verificationStatus: "Discrepancy Flagged",
    remarks: "Hold payment for 50 Sqm until safety toe boards and green tags are installed.",
    isLocked: false,
    attachments: ["Scaffolding_Audit_Photo.pdf"],
  },
  {
    id: 102,
    slNo: 2,
    boqItem: "BOQ-ATM-02.04",
    description: "Reinforced Cement Concrete M30 in Columns & Shear Walls including shuttering, propping & curing",
    vendor: "L&T Construction - Infra",
    techSpec: "M30 Grade / IS 456:2000 / Spec ATOM-CONC-04",
    unit: "Cum",
    contractQty: 850,
    receivedQty: 620,
    prevCertifiedQty: 300,
    currentClaimedQty: 220,
    currentVerifiedQty: 220,
    materialTagNo: "RMC-M30-BATCH-771",
    drawingRef: "ATOM/PKG01/CIV-104 R2",
    receiptInvoiceRef: "INV-LT-7719",
    measurementDetails: "Column grid dimensions cross-checked with 3D laser scan. Verified 220 Cum placed within tolerances.",
    photoEvidenceRef: "IMG_ATOM_COL_M30.jpg",
    verificationStatus: "Verified & Approved",
    remarks: "7-day compressive strength achieved 24.8 MPa. Column plumbness within +/- 3mm.",
    isLocked: true,
    attachments: ["M30_Cube_Test_7D.pdf"],
  },
  {
    id: 103,
    slNo: 3,
    boqItem: "BOQ-ATM-03.11",
    description: "Heavy Structural Steel Fabrication & Erection for Main Substation Building Truss & Gantry Girder",
    vendor: "Tata Projects Ltd",
    techSpec: "IS 2062 E350 / AWS D1.1 Welding Standard",
    unit: "MT",
    contractQty: 140,
    receivedQty: 95,
    prevCertifiedQty: 40,
    currentClaimedQty: 35,
    currentVerifiedQty: 31,
    materialTagNo: "STL-E350-HEAT-9921",
    drawingRef: "ATOM/PKG01/STR-301 R0",
    receiptInvoiceRef: "INV-TATA-4410",
    measurementDetails: "Weight measured by weighbridge tare slips. Deducted 4 MT pending ultrasonic weld inspection report.",
    photoEvidenceRef: "IMG_ATOM_TRUSS_WELD.jpg",
    verificationStatus: "Discrepancy Flagged",
    remarks: "Deducted 4 MT. NDT ultrasonic testing pending for full penetration butt welds on gantry joints.",
    isLocked: false,
    attachments: ["UT_Pending_Notice.pdf"],
  },
  {
    id: 104,
    slNo: 4,
    boqItem: "BOQ-ATM-04.02",
    description: "Underground HDPE Pipe laying 200mm PN10 for industrial raw water supply including butt fusion joints",
    vendor: "Godavari Piping Projects",
    techSpec: "PE 100 / PN 10 / IS 4984 Standard",
    unit: "Mtrs",
    contractQty: 1500,
    receivedQty: 1100,
    prevCertifiedQty: 500,
    currentClaimedQty: 350,
    currentVerifiedQty: 350,
    materialTagNo: "HDPE-200-LOT-551",
    drawingRef: "ATOM/PKG01/PLB-201 R1",
    receiptInvoiceRef: "INV-GODAV-8812",
    measurementDetails: "Trench chainage survey. Hydrostatic pressure test conducted at 12 bar for 4 hours without pressure drop.",
    photoEvidenceRef: "IMG_ATOM_HDPE_HYDRO.jpg",
    verificationStatus: "Verified & Approved",
    remarks: "Butt fusion joint beads de-beaded and tested. Hydrostatic chart verified clean.",
    isLocked: true,
    attachments: ["Hydrostatic_Test_Chart.pdf"],
  },
  {
    id: 105,
    slNo: 5,
    boqItem: "BOQ-ATM-05.08",
    description: "Supply & installation of 11kV Indoor Vacuum Circuit Breaker (VCB) Panels with microprocessor relays",
    vendor: "Schneider Electric India",
    techSpec: "IEC 62271-200 / 11kV 25kA 3-Sec",
    unit: "Sets",
    contractQty: 6,
    receivedQty: 4,
    prevCertifiedQty: 2,
    currentClaimedQty: 2,
    currentVerifiedQty: 2,
    materialTagNo: "VCB-11KV-SN-0045/46",
    drawingRef: "ATOM/PKG01/ELE-102 R3",
    receiptInvoiceRef: "INV-SE-9012",
    measurementDetails: "Physical equipment serial number verification, contact resistance and timing test witnessed.",
    photoEvidenceRef: "IMG_VCB_PANEL_SE.jpg",
    verificationStatus: "Verified & Approved",
    remarks: "Factory Acceptance Test (FAT) records verified. Site relay trip timing tested at 42ms.",
    isLocked: true,
    attachments: ["FAT_Certificate_VCB.pdf", "Relay_Timing_Log.pdf"],
  },
];

const SUVEN_HYBRID_ITEMS: HybridQVRItem[] = [
  {
    id: 201,
    slNo: 1,
    boqItem: "BOQ-SUV-01.1",
    description: "Bulk excavation in hard rock requiring controlled pneumatic rock breaker for reactor vessel bay",
    vendor: "Sri Sai Infra Projects",
    techSpec: "IS 1200 Part 1 / Non-explosive Mechanical Breaker",
    unit: "Cum",
    contractQty: 600,
    receivedQty: 450,
    prevCertifiedQty: 200,
    currentClaimedQty: 180,
    currentVerifiedQty: 140,
    materialTagNo: "ROCK-EXC-BAY-02",
    drawingRef: "SUV/CIV-012 R1",
    receiptInvoiceRef: "INV-SAI-8801",
    measurementDetails: "Total Station 3D grid levels before and after breaker excavation. Over-break beyond payline detected.",
    photoEvidenceRef: "IMG_SUV_ROCK_EXC.jpg",
    verificationStatus: "Discrepancy Flagged",
    remarks: "Deducted 40 Cum rock excavation beyond payline boundary. Contractor to backfill with lean concrete at own cost.",
    isLocked: false,
    attachments: ["3D_Survey_Level_Sheet.pdf"],
  },
  {
    id: 202,
    slNo: 2,
    boqItem: "BOQ-SUV-02.3",
    description: "Ready Mixed Concrete M25 for Reactor Bay Foundation & Plinth Beams including anti-crack microfibers",
    vendor: "UltraTech RMC Division",
    techSpec: "M25 Grade / IS 456 & IS 10262 / Recron 3S Fibers",
    unit: "Cum",
    contractQty: 420,
    receivedQty: 310,
    prevCertifiedQty: 150,
    currentClaimedQty: 120,
    currentVerifiedQty: 120,
    materialTagNo: "RMC-M25-BATCH-409",
    drawingRef: "SUV/STR-044 R2",
    receiptInvoiceRef: "INV-UT-4491",
    measurementDetails: "Formwork measurement and transit mixer delivery challans matched with structural drawings.",
    photoEvidenceRef: "IMG_SUV_PLINTH_CONC.jpg",
    verificationStatus: "Verified & Approved",
    remarks: "Cube compressive test 28-day target achieved 31.2 MPa. Surface free from honeycombing.",
    isLocked: true,
    attachments: ["UltraTech_Challan_Log.pdf", "Cube_Strength_28D.pdf"],
  },
  {
    id: 203,
    slNo: 3,
    boqItem: "BOQ-SUV-03.5",
    description: "SS316L Pharmaceutical Grade Sanitary Piping with automated orbital TIG welds and internal Ra < 0.4 um",
    vendor: "Pharmatech Process Engg",
    techSpec: "ASME BPE 2022 / SS316L Electro-polished",
    unit: "Mtrs",
    contractQty: 380,
    receivedQty: 260,
    prevCertifiedQty: 120,
    currentClaimedQty: 90,
    currentVerifiedQty: 90,
    materialTagNo: "SS316L-HEAT-2290A",
    drawingRef: "SUV/PID-201 R3",
    receiptInvoiceRef: "INV-PHARM-109",
    measurementDetails: "Boroscopy video inspection carried out on 100% orbital welds. Surface roughness test recorded Ra 0.32 um.",
    photoEvidenceRef: "IMG_BOROSCOPY_ORBITAL.jpg",
    verificationStatus: "Verified & Approved",
    remarks: "Boroscopy passed with zero oxidation or weld defects. Passivation chemical test verified positive.",
    isLocked: true,
    attachments: ["Boroscopy_Inspection_Log.pdf", "Surface_Ra_Test_Cert.pdf"],
  },
  {
    id: 204,
    slNo: 4,
    boqItem: "BOQ-SUV-04.1",
    description: "Modular Cleanroom Wall Panels 50mm PUF core with anti-static powder coat for Class 10,000 facility",
    vendor: "Cleanflow Modular Systems",
    techSpec: "ISO 14644-1 / Class 10000 / Anti-fungal Finish",
    unit: "Sqm",
    contractQty: 1100,
    receivedQty: 780,
    prevCertifiedQty: 350,
    currentClaimedQty: 250,
    currentVerifiedQty: 220,
    materialTagNo: "MOD-PNL-LOT-901",
    drawingRef: "SUV/ARCH-101 R2",
    receiptInvoiceRef: "INV-CLEAN-770",
    measurementDetails: "Area measured from finished floor to ceiling grid. 30 Sqm panel sealant silicone joints incomplete.",
    photoEvidenceRef: "IMG_CLEANROOM_PANEL.jpg",
    verificationStatus: "Partially Verified / Pending Evidence",
    remarks: "Withheld 30 Sqm payment pending silicone flush sealant application and particulate wipe test.",
    isLocked: false,
    attachments: ["Cleanroom_Panel_Audit.pdf"],
  },
  {
    id: 205,
    slNo: 5,
    boqItem: "BOQ-SUV-05.2",
    description: "Air Handling Unit AHU-10000 CFM with HEPA H14 filtration module, chilled water coil and VFD drive",
    vendor: "Zamil Air Conditioners",
    techSpec: "Eurovent Certified / EN 1822 H14 HEPA",
    unit: "Nos",
    contractQty: 4,
    receivedQty: 3,
    prevCertifiedQty: 1,
    currentClaimedQty: 1,
    currentVerifiedQty: 1,
    materialTagNo: "AHU-10K-TAG-02",
    drawingRef: "SUV/HVAC-301 R1",
    receiptInvoiceRef: "INV-ZAMIL-551",
    measurementDetails: "Equipment positioned on inertia base. Filter integrity DOP aerosol challenge test witnessed.",
    photoEvidenceRef: "IMG_AHU_DOP_TEST.jpg",
    verificationStatus: "Verified & Approved",
    remarks: "HEPA filter integrity verified 99.995% efficiency. Airflow velocity recorded 520 FPM.",
    isLocked: true,
    attachments: ["HEPA_DOP_Test_Report.pdf"],
  },
];

const CLIENT_ITEMS_MAP: Record<string, HybridQVRItem[]> = {
  "Granules India Limited - Gagillapur": GRANULES_HYBRID_ITEMS,
  "Atom Project (New Atom Project)": ATOM_HYBRID_ITEMS,
  "Suven Pharmaceuticals Ltd (Chonce Life Science)": SUVEN_HYBRID_ITEMS,
  "MCGM (Greater Mumbai Corp)": ATOM_HYBRID_ITEMS,
  "S2 / Standard Client": GRANULES_HYBRID_ITEMS,
};

const CLIENT_METADATA_MAP: Record<string, QVRMetadata> = {
  "Granules India Limited - Gagillapur": {
    reportNo: "IQE/QVR/GIL/GAG/2025/084",
    revision: "01",
    reportDate: "2025-11-30",
    verificationDate: "2025-11-28",
    verificationPeriod: "17.10.2025 to 30.11.2025",
    client: "Granules India Limited (Asset Owner)",
    project: "Granules Gagillapur Plant Expansion & Maintenance Pkg",
    epcContractor: "Devi Sri Civil & Painting / JB Fabricator",
    packageContract: "GIL/GAG/2025/TPI-1710",
    location: "Gagillapur Plant, Hyderabad, Telangana",
    poWoNo: "WO-3400077675/18.08.25",
    poWoDate: "2025-10-17",
    drawingRef: "GIL/GAG/CIV-001, STR-102, MEP-301",
    iqeInspector: "Er. K. Rao (Lead TPI Auditor)",
    discipline: "Civil, Structural & MEP Engineering",
    purposeOfVerification: "RA Bill No. 04 Quantity Audit & Payment Recommendation",
    measurementBasis: "Joint Site Physical Measurement & GFC Drawing Reconciliation",
    raBillNo: "RA Bill No. 04",
    previousReportNo: "IQE/QVR/GIL/GAG/2025/073",
  },
  "Atom Project (New Atom Project)": {
    reportNo: "IQE/QVR/ATOM/PKG01/2026/012",
    revision: "00",
    reportDate: "2026-06-12",
    verificationDate: "2026-06-10",
    verificationPeriod: "01.05.2026 to 10.06.2026",
    client: "Atom Process Energy Asset Owner",
    project: "New Atom Process Facility Pkg 01",
    epcContractor: "Larsen & Toubro Ltd - Infra Div",
    packageContract: "ATOM/PKG01/2026/TPI-9901",
    location: "Atom Site Industrial Zone, India",
    poWoNo: "PO-ATOM-2026-88120",
    poWoDate: "2026-05-14",
    drawingRef: "ATOM/PKG01/SAF-01 R1",
    iqeInspector: "Er. V. Sharma (Lead Inspector)",
    discipline: "Safety & Mechanical Process",
    purposeOfVerification: "RA Bill No. 02 Quantity Verification Survey",
    measurementBasis: "Joint Site Survey & Equipment Count",
    raBillNo: "RA Bill No. 02",
    previousReportNo: "IQE/QVR/ATOM/PKG01/2026/001",
  },
  "Suven Pharmaceuticals Ltd (Chonce Life Science)": {
    reportNo: "IQE/QVR/SUVEN/2025/044",
    revision: "01",
    reportDate: "2025-12-20",
    verificationDate: "2025-12-18",
    verificationPeriod: "01.11.2025 to 18.12.2025",
    client: "Suven Pharmaceuticals Ltd (Asset Owner)",
    project: "Suven C.Tank Civil & Scaffolding Works",
    epcContractor: "SV Enterprises / SVS CONSTRUCTIONS",
    packageContract: "SUVEN/CIVIL/2025/TPI-4443",
    location: "Chonce Life Science Plant, Suryapet, TS",
    poWoNo: "PO-SUVEN-50054",
    poWoDate: "2025-12-13",
    drawingRef: "SUVEN/CIV/PIPE-88",
    iqeInspector: "Er. M. Reddy (TPI Inspector)",
    discipline: "Civil & Underground Piping",
    purposeOfVerification: "Concealed Work Inspection & RA Bill Verification",
    measurementBasis: "Pre-Pour Inspection & Hydro Test Logs",
    raBillNo: "RA Bill No. 03",
    previousReportNo: "IQE/QVR/SUVEN/2025/031",
  },
  "MCGM (Greater Mumbai Corp)": {
    reportNo: "IQE/QVR/MCGM/2024/099",
    revision: "00",
    reportDate: "2024-04-20",
    verificationDate: "2024-04-18",
    verificationPeriod: "01.03.2024 to 18.04.2024",
    client: "Municipal Corporation of Greater Mumbai",
    project: "Mumbai Coastal Road Pkg 03",
    epcContractor: "Larsen & Toubro Ltd - Infra Div",
    packageContract: "MCGM/CWD/2024/TPI-8892",
    location: "Worli-Nariman Corridor, Mumbai, MH",
    poWoNo: "PO-MCGM-2024-99812",
    poWoDate: "2024-04-15",
    drawingRef: "MCGM/CWD/DWG-301",
    iqeInspector: "Er. A. Kulkarni",
    discipline: "Infrastructure & Heavy Civil",
    purposeOfVerification: "RA Bill Audit & Site Verification",
    measurementBasis: "Joint Physical Verification",
    raBillNo: "RA Bill No. 01",
    previousReportNo: "N/A",
  },
  "S2 / Standard Client": {
    reportNo: "IQE/QVR/S2/2024/010",
    revision: "01",
    reportDate: "2024-05-20",
    verificationDate: "2024-05-18",
    verificationPeriod: "01.04.2024 to 18.05.2024",
    client: "S2 Standard Asset Owner",
    project: "Standard Industrial Facility Pkg 01",
    epcContractor: "Tata Projects Infrastructure",
    packageContract: "S2/STD/2024/TPI-1010",
    location: "Industrial Zone Phase 2, India",
    poWoNo: "PO-S2-2024-10100",
    poWoDate: "2024-05-15",
    drawingRef: "S2/STD/DWG-101",
    iqeInspector: "Er. S. Patel",
    discipline: "General Quality Audit",
    purposeOfVerification: "RA Bill Verification",
    measurementBasis: "Joint Physical Survey",
    raBillNo: "RA Bill No. 02",
    previousReportNo: "IQE/QVR/S2/2024/001",
  },
};

const CLIENT_OPTIONS = [
  "Granules India Limited - Gagillapur",
  "Atom Project (New Atom Project)",
  "Suven Pharmaceuticals Ltd (Chonce Life Science)",
  "MCGM (Greater Mumbai Corp)",
  "S2 / Standard Client",
];

export default function QualityBillVerificationPage() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedClient, setSelectedClient] = useState<string>("Granules India Limited - Gagillapur");
  const [items, setItems] = useState<HybridQVRItem[]>(GRANULES_HYBRID_ITEMS);
  const [metadata, setMetadata] = useState<QVRMetadata>(CLIENT_METADATA_MAP["Granules India Limited - Gagillapur"]);
  const [viewLayout, setViewLayout] = useState<"vertical" | "horizontal">("vertical"); // Default to Vertical View
  const [isSwitchingLayout, setIsSwitchingLayout] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const handleSwitchLayout = (layout: "vertical" | "horizontal") => {
    if (layout === viewLayout) return;
    setIsSwitchingLayout(true);
    setViewLayout(layout);
    setTimeout(() => setIsSwitchingLayout(false), 220);
  };
  
  // Modals state for explicit View and Edit actions requested by user!
  const [viewingItem, setViewingItem] = useState<HybridQVRItem | null>(null);
  const [editingItem, setEditingItem] = useState<HybridQVRItem | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [isInlineEditMode, setIsInlineEditMode] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showPdfPreview, setShowPdfPreview] = useState<boolean>(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string>(`${API_BASE}/api/v1/reports/pdf/quality-bill-verification`);
  const [previewPdfTitle, setPreviewPdfTitle] = useState<string>("Quality Bill Verification Certificate & Audit");
  const [previewReportNo, setPreviewReportNo] = useState<string>("IQE/QVR/2026/084");

  const [newItem, setNewItem] = useState({
    boqItem: "",
    description: "",
    vendor: "Devi Sri Civil & Painting",
    techSpec: "",
    unit: "Cum",
    contractQty: 0,
    prevCertifiedQty: 0,
    currentClaimedQty: 0,
    currentVerifiedQty: 0,
    materialTagNo: "",
    drawingRef: "",
    receiptInvoiceRef: "",
    measurementDetails: "Joint Site Physical Measurement",
    photoEvidenceRef: "",
    verificationStatus: "Verified & Approved" as HybridQVRItem["verificationStatus"],
    remarks: "Verified & recommended for payment",
  });

  const handleInlineChange = (id: number, field: keyof HybridQVRItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const createdItem: HybridQVRItem = {
      id: Date.now(),
      slNo: items.length + 1,
      boqItem: newItem.boqItem || `BOQ-${items.length + 1}`,
      description: newItem.description || "New Item Description",
      vendor: newItem.vendor || "Contractor",
      techSpec: newItem.techSpec || "Per Technical Specification",
      unit: newItem.unit || "Nos",
      contractQty: Number(newItem.contractQty) || 0,
      receivedQty: Number(newItem.currentClaimedQty) || 0,
      prevCertifiedQty: Number(newItem.prevCertifiedQty) || 0,
      currentClaimedQty: Number(newItem.currentClaimedQty) || 0,
      currentVerifiedQty: Number(newItem.currentVerifiedQty) || 0,
      materialTagNo: newItem.materialTagNo || "TAG-NEW",
      drawingRef: newItem.drawingRef || "GFC-DWG-01",
      receiptInvoiceRef: newItem.receiptInvoiceRef || "INV-001",
      measurementDetails: newItem.measurementDetails || "Joint Physical Survey",
      photoEvidenceRef: newItem.photoEvidenceRef || "IMG-001.JPG",
      verificationStatus: newItem.verificationStatus,
      remarks: newItem.remarks || "Audited and verified",
      isLocked: false,
      attachments: [],
    };
    setItems((prev) => [...prev, createdItem]);
    setShowAddModal(false);
    setNewItem({
      boqItem: "",
      description: "",
      vendor: "Devi Sri Civil & Painting",
      techSpec: "",
      unit: "Cum",
      contractQty: 0,
      prevCertifiedQty: 0,
      currentClaimedQty: 0,
      currentVerifiedQty: 0,
      materialTagNo: "",
      drawingRef: "",
      receiptInvoiceRef: "",
      measurementDetails: "Joint Site Physical Measurement",
      photoEvidenceRef: "",
      verificationStatus: "Verified & Approved",
      remarks: "Verified & recommended for payment",
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleClientChange = (client: string) => {
    if (client === selectedClient) return;
    setIsSwitchingLayout(true);
    setSelectedClient(client);
    setItems(CLIENT_ITEMS_MAP[client] || GRANULES_HYBRID_ITEMS);
    setMetadata(CLIENT_METADATA_MAP[client] || CLIENT_METADATA_MAP["Granules India Limited - Gagillapur"]);
    setTimeout(() => setIsSwitchingLayout(false), 220);
  };

  const processedItems = useMemo(() => {
    return items.map((item) => {
      const cumulativeClaimedQty = item.prevCertifiedQty + item.currentClaimedQty;
      const cumulativeVerifiedQty = item.prevCertifiedQty + item.currentVerifiedQty;
      const balanceQty = item.contractQty - cumulativeVerifiedQty;
      const diffQty = item.currentClaimedQty - item.currentVerifiedQty;
      const variationPercent = item.contractQty > 0 ? ((cumulativeVerifiedQty - item.contractQty) / item.contractQty) * 100 : 0;

      return {
        ...item,
        cumulativeClaimedQty,
        cumulativeVerifiedQty,
        balanceQty,
        diffQty,
        variationPercent,
      };
    });
  }, [items]);

  const filteredItems = useMemo(() => {
    return processedItems.filter((item) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "Verified & Approved" && item.verificationStatus === "Verified & Approved") ||
        (statusFilter === "Discrepancy Flagged" && (item.verificationStatus.includes("Discrepancy") || item.diffQty > 0)) ||
        (statusFilter === "Partially Verified" && item.verificationStatus.includes("Partially")) ||
        (statusFilter === "Rejected" && item.verificationStatus.includes("Rejected"));

      const matchesSearch =
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.boqItem.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.drawingRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.materialTagNo.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [processedItems, searchQuery, statusFilter]);

  const totalContractQty = useMemo(() => processedItems.reduce((acc, curr) => acc + curr.contractQty, 0), [processedItems]);
  const totalClaimedQty = useMemo(() => processedItems.reduce((acc, curr) => acc + curr.currentClaimedQty, 0), [processedItems]);
  const totalVerifiedQty = useMemo(() => processedItems.reduce((acc, curr) => acc + curr.currentVerifiedQty, 0), [processedItems]);
  const totalDiffQty = useMemo(() => processedItems.reduce((acc, curr) => acc + curr.diffQty, 0), [processedItems]);
  const discrepancyCount = processedItems.filter((i) => i.verificationStatus.includes("Discrepancy") || i.diffQty > 0).length;

  const toggleItemLock = (id: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, isLocked: !item.isLocked };
        }
        return item;
      })
    );
  };

  const handleSaveEditItem = () => {
    if (!editingItem) return;
    setItems((prev) =>
      prev.map((item) => (item.id === editingItem.id ? { ...editingItem } : item))
    );
    setEditingItem(null);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Full Ledger Excel Export
  const handleExportCSV = () => {
    trackButtonClick("btn_export_hybrid_qvr_csv", "csv_export", "Export IQE Hybrid QVR CSV", "reports");
    const headers = [
      "Sl. No.",
      "PO / BOQ Item",
      "Item Description / Material",
      "Manufacturer / Supplier / Contractor",
      "Technical Requirement / Specification",
      "Unit",
      "Contract / PO Qty.",
      "Received Qty.",
      "Previously Certified Qty.",
      "Current Claimed Qty.",
      "Cumulative Claimed Qty.",
      "Current Verified Qty.",
      "Cumulative Verified Qty.",
      "Balance Qty.",
      "Variation %",
      "Material Tag / Heat / Batch No.",
      "Drawing / Document Ref.",
      "Receipt / Invoice Ref.",
      "Verification / Measurement Details",
      "Photo Ref",
      "Difference Qty.",
      "Verification Status",
      "Remarks",
    ];

    const csvRows = processedItems.map((item) => [
      item.slNo,
      item.boqItem,
      `"${item.description.replace(/"/g, '""')}"`,
      item.vendor,
      `"${item.techSpec.replace(/"/g, '""')}"`,
      item.unit,
      item.contractQty,
      item.receivedQty,
      item.prevCertifiedQty,
      item.currentClaimedQty,
      item.cumulativeClaimedQty,
      item.currentVerifiedQty,
      item.cumulativeVerifiedQty,
      item.balanceQty,
      `${item.variationPercent.toFixed(2)}%`,
      item.materialTagNo,
      item.drawingRef,
      item.receiptInvoiceRef,
      `"${item.measurementDetails.replace(/"/g, '""')}"`,
      item.photoEvidenceRef,
      item.diffQty,
      item.verificationStatus,
      `"${item.remarks.replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...csvRows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `IQE_Hybrid_QVR_Report_${metadata.reportNo.replace(/\//g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Single Item Excel Export
  const handleExportSingleItemCSV = (item: HybridQVRItem) => {
    trackButtonClick("btn_export_single_item_csv", "csv_export", `Export Item ${item.boqItem} CSV`, "reports");
    const headers = [
      "BOQ Item",
      "Description",
      "Vendor",
      "Specification",
      "Unit",
      "Contract Qty",
      "Claimed Qty",
      "Verified Qty",
      "Diff Qty",
      "Tag No",
      "Drawing Ref",
      "Status",
      "Remarks",
    ];
    const row = [
      item.boqItem,
      `"${item.description.replace(/"/g, '""')}"`,
      item.vendor,
      `"${item.techSpec.replace(/"/g, '""')}"`,
      item.unit,
      item.contractQty,
      item.currentClaimedQty,
      item.currentVerifiedQty,
      item.currentClaimedQty - item.currentVerifiedQty,
      item.materialTagNo,
      item.drawingRef,
      item.verificationStatus,
      `"${item.remarks.replace(/"/g, '""')}"`,
    ];
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), row.join(",")].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `IQE_Item_${item.boqItem.replace(/\./g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSinglePDF = async (item: HybridQVRItem) => {
    trackButtonClick("btn_download_qvr_item_pdf", "pdf_download", `QVR Item ${item.boqItem} PDF`, "reports");
    const query = new URLSearchParams({
      boq_item: item.boqItem,
      ra_bill: metadata.raBillNo,
      vendor: item.vendor,
      client: metadata.client,
      description: item.description,
      unit: item.unit,
      drawing_ref: item.drawingRef,
      boq_qty: item.contractQty.toString(),
      claimed_qty: item.currentClaimedQty.toString(),
      verified_qty: item.currentVerifiedQty.toString(),
      unit_rate: "1000",
      observation: item.remarks,
      closure_status: item.verificationStatus,
      is_locked: item.isLocked.toString(),
    });
    await downloadPdfFile(
      `${API_BASE}/api/v1/reports/pdf/tpi-billing-item?${query.toString()}`,
      `QVR_Item_${item.boqItem}_Certificate.pdf`,
      "/sample-pdfs/FQUAL01.pdf"
    );
  };

  const handlePreviewSinglePDF = (item: HybridQVRItem) => {
    trackButtonClick("btn_preview_qvr_item_pdf", "pdf_preview", `QVR Item ${item.boqItem} PDF Preview`, "reports");
    const query = new URLSearchParams({
      boq_item: item.boqItem,
      ra_bill: metadata.raBillNo,
      vendor: item.vendor,
      client: metadata.client,
      description: item.description,
      unit: item.unit,
      drawing_ref: item.drawingRef,
      boq_qty: item.contractQty.toString(),
      claimed_qty: item.currentClaimedQty.toString(),
      verified_qty: item.currentVerifiedQty.toString(),
      unit_rate: "1000",
      observation: item.remarks,
      closure_status: item.verificationStatus,
      is_locked: item.isLocked.toString(),
    });
    setPreviewPdfUrl(`${API_BASE}/api/v1/reports/pdf/tpi-billing-item?${query.toString()}`);
    setPreviewPdfTitle(`Quality Verification - Item ${item.boqItem}`);
    setPreviewReportNo(item.boqItem);
    setShowPdfPreview(true);
  };

  // 5 seconds loader screen
  if (isLoading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <IQELoader message="Loading Quality Bill Verification Engine..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-800 p-3 sm:p-4 space-y-3.5">
      {/* Light UI Top Banner - IQE Hybrid QVR Format Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0 lg:min-w-[340px] lg:flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#003366] dark:text-sky-300 text-[11px] font-extrabold font-mono border border-blue-200">
                Form No: IQE-QVR-2026
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-extrabold font-mono border border-emerald-200">
                Independent Third-Party Verification
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#003366] dark:text-sky-300 font-heading tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
              <span>QUANTITY VERIFICATION &amp; SURVEY REPORT</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Report Ref: <span className="font-mono font-bold text-blue-700">{metadata.reportNo}</span> | Project: {selectedClient}
            </p>
          </div>

          {/* Action Toolbar with Word, Excel and PDF Buttons */}
          <div className="flex flex-wrap items-center lg:justify-end gap-2 min-w-0">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 text-xs font-bold max-w-full min-w-0">
              <Users className="w-3.5 h-3.5 text-[#0084bf] shrink-0" />
              <span className="text-[11px] shrink-0">Project:</span>
              <select aria-label="Select project"
                value={selectedClient}
                onChange={(e) => handleClientChange(e.target.value)}
                className="min-w-0 max-w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-0.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
              >
                {CLIENT_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Layout Toggle */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => handleSwitchLayout("vertical")}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer text-[11px] ${
                  viewLayout === "vertical"
                    ? "bg-[#003366] text-white shadow-xs font-extrabold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Vertical View</span>
              </button>
              <button
                onClick={() => handleSwitchLayout("horizontal")}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer text-[11px] ${
                  viewLayout === "horizontal"
                    ? "bg-[#003366] text-white shadow-xs font-extrabold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>23-Column Table</span>
              </button>
            </div>

            {/* DOWNLOAD IN WORD BUTTON */}
            <button
              onClick={() => {
                trackButtonClick("btn_download_qvr_word", "docx_download", "QVR Master Word", "reports");
                window.open(`${API_BASE}/api/v1/reports/docx/quality-bill-verification`, "_blank");
              }}
              className="px-3 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
              title="Download Master Quality Report in Word (.docx) Format with IQE Logo, Header & Footer"
            >
              <FileCode className="w-3.5 h-3.5 text-sky-300" />
              <span>Word</span>
            </button>

            {/* DOWNLOAD IN EXCEL BUTTON */}
            <button
              onClick={() => {
                trackButtonClick("btn_export_hybrid_qvr_excel", "excel_export", "Export IQE Hybrid QVR Excel", "reports");
                window.open(`${API_BASE}/api/v1/reports/excel/quality-bill-verification`, "_blank");
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
              title="Download Master Quality Report in Excel (.xlsx) Format with IQE Logo, Header & Footer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>

            {/* LIVE PREVIEW BUTTON */}
            <button
              onClick={() => {
                trackButtonClick("btn_live_preview_qvr_pdf", "pdf_preview", "QVR Live Preview", "reports");
                setPreviewPdfUrl(`${API_BASE}/api/v1/reports/pdf/quality-bill-verification`);
                setPreviewPdfTitle("Quality Bill Verification Certificate & Audit");
                setPreviewReportNo(metadata?.reportNo || "IQE/QVR/2026/084");
                setShowPdfPreview(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#0084bf] hover:bg-[#0073a8] text-white text-xs font-extrabold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
              title="Live PDF Preview of Quality Bill Verification Report"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </button>

            {/* DOWNLOAD IN PDF BUTTON */}
            <button
              onClick={async () => {
                trackButtonClick("btn_download_qvr_pdf", "pdf_download", "QVR Master PDF", "reports");
                const url = `${API_BASE}/api/v1/reports/pdf/quality-bill-verification`;
                const filename = `Quality_Bill_Verification_${(metadata?.reportNo || "IQE_QVR").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
                const ok = await downloadPdfFile(url, filename, "/sample-pdfs/FQUAL01.pdf");
                if (!ok) {
                  setShowPdfPreview(true);
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
              title="Download Master Quality Report in PDF Format with IQE Logo, Header & Footer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {savedSuccess && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Changes updated and saved successfully!</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar - Compact Spacing */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="relative flex-1 w-full max-w-lg">
          <input aria-label="Search line items"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search PO/BOQ item, vendor, drawing ref, tag number..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Dropdown */}
          <select aria-label="Filter by verification status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 cursor-pointer focus:ring-2 focus:ring-blue-500 shadow-2xs"
            title="Filter by Verification Status"
          >
            <option value="ALL">All Statuses ({items.length})</option>
            <option value="Verified & Approved">Verified &amp; Approved</option>
            <option value="Discrepancy Flagged">Discrepancy Flagged</option>
            <option value="Partially Verified">Partially Verified</option>
            <option value="Rejected">Rejected</option>
          </select>

          <span className="text-xs text-slate-500 font-bold font-mono mr-1 hidden sm:inline">
            {filteredItems.length} of {items.length} items
          </span>

          <button
            onClick={() => setIsInlineEditMode(!isInlineEditMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-xs cursor-pointer ${
              isInlineEditMode
                ? "bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-amber-500/20"
                : "bg-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 border-slate-300"
            }`}
            title="Toggle Inline Editing Mode"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isInlineEditMode ? "Exit Inline Edit" : "Inline Edit"}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-[#003366] hover:bg-[#002244] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            title="Add New Line Item"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>

          <button
            onClick={() => {
              trackButtonClick("btn_live_preview_qvr_pdf_bar", "pdf_preview", "QVR Live Preview Bar", "reports");
              setPreviewPdfUrl(`${API_BASE}/api/v1/reports/pdf/quality-bill-verification`);
              setPreviewPdfTitle("Quality Bill Verification Certificate & Audit");
              setPreviewReportNo(metadata?.reportNo || "IQE/QVR/2026/084");
              setShowPdfPreview(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-[#0084bf] hover:bg-[#0073a8] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            title="Live PDF Preview of Quality Bill Verification Report"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Preview</span>
          </button>
        </div>
      </div>

      {/* LAYOUT TRANSITION LOADER */}
      {isSwitchingLayout ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-2xs animate-in fade-in duration-200">
          <Loader2 className="w-8 h-8 animate-spin text-[#0084bf]" />
          <p className="text-xs font-bold text-slate-600 font-mono tracking-wide">Loading Verification View...</p>
        </div>
      ) : (
        <>
          {/* VERTICAL CARDS VIEW - Compact & Action Items at Bottom */}
          {viewLayout === "vertical" && (
            <div className="space-y-3">
          {filteredItems.map((item, idx) => {
            const isDiscrepancy = item.verificationStatus.includes("Discrepancy") || item.diffQty > 0;
            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border ${
                  item.isLocked
                    ? "border-slate-300 shadow-2xs"
                    : isDiscrepancy
                    ? "border-rose-300 shadow-sm"
                    : "border-slate-200 shadow-sm hover:shadow-md"
                } transition-all overflow-hidden p-3.5 space-y-3`}
              >
                {/* Vertical Card Header Bar */}
                <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-[#003366] text-white font-mono font-extrabold text-xs flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-sm text-[#0084bf]">{item.boqItem}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold font-mono ${
                          isDiscrepancy ? "bg-rose-100 text-rose-800 border border-rose-300" : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        }`}>
                          {item.verificationStatus}
                        </span>
                        {item.isLocked ? (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-300 flex items-center gap-1">
                            <Lock className="w-3 h-3 text-slate-600" /> Locked
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 flex items-center gap-1">
                            <Unlock className="w-3 h-3 text-emerald-600" /> Editable
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-bold text-slate-900 mt-0.5">Supplier/Contractor: {item.vendor}</p>
                    </div>
                  </div>
                </div>

                {/* Item Details Display - Reduced Space */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                  <div className="space-y-0.5">
                    <label className="text-[11px] font-extrabold uppercase text-slate-400">Item Description / Material</label>
                    {isInlineEditMode && !item.isLocked ? (
                      <textarea aria-label={`Description for ${item.boqItem}`}
                        rows={2}
                        value={item.description}
                        onChange={(e) => handleInlineChange(item.id, "description", e.target.value)}
                        className="w-full text-slate-800 text-[11px] font-medium bg-amber-50/70 p-2 rounded-xl border border-amber-300 leading-snug focus:ring-1 focus:ring-amber-500"
                      />
                    ) : (
                      <p className="text-slate-800 text-[11px] font-medium bg-slate-50 p-2 rounded-xl border border-slate-200 leading-snug">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[11px] font-extrabold uppercase text-slate-400">Technical Requirement / Spec</label>
                    {isInlineEditMode && !item.isLocked ? (
                      <textarea aria-label={`Technical specification for ${item.boqItem}`}
                        rows={2}
                        value={item.techSpec}
                        onChange={(e) => handleInlineChange(item.id, "techSpec", e.target.value)}
                        className="w-full text-slate-800 text-[11px] font-medium bg-amber-50/70 p-2 rounded-xl border border-amber-300 leading-snug focus:ring-1 focus:ring-amber-500"
                      />
                    ) : (
                      <p className="text-slate-800 text-[11px] font-medium bg-slate-50 p-2 rounded-xl border border-slate-200 leading-snug">
                        {item.techSpec}
                      </p>
                    )}
                  </div>
                </div>

                {/* Vertical Quantities Grid - Compact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                    <p className="text-[11px] font-extrabold uppercase text-slate-400">Contract Qty</p>
                    {isInlineEditMode && !item.isLocked ? (
                      <input aria-label={`Contract quantity for ${item.boqItem}`}
                        type="number"
                        value={item.contractQty}
                        onChange={(e) => handleInlineChange(item.id, "contractQty", parseFloat(e.target.value) || 0)}
                        className="w-full font-mono font-bold text-slate-900 text-xs p-1 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="font-mono font-bold text-slate-900 text-xs">{item.contractQty} {item.unit}</p>
                    )}
                  </div>

                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                    <p className="text-[11px] font-extrabold uppercase text-slate-400">Prev Certified</p>
                    <p className="font-mono font-bold text-slate-900 text-xs">{item.prevCertifiedQty} {item.unit}</p>
                  </div>

                  <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200 space-y-0.5">
                    <p className="text-[11px] font-extrabold uppercase text-amber-900">Current Claimed</p>
                    {isInlineEditMode && !item.isLocked ? (
                      <input aria-label={`Claimed quantity for ${item.boqItem}`}
                        type="number"
                        value={item.currentClaimedQty}
                        onChange={(e) => handleInlineChange(item.id, "currentClaimedQty", parseFloat(e.target.value) || 0)}
                        className="w-full font-mono font-bold text-amber-900 text-xs p-1 bg-white border border-amber-400 rounded focus:ring-1 focus:ring-amber-500"
                      />
                    ) : (
                      <p className="font-mono font-bold text-amber-900 text-xs">{item.currentClaimedQty} {item.unit}</p>
                    )}
                  </div>

                  <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-0.5">
                    <p className="text-[11px] font-extrabold uppercase text-emerald-900">Current Verified</p>
                    {isInlineEditMode && !item.isLocked ? (
                      <input aria-label={`Verified quantity for ${item.boqItem}`}
                        type="number"
                        value={item.currentVerifiedQty}
                        onChange={(e) => handleInlineChange(item.id, "currentVerifiedQty", parseFloat(e.target.value) || 0)}
                        className="w-full font-mono font-bold text-emerald-800 text-xs p-1 bg-white border border-emerald-400 rounded focus:ring-1 focus:ring-emerald-500"
                      />
                    ) : (
                      <p className="font-mono font-bold text-emerald-800 text-xs">{item.currentVerifiedQty} {item.unit}</p>
                    )}
                  </div>

                  <div className="p-2 rounded-xl bg-rose-50/70 border border-rose-200 space-y-0.5">
                    <p className="text-[11px] font-extrabold uppercase text-rose-900">Diff Qty</p>
                    <p className="font-mono font-bold text-rose-700 text-xs">{item.diffQty} {item.unit}</p>
                  </div>
                </div>

                {/* ACTION ITEMS BROUGHT TO LAST (BOTTOM TOOLBAR) */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-extrabold uppercase text-slate-400 mr-auto">Item Action Tools:</span>

                  <button
                    onClick={() => setViewingItem(item)}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#00618e] dark:text-sky-300 border border-blue-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="View Full Item Details"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#0084bf]" />
                    <span>View</span>
                  </button>

                  <button
                    onClick={() => setEditingItem({ ...item })}
                    disabled={item.isLocked}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                      item.isLocked
                        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                        : "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300"
                    }`}
                    title="Edit Item Details"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => window.open(`${API_BASE}/api/v1/reports/docx/tpi-billing-item?boq_item=${item.boqItem}`, "_blank")}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="Download Word Doc for this item with IQE Logo & Header"
                  >
                    <FileCode className="w-3.5 h-3.5 text-blue-600" />
                    <span>Word</span>
                  </button>

                  <button
                    onClick={() => handleExportSingleItemCSV(item)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="Download Single Row CSV for this item"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>CSV</span>
                  </button>

                  <button
                    onClick={() => window.open(`${API_BASE}/api/v1/reports/excel/tpi-billing-item?boq_item=${item.boqItem}`, "_blank")}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="Download Excel for this item with IQE Logo & Header"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Excel</span>
                  </button>

                  <button
                    onClick={() => handlePreviewSinglePDF(item)}
                    className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0084bf] border border-sky-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="Live Preview PDF for this item with IQE Logo & Header"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>

                  <button
                    onClick={() => handleDownloadSinglePDF(item)}
                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="Download PDF for this item with IQE Logo & Header"
                  >
                    <FileText className="w-3.5 h-3.5 text-rose-600" />
                    <span>PDF</span>
                  </button>

                  <button aria-label={item.isLocked ? "Unlock for Editing" : "Lock Item"}
                    onClick={() => toggleItemLock(item.id)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                      item.isLocked
                        ? "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                    }`}
                    title={item.isLocked ? "Unlock for Editing" : "Lock Item"}
                  >
                    {item.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 23-COLUMN HORIZONTAL TABLE VIEW WITH ACTION ITEMS BROUGHT TO LAST */}
      {viewLayout === "horizontal" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-3">
          <div className="overflow-x-auto max-h-[650px] border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse min-w-[2100px]">
              <thead className="sticky top-0 bg-slate-900 text-slate-300 font-semibold border-b border-slate-800 z-10 select-none">
                <tr>
                  <th className="py-2.5 px-2 text-center border-r border-slate-800 w-12 min-w-[48px]">Sl. No.</th>
                  <th className="py-2.5 px-2 border-r border-slate-800 font-mono w-28 min-w-[110px]">PO / BOQ Item</th>
                  <th className="py-2.5 px-2 border-r border-slate-800 min-w-[260px]">Item Description / Material</th>
                  <th className="py-2.5 px-2 border-r border-slate-800 min-w-[170px]">Manufacturer / Supplier / Contractor</th>
                  <th className="py-2.5 px-2 border-r border-slate-800 min-w-[190px]">Technical Requirement / Specification</th>
                  <th className="py-2.5 px-2 border-r border-slate-800 text-center w-16 min-w-[60px]">Unit</th>
                  <th className="py-2.5 px-2 border-r border-slate-800 text-right w-24 min-w-[90px]">Contract Qty.</th>
                  <th className="py-2.5 px-2 border-r border-slate-800 text-right bg-amber-950 text-amber-200 font-bold w-28 min-w-[110px]">Current Claimed Qty.</th>
                  <th className="py-2.5 px-2 border-r border-slate-800 text-right bg-emerald-950 text-emerald-200 font-bold w-28 min-w-[110px]">Current Verified Qty.</th>
                  <th className="py-2.5 px-2 border-r border-slate-800 min-w-[140px]">Tag / Heat / Batch No.</th>
                  <th className="py-2.5 px-2 border-r border-slate-800 min-w-[130px]">Drawing Ref.</th>
                  <th className="py-2.5 px-2 border-r border-slate-800 text-right bg-rose-950 text-rose-200 font-bold w-24 min-w-[90px]">Difference Qty.</th>
                  <th className="py-2.5 px-2 border-r border-slate-800 min-w-[160px]">Verification Status</th>
                  <th className="py-2.5 px-2 border-r border-slate-800 min-w-[200px]">Remarks</th>
                  {/* ACTION ITEMS COLUMN BROUGHT TO LAST COLUMN */}
                  <th className="py-2.5 px-2 text-center border-l border-slate-800 w-[260px] min-w-[260px] max-w-[260px] sticky right-0 bg-slate-900 z-20">
                    Actions (View/Edit/Word/Excel/PDF)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 text-[11px]">
                {filteredItems.map((item, idx) => {
                  const isDiscrepancy = item.verificationStatus.includes("Discrepancy") || item.diffQty > 0;
                  return (
                    <tr key={item.id} className={`hover:bg-blue-50/40 transition-colors ${isDiscrepancy ? "bg-rose-50/40" : ""}`}>
                      <td className="py-2 px-2 text-center font-mono font-bold text-slate-700 bg-slate-50 border-r border-slate-100 w-12 min-w-[48px]">#{idx + 1}</td>
                      <td className="py-2 px-2 font-mono font-bold text-[#0084bf] border-r border-slate-100 w-28 min-w-[110px]">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label={`BOQ item code for ${item.boqItem}`}
                            type="text"
                            value={item.boqItem}
                            onChange={(e) => handleInlineChange(item.id, "boqItem", e.target.value)}
                            className="w-full p-1 font-mono font-bold text-[#0084bf] bg-amber-50/70 border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500"
                          />
                        ) : (
                          item.boqItem
                        )}
                      </td>
                      <td className="py-2 px-2 border-r border-slate-100 font-medium min-w-[260px]">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label={`Description for ${item.boqItem}`}
                            type="text"
                            value={item.description}
                            onChange={(e) => handleInlineChange(item.id, "description", e.target.value)}
                            className="w-full p-1 font-medium bg-amber-50/70 border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500"
                          />
                        ) : (
                          <span className="line-clamp-2 block" title={item.description}>{item.description}</span>
                        )}
                      </td>
                      <td className="py-2 px-2 font-semibold text-slate-900 border-r border-slate-100 min-w-[170px]">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label={`Vendor for ${item.boqItem}`}
                            type="text"
                            value={item.vendor}
                            onChange={(e) => handleInlineChange(item.id, "vendor", e.target.value)}
                            className="w-full p-1 bg-amber-50/70 border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500"
                          />
                        ) : (
                          <span className="truncate block" title={item.vendor}>{item.vendor}</span>
                        )}
                      </td>
                      <td className="py-2 px-2 border-r border-slate-100 text-slate-600 min-w-[190px]">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label={`Technical specification for ${item.boqItem}`}
                            type="text"
                            value={item.techSpec}
                            onChange={(e) => handleInlineChange(item.id, "techSpec", e.target.value)}
                            className="w-full p-1 bg-amber-50/70 border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500"
                          />
                        ) : (
                          <span className="truncate block" title={item.techSpec}>{item.techSpec}</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center font-mono border-r border-slate-100 w-16 min-w-[60px]">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label={`Unit for ${item.boqItem}`}
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleInlineChange(item.id, "unit", e.target.value)}
                            className="w-full text-center font-mono p-1 bg-amber-50/70 border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500"
                          />
                        ) : (
                          item.unit
                        )}
                      </td>
                      <td className="py-2 px-2 text-right font-mono border-r border-slate-100 w-24 min-w-[90px]">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label={`Contract quantity for ${item.boqItem}`}
                            type="number"
                            value={item.contractQty}
                            onChange={(e) => handleInlineChange(item.id, "contractQty", parseFloat(e.target.value) || 0)}
                            className="w-full p-1 text-right font-mono bg-amber-50/70 border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500"
                          />
                        ) : (
                          item.contractQty.toLocaleString()
                        )}
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-bold text-amber-800 bg-amber-50/60 border-r border-slate-100 w-28 min-w-[110px]">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label={`Claimed quantity for ${item.boqItem}`}
                            type="number"
                            value={item.currentClaimedQty}
                            onChange={(e) => handleInlineChange(item.id, "currentClaimedQty", parseFloat(e.target.value) || 0)}
                            className="w-full p-1 text-right font-mono font-bold text-amber-900 bg-white border border-amber-400 rounded text-xs focus:ring-1 focus:ring-amber-500"
                          />
                        ) : (
                          item.currentClaimedQty.toLocaleString()
                        )}
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-bold text-emerald-800 bg-emerald-50/60 border-r border-slate-100 w-28 min-w-[110px]">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label={`Verified quantity for ${item.boqItem}`}
                            type="number"
                            value={item.currentVerifiedQty}
                            onChange={(e) => handleInlineChange(item.id, "currentVerifiedQty", parseFloat(e.target.value) || 0)}
                            className="w-full p-1 text-right font-mono font-bold text-emerald-900 bg-white border border-emerald-400 rounded text-xs focus:ring-1 focus:ring-emerald-500"
                          />
                        ) : (
                          item.currentVerifiedQty.toLocaleString()
                        )}
                      </td>
                      <td className="py-2 px-2 font-mono text-slate-700 border-r border-slate-100 min-w-[140px]">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label={`Material tag number for ${item.boqItem}`}
                            type="text"
                            value={item.materialTagNo}
                            onChange={(e) => handleInlineChange(item.id, "materialTagNo", e.target.value)}
                            className="w-full p-1 font-mono bg-amber-50/70 border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500"
                          />
                        ) : (
                          item.materialTagNo
                        )}
                      </td>
                      <td className="py-2 px-2 font-mono text-slate-700 border-r border-slate-100 min-w-[130px]">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label={`Drawing reference for ${item.boqItem}`}
                            type="text"
                            value={item.drawingRef}
                            onChange={(e) => handleInlineChange(item.id, "drawingRef", e.target.value)}
                            className="w-full p-1 font-mono bg-amber-50/70 border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500"
                          />
                        ) : (
                          item.drawingRef
                        )}
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-bold text-rose-700 bg-rose-50/60 border-r border-slate-100 w-24 min-w-[90px]">
                        {Math.max(0, item.currentClaimedQty - item.currentVerifiedQty).toLocaleString()}
                      </td>
                      <td className="py-2 px-2 border-r border-slate-100 min-w-[160px]">
                        {isInlineEditMode && !item.isLocked ? (
                          <select aria-label={`Verification status for ${item.boqItem}`}
                            value={item.verificationStatus}
                            onChange={(e) => handleInlineChange(item.id, "verificationStatus", e.target.value as any)}
                            className="w-full p-1 rounded text-[11px] font-bold bg-white border border-slate-300 text-slate-800"
                          >
                            <option value="Verified & Approved">Verified &amp; Approved</option>
                            <option value="Partially Verified / Pending Evidence">Partially Verified / Pending Evidence</option>
                            <option value="Discrepancy Flagged">Discrepancy Flagged</option>
                            <option value="Rejected / Non-Conforming">Rejected / Non-Conforming</option>
                          </select>
                        ) : (
                          <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                            isDiscrepancy ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {item.verificationStatus}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-[11px] leading-tight text-slate-700 min-w-[200px]">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label={`Remarks for ${item.boqItem}`}
                            type="text"
                            value={item.remarks}
                            onChange={(e) => handleInlineChange(item.id, "remarks", e.target.value)}
                            className="w-full p-1 bg-amber-50/70 border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500"
                          />
                        ) : (
                          <span className="truncate block max-w-[200px]" title={item.remarks}>{item.remarks}</span>
                        )}
                      </td>

                      {/* STICKY ACTIONS COLUMN AT THE LAST POSITION */}
                      <td className="py-2 px-2 text-center border-l border-slate-200 sticky right-0 bg-white shadow-md z-10 w-[260px] min-w-[260px] max-w-[260px]">
                        <div className="flex items-center justify-center gap-1">
                          <button aria-label="View Full Item Details"
                            onClick={() => setViewingItem(item)}
                            className="p-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#00618e] dark:text-sky-300 border border-blue-200 transition-all cursor-pointer"
                            title="View Full Item Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button aria-label="Edit Item"
                            onClick={() => setEditingItem({ ...item })}
                            disabled={item.isLocked}
                            className={`p-1 rounded-lg border transition-all cursor-pointer ${
                              item.isLocked
                                ? "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed"
                                : "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300"
                            }`}
                            title="Edit Item"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                          </button>

                          <button aria-label="Download Word Doc with IQE Header"
                            onClick={() => window.open(`${API_BASE}/api/v1/reports/docx/tpi-billing-item?boq_item=${item.boqItem}`, "_blank")}
                            className="p-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 transition-all cursor-pointer"
                            title="Download Word Doc with IQE Header"
                          >
                            <FileCode className="w-3.5 h-3.5 text-blue-600" />
                          </button>

                          <button aria-label="Download Single Row CSV"
                            onClick={() => handleExportSingleItemCSV(item)}
                            className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-all cursor-pointer"
                            title="Download Single Row CSV"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                          </button>

                          <button aria-label="Download Excel with IQE Header"
                            onClick={() => window.open(`${API_BASE}/api/v1/reports/excel/tpi-billing-item?boq_item=${item.boqItem}`, "_blank")}
                            className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-all cursor-pointer"
                            title="Download Excel with IQE Header"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-600" />
                          </button>

                          <button aria-label="Download PDF with IQE Header"
                            onClick={() => handleDownloadSinglePDF(item)}
                            className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-all cursor-pointer"
                            title="Download PDF with IQE Header"
                          >
                            <FileText className="w-3.5 h-3.5 text-rose-600" />
                          </button>

                          <button aria-label="Live Preview PDF for this item with IQE Header"
                            onClick={() => handlePreviewSinglePDF(item)}
                            className="p-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0084bf] border border-sky-200 transition-all cursor-pointer"
                            title="Live Preview PDF for this item with IQE Header"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button aria-label={item.isLocked ? "Unlock" : "Lock"}
                            onClick={() => toggleItemLock(item.id)}
                            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 border border-slate-200 transition-all cursor-pointer"
                            title={item.isLocked ? "Unlock" : "Lock"}
                          >
                            {item.isLocked ? <Lock className="w-3.5 h-3.5 text-slate-700" /> : <Unlock className="w-3.5 h-3.5 text-emerald-600" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )}

      {/* FULL EDIT MODAL (REQUISITE EDIT OPTION) */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-base text-[#003366] dark:text-sky-300">Edit Quality Verification Item</h3>
                <span className="font-mono text-xs font-bold text-[#0084bf] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {editingItem.boqItem}
                </span>
              </div>
              <button aria-label="Close" title="Close"
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label htmlFor="qbv-boq-item-code" className="font-bold text-slate-700 uppercase text-[11px]">BOQ Item Code</label>
                <input id="qbv-boq-item-code"
                  type="text"
                  value={editingItem.boqItem}
                  onChange={(e) => setEditingItem({ ...editingItem, boqItem: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="qbv-supplier-contractor" className="font-bold text-slate-700 uppercase text-[11px]">Supplier / Contractor</label>
                <input id="qbv-supplier-contractor"
                  type="text"
                  value={editingItem.vendor}
                  onChange={(e) => setEditingItem({ ...editingItem, vendor: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="qbv-item-description-material" className="font-bold text-slate-700 uppercase text-[11px]">Item Description / Material</label>
                <textarea id="qbv-item-description-material"
                  rows={2}
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="qbv-technical-spec-requirement" className="font-bold text-slate-700 uppercase text-[11px]">Technical Spec Requirement</label>
                <textarea id="qbv-technical-spec-requirement"
                  rows={2}
                  value={editingItem.techSpec}
                  onChange={(e) => setEditingItem({ ...editingItem, techSpec: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="qbv-unit" className="font-bold text-slate-700 uppercase text-[11px]">Unit</label>
                <input id="qbv-unit"
                  type="text"
                  value={editingItem.unit}
                  onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="qbv-contract-po-qty" className="font-bold text-slate-700 uppercase text-[11px]">Contract / PO Qty</label>
                <input id="qbv-contract-po-qty"
                  type="number"
                  value={editingItem.contractQty}
                  onChange={(e) => setEditingItem({ ...editingItem, contractQty: Number(e.target.value) })}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="qbv-current-claimed-qty" className="font-bold text-slate-700 uppercase text-[11px]">Current Claimed Qty</label>
                <input id="qbv-current-claimed-qty"
                  type="number"
                  value={editingItem.currentClaimedQty}
                  onChange={(e) => setEditingItem({ ...editingItem, currentClaimedQty: Number(e.target.value) })}
                  className="w-full mt-1 p-2 bg-amber-50 border border-amber-300 rounded-xl font-mono font-bold text-amber-900 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label htmlFor="qbv-current-verified-qty" className="font-bold text-slate-700 uppercase text-[11px]">Current Verified Qty</label>
                <input id="qbv-current-verified-qty"
                  type="number"
                  value={editingItem.currentVerifiedQty}
                  onChange={(e) => setEditingItem({ ...editingItem, currentVerifiedQty: Number(e.target.value) })}
                  className="w-full mt-1 p-2 bg-emerald-50 border border-emerald-300 rounded-xl font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="qbv-material-tag-heat-batch-no" className="font-bold text-slate-700 uppercase text-[11px]">Material Tag / Heat / Batch No</label>
                <input id="qbv-material-tag-heat-batch-no"
                  type="text"
                  value={editingItem.materialTagNo}
                  onChange={(e) => setEditingItem({ ...editingItem, materialTagNo: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="qbv-drawing-document-ref" className="font-bold text-slate-700 uppercase text-[11px]">Drawing / Document Ref</label>
                <input id="qbv-drawing-document-ref"
                  type="text"
                  value={editingItem.drawingRef}
                  onChange={(e) => setEditingItem({ ...editingItem, drawingRef: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="qbv-verification-status" className="font-bold text-slate-700 uppercase text-[11px]">Verification Status</label>
                <select id="qbv-verification-status"
                  value={editingItem.verificationStatus}
                  onChange={(e) => setEditingItem({ ...editingItem, verificationStatus: e.target.value as any })}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Verified & Approved">Verified & Approved</option>
                  <option value="Partially Verified / Pending Evidence">Partially Verified / Pending Evidence</option>
                  <option value="Discrepancy Flagged">Discrepancy Flagged</option>
                  <option value="Rejected / Non-Conforming">Rejected / Non-Conforming</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="qbv-remarks-and-tpi-recommendations" className="font-bold text-slate-700 uppercase text-[11px]">Remarks &amp; TPI Recommendations</label>
                <textarea id="qbv-remarks-and-tpi-recommendations"
                  rows={2}
                  value={editingItem.remarks}
                  onChange={(e) => setEditingItem({ ...editingItem, remarks: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditItem}
                className="px-5 py-2 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-4 h-4 text-sky-300" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW LINE ITEM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#003366] flex items-center justify-center text-white">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Add New QVR Line Item</h3>
                  <p className="text-[11px] text-slate-500 font-mono">Create audited measurement entry</p>
                </div>
              </div>
              <button aria-label="Close" title="Close"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="qbv-po-boq-item-code" className="font-bold text-slate-700 uppercase text-[11px]">PO / BOQ Item Code *</label>
                  <input id="qbv-po-boq-item-code"
                    type="text"
                    required
                    placeholder="e.g. BOQ-CIV-09 or PO-ITEM-04"
                    value={newItem.boqItem}
                    onChange={(e) => setNewItem({ ...newItem, boqItem: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="qbv-supplier-contractor-2" className="font-bold text-slate-700 uppercase text-[11px]">Supplier / Contractor</label>
                  <input id="qbv-supplier-contractor-2"
                    type="text"
                    value={newItem.vendor}
                    onChange={(e) => setNewItem({ ...newItem, vendor: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="qbv-item-description-scope" className="font-bold text-slate-700 uppercase text-[11px]">Item Description & Scope *</label>
                  <textarea id="qbv-item-description-scope"
                    rows={2}
                    required
                    placeholder="Detailed engineering scope & material description..."
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="qbv-technical-specification-standard" className="font-bold text-slate-700 uppercase text-[11px]">Technical Specification / Standard</label>
                  <input id="qbv-technical-specification-standard"
                    type="text"
                    placeholder="e.g. IS 456 / IS 2062 Grade E250"
                    value={newItem.techSpec}
                    onChange={(e) => setNewItem({ ...newItem, techSpec: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="qbv-unit-of-measurement" className="font-bold text-slate-700 uppercase text-[11px]">Unit of Measurement</label>
                  <input id="qbv-unit-of-measurement"
                    type="text"
                    placeholder="Cum, MT, Sqm, Nos, Mtrs"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="qbv-contract-tender-qty" className="font-bold text-slate-700 uppercase text-[11px]">Contract / Tender Qty</label>
                  <input id="qbv-contract-tender-qty"
                    type="number"
                    step="any"
                    value={newItem.contractQty}
                    onChange={(e) => setNewItem({ ...newItem, contractQty: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="qbv-prev-certified-qty" className="font-bold text-slate-700 uppercase text-[11px]">Prev. Certified Qty</label>
                  <input id="qbv-prev-certified-qty"
                    type="number"
                    step="any"
                    value={newItem.prevCertifiedQty}
                    onChange={(e) => setNewItem({ ...newItem, prevCertifiedQty: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="qbv-current-claimed-qty-2" className="font-bold text-amber-900 uppercase text-[11px]">Current Claimed Qty *</label>
                  <input id="qbv-current-claimed-qty-2"
                    type="number"
                    step="any"
                    required
                    value={newItem.currentClaimedQty}
                    onChange={(e) => setNewItem({ ...newItem, currentClaimedQty: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 p-2 bg-amber-50 border border-amber-300 rounded-xl font-mono font-bold text-amber-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label htmlFor="qbv-tpi-verified-qty" className="font-bold text-emerald-900 uppercase text-[11px]">TPI Verified Qty *</label>
                  <input id="qbv-tpi-verified-qty"
                    type="number"
                    step="any"
                    required
                    value={newItem.currentVerifiedQty}
                    onChange={(e) => setNewItem({ ...newItem, currentVerifiedQty: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 p-2 bg-emerald-50 border border-emerald-300 rounded-xl font-mono font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label htmlFor="qbv-tag-heat-batch-no" className="font-bold text-slate-700 uppercase text-[11px]">Tag / Heat / Batch No.</label>
                  <input id="qbv-tag-heat-batch-no"
                    type="text"
                    value={newItem.materialTagNo}
                    onChange={(e) => setNewItem({ ...newItem, materialTagNo: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="qbv-drawing-gfc-ref" className="font-bold text-slate-700 uppercase text-[11px]">Drawing / GFC Ref</label>
                  <input id="qbv-drawing-gfc-ref"
                    type="text"
                    value={newItem.drawingRef}
                    onChange={(e) => setNewItem({ ...newItem, drawingRef: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="qbv-verification-status-2" className="font-bold text-slate-700 uppercase text-[11px]">Verification Status</label>
                  <select id="qbv-verification-status-2"
                    value={newItem.verificationStatus}
                    onChange={(e) => setNewItem({ ...newItem, verificationStatus: e.target.value as any })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Verified & Approved">Verified &amp; Approved</option>
                    <option value="Partially Verified / Pending Evidence">Partially Verified / Pending Evidence</option>
                    <option value="Discrepancy Flagged">Discrepancy Flagged</option>
                    <option value="Rejected / Non-Conforming">Rejected / Non-Conforming</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="qbv-tpi-remarks-observations" className="font-bold text-slate-700 uppercase text-[11px]">TPI Remarks / Observations</label>
                  <input id="qbv-tpi-remarks-observations"
                    type="text"
                    value={newItem.remarks}
                    onChange={(e) => setNewItem({ ...newItem, remarks: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4 text-sky-300" />
                  <span>Add Line Item</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL VIEW MODAL (REQUISITE VIEW OPTION) */}
      {viewingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#0084bf]" />
                <span className="font-mono text-base font-extrabold text-[#0084bf]">{viewingItem.boqItem}</span>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-50 text-[#003366] dark:text-sky-300 border border-blue-200">
                  {metadata.raBillNo}
                </span>
              </div>
              <button aria-label="Close" title="Close"
                onClick={() => setViewingItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="font-extrabold text-slate-400 uppercase text-[11px]">Item Description / Material:</p>
                <p className="text-slate-800 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200 mt-1">
                  {viewingItem.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-extrabold text-slate-400 uppercase text-[11px]">Tag / Batch / Heat No:</p>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">{viewingItem.materialTagNo}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-extrabold text-slate-400 uppercase text-[11px]">Drawing / Document Ref:</p>
                  <p className="font-mono font-bold text-purple-700 mt-0.5">{viewingItem.drawingRef}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-extrabold text-slate-400 uppercase text-[11px]">Measurement Details &amp; Survey Method:</p>
                <p className="text-slate-800 mt-1">{viewingItem.measurementDetails}</p>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <p className="font-extrabold text-amber-900 uppercase text-[11px]">TPI Verification Remarks &amp; Recommendations:</p>
                <p className="text-slate-800 mt-1">{viewingItem.remarks}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap justify-end gap-2">
              <button
                onClick={() => window.open(`${API_BASE}/api/v1/reports/docx/tpi-billing-item?boq_item=${viewingItem.boqItem}`, "_blank")}
                className="px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <FileCode className="w-4 h-4 text-sky-300" />
                <span>Export Word</span>
              </button>
              <button
                onClick={() => window.open(`${API_BASE}/api/v1/reports/excel/tpi-billing-item?boq_item=${viewingItem.boqItem}`, "_blank")}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Export Excel</span>
              </button>
              <button
                onClick={() => handlePreviewSinglePDF(viewingItem)}
                className="px-3.5 py-2 rounded-xl bg-[#0084bf] hover:bg-[#0073a8] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Eye className="w-4 h-4" />
                <span>Live Preview PDF</span>
              </button>

              <button
                onClick={() => handleDownloadSinglePDF(viewingItem)}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
              <button
                onClick={() => setViewingItem(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standardized Live PDF Preview Modal */}
      <PdfPreviewModal
        isOpen={showPdfPreview}
        onClose={() => setShowPdfPreview(false)}
        formCode="FQUAL01"
        payload={{
          report_no: previewReportNo || metadata.reportNo,
          date: metadata.verificationDate || new Date().toISOString().split("T")[0],
          customer: metadata.client || selectedClient,
          project: `${metadata.project || "Biopharma API Facility"} - ${metadata.location || "Hyderabad"}`,
          epc_contractor: metadata.epcContractor,
          po_no: metadata.poWoNo,
          ra_bill_no: `${metadata.raBillNo} (Period: ${metadata.verificationPeriod})`,
          inspector: `${metadata.iqeInspector} (${metadata.discipline})`,
          items: items.map((i, idx) => {
            const diff = Math.max(0, i.currentClaimedQty - i.currentVerifiedQty);
            const estRate = 500;
            return {
              sl: idx + 1,
              boq_item: i.boqItem,
              drawing_ref: i.drawingRef,
              description: i.description,
              unit: i.unit,
              scope_qty: i.contractQty,
              claimed_qty: i.currentClaimedQty,
              verified_qty: i.currentVerifiedQty,
              diff_qty: diff,
              claimed_amt: i.currentClaimedQty * estRate,
              verified_amt: i.currentVerifiedQty * estRate,
              status: i.verificationStatus || "Approved & Verified",
            };
          }),
          total_scope_qty: totalContractQty,
          total_claimed_qty: totalClaimedQty,
          total_verified_qty: totalVerifiedQty,
          total_diff_qty: totalDiffQty,
          total_claimed_amt: totalClaimedQty * 500,
          total_verified_amt: totalVerifiedQty * 500,
        }}
        pdfUrl={previewPdfUrl}
        title={previewPdfTitle}
        reportNo={previewReportNo}
      />
    </div>
  );
}
