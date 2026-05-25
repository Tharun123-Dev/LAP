// src/api/services/notifications.js
import api from '../axios'
import ENDPOINTS from '../endpoints'

const notificationsService = {
  getAll:       ()    => api.get(ENDPOINTS.NOTIFICATIONS.LIST),
  getUnreadCount: ()  => api.get(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT),
  markRead:     (id)  => api.post(ENDPOINTS.NOTIFICATIONS.MARK_READ(id)),
  markAllRead:  ()    => api.post(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ),
  delete:       (id)  => api.delete(ENDPOINTS.NOTIFICATIONS.DELETE(id)),
}

export default notificationsService