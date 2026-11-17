// Entrada: decide por la dirección qué paquete cargar (niño, adultos o proyectar) y solo
// carga ese. Así la primera carga de `/` no trae nada de los adultos ni del telón.
import '@fontsource-variable/baloo-2';
import { modoDe } from './modos';
import { registrarSinConexion } from './sinConexion';

const raiz = document.getElementById('raiz')!;
const modo = modoDe(location.pathname);
const paquete =
  modo === 'adultos' ? import('./adultos/Adultos') : modo === 'proyectar' ? import('./proyectar/Proyectar') : import('./estudiante');
void paquete.then((m) => m.montar(raiz));

// Atrás o adelante hacia otro modo: se carga esa página completa.
window.addEventListener('popstate', () => {
  if (modoDe(location.pathname) !== modo) location.reload();
});

registrarSinConexion();
