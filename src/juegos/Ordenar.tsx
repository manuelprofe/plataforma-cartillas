// Plantilla de juego "ordenar". No contiene números ni cuentos: cada ronda llega del contenido
// (mision.ordenar) con sus tarjetas en el orden correcto, y aquí se revuelven. Sirve para
// ordenar números, secuencias o los sucesos de un relato.
// El niño toca una tarjeta (o la arrastra hasta la fila de arriba): la voz la dice y, si es la
// que sigue, se queda en su puesto. Si no, vuelve a la mesa sin perder nada y el guía anima; al
// segundo intento, la que sigue brilla. Las tarjetas ya puestas se pueden tocar para oírlas.
import { useEffect, useRef, useState, type PointerEvent as EventoPuntero } from 'react';
import type { PropsJuego, TarjetaOrdenar } from '../tipos';
import { CierreMision } from './CierreMision';
import { decirAyuda } from './ayuda';
import { mezclar } from './mezclar';
import { callar, decir, sonar } from '../audio';
import './ordenar.css';

/** Movimiento (px) desde el que un toque se vuelve arrastre. */
const UMBRAL_ARRASTRE = 10;

export function Ordenar(props: PropsJuego) {
  const { mision, base, idiomaVoz, imagenGuia, imagenFiesta, onTerminar, onSalir } = props;
  const rondas = mision.ordenar ?? [];
  const [indice, setIndice] = useState(0);
  const ronda = rondas[indice];
  // Posiciones (en el orden correcto) en el orden en que aparecen en la mesa.
  const [mesa, setMesa] = useState<number[]>([]);
  const [puestas, setPuestas] = useState(0);
  const [fallos, setFallos] = useState(0);
  const [errores, setErrores] = useState(0);
  const [temblando, setTemblando] = useState<number | null>(null);
  const [cierre, setCierre] = useState(false);
  const esperas = useRef<number[]>([]);
  const fila = useRef<HTMLOListElement>(null);
  const arrastre = useRef<{ i: number; x: number; y: number; moviendo: boolean; el: HTMLElement } | null>(null);

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

  // Cada ronda: tarjetas revueltas (nunca ya en orden) y la voz dice qué hacer.
  useEffect(() => {
    if (cierre || !ronda) return;
    const n = ronda.tarjetas.length;
    const enOrden = Array.from({ length: n }, (_, i) => i);
    let revuelta = mezclar(enOrden);
    for (let k = 0; k < 5 && n > 1 && revuelta.every((v, i) => v === i); k++) revuelta = mezclar(enOrden);
    setMesa(revuelta);
    setPuestas(0);
    setFallos(0);
    const t = window.setTimeout(() => decir(ronda.pide, idiomaVoz), 400);
    return () => clearTimeout(t);
  }, [indice, cierre, ronda, idiomaVoz]);

  if (!ronda) return null;
  const n = ronda.tarjetas.length;
  const completa = puestas === n;

  const repetir = () => {
    sonar('toque');
    decir(ronda.pide, idiomaVoz);
  };

  const oir = (t: TarjetaOrdenar) => {
    sonar('toque');
    decir(t.dice, idiomaVoz);
  };

  const elegir = (i: number) => {
    if (completa) return;
    const t = ronda.tarjetas[i];
    if (i === puestas) {
      sonar('acierto');
      const ahora = puestas + 1;
      setPuestas(ahora);
      setFallos(0);
      if (ahora < n) {
        decir(t.dice, idiomaVoz);
        return;
      }
      // Ronda completa: la voz repite todo en orden y sigue la próxima.
      decir(ronda.tarjetas.map((x) => x.dice).join('. '), idiomaVoz);
      luego(() => {
        if (indice + 1 < rondas.length) setIndice(indice + 1);
        else {
          sonar('fiesta');
          setCierre(true);
        }
      }, 1800);
      return;
    }
    sonar('intenta');
    setErrores(errores + 1);
    setFallos(fallos + 1);
    setTemblando(i);
    luego(() => setTemblando(null), 450);
    decir(t.dice, idiomaVoz, () => decirAyuda(props, 'ordenar-otra-vez'));
  };

  // Tocar o arrastrar: si la tarjeta se movió, solo cuenta si se suelta sobre la fila.
  const bajar = (i: number) => (e: EventoPuntero<HTMLButtonElement>) => {
    if (completa) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    arrastre.current = { i, x: e.clientX, y: e.clientY, moviendo: false, el: e.currentTarget };
  };
  const mover = (e: EventoPuntero<HTMLButtonElement>) => {
    const a = arrastre.current;
    if (!a) return;
    const dx = e.clientX - a.x;
    const dy = e.clientY - a.y;
    if (!a.moviendo && Math.hypot(dx, dy) < UMBRAL_ARRASTRE) return;
    a.moviendo = true;
    a.el.classList.add('ordenar__tarjeta--arrastrando');
    a.el.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`;
  };
  const soltar = (e: EventoPuntero<HTMLButtonElement>) => {
    const a = arrastre.current;
    arrastre.current = null;
    if (!a) return;
    a.el.classList.remove('ordenar__tarjeta--arrastrando');
    a.el.style.transform = '';
    if (!a.moviendo) return elegir(a.i);
    const r = fila.current?.getBoundingClientRect();
    if (r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top - 24 && e.clientY <= r.bottom + 24) elegir(a.i);
  };
  const cancelar = () => {
    const a = arrastre.current;
    arrastre.current = null;
    if (!a) return;
    a.el.classList.remove('ordenar__tarjeta--arrastrando');
    a.el.style.transform = '';
  };

  const cara = (t: TarjetaOrdenar) => (
    <>
      {t.icono && <img src={base + t.icono} alt="" draggable={false} />}
      {t.texto && <strong>{t.texto}</strong>}
    </>
  );

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
        <main className="ordenar" key={indice} style={{ ['--n' as string]: n }}>
          <button type="button" className="oir ordenar__oir" onClick={repetir} aria-label="Escuchar otra vez">
            <img src={base + imagenGuia} alt="" width="96" height="76" draggable={false} />
            <span className="oir__onda" aria-hidden="true">🔊</span>
          </button>
          <ol className={`ordenar__fila${completa ? ' ordenar__fila--completa' : ''}`} ref={fila}>
            {ronda.tarjetas.map((t, i) => (
              <li key={i} className="ordenar__puesto">
                {i < puestas ? (
                  <button type="button" className={`ordenar__tarjeta ordenar__tarjeta--puesta${t.texto && !t.icono ? ' ordenar__tarjeta--cifra' : ''}`} onClick={() => oir(t)} aria-label={t.dice}>
                    {cara(t)}
                  </button>
                ) : (
                  <span className="ordenar__hueco" aria-hidden="true">
                    {i + 1}
                  </span>
                )}
              </li>
            ))}
          </ol>
          <div className="ordenar__mesa">
            {mesa
              .filter((i) => i >= puestas)
              .map((i) => {
                const t = ronda.tarjetas[i];
                const pista = fallos >= 2 && i === puestas;
                return (
                  <button
                    key={i}
                    type="button"
                    className={`ordenar__tarjeta${t.texto && !t.icono ? ' ordenar__tarjeta--cifra' : ''}${temblando === i ? ' ordenar__tarjeta--no' : ''}${pista ? ' ordenar__tarjeta--pista' : ''}`}
                    onPointerDown={bajar(i)}
                    onPointerMove={mover}
                    onPointerUp={soltar}
                    onPointerCancel={cancelar}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), elegir(i))}
                    aria-label={t.dice}
                  >
                    {cara(t)}
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
