// Final de cualquier misión: muestra lo ganado, pide la autoevaluación con caritas
// y registra la misión. Lo comparten todas las plantillas de juego.
import { useState } from 'react';
import type { Mision } from '../tipos';
import { premiosDeMision, registrarMision, type Premio } from '../progreso';
import { sonar } from '../audio';

interface Props {
  mision: Mision;
  errores: number;
  base: string;
  imagenFiesta: string;
  /** Se llama una vez, al registrar la misión, para anotar lo que costó. */
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

  const autoevaluar = (valor: number) => {
    sonar('estrella');
    alRegistrar();
    setPremios(registrarMision(mision.id, errores, valor, mision.estrellas));
  };

  return (
    <main className="cierre">
      <img className="cierre__guia" src={base + imagenFiesta} alt="" width="170" height="152" draggable={false} />
      {premios === null ? (
        <>
          {premiosDeMision(mision.id, errores, mision.estrellas).map((p) => (
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
      ) : (
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
