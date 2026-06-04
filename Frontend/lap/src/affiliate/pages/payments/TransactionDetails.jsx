import React, { useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CreditCard, Download, FileText } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { paymentService } from '../../services/paymentService';
import SkeletonLoader from '../../components/loaders/SkeletonLoader';
import Button from '../../components/buttons/Button';
import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';

export const TransactionDetails = () => {
  const { id } = useParams();

  const fetchTransaction = useCallback(() => paymentService.getTransactionDetails(id), [id]);

  const { data: tx, loading, error } = useFetch(fetchTransaction);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="font-bold text-rose-500">Error loading payment details: {error}</p>
        <Link to="/dashboard/affiliate/payments">
          <Button variant="secondary" icon={ArrowLeft}>Back to Payments</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/affiliate/payments" className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-4.5 h-4.5" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Receipt Transaction Details</h1>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">ID: {id}</p>
        </div>
      </div>

      {loading ? (
        <SkeletonLoader variant="card" />
      ) : (
        <div className="max-w-2xl mx-auto glass-card p-8 rounded-2xl flex flex-col gap-6 relative overflow-hidden">
          {/* Header Receipt status */}
          <div className="text-center py-4 flex flex-col items-center justify-center gap-3">
            <span className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-inner">
              <CheckCircle2 className="w-6 h-6" />
            </span>
            <div className="space-y-0.5">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(tx?.amount)}</h2>
              <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider">Settled & Cleared</p>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/80 my-2" />

          {/* Details breakdown */}
          <div className="space-y-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
            <div className="flex justify-between items-center">
              <span>Settlement Date</span>
              <span className="text-slate-900 dark:text-white font-bold">{formatDate(tx?.date, 'full')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Transfer Method</span>
              <span className="text-slate-900 dark:text-white font-bold flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-slate-400" />
                {tx?.method}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Invoice Assigned</span>
              <span className="text-slate-900 dark:text-white font-bold">{tx?.invoiceNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Description Reference</span>
              <span className="text-slate-900 dark:text-white font-bold">{tx?.description}</span>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/80 my-2" />

          {/* Action links */}
          <div className="flex justify-center gap-3.5">
            <Link to={`/dashboard/affiliate/payments/invoice/${id}`}>
              <Button variant="primary" icon={FileText}>
                View PDF Invoice
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionDetails;
