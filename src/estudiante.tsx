// Paquete del niño: el juego de siempre, con sus estilos.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './estilos.css';
import { App } from './App';

export function montar(raiz: HTMLElement) {
  createRoot(raiz).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
