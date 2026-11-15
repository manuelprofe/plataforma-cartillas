// Botón que solo actúa si se mantiene presionado un rato, mientras se llena una barra.
// Es la puerta del adulto: al niño nunca se le pide, y la instrucción solo la entiende quien lee.
import { useEffect, useRef, useState, type ReactNode } from 'react';

interface Props {
  ms: number;
  className?: string;
  children: ReactNode;
  onListo: () => void;
  /** Lo soltó antes de tiempo (para mostrar la instrucción). */
  onCorto?: () => void;
}

export function BotonSostenido({ ms, className = '', children, onListo, onCorto }: Props) {
  const [activo, setActivo] = useState(false);
  const espera = useRef<number | undefined>(undefined);

  useEffect(() => () => clearTimeout(espera.current), []);

  const empezar = () => {
    if (espera.current !== undefined) return;
    setActivo(true);
    espera.current = window.setTimeout(() => {
      espera.current = undefined;
      setActivo(false);
      onListo();
    }, ms);
  };
  const soltar = () => {
    if (espera.current === undefined) return;
    clearTimeout(espera.current);
    espera.current = undefined;
    setActivo(false);
    onCorto?.();
  };
  const esTecla = (tecla: string) => tecla === 'Enter' || tecla === ' ';

  return (
    <button
      type="button"
      className={`sostenido ${className}`}
      onPointerDown={empezar}
      onPointerUp={soltar}
      onPointerLeave={soltar}
      onPointerCancel={soltar}
      onKeyDown={(e) => esTecla(e.key) && !e.repeat && empezar()}
      onKeyUp={(e) => esTecla(e.key) && soltar()}
      onBlur={soltar}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="sostenido__barra" aria-hidden="true" style={{ transform: `scaleX(${activo ? 1 : 0})`, transitionDuration: `${activo ? ms : 0}ms` }} />
      <span className="sostenido__texto">{children}</span>
    </button>
  );
}
