// "Mi mes": calendario del docente a 390 y 1280 con Supabase simulado. Ve las clases del plan del
// grupo, el festivo, arma el mes (salta festivos y días ocupados), pone fecha a una planeación y
// muestra "Hoy" en Inicio. Uso: `npm run build`, luego `node scripts/pruebas/calendario.mjs`.
import { chromium, servir, URL_APP, CAPTURAS, LLAVE_ADULTO, sesionAdulto, simularSupabase } from './comun.mjs';

const fallos = [];
const comprobar = (ok, texto) => { console.log(ok ? 'bien ' : 'FALLA', texto); if (!ok) fallos.push(texto); };
const url = (r) => new URL(r, URL_APP).href;
const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
const PLAN = { id: 'pa1', creada: '2026-11-26T15:00:00.000Z', cartilla: 'ingles-3', tema: 'colores', nombreTema: 'Colores', duracion: 55, actividades: ['bingo'] };
const PLAN_HOY = { ...PLAN, id: 'pa2', nombreTema: 'Números', fecha: hoy };

async function abrir(navegador, ancho) {
  const c = await navegador.newContext({ viewport: { width: ancho, height: 900 }, reducedMotion: 'reduce', serviceWorkers: 'block', locale: 'es-CO' });
  await c.addInitScript(([k, v, planes]) => {
    if (sessionStorage.sembrado) return;
    localStorage.setItem(k, v);
    localStorage.setItem('cuaderno.mis-planeaciones', JSON.stringify(planes));
    sessionStorage.sembrado = '1';
  }, [LLAVE_ADULTO, JSON.stringify(sesionAdulto('docente', { perfil: { rol: 'docente', nombre: 'Ana', colegio_id: 'c1' } })), [PLAN, PLAN_HOY]]);
  const guardados = [];
  let plan = [{ grupo_id: 'g1', cartilla_id: 'ingles-3', tema_id: 'p1-1', clase1: '2026-12-02', clase2: '2026-12-07', estado: 'por-hacer' }];
  await simularSupabase(c, (u, q) => {
    const p = u.pathname;
    if (p === '/rest/v1/rpc/mis_codigos') return { json: [{ grupo_id: 'g1', codigo: 'ABC123' }] };
    if (p === '/rest/v1/grupos') return { json: [{ id: 'g1', nombre: '3B', grado: '3°', colegio_id: 'c1', cartilla_id: 'ingles-3' }] };
    if (p === '/rest/v1/planes_tema' && q.method() === 'POST') {
      const fila = JSON.parse(q.postData());
      guardados.push(fila);
      plan = [...plan.filter((x) => x.tema_id !== fila.tema_id), fila];
      return { json: [fila] };
    }
    if (p === '/rest/v1/planes_tema') return { json: plan };
    return null;
  });
  const pg = await c.newPage();
  const errores = [];
  pg.on('pageerror', (e) => errores.push(String(e)));
  pg.on('console', (m) => m.type() === 'error' && !/Failed to load resource|ERR_FAILED/.test(m.text()) && errores.push(m.text()));
  return { c, p: pg, errores, guardados };
}
const desborda = (p) => p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

const servidor = await servir();
const navegador = await chromium.launch();
try {
  for (const ancho of [1280, 390]) {
    const { c, p, errores, guardados } = await abrir(navegador, ancho);
    await p.goto(url('/docente'));
    await p.waitForSelector('h1:has-text("Inicio")');
    await p.waitForSelector('.panel:has-text("Hoy ·")');
    comprobar((await p.locator('.panel', { hasText: 'Hoy ·' }).innerText()).includes('Números'), `${ancho}: Inicio muestra la planeación de hoy`);

    await p.goto(url('/docente/calendario/2026-12'));
    await p.waitForSelector('.mes__celda');
    comprobar((await p.locator('h1').innerText()).includes('Diciembre 2026'), `${ancho}: título del mes`);
    comprobar((await p.locator('.mes__semana').count()) === 5, `${ancho}: 5 semanas en diciembre de 2026`);
    if (ancho >= 1024) {
      comprobar(await p.locator('.mes__festivo:has-text("Inmaculada")').isVisible(), `${ancho}: festivo del 8 de diciembre`);
      comprobar((await p.locator('.mes-item').count()) === 2, `${ancho}: las dos clases del plan en el mes`);
      comprobar(await p.locator('nav.pestanas a:visible', { hasText: 'Mi mes' }).count() === 1, `${ancho}: Mi mes en el menú lateral`);
    } else {
      comprobar((await p.locator('.mes__puntos:visible').count()) === 2, `${ancho}: puntos en los días con clase`);
    }
    // Armar el mes: lunes y miércoles, dos clases por tema.
    await p.getByRole('button', { name: 'Armar el mes' }).click();
    await p.waitForSelector('.armar-mes__vista li');
    const vista = await p.locator('.armar-mes__vista li').allInnerTexts();
    comprobar(vista.length === 3, `${ancho}: arma 3 temas con 7 días libres (${vista.length})`);
    comprobar(!/\b[28] de diciembre/.test(vista.join(' ')), `${ancho}: salta el festivo y los días ya ocupados`);
    await p.getByRole('button', { name: /Poner 3 temas/ }).click();
    await p.waitForSelector('.mensaje--ok');
    comprobar(guardados.length === 3 && guardados[0].tema_id === 'p1-2' && guardados[0].clase1 === '2026-12-09' && guardados[0].clase2 === '2026-12-14', `${ancho}: guarda los temas que siguen con sus fechas (${JSON.stringify(guardados[0])})`);
    await p.waitForTimeout(300);
    if (ancho >= 1024) comprobar((await p.locator('.mes-item').count()) === 8, `${ancho}: el mes muestra las clases nuevas`);
    // Poner fecha a la planeación sin fecha.
    const bandeja = p.locator('.panel', { hasText: 'Sin fecha' });
    await bandeja.getByRole('button', { name: 'Poner fecha' }).click();
    await bandeja.locator('input[type=date]').fill('2026-12-10');
    await bandeja.getByRole('button', { name: 'Listo' }).click();
    const fecha = await p.evaluate(() => JSON.parse(localStorage.getItem('cuaderno.mis-planeaciones')).find((x) => x.id === 'pa1').fecha);
    comprobar(fecha === '2026-12-10', `${ancho}: la planeación queda con fecha (${fecha})`);
    if (ancho >= 1024) comprobar(await p.locator('.mes-item--plan:has-text("Colores")').isVisible(), `${ancho}: la planeación aparece en su día`);
    comprobar(!(await desborda(p)), `${ancho}: sin desborde`);
    await p.screenshot({ path: `${CAPTURAS}/mi-mes-${ancho}.png`, fullPage: true });
    comprobar(errores.length === 0, `${ancho}: sin errores ${errores.join(' | ')}`);
    await c.close();
  }
} finally {
  await navegador.close();
  servidor.kill();
}
console.log(fallos.length ? `\n${fallos.length} fallas` : '\nTodo bien');
process.exit(fallos.length ? 1 : 0);
