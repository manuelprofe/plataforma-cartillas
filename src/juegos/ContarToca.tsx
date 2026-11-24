// Plantilla de juego "contar y tocar". No contiene números ni objetos: cada ronda llega del
// contenido (mision.contar). Aparecen varios objetos iguales, la voz pide una cantidad y el niño
// toca esa cantidad; cada toque se cuenta en voz alta. Toca otra vez un objeto para soltarlo.
// Al tocar ✓ con otra cantidad no se pierde nada: la voz cuenta lo marcado, el guía anima y
// la ronda sigue; al segundo intento se marcan con brillo los que hacen falta.
import { useEffect, useRef, useState } from 'react';
import type { PropsJuego } from '../tipos';
import { CierreMision } from './CierreMision';
import { decirAyuda } from './ayuda';
import { callar, decir, sonar } from '../audio';
import './contar.css';

// Un leve giro a cada objeto, siempre el mismo, para que no parezcan una tabla.
const GIROS = [-6, 4, -2, 7, -5, 3, -8, 5, -3, 6, -4, 2];

export function ContarToca(props: PropsJuego) {
  const { mision, base, idiomaVoz, imagenGuia, imagenFiesta, onTerminar, onSalir } = props;
  const rondas = mision.contar?.rondas ?? [];
  const numeros = mision.contar?.numeros ?? [];
  const [indice, setIndice] = useState(0);
  const [marcados, setMarcados] = useState<number[]>([]);
  const [fallos, setFallos] = useState(0);
  const [errores, setErrores] = useState(0);
  const [resuelta, setResuelta] = useState(false);
  const [cierre, setCierre] = useState(false);
  const esperas = useRef<number[]>([]);
  const ronda = rondas[indice];

  const luego = (f: () => void, ms: number) => {
    esperas.current.push(window.setTimeout(f, ms));
  };

  useEffect(
    () => () => {
      esperas.current.forEach(clearTimeout);
      callar();
    },
    [],
  );

  // Sin rondas en el contenido no hay juego: se vuelve al mapa.
  useEffect(() => {
    if (!rondas.length) onSalir();
  }, [rondas.length, onSalir]);

  // Cada ronda empieza limpia y la voz dice qué contar.
  useEffect(() => {
    if (cierre || !ronda) return;
    setMarcados([]);
    setFallos(0);
    setResuelta(false);
    const t = window.setTimeout(() => decir(ronda.dice, idiomaVoz), 400);
    return () => clearTimeout(t);
  }, [indice, cierre, ronda, idiomaVoz]);

  if (!ronda) return null;

  const repetir = () => {
    sonar('toque');
    decir(ronda.dice, idiomaVoz);
  };

  const tocar = (i: number) => {
    if (resuelta) return;
    if (marcados.includes(i)) {
      sonar('toque');
      setMarcados(marcados.filter((m) => m !== i));
      return;
    }
    const nuevos = [...marcados, i];
    setMarcados(nuevos);
    sonar('toque');
    const palabra = numeros[nuevos.length - 1];
    if (palabra) decir(palabra, idiomaVoz);
  };

  const listo = () => {
    if (resuelta || !marcados.length) return;
    if (marcados.length === ronda.cantidad) {
      sonar('acierto');
      setResuelta(true);
      luego(() => {
        if (indice + 1 < rondas.length) setIndice(indice + 1);
        else {
          sonar('fiesta');
          setCierre(true);
        }
      }, 1400);
      return;
    }
    sonar('intenta');
    setErrores(errores + 1);
    const otra = fallos + 1;
    setFallos(otra);
    // Al segundo intento se muestran los que hacen falta, empezando de cero.
    if (otra >= 2) setMarcados([]);
    const contados = otra >= 2 ? '' : numeros.slice(0, marcados.length).join(', ');
    const despues = () => decirAyuda(props, 'contar-otra-vez', () => decir(ronda.dice, idiomaVoz));
    if (contados) decir(contados, idiomaVoz, despues);
    else despues();
  };

  const pista = fallos >= 2 && !resuelta;
  const grande = ronda.total <= 6;

  return (
    <div className="mision">
      <header className="mision__barra">
        <button type="button" className="boton-salir" onClick={onSalir} aria-label="Volver al mapa">
          ✕
        </button>
        {!cierre && (
          <div className="puntos" aria-hidden="true">
            {rondas.map((_, i) => (
              <span key={i} className={`punto${i < indice ? ' punto--hecho' : i === indice ? ' punto--ahora' : ''}`} />
            ))}
          </div>
        )}
      </header>

      {!cierre && (
        <main className="contar">
          <button type="button" className="oir contar__oir" onClick={repetir} aria-label="Escuchar otra vez">
            <img src={base + imagenGuia} alt="" width="96" height="76" draggable={false} />
            <span className="oir__onda" aria-hidden="true">🔊</span>
          </button>
          <div className={`contar__mesa${grande ? ' contar__mesa--grande' : ''}`} key={indice}>
            {Array.from({ length: ronda.total }, (_, i) => {
              const orden = marcados.indexOf(i);
              const marcado = orden >= 0;
              return (
                <button
                  key={i}
                  type="button"
                  className={`contar__objeto${marcado ? ' contar__objeto--marcado' : ''}${pista && i < ronda.cantidad ? ' contar__objeto--pista' : ''}${resuelta && marcado ? ' contar__objeto--bien' : ''}`}
                  style={{ ['--giro' as string]: `${GIROS[i % GIROS.length]}deg` }}
                  onClick={() => tocar(i)}
                  aria-pressed={marcado}
                  aria-label={`Objeto ${i + 1}`}
                >
                  <img src={base + ronda.objeto} alt="" draggable={false} />
                  {marcado && (
                    <span className="contar__cuenta" aria-hidden="true">
                      {orden + 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <button type="button" className={`contar__listo${resuelta ? ' contar__listo--bien' : ''}`} onClick={listo} disabled={!marcados.length || resuelta} aria-label="Listo">
            ✓
          </button>
        </main>
      )}

      {cierre && <CierreMision mision={mision} errores={errores} base={base} imagenFiesta={imagenFiesta} alRegistrar={() => {}} onTerminar={onTerminar} />}
    </div>
  );
}
