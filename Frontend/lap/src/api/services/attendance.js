// src/api/services/attendance.js
import api from '../axios'
import ENDPOINTS from '../endpoints'

export const checkInApi        = (is_wfh = false)   => api.post(ENDPOINTS.ATTENDANCE.CHECKIN, { is_wfh })
export const checkOutApi       = ()                  => api.post(ENDPOINTS.ATTENDANCE.CHECKOUT)
export const getTodayApi       = ()                  => api.get(ENDPOINTS.ATTENDANCE.TODAY)
export const getMyAttendanceApi = (month, year)      => api.get(ENDPOINTS.ATTENDANCE.MY_RECORDS, { params: { month, year } })
export const getAllAttendanceApi = (month, year, emp) => api.get(ENDPOINTS.ATTENDANCE.ALL, { params: { month, year, employee: emp } })
export const applyRegularizationApi  = (data)        => api.post(ENDPOINTS.ATTENDANCE.REGULARIZE, data)
export const getMyRegularizationsApi = ()            => api.get(ENDPOINTS.ATTENDANCE.MY_REGULARIZATIONS)
export const getAllRegularizationsApi = (status)      => api.get(ENDPOINTS.ATTENDANCE.ALL_REGULARIZATIONS, { params: { status } })
export const actionRegularizationApi = (id, action, note) => api.post(ENDPOINTS.ATTENDANCE.REGULARIZE_ACTION(id), { action, note })
export const getHolidaysApi    = ()                  => api.get(ENDPOINTS.ATTENDANCE.HOLIDAYS)