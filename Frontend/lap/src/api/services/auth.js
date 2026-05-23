import api from '../axios'
import ENDPOINTS from '../endpoints'

export const loginApi = (username, password) =>
  api.post(ENDPOINTS.AUTH.LOGIN, { username, password })

export const logoutApi = (refresh) =>
  api.post(ENDPOINTS.AUTH.LOGOUT, { refresh })