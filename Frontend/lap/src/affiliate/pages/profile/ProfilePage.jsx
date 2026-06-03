import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, ShieldAlert, Award, Save, Phone, MapPin, Camera, Landmark, QrCode, Lock, Check, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import FormInput from '../../components/forms/FormInput';
import Button from '../../components/buttons/Button';
import { validatePassword } from '../../utils/validation';
import formatCurrency from '../../utils/formatCurrency';

export const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const { addNotification } = useNotifications();
  const fileInputRef = useRef(null);
  
  // View/Edit Toggles
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  // Profile Info State
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [avatar, setAvatar] = useState(user?.avatar || '');

  // Password State
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [strengthCheck, setStrengthCheck] = useState({
    isValid: false,
    errors: { minLength: true, letter: true, number: true }
  });

  // Bank/Payment State
  const [paymentData, setPaymentData] = useState({
    bankName: user?.bankDetails?.bankName || '',
    accountNumber: user?.bankDetails?.accountNumber || '',
    upiId: user?.upiId || '',
    payoutMethod: user?.bankDetails?.payoutMethod || 'ACH/Direct Deposit'
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      });
      setAvatar(user.avatar || '');
      setPaymentData({
        bankName: user.bankDetails?.bankName || '',
        accountNumber: user.bankDetails?.accountNumber || '',
        upiId: user.upiId || '',
        payoutMethod: user.bankDetails?.payoutMethod || 'ACH/Direct Deposit'
      });
    }
  }, [user]);

  const [loading, setLoading] = useState({
    profile: false,
    password: false,
    payment: false
  });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading({ ...loading, profile: true });
    try {
      await updateProfile({ ...profileData, avatar });
      addNotification('Profile details updated successfully!', 'success');
      setIsEditingProfile(false);
    } catch (err) {
      addNotification(err.message || 'Failed to update profile', 'error');
    } finally {
      setLoading({ ...loading, profile: false });
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!strengthCheck.isValid) {
      addNotification('Please satisfy all password criteria', 'warning');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addNotification('Passwords do not match', 'error');
      return;
    }

    setLoading({ ...loading, password: true });
    setTimeout(() => {
      setLoading({ ...loading, password: false });
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      addNotification('Security credentials updated successfully!', 'success');
      setIsEditingPassword(false);
    }, 1500);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setLoading({ ...loading, payment: true });
    try {
      await updateProfile({
        phone: profileData.phone,
        address: profileData.address,
        bankName: paymentData.bankName,
        accountNumber: paymentData.accountNumber,
        payoutMethod: paymentData.payoutMethod,
        upiId: paymentData.upiId,
        avatar
      });
      addNotification('Payment and banking details saved!', 'success');
      setIsEditingPayment(false);
    } catch (err) {
      addNotification(err.message || 'Failed to save payment details', 'error');
    } finally {
      setLoading({ ...loading, payment: false });
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
        addNotification('Avatar image uploaded!', 'info');
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = (val) => {
    setPasswordData({ ...passwordData, newPassword: val });
    setStrengthCheck(validatePassword(val));
  };

  const DetailItem = ({ label, value, icon: Icon }) => (
    <div className="flex flex-col gap-1 text-left items-start w-full">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <div className="flex items-start gap-2.5 w-full">
        {Icon && <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />}
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 break-words leading-relaxed">{value || 'Not provided'}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Profile Management</h1>
          <p className="text-slate-400 text-sm font-medium mt-1">
            Review and manage your personal account settings.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary-50 text-primary-700 border border-primary-100">
          <Award className="w-4 h-4" />
          {user?.tier || 'Verified Affiliate'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar & Quick Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-8 rounded-3xl flex flex-col items-center text-center gap-5">
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              {avatar ? (
                <img 
                  src={avatar} 
                  alt={profileData.name} 
                  className="w-32 h-32 rounded-full border-4 border-primary-500/10 object-cover shadow-xl transition-transform group-hover:scale-[1.02]"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-primary-500/10 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-xl transition-transform group-hover:scale-[1.02]">
                  <User className="w-12 h-12" />
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
              />
            </div>
            
            <div>
              <h3 className="text-xl font-bold">{profileData.name}</h3>
              <p className="text-sm text-slate-400 font-medium mt-0.5">{profileData.email}</p>
            </div>

            <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <DetailItem label="Referral Code" value={user?.referralCode} icon={Award} />
              <DetailItem label="Phone" value={profileData.phone} icon={Phone} />
              <DetailItem label="Address" value={profileData.address} icon={MapPin} />
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl bg-slate-900 text-white overflow-hidden relative">
            <div className="relative z-10">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Available Balance</p>
              <h4 className="text-3xl font-black mt-1">{formatCurrency(user?.earnings?.pending || 0)}</h4>
              <p className="text-slate-500 text-[10px] mt-4 font-medium italic">* Payouts settled automatically via your preferred method</p>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary-500/20 rounded-full blur-2xl" />
          </div>
        </div>

        {/* Right Column: Details/Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section: Personal Details */}
          <div className="glass-card p-6 md:p-8 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="text-lg font-bold">Personal Details</h3>
              </div>
              {!isEditingProfile && (
                <button 
                  onClick={() => setIsEditingProfile(true)}
                  className="text-xs font-bold text-primary-600 hover:text-primary-700 underline underline-offset-4"
                >
                  Edit Details
                </button>
              )}
            </div>
            
            {!isEditingProfile ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                <DetailItem label="Full Name" value={profileData.name} />
                <DetailItem label="Email Address" value={profileData.email} />
                <DetailItem label="Phone Number" value={profileData.phone} />
                <div className="md:col-span-2">
                  <DetailItem label="Permanent Address" value={profileData.address} />
                </div>
              </div>
            ) : (
              <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Full Display Name"
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  required
                />
                <FormInput
                  label="Email Address"
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  required
                />
                <FormInput
                  label="Phone Number"
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                />
                <div className="md:col-span-2">
                  <FormInput
                    label="Permanent Address"
                    id="address"
                    value={profileData.address}
                    onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 flex items-center justify-end gap-3 mt-4">
                  <button 
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <Button type="submit" isLoading={loading.profile} icon={Save} className="px-8">
                    Save Changes
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Section: Bank & Payment Settings */}
          <div className="glass-card p-6 md:p-8 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Landmark className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold">Payment Settings</h3>
              </div>
              {!isEditingPayment && (
                <button 
                  onClick={() => setIsEditingPayment(true)}
                  className="text-xs font-bold text-primary-600 hover:text-primary-700 underline underline-offset-4"
                >
                  Update Payment
                </button>
              )}
            </div>
            
            {!isEditingPayment ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                <DetailItem label="Payout Method" value={paymentData.bankName || paymentData.upiId ? paymentData.payoutMethod : 'Not Configured'} />
                <DetailItem label="Bank Details / Name" value={paymentData.bankName || 'No bank details added'} />
                <DetailItem label="Account Number" value={paymentData.accountNumber ? '•••• •••• •••• ' + (paymentData.accountNumber.length > 4 ? paymentData.accountNumber.slice(-4) : paymentData.accountNumber) : 'No account number added'} />
                <DetailItem label="UPI ID" value={paymentData.upiId || 'No UPI ID added'} />
              </div>
            ) : (
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Default Payout Method</label>
                  <select
                    value={paymentData.payoutMethod}
                    onChange={(e) => setPaymentData({...paymentData, payoutMethod: e.target.value})}
                    className="px-4 py-3 rounded-xl border bg-white border-slate-200 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none font-medium"
                  >
                    <option value="ACH/Direct Deposit">Bank Transfer (ACH/Direct Deposit)</option>
                    <option value="PayPal">PayPal Business</option>
                    <option value="Wire Transfer">Global Wire Transfer</option>
                    <option value="UPI">UPI (Unified Payments Interface)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Bank Name"
                    id="bankName"
                    value={paymentData.bankName}
                    onChange={(e) => setPaymentData({...paymentData, bankName: e.target.value})}
                  />
                  <FormInput
                    label="Account Number"
                    id="accountNumber"
                    type="password"
                    value={paymentData.accountNumber}
                    onChange={(e) => setPaymentData({...paymentData, accountNumber: e.target.value})}
                  />
                </div>

                <FormInput
                  label="UPI ID (VPA)"
                  id="upiId"
                  value={paymentData.upiId}
                  onChange={(e) => setPaymentData({...paymentData, upiId: e.target.value})}
                />

                <div className="flex items-center justify-end gap-3 mt-4">
                  <button 
                    type="button"
                    onClick={() => setIsEditingPayment(false)}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <Button type="submit" isLoading={loading.payment} icon={Check} className="px-8">
                    Save Payment Details
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Section: Change Password */}
          <div className="glass-card p-6 md:p-8 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold">Security & Password</h3>
              </div>
              {!isEditingPassword && (
                <button 
                  onClick={() => setIsEditingPassword(true)}
                  className="text-xs font-bold text-primary-600 hover:text-primary-700 underline underline-offset-4"
                >
                  Change Password
                </button>
              )}
            </div>
            
            {!isEditingPassword ? (
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-300" />)}
                </div>
                <span className="text-xs font-bold text-slate-400 ml-2 italic">Security configured</span>
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <FormInput
                  label="Current Password"
                  id="oldPassword"
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="New Secure Password"
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    required
                  />
                  <FormInput
                    label="Confirm New Password"
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    required
                  />
                </div>

                {/* Password Requirements */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Requirements</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="flex items-center gap-2 text-[11px] font-semibold">
                      <span className={`p-0.5 rounded-full ${!strengthCheck.errors.minLength ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 text-slate-400'}`}>
                        <Check className="w-2.5 h-2.5" />
                      </span>
                      <span className={!strengthCheck.errors.minLength ? 'text-slate-700' : 'text-slate-400'}>8+ Characters</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-semibold">
                      <span className={`p-0.5 rounded-full ${!strengthCheck.errors.letter ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 text-slate-400'}`}>
                        <Check className="w-2.5 h-2.5" />
                      </span>
                      <span className={!strengthCheck.errors.letter ? 'text-slate-700' : 'text-slate-400'}>Letters (a-z)</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-semibold">
                      <span className={`p-0.5 rounded-full ${!strengthCheck.errors.number ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 text-slate-400'}`}>
                        <Check className="w-2.5 h-2.5" />
                      </span>
                      <span className={!strengthCheck.errors.number ? 'text-slate-700' : 'text-slate-400'}>Numbers (0-9)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-4">
                  <button 
                    type="button"
                    onClick={() => setIsEditingPassword(false)}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <Button type="submit" isLoading={loading.password} icon={ShieldCheck} className="px-8">
                    Update Password
                  </Button>
                </div>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default ProfilePage;