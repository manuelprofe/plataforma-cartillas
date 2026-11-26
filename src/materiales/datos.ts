// Tipos y carga de los materiales del docente (esqueleto §4). Los materiales son datos del
// paquete de la cartilla (public/cartillas/<id>/materiales/*.json, generados por
// herramientas/materiales_a_json.py desde docs/pedagogia/materiales/*.md). No tocan el
// almacenamiento ni Supabase: solo leen el paquete. Los usan el docente y el telón de proyectar.

import { useSyncExternalStore } from 'react';
import { CARTILLA_PREDETERMINADA, esIdCartilla, rutaCartilla } from '../cartillas';

// ---------------------------------------------------------------- Cartilla que se está viendo

// El docente ve los materiales de una cartilla a la vez: la de su grupo, o la que elija si tiene
// grupos de cartillas distintas. Se recuerda en el aparato para que Proyectar (otra pestaña) abra
// la misma.
const LLAVE_CARTILLA = 'pc_docente_cartilla_v1';
let actual = (() => {
  try {
    const v = localStorage.getItem(LLAVE_CARTILLA);
    return esIdCartilla(v) ? v : CARTILLA_PREDETERMINADA;
  } catch {
    return CARTILLA_PREDETERMINADA;
  }
})();
const oyentes = new Set<() => void>();

export const cartillaMateriales = () => actual;
/** Ruta (con barra final) del paquete de la cartilla que se está viendo. */
export const base = () => rutaCartilla(actual);

export function elegirCartillaMateriales(id: string) {
  if (!esIdCartilla(id) || id === actual) return;
  actual = id;
  try {
    localStorage.setItem(LLAVE_CARTILLA, id);
  } catch {
    // Sin almacenamiento: dura lo que dure la pestaña.
  }
  oyentes.forEach((f) => f());
}

export function useCartillaMateriales(): string {
  return useSyncExternalStore(
    (f) => {
      oyentes.add(f);
      return () => oyentes.delete(f);
    },
    () => actual,
  );
}

export interface Palabra {
  tipo: 'palabra';
  palabra: string;
  es: string;
  suena: string;
  audio: string;
  imagen: string;
  /** Segunda imagen de la lámina: el objeto (colores) o la mano (números). */
  apoyo?: string;
  /** Numeral: la lámina dibuja esa cantidad de estrellas. */
  cantidad?: number;
  alt?: string;
}

/** Una línea de la letra con el segundo en que empieza (canciones/<tema>.letra.json). */
export interface LineaLetra {
  t: number;
  seccion: string;
  texto: string;
}

export interface Enlace {
  id: string;
  texto: string;
}

export interface Opcion {
  palabra: string;
  imagen: string;
  apoyo?: string;
  cantidad?: number;
}

export interface ItemImagen {
  imagen?: string;
  palabra?: string;
  apoyo?: string;
  cantidad?: number;
}

interface Comun {
  /** `docente`: solo en la pantalla y la hoja del docente; nunca se proyecta ni va en la hoja del niño. */
  solo?: 'docente';
}

export type Bloque = Comun &
  (
    | { tipo: 'titulo'; texto: string; nivel?: number }
    | { tipo: 'parrafo'; texto: string }
    | { tipo: 'lista'; items: string[] }
    | { tipo: 'tabla'; columnas: string[]; filas: string[][] }
    | { tipo: 'consigna'; iconos: string[]; texto: string; audio?: string }
    | Palabra
    | { tipo: 'momento'; minutos: number; momento: string; ritmo: string; material: string; observar: string; sinProyector: string; enlaces?: Enlace[]; fase?: Fase }
    | { tipo: 'item-prueba'; numero: number; fila: string; objetivo: string; audio: string; opciones: Opcion[]; respuesta: number }
    | { tipo: 'imagenes'; titulo?: string; columnas: number; items: ItemImagen[]; etiquetas: boolean; recortable?: boolean }
    | { tipo: 'guion'; texto: string }
    | { tipo: 'clave'; texto: string }
    | { tipo: 'casillas'; columnas: string[]; filas: string[] }
    | { tipo: 'nota'; id: string; texto: string; etiqueta: string }
    | { tipo: 'hueco'; titulo: string; trae: string[]; imprime?: boolean }
    | { tipo: 'cancion'; audio: string; ingles: string[]; lineas: LineaLetra[] }
  );

/** Momento de la clase en el formato del planeador. Si el contenido no lo dice, se deduce. */
export type Fase = 'inicio' | 'desarrollo' | 'cierre';

/**
 * Referentes de un planeador (los pone el contenido, con su fuente): área y grado para el
 * encabezado, DBA y estándares (EBC) citados del MEN, y los desempeños de la clase.
 */
export interface Referentes {
  area?: string;
  grado?: string;
  dba?: string[];
  ebc?: string[];
  desempenos?: string[];
  fuente?: string;
}

export interface Impresion {
  nombre: string;
  /** Solo estos tipos de bloque (por omisión, todos). */
  incluye?: string[];
  /** Tipos de bloque (o `docente`, o `objetivo`) que esta hoja no muestra. */
  oculta?: string[];
  copias?: number;
  formato?: 'carta' | 'media-carta';
}

export interface Material {
  id: string;
  tipo: 'guia' | 'planeador' | 'laminas' | 'ficha' | 'decir' | 'prueba' | 'casa' | 'cancion';
  tema: string;
  titulo: string;
  subtitulo: string;
  privacidad: 'publico' | 'con-datos';
  formatos: { proyectar: 'todo' | 'solo-consignas' | 'no'; imprimir: 'carta' | 'media-carta'; copias: number };
  impresiones?: Impresion[];
  editable?: string[];
  avisoColor?: string;
  /** Solo planeadores: lo que va en las filas de referentes del formato. */
  referentes?: Referentes;
  /** Planeación armada por el docente: ya trae su duración; no se reparte ni se elige otra. */
  duracionFija?: boolean;
  bloques: Bloque[];
}

export interface TemaDoc {
  id: string;
  nombre: string;
  titulo: string;
  territorio: string;
  palabras: { en: string; es: string; suena: string; imagen: string; audio: string; grupo: string }[];
  juegos: string[];
  materiales: Material[];
}

export interface TipoCatalogo {
  nombre: string;
  trae: string[];
  paraQue: string;
}

export interface EntradaTema {
  id: string;
  nombre: string;
  titulo: string;
  territorio: string;
  estado: 'listo' | 'pendiente';
  archivo?: string;
  palabras?: number;
  juegos?: string[];
  /** `archivo`: el material vive en su propio archivo (las canciones, también las de un tema pendiente). */
  materiales: { id: string; tipo: string; titulo: string; subtitulo: string; estado: 'listo'; proyectar: string; archivo?: string }[];
}

export interface Indice {
  cartilla: string;
  /** Imagen del guía que acompaña al proyectar (ruta dentro de la cartilla). */
  guia?: string;
  tipos: Record<string, TipoCatalogo>;
  temas: EntradaTema[];
}

/** Lo que cada tema trae, en orden fijo (catálogo §3.2). `tipo` apunta a `Indice.tipos`. */
export const RANURAS = [
  { ranura: 'guia', aqui: 'la guía del tema', tipo: 'guia', nombre: 'Guía del tema' },
  { ranura: 'planeador-1', aqui: 'el planeador de la clase 1', tipo: 'planeador', nombre: 'Planeador de la clase 1' },
  { ranura: 'planeador-2', aqui: 'el planeador de la clase 2', tipo: 'planeador', nombre: 'Planeador de la clase 2' },
  { ranura: 'laminas', aqui: 'las láminas', tipo: 'laminas', nombre: 'Láminas' },
  { ranura: 'cancion', aqui: 'la canción del tema', tipo: 'cancion', nombre: 'Canción del tema' },
  { ranura: 'ficha-1', aqui: 'la ficha de trabajo 1', tipo: 'fichas', nombre: 'Ficha de trabajo 1' },
  { ranura: 'ficha-2', aqui: 'la ficha de trabajo 2', tipo: 'fichas', nombre: 'Ficha de trabajo 2' },
  { ranura: 'decir', aqui: 'la actividad de decir en parejas', tipo: 'decir', nombre: 'Decir en parejas' },
  { ranura: 'prueba', aqui: 'la prueba del tema', tipo: 'prueba', nombre: 'Prueba del tema' },
  { ranura: 'caritas', aqui: 'la hoja de caritas', tipo: 'caritas', nombre: 'Hoja de caritas' },
  { ranura: 'casa', aqui: 'la nota para la casa', tipo: 'casa', nombre: 'Nota para la casa' },
] as const;

// Las cachés van por cartilla: cambiar de cartilla no mezcla temas.
const cacheTemas = new Map<string, Promise<TemaDoc>>();
const cacheIndice = new Map<string, Promise<Indice>>();

async function pedir<T>(ruta: string): Promise<T> {
  const r = await fetch(base() + ruta);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()) as T;
}

export function cargarIndice(): Promise<Indice> {
  const clave = actual;
  let p = cacheIndice.get(clave);
  if (!p) {
    p = pedir<Indice>('materiales/indice.json').catch((e) => {
      cacheIndice.delete(clave);
      throw e;
    });
    cacheIndice.set(clave, p);
  }
  return p;
}

export function cargarTema(entrada: EntradaTema): Promise<TemaDoc> {
  if (!entrada.archivo) return Promise.reject(new Error('Tema sin materiales'));
  const clave = `${actual}/${entrada.id}`;
  let p = cacheTemas.get(clave);
  if (!p) {
    p = pedir<TemaDoc>(entrada.archivo).catch((e) => {
      cacheTemas.delete(clave);
      throw e;
    });
    cacheTemas.set(clave, p);
  }
  return p;
}

/** Un material por su identificador (`escuela-ficha-1`) o, si no existe, la ranura que aún no tiene contenido. */
export async function cargarMaterial(temaId: string, materialId: string) {
  const indice = await cargarIndice();
  const entrada = indice.temas.find((t) => t.id === temaId);
  if (!entrada) return { indice, entrada: undefined, tema: undefined, material: undefined, ranura: undefined };
  const tema = entrada.estado === 'listo' ? await cargarTema(entrada) : undefined;
  const propio = entrada.materiales.find((m) => m.id === materialId)?.archivo;
  const material = propio ? await pedir<Material>(propio) : tema?.materiales.find((m) => m.id === materialId);
  const ranura = RANURAS.find((r) => `${temaId}-${r.ranura}` === materialId);
  return { indice, entrada, tema, material, ranura };
}

export const TIPO_NOMBRE: Record<Material['tipo'], string> = {
  guia: 'Guía del tema',
  planeador: 'Planeador de clase',
  laminas: 'Láminas',
  ficha: 'Ficha de trabajo',
  decir: 'Decir en parejas',
  prueba: 'Prueba del tema',
  casa: 'Nota para la casa',
  cancion: 'Canción',
};
