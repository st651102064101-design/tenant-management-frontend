// API client for backend communication
// Centralized location to manage all API calls with proper base URL
// When running with `npm run dev`, requests go through Vite proxy to localhost:3001

import { apiConfig } from './config.js';

async function apiCall(endpoint, options = {}) {
  const url = `${apiConfig.baseUrl}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const detail = error.details ? ` - ${error.details}` : '';
    throw new Error((error.error || `API Error: ${response.status}`) + detail);
  }

  return response.json();
}

// Tenant API endpoints
export const tenantAPI = {
  getAll: () => apiCall('/api/tenants'),
  getById: (id) => apiCall(`/api/tenants/${id}`),
  create: (data) => apiCall('/api/tenants', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiCall(`/api/tenants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiCall(`/api/tenants/${id}`, { method: 'DELETE' }),
};

// Scanned packages API endpoints
export const packageAPI = {
  getAll: () => apiCall('/api/scanned-packages'),
  getByTenantId: (tenantId) => apiCall(`/api/scanned-packages/tenant/${tenantId}`),
  create: (data) => apiCall('/api/scanned-packages', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiCall(`/api/scanned-packages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiCall(`/api/scanned-packages/${id}`, { method: 'DELETE' }),
  matchTenant: (packageId, tenantId) => apiCall(`/api/scanned-packages/${packageId}/match/${tenantId}`, { method: 'PUT' }),
};

// Reports API endpoints
export const reportAPI = {
  getAll: () => apiCall('/api/reports'),
  getById: (id) => apiCall(`/api/reports/${id}`),
  create: (data) => apiCall('/api/reports', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => apiCall(`/api/reports/${id}`, { method: 'DELETE' }),
};

// Raspberry Pi Control API endpoints
export const piAPI = {
  getStatus: () => apiCall('/api/pi/status'),
  getInfo: () => apiCall('/api/pi/info'),
  getWifiStatus: () => apiCall('/api/pi/wifi'),
  scanWifi: () => apiCall('/api/pi/wifi/scan'),
  setWifiConfig: (ssid, password) => apiCall('/api/pi/wifi', { method: 'POST', body: JSON.stringify({ ssid, password }) }),
  switchPreferredNetwork: (target) => apiCall('/api/pi/network/prefer', { method: 'POST', body: JSON.stringify({ target }) }),
  getLogs: () => apiCall('/api/pi/logs'),
  clearLogs: () => apiCall('/api/pi/logs', { method: 'DELETE' }),
  control: (action) => apiCall('/api/pi/control', { method: 'POST', body: JSON.stringify({ action }) }),
  reboot: () => apiCall('/api/pi/reboot', { method: 'POST' }),
  speak: (text) => apiCall('/api/pi/speak', { method: 'POST', body: JSON.stringify({ text }) }),
  testTelegram: (message) => apiCall('/api/pi/telegram/test', { method: 'POST', body: JSON.stringify({ message }) }),
  captureAndSendTelegram: () => apiCall('/api/pi/capture-telegram', { method: 'POST' }),
  getTelegramMessages: (force = false) => apiCall(`/api/pi/telegram/messages${force ? '?force=1' : ''}`),
  sendTelegramMessage: (message) => apiCall('/api/pi/telegram/send', { method: 'POST', body: JSON.stringify({ message }) }),
  getVolume: () => apiCall('/api/pi/volume'),
  setVolume: (volume) => apiCall('/api/pi/volume', { method: 'POST', body: JSON.stringify({ volume }) }),
  getCredentialStatus: () => apiCall('/api/pi/credential'),
  uploadCredential: (credential) => apiCall('/api/pi/credential', { method: 'POST', body: JSON.stringify({ credential }) }),
  clearInbox: () => apiCall('/api/pi/inbox/clear', { method: 'POST' }),
  execSSH: (command) => apiCall('/api/pi/ssh', { method: 'POST', body: JSON.stringify({ command }) }),
};
