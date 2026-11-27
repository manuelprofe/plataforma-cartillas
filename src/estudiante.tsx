// Paquete del niño: el juego de siempre, con sus estilos. La sala de juegos del docente
// (/jugar/…) usa las mismas plantillas y estilos, sin mapa ni perfiles.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './estilos.css';
import { App } from './App';
import { Jugar } from './sala/Jugar';

export function montar(raiz: HTMLElement) {
  const sala = location.pathname.startsWith('/jugar/');
  createRoot(raiz).render(<StrictMode>{sala ? <Jugar ruta={location.pathname} /> : <App />}</StrictMode>);
}
