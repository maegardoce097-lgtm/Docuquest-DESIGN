const configuredApiBase = import.meta.env.VITE_API_BASE;
const injectedApiBase = document.querySelector('meta[name="docuquest-api-base"]')?.content;
const API_BASE = configuredApiBase || injectedApiBase || '/api';
export const APP_BASE_URL = new URL('../', document.querySelector('base')?.href || window.location.href).pathname;
export const appUrl = (path = '') => `${APP_BASE_URL}${path.replace(/^\/+/, '')}`;
export const ADMIN_URL = appUrl('admin');
export const homepageImageUrl = (slot, version = '') => `${API_BASE}/homepage/image?slot=${encodeURIComponent(slot)}${version ? `&v=${encodeURIComponent(version)}` : ''}`;
const ACCESS_KEY = 'docuquest_access_token';
const REFRESH_KEY = 'docuquest_refresh_token';

let accessToken = sessionStorage.getItem(ACCESS_KEY) || '';

function storeTokens(tokens) {
  accessToken = tokens?.access_token || '';
  if (accessToken) sessionStorage.setItem(ACCESS_KEY, accessToken);
  else sessionStorage.removeItem(ACCESS_KEY);
  if (tokens?.refresh_token) sessionStorage.setItem(REFRESH_KEY, tokens.refresh_token);
}

export function clearTokens() {
  accessToken = '';
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
}

async function send(path, options = {}, retry = true) {
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (response.status === 401 && retry && path !== '/refresh' && path !== '/login' && path !== '/create') {
    const refreshToken = sessionStorage.getItem(REFRESH_KEY);
    if (refreshToken) {
      const refreshed = await fetch(`${API_BASE}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (refreshed.ok) {
        const payload = await refreshed.json();
        storeTokens(payload.tokens);
        return send(path, options, false);
      }
    }
    clearTokens();
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    if (response.ok) {
      throw new Error('The server returned an invalid response. Please try again.');
    }
    payload = {};
  }
  if (!response.ok) {
    const error = new Error(payload.error || payload.message || `Request failed (${response.status})`);
    error.pendingPayments = Array.isArray(payload.pending_payments) ? payload.pending_payments : [];
    throw error;
  }
  if (payload.tokens) storeTokens(payload.tokens);
  return payload;
}

export function apiRequest(path, options = {}) {
  return send(path, options);
}

export function postJson(path, value) {
  return apiRequest(path, { method: 'POST', body: JSON.stringify(value) });
}

export function logout() {
  const refreshToken = sessionStorage.getItem(REFRESH_KEY);
  const currentAccessToken = accessToken;
  clearTokens();
  if (!refreshToken && !currentAccessToken) return;

  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (currentAccessToken) headers.set('Authorization', `Bearer ${currentAccessToken}`);
  void fetch(`${API_BASE}/logout`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ refresh_token: refreshToken || '' }),
  }).catch(() => {});
}

export function hasSession() {
  return Boolean(accessToken || sessionStorage.getItem(REFRESH_KEY));
}

export async function fetchProtectedFile(path) {
  const request = async (retry = true) => {
    const headers = new Headers();
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
    const response = await fetch(`${API_BASE}${path}`, { headers });
    if (response.status === 401 && retry) {
      try {
        await send('/profile');
      } catch {
        clearTokens();
        throw new Error('Your session has expired. Please sign in again.');
      }
      return request(false);
    }
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `File request failed (${response.status})`);
    }
    return response.blob();
  };

  return request();
}

export async function downloadRequestFile(file) {
  const path = `/requests/file?id=${encodeURIComponent(file.id)}`;
  const url = URL.createObjectURL(await fetchProtectedFile(path));
  const link = document.createElement('a');
  link.href = url;
  link.download = file.original_name;
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function fetchMessageImage(fileId) {
  const path = `/requests/message-file?id=${encodeURIComponent(fileId)}`;
  return URL.createObjectURL(await fetchProtectedFile(path));
}