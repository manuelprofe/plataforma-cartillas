// Identidad del colegio y formato único de la planeación: el coordinador sube escudo y colores;
// el planeador del docente sale con membrete (escudo, nombre, colores), columna "Sin proyector" y
// pie con adaptaciones y firma; se descarga en Word (.docx) válido, de una hoja para 55 min.
// Uso: `npm run build`, luego `node scripts/pruebas/planeacion-colegio.mjs`.
import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { chromium, servir, URL_APP, CAPTURAS, LLAVE_ADULTO, sesionAdulto, simularSupabase } from './comun.mjs';

const fallos = [];
const comprobar = (ok, texto) => { console.log(ok ? 'bien ' : 'FALLA', texto); if (!ok) fallos.push(texto); };
const url = (r) => new URL(r, URL_APP).href;
const sinDesborde = (p) => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

// Un escudo de prueba: PNG de 40 × 48 hecho con el navegador.
const servidor = await servir();
const nav = await chromium.launch();
const errores = [];
try {
  const hoja = await nav.newPage();
  const escudo = await hoja.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 40; c.height = 48;
    const g = c.getContext('2d');
    g.fillStyle = '#0b6e4f'; g.fillRect(0, 0, 40, 48);
    g.fillStyle = '#ffd23f'; g.fillRect(10, 10, 20, 28);
    return c.toDataURL('image/png');
  });
  await hoja.close();
  const COLEGIO = { nombre: 'I.E. Jorge Barco Mora', escudo, color_1: '#0b6e4f', color_2: '#ffd23f' };

  // ---- Coordinador: escudo y colores en Cuenta.
  {
    const c = await nav.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', locale: 'es-CO' });
    await c.addInitScript(([k, v]) => localStorage.setItem(k, v), [LLAVE_ADULTO, JSON.stringify(sesionAdulto('coordinador', { perfil: { rol: 'coordinador', nombre: 'Coord', colegio_id: 'c1' } }))]);
    let guardado = null;
    await simularSupabase(c, (u, q) => {
      if (u.pathname === '/rest/v1/rpc/mi_perfil') return { json: { rol: 'coordinador', nombre: 'Coord', colegio_id: 'c1', activo: true } };
      if (u.pathname === '/rest/v1/colegios') return { json: [{ nombre: COLEGIO.nombre, escudo: null, color_1: null, color_2: null }] };
      if (u.pathname === '/rest/v1/rpc/identidad_colegio') { guardado = JSON.parse(q.postData()); return { json: null }; }
      if (u.pathname.startsWith('/rest/v1/')) return { json: [] };
      return null;
    });
    const p = await c.newPage();
    p.on('pageerror', (e) => errores.push(String(e)));
    await p.goto(url('/colegio/cuenta'));
    await p.waitForSelector('text=Escudo y colores del colegio');
    await p.waitForSelector(`.identidad-muestra >> text=${COLEGIO.nombre}`);
    writeFileSync(`${CAPTURAS}/escudo-prueba.png`, Buffer.from(escudo.split(',')[1], 'base64'));
    await p.locator('.identidad-subir input').setInputFiles(`${CAPTURAS}/escudo-prueba.png`);
    await p.waitForSelector('.identidad-muestra img');
    await p.locator('.identidad-color input').first().fill('#0b6e4f');
    await p.getByRole('button', { name: 'Guardar escudo y colores' }).click();
    await p.waitForSelector('text=Guardado. Las planeaciones ya salen así.');
    comprobar(guardado?.p_colegio === 'c1' && guardado.p_escudo?.startsWith('data:image/png;base64,') && guardado.p_color_1 === '#0b6e4f' && /^#[0-9a-f]{6}$/.test(guardado.p_color_2), 'el coordinador guarda escudo (PNG) y colores de su colegio');
    comprobar(await sinDesborde(p), 'Cuenta del coordinador a 390 px sin desborde');
    await p.screenshot({ path: `${CAPTURAS}/identidad-390.png`, fullPage: true });
    await c.close();
  }

  // ---- Docente: planeador con membrete y Word.
  for (const ancho of [390, 1280]) {
    const c = await nav.newContext({ viewport: { width: ancho, height: 900 }, serviceWorkers: 'block', locale: 'es-CO', acceptDownloads: true });
    await c.addInitScript(([k, v]) => localStorage.setItem(k, v), [LLAVE_ADULTO, JSON.stringify(sesionAdulto('docente', { perfil: { rol: 'docente', nombre: 'Profe Prueba', colegio_id: 'c1' } }))]);
    await simularSupabase(c, (u, q) => {
      if (u.pathname === '/rest/v1/rpc/mi_perfil') return { json: { rol: 'docente', nombre: 'Profe Prueba', colegio_id: 'c1', activo: true } };
      if (u.pathname === '/rest/v1/colegios') return { json: [COLEGIO] };
      if (u.pathname === '/rest/v1/cartillas') return { json: [{ materia: 'Inglés', grado: '3' }] };
      if (u.pathname === '/rest/v1/grupos' && q.method() === 'GET') return { json: [{ id: 'g1', nombre: '3B', grado: '3°', colegio_id: 'c1', codigo: 'K7M2P' }] };
      if (u.pathname.startsWith('/rest/v1/')) return { json: [] };
      return null;
    });
    const p = await c.newPage();
    p.on('pageerror', (e) => errores.push(String(e)));
    await p.goto(url('/docente/planear/colores'));
    await p.waitForSelector(`.plan-membrete >> text=${COLEGIO.nombre}`);
    comprobar((await p.locator('.plan-membrete img').count()) >= 1, `${ancho}: el planeador muestra el escudo del colegio`);
    const fondo = await p.locator('.plan-clase thead th').first().evaluate((e) => getComputedStyle(e).backgroundColor).catch(() => '');
    comprobar(ancho < 720 || fondo === 'rgb(11, 110, 79)', `${ancho}: la tabla lleva el color del colegio (${fondo || 'oculta en celular'})`);
    comprobar((await p.locator('.plan-pie th', { hasText: 'Firma del docente' }).count()) >= 1 && (await p.locator('.plan-pie th', { hasText: 'Adaptaciones' }).count()) >= 1, `${ancho}: el pie trae adaptaciones y firma`);
    comprobar((await p.locator('td[data-etiqueta="Sin proyector"]').count()) > 3, `${ancho}: columna Sin proyector`);
    comprobar(await sinDesborde(p), `${ancho}: planeador sin desborde`);
    await p.screenshot({ path: `${CAPTURAS}/planeador-colegio-${ancho}.png` });

    if (ancho === 1280) {
      const [descarga] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Descargar en Word' }).first().click()]);
      const ruta = `${CAPTURAS}/planeador.docx`;
      await descarga.saveAs(ruta);
      comprobar(descarga.suggestedFilename().endsWith('.docx'), `se descarga ${descarga.suggestedFilename()}`);
      const info = execSync(`python3 -c "import docx,sys; d=docx.Document(sys.argv[1]); t=d.tables; print(len(t)); print(len(d.inline_shapes)); print(' '.join(c.text for c in t[0].rows[0].cells))" "${ruta}"`).toString().split('\n');
      comprobar(Number(info[0]) === 5 && Number(info[1]) === 1 && info[2].includes(COLEGIO.nombre), `el Word abre: 5 tablas, el escudo y el nombre del colegio (${info.slice(0, 3).join(' | ')})`);
      execSync(`cd "${CAPTURAS}" && soffice --headless --convert-to pdf planeador.docx >/dev/null 2>&1`);
      const paginas = Number(/Pages:\s+(\d+)/.exec(execSync(`pdfinfo "${CAPTURAS}/planeador.pdf"`).toString())[1]);
      comprobar(paginas <= 2, `el Word del planeador ocupa ${paginas} hoja(s) carta`);
      execSync(`pdftoppm -png -r 60 -f 1 -l 1 "${CAPTURAS}/planeador.pdf" "${CAPTURAS}/planeador-word"`);

      // Duraciones fijas: 45, 55 y 90 min; los minutos se reparten y siempre suman el total.
      const sumaMin = () => p.locator('.plan-clase').first().evaluate((t) => [...t.querySelectorAll('td.plan-min')].reduce((a, td) => a + parseInt(td.textContent), 0));
      const durCelda = () => p.locator('.plan-celda', { hasText: 'Duración' }).first().textContent();
      for (const d of [45, 90, 55]) {
        await p.getByRole('button', { name: `${d} min` }).first().click();
        const suma = await sumaMin();
        const trans = Number(/incluye (\d+)/.exec(await durCelda())?.[1] ?? 0);
        comprobar((await durCelda()).includes(`${d} min`) && suma + trans === d, `duración ${d}: la celda dice ${d} min y los momentos suman ${suma} + ${trans} de transiciones`);
        if (d === 90) {
          const [dl] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Descargar en Word' }).first().click()]);
          await dl.saveAs(`${CAPTURAS}/planeador-90.docx`);
          const t = execSync(`python3 -c "import docx,sys; d=docx.Document(sys.argv[1]); print(' '.join(c.text for r in d.tables[1].rows for c in r.cells))" "${CAPTURAS}/planeador-90.docx"`).toString();
          comprobar(t.includes('90 min'), 'duración 90: el Word también dice 90 min');
        }
      }
      comprobar(await p.evaluate(() => localStorage.getItem('cuaderno.duracion-clase')) === '55', 'la duración elegida se recuerda en el aparato');
      // Impreso desde la hoja del material (botón Imprimir), con la duración guardada.
      for (const d of [45, 90]) {
        await p.evaluate((v) => localStorage.setItem('cuaderno.duracion-clase', String(v)), d);
        for (const id of ['colores-planeador-1', 'colores-planeador-2']) {
          await p.goto(url(`/docente/temas/colores/${id}`));
          await p.waitForSelector('.mat-pantalla h1');
          await p.getByRole('button', { name: 'Imprimir' }).click();
          await p.emulateMedia({ media: 'print' });
          await p.pdf({ path: `${CAPTURAS}/${id}-${d}.pdf`, format: 'Letter', preferCSSPageSize: true });
          await p.emulateMedia({ media: 'screen' });
          const pg = Number(/Pages:\s+(\d+)/.exec(execSync(`pdfinfo "${CAPTURAS}/${id}-${d}.pdf"`).toString())[1]);
          const txt = execSync(`pdftotext -layout "${CAPTURAS}/${id}-${d}.pdf" -`).toString();
          comprobar(pg <= (d === 90 ? 2 : 1) && txt.includes(`${d} min`), `${id} a ${d} min: impreso en ${pg} hoja(s) y dice ${d} min`);
        }
      }
      await p.evaluate(() => localStorage.removeItem('cuaderno.duracion-clase'));
    } else {
      const toque = await p.locator('.plan-duracion button').evaluateAll((bs) => Math.min(...bs.map((b) => b.getBoundingClientRect().height)));
      comprobar(toque >= 48, `${ancho}: botones de duración de ${toque} px de alto`);
    }
    await c.close();
  }
  comprobar(errores.length === 0, `sin errores (${errores.join(' | ')})`);
} finally {
  await nav.close();
  servidor.kill();
}
console.log(fallos.length ? `\n${fallos.length} fallas` : '\ntodo bien');
process.exit(fallos.length ? 1 : 0);
