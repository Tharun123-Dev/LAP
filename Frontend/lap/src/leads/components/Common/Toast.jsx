import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Toast() {
  const { toast, setToast } = useApp();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, setToast]);

  if (!toast) return null;

  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-indigo-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />
  };

  const borderColors = {
    success: 'border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-50/90 dark:bg-emerald-950/20',
    warning: 'border-amber-500/30 dark:border-amber-500/20 bg-amber-50/90 dark:bg-amber-950/20',
    info: 'border-indigo-500/30 dark:border-indigo-500/20 bg-indigo-50/90 dark:bg-indigo-950/20',
    error: 'border-rose-500/30 dark:border-rose-500/20 bg-rose-50/90 dark:bg-rose-950/20'
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 pointer-events-none">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-lg max-w-sm ${borderColors[toast.type]}`}
        >
          {iconMap[toast.type]}
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="p-1 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}