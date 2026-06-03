import React, { useState } from 'react';
import { Search, Calendar, FileText } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { earningsService } from '../../services/earningsService';
import SkeletonLoader from '../../components/loaders/SkeletonLoader';
import Button from '../../components/buttons/Button';
import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';

export const CommissionHistory = () => {
  const { data: history, loading } = useFetch(earningsService.getCommissionHistory);
  const [search, setSearch] = useState('');

  const filteredHistory = history?.filter(item => 
    item.referrer.toLowerCase().includes(search.toLowerCase()) ||
    item.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Commission Payout History</h1>
        <p className="text-slate-400 text-sm font-medium mt-1">
          Perform queries and print exports of all past earnings events.
        </p>
      </div>

      {/* Query Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <div className="relative w-full sm:flex-grow">
          <input
            type="text"
            placeholder="Search events by brand or plan type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
          <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
        </div>
        <Button variant="outline" size="sm" icon={FileText}>
          Export CSV
        </Button>
      </div>

      {/* History Ledger Table */}
      <div className="glass-card p-6 rounded-2xl">
        {loading ? (
          <SkeletonLoader variant="table" />
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="pb-3.5 pl-2">Client Brand</th>
                  <th className="pb-3.5">Pricing Trigger</th>
                  <th className="pb-3.5">Rate Applied</th>
                  <th className="pb-3.5">Trigger Date</th>
                  <th className="pb-3.5 text-right pr-2">Your Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
                {filteredHistory?.map((comm) => (
                  <tr key={comm.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 pl-2 font-bold text-slate-900 dark:text-white">
                      {comm.referrer}
                    </td>
                    <td className="py-4 font-semibold text-slate-500 dark:text-slate-400">
                      {comm.type}
                    </td>
                    <td className="py-4 font-bold text-slate-950 dark:text-white">
                      {comm.rate}
                    </td>
                    <td className="py-4 text-slate-400 font-semibold">
                      {formatDate(comm.date, 'short')}
                    </td>
                    <td className="py-4 text-right font-black text-emerald-600 dark:text-emerald-400 pr-2">
                      {formatCurrency(comm.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommissionHistory;