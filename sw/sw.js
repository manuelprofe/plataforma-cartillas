// Service worker de la plataforma: hace que el modo estudiante funcione sin datos.
//
// Esta es la plantilla. Al compilar, el plugin `sinConexion` de vite.config.ts reemplaza la
// marca de CONFIG por la huella (SHA-256) de cada archivo y lo publica como dist/sw.js.
//
// Reglas:
// - Todo lo guardado va atado a una versión: el index, el JS, el CSS y cartilla.json se
//   sirven desde el caché de la versión activa (caché primero), así nunca se mezclan
//   archivos de dos publicaciones y una red colgada no deja la pantalla en blanco.
// - Una versión nueva llega por el ciclo normal del service worker: el navegador revisa
//   sw.js en cada visita; si cambió, el nuevo se instala en segundo plano.
// - Nada se guarda sin comprobar su huella (o, si no está en la lista, su tipo): un portal
//   cautivo, un 503 o una descarga cortada nunca quedan guardados como si fueran la app.
// - Al instalar una versión nueva, lo que no cambió se copia del caché anterior y solo se
//   baja lo nuevo. Si algo que antes funcionaba sin red no se puede bajar, la instalación
//   falla y sigue la versión anterior completa.
// - El paquete de la cartilla se baja la primera vez en segundo plano, cuando la página lo
//   pide, después de que la app ya se puede usar. Solo se bajan las cartillas que usa este
//   aparato (las de los grupos de sus niños), nunca todas las de la plataforma.

/** @type {{ version: string, entrada: string, predeterminada: string, armazon: Record<string, string>, cartillas: Record<string, { version: string, archivos: Record<string, string>, instalar: string[] }> }} */
const CONFIG = __CONFIG__;

const PREFIJO = 'cartillas-';
const CACHE_ARMAZON = `${PREFIJO}armazon-${CONFIG.version}`;
const HUELLA = 'x-huella-cartillas';
/** Huella real cuando difiere de la esperada (index con algo inyectado, imagen recomprimida). */
const HUELLA_REAL = 'x-huella-real';
/** Un caché por cartilla; su nombre cambia solo si cambia algún archivo del paquete. */
const nombrePaquete = (dir) => `${PREFIJO}paquete-${dir.replace(/\W+/g, '_')}-${CONFIG.cartillas[dir].version}`;
const prefijoPaquete = (dir) => `${PREFIJO}paquete-${dir.replace(/\W+/g, '_')}-`;
// Se ignora Vary: el servidor puede responder "Vary: Origin" y el navegador pide los módulos
// con cabecera Origin; sin esto lo guardado no coincidiría y fallaría sin red.
const BUSQUEDA = { ignoreSearch: true, ignoreVary: true };

const alcance = new URL(self.registration.scope);
const url = (ruta) => new URL(ruta, alcance).href;
const URL_APP = url('./');

class SinEspacio extends Error {}

const esCuota = (error) => error && (error.name === 'QuotaExceededError' || error instanceof SinEspacio);

async function huellaDeBytes(bytes) {
  const resumen = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return [...resumen].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

/** Tipo de contenido que debe tener cada archivo según su extensión. */
function tipoEsperado(href) {
  const ruta = new URL(href).pathname;
  if (href === URL_APP || /\.html?$/.test(ruta)) return /^text\/html/;
  if (/\.webmanifest$/.test(ruta)) return /json/;
  if (/\.json$/.test(ruta)) return /^application\/(.+\+)?json/;
  if (/\.m?js$/.test(ruta)) return /javascript|ecmascript/;
  if (/\.css$/.test(ruta)) return /^text\/css/;
  if (/\.(woff2?|ttf|otf)$/.test(ruta)) return /^(font\/|application\/(font|x-font|octet-stream))/;
  if (/\.(webp|avif|png|jpe?g|gif|svg)$/.test(ruta)) return /^image\//;
  if (/\.(mp3|ogg|m4a|wav)$/.test(ruta)) return /^audio\//;
  if (/\.(mp4|webm)$/.test(ruta)) return /^video\//;
  if (/\.vtt$/.test(ruta)) return /^text\/vtt/;
  return null;
}

/**
 * Comprueba que una respuesta de red se pueda guardar: 200 exacto (no 206 de Range),
 * del mismo origen, con el tipo que corresponde y, si es JSON, que se pueda leer.
 */
async function sePuedeGuardar(respuesta, href) {
  if (!respuesta || respuesta.status !== 200 || respuesta.type !== 'basic') return false;
  const esperado = tipoEsperado(href);
  const tipo = (respuesta.headers.get('content-type') || '').toLowerCase();
  if (!esperado || !esperado.test(tipo)) return false;
  if (/json/.test(tipo)) {
    try {
      JSON.parse(await respuesta.clone().text());
    } catch {
      return false;
    }
  }
  return true;
}

/** Copia de una respuesta con la huella anotada en una cabecera propia. */
function conHuella(bytes, respuesta, huella, real = huella) {
  const cabeceras = new Headers(respuesta.headers);
  cabeceras.set(HUELLA, huella);
  if (real !== huella) cabeceras.set(HUELLA_REAL, real);
  return new Response(bytes, { status: 200, statusText: 'OK', headers: cabeceras });
}

async function guardar(cache, clave, respuesta) {
  try {
    await cache.put(clave, respuesta);
  } catch (error) {
    if (esCuota(error)) throw new SinEspacio();
    throw error;
  }
}

/**
 * Un filtro o CDN puede inyectar algo en el HTML: el index vale si es HTML y carga el JS de
 * entrada de esta versión, aunque su huella no coincida.
 */
const esIndexDeEstaVersion = (href, bytes) => href === URL_APP && new TextDecoder().decode(bytes).includes(CONFIG.entrada);

/** Baja un archivo de la lista y lo guarda solo si es el que se espera. */
async function bajarVerificado(cache, href, huella) {
  // Lo que lleva hash en el nombre puede salir de la caché HTTP; lo demás se revalida.
  const conHash = href.startsWith(url('assets/'));
  let medio = null;
  for (const modo of conHash ? ['default', 'reload'] : ['no-cache', 'reload']) {
    const respuesta = await fetch(href, { cache: modo, credentials: 'same-origin' });
    if (!(await sePuedeGuardar(respuesta, href))) continue;
    const bytes = await respuesta.arrayBuffer();
    const real = await huellaDeBytes(bytes);
    if (real === huella || esIndexDeEstaVersion(href, bytes)) {
      await guardar(cache, href, conHuella(bytes, respuesta, huella, real));
      return;
    }
    if (/^(image|audio|video)\//.test(respuesta.headers.get('content-type') || '')) medio = { bytes, respuesta, real };
  }
  // Un proxy que recomprime imágenes cambia los bytes: si dos veces llegó un medio válido
  // con otra huella, se guarda anotando las dos huellas para no pedirlo en cada visita.
  if (medio) {
    await guardar(cache, href, conHuella(medio.bytes, medio.respuesta, huella, medio.real));
    return;
  }
  throw new Error(`No se pudo bajar ${href}`);
}

/** El caché anterior más reciente con un prefijo dado (el último en crearse). */
async function cachesAnteriores(prefijo, actual) {
  const nombres = (await caches.keys()).filter((n) => n.startsWith(prefijo) && n !== actual);
  return Promise.all(nombres.reverse().map((n) => caches.open(n)));
}

/**
 * Llena un caché con una lista ruta → huella.
 * - Lo que ya está con la huella correcta se deja.
 * - Lo que está igual en un caché anterior se copia sin red.
 * - Lo demás se baja. Si `exigir` y el archivo estaba disponible sin red antes (con otra
 *   huella), no poder bajarlo hace fallar todo: no se pierde nada que antes funcionaba.
 * - Si `exigirTodo`, cualquier fallo hace fallar todo (armazón de la app).
 */
async function llenar(cache, lista, base, anteriores, { exigir = false, exigirTodo = false }) {
  const pendientes = Object.entries(lista);
  const SIMULTANEAS = 4;
  for (let i = 0; i < pendientes.length; i += SIMULTANEAS) {
    await Promise.all(
      pendientes.slice(i, i + SIMULTANEAS).map(async ([ruta, huella]) => {
        const href = url(base + ruta);
        const propia = await cache.match(href, BUSQUEDA);
        if (propia && propia.headers.get(HUELLA) === huella) return;
        let habiaCopia = false;
        for (const anterior of anteriores) {
          const vieja = await anterior.match(href, BUSQUEDA);
          if (!vieja) continue;
          habiaCopia = true;
          if (vieja.headers.get(HUELLA) === huella) {
            await guardar(cache, href, vieja);
            return;
          }
        }
        try {
          await bajarVerificado(cache, href, huella);
        } catch (error) {
          if (esCuota(error) || exigirTodo || (exigir && habiaCopia)) throw error;
          // Sin red a mitad de camino: se completa en la próxima visita.
        }
      }),
    );
  }
}

/** Sin esto la app no arranca; el manifiesto, los iconos y la fuente son opcionales. */
const imprescindible = (ruta) => ruta === './' || /\.(m?js|css)$/.test(ruta);

async function instalar() {
  const armazon = await caches.open(CACHE_ARMAZON);
  const anteriores = await cachesAnteriores(`${PREFIJO}armazon-`, CACHE_ARMAZON);
  const partes = Object.entries(CONFIG.armazon);
  await llenar(armazon, Object.fromEntries(partes.filter(([r]) => imprescindible(r))), '', anteriores, { exigirTodo: true });
  await llenar(armazon, Object.fromEntries(partes.filter(([r]) => !imprescindible(r))), '', anteriores, {}).catch(() => {});
  for (const dir of Object.keys(CONFIG.cartillas)) {
    const nombre = nombrePaquete(dir);
    const anteriores = await cachesAnteriores(prefijoPaquete(dir), nombre);
    const { archivos, instalar: primeros } = CONFIG.cartillas[dir];
    // Primera instalación: solo cartilla.json y la portada de la cartilla predeterminada; el
    // resto (y la cartilla del grupo, si es otra) se baja después, cuando la página lo pide.
    // Actualización: se copia lo que no cambió y se baja lo nuevo antes de activar, solo de
    // las cartillas que este aparato ya tenía.
    if (!anteriores.length) {
      if (dir !== CONFIG.predeterminada) continue;
      const lista = Object.fromEntries(primeros.filter((r) => archivos[r]).map((r) => [r, archivos[r]]));
      await llenar(await caches.open(nombre), lista, dir, [], {}).catch(() => {});
      continue;
    }
    await llenar(await caches.open(nombre), archivos, dir, anteriores, { exigir: true });
  }
}

/** Cartillas que este aparato ya tiene guardadas (de cualquier versión), más la predeterminada. */
async function carpetasEnUso() {
  const nombres = await caches.keys();
  return Object.keys(CONFIG.cartillas).filter((dir) => dir === CONFIG.predeterminada || nombres.some((n) => n.startsWith(prefijoPaquete(dir))));
}

/**
 * Baja en segundo plano el paquete completo de las cartillas que pide la página (las de los
 * niños de este aparato). Se detiene si el almacenamiento se llena.
 * @param {unknown} pedidas
 */
async function guardarPaquetes(pedidas) {
  const lista = Array.isArray(pedidas) ? pedidas.filter((d) => typeof d === 'string' && CONFIG.cartillas[d]) : await carpetasEnUso();
  for (const dir of lista) {
    const nombre = nombrePaquete(dir);
    await llenar(await caches.open(nombre), CONFIG.cartillas[dir].archivos, dir, await cachesAnteriores(prefijoPaquete(dir), nombre), {});
  }
}

/**
 * Borra los cachés de versiones anteriores, pero solo si no hay otra pestaña abierta que
 * pueda seguir usando la versión vieja. Si la hay, se intenta en la próxima visita.
 */
async function limpiarViejos() {
  const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  if (ventanas.length > 1) return;
  const vigentes = new Set([CACHE_ARMAZON, ...Object.keys(CONFIG.cartillas).map(nombrePaquete)]);
  const nombres = await caches.keys();
  await Promise.all(nombres.filter((n) => n.startsWith(PREFIJO) && !vigentes.has(n)).map((n) => caches.delete(n)));
}

self.addEventListener('install', (evento) => {
  evento.waitUntil(instalar());
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      await self.clients.claim();
      await limpiarViejos();
    })(),
  );
});

self.addEventListener('message', (evento) => {
  const datos = evento.data ?? {};
  if (datos.tipo === 'guardar-paquetes') {
    evento.waitUntil(
      (async () => {
        await limpiarViejos().catch(() => {});
        await guardarPaquetes(datos.carpetas).catch(() => {});
      })(),
    );
  } else if (datos.tipo === 'activar') {
    // La página lo pide al abrir, antes de que el niño toque nada.
    self.skipWaiting();
  }
});

/** Ruta relativa al alcance, sin codificar (los nombres pueden llevar tildes o ñ). */
function relativaDe(href) {
  const cruda = href.slice(alcance.href.length);
  try {
    return decodeURIComponent(cruda);
  } catch {
    return cruda;
  }
}

/** Carpeta de cartilla (p. ej. "cartillas/ingles-3/") a la que pertenece una URL. */
function carpetaDe(href) {
  const relativa = relativaDe(href);
  return Object.keys(CONFIG.cartillas).find((dir) => relativa.startsWith(dir)) ?? null;
}

/** Huella que CONFIG espera para una URL, o null si el archivo no está en la lista. */
function huellaEsperada(href) {
  if (href === URL_APP) return CONFIG.armazon['./'];
  const relativa = relativaDe(href);
  if (CONFIG.armazon[relativa]) return CONFIG.armazon[relativa];
  const dir = carpetaDe(href);
  return (dir && CONFIG.cartillas[dir].archivos[relativa.slice(dir.length)]) || null;
}

/** Busca primero en el caché indicado y después en cualquiera de esta app. */
async function buscar(nombreCache, clave) {
  const propia = await (await caches.open(nombreCache)).match(clave, BUSQUEDA);
  if (propia) return propia;
  for (const nombre of await caches.keys()) {
    if (!nombre.startsWith(PREFIJO)) continue;
    const otra = await (await caches.open(nombre)).match(clave, BUSQUEDA);
    if (otra) return otra;
  }
  return undefined;
}

/**
 * Caché primero; si no está, red. Lo que llega de la red se guarda (si es válido) sin
 * hacer esperar la respuesta, y un fallo al guardar (cuota llena) no la rompe.
 */
async function cachePrimero(evento, nombreCache, clave) {
  const guardada = await buscar(nombreCache, clave);
  if (guardada) return guardada;
  const respuesta = await fetch(evento.request);
  const copia = respuesta.clone();
  evento.waitUntil(
    (async () => {
      if (!(await sePuedeGuardar(copia, clave))) return;
      const bytes = await copia.arrayBuffer();
      const real = await huellaDeBytes(bytes);
      // Si el archivo está en la lista de esta versión, solo se guarda el que corresponde:
      // así un cartilla.json o una imagen de otra publicación nunca entra a este caché.
      const esperada = huellaEsperada(clave);
      if (esperada && real !== esperada && !esIndexDeEstaVersion(clave, bytes)) return;
      await (await caches.open(nombreCache)).put(clave, conHuella(bytes, copia, esperada ?? real, real));
    })().catch(() => {}),
  );
  return respuesta;
}

/** Red primero; si falla o no responde 200, la copia guardada si existe. */
async function redPrimero(evento) {
  try {
    const respuesta = await fetch(evento.request);
    if (respuesta.ok) return respuesta;
    return (await buscar(CACHE_ARMAZON, evento.request.url)) ?? respuesta;
  } catch (error) {
    const guardada = await buscar(CACHE_ARMAZON, evento.request.url);
    if (guardada) return guardada;
    throw error;
  }
}

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;
  if (peticion.method !== 'GET' || !peticion.url.startsWith(alcance.href)) return;
  const destino = new URL(peticion.url);
  const href = destino.origin + destino.pathname;

  // La app: siempre el index de esta versión, aunque la red esté colgada o redirija.
  // Toda navegación a una ruta de la app (/mapa, /docente/grupos/3B, /proyectar...) recibe el
  // mismo index: el enrutador de la página decide qué mostrar. Una navegación a un archivo
  // (con extensión, p. ej. un PDF del paquete) va a la red.
  const esRutaDeLaApp = peticion.mode === 'navigate' && !/\.[a-z0-9]+$/i.test(destino.pathname);
  if (href === URL_APP || href === url('index.html') || esRutaDeLaApp) {
    evento.respondWith(cachePrimero(evento, CACHE_ARMAZON, URL_APP));
    return;
  }
  if (peticion.mode === 'navigate') return;

  // Los videos van directo a la red (con peticiones Range); no se guardan.
  if (/\.(mp4|webm)$/.test(destino.pathname)) return;

  const carpeta = carpetaDe(href);
  if (carpeta) {
    // cartilla.json incluido: va atado a la versión; una cartilla nueva llega con el
    // service worker nuevo, que la baja al instalarse.
    evento.respondWith(cachePrimero(evento, nombrePaquete(carpeta), href));
    return;
  }

  if (href.startsWith(url('assets/'))) {
    // Con hash en el nombre: nunca cambian. Incluye las fuentes que no se precachean.
    evento.respondWith(cachePrimero(evento, CACHE_ARMAZON, href));
    return;
  }

  // Lo demás (manifiesto, iconos de la app): red con respaldo de lo guardado.
  evento.respondWith(redPrimero(evento));
});
