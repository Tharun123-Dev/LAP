import React from 'react';
import { motion } from 'framer-motion';
import { 
  UserPlus, DollarSign, Award, Bell, Settings, ArrowUpRight, 
  Clock, ShieldAlert, Sparkles
} from 'lucide-react';
import formatDate from '../../utils/formatDate';

export const ActivityTimeline = () => {
  const activities = [
    {
      id: 'act_001',
      title: 'New Affiliate Joined',
      description: 'GrowthHack Agency signed up using landing page campaign referral link.',
      time: '2026-05-23T18:40:00Z',
      type: 'signup',
      icon: UserPlus,
      color: 'bg-emerald-500/10 text-emerald-500',
    },
    {
      id: 'act_002',
      title: 'Enterprise Upgrade Event',
      description: 'Acme Corporation upgraded to Enterprise Pro Monthly Plan (+$299.00/mo Commission).',
      time: '2026-05-23T16:45:00Z',
      type: 'upgrade',
      icon: Award,
      color: 'bg-primary-500/10 text-primary-500',
    },
    {
      id: 'act_003',
      title: 'Payout Deposited Successfully',
      description: 'Your commission payout of $1,450.00 was successfully deposited via ACH.',
      time: '2026-05-01T10:00:00Z',
      type: 'payout',
      icon: DollarSign,
      color: 'bg-emerald-500/10 text-emerald-500',
    },
    {
      id: 'act_004',
      title: 'System Campaign Created',
      description: 'You launched a new promotional link for Twitter "Summer Discount Promo".',
      time: '2026-04-20T11:30:00Z',
      type: 'system',
      icon: Sparkles,
      color: 'bg-amber-500/10 text-amber-500',
    }
  ];

  return (
    <div className="glass-card p-6 rounded-2xl flex flex-col gap-6">
      <div>
        <h3 className="font-bold text-base">Activity Timeline Logs</h3>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">Chronological system events and alerts</p>
      </div>

      <div className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-800 space-y-8 py-2 ml-4">
        {activities.map((act, index) => {
          const Icon = act.icon;
          return (
            <motion.div 
              key={act.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Bullet icon badge */}
              <span className={`absolute -left-10 top-0.5 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm ${act.color}`}>
                <Icon className="w-4 h-4" />
              </span>

              <div className="space-y-1">
                <div className="flex items-center justify-between gap-4">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{act.title}</h4>
                  <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(act.time).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pr-6">{act.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityTimeline;