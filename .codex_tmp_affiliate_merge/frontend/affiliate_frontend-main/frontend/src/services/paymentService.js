import api from './api';

const mapPayment = (p) => {
  return {
    id: p.id,
    amount: p.amount || 0,
    status: p.status === 'completed' || p.status === 'paid' ? 'paid' : p.status === 'failed' ? 'failed' : 'pending',
    date: p.paid_at || p.date,
    method: p.payment_method || p.method || 'ACH/Direct Deposit',
    invoiceNumber: p.transaction_id || p.invoiceNumber || `INV-${p.id.substring(0, 8)}`,
    description: p.description || `Affiliate Commission Payout - Transaction ${p.transaction_id || ''}`,
  };
};

export const paymentService = {
  getPaymentHistory: async () => {
    const data = await api.get('/v1/affiliate/payments/');
    if (!data) return [];
    return data.map(mapPayment);
  },

  getTransactionDetails: async (id) => {
    const data = await api.get('/v1/affiliate/payments/');
    const payment = data?.find(p => p.id === id);
    if (!payment) {
      throw new Error('Transaction record not found');
    }
    return mapPayment(payment);
  },

  requestPayout: async (amount) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (!amount || amount <= 0) throw new Error('Invalid payout amount');
    return {
      id: 'tx_new_' + Math.random().toString(36).substr(2, 5),
      amount,
      status: 'pending',
      date: new Date().toISOString(),
      method: 'ACH/Direct Deposit',
      invoiceNumber: `INV-REQ-${Math.floor(Math.random() * 9000 + 1000)}`,
      description: 'Affiliate Requested Payout (Processing)',
    };
  }
};

export default paymentService;
