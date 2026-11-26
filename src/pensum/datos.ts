// Pensum de cada cartilla (public/cartillas/<id>/pensum.json) y el catálogo de todas
// (public/cartillas/catalogo.json). Los genera herramientas/pensum_a_json.py desde las mallas de
// docs/pedagogia/pensum/*.md; aquí solo se leen. Los usan el armador y la Biblioteca del docente.
import { useSyncExternalStore } from 'react';
import { esIdCartilla, rutaCartilla } from '../cartillas';
import type { Referentes } from '../materiales/datos';

export interface EntradaCatalogo {
  id: string;
  materia: string;
  grado: number;
  gradoNombre: string;
  guia: string;
  titulo: string;
  unidades: number;
}

export interface Unidad {
  id: string;
  numero: number;
  titulo: string;
  /** Periodo de la unidad con 4 y con 3 periodos. */
  periodo: { '4': number; '3': number };
  temas: string[];
  dba: string[];
  desempenos: string[];
  juegos: string;
  analogo?: string;
  nota?: string;
  /** Matemáticas: pensamientos de los Estándares. */
  pensamientos?: string[];
  /** Español: factores de los Estándares, con su enunciado. */
  factores?: { id: string; nombre: string; texto: string }[];
  /** Inglés: el periodo es un módulo del MEN. */
  eje?: string;
  meta?: string;
  funciones?: string[];
  gramatica?: string;
  fuente?: string;
}

export interface Pensum {
  cartilla: string;
  materia: string;
  grado: number;
  gradoNombre: string;
  guia: string;
  titulo: string;
  fuente: string;
  proposito: string;
  dba: { id: string; texto: string }[];
  ebc: string;
  /** Español: nombre de cada periodo. */
  periodos?: Record<string, string>;
  unidades: Unidad[];
}

const cache = new Map<string, Promise<unknown>>();
function pedir<T>(url: string): Promise<T> {
  let p = cache.get(url);
  if (!p) {
    p = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    });
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return p as Promise<T>;
}

export const cargarCatalogo = () =>
  pedir<{ cartillas: EntradaCatalogo[] }>(`${import.meta.env.BASE_URL}cartillas/catalogo.json`).then((c) => c.cartillas);

export const cargarPensum = (id: string) => pedir<Pensum>(`${rutaCartilla(id)}pensum.json`);

export const MATERIAS = ['Matemáticas', 'Español', 'Inglés'] as const;

/** "Matemáticas · Transición", "Español · 3.°". */
export const nombreCartilla = (p: Pick<Pensum, 'materia' | 'gradoNombre'>) => `${p.materia} · ${p.gradoNombre}`;

/** "U3 · Los números del 1 al 10"; en inglés, "Periodo 1 · Cuido mi cuerpo". */
export const nombreUnidad = (u: Unidad) => (u.eje ? `Periodo ${u.numero} · ${u.titulo}` : `U${u.numero} · ${u.titulo}`);

/** Las unidades agrupadas por periodo (con 4 periodos). */
export function porPeriodo(p: Pensum): { numero: number; titulo?: string; unidades: Unidad[] }[] {
  const grupos = new Map<number, Unidad[]>();
  for (const u of p.unidades) grupos.set(u.periodo['4'], [...(grupos.get(u.periodo['4']) ?? []), u]);
  return [...grupos.entries()].sort(([a], [b]) => a - b).map(([numero, unidades]) => ({ numero, titulo: p.periodos?.[numero] ?? unidades[0]?.eje, unidades }));
}

/** Las filas de referentes del planeador para una unidad: DBA con su texto, estándares y desempeños. */
export function referentesDe(p: Pensum, u: Unidad): Referentes {
  const dba = u.dba.map((id) => {
    const d = p.dba.find((x) => x.id === id);
    return d ? `DBA ${d.id}. ${d.texto}` : `DBA ${id}`;
  });
  const ebc = u.factores?.length
    ? u.factores.map((f) => `${f.nombre}: ${f.texto}`)
    : u.pensamientos?.length
      ? [`Pensamiento ${u.pensamientos.map((x) => x.toLowerCase()).join(', ')}. ${p.ebc}`]
      : p.ebc
        ? [p.ebc]
        : undefined;
  return {
    area: p.materia,
    grado: p.gradoNombre,
    dba,
    ebc,
    desempenos: u.desempenos,
    fuente: `${p.fuente}. DBA del MEN (2016).`,
  };
}

// ---------------------------------------------------------------- Materia y grado elegidos

// El docente puede consultar y planear cualquier materia y grado, no solo la de sus grupos. Se
// recuerda en el aparato para que el armador y la Biblioteca abran en la misma.
const LLAVE = 'pc_docente_pensum_v1';
let elegida: string | null = (() => {
  try {
    const v = localStorage.getItem(LLAVE);
    return esIdCartilla(v) ? v : null;
  } catch {
    return null;
  }
})();
const oyentes = new Set<() => void>();

export function elegirPensum(id: string) {
  if (!esIdCartilla(id) || id === elegida) return;
  elegida = id;
  try {
    localStorage.setItem(LLAVE, id);
  } catch {
    // Sin almacenamiento: dura lo que dure la pestaña.
  }
  oyentes.forEach((f) => f());
}

/** La cartilla elegida para el pensum; si nunca eligió, la que trae (la de sus grupos). */
export function usePensumElegido(porDefecto: string): string {
  const v = useSyncExternalStore(
    (f) => {
      oyentes.add(f);
      return () => oyentes.delete(f);
    },
    () => elegida,
  );
  return v ?? porDefecto;
}
