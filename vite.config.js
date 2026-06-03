import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Mumtaz Medical',
        short_name: 'Mumtaz',
        description: 'Offline-first pharmacy POS starter for Mumtaz Medical.',
        theme_color: '#0f172a',
        background_color: '#020617',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@supabase')) return 'supabase-vendor';
          if (id.includes('html5-qrcode')) return 'scanner-vendor';
          if (id.includes('jsbarcode')) return 'barcode-vendor';
          if (id.includes('virtual:pwa-register') || id.includes('workbox-window')) return 'pwa-vendor';
          return 'vendor';
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
});
