// Goma acompaña: frase del día en Inicio y "Pregúntale a Goma" (árbol de preguntas, buscador,
// sugerencias de la pantalla), a 390 y 1280. Uso: `npm run build`, luego `node scripts/pruebas/goma.mjs`.
import { readFileSync } from 'node:fs';
import { chromium, servir, URL_APP, CAPTURAS, LLAVE_ADULTO, sesionAdulto, simularSupabase } from './comun.mjs';

const fallos = [];
const comprobar = (ok, texto) => { console.log(ok ? 'bien ' : 'FALLA', texto); if (!ok) fallos.push(texto); };
const url = (r) => new URL(r, URL_APP).href;

// El árbol no tiene ramas rotas.
const g = JSON.parse(readFileSync(new URL('../../public/goma/guia.json', import.meta.url)));
const rotas = Object.entries(g.nodos).flatMap(([id, n]) => n.siguientes.filter((s) => !g.nodos[s]).map((s) => `${id}→${s}`)).concat(g.temas.flatMap((t) => t.inicio.filter((s) => !g.nodos[s])));
comprobar(rotas.length === 0, `el árbol no tiene ramas rotas ${rotas.join(' ')}`);
comprobar(Object.values(g.nodos).every((n) => n.siguientes.length >= 1 && n.siguientes.length <= 3), 'cada respuesta ofrece de 1 a 3 preguntas siguientes');

const servidor = await servir();
const navegador = await chromium.launch();
try {
  for (const ancho of [390, 1280]) {
    const c = await navegador.newContext({ viewport: { width: ancho, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block', locale: 'es-CO' });
    await c.addInitScript(([k, v]) => localStorage.setItem(k, v), [LLAVE_ADULTO, JSON.stringify(sesionAdulto('docente'))]);
    await simularSupabase(c);
    const p = await c.newPage();
    const errores = [];
    p.on('pageerror', (e) => errores.push(String(e)));
    await p.goto(url('/docente'));
    await p.waitForSelector('.frase-goma');
    comprobar(/Frase de hoy|Tip de hoy/.test(await p.locator('.frase-goma').innerText()), `${ancho}: frase o tip del día en Inicio`);
    await p.goto(url('/docente/grupos'));
    await p.locator('.goma-boton').click();
    await p.waitForSelector('.goma-guia .goma-temas');
    const aqui = await p.locator('.goma-preguntas button').allInnerTexts();
    comprobar(aqui.some((t) => /grupo|autorización|entran/i.test(t)), `${ancho}: sugiere preguntas de la pantalla de grupos (${aqui.join(' | ')})`);
    await p.locator('.goma-temas button', { hasText: 'Manejo de grupo' }).click();
    await p.locator('.goma-preguntas button', { hasText: 'participen todos' }).click();
    await p.waitForSelector('.goma-respuesta h3');
    comprobar((await p.locator('.goma-respuesta h3').innerText()).includes('participen'), `${ancho}: abre la respuesta`);
    const sig = await p.locator('.goma-respuesta .goma-preguntas button').count();
    comprobar(sig >= 1 && sig <= 3, `${ancho}: la respuesta ofrece ${sig} preguntas siguientes`);
    await p.locator('.goma-respuesta .goma-preguntas button').first().click();
    await p.locator('.goma-volver').click();
    comprobar((await p.locator('.goma-respuesta h3').innerText()).includes('participen'), `${ancho}: Volver regresa a la pregunta anterior`);
    await p.fill('.goma-guia__buscar input', 'imprimir tarjetas');
    await p.waitForTimeout(100);
    comprobar((await p.locator('.goma-preguntas button').count()) > 0, `${ancho}: el buscador encuentra preguntas`);
    await p.fill('.goma-guia__buscar input', 'tímidos');
    await p.waitForTimeout(100);
    comprobar((await p.locator('.goma-preguntas button').first().innerText()).includes('tímidos'), `${ancho}: busca sin importar tildes y ordena por parecido`);
    comprobar(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${ancho}: sin desborde`);
    await p.screenshot({ path: `${CAPTURAS}/goma-${ancho}.png` });
    await p.keyboard.press('Escape');
    comprobar((await p.locator('.goma-guia').count()) === 0, `${ancho}: Escape cierra`);
    comprobar(errores.length === 0, `${ancho}: sin errores ${errores.join(' | ')}`);
    await c.close();
  }
} finally {
  await navegador.close();
  servidor.kill();
}
console.log(fallos.length ? `\n${fallos.length} fallas` : '\nTodo bien');
process.exit(fallos.length ? 1 : 0);
