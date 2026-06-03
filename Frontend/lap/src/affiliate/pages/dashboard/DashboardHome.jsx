import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  DollarSign, Percent, TrendingUp, Plus, RefreshCw, Layers,
  Wallet, MousePointer, Megaphone, Users
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

import useFetch from '../../hooks/useFetch';
import { earningsService } from '../../services/earningsService';
import { analyticsService } from '../../services/analyticsService';
import { referralService } from '../../services/referralService';

import StatsCard from '../../components/cards/StatsCard';
import SkeletonLoader from '../../components/loaders/SkeletonLoader';
import Button from '../../components/buttons/Button';
import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';

export const DashboardHome = () => {
  const navigate = useNavigate();
  // Fetch stats summary asynchronously
  const { data: stats, loading: statsLoading, execute: reloadStats } = useFetch(
    earningsService.getEarningsSummary
  );

  // Fetch graphs performance trends
  const { data: trends, loading: trendsLoading, execute: reloadTrends } = useFetch(
    analyticsService.getPerformanceTrends
  );

  // Fetch recent referrals
  const { data: referrals, loading: referralsLoading, execute: reloadReferrals } = useFetch(
    referralService.getReferrals
  );

  const handleRefreshAll = () => {
    reloadStats();
    reloadTrends();
    reloadReferrals();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 20 } }
  };
  const safeStats = stats || {};
  const safeTrends = Array.isArray(trends) ? trends : [];
  const safeReferrals = Array.isArray(referrals) ? referrals : [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xl text-xs font-semibold space-y-1">
          <p className="text-slate-400">{label}</p>
          <p className="text-primary-500">Commission: {formatCurrency(payload[0]?.value || 0)}</p>
          <p className="text-emerald-500">Clicks: {payload[1]?.value || 0}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 md:space-y-8"
    >
      {/* Top Banner Greeting */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-sans">
            Dashboard Overview
          </h1>
          <p className="text-slate-400 text-sm font-medium mt-1">
            Track metrics, active campaigns, and payout releases in real time.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshAll}
            icon={RefreshCw}
          >
            Refresh
          </Button>
          {/* <Button 
            variant="emerald" 
            size="sm" 
            icon={Plus}
          >
            Create Link
          </Button> */}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statsLoading ? (
          <SkeletonLoader count={8} />
        ) : (
          <>
            <motion.div variants={itemVariants}>
              <StatsCard
                title="Total Earnings"
                value={formatCurrency(safeStats.total)}
                trend="+15.3%"
                trendType="up"
                icon={DollarSign}
                iconBg="bg-primary-500/10 text-primary-500 dark:bg-primary-500/20"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatsCard
                title="Pending Earnings"
                value={formatCurrency(safeStats.pending)}
                trend="+4.8%"
                trendType="up"
                icon={Layers}
                iconBg="bg-amber-500/10 text-amber-500 dark:bg-amber-500/20"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatsCard
                title="Paid Earnings"
                value={formatCurrency(safeStats.paid)}
                trend="+12.0%"
                trendType="up"
                icon={Wallet}
                iconBg="bg-blue-500/10 text-blue-500 dark:bg-blue-500/20"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatsCard
                title="Monthly Performance"
                value={formatCurrency(safeStats.thisMonth)}
                trend="+24.1%"
                trendType="up"
                icon={TrendingUp}
                iconBg="bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatsCard
                title="Conversion Rate"
                value={`${safeStats.conversionRate || 0}%`}
                trend="-0.5%"
                trendType="down"
                icon={Percent}
                iconBg="bg-rose-500/10 text-rose-500 dark:bg-rose-500/20"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatsCard
                title="Total Clicks"
                value={safeStats.totalClicks || 0}
                trend="+8.2%"
                trendType="up"
                icon={MousePointer}
                iconBg="bg-purple-500/10 text-purple-500 dark:bg-purple-500/20"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatsCard
                title="Total Referrals"
                value={safeStats.totalReferrals || 0}
                trend="+5.0%"
                trendType="up"
                icon={Users}
                iconBg="bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatsCard
                title="Active Campaigns"
                value={safeStats.activeCampaigns || 0}
                trend="0"
                trendType="neutral"
                icon={Megaphone}
                iconBg="bg-cyan-500/10 text-cyan-500 dark:bg-cyan-500/20"
              />
            </motion.div>
          </>
        )}      </div>

      {/* Primary Analytics Graph Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Large Performance Chart */}
        <motion.div 
          variants={itemVariants} 
          className="lg:col-span-2 glass-card p-6 rounded-2xl flex flex-col gap-6"
        >
          <div className="flex items-center justify-between border-b border-slate-100/50 dark:border-slate-800/50 pb-4">
            <div>
              <h3 className="font-bold text-base">Performance Revenue Trends</h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Clicks vs Commissions earned</p>
            </div>
            <select className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none">
              <option>Last 6 Months</option>
              <option>Last 30 Days</option>
            </select>
          </div>

          <div className="h-72 w-full">
            {trendsLoading ? (
              <div className="w-full h-full shimmer rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={safeTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} />
                  <YAxis tickLine={false} axisLine={false} style={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="commission" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#commGrad)" />
                  <Area type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#clickGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Dynamic click source breakdown */}
        <motion.div 
          variants={itemVariants} 
          className="glass-card p-6 rounded-2xl flex flex-col gap-6"
        >
          <div className="flex items-center justify-between border-b border-slate-100/50 dark:border-slate-800/50 pb-4">
            <div>
              <h3 className="font-bold text-base">Channel Click Sources</h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Top-performing referrers</p>
            </div>
          </div>

          <div className="h-72 w-full flex flex-col justify-between">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { name: 'Twitter/X', value: 450 },
                { name: 'YouTube', value: 380 },
                { name: 'Blog', value: 310 },
                { name: 'LinkedIn', value: 240 }
              ]} layout="vertical" margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} style={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
                  <Cell fill="#8b5cf6" />
                  <Cell fill="#ef4444" />
                  <Cell fill="#10b981" />
                  <Cell fill="#3b82f6" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs font-semibold text-slate-500">
              <div className="flex justify-between items-center">
                <span>Twitter Campaign</span>
                <span className="text-slate-900 dark:text-white font-extrabold">45.0%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>YouTube Promos</span>
                <span className="text-slate-900 dark:text-white font-extrabold">38.0%</span>
              </div>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Recent Referrals list card */}
      <div className="grid grid-cols-1 gap-6">
        <motion.div variants={itemVariants} className="glass-card p-6 rounded-2xl flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-slate-100/50 dark:border-slate-800/50 pb-4">
            <div>
              <h3 className="font-bold text-base">Recent Referral Subscriptions</h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Top latest accounts registered via your promo links</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/affiliate/referrals')}>
              View All Referrals
            </Button>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            {referralsLoading ? (
              <div className="h-32 shimmer rounded-xl" />
            ) : (
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="pb-3.5 pl-2">Affiliate Brand</th>
                    <th className="pb-3.5">Registration Date</th>
                    <th className="pb-3.5">Assigned tier</th>
                    <th className="pb-3.5 text-right pr-2">Your Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
                  {safeReferrals.slice(0, 3).map((ref) => (
                    <tr key={ref.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 pl-2">
                        <div className="flex items-center gap-3">
                          <img src={ref.avatar} className="w-9 h-9 rounded-full object-cover border border-slate-100 dark:border-slate-800 shadow-sm" alt={ref.name} />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{ref.name}</p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{ref.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 font-medium text-slate-500 dark:text-slate-400">
                        {formatDate(ref.joinedDate, 'short')}
                      </td>
                      <td className="py-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-500/10 text-primary-600 dark:text-primary-400">
                          {ref.tier}
                        </span>
                      </td>
                      <td className="py-4 text-right font-black text-emerald-600 dark:text-emerald-400 pr-2">
                        {formatCurrency(ref.commission)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </div>

    </motion.div>
  );
};

export default DashboardHome;
