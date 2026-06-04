import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, CheckCircle2, AlertCircle, XCircle, ArrowUpRight, DollarSign, Calendar } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { paymentService } from '../../services/paymentService';
import SkeletonLoader from '../../components/loaders/SkeletonLoader';
import Button from '../../components/buttons/Button';
import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';
import { useNotifications } from '../../hooks/useNotifications';

export const PaymentHistory = () => {
  const { data: payments, loading, execute: reloadPayments } = useFetch(paymentService.getPaymentHistory);
  const [requesting, setRequesting] = useState(false);
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const handleRequestPayout = async () => {
    setRequesting(true);
    try {
      await paymentService.requestPayout(500.00);
      addNotification(`Payout request of ${formatCurrency(500.00)} submitted successfully!`, 'success');
      reloadPayments();
    } catch (err) {
      addNotification(err.message || 'Payout request failed', 'error');
    } finally {
      setRequesting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Paid
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
            <AlertCircle className="w-3.5 h-3.5" />
            Pending
          </span>
        );
      case 'failed':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400">
            <XCircle className="w-3.5 h-3.5" />
            Failed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Payout Disbursements</h1>
          <p className="text-slate-400 text-sm font-medium mt-1">
            Track and request your commission disbursements directly to your bank account.
          </p>
        </div>

        <Button 
          variant="primary" 
          size="sm" 
          onClick={handleRequestPayout}
          isLoading={requesting}
        >
          Request Custom Payout
        </Button>
      </div>

      {/* Payment History List Table */}
      <div className="glass-card p-6 rounded-2xl">
        {loading ? (
          <SkeletonLoader variant="table" />
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="pb-3.5 pl-2">Invoice Code</th>
                  <th className="pb-3.5">Settlement Method</th>
                  <th className="pb-3.5">Settlement Date</th>
                  <th className="pb-3.5">Disbursement status</th>
                  <th className="pb-3.5 text-right">Disbursed Total</th>
                  <th className="pb-3.5 pr-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
                {payments?.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors cursor-pointer" onClick={() => navigate(`/dashboard/affiliate/payments/${pay.id}`)}>
                    <td className="py-4 pl-2 font-bold text-slate-900 dark:text-white">
                      {pay.invoiceNumber}
                    </td>
                    <td className="py-4 font-semibold text-slate-500 dark:text-slate-400">
                      {pay.method}
                    </td>
                    <td className="py-4 font-semibold text-slate-400">
                      {formatDate(pay.date, 'short')}
                    </td>
                    <td className="py-4">
                      {getStatusBadge(pay.status)}
                    </td>
                    <td className="py-4 text-right font-black text-slate-900 dark:text-white">
                      {formatCurrency(pay.amount)}
                    </td>
                    <td className="py-4 text-right pr-2">
                      <Button variant="ghost" size="sm" className="p-1 rounded-full">
                        <ArrowUpRight className="w-4 h-4 text-slate-400" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;
