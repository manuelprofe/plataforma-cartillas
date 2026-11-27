// Tableros con gráficos: docente (avance de su grupo en los juegos), coordinador (ejecución de
// docentes y avance por grado) y dueño (colegios), a 390 y a 1280 con Supabase simulado.
// También revisa el menú del docente: Biblioteca a la vista y, en computador, sin "Más".
// Uso: `npm run build`, luego `node scripts/pruebas/tableros.mjs`.
import { chromium, servir, URL_APP, CAPTURAS, LLAVE_ADULTO, sesionAdulto, simularSupabase } from './comun.mjs';

const fallos = [];
const comprobar = (ok, texto) => { console.log(ok ? 'bien ' : 'FALLA', texto); if (!ok) fallos.push(texto); };
const url = (r) => new URL(r, URL_APP).href;
const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
const antes = (n) => new Date(Date.parse(`${hoy}T00:00:00Z`) - n * 864e5).toISOString().slice(0, 10);

const NINOS = ['Ana', 'Beto', 'Caro', 'Dani', 'Eli', 'Fer'].map((a, i) => ({ id: `e${i}`, apodo: a, avatar: 'coco', autorizacion: i < 5 ? '2026-10-01' : null }));
const PROGRESO = [
  { estudiante_id: 'e0', mision_id: 'bosque-school', veces: 2, mejor_errores: 0, autoeval: 3 },
  { estudiante_id: 'e0', mision_id: 'bosque-colors', veces: 1, mejor_errores: 1, autoeval: 3 },
  { estudiante_id: 'e1', mision_id: 'bosque-school', veces: 1, mejor_errores: 4, autoeval: 1 },
  { estudiante_id: 'e1', mision_id: 'bosque-colors', veces: 1, mejor_errores: 3, autoeval: 2 },
  { estudiante_id: 'e2', mision_id: 'bosque-school', veces: 1, mejor_errores: 0, autoeval: 2 },
];
const ESTRELLAS = [{ estudiante_id: 'e0', motivo: 'participar', cantidad: 1 }, { estudiante_id: 'e0', motivo: 'completar', cantidad: 1 }, { estudiante_id: 'e2', motivo: 'colaborar', cantidad: 1 }];
const DIAS = [{ estudiante_id: 'e0', fecha: hoy }, { estudiante_id: 'e0', fecha: antes(1) }, { estudiante_id: 'e1', fecha: antes(10) }, { estudiante_id: 'e2', fecha: antes(2) }, { estudiante_id: 'e2', fecha: antes(20) }];

const CIFRAS = [
  { grupo_id: 'g1', nombre: '3B', grado: '3°', docente: 'Ana Docente', con_cifras: true, ninos: 20, autorizaciones: 18, practicaron_semana: 12, practicaron_mes: 16, misiones: { 'ingles-3/bosque-school': 14 }, estrellas: { participar: 30 }, plan: { 'ingles-3/school': { estado: 'hecho' }, 'ingles-3/colors': { estado: 'en-curso' } } },
  { grupo_id: 'g2', nombre: '3A', grado: '3°', docente: 'Luis Docente', con_cifras: true, ninos: 22, autorizaciones: 20, practicaron_semana: 0, practicaron_mes: 5, misiones: {}, estrellas: {}, plan: {} },
  { grupo_id: 'g3', nombre: 'Transición A', grado: 'Preescolar', docente: 'Luis Docente', con_cifras: false, ninos: null, autorizaciones: null, practicaron_semana: null, plan: { 'matematicas-0/arriba': { estado: 'hecho' } } },
];
const ENTREGAS = [
  { docente_id: 'u1', planeacion_id: 'p1', docente_nombre: 'Ana Docente', titulo: 'Colores', datos: {}, entregada: '2026-11-20T10:00:00Z', estado: 'revisada', comentario: null, revisada: null },
  { docente_id: 'u2', planeacion_id: 'p2', docente_nombre: 'Luis Docente', titulo: 'Números', datos: {}, entregada: '2026-11-25T10:00:00Z', estado: 'por-revisar', comentario: null, revisada: null },
];

function datos(u) {
  const p = u.pathname;
  const sel = u.searchParams.get('select') ?? '';
  if (p === '/rest/v1/rpc/mis_codigos') return { json: [{ grupo_id: 'g1', codigo: 'ABC123' }] };
  if (p === '/rest/v1/grupos') return { json: [{ id: 'g1', nombre: '3B', grado: '3°', colegio_id: 'c1', cartilla_id: 'ingles-3' }] };
  if (p === '/rest/v1/estudiantes') return { json: sel.includes('apodo') ? NINOS : NINOS.map(() => ({ grupo_id: 'g1' })) };
  if (p === '/rest/v1/progreso_misiones') return { json: PROGRESO };
  if (p === '/rest/v1/estrellas') return { json: sel.includes('motivo,cantidad') ? ESTRELLAS : [] };
  if (p === '/rest/v1/dias_practica') return { json: DIAS };
  if (p === '/rest/v1/rpc/cifras_grupos') return { json: CIFRAS };
  if (p === '/rest/v1/entregas_planeacion') return { json: ENTREGAS };
  if (p === '/rest/v1/colegios' && sel.includes('municipio')) return { json: [{ id: 'c1', nombre: 'I.E. Prueba', municipio: 'Los Patios', convenio: null }, { id: 'c2', nombre: 'Colegio Nuevo', municipio: null, convenio: null }] };
  if (p === '/rest/v1/colegio_cartillas') return { json: [{ colegio_id: 'c1', cartilla_id: 'ingles-3', version: '1' }] };
  if (p === '/rest/v1/perfiles' && sel.includes('correo')) return { json: [{ id: 'u1', colegio_id: 'c1', rol: 'docente', nombre: 'Ana Docente', correo: 'a@x.co', activo: true }, { id: 'u2', colegio_id: 'c1', rol: 'docente', nombre: 'Luis Docente', correo: 'l@x.co', activo: true }] };
  return null;
}

async function abrir(navegador, rol, ancho) {
  const c = await navegador.newContext({ viewport: { width: ancho, height: 900 }, reducedMotion: 'reduce', serviceWorkers: 'block', locale: 'es-CO' });
  await c.addInitScript(([k, v]) => localStorage.setItem(k, v), [LLAVE_ADULTO, JSON.stringify(sesionAdulto(rol, { perfil: { rol, nombre: 'Prueba', colegio_id: rol === 'dueno' ? null : 'c1' } }))]);
  await simularSupabase(c, datos);
  const p = await c.newPage();
  const errores = [];
  p.on('pageerror', (e) => errores.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|ERR_FAILED/.test(m.text()) && errores.push(m.text()));
  return { c, p, errores };
}
const desborda = (p) => p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

const servidor = await servir();
const navegador = await chromium.launch();
try {
  for (const ancho of [390, 1280]) {
    // Docente
    const d = await abrir(navegador, 'docente', ancho);
    await d.p.goto(url('/docente'));
    await d.p.waitForSelector('h1:has-text("Inicio")');
    const pestanas = await d.p.locator('nav.pestanas a:visible').allInnerTexts();
    comprobar(pestanas.some((t) => t.includes('Biblioteca')), `${ancho}: Biblioteca en el menú (${pestanas.join(', ')})`);
    comprobar(ancho < 1024 ? pestanas.length <= 6 && pestanas.some((t) => t.includes('Más')) : !pestanas.some((t) => t.includes('Más')) && pestanas.some((t) => t.includes('Ayuda')), `${ancho}: menú ${ancho < 1024 ? 'del celular con Más' : 'lateral con todo, sin Más'}`);
    await d.p.click('a:has-text("Avance de 3B")');
    await d.p.waitForSelector('.t-cifras');
    const cifras = await d.p.locator('.t-cifra').allInnerTexts();
    comprobar(cifras[0].includes('2') && cifras[0].includes('de 5'), `${ancho}: practicaron esta semana 2 de 5 (${cifras[0].replace(/\n/g, ' ')})`);
    comprobar(cifras.some((t) => t.startsWith('5') && t.includes('Misiones completadas')), `${ancho}: 5 misiones completadas`);
    const apoyar = await d.p.locator('.panel', { hasText: 'A quién apoyar' }).innerText();
    comprobar(apoyar.includes('Beto') && apoyar.includes('Dani') && !apoyar.includes('Ana\n'), `${ancho}: a quién apoyar nombra a Beto (le costó) y a Dani (no ha jugado)`);
    comprobar(!apoyar.includes('Fer'), `${ancho}: el niño sin autorización no se cuenta`);
    const tema = await d.p.locator('.t-barra', { hasText: 'los útiles del salón' }).innerText();
    comprobar(tema.includes('3 de 5'), `${ancho}: avance del tema "útiles" 3 de 5`);
    comprobar((await d.p.locator('.t-columnas li').count()) === 8, `${ancho}: 8 semanas de participación`);
    const filas = await d.p.locator('.t-tabla tbody th').allInnerTexts();
    comprobar(filas.join() === 'Ana,Beto,Caro,Dani,Eli', `${ancho}: tabla alfabética (${filas.join()})`);
    comprobar(!(await desborda(d.p)), `${ancho}: docente sin desborde`);
    await d.p.screenshot({ path: `${CAPTURAS}/tablero-docente-${ancho}.png`, fullPage: true });
    comprobar(d.errores.length === 0, `${ancho}: docente sin errores ${d.errores.join(' | ')}`);
    await d.c.close();

    // Coordinador
    const k = await abrir(navegador, 'coordinador', ancho);
    await k.p.goto(url('/colegio'));
    await k.p.waitForSelector('.t-cifras');
    const kc = await k.p.locator('.t-cifra').allInnerTexts();
    comprobar(kc[0].includes('12') && kc[0].includes('de 38'), `${ancho}: activos 12 de 38 (${kc[0].replace(/\n/g, ' ')})`);
    const atender = await k.p.locator('.panel', { hasText: 'Para atender' }).innerText();
    comprobar(atender.includes('3A: nadie practicó') && atender.includes('Transición A: faltan autorizaciones') && atender.includes('1 planeación por revisar'), `${ancho}: alertas del coordinador`);
    const ejec = await k.p.locator('.panel', { hasText: 'Ejecución del plan' }).innerText();
    comprobar(ejec.includes('Ana Docente') && ejec.includes('1 + 1') && ejec.includes('Luis Docente'), `${ancho}: ejecución del plan por docente`);
    comprobar((await k.p.locator('.panel', { hasText: 'Participación por grado' }).innerText()).includes('Grado 3°'), `${ancho}: participación por grado`);
    comprobar(!(await k.p.locator('main').innerText()).includes('Beto'), `${ancho}: el coordinador no ve niños`);
    comprobar(!(await desborda(k.p)), `${ancho}: coordinador sin desborde`);
    await k.p.screenshot({ path: `${CAPTURAS}/tablero-colegio-${ancho}.png`, fullPage: true });
    comprobar(k.errores.length === 0, `${ancho}: coordinador sin errores ${k.errores.join(' | ')}`);
    await k.c.close();

    // Dueño
    const o = await abrir(navegador, 'dueno', ancho);
    await o.p.goto(url('/plataforma'));
    await o.p.click('.pestanas >> text=Tablero');
    await o.p.waitForSelector('.t-cifras');
    const oa = await o.p.locator('.panel', { hasText: 'Para atender' }).innerText();
    comprobar(oa.includes('Colegio Nuevo: sin cartilla') && oa.includes('Colegio Nuevo: sin docentes'), `${ancho}: alertas del dueño`);
    comprobar((await o.p.locator('.t-tabla tbody tr').count()) === 2, `${ancho}: una fila por colegio`);
    comprobar(!(await desborda(o.p)), `${ancho}: dueño sin desborde`);
    await o.p.screenshot({ path: `${CAPTURAS}/tablero-dueno-${ancho}.png`, fullPage: true });
    comprobar(o.errores.length === 0, `${ancho}: dueño sin errores ${o.errores.join(' | ')}`);
    await o.c.close();
  }
} finally {
  await navegador.close();
  servidor.kill();
}
console.log(fallos.length ? `\n${fallos.length} fallas` : '\nTodo bien');
process.exit(fallos.length ? 1 : 0);
