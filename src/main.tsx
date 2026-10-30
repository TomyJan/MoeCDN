import { createRoot } from 'react-dom/client';
import { Tooltip } from 'radix-ui';
import { App } from './App.tsx';
import { ConsentProvider } from './lib/consent.tsx';
import './styles.css';
import './components.css';
createRoot(document.getElementById('root')!).render(
  <ConsentProvider>
    <Tooltip.Provider>
      <App />
    </Tooltip.Provider>
  </ConsentProvider>,
);
