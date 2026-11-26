// Prueba del motor de plataformas sin navegador: cada nivel del contenido se puede terminar.
// Busca en anchura con las acciones del niño (izquierda, derecha, saltar), abriendo puertas
// como si el reto se resolviera. Uso: node --experimental-strip-types scripts/pruebas/plataformas-motor.mjs <id>
import { readFileSync } from 'node:fs';
const { leerMapa, mover, saltar, usarPalanca, abrirPuerta } = await import('../../src/juegos/plataformas/motor.ts');

const huella = (e) => JSON.stringify([e.heroe, e.mira, e.cajas, e.abiertas, e.palanca]);

export function resolver(mapa) {
  const inicio = leerMapa(mapa);
  const vistos = new Set([huella(inicio)]);
  let frontera = [[inicio, []]];
  for (let prof = 0; prof < 200 && frontera.length; prof++) {
    const sig = [];
    for (const [e, camino] of frontera) {
      for (const [nombre, f] of [['←', (s) => mover(s, -1)], ['→', (s) => mover(s, 1)], ['⤴', saltar], ['⇅', usarPalanca]]) {
        const paso = f(e);
        if (paso.suceso === 'meta') return [...camino, nombre];
        let fin = paso.cuadros[paso.cuadros.length - 1];
        if (paso.suceso === 'puerta') fin = abrirPuerta(fin, paso.puerta);
        const h = huella(fin);
        if (vistos.has(h)) continue;
        vistos.add(h);
        sig.push([fin, [...camino, nombre]]);
      }
    }
    frontera = sig;
  }
  return null;
}

if (import.meta.url === `file://${process.argv[1]}`) {
const ID = process.argv[2] ?? 'matematicas-0';
const cartilla = JSON.parse(readFileSync(`public/cartillas/${ID}/cartilla.json`, 'utf8'));
let fallas = 0;
for (const m of cartilla.territorios.flatMap((t) => t.misiones).filter((m) => m.plantilla === 'plataformas')) {
  m.plataformas.forEach((n, i) => {
    const puertasMapa = n.mapa.join('').split('G').length - 1;
    const retos = n.retos?.length ?? 0;
    const camino = resolver(n.mapa);
    // Un nivel con cajas es para pensar con ellas: sin las cajas no se debe poder terminar.
    const sinCajas = n.mapa.some((f) => f.includes('C')) ? resolver(n.mapa.map((f) => f.replaceAll('C', '.'))) : null;
    // Y uno con palanca, para usarla: sin ella (el puente apagado) no se debe poder terminar.
    const sinPalanca = n.mapa.some((f) => f.includes('L')) ? resolver(n.mapa.map((f) => f.replaceAll('L', '.'))) : null;
    const ok = camino && puertasMapa === retos && !sinCajas && !sinPalanca;
    if (!ok) fallas++;
    console.log(ok ? 'bien ' : 'FALLA', `${m.id} nivel ${i + 1}: ${camino ? `${camino.length} pasos (${camino.join('')})` : 'no se puede terminar'}${puertasMapa !== retos ? ` · ${puertasMapa} puertas y ${retos} retos` : ''}${sinCajas ? ' · se termina sin usar la caja' : ''}${sinPalanca ? ' · se termina sin la palanca' : ''}`);
  });
}
console.log(fallas ? `\n${fallas} fallas` : '\ntodo bien');
process.exit(fallas ? 1 : 0);
}
