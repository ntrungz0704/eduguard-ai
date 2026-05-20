import axios from 'axios';

const DEV_API_BASE_URL = 'http://localhost:3000/api';
const RETRYABLE_ERROR_CODES = new Set([
  'ECONNABORTED',
  'ECONNREFUSED',
  'ECONNRESET',
  'ERR_NETWORK',
]);

export const api = axios.create({
  baseURL: import.meta.env.DEV ? DEV_API_BASE_URL : '/api',
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isBackendRestartError = (error) => {
  const status = error?.response?.status;
  const message = String(error?.response?.data?.error || error?.message || '').toLowerCase();

  if (status === 503) {
    return true;
  }

  if (RETRYABLE_ERROR_CODES.has(error?.code)) {
    return true;
  }

  return message.includes('starting up') || message.includes('network error');
};

export const requestWithRestartRetry = async (
  requestFactory,
  { retries = 3, delayMs = 500 } = {}
) => {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await requestFactory();
    } catch (error) {
      lastError = error;

      if (attempt === retries || !isBackendRestartError(error)) {
        throw error;
      }

      await sleep(delayMs * (attempt + 1));
    }
  }

  throw lastError;
};
