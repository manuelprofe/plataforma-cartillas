// Entregar la planeación al coordinador (migración 015), a 390 × 844 con Supabase simulado.
// El docente entrega una planeación armada y ve el estado; el coordinador la ve en el formato del
// colegio con el nombre del docente, pide ajustes con comentario o la marca como revisada.
// Uso: `npm run build`, luego `node scripts/pruebas/entregas.mjs`.
import { chromium, servir, URL_APP, CAPTURAS, LLAVE_ADULTO, sesionAdulto, simularSupabase } from './comun.mjs';

const fallos = [];
const comprobar = (ok, texto) => { console.log(ok ? 'bien ' : 'FALLA', texto); if (!ok) fallos.push(texto); };
const url = (r) => new URL(r, URL_APP).href;
const PLAN = { id: 'pa1', creada: '2026-11-26T15:00:00.000Z', cartilla: 'ingles-3', tema: 'colores', nombreTema: 'Colores', duracion: 55, actividades: ['bingo', 'simon'] };

async function contexto(navegador, rol, extra) {
  const c = await navegador.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block', locale: 'es-CO' });
  await c.addInitScript(([k, v, plan]) => {
    if (sessionStorage.sembrado) return;
    localStorage.setItem(k, v);
    if (plan) localStorage.setItem('cuaderno.mis-planeaciones', JSON.stringify([plan]));
    sessionStorage.sembrado = '1';
  }, [LLAVE_ADULTO, JSON.stringify(sesionAdulto(rol, { perfil: { rol, nombre: rol === 'docente' ? 'Ana Docente' : 'Coordinadora', colegio_id: 'c1' } })), rol === 'docente' ? PLAN : null]);
  const pedidos = await simularSupabase(c, extra);
  const p = await c.newPage();
  const errores = [];
  p.on('pageerror', (e) => errores.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|ERR_FAILED/.test(m.text()) && errores.push(m.text()));
  return { c, p, pedidos, errores };
}

const servidor = await servir();
const navegador = await chromium.launch();
try {
  // 1. Docente: entrega su planeación.
  let entregada = null;
  const d = await contexto(navegador, 'docente', (u, q) => {
    if (u.pathname === '/rest/v1/rpc/entregar_planeacion') { entregada = JSON.parse(q.postData()); return { json: null }; }
    if (u.pathname === '/rest/v1/entregas_planeacion') return { json: entregada ? [{ docente_id: 'u1', planeacion_id: 'pa1', docente_nombre: 'Ana Docente', titulo: 'Colores · 55 min', entregada: '2026-11-26T16:00:00Z', estado: 'ajustar', comentario: 'Falta el cierre con caritas', revisada: '2026-11-26T17:00:00Z' }] : [] };
    return null;
  });
  await d.p.goto(url('/docente/planear/armar/pa1'));
  await d.p.waitForSelector('.plan-membrete');
  await d.p.waitForSelector('.entrega');
  comprobar((await d.p.locator('.entrega h2').textContent()).includes('Entregar al coordinador'), 'la planeación ofrece entregarla');
  await d.p.locator('.entrega').getByRole('button', { name: 'Entregar', exact: true }).click();
  await d.p.waitForSelector('.entrega--ajustar');
  comprobar(entregada?.p_id === 'pa1' && entregada.p_datos.tema === 'colores' && !('uid' in entregada.p_datos) && !('nube' in entregada.p_datos), 'entrega una copia de la planeación sin marcas internas');
  comprobar((await d.p.locator('.entrega__comentario').textContent()).includes('Falta el cierre'), 'el docente ve el comentario del coordinador');
  comprobar(await d.p.evaluate(() => document.documentElement.scrollWidth) <= 390, 'sin desborde a 390 (docente)');
  await d.p.screenshot({ path: `${CAPTURAS}/entregas-docente.png`, fullPage: true });
  comprobar(d.errores.length === 0, `docente sin errores ${d.errores.join(' | ')}`);
  await d.c.close();

  // 2. Coordinador: ve la entrega, pide ajustes y la marca como revisada.
  const revisiones = [];
  const fila = { docente_id: 'u1', planeacion_id: 'pa1', docente_nombre: 'Ana Docente', titulo: 'Colores · 55 min', datos: PLAN, entregada: '2026-11-26T16:00:00Z', estado: 'por-revisar', comentario: null, revisada: null };
  const k = await contexto(navegador, 'coordinador', (u, q) => {
    if (u.pathname === '/rest/v1/entregas_planeacion') return { json: [fila] };
    if (u.pathname === '/rest/v1/rpc/revisar_planeacion') { revisiones.push(JSON.parse(q.postData())); return { json: null }; }
    return null;
  });
  await k.p.goto(url('/colegio'));
  await k.p.click('.pestanas >> text=Planeaciones');
  await k.p.waitForSelector('text=Por revisar (1)');
  comprobar((await k.p.locator('.fila', { hasText: 'Ana Docente' }).count()) >= 1, 'el coordinador ve la entrega y el resumen por docente');
  await k.p.screenshot({ path: `${CAPTURAS}/entregas-lista.png`, fullPage: true });
  await k.p.click('a.fila:has-text("Colores · 55 min")');
  await k.p.waitForSelector('.plan-membrete');
  comprobar((await k.p.locator('.plan-cab').first().innerText()).includes('Ana Docente'), 'el formato lleva el nombre del docente que la entregó');
  comprobar(await k.p.getByRole('button', { name: 'Descargar en Word' }).count() > 0, 'el coordinador la puede bajar en Word');
  await k.p.getByRole('button', { name: 'Pedir ajustes' }).click();
  comprobar((await k.p.locator('.revisar .mensaje--error').textContent()).includes('Escriba'), 'pedir ajustes sin comentario pide escribirlo');
  await k.p.fill('#comentario-revision', 'Falta el cierre con caritas');
  await k.p.getByRole('button', { name: 'Pedir ajustes' }).click();
  await k.p.waitForSelector('.revisar .mensaje--ok');
  await k.p.getByRole('button', { name: 'Marcar como revisada' }).click();
  await k.p.waitForTimeout(300);
  comprobar(revisiones.length === 2 && revisiones[0].p_estado === 'ajustar' && revisiones[0].p_comentario.includes('cierre') && revisiones[1].p_estado === 'revisada' && revisiones[1].p_docente === 'u1', 'las revisiones llegan a la base con docente, estado y comentario');
  comprobar(await k.p.evaluate(() => document.documentElement.scrollWidth) <= 390, 'sin desborde a 390 (coordinador)');
  await k.p.screenshot({ path: `${CAPTURAS}/entregas-revisar.png`, fullPage: true });
  comprobar(k.errores.length === 0, `coordinador sin errores ${k.errores.join(' | ')}`);
  await k.c.close();
} finally {
  await navegador.close();
  servidor.kill();
}
console.log(fallos.length ? `\n${fallos.length} fallas` : '\nTodo bien');
process.exit(fallos.length ? 1 : 0);
