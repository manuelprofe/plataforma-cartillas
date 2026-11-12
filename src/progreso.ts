// Única capa que lee y escribe el progreso del estudiante. Hoy guarda en el
// dispositivo; cuando exista el servidor, solo cambia este archivo.
import { useSyncExternalStore } from 'react';

export interface RegistroMision {
  veces: number;
  mejorErrores: number;
  autoeval?: number;
}

export interface Progreso {
  estrellas: number;
  posicion: number;
  introVista: boolean;
  misiones: Record<string, RegistroMision>;
}

// Criterios de Mission Stars (tabla 7 del trabajo de grado).
export const ESTRELLAS = { completar: 15, mejorar: 15, autoevaluar: 10 } as const;

export interface Premio {
  clave: keyof typeof ESTRELLAS;
  estrellas: number;
}

const CLAVE = 'pc_progreso_v1';
const VACIO: Progreso = { estrellas: 0, posicion: 0, introVista: false, misiones: {} };

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

export function moverA(posicion: number) {
  guardar({ ...estado, posicion });
}

export function marcarIntroVista() {
  guardar({ ...estado, introVista: true });
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
