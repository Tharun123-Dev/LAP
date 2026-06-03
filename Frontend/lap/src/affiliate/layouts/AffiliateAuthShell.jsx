import { Link } from 'react-router-dom';
import { BadgeIndianRupee, BarChart3, Handshake, ShieldCheck } from 'lucide-react';

export default function AffiliateAuthShell({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white lg:grid lg:grid-cols-[minmax(360px,0.95fr)_minmax(420px,1.05fr)]">
      <section className="relative hidden overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.22),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.18),transparent_32%)]" />
        <div className="relative z-10 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary-600 to-emerald-500 text-lg font-black shadow-lg shadow-primary-500/25">
            A
          </span>
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-primary-200">LAP Affiliate</p>
            <p className="text-xs font-semibold text-slate-400">Partner revenue workspace</p>
          </div>
        </div>

        <div className="relative z-10 max-w-xl space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-emerald-200">
            <ShieldCheck className="h-4 w-4" />
            Verified partner onboarding
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black leading-tight tracking-tight">
              Create an affiliate account and start tracking every referral.
            </h1>
            <p className="text-sm font-medium leading-7 text-slate-300">
              Register once, generate referral links, monitor commissions, and manage payouts from one focused dashboard.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Referral links', icon: Handshake },
              { label: 'Live analytics', icon: BarChart3 },
              { label: 'Payouts', icon: BadgeIndianRupee },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <item.icon className="mb-3 h-5 w-5 text-primary-200" />
                <p className="text-xs font-bold text-slate-200">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs font-semibold text-slate-500">Affiliate onboarding for LAP System</p>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-slate-50 p-4 text-slate-950 sm:p-6 lg:p-10">
        <div className="w-full max-w-xl">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Link to="/login" className="text-sm font-bold text-slate-500">Back to login</Link>
            <span className="rounded-xl bg-primary-600 px-3 py-1.5 text-xs font-black text-white">Affiliate</span>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
            {children}
          </div>
        </div>
      </section>
    </div>
  );
}
