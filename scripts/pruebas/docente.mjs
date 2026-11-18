// Tanda 4 del esqueleto: docente base con Supabase simulado y con estado (no sale a la red).
// Criterio de esqueleto.md §8: desde Inicio, a un toque proyectar, dar estrellas y la lista; una
// estrella son 2 toques; en modo avión 3 estrellas dicen "3 por subir" y suben una sola vez;
// Inicio no contiene ningún apodo. Además: crear niños (lista pegada), autorización, PIN que no se
// ve en pantalla, personaje, retirar, tarjetas y lista imprimibles, y el niño entra con el código.
// Uso: `npm run build`, luego `node scripts/pruebas/docente.mjs`.
import { chromium, servir, URL_APP, CAPTURAS, LLAVE_ADULTO, sesionAdulto, simularSupabase } from './comun.mjs';

const url = (r) => new URL(r, URL_APP).href;
const ruta = (p) => new URL(p.url()).pathname;
const fallos = [];
const comprobar = (ok, texto) => { console.log(ok ? 'bien ' : 'FALLA', texto); if (!ok) fallos.push(texto); };
const foto = (p, n) => p.screenshot({ path: `${CAPTURAS}/docente-${n}.png` });
const PIN = ['sol', 'luna', 'pez', 'hoja', 'corazón', 'casa', 'gota', 'estrella', 'nube', 'flor'];
const hoyCo = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());

// ---------------------------------------------------------------- Base simulada con estado

function nuevaBase({ conGrupo = true, ninos = [] } = {}) {
  return {
    grupo: conGrupo ? { id: 'g1', nombre: '3B', grado: '3°', colegio_id: 'c1', codigo: 'K7M2P' } : null,
    ninos: ninos.map(([id, apodo, avatar, autorizacion]) => ({ id, grupo_id: 'g1', apodo, avatar, autorizacion })),
    pines: new Map(),
    estrellas: [],
    llamadas: [],
    perderRespuesta: 0,
    siguiente: 1,
  };
}

/** Responde en lugar de Supabase: docente (REST y funciones) y aparato del niño (anónimo). */
function atender(base) {
  return async (u, q) => {
    if (base.caida) return { abortar: true };
    const cuerpo = q.postData() ? JSON.parse(q.postData()) : {};
    const p = u.pathname;
    const eq = (k) => u.searchParams.get(k)?.replace(/^eq\./, '');
    const m = q.method();
    if (p === '/auth/v1/signup') return { json: { access_token: 'anon-1', refresh_token: 'ra', expires_in: 3600, user: { id: 'aparato' } } };
    if (p === '/rest/v1/rpc/mis_codigos') return { json: base.grupo ? [{ grupo_id: base.grupo.id, codigo: base.grupo.codigo }] : [] };
    if (p === '/rest/v1/grupos' && m === 'GET') return { json: base.grupo ? [base.grupo] : [] };
    if (p === '/rest/v1/colegios') return { json: [{ nombre: 'I.E. Jorge Barco Mora' }] };
    if (p === '/rest/v1/rpc/crear_grupo') {
      base.grupo = { id: 'g1', nombre: cuerpo.p_nombre, grado: cuerpo.p_grado, colegio_id: 'c1', codigo: 'K7M2P' };
      return { json: base.grupo };
    }
    if (p === '/rest/v1/estudiantes') {
      if (m === 'GET') {
        if (u.searchParams.get('select') === 'grupo_id') return { json: base.ninos.map((n) => ({ grupo_id: n.grupo_id })) };
        return { json: base.ninos.map(({ id, apodo, avatar, autorizacion }) => ({ id, apodo, avatar, autorizacion })) };
      }
      const n = base.ninos.find((x) => x.id === eq('id'));
      if (!n) return { json: [] };
      if (m === 'PATCH') { Object.assign(n, cuerpo); return { json: [n] }; }
      if (m === 'DELETE') { base.ninos = base.ninos.filter((x) => x !== n); base.estrellas = base.estrellas.filter((e) => e.estudiante_id !== n.id); return { json: [n] }; }
    }
    if (p === '/rest/v1/rpc/crear_estudiante') {
      if (!/^[0-9]{3}$/.test(cuerpo.p_pin)) return { status: 400, json: { message: 'El PIN son tres imágenes' } };
      if (base.ninos.some((n) => n.apodo.toLowerCase() === cuerpo.p_apodo.toLowerCase())) return { status: 409, json: { code: '23505', message: 'duplicate key value violates unique constraint' } };
      const id = `e${base.siguiente++}`;
      base.ninos.push({ id, grupo_id: cuerpo.p_grupo, apodo: cuerpo.p_apodo, avatar: cuerpo.p_avatar, autorizacion: null });
      base.pines.set(id, cuerpo.p_pin);
      return { json: id };
    }
    if (p === '/rest/v1/rpc/cambiar_pin') { base.pines.set(cuerpo.p_estudiante, cuerpo.p_pin); base.llamadas.push(`cambiar_pin ${cuerpo.p_estudiante}`); return { json: null }; }
    if (p === '/rest/v1/estrellas') {
      const ids = (u.searchParams.get('estudiante_id') ?? '').replace(/^in\.\(|\)$/g, '').split(',');
      return { json: base.estrellas.filter((e) => ids.includes(e.estudiante_id) && e.creado === hoyCo).map((e) => ({ estudiante_id: e.estudiante_id })) };
    }
    if (p === '/rest/v1/rpc/dar_estrellas') {
      base.llamadas.push(`dar_estrellas ${cuerpo.p_motivo} ${cuerpo.p_estudiantes.length}`);
      let nuevas = 0;
      for (const e of cuerpo.p_estudiantes) {
        if (base.estrellas.some((x) => x.accion === cuerpo.p_accion && x.estudiante_id === e)) continue;
        base.estrellas.push({ accion: cuerpo.p_accion, estudiante_id: e, motivo: cuerpo.p_motivo, creado: hoyCo });
        nuevas++;
      }
      if (base.perderRespuesta > 0) { base.perderRespuesta--; return { abortar: true }; }
      return { json: nuevas * (cuerpo.p_motivo === 'colaborar' ? 15 : 10) };
    }
    // Aparato del niño.
    if (p === '/rest/v1/rpc/lista_grupo') return { json: base.grupo && cuerpo.p_codigo === base.grupo.codigo ? base.ninos.filter((n) => n.autorizacion).map((n) => ({ id: n.id, apodo: n.apodo, avatar: n.avatar, grupo: base.grupo.nombre })) : [] };
    if (p === '/rest/v1/rpc/entrar_estudiante') return { json: base.pines.get(cuerpo.p_estudiante) === cuerpo.p_pin ? 'ok' : 'errado' };
    if (p === '/rest/v1/progreso_misiones' || (p === '/rest/v1/estrellas')) return { json: [] };
    return null;
  };
}

async function abrir(navegador, base, { ancho = 390, alto = 844, rol = 'docente' } = {}) {
  const c = await navegador.newContext({ viewport: { width: ancho, height: alto }, reducedMotion: 'reduce', serviceWorkers: 'block', locale: 'es-CO' });
  if (rol) await c.addInitScript(([k, v]) => { if (!sessionStorage.sembrado) { localStorage.setItem(k, v); sessionStorage.sembrado = '1'; } }, [LLAVE_ADULTO, JSON.stringify(sesionAdulto(rol, { perfil: { rol, nombre: 'Profe Prueba', colegio_id: 'c1' } }))]);
  await c.route('**/*.mp4', (r) => r.abort());
  const manejador = atender(base);
  await simularSupabase(c, async (u, q) => {
    const r = await manejador(u, q);
    if (r) return r;
    // El simulador común devuelve el perfil con colegio nulo: aquí el docente tiene colegio.
    if (u.pathname === '/rest/v1/rpc/mi_perfil') return { json: { rol, nombre: 'Profe Prueba', colegio_id: 'c1', activo: true } };
    return null;
  });
  const p = await c.newPage();
  const errores = [];
  p.on('pageerror', (e) => errores.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|ERR_INTERNET|mp4|ERR_FAILED/.test(m.text()) && errores.push(m.text()));
  return { c, p, errores };
}

const medir = (p) => p.evaluate(() => ({
  desborde: document.documentElement.scrollWidth > innerWidth,
  toque: Math.min(99, ...[...document.querySelectorAll('main a, main button, main input, main select, main textarea, nav a, header a, header button')].filter((b) => b.offsetParent && getComputedStyle(b).visibility !== 'hidden').map((b) => { const r = b.getBoundingClientRect(); return Math.min(r.width, r.height); })),
}));
const texto = (p) => p.evaluate(() => document.body.innerText);
const estado = (p) => p.locator('.barra__estado').innerText().then((t) => t.trim());
const cola = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('pc_cola_estrellas_v1') ?? '[]'));
const tocarPin = async (p, cifras) => { for (const c of cifras) { await p.click(`.tecla-pin[aria-label="${PIN[Number(c)]}"]`); await p.waitForTimeout(60); } };
const darUna = async (p, apodo, motivo) => {
  await p.click(`.estrella-fila:has-text("${apodo}")`);
  await p.click(`.hoja__boton:has-text("${motivo}")`);
};

const servidor = await servir();
const navegador = await chromium.launch();
try {
  // 1. Inicio sin apodos; a un toque proyectar, dar estrellas y lista; dos toques por estrella.
  {
    const base = nuevaBase({ ninos: [['s1', 'Sara', 'mika', '2026-11-10'], ['s2', 'Leo', 'bruno', '2026-11-10'], ['s3', 'Juan M', 'tavi', null], ['s4', 'Ana', 'tavi', '2026-11-10']] });
    const { c, p, errores } = await abrir(navegador, base);
    await p.goto(url('/docente'));
    await p.waitForSelector('h1:has-text("Inicio")');
    await p.waitForSelector('.atajos--cuatro');
    const t = await texto(p);
    comprobar(['Sara', 'Leo', 'Juan', 'Ana'].every((a) => !t.includes(a)) && !(await p.content()).match(/Sara|Juan M/), 'Inicio no contiene ningún apodo (texto y DOM)');
    comprobar(t.includes('Jorge Barco Mora') && t.includes('3B'), 'Inicio muestra el colegio y el grupo, sin niños');
    const enlaces = await p.$$eval('.atajos--cuatro a', (as) => as.map((a) => a.getAttribute('href')));
    comprobar(enlaces.includes('/proyectar') && enlaces.includes('/docente/grupos/g1/estrellas') && enlaces.includes('/docente/grupos/g1') && enlaces.includes('/docente/grupos/g1/lista'), `a un toque: proyectar, dar estrellas, lista (${enlaces.join(' ')})`);
    const m = await medir(p);
    comprobar(!m.desborde && m.toque >= 48, `Inicio a 390: sin desborde, toque mínimo ${Math.round(m.toque)}`);
    await foto(p, '01-inicio-390');
    await p.click('.atajos--cuatro >> text=Dar estrellas');
    await p.waitForSelector('.estrella-fila');
    comprobar(ruta(p) === '/docente/grupos/g1/estrellas', 'Dar estrellas abre la lista de estrellas');
    const orden = await p.$$eval('.estrella-fila .nino__apodo', (e) => e.map((x) => x.textContent));
    comprobar(orden.join() === 'Ana,Juan M,Leo,Sara', `lista alfabética: ${orden.join()}`);
    const me = await medir(p);
    comprobar(!me.desborde && me.toque >= 48, `Estrellas a 390: sin desborde, toque mínimo ${Math.round(me.toque)}`);
    await foto(p, '02-estrellas-390');

    // Dos toques: el niño y el motivo.
    let toques = 0;
    p.on('request', () => {});
    await p.click('.estrella-fila:has-text("Sara")'); toques++;
    await p.waitForSelector('.hoja');
    await foto(p, '03-hoja-390');
    const alto = await p.$$eval('.hoja__boton', (b) => Math.min(...b.map((x) => x.getBoundingClientRect().height)));
    comprobar(alto >= 72, `los botones de la hoja miden ${alto} px (72 o más)`);
    await p.click('.hoja__boton:has-text("Participar")'); toques++;
    comprobar(toques === 2 && (await estado(p)) === '1 por subir', `una estrella en 2 toques; la barra dice "${await estado(p)}"`);
    const aviso = await p.locator('.aviso-estrella').innerText();
    comprobar(aviso.includes('Sara: participar') && aviso.includes('Deshacer'), `aviso: ${aviso.replace(/\s+/g, ' ')}`);
    comprobar((await p.locator('.estrella-fila:has-text("Sara") .mas-estrellas').innerText()) === '+10', 'la fila de Sara muestra +10');
    await foto(p, '04-aviso-390');
    comprobar(base.llamadas.length === 0, 'durante los 5 s todavía no se guardó nada');
    await p.waitForFunction(() => document.querySelector('.barra__estado')?.textContent?.includes('Todo guardado'), null, { timeout: 9000 });
    comprobar(base.llamadas.join() === 'dar_estrellas participar 1' && base.estrellas.length === 1, 'pasados 5 s subió una sola estrella');
    comprobar((await p.locator('.estrella-fila:has-text("Sara") .punto').count()) === 1 && (await p.locator('.estrella-fila:has-text("Leo") .punto').count()) === 0, 'punto suave "ya reconocido hoy" solo en Sara');

    // Deshacer dentro de los 5 s: no se guarda.
    await darUna(p, 'Leo', 'Colaborar');
    await p.click('.aviso-estrella >> text=Deshacer');
    comprobar((await cola(p)).length === 0 && (await estado(p)) === 'Todo guardado', 'deshacer antes de 5 s quita la estrella de la cola');
    await p.waitForTimeout(5600);
    comprobar(base.llamadas.length === 1 && (await p.locator('.estrella-fila:has-text("Leo") .punto').count()) === 0, 'lo deshecho nunca se sube y no marca el punto');

    // Colaborar en equipo: varios a la vez, una sola acción.
    await p.click('text=Colaborar en equipo');
    comprobar((await p.locator('button:has-text("Marque a los niños")').isDisabled()), 'equipo: sin marcados el botón está apagado');
    await p.click('.estrella-fila--marca:has-text("Ana")');
    await p.click('.estrella-fila--marca:has-text("Leo")');
    await foto(p, '05-equipo-390');
    await p.click('button:has-text("Dar colaborar a 2")');
    await p.waitForFunction(() => document.querySelector('.barra__estado')?.textContent?.includes('Todo guardado'), null, { timeout: 9000 });
    comprobar(base.llamadas.at(-1) === 'dar_estrellas colaborar 2', `colaborar a varios es una sola llamada: ${base.llamadas.at(-1)}`);

    // 2. Modo avión: 3 estrellas, "3 por subir", suben una sola vez al volver la red (aun con una respuesta perdida).
    const antes = base.estrellas.length;
    const llamadasAntes = base.llamadas.length;
    base.perderRespuesta = 1;
    await c.setOffline(true);
    await p.waitForSelector('.aviso-red');
    await darUna(p, 'Ana', 'Participar');
    await darUna(p, 'Juan M', 'Participar');
    await darUna(p, 'Leo', 'Colaborar');
    comprobar((await estado(p)) === '3 por subir', `modo avión: la barra dice "${await estado(p)}"`);
    await foto(p, '06-sin-red-390');
    await p.waitForTimeout(5800);
    comprobar((await estado(p)) === '3 por subir' && (await cola(p)).length === 3, 'sin red siguen las 3 en la cola del aparato');
    const ids = (await cola(p)).map((a) => a.accion);
    comprobar(new Set(ids).size === 3, 'cada acción tiene su identificador');
    // Se cierra y se abre la app con la red caída: la cola y la última lista siguen en el aparato.
    await c.setOffline(false);
    base.caida = true;
    await p.reload();
    await p.waitForSelector('.estrella-fila');
    comprobar((await estado(p)) === '3 por subir' && (await p.locator('.estrella-fila').count()) === 4, 'recargar sin red conserva "3 por subir" y la lista de niños');
    base.caida = false;
    await p.evaluate(() => dispatchEvent(new Event('online')));
    await p.waitForFunction(() => document.querySelector('.barra__estado')?.textContent?.includes('Todo guardado'), null, { timeout: 40000 });
    comprobar(base.estrellas.length === antes + 3, `al volver la red subieron 3 estrellas, ninguna doble (${base.estrellas.length - antes})`);
    comprobar(base.llamadas.length > llamadasAntes + 3, 'hubo un reintento por la respuesta perdida y la base no lo contó dos veces');
    comprobar((await cola(p)).length === 0, 'la cola quedó vacía');
    comprobar(!errores.length, `sin errores de consola ${errores.join(' | ')}`);
    await c.close();
  }

  // 3. Docente sin grupo: crea el suyo, agrega una lista pegada, marca autorización, PIN, personaje, retira.
  const base = nuevaBase({ conGrupo: false });
  {
    const { c, p, errores } = await abrir(navegador, base);
    await p.goto(url('/docente'));
    await p.waitForSelector('h1:has-text("Inicio")');
    await p.waitForSelector('text=Todavía no tiene grupos');
    await foto(p, '07-sin-grupos-390');
    await p.click('main >> text=Crear un grupo');
    await p.waitForSelector('h1:has-text("Mis grupos")');
    comprobar((await texto(p)).includes('pídaselo a él'), 'sin grupos explica a quién pedirlo (el coordinador)');
    await p.click('button:has-text("Crear grupo")');
    comprobar((await p.locator('#grupo-nombre').inputValue()) === '' && (await texto(p)).includes('Escriba el nombre del grupo'), 'crear sin nombre pide el nombre');
    await p.fill('#grupo-nombre', '3B');
    await p.click('button:has-text("Crear grupo")');
    await p.waitForSelector('h1:has-text("Grupo 3B")');
    comprobar(ruta(p) === '/docente/grupos/g1' && (await p.locator('.codigo-grande').innerText()) === 'K7M2P', 'crea su grupo y ve el código K7M2P');
    comprobar((await texto(p)).includes('Aquí aparecerán los niños de 3B'), 'grupo vacío: texto del esqueleto');
    await foto(p, '08-grupo-vacio-390');

    // Lista pegada con numeración, un repetido y un apodo largo aparte.
    await p.fill('#nuevos-apodos', '1. Sara\n2. Leo\n3) Juan M\n- Ana\nsara\nMarcos; Lucía, Pedro\nÁngela\nBruno Z\n');
    await p.click('button[type=submit]:has-text("Agregar")');
    await p.waitForSelector('.mensaje--ok, .mensaje--error:not(:empty)');
    if (base.ninos.length !== 9) console.log((await p.locator('form .mensaje').allInnerTexts()).join(' | '));
    comprobar(base.ninos.length === 9 && (await p.locator('.mensaje--ok').innerText()).includes('agregaron 9 niños'), `pegar una lista agrega 9 niños sin repetir (${base.ninos.length})`);
    comprobar(base.ninos.slice(0, 4).map((n) => n.avatar).join() === 'tavi,mika,bruno,tavi', `personajes alternados: ${base.ninos.slice(0, 4).map((n) => n.avatar)}`);
    await p.waitForSelector('.nino');
    const apodos = await p.$$eval('.nino__apodo', (e) => e.map((x) => x.textContent));
    comprobar(apodos[0] === 'Ana' && apodos.length === 9, `lista alfabética en el grupo: ${apodos.join()}`);
    // Repetir un apodo da un mensaje claro y deja el texto para corregirlo.
    await p.fill('#nuevos-apodos', 'Sara');
    await p.click('button[type=submit]:has-text("Agregar")');
    await p.waitForSelector('.mensaje--error >> text=ya está en el grupo');
    comprobar(base.ninos.length === 9, 'un apodo repetido no se agrega y avisa que agregue una inicial');
    await p.fill('#nuevos-apodos', 'Zoe');
    await p.selectOption('#nuevos-personaje', 'bruno');
    await p.click('button[type=submit]:has-text("Agregar")');
    await p.waitForFunction(() => document.querySelectorAll('.nino').length === 10);
    comprobar(base.ninos.at(-1).avatar === 'bruno', 'un personaje elegido se respeta');
    await foto(p, '09-grupo-390');
    const m = await medir(p);
    if (m.toque < 48) console.log(await p.evaluate(() => [...document.querySelectorAll('main a, main button, main input, main select, main textarea')].filter((b) => b.offsetParent && Math.min(b.getBoundingClientRect().width, b.getBoundingClientRect().height) < 48).map((b) => `${b.tagName}.${b.className} ${b.textContent.slice(0, 20)} ${Math.round(b.getBoundingClientRect().width)}x${Math.round(b.getBoundingClientRect().height)}`)));
    comprobar(!m.desborde && m.toque >= 48, `Grupo a 390: sin desborde, toque mínimo ${Math.round(m.toque)}`);

    // Autorización con fecha.
    comprobar((await p.locator('.nino:has-text("Sara") .meta--aviso').innerText()) === 'Falta la autorización', 'sin autorización: "Falta la autorización"');
    await p.check('input[aria-label="Autorización recibida de Sara"]');
    await p.waitForSelector('.nino:has-text("Autorización:")');
    const sara = base.ninos.find((n) => n.apodo === 'Sara');
    comprobar(sara.autorizacion === hoyCo, `marcar la autorización guarda la fecha de hoy (${sara.autorizacion})`);
    await p.click('button[aria-label="Opciones de Sara"]');
    await p.waitForSelector('input[type=date]');
    await p.fill('input[type=date]', '2026-11-03');
    await p.waitForFunction(() => document.body.innerText.includes('Autorización: 3 nov 2026'));
    comprobar(sara.autorizacion === '2026-11-03', 'la fecha de la autorización se puede cambiar');
    await foto(p, '10-opciones-390');

    // Cambiar personaje.
    await p.click('.nino:has-text("Sara") .personaje:has-text("Bruno")');
    await p.waitForFunction(() => document.querySelector('.nino input[type=radio]:checked')?.closest('.personaje')?.textContent?.includes('Bruno'));
    comprobar(sara.avatar === 'bruno', 'cambiar el personaje se guarda');
    // Cambiar PIN: se genera y no se ve; ofrece imprimir la tarjeta.
    const pinAntes = base.pines.get(sara.id);
    await p.click('.nino:has-text("Sara") button:has-text("Cambiar PIN")');
    await p.waitForSelector('text=Imprimir la tarjeta');
    const t = await texto(p);
    comprobar(base.llamadas.at(-1) === `cambiar_pin ${sara.id}` && /^[0-9]{3}$/.test(base.pines.get(sara.id)), `cambiar PIN llama a la base con un PIN de 3 cifras (antes ${pinAntes ? 'había' : 'no había'})`);
    comprobar(t.includes('Se ve solo en la tarjeta impresa') && !t.includes(base.pines.get(sara.id)), 'el PIN no aparece en pantalla');
    await p.click('text=Imprimir la tarjeta');
    await p.waitForSelector('.tarjeta');
    comprobar(ruta(p) === `/docente/grupos/g1/tarjetas/${sara.id}` && (await p.locator('.tarjeta').count()) === 1, 'la tarjeta de un solo niño');
    await foto(p, '11-tarjeta-390');
    const pinVisible = await p.locator('.tarjeta__imagen svg').first().isVisible();
    comprobar(!pinVisible, 'en pantalla las imágenes del PIN no se ven');
    await p.goBack();
    await p.waitForSelector('.nino');

    // Retirar con confirmación.
    await p.click('button[aria-label="Opciones de Marcos"]');
    await p.click('.nino:has-text("Marcos") button:has-text("Retirar del grupo")');
    await p.waitForSelector('text=¿Retirar a Marcos?');
    await p.click('.nino:has-text("Marcos") >> text=No');
    comprobar(base.ninos.some((n) => n.apodo === 'Marcos'), 'responder No no retira');
    await p.click('.nino:has-text("Marcos") button:has-text("Retirar del grupo")');
    await p.click('.nino:has-text("Marcos") button:has-text("Sí, retirar")');
    await p.waitForFunction(() => !document.body.innerText.includes('Marcos'));
    comprobar(!base.ninos.some((n) => n.apodo === 'Marcos'), 'retirar borra al niño tras confirmar');

    // Sin red: lo que cambia datos se apaga con "Necesita internet".
    await c.setOffline(true);
    await p.waitForSelector('.aviso-red');
    comprobar(await p.locator('button:has-text("Necesita internet")').first().isDisabled(), 'sin red, Agregar dice "Necesita internet" y está apagado');
    comprobar(await p.locator('input[aria-label="Autorización recibida de Ana"]').isDisabled(), 'sin red, la casilla de autorización se apaga');
    await foto(p, '12-grupo-sin-red-390');
    await c.setOffline(false);

    // Tarjetas del grupo: PIN solo al imprimir; 9 niños → 2 hojas (8 por hoja); lista en orden.
    await p.click('text=Imprimir tarjetas');
    await p.waitForSelector('.tarjetas');
    const hay = await p.locator('.tarjeta').count();
    comprobar(hay === 9 - 0 && (await texto(p)).includes('Sin autorización marcada'), `tarjetas con PIN de esta sesión: ${hay}, avisa quiénes no tienen autorización`);
    await foto(p, '13-tarjetas-390');
    await p.emulateMedia({ media: 'print' });
    comprobar(await p.locator('.tarjeta__imagen svg').first().isVisible() && !(await p.locator('.barra').isVisible()), 'al imprimir se ven las imágenes del PIN y no la barra');
    const { writeFileSync } = await import('node:fs');
    const pdf = await p.pdf({ format: 'Letter', preferCSSPageSize: true, printBackground: true });
    writeFileSync(`${CAPTURAS}/docente-tarjetas.pdf`, pdf);
    const hojas = (pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) ?? []).length;
    comprobar(hojas === 2, `9 tarjetas salen en ${hojas} hojas carta (8 por hoja)`);
    await p.emulateMedia({ media: 'screen' });

    await p.goto(url('/docente/grupos/g1/lista'));
    await p.waitForSelector('.lista-hoja table');
    comprobar((await p.locator('tbody tr').count()) === 8, 'lista para estrellas con una fila por niño');
    await foto(p, '14-lista-390');
    await p.emulateMedia({ media: 'print' });
    const pdf2 = await p.pdf({ format: 'Letter', preferCSSPageSize: true, printBackground: true });
    writeFileSync(`${CAPTURAS}/docente-lista.pdf`, pdf2);
    comprobar((pdf2.toString('latin1').match(/\/Type\s*\/Page\b/g) ?? []).length === 1, 'la lista de 8 niños cabe en una hoja');
    await p.emulateMedia({ media: 'screen' });
    comprobar(!errores.length, `sin errores de consola ${errores.join(' | ')}`);
    await c.close();
  }

  // 4. El niño entra con el código: solo ve a quien tiene autorización, y entra con el PIN que imprimió el docente.
  {
    const sara = base.ninos.find((n) => n.apodo === 'Sara');
    const { c, p, errores } = await abrir(navegador, base, { rol: null });
    await p.goto(url('/t/K7M2P'));
    await p.waitForSelector('.nino--caras');
    const caras = await p.locator('.cara').count();
    comprobar(caras === 1, `el niño solo ve a quien tiene autorización (${caras} cara)`);
    await p.click('.cara:has-text("Sara")');
    await p.waitForSelector('.teclado-pin');
    await tocarPin(p, base.pines.get(sara.id));
    await p.waitForSelector('.mundo', { timeout: 20000 });
    comprobar(ruta(p) === '/mapa', 'Sara entra con su PIN y llega al mapa');
    comprobar(!errores.length, `sin errores de consola ${errores.join(' | ')}`);
    await c.close();
  }

  // 5. A 1280: inicio, grupo y estrellas.
  {
    const b = nuevaBase({ ninos: [['s1', 'Sara', 'mika', '2026-11-10'], ['s2', 'Leo', 'bruno', null], ['s3', 'Ana', 'tavi', '2026-11-10']] });
    const { c, p } = await abrir(navegador, b, { ancho: 1280, alto: 800 });
    await p.goto(url('/docente'));
    await p.waitForSelector('.atajos--cuatro');
    await foto(p, '15-inicio-1280');
    await p.goto(url('/docente/grupos'));
    await p.waitForSelector('text=Grado 3°');
    await foto(p, '16-grupos-1280');
    await p.click('text=3B');
    await p.waitForSelector('.nino');
    await p.click('button[aria-label="Opciones de Leo"]');
    await foto(p, '17-grupo-1280');
    await p.goto(url('/docente/grupos/g1/estrellas'));
    await p.waitForSelector('.estrella-fila');
    await p.click('.estrella-fila:has-text("Leo")');
    await p.waitForSelector('.hoja');
    await foto(p, '18-estrellas-1280');
    await p.goto(url('/docente/grupos/g1/lista'));
    await p.waitForSelector('.lista-hoja table');
    await foto(p, '19-lista-1280');
    await c.close();
  }
} finally {
  await navegador.close();
  servidor.kill();
}
console.log(fallos.length ? `\n${fallos.length} fallas:\n- ${fallos.join('\n- ')}` : '\ntodo bien');
process.exit(fallos.length ? 1 : 0);
