import api from './api';

export const authService = {
  login: async (email, password) => {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);
    
    const response = await api.post('/v1/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response;
  },

  register: async (registerData) => {
    const payload = {
      email: registerData.email,
      password: registerData.password,
      full_name: registerData.name,
      phone: registerData.phone || null,
      address: registerData.address || null,
      bank_account_details: registerData.bankDetails || null,
      upi_id: registerData.upiId || null
    };
    
    // Create the account
    await api.post('/v1/auth/register', payload);
    
    // Log the user in to retrieve token
    const params = new URLSearchParams();
    params.append('username', registerData.email);
    params.append('password', registerData.password);
    
    const response = await api.post('/v1/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response;
  },

  getCurrentUser: async () => {
    const data = await api.get('/v1/affiliate/profile');
    return {
      id: data.id,
      name: data.full_name || '',
      email: data.email,
      avatar: data.profile_image_url || '',
      role: 'affiliate',
      joinedDate: new Date().toISOString(),
      status: 'active',
      tier: 'Verified Affiliate',
      referralCode: data.referral_code || '',
      phone: data.phone || '',
      address: data.address || '',
      upiId: data.upi_id || '',
      earnings: {
        total: data.total_earnings || 0,
        pending: (data.total_earnings || 0) - (data.paid_earnings || 0),
        unpaid: (data.total_earnings || 0) - (data.paid_earnings || 0),
        thisMonth: data.total_earnings || 0,
      },
      bankDetails: {
        holderName: data.full_name || '',
        bankName: data.bank_name || '',
        routingNumber: '',
        accountNumber: data.account_number || '',
        payoutMethod: data.payout_method || 'ACH/Direct Deposit',
      }
    };
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    return true;
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
    
    const data = await api.put('/v1/affiliate/profile', payload);
    
    return {
      id: data.id,
      name: data.full_name || '',
      email: data.email,
      avatar: data.profile_image_url || '',
      role: 'affiliate',
      joinedDate: new Date().toISOString(),
      status: 'active',
      tier: 'Verified Affiliate',
      referralCode: data.referral_code || '',
      phone: data.phone || '',
      address: data.address || '',
      upiId: data.upi_id || '',
      earnings: {
        total: data.total_earnings || 0,
        pending: (data.total_earnings || 0) - (data.paid_earnings || 0),
        unpaid: (data.total_earnings || 0) - (data.paid_earnings || 0),
        thisMonth: data.total_earnings || 0,
      },
      bankDetails: {
        holderName: data.full_name || '',
        bankName: data.bank_name || '',
        routingNumber: '',
        accountNumber: data.account_number || '',
        payoutMethod: data.payout_method || 'ACH/Direct Deposit',
      }
    };
  },

  forgotPassword: async (email) => {
    return api.post(`/v1/auth/forgot-password?email=${encodeURIComponent(email)}`);
  }
};

export default authService;
