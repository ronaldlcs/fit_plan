import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_PROXY_TARGET || env.BACKEND_URL || 'http://localhost:3001'
  const port = Number(env.PORT) || 3000

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port,
      strictPort: true,
      allowedHosts: ['fit-plan-frontend.onrender.com', '.onrender.com'],
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
    assetsInclude: ['**/*.svg', '**/*.csv'],
  }
})