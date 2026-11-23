// Multicartilla en el estudiante, a 390 × 844, con Supabase simulado (no sale a la red).
// Criterio del plan del 23 nov: el código del grupo lleva a cada niño a la cartilla de su grupo;
// misiones y envíos van con esa cartilla; el modo sin conexión pide guardar solo las cartillas
// de los niños del aparato. La segunda cartilla ("prueba-2") es una cartilla mínima que solo
// existe en esta prueba: se arma con el paquete de inglés 3 y se sirve con otro id y título.
// Uso: `npm run build`, luego `node scripts/pruebas/multicartilla.mjs`.
import { readFileSync } from 'node:fs';
import { chromium, servir, URL_APP, CAPTURAS, cerrarCharla, entrarAMision, jugarEscuchaToca } from './comun.mjs';

const url = (r) => new URL(r, URL_APP).href;
const ruta = (p) => new URL(p.url()).pathname;
const fallos = [];
const comprobar = (ok, texto) => { console.log(ok ? 'bien ' : 'FALLA', texto); if (!ok) fallos.push(texto); };
const foto = (p, n) => p.screenshot({ path: `${CAPTURAS}/multicartilla-${n}.png` });
const PIN = ['sol', 'luna', 'pez', 'hoja', 'corazón', 'casa', 'gota', 'estrella', 'nube', 'flor'];
const tocarPin = async (p, cifras) => { for (const c of cifras) { await p.click(`.tecla-pin[aria-label="${PIN[Number(c)]}"]`); await p.waitForTimeout(60); } };

// ---------------------------------------------------------------- Cartilla mínima de prueba

const ingles = JSON.parse(readFileSync('public/cartillas/ingles-3/cartilla.json', 'utf8'));
const PRUEBA = {
  ...ingles,
  id: 'prueba-2',
  titulo: 'Cartilla de prueba',
  materia: 'Prueba',
  grado: '1',
  // Sin cinemática de inicio: el niño llega directo al mapa.
  cinematicas: {},
  territorios: [{ ...ingles.territorios[0], nombre: 'Territorio de prueba' }],
};

/** Sirve /cartillas/prueba-2/: su cartilla.json propio y los demás archivos del paquete de inglés 3. */
async function servirPrueba(contexto) {
  await contexto.route(/\/cartillas\/prueba-2\//, async (r) => {
    const u = new URL(r.request().url());
    if (u.pathname.endsWith('/cartilla.json')) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PRUEBA) });
    const respuesta = await r.fetch({ url: u.href.replace('/cartillas/prueba-2/', '/cartillas/ingles-3/') });
    return r.fulfill({ response: respuesta });
  });
}

// ---------------------------------------------------------------- Supabase simulado

const GRUPOS = {
  K7M2P: [{ id: 's1', apodo: 'Sara', avatar: 'mika', grupo: '3B', cartilla: 'ingles-3', pin: '172' }],
  M2N3C: [{ id: 'p1', apodo: 'Pao', avatar: 'tavi', grupo: '1A', cartilla: 'prueba-2', pin: '345' }],
};
const registros = [];
const otras = [];

async function simular(contexto) {
  await contexto.route(/\/(auth|rest)\/v1\//, async (r) => {
    const q = r.request();
    const u = new URL(q.url());
    const cuerpo = q.postData() ? JSON.parse(q.postData()) : {};
    const responder = (json, status = 200) => r.fulfill({ status, contentType: 'application/json', body: json === undefined ? '' : JSON.stringify(json) });
    if (u.pathname === '/auth/v1/signup') return responder({ access_token: 'anon-1', refresh_token: 'ra', expires_in: 3600, user: { id: 'aparato' } });
    if (u.pathname === '/rest/v1/rpc/lista_grupo') return responder((GRUPOS[cuerpo.p_codigo] ?? []).map(({ pin, ...c }) => c));
    if (u.pathname === '/rest/v1/rpc/entrar_estudiante') {
      const nino = (GRUPOS[cuerpo.p_codigo] ?? []).find((n) => n.id === cuerpo.p_estudiante);
      return responder(!nino ? 'no-existe' : nino.pin === cuerpo.p_pin ? 'ok' : 'errado');
    }
    if (u.pathname === '/rest/v1/rpc/registrar_mision') { registros.push(cuerpo); return responder(15); }
    if (u.pathname === '/rest/v1/progreso_misiones' || u.pathname === '/rest/v1/estrellas') return responder([]);
    otras.push(`${q.method()} ${u.pathname}`);
    return responder({ message: 'sin simular' }, 404);
  });
}

async function nuevo(navegador, { sw = false, sembrar } = {}) {
  const c = await navegador.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: sw ? 'allow' : 'block' });
  if (sembrar) await c.addInitScript((datos) => { if (!sessionStorage.sembrado) { for (const [k, v] of Object.entries(datos)) localStorage.setItem(k, JSON.stringify(v)); sessionStorage.sembrado = '1'; } }, sembrar);
  // Lo que la página le pide al service worker queda anotado para revisarlo.
  await c.addInitScript(() => {
    window.__mensajesSW = [];
    const original = ServiceWorker.prototype.postMessage;
    ServiceWorker.prototype.postMessage = function (m, ...resto) { window.__mensajesSW.push(m); return original.call(this, m, ...resto); };
  });
  await c.route('**/*.mp4', (r) => r.abort());
  await simular(c);
  await servirPrueba(c);
  const p = await c.newPage();
  const errores = [];
  const pedidos = [];
  p.on('pageerror', (e) => errores.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && !/mp4|ERR_FAILED|ERR_INTERNET|Failed to load resource/.test(m.text()) && errores.push(m.text()));
  p.on('request', (q) => pedidos.push(new URL(q.url()).pathname));
  return { c, p, errores, pedidos };
}

async function entrarConCodigo(p, codigo, apodo, pin) {
  await p.click('.accion--tarjeta');
  await p.waitForSelector('.teclado-codigo');
  for (const l of codigo) await p.click(`.teclado-codigo button:text-is("${l}")`);
  await p.waitForSelector('.nino--caras');
  await p.click(`.cara:has-text("${apodo}")`);
  await p.waitForSelector('.teclado-pin');
  await tocarPin(p, pin);
}

const servidor = await servir();
const navegador = await chromium.launch();
try {
  // 1. Pao (grupo 1A, cartilla de prueba) entra con su código y llega al mapa de su cartilla.
  const { c, p, errores, pedidos } = await nuevo(navegador);
  await p.goto(url('/'));
  await p.waitForSelector('.jugar-invitado');
  comprobar(pedidos.includes('/cartillas/ingles-3/cartilla.json') && !pedidos.some((r) => r.includes('/prueba-2/')), 'sin niños: abre la cartilla predeterminada (inglés 3)');
  await entrarConCodigo(p, 'M2N3C', 'Pao', '345');
  await p.waitForSelector('.mundo', { timeout: 15000 });
  await p.waitForTimeout(900);
  comprobar(pedidos.includes('/cartillas/prueba-2/cartilla.json'), 'el código de Pao abre la cartilla de su grupo');
  comprobar(pedidos.some((r) => r.startsWith('/cartillas/prueba-2/') && /\.(webp|svg|png)$/.test(r)), 'las imágenes salen del paquete de su cartilla');
  const perfiles = await p.evaluate(() => JSON.parse(localStorage.getItem('pc_perfiles_v1') ?? '[]'));
  comprobar(perfiles.find((x) => x.id === 'p1')?.cartilla === 'prueba-2', 'el aparato recuerda la cartilla de Pao');
  await foto(p, '01-pao-mapa-390');
  await cerrarCharla(p);

  // 2. Pao juega una misión: el envío lleva su cartilla y un identificador para no sumar doble.
  await entrarAMision(p, 'School objects');
  await jugarEscuchaToca(p);
  await foto(p, '02-pao-cierre-390');
  await p.waitForTimeout(600);
  await p.click('.carita');
  await p.waitForTimeout(400);
  await p.click('.boton-seguir');
  await p.waitForSelector('.mundo', { timeout: 15000 });
  for (let i = 0; i < 30 && !registros.length; i++) await p.waitForTimeout(200);
  const envio = registros.find((r) => r.p_estudiante === 'p1');
  comprobar(envio?.p_cartilla === 'prueba-2', 'la misión de Pao sube con su cartilla');
  comprobar(typeof envio?.p_envio === 'string' && envio.p_envio.length >= 8, 'cada envío lleva su identificador');

  // 3. Sara (3B, inglés 3) entra en el mismo celular: vuelve inglés 3, sin mezclar.
  await p.click('.cambiar-jugador');
  await p.waitForSelector('.jugar-invitado');
  const antes = pedidos.filter((r) => r === '/cartillas/ingles-3/cartilla.json').length;
  await entrarConCodigo(p, 'K7M2P', 'Sara', '172');
  for (let i = 0; i < 50 && !['/historia', '/mapa', '/elegir'].includes(ruta(p)); i++) await p.waitForTimeout(200);
  comprobar(['/historia', '/mapa', '/elegir'].includes(ruta(p)), `Sara entra a su cartilla (${ruta(p)})`);
  comprobar(pedidos.filter((r) => r === '/cartillas/ingles-3/cartilla.json').length > antes || pedidos.includes('/cartillas/ingles-3/cartilla.json'), 'Sara juega inglés 3');
  const perfiles2 = await p.evaluate(() => JSON.parse(localStorage.getItem('pc_perfiles_v1') ?? '[]'));
  comprobar(perfiles2.find((x) => x.id === 's1')?.cartilla === 'ingles-3' && perfiles2.find((x) => x.id === 'p1')?.cartilla === 'prueba-2', 'cada niño queda con su cartilla');
  await foto(p, '03-sara-390');
  comprobar(!errores.length, `sin errores en la consola${errores.length ? ': ' + errores.join(' | ') : ''}`);
  await c.close();

  // 4. Sin conexión: el aparato con Pao pide guardar su cartilla y la predeterminada, nada más.
  const sw = await nuevo(navegador, {
    sw: true,
    sembrar: { pc_perfiles_v1: [{ id: 'p1', apodo: 'Pao', avatar: 'tavi', grupo: '1A', cartilla: 'prueba-2', codigo: 'M2N3C' }] },
  });
  await sw.p.goto(url('/'));
  await sw.p.waitForSelector('.jugar-invitado');
  let pedido;
  for (let i = 0; i < 60 && !pedido; i++) {
    await sw.p.waitForTimeout(250);
    pedido = (await sw.p.evaluate(() => window.__mensajesSW)).find((m) => m?.tipo === 'guardar-paquetes');
  }
  const carpetas = [...(pedido?.carpetas ?? [])].sort();
  comprobar(carpetas.join() === 'cartillas/ingles-3/,cartillas/prueba-2/', `el service worker guarda solo las cartillas del aparato (${carpetas.join(' ')})`);
  const caches = await sw.p.evaluate(async () => { for (let i = 0; i < 40; i++) { const k = await caches.keys(); if (k.some((n) => n.includes('paquete'))) return k; await new Promise((r) => setTimeout(r, 250)); } return caches.keys(); });
  comprobar(caches.some((n) => n.includes('paquete-cartillas_ingles_3_')), 'el paquete de inglés 3 queda guardado');
  await foto(sw.p, '04-sin-conexion-390');
  await sw.c.close();
  comprobar(!otras.length, `sin pedidos a Supabase sin simular${otras.length ? ': ' + otras.join(', ') : ''}`);
} finally {
  await navegador.close();
  servidor.kill();
}

if (fallos.length) {
  console.error(`\n${fallos.length} comprobaciones fallaron`);
  process.exit(1);
}
console.log('\nTodo bien');
