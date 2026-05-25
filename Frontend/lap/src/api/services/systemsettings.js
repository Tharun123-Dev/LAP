// src/api/services/systemSettings.js
import api from '../axios'
import ENDPOINTS from '../endpoints'

const systemSettingsService = {
  getAll:      ()          => api.get(ENDPOINTS.SYSTEM_SETTINGS.LIST),
  bulkUpdate:  (data)      => api.post(ENDPOINTS.SYSTEM_SETTINGS.LIST, data),
  updateOne:   (key, value) => api.patch(ENDPOINTS.SYSTEM_SETTINGS.DETAIL(key), { value }),
}

export default systemSettingsService