import React, { useState } from 'react';
import { ToggleLeft, ToggleRight, Mail, Settings, Bell, Save } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import Button from '../../components/buttons/Button';

export const Preferences = () => {
  const { addNotification } = useNotifications();

  const [emailNotif, setEmailNotif] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [payoutAlert, setPayoutAlert] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setUpdating(true);
    setTimeout(() => {
      setUpdating(false);
      addNotification('Alert preferences saved successfully!', 'success');
    }, 1200);
  };

  const ToggleInput = ({ label, description, checked, onChange, icon: Icon }) => (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
      <div className="flex gap-3 items-start">
        {Icon && <Icon className="w-5 h-5 text-slate-400 mt-0.5" />}
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{label}</h4>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed">{description}</p>
        </div>
      </div>
      
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="text-slate-400 hover:text-primary-500 hover:scale-105 transition-all"
      >
        {checked ? (
          <ToggleRight className="w-9 h-9 text-primary-500" />
        ) : (
          <ToggleLeft className="w-9 h-9 text-slate-300 dark:text-slate-700" />
        )}
      </button>
    </div>
  );

  return (
    <div className="glass-card p-6 rounded-2xl max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <Settings className="w-5.5 h-5.5 text-primary-500" />
        <h3 className="text-lg font-bold">Preferences & Digests Settings</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <ToggleInput
          label="Email alerts"
          description="Receive a notice when an affiliate clicks your tracking links or completes sign up."
          checked={emailNotif}
          onChange={setEmailNotif}
          icon={Mail}
        />

        <ToggleInput
          label="Weekly Earnings summary"
          description="Receive a segmented weekly yield breakdown email summing clicks, leads, and earnings."
          checked={weeklyDigest}
          onChange={setWeeklyDigest}
          icon={Bell}
        />

        <ToggleInput
          label="Payout Settlement approvals"
          description="Receive instant notices when SVB bank settlements are disbursed or cleared."
          checked={payoutAlert}
          onChange={setPayoutAlert}
          icon={Save}
        />

        <ToggleInput
          label="SaaS Platform updates"
          description="Receive a newsletter for new feature launches, pricing changes, or referral tier criteria shifts."
          checked={marketing}
          onChange={setMarketing}
          icon={Settings}
        />

        <Button
          type="submit"
          isLoading={updating}
          icon={Save}
        >
          Save Preferences
        </Button>
      </form>
    </div>
  );
};

export default Preferences;