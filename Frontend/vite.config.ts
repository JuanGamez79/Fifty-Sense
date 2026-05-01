import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: ['localhost', '127.0.0.1', '192.168.1.11', 'fiftysense.unearned.duckdns.org'],
    proxy: {
      '/api/': {
        target: 'http://192.168.1.11:3006',
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  }
})
