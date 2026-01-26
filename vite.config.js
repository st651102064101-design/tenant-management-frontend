import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Vite configuration file to build the Vue application.
const frontendPort = process.env.VITE_FRONTEND_PORT ? parseInt(process.env.VITE_FRONTEND_PORT) : 36147;
const backendHost = process.env.VITE_BACKEND_HOST || 'project.3bbddns.com';
const backendPort = process.env.VITE_BACKEND_PORT || '36149';

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true, // Allow external access
    port: frontendPort,
    allowedHosts: ['project.3bbddns.com'],
    proxy: {
      '/api': {
        target: `http://${backendHost}:${backendPort}`,
        changeOrigin: true,
      },
      // Proxy uploads so frontend can request /uploads/... and get files from backend
      '/uploads': {
        target: `http://${backendHost}:${backendPort}`,
        changeOrigin: true,
      },
    },
  },
});