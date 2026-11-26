// El juego de plataformas en el navegador, a 390 × 844: la misión se juega entera con las
// teclas (el mismo camino que encuentra el motor), cada puerta abre su reto, un error no quita
// nada y la misión queda completada. Los mandos miden 48 px o más.
// Uso: `npm run build`, luego `node --experimental-strip-types scripts/pruebas/plataformas.mjs matematicas-0 [--todas]`.
import { readFileSync } from 'node:fs';
import { chromium, servir, URL_APP, CAPTURAS, CLAVE, BASE_JUGADO, cerrarCharla, entrarAMision, menorToque } from './comun.mjs';
import { resolver } from './plataformas-motor.mjs';

const fallos = [];
const comprobar = (ok, texto) => { console.log(ok ? 'bien ' : 'FALLA', texto); if (!ok) fallos.push(texto); };
const ID = process.argv[2] ?? 'matematicas-0';
const cartilla = JSON.parse(readFileSync(`public/cartillas/${ID}/cartilla.json`, 'utf8'));
const todas = cartilla.territorios[0].misiones.filter((m) => m.plantilla === 'plataformas');
// Con --todas se juegan todas las misiones de plataformas; si no, solo la primera.
const lista = process.argv.includes('--todas') ? todas : todas.slice(0, 1);
const TECLA = { '←': 'ArrowLeft', '→': 'ArrowRight', '⤴': 'ArrowUp', '⇅': 'ArrowUp' };

const servidor = await servir();
const navegador = await chromium.launch();
try {
 for (const mision of lista) {
  console.log(`\n== ${mision.titulo}`);
  const c = await navegador.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
  await c.addInitScript(([k, v]) => { if (!sessionStorage.sembrado) { localStorage.setItem(k, v); sessionStorage.sembrado = '1'; } }, [CLAVE, JSON.stringify({ ...BASE_JUGADO, heroe: cartilla.heroes[0].id, misiones: Object.fromEntries(cartilla.territorios[0].misiones.filter((m) => m.id !== mision.id).map((m) => [m.id, { veces: 1, mejorErrores: 0 }])) })]);
  await c.addInitScript(() => { window.__dicho = []; speechSynthesis.speak = (f) => { window.__dicho.push(f.text); setTimeout(() => f.onend?.(), 30); }; });
  const p = await c.newPage();
  const errores = [];
  p.on('pageerror', (e) => errores.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && !/mp4|ERR_FAILED|Failed to load resource/.test(m.text()) && errores.push(m.text()));
  await p.goto(`${URL_APP}?cartilla=${ID}`);
  await p.click('.jugar-invitado');
  await p.waitForSelector('.mundo, .camino, .biblioteca', { timeout: 15000 });
  await p.waitForTimeout(900);
  await cerrarCharla(p);
  await entrarAMision(p, mision.titulo);
  comprobar(await p.locator('.plataformas .pl-heroe img').count() === 1, 'abre el juego de plataformas con el héroe');
  comprobar((await menorToque(p, '.plataformas button')) >= 48, `mandos de 48 px o más (${Math.round(await menorToque(p, '.plataformas button'))})`);
  comprobar(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'sin desborde a 390');

  let errorHecho = false;
  for (const [i, nivel] of mision.plataformas.entries()) {
    await p.waitForTimeout(700);
    await p.screenshot({ path: `${CAPTURAS}/plataformas-${mision.id}-${i + 1}.png` });
    const camino = resolver(nivel.mapa);
    let reto = 0;
    for (const paso of camino) {
      await p.keyboard.press(TECLA[paso]);
      await p.waitForTimeout(950);
      if (await p.locator('.pl-reto').count()) {
        if (!errorHecho) {
          await p.screenshot({ path: `${CAPTURAS}/plataformas-reto.png` });
          const mala = nivel.retos[reto].correcta === 0 ? 1 : 0;
          await p.locator('.pl-opcion').nth(mala).click();
          await p.waitForTimeout(500);
          comprobar(await p.locator('.pl-reto').count() === 1, 'un error deja el reto abierto para intentar otra vez');
          errorHecho = true;
        }
        await p.locator('.pl-opcion').nth(nivel.retos[reto].correcta).click();
        await p.waitForTimeout(1700);
        comprobar(!(await p.locator('.pl-reto').count()), `nivel ${i + 1}: la puerta ${reto + 1} se abre`);
        reto++;
      }
    }
    await p.waitForTimeout(1900);
    const hecho = i + 1 < mision.plataformas.length ? (await p.locator('.punto--hecho').count()) === i + 1 : (await p.locator('.cierre').count()) === 1;
    comprobar(hecho, `nivel ${i + 1} terminado (${camino.length} pasos)`);
  }
  await p.waitForSelector('.cierre', { timeout: 8000 });
  await p.screenshot({ path: `${CAPTURAS}/plataformas-cierre.png` });
  comprobar(true, 'la misión llega al cierre');
  await p.waitForTimeout(500);
  const progreso = await p.evaluate((k) => JSON.parse(localStorage.getItem(k)), CLAVE);
  comprobar(Boolean(progreso.misiones?.[mision.id]), 'la misión queda completada en el progreso');
  comprobar(errores.length === 0, `sin errores (${errores.join(' | ')})`);
  await c.close();
 }
} finally {
  await navegador.close();
  servidor.kill();
}
console.log(fallos.length ? `\n${fallos.length} fallas` : '\ntodo bien');
process.exit(fallos.length ? 1 : 0);
