// Tanda 1 del esqueleto: rutas con historial, atrás, recarga sin red y peso de la primera carga.
// Uso: `npm run build`, luego `node scripts/pruebas/rutas.mjs`.
import { readFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { chromium, servir, URL_APP, CLAVE, CAPTURAS, BASE_JUGADO, abrir, alMapa, entrarAMision, adultoPorRuta } from './comun.mjs';

const RUTAS = ['/', '/adultos', '/docente', '/docente/grupos', '/docente/grupos/3B', '/docente/planear', '/docente/mas', '/docente/ayuda', '/colegio', '/colegio/docentes', '/plataforma', '/plataforma/cartillas', '/proyectar', '/proyectar/fin', '/mapa'];
const ANCHAS = ['/docente', '/colegio', '/plataforma', '/proyectar'];
const url = (r) => new URL(r, URL_APP).href;
const nombre = (r) => (r === '/' ? 'raiz' : r.slice(1).replaceAll('/', '-'));
const fallos = [];
const comprobar = (ok, texto) => { console.log(ok ? 'bien ' : 'FALLA', texto); if (!ok) fallos.push(texto); };

async function contexto(navegador, { ancho = 390, alto = 844, progreso = BASE_JUGADO, sw = 'block' } = {}) {
  const c = await navegador.newContext({ viewport: { width: ancho, height: alto }, reducedMotion: 'reduce', serviceWorkers: sw });
  if (progreso) await c.addInitScript(([k, v]) => { if (!localStorage.getItem(k)) localStorage.setItem(k, v); }, [CLAVE, JSON.stringify(progreso)]);
  // Docente, colegio y plataforma piden cuenta (tanda 2): sesión simulada del rol de cada sección.
  await adultoPorRuta(c);
  return c;
}
const listo = (p) => p.waitForSelector('h1, .jugar-invitado, .mundo', { timeout: 10000 });
const errores = (p) => { const e = []; p.on('pageerror', (x) => e.push(String(x))); p.on('console', (m) => m.type() === 'error' && !/mp4|ERR_FAILED|ERR_INTERNET/.test(m.text()) && e.push(m.text())); return e; };

const servidor = await servir();
const navegador = await chromium.launch();
try {
  // 1. Cada ruta carga a 390 × 844 (y las de adultos también a 1280 × 800).
  for (const [ancho, alto, lista] of [[390, 844, RUTAS], [1280, 800, ANCHAS]]) {
    const c = await contexto(navegador, { ancho, alto });
    const p = await c.newPage();
    const e = errores(p);
    for (const r of lista) {
      await p.goto(url(r));
      await listo(p);
      await p.waitForTimeout(400);
      const desborde = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      const toque = await p.evaluate(() => Math.min(99, ...[...document.querySelectorAll('main a, main button, nav a, header a, header button')].filter((b) => b.offsetParent).map((b) => { const q = b.getBoundingClientRect(); return Math.min(q.width, q.height); })));
      comprobar(new URL(p.url()).pathname === r && !desborde && toque >= 48, `${ancho}px ${r} carga (h1: "${await p.locator('h1').first().textContent().catch(() => '')}", toque mínimo ${Math.round(toque)}, desborde ${desborde})`);
      await p.screenshot({ path: `${CAPTURAS}/rutas-${nombre(r)}-${ancho}.png` });
    }
    comprobar(!e.length, `${ancho}px sin errores de consola ${e.join(' | ')}`);
    await c.close();
  }

  // 2. Atrás: entre modos (recarga) y dentro de un modo (sin recarga).
  {
    const c = await contexto(navegador);
    // Un grupo "3B" sin niños para la cortina (se registra después, así que responde primero).
    await c.route(/\/rest\/v1\/(rpc\/mis_codigos|grupos)/, (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify(r.request().url().includes('mis_codigos') ? [{ grupo_id: 'g3b', codigo: 'K7M2P' }] : [{ id: 'g3b', nombre: '3B', grado: '3°', colegio_id: null }]) }));
    const p = await c.newPage();
    const e = errores(p);
    await p.goto(url('/')); await listo(p);
    await p.click('.jugar-invitado'); await p.waitForSelector('.mundo', { timeout: 8000 });
    comprobar(new URL(p.url()).pathname === '/mapa', 'jugar lleva a /mapa');
    await p.goBack(); await p.waitForSelector('.jugar-invitado');
    comprobar(new URL(p.url()).pathname === '/', 'atrás desde /mapa vuelve a la portada');
    await p.goto(url('/adultos')); await listo(p);
    await p.goto(url('/docente')); await listo(p);
    await p.click('nav >> text=Grupos'); await p.waitForSelector('h1:has-text("Mis grupos")');
    await p.click('nav >> text=Más'); await p.waitForSelector('h1:has-text("Más")');
    await p.click('main >> text=Ayuda'); await p.waitForSelector('h1:has-text("Ayuda")');
    const esperado = ['/docente/mas', '/docente/grupos', '/docente', '/adultos', '/'];
    const visto = [];
    for (const r of esperado) { await p.goBack(); await listo(p); visto.push(new URL(p.url()).pathname); }
    comprobar(visto.join() === esperado.join(), `atrás recorre ${visto.join(' → ')}`);
    await p.goto(url('/proyectar')); await listo(p);
    await p.click('.telon__terminar'); await p.click('.telon__confirmar button:has-text("Terminar")');
    await p.waitForSelector('h1:has-text("Proyección terminada")');
    comprobar(new URL(p.url()).pathname === '/proyectar/fin', 'terminar con confirmación lleva a /proyectar/fin');
    await p.click('text=Ir a mi inicio'); await p.waitForSelector('h1:has-text("Inicio")');
    await p.goto(url('/docente/grupos/g3b')); await p.waitForSelector('.cortina-a');
    await p.screenshot({ path: `${CAPTURAS}/rutas-cortina-390.png` });
    await p.click('text=Ya terminé la clase');
    comprobar(!(await p.locator('.cortina-a').count()) && (await p.locator('text=Aquí aparecerán los niños de 3B').count()) === 1, 'cortina tras proyectar y "Ya terminé la clase" la quita');
    await p.goto(url('/docente/nada')); await p.waitForSelector('h1:has-text("Inicio")');
    await p.goto(url('/cualquier-cosa')); await p.waitForSelector('.jugar-invitado');
    comprobar(new URL(p.url()).pathname === '/', 'ruta desconocida del niño cae en la portada');
    comprobar(!e.length, `sin errores de consola ${e.join(' | ')}`);
    await c.close();
  }

  // 2b. Misión: tiene su dirección; el atrás del celular vuelve al mapa y el mapa a la portada.
  {
    const { pagina: p, errores: e } = await abrir(navegador, { progreso: BASE_JUGADO });
    await alMapa(p);
    const titulo = await p.locator('.nodo').first().getAttribute('aria-label');
    await entrarAMision(p, titulo);
    const enMision = new URL(p.url()).pathname;
    await p.goBack(); await p.waitForSelector('.mundo');
    const trasAtras = new URL(p.url()).pathname;
    await p.waitForTimeout(500);
    await p.goBack(); await p.waitForSelector('.jugar-invitado');
    comprobar(/^\/mision\//.test(enMision) && trasAtras === '/mapa' && new URL(p.url()).pathname === '/', `misión ${enMision} → atrás ${trasAtras} → atrás /`);
    comprobar(!e.length, `misión sin errores ${e.join(' | ')}`);
    await p.context().close();
  }

  // 3. Peso de la primera carga de `/` (sin service worker), comprimido con gzip -9.
  {
    const c = await contexto(navegador, { progreso: null });
    const p = await c.newPage();
    const pedidos = [];
    p.on('request', (q) => pedidos.push(new URL(q.url()).pathname));
    await p.goto(url('/'), { waitUntil: 'networkidle' });
    await p.waitForSelector('.jugar-invitado');
    await p.waitForTimeout(1000);
    const peso = (r) => { const f = `dist${r === '/' ? '/index.html' : decodeURIComponent(r)}`; return existsSync(f) ? gzipSync(readFileSync(f), { level: 9 }).length : 0; };
    const armazon = [...new Set(pedidos)].filter((r) => r === '/' || r.startsWith('/assets/'));
    const kb = (n) => (n / 1024).toFixed(1);
    const tArmazon = armazon.reduce((s, r) => s + peso(r), 0);
    const tTodo = [...new Set(pedidos)].reduce((s, r) => s + peso(r), 0);
    console.log('pedidos:', pedidos.join(' '));
    comprobar(tArmazon < 160 * 1024, `armazón de / ${kb(tArmazon)} KB gzip (todo lo pedido, con cartilla.json y portada: ${kb(tTodo)} KB)`);
    comprobar(!pedidos.some((r) => /Adultos|Proyectar|base-|supabase/i.test(r)), 'la primera carga de / no trae adultos, proyectar ni Supabase');
    // Y al revés: /docente no trae el paquete ni los estilos del niño.
    const p2 = await c.newPage();
    const pedidos2 = [];
    p2.on('request', (q) => pedidos2.push(new URL(q.url()).pathname));
    await p2.goto(url('/docente'), { waitUntil: 'networkidle' });
    comprobar(!pedidos2.some((r) => /estudiante/.test(r)) && pedidos2.some((r) => /(base|Adultos)-.*\.css/.test(r)), `/docente carga solo lo suyo: ${pedidos2.join(' ')}`);
    await c.close();
  }

  // 4. Sin red: con el service worker instalado, recargar cualquier ruta carga.
  {
    const c = await contexto(navegador, { sw: 'allow' });
    const p = await c.newPage();
    const e = errores(p);
    await p.goto(url('/')); await listo(p);
    await p.evaluate(() => navigator.serviceWorker.ready);
    await p.waitForTimeout(8000); // instala y baja el paquete de la cartilla en segundo plano
    // El armazón no trae el código de adultos ni del telón: se guarda la primera vez que se abre.
    const sw = await p.evaluate(() => fetch('/sw.js').then((r) => r.text()));
    comprobar(!/assets\/(Adultos|Proyectar|base)-/.test(sw), 'el armazón del niño no incluye adultos ni proyectar');
    for (const r of ['/docente/grupos', '/proyectar']) { await p.goto(url(r)); await listo(p); }
    await p.waitForTimeout(1000);
    await c.setOffline(true);
    for (const r of ['/mapa', '/docente/grupos', '/colegio', '/proyectar', '/adultos', '/']) {
      await p.goto(url(r)); await listo(p);
      if (r === '/mapa') await p.screenshot({ path: `${CAPTURAS}/rutas-sin-red-mapa-390.png` });
      comprobar(new URL(p.url()).pathname === r, `sin red, recargar ${r} carga`);
    }
    await p.reload(); await listo(p);
    comprobar(!e.length, `sin red sin errores de consola ${e.join(' | ')}`);
    await c.close();
  }
} finally {
  await navegador.close();
  servidor.kill();
}
console.log(fallos.length ? `\n${fallos.length} fallas` : '\nTodo bien');
process.exit(fallos.length ? 1 : 0);
