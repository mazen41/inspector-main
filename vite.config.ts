import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')

  let apiProxyUrl: URL
  try {
    apiProxyUrl = new URL(env.VITE_API_BASE_URL || 'http://samh.test/api')
  } catch {
    apiProxyUrl = new URL('http://samh.test/api')
  }
  const apiProxyPath = apiProxyUrl.pathname.replace(/\/+$/, '') || '/api'

  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      // Make env variables available to the app
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    server: {
      port: parseInt(env.VITE_PORT) || 3000,
      host: env.VITE_HOST === 'true' || true,
      proxy: {
        [apiProxyPath]: {
          target: apiProxyUrl.origin,
          changeOrigin: true,
          secure: env.VITE_API_SECURE === 'true',
          configure: (proxy) => {
            if (mode === 'development') {
              proxy.on('error', (err) => {
                console.log('proxy error', err);
              });
              proxy.on('proxyReq', (_proxyReq, req) => {
                console.log('Sending Request to the Target:', req.method, req.url);
              });
              proxy.on('proxyRes', (proxyRes, req) => {
                console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
              });
            }
          },
        }
      },
      allowedHosts: ['dashboard-dev.samh.test']
    },
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      minify: mode === 'production' ? 'esbuild' : false,
      target: 'es2015',
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks for better caching
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            redux: ['@reduxjs/toolkit', 'react-redux'],
            ui: ['lucide-react', 'clsx'],
            charts: ['recharts'],
          },
        },
      },
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 1000,
    },
    preview: {
      port: parseInt(env.VITE_PREVIEW_PORT) || 4173,
      host: env.VITE_HOST === 'true' || true,
    },
    // Environment variables prefix
    envPrefix: 'VITE_',
  }
})
