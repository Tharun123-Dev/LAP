// src/affiliate/services/paymentService.js
import { mockTransactions } from '../data/dummyData';
import affiliateApi from './affiliateApi';

const USE_API = import.meta.env.VITE_USE_AFFILIATE_API !== 'false';

const mapPayment = (p) => ({
  id: p.id,
  amount: p.amount || 0,
  status: p.status === 'completed' || p.status === 'paid' ? 'paid' : p.status === 'failed' ? 'failed' : 'pending',
  date: p.paid_at || p.date,
  method: p.payment_method || p.method || 'ACH/Direct Deposit',
  invoiceNumber: p.transaction_id || p.invoiceNumber || `INV-${String(p.id).substring(0, 8)}`,
  description: p.description || `Affiliate Commission Payout - Transaction ${p.transaction_id || ''}`,
});

export const paymentService = {
  getPaymentHistory: async () => {
    if (!USE_API) return mockTransactions;
    try {
      const data = await affiliateApi.get('/affiliate/payments/');
      return data ? data.map(mapPayment) : [];
    } catch {
      return mockTransactions;
    }
  },

  getTransactionDetails: async (id) => {
    if (!USE_API) return mockTransactions.find((tx) => tx.id === id) || mockTransactions[0];
    try {
      const data = await affiliateApi.get('/affiliate/payments/');
      const payment = data?.find((p) => p.id === id);
      if (!payment) throw new Error('Transaction not found');
      return mapPayment(payment);
    } catch {
      return mockTransactions.find((tx) => tx.id === id) || mockTransactions[0];
    }
  },

  requestPayout: async (amount) => {
    if (!USE_API) {
      return {
        id: `pay_${Date.now()}`,
        amount,
        status: 'pending',
        date: new Date().toISOString(),
        method: 'Manual payout',
        invoiceNumber: `REQ-${Date.now()}`,
      };
    }
    const data = await affiliateApi.post('/affiliate/payments/', { amount });
    return mapPayment(data);
  },
};

export default paymentService;
