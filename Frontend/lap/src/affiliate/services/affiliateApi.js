// src/affiliate/services/affiliateApi.js
// Reuse LAP's authenticated API client so Affiliate uses the same JWT,
// refresh behavior, and base URL as the rest of the system.
import api from '../../api/axios';

const unwrap = (promise) =>
  promise
    .then((response) => response.data)
    .catch((error) => {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'An unexpected error occurred';
      throw new Error(message);
    });

const affiliateApi = {
  get: (url, config) => unwrap(api.get(url, config)),
  post: (url, data, config) => unwrap(api.post(url, data, config)),
  put: (url, data, config) => unwrap(api.put(url, data, config)),
  patch: (url, data, config) => unwrap(api.patch(url, data, config)),
  delete: (url, config) => unwrap(api.delete(url, config)),
};

export default affiliateApi;
