// Enrutador mínimo sobre la API de historial (sin dependencias).
// - Dentro de un modo, cambiar de ruta no recarga: pushState y un aviso a quien escucha.
// - Entre modos (niño, adultos, proyectar) se carga la página completa: cada modo trae solo su
//   código y sus estilos, y nada del modo anterior queda en memoria (el telón nunca hereda
//   datos de la sesión del docente).
import { useSyncExternalStore } from 'react';
import { modoDe } from './modos';

const AVISO = 'pc-ruta';

interface Estado {
  /** Ruta desde la que se llegó con `navegar`, para que "volver" use el atrás del historial. */
  previa?: string;
}

function suscribir(cambio: () => void) {
  window.addEventListener('popstate', cambio);
  window.addEventListener(AVISO, cambio);
  return () => {
    window.removeEventListener('popstate', cambio);
    window.removeEventListener(AVISO, cambio);
  };
}

const rutaActual = () => location.pathname;

/** La ruta actual; el componente se vuelve a pintar cuando cambia. */
export function useRuta(): string {
  return useSyncExternalStore(suscribir, rutaActual);
}

/** Va a una ruta. `reemplazar` cambia la entrada actual del historial en vez de sumar una. */
export function navegar(ruta: string, reemplazar = false) {
  if (ruta === location.pathname) return;
  if (modoDe(ruta) !== modoDe(location.pathname)) {
    if (reemplazar) location.replace(ruta);
    else location.assign(ruta);
    return;
  }
  if (reemplazar) history.replaceState(history.state, '', ruta);
  else history.pushState({ previa: location.pathname } satisfies Estado, '', ruta);
  window.scrollTo(0, 0);
  window.dispatchEvent(new Event(AVISO));
}

/**
 * Vuelve a la pantalla madre. Si se llegó desde ella, es el atrás del historial (así el atrás
 * de Android no regresa a la pantalla que se acaba de cerrar); si no, la reemplaza.
 */
export function volver(madre: string) {
  if ((history.state as Estado | null)?.previa === madre) history.back();
  else navegar(madre, true);
}
