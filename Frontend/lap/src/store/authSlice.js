// src/store/authSlice.js
import { createSlice } from '@reduxjs/toolkit'
import { jwtDecode } from 'jwt-decode'

const decodePermissions = (token) => {
  if (!token) return []
  try { return jwtDecode(token).permissions || [] }
  catch { return [] }
}

const decodeUserId = (token) => {
  if (!token) return null
  try { return jwtDecode(token).user_id || null }
  catch { return null }
}

const access = localStorage.getItem('access')

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:         localStorage.getItem('name')          || null,
    role:         localStorage.getItem('role')          || null,
    userId:       localStorage.getItem('user_id')       || decodeUserId(access),
    employeeType: localStorage.getItem('employee_type') || null,
    access:       access || null,
    refresh:      localStorage.getItem('refresh')       || null,
    permissions:  decodePermissions(access),
  },
  reducers: {
    setCredentials: (state, { payload }) => {
      const userId = payload.user_id || decodeUserId(payload.access) || null
      state.access       = payload.access
      state.refresh      = payload.refresh
      state.role         = payload.role
      state.user         = payload.name
      state.userId       = userId
      state.employeeType = payload.employee_type
      state.permissions  = payload.permissions || []
      localStorage.setItem('access',        payload.access)
      localStorage.setItem('refresh',       payload.refresh)
      localStorage.setItem('role',          payload.role)
      localStorage.setItem('name',          payload.name)
      localStorage.setItem('user_id',       userId || '')
      localStorage.setItem('employee_type', payload.employee_type || '')
    },

    // ✅ KEY ACTION: Call this after saving permissions for any user
    // If the edited employee IS the currently logged-in user,
    // their sidebar updates instantly without re-login
    updatePermissions: (state, { payload }) => {
      state.permissions = payload  // payload = string[] of permission codes
    },

    syncAuthUser: (state, { payload }) => {
      const name = [payload.first_name, payload.last_name].filter(Boolean).join(' ') || payload.username

      state.user         = name || state.user
      state.role         = payload.role || state.role
      state.userId       = payload.id || state.userId
      state.employeeType = payload.employee_type || state.employeeType
      state.permissions  = payload.permissions || []

      if (state.role) localStorage.setItem('role', state.role)
      if (state.user) localStorage.setItem('name', state.user)
      if (state.userId) localStorage.setItem('user_id', state.userId)
      if (state.employeeType) localStorage.setItem('employee_type', state.employeeType)
    },

    logout: (state) => {
      state.user = state.role = state.access = state.refresh = state.employeeType = state.userId = null
      state.permissions = []
      localStorage.clear()
    },
  },
})

export const { setCredentials, updatePermissions, syncAuthUser, logout } = authSlice.actions
export default authSlice.reducer
