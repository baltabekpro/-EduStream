import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backendUrl = process.env.BACKEND_URL || 'https://172-207-57-215.sslip.io';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  server: {
    port: 3000,
    proxy: {
      '/api/v1': {
        target: backendUrl,
        changeOrigin: true,
        secure: true
      }
    }
  }
});
