import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Force light theme globally by ensuring Tailwind `dark:` variants never apply.
// If some code ever adds the `dark` class to <html>, remove it on startup.
if (typeof document !== "undefined") {
  document.documentElement.classList.remove("dark");
  document.documentElement.setAttribute("data-theme", "light");
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

