// Armador de planeaciones: el docente elige duración, cuántas actividades, tema y actividades;
// sale la planeación en el formato único (pantalla, impresión y Word) y queda en Mis planeaciones.
// Uso: `npm run build`, luego `node scripts/pruebas/armador.mjs`.
import { execSync } from 'node:child_process';
import { chromium, servir, URL_APP, CAPTURAS, LLAVE_ADULTO, sesionAdulto, simularSupabase } from './comun.mjs';

const fallos = [];
const comprobar = (ok, texto) => { console.log(ok ? 'bien ' : 'FALLA', texto); if (!ok) fallos.push(texto); };
const url = (r) => new URL(r, URL_APP).href;
const paginas = (ruta) => Number(/Pages:\s+(\d+)/.exec(execSync(`pdfinfo "${ruta}"`).toString())[1]);

const servidor = await servir();
const nav = await chromium.launch();
const errores = [];
try {
  for (const ancho of [390, 1280]) {
    const c = await nav.newContext({ viewport: { width: ancho, height: 900 }, serviceWorkers: 'block', locale: 'es-CO', acceptDownloads: true });
    await c.addInitScript(([k, v]) => localStorage.setItem(k, v), [LLAVE_ADULTO, JSON.stringify(sesionAdulto('docente', { perfil: { rol: 'docente', nombre: 'Profe Prueba', colegio_id: 'c1' } }))]);
    await simularSupabase(c, (u) => {
      if (u.pathname === '/rest/v1/rpc/mi_perfil') return { json: { rol: 'docente', nombre: 'Profe Prueba', colegio_id: 'c1', activo: true } };
      if (u.pathname === '/rest/v1/colegios') return { json: [{ nombre: 'I.E. Jorge Barco Mora', escudo: null, color_1: '#0b6e4f', color_2: '#ffd23f' }] };
      if (u.pathname.startsWith('/rest/v1/')) return { json: [] };
      return null;
    });
    const p = await c.newPage();
    p.on('pageerror', (e) => errores.push(String(e)));
    await p.goto(url('/docente/planear'));
    await p.getByRole('link', { name: 'Armar mi planeación' }).click();
    await p.waitForSelector('text=1. Duración de la clase');
    const medir = () => p.evaluate(() => ({
      desborde: document.documentElement.scrollWidth > innerWidth + 1,
      toque: Math.min(...[...document.querySelectorAll('main button, main a')].filter((b) => b.offsetParent).map((b) => b.getBoundingClientRect().height)),
    }));
    const armar = async (d, n) => {
      await p.getByRole('group', { name: 'Duración de la clase' }).getByRole('button', { name: `${d} min` }).click();
      await p.getByRole('group', { name: 'Cuántas actividades' }).getByRole('button', { name: String(n), exact: true }).click();
      await p.getByRole('group', { name: 'Temas con láminas' }).getByRole('button', { name: 'Colores' }).click();
      await p.getByRole('button', { name: 'Usar las sugeridas' }).click();
    };
    // Validación: sin tema no arma.
    await p.getByRole('button', { name: 'Armar planeación' }).click();
    comprobar(await p.locator('text=Elija el tema de la clase.').count() === 1, `${ancho}: sin tema pide elegirlo`);
    await armar(90, 3);
    comprobar(await p.locator('.armar-actividad[aria-pressed="true"]').count() === 3, `${ancho}: "Usar las sugeridas" marca 3 actividades`);
    comprobar(await p.locator('.armar-actividad:disabled').count() > 5, `${ancho}: con 3 elegidas, las demás quedan bloqueadas`);
    comprobar(await p.locator('.armar-actividad', { hasText: 'Stop' }).count() === 1, `${ancho}: en 3.° aparece Stop (desde 2.°)`);
    comprobar(await p.locator('.armar-actividad', { hasText: 'Simón dice' }).count() === 1 && await p.locator('.armar-actividad').count() === 14, `${ancho}: las 14 actividades, con Simón dice`);
    const m = await medir();
    comprobar(!m.desborde && m.toque >= 48, `${ancho}: armador sin desborde, toque mínimo ${Math.round(m.toque)}`);
    await p.screenshot({ path: `${CAPTURAS}/armador-${ancho}.png`, fullPage: true });
    await p.getByRole('button', { name: 'Armar planeación' }).click();
    await p.waitForURL(/\/docente\/planear\/armar\/p/);
    await p.waitForSelector('.plan-membrete');
    const suma = await p.locator('.plan-clase').first().evaluate((t) => [...t.querySelectorAll('td.plan-min')].reduce((a, td) => a + parseInt(td.textContent), 0));
    const dur = await p.locator('.plan-celda', { hasText: 'Duración' }).first().textContent();
    const trans = Number(/incluye (\d+)/.exec(dur)?.[1] ?? 0);
    comprobar(dur.includes('90 min') && suma + trans === 90, `${ancho}: la planeación dura 90 min (${suma} + ${trans})`);
    const texto = await p.locator('.plan-clase').first().textContent();
    comprobar(/Simón dice/.test(texto) && /Bingo de láminas/.test(texto) && /Apertura/.test(texto) && /Cierre/.test(texto), `${ancho}: trae apertura, las actividades elegidas y cierre`);
    comprobar(/red, blue/.test(texto), `${ancho}: las actividades se llenan con las palabras del tema`);
    comprobar(await p.locator('.plan-duracion').count() === 0, `${ancho}: la planeación armada no cambia de duración`);
    comprobar(await p.locator('td[data-etiqueta="Recursos"]', { hasText: 'Con proyector' }).count() >= 3, `${ancho}: cada actividad trae su versión con proyector`);
    const m2 = await medir();
    comprobar(!m2.desborde, `${ancho}: planeación armada sin desborde`);
    await p.screenshot({ path: `${CAPTURAS}/armada-${ancho}.png` });


    if (ancho === 1280) {
      const [dl] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Descargar en Word' }).first().click()]);
      await dl.saveAs(`${CAPTURAS}/armada.docx`);
      execSync(`cd "${CAPTURAS}" && soffice --headless --convert-to pdf armada.docx >/dev/null 2>&1`);
      comprobar(paginas(`${CAPTURAS}/armada.pdf`) <= 2, `Word de 90 min con 3 actividades: ${paginas(`${CAPTURAS}/armada.pdf`)} hoja(s)`);
      await p.getByRole('button', { name: 'Imprimir' }).click();
      await p.emulateMedia({ media: 'print' });
      await p.pdf({ path: `${CAPTURAS}/armada-90.pdf`, format: 'Letter', preferCSSPageSize: true });
      await p.emulateMedia({ media: 'screen' });
      comprobar(paginas(`${CAPTURAS}/armada-90.pdf`) <= 2, `impresa (90 min, 3 actividades): ${paginas(`${CAPTURAS}/armada-90.pdf`)} hoja(s)`);
      // 55 min con 2: una hoja.
      await p.goto(url('/docente/planear/armar'));
      await armar(55, 2);
      await p.getByRole('button', { name: 'Armar planeación' }).click();
      await p.waitForSelector('.plan-membrete');
      await p.getByRole('button', { name: 'Imprimir' }).click();
      await p.emulateMedia({ media: 'print' });
      await p.pdf({ path: `${CAPTURAS}/armada-55.pdf`, format: 'Letter', preferCSSPageSize: true });
      await p.emulateMedia({ media: 'screen' });
      comprobar(paginas(`${CAPTURAS}/armada-55.pdf`) === 1, `impresa (55 min, 2 actividades): ${paginas(`${CAPTURAS}/armada-55.pdf`)} hoja`);
      await p.goto(url('/docente/planear'));
      await p.waitForSelector('.fila:has-text("Colores · 55 min")');
      comprobar(await p.locator('.fila', { hasText: 'Colores · 90 min' }).count() === 1 && await p.locator('.fila', { hasText: 'Colores · 55 min' }).count() === 1, 'Mis planeaciones lista las dos en Planear');
      await p.locator('.fila', { hasText: 'Colores · 90 min' }).click();
      await p.getByRole('button', { name: 'Borrar esta planeación' }).click();
      await p.waitForURL(/\/armar$/);
      comprobar(await p.locator('.fila', { hasText: 'Colores · 90 min' }).count() === 0, 'borrar quita la planeación de la lista');
    }
    // Tema del pensum de otra materia y grado: DBA y desempeños pasan solos.
    await p.goto(url('/docente/planear/armar'));
    await p.getByRole('group', { name: 'Materia' }).getByRole('button', { name: 'Matemáticas' }).click();
    await p.getByRole('group', { name: 'Grado' }).getByRole('button', { name: 'Transición' }).click();
    await p.waitForSelector('text=Periodo 4');
    comprobar(await p.getByRole('group', { name: 'Temas con láminas' }).count() === 0, `${ancho}: matemáticas transición no muestra los temas con láminas de inglés`);
    comprobar(await p.locator('.armar-temas .boton').count() === 8, `${ancho}: matemáticas transición trae sus 8 unidades`);
    comprobar(await p.locator('.armar-actividad', { hasText: 'Stop' }).count() === 0, `${ancho}: en transición no aparece Stop`);
    await p.getByRole('button', { name: 'U5 · Las familias del 10 al 100' }).click();
    await p.getByRole('button', { name: 'Usar las sugeridas' }).click();
    const m3 = await medir();
    comprobar(!m3.desborde && m3.toque >= 48, `${ancho}: armador con pensum sin desborde, toque mínimo ${Math.round(m3.toque)}`);
    await p.screenshot({ path: `${CAPTURAS}/armador-pensum-${ancho}.png`, fullPage: true });
    await p.getByRole('button', { name: 'Armar planeación' }).click();
    await p.waitForSelector('.plan-membrete');
    const hoja = await p.locator('main').textContent();
    comprobar(/Determina la cantidad de objetos/.test(hoja) && /T-3c/.test(hoja), `${ancho}: la planeación trae el DBA con su texto`);
    comprobar(/cuenta en voz alta hasta 100/.test(hoja), `${ancho}: la planeación trae los desempeños de la unidad`);
    comprobar(/Matemáticas/.test(hoja) && /Transición/.test(hoja), `${ancho}: encabezado con área y grado del pensum`);
    comprobar(!/Láminas impresas/.test(hoja), `${ancho}: sin láminas, la apertura no las pide`);
    await p.screenshot({ path: `${CAPTURAS}/armada-pensum-${ancho}.png`, fullPage: true });
    // Pensum del año en la Biblioteca.
    await p.goto(url('/docente/biblioteca'));
    await p.getByRole('link', { name: /Pensum del año/ }).click();
    await p.getByRole('group', { name: 'Materia' }).getByRole('button', { name: 'Español' }).click();
    await p.getByRole('group', { name: 'Grado' }).getByRole('button', { name: '1.°' }).click();
    await p.waitForSelector('text=Español · 1.°');
    comprobar(await p.locator('.pensum__unidad').count() === 12 && await p.locator('.pensum__periodo h3').count() === 5, `${ancho}: español 1.° muestra 12 unidades en 4 periodos y los DBA`);
    const m4 = await medir();
    comprobar(!m4.desborde && m4.toque >= 48, `${ancho}: pensum sin desborde, toque mínimo ${Math.round(m4.toque)}`);
    await p.screenshot({ path: `${CAPTURAS}/pensum-${ancho}.png` });
    await p.getByRole('group', { name: 'Materia' }).getByRole('button', { name: 'Inglés' }).click();
    await p.waitForSelector('text=Inglés · 1.°');
    comprobar(await p.locator('.pensum__unidad').count() === 4, `${ancho}: inglés 1.° muestra sus 4 periodos`);
    // Vuelve a dejar la cartilla de los grupos para lo que sigue.
    await p.getByRole('group', { name: 'Grado' }).getByRole('button', { name: '3.°' }).click();

    await c.close();
  }
  comprobar(errores.length === 0, `sin errores (${errores.join(' | ')})`);
} finally {
  await nav.close();
  servidor.kill();
}
console.log(fallos.length ? `\n${fallos.length} fallas` : '\ntodo bien');
process.exit(fallos.length ? 1 : 0);
