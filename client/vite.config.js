import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  // Production build settings
  build: {
    // Warn on chunks > 500 kB, error on > 1 MB
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Split vendor libraries into a separate chunk for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'axios': ['axios'],
        },
      },
    },
    // Generate source maps for production debugging (remove if you want obfuscation)
    sourcemap: false,
    // Minify with esbuild (default, fastest)
    minify: 'esbuild',
  },

  // Preview server (npm run preview) mirrors prod
  preview: {
    port: 4173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
