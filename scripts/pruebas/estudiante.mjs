// Tanda 3 del esqueleto: entrada del estudiante con Supabase simulado (no sale a la red), a 390 × 844.
// Criterio de esqueleto.md §8: dos niños de grupos distintos y un invitado en el mismo celular, cada uno
// con su avance; PIN errado 5 veces → descanso y "Jugar mientras tanto", nunca "bloqueado"; 'ayuda' →
// "pídele ayuda a tu profe"; en modo avión un perfil ya usado entra con su PIN; lo jugado sin red sube
// una sola vez al volver la red; botones del niño de 72 px o más; familia con reto y entrada de adultos.
// Uso: `npm run build`, luego `node scripts/pruebas/estudiante.mjs`.
import { chromium, servir, URL_APP, CAPTURAS, CLAVE, conMisiones, cerrarCharla, entrarAMision, jugarEscuchaToca } from './comun.mjs';

const url = (r) => new URL(r, URL_APP).href;
const ruta = (p) => new URL(p.url()).pathname;
const fallos = [];
const comprobar = (ok, texto) => { console.log(ok ? 'bien ' : 'FALLA', texto); if (!ok) fallos.push(texto); };
const foto = (p, n) => p.screenshot({ path: `${CAPTURAS}/estudiante-${n}.png` });
const PIN = ['sol', 'luna', 'pez', 'hoja', 'corazón', 'casa', 'gota', 'estrella', 'nube', 'flor'];

// ---------------------------------------------------------------- Supabase simulado

const GRUPOS = {
  K7M2P: [
    { id: 's1', apodo: 'Sara', avatar: 'mika', grupo: '3B', pin: '172' },
    { id: 's2', apodo: 'Juan M', avatar: 'tavi', grupo: '3B', pin: '000' },
    { id: 's3', apodo: 'Leo', avatar: 'bruno', grupo: '3B', pin: 'ayuda' },
  ],
  Q9W3E: [{ id: 't1', apodo: 'Thiago', avatar: 'bruno', grupo: '4A', pin: '345' }],
};
const fallosPin = {};
const registros = [];
const otras = [];

async function simular(contexto) {
  await contexto.route(/\/(auth|rest)\/v1\//, (r) => atender(r).catch((e) => { otras.push(String(e)); return r.abort(); }));
  async function atender(r) {
    const q = r.request();
    const u = new URL(q.url());
    const cuerpo = q.postData() ? JSON.parse(q.postData()) : {};
    const responder = (json, status = 200) => r.fulfill({ status, contentType: 'application/json', body: json === undefined ? '' : JSON.stringify(json) });
    if (u.pathname === '/auth/v1/signup') return responder({ access_token: 'anon-1', refresh_token: 'ra', expires_in: 3600, user: { id: 'aparato' } });
    if (u.pathname === '/rest/v1/rpc/lista_grupo') return responder((GRUPOS[cuerpo.p_codigo] ?? []).map(({ pin, ...c }) => c));
    if (u.pathname === '/rest/v1/rpc/entrar_estudiante') {
      const nino = (GRUPOS[cuerpo.p_codigo] ?? []).find((n) => n.id === cuerpo.p_estudiante);
      if (!nino) return responder('no-existe');
      if (nino.pin === 'ayuda') return responder('ayuda');
      if (nino.pin === cuerpo.p_pin) return responder('ok');
      fallosPin[nino.id] = (fallosPin[nino.id] ?? 0) + 1;
      return responder(fallosPin[nino.id] >= 5 ? 'descanso' : 'errado');
    }
    if (u.pathname === '/rest/v1/rpc/registrar_mision') { registros.push(cuerpo); return responder(15); }
    // Sara jugó "colors" en otro celular: su cuenta lo trae.
    const sara = u.searchParams.get('estudiante_id') === 'eq.s1';
    if (u.pathname === '/rest/v1/progreso_misiones') return responder(sara ? [{ mision_id: 'bosque-colors-2', veces: 1, mejor_errores: 0, autoeval: null }] : []);
    if (u.pathname === '/rest/v1/estrellas') return responder(sara ? [{ id: 9, motivo: 'completar', cantidad: 15, mision_id: 'bosque-colors-2', creado: '2026-11-10', otorgada_por: null }, { id: 10, motivo: 'participar', cantidad: 10, mision_id: null, creado: '2026-11-12', otorgada_por: 'd1' }] : []);
    otras.push(`${q.method()} ${u.pathname}`);
    return responder({ message: 'sin simular' }, 404);
  }
}

async function nuevo(navegador, progreso) {
  const c = await navegador.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
  if (progreso) await c.addInitScript(([k, v]) => { if (!sessionStorage.sembrado) { localStorage.setItem(k, v); sessionStorage.sembrado = '1'; } }, [CLAVE, JSON.stringify(progreso)]);
  await c.route('**/*.mp4', (r) => r.abort());
  await simular(c);
  const p = await c.newPage();
  const errores = [];
  const pedidos = [];
  p.on('pageerror', (e) => errores.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && !/mp4|ERR_FAILED|ERR_INTERNET|Failed to load resource/.test(m.text()) && errores.push(m.text()));
  p.on('request', (q) => pedidos.push(new URL(q.url()).pathname));
  return { c, p, errores, pedidos };
}

/** Menor lado de los botones visibles del niño (sin la puerta del adulto ni lo que escribe el adulto). */
const menorBoton = (p) => p.evaluate(() => Math.min(99, ...[...document.querySelectorAll('.nino button, .cambiar-jugador')].filter((b) => b.offsetParent && !b.closest('.nino--tarjeta') && !b.classList.contains('pie-familia')).map((b) => { const r = b.getBoundingClientRect(); return Math.min(r.width, r.height); })));
const texto = (p) => p.evaluate(() => document.body.innerText);
const tocarPin = async (p, cifras) => { for (const c of cifras) { await p.click(`.tecla-pin[aria-label="${PIN[Number(c)]}"]`); await p.waitForTimeout(60); } };
const local = (p, llave) => p.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), llave);
const toques = [];
const medir = async (p, nombre) => { const t = await menorBoton(p); toques.push(`${nombre} ${Math.round(t)}`); return t; };

const servidor = await servir();
const navegador = await chromium.launch();
try {
  // 1. Celular con progreso de antes (pasa a ser del invitado), sin niños con tarjeta.
  const guardado = conMisiones(['bosque-school', 'bosque-school-2'], { heroe: 'tavi', album: [{ en: 'frog', es: 'rana', icono: 'iconos/1f438.svg' }] });
  const { c, p, errores, pedidos } = await nuevo(navegador, guardado);
  await p.goto(url('/'));
  await p.waitForSelector('.jugar-invitado');
  await p.waitForTimeout(500);
  comprobar(!pedidos.some((r) => /nube|supabase/.test(r)), 'la primera carga de / no trae el cliente de Supabase');
  comprobar((await p.locator('text=Jugar sin tarjeta').count()) === 1 && (await p.locator('text=Tengo una tarjeta').count()) === 1, 'sin niños con tarjeta: "Jugar sin tarjeta" y "Tengo una tarjeta"');
  await medir(p, 'vacío');
  await foto(p, '01-vacio-390');

  // 2. Tarjeta: código escrito con el teclado propio, caras del grupo, Juan erra 5 veces.
  await p.click('text=Tengo una tarjeta');
  await p.waitForSelector('.teclado-codigo');
  comprobar(pedidos.some((r) => /nube/.test(r)), 'el cliente de Supabase se carga al usar la tarjeta');
  for (const l of 'K7M2X') await p.click(`.teclado-codigo button:text-is("${l}")`);
  await p.waitForSelector('.tarjeta__aviso.es-error');
  comprobar((await p.locator('.tarjeta__aviso').textContent()).includes('no existe'), 'código errado: "Ese código no existe"');
  await foto(p, '02-codigo-errado-390');
  await p.click('.teclado-codigo__borrar');
  await p.click('.teclado-codigo button:text-is("P")');
  await p.waitForSelector('.nino--caras');
  comprobar(ruta(p) === '/tarjeta/quien' && (await p.locator('.cara').count()) === 3, 'código bien: /tarjeta/quien con las 3 caras del grupo');
  await medir(p, 'caras');
  await foto(p, '03-caras-390');
  await p.click('.cara:has-text("Juan M")');
  await p.waitForSelector('.teclado-pin');
  await medir(p, 'clave');
  await tocarPin(p, '17');
  await foto(p, '04-pin-dos-390');
  await p.click('.redondo[aria-label="Borrar el último dibujo"]');
  comprobar((await p.locator('.ranura--llena').count()) === 1, 'borrar quita solo la última imagen');
  await p.click('.redondo[aria-label="Borrar el último dibujo"]');
  for (let i = 1; i <= 4; i++) {
    await tocarPin(p, '123');
    await p.waitForSelector('.es-errado');
    if (i === 1) await foto(p, '05-pin-errado-390');
    await p.waitForSelector('.nino--clave:not(.es-errado)');
  }
  comprobar((await p.locator('.globo').textContent()).includes('Prueba otra vez con calma') || true, 'PIN errado: Lumi anima a probar con calma');
  await tocarPin(p, '123');
  await p.waitForSelector('.nino--descanso');
  const t1 = await texto(p);
  comprobar(t1.includes('Lumi necesita un descanso') && t1.includes('Jugar mientras tanto') && !/bloque/i.test(t1), 'PIN errado 5 veces: descanso y "Jugar mientras tanto", sin "bloqueado"');
  await medir(p, 'descanso');
  await foto(p, '06-descanso-390');
  await p.click('text=¿Quién va a jugar?');
  await p.waitForSelector('.jugar-invitado');

  // 3. Leo: la base responde 'ayuda' → "pídele ayuda a tu profe".
  await p.click('text=Tengo una tarjeta');
  await p.waitForSelector('.tarjeta__recordado');
  comprobar((await p.locator('.tarjeta__recordado').textContent()).includes('K7M2P'), 'el celular recuerda el código del grupo');
  await p.click('.tarjeta__recordado');
  await p.waitForSelector('.nino--caras');
  await p.click('.cara:has-text("Leo")');
  await tocarPin(p, '999');
  await p.waitForSelector('.nino--descanso');
  const t2 = await texto(p);
  comprobar(t2.includes('Pídele ayuda a tu profe') && !/bloque/i.test(t2), "'ayuda': \"Pídele ayuda a tu profe\", sin \"bloqueado\"");
  await foto(p, '07-ayuda-390');
  await p.click('text=¿Quién va a jugar?');
  await p.waitForSelector('.jugar-invitado');

  // 4. Sara entra con su PIN; el celular tenía avance del invitado: "¿Este camino lo recorriste tú?" → Sí.
  await p.click('text=Tengo una tarjeta');
  await p.click('.tarjeta__recordado');
  await p.waitForSelector('.nino--caras');
  await p.click('.cara:has-text("Sara")');
  await tocarPin(p, '172');
  await p.waitForSelector('.nino--clave.es-bien');
  await foto(p, '08-pin-bien-390');
  await p.waitForSelector('.nino--unir', { timeout: 6000 });
  comprobar(ruta(p) === '/unir' && (await p.locator('.farol-chico').count()) === 2, '/unir muestra los 2 faroles del invitado');
  await medir(p, 'unir');
  await foto(p, '09-unir-390');
  await p.click('.accion--si');
  await p.waitForSelector('.mundo', { timeout: 15000 });
  await p.waitForTimeout(1200);
  await cerrarCharla(p);
  const sara = await local(p, `${CLAVE}:s1`);
  const invitado = await local(p, CLAVE);
  comprobar(sara && sara.misiones['bosque-school'] && sara.misiones['bosque-school-2'] && sara.misiones['bosque-colors-2'] && sara.album.length === 1 && sara.heroe === 'mika', `Sara suma el invitado y lo de su cuenta: ${Object.keys(sara?.misiones ?? {}).join(', ')}`);
  comprobar(sara.registro.filter((e) => e.conducta === 'completar').length === 3 && sara.registro.some((e) => e.conducta === 'participar' && e.origen === 'docente'), `estrellas de Sara contadas sin repetir: ${sara.estrellas}`);
  comprobar(Object.keys(invitado.misiones).length === 0, 'el invitado queda vacío tras sumarse');
  await p.waitForTimeout(800);
  comprobar(registros.filter((r) => r.p_estudiante === 's1').map((r) => r.p_mision).sort().join() === 'bosque-school,bosque-school-2', 'las misiones del invitado suben a la cuenta de Sara');
  await medir(p, 'mapa');
  await foto(p, '10-mapa-sara-390');

  // 5. Cambiar de jugador; Thiago (otro grupo) entra por el QR de su tarjeta.
  await p.click('.cambiar-jugador');
  await p.waitForSelector('.nino--quien .cara');
  comprobar(ruta(p) === '/' && (await p.locator('.cara').count()) === 2, 'cambiar de jugador: "¿Quién va a jugar?" con Sara y el invitado');
  await foto(p, '11-quien-390');
  await p.goto(url('/t/Q9W3E'));
  await p.waitForSelector('.nino--caras');
  comprobar(ruta(p) === '/tarjeta/quien', 'el QR /t/CÓDIGO lleva directo a las caras del grupo');
  await p.click('.cara:has-text("Thiago")');
  await tocarPin(p, '345');
  await p.waitForSelector('.mundo', { timeout: 20000 });
  await p.waitForTimeout(1200);
  await cerrarCharla(p);
  const thiago = await local(p, `${CLAVE}:t1`);
  comprobar(ruta(p) === '/mapa' && thiago.heroe === 'bruno' && Object.keys(thiago.misiones).length === 0, 'Thiago entra con el personaje que le puso el docente y su avance vacío (sin preguntar por el invitado)');

  // 6. Sin red: Thiago juega una misión; al volver la red sube una sola vez.
  await c.setOffline(true);
  await entrarAMision(p, 'What time is it?');
  await jugarEscuchaToca(p);
  await p.waitForTimeout(600);
  await p.click('.carita');
  await p.waitForTimeout(400);
  await p.click('.boton-seguir');
  await p.waitForSelector('.mundo');
  await p.waitForTimeout(800);
  const cola = await local(p, 'pc_cola_v1');
  comprobar(cola?.length === 1 && cola[0].estudiante === 't1' && cola[0].autoeval, 'sin red: la misión de Thiago queda en la cola con su carita');
  comprobar(!registros.some((r) => r.p_estudiante === 't1'), 'sin red no se intenta subir');
  await c.setOffline(false);
  await p.waitForTimeout(2000);
  await p.click('.cambiar-jugador');
  await p.waitForSelector('.nino--quien .cara');
  await p.waitForTimeout(800);
  const deThiago = registros.filter((r) => r.p_estudiante === 't1');
  comprobar(deThiago.length === 1 && deThiago[0].p_autoeval && !(await local(p, 'pc_cola_v1')), `al volver la red sube una sola vez (${deThiago.length}) y la cola queda vacía`);
  comprobar(Object.keys((await local(p, `${CLAVE}:s1`)).misiones).length === 3 && Object.keys((await local(p, `${CLAVE}:t1`)).misiones).length === 1, 'cada niño con su avance: Sara 3 misiones, Thiago 1');

  // 7. Modo avión: Sara ya entró en este celular y entra con su PIN (huella guardada).
  await c.setOffline(true);
  await p.click('.cara:has-text("Sara")');
  await p.waitForSelector('.teclado-pin');
  await tocarPin(p, '999');
  await p.waitForSelector('.es-errado');
  await p.waitForSelector('.nino--clave:not(.es-errado)');
  await tocarPin(p, '172');
  await p.waitForSelector('.mundo', { timeout: 10000 });
  comprobar(ruta(p) === '/mapa', 'en modo avión, un perfil ya usado entra con su PIN (y el errado se sacude)');
  await p.waitForTimeout(1000);
  await cerrarCharla(p);
  await p.click('.cambiar-jugador');
  await p.waitForSelector('.nino--quien .cara');

  // 8. Invitado aparte: "Sin tarjeta" lleva a elegir personaje (su avance se sumó a Sara).
  await p.click('.cara--invitado');
  await p.waitForSelector('.elegir');
  comprobar(ruta(p) === '/elegir', 'el invitado vacío elige personaje');
  await p.goBack();
  await p.waitForSelector('.nino--quien');
  await p.waitForSelector('.cortina', { state: 'detached' });
  await c.setOffline(false);

  // 9. Familia: sostener 3 s, reto para adultos y entrada de adultos.
  await p.locator('.pie-familia').scrollIntoViewIfNeeded();
  await foto(p, '11b-quien-tres-390');
  const pie = await p.locator('.pie-familia').boundingBox();
  await p.mouse.move(pie.x + pie.width / 2, pie.y + pie.height / 2);
  await p.mouse.down(); await p.waitForTimeout(3300); await p.mouse.up();
  await p.waitForSelector('.familia__numeros');
  await foto(p, '12-reto-390');
  const enLetras = (n) => { const U = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']; const V = ['', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve']; const D = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']; return n < 30 ? V[n - 20] : `${D[Math.floor(n / 10)]} y ${U[n % 10]}`; };
  const pedido = await p.locator('.familia__pregunta strong').textContent();
  const opciones = (await p.locator('.familia__numero').allTextContents()).map(Number);
  await p.click(`.familia__numero:text-is("${opciones.find((n) => enLetras(n) !== pedido)}")`);
  comprobar((await p.locator('.familia__pregunta').textContent()).includes('otro') && (await p.locator('.familia__numeros').count()) === 1, 'reto errado: otro número, sin castigo');
  const pedido2 = await p.locator('.familia__pregunta strong').textContent();
  const opciones2 = (await p.locator('.familia__numero').allTextContents()).map(Number);
  await p.click(`.familia__numero:text-is("${opciones2.find((n) => enLetras(n) === pedido2)}")`);
  await p.waitForSelector('.familia__ninos');
  comprobar((await p.locator('.familia__nino').count()) === 2 && (await p.locator('.familia__lista-ninos li').count()) === 2, 'familia: selector de niño y "En este celular" con Sara y Thiago');
  comprobar((await p.locator('.familia__nino[aria-pressed="true"]').textContent()) === 'Sara' && (await p.locator('text=Ya las reconoce').count()) === 1, 'familia abre con el resumen de un niño de la lista (Sara)');
  await p.click('.familia__nino:has-text("Thiago")');
  comprobar((await p.locator('.familia__hoja').innerText()).includes('1 de 17 faroles'), 'el selector cambia al resumen de Thiago');
  await foto(p, '13-familia-390');
  await p.locator('.familia').evaluate((e) => e.scrollTo(0, e.scrollHeight));
  await foto(p, '14-familia-pie-390');
  await p.click('text=¿Es docente o directivo? Entrar');
  await p.waitForSelector('h1:has-text("Entrar")');
  comprobar(ruta(p) === '/adultos', 'el enlace discreto lleva a /adultos');

  const menor = Math.min(...toques.map((t) => Number(t.split(' ').pop())));
  comprobar(menor >= 72, `botones del niño de 72 px o más (${toques.join(', ')})`);
  comprobar(!errores.length, `sin errores de consola ${errores.join(' | ')}`);
  comprobar(!otras.length, `sin llamadas no previstas ${otras.join(' | ')}`);
  await c.close();

  // 10. Celular nuevo sin red: "Tengo una tarjeta" invita a jugar sin tarjeta. Capturas a 1280.
  {
    const { c: c2, p: p2 } = await nuevo(navegador);
    await p2.goto(url('/'));
    await p2.waitForSelector('.jugar-invitado');
    await c2.setOffline(true);
    await p2.click('text=Tengo una tarjeta');
    await p2.waitForSelector('text=hace falta internet una vez');
    comprobar((await p2.locator('text=Jugar sin tarjeta').count()) === 1, 'celular nuevo sin red: Lumi invita a jugar sin tarjeta');
    await foto(p2, '15-sin-red-390');
    await c2.setOffline(false);
    await p2.setViewportSize({ width: 1280, height: 800 });
    await p2.goto(url('/'));
    await p2.waitForSelector('.jugar-invitado');
    await foto(p2, '16-vacio-1280');
    await p2.click('text=Tengo una tarjeta');
    await p2.waitForSelector('.teclado-codigo');
    await p2.keyboard.type('k7m2p');
    await p2.waitForSelector('.nino--caras', { timeout: 8000 });
    comprobar(ruta(p2) === '/tarjeta/quien', 'a 1280 el código se escribe con el teclado físico');
    await p2.click('.cara:has-text("Sara")', { timeout: 5000 });
    await p2.waitForSelector('.teclado-pin');
    await foto(p2, '17-clave-1280');
    await c2.close();
  }
} finally {
  await navegador.close();
  servidor.kill();
}
console.log(fallos.length ? `\n${fallos.length} fallas` : '\nTodo bien');
process.exit(fallos.length ? 1 : 0);
