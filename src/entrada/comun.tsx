// Piezas de las pantallas de entrada del niño: Lumi con su globo (tocarlo repite la frase),
// la cara de un niño y los íconos. Todo lo que dice Lumi sale del paquete (`ayudas`).
import type { ReactNode } from 'react';
import type { Heroe } from '../tipos';
import { activarAudio } from '../audio';

/** Lo que las pantallas de entrada necesitan del paquete de la cartilla. */
export interface Paquete {
  base: string;
  titulo: string;
  heroes: Heroe[];
  /** Lumi saludando y celebrando. */
  lumi: string;
  lumiFiesta: string;
  /** Texto de una frase de Lumi del paquete. */
  frase: (clave: string) => string;
  /** Dice en voz alta una frase de Lumi del paquete. */
  hablar: (clave: string) => void;
}

const TRAZOS: Record<string, ReactNode> = {
  jugar: <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />,
  tarjeta: (
    <>
      <path d="M13 19a4 4 0 00-8 0" />
      <path d="M16 10h2" />
      <path d="M16 14h2" />
      <circle cx="9" cy="12" r="3" />
      <rect x="2" y="5" width="20" height="14" rx="2" />
    </>
  ),
  mas: <path d="M5 12h14M12 5v14" />,
  atras: <path d="m15 18-6-6 6-6" />,
  borrar: (
    <>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </>
  ),
  voz: (
    <>
      <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
      <path d="M16 9a5 5 0 0 1 0 6" />
      <path d="M19.364 18.364a9 9 0 0 0 0-12.728" />
    </>
  ),
  si: <path d="M20 6 9 17l-5-5" />,
  no: <path d="M18 6 6 18M6 6l12 12" />,
};

export function Icono({ nombre, tam = 28 }: { nombre: keyof typeof TRAZOS; tam?: number }) {
  return (
    <svg className="icono" viewBox="0 0 24 24" width={tam} height={tam} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {TRAZOS[nombre]}
    </svg>
  );
}

/** Lumi y su globo. Tocar el globo repite la frase en voz alta. */
export function Globo({ paquete, clave, texto, imagen, grande = false }: { paquete: Paquete; clave?: string; texto?: string; imagen?: string; grande?: boolean }) {
  const dice = texto ?? (clave ? paquete.frase(clave) : '');
  return (
    <div className={`lumi-dice${grande ? ' lumi-dice--grande' : ''}`}>
      <img src={paquete.base + (imagen ?? paquete.lumi)} alt="" width="280" height="263" draggable={false} />
      <button
        type="button"
        className="globo"
        aria-live="polite"
        onClick={() => {
          activarAudio();
          if (clave) paquete.hablar(clave);
        }}
      >
        <Icono nombre="voz" tam={24} />
        <span>{dice}</span>
      </button>
    </div>
  );
}

/** La cara de un niño: su personaje en un círculo. Sin personaje conocido, Lumi. */
export function Disco({ paquete, avatar, className = '' }: { paquete: Paquete; avatar?: string; className?: string }) {
  const heroe = paquete.heroes.find((h) => h.id === avatar);
  // Se encuadra la cara con el ancla que el paquete ya trae para los accesorios.
  const y = heroe?.anclas?.cara ? Math.max(0, heroe.anclas.cara.y * 100 - 18) : 20;
  return (
    <span className={`disco ${className}`}>
      <img src={paquete.base + (heroe?.imagen ?? paquete.lumi)} alt="" width="170" height="280" draggable={false} style={{ objectPosition: `50% ${y}%` }} />
    </span>
  );
}

/** Botón grande de acción del niño (88 px el principal, 72 px el secundario). */
export function Accion({ icono, tipo, children, onClick, className = '' }: { icono: keyof typeof TRAZOS; tipo: 'jugar' | 'tarjeta' | 'si'; children: ReactNode; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      className={`accion accion--${tipo} ${className}`}
      onClick={() => {
        activarAudio();
        onClick();
      }}
    >
      <span className="accion__ico">
        <Icono nombre={icono} tam={30} />
      </span>
      <span>{children}</span>
    </button>
  );
}
