// Registra el service worker (dist/sw.js) para que la app funcione sin datos.
// Todo es silencioso: si el navegador no lo permite (por ejemplo, dentro de un iframe con
// sandbox) la app sigue igual, solo que necesita red. Nada de esto se muestra al niño.

/** Tiempo de cortesía tras la carga antes de bajar el paquete, para no competir con la app. */
const ESPERA_PAQUETE_MS = 3000;
/** Si la app estuvo oculta más que esto, al volver se pregunta si hay versión nueva. */
const OCULTA_PARA_REVISAR_MS = 30 * 60 * 1000;

/**
 * Una versión nueva solo entra (con una recarga) cuando la app dice que es un momento
 * seguro, por ejemplo en la portada. Lo decide el estado de la app, no los toques: así no
 * importa si el niño usa la pantalla táctil, un teclado o un lector de pantalla.
 */
let seguro = false;
let alCambiar: () => void = () => {};

export function fijarMomentoSeguro(valor: boolean) {
  seguro = valor;
  if (valor) alCambiar();
}

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
    // Pide que el navegador no borre el caché por falta de espacio, si lo permite.
    void navigator.storage?.persist?.().catch(() => {});

    // Esta página quedó vieja si otro service worker tomó el control después de uno que ya
    // la atendía (el primer control, en la primera visita, no cuenta).
    let controlador = sw.controller;
    let vieja = false;
    sw.addEventListener('controllerchange', () => {
      if (controlador) vieja = true;
      controlador = sw.controller;
      alCambiar();
    });

    // Ruta relativa: funciona igual en la raíz del dominio o en una subruta.
    const registro = await sw.register('./sw.js');
    if (!registro) return;

    let recargando = false;
    alCambiar = () => {
      if (!seguro || recargando) return;
      if (vieja) {
        recargando = true;
        location.reload();
      } else if (registro.waiting && sw.controller) {
        registro.waiting.postMessage({ tipo: 'activar' });
      }
    };
    registro.addEventListener('updatefound', () => {
      const nuevo = registro.installing;
      nuevo?.addEventListener('statechange', () => {
        if (nuevo.state === 'installed') alCambiar();
      });
    });
    alCambiar();

    // El index sale del caché: se pregunta por una versión nueva al abrir y al volver a la
    // app después de un buen rato (una pestaña que nunca se cierra también se actualiza).
    const buscarVersion = () => void registro.update().catch(() => {});
    if (sw.controller) buscarVersion();
    let ocultaDesde = 0;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') ocultaDesde = Date.now();
      else if (ocultaDesde && Date.now() - ocultaDesde > OCULTA_PARA_REVISAR_MS) buscarVersion();
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
