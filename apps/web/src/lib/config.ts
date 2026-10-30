/**
 * Base URL for the FastAPI backend as seen from the browser.
 *
 * Defaults to "/backend", which next.config.js proxies to the API server. Relative
 * URLs work from any device (desktop, phone on Wi-Fi, production domain) with no
 * CORS setup and no hard-coded "localhost". Set NEXT_PUBLIC_API_URL to call the
 * API directly instead (e.g. https://api.iqe.co.in).
 */
export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "/backend").replace(/\/$/, "");

/**
 * The separate Vue analytics app embedded on Admin > Analytics. Defaults to port 3001
 * on whatever host the portal was opened from, so it also works from another device.
 */
export function analyticsAppUrl(): string {
  if (process.env.NEXT_PUBLIC_ANALYTICS_URL) return process.env.NEXT_PUBLIC_ANALYTICS_URL;
  if (typeof window === "undefined") return "http://localhost:3001";
  return `${window.location.protocol}//${window.location.hostname}:3001`;
}
