// src/affiliate/services/notificationService.js
import { mockNotifications } from '../data/dummyData';
import affiliateApi from './affiliateApi';

const USE_API = import.meta.env.VITE_USE_AFFILIATE_API !== 'false';

const mapNotification = (n) => ({
  id: n.id,
  title: n.title || (n.type ? `${n.type.charAt(0).toUpperCase()}${n.type.slice(1)} Alert` : 'System Notification'),
  message: n.message,
  type: n.type === 'commission' || n.type === 'referral' ? 'success' : n.type === 'payment' ? 'info' : n.type || 'warning',
  read: n.read ?? n.is_read ?? false,
  date: n.date || n.created_at,
});

export const notificationService = {
  getNotifications: async () => {
    if (!USE_API) return mockNotifications;
    try {
      const data = await affiliateApi.get('/affiliate/notifications/');
      return data.map(mapNotification);
    } catch {
      return mockNotifications;
    }
  },

  markAsRead: async (id) => {
    if (!USE_API) return { id };
    try {
      return await affiliateApi.put(`/affiliate/notifications/${id}/read/`);
    } catch {
      return { id };
    }
  },

  markAllAsRead: async () => {
    if (!USE_API) return { ok: true };
    try {
      return await affiliateApi.put('/affiliate/notifications/read-all/');
    } catch {
      return { ok: true };
    }
  },
};

export default notificationService;
