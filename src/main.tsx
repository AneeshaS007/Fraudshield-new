import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AccessibilityProvider } from './context/AccessibilityContext.tsx';

createRoot(document.getElementById('root')!).render(
  <AccessibilityProvider>
    <App />
  </AccessibilityProvider>
);
