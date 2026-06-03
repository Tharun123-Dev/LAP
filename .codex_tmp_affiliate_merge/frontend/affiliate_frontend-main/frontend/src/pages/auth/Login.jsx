import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { validateEmail } from '../../utils/validation';
import Button from '../../components/buttons/Button';
import FormInput from '../../components/forms/FormInput';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      addNotification('Welcome back, Sarah!', 'success');
      navigate('/dashboard');
    } catch (err) {
      addNotification(err.message || 'Login failed. Please check credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center lg:text-left space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Welcome Back</h2>
        <p className="text-slate-400 text-sm font-medium">
          Sign in to your affiliate hub to view your payouts.
        </p>
      </div>

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

        <div className="relative">
          <FormInput
            label="Password"
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="pl-10 pr-10"
          />
          <Lock className="absolute left-3.5 bottom-3.5 w-4.5 h-4.5 text-slate-400" />
          
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 bottom-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
          </button>
        </div>

        <div className="flex items-center justify-between text-xs font-semibold">
          <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors select-none">
            <input type="checkbox" className="rounded border-slate-300 dark:border-slate-800 text-primary-600 focus:ring-primary-500/20" defaultChecked />
            Remember me
          </label>
          <Link to="/auth/forgot-password" className="text-primary-500 hover:underline">
            Forgot Password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full py-3"
          isLoading={loading}
          icon={ArrowRight}
        >
          Sign In
        </Button>
      </form>

      <div className="text-center text-xs font-semibold text-slate-500">
        Don't have an account?{' '}
        <Link to="/auth/register" className="text-primary-500 hover:underline">
          Sign Up
        </Link>
      </div>

      <div className="text-center text-xs font-medium text-slate-400">
        Demo account has pre-filled credentials. Just click <span className="font-bold text-primary-500">Sign In</span>!
      </div>
    </div>
  );
};

export default Login;
