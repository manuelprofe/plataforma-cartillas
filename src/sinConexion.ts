// Registra el service worker (dist/sw.js) para que la app funcione sin datos.
// Todo es silencioso: si el navegador no lo permite (por ejemplo, dentro de un iframe con
// sandbox) la app sigue igual, solo que necesita red. Nada de esto se muestra al niño.

/** Tiempo de cortesía tras la carga antes de bajar el paquete, para no competir con la app. */
const ESPERA_PAQUETE_MS = 3000;

export function registrarSinConexion() {
  if (import.meta.env.DEV) return;
  try {
    if (!('serviceWorker' in navigator)) return;
    if (document.readyState === 'complete') void registrar();
    else window.addEventListener('load', () => void registrar(), { once: true });
  } catch {
    // Sin service worker: la app funciona con red.
  }
}

async function registrar() {
  try {
    const sw = navigator.serviceWorker;
    // Ruta relativa: funciona igual en la raíz del dominio o en una subruta.
    const registro = await sw.register('./sw.js');

    // Si hay un service worker nuevo esperando y es de la misma versión que esta página,
    // se activa ya; si es de otra versión, espera a que se cierre la app.
    const pedirActivacion = (trabajador: ServiceWorker | null) =>
      trabajador?.postMessage({ tipo: 'activar-si-es-mi-version', modulo: import.meta.url });
    pedirActivacion(registro.waiting);
    registro.addEventListener('updatefound', () => {
      const nuevo = registro.installing;
      nuevo?.addEventListener('statechange', () => {
        if (nuevo.state === 'installed') pedirActivacion(nuevo);
      });
    });

    const listo = await sw.ready;
    window.setTimeout(() => {
      try {
        listo.active?.postMessage({ tipo: 'guardar-paquetes' });
      } catch {
        // Nada que hacer: se intenta en la próxima visita.
      }
    }, ESPERA_PAQUETE_MS);
  } catch {
    // Registro rechazado (sandbox, modo privado, origen no seguro): la app sigue con red.
  }
}
