export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const USER_ROLES = {
  AFFILIATE: 'affiliate',
  MANAGER: 'manager',
  ADMIN: 'admin',
};

export const PAYMENT_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
  FAILED: 'failed',
  PROCESSING: 'processing',
};

export const COMMISSION_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
  RECURRING: 'recurring',
};

export const APP_THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

export const DATE_FORMATS = {
  SHORT: 'MMM DD, YYYY',
  FULL: 'MMMM DD, YYYY, h:mm A',
  TIME: 'h:mm A',
};
