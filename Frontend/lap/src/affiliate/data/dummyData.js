export const mockUser = {
  id: 'usr_982347',
  name: 'Sarah Jenkins',
  email: 'sarah.jenkins@affiliate.io',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  role: 'affiliate',
  joinedDate: '2025-01-15T09:00:00Z',
  status: 'active',
  tier: 'Platinum Elite',
  referralCode: 'SARAH50X',
  earnings: {
    total: 24890.50,
    pending: 1850.00,
    unpaid: 3250.75,
    thisMonth: 4120.00,
  },
  bankDetails: {
    holderName: 'Sarah Jenkins',
    bankName: 'Silicon Valley Bank',
    routingNumber: '*********',
    accountNumber: '*********8934',
    payoutMethod: 'ACH/Direct Deposit',
  },
  preferences: {
    theme: 'dark',
    emailNotifications: true,
    weeklyDigest: true,
    payoutAlerts: true,
    marketingUpdates: false,
  }
};

export const mockReferrals = [
  {
    id: 'REF-1001',
    name: 'Acme Corporation',
    email: 'billing@acme.com',
    plan: 'Enterprise Pro',
    status: 'converted',
    joinedDate: '2026-05-10T14:30:00Z',
    commission: 299.00,
    totalSpent: 1495.00,
    tier: 'Tier 1 (20%)',
    avatar: 'https://images.unsplash.com/photo-1516841273335-e39b37888115?auto=format&fit=crop&w=100&q=80',
  },
  {
    id: 'REF-1002',
    name: 'SaaSify Labs',
    email: 'hello@saasify.io',
    plan: 'Growth Annual',
    status: 'converted',
    joinedDate: '2026-05-02T10:15:00Z',
    commission: 149.00,
    totalSpent: 990.00,
    tier: 'Tier 1 (20%)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
  },
  {
    id: 'REF-1003',
    name: 'GrowthHack Agency',
    email: 'info@growthhack.agency',
    plan: 'Scale Monthly',
    status: 'pending',
    joinedDate: '2026-05-20T18:40:00Z',
    commission: 0.00,
    totalSpent: 0.00,
    tier: 'Tier 1 (20%)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
  },
  {
    id: 'REF-1004',
    name: 'Pixel Perfect Design',
    email: 'contact@pixelperfect.design',
    plan: 'Starter Monthly',
    status: 'rejected',
    joinedDate: '2026-02-12T08:00:00Z',
    commission: 0.00,
    totalSpent: 150.00,
    tier: 'Tier 2 (10%)',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80',
  },
  {
    id: 'REF-1005',
    name: 'DevFlow Systems',
    email: 'operations@devflow.net',
    plan: 'Enterprise Pro',
    status: 'converted',
    joinedDate: '2026-04-22T11:00:00Z',
    commission: 299.00,
    totalSpent: 897.00,
    tier: 'Tier 1 (20%)',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80',
  }
];

export const mockTransactions = [
  {
    id: 'tx_98124',
    amount: 1450.00,
    status: 'paid',
    date: '2026-05-01T08:00:00Z',
    method: 'ACH/Direct Deposit',
    invoiceNumber: 'INV-2026-004',
    description: 'Affiliate Commission Payout - April 2026',
  },
  {
    id: 'tx_97241',
    amount: 1800.75,
    status: 'paid',
    date: '2026-04-01T08:00:00Z',
    method: 'ACH/Direct Deposit',
    invoiceNumber: 'INV-2026-003',
    description: 'Affiliate Commission Payout - March 2026',
  },
  {
    id: 'tx_96391',
    amount: 920.00,
    status: 'paid',
    date: '2026-03-01T08:00:00Z',
    method: 'PayPal',
    invoiceNumber: 'INV-2026-002',
    description: 'Affiliate Commission Payout - February 2026',
  },
  {
    id: 'tx_95101',
    amount: 1200.50,
    status: 'failed',
    date: '2026-02-01T08:00:00Z',
    method: 'Wire Transfer',
    invoiceNumber: 'INV-2026-001',
    description: 'Affiliate Commission Payout - January 2026',
  }
];

export const mockNotifications = [
  {
    id: 'notif_001',
    title: 'New Referral Signed Up!',
    message: 'Acme Corporation registered using your link and upgraded to Enterprise Pro.',
    type: 'success',
    read: false,
    date: '2026-05-23T16:45:00Z'
  },
  {
    id: 'notif_002',
    title: 'Payout Disbursed Successfully',
    message: 'Your commission payout of $1,450.00 has been deposited to Silicon Valley Bank.',
    type: 'info',
    read: false,
    date: '2026-05-01T10:00:00Z'
  },
  {
    id: 'notif_003',
    title: 'Performance Threshold Achieved',
    message: 'Congratulations! You achieved the Platinum Elite Tier and now earn 20% commission.',
    type: 'success',
    read: true,
    date: '2026-04-15T12:00:00Z'
  },
  {
    id: 'notif_004',
    title: 'Update Bank Details',
    message: 'We noticed your tax documents are expiring soon. Please upload your W-8BEN form.',
    type: 'warning',
    read: true,
    date: '2026-04-10T09:30:00Z'
  }
];

export const mockReferralLinks = [
  {
    id: 'link_001',
    name: 'Main Homepage Landing Page',
    url: 'https://saasplatform.com/?ref=SARAH50X',
    clicks: 14202,
    signups: 345,
    conversions: 89,
    conversionRate: '6.27%',
    earnings: 12450.00,
    status: 'active',
  },
  {
    id: 'link_002',
    name: 'Pricing Page Special Discount',
    url: 'https://saasplatform.com/pricing?ref=SARAH50X&discount=15off',
    clicks: 8904,
    signups: 210,
    conversions: 54,
    conversionRate: '6.07%',
    earnings: 7920.50,
    status: 'active',
  },
  {
    id: 'link_003',
    name: 'Developer Sandbox Promotion',
    url: 'https://saasplatform.com/devs?ref=SARAH50X',
    clicks: 3491,
    signups: 54,
    conversions: 18,
    conversionRate: '5.15%',
    earnings: 4520.00,
    status: 'active',
  }
];