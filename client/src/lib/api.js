import axios from 'axios';

const DEV_API_BASE_URL = 'http://localhost:3000/api';

const RETRYABLE_ERROR_CODES = new Set([
  'ECONNABORTED',
  'ECONNREFUSED',
  'ECONNRESET',
  'ERR_NETWORK',
]);

// Keys for localStorage (single source of truth)
export const STORAGE_KEYS = {
  USER: 'eduguard_user',
  TOKEN: 'eduguard_token',
};

export const api = axios.create({
  baseURL: import.meta.env.DEV ? DEV_API_BASE_URL : '/api',
  timeout: 10000,
  withCredentials: false,
});

// ─── REQUEST INTERCEPTOR ─────────────────────────────────────────────────────
// Attaches user identity headers before every outgoing request.
// Priority: Bearer JWT token (Phase 2) > legacy x-user-role headers (Phase 1)
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const userStr = localStorage.getItem(STORAGE_KEYS.USER);

      // Attach JWT Bearer token if available (Phase 2 auth)
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }

      // Attach role/id headers for legacy compatibility (Phase 1)
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user?.role) config.headers['x-user-role'] = user.role;
        if (user?.id) config.headers['x-user-id'] = user.id;
      }
    } catch (err) {
      console.error('[API] Request interceptor error:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── RESPONSE INTERCEPTOR ────────────────────────────────────────────────────
// Handles auth errors globally so every component doesn't need to.
api.interceptors.response.use(
  // Pass through successful responses unchanged
  (response) => response,

  // Handle errors centrally
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      // Session expired or invalid — force logout
      console.warn('[API] 401 Unauthorized — clearing session and redirecting to login.');
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);

      // Avoid redirect loop if already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    if (status === 403) {
      // Authenticated but forbidden — user doesn't have permission
      console.warn('[API] 403 Forbidden — insufficient permissions for this action.');
    }

    return Promise.reject(error);
  }
);

// ─── RETRY UTILITY ───────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isBackendRestartError = (error) => {
  const status = error?.response?.status;
  const message = String(error?.response?.data?.error || error?.message || '').toLowerCase();

  if (status === 503) return true;
  if (RETRYABLE_ERROR_CODES.has(error?.code)) return true;
  return message.includes('starting up') || message.includes('network error');
};

/**
 * Wraps any API call with automatic retry on backend restart / network blip.
 * Usage: await requestWithRestartRetry(() => api.get('/endpoint'))
 */
export const requestWithRestartRetry = async (
  requestFactory,
  { retries = 15, delayMs = 1000 } = {}
) => {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await requestFactory();
    } catch (error) {
      lastError = error;
      if (attempt === retries || !isBackendRestartError(error)) throw error;
      await sleep(delayMs * (attempt + 1));
    }
  }

  throw lastError;
};

export default api;

