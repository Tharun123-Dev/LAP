// src/affiliate/services/earningsService.js
import { mockReferrals, mockUser } from '../data/dummyData';
import affiliateApi from './affiliateApi';

const USE_API = import.meta.env.VITE_USE_AFFILIATE_API !== 'false';

const fallbackSummary = () => ({
  total: mockUser.earnings.total,
  pending: mockUser.earnings.pending,
  paid: mockUser.earnings.unpaid || mockUser.earnings.paid || 0,
  thisMonth: mockUser.earnings.thisMonth,
  conversionRate: 6.27,
  totalClicks: 26400,
  totalReferrals: mockReferrals.length,
  activeCampaigns: 3,
});

const fallbackCommissions = () => mockReferrals.map((ref) => ({
  id: `comm_${ref.id}`,
  referrer: ref.name,
  type: ref.plan,
  rate: '10%',
  amount: ref.commission || 0,
  date: ref.joinedDate,
  status: ref.status === 'converted' ? 'paid' : 'pending',
}));

export const earningsService = {
  getEarningsSummary: async () => {
    if (!USE_API) return fallbackSummary();
    try {
      const data = await affiliateApi.get('/affiliate/analytics/dashboard-stats/');
      return {
        total: data.total_earnings || 0,
        pending: data.pending_earnings || 0,
        paid: data.paid_earnings || 0,
        thisMonth: data.this_month_earnings || 0,
        conversionRate: data.conversion_rate || 0,
        totalClicks: data.total_clicks || 0,
        totalReferrals: data.total_referrals || 0,
        activeCampaigns: data.active_campaigns || 0,
      };
    } catch {
      return fallbackSummary();
    }
  },

  getCommissionHistory: async () => {
    if (!USE_API) return fallbackCommissions();
    try {
      const [commissions, referrals] = await Promise.all([
        affiliateApi.get('/affiliate/commissions/'),
        affiliateApi.get('/affiliate/referrals/'),
      ]);
      const referralsMap = referrals.reduce((acc, ref) => {
        acc[ref.id] = ref;
        return acc;
      }, {});
      return commissions.map((comm) => {
        const referral = referralsMap[comm.referral_id || comm.referral] || {};
        return {
          id: comm.id,
          referrer: referral.customer_name || 'Anonymous Customer',
          type: referral.purchase_amount ? `Sale (${referral.purchase_amount})` : 'Subscription',
          rate: '10%',
          amount: comm.amount || 0,
          date: comm.created_at,
          status: comm.status || 'pending',
        };
      });
    } catch {
      return fallbackCommissions();
    }
  },
};

export default earningsService;
