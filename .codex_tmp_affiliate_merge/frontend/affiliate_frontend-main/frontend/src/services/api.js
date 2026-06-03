import axios from 'axios';
import { API_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically add authorization tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to manage global error messages or automatic logouts
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.detail || error.response?.data?.message || 'An unexpected error occurred';
    
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      // Optional: window.location.href = '/login';
    }
    
    return Promise.reject(new Error(message));
  }
);

export default api;
