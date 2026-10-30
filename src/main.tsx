import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { ConsentProvider } from './lib/consent.tsx';
import './styles.css';
import './components.css';
createRoot(document.getElementById('root')!).render(
  <ConsentProvider>
    <App />
  </ConsentProvider>,
);
