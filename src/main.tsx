// Hanken Grotesk autoalojada, eje de peso (la marca usa 400–800). Los tokens son los de brand/ (iguales al juego).
import '@fontsource-variable/hanken-grotesk/wght.css';
import '../brand/tokens.css';
import './styles/base.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
