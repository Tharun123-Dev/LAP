import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Award, 
  Download,
} from 'lucide-react';
import { exportToCSV, mapLeadToCSVRow } from '../utils/exportCSV';

// Helper: extract a field_value from a lead by field label
const getFieldValue = (lead, label) => {
  const fv = (lead.field_values || []).find(
    v => (v.field?.label || '').toLowerCase().trim() === label.toLowerCase().trim()
  );
  return fv ? fv.value : null;
};

export default function AnalyticsPage() {
  const { leads: rawLeads, counselors } = useApp();

  const leads = rawLeads;

  // ─── 1. Conversion Funnel ──────────────────────────────────────────────────
  const funnelStages = [
    {
      name: 'Total Inquiries',
      count: leads.length,
      color: 'bg-indigo-500'
    },
    {
      name: 'Contacted Leads',
      count: leads.filter(l =>
        ['Contacted', 'Interested', 'Follow-Up Pending', 'Admission Confirmed'].includes(l.status)
      ).length,
      color: 'bg-purple-500'
    },
    {
      name: 'Interested Leads',
      count: leads.filter(l =>
        ['Interested', 'Admission Confirmed'].includes(l.status)
      ).length,
      color: 'bg-cyan-500'
    },
    {
      name: 'Admissions Closed',
      count: leads.filter(l => l.status === 'Admission Confirmed').length,
      color: 'bg-emerald-500'
    }
  ];

  const topCount = funnelStages[0].count || 1;
  const funnelWithPct = funnelStages.map(stage => ({
    ...stage,
    pct: Math.round((stage.count / topCount) * 100)
  }));

  const conversionRate = funnelWithPct[3]?.pct || 0;

  // ─── 2. Lead Source Breakdown (from field_values) ──────────────────────────
  const sourceTotals = leads.reduce((acc, lead) => {
    const source = getFieldValue(lead, 'Source') || 'Unknown';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});

  const totalSourceCount = Object.values(sourceTotals).reduce((a, b) => a + b, 0) || 1;
  const sourcesBreakdown = Object.entries(sourceTotals)
    .map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / totalSourceCount) * 100)
    }))
    .sort((a, b) => b.count - a.count);

  // ─── 3. Counselor Performance Rankings (live data) ────────────────────────
  const counselorList = counselors;

  const counselorsPerformance = counselorList.map(c => {
    // Match leads by counselor_id (FK on lead) or counselor object id
    const assigned = leads.filter(l =>
      l.counselor_id === c.id || l.counselor?.id === c.id
    );
    const admissions = assigned.filter(l => l.status === 'Admission Confirmed').length;
    const convRate = assigned.length > 0
      ? Math.round((admissions / assigned.length) * 100)
      : 0;
    const targetGoal = 5; // target admissions
    const targetAchieved = Math.min(Math.round((admissions / targetGoal) * 100), 100);

    return {
      id: c.id,
      name: c.full_name,
      email: c.email,
      activeLeads: assigned.length,
      admissions,
      conversionRate: convRate,
      targetAchieved
    };
  }).sort((a, b) => b.admissions - a.admissions);

  // ─── 4. Status Breakdown Bar Chart data ───────────────────────────────────
  const statusGroups = [
    { name: 'New', count: leads.filter(l => l.status === 'New').length, fill: '#6366f1' },
    { name: 'Contacted', count: leads.filter(l => l.status === 'Contacted').length, fill: '#a855f7' },
    { name: 'Interested', count: leads.filter(l => l.status === 'Interested').length, fill: '#06b6d4' },
    { name: 'Follow-Up', count: leads.filter(l => l.status === 'Follow-Up Pending').length, fill: '#f59e0b' },
    { name: 'Confirmed', count: leads.filter(l => l.status === 'Admission Confirmed').length, fill: '#10b981' },
    { name: 'Rejected', count: leads.filter(l => l.status === 'Rejected').length, fill: '#f43f5e' },
  ];

  // ─── 5. Export ─────────────────────────────────────────────────────────────
  const handleExportLeads = () => {
    const rows = leads.map(mapLeadToCSVRow);
    exportToCSV(rows, `leads_report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportCounselors = () => {
    const csvData = counselorsPerformance.map(c => ({
      'Counselor Name': c.name,
      'Email': c.email,
      'Active Leads': c.activeLeads,
      'Admissions Confirmed': c.admissions,
      'Conversion Rate (%)': c.conversionRate,
      'Target Achieved (%)': c.targetAchieved
    }));
    exportToCSV(csvData, 'counselor_performance_export.csv');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
            Performance Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            {isAdmin
              ? 'Deeper insights into admissions conversion funnels and counselor scorecards.'
              : 'Your personal lead conversion funnel and performance metrics.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportLeads}
            disabled={!leads.length}
            className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm hover:border-indigo-500/40 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> <span className="hidden xs:inline">Export Leads</span><span className="xs:hidden">Leads</span>
          </button>
          {isAdmin && (
            <button
              onClick={handleExportCounselors}
              disabled={!counselorsPerformance.length}
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm shadow-indigo-500/20 disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> <span className="hidden xs:inline">Export Report</span><span className="xs:hidden">Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Funnel + Sources Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Conversion Funnel */}
        <div className="lg:col-span-2 glass-panel p-5 sm:p-6 rounded-3xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
              Admissions Conversion Funnel
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Inquiry drop-off stages from registration to final admission
            </p>
          </div>

          <div className="space-y-4 my-6">
            {funnelWithPct.map((stage, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">{stage.name}</span>
                  <span className="text-slate-400 dark:text-slate-500">
                    {stage.count} <span className="hidden xs:inline">Students</span> ({stage.pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-900 h-8 rounded-xl overflow-hidden border border-slate-200/20 dark:border-slate-800/40">
                  <div
                    className={`h-full ${stage.color} opacity-85 transition-all duration-500`}
                    style={{ width: `${Math.max(stage.pct, stage.count > 0 ? 3 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800/50 pt-3">
            🎯 Funnel target: <strong>15%</strong>. Current: <strong>{conversionRate}%</strong>
            {conversionRate >= 15
              ? <span className="ml-1 text-emerald-500 font-bold">✓ Met</span>
              : <span className="ml-1 text-amber-500 font-bold">↑ Below</span>
            }
          </div>
        </div>

        {/* Source Channels */}
        <div className="glass-panel p-5 sm:p-6 rounded-3xl flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
              Source Channels
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Channels sorted by inquiry volume
            </p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-1">
            {sourcesBreakdown.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">No records</div>
            ) : (
              sourcesBreakdown.map((item, idx) => {
                const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 truncate pr-2">{item.name}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-semibold shrink-0">
                        {item.count} ({item.pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-200/20 dark:border-slate-800/40">
                      <div
                        className={`h-full ${colors[idx % colors.length]} rounded-full transition-all duration-500`}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Status Breakdown Bar Chart */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Lead Status Distribution</h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Count of leads grouped by their current pipeline status
          </p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={statusGroups} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }}
              labelStyle={{ color: '#e2e8f0', fontWeight: 700 }}
              itemStyle={{ color: '#94a3b8' }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Leads">
              {statusGroups.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Counselor Rankings (Admin only) */}
      {isAdmin && (
        <div className="glass-panel p-6 rounded-3xl space-y-6">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
              Counselor Performance Rankings
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Leaderboard of active counselors sorted by admissions closed
            </p>
          </div>

          {counselorsPerformance.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">No counselor data available</div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/10">
                    <th className="px-5 py-3 font-black text-slate-400 uppercase tracking-wider">Rank &amp; Counselor</th>
                    <th className="px-5 py-3 font-black text-slate-400 uppercase tracking-wider">Active Leads</th>
                    <th className="px-5 py-3 font-black text-slate-400 uppercase tracking-wider">Admissions Confirmed</th>
                    <th className="px-5 py-3 font-black text-slate-400 uppercase tracking-wider">Conversion Rate</th>
                    <th className="px-5 py-3 font-black text-slate-400 uppercase tracking-wider">Target Achieved (Goal: 5)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {counselorsPerformance.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-lg text-white font-bold flex items-center justify-center text-[10px] ${
                            idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-orange-400' : 'bg-indigo-100 dark:bg-indigo-950/20 !text-indigo-600'
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">{c.name}</span>
                            <span className="text-[10px] text-slate-400">{c.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{c.activeLeads} Leads</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`font-bold ${c.admissions > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                          {c.admissions} Confirmed
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`font-black ${c.conversionRate >= 15 ? 'text-emerald-600' : c.conversionRate > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                          {c.conversionRate}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-200/20 dark:border-slate-850">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${c.targetAchieved}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{c.targetAchieved}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
