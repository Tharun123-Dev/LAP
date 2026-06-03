import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Phone, MapPin, CreditCard, ArrowRight, ArrowLeft, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { validateEmail } from '../../utils/validation';
import Button from '../../components/buttons/Button';
import FormInput from '../../components/forms/FormInput';

export const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    bankDetails: '',
    upiId: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get('next');

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    
    if (!formData.email) {
      newErrors.email = 'Email address is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address,
        bankDetails: formData.bankDetails,
        upiId: formData.upiId,
      });
      localStorage.setItem('affiliate_onboarded', 'true');
      addNotification('Affiliate signup completed successfully!', 'success');
      navigate(nextPath || '/login', { replace: true });
    } catch (err) {
      addNotification(err.message || 'Registration failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center lg:text-left space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Join AffiliateSaaS</h2>
        <p className="text-slate-400 text-sm font-medium">
          Create your account and start earning payouts today.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${step === 1 ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm' : 'text-slate-400'}`}>
          <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold">1</span>
          Account Setup
        </div>
        <div className="w-8 border-t border-dashed border-slate-300 dark:border-slate-700" />
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${step === 2 ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm' : 'text-slate-400'}`}>
          <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold">2</span>
          Profile & Payout
        </div>
      </div>

      <form onSubmit={step === 2 ? handleSubmit : (e) => e.preventDefault()} className="space-y-4">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="relative">
                <FormInput
                  label="Full Name"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="John Doe"
                  error={errors.name}
                  required
                  className="pl-10"
                />
                <User className="absolute left-3.5 bottom-3.5 w-4.5 h-4.5 text-slate-400" />
              </div>

              <div className="relative">
                <FormInput
                  label="Email Address"
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="john@company.com"
                  error={errors.email}
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
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="••••••••"
                  error={errors.password}
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

              <div className="relative">
                <FormInput
                  label="Confirm Password"
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  error={errors.confirmPassword}
                  required
                  className="pl-10"
                />
                <Lock className="absolute left-3.5 bottom-3.5 w-4.5 h-4.5 text-slate-400" />
              </div>

              <Button
                type="button"
                className="w-full py-3 mt-2"
                onClick={handleNext}
                icon={ArrowRight}
              >
                Continue
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="relative">
                <FormInput
                  label="Phone Number"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  error={errors.phone}
                  required
                  className="pl-10"
                />
                <Phone className="absolute left-3.5 bottom-3.5 w-4.5 h-4.5 text-slate-400" />
              </div>

              <div className="relative">
                <FormInput
                  label="Address"
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Main St, New York, NY"
                  className="pl-10"
                />
                <MapPin className="absolute left-3.5 bottom-3.5 w-4.5 h-4.5 text-slate-400" />
              </div>

              <div className="relative">
                <FormInput
                  label="UPI ID (Optional)"
                  id="upiId"
                  value={formData.upiId}
                  onChange={(e) => handleInputChange('upiId', e.target.value)}
                  placeholder="john@upi"
                  className="pl-10"
                />
                <Sparkles className="absolute left-3.5 bottom-3.5 w-4.5 h-4.5 text-slate-400" />
              </div>

              <div className="relative">
                <FormInput
                  label="Bank Account Details (Optional)"
                  id="bankDetails"
                  value={formData.bankDetails}
                  onChange={(e) => handleInputChange('bankDetails', e.target.value)}
                  placeholder="Bank: Chase, Account: ****5678"
                  className="pl-10"
                />
                <CreditCard className="absolute left-3.5 bottom-3.5 w-4.5 h-4.5 text-slate-400" />
              </div>

              <div className="flex gap-4 mt-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-1/2 py-3"
                  onClick={handleBack}
                  icon={ArrowLeft}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="w-1/2 py-3"
                  isLoading={loading}
                  icon={ArrowRight}
                >
                  Submit
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <div className="text-center text-xs font-semibold text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-500 hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default Register;
