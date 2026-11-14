import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The React app never touches backend JSON files. Every data call goes to /api, which Vite proxies to Express.
const API_TARGET = process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:5000';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: { '/api': { target: API_TARGET, changeOrigin: true } },
  },
  preview: {
    port: 4173,
    proxy: { '/api': { target: API_TARGET, changeOrigin: true } },
  },
  build: { chunkSizeWarningLimit: 900 },
});
