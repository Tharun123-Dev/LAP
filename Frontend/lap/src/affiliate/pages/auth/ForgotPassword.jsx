import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { validateEmail } from '../../utils/validation';
import Button from '../../components/buttons/Button';
import FormInput from '../../components/forms/FormInput';
import { useNotifications } from '../../hooks/useNotifications';
import authService from '../../services/authService';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotifications();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setIsSent(true);
      addNotification('Reset instructions sent to your email!', 'success');
    } catch (err) {
      addNotification(err.message || 'Failed to send recovery email', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center lg:text-left space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Recover Password</h2>
        <p className="text-slate-400 text-sm font-medium">
          Enter your email to receive recovery instructions.
        </p>
      </div>

      {!isSent ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <FormInput
              label="Email Address"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              error={emailError}
              required
              className="pl-10"
            />
            <Mail className="absolute left-3.5 bottom-3.5 w-4.5 h-4.5 text-slate-400" />
          </div>

          <Button
            type="submit"
            className="w-full py-3"
            isLoading={loading}
            icon={Send}
          >
            Send Recovery Email
          </Button>
        </form>
      ) : (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
          <h4 className="font-bold text-emerald-600 dark:text-emerald-400">Check Your Email</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            We sent a secure password reset link to <span className="font-bold text-slate-800 dark:text-slate-200">{email}</span>. Click the link to complete reset.
          </p>
        </div>
      )}

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

export default ForgotPassword;