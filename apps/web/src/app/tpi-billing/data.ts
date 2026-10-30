// Option lists and client reference data for the TPI billing page.

import type { ClientDetails, TpiInspectionMode } from "./types";

export const TPI_MODE_LABELS: Record<TpiInspectionMode, { label: string; subLabel: string }> = {
  epc_sponsored: {
    label: "EPC / Supplier Sponsored",
    subLabel: "EPC = Client | EPC's Client = End Client",
  },
  end_client_direct: {
    label: "End Client Direct",
    subLabel: "End Client = Primary Client | EPC = Contractor under audit",
  },
  tripartite: {
    label: "Tripartite Inspection",
    subLabel: "Exclusive 3-way alignment between EPC Contractor & End Client",
  },
};

export const UNIT_OPTIONS = ["No's", "Mtrs", "Kgs", "Ltrs", "Sqm", "Cum", "Set", "LS"];
export const VARIATION_OPTIONS = ["N", "Y"];
export const HIDDEN_WORK_OPTIONS = ["N", "Y"];
export const MEASUREMENT_TYPE_OPTIONS = [
  "Joint Physical Verification",
  "Joint Concealed Work Inspection",
  "Weight Bridge Calibration & Count",
  "Surface Area & DFT Gauge Verification",
  "Ultrasonic Thickness Measurement",
  "Hydrostatic Pressure Test",
  "Bill Audit & Verification",
];
export const CLOSURE_STATUS_OPTIONS = [
  "Closed",
  "Open / Pending Correction",
  "In Progress",
  "Approved for Payment",
];

export const CLIENT_OPTIONS = [
  "Granules India Limited - Gagillapur",
  "Atom Project (New Atom Project)",
  "Suven Pharmaceuticals Ltd (Chonce Life Science)",
  "MCGM (Greater Mumbai Corp)",
  "S2 / Standard Client",
];

export const CLIENT_DETAILS_MAP: Record<string, ClientDetails> = {
  "Granules India Limited - Gagillapur": {
    projectName: "Granules Gagillapur Maintenance & Project Expansion",
    projectLocation: "Gagillapur Plant, Hyderabad, Telangana",
    vendor: "JB Fabricator / Devi Sri Civil",
    contractRef: "GIL/GAG/2025/TPI-1710",
    poNumber: "WO-3400077675/18.08.25",
    poDate: "2025-10-17",
    endClient: "Granules India Limited (Asset Owner)",
    epcContractor: "Devi Sri Civil & Painting",
    supplierVendor: "JB Fabricator / Maruthi Engg / D Seva Singh / Triveni",
  },
  "Atom Project (New Atom Project)": {
    projectName: "New Atom Process Facility Pkg 01",
    projectLocation: "Atom Site Industrial Zone, India",
    vendor: "Quality Engineers (I) Pvt Ltd",
    contractRef: "ATOM/PKG01/2026/TPI-9901",
    poNumber: "PO-ATOM-2026-88120",
    poDate: "2026-05-14",
    endClient: "Atom Process Energy Asset Owner",
    epcContractor: "Larsen & Toubro Ltd - Infra Div",
    supplierVendor: "Apex Heavy Engg Corp",
  },
  "Suven Pharmaceuticals Ltd (Chonce Life Science)": {
    projectName: "Suven C.Tank Civil & Scaffolding Works",
    projectLocation: "Chonce Life Science Plant, Suryapet, TS",
    vendor: "SV Enterprises",
    contractRef: "SUVEN/CIVIL/2025/TPI-4443",
    poNumber: "PO-SUVEN-50054",
    poDate: "2025-12-13",
    endClient: "Suven Pharmaceuticals Ltd (Asset Owner)",
    epcContractor: "SVS CONSTRUCTIONS",
    supplierVendor: "SV Enterprises",
  },
  "MCGM (Greater Mumbai Corp)": {
    projectName: "Mumbai Coastal Road Pkg 03",
    projectLocation: "Worli-Nariman Corridor, Mumbai, MH",
    vendor: "Larsen & Toubro Ltd - Infra Div",
    contractRef: "MCGM/CWD/2024/TPI-8892",
    poNumber: "PO-MCGM-2024-99812",
    poDate: "2024-04-15",
    endClient: "Municipal Corporation of Greater Mumbai",
    epcContractor: "Larsen & Toubro Ltd - Infra Div",
    supplierVendor: "Shapoorji Pallonji Engineering",
  },
  "S2 / Standard Client": {
    projectName: "Standard Industrial Facility Pkg 01",
    projectLocation: "Industrial Zone Phase 2, India",
    vendor: "Tata Projects Infrastructure",
    contractRef: "S2/STD/2024/TPI-1010",
    poNumber: "PO-S2-2024-10100",
    poDate: "2024-05-15",
    endClient: "S2 Standard Asset Owner",
    epcContractor: "Tata Projects Infrastructure",
    supplierVendor: "Apex Heavy Engg Corp",
  },
};

export const CLIENT_VENDOR_MAP: Record<string, string[]> = {
  "Granules India Limited - Gagillapur": [
    "JB Fabricator",
    "Devi sri (Painting)",
    "Devi sri(Civil)",
    "Maruthi Engg",
    "D Seva singh",
    "VSV Engg",
    "AG Projects",
    "Sri Lakshmi Co",
    "Rama Flag",
    "Triveni Insulation",
  ],
  "Atom Project (New Atom Project)": [
    "Quality Engineers (I) Pvt Ltd",
    "Larsen & Toubro Ltd - Infra Div",
    "Apex Heavy Engg Corp",
  ],
  "Suven Pharmaceuticals Ltd (Chonce Life Science)": [
    "SV Enterprises",
    "SVS CONSTRUCTIONS",
  ],
  "MCGM (Greater Mumbai Corp)": [
    "Larsen & Toubro Ltd - Infra Div",
    "Shapoorji Pallonji Engineering",
  ],
  "S2 / Standard Client": [
    "Tata Projects Infrastructure",
    "Sterling & Wilson Renewable",
    "Thermax Quality Systems",
    "Apex Heavy Engg Corp",
  ],
};

export const VENDOR_OPTIONS = [
  "Larsen & Toubro Ltd - Infra Div",
  "Shapoorji Pallonji Engineering",
  "Tata Projects Infrastructure",
  "Sterling & Wilson Renewable",
  "Thermax Quality Systems",
  "Apex Heavy Engg Corp",
  "JB Fabricator",
  "Devi sri(Civil)",
  "D Seva singh",
  "Triveni Insulation",
];
