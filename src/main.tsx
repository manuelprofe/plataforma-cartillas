import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/baloo-2';
import './estilos.css';
import { App } from './App';
import { registrarSinConexion } from './sinConexion';

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

registrarSinConexion();
