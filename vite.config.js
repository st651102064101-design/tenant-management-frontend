import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

// Vite configuration file to build the Vue application.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const frontendPort = env.VITE_FRONTEND_PORT ? parseInt(env.VITE_FRONTEND_PORT, 10) : 36147;
  const frontendHost = env.VITE_FRONTEND_HOST || '0.0.0.0';
  const backendHost = env.VITE_BACKEND_HOST || 'project.3bbddns.com';
  const backendPort = env.VITE_BACKEND_PORT || '36149';
  const allowedHosts = env.VITE_ALLOWED_HOSTS
    ? env.VITE_ALLOWED_HOSTS.split(',').map((host) => host.trim()).filter(Boolean)
    : ['project.3bbddns.com', 'localhost', '127.0.0.1'];

  return {
    plugins: [vue()],
    server: {
      host: frontendHost,
      port: frontendPort,
      allowedHosts,
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