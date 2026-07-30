import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Fondeg/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
      },
    },
  },
})
