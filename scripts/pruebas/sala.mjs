// Sala de juegos, armador de juegos y temas del año del docente, a 390 × 844 con Supabase simulado.
// Criterios (27 nov, Manuel): todos los juegos de las cartillas en un solo lugar, filtrables; el
// docente arma un juego con palabras del banco y lo juega sin tocar el progreso de ningún niño;
// Planear muestra los temas de las tres materias de transición a 5.°.
// Uso: `npm run build`, luego `node scripts/pruebas/sala.mjs`.
import { chromium, servir, URL_APP, CAPTURAS, LLAVE_ADULTO, sesionAdulto, simularSupabase } from './comun.mjs';

const fallos = [];
const comprobar = (ok, texto) => { console.log(ok ? 'bien ' : 'FALLA', texto); if (!ok) fallos.push(texto); };
const url = (r) => new URL(r, URL_APP).href;
const foto = (p, n) => p.screenshot({ path: `${CAPTURAS}/sala-${n}.png`, fullPage: true });

const servidor = await servir();
const navegador = await chromium.launch();
try {
  const c = await navegador.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block', locale: 'es-CO' });
  await c.addInitScript(([k, v]) => { if (!sessionStorage.sembrado) { localStorage.setItem(k, v); sessionStorage.sembrado = '1'; } }, [LLAVE_ADULTO, JSON.stringify(sesionAdulto('docente', { perfil: { rol: 'docente', nombre: 'Profe Prueba', colegio_id: 'c1' } }))]);
  await simularSupabase(c, (u, q) => {
    if (u.pathname === '/rest/v1/grupos' && q.method() === 'GET') return { json: [{ id: 'g1', nombre: '3B', grado: '3°', colegio_id: 'c1', cartilla_id: 'ingles-3' }] };
    if (u.pathname === '/rest/v1/rpc/mis_codigos') return { json: [{ grupo_id: 'g1', codigo: 'K7M2P' }] };
    if (u.pathname === '/rest/v1/cartillas') return { json: [{ id: 'ingles-3', titulo: 'El Cuaderno de Goma', materia: 'Inglés', grado: '3' }] };
    if (u.pathname === '/rest/v1/estudiantes') return { json: [] };
    if (u.pathname === '/rest/v1/planes_tema') return { json: [] };
    return null;
  });
  const p = await c.newPage();
  const errores = [];
  p.on('pageerror', (e) => errores.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|ERR_FAILED/.test(m.text()) && errores.push(m.text()));

  // 1. La pestaña Juegos abre la sala con las cartillas jugables.
  await p.goto(url('/docente'));
  await p.click('.pestanas >> text=Juegos');
  await p.waitForSelector('.sala-juego');
  const secciones = await p.locator('.sala-cartilla__titulo').allTextContents();
  comprobar(secciones.some((s) => s.includes('Matemáticas')) && secciones.some((s) => s.includes('Español')) && secciones.some((s) => s.includes('Inglés')), `la sala trae las tres materias (${secciones.length} cartillas)`);
  const total = await p.locator('.sala-rejilla .sala-juego').count();
  comprobar(total > 40, `muestra todos los juegos (${total})`);
  await foto(p, '1-sala');

  // 2. Filtros: materia y tipo de juego.
  await p.click('.sala-chips[aria-label="Materia"] >> text=Matemáticas');
  const soloMate = await p.locator('.sala-cartilla__titulo').allTextContents();
  comprobar(soloMate.length > 0 && soloMate.every((s) => s.includes('Matemáticas')), 'filtra por materia');
  await p.click('.sala-chips[aria-label="Tipo de juego"] >> text=Plataformas');
  const tipos = await p.locator('.sala-juego__tipo').allTextContents();
  comprobar(tipos.length > 0 && tipos.every((t) => t.startsWith('Plataformas')), `filtra por tipo (${tipos.length})`);
  const ancho = await p.evaluate(() => document.documentElement.scrollWidth);
  comprobar(ancho <= 390, `sin desborde a 390 px (${ancho})`);

  // 3. Un juego de la sala abre en pantalla completa y salir vuelve a la sala.
  await p.locator('.sala-juego').first().click();
  await p.waitForURL(/\/jugar\/matematicas-0\//);
  await p.waitForSelector('.mision, main', { timeout: 10000 });
  await p.waitForTimeout(800);
  await foto(p, '2-jugar');
  const progreso = await p.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('pc_') && !k.startsWith('pc_cola')));
  comprobar(!progreso.some((k) => k.includes('prueba')), `jugar en la sala no guarda progreso (${progreso.join(',') || 'nada'})`);
  await p.goBack();
  await p.waitForSelector('.sala-juego');

  // 4. Armar un juego: inglés 3, memoria, 4 palabras.
  await p.click('text=Armar un juego >> nth=0');
  await p.waitForSelector('.armar-juego');
  await p.click('.armar-juego .sala-chip >> text=Inglés · 3.°');
  await p.waitForSelector('.palabra-chip');
  await p.click('.armar-actividad >> text=Memoria');
  for (const i of [0, 1, 2, 3]) await p.locator('.palabra-chip').nth(i).click();
  await p.fill('#nombre-juego', 'Memoria de los útiles');
  await foto(p, '3-armar');
  await p.click('text=Guardar en Mis juegos');
  await p.waitForSelector('.sala-listo');
  comprobar((await p.locator('.sala-mios .sala-juego__titulo').allTextContents()).includes('Memoria de los útiles'), 'el juego queda en Mis juegos');
  await p.click('.sala-listo >> text=Jugar ahora');
  await p.waitForURL(/\/jugar\/ingles-3\/propio-/);
  await p.waitForTimeout(1200);
  const cartas = await p.locator('.memoria, [class*="memoria"]').count();
  comprobar(cartas > 0, 'el juego propio abre con la plantilla de memoria');
  await foto(p, '4-propio');
  const cola = await p.evaluate(() => localStorage.getItem('pc_cola_v1'));
  comprobar(!cola, 'nada sube a la nube desde la sala');

  // 5. Planear: temas del año de cualquier materia y grado; la ficha lleva al armador con el tema puesto.
  await p.goto(url('/docente/planear'));
  await p.waitForSelector('text=Temas del año');
  await p.click('.elegir-pensum >> text=Matemáticas');
  await p.click('.elegir-pensum >> text=5.°');
  await p.waitForSelector('text=Matemáticas · 5.° · Periodo 1');
  const periodos = await p.locator('.panel__titulo, h2').filter({ hasText: 'Matemáticas · 5.° · Periodo' }).count();
  comprobar(periodos === 4, `matemáticas 5.° trae sus 4 periodos (${periodos})`);
  await foto(p, '5-temas');
  await p.locator('a.fila[href*="/docente/planear/tema/matematicas-5/"]').first().click();
  await p.waitForSelector('text=Armar la clase de este tema');
  comprobar(await p.locator('text=Desempeños').count() > 0, 'la ficha del tema trae sus desempeños');
  const temaFicha = await p.locator('h1').textContent();
  await p.click('text=Armar la clase de este tema');
  await p.waitForSelector('text=4. Tema');
  const puesto = await p.locator('.armar-temas .boton[aria-pressed="true"]').allTextContents();
  comprobar(puesto.length === 1 && puesto[0].includes(temaFicha.trim()), `el armador llega con el tema puesto (${puesto.join()})`);

  // 6. Español transición también se ve.
  await p.goto(url('/docente/planear'));
  await p.click('.elegir-pensum >> text=Español');
  await p.click('.elegir-pensum >> text=Transición');
  await p.waitForSelector('text=Español · Transición · Periodo 1');
  comprobar(true, 'español transición aparece en Planear');

  comprobar(errores.length === 0, `sin errores en consola${errores.length ? `: ${errores.join(' | ')}` : ''}`);
} finally {
  await navegador.close();
  servidor.kill();
}
console.log(fallos.length ? `\n${fallos.length} fallas` : '\nTodo bien');
process.exit(fallos.length ? 1 : 0);
