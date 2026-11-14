// Plantilla de juego "escucha y toca". No contiene vocabulario: recibe las
// palabras de la misión y sirve igual para cualquier cartilla.
import { useEffect, useRef, useState } from 'react';
import type { Mision, Palabra } from '../tipos';
import { anotarPractica } from '../progreso';
import { CierreMision } from './CierreMision';
import { mezclar } from './mezclar';
import { callar, decir, sonar } from '../audio';

const RONDAS = 6;
const OPCIONES = 3;

interface Props {
  mision: Mision;
  base: string;
  idiomaVoz: string;
  imagenGuia: string;
  imagenFiesta: string;
  onTerminar: () => void;
  onSalir: () => void;
}

type Fase = 'mirar' | 'jugar' | 'cierre';

export function EscuchaToca({ mision, base, idiomaVoz, imagenGuia, imagenFiesta, onTerminar, onSalir }: Props) {
  const [seleccion] = useState(() => mezclar(mision.palabras).slice(0, RONDAS));
  const [orden] = useState(() => mezclar(seleccion));
  const [fase, setFase] = useState<Fase>('mirar');
  const [indice, setIndice] = useState(0);
  const [opciones, setOpciones] = useState<Palabra[]>([]);
  const [falladas, setFalladas] = useState<string[]>([]);
  const [resuelta, setResuelta] = useState(false);
  const [errores, setErrores] = useState(0);
  const [costaron, setCostaron] = useState<string[]>([]);
  const esperas = useRef<number[]>([]);

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

  const objetivo = fase === 'jugar' ? orden[indice] : seleccion[indice];

  // Al cambiar de palabra: se arma la ronda y el guía la dice.
  useEffect(() => {
    if (fase === 'cierre' || !objetivo) return;
    if (fase === 'jugar') {
      const distractores = mezclar(mision.palabras.filter((p) => p.en !== objetivo.en)).slice(0, OPCIONES - 1);
      setOpciones(mezclar([objetivo, ...distractores]));
      setFalladas([]);
      setResuelta(false);
    }
    const t = window.setTimeout(() => decir(objetivo.en, idiomaVoz), 350);
    return () => clearTimeout(t);
  }, [fase, indice, objetivo, mision.palabras, idiomaVoz]);

  const repetir = () => {
    sonar('toque');
    if (objetivo) decir(objetivo.en, idiomaVoz);
  };

  const siguienteCarta = () => {
    sonar('toque');
    if (indice + 1 < seleccion.length) setIndice(indice + 1);
    else {
      setIndice(0);
      setFase('jugar');
    }
  };

  const elegir = (p: Palabra) => {
    if (resuelta || falladas.includes(p.en)) return;
    if (p.en === objetivo.en) {
      sonar('acierto');
      setResuelta(true);
      luego(() => {
        if (indice + 1 < orden.length) setIndice(indice + 1);
        else {
          sonar('fiesta');
          setFase('cierre');
        }
      }, 1200);
    } else {
      sonar('intenta');
      setFalladas([...falladas, p.en]);
      setErrores(errores + 1);
      if (!costaron.includes(objetivo.en)) setCostaron([...costaron, objetivo.en]);
      luego(() => decir(objetivo.en, idiomaVoz), 500);
    }
  };

  const puntos = fase === 'mirar' ? seleccion : orden;

  return (
    <div className="mision">
      <header className="mision__barra">
        <button type="button" className="boton-salir" onClick={onSalir} aria-label="Volver al mapa">
          ✕
        </button>
        {fase !== 'cierre' && (
          <div className="puntos" aria-hidden="true">
            {puntos.map((p, i) => (
              <span key={p.en} className={`punto${i < indice ? ' punto--hecho' : i === indice ? ' punto--ahora' : ''}${fase === 'mirar' ? ' punto--mirar' : ''}`} />
            ))}
          </div>
        )}
      </header>

      {fase === 'mirar' && objetivo && (
        <main className="mirar">
          <button type="button" className="carta-grande" key={objetivo.en} onClick={repetir} aria-label={`Escuchar ${objetivo.en}`}>
            <img src={base + objetivo.icono} alt="" width="160" height="160" draggable={false} />
            <strong>{objetivo.en}</strong>
            <small>{objetivo.es}</small>
            <span className="carta-grande__oir" aria-hidden="true">🔊</span>
          </button>
          <button type="button" className="boton-seguir" onClick={siguienteCarta} aria-label="Siguiente">
            ➜
          </button>
        </main>
      )}

      {fase === 'jugar' && objetivo && (
        <main className="jugar">
          <button type="button" className="oir" onClick={repetir} aria-label="Escuchar otra vez">
            <img src={base + imagenGuia} alt="" width="110" height="87" draggable={false} />
            <span className="oir__onda" aria-hidden="true">🔊</span>
          </button>
          <div className="opciones">
            {opciones.map((p) => {
              const acertada = resuelta && p.en === objetivo.en;
              const fallada = falladas.includes(p.en);
              const pista = !resuelta && falladas.length >= 2 && p.en === objetivo.en;
              return (
                <button
                  key={`${indice}-${p.en}`}
                  type="button"
                  className={`opcion${acertada ? ' opcion--bien' : ''}${fallada ? ' opcion--no' : ''}${pista ? ' opcion--pista' : ''}`}
                  onClick={() => elegir(p)}
                  aria-label={p.en}
                >
                  <img src={base + p.icono} alt="" width="96" height="96" draggable={false} />
                  {acertada && <strong>{p.en}</strong>}
                </button>
              );
            })}
          </div>
        </main>
      )}

      {fase === 'cierre' && (
        <CierreMision
          mision={mision}
          errores={errores}
          base={base}
          imagenFiesta={imagenFiesta}
          alRegistrar={() =>
            anotarPractica(
              seleccion.filter((p) => !costaron.includes(p.en)),
              seleccion.filter((p) => costaron.includes(p.en)),
            )
          }
          onTerminar={onTerminar}
        />
      )}
    </div>
  );
}
