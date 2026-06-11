import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register PWA Service Worker
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('LifeOS Service Worker registered:', reg.scope))
      .catch((err) => console.warn('LifeOS Service Worker registration failed:', err));
  });
} else if ('serviceWorker' in navigator) {
  // In development, handle registration with fallback check
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('LifeOS Dev SW Registered:', reg.scope))
      .catch((err) => console.log('LifeOS Dev SW registration failed/skipped:', err));
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

