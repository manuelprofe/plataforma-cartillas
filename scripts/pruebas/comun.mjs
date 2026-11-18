// Ayudas para comprobar el modo estudiante en un navegador (Playwright global, sin dependencia
// en el proyecto). Uso: `npm run build`, luego `node scripts/pruebas/<prueba>.mjs`.
// Cada prueba levanta `vite preview`, abre la app a 390 px y guarda capturas en CAPTURAS.
import { createRequire } from 'node:module';
import { spawn, execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const raizGlobal = execSync('npm root -g').toString().trim();
export const { chromium } = require(`${raizGlobal}/playwright`);

export const CAPTURAS = process.env.CAPTURAS ?? '/tmp/capturas-cartillas';
mkdirSync(CAPTURAS, { recursive: true });
const PUERTO = 4319;
export const URL_APP = `http://localhost:${PUERTO}/`;
export const CLAVE = 'pc_progreso_v4';
export const CLAVE_V3 = 'pc_progreso_v3';

export async function servir() {
  const proceso = spawn('node_modules/.bin/vite', ['preview', '--port', String(PUERTO), '--strictPort'], { stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(URL_APP)).ok) return proceso;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  proceso.kill();
  throw new Error('vite preview no arrancó');
}

/** Abre la app con un progreso guardado (o ninguno). Devuelve la página y los errores de consola. */
export async function abrir(navegador, { progreso, clave = CLAVE, ancho = 390, alto = 844, sinVideos = false } = {}) {
  const contexto = await navegador.newContext({ viewport: { width: ancho, height: alto }, reducedMotion: 'reduce' });
  if (progreso !== undefined) await contexto.addInitScript(([k, v]) => { if (!sessionStorage.sembrado) { localStorage.setItem(k, v); sessionStorage.sembrado = '1'; } }, [clave, JSON.stringify(progreso)]);
  if (sinVideos) await contexto.route('**/*.mp4', (r) => r.abort());
  const pagina = await contexto.newPage();
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(String(e)));
  pagina.on('console', (m) => m.type() === 'error' && !/mp4|ERR_FAILED/.test(m.text()) && errores.push(m.text()));
  await pagina.goto(URL_APP);
  await pagina.waitForSelector('.jugar-invitado');
  return { pagina, errores };
}

export const foto = (pagina, nombre) => pagina.screenshot({ path: `${CAPTURAS}/${nombre}.png` });
export const guardado = (pagina) => pagina.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), CLAVE);

/** De la portada al mapa (con héroe ya elegido y la intro ya vista en el progreso sembrado). */
export async function alMapa(pagina) {
  await pagina.click('.jugar-invitado');
  await pagina.waitForSelector('.mundo', { timeout: 8000 });
  await pagina.waitForTimeout(900);
  await cerrarCharla(pagina);
}

/** Pasa un diálogo hasta que se cierre. */
export async function cerrarCharla(pagina) {
  for (let i = 0; i < 12; i++) {
    const boton = pagina.locator('.boton-continuar, .opcion-historia').first();
    if (!(await boton.count())) return;
    await boton.click();
    await pagina.waitForTimeout(250);
  }
}

/** Camina hasta una misión por su título, pasa lo que dice el guía y entra al juego. */
export async function entrarAMision(pagina, titulo) {
  await pagina.evaluate((t) => document.querySelector(`.nodo[aria-label="${t}"]`).click(), titulo);
  await pagina.waitForSelector('.dialogo', { timeout: 60000 });
  await cerrarCharla(pagina);
  await pagina.waitForSelector('.mision', { timeout: 8000 });
  await pagina.waitForTimeout(1000);
}

/** Tamaño mínimo (px) de los botones visibles que cumplen el selector. */
export async function menorToque(pagina, selector) {
  return pagina.evaluate((s) => Math.min(...[...document.querySelectorAll(s)].filter((b) => b.offsetParent).map((b) => { const r = b.getBoundingClientRect(); return Math.min(r.width, r.height); })), selector);
}

/** Progreso de quien ya eligió héroe y vio la introducción. */
export const BASE_JUGADO = { estrellas: 0, registro: [], vistas: ['cine-inicio', 'intro'], misiones: {}, album: [], ayudados: [], repasar: [], heroe: 'mika' };

/** Juega una misión de "escucha y toca" hasta el cierre, tocando opciones hasta acertar. */
export async function jugarEscuchaToca(pagina) {
  while (await pagina.locator('.mirar .boton-seguir').count()) {
    await pagina.click('.mirar .boton-seguir');
    await pagina.waitForTimeout(150);
  }
  for (let i = 0; i < 80 && !(await pagina.locator('.cierre').count()); i++) {
    const libre = pagina.locator('.opcion:not(.opcion--no):not(.opcion--bien)').first();
    if (await libre.count() && !(await pagina.locator('.opcion--bien').count())) await libre.click();
    await pagina.waitForTimeout(350);
  }
  await pagina.waitForSelector('.cierre .carita');
}

/** Progreso (formato nuevo) con estas misiones completas y sus estrellas de completar. */
export function conMisiones(ids, extra = {}) {
  const registro = ids.map((mision) => ({ conducta: 'completar', estrellas: 15, mision, origen: 'app' }));
  return { ...BASE_JUGADO, misiones: Object.fromEntries(ids.map((id) => [id, { veces: 1, mejorErrores: 0 }])), registro, estrellas: registro.length * 15, ...extra };
}
export const FAROLES = ['school', 'colors', 'numbers', 'body', 'family'].flatMap((t) => ['', '-2', '-3'].map((s) => `bosque-${t}${s}`)).concat(['bosque-time', 'bosque-time-2']);

// ---------------------------------------------------------------- Adultos con Supabase simulado

/** Llave de la sesión de adulto en el aparato (src/adultos/cuenta.ts). */
export const LLAVE_ADULTO = 'pc_adulto_v1';

/** Sesión guardada de un adulto con este rol. El token falso lleva el rol para el simulador. */
export const sesionAdulto = (rol, extra = {}) => ({ access: `falso-${rol}`, refresh: `r-${rol}`, vence: Date.now() + 3600e3, correo: `${rol}@prueba.co`, perfil: { rol, nombre: `Prueba ${rol}`, colegio_id: null }, ...extra });

/**
 * Responde en lugar de Supabase (nunca sale a la red): perfiles según el token, logout y 404 para
 * lo demás. `extra(ruta, peticion)` puede responder antes ({ status, json } o { abortar: true }).
 */
export async function simularSupabase(contexto, extra = () => null) {
  const pedidos = [];
  await contexto.route(/\/(auth|rest)\/v1\//, async (ruta) => {
    const q = ruta.request();
    const url = new URL(q.url());
    pedidos.push({ metodo: q.method(), ruta: url.pathname + url.search, cuerpo: q.postData(), auth: q.headers().authorization });
    const propio = await extra(url, q);
    const r = propio ?? (() => {
      const rol = /falso-(\w+)/.exec(q.headers().authorization ?? '')?.[1];
      if (url.pathname === '/rest/v1/rpc/mi_perfil' && rol) return { json: { rol, nombre: `Prueba ${rol}`, colegio_id: null, activo: true } };
      // Trampa: la tabla perfiles devuelve varias filas (como al coordinador) y la primera es de otro
      // rol. La app no debe usarla para saber quién entró.
      if (url.pathname === '/rest/v1/perfiles') return { json: [{ rol: 'dueno', nombre: 'Otro', colegio_id: null, activo: true }, { rol: rol ?? 'docente', nombre: 'Yo', colegio_id: null, activo: true }] };
      if (url.pathname === '/auth/v1/logout') return { status: 204 };
      // Pantallas de colegios, grupos e invitaciones: tablas y cifras vacías.
      if (['/rest/v1/rpc/cifras_grupos', '/rest/v1/rpc/lista_invitaciones'].includes(url.pathname) || (q.method() === 'GET' && url.pathname.startsWith('/rest/v1/') && !url.pathname.includes('/rpc/'))) return { json: [] };
      return { status: 404, json: { message: 'sin simular' } };
    })();
    if (r.abortar) return ruta.abort('internetdisconnected');
    await ruta.fulfill({ status: r.status ?? 200, contentType: 'application/json', body: r.json === undefined ? '' : JSON.stringify(r.json) });
  });
  return pedidos;
}

/**
 * Para pruebas de rutas: con sesión simulada del rol de la sección que se abre (docente,
 * coordinador o dueño); en /adultos, sin sesión, para ver el formulario.
 */
export async function adultoPorRuta(contexto) {
  await contexto.addInitScript(([llave]) => {
    const tramo = location.pathname.split('/')[1];
    const rol = { docente: 'docente', colegio: 'coordinador', plataforma: 'dueno' }[tramo];
    if (tramo === 'adultos') localStorage.removeItem(llave);
    else if (rol) localStorage.setItem(llave, JSON.stringify({ access: `falso-${rol}`, refresh: 'r', vence: Date.now() + 3600e3, correo: `${rol}@prueba.co`, perfil: { rol, nombre: `Prueba ${rol}`, colegio_id: null } }));
  }, [LLAVE_ADULTO]);
  await simularSupabase(contexto);
}
