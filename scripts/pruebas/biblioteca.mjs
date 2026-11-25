// Biblioteca del docente: historia (bilingüe, telón), recursos por tema, actividades con filtros
// y documentos. Sin desborde a 390 px; el acceso desde Inicio y desde Más.
// Uso: `npm run build`, luego `node scripts/pruebas/biblioteca.mjs`.
import { chromium, servir, URL_APP, CAPTURAS, LLAVE_ADULTO, sesionAdulto, simularSupabase } from './comun.mjs';

const fallos = [];
const comprobar = (ok, texto) => { console.log(ok ? 'bien ' : 'FALLA', texto); if (!ok) fallos.push(texto); };
const desborda = (p) => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);

const servidor = await servir();
const nav = await chromium.launch();
try {
  for (const ancho of [390, 1280]) {
    const c = await nav.newContext({ viewport: { width: ancho, height: 844 }, serviceWorkers: 'block', locale: 'es-CO' });
    await c.addInitScript(([k, v]) => localStorage.setItem(k, v), [LLAVE_ADULTO, JSON.stringify(sesionAdulto('docente', { perfil: { rol: 'docente', nombre: 'Profe', colegio_id: 'c1' } }))]);
    await c.route('**/i.ytimg.com/**', (r) => r.abort());
    await c.route('**/www.youtube-nocookie.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>video</p>' }));
    await simularSupabase(c, async (u) => (u.pathname === '/rest/v1/rpc/mi_perfil' ? { json: { rol: 'docente', nombre: 'Profe', colegio_id: 'c1', activo: true } } : u.pathname.startsWith('/rest/v1/') ? { json: [] } : null));
    const p = await c.newPage();
    const errores = [];
    p.on('pageerror', (e) => errores.push(String(e)));
    const ir = async (r) => { await p.goto(new URL(r, URL_APP).href); await p.waitForLoadState('networkidle'); };

    await ir('/docente');
    comprobar(await p.getByText('Primeros pasos').isVisible(), `${ancho}: Inicio muestra Primeros pasos`);
    await p.getByRole('link', { name: /^Biblioteca/ }).first().click();
    await p.waitForURL(/\/docente\/biblioteca$/);
    comprobar(true, `${ancho}: Inicio lleva a la biblioteca`);
    await p.waitForSelector('a[href$="/doc/mission-stars"]');
    comprobar(await p.getByText(/La historia: .+/).isVisible() && (await p.locator('a[href*="/docente/biblioteca/doc/"]').count()) === 4, `${ancho}: la portada toma la historia y los fundamentos de la cartilla`);
    await p.screenshot({ path: `${CAPTURAS}/bib-${ancho}-inicio.png`, fullPage: true });

    await ir('/docente/biblioteca/historia');
    const escenas = await p.locator('.bib-escena').count();
    comprobar(escenas === 7, `${ancho}: historia con 7 escenas (${escenas})`);
    const tituloEs = await p.locator('.bib-escena h2').first().textContent();
    await p.getByRole('button', { name: 'English' }).click();
    const tituloEn = await p.locator('.bib-escena h2').first().textContent();
    comprobar(tituloEs !== tituloEn, `${ancho}: cambia a inglés (${tituloEn})`);
    comprobar(!(await desborda(p)), `${ancho}: historia sin desborde`);
    await p.screenshot({ path: `${CAPTURAS}/bib-${ancho}-historia.png` });
    await p.getByRole('button', { name: 'Proyectar' }).click();
    await p.getByRole('button', { name: 'Siguiente' }).click();
    comprobar(await p.getByText('2 de 7').isVisible(), `${ancho}: telón avanza`);
    await p.screenshot({ path: `${CAPTURAS}/bib-${ancho}-telon.png` });
    await p.getByRole('button', { name: 'Terminar' }).click();

    await ir('/docente/biblioteca/recursos');
    const temas = await p.locator('.bib-tema').count();
    comprobar(temas >= 15, `${ancho}: recursos con ${temas} temas`);
    comprobar(await p.locator('.bib-enlaces a').count() > 10, `${ancho}: hay fichas y juegos enlazados`);
    comprobar(!(await desborda(p)), `${ancho}: recursos sin desborde`);
    // Videos de YouTube dentro de la página: miniatura primero; al tocarla, el reproductor.
    const portadas = await p.locator('.bib-video__portada').count();
    comprobar(portadas >= 10 && !(await p.locator('.bib-video iframe').count()), `${ancho}: ${portadas} videos como miniatura, sin cargar reproductores`);
    await p.locator('.bib-video__portada').first().click();
    const src = await p.locator('.bib-video iframe').first().getAttribute('src');
    comprobar(/^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]+\?autoplay=1/.test(src ?? ''), `${ancho}: al tocar, el video se ve aquí (${src})`);
    comprobar(!(await desborda(p)), `${ancho}: video abierto sin desborde`);
    await p.screenshot({ path: `${CAPTURAS}/bib-${ancho}-video.png` });
    await p.screenshot({ path: `${CAPTURAS}/bib-${ancho}-recursos.png` });

    await ir('/docente/biblioteca/actividades');
    const todas = await p.locator('.bib-actividad').count();
    comprobar(todas === 20, `${ancho}: 20 actividades (${todas})`);
    await p.locator('select').first().selectOption({ index: 1 });
    const filtradas = await p.locator('.bib-actividad').count();
    comprobar(filtradas > 0 && filtradas < todas, `${ancho}: filtro por nivel (${filtradas})`);
    comprobar(await p.locator('.bib-fases script, .bib-fases [onclick]').count() === 0, `${ancho}: fases saneadas`);
    comprobar(!(await desborda(p)), `${ancho}: actividades sin desborde`);
    await p.screenshot({ path: `${CAPTURAS}/bib-${ancho}-actividades.png` });

    for (const d of ['niveles', 'mission-stars', 'fundamentacion', 'referencias']) {
      await ir(`/docente/biblioteca/doc/${d}`);
      const n = await p.locator('.bib-doc p, .bib-doc li').count();
      comprobar(n > 5 && !(await desborda(p)), `${ancho}: documento ${d} (${n} bloques)`);
    }
    await p.screenshot({ path: `${CAPTURAS}/bib-${ancho}-doc.png` });

    await ir('/docente/mas');
    comprobar(await p.getByRole('link', { name: /Biblioteca/ }).isVisible(), `${ancho}: Más tiene Biblioteca`);
    comprobar(errores.length === 0, `${ancho}: sin errores (${errores.join(' | ')})`);
    await c.close();
  }
} finally {
  await nav.close();
  servidor.kill();
}
console.log(fallos.length ? `\n${fallos.length} fallas` : '\ntodo bien');
process.exit(fallos.length ? 1 : 0);
