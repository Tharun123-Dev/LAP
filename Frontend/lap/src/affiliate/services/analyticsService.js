// src/affiliate/services/analyticsService.js
import { monthlyPerformance } from '../data/chartData';
import affiliateApi from './affiliateApi';

const USE_API = import.meta.env.VITE_USE_AFFILIATE_API !== 'false';

export const analyticsService = {
  getPerformanceTrends: async () => {
    if (!USE_API) return monthlyPerformance;
    try {
      const data = await affiliateApi.get('/affiliate/analytics/earnings-performance/');
      return data.map((item) => ({
        month: item.month,
        commission: item.earnings || item.commission || 0,
        clicks: item.clicks || 0,
      }));
    } catch {
      return monthlyPerformance;
    }
  },

  getReferralGrowth: async () => {
    if (!USE_API) return monthlyPerformance.map((item) => ({ date: item.month, referrals: item.referrals }));
    try {
      return await affiliateApi.get('/affiliate/analytics/referral-growth/');
    } catch {
      return monthlyPerformance.map((item) => ({ date: item.month, referrals: item.referrals }));
    }
  },
};

export default analyticsService;
