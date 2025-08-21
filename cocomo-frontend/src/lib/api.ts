
// src/lib/api.ts
import axios from 'axios';

/**
 * Axios client padronizado
 * - baseURL: '/api'
 * - timeout: 15s
 * - withCredentials: true (se usar cookies)
 * - Interceptors para Authorization e tratamento básico de 401
 */
export const api = axios.create({
  baseURL: 'https://localhost:7032/api',
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Tratamento básico (ex.: renovar sessão / redirecionar)
    if (err?.response?.status === 401) {
      // Ex.: window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
