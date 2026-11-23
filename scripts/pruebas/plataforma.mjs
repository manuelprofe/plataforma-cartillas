// Dueño, coordinador e invitaciones con Supabase simulado en memoria (no sale a la red).
// Dueño: crea colegio, publica y habilita cartillas, invita, reenvía, cancela, desactiva.
// Coordinador: invita docente, crea grupo con su cartilla, asigna docente y cartilla, renueva código (sin verlo).
// Invitado: enlace del correo (type=invite) en /adultos y en la raíz, contraseña y entrada.
// Uso: `npm run build`, luego `node scripts/pruebas/plataforma.mjs`.
import { chromium, servir, URL_APP, CAPTURAS, LLAVE_ADULTO, sesionAdulto, simularSupabase } from './comun.mjs';

const url = (r) => new URL(r, URL_APP).href;
const fallos = [];
const comprobar = (ok, texto) => { console.log(ok ? 'bien ' : 'FALLA', texto); if (!ok) fallos.push(texto); };
const ruta = (p) => new URL(p.url()).pathname;

/** Base de datos en memoria con lo mínimo de Supabase que usa la app. */
function crearBase() {
  const b = {
    colegios: [], habilitadas: [], perfiles: [], invitaciones: [], grupos: [], llamadas: [], correos: [], desde: 0,
    versiones: [{ cartilla_id: 'matematicas-1', version: '2027.1' }, { cartilla_id: 'ingles-3', version: '2027.1' }],
    cartillas: [
      { id: 'ingles-3', titulo: 'English Adventure Quest', materia: 'Inglés', grado: '3', publicada: true },
      { id: 'matematicas-1', titulo: 'Cartilla de prueba', materia: 'Matemáticas', grado: '1', publicada: false },
    ],
    aceptarCon: null,
  };
  const id = (() => { let n = 0; return (p) => `${p}-${++n}`; })();
  b.id = id;
  b.extra = (u, q) => {
    const quien = /falso-(\w+)/.exec(q.headers().authorization ?? '')?.[1];
    const m = q.method();
    const t = u.pathname.replace('/rest/v1/', '');
    const cuerpo = q.postData() ? JSON.parse(q.postData()) : null;
    const filtro = u.searchParams.get('id')?.replace('eq.', '');
    b.llamadas.push({ m, t, q: u.search, cuerpo, quien });
    if (t === 'colegios') {
      if (m === 'POST') { if (quien !== 'dueno') return { status: 403, json: { message: 'RLS' } }; const f = { id: id('col'), ...cuerpo }; b.colegios.push(f); return { status: 201, json: [f] }; }
      return { json: b.colegios };
    }
    if (t === 'colegio_cartillas') {
      if (m === 'POST') { b.habilitadas = b.habilitadas.filter((h) => h.colegio_id !== cuerpo.colegio_id || h.cartilla_id !== cuerpo.cartilla_id); b.habilitadas.push(cuerpo); return { status: 201, json: [cuerpo] }; }
      return { json: b.habilitadas };
    }
    if (t === 'cartilla_versiones') return { json: b.versiones };
    if (t === 'cartillas') {
      if (m === 'PATCH') { if (quien !== 'dueno') return { status: 403, json: { message: 'RLS' } }; const f = b.cartillas.find((x) => x.id === filtro); Object.assign(f, cuerpo); return { json: [{ id: f.id }] }; }
      return { json: b.cartillas };
    }
    if (t === 'perfiles') {
      if (m === 'PATCH') { const f = b.perfiles.find((x) => x.id === filtro); if (!f) return { json: [] }; Object.assign(f, cuerpo); return { json: [f] }; }
      return { json: b.perfiles };
    }
    if (t === 'invitaciones') {
      if (m === 'DELETE') { const n = b.invitaciones.length; b.invitaciones = b.invitaciones.filter((i) => i.id !== filtro); return { json: n === b.invitaciones.length ? [] : [{ id: filtro }] }; }
    }
    if (t === 'rpc/lista_invitaciones') {
      const filas = quien === 'coordinador' ? b.invitaciones.filter((i) => i.rol === 'docente') : b.invitaciones;
      return { json: filas.map((i) => ({ ...i, del_dueno: i.por === 'dueno' })) };
    }
    if (t === 'grupos') {
      if (/codigo|select=\*/.test(u.search)) return { status: 401, json: { message: 'permission denied for column codigo' } };
      if (m === 'PATCH') { const f = b.grupos.find((x) => x.id === filtro); Object.assign(f, cuerpo); return { json: [f] }; }
      return { json: b.grupos };
    }
    if (t === 'rpc/crear_grupo') {
      const f = { id: id('gr'), colegio_id: 'col-1', docente_id: cuerpo.p_docente, nombre: cuerpo.p_nombre, grado: cuerpo.p_grado, cartilla_id: 'ingles-3' };
      b.grupos.push(f); return { json: { ...f, codigo: null } };
    }
    if (t === 'rpc/renovar_codigo') return { json: null };
    if (t === 'rpc/cifras_grupos') return { json: b.grupos.map((g) => ({ grupo_id: g.id, nombre: g.nombre, grado: g.grado, docente: b.perfiles.find((p) => p.id === g.docente_id)?.nombre ?? '', con_cifras: g.nombre === '3A', ninos: 14, autorizaciones: 12, practicaron_semana: 9 })) };
    if (b.caido && t === 'rpc/mi_perfil') return { abortar: true };
    if (t === 'rpc/mi_perfil' && b.aceptarCon) return { json: b.aceptado ? { rol: b.aceptarCon.rol, nombre: b.aceptarCon.nombre, colegio_id: 'col-1', activo: true } : null };
    if (t === 'rpc/aceptar_invitacion') { b.aceptado = true; return { json: b.aceptarCon.rol }; }
    if (u.pathname === '/auth/v1/user' && m === 'PUT') { b.clave = cuerpo.password; return { json: { email: 'rosa@colegio.edu.co' } }; }
    if (u.pathname === '/auth/v1/user') return { json: { email: 'rosa@colegio.edu.co' } };
    return null;
  };
  /** Función `invitar`: valida el rol como la base y registra la invitación. */
  b.invitar = (q) => {
    const quien = /falso-(\w+)/.exec(q.headers().authorization ?? '')?.[1];
    const d = JSON.parse(q.postData());
    b.correos.push({ quien, ...d });
    if (quien === 'coordinador' && d.rol !== 'docente') return { status: 403, json: { error: 'El coordinador invita docentes de su colegio' } };
    if (b.perfiles.some((p) => p.correo === d.correo)) return { status: 403, json: { error: 'Ese correo ya tiene cuenta' } };
    const previa = b.invitaciones.find((i) => i.correo === d.correo && !i.aceptada);
    if (previa) Object.assign(previa, { nombre: d.nombre, creado: new Date().toISOString() });
    else b.invitaciones.push({ id: b.id('inv'), correo: d.correo, nombre: d.nombre, rol: d.rol, colegio_id: d.colegio_id ?? 'col-1', creado: new Date().toISOString(), aceptada: null, por: quien });
    return { json: { estado: 'enviada' } };
  };
  return b;
}

async function abrir(navegador, base, { rol, ancho = 390, alto = 844 } = {}) {
  const c = await navegador.newContext({ viewport: { width: ancho, height: alto }, reducedMotion: 'reduce', serviceWorkers: 'block' });
  if (rol) await c.addInitScript(([k, v]) => { if (!sessionStorage.sembrado) { localStorage.setItem(k, v); sessionStorage.sembrado = '1'; } }, [LLAVE_ADULTO, JSON.stringify(sesionAdulto(rol))]);
  const pedidos = await simularSupabase(c, base.extra);
  await c.route('**/functions/v1/invitar', async (r) => {
    const x = base.invitar(r.request());
    await r.fulfill({ status: x.status ?? 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(x.json) });
  });
  const p = await c.newPage();
  const errores = [];
  p.on('pageerror', (e) => errores.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|ERR_INTERNET|403/.test(m.text()) && errores.push(m.text()));
  return { c, p, pedidos, errores };
}

const medir = (p) => p.evaluate(() => ({
  desborde: document.documentElement.scrollWidth > innerWidth,
  toque: Math.min(99, ...[...document.querySelectorAll('main a, main button, main input, main select, nav a, header a, header button')].filter((b) => b.offsetParent).map((b) => { const q = b.getBoundingClientRect(); return Math.min(q.height, b.tagName === 'INPUT' || b.tagName === 'SELECT' ? 99 : q.width); })),
}));

const servidor = await servir();
const navegador = await chromium.launch();
try {
  // 1. Dueño a 390: vacío, crear colegio, habilitar cartilla, invitar, reenviar, cancelar, desactivar.
  {
    const base = crearBase();
    const { c, p, errores } = await abrir(navegador, base, { rol: 'dueno' });
    await p.goto(url('/plataforma'));
    await p.waitForSelector('h2:has-text("Todavía no hay colegios")');
    comprobar((await p.locator('main').textContent()).includes('Cree el primero'), 'dueño sin colegios: "Todavía no hay colegios. Cree el primero"');
    await p.screenshot({ path: `${CAPTURAS}/plataforma-vacio-390.png` });
    await p.click('main >> text=Crear colegio');
    await p.waitForSelector('h1:has-text("Crear colegio")');
    await p.click('main button[type=submit]');
    comprobar((await p.locator('#col-nombre-error').textContent()).includes('nombre del colegio'), 'crear colegio sin nombre: aviso bajo el campo');
    await p.fill('#col-nombre', 'I.E. Jorge Barco Mora');
    await p.fill('#col-municipio', 'Los Patios');
    await p.fill('#col-convenio', 'Convenio 001 de 2026');
    await p.screenshot({ path: `${CAPTURAS}/plataforma-crear-390.png` });
    await p.click('main button[type=submit]');
    await p.waitForSelector('h1:has-text("I.E. Jorge Barco Mora")');
    const post = base.llamadas.find((l) => l.m === 'POST' && l.t === 'colegios');
    comprobar(post?.cuerpo.municipio === 'Los Patios' && post.cuerpo.convenio === 'Convenio 001 de 2026' && ruta(p) === '/plataforma/colegios/col-1', `colegio creado y abierto (${ruta(p)})`);
    comprobar((await p.locator('main').textContent()).includes('Todavía no hay personas'), 'colegio nuevo: vacío de personas con qué hacer');
    await p.screenshot({ path: `${CAPTURAS}/plataforma-colegio-nuevo-390.png`, fullPage: true });
    comprobar((await p.locator('.fila:has-text("Matemáticas")').count()) === 0, 'una cartilla oculta no se ofrece al colegio');
    await p.click('.fila:has-text("Inglés") >> button:has-text("Habilitar 2027.1")');
    comprobar(!base.llamadas.some((l) => l.t === 'colegio_cartillas' && l.m === 'POST'), 'habilitar la cartilla pide confirmación antes de escribir');
    await p.screenshot({ path: `${CAPTURAS}/plataforma-habilitar-390.png` });
    await p.click('button:has-text("Sí, habilitar")');
    await p.waitForSelector('.fila:has-text("Versión 2027.1 habilitada")');
    const hab = base.llamadas.find((l) => l.t === 'colegio_cartillas' && l.m === 'POST');
    comprobar(hab?.cuerpo.cartilla_id === 'ingles-3' && hab.cuerpo.version === '2027.1' && hab.q.includes('on_conflict=colegio_id,cartilla_id'), 'habilita ingles-3 2027.1 para el colegio');
    // Invitar un docente y un coordinador.
    await p.fill('#inv-nombre', 'Rosa Pérez');
    await p.fill('#inv-correo', 'rosa@colegio.edu.co');
    comprobar(await p.locator('#inv-rol').inputValue() === 'coordinador', 'el dueño empieza invitando al coordinador');
    await p.selectOption('#inv-rol', 'docente');
    await p.click('button:has-text("Enviar invitación")');
    await p.waitForSelector('.mensaje--ok:has-text("Invitación enviada a rosa@colegio.edu.co")');
    comprobar(base.correos[0]?.rol === 'docente' && base.correos[0].colegio_id === 'col-1' && base.correos[0].quien === 'dueno', 'invitar docente llama a la función con colegio y rol');
    await p.fill('#inv-nombre', 'Luis Mora');
    await p.fill('#inv-correo', 'rector@colegio');
    await p.click('button:has-text("Enviar invitación")');
    comprobar((await p.locator('#inv-correo-error').textContent()).includes('Revise el correo'), 'correo mal escrito: aviso, no se llama a la función');
    await p.fill('#inv-correo', 'rector@colegio.edu.co');
    await p.selectOption('#inv-rol', 'coordinador');
    await p.click('button:has-text("Enviar invitación")');
    await p.waitForSelector('.mensaje--ok:has-text("rector@colegio.edu.co")');
    await p.waitForSelector('.etiqueta:has-text("Pendiente") >> nth=1');
    comprobar(base.correos[1]?.rol === 'coordinador' && (await p.locator('.etiqueta:has-text("Pendiente")').count()) === 2, 'invitar coordinador; dos pendientes en la lista');
    // Reenviar y cancelar.
    await p.locator('li:has-text("Rosa Pérez") >> button:has-text("Reenviar")').click();
    await p.waitForSelector('.mensaje--ok:has-text("reenviada a rosa@colegio.edu.co")');
    comprobar(base.correos.length === 3, 'reenviar vuelve a llamar a la función');
    await p.locator('li:has-text("Luis Mora") >> button:has-text("Cancelar invitación")').click();
    await p.locator('button:has-text("Sí, cancelar")').click();
    await p.waitForSelector('.mensaje--ok:has-text("rector@colegio.edu.co cancelada")');
    comprobar(base.invitaciones.length === 1, 'cancelar borra la invitación pendiente');
    // Una persona aceptó: desactivar.
    base.perfiles.push({ id: 'u-1', colegio_id: 'col-1', rol: 'docente', nombre: 'Marta Díaz', correo: 'marta@colegio.edu.co', activo: true });
    base.invitaciones[0].aceptada = new Date().toISOString();
    await p.reload();
    await p.waitForSelector('li:has-text("Marta Díaz")');
    comprobar((await p.locator('.etiqueta:has-text("Aceptada")').count()) === 1 && (await p.locator('li:has-text("Rosa Pérez") button:has-text("Reenviar")').count()) === 0, 'la invitación aceptada se ve y ya no se reenvía');
    await p.locator('li:has-text("Marta Díaz") >> button:has-text("Desactivar")').click();
    await p.locator('button:has-text("Sí, desactivar")').click();
    await p.waitForSelector('li:has-text("Marta Díaz") >> .etiqueta:has-text("Desactivado")');
    comprobar(base.perfiles[0].activo === false, 'desactivar a una persona la deja inactiva');
    const m = await medir(p);
    comprobar(!m.desborde && m.toque >= 48, `colegio sin desborde a 390, toque mínimo ${Math.round(m.toque)}`);
    await p.screenshot({ path: `${CAPTURAS}/plataforma-colegio-390.png`, fullPage: true });
    // Lista de colegios y cuentas.
    await p.goto(url('/plataforma'));
    await p.waitForSelector('a.fila:has-text("I.E. Jorge Barco Mora")');
    comprobar((await p.locator('a.fila').textContent()).includes('1 cartilla') && (await p.locator('a.fila').textContent()).includes('Los Patios'), 'la lista muestra municipio y cuántas cartillas tiene');
    // Cartillas: publicar la de matemáticas y habilitarla en el colegio.
    await p.goto(url('/plataforma/cartillas'));
    await p.waitForSelector('.fila:has-text("Matemáticas")');
    const cat = await p.locator('main').textContent();
    comprobar(cat.includes('2 cartillas · 1 publicada') && cat.includes('Oculta') && cat.includes('en 1 colegio'), 'Cartillas lista el catálogo con estado, versión y colegios');
    await p.screenshot({ path: `${CAPTURAS}/plataforma-cartillas-390.png`, fullPage: true });
    await p.click('.fila:has-text("Matemáticas") >> button:has-text("Publicar")');
    comprobar(!base.llamadas.some((l) => l.t === 'cartillas' && l.m === 'PATCH'), 'publicar pide confirmación antes de escribir');
    await p.click('button:has-text("Sí, publicar")');
    await p.waitForSelector('.fila:has-text("Matemáticas") >> text=Publicada');
    comprobar(base.cartillas[1].publicada === true, 'publicar marca la cartilla como publicada');
    const mc = await medir(p);
    comprobar(!mc.desborde && mc.toque >= 48, `Cartillas sin desborde a 390, toque mínimo ${Math.round(mc.toque)}`);
    await p.goto(url('/plataforma/colegios/col-1'));
    await p.click('.fila:has-text("Matemáticas") >> button:has-text("Habilitar 2027.1")');
    await p.click('button:has-text("Sí, habilitar")');
    await p.waitForSelector('.fila:has-text("Matemáticas") >> text=Versión 2027.1 habilitada');
    comprobar(base.habilitadas.filter((h) => h.colegio_id === 'col-1').length === 2, 'el colegio queda con las dos cartillas');
    await p.goto(url('/plataforma/cuentas'));
    await p.waitForSelector('li:has-text("Rosa Pérez")');
    comprobar((await p.locator('li:has-text("Rosa Pérez")').textContent()).includes('I.E. Jorge Barco Mora'), 'Cuentas lista las invitaciones con su colegio');
    comprobar(!errores.length, `sin errores de consola ${errores.join(' | ')}`);
    await c.close();
  }

  // 2. Dueño a 1280.
  {
    const base = crearBase();
    base.colegios.push({ id: 'col-1', nombre: 'I.E. Jorge Barco Mora', municipio: 'Los Patios', convenio: 'Convenio 001 de 2026' });
    base.habilitadas.push({ colegio_id: 'col-1', cartilla_id: 'ingles-3', version: '2027.1' });
    base.perfiles.push({ id: 'u-9', colegio_id: 'col-1', rol: 'coordinador', nombre: 'Luis Mora', correo: 'rector@colegio.edu.co', activo: true });
    base.invitaciones.push({ id: 'inv-9', correo: 'rector@colegio.edu.co', nombre: 'Luis Mora', rol: 'coordinador', colegio_id: 'col-1', creado: new Date(Date.now() - 3 * 864e5).toISOString(), aceptada: new Date().toISOString() },
      { id: 'inv-10', correo: 'vieja@colegio.edu.co', nombre: 'Ana Gómez', rol: 'docente', colegio_id: 'col-1', creado: new Date(Date.now() - 20 * 864e5).toISOString(), aceptada: null });
    const { c, p } = await abrir(navegador, base, { rol: 'dueno', ancho: 1280, alto: 900 });
    await p.goto(url('/plataforma'));
    await p.waitForSelector('a.fila');
    await p.screenshot({ path: `${CAPTURAS}/plataforma-colegios-1280.png` });
    await p.click('a.fila');
    await p.waitForSelector('li:has-text("Ana Gómez")');
    comprobar((await p.locator('li:has-text("Ana Gómez") .etiqueta').textContent()) === 'Vencida', 'invitación de más de 14 días: "Vencida" con Reenviar');
    await p.locator('li:has-text("Luis Mora") >> button:has-text("Desactivar")').first().click();
    comprobar((await p.locator('[role=group]').textContent()).includes('sin quien los administre'), 'desactivar un coordinador advierte que sus docentes y grupos quedan sin quien los administre');
    await p.screenshot({ path: `${CAPTURAS}/plataforma-colegio-1280.png`, fullPage: true });
    await p.goto(url('/plataforma/cartillas'));
    await p.waitForSelector('.fila:has-text("Matemáticas")');
    const m1280 = await medir(p);
    comprobar(!m1280.desborde, 'Cartillas sin desborde a 1280');
    await p.screenshot({ path: `${CAPTURAS}/plataforma-cartillas-1280.png` });
    await c.close();
  }

  // 3. Coordinador: invitar docente, crear grupo, asignar, renovar código.
  {
    const base = crearBase();
    base.perfiles.push(
      { id: 'u-1', colegio_id: 'col-1', rol: 'docente', nombre: 'Rosa Pérez', correo: 'rosa@colegio.edu.co', activo: true },
      { id: 'u-2', colegio_id: 'col-1', rol: 'docente', nombre: 'Marta Díaz', correo: 'marta@colegio.edu.co', activo: true },
      { id: 'u-3', colegio_id: 'col-1', rol: 'docente', nombre: 'Sin Aceptar', correo: 'sin@colegio.edu.co', activo: true },
      { id: 'u-4', colegio_id: 'col-1', rol: 'docente', nombre: 'Inactivo Gil', correo: 'gil@colegio.edu.co', activo: false },
    );
    const ok = new Date().toISOString();
    for (const [correo, nombre] of [['rosa@colegio.edu.co', 'Rosa Pérez'], ['marta@colegio.edu.co', 'Marta Díaz'], ['gil@colegio.edu.co', 'Inactivo Gil']]) base.invitaciones.push({ id: base.id('inv'), correo, nombre, rol: 'docente', colegio_id: 'col-1', creado: ok, aceptada: ok });
    base.invitaciones.push({ id: 'inv-d', correo: 'deldueno@colegio.edu.co', nombre: 'Del Dueño', rol: 'docente', colegio_id: 'col-1', creado: ok, aceptada: null, por: 'dueno' });
    // El colegio tiene dos cartillas habilitadas: el coordinador elige la de cada grupo.
    base.habilitadas.push({ colegio_id: 'col-1', cartilla_id: 'ingles-3', version: '2027.1' }, { colegio_id: 'col-1', cartilla_id: 'matematicas-1', version: '2027.1' });
    const { c, p, errores } = await abrir(navegador, base, { rol: 'coordinador' });
    await p.goto(url('/colegio'));
    await p.waitForSelector('h2:has-text("Todavía no hay grupos")');
    comprobar(true, 'coordinador sin grupos: vacío en Uso y avance');
    await p.goto(url('/colegio/docentes'));
    await p.waitForSelector('li:has-text("Rosa Pérez")');
    comprobar((await p.locator('li:has-text("Del Dueño") button').count()) === 0 && (await p.locator('li:has-text("Del Dueño")').textContent()).includes('administrador de la plataforma'), 'invitación del dueño: el coordinador no ve Reenviar ni Cancelar y sabe por qué');
    comprobar((await p.locator('#inv-rol').count()) === 0, 'el coordinador solo invita docentes (sin selector de rol)');
    await p.fill('#inv-nombre', 'Pedro Ruiz');
    await p.fill('#inv-correo', 'pedro@colegio.edu.co');
    await p.click('button:has-text("Enviar invitación")');
    await p.waitForSelector('.mensaje--ok:has-text("pedro@colegio.edu.co")');
    comprobar(base.correos[0].rol === 'docente' && base.correos[0].quien === 'coordinador', 'coordinador invita docente');
    await p.waitForSelector('li:has-text("Pedro Ruiz")');
    const opciones = await p.locator('#gr-docente option').allTextContents();
    comprobar(opciones.join('|') === 'Elija un docente|Rosa Pérez|Marta Díaz', `solo docentes activos que aceptaron: ${opciones.join(', ')}`);
    await p.click('main button:has-text("Crear grupo")');
    comprobar((await p.locator('#gr-nombre-error').textContent()).includes('nombre del grupo') && (await p.locator('#gr-docente-error').textContent()).includes('docente'), 'grupo sin nombre ni docente: avisos');
    await p.fill('#gr-nombre', '3B');
    await p.selectOption('#gr-grado', '3°');
    await p.selectOption('#gr-docente', 'u-1');
    comprobar((await p.locator('#gr-cartilla').inputValue()) === 'ingles-3', 'el grupo nuevo empieza con la cartilla predeterminada');
    await p.selectOption('#gr-cartilla', 'matematicas-1');
    await p.click('main button[type=submit]:has-text("Crear grupo")');
    await p.waitForSelector('li:has-text("3B") >> text=Docente: Rosa Pérez');
    const pc = base.llamadas.find((l) => l.t === 'grupos' && l.m === 'PATCH' && l.cuerpo?.cartilla_id);
    comprobar(pc?.cuerpo.cartilla_id === 'matematicas-1' && (await p.locator('li:has-text("3B")').textContent()).includes('Cartilla: Matemáticas 1°'), 'el grupo se crea con la cartilla elegida');
    comprobar((await p.locator('h2:has-text("Grupos de grado 3°")').count()) === 1, 'los grupos se ordenan por grado');
    await c.setOffline(true);
    await p.waitForSelector('.aviso-red');
    comprobar(await p.locator('li:has-text("3B") select[id^="doc-"]').isDisabled(), 'sin red: "Cambiar docente" deshabilitado');
    await c.setOffline(false);
    await p.waitForFunction(() => !document.querySelector('.aviso-red'));
    const cg = base.llamadas.find((l) => l.t === 'rpc/crear_grupo');
    comprobar(cg?.cuerpo.p_nombre === '3B' && cg.cuerpo.p_grado === '3°' && cg.cuerpo.p_docente === 'u-1', 'crear_grupo recibe nombre, grado y docente');
    await p.locator('li:has-text("3B") select[id^="doc-"]').selectOption('u-2');
    await p.waitForSelector('li:has-text("3B") >> text=Docente: Marta Díaz');
    const pa = base.llamadas.find((l) => l.t === 'grupos' && l.m === 'PATCH' && l.cuerpo?.docente_id);
    comprobar(pa?.cuerpo.docente_id === 'u-2' && pa.q.includes('select=id'), 'asignar otro docente cambia docente_id');
    await p.locator('li:has-text("3B") select[id^="car-"]').selectOption('ingles-3');
    await p.waitForSelector('li:has-text("3B") >> text=Cartilla: Inglés 3°');
    comprobar(base.grupos.find((g) => g.nombre === '3B').cartilla_id === 'ingles-3', 'reasignar la cartilla de un grupo');
    await p.locator('li:has-text("3B") >> button:has-text("Renovar código")').click();
    await p.locator('button:has-text("Sí, renovar")').click();
    await p.waitForSelector('.mensaje--ok:has-text("Código renovado")');
    comprobar(base.llamadas.some((l) => l.t === 'rpc/renovar_codigo'), 'renovar código llama a renovar_codigo');
    comprobar(!base.llamadas.some((l) => l.t === 'grupos' && /codigo/.test(l.q)) && !/código:|Código: [A-Z0-9]{5}/.test(await p.locator('main').textContent()), 'el coordinador no pide ni ve el código del grupo');
    const m = await medir(p);
    comprobar(!m.desborde && m.toque >= 48, `docentes y grupos sin desborde a 390, toque mínimo ${Math.round(m.toque)}`);
    await p.screenshot({ path: `${CAPTURAS}/colegio-docentes-390.png`, fullPage: true });
    // Cifras: 3A con cifras, 3B sin (menos de 5 con autorización).
    base.grupos.push({ id: 'gr-x', colegio_id: 'col-1', docente_id: 'u-1', nombre: '3A', grado: '3°' });
    await p.goto(url('/colegio'));
    await p.waitForSelector('li:has-text("3A")');
    const texto = await p.locator('main').textContent();
    comprobar(texto.includes('14 niños con cuenta') && texto.includes('9 practicaron esta semana') && texto.includes('menos de 5 niños'), 'cifras por grupo; el grupo de menos de 5 no muestra cifras');
    await p.screenshot({ path: `${CAPTURAS}/colegio-uso-390.png` });
    comprobar(!errores.length, `sin errores de consola ${errores.join(' | ')}`);
    await c.close();
  }
  {
    const base = crearBase();
    const { c, p } = await abrir(navegador, base, { rol: 'coordinador', ancho: 1280, alto: 900 });
    base.perfiles.push({ id: 'u-1', colegio_id: 'col-1', rol: 'docente', nombre: 'Rosa Pérez', correo: 'rosa@colegio.edu.co', activo: true });
    base.invitaciones.push({ id: 'i-1', correo: 'rosa@colegio.edu.co', nombre: 'Rosa Pérez', rol: 'docente', colegio_id: 'col-1', creado: new Date().toISOString(), aceptada: new Date().toISOString() });
    base.grupos.push({ id: 'g-1', colegio_id: 'col-1', docente_id: 'u-1', nombre: '3A', grado: '3°' }, { id: 'g-2', colegio_id: 'col-1', docente_id: 'u-1', nombre: '3B', grado: '3°' });
    await p.goto(url('/colegio/docentes'));
    await p.waitForSelector('li:has-text("3B")');
    await p.screenshot({ path: `${CAPTURAS}/colegio-docentes-1280.png`, fullPage: true });
    await c.close();
  }

  // 4. Invitado: enlace del correo de Supabase.
  for (const [donde, hash] of [['/adultos', '#access_token=falso-nuevo&refresh_token=r&expires_in=3600&token_type=bearer&type=invite'], ['/', '#access_token=falso-nuevo&refresh_token=r&expires_in=3600&token_type=bearer&type=invite']]) {
    const base = crearBase();
    base.aceptarCon = { rol: 'docente', nombre: 'Rosa Pérez' };
    const { c, p, errores } = await abrir(navegador, base);
    await p.goto(url(donde + hash));
    await p.waitForSelector('#clave-nueva');
    comprobar(ruta(p) === '/adultos/invitacion' && !p.url().includes('access_token'), `enlace en ${donde}: cae en /adultos/invitacion y borra el token de la dirección`);
    comprobar(base.llamadas.some((l) => l.t === 'rpc/aceptar_invitacion') && (await p.locator('h1').textContent()).includes('Rosa Pérez'), 'aceptar_invitacion crea el perfil y saluda por el nombre');
    if (donde === '/adultos') await p.screenshot({ path: `${CAPTURAS}/invitacion-390.png` });
    await p.fill('#clave-nueva', 'corta');
    await p.click('button:has-text("Guardar y entrar")');
    comprobar((await p.locator('#clave-nueva-error').textContent()).includes('8 caracteres'), 'contraseña corta: aviso');
    await p.fill('#clave-nueva', 'una clave larga');
    await p.click('button:has-text("Guardar y entrar")');
    await p.waitForSelector('h1:has-text("Inicio")');
    comprobar(base.clave === 'una clave larga' && ruta(p) === '/docente', `elige contraseña y cae en ${ruta(p)}`);
    comprobar(!errores.length, `sin errores de consola ${errores.join(' | ')}`);
    await c.close();
  }
  {
    // Enlace vencido que Supabase manda a la raíz.
    const base = crearBase();
    const { c, p } = await abrir(navegador, base);
    await p.goto(url('/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'));
    await p.waitForSelector('h1:has-text("La invitación ya no sirve")');
    comprobar(ruta(p) === '/adultos/invitacion', 'enlace vencido en la raíz: "La invitación ya no sirve"');
    await c.close();
  }
  {
    // Enlace de invitación en un aparato con otra persona dentro: se pregunta antes de cambiar.
    for (const continuar of [false, true]) {
      const base = crearBase();
      const { c, p } = await abrir(navegador, base, { rol: 'docente' });
      await p.goto(url('/adultos#access_token=falso-coordinador&refresh_token=r2&expires_in=3600&type=invite'));
      await p.waitForSelector('h1:has-text("Cambiar de cuenta")');
      const texto = await p.locator('main').textContent();
      comprobar(texto.includes('Va a entrar como rosa@colegio.edu.co') && texto.includes('docente@prueba.co') && ruta(p) === '/adultos/invitacion', 'enlace con otra sesión abierta: "Va a entrar como…" y la cuenta abierta');
      comprobar((await p.evaluate((k) => JSON.parse(localStorage.getItem(k)).access, LLAVE_ADULTO)) === 'falso-docente', 'mientras no confirme, la sesión abierta no se toca');
      if (continuar) {
        await p.click('button:has-text("Continuar")');
        await p.waitForSelector('#clave-nueva');
        comprobar((await p.evaluate((k) => JSON.parse(localStorage.getItem(k)).access, LLAVE_ADULTO)) === 'falso-coordinador', 'Continuar cambia a la cuenta del enlace');
      } else {
        await p.click('button:has-text("Cancelar")');
        await p.waitForSelector('h1:has-text("Inicio")');
        comprobar(ruta(p) === '/docente' && (await p.evaluate((k) => JSON.parse(localStorage.getItem(k)).access, LLAVE_ADULTO)) === 'falso-docente', 'Cancelar deja la sesión anterior y vuelve a su inicio');
      }
      await c.close();
    }
    // El type del enlace elige la pantalla; con sesión y sin enlace, /adultos/invitacion va al inicio.
    const base = crearBase();
    const { c, p } = await abrir(navegador, base);
    await p.goto(url('/adultos/invitacion#access_token=falso-docente&refresh_token=r&expires_in=3600&type=recovery'));
    await p.waitForSelector('h1:has-text("Contraseña nueva")');
    comprobar(ruta(p) === '/adultos/clave-nueva', 'type=recovery lleva a la contraseña nueva aunque se abra en /invitacion');
    await p.goto(url('/adultos/invitacion'));
    await p.waitForSelector('h1:has-text("Inicio")');
    comprobar(ruta(p) === '/docente', '/adultos/invitacion con sesión y sin enlace va al inicio del rol');
    await c.close();
  }
  {
    // Sin red al aceptar la invitación: error de red con Reintentar, sin pedir otro enlace.
    const base = crearBase();
    base.aceptarCon = { rol: 'docente', nombre: 'Rosa Pérez' };
    base.caido = true;
    const { c, p } = await abrir(navegador, base);
    await p.goto(url('/adultos#access_token=falso-nuevo&refresh_token=r&expires_in=3600&type=invite'));
    await p.waitForSelector('h1:has-text("Sin conexión")');
    comprobar((await p.locator('main').textContent()).includes('no hace falta abrirlo de nuevo') && !p.url().includes('access_token'), 'sin red al aceptar: "Sin conexión" con Reintentar, no "Abra el enlace"');
    await p.screenshot({ path: `${CAPTURAS}/invitacion-sin-red-390.png` });
    base.caido = false;
    await p.click('button:has-text("Reintentar")');
    await p.waitForSelector('h1:has-text("Rosa Pérez")');
    comprobar(base.llamadas.some((l) => l.t === 'rpc/aceptar_invitacion'), 'Reintentar usa los tokens guardados y acepta la invitación');
    await c.close();
  }
  {
    // Sin red: el dueño ve el aviso y no puede enviar.
    const base = crearBase();
    base.colegios.push({ id: 'col-1', nombre: 'I.E. Jorge Barco Mora', municipio: null, convenio: null });
    const { c, p } = await abrir(navegador, base, { rol: 'dueno' });
    await p.goto(url('/plataforma/colegios/col-1'));
    await p.waitForSelector('h1:has-text("I.E. Jorge Barco Mora")');
    await c.setOffline(true);
    await p.waitForSelector('.aviso-red');
    comprobar(await p.locator('button:has-text("Enviar invitación")').isDisabled(), 'sin red: aviso y "Enviar invitación" deshabilitado');
    await p.screenshot({ path: `${CAPTURAS}/plataforma-sin-red-390.png` });
    await c.close();
  }
} finally {
  await navegador.close();
  servidor.kill();
}
if (fallos.length) { console.log(`\n${fallos.length} fallos`); process.exit(1); }
console.log('\ntodo bien');
