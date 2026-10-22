import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const liveApiUrl = env.LIVE_API_URL;
  const proxy = liveApiUrl ? {
    '/api': {
      target: liveApiUrl,
      changeOrigin: true,
      timeout: 120000,
      proxyTimeout: 120000,
    },
  } : undefined;
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      ...(proxy ? { proxy } : {}),
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
