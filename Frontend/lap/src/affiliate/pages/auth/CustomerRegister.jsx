import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, CreditCard, Sparkles, Check, ArrowRight, ArrowLeft, ShieldCheck, Globe, Star, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useNotifications } from '../../hooks/useNotifications';
import FormInput from '../../components/forms/FormInput';
import Button from '../../components/buttons/Button';
import formatCurrency from '../../utils/formatCurrency';

const SUBSCRIPTION_PLANS = [
  { id: 'starter', name: 'Starter Plan', price: 499, description: 'Best for individuals starting out.', features: ['Up to 5 Users', 'Basic Analytics Dashboard', 'Standard Support', '5GB Cloud Space'] },
  { id: 'professional', name: 'Professional Plan', price: 1499, description: 'Power features for growing teams.', features: ['Up to 25 Users', 'Advanced Predictive Analytics', 'Priority 24/7 Support', '50GB Cloud Space', 'API access'] },
  { id: 'enterprise', name: 'Enterprise Plan', price: 4999, description: 'Ultimate power for corporations.', features: ['Unlimited Users', 'Real-time Analytics Custom APIs', 'Dedicated Success Manager', 'Uncapped Storage Space', 'Custom SLA / Security'] },
  { id: 'none', name: 'No Plan', price: 0, description: 'Register account now and subscribe later.', features: ['Free Account Registration', 'Zero Charges Today', 'Subscribe Later'] }
];
const USE_API = import.meta.env.VITE_USE_AFFILIATE_API !== 'false';

export const CustomerRegister = () => {
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref') || '';
  const { addNotification } = useNotifications();

  // Wizard state
  const [step, setStep] = useState(1);

  // Form State
  const [selectedPlan, setSelectedPlan] = useState(SUBSCRIPTION_PLANS[1]); // default to professional
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateStep1 = () => {
    if (!customerName.trim()) {
      addNotification('Full name is required', 'warning');
      return false;
    }
    if (!customerEmail.trim()) {
      addNotification('Email address is required', 'warning');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      addNotification('Please enter a valid email address', 'warning');
      return false;
    }
    if (!password || password.length < 6) {
      addNotification('Password must be at least 6 characters long', 'warning');
      return false;
    }
    return true;
  };

  const handleStep1Next = (e) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleStep2Next = (e) => {
    e.preventDefault();
    if (selectedPlan.price > 0) {
      setStep(3);
    } else {
      // Direct submit since they chose to skip subscription
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!customerName.trim() || !customerEmail.trim() || !password) {
      addNotification('Please complete Step 1 details first', 'warning');
      setStep(1);
      return;
    }

    if (selectedPlan.price > 0) {
      if (!cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim()) {
        addNotification('Please complete payment credentials', 'warning');
        setStep(3);
        return;
      }
    }

    if (!referralCode) {
      addNotification('Registration requires a valid referral link code', 'error');
      return;
    }

    setLoading(true);
    try {
      if (USE_API) {
        await api.post('/affiliate/referrals/register-customer/', {
          customer_name: customerName,
          customer_email: customerEmail,
          referral_code: referralCode,
          product_name: selectedPlan.name,
          purchase_amount: selectedPlan.price
        });
      }
      setSuccess(true);
      addNotification('Subscription configured successfully!', 'success');
    } catch (err) {
      addNotification(err.message || 'Subscription signup failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800 text-center space-y-6"
        >
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">Registration Complete!</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {selectedPlan.price > 0 ? (
                <>Your subscription to the <strong className="text-primary-600 font-bold">{selectedPlan.name}</strong> is now active.</>
              ) : (
                <>Your account has been registered successfully without a subscription plan.</>
              )}
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-left space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Account Name</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{customerName}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Billing Email</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{customerEmail}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Selected Plan</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{selectedPlan.name}</span>
            </div>
            <div className="w-full border-t border-dashed border-slate-200 dark:border-slate-700 my-2 pt-2 flex justify-between text-sm">
              <span className="font-bold text-slate-800 dark:text-white">Amount Charged</span>
              <span className="font-black text-emerald-600">{formatCurrency(selectedPlan.price)}</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 font-medium">
            A confirmation receipt has been sent to your email. Thank you for choosing us!
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 lg:flex">
      {/* Left side: Marketing panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        
        <div className="relative z-10 flex items-center gap-2">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-black tracking-tight">SaaSPlatform</span>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg my-auto">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary-500/10 text-primary-400 border border-primary-500/20 self-start w-fit">
            <Sparkles className="w-4 h-4" />
            Special Referral Discount Applied
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Accelerate your business workflow today.
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            Join thousands of teams already automating their processes, deploying scale, and tracking conversion funnels. Set up your workspace in minutes.
          </p>

          <div className="pt-6 border-t border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-4 h-4 fill-current" />)}
              </div>
              <span className="text-xs font-bold text-slate-300">Rated 4.9/5 by 12,000+ Enterprises</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500">
          &copy; 2026 SaaSPlatform Inc. All rights reserved.
        </div>
      </div>

      {/* Right side: Wizard Checkout Form */}
      <div className="w-full lg:w-1/2 p-6 md:p-12 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
          
          {/* Header */}
          <div className="space-y-1.5">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">Configure Your Subscription</h2>
            <p className="text-slate-400 text-xs font-semibold">
              Complete the quick steps to configure your personal workspace account.
            </p>
          </div>

          {/* Referral Notification Pill */}
          {referralCode ? (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-2xl flex items-center gap-2 border border-emerald-100 dark:border-emerald-900/30">
              <Check className="w-4.5 h-4.5 p-0.5 bg-emerald-500 text-white rounded-full flex-shrink-0" />
              <span>Referral Applied: Code <strong className="font-extrabold underline">{referralCode}</strong> is configured!</span>
            </div>
          ) : (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-xs font-bold rounded-2xl flex items-center gap-2 border border-rose-100 dark:border-rose-900/30">
              <AlertCircle className="w-4.5 h-4.5 text-rose-500 flex-shrink-0" />
              <span>No referral code found. Please use a valid referral link.</span>
            </div>
          )}

          {/* Step Indicator */}
          <div className="flex items-center justify-between px-2 py-1.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${step === 1 ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm' : 'text-slate-400'}`}>
              <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px]">1</span>
              Account Info
            </div>
            <div className="w-6 border-t border-dashed border-slate-300 dark:border-slate-700" />
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${step === 2 ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm' : 'text-slate-400'}`}>
              <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px]">2</span>
              Choose Plan
            </div>
            {selectedPlan.price > 0 && (
              <>
                <div className="w-6 border-t border-dashed border-slate-300 dark:border-slate-700" />
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${step === 3 ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm' : 'text-slate-400'}`}>
                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px]">3</span>
                  Payment
                </div>
              </>
            )}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Personal Details */}
            {step === 1 && (
              <motion.form 
                key="step1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleStep1Next} 
                className="space-y-4"
              >
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Step 1. Workspace Profile</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput
                      label="Full Name"
                      id="customerName"
                      placeholder="e.g. John Doe"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
                    <FormInput
                      label="Email Address"
                      id="customerEmail"
                      type="email"
                      placeholder="john@company.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      required
                    />
                  </div>
                  <FormInput
                    label="Create Password"
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full py-4 shadow-lg shadow-primary-500/25 mt-4"
                  disabled={!referralCode}
                  icon={ArrowRight}
                >
                  Continue to Select Plan
                </Button>
              </motion.form>
            )}

            {/* Step 2: Plan Subscription */}
            {step === 2 && (
              <motion.form 
                key="step2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleStep2Next} 
                className="space-y-6"
              >
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Step 2. Select Subscription Level</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {SUBSCRIPTION_PLANS.map((plan) => (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        className={`p-5 rounded-3xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-1.5 ${
                          selectedPlan.id === plan.id
                            ? 'border-primary-600 bg-primary-500/[0.02] shadow-md shadow-primary-500/5'
                            : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                        }`}
                      >
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">{plan.name}</h4>
                          <p className="text-[10px] text-slate-400 leading-normal mt-1">{plan.description}</p>
                        </div>
                        <div className="pt-2 border-t border-slate-50 dark:border-slate-800 flex items-baseline gap-0.5">
                          <span className="text-base font-black text-slate-800 dark:text-white">{formatCurrency(plan.price)}</span>
                          {plan.price > 0 && <span className="text-[9px] font-bold text-slate-400 uppercase">/mo</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-1/2 py-4"
                    onClick={() => setStep(1)}
                    icon={ArrowLeft}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="w-1/2 py-4 shadow-lg shadow-primary-500/25"
                    isLoading={loading}
                    icon={ArrowRight}
                  >
                    {selectedPlan.price > 0 ? 'Continue to Payment' : 'Complete Registration'}
                  </Button>
                </div>
              </motion.form>
            )}

            {/* Step 3: Billing Info Simulation */}
            {step === 3 && selectedPlan.price > 0 && (
              <motion.form 
                key="step3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleSubmit} 
                className="space-y-6"
              >
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Step 3. Billing & Authorization</label>
                  <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-slate-400" /> Credit Card Details</span>
                      <span className="text-primary-600 font-extrabold">Secure Sandbox</span>
                    </div>
                    
                    <FormInput
                      label="Card Number"
                      id="cardNumber"
                      placeholder="4111 2222 3333 4444"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      required
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormInput
                        label="Expiry Date"
                        id="cardExpiry"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        required
                      />
                      <FormInput
                        label="CVV"
                        id="cardCvv"
                        type="password"
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-1/2 py-4"
                    onClick={() => setStep(2)}
                    icon={ArrowLeft}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="w-1/2 py-4 shadow-lg shadow-primary-500/25"
                    isLoading={loading}
                    icon={ArrowRight}
                  >
                    Authorize & Pay ({formatCurrency(selectedPlan.price)})
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CustomerRegister;
