import api from './api';

export const notificationService = {
  getNotifications: async () => {
    const data = await api.get('/v1/affiliate/notifications/');
    return data.map(n => ({
      id: n.id,
      title: n.type ? n.type.charAt(0).toUpperCase() + n.type.slice(1) + ' Alert' : 'System Notification',
      message: n.message,
      type: n.type === 'commission' || n.type === 'referral' ? 'success' : n.type === 'payment' ? 'info' : 'warning',
      read: n.is_read || false,
      date: n.created_at,
    }));
  },

  markAsRead: async (id) => {
    return api.put(`/v1/affiliate/notifications/${id}/read`);
  },

  markAllAsRead: async () => {
    return api.put('/v1/affiliate/notifications/read-all');
  }
};

export default notificationService;
