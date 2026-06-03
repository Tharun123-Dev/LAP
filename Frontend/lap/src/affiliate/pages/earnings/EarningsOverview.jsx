import React from 'react';
import { DollarSign, Wallet, Calendar, AlertCircle } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { earningsService } from '../../services/earningsService';
import StatsCard from '../../components/cards/StatsCard';
import SkeletonLoader from '../../components/loaders/SkeletonLoader';
import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';

export const EarningsOverview = () => {
  const { data: stats, loading: statsLoading } = useFetch(earningsService.getEarningsSummary);
  const { data: history, loading: historyLoading } = useFetch(earningsService.getCommissionHistory);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Earnings Overview</h1>
        <p className="text-slate-400 text-sm font-medium mt-1">
          Monitor your commissions, unpaid ledger balances, and pending approvals.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statsLoading ? (
          <SkeletonLoader count={4} />
        ) : (
          <>
            <StatsCard
              title="Total Earnings"
              value={formatCurrency(stats?.total)}
              trend="+15.3%"
              trendType="up"
              icon={DollarSign}
              iconBg="bg-primary-500/10 text-primary-500"
            />
            <StatsCard
              title="Pending Approval"
              value={formatCurrency(stats?.pending)}
              trend="+4.8%"
              trendType="up"
              icon={AlertCircle}
              iconBg="bg-amber-500/10 text-amber-500"
            />
            <StatsCard
              title="Unpaid Balance"
              value={formatCurrency(stats?.unpaid)}
              icon={Wallet}
              iconBg="bg-emerald-500/10 text-emerald-500"
            />
            <StatsCard
              title="This Month"
              value={formatCurrency(stats?.thisMonth)}
              trend="+24.1%"
              trendType="up"
              icon={Calendar}
              iconBg="bg-blue-500/10 text-blue-500"
            />
          </>
        )}
      </div>

      {/* Commission Approvals Ledger Panel */}
      <div className="glass-card p-6 rounded-2xl flex flex-col gap-6">
        <div>
          <h3 className="font-bold text-base">Commission Ledger Logs</h3>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Approved and pending subscription commissions</p>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          {historyLoading ? (
            <SkeletonLoader variant="table" />
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="pb-3.5 pl-2">Client Referrer</th>
                  <th className="pb-3.5">Trigger Event</th>
                  <th className="pb-3.5">Rate Applied</th>
                  <th className="pb-3.5">Event Date</th>
                  <th className="pb-3.5 text-right pr-2">Your Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
                {history?.map((comm) => (
                  <tr key={comm.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 pl-2 font-bold text-slate-900 dark:text-white">
                      {comm.referrer}
                    </td>
                    <td className="py-4 font-semibold text-slate-500 dark:text-slate-400">
                      {comm.type}
                    </td>
                    <td className="py-4 font-bold text-slate-900 dark:text-white">
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
          )}
        </div>
      </div>
    </div>
  );
};

export default EarningsOverview;