import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import '@fontsource/source-code-pro/latin-400.css';
import './assets/misans.css';
import './styles.css';
import './components.css';
createRoot(document.getElementById('root')!).render(<App />);
