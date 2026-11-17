// Tanda 2 del esqueleto: entrada de adultos con Supabase simulado (no sale a la red).
// Entrar, error de contraseña, redirección por rol, sección ajena, salir, recuperar,
// contraseña nueva, invitación, cuenta sin acceso y sin red. A 390 × 844 y capturas a 1280.
// Uso: `npm run build`, luego `node scripts/pruebas/adultos.mjs`.
import { chromium, servir, URL_APP, CAPTURAS, LLAVE_ADULTO, sesionAdulto, simularSupabase } from './comun.mjs';

const url = (r) => new URL(r, URL_APP).href;
const fallos = [];
const comprobar = (ok, texto) => { console.log(ok ? 'bien ' : 'FALLA', texto); if (!ok) fallos.push(texto); };
const ruta = (p) => new URL(p.url()).pathname;

/** Token falso con el rol, como lo devuelve /auth/v1/token. */
const token = (rol) => ({ access_token: `falso-${rol}`, refresh_token: `r-${rol}`, expires_in: 3600, user: { email: `${rol}@prueba.co` } });

/** Contexto a 390 × 844 con Supabase simulado; `sesion` se guarda antes de abrir la primera página. */
async function abrirAdultos(navegador, { ancho = 390, alto = 844, sesion, extra } = {}) {
  const c = await navegador.newContext({ viewport: { width: ancho, height: alto }, reducedMotion: 'reduce', serviceWorkers: 'block' });
  if (sesion) await c.addInitScript(([k, v]) => { if (!sessionStorage.sembrado) { localStorage.setItem(k, v); sessionStorage.sembrado = '1'; } }, [LLAVE_ADULTO, JSON.stringify(sesion)]);
  const pedidos = await simularSupabase(c, extra);
  const p = await c.newPage();
  const errores = [];
  p.on('pageerror', (e) => errores.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|ERR_INTERNET/.test(m.text()) && errores.push(m.text()));
  return { c, p, pedidos, errores };
}

/** Responde el login: la contraseña "bien" entra con el rol del correo; otra cosa, 400. */
const login = (url, q) => {
  if (url.pathname !== '/auth/v1/token' || url.searchParams.get('grant_type') !== 'password') return null;
  const { email, password } = JSON.parse(q.postData());
  if (password !== 'bien') return { status: 400, json: { error: 'invalid_grant', error_description: 'Invalid login credentials' } };
  return { json: token(email.split('@')[0]) };
};

/** Mide desbordes y el menor objetivo de toque visible. */
const medir = (p) => p.evaluate(() => ({
  desborde: document.documentElement.scrollWidth > innerWidth,
  toque: Math.min(99, ...[...document.querySelectorAll('main a, main button, main input, nav a, header a, header button')].filter((b) => b.offsetParent).map((b) => { const q = b.getBoundingClientRect(); return Math.min(q.width, q.height); })),
}));

const servidor = await servir();
const navegador = await chromium.launch();
try {
  // 1. Formulario vacío, error de contraseña y entrada por rol.
  {
    const { c, p, pedidos, errores } = await abrirAdultos(navegador, { extra: login });
    await p.goto(url('/adultos'));
    await p.waitForSelector('h1:has-text("Entrar")');
    const m = await medir(p);
    comprobar(!m.desborde && m.toque >= 48, `/adultos sin desborde, toque mínimo ${Math.round(m.toque)}`);
    await p.screenshot({ path: `${CAPTURAS}/adultos-entrar-390.png` });
    await p.click('button:has-text("Entrar")');
    comprobar((await p.locator('#correo-error').textContent()) === 'Escriba su correo.' && (await p.locator('#clave-error').textContent()) === 'Escriba su contraseña.', 'vacío: un mensaje bajo cada campo');
    await p.fill('#correo', 'docente@prueba.co');
    await p.fill('#clave', 'mal');
    await p.click('button:has-text("Entrar")');
    await p.waitForSelector('#clave-error:has-text("no coinciden")');
    comprobar(await p.locator('#clave').getAttribute('aria-invalid') === 'true', 'contraseña errada: "no coinciden" bajo la contraseña');
    await p.screenshot({ path: `${CAPTURAS}/adultos-error-390.png` });
    await p.click('button:has-text("Ver")');
    comprobar(await p.locator('#clave').getAttribute('type') === 'text', '"Ver" muestra la contraseña');
    await p.fill('#clave', 'bien');
    await p.click('button:has-text("Entrar")');
    await p.waitForSelector('h1:has-text("Inicio")');
    comprobar(ruta(p) === '/docente', `docente entra y cae en ${ruta(p)}`);
    const guardada = await p.evaluate((k) => JSON.parse(localStorage.getItem(k)), LLAVE_ADULTO);
    comprobar(guardada?.perfil?.rol === 'docente' && !JSON.stringify(guardada).includes('bien'), 'la sesión guarda el rol y nunca la contraseña');
    for (const ajena of ['/colegio', '/plataforma/cartillas', '/adultos']) {
      await p.goto(url(ajena));
      await p.waitForSelector('h1:has-text("Inicio")');
      comprobar(ruta(p) === '/docente', `docente que abre ${ajena} vuelve a /docente`);
    }
    await p.click('nav >> text=Más');
    await p.click('main button:has-text("Salir")');
    await p.waitForSelector('h1:has-text("Entrar")');
    const sinSesion = await p.evaluate((k) => localStorage.getItem(k), LLAVE_ADULTO);
    comprobar(ruta(p) === '/adultos' && sinSesion === null && pedidos.some((x) => x.ruta === '/auth/v1/logout'), 'salir cierra la sesión en el servidor y en el aparato');
    await p.goto(url('/docente/grupos'));
    await p.waitForSelector('h1:has-text("Entrar")');
    comprobar(ruta(p) === '/adultos', 'sin sesión, /docente/grupos lleva a /adultos');
    for (const [rol, inicio, titulo] of [['coordinador', '/colegio', 'Uso y avance'], ['dueno', '/plataforma', 'Colegios']]) {
      await p.fill('#correo', `${rol}@prueba.co`);
      await p.fill('#clave', 'bien');
      await p.click('button:has-text("Entrar")');
      await p.waitForSelector(`h1:has-text("${titulo}")`);
      comprobar(ruta(p) === inicio, `${rol} entra y cae en ${ruta(p)}`);
      await p.goto(url('/docente'));
      await p.waitForSelector(`h1:has-text("${titulo}")`);
      comprobar(ruta(p) === inicio, `${rol} que abre /docente vuelve a ${inicio}`);
      await p.screenshot({ path: `${CAPTURAS}/adultos-${rol}-390.png` });
      await p.click('header button:has-text("Salir")');
      await p.waitForSelector('h1:has-text("Entrar")');
    }
    comprobar(!errores.length, `sin errores de consola ${errores.join(' | ')}`);
    await c.close();
  }

  // 2. A 1280: entrada y coordinador con su barra lateral.
  {
    const { c, p } = await abrirAdultos(navegador, { ancho: 1280, alto: 800, extra: login });
    await p.goto(url('/adultos'));
    await p.waitForSelector('h1:has-text("Entrar")');
    await p.screenshot({ path: `${CAPTURAS}/adultos-entrar-1280.png` });
    await p.fill('#correo', 'coordinador@prueba.co');
    await p.fill('#clave', 'bien');
    await p.click('button:has-text("Entrar")');
    await p.waitForSelector('h1:has-text("Uso y avance")');
    await p.click('nav >> text=Cuenta');
    await p.waitForSelector('h1:has-text("Cuenta")');
    comprobar(await p.locator('text=coordinador@prueba.co').count() === 1, 'la cuenta muestra el correo');
    await p.screenshot({ path: `${CAPTURAS}/adultos-cuenta-1280.png` });
    await c.close();
  }

  // 3. Sin red: entrar la primera vez avisa; con sesión guardada entra con banda de sin conexión.
  {
    const { c, p } = await abrirAdultos(navegador, { extra: login });
    await p.goto(url('/adultos'));
    await p.waitForSelector('h1:has-text("Entrar")');
    await c.setOffline(true);
    await p.fill('#correo', 'docente@prueba.co');
    await p.fill('#clave', 'bien');
    await p.click('button:has-text("Entrar")');
    await p.waitForSelector('[role="alert"]:has-text("hace falta internet")');
    comprobar(true, 'sin red: "Para entrar la primera vez hace falta internet"');
    await p.screenshot({ path: `${CAPTURAS}/adultos-sin-red-390.png` });
    await c.close();
  }
  {
    // Token vencido y Supabase inalcanzable: entra con lo último guardado, solo lectura.
    const { c, p, errores } = await abrirAdultos(navegador, { sesion: sesionAdulto('docente', { vence: Date.now() - 1000 }), extra: () => ({ abortar: true }) });
    await p.goto(url('/adultos'));
    await p.waitForSelector('h1:has-text("Inicio")');
    await p.waitForSelector('.aviso-red');
    comprobar(ruta(p) === '/docente' && (await p.locator('.aviso-red').textContent()).includes('Sin conexión'), 'con sesión y sin red: entra a su inicio con la banda de sin conexión');
    await p.screenshot({ path: `${CAPTURAS}/adultos-docente-sin-red-390.png` });
    comprobar(!errores.length, `sin errores de consola ${errores.join(' | ')}`);
    await c.close();
  }

  // 4. Recuperar la contraseña.
  {
    const { c, p, pedidos } = await abrirAdultos(navegador, { extra: (u) => (u.pathname === '/auth/v1/recover' ? { json: {} } : null) });
    await p.goto(url('/adultos'));
    await p.click('text=Olvidé mi contraseña');
    await p.waitForSelector('h1:has-text("Recuperar la contraseña")');
    await p.fill('#correo', 'sin arroba');
    await p.click('button:has-text("Enviar el enlace")');
    comprobar((await p.locator('#correo-error').textContent()).includes('Revise el correo'), 'correo mal escrito: aviso bajo el campo');
    await p.fill('#correo', 'docente@prueba.co');
    await p.click('button:has-text("Enviar el enlace")');
    await p.waitForSelector('h1:has-text("Revise su correo")');
    const pedido = pedidos.find((x) => x.ruta.startsWith('/auth/v1/recover'));
    comprobar(pedido && decodeURIComponent(pedido.ruta).includes('redirect_to=http://localhost:4319/adultos/clave-nueva'), 'el enlace del correo vuelve a /adultos/clave-nueva');
    await p.screenshot({ path: `${CAPTURAS}/adultos-recuperar-390.png` });
    await c.close();
  }

  // 5. Contraseña nueva desde el enlace (válido y vencido).
  {
    const { c, p, pedidos } = await abrirAdultos(navegador, { extra: (u, q) => (u.pathname === '/auth/v1/user' ? (q.method() === 'PUT' ? { json: { id: 'x' } } : { json: { email: 'docente@prueba.co' } }) : null) });
    await p.goto(url('/adultos/clave-nueva#access_token=falso-docente&refresh_token=r&expires_in=3600&token_type=bearer&type=recovery'));
    await p.waitForSelector('h1:has-text("Contraseña nueva")');
    comprobar(!p.url().includes('access_token'), 'el token del enlace se borra de la dirección');
    await p.fill('#clave-nueva', 'corta');
    await p.click('button:has-text("Guardar y entrar")');
    comprobar((await p.locator('#clave-nueva-error').textContent()).includes('al menos 8'), 'contraseña corta: aviso bajo el campo');
    await p.fill('#clave-nueva', 'una clave larga');
    await p.screenshot({ path: `${CAPTURAS}/adultos-clave-nueva-390.png` });
    await p.click('button:has-text("Guardar y entrar")');
    await p.waitForSelector('h1:has-text("Inicio")');
    comprobar(ruta(p) === '/docente' && pedidos.some((x) => x.metodo === 'PUT' && x.ruta === '/auth/v1/user'), 'guarda la contraseña y entra a /docente');
    await c.close();
  }
  {
    const { c, p } = await abrirAdultos(navegador);
    await p.goto(url('/adultos/clave-nueva#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'));
    await p.waitForSelector('h1:has-text("El enlace ya no sirve")');
    await p.click('text=Pedir un enlace nuevo');
    await p.waitForSelector('h1:has-text("Recuperar la contraseña")');
    comprobar(true, 'enlace vencido: lo dice y lleva a pedir otro');
    await c.close();
  }

  // 6. Invitación: con invitación vigente crea la contraseña y entra; sin ella lo dice.
  {
    let aceptada = false;
    const { c, p } = await abrirAdultos(navegador, {
      extra: (u, q) => {
        if (u.pathname === '/rest/v1/rpc/mi_perfil') return { json: aceptada ? { rol: 'docente', nombre: 'Marta', colegio_id: 'c1', activo: true } : null };
        if (u.pathname === '/rest/v1/rpc/aceptar_invitacion') { aceptada = true; return { json: 'docente' }; }
        if (u.pathname === '/auth/v1/user') return q.method() === 'PUT' ? { json: {} } : { json: { email: 'marta@colegio.co' } };
        return null;
      },
    });
    await p.goto(url('/adultos/invitacion#access_token=falso-nuevo&refresh_token=r&expires_in=3600&type=signup'));
    await p.waitForSelector('h1:has-text("Le damos la bienvenida, Marta")');
    comprobar(await p.locator('text=marta@colegio.co').count() === 1, 'invitación aceptada: saluda por el nombre y muestra el correo');
    await p.screenshot({ path: `${CAPTURAS}/adultos-invitacion-390.png` });
    await p.fill('#clave-nueva', 'una clave larga');
    await p.click('button:has-text("Guardar y entrar")');
    await p.waitForSelector('h1:has-text("Inicio")');
    comprobar(ruta(p) === '/docente', 'tras la invitación entra a /docente');
    await c.close();
  }
  {
    const { c, p } = await abrirAdultos(navegador, {
      extra: (u) => (u.pathname === '/rest/v1/rpc/mi_perfil' ? { json: null } : u.pathname === '/rest/v1/rpc/aceptar_invitacion' ? { json: null } : u.pathname === '/auth/v1/user' ? { json: { email: 'otro@colegio.co' } } : null),
    });
    await p.goto(url('/adultos/invitacion#access_token=falso-nadie&refresh_token=r&expires_in=3600&type=magiclink'));
    await p.waitForSelector('h1:has-text("No encontramos su invitación")');
    await p.screenshot({ path: `${CAPTURAS}/adultos-sin-invitacion-390.png` });
    await p.goto(url('/docente'));
    await p.waitForSelector('h1:has-text("Su cuenta no tiene acceso")');
    comprobar(ruta(p) === '/adultos', 'sin invitación: lo dice, y /docente lleva a "Su cuenta no tiene acceso"');
    await p.click('button:has-text("Salir")');
    await p.waitForSelector('h1:has-text("Entrar")');
    await c.close();
  }

  // 7. Docente desactivado: su sesión guardada deja de servir al volver a comprobarla.
  {
    const { c, p } = await abrirAdultos(navegador, {
      sesion: sesionAdulto('docente'),
      extra: (u) => (u.pathname === '/rest/v1/rpc/mi_perfil' ? { json: { rol: 'docente', nombre: 'X', colegio_id: null, activo: false } } : null),
    });
    await p.goto(url('/docente'));
    await p.waitForSelector('h1:has-text("Su cuenta no tiene acceso")');
    comprobar(ruta(p) === '/adultos', 'docente desactivado: vuelve a la entrada con "Su cuenta no tiene acceso"');
    await c.close();
  }
} finally {
  await navegador.close();
  servidor.kill();
}
console.log(fallos.length ? `\n${fallos.length} fallas` : '\nTodo bien');
process.exit(fallos.length ? 1 : 0);
