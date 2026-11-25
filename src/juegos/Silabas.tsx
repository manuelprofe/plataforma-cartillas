// Plantilla de juego "armar la palabra" (lectoescritura inicial). No contiene palabras: cada
// ronda llega del contenido (mision.silabas) con su imagen, cómo se dice y sus sílabas en orden.
// La voz dice la palabra; el niño toca las sílabas en orden y cada una suena al tocarla. Si no
// es la que sigue, suena igual, tiembla y vuelve a su sitio: nada se pierde y el guía anima; al
// segundo intento brilla la que sigue. La palabra completa se oye al terminar la ronda.
// Se puede jugar sin saber leer: la imagen y la voz guían, y cada sílaba se oye antes de elegir.
import { useEffect, useRef, useState } from 'react';
import type { PropsJuego } from '../tipos';
import { CierreMision } from './CierreMision';
import { decirAyuda } from './ayuda';
import { mezclar } from './mezclar';
import { callar, decir, sonar } from '../audio';
import './silabas.css';

interface Ficha {
  texto: string;
  suena: string;
}

export function Silabas(props: PropsJuego) {
  const { mision, base, idiomaVoz, imagenFiesta, onTerminar, onSalir } = props;
  const rondas = mision.silabas ?? [];
  const [indice, setIndice] = useState(0);
  const ronda = rondas[indice];
  const [fichas, setFichas] = useState<Ficha[]>([]);
  // Fichas (por posición en `fichas`) ya puestas, en orden.
  const [puestas, setPuestas] = useState<number[]>([]);
  const [fallos, setFallos] = useState(0);
  const [errores, setErrores] = useState(0);
  const [temblando, setTemblando] = useState<number | null>(null);
  const [cierre, setCierre] = useState(false);
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

  useEffect(() => {
    if (!rondas.length) onSalir();
  }, [rondas.length, onSalir]);

  // Cada ronda: sílabas buenas y de más, revueltas, y la voz dice la palabra.
  useEffect(() => {
    if (cierre || !ronda) return;
    const buenas = ronda.partes.map((texto, i) => ({ texto, suena: ronda.suenan?.[i] ?? texto }));
    const demas = (ronda.sobran ?? []).map((texto) => ({ texto, suena: texto }));
    let revueltas = mezclar([...buenas, ...demas]);
    for (let k = 0; k < 5 && revueltas.length > 1 && revueltas.slice(0, buenas.length).every((f, i) => f.texto === buenas[i].texto); k++) revueltas = mezclar([...buenas, ...demas]);
    setFichas(revueltas);
    setPuestas([]);
    setFallos(0);
    const t = window.setTimeout(() => decir(ronda.dice, idiomaVoz), 400);
    return () => clearTimeout(t);
  }, [indice, cierre, ronda, idiomaVoz]);

  if (!ronda) return null;
  const completa = puestas.length === ronda.partes.length;
  const sigue = ronda.partes[puestas.length];

  const oirPalabra = () => {
    sonar('toque');
    decir(ronda.dice, idiomaVoz);
  };

  const tocar = (i: number) => {
    if (completa || puestas.includes(i)) return;
    const ficha = fichas[i];
    if (ficha.texto === sigue) {
      sonar('toque');
      const nuevas = [...puestas, i];
      setPuestas(nuevas);
      setFallos(0);
      if (nuevas.length === ronda.partes.length) {
        // La palabra entera, después de la última sílaba.
        decir(ficha.suena, idiomaVoz, () => {
          sonar('acierto');
          decir(ronda.dice, idiomaVoz);
        });
        luego(() => {
          if (indice + 1 < rondas.length) setIndice(indice + 1);
          else {
            sonar('fiesta');
            setCierre(true);
          }
        }, 2600);
      } else decir(ficha.suena, idiomaVoz);
      return;
    }
    sonar('intenta');
    setErrores(errores + 1);
    setFallos(fallos + 1);
    setTemblando(i);
    luego(() => setTemblando(null), 500);
    decir(ficha.suena, idiomaVoz, () => decirAyuda(props, 'silabas-otra-vez', () => decir(ronda.dice, idiomaVoz)));
  };

  const pista = fallos >= 2 && !completa;

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
        <main className="silabas">
          <button type="button" className={`silabas__carta${completa ? ' silabas__carta--lista' : ''}`} key={indice} onClick={oirPalabra} aria-label="Escuchar la palabra">
            <img src={base + ronda.icono} alt="" width="140" height="140" draggable={false} />
            <span className="silabas__oir" aria-hidden="true">🔊</span>
          </button>

          <ol className={`silabas__fila${completa ? ' silabas__fila--completa' : ''}`} aria-label="La palabra">
            {ronda.partes.map((_, k) => {
              const i = puestas[k];
              return (
                <li key={k} className={i === undefined ? 'silabas__hueco' : 'silabas__puesta'}>
                  {i !== undefined && fichas[i]?.texto}
                </li>
              );
            })}
          </ol>

          <div className="silabas__mesa">
            {fichas.map((f, i) => {
              const usada = puestas.includes(i);
              return (
                <button
                  key={`${indice}-${i}`}
                  type="button"
                  className={`silabas__ficha${usada ? ' silabas__ficha--usada' : ''}${temblando === i ? ' silabas__ficha--tiembla' : ''}${pista && !usada && f.texto === sigue && fichas.findIndex((g, j) => g.texto === sigue && !puestas.includes(j)) === i ? ' silabas__ficha--pista' : ''}`}
                  onClick={() => tocar(i)}
                  disabled={usada}
                  aria-label={f.texto}
                >
                  {f.texto}
                </button>
              );
            })}
          </div>
        </main>
      )}

      {cierre && <CierreMision mision={mision} errores={errores} base={base} imagenFiesta={imagenFiesta} alRegistrar={() => {}} onTerminar={onTerminar} />}
    </div>
  );
}
