// src/affiliate/services/authService.js
import { mockUser } from '../data/dummyData';
import affiliateApi from './affiliateApi';

const USE_API = import.meta.env.VITE_USE_AFFILIATE_API === 'true';

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
    return affiliateApi.post('/affiliate/auth/register/', payload);
  },

  getCurrentUser: async () => {
    if (!USE_API) {
      localStorage.setItem('affiliate_ref_code', mockUser.referralCode);
      return mapProfile(mockUser);
    }
    try {
      const data = await affiliateApi.get('/affiliate/profile/');
      return mapProfile(data);
    } catch {
      localStorage.setItem('affiliate_ref_code', mockUser.referralCode);
      return mapProfile(mockUser);
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
      return mapProfile({
        ...mockUser,
        phone: profileData.phone,
        address: profileData.address,
        upiId: profileData.upiId,
        avatar: profileData.avatar || mockUser.avatar,
        bankDetails: {
          ...mockUser.bankDetails,
          bankName: profileData.bankName,
          accountNumber: profileData.accountNumber,
          payoutMethod: profileData.payoutMethod,
        },
      });
    }
    try {
      const data = await affiliateApi.put('/affiliate/profile/', payload);
      return mapProfile(data);
    } catch {
      return mapProfile({
        ...mockUser,
        phone: profileData.phone,
        address: profileData.address,
        upiId: profileData.upiId,
        avatar: profileData.avatar || mockUser.avatar,
        bankDetails: {
          ...mockUser.bankDetails,
          bankName: profileData.bankName,
          accountNumber: profileData.accountNumber,
          payoutMethod: profileData.payoutMethod,
        },
      });
    }
  },
};

export default authService;
