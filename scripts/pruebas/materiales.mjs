// Materiales del docente: datos del paquete, plantilla (pantalla a 390 px), proyectar (1366 × 768,
// 1024 × 768 y 844 × 390, sin sesión), impresión a PDF (carta y media carta) y canciones con la
// letra sincronizada. Uso: `npm run build`, luego `node scripts/pruebas/materiales.mjs`.
// Las capturas y los PDF quedan en CAPTURAS (por omisión /tmp/capturas-cartillas).
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { chromium, servir, URL_APP, CAPTURAS, LLAVE_ADULTO, sesionAdulto, simularSupabase } from './comun.mjs';

const fallos = [];
const comprobar = (ok, texto) => { console.log(ok ? 'bien ' : 'FALLA', texto); if (!ok) fallos.push(texto); };
const url = (r) => new URL(r, URL_APP).href;
const PAQ = 'public/cartillas/ingles-3/';
const json = (r) => JSON.parse(readFileSync(PAQ + r, 'utf8'));
const foto = (p, n) => p.screenshot({ path: `${CAPTURAS}/mat-${n}.png` });

// ---------------------------------------------------------------- 1. Datos (sin navegador)

const cartilla = json('cartilla.json');
const indice = json('materiales/indice.json');
const md = (t) => readFileSync(`docs/pedagogia/materiales/${t}.md`, 'utf8');
const TEMAS = { escuela: 'escuela', colores: 'colores', numeros: 'numeros' };
const docs = Object.fromEntries(Object.keys(TEMAS).map((t) => [t, json(`materiales/${t}.json`)]));
const todosLosBloques = (d) => d.materiales.flatMap((m) => m.bloques);

comprobar(indice.temas.length === 6 && ['cuerpo', 'familia', 'hora'].every((t) => indice.temas.find((x) => x.id === t)?.estado === 'pendiente' || t === 'cuerpo'), 'el índice trae los 6 temas; cuerpo, familia y hora sin documento');
for (const [t, d] of Object.entries(docs)) {
  const tipos = d.materiales.map((m) => m.id.replace(`${t}-`, ''));
  comprobar(['guia', 'planeador-1', 'planeador-2', 'laminas', 'ficha-1', 'ficha-2', 'decir', 'prueba', 'casa'].every((x) => tipos.includes(x)), `${t}: guía, 2 planeadores, láminas, 2 fichas, decir, prueba y nota para la casa`);
  const palabras = todosLosBloques(d).filter((b) => b.tipo === 'palabra');
  comprobar(palabras.length > 0 && palabras.every((b) => b.audio && Object.values(cartilla.voz.en).includes(b.audio) && existsSync(PAQ + b.audio)), `${t}: toda palabra usa un audio del índice voz de cartilla.json`);
  const imgs = JSON.stringify(d).match(/(?:iconos|materiales)\/[\w.\-]+\.(?:svg|webp)/g) ?? [];
  comprobar(imgs.every((i) => existsSync(PAQ + i)), `${t}: todas las imágenes nombradas existen (${new Set(imgs).size})`);
  const items = todosLosBloques(d).filter((b) => b.tipo === 'item-prueba');
  const claveMd = /### Clave del docente[^\n]*\n\n([^.]+)\./.exec(md(t))?.[1];
  comprobar(items.length === 6 && items.map((i) => i.respuesta).join(', ') === claveMd, `${t}: 6 ítems de prueba y la clave coincide con el .md (${claveMd})`);
  const guion = todosLosBloques(d).find((b) => b.tipo === 'guion')?.texto ?? '';
  comprobar(md(t).replace(/\*\*/g, '').includes(guion.replace(/\*\*/g, '').slice(0, 60)), `${t}: el guion de la ficha sale del .md`);
}
const idCanciones = ['colores', 'numeros', 'cuerpo'].map((t) => json(`materiales/${t}-cancion.json`));
comprobar(idCanciones.every((c) => c.bloques[0].lineas.length > 10 && existsSync(PAQ + c.bloques[0].audio)), 'las 3 canciones (colores, números, cuerpo) tienen letra y audio');
comprobar(indice.temas.find((t) => t.id === 'cuerpo').estado === 'pendiente' && indice.temas.find((t) => t.id === 'cuerpo').materiales.some((m) => m.tipo === 'cancion'), 'cuerpo sigue pendiente pero muestra su canción');
const swFuente = readFileSync('dist/sw.js', 'utf8');
comprobar(!/materiales\/|canciones\//.test(swFuente.split('"cartillas"')[0]) && !/assets\/(Material|Proyectar|Adultos)-/.test(swFuente.split('"cartillas"')[0]), 'el service worker del niño no instala materiales, canciones ni el código de la plantilla');
comprobar(!/materiales|canciones/.test(readFileSync(PAQ + 'cartilla.json', 'utf8')), 'cartilla.json (lo que baja el niño) no nombra materiales ni canciones');

// ---------------------------------------------------------------- 2. Navegador

const servidor = await servir();
const navegador = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const errores = [];

async function docente(ancho, alto) {
  const c = await navegador.newContext({ viewport: { width: ancho, height: alto }, reducedMotion: 'reduce', serviceWorkers: 'block', locale: 'es-CO' });
  await c.addInitScript(([k, v]) => { localStorage.setItem(k, v); }, [LLAVE_ADULTO, JSON.stringify(sesionAdulto('docente', { perfil: { rol: 'docente', nombre: 'Profe Prueba', colegio_id: 'c1' } }))]);
  await simularSupabase(c, (u, q) => {
    if (u.pathname === '/rest/v1/grupos' && q.method() === 'GET') return { json: [{ id: 'g1', nombre: '3B', grado: '3°', colegio_id: 'c1', codigo: 'K7M2P' }] };
    if (u.pathname === '/rest/v1/rpc/mis_codigos') return { json: [{ grupo_id: 'g1', codigo: 'K7M2P' }] };
    if (u.pathname === '/rest/v1/estudiantes') return { json: [] };
    return null;
  });
  const p = await c.newPage();
  p.on('pageerror', (e) => errores.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && !/404|ERR_FAILED|sin simular/.test(m.text()) && errores.push(m.text()));
  await p.addInitScript(() => { window.print = () => { window.__imprimio = (window.__imprimio ?? 0) + 1; }; });
  return { c, p };
}
const sinDesborde = (p) => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
const menorToque = (p, sel) => p.evaluate((s) => Math.min(...[...document.querySelectorAll(s)].filter((b) => b.offsetParent).map((b) => { const r = b.getBoundingClientRect(); return Math.min(r.width, r.height); })), sel);
const paginasPdf = (ruta) => Number(/Pages:\s+(\d+)/.exec(execSync(`pdfinfo "${ruta}"`).toString())[1]);
const textoPdf = (ruta) => execSync(`pdftotext -layout "${ruta}" -`).toString();

try {
  // ---- Docente a 390 px
  {
    const { c, p } = await docente(390, 844);
    await p.goto(url('/docente'));
    await p.waitForSelector('text=Próxima clase');
    await p.waitForSelector('text=Proyectar útiles escolares');
    comprobar(true, 'Inicio: "Próxima clase" muestra el primer tema con su proyección y su planeador');
    await foto(p, 'inicio-390');
    const hrefs = await p.$$eval('a', (a) => a.map((x) => x.getAttribute('href')));
    comprobar(hrefs.includes('/proyectar/escuela') && hrefs.includes('/docente/planear/escuela'), 'Inicio enlaza a /proyectar/escuela y al plan');

    await p.goto(url('/docente/planear'));
    await p.waitForSelector('text=Plan y planeador de cada tema');
    const filas = await p.$$eval('.panel:nth-of-type(1) .fila', (f) => f.length);
    comprobar(filas === 6, `Planear lista los 6 temas (${filas})`);
    comprobar((await p.locator('.pestanas [aria-current="page"]').innerText()) === 'Planear', 'en Planear y Materiales la pestaña activa es Planear');
    await foto(p, 'planear-390');

    await p.goto(url('/docente/planear/colores'));
    await p.waitForSelector('.mat-momento__det');
    const momentos = await p.locator('.mat-momento__det').count();
    comprobar(momentos === 12, `Plan de colores: 6 + 6 momentos de los dos planeadores (${momentos})`);
    comprobar((await p.locator('a.mat-chip').count()) >= 8, 'los momentos enlazan a sus materiales (láminas, fichas, prueba, canción)');
    const chipCancion = p.locator('a.mat-chip', { hasText: 'Canción' }).first();
    comprobar((await chipCancion.getAttribute('href')) === '/docente/temas/colores/colores-cancion', 'el momento de la canción enlaza a colores-cancion');
    comprobar((await menorToque(p, 'a.mat-chip')) >= 48, 'enlaces del planeador de 48 px o más');
    comprobar(await sinDesborde(p), 'plan de colores sin desborde horizontal a 390');
    await p.locator('.mat-momento__det summary').first().click();
    await foto(p, 'plan-colores-390');

    // Materiales por tema
    await p.goto(url('/docente/temas/colores'));
    await p.waitForSelector('.fila');
    const lista = await p.$$eval('.panel .fila', (f) => f.map((x) => x.innerText.replace(/\n/g, ' | ')));
    comprobar(lista.length === 11 && lista.filter((t) => t.includes('Aquí irá')).length === 1, `colores: 11 filas, solo la hoja de caritas es "Aquí irá" (${lista.length})`);
    await foto(p, 'colores-materiales-390');
    await p.goto(url('/docente/temas/cuerpo'));
    await p.waitForSelector('.fila');
    const cuerpo = await p.$$eval('.panel .fila', (f) => f.map((x) => x.innerText));
    comprobar(cuerpo.filter((t) => t.includes('Aquí irá')).length === 10 && cuerpo.some((t) => t.includes('Canción')), 'cuerpo: 10 "Aquí irá" y su canción lista');
    await foto(p, 'cuerpo-materiales-390');
    await p.goto(url('/docente/temas/cuerpo/cuerpo-guia'));
    await p.waitForSelector('[data-hueco]');
    comprobar((await p.locator('[data-hueco]').innerText()).includes('Aquí irá la guía del tema') && (await p.getByRole('button', { name: 'Imprimir' }).isDisabled()), 'material pendiente: hueco "Aquí irá…" con Imprimir deshabilitado');

    // Ficha en pantalla
    for (const [id, nombre] of [['colores-ficha-2', 'ficha-colores-2'], ['numeros-ficha-2', 'ficha-numeros-2'], ['escuela-ficha-1', 'ficha-escuela-1'], ['colores-prueba', 'prueba-colores'], ['numeros-laminas', 'laminas-numeros'], ['colores-guia', 'guia-colores'], ['colores-decir', 'decir-colores'], ['colores-casa', 'casa-colores']]) {
      await p.goto(url(`/docente/temas/${id.split('-')[0]}/${id}`));
      await p.waitForSelector('.mat-pantalla h1');
      comprobar(await sinDesborde(p), `${id}: sin desborde horizontal a 390`);
      await foto(p, `${nombre}-390`);
    }
    await p.goto(url('/docente/temas/colores/colores-ficha-1'));
    await p.waitForSelector('.mat-pantalla h1');
    comprobar((await p.locator('.mat-pantalla [data-hueco]').count()) === 1, 'ficha 1 de colores: hueco "Aquí irán los dibujos" (contornos pendientes)');
    comprobar((await menorToque(p, '.mat-acciones .boton, .mat-oir')) >= 48, 'botones de la ficha de 48 px o más');

    // ---- Impresión
    // Ficha: dos copias en media carta, sin guion ni clave
    await p.emulateMedia({ media: 'print' });
    await p.emulateMedia({ media: 'screen' });
    await p.getByRole('button', { name: 'Imprimir' }).click();
    await p.getByRole('button', { name: /Hoja de la pareja/ }).click();
    await p.waitForFunction(() => window.__imprimio === 1);
    await p.emulateMedia({ media: 'print' });
    const hojas = await p.locator('.mat-imp:visible .mat-hoja').count();
    const guionVisible = await p.locator('.mat-imp .mat-guion:visible, .mat-imp .mat-clave:visible').count();
    comprobar(hojas === 2 && guionVisible === 0, `ficha impresa: 2 copias (media carta) y sin guion ni clave (${hojas}, ${guionVisible})`);
    comprobar((await p.locator('.mat-pantalla').isVisible()) === false, 'al imprimir no se ve la pantalla del docente');
    let pdf = `${CAPTURAS}/mat-ficha-colores-1.pdf`;
    await p.pdf({ path: pdf, format: 'Letter', preferCSSPageSize: true, printBackground: false });
    comprobar(paginasPdf(pdf) === 1, `ficha: una hoja carta con dos medias cartas (${paginasPdf(pdf)} página)`);
    const tf = textoPdf(pdf);
    comprobar(!/Lo que dice el docente|Clave/.test(tf) && (tf.match(/Colorea lo que oyes/g) ?? []).length === 2 && /Nombre:/.test(tf), 'PDF de la ficha: dos veces el título, con "Nombre:", sin guion ni clave');
    await p.emulateMedia({ media: 'screen' });

    // Ficha con guion y clave: una carta
    await p.getByRole('button', { name: 'Imprimir' }).click();
    await p.getByRole('button', { name: /Con guion y clave/ }).click();
    await p.emulateMedia({ media: 'print' });
    pdf = `${CAPTURAS}/mat-ficha-colores-1-docente.pdf`;
    await p.pdf({ path: pdf, format: 'Letter', preferCSSPageSize: true });
    comprobar(/Camiseta|camiseta azul/i.test(textoPdf(pdf)) && paginasPdf(pdf) === 1, 'hoja del docente de la ficha: trae guion y clave (1 página)');
    await p.emulateMedia({ media: 'screen' });

    // Ficha de números 2 (cantidades y numerales) y escuela 2 (memory)
    for (const [id, n] of [['numeros-ficha-2', 1], ['escuela-ficha-2', 1], ['colores-ficha-2', 1], ['numeros-ficha-1', 1]]) {
      await p.goto(url(`/docente/temas/${id.split('-')[0]}/${id}`));
      await p.waitForSelector('.mat-pantalla h1');
      await p.getByRole('button', { name: 'Imprimir' }).click();
      await p.getByRole('button', { name: /Hoja de la pareja/ }).click();
      await p.emulateMedia({ media: 'print' });
      pdf = `${CAPTURAS}/mat-${id}.pdf`;
      await p.pdf({ path: pdf, format: 'Letter', preferCSSPageSize: true });
      comprobar(paginasPdf(pdf) === n, `${id}: la hoja de la pareja cabe en una carta (${paginasPdf(pdf)})`);
      await p.emulateMedia({ media: 'screen' });
    }

    // Láminas: una por media hoja, 10 palabras = 5 hojas
    await p.goto(url('/docente/temas/numeros/numeros-laminas'));
    await p.waitForSelector('.mat-pantalla h1');
    await p.getByRole('button', { name: 'Imprimir' }).click();
    await p.emulateMedia({ media: 'print' });
    pdf = `${CAPTURAS}/mat-numeros-laminas.pdf`;
    await p.pdf({ path: pdf, format: 'Letter', preferCSSPageSize: true });
    comprobar(paginasPdf(pdf) === 5, `láminas de números: 10 láminas en 5 hojas carta, dos por hoja (${paginasPdf(pdf)})`);
    comprobar((await p.locator('.mat-imp img').count()) >= 20, 'láminas impresas con numeral, estrellas y mano');
    await p.emulateMedia({ media: 'screen' });

    // Prueba: hoja del niño (sin objetivo, sin clave) y clave del docente
    await p.goto(url('/docente/temas/colores/colores-prueba'));
    await p.waitForSelector('.mat-pantalla h1');
    await p.getByRole('button', { name: 'Imprimir' }).click();
    await p.getByRole('button', { name: /Hoja del niño/ }).click();
    await p.emulateMedia({ media: 'print' });
    pdf = `${CAPTURAS}/mat-prueba-nino.pdf`;
    await p.pdf({ path: pdf, format: 'Letter', preferCSSPageSize: true });
    const tn = textoPdf(pdf);
    comprobar(paginasPdf(pdf) === 1 && !/red|yellow|Respuesta|nota:/i.test(tn.replace(/Sin nota ni puntaje/, '')) && /Sin nota ni puntaje/.test(tn), 'hoja del niño: una carta, sin palabra objetivo, sin clave y sin casilla de nota');
    await p.emulateMedia({ media: 'screen' });
    await p.getByRole('button', { name: 'Imprimir' }).click();
    await p.getByRole('button', { name: /Clave del docente/ }).click();
    await p.emulateMedia({ media: 'print' });
    pdf = `${CAPTURAS}/mat-prueba-docente.pdf`;
    await p.pdf({ path: pdf, format: 'Letter', preferCSSPageSize: true });
    comprobar(/Respuesta/.test(textoPdf(pdf)) && /2, 1, 4, 3, 1, 2/.test(textoPdf(pdf)), 'clave del docente: marca la respuesta y trae 2, 1, 4, 3, 1, 2');
    await p.emulateMedia({ media: 'screen' });

    // Guía y planeador (carta, varias páginas posibles) y nota para la casa (media carta ×2)
    for (const [id, max] of [['colores-guia', 4], ['colores-planeador-1', 2], ['numeros-planeador-2', 2], ['escuela-casa', 1], ['colores-decir', 1]]) {
      await p.goto(url(`/docente/temas/${id.split('-')[0]}/${id}`));
      await p.waitForSelector('.mat-pantalla h1');
      await p.getByRole('button', { name: 'Imprimir' }).click();
      await p.emulateMedia({ media: 'print' });
      pdf = `${CAPTURAS}/mat-${id}.pdf`;
      await p.pdf({ path: pdf, format: 'Letter', preferCSSPageSize: true });
      comprobar(paginasPdf(pdf) <= max, `${id}: impresión en ${paginasPdf(pdf)} página(s) (máximo ${max})`);
      await p.emulateMedia({ media: 'screen' });
    }

    // ---- Canción en pantalla del docente: la línea resaltada avanza con el audio
    await p.goto(url('/docente/temas/colores/colores-cancion'));
    await p.waitForSelector('.letra__linea');
    comprobar((await p.locator('.letra__linea').count()) === 17 && (await p.locator('.letra .en').count()) > 10, 'canción de colores: 17 líneas visibles con las palabras en inglés destacadas');
    comprobar((await p.locator('.letra__linea--suena').count()) === 0, 'antes de cantar ninguna línea está resaltada');
    await foto(p, 'cancion-antes-390');
    await p.getByRole('button', { name: 'Escuchar' }).click();
    const lineas = [];
    for (let i = 0; i < 14; i++) {
      await p.waitForTimeout(500);
      lineas.push(await p.evaluate(() => [...document.querySelectorAll('.letra__linea')].findIndex((b) => b.getAttribute('aria-current') === 'true')));
    }
    const tiempo = await p.evaluate(() => 0);
    const distintas = [...new Set(lineas.filter((x) => x >= 0))];
    comprobar(distintas.length >= 2 && distintas.every((v, i) => i === 0 || v > distintas[i - 1]), `la línea resaltada avanza con el audio (${lineas.join(',')})`);
    await foto(p, 'cancion-suena-390');
    await p.getByRole('button', { name: 'Pausar' }).click();
    // Tocar una línea lleva el audio a ese punto
    await p.locator('.letra__linea').nth(9).click();
    await p.waitForTimeout(600);
    const alSaltar = await p.evaluate(() => [...document.querySelectorAll('.letra__linea')].findIndex((b) => b.getAttribute('aria-current') === 'true'));
    comprobar(alSaltar === 9, `tocar una línea salta a ella (${alSaltar})`);
    comprobar((await menorToque(p, '.letra__linea, .cancion__control .boton')) >= 48, 'líneas y botones de la canción de 48 px o más');
    comprobar(await sinDesborde(p), 'canción sin desborde horizontal a 390');
    // Impresión de la letra
    await p.getByRole('button', { name: 'Imprimir' }).click();
    await p.emulateMedia({ media: 'print' });
    pdf = `${CAPTURAS}/mat-cancion-colores.pdf`;
    await p.pdf({ path: pdf, format: 'Letter', preferCSSPageSize: true });
    const letraMd = json('canciones/colores.letra.json');
    const tl = textoPdf(pdf).replace(/\s+/g, ' ');
    comprobar(paginasPdf(pdf) === 1 && letraMd.lineas.every((l) => tl.includes(l.texto.slice(0, 20))) && /Estrofa 1/.test(tl) && /Coro/.test(tl), 'letra impresa completa con sus secciones en una carta');
    comprobar((await p.locator('.letra-imp b.en').count()) > 10, 'letra impresa con las palabras en inglés en negrita');
    await p.emulateMedia({ media: 'screen' });
    await c.close();
  }

  // ---- Proyectar sin sesión
  for (const [ancho, alto, nombre] of [[1366, 768, 'proyector'], [1024, 768, 'proyector-43'], [844, 390, 'celular-horizontal']]) {
    const c = await navegador.newContext({ viewport: { width: ancho, height: alto }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const p = await c.newPage();
    p.on('pageerror', (e) => errores.push(String(e)));
    p.on('console', (m) => m.type() === 'error' && !/ERR_FAILED/.test(m.text()) && errores.push(m.text()));
    await p.addInitScript(() => {
      window.__sonidos = [];
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () { window.__sonidos.push(this.src); return play.call(this); };
    });
    await p.goto(url('/proyectar'));
    await p.waitForSelector('.tarjeta-t');
    comprobar((await p.locator('.tarjeta-t').count()) === 6, `${nombre}: /proyectar sin sesión lista los 6 temas`);
    await foto(p, `${nombre}-temas`);
    await p.goto(url('/proyectar/colores'));
    await p.waitForSelector('.tarjeta-t');
    const textos = await p.$$eval('.tarjeta-t', (t) => t.map((x) => x.innerText.replace(/\n/g, ' ')));
    comprobar(textos.some((t) => t.startsWith('Láminas')) && textos.some((t) => /Canción/.test(t) && !/Aquí irá/.test(t)) && textos.filter((t) => /Aquí irá/.test(t)).length >= 3, `${nombre}: menú del tema con láminas, canción y huecos "Aquí irá"`);
    await foto(p, `${nombre}-menu`);

    await p.goto(url('/proyectar/colores/colores-laminas'));
    await p.waitForSelector('.deck__palabra');
    comprobar((await p.locator('.deck__palabra').innerText()) === 'red' && (await p.locator('.deck__cuenta').innerText()) === '1 de 10', `${nombre}: lámina 1 de 10 (red)`);
    await foto(p, `${nombre}-lamina`);
    comprobar(await sinDesborde(p) && (await p.evaluate(() => document.querySelector('.deck').scrollHeight <= document.querySelector('.deck').clientHeight + 1)), `${nombre}: lámina sin desbordes`);
    // texto no menor de 28 px a 768 de alto (en la pantalla, no en la ayuda de teclas)
    const menorTexto = await p.evaluate(() => Math.min(...[...document.querySelectorAll('.deck__palabra, .deck__suena, .deck__btn')].map((e) => parseFloat(getComputedStyle(e).fontSize))));
    if (alto >= 768) comprobar(menorTexto >= 20 && (await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.deck__suena')).fontSize))) >= 28, `${nombre}: "Suena" a 28 px o más (controles ${menorTexto}px)`);
    const antes = await p.evaluate(() => window.__sonidos.length);
    comprobar(antes >= 1, `${nombre}: la lámina suena al llegar`);
    await p.click('.deck__lamina');
    comprobar((await p.evaluate(() => window.__sonidos.length)) === antes + 1, `${nombre}: tocar la lámina vuelve a sonar`);
    await p.keyboard.press('ArrowRight');
    comprobar((await p.locator('.deck__cuenta').innerText()) === '2 de 10' && (await p.locator('.deck__palabra').innerText()) === 'blue', `${nombre}: flecha derecha pasa a la 2 (blue)`);
    await p.keyboard.press('Space');
    await p.keyboard.press('d');
    comprobar((await p.evaluate(() => window.__sonidos.length)) >= antes + 4, `${nombre}: Espacio (otra vez) y D (despacio) suenan`);
    await p.keyboard.press('ArrowLeft');
    comprobar((await p.locator('.deck__cuenta').innerText()) === '1 de 10', `${nombre}: flecha izquierda vuelve`);
    comprobar((await menorToque(p, '.deck__btn')) >= (alto >= 768 ? 72 : 56), `${nombre}: controles de ${alto >= 768 ? 72 : 56} px o más`);
    if (alto >= 768 && ancho === 1366) {
      await p.goto(url('/proyectar/numeros/numeros-laminas'));
      await p.waitForSelector('.deck__palabra');
      await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight');
      await foto(p, `${nombre}-lamina-numero`);
      comprobar((await p.locator('.deck__lamina .mat-estrellas').count()) === 1 && (await p.locator('.deck__lamina img').count()) === 2, 'lámina de número: numeral, estrellas y mano');
    }
    // Esc pide confirmar; "Seguir" cierra
    await p.keyboard.press('Escape');
    comprobar(await p.getByRole('dialog', { name: '¿Terminar la proyección?' }).isVisible(), `${nombre}: Esc pide confirmar`);
    await p.getByRole('button', { name: 'Seguir proyectando' }).click();

    // Prueba en el telón: sin clave ni objetivo escrito, 6 filas + 3 de decir
    await p.goto(url('/proyectar/colores/colores-prueba'));
    await p.waitForSelector('.deck__ctl');
    const n = Number(/de (\d+)/.exec(await p.locator('.deck__cuenta').innerText())[1]);
    comprobar(n === 11, `${nombre}: la prueba proyecta 2 títulos, 6 filas de escucha y 3 de decir = 11 pantallas (${n})`);
    await p.keyboard.press('ArrowRight');
    await p.waitForSelector('.deck__opcion');
    const cuerpoTexto = await p.locator('body').innerText();
    comprobar(!/Respuesta|Clave|doc/i.test(cuerpoTexto) && !/\bred\b/.test(await p.locator('.deck').innerText()), `${nombre}: la pantalla de la prueba no muestra la clave ni la palabra`);
    await foto(p, `${nombre}-prueba`);
    await p.locator('.deck__opcion').nth(0).click();
    comprobar((await p.locator('.deck__opcion--si').count()) === 1, `${nombre}: tocar una opción muestra cuál sonó, sin "perdiste"`);
    // Material que no se proyecta / con datos: no hay pantalla
    await p.goto(url('/proyectar/colores/colores-guia'));
    await p.waitForSelector('[data-hueco]');
    comprobar((await p.locator('.deck__ctl').count()) === 0, `${nombre}: una guía no tiene pantalla en /proyectar`);
    // Fichas: solo la consigna, nunca guion ni clave
    await p.goto(url('/proyectar/escuela/escuela-ficha-1'));
    await p.waitForSelector('.deck__consigna');
    comprobar((await p.locator('.deck__cuenta').innerText()) === '1 de 1' && !/Miren su ficha|pencil \(arriba/.test(await p.locator('body').innerText()), `${nombre}: la ficha proyecta solo la instrucción`);
    await foto(p, `${nombre}-consigna`);

    // Canción en el telón
    await p.goto(url('/proyectar/colores/colores-cancion'));
    await p.waitForSelector('.canto__linea');
    comprobar((await p.locator('.canto__linea').count()) === 5, `${nombre}: la letra está a la vista antes de cantar (5 líneas)`);
    await p.keyboard.press('Space');
    const vistos = [];
    for (let i = 0; i < 12; i++) {
      await p.waitForTimeout(500);
      vistos.push(await p.evaluate(() => document.querySelector('.canto__linea--suena')?.textContent ?? ''));
    }
    const unicos = [...new Set(vistos.filter(Boolean))];
    comprobar(unicos.length >= 2, `${nombre}: la línea que suena avanza con el audio (${unicos.length} líneas distintas)`);
    comprobar((await p.locator('.canto .en').count()) > 0, `${nombre}: palabras en inglés destacadas en la letra grande`);
    await foto(p, `${nombre}-cancion`);
    comprobar(await sinDesborde(p), `${nombre}: canción sin desbordes`);
    await p.keyboard.press('Space');
    await c.close();
  }
} finally {
  await navegador.close();
  servidor.kill();
}

comprobar(errores.length === 0, `sin errores de consola${errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''}`);
console.log(fallos.length ? `\n${fallos.length} FALLAS` : '\nTodo bien');
process.exit(fallos.length ? 1 : 0);
