// Types for the TPI billing page.

export type TpiInspectionMode = "epc_sponsored" | "end_client_direct" | "tripartite";

export interface ClientDetails {
  projectName: string;
  projectLocation: string;
  vendor: string;
  contractRef: string;
  poNumber: string;
  poDate: string;
  endClient: string;
  epcContractor: string;
  supplierVendor: string;
}

export interface BillItem {
  id: number;
  slNo: number;
  raBill: string;
  date: string;
  vendor: string;
  boqItem: string;
  description: string;
  unit: string;
  gfcDrawingRef: string;
  boqQty: number;
  prevCertifiedQty: number;
  contractorClaimedQty: number;
  tpiVerifiedQty: number;
  unitRate: number;
  isVariation: "Y" | "N";
  variationRef: string;
  contractClause: string;
  isHiddenWork: "Y" | "N";
  measurementType: string;
  observation: string;
  actionRequired: string;
  targetDate: string;
  closureStatus: "Closed" | "Open / Pending Correction" | "In Progress" | "Approved for Payment";
  attachments: string[];
  isLocked?: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  itemId: number;
  boqItem: string;
  field: string;
  oldValue: any;
  newValue: any;
  userRole: string;
  reason: string;
}
