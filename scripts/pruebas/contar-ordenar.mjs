// Plantillas "contar y tocar" y "ordenar", a 390 × 844, como invitado.
// Criterio del plan del 25 nov: se juegan completas, todo el contenido sale del JSON de la
// cartilla, el error no castiga (el guía anima y la ronda sigue) y los objetivos de toque miden
// 48 px o más. "Ordenar" se prueba con dos contenidos: números y el orden de un relato.
// Las misiones de prueba reemplazan las del primer territorio de la cartilla predeterminada
// solo dentro de esta prueba (la cartilla real no cambia). Lo que dice la voz se anota.
// Uso: `npm run build`, luego `node scripts/pruebas/contar-ordenar.mjs`.
import { readFileSync } from 'node:fs';
import { chromium, servir, URL_APP, CAPTURAS, CLAVE, BASE_JUGADO, cerrarCharla, entrarAMision, menorToque } from './comun.mjs';

const fallos = [];
const comprobar = (ok, texto) => { console.log(ok ? 'bien ' : 'FALLA', texto); if (!ok) fallos.push(texto); };
const foto = (p, n) => p.screenshot({ path: `${CAPTURAS}/contar-ordenar-${n}.png` });

// ---------------------------------------------------------------- Contenido de prueba

const real = JSON.parse(readFileSync('public/cartillas/ingles-3/cartilla.json', 'utf8'));
const territorio = real.territorios[0];
const guia = territorio.guia;
const lugar = (i) => ({ x: territorio.misiones[i].x, y: territorio.misiones[i].y });
// Las luciérnagas del mapa reparten palabras del territorio: las misiones de prueba llevan unas.
const PALABRAS = territorio.misiones[0].palabras;
const NUMEROS = ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'];

const CONTAR = {
  id: 'prueba-contar', titulo: 'Cuenta y toca', plantilla: 'contar-toca', icono: 'iconos/0033_20e3.svg', ...lugar(0),
  antes: [{ quien: guia, es: 'Vamos a contar.', en: "Let's count." }], palabras: PALABRAS,
  contar: {
    numeros: NUMEROS,
    rondas: [
      { objeto: 'iconos/1f58d.svg', cantidad: 3, total: 5, dice: 'Toca tres crayolas' },
      { objeto: 'iconos/1f4d8.svg', cantidad: 2, total: 6, dice: 'Toca dos libros' },
      { objeto: 'iconos/270f.svg', cantidad: 7, total: 9, dice: 'Toca siete lápices' },
    ],
  },
};
const NUMS = {
  id: 'prueba-ordenar-numeros', titulo: 'Ordena los números', plantilla: 'ordenar', icono: 'iconos/0031_20e3.svg', ...lugar(3),
  antes: [{ quien: guia, es: 'Pon los números en orden.', en: 'Put the numbers in order.' }], palabras: PALABRAS,
  ordenar: [
    { pide: 'Ordena del uno al cinco', tarjetas: [1, 2, 3, 4, 5].map((n) => ({ texto: String(n), dice: NUMEROS[n - 1] })) },
    { pide: 'Ordena de dos en dos', tarjetas: [2, 4, 6, 8].map((n) => ({ texto: String(n), dice: NUMEROS[n - 1] })) },
  ],
};
const CUENTO = {
  id: 'prueba-ordenar-cuento', titulo: 'Ordena el cuento', plantilla: 'ordenar', icono: 'iconos/1f4d3.svg', ...lugar(6),
  antes: [{ quien: guia, es: 'Escucha el cuento y ordénalo.', en: 'Listen to the story and order it.' }], palabras: PALABRAS,
  ordenar: [
    {
      pide: 'Ordena el día de Sara',
      tarjetas: [
        { icono: 'iconos/1f305.svg', dice: 'Sale el sol y Sara se despierta' },
        { icono: 'iconos/1f392.svg', dice: 'Sara va a la escuela con su mochila' },
        { icono: 'iconos/1f319.svg', dice: 'Llega la noche y Sara se duerme' },
      ],
    },
  ],
};
const CARTILLA = {
  ...real,
  idiomaVoz: 'es-CO',
  cinematicas: {},
  ayudas: { ...real.ayudas, 'contar-otra-vez': { es: 'Casi. Contemos otra vez, despacio.', en: "Almost. Let's count again, slowly." }, 'ordenar-otra-vez': { es: 'Esa va después. Busca la que sigue.', en: 'That one comes later. Find the next one.' } },
  territorios: [{ ...territorio, idiomaPorAvance: ['es'], misiones: [CONTAR, NUMS, CUENTO] }, ...real.territorios.slice(1)],
};

// ---------------------------------------------------------------- Ayudas

async function abrirJuego(navegador) {
  const c = await navegador.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
  const progreso = { ...BASE_JUGADO, heroe: real.heroes[0].id };
  await c.addInitScript(([k, v]) => { if (!sessionStorage.sembrado) { localStorage.setItem(k, v); sessionStorage.sembrado = '1'; } }, [CLAVE, JSON.stringify(progreso)]);
  // La voz del navegador queda anotada (en la prueba no suena).
  await c.addInitScript(() => {
    window.__dicho = [];
    const hablar = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = (f) => { window.__dicho.push(f.text); setTimeout(() => f.onend?.(), 30); try { hablar(f); } catch {} };
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
const esperarRonda = async (p, n) => { for (let i = 0; i < 40 && (await ronda(p)) !== n; i++) await p.waitForTimeout(100); };

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

const servidor = await servir();
const navegador = await chromium.launch();
try {
  const { c, p, errores } = await abrirJuego(navegador);

  // ------------------------------------------------ 1. Contar y tocar
  await entrarAMision(p, 'Cuenta y toca');
  await p.waitForSelector('.contar__objeto');
  comprobar((await p.locator('.contar__objeto').count()) === 5, 'la ronda muestra los 5 objetos del contenido');
  comprobar((await dicho(p)).includes('Toca tres crayolas'), 'la voz dice cuántos tocar (del contenido)');
  comprobar(await p.locator('.contar__listo').isDisabled(), 'el ✓ espera a que se toque algo');
  comprobar((await menorToque(p, '.contar__objeto, .contar__listo, .oir, .boton-salir')) >= 48, `objetivos de toque de 48 px o más (${Math.round(await menorToque(p, '.contar__objeto, .contar__listo, .oir, .boton-salir'))})`);
  comprobar(await sinDesborde(p), 'contar: sin desborde a 390');
  await limpiarDicho(p);
  for (let i = 0; i < 4; i++) await p.locator('.contar__objeto').nth(i).click();
  const conteo = await dicho(p);
  comprobar(['uno', 'dos', 'tres', 'cuatro'].every((n) => conteo.includes(n)), `cada toque se cuenta en voz alta (${conteo.join(', ')})`);
  await foto(p, '01-contar-390');
  // Cuatro en vez de tres: nada se pierde, la voz cuenta lo marcado y el guía anima.
  await limpiarDicho(p);
  await p.click('.contar__listo');
  await p.waitForTimeout(400);
  const tras = await dicho(p);
  comprobar(tras.some((t) => t.includes('Contemos otra vez')) && tras.includes('uno, dos, tres, cuatro'), `error sin castigo: cuenta lo marcado y anima (${tras.join(' | ')})`);
  comprobar((await p.locator('.contar__objeto--marcado').count()) === 4 && (await ronda(p)) === 0 && !(await p.locator('.cierre').count()), 'tras el error se sigue en la misma ronda, con lo marcado');
  await p.locator('.contar__objeto--marcado').first().click();
  comprobar((await p.locator('.contar__objeto--marcado').count()) === 3, 'tocar de nuevo un objeto lo suelta');
  await p.click('.contar__listo');
  await p.waitForSelector('.contar__objeto--bien');
  await esperarRonda(p, 1);
  comprobar((await ronda(p)) === 1 && (await p.locator('.contar__objeto').count()) === 6, 'con la cantidad justa pasa a la siguiente ronda');
  // Dos intentos errados: brillan los que hacen falta.
  await p.locator('.contar__objeto').nth(0).click();
  await p.click('.contar__listo');
  await p.waitForTimeout(300);
  await p.locator('.contar__objeto').nth(1).click();
  await p.locator('.contar__objeto').nth(2).click();
  await p.click('.contar__listo');
  await p.waitForTimeout(300);
  comprobar((await p.locator('.contar__objeto--pista').count()) === 2 && (await p.locator('.contar__objeto--marcado').count()) === 0, 'al segundo intento brillan los 2 que hacen falta');
  await foto(p, '02-contar-pista-390');
  for (const b of await p.locator('.contar__objeto--pista').all()) await b.click();
  await p.click('.contar__listo');
  await esperarRonda(p, 2);
  for (let i = 0; i < 7; i++) await p.locator('.contar__objeto').nth(i).click();
  comprobar(await sinDesborde(p), 'contar con 9 objetos: sin desborde');
  await foto(p, '03-contar-nueve-390');
  await p.click('.contar__listo');
  await cerrarMision(p);
  let guardado = await p.evaluate((k) => JSON.parse(localStorage.getItem(k)), CLAVE);
  comprobar(!!guardado?.misiones?.['prueba-contar'], 'contar y tocar queda completada en el progreso');

  // ------------------------------------------------ 2. Ordenar números (tocar y arrastrar)
  await entrarAMision(p, 'Ordena los números');
  await p.waitForSelector('.ordenar__mesa .ordenar__tarjeta');
  comprobar((await p.locator('.ordenar__mesa .ordenar__tarjeta').count()) === 5 && (await p.locator('.ordenar__hueco').count()) === 5, 'cinco tarjetas en la mesa y cinco puestos');
  const enMesa = await p.locator('.ordenar__mesa .ordenar__tarjeta').allTextContents();
  comprobar(enMesa.join('') !== '12345', `las tarjetas salen revueltas (${enMesa.join(' ')})`);
  comprobar((await menorToque(p, '.ordenar__tarjeta, .oir, .boton-salir')) >= 48, `ordenar: toque de 48 px o más (${Math.round(await menorToque(p, '.ordenar__tarjeta, .oir, .boton-salir'))})`);
  comprobar(await sinDesborde(p), 'ordenar números: sin desborde a 390');
  await foto(p, '04-ordenar-numeros-390');
  await limpiarDicho(p);
  await p.click('.ordenar__mesa .ordenar__tarjeta[aria-label="tres"]');
  await p.waitForTimeout(300);
  const errado = await dicho(p);
  comprobar(errado.includes('tres') && errado.some((t) => t.includes('Busca la que sigue')), `tocar la que no sigue: la voz la dice y el guía anima (${errado.join(' | ')})`);
  comprobar((await p.locator('.ordenar__mesa .ordenar__tarjeta').count()) === 5 && (await p.locator('.ordenar__puesto .ordenar__tarjeta').count()) === 0, 'la tarjeta errada vuelve a la mesa, sin perder nada');
  await p.click('.ordenar__mesa .ordenar__tarjeta[aria-label="uno"]');
  // La segunda se arrastra hasta la fila.
  const origen = await p.locator('.ordenar__mesa .ordenar__tarjeta[aria-label="dos"]').boundingBox();
  const destino = await p.locator('.ordenar__fila').boundingBox();
  await p.mouse.move(origen.x + origen.width / 2, origen.y + origen.height / 2);
  await p.mouse.down();
  for (let k = 1; k <= 8; k++) await p.mouse.move(origen.x + origen.width / 2 + ((destino.x + destino.width / 2 - origen.x - origen.width / 2) * k) / 8, origen.y + origen.height / 2 + ((destino.y + destino.height / 2 - origen.y - origen.height / 2) * k) / 8);
  await p.mouse.up();
  await p.waitForTimeout(200);
  comprobar((await p.locator('.ordenar__puesto .ordenar__tarjeta').allTextContents()).join('') === '12', 'arrastrar la que sigue hasta la fila la pone en su puesto');
  // Arrastrar y soltar lejos de la fila no cuenta.
  const tres = await p.locator('.ordenar__mesa .ordenar__tarjeta[aria-label="tres"]').boundingBox();
  await p.mouse.move(tres.x + 40, tres.y + 40);
  await p.mouse.down();
  await p.mouse.move(tres.x + 40, tres.y + 140, { steps: 5 });
  await p.mouse.up();
  comprobar((await p.locator('.ordenar__puesto .ordenar__tarjeta').count()) === 2, 'soltar lejos de la fila no pone la tarjeta');
  await limpiarDicho(p);
  await p.click('.ordenar__puesto .ordenar__tarjeta >> nth=0');
  comprobar((await dicho(p)).includes('uno'), 'una tarjeta puesta se toca para oírla');
  for (const n of ['tres', 'cuatro', 'cinco']) await p.click(`.ordenar__mesa .ordenar__tarjeta[aria-label="${n}"]`);
  await p.waitForSelector('.ordenar__fila--completa');
  await foto(p, '05-ordenar-completo-390');
  await esperarRonda(p, 1);
  comprobar((await p.locator('.ordenar__hueco').count()) === 4, 'segunda ronda: de dos en dos, cuatro puestos');
  // Dos errores seguidos: brilla la que sigue.
  await p.click('.ordenar__mesa .ordenar__tarjeta[aria-label="ocho"]');
  await p.waitForTimeout(500);
  await p.click('.ordenar__mesa .ordenar__tarjeta[aria-label="seis"]');
  await p.waitForTimeout(300);
  comprobar((await p.locator('.ordenar__tarjeta--pista').getAttribute('aria-label')) === 'dos', 'al segundo error brilla la tarjeta que sigue');
  for (const n of ['dos', 'cuatro', 'seis', 'ocho']) await p.click(`.ordenar__mesa .ordenar__tarjeta[aria-label="${n}"]`);
  await cerrarMision(p);

  // ------------------------------------------------ 3. Ordenar un cuento (imágenes)
  await entrarAMision(p, 'Ordena el cuento');
  await p.waitForSelector('.ordenar__mesa .ordenar__tarjeta img');
  comprobar((await p.locator('.ordenar__mesa .ordenar__tarjeta img').count()) === 3 && !(await p.locator('.ordenar__mesa .ordenar__tarjeta strong').count()), 'el cuento se ordena con imágenes, sin texto que leer');
  comprobar((await dicho(p)).includes('Ordena el día de Sara'), 'la voz dice qué ordenar');
  comprobar(await sinDesborde(p), 'ordenar cuento: sin desborde a 390');
  await foto(p, '06-ordenar-cuento-390');
  await limpiarDicho(p);
  for (const t of CUENTO.ordenar[0].tarjetas) await p.click(`.ordenar__mesa .ordenar__tarjeta[aria-label="${t.dice}"]`);
  await p.waitForSelector('.ordenar__fila--completa');
  comprobar((await dicho(p)).some((t) => t.startsWith('Sale el sol') && t.includes('Llega la noche')), 'al terminar, la voz cuenta el relato completo en orden');
  await cerrarMision(p);
  guardado = await p.evaluate((k) => JSON.parse(localStorage.getItem(k)), CLAVE);
  comprobar(['prueba-ordenar-numeros', 'prueba-ordenar-cuento'].every((id) => guardado?.misiones?.[id]), 'las dos misiones de ordenar quedan completadas');
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
