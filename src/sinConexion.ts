// Registra el service worker (dist/sw.js) para que la app funcione sin datos.
// Todo es silencioso: si el navegador no lo permite (por ejemplo, dentro de un iframe con
// sandbox) la app sigue igual, solo que necesita red. Nada de esto se muestra al niño.

/** Tiempo de cortesía tras la carga antes de bajar el paquete, para no competir con la app. */
const ESPERA_PAQUETE_MS = 3000;

/** Se vuelve verdadero con el primer toque o tecla: desde ahí no se recarga la página. */
let tocado = false;

export function registrarSinConexion() {
  if (import.meta.env.DEV) return;
  try {
    if (!('serviceWorker' in navigator)) return;
    const marcar = () => {
      tocado = true;
    };
    window.addEventListener('pointerdown', marcar, { once: true, capture: true });
    window.addEventListener('keydown', marcar, { once: true, capture: true });
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

    // Una versión nueva solo entra si el niño aún no ha tocado nada: se activa y la página
    // se recarga sola una vez. Si ya está jugando, entra la próxima vez que abra la app.
    const habiaControl = Boolean(sw.controller);
    let recargada = false;
    sw.addEventListener('controllerchange', () => {
      if (habiaControl && !tocado && !recargada) {
        recargada = true;
        location.reload();
      }
    });
    const pedirActivacion = (trabajador: ServiceWorker | null) => {
      if (trabajador && habiaControl && !tocado) trabajador.postMessage({ tipo: 'activar' });
    };

    // Ruta relativa: funciona igual en la raíz del dominio o en una subruta.
    const registro = await sw.register('./sw.js');
    pedirActivacion(registro.waiting);
    // Como el index sale del caché, se pregunta en cada apertura si hay versión nueva.
    if (habiaControl) void registro.update().catch(() => {});
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
