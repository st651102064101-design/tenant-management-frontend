/**
 * Frontend Configuration File
 * Centralized place for all frontend constants and environment variables
 */

// Detect environment
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

// Export API_BASE_URL for direct use. Fallback to constructed host:port if not provided.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${import.meta.env.VITE_BACKEND_HOST}:${import.meta.env.VITE_BACKEND_PORT}`;

// WebSocket URL (convert http to ws)
export const WS_URL = (() => {
  try {
    return API_BASE_URL.replace(/^http/, 'ws');
  } catch (e) {
    return `ws://${import.meta.env.VITE_BACKEND_HOST}:${import.meta.env.VITE_BACKEND_PORT}`;
  }
})();

export const config = {
  // API Configuration
  api: {
    baseUrl: API_BASE_URL,
    timeout: 10000, // 10 seconds
    
    // Endpoints
    endpoints: {
      tenants: '/api/tenants',
      packages: '/api/scanned-packages',
      reports: '/api/reports',
    },
  },

  // Server Configuration
  server: {
    port: parseInt(import.meta.env.VITE_FRONTEND_PORT),
    host: import.meta.env.VITE_BACKEND_HOST,
  },

  // Backend Server Information
  backend: {
    port: parseInt(import.meta.env.VITE_BACKEND_PORT),
    host: import.meta.env.VITE_BACKEND_HOST,
    url: import.meta.env.VITE_API_BASE_URL,
  },

  // UI Configuration
  ui: {
    // Modal
    modal: {
      animationDuration: 300, // ms
    },
    // Table
    table: {
      pageSize: 10,
      rowsPerPage: 10,
    },
    // Toast/Alert
    alert: {
      duration: 3000, // ms
    },
  },

  // Error Messages (Thai)
  errors: {
    notFound: 'ไม่พบข้อมูล',
    failedToFetch: 'ไม่สามารถโหลดข้อมูลได้',
    failedToCreate: 'ไม่สามารถสร้างข้อมูลได้',
    failedToUpdate: 'ไม่สามารถแก้ไขข้อมูลได้',
    failedToDelete: 'ไม่สามารถลบข้อมูลได้',
    databaseError: 'เกิดข้อผิดพลาดฐานข้อมูล',
    missingFields: 'กรุณากรอกข้อมูลให้ครบถ้วน',
    networkError: 'เกิดข้อผิดพลาดเครือข่าย',
  },

  // Success Messages (Thai)
  success: {
    created: 'สร้างข้อมูลสำเร็จ',
    updated: 'แก้ไขข้อมูลสำเร็จ',
    deleted: 'ลบข้อมูลสำเร็จ',
  },

  // Confirmation Messages (Thai)
  confirmations: {
    deleteTenant: 'ยืนยันการลบผู้เช่านี้หรือไม่?',
    deletePackage: 'ยืนยันการลบพัสดุนี้หรือไม่?',
  },

  // Feature Flags
  features: {
    enableDataManagement: true,
    enableReports: true,
    enableEdit: true,
    enableDelete: true,
  },

  // Environment Info
  environment: {
    isDev,
    isProd,
    nodeEnv: import.meta.env.MODE,
  },
};

// Export individual config sections for convenience
export const apiConfig = config.api;
export const serverConfig = config.server;
export const uiConfig = config.ui;
export const errorMessages = config.errors;
export const confirmations = config.confirmations;
export const successMessages = config.success;

export default config;
