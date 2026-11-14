// Service worker de la plataforma: hace que el modo estudiante funcione sin datos.
//
// Esta es la plantilla. Al compilar, el plugin `sinConexion` de vite.config.ts reemplaza la
// marca de CONFIG por la lista real de archivos y las versiones, y la publica como dist/sw.js.
//
// Estrategias:
// - Armazón (index.html, JS, CSS, fuente latina, manifiesto, iconos): se guarda al instalar.
// - Archivos con hash en assets/ y archivos del paquete de una cartilla: caché primero.
// - index.html y cartilla.json: red primero con respaldo de caché, para que una cartilla
//   actualizada llegue cuando hay red.
// - El paquete de la cartilla (imágenes e iconos que lista cartilla.json) se guarda en
//   segundo plano cuando la página lo pide, después de que la app ya se puede usar.
//
// Versionado: cada publicación produce otra versión. El service worker nuevo no toma el
// control solo; espera a que se cierre la app o a que una página de su misma versión le
// pida activarse (ver src/sinConexion.ts). Al activarse borra los cachés viejos.

/** @type {{ version: string, armazon: string[], cartillas: Record<string, string> }} */
const CONFIG = __CONFIG__;

const PREFIJO = 'cartillas-';
const CACHE_ARMAZON = `${PREFIJO}armazon-${CONFIG.version}`;
/** Un caché por cartilla; su nombre cambia solo si cambia el contenido del paquete. */
const cacheDeCartilla = (dir) => `${PREFIJO}paquete-${dir.replace(/\W+/g, '_')}-${CONFIG.cartillas[dir]}`;
const ESPERA_RED_MS = 4000;
// Se ignora Vary: el servidor puede responder "Vary: Origin" y el navegador pide los módulos
// con cabecera Origin, así que sin esto lo guardado no coincidiría y fallaría sin red.
const BUSQUEDA = { ignoreSearch: true, ignoreVary: true };
const EXTENSIONES_PAQUETE = /\.(webp|avif|png|jpe?g|svg|gif|mp3|ogg|m4a|wav|webm|mp4|json|vtt)$/i;

const alcance = new URL(self.registration.scope);
const url = (ruta) => new URL(ruta, alcance).href;
const URL_INDEX = url('index.html');
const URL_RAIZ = url('./');

/** Devuelve la carpeta de cartilla (p. ej. "cartillas/ingles-3/") a la que pertenece una URL. */
function carpetaDe(href) {
  if (!href.startsWith(alcance.href)) return null;
  const relativa = href.slice(alcance.href.length);
  return Object.keys(CONFIG.cartillas).find((dir) => relativa.startsWith(dir)) ?? null;
}

async function guardarArmazon() {
  const cache = await caches.open(CACHE_ARMAZON);
  await Promise.all(
    CONFIG.armazon.map(async (ruta) => {
      const destino = url(ruta);
      // Los archivos con hash pueden salir de la caché HTTP; los demás se revalidan.
      const hash = /\/assets\//.test(destino);
      const respuesta = await fetch(destino, { cache: hash ? 'default' : 'no-cache' });
      if (!respuesta.ok) throw new Error(`${respuesta.status} ${destino}`);
      await cache.put(destino, respuesta);
    }),
  );
  // La raíz "./" se sirve con el mismo index.html.
  const index = await cache.match(URL_INDEX, BUSQUEDA);
  if (index) await cache.put(URL_RAIZ, index.clone());
}

/** Recorre el JSON y junta toda cadena que parezca un archivo del paquete. */
function rutasDelJson(nodo, salida = new Set()) {
  if (typeof nodo === 'string') {
    if (EXTENSIONES_PAQUETE.test(nodo) && !/^[a-z]+:/i.test(nodo) && !nodo.startsWith('/')) salida.add(nodo);
  } else if (Array.isArray(nodo)) {
    nodo.forEach((n) => rutasDelJson(n, salida));
  } else if (nodo && typeof nodo === 'object') {
    Object.values(nodo).forEach((n) => rutasDelJson(n, salida));
  }
  return salida;
}

/** Guarda el paquete de cada cartilla. Lo que ya está guardado no se vuelve a pedir. */
async function guardarPaquetes() {
  for (const dir of Object.keys(CONFIG.cartillas)) {
    const cache = await caches.open(cacheDeCartilla(dir));
    const urlJson = url(`${dir}cartilla.json`);
    let datos;
    try {
      const respuesta = await fetch(urlJson, { cache: 'no-cache' });
      if (!respuesta.ok) continue;
      await cache.put(urlJson, respuesta.clone());
      datos = await respuesta.json();
    } catch {
      const guardada = await cache.match(urlJson, BUSQUEDA);
      if (!guardada) continue;
      datos = await guardada.json();
    }
    const pendientes = [...rutasDelJson(datos)].map((ruta) => new URL(ruta, urlJson).href);
    // De a pocas para no saturar una conexión lenta.
    const SIMULTANEAS = 4;
    for (let i = 0; i < pendientes.length; i += SIMULTANEAS) {
      await Promise.all(
        pendientes.slice(i, i + SIMULTANEAS).map(async (destino) => {
          if (await cache.match(destino, BUSQUEDA)) return;
          try {
            const respuesta = await fetch(destino);
            if (respuesta.ok) await cache.put(destino, respuesta);
          } catch {
            // Sin red a mitad de camino: se completa en la próxima visita.
          }
        }),
      );
    }
  }
}

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    (async () => {
      await guardarArmazon();
      // En una actualización la app ya estaba instalada: se puede traer el paquete aquí
      // mismo para que el niño nunca quede sin imágenes al cambiar de versión.
      if (self.registration.active) await guardarPaquetes().catch(() => {});
    })(),
  );
});

self.addEventListener('activate', (evento) => {
  const vigentes = new Set([CACHE_ARMAZON, ...Object.keys(CONFIG.cartillas).map(cacheDeCartilla)]);
  evento.waitUntil(
    (async () => {
      const nombres = await caches.keys();
      await Promise.all(nombres.filter((n) => n.startsWith(PREFIJO) && !vigentes.has(n)).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (evento) => {
  const datos = evento.data ?? {};
  if (datos.tipo === 'guardar-paquetes') {
    evento.waitUntil(guardarPaquetes().catch(() => {}));
  } else if (datos.tipo === 'activar-si-es-mi-version') {
    // Solo se activa si la página que lo pide ya corre el código de esta versión;
    // así una página vieja nunca queda servida por cachés nuevos (ni al revés).
    const propio = typeof datos.modulo === 'string' && CONFIG.armazon.some((ruta) => url(ruta) === datos.modulo);
    if (propio) self.skipWaiting();
  }
});

async function cacheConRespaldoDeRed(peticion, nombreCache) {
  const guardada = await caches.match(peticion, BUSQUEDA);
  if (guardada) return guardada;
  const respuesta = await fetch(peticion);
  if (respuesta.ok && respuesta.type === 'basic') {
    const cache = await caches.open(nombreCache);
    await cache.put(peticion, respuesta.clone());
  }
  return respuesta;
}

/**
 * Red primero; si la red falla o tarda demasiado, lo guardado.
 * Con `actualizar`, la copia guardada se renueva con lo que llega de la red. El index.html
 * no se renueva así: solo lo escribe la instalación, junto con el JS y el CSS que le
 * corresponden, para que sin red nunca se mezcle un index nuevo con archivos viejos.
 */
async function redConRespaldoDeCache(peticion, nombreCache, claveCache, actualizar) {
  const desdeRed = fetch(peticion.url, { cache: 'no-cache', credentials: 'same-origin' }).then(async (respuesta) => {
    if (actualizar && respuesta.ok) await (await caches.open(nombreCache)).put(claveCache, respuesta.clone());
    // Una navegación no acepta respuestas redirigidas: se entrega una copia limpia.
    if (respuesta.redirected) {
      return new Response(respuesta.body, { status: respuesta.status, statusText: respuesta.statusText, headers: respuesta.headers });
    }
    return respuesta;
  });
  desdeRed.catch(() => {});
  const plazo = new Promise((resolver) => setTimeout(resolver, ESPERA_RED_MS));
  try {
    const primera = await Promise.race([desdeRed, plazo]);
    if (primera) return primera;
  } catch {
    // Sin red: se usa lo guardado.
  }
  // Primero en el caché de esta versión; así una versión que espera no presta su index.
  const guardada = (await (await caches.open(nombreCache)).match(claveCache, BUSQUEDA)) ?? (await caches.match(claveCache, BUSQUEDA));
  if (guardada) return guardada;
  return desdeRed;
}

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;
  if (peticion.method !== 'GET') return;
  const destino = new URL(peticion.url);
  if (destino.origin !== alcance.origin || !peticion.url.startsWith(alcance.href)) return;
  const href = destino.origin + destino.pathname;

  if (peticion.mode === 'navigate' || href === URL_INDEX) {
    evento.respondWith(redConRespaldoDeCache(peticion, CACHE_ARMAZON, URL_INDEX, false));
    return;
  }

  const carpeta = carpetaDe(href);
  if (carpeta) {
    const nombre = cacheDeCartilla(carpeta);
    if (href.endsWith('/cartilla.json')) {
      evento.respondWith(redConRespaldoDeCache(peticion, nombre, href, true));
    } else {
      evento.respondWith(cacheConRespaldoDeRed(peticion, nombre));
    }
    return;
  }

  if (href.startsWith(url('assets/'))) {
    // Con hash en el nombre: nunca cambian. Incluye las fuentes que no se precachean.
    evento.respondWith(cacheConRespaldoDeRed(peticion, CACHE_ARMAZON));
    return;
  }

  // Lo demás (manifiesto, iconos de la app): red con respaldo de lo guardado.
  evento.respondWith(fetch(peticion).catch(async () => (await caches.match(peticion, BUSQUEDA)) ?? Response.error()));
});
