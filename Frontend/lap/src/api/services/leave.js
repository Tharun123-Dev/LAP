// src/api/services/leave.js
import api from '../axios'
import ENDPOINTS from '../endpoints'

export const getLeaveTypesApi    = ()          => api.get(ENDPOINTS.LEAVE.TYPES)
export const createLeaveTypeApi  = (data)      => api.post(ENDPOINTS.LEAVE.TYPES, data)
export const updateLeaveTypeApi  = (id, data)  => api.patch(ENDPOINTS.LEAVE.TYPE_DETAIL(id), data)
export const deleteLeaveTypeApi  = (id)        => api.delete(ENDPOINTS.LEAVE.TYPE_DETAIL(id))

export const getMyBalanceApi     = (year)      => api.get(ENDPOINTS.LEAVE.BALANCE, { params: { year } })

export const applyLeaveApi       = (data)      => api.post(ENDPOINTS.LEAVE.APPLY, data)
export const getMyRequestsApi    = (status)    => api.get(ENDPOINTS.LEAVE.MY_REQUESTS, { params: { status } })
export const cancelLeaveApi      = (id)        => api.post(ENDPOINTS.LEAVE.CANCEL(id))

export const getAllRequestsApi   = (status, emp) => api.get(ENDPOINTS.LEAVE.ALL_REQUESTS, { params: { status, employee: emp } })
export const leaveActionApi      = (id, action, note) => api.post(ENDPOINTS.LEAVE.ACTION(id), { action, note })

// fetch prior usage before approving
export const getLeavePriorUsageApi = (id) => api.get(ENDPOINTS.LEAVE.PRIOR_USAGE(id))

// Policy settings — synced between LeaveType model and SystemSettings
// GET: returns effective values per leave type (system settings merged with model)
// POST: saves a leave type's fields to BOTH model AND system settings
export const getLeavePolicySettingsApi = ()           => api.get(ENDPOINTS.LEAVE.POLICY_SETTINGS)
export const saveLeavePolicySettingApi = (id, fields) => api.post(ENDPOINTS.LEAVE.POLICY_SETTINGS, { leave_type_id: id, fields })
