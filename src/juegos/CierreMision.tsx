// Final de cualquier misión: registra la misión, muestra lo ganado y pide la
// autoevaluación con caritas. Lo comparten todas las plantillas de juego.
// La misión se registra apenas se llega aquí: si el niño sale con ✕ o recarga sin
// tocar una carita, no pierde lo ganado. La carita solo agrega cómo se sintió.
import { Calcomania, CALCOMANIAS } from '../Calcomania';
import { useEffect, useRef, useState } from 'react';
import type { Mision } from '../tipos';
import { fijarAutoevaluacion, registrarMision, type Premio } from '../progreso';
import { sonar } from '../audio';

interface Props {
  mision: Mision;
  errores: number;
  base: string;
  imagenFiesta: string;
  /** El juego fue de voz y el niño intentó decir las palabras. */
  pronuncio?: boolean;
  /** Se llama una sola vez, al registrar la misión, para anotar lo que costó. */
  alRegistrar: () => void;
  onTerminar: () => void;
}

const CARITAS: [string, number][] = [
  ['😄', 3],
  ['🙂', 2],
  ['🤔', 1],
];


export function CierreMision({ mision, errores, base, imagenFiesta, pronuncio = false, alRegistrar, onTerminar }: Props) {
  const [premios, setPremios] = useState<Premio[] | null>(null);
  const [sentir, setSentir] = useState<number | null>(null);
  // El ref sobrevive al doble efecto de StrictMode: la misión se registra una vez.
  const registrada = useRef(false);

  useEffect(() => {
    if (registrada.current) return;
    registrada.current = true;
    alRegistrar();
    setPremios(registrarMision(mision.id, errores, pronuncio));
  }, [alRegistrar, mision.id, errores, pronuncio]);

  const autoevaluar = (valor: number) => {
    sonar('estrella');
    const premio = fijarAutoevaluacion(mision.id, valor);
    if (premio) setPremios((antes) => [...(antes ?? []), premio]);
    setSentir(valor);
  };

  return (
    <main className="cierre">
      <img className="cierre__guia" src={base + imagenFiesta} alt="" width="170" height="152" draggable={false} />
      {premios !== null && sentir === null && (
        <>
          <div className="premios">
            {premios.map((p) => (
              <div className="premio" key={p.clave}>
                <Calcomania tipo={p.clave} alto={64} />
                <span className="premio__nombre">{CALCOMANIAS[p.clave === 'anterior' ? 'completar' : p.clave].nombre}</span>
              </div>
            ))}
          </div>
          <div className="caritas" role="group" aria-label="¿Cómo te sentiste?">
            {CARITAS.map(([cara, valor]) => (
              <button key={valor} type="button" className="carita" onClick={() => autoevaluar(valor)} aria-label={`Me sentí ${cara}`}>
                {cara}
              </button>
            ))}
          </div>
        </>
      )}
      {premios !== null && sentir !== null && (
        <>
          <div className="premio premio--total">
            {premios.length ? (
              <>
                <Calcomania alto={56} /> +{premios.length}
              </>
            ) : (
              '👍'
            )}
          </div>
          <button type="button" className="boton-seguir" onClick={onTerminar} aria-label="Volver al mapa">
            ➜
          </button>
        </>
      )}
    </main>
  );
}
