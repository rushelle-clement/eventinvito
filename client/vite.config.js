import process from 'node:process'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// The site's own address, for the link preview of the home page (WhatsApp, Facebook… need a full
// https:// address for the picture): VITE_SITE_URL if set, otherwise Vercel's production address.
function siteUrlPlugin(env) {
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  const url = (env.VITE_SITE_URL || (vercel ? `https://${vercel}` : '')).trim().replace(/\/+$/, '')
  return {
    name: 'site-url',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', url),
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), siteUrlPlugin(loadEnv(mode, process.cwd(), 'VITE_'))],
  server: {
    // Calls to /api/... from the React app are forwarded to the Express server,
    // so the client can use relative URLs like fetch("/api/auth/login").
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
}))
