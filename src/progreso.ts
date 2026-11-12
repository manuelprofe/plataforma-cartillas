// Única capa que lee y escribe el progreso del estudiante. Hoy guarda en el
// dispositivo; cuando exista el servidor, solo cambia este archivo.
import { useSyncExternalStore } from 'react';
import type { Palabra } from './tipos';

export interface RegistroMision {
  veces: number;
  mejorErrores: number;
  autoeval?: number;
}

export interface Progreso {
  estrellas: number;
  /** Escenas de la historia que el niño ya vio. */
  vistas: string[];
  /** Misión que eligió visitar. */
  destino?: string;
  misiones: Record<string, RegistroMision>;
  /** Personaje elegido para recorrer el mundo. */
  heroe?: string;
  /** Estela elegida. */
  estela?: string;
  /** Palabras encontradas en el mundo. */
  album: Palabra[];
  /** Habitantes que ya recuperaron su palabra. */
  ayudados: string[];
  /** Habitante al que se le está buscando su palabra. */
  encargo?: string;
}

// Criterios de Mission Stars (tabla 7 del trabajo de grado).
export const ESTRELLAS = { completar: 15, mejorar: 15, autoevaluar: 10 } as const;

export interface Premio {
  clave: keyof typeof ESTRELLAS;
  estrellas: number;
}

const CLAVE = 'pc_progreso_v2';
const VACIO: Progreso = { estrellas: 0, vistas: [], misiones: {}, album: [], ayudados: [] };

function leer(): Progreso {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (crudo) return { ...VACIO, ...JSON.parse(crudo) };
  } catch {
    // Almacenamiento bloqueado o dañado: se empieza de cero sin romper la app.
  }
  return VACIO;
}

let estado = leer();
const oyentes = new Set<() => void>();

function guardar(nuevo: Progreso) {
  estado = nuevo;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(nuevo));
  } catch {
    // Sin almacenamiento el progreso vive solo en memoria durante la sesión.
  }
  oyentes.forEach((f) => f());
}

export function useProgreso(): Progreso {
  return useSyncExternalStore(
    (f) => {
      oyentes.add(f);
      return () => oyentes.delete(f);
    },
    () => estado,
  );
}

export function marcarVista(escena: string) {
  if (!estado.vistas.includes(escena)) guardar({ ...estado, vistas: [...estado.vistas, escena] });
}

export function fijarDestino(mision: string | undefined) {
  guardar({ ...estado, destino: mision });
}

export function elegirHeroe(id: string) {
  guardar({ ...estado, heroe: id });
}

export function elegirEstela(id: string) {
  guardar({ ...estado, estela: id });
}

/** Guarda una palabra en el álbum. Devuelve si era nueva. */
export function agregarAlAlbum(palabra: Palabra): boolean {
  if (estado.album.some((p) => p.en === palabra.en)) return false;
  guardar({ ...estado, album: [...estado.album, palabra] });
  return true;
}

export function fijarEncargo(habitante: string | undefined) {
  if (estado.encargo !== habitante) guardar({ ...estado, encargo: habitante });
}

export function marcarAyudado(habitante: string) {
  if (!estado.ayudados.includes(habitante)) guardar({ ...estado, ayudados: [...estado.ayudados, habitante], encargo: undefined });
}

/** Premios por terminar una misión. Las estrellas nunca se quitan. */
export function premiosDeMision(id: string, errores: number): Premio[] {
  const previo = estado.misiones[id];
  if (!previo) return [{ clave: 'completar', estrellas: ESTRELLAS.completar }];
  if (errores < previo.mejorErrores) return [{ clave: 'mejorar', estrellas: ESTRELLAS.mejorar }];
  return [];
}

export function registrarMision(id: string, errores: number, autoeval: number | undefined): Premio[] {
  const previo = estado.misiones[id];
  const premios = premiosDeMision(id, errores);
  if (autoeval !== undefined && previo?.autoeval === undefined) {
    premios.push({ clave: 'autoevaluar', estrellas: ESTRELLAS.autoevaluar });
  }
  const suma = premios.reduce((a, p) => a + p.estrellas, 0);
  guardar({
    ...estado,
    estrellas: estado.estrellas + suma,
    misiones: {
      ...estado.misiones,
      [id]: {
        veces: (previo?.veces ?? 0) + 1,
        mejorErrores: Math.min(errores, previo?.mejorErrores ?? Infinity),
        autoeval: previo?.autoeval ?? autoeval,
      },
    },
  });
  return premios;
}

export function reiniciarProgreso() {
  guardar(VACIO);
}
