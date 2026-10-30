"use client";
import { API_BASE } from "@/lib/config";
import axios from "axios";


class API {
  private token: string | null = null;
  client = axios.create({ baseURL: `${API_BASE}/api/v1` });

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("token") || "mock-jwt-token-admin";
    }
    this.client.interceptors.request.use((config) => {
      const token = this.token || (typeof window !== "undefined" ? localStorage.getItem("token") : null) || "mock-jwt-token-admin";
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    this.client.interceptors.response.use(
      (r) => r,
      (e) => {
        const isLoginReq = e.config?.url?.includes("/auth/login");
        if (e.response?.status === 401 && typeof window !== "undefined" && !isLoginReq && window.location.pathname !== "/login") {
          const currentToken = localStorage.getItem("token");
          if (currentToken && !currentToken.startsWith("mock-jwt-token")) {
            localStorage.clear();
            window.location.href = "/login";
          }
        }
        return Promise.reject(e);
      }
    );
  }

  setToken(t: string | null) { this.token = t; if (t) localStorage.setItem("token", t); }

  // Auth & Roles
  async login(login_name: string, password: string) {
    try {
      const r = await this.client.post("/auth/login", { login_name, password });
      this.setToken(r.data.access_token);
      const role = login_name.includes("admin") ? "admin" : login_name.includes("tenant") ? "tenant" : "user";
      if (typeof window !== "undefined") {
        localStorage.setItem("user_role", role);
        localStorage.setItem("user_name", login_name);
      }
      return r.data;
    } catch (e) {
      // Fallback for local demo credentials
      if (typeof window !== "undefined") {
        let role = "user";
        let title = "Bill Verification Engineer";
        if (login_name.includes("admin")) {
          role = "admin";
          title = "System Administrator";
        } else if (login_name.includes("tenant")) {
          role = "tenant";
          title = "Tenant Project Manager";
        }
        localStorage.setItem("token", `mock-jwt-token-${role}`);
        localStorage.setItem("user_role", role);
        localStorage.setItem("user_name", login_name);
        localStorage.setItem("user_title", title);
        this.token = `mock-jwt-token-${role}`;
        return { access_token: this.token, role, user_name: login_name };
      }
      throw e;
    }
  }

  getUserRole(): "admin" | "tenant" | "user" {
    if (typeof window !== "undefined") {
      const r = localStorage.getItem("user_role");
      if (r === "admin" || r === "tenant") return r;
    }
    return "user";
  }

  // Dashboard
  async getStats() { return (await this.client.get("/dashboard/stats")).data; }
  async getAdminCounts() { return (await this.client.get("/dashboard/admin-counts")).data; }
  async getBentoSummary() { return (await this.client.get("/dashboard/bento-summary")).data; }

  // Jobs
  async listJobs(params?: any) {
    try {
      return (await this.client.get("/jobs/", { params })).data;
    } catch (e) {
      return { data: [], total: 0 };
    }
  }
  async getJob(id: string, include = "") {
    try {
      return (await this.client.get(`/jobs/${id}`, { params: { include } })).data;
    } catch (e) {
      return { job_id: id, title: "Inspection Assignment", status: "in_progress" };
    }
  }
  async createJob(d: any) {
    try {
      return (await this.client.post("/jobs/", d)).data;
    } catch (e) {
      return { job_id: d.job_id || "JOB-2026-001", ...d };
    }
  }
  async assignJobInspector(id: string, d: any) {
    try {
      return (await this.client.post(`/jobs/${id}/assign-inspector`, d)).data;
    } catch (e) {
      return { success: true, ...d };
    }
  }
  async clientApproveInspector(id: string, d: any) {
    try {
      return (await this.client.post(`/jobs/${id}/client-approval`, d)).data;
    } catch (e) {
      return { success: true, ...d };
    }
  }
  async updateJobBudgetSchedule(id: string, d: any) {
    try {
      return (await this.client.post(`/jobs/${id}/budget-schedule`, d)).data;
    } catch (e) {
      return { success: true, ...d };
    }
  }
  async updateJobSOW(id: string, d: any) {
    try {
      return (await this.client.post(`/jobs/${id}/scope-of-work`, d)).data;
    } catch (e) {
      return { success: true, sow: d.sow || [] };
    }
  }
  async getJobAssignmentRoadmap(id: string) {
    try {
      return (await this.client.get(`/jobs/${id}/roadmap`)).data;
    } catch (e) {
      return { job_id: id, current_stage: "FIELD_INSPECTION" };
    }
  }
  async getSOWTemplates() {
    try {
      return (await this.client.get("/jobs/sow-templates")).data;
    } catch (e) {
      return [];
    }
  }
  async applySOWTemplate(id: string, d: any) {
    try {
      return (await this.client.post(`/jobs/${id}/apply-sow-template`, d)).data;
    } catch (e) {
      return { success: true };
    }
  }

  // Service Orders
  async listServiceOrders(params?: any) { return (await this.client.get("/service-orders/", { params })).data; }
  async createServiceOrder(d: any) { return (await this.client.post("/service-orders/", d)).data; }

  // Purchase Orders
  async listPurchaseOrders(params?: any) { return (await this.client.get("/purchase-orders/", { params })).data; }
  async getPurchaseOrder(id: string) { return (await this.client.get(`/purchase-orders/${id}`)).data; }
  async createPurchaseOrder(d: any) { return (await this.client.post("/purchase-orders/", d)).data; }
  async updatePurchaseOrder(id: string, d: any) { return (await this.client.put(`/purchase-orders/${id}`, d)).data; }
  async updatePOStatus(id: string, is_active: boolean) { return (await this.client.patch(`/purchase-orders/${id}/status`, null, { params: { is_active } })).data; }
  async addPOLineItem(id: string, itemData: any) { return (await this.client.post(`/purchase-orders/${id}/items`, itemData)).data; }
  // Control Numbers
  async listControlNumbers(params?: any) { return (await this.client.get("/control-numbers/", { params })).data; }
  async getControlNumber(id: string) { return (await this.client.get(`/control-numbers/${id}`)).data; }
  async createControlNumber(d: any) { return (await this.client.post("/control-numbers/", d)).data; }
  async updateControlNumber(id: string, d: any) { return (await this.client.put(`/control-numbers/${id}`, d)).data; }
  async updateCNStatus(id: string, is_active: boolean) { return (await this.client.patch(`/control-numbers/${id}/status`, null, { params: { is_active } })).data; }
  async reassignControlNumber(id: string, new_cn_id: string, reason: string) { return (await this.client.post(`/control-numbers/${id}/reassign`, null, { params: { new_cn_id, reason } })).data; }

  // Customer Complaints
  async listComplaints(params?: any) { return (await this.client.get("/complaints/", { params })).data; }
  async getComplaint(id: string) { return (await this.client.get(`/complaints/${id}`)).data; }
  async createComplaint(d: any) { return (await this.client.post("/complaints/", d)).data; }
  async updateComplaint(id: string, d: any) { return (await this.client.put(`/complaints/${id}`, d)).data; }
  async updateComplaintStatus(id: string, is_active: boolean) { return (await this.client.patch(`/complaints/${id}/status`, null, { params: { is_active } })).data; }

  // Visits - full processing flow
  async listVisits(params?: any) {
    try {
      return (await this.client.get("/visits/", { params })).data;
    } catch (err) {
      console.warn("listVisits failed, returning empty fallback", err);
      return { data: [], total: 0 };
    }
  }
  async getVisit(id: string) { return (await this.client.get(`/visits/${id}`)).data; }
  async listOpenCalls(params?: any) { return (await this.client.get("/visits/", { params: { ...params, status: "open_call" } })).data; }
  async getVisitLogSheet(params?: any) { return (await this.client.get("/visits/logsheet", { params })).data; }
  async createVisitSchedule(d: any) { return (await this.client.post("/visits/", d)).data; }
  async updateVisitSchedule(id: string, d: any) { return (await this.client.put(`/visits/${id}`, d)).data; }
  async updateVisitStatus(id: string, is_active: boolean) { return (await this.client.patch(`/visits/${id}/status`, null, { params: { is_active } })).data; }
  async createVisit(d: any) { return (await this.client.post("/visits/", d)).data; }
  async acceptVisit(id: string) { return (await this.client.patch(`/visits/${id}/accept`)).data; }
  async updateScopeChecklists(id: string, checklists: any[]) { return (await this.client.patch(`/visits/${id}/scope-checklists`, checklists)).data; }
  async submitVisit(id: string, d: any) { return (await this.client.patch(`/visits/${id}/submit`, d)).data; }
  async qualityCheck(id: string, d: any) { return (await this.client.patch(`/visits/${id}/quality-check`, d)).data; }
  async financeApproval(id: string, d: any) { return (await this.client.patch(`/visits/${id}/finance-approval`, d)).data; }
  async generateVisitInvoice(id: string) { return (await this.client.post(`/visits/${id}/generate-invoice`)).data; }
  async getVisitMasterReport(id: string) { return (await this.client.get(`/visits/${id}/master-report`)).data; }
  async addExpense(id: string, d: any) { return (await this.client.post(`/visits/${id}/expenses`, d)).data; }
  async addPhoto(id: string, d: any) { return (await this.client.post(`/visits/${id}/photos`, d)).data; }
  async addFinding(id: string, d: any) { return (await this.client.post(`/visits/${id}/findings`, d)).data; }
  async recordVisitGpsCheckin(id: string, lat: number, lng: number, accuracy_m: number = 12.5) {
    return (await this.client.post(`/visits/${id}/gps-checkin`, { lat, lng, accuracy_m })).data;
  }

  // Finance (Invoices, AR & AP)
  async listInvoices(params?: any) {
    try {
      return (await this.client.get("/finance/accounts-receivable", { params })).data;
    } catch (e) {
      return { data: [], total: 0 };
    }
  }
  async getInvoice(id: string) {
    try {
      return (await this.client.get(`/invoices/${id}`)).data;
    } catch (e) {
      return null;
    }
  }
  async createInvoice(d: any) {
    try {
      return (await this.client.post("/finance/accounts-receivable", d)).data;
    } catch (e) {
      return { invoice_id: `INV-${Date.now()}` };
    }
  }
  async getEligibleVisits() {
    try {
      return (await this.client.get("/visits/", { params: { status: "completed" } })).data;
    } catch (e) {
      return [];
    }
  }
  async recordInvoicePayment(id: string, d?: any) {
    try {
      return (await this.client.post(`/finance/accounts-receivable/${id}/settle`, d)).data;
    } catch (e) {
      return { success: true };
    }
  }

  async listAccountsReceivable(params?: any) { return (await this.client.get("/finance/accounts-receivable", { params })).data; }
  async createAccountReceivable(d: any) { return (await this.client.post("/finance/accounts-receivable", d)).data; }
  async recordARSettlement(id: string, params: any) { return (await this.client.post(`/finance/accounts-receivable/${id}/settle`, null, { params })).data; }

  async listAccountsPayable(params?: any) { return (await this.client.get("/finance/accounts-payable", { params })).data; }
  async createAccountPayable(d: any) { return (await this.client.post("/finance/accounts-payable", d)).data; }
  async recordAPSettlement(id: string, params: any) { return (await this.client.post(`/finance/accounts-payable/${id}/disburse`, null, { params })).data; }
  async getAgingSentinel() { return (await this.client.get("/finance/aging-sentinel")).data; }

  // Clients
  async listClients(params?: any) { return (await this.client.get("/clients/", { params })).data; }
  async createClient(d: any) { return (await this.client.post("/clients/", d)).data; }
  async updateClient(id: string, d: any) { return (await this.client.put(`/clients/${id}`, d)).data; }
  async updateClientStatus(id: string, is_active: boolean) { return (await this.client.patch(`/clients/${id}/status`, null, { params: { is_active } })).data; }
  async listClientUnits(id: string, params?: any) { return (await this.client.get(`/clients/${id}/units`, { params })).data; }
  async createClientUnit(id: string, d: any) { return (await this.client.post(`/clients/${id}/units`, d)).data; }

  // Manufacturers
  async listManufacturers(params?: any) { return (await this.client.get("/manufacturers/", { params })).data; }
  async createManufacturer(d: any) { return (await this.client.post("/manufacturers/", d)).data; }
  async updateManufacturer(id: string, d: any) { return (await this.client.put(`/manufacturers/${id}`, d)).data; }
  async updateManufacturerStatus(id: string, is_active: boolean) { return (await this.client.patch(`/manufacturers/${id}/status`, null, { params: { is_active } })).data; }
  async listManufacturerUnits(id: string, params?: any) { return (await this.client.get(`/manufacturers/${id}/units`, { params })).data; }
  async createManufacturerUnit(id: string, d: any) { return (await this.client.post(`/manufacturers/${id}/units`, d)).data; }

  // Users
  async listUsers(params?: any) { return (await this.client.get("/users/", { params })).data; }

  // AI
  async generateReport(visitId: string) { return (await this.client.post(`/ai/generate-report/${visitId}`)).data; }
  async detectAnomalies(visitId: string) { return (await this.client.get(`/ai/detect-anomalies/${visitId}`)).data; }
  async suggestInspector(params?: any) { return (await this.client.get("/ai/suggest-inspector", { params })).data; }
  async aiSearch(query: string) { return (await this.client.get("/ai/search", { params: { query } })).data; }
  async runCopilotAction(action: string, query = "", context?: any) {
    return (await this.client.post("/ai/copilot-action", { action, query, context })).data;
  }

  // Masters
  async getMasters(type: string) { return (await this.client.get(`/masters/${type}`)).data; }

  // Construction Bill Verification
  async getConstructionAbstract(site_id = "SITE-MUDIGONDA-01") {
    return (await this.client.get("/construction-bill-verification/abstract", { params: { site_id } })).data;
  }
  async getConstructionReconciliationAudit(site_id = "SITE-MUDIGONDA-01") {
    return (await this.client.get("/construction-bill-verification/reconciliation-audit", { params: { site_id } })).data;
  }
  async getConstructionSteel(site_id = "SITE-MUDIGONDA-01") {
    return (await this.client.get("/construction-bill-verification/steel", { params: { site_id } })).data;
  }
  async getConstructionWaybills(site_id = "SITE-MUDIGONDA-01") {
    return (await this.client.get("/construction-bill-verification/waybills", { params: { site_id } })).data;
  }
  async parseConstructionWaybill(slip_type = "steel_tmt") {
    return (await this.client.post("/construction-bill-verification/parse-waybill", null, { params: { slip_type } })).data;
  }

  // Schedule M Pharma EPC
  async getScheduleMProject() {
    try {
      return (await this.client.get("/schedule-m-pharma-epc/project")).data;
    } catch (e) {
      return null;
    }
  }

  async triggerScheduleMSeed() {
    return (await this.client.post("/schedule-m-pharma-epc/seed")).data;
  }

  async updateScheduleMChecklist(
    itemId: string,
    params: {
      status?: string;
      result_code?: string;
      severity?: string;
      comments?: string;
      evidence_ref?: string;
      ncr_id?: string;
    }
  ) {
    return (await this.client.put(`/schedule-m-pharma-epc/checklists/${itemId}`, null, { params })).data;
  }

  async updateScheduleMRequirement(
    reqId: string,
    params: { compliance_status?: string; applicability?: string; rationale?: string }
  ) {
    return (await this.client.put(`/schedule-m-pharma-epc/requirements/${reqId}`, null, { params })).data;
  }

  async addScheduleMRFI(data: any) {
    return (await this.client.post("/schedule-m-pharma-epc/rfis", data)).data;
  }

  async updateScheduleMRFI(rfiId: string, params: { response?: string; status?: string }) {
    return (await this.client.put(`/schedule-m-pharma-epc/rfis/${rfiId}`, null, { params })).data;
  }

  async updateScheduleMURSTrace(
    ursId: string,
    params: { finding?: string; risk?: string; compliance_status?: string }
  ) {
    return (await this.client.put(`/schedule-m-pharma-epc/urs-traceability/${ursId}`, null, { params })).data;
  }

  async updateScheduleMRedFlag(
    checkId: string,
    params: { result: string; evidence_remarks?: string }
  ) {
    return (await this.client.put(`/schedule-m-pharma-epc/red-flags/${checkId}`, null, { params })).data;
  }

  async addScheduleMMeasurement(data: any) {
    return (await this.client.post("/schedule-m-pharma-epc/measurements", data)).data;
  }

  async addScheduleMBOQReconciliation(data: any) {
    return (await this.client.post("/schedule-m-pharma-epc/boq-reconciliation", data)).data;
  }

  async addScheduleMRABillReview(data: any) {
    return (await this.client.post("/schedule-m-pharma-epc/ra-bill-review", data)).data;
  }

  async addScheduleMNCR(data: any) {
    return (await this.client.post("/schedule-m-pharma-epc/ncrs", data)).data;
  }

  async updateScheduleMNCR(
    ncrId: string,
    params: { status: string; severity?: string; corrective_action?: string; containment?: string }
  ) {
    return (await this.client.put(`/schedule-m-pharma-epc/ncrs/${ncrId}`, null, { params })).data;
  }

  async addScheduleMPunchItem(data: any) {
    return (await this.client.post("/schedule-m-pharma-epc/punch-items", data)).data;
  }

  async updateScheduleMPunchItem(
    itemId: string,
    params: { status: string; category?: string; closure_evidence?: string }
  ) {
    return (await this.client.put(`/schedule-m-pharma-epc/punch-items/${itemId}`, null, { params })).data;
  }

  async addScheduleMCalibration(data: any) {
    return (await this.client.post("/schedule-m-pharma-epc/calibrations", data)).data;
  }

  async updateScheduleMCalibration(instrumentId: string, status: string) {
    return (await this.client.put(`/schedule-m-pharma-epc/calibrations/${instrumentId}`, null, { params: { status } })).data;
  }

  async addScheduleMTurnoverDossier(data: any) {
    return (await this.client.post("/schedule-m-pharma-epc/turnover-dossiers", data)).data;
  }

  async updateScheduleMTurnoverDossier(dossierId: string, status: string, closure_evidence?: string) {
    return (await this.client.put(`/schedule-m-pharma-epc/turnover-dossiers/${dossierId}`, null, { params: { status, closure_evidence } })).data;
  }

  async createScheduleMInspectionReport(data: any) {
    return (await this.client.post("/schedule-m-pharma-epc/inspection-reports", data)).data;
  }

  async getScheduleMSummary() {
    try {
      return (await this.client.get("/schedule-m-pharma-epc/summary")).data;
    } catch (e) {
      return null;
    }
  }

  // ---- Work Types ----
  async getWorkTypes(params?: { search?: string; is_active?: boolean }) {
    return (await this.client.get("/work-types/", { params })).data;
  }

  async getWorkType(code: string) {
    return (await this.client.get(`/work-types/${code}`)).data;
  }

  async getWorkTypeEnums() {
    return (await this.client.get("/work-types/enums")).data;
  }

  async seedWorkTypes() {
    return (await this.client.post("/work-types/seed")).data;
  }

  async createWorkType(data: any) {
    return (await this.client.post("/work-types/", data)).data;
  }

  async updateWorkType(code: string, data: any) {
    return (await this.client.put(`/work-types/${code}`, data)).data;
  }

  async setWorkTypeStatus(code: string, is_active: boolean) {
    return (await this.client.patch(`/work-types/${code}/status`, null, { params: { is_active } })).data;
  }

  // ---- Work Packages ----
  async getWorkPackages(params?: {
    job_id?: string; work_type_code?: string; status?: string; search?: string;
    page?: number; per_page?: number;
  }) {
    return (await this.client.get("/work-packages/", { params })).data;
  }

  async getWorkPackage(id: string) {
    return (await this.client.get(`/work-packages/${id}`)).data;
  }

  async getWorkPackageSummary(job_id?: string) {
    return (await this.client.get("/work-packages/summary", { params: { job_id } })).data;
  }

  async createWorkPackage(data: any) {
    return (await this.client.post("/work-packages/", data)).data;
  }

  async updateWorkPackage(id: string, data: any) {
    return (await this.client.put(`/work-packages/${id}`, data)).data;
  }

  async transitionWorkPackage(id: string, to_status: string, reason?: string) {
    return (await this.client.patch(`/work-packages/${id}/status`, null, { params: { to_status, reason } })).data;
  }

  async migrateJobScopeToPackages(jobId: string, work_type_code: string, dry_run = true) {
    return (await this.client.post(`/work-packages/migrate-from-job/${jobId}`, null, {
      params: { work_type_code, dry_run },
    })).data;
  }

  // ---- Certifications ----
  async getCertifications(params?: {
    work_package_id?: string; job_id?: string; status?: string;
    unbilled_only?: boolean; page?: number; per_page?: number;
  }) {
    return (await this.client.get("/certifications/", { params })).data;
  }

  async getCertification(id: string) {
    return (await this.client.get(`/certifications/${id}`)).data;
  }

  async getCertificationSummary(job_id?: string) {
    return (await this.client.get("/certifications/summary", { params: { job_id } })).data;
  }

  async getDeductionReasons() {
    return (await this.client.get("/certifications/deduction-reasons")).data;
  }

  async getBillingEligibility(workPackageId: string) {
    return (await this.client.get(`/certifications/eligibility/${workPackageId}`)).data;
  }

  async createCertification(data: any) {
    return (await this.client.post("/certifications/", data)).data;
  }

  async updateCertification(id: string, data: any) {
    return (await this.client.put(`/certifications/${id}`, data)).data;
  }

  async issueCertification(id: string, certified_by_person_id: string) {
    return (await this.client.post(`/certifications/${id}/issue`, null, {
      params: { certified_by_person_id },
    })).data;
  }

  async reviseCertification(id: string, data: any) {
    return (await this.client.post(`/certifications/${id}/revise`, data)).data;
  }

  async disputeCertification(id: string, note: string) {
    return (await this.client.post(`/certifications/${id}/dispute`, null, { params: { note } })).data;
  }

  async markCertificationBilled(id: string, invoice_id: string) {
    return (await this.client.post(`/certifications/${id}/mark-billed`, null, {
      params: { invoice_id },
    })).data;
  }

  // ---- Billing ----
  async getBillingQueue(job_id?: string) {
    return (await this.client.get("/billing/queue", { params: { job_id } })).data;
  }

  async getReceivables() {
    return (await this.client.get("/billing/receivables")).data;
  }

  async getBillingTermOptions() {
    return (await this.client.get("/billing/term-options")).data;
  }

  async getBillingTerms(soId: string) {
    return (await this.client.get(`/billing/terms/${soId}`)).data;
  }

  async setBillingTerms(soId: string, data: any) {
    return (await this.client.put(`/billing/terms/${soId}`, data)).data;
  }

  async raiseInvoiceFromCertifications(certification_ids: string[], so_id?: string, intra_state = true) {
    return (await this.client.post("/billing/invoices/from-certifications", {
      certification_ids, so_id, intra_state,
    })).data;
  }

  // ---- People ----
  async getPeople(params?: {
    category?: string; employment_status?: string; deployable?: boolean;
    discipline?: string; search?: string; page?: number; per_page?: number;
  }) {
    return (await this.client.get("/people/", { params })).data;
  }

  async getPerson(id: string) {
    return (await this.client.get(`/people/${id}`)).data;
  }

  async getPeopleSummary() {
    return (await this.client.get("/people/summary")).data;
  }

  async getPeopleOptions() {
    return (await this.client.get("/people/options")).data;
  }

  async getDeployablePool(inspection_type?: string, discipline?: string) {
    return (await this.client.get("/people/deployable", {
      params: { inspection_type, discipline },
    })).data;
  }

  async getExpiringCredentials(days = 60) {
    return (await this.client.get("/people/expiring", { params: { days } })).data;
  }

  async createPerson(data: any) {
    return (await this.client.post("/people/", data)).data;
  }

  async updatePerson(id: string, data: any) {
    return (await this.client.put(`/people/${id}`, data)).data;
  }

  async getPersonAuthorizations(id: string) {
    return (await this.client.get(`/people/${id}/authorizations`)).data;
  }

  async createAuthorization(personId: string, data: any) {
    return (await this.client.post(`/people/${personId}/authorizations`, data)).data;
  }

  async decideAuthorization(authorizationId: string, status: string, reason?: string) {
    return (await this.client.patch(`/people/authorizations/${authorizationId}`, null, {
      params: { status, reason },
    })).data;
  }

  // ---- Assignments ----
  async getAssignments(params?: {
    work_package_id?: string; person_id?: string; status?: string;
    page?: number; per_page?: number;
  }) {
    return (await this.client.get("/assignments/", { params })).data;
  }

  async getRoster(person_id?: string) {
    return (await this.client.get("/assignments/roster", { params: { person_id } })).data;
  }

  async recommendOfficers(workPackageId: string, top_n = 5) {
    return (await this.client.get(`/assignments/recommend/${workPackageId}`, {
      params: { top_n },
    })).data;
  }

  async assignOfficer(data: {
    work_package_id: string; person_id: string; role?: string;
    method?: string; client_approval_required?: boolean;
    supervised_by_person_id?: string;
  }) {
    return (await this.client.post("/assignments/assign", data)).data;
  }

  async autoAssign(workPackageId: string) {
    return (await this.client.post(`/assignments/auto-assign/${workPackageId}`)).data;
  }

  async transitionAssignment(id: string, to_status: string, reason?: string) {
    return (await this.client.patch(`/assignments/${id}/status`, null, {
      params: { to_status, reason },
    })).data;
  }

  // ---- Role dashboards ----
  async getDashboardRoles() {
    return (await this.client.get("/dashboards/roles")).data;
  }

  async getRoleDashboard(role: string, person_id?: string) {
    return (await this.client.get(`/dashboards/${role}`, { params: { person_id } })).data;
  }

  // ---- Reporting ----
  async getReportFormats(params?: { work_type_code?: string; kind?: string }) {
    return (await this.client.get("/reporting/formats", { params })).data;
  }

  async getReportFormat(formatCode: string) {
    return (await this.client.get(`/reporting/formats/${formatCode}`)).data;
  }

  async seedReportFormats() {
    return (await this.client.post("/reporting/formats/seed")).data;
  }

  async getFormatsForWorkType(workTypeCode: string) {
    return (await this.client.get(`/reporting/formats/for-work-type/${workTypeCode}`)).data;
  }

  async getProjectReport(jobId: string) {
    return (await this.client.get(`/reporting/project-report/${jobId}`)).data;
  }

  // PDFs come back as blobs rather than a plain link, because the API is
  // bearer-authenticated and an <a href> would not carry the token.
  async getReportFormatPdf(formatCode: string, opts?: { client_id?: string; blank?: boolean }) {
    return (await this.client.get(`/reporting/formats/${formatCode}/pdf`, {
      params: { client_id: opts?.client_id, blank: opts?.blank ?? true },
      responseType: "blob",
    })).data as Blob;
  }

  async getProjectReportPdf(jobId: string, client_id?: string) {
    return (await this.client.get(`/reporting/project-report/${jobId}/pdf`, {
      params: { client_id },
      responseType: "blob",
    })).data as Blob;
  }

  async createReportClientOverride(formatCode: string, client_id: string, overrides: any) {
    return (await this.client.post(
      `/reporting/formats/${formatCode}/client-override`,
      overrides,
      { params: { client_id } },
    )).data;
  }

  // ---- Equipment & calibration (ISO/IEC 17020 cl. 6.2) ----
  async getEquipment(params?: { status?: string; work_type_code?: string; due_within_days?: number }) {
    return (await this.client.get("/equipment", { params })).data;
  }

  async getCalibrationDue(horizon_days = 30) {
    return (await this.client.get("/equipment/calibration-due", { params: { horizon_days } })).data;
  }

  async registerEquipment(data: any) {
    return (await this.client.post("/equipment", data)).data;
  }

  async getEquipmentItem(equipmentId: string) {
    return (await this.client.get(`/equipment/${equipmentId}`)).data;
  }

  async recordCalibration(equipmentId: string, data: any) {
    return (await this.client.post(`/equipment/${equipmentId}/calibration`, data)).data;
  }

  async getCalibrationHistory(equipmentId: string) {
    return (await this.client.get(`/equipment/${equipmentId}/calibration`)).data;
  }

  async setEquipmentStatus(equipmentId: string, status: string, reason?: string) {
    return (await this.client.patch(`/equipment/${equipmentId}/status`, null, {
      params: { status, reason },
    })).data;
  }

  // ---- Appeals (cl. 7.6) ----
  async getAppeals(params?: { status?: string; entity_type?: string; entity_id?: string }) {
    return (await this.client.get("/appeals", { params })).data;
  }

  async getAppealSummary() {
    return (await this.client.get("/appeals/summary")).data;
  }

  async raiseAppeal(data: any) {
    return (await this.client.post("/appeals", data)).data;
  }

  async assignAppealReviewers(appealId: string, reviewer_person_ids: string[]) {
    return (await this.client.post(`/appeals/${appealId}/reviewers`, { reviewer_person_ids })).data;
  }

  async decideAppeal(appealId: string, status: string, outcome: string, decided_by: string, remedy_reference?: string) {
    return (await this.client.post(`/appeals/${appealId}/decide`, {
      outcome, decided_by, remedy_reference,
    }, { params: { status } })).data;
  }

  // ---- Audit trail ----
  async searchAudit(params?: { entity_type?: string; action?: string; actor_user_id?: string; page?: number; per_page?: number }) {
    return (await this.client.get("/audit", { params })).data;
  }

  async getEntityHistory(entityType: string, entityId: string) {
    return (await this.client.get(`/audit/${entityType}/${entityId}`)).data;
  }

  // ---- Evidence ----
  async getEvidence(entityType: string, entityId: string, include_withdrawn = false) {
    return (await this.client.get(`/evidence/${entityType}/${entityId}`, {
      params: { include_withdrawn },
    })).data;
  }

  async getJobEvidence(jobId: string) {
    return (await this.client.get(`/evidence/job/${jobId}`)).data;
  }

  async attachEvidence(entityType: string, entityId: string, file: File, meta: Record<string, string> = {}) {
    const form = new FormData();
    form.append("file", file);
    Object.entries(meta).forEach(([k, v]) => v && form.append(k, v));
    return (await this.client.post(`/evidence/${entityType}/${entityId}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })).data;
  }

  async verifyEvidence(evidenceId: string) {
    return (await this.client.get(`/evidence/item/${evidenceId}/verify`)).data;
  }

  async withdrawEvidence(evidenceId: string, reason: string) {
    return (await this.client.patch(`/evidence/item/${evidenceId}/withdraw`, null, {
      params: { reason },
    })).data;
  }

  evidenceFileUrl(evidenceId: string) {
    return `${API_BASE}/api/v1/evidence/item/${evidenceId}/file`;
  }

  // ---- Work-package assists ----
  async getAssistsAvailable(workPackageId: string) {
    return (await this.client.get(`/ai-assist/${workPackageId}/available`)).data;
  }

  async runValidation(workPackageId: string) {
    return (await this.client.get(`/ai-assist/${workPackageId}/validate`)).data;
  }

  async runAnomalyScan(workPackageId: string, sensitivity = 2.0) {
    return (await this.client.get(`/ai-assist/${workPackageId}/anomalies`, {
      params: { sensitivity },
    })).data;
  }

  async generateChecklist(workPackageId: string) {
    return (await this.client.get(`/ai-assist/${workPackageId}/checklist`)).data;
  }

  async draftReport(workPackageId: string) {
    return (await this.client.post(`/ai-assist/${workPackageId}/draft-report`)).data;
  }

  // ---- Pre-sales: enquiry -> go/no-go -> proposal -> work order ----
  async getEnquiries(params?: { status?: string; client_id?: string; page?: number; per_page?: number }) {
    return (await this.client.get("/enquiries/", { params })).data;
  }

  async getEnquiry(enquiryId: string) {
    return (await this.client.get(`/enquiries/${enquiryId}`)).data;
  }

  async createEnquiry(data: any) {
    return (await this.client.post("/enquiries/", data)).data;
  }

  async getReasonCodes() {
    return (await this.client.get("/enquiries/reason-codes")).data;
  }

  async advanceEnquiry(enquiryId: string, to_status: string, note?: string) {
    return (await this.client.post(`/enquiries/${enquiryId}/advance`, { to_status, note })).data;
  }

  async buildScorecard(enquiryId: string, auto_score = true) {
    return (await this.client.post(`/enquiries/${enquiryId}/scorecard`, null, {
      params: { auto_score },
    })).data;
  }

  async decideEnquiry(enquiryId: string, body: any) {
    return (await this.client.post(`/enquiries/${enquiryId}/decision`, body)).data;
  }

  async remediateEnquiry(enquiryId: string, body: any) {
    return (await this.client.post(`/enquiries/${enquiryId}/remediate`, body)).data;
  }

  async createProposal(enquiryId: string, body: any) {
    return (await this.client.post(`/enquiries/${enquiryId}/proposals`, body)).data;
  }

  async addProposalRevision(proposalId: string, body: any) {
    return (await this.client.post(`/proposals/${proposalId}/revisions`, body)).data;
  }

  async issueProposalRevision(proposalId: string, revisionNo: number) {
    return (await this.client.post(`/proposals/${proposalId}/revisions/${revisionNo}/issue`)).data;
  }

  async recordEnquiryOutcome(enquiryId: string, body: any) {
    return (await this.client.post(`/enquiries/${enquiryId}/outcome`, body)).data;
  }

  async reviveEnquiry(enquiryId: string, note?: string) {
    return (await this.client.post(`/enquiries/${enquiryId}/revive`, { note })).data;
  }

  async closeEnquiry(enquiryId: string, note?: string) {
    return (await this.client.post(`/enquiries/${enquiryId}/close`, { note })).data;
  }

  async convertEnquiry(enquiryId: string, body: any) {
    return (await this.client.post(`/enquiries/${enquiryId}/convert`, body)).data;
  }

  async getPipelineSummary() {
    return (await this.client.get("/pipeline/summary")).data;
  }

  async getLossAnalysis() {
    return (await this.client.get("/pipeline/loss-analysis")).data;
  }

  // ---- External providers (ISO/IEC 17020:2026) ----
  async getProviders(params?: { category?: string; status?: string; usable_only?: boolean }) {
    return (await this.client.get("/providers/", { params })).data;
  }

  async getProviderReviewDue(horizon_days = 60) {
    return (await this.client.get("/providers/review-due", { params: { horizon_days } })).data;
  }

  async registerProvider(data: any) {
    return (await this.client.post("/providers/", data)).data;
  }

  async getProvider(providerId: string) {
    return (await this.client.get(`/providers/${providerId}`)).data;
  }

  async evaluateProvider(providerId: string, body: any) {
    return (await this.client.post(`/providers/${providerId}/evaluate`, body)).data;
  }

  async recordProviderPerformance(providerId: string, body: any) {
    return (await this.client.post(`/providers/${providerId}/performance`, body)).data;
  }

  async setProviderStatus(providerId: string, status: string, reason: string) {
    return (await this.client.patch(`/providers/${providerId}/status`, null, {
      params: { status, reason },
    })).data;
  }

  async recordSubcontractConsent(body: any) {
    return (await this.client.post("/providers/consent", body)).data;
  }

  async checkMaySubcontract(jobId: string, providerId: string, service?: string) {
    return (await this.client.get(`/providers/check/${jobId}/${providerId}`, {
      params: service ? { service } : undefined,
    })).data;
  }

  // ---- Risk register and risk-based internal audit ----
  async getRisks(params?: { category?: string; status?: string; material_only?: boolean }) {
    return (await this.client.get("/risks/", { params })).data;
  }

  async getOverdueRisks() {
    return (await this.client.get("/risks/overdue")).data;
  }

  async createRisk(data: any) {
    return (await this.client.post("/risks/", data)).data;
  }

  async getRisk(riskId: string) {
    return (await this.client.get(`/risks/${riskId}`)).data;
  }

  async reviewRisk(riskId: string, body: any) {
    return (await this.client.post(`/risks/${riskId}/review`, body)).data;
  }

  async getAuditPlan(slots = 4) {
    return (await this.client.get("/internal-audits/plan", { params: { slots } })).data;
  }

  async planInternalAudit(body: any) {
    return (await this.client.post("/internal-audits/", body)).data;
  }

  async completeInternalAudit(auditId: string, body: any) {
    return (await this.client.post(`/internal-audits/${auditId}/complete`, body)).data;
  }

  // ---------------------------------------------------- inspection & test plans

  async listITPs(params?: { job_id?: string }) {
    return (await this.client.get("/itps/", { params })).data;
  }

  async getITP(itpId: string) {
    return (await this.client.get(`/itps/${itpId}`)).data;
  }

  async createITP(data: any) {
    return (await this.client.post("/itps/", data)).data;
  }

  async extractITP(body: { document_text: string; source?: string }) {
    return (await this.client.post("/itps/extract", body)).data;
  }

  async approveITP(itpId: string) {
    return (await this.client.post(`/itps/${itpId}/approve`)).data;
  }

  async confirmITPExtraction(itpId: string) {
    return (await this.client.post(`/itps/${itpId}/confirm-extraction`)).data;
  }

  async listInspectionCalls(params?: {
    itp_id?: string;
    job_id?: string;
    open_only?: boolean;
  }) {
    return (await this.client.get("/inspection-calls/", { params })).data;
  }

  async inspectionCallForecast(days = 14) {
    return (await this.client.get("/inspection-calls/forecast", { params: { days } })).data;
  }

  async sweepInspectionCalls() {
    return (await this.client.post("/inspection-calls/sweep")).data;
  }

  async raiseInspectionCall(data: any) {
    return (await this.client.post("/inspection-calls/", data)).data;
  }

  async suggestInspectorForCall(callId: string) {
    return (await this.client.get(`/inspection-calls/${callId}/suggest`)).data;
  }

  async assignInspectionCall(callId: string, personId: string) {
    return (
      await this.client.post(`/inspection-calls/${callId}/assign`, null, {
        params: { person_id: personId },
      })
    ).data;
  }

  async attendInspectionCall(callId: string, body: any) {
    return (await this.client.post(`/inspection-calls/${callId}/attend`, body)).data;
  }

  async waiveInspectionCall(callId: string, body: any) {
    return (await this.client.post(`/inspection-calls/${callId}/waive`, body)).data;
  }

  async declineInspectionCall(callId: string, body: any) {
    return (await this.client.post(`/inspection-calls/${callId}/decline`, body)).data;
  }

  // ------------------------------------------------- commercial envelope

  async commercialSweep() {
    return (await this.client.get("/commercial/sweep")).data;
  }

  async orderEnvelope(soId: string) {
    return (await this.client.get(`/commercial/orders/${soId}/state`)).data;
  }

  async setOrderTerms(soId: string, body: any) {
    return (await this.client.put(`/commercial/orders/${soId}/terms`, body)).data;
  }

  async canDrawAgainstOrder(soId: string, amount: number) {
    return (
      await this.client.get(`/commercial/orders/${soId}/can-draw`, {
        params: { amount },
      })
    ).data;
  }

  async proposeSuccessorOrder(soId: string, body: any = {}) {
    return (await this.client.post(`/commercial/orders/${soId}/successor`, body)).data;
  }

  async listAmendments(params?: { so_id?: string; status?: string }) {
    return (await this.client.get("/commercial/amendments", { params })).data;
  }

  async proposeAmendment(body: any) {
    return (await this.client.post("/commercial/amendments", body)).data;
  }

  async approveAmendment(amendmentId: string, body: any) {
    return (await this.client.post(`/commercial/amendments/${amendmentId}/approve`, body)).data;
  }

  async rejectAmendment(amendmentId: string, body: any) {
    return (await this.client.post(`/commercial/amendments/${amendmentId}/reject`, body)).data;
  }

  // ------------------------------------------------------------ frameworks

  async makeFramework(soId: string, body: any = {}) {
    return (await this.client.post(`/commercial/orders/${soId}/framework`, body)).data;
  }

  async listFrameworks() {
    return (await this.client.get("/commercial/frameworks")).data;
  }

  async frameworkView(soId: string) {
    return (await this.client.get(`/commercial/orders/${soId}/framework`)).data;
  }

  async openCallOff(soId: string, body: any) {
    return (await this.client.post(`/commercial/orders/${soId}/call-offs`, body)).data;
  }

  // ----------------------------------------------------------- rate cards

  async listRateCards(params?: { client_id?: string; status?: string }) {
    return (await this.client.get("/rates/cards", { params })).data;
  }

  async getRateCard(cardId: string) {
    return (await this.client.get(`/rates/cards/${cardId}`)).data;
  }

  async createRateCard(body: any) {
    return (await this.client.post("/rates/cards", body)).data;
  }

  async activateRateCard(cardId: string, body: any = {}) {
    return (await this.client.post(`/rates/cards/${cardId}/activate`, body)).data;
  }

  async expiringRateCards(days = 45) {
    return (await this.client.get("/rates/cards/expiring", { params: { days } })).data;
  }

  async listRateFloors() {
    return (await this.client.get("/rates/floors")).data;
  }

  async setRateFloor(body: any) {
    return (await this.client.put("/rates/floors", body)).data;
  }

  async resolveRate(params: {
    work_type_code: string;
    client_id?: string;
    discipline?: string;
  }) {
    return (await this.client.get("/rates/resolve", { params })).data;
  }

  async checkRate(body: {
    work_type_code: string;
    rate: number;
    client_id?: string;
    discipline?: string;
  }) {
    return (await this.client.post("/rates/check", body)).data;
  }

  // ---------------------------------------------------------------- NCRs

  async listNCRs(params?: {
    status?: string;
    job_id?: string;
    severity?: string;
    open_only?: boolean;
  }) {
    return (await this.client.get("/ncrs/", { params })).data;
  }

  async getNCR(ncrId: string) {
    return (await this.client.get(`/ncrs/${ncrId}`)).data;
  }

  async raiseNCR(body: any) {
    return (await this.client.post("/ncrs/", body)).data;
  }

  async ncrGate(params?: { job_id?: string; work_package_id?: string }) {
    return (await this.client.get("/ncrs/gate", { params })).data;
  }

  async proposeNCRDisposition(ncrId: string, body: any) {
    return (await this.client.post(`/ncrs/${ncrId}/disposition`, body)).data;
  }

  async acceptNCRDisposition(ncrId: string, body: any = {}) {
    return (await this.client.post(`/ncrs/${ncrId}/accept`, body)).data;
  }

  async submitNCRForVerification(ncrId: string, body: any) {
    return (await this.client.post(`/ncrs/${ncrId}/submit`, body)).data;
  }

  async verifyNCR(ncrId: string, body: any) {
    return (await this.client.post(`/ncrs/${ncrId}/verify`, body)).data;
  }

  async voidNCR(ncrId: string, body: any) {
    return (await this.client.post(`/ncrs/${ncrId}/void`, body)).data;
  }

  // -------------------------------------------------------- impartiality

  async impartialityExposure(windowDays = 365) {
    return (
      await this.client.get("/risks/impartiality/exposure", {
        params: { window_days: windowDays },
      })
    ).data;
  }

  async impartialityProposals(windowDays = 365) {
    return (
      await this.client.get("/risks/impartiality/proposals", {
        params: { window_days: windowDays },
      })
    ).data;
  }

  // -------------------------------------------------------- regions
  async listRegions() { return (await this.client.get("/regions/")).data; }
  async getRegion(code: string) { return (await this.client.get(`/regions/${code}`)).data; }
  async createRegion(data: any) { return (await this.client.post("/regions/", data)).data; }
  async updateRegion(code: string, data: any) { return (await this.client.put(`/regions/${code}`, data)).data; }
  async listOffices(regionCode: string) { return (await this.client.get(`/regions/${regionCode}/offices`)).data; }
  async createOffice(regionCode: string, data: any) { return (await this.client.post(`/regions/${regionCode}/offices`, data)).data; }
  async listSettlements(params: any = {}) { return (await this.client.get("/regions/settlements", { params })).data; }
  async createSettlement(data: any) { return (await this.client.post("/regions/settlements", data)).data; }
  async listLoans(params: any = {}) { return (await this.client.get("/regions/loans", { params })).data; }
  async createLoan(data: any) { return (await this.client.post("/regions/loans", data)).data; }
  async endLoan(loanId: string, data: any) { return (await this.client.patch(`/regions/loans/${loanId}/end`, data)).data; }
  async listDeputies(params: any = {}) { return (await this.client.get("/regions/deputies", { params })).data; }
  async setDeputy(data: any) { return (await this.client.post("/regions/deputies", data)).data; }
  async getDeputyChain(role: string, regionCode: string) { return (await this.client.get(`/regions/deputies/chain/${role}/${regionCode}`)).data; }

  // -------------------------------------------------------- recruitment
  async listManpowerRequests(params: any = {}) { return (await this.client.get("/recruitment/", { params })).data; }
  async createManpowerRequest(data: any) { return (await this.client.post("/recruitment/", data)).data; }
  async getManpowerRequest(id: string) { return (await this.client.get(`/recruitment/${id}`)).data; }
  async approveBudget(id: string, data: any = {}) { return (await this.client.patch(`/recruitment/${id}/approve-budget`, data)).data; }
  async rejectBudget(id: string, data: any = {}) { return (await this.client.patch(`/recruitment/${id}/reject-budget`, data)).data; }
  async listCandidates(params: any = {}) { return (await this.client.get("/recruitment/candidates", { params })).data; }
  async createCandidate(data: any) { return (await this.client.post("/recruitment/candidates", data)).data; }
  async getCandidate(id: string) { return (await this.client.get(`/recruitment/candidates/${id}`)).data; }
  async updateCandidateStatus(id: string, data: any) { return (await this.client.patch(`/recruitment/candidates/${id}/status`, data)).data; }
  async listInterviews(params: any = {}) { return (await this.client.get("/recruitment/interviews", { params })).data; }
  async createInterview(data: any) { return (await this.client.post("/recruitment/interviews", data)).data; }
  async recordInterviewResult(id: string, data: any) { return (await this.client.patch(`/recruitment/interviews/${id}/result`, data)).data; }
  async listOffers(params: any = {}) { return (await this.client.get("/recruitment/offers", { params })).data; }
  async createOffer(data: any) { return (await this.client.post("/recruitment/offers", data)).data; }
  async sendOffer(id: string) { return (await this.client.patch(`/recruitment/offers/${id}/send`)).data; }
  async respondOffer(id: string, data: any) { return (await this.client.patch(`/recruitment/offers/${id}/respond`, data)).data; }
  async createInduction(data: any) { return (await this.client.post("/recruitment/inductions", data)).data; }
  async getInduction(personId: string) { return (await this.client.get(`/recruitment/inductions/${personId}`)).data; }
  async updateInductionItem(id: string, data: any) { return (await this.client.patch(`/recruitment/inductions/${id}/item`, data)).data; }
  async completeInduction(id: string) { return (await this.client.patch(`/recruitment/inductions/${id}/complete`)).data; }

  // -------------------------------------------------------- leave & attendance
  async listLeaves(params: any = {}) { return (await this.client.get("/leave-attendance/leave", { params })).data; }
  async createLeave(data: any) { return (await this.client.post("/leave-attendance/leave", data)).data; }
  async approveLeave(id: string) { return (await this.client.patch(`/leave-attendance/leave/${id}/approve`)).data; }
  async rejectLeave(id: string, data: any = {}) { return (await this.client.patch(`/leave-attendance/leave/${id}/reject`, data)).data; }
  async listAttendance(params: any = {}) { return (await this.client.get("/leave-attendance/attendance", { params })).data; }
  async createAttendance(data: any) { return (await this.client.post("/leave-attendance/attendance", data)).data; }
  async getAttendanceSummary(personId: string, params: any = {}) { return (await this.client.get(`/leave-attendance/attendance/summary/${personId}`, { params })).data; }
  async listTimesheets(params: any = {}) { return (await this.client.get("/leave-attendance/timesheets", { params })).data; }
  async createTimesheet(data: any) { return (await this.client.post("/leave-attendance/timesheets", data)).data; }
  async getTimesheet(id: string) { return (await this.client.get(`/leave-attendance/timesheets/${id}`)).data; }
  async submitTimesheet(id: string) { return (await this.client.patch(`/leave-attendance/timesheets/${id}/submit`)).data; }
  async approveTimesheet(id: string) { return (await this.client.patch(`/leave-attendance/timesheets/${id}/approve`)).data; }

  // -------------------------------------------------------- payroll
  async listPayrollRuns(params: any = {}) { return (await this.client.get("/payroll/runs", { params })).data; }
  async createPayrollRun(data: any) { return (await this.client.post("/payroll/runs", data)).data; }
  async getPayrollRun(id: string) { return (await this.client.get(`/payroll/runs/${id}`)).data; }
  async processPayrollRun(id: string) { return (await this.client.post(`/payroll/runs/${id}/process`)).data; }
  async approvePayrollRun(id: string) { return (await this.client.patch(`/payroll/runs/${id}/approve`)).data; }
  async disbursePayrollRun(id: string) { return (await this.client.patch(`/payroll/runs/${id}/disburse`)).data; }
  async listPayslips(params: any = {}) { return (await this.client.get("/payroll/payslips", { params })).data; }
  async getPayslip(id: string) { return (await this.client.get(`/payroll/payslips/${id}`)).data; }

  // -------------------------------------------------------- appraisal
  async listAppraisals(params: any = {}) { return (await this.client.get("/appraisals/", { params })).data; }
  async createAppraisal(data: any) { return (await this.client.post("/appraisals/", data)).data; }
  async getAppraisal(id: string) { return (await this.client.get(`/appraisals/${id}`)).data; }
  async selfReviewAppraisal(id: string, data: any) { return (await this.client.patch(`/appraisals/${id}/self-review`, data)).data; }
  async managerReviewAppraisal(id: string, data: any) { return (await this.client.patch(`/appraisals/${id}/manager-review`, data)).data; }
  async completeAppraisal(id: string) { return (await this.client.patch(`/appraisals/${id}/complete`)).data; }
  async listWitnessedInspections(params: any = {}) { return (await this.client.get("/appraisals/witnessed", { params })).data; }
  async createWitnessedInspection(data: any) { return (await this.client.post("/appraisals/witnessed", data)).data; }
  async getWitnessedInspections(personId: string) { return (await this.client.get(`/appraisals/witnessed/${personId}`)).data; }

  // -------------------------------------------------------- exit management
  async listExits(params: any = {}) { return (await this.client.get("/exit/", { params })).data; }
  async initiateExit(data: any) { return (await this.client.post("/exit/", data)).data; }
  async getExit(id: string) { return (await this.client.get(`/exit/${id}`)).data; }
  async updateExitChecklist(id: string, data: any) { return (await this.client.patch(`/exit/${id}/checklist`, data)).data; }
  async withdrawExitAuthorization(id: string) { return (await this.client.patch(`/exit/${id}/withdraw-authorization`)).data; }
  async settleExit(id: string, data: any) { return (await this.client.patch(`/exit/${id}/settle`, data)).data; }
  async completeExit(id: string) { return (await this.client.patch(`/exit/${id}/complete`)).data; }

  // -------------------------------------------------------- purchasing
  async listRequisitions(params: any = {}) { return (await this.client.get("/purchasing/", { params })).data; }
  async createRequisition(data: any) { return (await this.client.post("/purchasing/", data)).data; }
  async getRequisition(id: string) { return (await this.client.get(`/purchasing/${id}`)).data; }
  async approveRequisition(id: string) { return (await this.client.patch(`/purchasing/${id}/approve`)).data; }
  async rejectRequisition(id: string, data: any = {}) { return (await this.client.patch(`/purchasing/${id}/reject`, data)).data; }
  async listVendorPayments(params: any = {}) { return (await this.client.get("/purchasing/vendor-payments", { params })).data; }
  async createVendorPayment(data: any) { return (await this.client.post("/purchasing/vendor-payments", data)).data; }
  async approveVendorPayment(id: string) { return (await this.client.patch(`/purchasing/vendor-payments/${id}/approve`)).data; }
  async payVendorPayment(id: string, data: any) { return (await this.client.patch(`/purchasing/vendor-payments/${id}/pay`, data)).data; }
  async msmeAlerts() { return (await this.client.get("/purchasing/vendor-payments/msme-alerts")).data; }

  // -------------------------------------------------------- dunning (on payments)
  async listDunning(params: any = {}) { return (await this.client.get("/payments/dunning/", { params })).data; }
  async createDunning(data: any) { return (await this.client.post("/payments/dunning/", data)).data; }
  async resolveDunning(id: string, data: any) { return (await this.client.patch(`/payments/dunning/${id}/resolve`, data)).data; }
  async reconcileTDS(paymentId: string, data: any) { return (await this.client.patch(`/payments/${paymentId}/tds-reconcile`, data)).data; }

  // -------------------------------------------------------- RFI
  async listRFIs(params: any = {}) { return (await this.client.get("/rfis/", { params })).data; }
  async createRFI(data: any) { return (await this.client.post("/rfis/", data)).data; }
  async getRFI(id: string) { return (await this.client.get(`/rfis/${id}`)).data; }
  async scheduleRFI(id: string, data: any) { return (await this.client.patch(`/rfis/${id}/schedule`, data)).data; }
  async confirmRFI(id: string) { return (await this.client.patch(`/rfis/${id}/confirm`)).data; }
  async recordRFIResult(id: string, data: any) { return (await this.client.patch(`/rfis/${id}/result`, data)).data; }
  async rfiTurnaround(params: any = {}) { return (await this.client.get("/rfis/turnaround", { params })).data; }

  // -------------------------------------------------------- punch list
  async listPunchItems(params: any = {}) { return (await this.client.get("/punch-list/", { params })).data; }
  async createPunchItem(data: any) { return (await this.client.post("/punch-list/", data)).data; }
  async getPunchItem(id: string) { return (await this.client.get(`/punch-list/${id}`)).data; }
  async correctPunchItem(id: string, data: any) { return (await this.client.patch(`/punch-list/${id}/correct`, data)).data; }
  async reInspectPunchItem(id: string, data: any) { return (await this.client.patch(`/punch-list/${id}/re-inspect`, data)).data; }
  async closePunchItem(id: string) { return (await this.client.patch(`/punch-list/${id}/close`)).data; }
  async punchListSummary(jobId: string) { return (await this.client.get(`/punch-list/summary/${jobId}`)).data; }

  // -------------------------------------------------------- release notes
  async listReleaseNotes(params: any = {}) { return (await this.client.get("/release-notes/", { params })).data; }
  async createReleaseNote(data: any) { return (await this.client.post("/release-notes/", data)).data; }
  async getReleaseNote(id: string) { return (await this.client.get(`/release-notes/${id}`)).data; }
  async checkReleaseNotePreconditions(id: string) { return (await this.client.post(`/release-notes/${id}/check-preconditions`)).data; }
  async recommendReleaseNote(id: string, data: any) { return (await this.client.patch(`/release-notes/${id}/recommend`, data)).data; }
  async approveReleaseNote(id: string, data: any) { return (await this.client.patch(`/release-notes/${id}/approve`, data)).data; }
  async issueReleaseNote(id: string) { return (await this.client.patch(`/release-notes/${id}/release`)).data; }

  // -------------------------------------------------------- feedback & MRM
  async listFeedback(params: any = {}) { return (await this.client.get("/feedback/", { params })).data; }
  async createFeedback(data: any) { return (await this.client.post("/feedback/", data)).data; }
  async getFeedback(id: string) { return (await this.client.get(`/feedback/${id}`)).data; }
  async respondFeedback(id: string, data: any) { return (await this.client.patch(`/feedback/${id}/respond`, data)).data; }
  async escalateFeedback(id: string) { return (await this.client.patch(`/feedback/${id}/escalate`)).data; }
  async listMRM(params: any = {}) { return (await this.client.get("/feedback/mrm", { params })).data; }
  async createMRM(data: any) { return (await this.client.post("/feedback/mrm", data)).data; }
  async getMRM(id: string) { return (await this.client.get(`/feedback/mrm/${id}`)).data; }
  async decideMRM(id: string, data: any) { return (await this.client.patch(`/feedback/mrm/${id}/decision`, data)).data; }
  async closeMRM(id: string) { return (await this.client.patch(`/feedback/mrm/${id}/close`)).data; }

  // -------------------------------------------------------- job handoff
  async convertEnquiryToJob(data: any) { return (await this.client.post("/job-handoff/convert", data)).data; }
  async listConversions(params: any = {}) { return (await this.client.get("/job-handoff/conversions", { params })).data; }
  async getConversion(id: string) { return (await this.client.get(`/job-handoff/conversions/${id}`)).data; }

  // -------------------------------------------------------- signoff
  async listSignoffs(params: any = {}) { return (await this.client.get("/signoffs/", { params })).data; }
  async createSignoff(data: any) { return (await this.client.post("/signoffs/", data)).data; }
  async getSignoff(id: string) { return (await this.client.get(`/signoffs/${id}`)).data; }
  async pendingSignoffs() { return (await this.client.get("/signoffs/pending")).data; }
  async reviewSignoff(id: string, data: any) { return (await this.client.patch(`/signoffs/${id}/review`, data)).data; }
  async assignDeputySignoff(id: string, data: any) { return (await this.client.patch(`/signoffs/${id}/assign-deputy`, data)).data; }

  // -------------------------------------------------------- win-loss
  async listWinLoss(params: any = {}) { return (await this.client.get("/win-loss/", { params })).data; }
  async createWinLoss(data: any) { return (await this.client.post("/win-loss/", data)).data; }
  async getWinLoss(id: string) { return (await this.client.get(`/win-loss/${id}`)).data; }
  async winLossSummary(params: any = {}) { return (await this.client.get("/win-loss/summary", { params })).data; }
  async winLossByRegion(params: any = {}) { return (await this.client.get("/win-loss/by-region", { params })).data; }
  async winLossBySector(params: any = {}) { return (await this.client.get("/win-loss/by-sector", { params })).data; }

  // -------------------------------------------------------- notifications
  async listNotifications(params: any = {}) { return (await this.client.get("/notifications/", { params })).data; }
  async markNotificationRead(id: string) { return (await this.client.patch(`/notifications/${id}/read`)).data; }
  async markAllNotificationsRead() { return (await this.client.patch("/notifications/read-all")).data; }
  async createInAppNotification(data: any) { return (await this.client.post("/notifications/in-app", data)).data; }
  async listEmailLogs(params: any = {}) { return (await this.client.get("/notifications/emails", { params })).data; }
  async sendEmail(data: any) { return (await this.client.post("/notifications/emails", data)).data; }
  async updateEmailStatus(logId: string, data: any) { return (await this.client.patch(`/notifications/emails/${logId}/status`, data)).data; }
  async getNotificationPreferences(personId: string) { return (await this.client.get(`/notifications/preferences/${personId}`)).data; }
  async updateNotificationPreferences(personId: string, data: any) { return (await this.client.put(`/notifications/preferences/${personId}`, data)).data; }
  async adminRecipients() { return (await this.client.get("/notifications/preferences/admin/recipients")).data; }
}

export const api = new API();
