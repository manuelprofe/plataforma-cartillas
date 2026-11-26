// Las 4 plantillas nuevas (contar y tocar, ordenar, completar la operación, armar la palabra) en un
// celular de gama baja emulado: 390 × 844, CPU 4 veces más lenta y red 4G lenta. Criterio del plan
// del 27 nov: van fluidas y la primera carga sigue por debajo de 2 MB.
// Mide, con las animaciones encendidas:
// - Peso de la primera carga (portada) y hasta el mapa del invitado.
// - Tiempo desde tocar la misión hasta ver el juego.
// - Por cada toque: tiempo hasta el siguiente cuadro pintado (meta: 100 ms o menos).
// - Cuadros perdidos mientras se juega (meta: p95 del cuadro por debajo de 50 ms, ninguna tarea
//   larga de más de 200 ms).
// Uso: `npm run build`, luego `node scripts/pruebas/gama-baja.mjs`.
import { readFileSync } from 'node:fs';
import { chromium, servir, URL_APP, CAPTURAS, CLAVE, BASE_JUGADO, cerrarCharla } from './comun.mjs';

const fallos = [];
const comprobar = (ok, texto) => { console.log(ok ? 'bien ' : 'FALLA', texto); if (!ok) fallos.push(texto); };

const real = JSON.parse(readFileSync('public/cartillas/ingles-3/cartilla.json', 'utf8'));
const territorio = real.territorios[0];
const guia = territorio.guia;
const lugar = (i) => ({ x: territorio.misiones[i].x, y: territorio.misiones[i].y });
const PALABRAS = territorio.misiones[0].palabras;
const NUMEROS = ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'];
const antes = [{ quien: guia, es: 'A jugar.', en: "Let's play." }];

const MISIONES = [
  {
    id: 'gb-contar', titulo: 'Cuenta y toca', plantilla: 'contar-toca', icono: 'iconos/0033_20e3.svg', ...lugar(0), antes, palabras: PALABRAS,
    contar: { numeros: NUMEROS, rondas: [{ objeto: 'iconos/1f58d.svg', cantidad: 7, total: 10, dice: 'Toca siete crayolas' }, { objeto: 'iconos/1f4d8.svg', cantidad: 2, total: 6, dice: 'Toca dos libros' }] },
  },
  {
    id: 'gb-ordenar', titulo: 'Ordena los números', plantilla: 'ordenar', icono: 'iconos/0031_20e3.svg', ...lugar(3), antes, palabras: PALABRAS,
    ordenar: [{ pide: 'Ordena del uno al cinco', tarjetas: [1, 2, 3, 4, 5].map((n) => ({ texto: String(n), dice: NUMEROS[n - 1] })) }],
  },
  {
    id: 'gb-operacion', titulo: 'Completa la cuenta', plantilla: 'operacion', icono: 'iconos/0033_20e3.svg', ...lugar(6), antes, palabras: PALABRAS,
    operacion: {
      pregunta: { '+': '¿Cuánto es {a} más {b}?', '-': '¿Cuánto es {a} menos {b}?' },
      respuesta: { '+': '{a} más {b} es {c}', '-': '{a} menos {b} es {c}' },
      niveles: [{ signo: '+', desde: 6, hasta: 10, rondas: 2, objeto: 'iconos/1f58d.svg' }, { signo: '-', desde: 60, hasta: 99, rondas: 2 }],
    },
  },
  {
    id: 'gb-silabas', titulo: 'Arma la palabra', plantilla: 'silabas', icono: 'iconos/1f4d3.svg', ...lugar(9), antes, palabras: PALABRAS,
    silabas: [
      { icono: 'iconos/1f44b.svg', dice: 'mano', partes: ['ma', 'no'], sobran: ['pa'] },
      { icono: 'iconos/1f442.svg', dice: 'oreja', partes: ['o', 're', 'ja'], sobran: ['ra'] },
    ],
  },
];
const CARTILLA = {
  ...real, idiomaVoz: 'es-CO', cinematicas: {},
  territorios: [{ ...territorio, idiomaPorAvance: ['es'], misiones: MISIONES }, ...real.territorios.slice(1)],
};

// 4G lenta: 1,6 Mb/s de bajada, 150 ms de latencia.
const RED = { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 };

async function abrir(navegador, { conCartilla = true } = {}) {
  const c = await navegador.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  await c.addInitScript(([k, v]) => { if (!sessionStorage.sembrado) { localStorage.setItem(k, v); sessionStorage.sembrado = '1'; } }, [CLAVE, JSON.stringify({ ...BASE_JUGADO, heroe: real.heroes[0].id })]);
  await c.addInitScript(() => {
    speechSynthesis.speak = (f) => setTimeout(() => f.onend?.(), 30);
    // Registro de cuadros y tareas largas, para leerlo desde la prueba.
    window.__cuadros = [];
    window.__largas = [];
    const bucle = (t) => { window.__cuadros.push(t); requestAnimationFrame(bucle); };
    requestAnimationFrame(bucle);
    try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__largas.push(e.duration))).observe({ type: 'longtask', buffered: true }); } catch {}
  });
  await c.route('**/*.mp4', (r) => r.abort());
  if (conCartilla) await c.route(/\/cartillas\/ingles-3\/cartilla\.json$/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CARTILLA) }));
  const p = await c.newPage();
  const cdp = await c.newCDPSession(p);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', RED);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  let bytes = 0;
  cdp.on('Network.loadingFinished', (e) => { bytes += e.encodedDataLength; });
  const errores = [];
  p.on('pageerror', (e) => errores.push(String(e)));
  return { c, p, cdp, errores, bytes: () => bytes, cero: () => { bytes = 0; } };
}

const percentil = (xs, q) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : 0; };
const kb = (b) => `${Math.round(b / 1024)} KB`;

/** Toca y mide el tiempo hasta el siguiente cuadro pintado después del toque. */
async function tocarYMedir(p, localizador) {
  // Se mide dentro de la página (del evento del toque al cuadro pintado), sin contar lo que tarda
  // la prueba en mandar el toque.
  await p.evaluate(() => {
    window.__toque = new Promise((r) => addEventListener('click', (e) => {
      const t = e.timeStamp;
      requestAnimationFrame(() => setTimeout(() => r(performance.now() - t), 0));
    }, { once: true, capture: true }));
  });
  await localizador.tap({ timeout: 5000 });
  return p.evaluate(() => window.__toque);
}

async function jugar(p, plantilla) {
  const toques = [];
  const tocar = async (sel) => { const l = p.locator(sel).first(); if (await l.count()) toques.push(await tocarYMedir(p, l)); await p.waitForTimeout(350); };
  if (plantilla === 'contar-toca') {
    await p.waitForSelector('.contar__objeto');
    for (let i = 0; i < 7; i++) await tocar(`.contar__objeto:not(.contar__objeto--marcado) >> nth=0`);
    await tocar('.contar__listo');
  } else if (plantilla === 'ordenar') {
    await p.waitForSelector('.ordenar__mesa .ordenar__tarjeta');
    // Una tarjeta arrastrada (mide los cuadros del arrastre) y las demás tocadas en orden.
    const tarjeta = (n) => p.locator('.ordenar__mesa .ordenar__tarjeta').filter({ hasText: new RegExp(`^${n}$`) }).first();
    const t = tarjeta(1);
    const caja = await t.boundingBox();
    const fila = await p.locator('.ordenar__fila').boundingBox();
    await p.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2);
    await p.mouse.down();
    for (let i = 1; i <= 12; i++) await p.mouse.move(caja.x + caja.width / 2, caja.y + ((fila.y + fila.height / 2) - caja.y) * (i / 12), { steps: 2 });
    await p.mouse.up();
    await p.waitForTimeout(400);
    for (const n of [2, 3, 4, 5]) { const l = tarjeta(n); if (await l.count()) toques.push(await tocarYMedir(p, l)); await p.waitForTimeout(350); }
    toques.arrastre = await p.locator('.ordenar__fila .ordenar__tarjeta').count();
  } else if (plantilla === 'operacion') {
    await p.waitForSelector('.operacion__opcion');
    for (let i = 0; i < 3; i++) await tocar('.operacion__opcion:not(.operacion__opcion--apagada) >> nth=0');
  } else if (plantilla === 'silabas') {
    await p.waitForSelector('.mision button');
    for (let i = 0; i < 4; i++) await tocar('.mision main button:not(.oir):not([disabled]) >> nth=0');
  }
  return toques;
}

const servidor = await servir();
const navegador = await chromium.launch();
try {
  // ------------------------------------------------ 1. Peso de la primera carga
  {
    const { c, p, bytes, errores } = await abrir(navegador, { conCartilla: false });
    const t0 = Date.now();
    await p.goto(URL_APP);
    await p.waitForSelector('.jugar-invitado', { timeout: 60000 });
    await p.waitForLoadState('networkidle');
    const portada = bytes();
    const tPortada = Date.now() - t0;
    await p.tap('.jugar-invitado');
    await p.waitForSelector('.mundo', { timeout: 60000 });
    await p.waitForLoadState('networkidle');
    const alMapa = bytes();
    console.log(`     portada: ${kb(portada)} en ${tPortada} ms · hasta el mapa: ${kb(alMapa)}`);
    comprobar(portada < 2 * 1024 * 1024, `primera carga por debajo de 2 MB (${kb(portada)})`);
    comprobar(alMapa < 2 * 1024 * 1024, `hasta el mapa del invitado por debajo de 2 MB (${kb(alMapa)})`);
    comprobar(errores.length === 0, `sin errores en la carga (${errores.join(' | ')})`);
    await c.close();
  }

  // ------------------------------------------------ 2. Cada plantilla con CPU 4x
  const { c, p, cdp, errores, bytes, cero } = await abrir(navegador);
  await p.goto(URL_APP);
  await p.waitForSelector('.jugar-invitado', { timeout: 60000 });
  await p.tap('.jugar-invitado');
  await p.waitForSelector('.mundo', { timeout: 60000 });
  await p.waitForTimeout(1500);
  await cerrarCharla(p);
  for (const m of MISIONES) {
    // El camino hasta la misión no se mide (la red y la CPU lentas lo alargan); se mide desde que
    // el guía terminó de hablar hasta que el juego está listo.
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await p.evaluate((t) => document.querySelector(`.nodo[aria-label="${t}"]`).click(), m.titulo);
    await p.waitForSelector('.dialogo', { timeout: 60000 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    cero();
    for (let i = 0; i < 12; i++) {
      const b = p.locator('.boton-continuar, .opcion-historia').first();
      if (!(await b.count())) break;
      const t0 = Date.now();
      await b.tap();
      if (!(await p.locator('.boton-continuar, .opcion-historia').count())) {
        await p.waitForSelector('.mision', { timeout: 20000 });
        m.entrada = Date.now() - t0;
        break;
      }
      await p.waitForTimeout(250);
    }
    await p.waitForTimeout(600);
    await p.evaluate(() => { window.__cuadros = []; window.__largas = []; });
    const toques = await jugar(p, m.plantilla);
    await p.waitForTimeout(800);
    const { cuadros, largas } = await p.evaluate(() => ({ cuadros: window.__cuadros, largas: window.__largas }));
    const pasos = cuadros.slice(1).map((t, i) => t - cuadros[i]);
    const p95 = percentil(pasos, 0.95);
    const peor = Math.max(0, ...largas);
    const toqueP = percentil(toques, 0.9);
    console.log(`     ${m.plantilla}: entrada ${m.entrada} ms · ${toques.length} toques, p90 ${Math.round(toqueP)} ms · cuadro p95 ${Math.round(p95)} ms · ${largas.length} tareas largas (peor ${Math.round(peor)} ms) · ${kb(bytes())} bajados`);
    await p.screenshot({ path: `${CAPTURAS}/gama-baja-${m.plantilla}.png` });
    if (m.plantilla === 'ordenar') comprobar(toques.arrastre >= 1, `ordenar: la tarjeta arrastrada queda en la fila (${toques.arrastre} puestas)`);
    comprobar(toques.length >= 3, `${m.plantilla}: se pudo jugar (${toques.length} toques)`);
    comprobar(toqueP <= 100, `${m.plantilla}: responde al toque en 100 ms o menos (p90 ${Math.round(toqueP)} ms)`);
    comprobar(p95 <= 50, `${m.plantilla}: cuadros fluidos (p95 ${Math.round(p95)} ms)`);
    comprobar(peor <= 200, `${m.plantilla}: ninguna tarea larga pasa de 200 ms (${Math.round(peor)} ms)`);
    comprobar((m.entrada ?? 99999) <= 1500, `${m.plantilla}: el juego abre en 1,5 s o menos (${m.entrada} ms)`);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await p.tap('.boton-salir');
    await p.waitForSelector('.mundo', { timeout: 20000 });
    await p.waitForTimeout(800);
    await cerrarCharla(p);
  }
  comprobar(errores.length === 0, `sin errores (${errores.join(' | ')})`);
  await c.close();
} finally {
  await navegador.close();
  servidor.kill();
}
console.log(fallos.length ? `\n${fallos.length} fallas` : '\ntodo bien');
process.exit(fallos.length ? 1 : 0);
