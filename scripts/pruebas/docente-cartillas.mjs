// Docente con grupos de cartillas distintas, a 390 × 844 y con Supabase simulado (no sale a la red).
// Criterio del plan del 24 nov: un docente con dos grupos de cartillas distintas ve los materiales
// correctos de cada uno en Planear, Biblioteca y Proyectar; con una sola cartilla no ve el selector.
// La segunda cartilla ("prueba-2") solo existe en esta prueba: es el paquete de inglés 3 servido con
// otro id y otros nombres de tema. Uso: `npm run build`, luego `node scripts/pruebas/docente-cartillas.mjs`.
import { readFileSync } from 'node:fs';
import { chromium, servir, URL_APP, CAPTURAS, LLAVE_ADULTO, sesionAdulto, simularSupabase } from './comun.mjs';

const fallos = [];
const comprobar = (ok, texto) => { console.log(ok ? 'bien ' : 'FALLA', texto); if (!ok) fallos.push(texto); };
const url = (r) => new URL(r, URL_APP).href;
const foto = (p, n) => p.screenshot({ path: `${CAPTURAS}/docente-cartillas-${n}.png`, fullPage: true });

const indice = JSON.parse(readFileSync('public/cartillas/ingles-3/materiales/indice.json', 'utf8'));
const INDICE_PRUEBA = { ...indice, cartilla: 'prueba-2', temas: indice.temas.map((t, i) => ({ ...t, nombre: `Tema de prueba ${i + 1}` })) };

const GRUPOS = {
  g1: { id: 'g1', nombre: '3B', grado: '3°', colegio_id: 'c1', cartilla_id: 'ingles-3', codigo: 'K7M2P' },
  g2: { id: 'g2', nombre: '1A', grado: '1°', colegio_id: 'c1', cartilla_id: 'prueba-2', codigo: 'M2N3C' },
};
const CARTILLAS = [
  { id: 'ingles-3', titulo: 'English Adventure Quest', materia: 'Inglés', grado: '3' },
  { id: 'prueba-2', titulo: 'Cartilla de prueba', materia: 'Matemáticas', grado: '1' },
];

async function docente(navegador, ids) {
  const c = await navegador.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block', locale: 'es-CO' });
  await c.addInitScript(([k, v]) => { if (!sessionStorage.sembrado) { localStorage.setItem(k, v); sessionStorage.sembrado = '1'; } }, [LLAVE_ADULTO, JSON.stringify(sesionAdulto('docente', { perfil: { rol: 'docente', nombre: 'Profe Prueba', colegio_id: 'c1' } }))]);
  await c.route(/\/cartillas\/prueba-2\//, async (r) => {
    const u = new URL(r.request().url());
    if (u.pathname.endsWith('/materiales/indice.json')) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(INDICE_PRUEBA) });
    return r.fulfill({ response: await r.fetch({ url: u.href.replace('/cartillas/prueba-2/', '/cartillas/ingles-3/') }) });
  });
  await simularSupabase(c, (u, q) => {
    if (u.pathname === '/rest/v1/grupos' && q.method() === 'GET') return { json: ids.map((id) => { const { codigo, ...g } = GRUPOS[id]; return g; }) };
    if (u.pathname === '/rest/v1/rpc/mis_codigos') return { json: ids.map((id) => ({ grupo_id: id, codigo: GRUPOS[id].codigo })) };
    if (u.pathname === '/rest/v1/cartillas') return { json: CARTILLAS };
    if (u.pathname === '/rest/v1/estudiantes') return { json: [] };
    return null;
  });
  const p = await c.newPage();
  const errores = [];
  const pedidos = [];
  p.on('pageerror', (e) => errores.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|ERR_FAILED/.test(m.text()) && errores.push(m.text()));
  p.on('request', (q) => pedidos.push(new URL(q.url()).pathname));
  return { c, p, errores, pedidos };
}

const servidor = await servir();
const navegador = await chromium.launch();
try {
  // 1. Dos grupos, dos cartillas: Planear muestra el selector y empieza con la del primer grupo.
  const { c, p, errores, pedidos } = await docente(navegador, ['g1', 'g2']);
  await p.goto(url('/docente/planear'));
  await p.waitForSelector('.elegir-cartilla');
  await p.waitForSelector('text=Útiles escolares');
  const botones = await p.locator('.elegir-cartilla .fila').allTextContents();
  comprobar(botones.length === 2 && botones[0].includes('Inglés') && botones[1].includes('Matemáticas'), `Planear ofrece las dos cartillas (${botones.join(' | ')})`);
  comprobar((await p.locator('.elegir-cartilla .fila:has(.elegir-cartilla__actual)').textContent()).includes('Inglés'), 'empieza con la cartilla del primer grupo');
  const alto = await p.evaluate(() => Math.min(...[...document.querySelectorAll('.elegir-cartilla button.fila')].map((b) => b.getBoundingClientRect().height)));
  comprobar(alto >= 48, `la otra cartilla se toca con 48 px o más (${Math.round(alto)})`);
  const ancho = await p.evaluate(() => document.documentElement.scrollWidth);
  comprobar(ancho <= 390, `sin desplazamiento lateral a 390 px (${ancho})`);
  await foto(p, '01-planear-ingles-390');

  // 2. Cambia a la otra cartilla: los temas son los suyos.
  await p.click('.elegir-cartilla button.fila:has-text("Matemáticas")');
  await p.waitForSelector('text=Tema de prueba 1');
  comprobar(pedidos.includes('/cartillas/prueba-2/materiales/indice.json'), 'Planear pide el índice de la otra cartilla');
  comprobar((await p.locator('text=Útiles escolares').count()) === 0, 'no quedan temas de la cartilla anterior');
  await foto(p, '02-planear-prueba-390');

  // 3. Un material de esa cartilla sale de su paquete.
  await p.goto(url('/docente/temas/escuela/escuela-laminas'));
  await p.waitForSelector('img', { timeout: 10000 });
  await p.waitForTimeout(500);
  comprobar(pedidos.some((r) => r.startsWith('/cartillas/prueba-2/materiales/escuela')), 'el material se lee del paquete de la cartilla elegida');
  comprobar(!pedidos.some((r) => r.startsWith('/cartillas/ingles-3/materiales/escuela')), 'nada del material sale de la otra cartilla');

  // 4. Biblioteca: el mismo selector y sus archivos de la cartilla elegida.
  await p.goto(url('/docente/biblioteca'));
  await p.waitForSelector('.elegir-cartilla');
  comprobar((await p.locator('.elegir-cartilla .fila:has(.elegir-cartilla__actual)').textContent()).includes('Matemáticas'), 'Biblioteca recuerda la cartilla elegida');
  await p.click('text=Recursos por tema');
  await p.waitForTimeout(800);
  comprobar(pedidos.some((r) => r.startsWith('/cartillas/prueba-2/biblioteca/')), 'Biblioteca lee la cartilla elegida');
  await foto(p, '03-biblioteca-390');

  // 5. Proyectar abre la misma cartilla.
  const antes = pedidos.length;
  await p.goto(url('/proyectar'));
  await p.waitForSelector('text=Tema de prueba 1', { timeout: 10000 });
  comprobar(pedidos.slice(antes).includes('/cartillas/prueba-2/materiales/indice.json'), 'Proyectar abre la cartilla elegida');

  // 6. La página del grupo usa los personajes de su cartilla.
  await p.goto(url('/docente/grupos/g2'));
  await p.waitForTimeout(1200);
  comprobar(pedidos.includes('/cartillas/prueba-2/cartilla.json'), 'el grupo 1A lee los personajes de su cartilla');
  comprobar(!errores.length, `sin errores en la consola${errores.length ? ': ' + errores.join(' | ') : ''}`);
  await c.close();

  // 7. Un docente con un solo grupo (de la cartilla de prueba): sin selector y con su cartilla.
  const solo = await docente(navegador, ['g2']);
  await solo.p.goto(url('/docente/planear'));
  await solo.p.waitForSelector('text=Tema de prueba 1', { timeout: 10000 });
  comprobar((await solo.p.locator('.elegir-cartilla').count()) === 0, 'con una sola cartilla no aparece el selector');
  await foto(solo.p, '04-planear-un-grupo-390');
  await solo.c.close();
} finally {
  await navegador.close();
  servidor.kill();
}

if (fallos.length) {
  console.error(`\n${fallos.length} comprobaciones fallaron`);
  process.exit(1);
}
console.log('\nTodo bien');
