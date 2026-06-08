import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/ehrbase': {
        target: 'http://localhost:8086',
        changeOrigin: true,
        configure: (proxy) => {
          // EHRbase rejects PUT/DELETE if Origin header is present (CORS config only allows POST).
          // Safe to strip since this is a local dev proxy to a same-machine service.
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin')
          })
        },
      },
    },
  },
})
