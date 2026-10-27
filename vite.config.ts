import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import { paychanguApi } from './server/paychangu.ts'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// PayChangu secret key: read from .env here on the server side only (no VITE_ prefix = never sent to the browser)
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), paychanguApi(loadEnv(mode, process.cwd(), ''))],
  server: { allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev', '.ngrok.app', '.ngrok.io'] },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
}))
