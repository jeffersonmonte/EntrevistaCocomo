import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://localhost:7032', // ou http://localhost:5045 se preferir
        changeOrigin: true,
        secure: false, // necessário para HTTPS com certificado self-signed
      },
    },
  },
});
