// src/api/services/permissions.js

import api from '../axios'
import ENDPOINTS from '../endpoints'


// ── ROLE-LEVEL PERMISSIONS ───────────────────────────

export const getAllRolesPermissionsApi = () =>
  api.get('/permissions/roles/')

export const getRolePermissionsApi = (role) =>
  api.get(`/permissions/roles/${role}/`)

export const updateRolePermissionsApi = (role, data) =>
  api.post(`/permissions/roles/${role}/`, data)

export const getPermissionListApi = () =>
  api.get('/permissions/')


 // ── USER-LEVEL OVERRIDES ────────────────────────────

export const getUserPermissionsApi = (userId) =>
  api.get(`/permissions/user/${userId}/`)

export const saveUserPermissionsApi = (userId, data) =>
  api.post(`/permissions/user/${userId}/`, data)


 // ── CUSTOM ROLES ────────────────────────────────────

export const getCustomRolesApi = () =>
  api.get('/roles/custom/')

export const createCustomRoleApi = (data) =>
  api.post('/roles/custom/', data)

export const updateCustomRoleApi = (id, data) =>
  api.patch(`/roles/custom/${id}/`, data)

export const deleteCustomRoleApi = (id) =>
  api.delete(`/roles/custom/${id}/`)


 // ── LEAVE QUOTA CHECK ───────────────────────────────

export const checkLeaveQuotaApi = (params) =>
  api.get('/leave/quota-check/', { params })