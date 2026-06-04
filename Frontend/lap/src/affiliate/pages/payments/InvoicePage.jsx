import React, { useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer, Download, CreditCard } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { paymentService } from '../../services/paymentService';
import SkeletonLoader from '../../components/loaders/SkeletonLoader';
import Button from '../../components/buttons/Button';
import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';

export const InvoicePage = () => {
  const { id } = useParams();

  const fetchTransaction = useCallback(() => paymentService.getTransactionDetails(id), [id]);

  const { data: tx, loading } = useFetch(fetchTransaction);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header controls (Hidden on print) */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Link to={`/dashboard/affiliate/payments/${id}`} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-4.5 h-4.5" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Invoice Summary</h1>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">INVCODE: {id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} icon={Printer}>
            Print Receipt
          </Button>
        </div>
      </div>

      {loading ? (
        <SkeletonLoader variant="table" />
      ) : (
        /* Printable invoice card sheets */
        <div className="bg-white text-slate-900 border border-slate-200 shadow-xl rounded-2xl p-8 md:p-12 space-y-8 print:border-none print:shadow-none print:p-0">
          {/* Logo & Info */}
          <div className="flex flex-col sm:flex-row justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-emerald-500 flex items-center justify-center text-white font-extrabold text-lg">
                  A
                </div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Affiliate Inc.
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 max-w-xs leading-relaxed">
                100 Pine Street, Suite 1200<br />
                San Francisco, CA 94111<br />
                billing@affiliatesaas.io
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <h2 className="text-2xl font-black text-slate-400 tracking-tight uppercase">Invoice Receipt</h2>
              <p className="text-xs font-bold text-slate-700">Invoice Ref: <span className="font-black text-slate-950">{tx?.invoiceNumber}</span></p>
              <p className="text-xs font-bold text-slate-700">Settled Date: <span className="font-black text-slate-950">{formatDate(tx?.date, 'short')}</span></p>
            </div>
          </div>

          <div className="border-t border-slate-100 my-4" />

          {/* Billing addresses split */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Billed To</h4>
              <p className="text-sm font-black text-slate-900">Sarah Jenkins</p>
              <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                500 Silicon Valley Blvd, Apt 4C<br />
                San Jose, CA 95112<br />
                sarah.jenkins@affiliate.io
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Disbursement method</h4>
              <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-1">
                <CreditCard className="w-4 h-4 text-slate-400" />
                {tx?.method}
              </p>
              <p className="text-xs font-semibold text-slate-500">Status: <span className="font-bold text-emerald-600 uppercase">Paid / Cleared</span></p>
            </div>
          </div>

          {/* Line items table */}
          <div className="overflow-x-auto pt-4">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="pb-3.5 pl-2">Line Item Service Description</th>
                  <th className="pb-3.5 text-right">Unit Price</th>
                  <th className="pb-3.5 text-right">Quantity</th>
                  <th className="pb-3.5 text-right pr-2">Total Yield</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-4 pl-2">
                    <p className="font-bold text-slate-900">{tx?.description}</p>
                    <p className="text-[11px] font-semibold text-slate-400 mt-0.5">SaaS Referral subscription payout cycles</p>
                  </td>
                  <td className="py-4 text-right font-medium text-slate-700">{formatCurrency(tx?.amount)}</td>
                  <td className="py-4 text-right font-medium text-slate-700">1</td>
                  <td className="py-4 text-right font-black text-slate-900 pr-2">{formatCurrency(tx?.amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-200/80 pt-4 flex flex-col items-end gap-2.5">
            <div className="w-full sm:w-64 space-y-2 text-xs font-bold text-slate-500">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-slate-900">{formatCurrency(tx?.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax Fee (0.00%)</span>
                <span className="text-slate-900">$0.00</span>
              </div>
              <div className="border-t border-slate-100 my-1" />
              <div className="flex justify-between text-sm font-black">
                <span className="text-slate-900">Total Paid Out</span>
                <span className="text-primary-600">{formatCurrency(tx?.amount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicePage;
