// Mundo de matemáticas: el camino de Cuadrito, visto de lado como el juego de plataformas. Cada
// parada es una misión y se abre al terminar la anterior; cada periodo es una etapa del camino
// (las que aún no tienen misiones se ven cerradas al final). El héroe del niño espera en la
// parada que sigue y camina hasta la que se toque.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Accesorio, Estela, Heroe, Territorio } from '../tipos';
import { useProgreso } from '../progreso';
import { estados, porTema, useEntrada, useVestidor } from './comun';
import { sonar } from '../audio';
import './camino.css';

const PASO = 150;
const INICIO = 130;
/** Alto de cada parada sobre el suelo, en escalones: el camino sube y baja como una colina. */
const ALTURAS = [0, 1, 2, 1, 0, 1, 2, 2, 1, 0];
const ESCALON = 34;

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

export function Camino({ territorio, heroe, etapas, estelas, accesorios, base, voz, onEntrar }: Props) {
  const progreso = useProgreso();
  const misiones = territorio.misiones;
  const estado = estados(misiones, progreso, true);
  const siguiente = Math.max(0, estado.findIndex((e) => e === 'libre'));
  const [donde, setDonde] = useState(siguiente);
  const [caminando, setCaminando] = useState(false);
  const lienzo = useRef<HTMLDivElement>(null);
  const { abrir, decirGuia, dialogo, hablando } = useEntrada({ territorio, base, voz, onEntrar });
  const estela = estelas.find((e) => e.id === progreso.estela && progreso.estrellas >= e.estrellas) ?? estelas[0];
  const vestir = useVestidor({ heroe, base, progreso, vestidor: { accesorios, estelas, estela: estela?.id ?? '' }, alTocarCerrada: () => {} });

  const x = (i: number) => INICIO + i * PASO;
  const alto = (i: number) => ALTURAS[i % ALTURAS.length] * ESCALON;
  const fin = x(misiones.length - 1) + PASO;
  const ancho = fin + (etapas.length - 1) * 170 + 120;
  const grupos = porTema(misiones);

  // Al llegar, la cámara deja ver al héroe en su parada.
  useLayoutEffect(() => {
    const el = lienzo.current;
    if (el) el.scrollLeft = Math.max(0, x(siguiente) - el.clientWidth * 0.4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // La primera vez, el guía cuenta de qué se trata.
  useEffect(() => {
    if (!Object.keys(progreso.misiones).length) {
      const t = window.setTimeout(() => decirGuia(`¡Hola! Soy ${territorio.personajes[territorio.guia]?.nombre}. Este es mi camino: en cada parada hay un juego. Toca la que brilla.`), 600);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tocar = (i: number) => {
    if (caminando || hablando) return;
    if (estado[i] === 'dormida') {
      sonar('intenta');
      decirGuia('Esta parada todavía duerme. Primero juega la que brilla.');
      return;
    }
    if (i === donde) {
      abrir(i);
      return;
    }
    sonar('salto');
    setCaminando(true);
    setDonde(i);
    const ms = Math.min(1400, 260 + Math.abs(i - donde) * 260);
    window.setTimeout(() => {
      setCaminando(false);
      abrir(i);
    }, ms);
  };

  const puntos = misiones.map((_, i) => `${x(i)},${-alto(i)}`).join(' ');

  return (
    <div className="camino">
      <div className="camino__lienzo" ref={lienzo}>
        <div className="camino__mundo" style={{ width: ancho }}>
          <div className="camino__suelo" />
          <svg className="camino__sendero" width={ancho} height="200" viewBox={`0 -170 ${ancho} 200`} aria-hidden="true">
            <polyline points={`40,0 ${puntos} ${fin},0`} />
          </svg>

          {grupos.map((g, k) => (
            <div key={k} className="camino__letrero" style={{ left: x(g.indices[0]) - 58, bottom: `calc(var(--suelo) + ${alto(g.indices[0]) + 176}px)` }}>
              {g.tema === 'repaso' ? 'Repaso' : g.tema}
            </div>
          ))}

          <div className="camino__etapa" style={{ left: 18 }}>
            <strong>Periodo 1</strong>
            {etapas[0]}
          </div>

          {misiones.map((m, i) => (
            <div key={m.id} className="camino__parada" style={{ left: x(i), bottom: `var(--suelo)` }}>
              <div className="camino__pilar" style={{ height: alto(i) }} />
              <button
                type="button"
                className={`nodo camino__nodo camino__nodo--${estado[i]}${i === siguiente && estado[i] === 'libre' ? ' camino__nodo--ahora' : ''}`}
                style={{ bottom: alto(i) }}
                onClick={() => tocar(i)}
                aria-label={m.titulo}
              >
                <img src={base + m.icono} alt="" draggable={false} />
                {estado[i] === 'hecha' && <span className="camino__hecha" aria-hidden="true">✓</span>}
                {estado[i] === 'dormida' && <span className="camino__candado" aria-hidden="true">🔒</span>}
              </button>
              <span className="camino__titulo" style={{ bottom: alto(i) - 30 }}>
                {m.titulo}
              </span>
            </div>
          ))}

          {etapas.slice(1).map((nombre, k) => (
            <div key={nombre} className="camino__cerrada" style={{ left: fin + k * 170 }}>
              <span aria-hidden="true">🔒</span>
              <strong>Periodo {k + 2}</strong>
              {nombre}
              <small>Pronto</small>
            </div>
          ))}

          <div className={`camino__heroe${caminando ? ' camino__heroe--anda' : ''}`} style={{ left: x(donde), bottom: `calc(var(--suelo) + ${alto(donde) + 86}px)` }}>
            <img src={base + heroe.imagen} alt="" draggable={false} />
          </div>
        </div>
      </div>

      <div className="camino__cabeza">
        <img src={base + territorio.personajes[territorio.guia]?.imagen} alt="" draggable={false} />
        <span>{territorio.nombre}</span>
      </div>

      {!hablando && !vestir.abierto && <div className="utiles">{vestir.boton}</div>}
      {vestir.panel}
      {dialogo}
    </div>
  );
}
