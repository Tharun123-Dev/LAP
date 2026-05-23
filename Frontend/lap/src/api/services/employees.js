// src/api/services/employees.js
import api from '../axios'
import ENDPOINTS from '../endpoints'

export const listEmployeesApi = (params) =>
  api.get(ENDPOINTS.EMPLOYEES.LIST, { params })

export const createEmployeeApi = (data) =>
  api.post(ENDPOINTS.EMPLOYEES.CREATE, data)

export const getEmployeeApi = (id) =>
  api.get(ENDPOINTS.EMPLOYEES.DETAIL(id))

export const updateEmployeeApi = (id, data) =>
  api.patch(ENDPOINTS.EMPLOYEES.UPDATE(id), data)

export const deactivateEmployeeApi = (id) =>
  api.post(ENDPOINTS.EMPLOYEES.DEACTIVATE(id))

export const listManagersApi = () =>
  api.get(ENDPOINTS.EMPLOYEES.MANAGERS)