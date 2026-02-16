import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const functionsTarget = (
    env.VITE_BACKEND_FUNCTIONS_BASE_URL ||
    env.VITE_FUNCTIONS_BASE_URL ||
    env.VITE_TWITCH_BACKEND_BASE_URL ||
    ''
  ).replace(/\/+$/, '')
  const serverConfig: Record<string, unknown> = {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  }

  if (functionsTarget) {
    serverConfig.proxy = {
      '/api/functions': {
        target: functionsTarget,
        changeOrigin: true,
        secure: true,
        rewrite: (requestPath: string) => requestPath.replace(/^\/api\/functions/, ''),
      },
    }
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './frontend'),
      },
    },
    server: serverConfig,
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            if (id.includes('lucide-react')) return 'icons'
            if (
              id.includes('@remix-run') ||
              id.includes('history') ||
              id.includes('scheduler') ||
              id.includes('react-router') ||
              id.includes('react-dom') ||
              id.includes('/react/')
            ) {
              return 'react-vendor'
            }
            return
          },
        },
      },
    },
  }
})
