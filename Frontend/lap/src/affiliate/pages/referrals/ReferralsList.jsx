import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ArrowUpRight, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { referralService } from '../../services/referralService';
import SkeletonLoader from '../../components/loaders/SkeletonLoader';
import Button from '../../components/buttons/Button';
import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';

export const ReferralsList = () => {
  const { data: referrals, loading } = useFetch(referralService.getReferrals);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  const getStatusBadge = (status) => {
    switch (status) {
      case 'converted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Converted
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
            <AlertCircle className="w-3.5 h-3.5" />
            Pending
          </span>
        );
      case 'rejected':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
    }
  };

  const filteredReferrals = referrals?.filter((ref) => {
    const matchesSearch = ref.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ref.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ref.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ref.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Referral Management</h1>
        <p className="text-slate-400 text-sm font-medium mt-1">
          Manage, track, and filter your referred customers and their conversion status.
        </p>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <div className="relative w-full sm:flex-grow">
          <input
            type="text"
            placeholder="Search by ID, name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
          <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Filter className="w-4.5 h-4.5 text-slate-400 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-36 px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm font-semibold focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="converted">Converted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Referrals Table Panel */}
      <div className="glass-card p-6 rounded-2xl">
        {loading ? (
          <SkeletonLoader variant="table" />
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="pb-3.5 pl-2">Referral ID</th>
                  <th className="pb-3.5">Customer Details</th>
                  <th className="pb-3.5">Referral Date</th>
                  <th className="pb-3.5">Status</th>
                  <th className="pb-3.5 text-right">Purchase Amount</th>
                  <th className="pb-3.5 pr-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
                {filteredReferrals?.map((ref) => (
                  <tr key={ref.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors cursor-pointer" onClick={() => navigate(`/dashboard/affiliate/referrals/${ref.id}`)}>
                    <td className="py-4 pl-2 font-mono text-xs font-bold text-slate-400">
                      {ref.id}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <img src={ref.avatar} className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-slate-800 shadow-sm" alt={ref.name} />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{ref.name}</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">{ref.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 font-semibold text-slate-500 dark:text-slate-400">
                      {formatDate(ref.joinedDate, 'short')}
                    </td>
                    <td className="py-4">
                      {getStatusBadge(ref.status)}
                    </td>
                    <td className="py-4 text-right font-black text-slate-900 dark:text-white">
                      {formatCurrency(ref.totalSpent)}
                    </td>
                    <td className="py-4 text-right pr-2">
                      <Button variant="ghost" size="sm" className="p-1 rounded-full">
                        <ArrowUpRight className="w-4 h-4 text-slate-400" />
                      </Button>
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

export default ReferralsList;
