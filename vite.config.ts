import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function femaleTtsPlugin(): Plugin {
  const handler = async (req: any, res: any) => {
    try {
      const reqUrl = new URL(req.url || '', 'http://localhost:3000');
      const text = reqUrl.searchParams.get('text') || '';
      const lang = reqUrl.searchParams.get('lang') || 'vi';

      if (!text) {
        res.statusCode = 400;
        res.end('Missing text parameter');
        return;
      }

      // Use Google TTS with 'tw-ob' client, standard Vietnamese female voice
      const targetUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(
        lang
      )}&client=tw-ob&q=${encodeURIComponent(text)}`;

      const response = await fetch(targetUrl, {
        headers: {
          Referer: 'https://translate.google.com/',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: '*/*',
        },
      });

      if (!response.ok) {
        res.statusCode = response.status;
        res.end('TTS fetch failed');
        return;
      }

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      const arrayBuffer = await response.arrayBuffer();
      res.end(Buffer.from(arrayBuffer));
    } catch (err: any) {
      res.statusCode = 500;
      res.end(err?.message || 'Server error');
    }
  };

  return {
    name: 'female-tts-proxy',
    configureServer(server) {
      server.middlewares.use('/api/tts', handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/tts', handler);
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      femaleTtsPlugin(),
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
          orientation: 'any',
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
              name: 'Mental Math',
              short_name: 'Mental Math',
              description: 'Luyện tính nhẩm siêu tốc não bộ',
              url: './?tab=mental-math',
              icons: [{ src: './pwa-192x192.png', sizes: '192x192' }],
            },
            {
              name: 'Memory Palace',
              short_name: 'Memory Palace',
              description: 'Phương pháp ghi nhớ không gian Memory Palace',
              url: './?tab=loci-journey',
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
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname ?? '.', '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true as const,
      hmr: false,
      watch: {
        ignored: ['**/dist/**', '**/.aistudio/**', '**/node_modules/**'],
      },
    },
  };
});
