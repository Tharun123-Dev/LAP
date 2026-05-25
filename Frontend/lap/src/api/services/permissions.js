// src/api/services/permissions.js
import api from '../axios'

// ── ROLE-LEVEL PERMISSIONS (used by PermissionManager page) ──
export const getAllRolesPermissionsApi = () =>
  api.get('/permissions/roles/')

export const getRolePermissionsApi = (role) =>
  api.get(`/permissions/roles/${role}/`)

export const updateRolePermissionsApi = (role, granted, revoked) =>
  api.post(`/permissions/roles/${role}/update/`, { granted, revoked })

export const getPermissionListApi = () =>
  api.get('/permissions/')

// ── PER-EMPLOYEE PERMISSIONS ──────────────────────────────────
// GET: returns all permissions with is_granted true/false for that employee
export const getUserPermissionsApi = (userId) =>
  api.get(`/permissions/user/${userId}/`)

// POST: { permissions: [{code, is_granted}, ...] }
// Saves all permission states for this employee
export const saveUserPermissionsApi = (userId, permissions) =>
  api.post(`/permissions/user/${userId}/`, { permissions })

// ── CUSTOM ROLES ──────────────────────────────────────────────
export const getCustomRolesApi = () =>
  api.get('/roles/custom/')

export const createCustomRoleApi = (data) =>
  api.post('/roles/custom/', data)

export const updateCustomRoleApi = (id, data) =>
  api.patch(`/roles/custom/${id}/`, data)

export const deleteCustomRoleApi = (id) =>
  api.delete(`/roles/custom/${id}/`)

// ── LEAVE QUOTA CHECK ──────────────────────────────────────────
export const checkLeaveQuotaApi = (params) =>
  api.get('/leave/quota-check/', { params })