import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Cargar variables de entorno
  const env = loadEnv(mode, process.cwd(), '')

  // Extraer host de la URL configurada (si existe)
  const allowedHosts = ['localhost']

  if (env.VITE_WS_URL) {
    try {
      const url = new URL(env.VITE_WS_URL)
      if (url.hostname && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
        allowedHosts.push(url.hostname)
      }
    } catch (e) {
      // Si no es una URL válida, ignorar
    }
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      extensions: ['.mjs', '.js', '.jsx', '.json', '.ts', '.tsx'],
    },
    server: {
      port: 5173,
      host: '0.0.0.0', // Permitir acceso desde cualquier IP
      allowedHosts: allowedHosts,
      proxy: {
        '/api': {
          target: env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  }
})
