import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png'],
        manifest: {
          id: './',
          name: 'MY BRAIN ACADEMY - Dashboard & Analytics',
          short_name: 'MY BRAIN',
          description: 'MY BRAIN ACADEMY - Nền tảng phân tích tài chính, giám sát quỹ và quản lý đối soát chuyên nghiệp.',
          theme_color: '#030712',
          background_color: '#030712',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: './',
          scope: './',
          categories: ['finance', 'business', 'productivity'],
          icons: [
            {
              src: './pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: './pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: './pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          shortcuts: [
            {
              name: 'XAUUSD Market',
              short_name: 'XAUUSD',
              description: 'Gold trading analytics and chart',
              url: './?tab=xauusd',
              icons: [{ src: './pwa-192x192.png', sizes: '192x192' }],
            },
            {
              name: 'Prop Firm Tracker',
              short_name: 'Prop Firm',
              description: 'Funded account monitor and drawdown alert',
              url: './?tab=propfirm',
              icons: [{ src: './pwa-192x192.png', sizes: '192x192' }],
            },
            {
              name: 'Backcom Rebates',
              short_name: 'Backcom',
              description: 'Broker commission rebate calculator',
              url: './?tab=backcom',
              icons: [{ src: './pwa-192x192.png', sizes: '192x192' }],
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname ?? '.', '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
