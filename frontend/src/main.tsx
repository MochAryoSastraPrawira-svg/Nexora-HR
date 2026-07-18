import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { useThemeStore } from './store/themeStore';

const initialTheme = useThemeStore.getState().theme;
if (typeof document !== "undefined") {
  document.documentElement.classList.toggle("dark", initialTheme === "dark");
  document.documentElement.setAttribute("data-theme", initialTheme);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

