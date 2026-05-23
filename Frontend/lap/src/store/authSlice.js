import { createSlice } from '@reduxjs/toolkit'
import { jwtDecode } from 'jwt-decode'

const decodePermissions = (token) => {
  if (!token) return []
  try { return jwtDecode(token).permissions || [] }
  catch { return [] }
}

const access = localStorage.getItem('access')

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:         localStorage.getItem('name') || null,
    role:         localStorage.getItem('role') || null,
    employeeType: localStorage.getItem('employee_type') || null,
    access:       access || null,
    refresh:      localStorage.getItem('refresh') || null,
    permissions:  decodePermissions(access),
  },
  reducers: {
    setCredentials: (state, { payload }) => {
      state.access       = payload.access
      state.refresh      = payload.refresh
      state.role         = payload.role
      state.user         = payload.name
      state.employeeType = payload.employee_type
      state.permissions  = payload.permissions || []
      localStorage.setItem('access',        payload.access)
      localStorage.setItem('refresh',       payload.refresh)
      localStorage.setItem('role',          payload.role)
      localStorage.setItem('name',          payload.name)
      localStorage.setItem('employee_type', payload.employee_type || '')
    },
    logout: (state) => {
      state.user = state.role = state.access = state.refresh = state.employeeType = null
      state.permissions = []
      localStorage.clear()
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer