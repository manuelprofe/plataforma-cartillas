// Resumen para la familia: puerta del adulto, estados vacío y con datos, impresión y "Empezar de nuevo".
import { chromium, servir, abrir, foto, guardado, menorToque, conMisiones, FAROLES, CAPTURAS, BASE_JUGADO } from './comun.mjs';
const servidor = await servir();
const navegador = await chromium.launch();
const sostener = async (pagina, selector, ms) => {
  const caja = await pagina.locator(selector).boundingBox();
  await pagina.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2);
  await pagina.mouse.down();
  await pagina.waitForTimeout(ms);
  await pagina.mouse.up();
};
const enLetras = (n) => { const U = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']; const V = ['', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve']; const D = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']; return n < 30 ? V[n - 20] : `${D[Math.floor(n / 10)]} y ${U[n % 10]}`; };
/** Puerta de la familia: sostener "Para la familia" 3 s y resolver el reto del adulto. */
const entrarFamilia = async (pagina) => {
  await sostener(pagina, '.pie-familia', 3300);
  await pagina.waitForSelector('.familia__numeros');
  const pedido = await pagina.locator('.familia__pregunta strong').textContent();
  const opciones = (await pagina.locator('.familia__numero').allTextContents()).map(Number);
  await pagina.click(`.familia__numero:text-is("${opciones.find((n) => enLetras(n) === pedido)}")`);
  await pagina.waitForSelector('.familia__hoja:not(.familia__reto)');
  await pagina.waitForTimeout(900);
};
try {
  // Vacío: sin misiones no hay imprimir. Un toque corto no abre nada.
  let { pagina, errores } = await abrir(navegador, { progreso: BASE_JUGADO });
  console.log('en la portada no está "Empezar de nuevo":', !(await pagina.locator('.nino').textContent()).includes('Empezar de nuevo'), '| toque mínimo del pie', await menorToque(pagina, '.pie-familia'));
  await pagina.click('.pie-familia');
  await pagina.waitForTimeout(900);
  console.log('toque corto: abre', await pagina.locator('.familia').count(), '| pista:', await pagina.locator('.pie-familia__pista').textContent());
  await foto(pagina, 'familia-portada-390');
  await entrarFamilia(pagina);
  await foto(pagina, 'familia-vacio-390');
  console.log('vacío:', (await pagina.locator('.familia__hoja p:not(.familia__imprimir-solo)').first().textContent()).slice(0, 50), '| imprimir', await pagina.getByText('Imprimir').count(), '| errores', errores);
  await pagina.context().close();

  // Con datos.
  const p = conMisiones(FAROLES.slice(0, Number(process.env.MISIONES ?? 7)), { ayudados: ['caro', 'tito'], dias: [new Date().toISOString().slice(0, 10), '2020-01-01'], superadas: ['purple'], album: [{ en: 'frog', es: 'rana', icono: 'iconos/1f438.svg' }],
    repasar: [{ en: 'ruler', es: 'regla', icono: 'iconos/1f4cf.svg' }, { en: 'white', es: 'blanco', icono: 'iconos/26aa.svg' }, { en: 'pink', es: 'rosado', icono: 'iconos/color-pink.svg' }, { en: 'brown', es: 'café', icono: 'iconos/1f7e4.svg' }] });
  Object.assign(p.misiones['bosque-colors'], { veces: 2, mejoras: 1, autoeval: 3 });
  p.misiones['bosque-school'].autoeval = 1; p.misiones['bosque-school-2'].autoeval = 1;
  ({ pagina, errores } = await abrir(navegador, { progreso: p }));
  await entrarFamilia(pagina);
  await pagina.screenshot({ path: `${CAPTURAS}/familia-datos-390.png`, fullPage: false });
  const texto = await pagina.locator('.familia__hoja').innerText();
  console.log(texto.split('\n').filter((l) => l.length > 30).join('\n'));
  console.log('palabras prohibidas:', ['costó', 'costaron', 'error', 'falló', '%', 'nota:', 'bajo'].filter((x) => texto.toLowerCase().includes(x)), '| por practicar (máx. 3):', await pagina.locator('.familia__lista li').count(),
    '| toque mínimo', await menorToque(pagina, '.familia button'), '| desborde horizontal', await pagina.evaluate(() => document.querySelector('.familia').scrollWidth > innerWidth));
  await pagina.locator('.familia').evaluate((e) => e.scrollTo(0, e.scrollHeight)); await pagina.waitForTimeout(200);
  await foto(pagina, 'familia-final-390');
  // Impresión: una hoja carta.
  await pagina.emulateMedia({ media: 'print' });
  const pdf = await pagina.pdf({ path: `${CAPTURAS}/familia.pdf`, format: 'Letter', preferCSSPageSize: true });
  console.log('PDF páginas:', (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length, '| botones visibles al imprimir', await pagina.locator('.familia button:visible').count());
  await pagina.setViewportSize({ width: 816, height: 1056 });
  await pagina.screenshot({ path: `${CAPTURAS}/familia-impresa.png`, fullPage: true });
  await pagina.emulateMedia({ media: 'screen' });
  await pagina.setViewportSize({ width: 390, height: 844 });
  // Empezar de nuevo: un toque corto no borra; sostener 2 s sí.
  await pagina.locator('.familia__borrar').click();
  await foto(pagina, 'familia-borrar-390');
  await pagina.locator('.familia__boton--peligro').click();
  await pagina.waitForTimeout(300);
  console.log('toque corto en Borrar: estrellas siguen', (await guardado(pagina)).estrellas);
  await sostener(pagina, '.familia__boton--peligro', 2300);
  await pagina.waitForSelector('.jugar-invitado'); await pagina.waitForTimeout(900);
  const g = await guardado(pagina);
  console.log('tras sostener: estrellas', g.estrellas, 'misiones', Object.keys(g.misiones).length, 'héroe', g.heroe, '| errores', errores);
  await pagina.context().close();

  ({ pagina, errores } = await abrir(navegador, { progreso: p, ancho: 1280, alto: 800 }));
  await entrarFamilia(pagina);
  await foto(pagina, 'familia-datos-1280');
} finally {
  await navegador.close();
  servidor.kill();
}
