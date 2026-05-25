// src/api/axios.js
import axios from 'axios'

const BASE_URL = 'http://localhost:8000/api'
// const BASE_URL = ' https://lap-b9vi.onrender.com/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    // Only retry once, only on 401, not on the refresh call itself
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/token/refresh/')
    ) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh')
        if (!refresh) throw new Error('No refresh token')

        // Use raw axios (not api instance) to avoid interceptor loop
        const res = await axios.post(
          `${BASE_URL}/auth/token/refresh/`,
          { refresh },
          { headers: { 'Content-Type': 'application/json' } }
        )

        const newAccess = res.data.access
        localStorage.setItem('access', newAccess)

        // If refresh token was rotated, store new one
        if (res.data.refresh) {
          localStorage.setItem('refresh', res.data.refresh)
        }

        original.headers.Authorization = `Bearer ${newAccess}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

export default api