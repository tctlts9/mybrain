import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker with auto-update
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('[PWA] New content available, updating service worker...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('[PWA] App is cached and ready to work offline');
  },
  onRegisterError(error: unknown) {
    console.error('[PWA] Service Worker registration failed:', error);
  },
});

createRoot(document.getElementById('root')!).render(<App />);
