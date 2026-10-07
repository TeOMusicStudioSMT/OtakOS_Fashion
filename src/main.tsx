import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Tryb z Huba (Pierścień apek): ?tryb=chmura | lokalnie → krawiec projektuje w chmurze albo lokalnie.
// Bez parametru serwer zostaje przy swoim (domyślnie lokalnie). Brak klucza = lokalnie, z powodem w konsoli.
const tryb = new URLSearchParams(location.search).get('tryb');
if (tryb === 'chmura' || tryb === 'lokalnie') {
  fetch('/api/krawiec/tryb', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chmura: tryb === 'chmura' }) })
    .then((r) => r.json()).then((d) => { if (d.powod) console.warn('[Krawiec]', d.powod); })
    .catch(() => { /* serwer jeszcze wstaje — zostaje jego tryb */ });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
