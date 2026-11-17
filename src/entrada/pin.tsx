// Las 10 imágenes del PIN (esqueleto.md §6.3): planas, distintas en forma y color, ninguna es
// palabra de la cartilla. La posición en la lista es la cifra que guarda la base ("0" a "9"):
// el docente las imprime en la tarjeta en este mismo orden. Son de la plataforma, no de una
// cartilla, y van en el código para que el PIN funcione sin red desde la primera pantalla.
import type { ReactNode } from 'react';

export const IMAGENES_PIN: { nombre: string; dibujo: ReactNode }[] = [
  {
    nombre: 'sol',
    dibujo: (
      <>
        <circle cx="32" cy="32" r="13" fill="#ffc21a" />
        <path d="M32 6v7M32 51v7M6 32h7M51 32h7M13.6 13.6l5 5M45.4 45.4l5 5M13.6 50.4l5-5M45.4 18.6l5-5" stroke="#f29a00" strokeWidth="5" strokeLinecap="round" />
      </>
    ),
  },
  { nombre: 'luna', dibujo: <path d="M40 8a24 24 0 1 0 16 38A20 20 0 0 1 40 8z" fill="#5b6cff" /> },
  {
    nombre: 'pez',
    dibujo: (
      <>
        <path d="M8 32c10-14 30-14 40 0-10 14-30 14-40 0z" fill="#ff7a2f" />
        <path d="M46 32l12-10v20z" fill="#ff7a2f" />
        <circle cx="20" cy="29" r="3" fill="#24123f" />
      </>
    ),
  },
  {
    nombre: 'hoja',
    dibujo: (
      <>
        <path d="M12 52C10 26 26 10 54 10c0 28-16 44-42 42z" fill="#2fb350" />
        <path d="M14 50L44 20" stroke="#1d7a35" strokeWidth="3" />
      </>
    ),
  },
  { nombre: 'corazón', dibujo: <path d="M32 54S8 40 8 23a12 12 0 0 1 24-3 12 12 0 0 1 24 3c0 17-24 31-24 31z" fill="#ef3d5a" /> },
  {
    nombre: 'casa',
    dibujo: (
      <>
        <path d="M8 30L32 10l24 20z" fill="#b5462a" />
        <rect x="14" y="30" width="36" height="24" fill="#f2c48d" />
        <rect x="27" y="38" width="10" height="16" fill="#7a3b1f" />
      </>
    ),
  },
  { nombre: 'gota', dibujo: <path d="M32 6c10 16 18 26 18 34a18 18 0 0 1-36 0c0-8 8-18 18-34z" fill="#1aa3e8" /> },
  { nombre: 'estrella', dibujo: <path d="M32 6l7.6 16.4L58 24.6 44.6 37.2 48 56 32 46.8 16 56l3.4-18.8L6 24.6l18.4-2.2z" fill="#a855f7" /> },
  { nombre: 'nube', dibujo: <path d="M18 48a12 12 0 0 1-1-24 16 16 0 0 1 30-2 11 11 0 0 1 1 26z" fill="#9fd3f2" stroke="#4a9fd0" strokeWidth="2" /> },
  {
    nombre: 'flor',
    dibujo: (
      <>
        <g fill="#ff5fa2">
          <circle cx="32" cy="16" r="9" />
          <circle cx="48" cy="28" r="9" />
          <circle cx="42" cy="46" r="9" />
          <circle cx="22" cy="46" r="9" />
          <circle cx="16" cy="28" r="9" />
        </g>
        <circle cx="32" cy="32" r="8" fill="#ffc21a" />
      </>
    ),
  },
];

export function DibujoPin({ cifra, tam = 48 }: { cifra: number; tam?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={tam} height={tam} aria-hidden="true">
      {IMAGENES_PIN[cifra].dibujo}
    </svg>
  );
}
