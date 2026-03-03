import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

// Vite configuration file to build the Vue application.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const frontendPort = env.VITE_FRONTEND_PORT ? parseInt(env.VITE_FRONTEND_PORT, 10) : 36147;
  const backendHost = env.VITE_BACKEND_HOST || 'project.3bbddns.com';
  const backendPort = env.VITE_BACKEND_PORT || '36149';

  return {
    plugins: [vue()],
    server: {
      host: true,
      port: frontendPort,
      allowedHosts: ['project.3bbddns.com'],
      proxy: {
        '/api': {
          target: `http://${backendHost}:${backendPort}`,
          changeOrigin: true,
        },
        '/uploads': {
          target: `http://${backendHost}:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});