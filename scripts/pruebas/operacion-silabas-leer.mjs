// Plantillas "completar la operación" y "armar la palabra", y Di y brilla para leer en español,
// a 390 × 844, como invitado. Criterio del plan del 26 nov:
// - La operación se ve con objetos y con cifras, el niño elige entre 3, y los niveles (rango y
//   signo) salen del JSON: sumas de transición (hasta 10, con objetos) y restas de 3.° (bloques).
// - Armar 5 palabras tocando sílabas que suenan; ningún texto es obligatorio para jugar.
// - Un niño lee 3 palabras en español (es-CO), recibe sus estrellas y no queda audio guardado.
// Las misiones de prueba reemplazan las del primer territorio solo dentro de esta prueba.
// Uso: `npm run build`, luego `node scripts/pruebas/operacion-silabas-leer.mjs`.
import { readFileSync } from 'node:fs';
import { chromium, servir, URL_APP, CAPTURAS, CLAVE, BASE_JUGADO, cerrarCharla, entrarAMision, menorToque } from './comun.mjs';

const fallos = [];
const comprobar = (ok, texto) => { console.log(ok ? 'bien ' : 'FALLA', texto); if (!ok) fallos.push(texto); };
const foto = (p, n) => p.screenshot({ path: `${CAPTURAS}/operacion-silabas-${n}.png` });

const real = JSON.parse(readFileSync('public/cartillas/ingles-3/cartilla.json', 'utf8'));
const territorio = real.territorios[0];
const guia = territorio.guia;
const lugar = (i) => ({ x: territorio.misiones[i].x, y: territorio.misiones[i].y });
const PALABRAS = territorio.misiones[0].palabras;

const OPERACION = {
  id: 'prueba-operacion', titulo: 'Completa la cuenta', plantilla: 'operacion', icono: 'iconos/0033_20e3.svg', ...lugar(0),
  antes: [{ quien: guia, es: 'Vamos a sumar y restar.', en: "Let's add and subtract." }], palabras: PALABRAS,
  operacion: {
    pregunta: { '+': '¿Cuánto es {a} más {b}?', '-': '¿Cuánto es {a} menos {b}?' },
    respuesta: { '+': '{a} más {b} es {c}', '-': '{a} menos {b} es {c}' },
    niveles: [
      { signo: '+', desde: 2, hasta: 10, rondas: 2, objeto: 'iconos/1f58d.svg' },
      { signo: '-', desde: 20, hasta: 99, rondas: 2 },
    ],
  },
};
const SILABAS = {
  id: 'prueba-silabas', titulo: 'Arma la palabra', plantilla: 'silabas', icono: 'iconos/1f4d3.svg', ...lugar(3),
  antes: [{ quien: guia, es: 'Arma la palabra con sus sílabas.', en: 'Build the word.' }], palabras: PALABRAS,
  silabas: [
    { icono: 'iconos/1f44b.svg', dice: 'mano', partes: ['ma', 'no'], sobran: ['pa'] },
    { icono: 'iconos/1f440.svg', dice: 'ojo', partes: ['o', 'jo'], sobran: ['ja'] },
    { icono: 'iconos/1f444.svg', dice: 'boca', partes: ['bo', 'ca'], sobran: ['co'] },
    { icono: 'iconos/1f319.svg', dice: 'luna', partes: ['lu', 'na'], sobran: ['la'] },
    { icono: 'iconos/1f442.svg', dice: 'oreja', partes: ['o', 're', 'ja'], sobran: ['ra'] },
  ],
};
const LEER_PALABRAS = [
  { es: 'mano', en: 'hand', icono: 'iconos/1f44b.svg' },
  { es: 'ojo', en: 'eye', icono: 'iconos/1f440.svg' },
  { es: 'boca', en: 'mouth', icono: 'iconos/1f444.svg' },
];
const LEER = {
  id: 'prueba-leer', titulo: 'Lee y brilla', plantilla: 'di-brilla', leer: true, icono: 'iconos/1f444.svg', ...lugar(6),
  antes: [{ quien: guia, es: 'Lee la palabra en voz alta.', en: 'Read the word aloud.' }], palabras: LEER_PALABRAS,
};
const CARTILLA = {
  ...real,
  idiomaVoz: 'es-CO',
  cinematicas: {},
  ayudas: { ...real.ayudas, 'operacion-otra-vez': { es: 'Casi. Mira otra vez la cuenta.', en: 'Almost. Look again.' }, 'silabas-otra-vez': { es: 'Esa suena distinto. Escucha otra vez.', en: 'Listen again.' } },
  territorios: [{ ...territorio, idiomaPorAvance: ['es'], misiones: [OPERACION, SILABAS, LEER] }, ...real.territorios.slice(1)],
};

async function abrirJuego(navegador) {
  const c = await navegador.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
  const progreso = { ...BASE_JUGADO, heroe: real.heroes[0].id };
  await c.addInitScript(([k, v]) => { if (!sessionStorage.sembrado) { localStorage.setItem(k, v); sessionStorage.sembrado = '1'; } }, [CLAVE, JSON.stringify(progreso)]);
  await c.addInitScript(() => {
    window.__dicho = [];
    const hablar = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = (f) => { window.__dicho.push(f.text); setTimeout(() => f.onend?.(), 30); try { hablar(f); } catch {} };
    // Reconocedor falso: "oye" la palabra escrita en la carta, y anota el idioma pedido.
    // También se vigila que nada grabe audio (MediaRecorder) ni abra el micrófono por su cuenta.
    window.__idiomas = [];
    window.__grabaciones = 0;
    window.MediaRecorder = class { constructor() { window.__grabaciones++; } start() {} stop() {} };
    class Falso {
      start() {
        window.__idiomas.push(this.lang);
        setTimeout(() => this.onstart?.(), 20);
        const leida = document.querySelector('.decir__leer')?.textContent ?? '';
        setTimeout(() => this.onresult?.({ results: [[{ transcript: leida.toUpperCase() + '.' }]] }), 120);
      }
      abort() {}
    }
    window.SpeechRecognition = Falso;
    window.webkitSpeechRecognition = Falso;
  });
  await c.route('**/*.mp4', (r) => r.abort());
  await c.route(/\/cartillas\/ingles-3\/cartilla\.json$/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CARTILLA) }));
  const p = await c.newPage();
  const errores = [];
  p.on('pageerror', (e) => errores.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && !/mp4|ERR_FAILED|Failed to load resource/.test(m.text()) && errores.push(m.text()));
  await p.goto(URL_APP);
  await p.waitForSelector('.jugar-invitado');
  await p.click('.jugar-invitado');
  await p.waitForSelector('.mundo', { timeout: 15000 });
  await p.waitForTimeout(900);
  await cerrarCharla(p);
  return { c, p, errores };
}

const dicho = (p) => p.evaluate(() => window.__dicho);
const limpiarDicho = (p) => p.evaluate(() => { window.__dicho = []; });
const ronda = (p) => p.locator('.punto').evaluateAll((ps) => ps.findIndex((x) => x.classList.contains('punto--ahora')));
const sinDesborde = (p) => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
const esperarRonda = async (p, n) => { for (let i = 0; i < 50 && (await ronda(p)) !== n; i++) await p.waitForTimeout(100); };
const guardado = (p) => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), CLAVE);

async function cerrarMision(p) {
  await p.waitForSelector('.cierre .carita', { timeout: 8000 });
  await p.waitForTimeout(500);
  await p.click('.carita');
  await p.waitForTimeout(400);
  await p.click('.boton-seguir');
  await p.waitForSelector('.mundo', { timeout: 15000 });
  await p.waitForTimeout(600);
  await cerrarCharla(p);
}

/** La cuenta que se ve: [a, signo, b]. */
const cuentaVisible = async (p) => {
  const t = await p.locator('.operacion__cifras span').allTextContents();
  return { a: Number(t[0]), signo: t[1], b: Number(t[2]) };
};

const servidor = await servir();
const navegador = await chromium.launch();
try {
  const { c, p, errores } = await abrirJuego(navegador);

  // ------------------------------------------------ 1. Completar la operación
  await entrarAMision(p, 'Completa la cuenta');
  await p.waitForSelector('.operacion__opcion');
  for (let r = 0; r < 4; r++) {
    await esperarRonda(p, r);
    await p.waitForTimeout(500);
    const k = await cuentaVisible(p);
    const c_ = k.signo === '+' ? k.a + k.b : k.a - k.b;
    const opciones = (await p.locator('.operacion__opcion').allTextContents()).map(Number);
    comprobar(opciones.length === 3 && opciones.includes(c_) && new Set(opciones).size === 3, `ronda ${r + 1}: ${k.a} ${k.signo} ${k.b}, tres opciones con el resultado (${opciones.join(', ')})`);
    comprobar((await dicho(p)).some((t) => t === `¿Cuánto es ${k.a} ${k.signo === '+' ? 'más' : 'menos'} ${k.b}?`), `ronda ${r + 1}: la voz dice la cuenta con la frase del contenido`);
    if (r < 2) {
      comprobar(k.signo === '+' && k.a + k.b <= 10 && k.a + k.b >= 2, `nivel 1 (sumas de transición, hasta 10): ${k.a} + ${k.b}`);
      comprobar((await p.locator('.operacion__grupo img').count()) === k.a + k.b, 'la suma se ve con objetos, uno por unidad');
    } else {
      comprobar(k.signo === '−' && k.a >= 20 && k.a <= 99 && k.b >= 1 && k.b < k.a, `nivel 2 (restas de 3.°, 20 a 99): ${k.a} − ${k.b}`);
      comprobar((await p.locator('.operacion__diez').count()) === Math.floor(k.a / 10) + Math.floor(k.b / 10), 'la resta se ve con bloques de diez y unidades');
    }
    comprobar(await sinDesborde(p), `ronda ${r + 1}: sin desborde a 390`);
    comprobar((await menorToque(p, '.operacion__opcion, .oir, .boton-salir')) >= 48, 'objetivos de toque de 48 px o más');
    if (r === 0) await foto(p, '01-suma-390');
    if (r === 2) await foto(p, '02-resta-390');
    if (r === 1) {
      // Dos errores: nada se pierde, el guía anima y brilla la buena.
      const malas = opciones.filter((n) => n !== c_);
      await limpiarDicho(p);
      await p.click(`.operacion__opcion[aria-label="${malas[0]}"]`);
      await p.waitForTimeout(300);
      comprobar((await dicho(p)).some((t) => t.includes('Mira otra vez')) && (await ronda(p)) === 1 && !(await p.locator('.cierre').count()), 'error sin castigo: el guía anima y se sigue en la misma cuenta');
      comprobar(await p.locator(`.operacion__opcion[aria-label="${malas[0]}"]`).isDisabled(), 'la opción errada se apaga');
      await p.click(`.operacion__opcion[aria-label="${malas[1]}"]`);
      await p.waitForTimeout(300);
      comprobar((await p.locator('.operacion__opcion--pista').getAttribute('aria-label')) === String(c_), 'al segundo intento brilla el resultado');
      await foto(p, '03-pista-390');
    }
    await limpiarDicho(p);
    await p.click(`.operacion__opcion[aria-label="${c_}"]`);
    await p.waitForTimeout(200);
    comprobar((await p.locator('.operacion__hueco--lleno').textContent()) === String(c_), 'al acertar, el resultado llena el hueco');
    comprobar((await dicho(p)).includes(`${k.a} ${k.signo === '+' ? 'más' : 'menos'} ${k.b} es ${c_}`), 'la voz dice la cuenta completa');
  }
  await cerrarMision(p);
  comprobar(!!(await guardado(p))?.misiones?.['prueba-operacion'], 'completar la operación queda completada en el progreso');

  // ------------------------------------------------ 2. Armar la palabra
  await entrarAMision(p, 'Arma la palabra');
  await p.waitForSelector('.silabas__ficha');
  comprobar((await dicho(p)).includes('mano'), 'la voz dice la palabra al empezar');
  comprobar(!(await p.locator('.silabas__carta strong, .silabas__carta small').count()), 'la palabra no se muestra escrita: imagen y voz');
  comprobar((await p.locator('.silabas__ficha').count()) === 3 && (await p.locator('.silabas__hueco').count()) === 2, 'mano: dos huecos y tres sílabas (una de más)');
  comprobar((await menorToque(p, '.silabas__ficha, .silabas__carta, .boton-salir')) >= 48, 'sílabas: toque de 48 px o más');
  comprobar(await sinDesborde(p), 'sílabas: sin desborde a 390');
  await foto(p, '04-silabas-390');
  await limpiarDicho(p);
  await p.click('.silabas__ficha[aria-label="no"]');
  await p.waitForTimeout(300);
  const tras = await dicho(p);
  comprobar(tras[0] === 'no' && tras.some((t) => t.includes('Escucha otra vez')), `sílaba que no sigue: suena, el guía anima (${tras.join(' | ')})`);
  comprobar(!(await p.locator('.silabas__puesta').count()), 'la sílaba errada no se pone');
  await p.click('.silabas__ficha[aria-label="pa"]');
  await p.waitForTimeout(300);
  comprobar((await p.locator('.silabas__ficha--pista').getAttribute('aria-label')) === 'ma', 'al segundo intento brilla la sílaba que sigue');
  for (const [i, s] of SILABAS.silabas.entries()) {
    await esperarRonda(p, i);
    await p.waitForTimeout(300);
    await limpiarDicho(p);
    for (const parte of s.partes) await p.click(`.silabas__ficha:not([disabled])[aria-label="${parte}"] >> nth=0`);
    await p.waitForSelector('.silabas__fila--completa');
    await p.waitForTimeout(250);
    const oido = await dicho(p);
    comprobar(s.partes.every((x) => oido.includes(x)) && oido.at(-1) === s.dice, `${s.dice}: cada sílaba suena y al final se oye la palabra (${oido.join(', ')})`);
    if (i === 4) await foto(p, '05-oreja-390');
  }
  await cerrarMision(p);
  comprobar(!!(await guardado(p))?.misiones?.['prueba-silabas'], 'armar la palabra queda completada en el progreso');

  // ------------------------------------------------ 3. Di y brilla para leer en español
  const antes = (await guardado(p)).estrellas;
  await limpiarDicho(p);
  await entrarAMision(p, 'Lee y brilla');
  await p.waitForSelector('.decir__leer');
  comprobar(!(await dicho(p)).some((t) => LEER_PALABRAS.some((w) => t === w.es)), 'para leer, la voz no dice la palabra antes que el niño');
  comprobar(!(await p.locator('.decir__carta small').count()), 'en español no se muestra traducción');
  await foto(p, '06-leer-390');
  for (let i = 0; i < 3; i++) {
    await esperarRonda(p, i);
    const palabra = await p.locator('.decir__leer').textContent();
    comprobar(LEER_PALABRAS.some((w) => w.es === palabra), `se ve escrita la palabra en español (${palabra})`);
    await p.click('.microfono');
    await p.waitForSelector('.decir--brilla', { timeout: 4000 });
    comprobar(true, `leyó «${palabra}» y brilla`);
    await p.click('.decir .boton-seguir');
  }
  comprobar((await p.evaluate(() => window.__idiomas)).every((l) => l === 'es-CO'), 'el reconocimiento se pide en español de Colombia (es-CO)');
  await cerrarMision(p);
  const despues = await guardado(p);
  comprobar(despues.estrellas > antes && despues.registro.some((r) => r.mision === 'prueba-leer' && r.conducta === 'pronunciar'), `recibe sus estrellas, también las de pronunciar (${antes} → ${despues.estrellas})`);
  const grabaciones = await p.evaluate(() => window.__grabaciones);
  const almacenado = await p.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }));
  comprobar(grabaciones === 0 && !/audio|blob:|data:audio|webm|wav/i.test(almacenado), 'no se graba ni se guarda audio');
  comprobar(!errores.length, `sin errores en la consola${errores.length ? ': ' + errores.join(' | ') : ''}`);
  await c.close();
} finally {
  await navegador.close();
  servidor.kill();
}

if (fallos.length) {
  console.error(`\n${fallos.length} comprobaciones fallaron`);
  process.exit(1);
}
console.log('\nTodo bien');
