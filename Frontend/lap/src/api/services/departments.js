// src/api/services/departments.js
import api from '../axios'
import ENDPOINTS from '../endpoints'

export const listDepartmentsApi = () =>
  api.get(ENDPOINTS.DEPARTMENTS.LIST)

export const createDepartmentApi = (data) =>
  api.post(ENDPOINTS.DEPARTMENTS.LIST, data)

export const updateDepartmentApi = (id, data) =>
  api.patch(ENDPOINTS.DEPARTMENTS.DETAIL(id), data)

export const deleteDepartmentApi = (id) =>
  api.delete(ENDPOINTS.DEPARTMENTS.DETAIL(id))