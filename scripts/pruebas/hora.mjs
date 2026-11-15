// La misión de la hora muestra "3:00" bajo el reloj en la fase de mirar.
import { chromium, servir, abrir, alMapa, entrarAMision, foto, BASE_JUGADO } from './comun.mjs';
const servidor = await servir();
const navegador = await chromium.launch();
try {
  const { pagina, errores } = await abrir(navegador, { progreso: BASE_JUGADO });
  await alMapa(pagina);
  await entrarAMision(pagina, 'What time is it?');
  const cifras = [];
  for (let i = 0; i < 6; i++) {
    cifras.push(await pagina.locator('.carta-grande__cifra').textContent());
    if (i === 0) await foto(pagina, 'hora-mirar-390');
    await pagina.click('.boton-seguir');
    await pagina.waitForTimeout(200);
  }
  console.log('cifras vistas:', cifras.sort().join(' '), '| en fase jugar hay cifra:', await pagina.locator('.carta-grande__cifra').count());
  console.log('errores:', errores);
} finally {
  await navegador.close();
  servidor.kill();
}
