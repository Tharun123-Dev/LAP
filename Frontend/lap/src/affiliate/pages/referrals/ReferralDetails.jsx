import React, { useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Calendar, ShieldCheck, DollarSign, Wallet } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { referralService } from '../../services/referralService';
import SkeletonLoader from '../../components/loaders/SkeletonLoader';
import Button from '../../components/buttons/Button';
import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';

export const ReferralDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Stable fetch function to prevent infinite loops in useFetch
  const fetchReferral = useCallback(() => referralService.getReferralById(id), [id]);

  // Fetch individual referral by parameter ID
  const { data: referral, loading, error } = useFetch(fetchReferral);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="font-bold text-rose-500">Error loading client detail: {error}</p>
        <Link to="/dashboard/affiliate/referrals">
          <Button variant="secondary" icon={ArrowLeft}>Back to Referrals</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/affiliate/referrals" className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-4.5 h-4.5" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Referral Account Details</h1>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">ID: {id}</p>
        </div>
      </div>

      {loading ? (
        <SkeletonLoader variant="card" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main User Info Sheet Card */}
          <div className="lg:col-span-1 glass-card p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-4">
            <img src={referral?.avatar} alt={referral?.name} className="w-24 h-24 rounded-full border-4 border-primary-500/20 object-cover shadow-md" />
            
            <div className="space-y-1">
              <h3 className="text-lg font-bold">{referral?.name}</h3>
              <p className="text-xs text-slate-400 font-semibold">{referral?.email}</p>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary-100 text-primary-800 dark:bg-primary-950/40 dark:text-primary-400">
              {referral?.plan}
            </span>

            <div className="w-full border-t border-slate-100 dark:border-slate-800 my-2" />

            <div className="w-full space-y-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Account Status</span>
                <span className={`font-bold uppercase ${
                  referral?.status === 'converted' ? 'text-emerald-500' : 
                  referral?.status === 'pending' ? 'text-amber-500' : 'text-rose-500'
                }`}>{referral?.status}</span>
              </div>
              <div className="flex justify-between">
                <span>Referral Date</span>
                <span className="text-slate-900 dark:text-white font-bold">{formatDate(referral?.joinedDate, 'short')}</span>
              </div>
              <div className="flex justify-between">
                <span>Commission Rule</span>
                <span className="text-slate-900 dark:text-white font-bold">{referral?.tier}</span>
              </div>
            </div>
          </div>

          {/* Detailed Financial & Usage Panel Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Client Spending</span>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(referral?.totalSpent)}</h3>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Your Earnings Received</span>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(referral?.commission)}</h3>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary-500/10 text-primary-500 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Campaign details summary card */}
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <h4 className="font-bold text-sm border-b border-slate-100 dark:border-slate-800 pb-3">Marketing Campaign Triggers</h4>
              
              <div className="space-y-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <p>This client completed user onboarding through your referral campaign. A commission percentage allocation rule was applied to their account.</p>
                
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Technical Trigger logs</p>
                  <ul className="space-y-1.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    <li>[UTM_SOURCE] : youtube-review-sarah</li>
                    <li>[UTM_CAMPAIGN] : spring-promotion-2026</li>
                    <li>[REFERRER_DOMAIN] : youtube.com</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralDetails;
