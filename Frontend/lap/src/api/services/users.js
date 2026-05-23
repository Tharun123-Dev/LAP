import api from '../axios'
import ENDPOINTS from '../endpoints'

export const getMeApi = () =>
  api.get(ENDPOINTS.USERS.ME)

export const listUsersApi = (role) =>
  api.get(ENDPOINTS.USERS.LIST, { params: { role } })

export const createUserApi = (data) =>
  api.post(ENDPOINTS.USERS.CREATE, data)

export const getUserApi = (id) =>
  api.get(ENDPOINTS.USERS.DETAIL(id))

export const updateUserApi = (id, data) =>
  api.patch(ENDPOINTS.USERS.DETAIL(id), data)