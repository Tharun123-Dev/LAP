// src/affiliate/services/referralService.js
import { mockReferralLinks, mockReferrals } from '../data/dummyData';
import affiliateApi from './affiliateApi';

const USE_API = import.meta.env.VITE_USE_AFFILIATE_API !== 'false';

const mapReferral = (ref) => ({
  id: ref.id,
  name: ref.customer_name || 'Anonymous Client',
  email: ref.customer_email || '',
  plan: ref.purchase_amount > 200 ? 'Enterprise Pro' : ref.purchase_amount > 100 ? 'Growth Annual' : 'Starter Monthly',
  status: ref.status || 'pending',
  joinedDate: ref.referred_at,
  commission: ref.status === 'converted' ? ref.purchase_amount * 0.1 : 0,
  totalSpent: ref.purchase_amount || 0,
  tier: 'Tier 1 (10%)',
  avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(ref.customer_name || 'U')}&background=0D8ABC&color=fff`,
});

export const referralService = {
  getReferrals: async () => {
    if (!USE_API) return mockReferrals;
    try {
      const data = await affiliateApi.get('/affiliate/referrals/');
      return data.map(mapReferral);
    } catch {
      return mockReferrals;
    }
  },

  getReferralById: async (id) => {
    if (!USE_API) return mockReferrals.find((ref) => ref.id === id) || mockReferrals[0];
    try {
      const data = await affiliateApi.get(`/affiliate/referrals/${id}/`);
      return mapReferral(data);
    } catch {
      return mockReferrals.find((ref) => ref.id === id) || mockReferrals[0];
    }
  },

  getReferralLinks: async () => {
    const stored = localStorage.getItem('referral_links');
    if (stored) return JSON.parse(stored);
    return mockReferralLinks;
  },

  createReferralLink: async (name) => {
    if (!name) throw new Error('Link name is required');
    const refCode = localStorage.getItem('affiliate_ref_code') || 'SARAH50X';
    const newLink = {
      id: `link_${Math.random().toString(36).slice(2, 7)}`,
      name,
      url: `https://yourapp.com/?ref=${refCode}&campaign=${encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'))}`,
      clicks: 0,
      signups: 0,
      conversions: 0,
      conversionRate: '0.00%',
      earnings: 0,
      status: 'active',
    };
    const stored = localStorage.getItem('referral_links');
    const links = stored ? JSON.parse(stored) : [...mockReferralLinks];
    links.push(newLink);
    localStorage.setItem('referral_links', JSON.stringify(links));
    return newLink;
  },
};

export default referralService;
