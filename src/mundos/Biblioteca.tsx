// Mundo de español: la biblioteca de Renglón. Cada misión es un libro y cada tema, un estante;
// los cuentos llevan tapa ilustrada. Un libro terminado lleva su cinta y el que sigue brilla.
// Los periodos que aún no tienen libros se ven como estantes cerrados al final.
import { useEffect, useLayoutEffect, useRef } from 'react';
import type { Accesorio, Estela, Heroe, Territorio } from '../tipos';
import { useProgreso } from '../progreso';
import { estados, porTema, useEntrada, useVestidor } from './comun';
import { sonar } from '../audio';
import './biblioteca.css';

/** Color de la tapa de cada estante, en orden. */
const TAPAS = ['#f08a5d', '#6cc3d5', '#b08bd8', '#f6c445', '#7fc97f', '#ef7aa1', '#8aa1f2'];

interface Props {
  territorio: Territorio;
  heroe: Heroe;
  etapas: string[];
  estelas: Estela[];
  accesorios: Accesorio[];
  base: string;
  voz: string;
  onEntrar: (indice: number) => void;
}

export function Biblioteca({ territorio, heroe, etapas, estelas, accesorios, base, voz, onEntrar }: Props) {
  const progreso = useProgreso();
  const misiones = territorio.misiones;
  const estado = estados(misiones, progreso, false);
  const siguiente = estado.findIndex((e) => e === 'libre');
  const grupos = porTema(misiones);
  const sala = useRef<HTMLDivElement>(null);
  const { abrir, decirGuia, dialogo, hablando } = useEntrada({ territorio, base, voz, onEntrar });
  const estela = estelas.find((e) => e.id === progreso.estela && progreso.estrellas >= e.estrellas) ?? estelas[0];
  const vestir = useVestidor({ heroe, base, progreso, vestidor: { accesorios, estelas, estela: estela?.id ?? '' }, alTocarCerrada: () => {} });
  const guia = territorio.personajes[territorio.guia];

  // Al volver, el estante del libro que sigue queda a la vista.
  useLayoutEffect(() => {
    const libro = sala.current?.querySelector('.libro--ahora');
    libro?.scrollIntoView({ block: 'center' });
  }, []);

  useEffect(() => {
    if (!Object.keys(progreso.misiones).length) {
      const t = window.setTimeout(() => decirGuia(`¡Hola! Soy ${guia?.nombre}. Esta es mi biblioteca: cada libro es un cuento o un juego. Toca el que brilla.`), 600);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tocar = (i: number) => {
    if (estado[i] === 'dormida') {
      sonar('intenta');
      decirGuia('Este libro todavía duerme. Primero lee el que está antes en el estante.');
      return;
    }
    abrir(i);
  };

  return (
    <div className="biblioteca" ref={sala}>
      <header className="biblioteca__cabeza">
        <img src={base + guia?.imagen} alt="" draggable={false} />
        <div>
          <strong>{territorio.nombre}</strong>
          <span>Periodo 1 · {etapas[0]}</span>
        </div>
      </header>

      <div className="biblioteca__mueble">
        {grupos.map((g, k) => (
          <section key={k} className="estante" aria-label={g.tema === 'repaso' ? 'Repaso' : g.tema}>
            <h2 className="estante__tema">{g.tema === 'repaso' ? 'Repaso' : g.tema}</h2>
            <div className="estante__libros">
              {g.indices.map((i) => {
                const m = misiones[i];
                const cuento = m.plantilla === 'cuento';
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`nodo libro libro--${estado[i]}${cuento ? ' libro--cuento' : ''}${i === siguiente ? ' libro--ahora' : ''}`}
                    style={{ ['--tapa' as string]: TAPAS[k % TAPAS.length] }}
                    onClick={() => tocar(i)}
                    aria-label={m.titulo}
                  >
                    <span className="libro__tapa">
                      <img src={base + m.icono} alt="" draggable={false} />
                    </span>
                    <span className="libro__titulo">{m.titulo}</span>
                    {estado[i] === 'hecha' && <span className="libro__cinta" aria-hidden="true" />}
                    {estado[i] === 'dormida' && <span className="libro__candado" aria-hidden="true">🔒</span>}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="biblioteca__pronto">
        {etapas.slice(1).map((nombre, k) => (
          <div key={nombre} className="estante-cerrado">
            <span aria-hidden="true">🔒</span>
            <strong>Periodo {k + 2}</strong>
            {nombre}
            <small>Pronto</small>
          </div>
        ))}
      </div>

      {!hablando && !vestir.abierto && <div className="utiles">{vestir.boton}</div>}
      {vestir.panel}
      {dialogo}
    </div>
  );
}
