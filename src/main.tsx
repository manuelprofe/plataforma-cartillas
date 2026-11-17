// Entrada: decide por la dirección qué paquete cargar (niño, adultos o proyectar) y solo
// carga ese. Así la primera carga de `/` no trae nada de los adultos ni del telón.
import '@fontsource-variable/baloo-2';
import { modoDe, type Modo } from './modos';
import { registrarSinConexion } from './sinConexion';

const raiz = document.getElementById('raiz')!;
const modo = modoDe(location.pathname);
// Un import() por modo, cada uno en su propia función: escritos como ternario o como ifs, el
// compilador los junta en una sola llamada con los CSS de una sola rama (los adultos recibían
// el paquete y los estilos del niño).
const PAQUETES: Record<Modo, () => Promise<{ montar: (raiz: HTMLElement) => void }>> = {
  estudiante: () => import('./estudiante'),
  adultos: () => import('./adultos/Adultos'),
  proyectar: () => import('./proyectar/Proyectar'),
};
void PAQUETES[modo]().then((m) => m.montar(raiz));

registrarSinConexion();
