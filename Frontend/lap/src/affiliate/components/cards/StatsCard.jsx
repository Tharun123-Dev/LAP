import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../../utils/helpers';

export const StatsCard = ({
  title,
  value,
  trend,
  trendType = 'up', // 'up' | 'down'
  timeframe = 'vs last month',
  icon: Icon,
  iconBg = 'bg-primary-500/10 text-primary-500',
  className,
}) => {
  return (
    <div className={cn("glass-card glass-card-hover p-6 rounded-2xl flex items-start justify-between relative overflow-hidden", className)}>
      
      {/* Decorative gradient overlay */}
      <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-bl from-slate-500/5 to-transparent rounded-bl-full pointer-events-none" />

      <div className="space-y-3.5">
        <div>
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{title}</span>
          <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">{value}</h3>
        </div>
        
        {trend && (
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <span className={cn(
              "flex items-center gap-0.5 px-2 py-0.5 rounded-full font-bold",
              trendType === 'up' 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            )}>
              {trendType === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {trend}
            </span>
            <span className="text-slate-400 dark:text-slate-500">{timeframe}</span>
          </div>
        )}
      </div>

      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-inner", iconBg)}>
        {Icon && <Icon className="w-6 h-6" />}
      </div>
      
    </div>
  );
};

export default StatsCard;