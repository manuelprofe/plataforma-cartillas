// Entrada: decide por la dirección qué paquete cargar (niño, adultos o proyectar) y solo
// carga ese. Así la primera carga de `/` no trae nada de los adultos ni del telón.
import '@fontsource-variable/baloo-2';
import { modoDe, type Modo } from './modos';
import { fijarMomentoSeguro, registrarSinConexion } from './sinConexion';

const raiz = document.getElementById('raiz')!;

// El enlace del correo de Supabase (invitación o contraseña olvidada) trae la sesión en el hash:
// `#access_token=…&type=invite`. Si Supabase lo manda a una dirección distinta de las pantallas
// que lo leen (/adultos, o la raíz si la dirección no estaba en su lista), se lleva allí antes de
// elegir el paquete. Un enlace vencido llega como `#error_code=otp_expired`.
{
  const hash = new URLSearchParams(location.hash.slice(1));
  const llegoDeCorreo = (hash.get('access_token') && hash.get('refresh_token')) || hash.get('error_code');
  if (llegoDeCorreo && !/^\/adultos\/(clave-nueva|invitacion)\/?$/.test(location.pathname) && /^\/(adultos\/?)?$/.test(location.pathname)) {
    history.replaceState(null, '', (hash.get('type') === 'recovery' ? '/adultos/clave-nueva' : '/adultos/invitacion') + location.hash);
  }
}
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
// Los adultos y el telón reciben la versión nueva apenas abren (el niño solo en un momento seguro,
// que decide su app): si no, un docente podía quedarse días con pantallas viejas.
if (modo !== 'estudiante') fijarMomentoSeguro(true);
