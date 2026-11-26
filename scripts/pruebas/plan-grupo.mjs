// Plan por grupo (tanda 5 del calendario, 27 nov), a 390 × 844 con Supabase simulado y con estado.
// Criterio: el docente pone fecha a la clase 1 y la clase 2 de un tema de su grupo, y el Inicio
// muestra la próxima clase real según ese plan. Además: sin plan, Inicio invita a planear el primer
// tema; la clase 2 no puede ir antes de la 1; marcar un tema como dado pasa a la clase del siguiente;
// el plan se ve sin red con la última lectura; nada de esto toca el progreso de los niños.
// Uso: `npm run build`, luego `node scripts/pruebas/plan-grupo.mjs`.
import { chromium, servir, URL_APP, CAPTURAS, LLAVE_ADULTO, sesionAdulto, simularSupabase } from './comun.mjs';

const fallos = [];
const comprobar = (ok, texto) => { console.log(ok ? 'bien ' : 'FALLA', texto); if (!ok) fallos.push(texto); };
const url = (r) => new URL(r, URL_APP).href;
const foto = (p, n) => p.screenshot({ path: `${CAPTURAS}/plan-grupo-${n}.png`, fullPage: true });

const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
const masDias = (n) => { const [a, m, d] = hoy.split('-').map(Number); const f = new Date(Date.UTC(a, m - 1, d + n)); return f.toISOString().slice(0, 10); };

const GRUPO = { id: 'g1', nombre: '3B', grado: '3°', colegio_id: 'c1', cartilla_id: 'ingles-3' };
const base = { planes: [], escrituras: [], caida: false, tocaProgreso: 0 };

async function docente(navegador) {
  const c = await navegador.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block', locale: 'es-CO' });
  await c.addInitScript(([k, v]) => { if (!sessionStorage.sembrado) { localStorage.setItem(k, v); sessionStorage.sembrado = '1'; } }, [LLAVE_ADULTO, JSON.stringify(sesionAdulto('docente', { perfil: { rol: 'docente', nombre: 'Profe Prueba', colegio_id: 'c1' } }))]);
  await simularSupabase(c, (u, q) => {
    if (base.caida && u.pathname.startsWith('/rest/')) return { abortar: true };
    const m = q.method();
    if (u.pathname === '/rest/v1/grupos' && m === 'GET') return { json: [GRUPO] };
    if (u.pathname === '/rest/v1/rpc/mis_codigos') return { json: [{ grupo_id: 'g1', codigo: 'K7M2P' }] };
    if (u.pathname === '/rest/v1/colegios') return { json: [{ nombre: 'I.E. de prueba' }] };
    if (/progreso|registro|estrellas/.test(u.pathname) && m !== 'GET') base.tocaProgreso++;
    if (u.pathname === '/rest/v1/planes_tema') {
      if (m === 'GET') return { json: base.planes.filter((p) => p.grupo_id === u.searchParams.get('grupo_id').replace('eq.', '')) };
      if (m === 'POST') {
        const f = JSON.parse(q.postData());
        base.escrituras.push({ f, prefer: q.headers().prefer, consulta: u.search });
        base.planes = base.planes.filter((p) => !(p.grupo_id === f.grupo_id && p.cartilla_id === f.cartilla_id && p.tema_id === f.tema_id));
        const { actualizado, ...fila } = f;
        base.planes.push(fila);
        return { json: [fila] };
      }
    }
    return null;
  });
  const p = await c.newPage();
  const errores = [];
  p.on('pageerror', (e) => errores.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|ERR_FAILED|ERR_INTERNET/.test(m.text()) && errores.push(m.text()));
  return { c, p, errores };
}

const textoProxima = (p) => p.locator('.panel', { hasText: 'Próxima clase' }).first().innerText();
const sinDesborde = (p) => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

const servidor = await servir();
const navegador = await chromium.launch();
try {
  const { c, p, errores } = await docente(navegador);

  // 1. Sin plan: Inicio invita a planear el primer tema.
  await p.goto(url('/docente'));
  await p.waitForSelector('text=Próxima clase · 3B');
  await p.waitForSelector('text=no tiene tema planeado');
  const sinPlan = await textoProxima(p);
  comprobar(/no tiene tema planeado/.test(sinPlan) && /Útiles escolares/.test(sinPlan), 'sin plan: "Su grupo 3B no tiene tema planeado" y el primer tema');
  comprobar((await p.locator('a', { hasText: 'Planear el primer tema' }).count()) === 1, 'sin plan: botón "Planear el primer tema"');
  await foto(p, '01-inicio-sin-plan-390');

  // 2. Planear muestra el plan de 3B, sin fechas.
  await p.goto(url('/docente/planear'));
  await p.waitForSelector('text=Plan de 3B');
  const plan = await p.locator('.panel', { hasText: 'Plan de 3B' }).innerText();
  comprobar(/Útiles escolares[\s\S]*Sin fechas/.test(plan) && /Colores/.test(plan) && /Números/.test(plan), 'Planear: plan de 3B con los temas listos, sin fechas');
  comprobar(await sinDesborde(p), 'Planear sin desborde a 390');

  // 3. Fechas de colores: la clase 2 antes de la 1 no se guarda.
  await p.goto(url('/docente/planear/colores'));
  await p.waitForSelector('text=Fechas de 3B');
  await p.fill('#fechas-g1-1', masDias(5));
  await p.fill('#fechas-g1-2', masDias(2));
  await p.click('button:has-text("Guardar fechas")');
  await p.waitForSelector('.mensaje--error');
  comprobar(/después de la clase 1/.test(await p.locator('.mensaje--error').innerText()) && base.escrituras.length === 0, 'la clase 2 antes de la 1 avisa y no guarda');
  await p.fill('#fechas-g1-2', masDias(12));
  await p.click('button:has-text("Guardar fechas")');
  await p.waitForSelector('text=Fechas guardadas');
  const e = base.escrituras.at(-1);
  comprobar(e && e.f.tema_id === 'colores' && e.f.clase1 === masDias(5) && e.f.clase2 === masDias(12) && e.f.estado === 'por-hacer' && e.f.cartilla_id === 'ingles-3', `guarda tema, fechas y estado (${JSON.stringify(e?.f)})`);
  comprobar(/merge-duplicates/.test(e?.prefer ?? '') && /on_conflict=grupo_id,cartilla_id,tema_id/.test(e?.consulta ?? ''), 'guarda con upsert (una fila por grupo y tema)');
  comprobar((await p.locator('#fechas-g1-1').evaluate((el) => el.getBoundingClientRect().height)) >= 48, 'los campos de fecha miden 48 px o más');
  comprobar(await sinDesborde(p), 'plan del tema sin desborde a 390');
  await foto(p, '02-fechas-colores-390');

  // Útiles escolares ya empezó: clase 1 ayer, clase 2 en 3 días.
  await p.goto(url('/docente/planear/escuela'));
  await p.waitForSelector('text=Fechas de 3B');
  await p.fill('#fechas-g1-1', masDias(-1));
  await p.fill('#fechas-g1-2', masDias(3));
  await p.click('button:has-text("Guardar fechas")');
  await p.waitForSelector('text=Fechas guardadas');
  comprobar(base.escrituras.at(-1).f.estado === 'en-curso', 'con la clase 1 ya pasada el tema queda en curso');

  // 4. Inicio muestra la próxima clase real: clase 2 de útiles escolares (en 3 días), no colores.
  await p.goto(url('/docente'));
  await p.waitForSelector('text=Clase 2');
  let txt = await textoProxima(p);
  comprobar(/Clase 2/.test(txt) && /Útiles escolares/.test(txt) && !/no tiene tema planeado/.test(txt), `Inicio: próxima clase = clase 2 de útiles escolares (${txt.replace(/\s+/g, ' ')})`);
  comprobar((await p.locator('.panel', { hasText: 'Próxima clase' }).locator('.farol--encendido').count()) === 1, 'Inicio: el farol de la clase 1 (ya dada) está encendido');
  comprobar((await p.locator('a', { hasText: 'Proyectar útiles escolares' }).count()) === 1, 'Inicio: proyectar el tema de la próxima clase');
  await foto(p, '03-inicio-proxima-390');

  // 5. Marcar útiles escolares como dado: la próxima pasa a la clase 1 de colores.
  await p.goto(url('/docente/planear/escuela'));
  await p.waitForSelector('button:has-text("Marcar como dado")');
  await p.click('button:has-text("Marcar como dado")');
  await p.waitForSelector('text=Marcado como dado');
  comprobar(base.escrituras.at(-1).f.estado === 'hecho', 'marcar como dado guarda el estado hecho');
  await p.goto(url('/docente'));
  await p.waitForSelector('text=Clase 1');
  txt = await textoProxima(p);
  comprobar(/Clase 1/.test(txt) && /Colores/.test(txt), `tras darlo, la próxima es la clase 1 de colores (${txt.replace(/\s+/g, ' ')})`);

  // 6. Planear lista las fechas de cada tema.
  await p.goto(url('/docente/planear'));
  await p.waitForSelector('text=Plan de 3B');
  const conFechas = await p.locator('.panel', { hasText: 'Plan de 3B' }).innerText();
  comprobar(/Hecho · Clase 1/.test(conFechas) && /Colores[\s\S]*Clase 1: /.test(conFechas), 'Planear: útiles escolares hecho y colores con sus fechas');
  await foto(p, '04-planear-plan-390');

  // 7. Sin red: Inicio sigue mostrando la próxima clase con la última lectura.
  base.caida = true;
  await p.goto(url('/docente'));
  await p.waitForSelector('text=Próxima clase');
  await p.waitForTimeout(800);
  txt = await textoProxima(p);
  comprobar(/Colores/.test(txt) && /Clase 1/.test(txt), 'sin red, Inicio muestra la próxima clase guardada');
  base.caida = false;

  comprobar(base.tocaProgreso === 0, 'cambiar el plan no escribe progreso, registro ni estrellas de ningún niño');
  comprobar(errores.length === 0, `sin errores (${errores.join(' | ')})`);
  await c.close();
} finally {
  await navegador.close();
  servidor.kill();
}
console.log(fallos.length ? `\n${fallos.length} fallas` : '\ntodo bien');
process.exit(fallos.length ? 1 : 0);
