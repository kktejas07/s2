import axios from "axios";
import Constants from "expo-constants";

import type { OutboxItem } from "../offline/outbox";

/**
 * Where the API lives.
 *
 * This was hard-coded to http://localhost:8000, which resolves to the phone
 * itself and so reached nothing from a real device - the app could only ever
 * have worked in a simulator on the same machine as the server.
 *
 * Resolution order: an explicit build-time value, then the host Expo is being
 * served from (which is the developer's machine when running on a device over
 * Wi-Fi), then localhost as a last resort.
 */
function resolveBaseUrl(): string {
  const configured =
    (Constants.expoConfig?.extra as Record<string, string> | undefined)?.apiUrl ||
    process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, "");

  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants.expoGoConfig as { debuggerHost?: string } | undefined)?.debuggerHost;
  const host = hostUri?.split(":")[0];
  if (host) return `http://${host}:8000`;

  return "http://localhost:8000";
}

export const BASE_URL = resolveBaseUrl();

class MobileAPI {
  private token: string | null = null;
  client = axios.create({
    baseURL: `${BASE_URL}/api/v1`,
    // A site connection that is technically up but useless should fail and
    // return the item to the queue rather than holding the sync open.
    timeout: 30_000,
  });

  constructor() {
    this.client.interceptors.request.use((config) => {
      if (this.token) config.headers.Authorization = `Bearer ${this.token}`;
      return config;
    });
  }

  setToken(t: string | null) {
    this.token = t;
  }

  // Auth
  async login(login_name: string, password: string) {
    const r = await this.client.post("/auth/login", { login_name, password });
    this.token = r.data.access_token;
    return r.data;
  }

  // Jobs
  async listJobs(params?: any) {
    return (await this.client.get("/jobs", { params })).data;
  }

  // Visits
  async listVisits(params?: any) {
    return (await this.client.get("/visits", { params })).data;
  }
  async getVisit(id: string) {
    return (await this.client.get(`/visits/${id}`)).data;
  }
  async acceptVisit(id: string) {
    return (await this.client.patch(`/visits/${id}/accept`)).data;
  }
  async submitVisit(id: string, d: any) {
    return (await this.client.patch(`/visits/${id}/submit`, d)).data;
  }
  async addExpense(id: string, d: any) {
    return (await this.client.post(`/visits/${id}/expenses`, d)).data;
  }
  async addFinding(id: string, d: any) {
    return (await this.client.post(`/visits/${id}/findings`, d)).data;
  }

  /**
   * Upload one queued evidence item.
   *
   * `client_capture_id` is the whole point: the server returns the existing
   * record if it has seen this key before, so a retry after an ambiguous
   * failure cannot produce a second photograph. `capture_sha256` was computed
   * on the phone at capture, so a match proves the bytes are the ones that
   * left the camera rather than the ones that happened to arrive.
   */
  async attachEvidenceFromQueue(item: OutboxItem) {
    const form = new FormData();
    if (item.filePath) {
      form.append("file", {
        uri: item.filePath,
        name: item.fileName ?? "capture.jpg",
        type: item.contentType ?? "image/jpeg",
      } as unknown as Blob);
    }
    form.append("client_capture_id", item.captureId);
    if (item.captureSha256) form.append("capture_sha256", item.captureSha256);
    for (const [key, value] of Object.entries(item.payload)) {
      if (value !== null && value !== undefined) form.append(key, String(value));
    }
    const r = await this.client.post(
      `/evidence/${item.entityType}/${item.entityId}`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return r.data;
  }

  async qualityCheck(id: string, d: any) {
    return (await this.client.patch(`/visits/${id}/quality-check`, d)).data;
  }
  async addPhoto(id: string, d: any) {
    return (await this.client.post(`/visits/${id}/photos`, d)).data;
  }

  // AI assists
  async generateReport(visitId: string) {
    return (await this.client.post(`/ai/generate-report/${visitId}`)).data;
  }
  async detectAnomalies(visitId: string) {
    return (await this.client.get(`/ai/detect-anomalies/${visitId}`)).data;
  }

  // Dashboard
  async getStats() {
    return (await this.client.get("/dashboard/stats")).data;
  }
}

export const api = new MobileAPI();
export default api;
