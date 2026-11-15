// Vestidor: el niño toca a su personaje y le pone lo que ha abierto con sus Mission Stars.
// Las estrellas no se gastan: cada pieza y cada estela se abre al llegar a su número y se
// queda abierta. Qué piezas hay, cómo se llaman y con cuánto se abren lo dice el contenido.
import { useState } from 'react';
import type { Accesorio, Estela, Heroe, Ranura } from './tipos';
import { sonar } from './audio';
import { elegirEstela, ponerAccesorio } from './progreso';
import { Figura, accesoriosPuestos } from './Figura';

interface Props {
  heroe: Heroe;
  accesorios: Accesorio[];
  estelas: Estela[];
  estela: string;
  estrellas: number;
  puestos: Partial<Record<Ranura, string>>;
  vistos: string[];
  base: string;
  /** Tocó algo que aún no se abre: Lumi lo anima (la frase es del contenido). */
  alTocarCerrada: () => void;
  onCerrar: () => void;
}

export function Vestidor({ heroe, accesorios, estelas, estela, estrellas, puestos, vistos, base, alTocarCerrada, onCerrar }: Props) {
  // Ficha que tiembla porque todavía está cerrada, y contador para que el héroe celebre cada cambio.
  const [tiembla, setTiembla] = useState<string | null>(null);
  const [cambios, setCambios] = useState(0);

  const cerrada = (id: string) => {
    sonar('intenta');
    setTiembla(id);
    alTocarCerrada();
  };

  const tocarPieza = (a: Accesorio) => {
    if (estrellas < a.estrellas) return cerrada(a.id);
    if (puestos[a.ranura] === a.id) {
      sonar('volver');
      ponerAccesorio(a.ranura, undefined);
      return;
    }
    sonar(vistos.includes(a.id) ? 'acierto' : 'estrella');
    ponerAccesorio(a.ranura, a.id);
    setCambios(cambios + 1);
  };

  return (
    <div className="panel" role="dialog" aria-label="Vestir al personaje">
      <div className="panel__caja vestidor">
        <div className="panel__cabeza">
          <strong aria-label={`${estrellas} estrellas`}>★ {estrellas}</strong>
          <button type="button" className="panel__cerrar" onClick={onCerrar} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="vestidor__cuerpo">
          <div className="vestidor__escena">
            <div className="vestidor__heroe" key={cambios}>
              <Figura heroe={heroe} puestos={accesoriosPuestos(accesorios, puestos, estrellas)} base={base} ancho={110} />
            </div>
          </div>

          <div className="estelas" role="group" aria-label="Estela del personaje">
            {estelas.map((e) => {
              const abierta = estrellas >= e.estrellas;
              return (
                <button
                  key={e.id}
                  type="button"
                  className={`estelas__una${estela === e.id ? ' es-elegido' : ''}${abierta ? '' : ' es-cerrada'}${tiembla === e.id ? ' es-tiembla' : ''}`}
                  aria-pressed={estela === e.id}
                  aria-label={abierta ? `Estela ${e.id}` : `Estela ${e.id}: se abre con ${e.estrellas} estrellas`}
                  style={{ background: `conic-gradient(${[...e.colores, e.colores[0]].join(', ')})` }}
                  onAnimationEnd={() => setTiembla(null)}
                  onClick={() => {
                    if (!abierta) return cerrada(e.id);
                    sonar('acierto');
                    elegirEstela(e.id);
                  }}
                >
                  {!abierta && <span>★{e.estrellas}</span>}
                </button>
              );
            })}
          </div>

          {accesorios.length > 0 && (
            <div className="vestidor__grilla" role="group" aria-label="Accesorios">
              {accesorios.map((a) => {
                const abierta = estrellas >= a.estrellas;
                const puesta = abierta && puestos[a.ranura] === a.id;
                const nueva = abierta && !vistos.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    className={`vestidor__una${puesta ? ' es-elegido' : ''}${abierta ? '' : ' es-cerrada'}${nueva ? ' es-nueva' : ''}${tiembla === a.id ? ' es-tiembla' : ''}`}
                    aria-pressed={puesta}
                    aria-label={abierta ? `${a.nombre.es}${nueva ? ' (nueva)' : ''}` : `${a.nombre.es}: se abre con ${a.estrellas} estrellas`}
                    onAnimationEnd={() => setTiembla(null)}
                    onClick={() => tocarPieza(a)}
                  >
                    <img src={base + a.imagen} alt="" width="72" height="72" draggable={false} />
                    {!abierta && <span>★{a.estrellas}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
