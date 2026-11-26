import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npm run build:artifact` genera dist-preview/index.html: una sola página sin PWA,
// para enseñar el prototipo sin desplegar.
export default defineConfig(({ mode }) => {
  if (mode === 'singlefile') {
    return {
      plugins: [react(), tailwindcss(), viteSingleFile()],
      define: { 'import.meta.env.VITE_SINGLEFILE': 'true' },
      build: { outDir: 'dist-preview' },
    }
  }
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        // La API de sincronización nunca se sirve desde la caché.
        workbox: { navigateFallbackDenylist: [/^\/api\//] },
        includeAssets: ['favicon.svg'],
        manifest: {
          name: 'TUTOR-ia',
          short_name: 'TUTOR-ia',
          description: 'Quasèrn digitau de tutoria',
          lang: 'oc-aranes',
          theme_color: '#14202c',
          background_color: '#edf4f8',
          display: 'standalone',
          start_url: '/',
          icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
        },
      }),
    ],
  }
})
