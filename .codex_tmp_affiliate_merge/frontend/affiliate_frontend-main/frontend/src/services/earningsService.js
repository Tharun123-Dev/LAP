import api from './api';

export const earningsService = {
  getEarningsSummary: async () => {
    const data = await api.get('/v1/affiliate/analytics/dashboard-stats');
    return {
      total: data.total_earnings || 0,
      pending: data.pending_earnings || 0,
      paid: data.paid_earnings || 0,
      thisMonth: data.this_month_earnings || 0,
      conversionRate: data.conversion_rate || 0,
      totalClicks: data.total_clicks || 0,
      totalReferrals: data.total_referrals || 0,
      activeCampaigns: data.active_campaigns || 0
    };
  },

  getCommissionHistory: async () => {
    const [commissions, referrals] = await Promise.all([
      api.get('/v1/affiliate/commissions/'),
      api.get('/v1/affiliate/referrals/'),
    ]);
    
    const referralsMap = referrals.reduce((acc, ref) => {
      acc[ref.id] = ref;
      return acc;
    }, {});
    
    return commissions.map((comm) => {
      const referral = referralsMap[comm.referral_id] || {};
      return {
        id: comm.id,
        referrer: referral.customer_name || 'Anonymous Customer',
        type: referral.purchase_amount ? `Sale ($${referral.purchase_amount.toFixed(2)})` : 'SaaS Subscription',
        rate: '10%',
        amount: comm.amount || 0,
        date: comm.created_at,
        status: comm.status || 'pending',
      };
    });
  }
};

export default earningsService;
