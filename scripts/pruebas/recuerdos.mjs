// Recuerdos: la cinemática ya vista queda en el álbum y se puede volver a ver; sin video no se rompe.
import { chromium, servir, abrir, alMapa, foto, menorToque, conMisiones, BASE_JUGADO } from './comun.mjs';
const servidor = await servir();
const navegador = await chromium.launch();
try {
  // Quien no la ha visto no tiene recuerdos.
  let { pagina, errores } = await abrir(navegador, { progreso: { ...BASE_JUGADO, vistas: ['intro'] }, sinVideos: true });
  await pagina.click('.boton-jugar');
  await pagina.waitForSelector('.mundo', { timeout: 15000 }); await pagina.waitForTimeout(900);
  await pagina.click('.utiles button[aria-label^="Álbum"]');
  console.log('sin haberla visto: recuerdos', await pagina.locator('.recuerdos__uno').count(), '| errores', errores);
  await pagina.context().close();

  // Con red: se abre el reproductor y al saltar se vuelve al álbum.
  ({ pagina, errores } = await abrir(navegador, { progreso: conMisiones([]) }));
  await alMapa(pagina);
  await pagina.click('.utiles button[aria-label^="Álbum"]');
  await pagina.waitForTimeout(500);
  await foto(pagina, 'recuerdos-album-390');
  console.log('recuerdos', await pagina.locator('.recuerdos__uno').count(), '|', await pagina.locator('.recuerdos__uno').getAttribute('aria-label'), '| toque mínimo', await menorToque(pagina, '.recuerdos__uno'));
  await pagina.click('.recuerdos__uno');
  await pagina.waitForTimeout(1500);
  const abierto = await pagina.locator('.cine video').count();
  await foto(pagina, 'recuerdos-cine-390');
  if (abierto) await pagina.click('.cine__saltar');
  await pagina.waitForTimeout(500);
  console.log('con red: reproductor abierto', abierto, '| al salir vuelve al álbum', await pagina.locator('.recuerdos').count(), 'tarjeta dormida', await pagina.locator('.es-dormido').count(), '| errores', errores);
  await pagina.context().close();

  // El video no llega (red caída a medias): vuelve al álbum y la tarjeta lo muestra.
  ({ pagina, errores } = await abrir(navegador, { progreso: conMisiones([]), sinVideos: true }));
  await alMapa(pagina);
  await pagina.click('.utiles button[aria-label^="Álbum"]');
  await pagina.click('.recuerdos__uno');
  await pagina.waitForTimeout(1500);
  await foto(pagina, 'recuerdos-sin-video-390');
  console.log('video caído: reproductor', await pagina.locator('.cine').count(), 'álbum', await pagina.locator('.recuerdos').count(), 'dormida', await pagina.locator('.es-dormido').count(), '| errores', errores);

  // Sin conexión del todo: ni se abre el reproductor; el álbum sigue sirviendo.
  await pagina.context().setOffline(true);
  await pagina.click('.panel__cerrar');
  await pagina.click('.utiles button[aria-label^="Álbum"]');
  await pagina.click('.recuerdos__uno');
  await pagina.waitForTimeout(600);
  console.log('sin conexión: reproductor', await pagina.locator('.cine').count(), 'dormida', await pagina.locator('.es-dormido').count(), '|', await pagina.locator('.recuerdos__uno').getAttribute('aria-label'), '| errores', errores);
  await pagina.click('.panel__cerrar');
  console.log('el mundo sigue:', await pagina.locator('.utiles').count());
} finally {
  await navegador.close();
  servidor.kill();
}
