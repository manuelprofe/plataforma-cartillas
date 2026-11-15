// Vestidor: abrir, tocar una cerrada, desenvolver y poner una pieza, quitarla, estelas, y verla en el mundo.
import { chromium, servir, abrir, alMapa, foto, guardado, menorToque, conMisiones, FAROLES } from './comun.mjs';
const servidor = await servir();
const navegador = await chromium.launch();
try {
  // 0 estrellas: todo en silueta.
  let { pagina, errores } = await abrir(navegador, { progreso: conMisiones([]) });
  await alMapa(pagina);
  await pagina.click('.utiles__vestidor');
  await pagina.waitForTimeout(600);
  await foto(pagina, 'vestidor-vacio-390');
  await pagina.click('.vestidor__una >> nth=0');
  console.log('0 estrellas: cerradas', await pagina.locator('.vestidor__una.es-cerrada').count(), '| al tocar tiembla:', await pagina.locator('.vestidor__una.es-tiembla').count() >= 0, '| puesto', JSON.stringify((await guardado(pagina)).accesorios ?? {}), '| errores', errores);
  await pagina.context().close();

  // 4 misiones con carita (100 estrellas): bufanda y gafas abiertas y nuevas, estela menta abierta.
  for (const heroe of ['mika', 'tavi', 'bruno']) {
    const p = conMisiones(FAROLES.slice(0, 4), { heroe });
    p.registro.push(...FAROLES.slice(0, 4).map((mision) => ({ conducta: 'autoevaluar', estrellas: 10, mision, origen: 'app' })));
    p.estrellas = 100;
    ({ pagina, errores } = await abrir(navegador, { progreso: p }));
    await alMapa(pagina);
    if (heroe === 'mika') {
      await foto(pagina, 'vestidor-boton-390');
      console.log('botón con aviso de nuevo:', await pagina.locator('.utiles__vestidor.es-nuevo').count(), '| toque mínimo en útiles', await menorToque(pagina, '.utiles button'));
    }
    await pagina.click('.utiles__vestidor');
    await pagina.waitForTimeout(500);
    if (heroe === 'mika') {
      await foto(pagina, 'vestidor-nuevas-390');
      console.log('nuevas', await pagina.locator('.vestidor__una.es-nueva').count(), 'cerradas', await pagina.locator('.vestidor__una.es-cerrada').count(), 'estelas cerradas', await pagina.locator('.estelas__una.es-cerrada').count(),
        '| toque mínimo: piezas', await menorToque(pagina, '.vestidor__una'), 'estelas', await menorToque(pagina, '.estelas__una'), 'cerrar', await menorToque(pagina, '.panel__cerrar'));
    }
    await pagina.click('.vestidor__una >> nth=0');
    await pagina.click('.vestidor__una >> nth=1');
    await pagina.click('.estelas__una >> nth=1');
    await pagina.waitForTimeout(600);
    await foto(pagina, `vestidor-puesto-${heroe}-390`);
    let g = await guardado(pagina);
    console.log(heroe, 'puesto', JSON.stringify(g.accesorios), 'vistos', g.accesoriosVistos, 'estela', g.estela, 'estrellas siguen', g.estrellas);
    if (heroe === 'mika') {
      await pagina.click('.vestidor__una >> nth=1');
      console.log('al tocar la puesta se quita:', JSON.stringify((await guardado(pagina)).accesorios));
      await pagina.click('.vestidor__una >> nth=1');
    }
    await pagina.click('.panel__cerrar');
    await pagina.waitForTimeout(500);
    await foto(pagina, `vestidor-mundo-${heroe}-390`);
    console.log(heroe, 'en el mundo lleva', await pagina.locator('.guia .figura__accesorio').count(), 'piezas | aviso', await pagina.locator('.utiles__vestidor.es-nuevo').count(), '| errores', errores);
    await pagina.context().close();
  }

  // Todo abierto, a 1280 px.
  const todo = conMisiones(FAROLES, { accesorios: { cuello: 'bufanda', cara: 'gafas-estrella', cabeza: 'corona-flores', espalda: 'mochila-cohete' }, accesoriosVistos: ['bufanda', 'gafas-estrella', 'corona-flores', 'mochila-cohete', 'capa-hojas', 'antena-luciernaga'] });
  todo.registro.push({ conducta: 'colaborar', estrellas: 300, origen: 'docente' });
  todo.estrellas += 300;
  ({ pagina, errores } = await abrir(navegador, { progreso: todo, ancho: 1280, alto: 800 }));
  await alMapa(pagina);
  await pagina.click('.utiles__vestidor');
  await pagina.waitForTimeout(500);
  await foto(pagina, 'vestidor-todo-1280');
  console.log('1280: cerradas', await pagina.locator('.vestidor__una.es-cerrada').count(), '| errores', errores);
} finally {
  await navegador.close();
  servidor.kill();
}
