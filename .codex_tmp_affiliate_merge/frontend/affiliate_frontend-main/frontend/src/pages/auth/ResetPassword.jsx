import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle, Check } from 'lucide-react';
import { validatePassword } from '../../utils/validation';
import Button from '../../components/buttons/Button';
import FormInput from '../../components/forms/FormInput';
import { useNotifications } from '../../hooks/useNotifications';

export const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const [strengthCheck, setStrengthCheck] = useState({
    isValid: false,
    errors: { minLength: true, letter: true, number: true }
  });

  const handlePasswordChange = (val) => {
    setPassword(val);
    setStrengthCheck(validatePassword(val));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!strengthCheck.isValid) {
      addNotification('Please satisfy all password criteria', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      addNotification('Passwords do not match', 'error');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      addNotification('Password reset successfully!', 'success');
      navigate('/auth/login');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="text-center lg:text-left space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Reset Password</h2>
        <p className="text-slate-400 text-sm font-medium">
          Create a new secure password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <FormInput
            label="New Password"
            id="password"
            type="password"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            placeholder="••••••••"
            required
            className="pl-10"
          />
          <Lock className="absolute left-3.5 bottom-3.5 w-4.5 h-4.5 text-slate-400" />
        </div>

        {/* Criteria helper */}
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Requirements</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className={`p-0.5 rounded-full ${!strengthCheck.errors.minLength ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                <Check className="w-3 h-3" />
              </span>
              <span className={!strengthCheck.errors.minLength ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}>At least 8 characters</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className={`p-0.5 rounded-full ${!strengthCheck.errors.letter ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                <Check className="w-3 h-3" />
              </span>
              <span className={!strengthCheck.errors.letter ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}>Contains a letter (a-z)</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className={`p-0.5 rounded-full ${!strengthCheck.errors.number ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                <Check className="w-3 h-3" />
              </span>
              <span className={!strengthCheck.errors.number ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}>Contains a number (0-9)</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <FormInput
            label="Confirm Password"
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="pl-10"
          />
          <Lock className="absolute left-3.5 bottom-3.5 w-4.5 h-4.5 text-slate-400" />
        </div>

        <Button
          type="submit"
          className="w-full py-3"
          isLoading={loading}
          icon={CheckCircle}
        >
          Reset Password
        </Button>
      </form>

      <div className="text-center">
        <Link 
          to="/auth/login" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;
