// El cuento vivo en el navegador, a 390 × 844: se pasan las páginas (cada una se narra), se
// responden las preguntas (un error deja intentar otra vez y se puede volver a ver el cuento),
// se ordenan las escenas y la misión queda completada. Toques de 48 px o más.
// Uso: `npm run build`, luego `node scripts/pruebas/cuento.mjs espanol-0`.
import { readFileSync } from 'node:fs';
import { chromium, servir, URL_APP, CAPTURAS, CLAVE, BASE_JUGADO, cerrarCharla, entrarAMision, menorToque } from './comun.mjs';

const fallos = [];
const comprobar = (ok, texto) => { console.log(ok ? 'bien ' : 'FALLA', texto); if (!ok) fallos.push(texto); };
const ID = process.argv[2] ?? 'espanol-0';
const cartilla = JSON.parse(readFileSync(`public/cartillas/${ID}/cartilla.json`, 'utf8'));
const mision = cartilla.territorios[0].misiones.find((m) => m.plantilla === 'cuento');
const { paginas, preguntas } = mision.cuento;

const servidor = await servir();
const navegador = await chromium.launch();
try {
  const c = await navegador.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
  await c.addInitScript(([k, v]) => { if (!sessionStorage.sembrado) { localStorage.setItem(k, v); sessionStorage.sembrado = '1'; } }, [CLAVE, JSON.stringify({ ...BASE_JUGADO, heroe: cartilla.heroes[0].id })]);
  await c.addInitScript(() => { window.__dicho = []; speechSynthesis.speak = (f) => { window.__dicho.push(f.text); setTimeout(() => f.onend?.(), 30); }; });
  const p = await c.newPage();
  const errores = [];
  p.on('pageerror', (e) => errores.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && !/mp4|ERR_FAILED|Failed to load resource/.test(m.text()) && errores.push(m.text()));
  await p.goto(`${URL_APP}?cartilla=${ID}`);
  await p.click('.jugar-invitado');
  await p.waitForSelector('.mundo', { timeout: 15000 });
  await p.waitForTimeout(900);
  await cerrarCharla(p);
  await entrarAMision(p, mision.titulo);
  const dicho = () => p.evaluate(() => window.__dicho);

  for (const [i, pagina] of paginas.entries()) {
    await p.waitForTimeout(800);
    if (i === 0) {
      await p.screenshot({ path: `${CAPTURAS}/cuento-pagina.png` });
      comprobar((await menorToque(p, '.cuento button:not(:disabled)')) >= 48, `toques de 48 px o más (${Math.round(await menorToque(p, '.cuento button:not(:disabled)'))})`);
      comprobar(await p.evaluate(() => [...document.querySelectorAll('.cuento *')].every((e) => e.getBoundingClientRect().right <= innerWidth + 1)), 'sin desborde a 390');
    }
    comprobar((await dicho()).includes(pagina.texto), `página ${i + 1} se narra sola`);
    await p.click('.cuento__boton--seguir');
  }

  for (const [i, q] of preguntas.entries()) {
    await p.waitForSelector('.cuento__pregunta', { timeout: 5000 });
    await p.waitForTimeout(600);
    if (q.tipo === 'elegir') {
      if (i === 0) {
        await p.screenshot({ path: `${CAPTURAS}/cuento-pregunta.png` });
        await p.locator('.cuento__opcion').nth(q.correcta === 0 ? 1 : 0).click();
        await p.waitForTimeout(500);
        comprobar(!(await p.locator('.cuento__opcion--bien').count()), 'un error deja intentar otra vez');
        // Volver a ver el cuento y regresar a la misma pregunta.
        await p.click('.cuento__repasar');
        await p.waitForSelector('.cuento__pagina');
        for (let k = 0; k < paginas.length; k++) { await p.click('.cuento__boton--seguir'); await p.waitForTimeout(250); }
        await p.waitForSelector('.cuento__pregunta');
        comprobar((await p.locator('.cuento__dice').textContent()) === q.dice, 'después de ver el cuento otra vez vuelve a la misma pregunta');
      }
      await p.locator('.cuento__opcion').nth(q.correcta).click();
    } else {
      await p.screenshot({ path: `${CAPTURAS}/cuento-ordenar.png` });
      comprobar(await p.evaluate(() => [...document.querySelectorAll('.cuento *')].every((e) => e.getBoundingClientRect().right <= innerWidth + 1)), 'ordenar sin desborde a 390');
      for (const img of q.imagenes) await p.locator(`.cuento__escena:has(img[src$="${img}"])`).click();
    }
    await p.waitForTimeout(300);
    comprobar(await p.locator('.cuento__opcion--bien').count() > 0, `pregunta ${i + 1} (${q.tipo}) resuelta`);
    await p.waitForTimeout(1500);
  }
  await p.waitForSelector('.cierre', { timeout: 8000 });
  await p.waitForTimeout(500);
  const progreso = await p.evaluate((k) => JSON.parse(localStorage.getItem(k)), CLAVE);
  comprobar(Boolean(progreso.misiones?.[mision.id]), 'la misión queda completada en el progreso');
  comprobar(errores.length === 0, `sin errores (${errores.join(' | ')})`);
  await c.close();
} finally {
  await navegador.close();
  servidor.kill();
}
console.log(fallos.length ? `\n${fallos.length} fallas` : '\ntodo bien');
process.exit(fallos.length ? 1 : 0);
