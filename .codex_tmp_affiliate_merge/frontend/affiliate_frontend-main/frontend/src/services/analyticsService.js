import { monthlyPerformance, commissionByTier } from '../data/chartData';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const analyticsService = {
  getPerformanceTrends: async () => {
    await delay(600);
    return [...monthlyPerformance];
  },

  getCommissionTiers: async () => {
    await delay(400);
    return [...commissionByTier];
  }
};

export default analyticsService;
