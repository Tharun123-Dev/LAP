// src/affiliate/services/authService.js
import { mockUser } from '../data/dummyData';
import affiliateApi from './affiliateApi';

const USE_API = import.meta.env.VITE_USE_AFFILIATE_API !== 'false';

const getCurrentLapProfile = () => {
  const userId = localStorage.getItem('user_id') || 'lap-user';
  const name = localStorage.getItem('name') || 'LAP User';
  const role = localStorage.getItem('role') || 'employee';
  const employeeType = localStorage.getItem('employee_type') || '';
  const referralSeed = String(userId || name).replace(/[^a-z0-9]/gi, '').slice(-6).toUpperCase() || 'USER01';

  return {
    ...mockUser,
    id: userId,
    name,
    email: localStorage.getItem('email') || `${String(name).toLowerCase().replace(/\s+/g, '.')}@lap.local`,
    role,
    referralCode: `LAP${referralSeed}`,
    tier: employeeType || role,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff`,
    bankDetails: {
      ...mockUser.bankDetails,
      holderName: name,
    },
  };
};

const mapProfile = (data) => ({
  id: data.id,
  name: data.full_name || data.name || '',
  email: data.email,
  avatar: data.profile_image_url || data.avatar || '',
  role: 'affiliate',
  referralCode: data.referral_code || data.referralCode || '',
  phone: data.phone || '',
  address: data.address || '',
  upiId: data.upi_id || data.upiId || '',
  earnings: {
    total: data.total_earnings || data.earnings?.total || 0,
    pending: data.pending_earnings || data.earnings?.pending || 0,
    paid: data.paid_earnings || data.earnings?.paid || data.earnings?.unpaid || 0,
    thisMonth: data.this_month_earnings || data.earnings?.thisMonth || 0,
  },
  bankDetails: {
    holderName: data.full_name || data.bankDetails?.holderName || '',
    bankName: data.bank_name || data.bankDetails?.bankName || '',
    accountNumber: data.account_number || data.bankDetails?.accountNumber || '',
    payoutMethod: data.payout_method || data.bankDetails?.payoutMethod || 'ACH/Direct Deposit',
  },
});

export const authService = {
  register: async (registerData) => {
    const payload = {
      email: registerData.email,
      password: registerData.password,
      first_name: registerData.name?.split(' ')[0] || registerData.name,
      last_name: registerData.name?.split(' ').slice(1).join(' ') || '',
      phone: registerData.phone || '',
      address: registerData.address || '',
      bank_account_details: registerData.bankDetails || '',
      upi_id: registerData.upiId || '',
    };
    if (!USE_API) {
      const created = mapProfile({
        ...mockUser,
        id: `aff_${Date.now()}`,
        name: registerData.name,
        email: registerData.email,
        phone: registerData.phone,
        address: registerData.address,
        upiId: registerData.upiId,
        referralCode: `AFF${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      });
      localStorage.setItem('affiliate_ref_code', created.referralCode);
      return created;
    }
    const data = await affiliateApi.post('/affiliate/auth/register/', payload);
    return mapProfile(data);
  },

  getCurrentUser: async () => {
    if (!USE_API) {
      const currentUser = getCurrentLapProfile();
      localStorage.setItem('affiliate_ref_code', currentUser.referralCode);
      return mapProfile(currentUser);
    }
    try {
      const data = await affiliateApi.get('/affiliate/profile/');
      return mapProfile(data);
    } catch (error) {
      if (USE_API) throw error;
      const currentUser = getCurrentLapProfile();
      localStorage.setItem('affiliate_ref_code', currentUser.referralCode);
      return mapProfile(currentUser);
    }
  },

  updateProfile: async (profileData) => {
    const payload = {
      phone: profileData.phone,
      address: profileData.address,
      bank_name: profileData.bankName,
      account_number: profileData.accountNumber,
      payout_method: profileData.payoutMethod,
      upi_id: profileData.upiId,
      profile_image_url: profileData.avatar,
    };
    if (!USE_API) {
      const currentUser = getCurrentLapProfile();
      return mapProfile({
        ...currentUser,
        phone: profileData.phone,
        address: profileData.address,
        upiId: profileData.upiId,
        avatar: profileData.avatar || currentUser.avatar,
        bankDetails: {
          ...currentUser.bankDetails,
          bankName: profileData.bankName,
          accountNumber: profileData.accountNumber,
          payoutMethod: profileData.payoutMethod,
        },
      });
    }
    try {
      const data = await affiliateApi.put('/affiliate/profile/', payload);
      return mapProfile(data);
    } catch (error) {
      if (USE_API) throw error;
      const currentUser = getCurrentLapProfile();
      return mapProfile({
        ...currentUser,
        phone: profileData.phone,
        address: profileData.address,
        upiId: profileData.upiId,
        avatar: profileData.avatar || currentUser.avatar,
        bankDetails: {
          ...currentUser.bankDetails,
          bankName: profileData.bankName,
          accountNumber: profileData.accountNumber,
          payoutMethod: profileData.payoutMethod,
        },
      });
    }
  },
};

export default authService;
