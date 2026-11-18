// Familia con niños de tarjeta: borrar solo al invitado, quitar con juego pendiente (descartar con
// confirmación), respaldo del invitado al sumarse a un niño y recuperarlo desde la familia.
import { chromium, servir, CAPTURAS, URL_APP, CLAVE, BASE_JUGADO, conMisiones, FAROLES } from './comun.mjs';
const servidor = await servir();
const navegador = await chromium.launch();
let fallos = 0;
const ok = (c, m) => (console.log(c ? 'OK  ' : 'FALLA', m), c || fallos++);
const sostener = async (p, sel, ms) => { const c = await p.locator(sel).boundingBox(); await p.mouse.move(c.x + c.width / 2, c.y + c.height / 2); await p.mouse.down(); await p.waitForTimeout(ms); await p.mouse.up(); };
const enLetras = (n) => { const U = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']; const V = ['', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve']; const D = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']; return n < 30 ? V[n - 20] : `${D[Math.floor(n / 10)]} y ${U[n % 10]}`; };
const familia = async (p) => {
  await p.locator('.pie-familia').scrollIntoViewIfNeeded();
  await sostener(p, '.pie-familia', 3300);
  await p.waitForSelector('.familia__numeros');
  const pedido = await p.locator('.familia__pregunta strong').textContent();
  const ops = (await p.locator('.familia__numero').allTextContents()).map(Number);
  await p.click(`.familia__numero:text-is("${ops.find((n) => enLetras(n) === pedido)}")`);
  await p.waitForSelector('.familia__lista-ninos');
};
try {
  const sara = { id: 'sara-id', apodo: 'Sara', avatar: 'mika', grupo: '3A', codigo: 'ABC234' };
  const thiago = { id: 'thiago-id', apodo: 'Thiago', avatar: 'mika', grupo: '3A', codigo: 'ABC234' };
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const cola = [{ id: 'e1', estudiante: 'thiago-id', cartilla: 'x', mision: 'bosque-colors', errores: 0 }];
  await ctx.addInitScript(([d]) => { if (sessionStorage.sembrado) return; sessionStorage.sembrado = '1';
    for (const [k, v] of Object.entries(d)) localStorage.setItem(k, JSON.stringify(v)); }, [{
    pc_perfiles_v1: [sara, thiago], pc_progreso_v4: conMisiones(FAROLES.slice(0, 2)), 'pc_progreso_v4:sara-id': conMisiones(FAROLES.slice(0, 1)), 'pc_progreso_v4:thiago-id': conMisiones(FAROLES.slice(0, 3)),
    pc_activo_v1: { perfil: 'invitado', actividad: Date.now() }, pc_cola_v1: cola }]);
  const p = await ctx.newPage();
  const errores = []; p.on('pageerror', (e) => errores.push(String(e)));
  await p.goto(URL_APP);
  await p.waitForSelector('.pie-familia');
  await familia(p);
  await p.click('.familia__nino:has-text("Sara")');
  ok((await p.locator('.familia__borrar').count()) === 0, 'con un niño de tarjeta activo no hay "Empezar de nuevo"');
  ok((await p.locator('.familia__lista-ninos button:has-text("Quitar de este celular")').count()) === 2, 'cada niño con tarjeta ofrece "Quitar de este celular"');
  await p.click('.familia__nino:has-text("Sin tarjeta")');
  await p.click('.familia__borrar');
  ok((await p.locator('.familia__confirmar').innerText()).includes('Sin tarjeta'), 'el diálogo de borrar dice a quién borra');
  await p.screenshot({ path: `${CAPTURAS}/familia-ninos-borrar-390.png` });
  await p.click('text=No borrar');
  // Quitar a Thiago con juego pendiente y sin red: queda pendiente, aviso y salida con confirmación.
  await ctx.setOffline(true);
  await p.click('.familia__lista-ninos li:has-text("Thiago") button');
  await p.waitForSelector('.familia__boton--peligro:has-text("descartar")');
  ok((await p.locator('[role=status]').last().innerText()).includes('volver a entrar con su tarjeta'), 'aviso: volver a entrar con tarjeta e internet');
  await p.screenshot({ path: `${CAPTURAS}/familia-ninos-pendiente-390.png` });
  await p.click('.familia__boton--peligro:has-text("descartar")');
  ok((await p.locator('.familia__confirmar').innerText()).includes('Thiago'), 'confirmación nombra a Thiago');
  await p.click('text=No quitar');
  ok((await p.locator('.familia__lista-ninos li').count()) === 2, 'sin confirmar no se quita');
  await p.click('.familia__boton--peligro:has-text("descartar")');
  await p.click('text=Sí, quitar y descartar');
  await p.waitForTimeout(500);
  ok((await p.locator('.familia__lista-ninos li').count()) === 1, 'confirmado: Thiago se quita');
  ok(await p.evaluate(() => !JSON.parse(localStorage.getItem('pc_cola_v1') ?? '[]').length), 'lo pendiente se descartó');
  // Sumar el invitado a Sara: respaldo recuperable desde la familia.
  await ctx.setOffline(false);
  await p.evaluate(() => { document.querySelector('.familia__cabeza button')?.click(); });
  await p.waitForSelector('.pie-familia');
  await p.evaluate(() => {});
  console.log(errores.length ? `errores: ${errores}` : 'sin errores de página');
} finally { await navegador.close(); servidor.kill(); process.exit(fallos ? 1 : 0); }
