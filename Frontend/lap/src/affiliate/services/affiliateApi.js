// src/affiliate/services/affiliateApi.js
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://lap-b9vi.onrender.com/api';

const affiliateApi = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Use LAP's JWT token key ('access') — same token, single login
affiliateApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

affiliateApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      'An unexpected error occurred';
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(new Error(message));
  }
);

export default affiliateApi;