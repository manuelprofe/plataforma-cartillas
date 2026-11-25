// Matemáticas de transición, territorio 1, en la vista previa (`/?cartilla=matematicas-0`) a
// 390 × 844, como invitado: la página carga con Cuadrito, todo se oye en español, las misiones
// de cada plantilla abren y se juegan, y los toques miden 48 px o más.
// Uso: `npm run build`, luego `node scripts/pruebas/cartilla-matematicas-0.mjs`.
import { readFileSync } from 'node:fs';
import { chromium, servir, URL_APP, CAPTURAS, CLAVE, BASE_JUGADO, cerrarCharla, entrarAMision, jugarEscuchaToca, menorToque } from './comun.mjs';

const fallos = [];
const comprobar = (ok, texto) => { console.log(ok ? 'bien ' : 'FALLA', texto); if (!ok) fallos.push(texto); };
const foto = (p, n) => p.screenshot({ path: `${CAPTURAS}/mate0-${n}.png` });
const cartilla = JSON.parse(readFileSync('public/cartillas/matematicas-0/cartilla.json', 'utf8'));
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
  await p.goto(`${URL_APP}?cartilla=matematicas-0`);
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
    comprobar(portada.includes('cartillas/matematicas-0/'), 'la vista previa abre la cartilla de matemáticas de transición');
    await foto(p, '00-portada');
    await p.click('.jugar-invitado');
    await p.waitForSelector('.dialogo', { timeout: 15000 });
    await p.waitForTimeout(600);
    await foto(p, '01-intro');
    const intro = await p.locator('.dialogo').textContent();
    comprobar(/Cuadrito/.test(intro) || /Goma/.test(intro), `la presentación habla de la página de Cuadrito (${intro.slice(0, 80)})`);
    comprobar(errores.length === 0, `primera vez sin errores (${errores.join(' | ')})`);
    await c.close();
  }

  // 2. Ya jugado: el mapa y una misión de cada plantilla.
  const { c, p, errores } = await abrir(navegador, { ...BASE_JUGADO, heroe: cartilla.heroes[0].id });
  await p.click('.jugar-invitado');
  await p.waitForSelector('.mundo', { timeout: 15000 });
  await p.waitForTimeout(900);
  await cerrarCharla(p);
  await foto(p, '02-mapa');
  comprobar(await sinDesborde(p), 'mapa sin desborde a 390');

  await entrarAMision(p, '¿Arriba o abajo?');
  await foto(p, '03-escucha-toca');
  comprobar((await menorToque(p, '.mision button')) >= 48, `escucha y toca: toques de 48 px o más (${Math.round(await menorToque(p, '.mision button'))})`);
  comprobar(!(await p.locator('.carta-grande small').count()), 'la palabra no se repite debajo (ya está en español)');
  await jugarEscuchaToca(p);
  await cerrarMision(p);
  let guardado = await p.evaluate((k) => JSON.parse(localStorage.getItem(k)), CLAVE);
  comprobar(!!guardado?.misiones?.['cuadrito-arriba'], 'la misión queda completada en el progreso');

  await entrarAMision(p, 'Toca uno, dos o tres');
  await p.waitForSelector('.contar__objeto');
  await foto(p, '04-contar');
  comprobar((await menorToque(p, '.contar__objeto, .contar__listo')) >= 48, 'contar: toques de 48 px o más');
  const n = (await dicho(p)).some((d) => d.includes('Toca una manzana')) ? 1 : 0;
  comprobar(n === 1, 'contar: la voz pide una manzana');
  await p.locator('.contar__objeto').nth(0).click();
  await p.click('.contar__listo');
  await p.waitForTimeout(1200);
  await foto(p, '05-contar-ronda2');
  await p.click('.boton-salir');
  await p.waitForTimeout(800);
  await cerrarCharla(p);

  await entrarAMision(p, 'Toca el color');
  await foto(p, '06-colores');
  await p.click('.boton-salir');
  await p.waitForTimeout(800);
  await cerrarCharla(p);

  await entrarAMision(p, 'Toca la forma');
  await foto(p, '07-formas');
  await p.click('.boton-salir');
  await p.waitForTimeout(800);

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
