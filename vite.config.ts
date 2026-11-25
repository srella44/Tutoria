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
        includeAssets: ['favicon.svg'],
        manifest: {
          name: 'Tutoria',
          short_name: 'Tutoria',
          description: 'Quasèrn digitau de tutoria',
          lang: 'oc-aranes',
          theme_color: '#0f5c4d',
          background_color: '#f7f7f5',
          display: 'standalone',
          start_url: '/',
          icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
        },
      }),
    ],
  }
})
