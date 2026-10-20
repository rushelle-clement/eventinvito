import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Calls to /api/... from the React app are forwarded to the Express server,
    // so the client can use relative URLs like fetch("/api/auth/login").
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
