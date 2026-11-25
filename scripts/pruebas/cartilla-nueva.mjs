// Una cartilla nueva en español (armada con cartilla_desde_molde.py), en la vista previa
// (`/?cartilla=<id>`) a 390 × 844, como invitado: la página carga con su guía, todo se oye en
// español, una misión de cada plantilla abre (la primera de escuchar se juega entera) y los
// toques miden 48 px o más.
// Uso: `npm run build`, luego `node scripts/pruebas/cartilla-nueva.mjs matematicas-0`.
import { readFileSync } from 'node:fs';
import { chromium, servir, URL_APP, CAPTURAS, CLAVE, BASE_JUGADO, cerrarCharla, entrarAMision, jugarEscuchaToca, menorToque } from './comun.mjs';

const fallos = [];
const comprobar = (ok, texto) => { console.log(ok ? 'bien ' : 'FALLA', texto); if (!ok) fallos.push(texto); };
const ID = process.argv[2] ?? 'matematicas-0';
const foto = (p, n) => p.screenshot({ path: `${CAPTURAS}/${ID}-${n}.png` });
const cartilla = JSON.parse(readFileSync(`public/cartillas/${ID}/cartilla.json`, 'utf8'));
const misiones = cartilla.territorios[0].misiones;
const primera = (plantilla) => misiones.find((m) => m.plantilla === plantilla && !m.requiere && !m.opcional) ?? misiones.find((m) => m.plantilla === plantilla && !m.opcional);
const INGLES = /\b(the|you|listen|catch|hello|tap|say|word|words|let's|English)\b/i;

async function abrir(navegador, progreso) {
  const c = await navegador.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
  if (progreso) await c.addInitScript(([k, v]) => { if (!sessionStorage.sembrado) { localStorage.setItem(k, v); sessionStorage.sembrado = '1'; } }, [CLAVE, JSON.stringify(progreso)]);
  await c.addInitScript(() => {
    window.__dicho = [];
    const hablar = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = (f) => { window.__dicho.push(`${f.lang}|${f.text}`); setTimeout(() => f.onend?.(), 30); try { hablar(f); } catch {} };
  });
  const p = await c.newPage();
  const errores = [];
  p.on('pageerror', (e) => errores.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && !/mp4|ERR_FAILED|Failed to load resource/.test(m.text()) && errores.push(m.text()));
  await p.goto(`${URL_APP}?cartilla=${ID}`);
  await p.waitForSelector('.jugar-invitado');
  return { c, p, errores };
}
const dicho = (p) => p.evaluate(() => window.__dicho);
const sinDesborde = (p) => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

async function cerrarMision(p) {
  await p.waitForSelector('.cierre .carita', { timeout: 15000 });
  await p.waitForTimeout(500);
  await p.click('.carita');
  await p.waitForTimeout(400);
  await p.click('.boton-seguir');
  await p.waitForSelector('.mundo', { timeout: 15000 });
  await p.waitForTimeout(600);
  await cerrarCharla(p);
}

const servidor = await servir();
const navegador = await chromium.launch();
try {
  // 1. Primera vez: la portada y la presentación son de Cuadrito.
  {
    const { c, p, errores } = await abrir(navegador, { ...BASE_JUGADO, vistas: ['cine-inicio'], heroe: cartilla.heroes[0].id });
    const portada = await p.locator('img').evaluateAll((is) => is.map((i) => i.getAttribute('src')).join(' '));
    comprobar(portada.includes(`cartillas/${ID}/`), `la vista previa abre la cartilla ${ID}`);
    await foto(p, '00-portada');
    await p.click('.jugar-invitado');
    await p.waitForSelector('.dialogo', { timeout: 15000 });
    await p.waitForTimeout(600);
    await foto(p, '01-intro');
    const intro = await p.locator('.dialogo').textContent();
    comprobar(/Goma/.test(intro), `empieza la presentación (${intro.slice(0, 80)})`);
    comprobar(errores.length === 0, `primera vez sin errores (${errores.join(' | ')})`);
    await c.close();
  }

  // 2. Ya jugado: el mapa y una misión de cada plantilla.
  let { c, p, errores } = await abrir(navegador, { ...BASE_JUGADO, heroe: cartilla.heroes[0].id });
  await p.click('.jugar-invitado');
  await p.waitForSelector('.mundo', { timeout: 15000 });
  await p.waitForTimeout(900);
  await cerrarCharla(p);
  await foto(p, '02-mapa');
  comprobar(await sinDesborde(p), 'mapa sin desborde a 390');

  const toca = primera('escucha-toca');
  await entrarAMision(p, toca.titulo);
  await foto(p, '03-escucha-toca');
  comprobar((await menorToque(p, '.mision button')) >= 48, `escucha y toca: toques de 48 px o más (${Math.round(await menorToque(p, '.mision button'))})`);
  comprobar(!(await p.locator('.carta-grande small').count()), 'la palabra no se repite debajo (ya está en español)');
  await jugarEscuchaToca(p);
  await cerrarMision(p);
  const guardado = await p.evaluate((k) => JSON.parse(localStorage.getItem(k)), CLAVE);
  comprobar(!!guardado?.misiones?.[toca.id], 'la misión queda completada en el progreso');

  // Las demás plantillas: abren, se ven a 390 sin desborde y se puede salir.
  const otras = ['contar-toca', 'memoria', 'escucha-atrapa', 'di-brilla', 'ordenar', 'operacion', 'silabas'].map(primera).filter(Boolean);
  // Las que esperan otra misión se abren en una visita nueva con esa ya hecha.
  await c.close();
  const hechas = Object.fromEntries(otras.filter((m) => m.requiere).map((m) => [m.requiere, { veces: 1, mejorErrores: 0 }]));
  ({ c, p } = await abrir(navegador, { ...BASE_JUGADO, heroe: cartilla.heroes[0].id, misiones: hechas }));
  p.on('pageerror', (e) => errores.push(String(e)));
  await p.click('.jugar-invitado');
  await p.waitForSelector('.mundo', { timeout: 15000 });
  await p.waitForTimeout(900);
  await cerrarCharla(p);
  for (const m of otras) {
    await entrarAMision(p, m.titulo);
    await p.waitForTimeout(800);
    await foto(p, `04-${m.plantilla}`);
    comprobar(await sinDesborde(p), `${m.plantilla} (${m.titulo}): sin desborde a 390`);
    comprobar((await menorToque(p, '.mision button')) >= 44, `${m.plantilla}: toques de 44 px o más (${Math.round(await menorToque(p, '.mision button'))})`);
    await p.click('.boton-salir');
    await p.waitForSelector('.mundo', { timeout: 15000 });
    await p.waitForTimeout(800);
    await cerrarCharla(p);
  }

  const todo = await dicho(p);
  const lenguas = [...new Set(todo.map((d) => d.split('|')[0]))];
  comprobar(lenguas.every((l) => l.startsWith('es')), `todo se dice con voz en español (${lenguas.join(', ')})`);
  const enIngles = todo.filter((d) => INGLES.test(d.split('|')[1]));
  comprobar(enIngles.length === 0, `nada se dice en inglés (${enIngles.slice(0, 3).join(' · ')})`);
  comprobar(errores.length === 0, `sin errores (${errores.join(' | ')})`);
  await c.close();
} finally {
  await navegador.close();
  servidor.kill();
}
console.log(fallos.length ? `\n${fallos.length} fallas` : '\ntodo bien');
process.exit(fallos.length ? 1 : 0);
