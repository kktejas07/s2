"use client";
import { useEffect, useState } from "react";
import { Search, RefreshCw, CheckCircle2, Clock, AlertTriangle, X, MessageSquare } from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";

function statusPill(s: string) {
  const colors: Record<string, string> = {
    queued: "bg-yellow-100 text-yellow-800", sent: "bg-blue-100 text-blue-800",
    delivered: "bg-green-100 text-green-800", failed: "bg-red-100 text-red-700",
    bounced: "bg-red-100 text-red-700",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[s] || "bg-gray-100 text-gray-600"}`}>{s}</span>;
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<"notifications" | "emails" | "preferences">("notifications");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [search, setSearch] = useState("");
  const [preferences, setPreferences] = useState<any>(null);

  useEffect(() => { loadData(); }, [activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      if (activeTab === "notifications") {
        const res = await api.listNotifications();
        setItems(res.items || []);
        setUnreadCount(res.unread_count || 0);
      } else if (activeTab === "emails") {
        const res = await api.listEmailLogs();
        setItems(res.items || []);
      } else if (activeTab === "preferences") {
        const user = typeof window !== "undefined" ? localStorage.getItem("person_id") || "me" : "me";
        const pref = await api.getNotificationPreferences(user);
        setPreferences(pref);
      }
    } catch { toast.error("Failed to load data"); }
    setLoading(false);
  }

  async function handleMarkAllRead() {
    try {
      await api.markAllNotificationsRead();
      toast.success("All marked as read");
      loadData();
    } catch { toast.error("Failed"); }
  }

  async function handleMarkRead(id: string) {
    try {
      await api.markNotificationRead(id);
      loadData();
    } catch { toast.error("Failed"); }
  }

  const tabs = [
    { key: "notifications", label: "Notifications", count: unreadCount },
    { key: "emails", label: "Email Logs" },
    { key: "preferences", label: "Preferences" },
  ] as const;

  const filtered = items.filter((item: any) => {
    const text = search.toLowerCase();
    if (activeTab === "notifications") return (item.title || "").toLowerCase().includes(text) || (item.message || "").toLowerCase().includes(text);
    if (activeTab === "emails") return (item.subject || "").toLowerCase().includes(text) || (item.to_addresses || []).join(",").toLowerCase().includes(text);
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications & Email</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">System notifications, email audit trail & preferences</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "notifications" && unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Mark all read
            </button>
          )}
          <button onClick={loadData} className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === t.key ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t.label} {"count" in t && t.count ? <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">{t.count}</span> : null}
          </button>
        ))}
      </div>

      {/* Search */}
      {activeTab !== "preferences" && (
        <div className="relative mb-4 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-700" />
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : activeTab === "notifications" ? (
        <div className="space-y-2">
          {filtered.length === 0 && <div className="text-center py-12 text-gray-400">No notifications</div>}
          {filtered.map((n: any) => (
            <div key={n.notification_id} className={`p-4 rounded-lg border flex items-start gap-3 ${n.is_read ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"}`}>
              <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.is_read ? "bg-gray-100 dark:bg-gray-700" : "bg-blue-100 dark:bg-blue-900"}`}>
                <MessageSquare className={`w-4 h-4 ${n.is_read ? "text-gray-400" : "text-blue-600 dark:text-blue-400"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-900 dark:text-white">{n.title}</span>
                  <span className="text-xs text-gray-400">{n.category?.replace(/_/g, " ")}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{n.message}</p>
                <span className="text-xs text-gray-400 mt-1 block">{n.created_at ? new Date(n.created_at).toLocaleString() : ""}</span>
              </div>
              {!n.is_read && (
                <button onClick={() => handleMarkRead(n.notification_id)} className="text-xs text-blue-600 hover:underline shrink-0">Mark read</button>
              )}
            </div>
          ))}
        </div>
      ) : activeTab === "emails" ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700 text-left text-gray-500">
                <th className="py-3 px-4 font-medium">Subject</th>
                <th className="py-3 px-4 font-medium">To</th>
                <th className="py-3 px-4 font-medium">Category</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Sent</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-gray-400">No email logs</td></tr>}
              {filtered.map((e: any) => (
                <tr key={e.log_id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{e.subject}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400 max-w-[200px] truncate">{(e.to_addresses || []).join(", ")}</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{e.category?.replace(/_/g, " ")}</span></td>
                  <td className="py-3 px-4">{statusPill(e.status)}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{e.sent_at ? new Date(e.sent_at).toLocaleString() : e.created_at ? new Date(e.created_at).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="max-w-2xl">
          {preferences ? (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Channel Preferences</h3>
                <div className="space-y-3">
                  {Object.entries(preferences.channel_preferences || {}).map(([ch, enabled]) => (
                    <label key={ch} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{ch.replace(/_/g, " ")}</span>
                      <input type="checkbox" checked={enabled as boolean} readOnly className="w-4 h-4 rounded" />
                    </label>
                  ))}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Category Subscriptions</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(preferences.category_subscriptions || {}).map(([cat, enabled]) => (
                    <label key={cat} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{cat.replace(/_/g, " ")}</span>
                      <input type="checkbox" checked={enabled as boolean} readOnly className="w-4 h-4 rounded" />
                    </label>
                  ))}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Digest Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Daily Digest</span>
                    <input type="checkbox" checked={preferences.receives_daily_digest} readOnly className="w-4 h-4 rounded" />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Weekly Summary</span>
                    <input type="checkbox" checked={preferences.receives_weekly_summary} readOnly className="w-4 h-4 rounded" />
                  </label>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Timezone</span>
                    <span className="text-sm text-gray-500">{preferences.timezone}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">No preferences loaded</div>
          )}
        </div>
      )}
    </div>
  );
}
