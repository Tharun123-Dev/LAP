import api from './api';
import { mockReferralLinks } from '../data/dummyData';

const mapReferral = (ref) => {
  const referralCode = localStorage.getItem('affiliate_ref_code') || 'JD123';
  return {
    id: ref.id,
    name: ref.customer_name || 'Anonymous Client',
    email: ref.customer_email || '',
    plan: ref.purchase_amount > 200 ? 'Enterprise Pro' : ref.purchase_amount > 100 ? 'Growth Annual' : 'Starter Monthly',
    status: ref.status || 'pending',
    joinedDate: ref.referred_at,
    commission: ref.status === 'converted' ? (ref.purchase_amount * 0.1) : 0.0,
    totalSpent: ref.purchase_amount || 0,
    tier: 'Tier 1 (10%)',
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(ref.customer_name || 'U')}&background=0D8ABC&color=fff`,
  };
};

export const referralService = {
  getReferrals: async () => {
    const data = await api.get('/v1/affiliate/referrals/');
    return data.map(mapReferral);
  },

  getReferralById: async (id) => {
    const data = await api.get(`/v1/affiliate/referrals/${id}`);
    return mapReferral(data);
  },

  getReferralLinks: async () => {
    const stored = localStorage.getItem('referral_links');
    if (stored) {
      return JSON.parse(stored);
    }
    localStorage.setItem('referral_links', JSON.stringify(mockReferralLinks));
    return [...mockReferralLinks];
  },

  createReferralLink: async (name) => {
    if (!name) throw new Error('Link name is required');
    const refCode = localStorage.getItem('affiliate_ref_code') || 'JD123';
    const newLink = {
      id: 'link_' + Math.random().toString(36).substr(2, 5),
      name,
      url: `https://saasplatform.com/?ref=${refCode}&campaign=${encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'))}`,
      clicks: 0,
      signups: 0,
      conversions: 0,
      conversionRate: '0.00%',
      earnings: 0.00,
      status: 'active',
    };
    
    const stored = localStorage.getItem('referral_links');
    const links = stored ? JSON.parse(stored) : [...mockReferralLinks];
    links.push(newLink);
    localStorage.setItem('referral_links', JSON.stringify(links));
    return newLink;
  }
};

export default referralService;
