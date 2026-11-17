// Estrellas opción B: migración del progreso anterior, premios al cerrar una misión y puente por faroles.
import { chromium, servir, abrir, alMapa, entrarAMision, jugarEscuchaToca, foto, guardado, menorToque, conMisiones, FAROLES, CLAVE_V3, BASE_JUGADO } from './comun.mjs';
const servidor = await servir();
const navegador = await chromium.launch();
const suma = (p) => p.registro.reduce((a, e) => a + e.estrellas, 0);
try {
  // 1. Migración: quien ya jugó conserva todo y no baja de lo que tenía.
  const viejo = {
    estrellas: 11, vistas: ['cine-inicio', 'intro'], heroe: 'tavi', estela: 'menta', album: [{ en: 'frog', es: 'rana', icono: 'iconos/1f438.svg' }], ayudados: ['caro'], repasar: [],
    misiones: { 'bosque-school': { veces: 2, mejorErrores: 0, autoeval: 3, mejoras: 1 }, 'bosque-school-2': { veces: 1, mejorErrores: 2 }, 'bosque-school-3': { veces: 1, mejorErrores: 0, autoeval: 2 }, 'bosque-time': { veces: 1, mejorErrores: 1 } },
  };
  let { pagina, errores } = await abrir(navegador, { progreso: viejo, clave: CLAVE_V3 });
  let p = await guardado(pagina);
  const por = (c) => p.registro.filter((e) => e.conducta === c).length;
  console.log('migración: estrellas', p.estrellas, '(antes 11) suma registro', suma(p), '| completar', por('completar'), 'mejorar', por('mejorar'), 'autoevaluar', por('autoevaluar'), 'pronunciar', por('pronunciar'),
    '| conserva', p.heroe, p.estela, p.album.length, p.ayudados.length, Object.keys(p.misiones).length, '| v3 sigue guardado:', await pagina.evaluate((k) => Boolean(localStorage.getItem(k)), CLAVE_V3));
  await pagina.reload(); await pagina.waitForSelector('.jugar-invitado');
  console.log('tras recargar no suma dos veces:', (await guardado(pagina)).estrellas === p.estrellas);
  await pagina.context().close();

  // 2. Jugar la primera misión: completar 15 y, al tocar una carita, autoevaluarse 10.
  ({ pagina, errores } = await abrir(navegador, { progreso: BASE_JUGADO }));
  await alMapa(pagina);
  await entrarAMision(pagina, 'What time is it?');
  await jugarEscuchaToca(pagina);
  await pagina.waitForTimeout(700);
  await foto(pagina, 'estrellas-cierre-390');
  console.log('cierre:', (await pagina.locator('.premio').allTextContents()).join(' | '), '| carita mínima', await menorToque(pagina, '.carita'), 'px');
  await pagina.click('.carita');
  await pagina.waitForTimeout(500);
  await foto(pagina, 'estrellas-total-390');
  p = await guardado(pagina);
  console.log('total mostrado:', await pagina.locator('.premio--total').textContent(), '| guardado', p.estrellas, p.registro.map((e) => `${e.conducta}:${e.estrellas}:${e.dia}`).join(' '));
  await pagina.click('.boton-seguir');
  await pagina.waitForSelector('.mundo'); await pagina.waitForTimeout(2500);
  await foto(pagina, 'estrellas-mapa-390');
  console.log('marcador:', (await pagina.locator('.marcador').textContent()).trim(), '| errores', errores);
  await pagina.context().close();

  // 3. El puente: cerrado con 16 faroles y el pozo; abierto con los 17 aunque falte el pozo.
  for (const [nombre, ids] of [['16 faroles + pozo', [...FAROLES.slice(0, 16), 'bosque-pozo']], ['17 faroles sin pozo', FAROLES]]) {
    ({ pagina, errores } = await abrir(navegador, { progreso: conMisiones(ids) }));
    await alMapa(pagina);
    await pagina.waitForTimeout(1500);
    console.log(nombre, '→', await pagina.locator('.puerta').getAttribute('class'), '|', (await pagina.locator('.puerta__cuenta').textContent()).trim(), '|', await pagina.locator('.puerta').getAttribute('aria-label'), '| errores', errores);
    await pagina.context().close();
  }
} finally {
  await navegador.close();
  servidor.kill();
}
