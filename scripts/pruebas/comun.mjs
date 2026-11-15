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
  await pagina.waitForSelector('.boton-jugar');
  return { pagina, errores };
}

export const foto = (pagina, nombre) => pagina.screenshot({ path: `${CAPTURAS}/${nombre}.png` });
export const guardado = (pagina) => pagina.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), CLAVE);

/** De la portada al mapa (con héroe ya elegido y la intro ya vista en el progreso sembrado). */
export async function alMapa(pagina) {
  await pagina.click('.boton-jugar');
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
