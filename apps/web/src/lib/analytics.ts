import { API_BASE as BACKEND_BASE } from "@/lib/config";
/**
 * Analytics & Telemetry Tracking Utility
 * Instrument elements with data-analytics-id, data-analytics-key, data-analytics-name
 */

export interface TrackParams {
  eventType: "button_click" | "page_view" | "legacy_job_migrated" | "invoice_issued" | "tpi_billing_edit" | "custom";
  elementId?: string;
  elementKey?: string;
  elementName?: string;
  category?: string;
  pageRoute?: string;
  userId?: string;
  userRole?: string;
  siteId?: string;
  metadata?: Record<string, any>;
}

const rawApiUrl = BACKEND_BASE;
const API_BASE = rawApiUrl.endsWith("/api/v1") ? rawApiUrl : `${rawApiUrl}/api/v1`;

export async function trackEvent(params: TrackParams) {
  try {
    const payload = {
      event_type: params.eventType,
      element_id: params.elementId || "",
      element_key: params.elementKey || "",
      element_name: params.elementName || "",
      category: params.category || "general",
      page_route: params.pageRoute || (typeof window !== "undefined" ? window.location.pathname : "/"),
      user_id: params.userId || "usr_current",
      user_role: params.userRole || "coordinator",
      site_id: params.siteId || "SITE-01",
      metadata: params.metadata || {},
    };

    if (typeof window !== "undefined") {
      fetch(`${API_BASE}/analytics/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch((err) => console.warn("[Analytics] Tracking failed asynchronously", err));
    }
  } catch (err) {
    console.warn("[Analytics] Warning recording event:", err);
  }
}

export function trackButtonClick(elementId: string, elementKey: string, elementName: string, category: string = "button_action") {
  trackEvent({
    eventType: "button_click",
    elementId,
    elementKey,
    elementName,
    category,
  });
}

export function trackPageView(pageName: string, category: string = "navigation") {
  trackEvent({
    eventType: "page_view",
    elementKey: `page_${pageName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
    elementName: `Page View: ${pageName}`,
    category,
  });
}
