// src/api/services/systemsettings.js
import api from '../axios'
import ENDPOINTS from '../endpoints'

const systemSettingsService = {
  getAll:      ()           => api.get(ENDPOINTS.SYSTEM_SETTINGS.LIST),
  bulkUpdate:  (data)       => api.post(ENDPOINTS.SYSTEM_SETTINGS.LIST, data),
  updateOne:   (key, value) => api.patch(ENDPOINTS.SYSTEM_SETTINGS.DETAIL(key), { value }),

  // Returns a flat object: { company_name, currency, company_logo_url, timezone, ... }
  // from the "general" category — used by PayslipModal and anywhere else needing branding
  getGeneral: async () => {
    const res = await api.get(ENDPOINTS.SYSTEM_SETTINGS.LIST)
    const generalItems = res.data?.general || []
    const flat = {}
    generalItems.forEach(s => { flat[s.key] = s.value })
    return flat
  },
}

export default systemSettingsService