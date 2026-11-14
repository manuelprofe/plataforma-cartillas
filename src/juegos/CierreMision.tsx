// Final de cualquier misión: registra la misión, muestra lo ganado y pide la
// autoevaluación con caritas. Lo comparten todas las plantillas de juego.
// La misión se registra apenas se llega aquí: si el niño sale con ✕ o recarga sin
// tocar una carita, no pierde lo ganado. La carita solo agrega cómo se sintió.
import { useEffect, useRef, useState } from 'react';
import type { Mision } from '../tipos';
import { fijarAutoevaluacion, registrarMision, type Premio } from '../progreso';
import { sonar } from '../audio';

interface Props {
  mision: Mision;
  errores: number;
  base: string;
  imagenFiesta: string;
  /** Se llama una sola vez, al registrar la misión, para anotar lo que costó. */
  alRegistrar: () => void;
  onTerminar: () => void;
}

const CARITAS: [string, number][] = [
  ['😄', 3],
  ['🙂', 2],
  ['🤔', 1],
];

export function CierreMision({ mision, errores, base, imagenFiesta, alRegistrar, onTerminar }: Props) {
  const [premios, setPremios] = useState<Premio[] | null>(null);
  const [sentir, setSentir] = useState<number | null>(null);
  // El ref sobrevive al doble efecto de StrictMode: la misión se registra una vez.
  const registrada = useRef(false);

  useEffect(() => {
    if (registrada.current) return;
    registrada.current = true;
    alRegistrar();
    setPremios(registrarMision(mision.id, errores, undefined, mision.estrellas));
  }, [alRegistrar, mision.id, mision.estrellas, errores]);

  const autoevaluar = (valor: number) => {
    sonar('estrella');
    fijarAutoevaluacion(mision.id, valor);
    setSentir(valor);
  };

  return (
    <main className="cierre">
      <img className="cierre__guia" src={base + imagenFiesta} alt="" width="170" height="152" draggable={false} />
      {premios !== null && sentir === null && (
        <>
          {premios.map((p) => (
            <div className="premio" key={p.clave}>
              {p.clave === 'completar' ? `★ +${p.estrellas}` : '🏅'}
            </div>
          ))}
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
            {premios.some((p) => p.clave === 'completar') ? `★ +${premios.reduce((a, p) => a + p.estrellas, 0)}` : premios.length ? '🏅' : '👍'}
          </div>
          <button type="button" className="boton-seguir" onClick={onTerminar} aria-label="Volver al mapa">
            ➜
          </button>
        </>
      )}
    </main>
  );
}
