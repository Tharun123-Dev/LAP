import React from 'react';

export default function StatusBadge({ status }) {
  const styles = {
    'New': {
      bg: 'bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-400 border-cyan-200/50 dark:border-cyan-800/30',
      pulse: 'bg-cyan-500'
    },
    'Contacted': {
      bg: 'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border-purple-200/50 dark:border-purple-800/30',
      pulse: 'bg-purple-500'
    },
    'Interested': {
      bg: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/30',
      pulse: 'bg-emerald-500'
    },
    'Follow-Up Pending': {
      bg: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/30',
      pulse: 'bg-amber-500 animate-ping'
    },
    'Admission Confirmed': {
      bg: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-800/30',
      pulse: 'bg-indigo-500'
    },
    'Rejected': {
      bg: 'bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200/50 dark:border-slate-800/30',
      pulse: 'bg-slate-400'
    }
  };

  const currentStyle = styles[status] || {
    bg: 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800',
    pulse: 'bg-slate-400'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full border ${currentStyle.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${currentStyle.pulse}`} />
      {status}
    </span>
  );
}