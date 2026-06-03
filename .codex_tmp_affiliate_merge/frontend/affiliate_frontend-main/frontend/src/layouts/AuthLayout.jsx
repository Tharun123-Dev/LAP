import React from 'react';
import { motion } from 'framer-motion';

export const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
      
      {/* Visual branding side panel (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden items-center justify-center p-12">
        {/* Animated Background gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[60%] rounded-full bg-primary-600/20 blur-[130px] animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] rounded-full bg-emerald-500/20 blur-[130px] animate-float" style={{ animationDelay: '2s' }} />

        {/* Decorative Grid overlays */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px]" />

        {/* Core content wrapper */}
        <div className="relative z-10 max-w-lg text-center lg:text-left flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-emerald-500 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-primary-500/30">
              A
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">
              AffiliateSaaS
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, cubicBezier: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight font-sans">
              Accelerate Your <br />
              <span className="bg-gradient-to-r from-primary-400 to-emerald-400 bg-clip-text text-transparent">
                Affiliate Revenue Growth
              </span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Unlock professional dashboards, precise analytical funnels, and streamlined payouts built for modern SaaS marketing experts.
            </p>
          </motion.div>

          {/* Social Proof badges card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex justify-between gap-4 mt-4"
          >
            <div>
              <p className="text-2xl font-black text-white">$24M+</p>
              <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">Commissions Paid</p>
            </div>
            <div className="border-r border-white/10" />
            <div>
              <p className="text-2xl font-black text-white">45K+</p>
              <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">Active Marketers</p>
            </div>
            <div className="border-r border-white/10" />
            <div>
              <p className="text-2xl font-black text-white">99.8%</p>
              <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">Payout Reliability</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Auth page content panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-16">
        <div className="w-full max-w-md">
          {/* Mobile branding */}
          <div className="flex items-center gap-2 lg:hidden justify-center mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-emerald-500 flex items-center justify-center text-white font-extrabold">
              A
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
              AffiliateSaaS
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </div>
      </div>

    </div>
  );
};

export default AuthLayout;
