// src/api/services/attendance.js
// ── REPLACEMENT FILE ──
// Replace: Frontend/lap/src/api/services/attendance.js
// Changes: Added createHolidayApi, updateHolidayApi, deleteHolidayApi

import api from '../axios'
import ENDPOINTS from '../endpoints'

// ── Geolocation helper ────────────────────────────────────────────────────────
export const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude:  pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy:  pos.coords.accuracy,
      }),
      (err) => {
        const messages = {
          1: 'Location permission denied. Please allow location access and try again.',
          2: 'Location unavailable. Check your GPS/network.',
          3: 'Location request timed out. Try again.',
        }
        reject(new Error(messages[err.code] || 'Failed to get location.'))
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  })

// ── Haversine (client-side distance preview) ──────────────────────────────────
export const haversineMetres = (lat1, lon1, lat2, lon2) => {
  const R     = 6_371_000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat  = toRad(lat2 - lat1)
  const dLon  = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// ── Office Location ───────────────────────────────────────────────────────────
export const getOfficeLocationApi = ()       => api.get(ENDPOINTS.ATTENDANCE.OFFICE_LOCATION)
export const setOfficeLocationApi = (data)   => api.post(ENDPOINTS.ATTENDANCE.OFFICE_LOCATION, data)

// ── Core attendance ───────────────────────────────────────────────────────────
export const checkInApi  = (is_wfh = false, latitude = null, longitude = null) =>
  api.post(ENDPOINTS.ATTENDANCE.CHECKIN, { is_wfh, latitude, longitude })

export const checkOutApi = (latitude = null, longitude = null) =>
  api.post(ENDPOINTS.ATTENDANCE.CHECKOUT, { latitude, longitude })

export const getTodayApi              = ()                     => api.get(ENDPOINTS.ATTENDANCE.TODAY)
export const getMyAttendanceApi       = (month, year)          => api.get(ENDPOINTS.ATTENDANCE.MY_RECORDS,           { params: { month, year } })
export const getAllAttendanceApi       = (month, year, emp)     => api.get(ENDPOINTS.ATTENDANCE.ALL,                  { params: { month, year, employee: emp } })
export const applyRegularizationApi   = (data)                 => api.post(ENDPOINTS.ATTENDANCE.REGULARIZE, data)
export const getMyRegularizationsApi  = ()                     => api.get(ENDPOINTS.ATTENDANCE.MY_REGULARIZATIONS)
export const getAllRegularizationsApi  = (status)              => api.get(ENDPOINTS.ATTENDANCE.ALL_REGULARIZATIONS,  { params: { status } })
export const actionRegularizationApi  = (id, action, note)    => api.post(ENDPOINTS.ATTENDANCE.REGULARIZE_ACTION(id), { action, note })

// ── Holidays CRUD ─────────────────────────────────────────────────────────────
export const getHolidaysApi    = ()         => api.get(ENDPOINTS.ATTENDANCE.HOLIDAYS)
export const createHolidayApi  = (data)     => api.post(ENDPOINTS.ATTENDANCE.HOLIDAYS, data)
export const updateHolidayApi  = (id, data) => api.put(ENDPOINTS.ATTENDANCE.HOLIDAY_DETAIL(id), data)
export const deleteHolidayApi  = (id)       => api.delete(ENDPOINTS.ATTENDANCE.HOLIDAY_DETAIL(id))