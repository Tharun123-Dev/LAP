import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/Common/StatusBadge';
import { CalendarClock, CheckCircle2, Search } from 'lucide-react';

export default function FollowUpsPage() {
  const { followups, leads, updateFollowUp } = useApp();
  const [search, setSearch] = useState('');

  const leadById = useMemo(() => {
    const lookup = {};
    leads.forEach((lead) => {
      lookup[String(lead.id)] = lead;
    });
    return lookup;
  }, [leads]);

  const rows = followups
    .map((followup) => ({ ...followup, lead: leadById[String(followup.lead_id)] }))
    .filter((followup) => {
      const text = `${followup.note || ''} ${followup.lead?.full_name || ''} ${followup.lead?.email || ''}`.toLowerCase();
      return text.includes(search.toLowerCase());
    })
    .sort((a, b) => new Date(a.scheduled_at || a.created_at) - new Date(b.scheduled_at || b.created_at));

  const markComplete = async (followup) => {
    await updateFollowUp(followup.id, { completed: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Follow Ups</h1>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            Track scheduled lead conversations and pending counselor actions.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search follow ups..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {rows.length === 0 ? (
          <div className="glass-panel rounded-3xl p-10 text-center">
            <CalendarClock className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">No follow ups found</p>
          </div>
        ) : rows.map((followup) => (
          <div key={followup.id} className="glass-panel rounded-2xl p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                    {followup.lead?.full_name || `Lead #${followup.lead_id}`}
                  </h3>
                  {followup.lead?.status && <StatusBadge status={followup.lead.status} />}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{followup.lead?.email || 'No email'}</p>
                <p className="mt-3 text-sm font-medium leading-6 text-slate-700 dark:text-slate-300">{followup.note}</p>
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                  followup.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {followup.completed ? 'Completed' : 'Pending'}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {followup.scheduled_at ? new Date(followup.scheduled_at).toLocaleString() : 'No schedule'}
                </span>
                {!followup.completed && (
                  <button
                    onClick={() => markComplete(followup)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Complete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
