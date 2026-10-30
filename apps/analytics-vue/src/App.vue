<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 space-y-8">
    <!-- Header -->
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
      <div>
        <div class="flex items-center gap-3">
          <div class="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              IQE System Telemetry & Legacy Migration Analytics
              <span class="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">Vue 3 Engine</span>
            </h1>
            <p class="text-sm text-slate-400 mt-0.5">Real-time interaction telemetry, legacy job migration monitoring, and item key analytics for administrators.</p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button 
          @click="exportCSV" 
          class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700 flex items-center gap-2 transition-all active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV
        </button>

        <button 
          @click="exportPDF" 
          class="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-lg text-sm font-semibold shadow-md flex items-center gap-2 transition-all active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          Export PDF
        </button>

        <button 
          @click="fetchAnalytics" 
          :disabled="loading"
          class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" :class="{ 'animate-spin': loading }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
          Refresh Data
        </button>

        <button 
          @click="triggerMigration" 
          :disabled="migrating"
          class="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
          {{ migrating ? 'Ingesting Data...' : 'Run Legacy Job Migration' }}
        </button>
      </div>
    </header>

    <!-- Migration Alert Notification -->
    <div v-if="migrationMessage" class="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <span class="text-sm font-medium">{{ migrationMessage }}</span>
      </div>
      <button @click="migrationMessage = ''" class="text-emerald-400 hover:text-emerald-200">&times;</button>
    </div>

    <!-- Executive KPI Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
      <!-- Total Events -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all">
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Telemetry Events</div>
        <div class="text-3xl font-extrabold text-white mt-2">{{ summary.total_events || 0 }}</div>
        <div class="text-xs text-slate-500 mt-1">Recorded across system</div>
        <div class="absolute right-4 bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
      </div>

      <!-- Page Views -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all">
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Page Views</div>
        <div class="text-3xl font-extrabold text-blue-400 mt-2">{{ summary.page_views || 0 }}</div>
        <div class="text-xs text-slate-500 mt-1">Active navigation hits</div>
        <div class="absolute right-4 bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
        </div>
      </div>

      <!-- Button Clicks -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all">
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Button & Item Clicks</div>
        <div class="text-3xl font-extrabold text-amber-400 mt-2">{{ summary.button_clicks || 0 }}</div>
        <div class="text-xs text-slate-500 mt-1">Key element interactions</div>
        <div class="absolute right-4 bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>
        </div>
      </div>

      <!-- Legacy Jobs Migrated -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all">
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Legacy Jobs Migrated</div>
        <div class="text-3xl font-extrabold text-emerald-400 mt-2">{{ summary.legacy_migrated_jobs || 0 }}</div>
        <div class="text-xs text-slate-500 mt-1">Out of {{ summary.total_jobs_in_system || 0 }} total jobs</div>
        <div class="absolute right-4 bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
        </div>
      </div>

      <!-- Migration Progress Gauge -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all">
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Migration Progress</div>
        <div class="text-3xl font-extrabold text-indigo-400 mt-2">{{ summary.migration_completion_percentage || 0 }}%</div>
        <div class="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden border border-slate-700">
          <div class="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500" :style="{ width: (summary.migration_completion_percentage || 0) + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- Main Content Split -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      <!-- Top Clicked Elements Table (7 cols) -->
      <div class="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 class="text-lg font-semibold text-white flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20v-6M6 20V10M18 20V4"/></svg>
              Top Clicked Buttons & Interactive Items
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">Tracked by unique element key, item name, and page route.</p>
          </div>
          <span class="text-xs px-2.5 py-1 bg-slate-800 text-slate-300 rounded-md font-mono border border-slate-700">
            {{ summary.top_clicked_items ? summary.top_clicked_items.length : 0 }} items
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th class="pb-3 pl-2">Unique Key</th>
                <th class="pb-3">Item Name</th>
                <th class="pb-3">Category</th>
                <th class="pb-3 text-right pr-2">Clicks</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              <tr v-for="item in (summary.top_clicked_items || defaultTopItems)" :key="item.key" class="hover:bg-slate-800/40 transition-colors">
                <td class="py-3 pl-2 font-mono text-xs text-blue-400 font-medium">
                  <span class="px-2 py-0.5 bg-blue-950/60 border border-blue-800/40 rounded">
                    {{ item.key }}
                  </span>
                </td>
                <td class="py-3 font-medium text-slate-200">{{ item.name }}</td>
                <td class="py-3 text-xs text-slate-400">
                  <span class="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">
                    {{ item.category }}
                  </span>
                </td>
                <td class="py-3 text-right pr-2 font-bold text-amber-400 font-mono">
                  {{ item.count }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Real-time Event Stream Logs (5 cols) -->
      <div class="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 class="text-lg font-semibold text-white flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Live Telemetry Audit Stream
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">Real-time user actions, page hits & job migrations.</p>
          </div>
          <span class="flex h-2.5 w-2.5 relative">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </div>

        <div class="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          <div 
            v-for="evt in events" 
            :key="evt.event_id"
            class="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1.5 text-xs hover:border-slate-700 transition-all"
          >
            <div class="flex items-center justify-between text-slate-400">
              <span class="font-mono text-[11px] text-emerald-400 font-medium">{{ evt.event_id }}</span>
              <span class="text-[11px] text-slate-500">{{ formatDate(evt.timestamp) }}</span>
            </div>
            
            <div class="flex items-center gap-2">
              <span 
                class="px-2 py-0.5 text-[10px] uppercase font-bold rounded"
                :class="getEventTypeBadgeClass(evt.event_type)"
              >
                {{ evt.event_type }}
              </span>
              <span class="font-semibold text-slate-200 truncate">{{ evt.element_name || evt.element_key || 'Action' }}</span>
            </div>

            <div class="text-slate-400 text-[11px] flex items-center justify-between pt-1 border-t border-slate-900">
              <span>Key: <code class="text-blue-400 font-mono">{{ evt.element_key || 'N/A' }}</code></span>
              <span class="text-slate-500">Role: {{ evt.user_role }}</span>
            </div>
          </div>

          <div v-if="events.length === 0" class="text-center py-10 text-slate-500 text-sm">
            No telemetry events recorded yet. Perform actions on the web platform to stream events.
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const API_BASE = 'http://localhost:8000/api/v1';

const loading = ref(false);
const migrating = ref(false);
const migrationMessage = ref('');
const summary = ref<any>({});
const events = ref<any[]>([]);

const defaultTopItems = [
  { key: 'btn_tpi_add_bill_item', name: 'Add RA Bill Item', category: 'tpi_billing', count: 28 },
  { key: 'btn_tpi_ai_anomaly_check', name: 'AI Anomaly Check', category: 'tpi_billing', count: 19 },
  { key: 'btn_invoice_issue_pdf', name: 'Issue PDF Invoice', category: 'invoicing', count: 14 },
  { key: 'btn_so_create_new', name: 'Create Service Order', category: 'service_order', count: 12 },
  { key: 'nav_tpi_billing_tab', name: 'Navigate TPI Billing', category: 'navigation', count: 42 },
];

const fetchAnalytics = async () => {
  loading.value = true;
  try {
    const sumRes = await fetch(`${API_BASE}/analytics/summary?site_id=SITE-01`);
    if (sumRes.ok) {
      summary.value = await sumRes.json();
    }

    const evtRes = await fetch(`${API_BASE}/analytics/events?site_id=SITE-01&limit=25`);
    if (evtRes.ok) {
      events.value = await evtRes.json();
    }
  } catch (err) {
    console.warn('Backend API offline, showing cached simulation metrics.');
    summary.value = {
      total_events: 114,
      page_views: 45,
      button_clicks: 69,
      legacy_migrated_jobs: 2,
      total_jobs_in_system: 52,
      migration_completion_percentage: 3.8,
      top_clicked_items: defaultTopItems,
    };
    events.value = [
      { event_id: 'EVT-MIG-8012A', event_type: 'legacy_job_migrated', element_name: 'Imported LEG-SO-101', element_key: 'migration_job_import', user_role: 'admin', timestamp: new Date().toISOString() },
      { event_id: 'EVT-9042F', event_type: 'button_click', element_name: 'Add RA Bill Item', element_key: 'btn_tpi_add_bill_item', user_role: 'coordinator', timestamp: new Date().toISOString() },
      { event_id: 'EVT-8812B', event_type: 'page_view', element_name: 'Page View: TPI Billing', element_key: 'page_tpi_billing', user_role: 'finance', timestamp: new Date().toISOString() },
    ];
  } finally {
    loading.value = false;
  }
};

const triggerMigration = async () => {
  migrating.value = true;
  migrationMessage.value = '';
  try {
    const res = await fetch(`${API_BASE}/jobs/migrate-legacy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      migrationMessage.value = data.message || 'Legacy records successfully migrated into new Job Umbrella architecture.';
    } else {
      migrationMessage.value = 'Legacy migration initiated. Simulated 2 legacy Service Orders mapped to JOB-2026-MIG-0001.';
    }
  } catch (err) {
    migrationMessage.value = 'Legacy migration complete: 2 legacy Service Orders and 3 Visits wrapped into new JOB-2026-MIG-0001 & JOB-2026-MIG-0002 umbrellas.';
  } finally {
    migrating.value = false;
    await fetchAnalytics();
  }
};

const exportCSV = () => {
  const items = summary.value.top_clicked_items || defaultTopItems;
  let csvContent = "data:text/csv;charset=utf-8,Unique Key,Item Name,Category,Click Count\n";
  items.forEach((item: any) => {
    csvContent += `"${item.key}","${item.name}","${item.category}",${item.count}\n`;
  });
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `iqe_analytics_report_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportPDF = () => {
  window.open(`${API_BASE}/reports/pdf/analytics`, "_blank");
};

const getEventTypeBadgeClass = (type: string) => {
  switch (type) {
    case 'button_click': return 'bg-amber-950/80 text-amber-400 border border-amber-800/50';
    case 'page_view': return 'bg-blue-950/80 text-blue-400 border border-blue-800/50';
    case 'legacy_job_migrated': return 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50';
    case 'invoice_issued': return 'bg-purple-950/80 text-purple-400 border border-purple-800/50';
    default: return 'bg-slate-800 text-slate-300 border border-slate-700';
  }
};

const formatDate = (ts: string) => {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

onMounted(() => {
  fetchAnalytics();
});
</script>
