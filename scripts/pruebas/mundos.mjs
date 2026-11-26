// Mundos propios por materia, a 390 × 844: matemáticas abre el camino de Cuadrito y español la
// biblioteca de Renglón (inglés sigue con su mapa). El guía saluda la primera vez, una parada
// dormida no abre, la que brilla abre su juego, al volver se está en el mismo mundo y, con la
// primera terminada, despierta la siguiente. Toques de 48 px o más y nada se sale a lo ancho.
// Uso: `npm run build`, luego `node scripts/pruebas/mundos.mjs`.
import { readFileSync } from 'node:fs';
import { chromium, servir, URL_APP, CAPTURAS, CLAVE, BASE_JUGADO, cerrarCharla, menorToque } from './comun.mjs';

const fallos = [];
const comprobar = (ok, texto) => { console.log(ok ? 'bien ' : 'FALLA', texto); if (!ok) fallos.push(texto); };
const CASOS = [
  { id: 'matematicas-0', mundo: '.camino' },
  { id: 'espanol-0', mundo: '.biblioteca' },
  { id: 'ingles-3', mundo: '.mundo' },
];

const servidor = await servir();
const navegador = await chromium.launch();
try {
  for (const { id, mundo } of CASOS) {
    const cartilla = JSON.parse(readFileSync(`public/cartillas/${id}/cartilla.json`, 'utf8'));
    const misiones = cartilla.territorios[0].misiones;
    const abrir = async (hechas) => {
      const c = await navegador.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
      const progreso = { ...BASE_JUGADO, heroe: cartilla.heroes[0].id, misiones: Object.fromEntries(hechas.map((m) => [m, { veces: 1, mejorErrores: 0 }])) };
      await c.addInitScript(([k, v]) => { if (!sessionStorage.sembrado) { localStorage.setItem(k, v); sessionStorage.sembrado = '1'; } }, [CLAVE, JSON.stringify(progreso)]);
      await c.addInitScript(() => { window.__dicho = []; speechSynthesis.speak = (f) => { window.__dicho.push(f.text); setTimeout(() => f.onend?.(), 30); }; });
      const p = await c.newPage();
      const errores = [];
      p.on('pageerror', (e) => errores.push(String(e)));
      p.on('console', (m) => m.type() === 'error' && !/mp4|ERR_FAILED|Failed to load resource/.test(m.text()) && errores.push(m.text()));
      await p.goto(`${URL_APP}?cartilla=${id}`);
      await p.click('.jugar-invitado');
      await p.waitForSelector('.mundo, .camino, .biblioteca', { timeout: 15000 });
      await p.waitForTimeout(1200);
      return { c, p, errores };
    };

    // Primera vez: el mundo de la materia y el guía saluda.
    let { c, p, errores } = await abrir([]);
    comprobar(await p.locator(mundo).count() === 1, `${id}: abre su mundo (${mundo})`);
    if (mundo === '.mundo') {
      await c.close();
      continue;
    }
    const saludo = await p.locator('.dialogo').textContent().catch(() => '');
    comprobar(/Hola/.test(saludo ?? ''), `${id}: el guía saluda la primera vez`);
    await cerrarCharla(p);
    await p.screenshot({ path: `${CAPTURAS}/mundos-${id}.png` });
    comprobar(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${id}: sin desborde a 390`);
    comprobar((await menorToque(p, `${mundo} .nodo`)) >= 48, `${id}: paradas de 48 px o más (${Math.round(await menorToque(p, `${mundo} .nodo`))})`);

    // Una dormida no abre: el guía dice que todavía duerme.
    const dormida = misiones.find((m, i) => i > 0 && (mundo === '.camino' || m.requiere));
    await p.evaluate((t) => document.querySelector(`.nodo[aria-label="${t}"]`).click(), dormida.titulo);
    await p.waitForSelector('.dialogo', { timeout: 5000 });
    comprobar(/duerme/.test(await p.locator('.dialogo').textContent()), `${id}: "${dormida.titulo}" duerme y no abre`);
    await cerrarCharla(p);
    comprobar(!(await p.locator('.mision').count()), `${id}: sigue en el mundo`);

    // La primera abre su juego y se vuelve al mismo mundo.
    await p.evaluate((t) => document.querySelector(`.nodo[aria-label="${t}"]`).click(), misiones[0].titulo);
    await p.waitForSelector('.dialogo', { timeout: 8000 });
    await cerrarCharla(p);
    await p.waitForSelector('.mision', { timeout: 8000 });
    comprobar(true, `${id}: "${misiones[0].titulo}" abre su juego (${misiones[0].plantilla})`);
    await p.click('.boton-salir');
    await p.waitForSelector(mundo, { timeout: 15000 });
    comprobar(true, `${id}: al salir vuelve a su mundo`);
    comprobar(errores.length === 0, `${id}: sin errores (${errores.join(' | ')})`);
    await c.close();

    // Con la primera terminada despierta la siguiente.
    ({ c, p, errores } = await abrir([misiones[0].id]));
    await cerrarCharla(p);
    const segunda = misiones[1];
    const clase = await p.evaluate((t) => document.querySelector(`.nodo[aria-label="${t}"]`).className, segunda.titulo);
    comprobar(!/dormida/.test(clase), `${id}: "${segunda.titulo}" despierta al terminar la primera`);
    const primera = await p.evaluate((t) => document.querySelector(`.nodo[aria-label="${t}"]`).className, misiones[0].titulo);
    comprobar(/hecha/.test(primera), `${id}: la primera se ve terminada`);
    await p.screenshot({ path: `${CAPTURAS}/mundos-${id}-avance.png` });
    await c.close();
  }
} finally {
  await navegador.close();
  servidor.kill();
}
console.log(fallos.length ? `\n${fallos.length} fallas` : '\ntodo bien');
process.exit(fallos.length ? 1 : 0);
