// Tipos y carga de los materiales del docente (esqueleto §4). Los materiales son datos del
// paquete de la cartilla (public/cartillas/ingles-3/materiales/*.json, generados por
// herramientas/materiales_a_json.py desde docs/pedagogia/materiales/*.md). No tocan el
// almacenamiento ni Supabase: solo leen el paquete. Los usan el docente y el telón de proyectar.

export const BASE = `${import.meta.env.BASE_URL}cartillas/ingles-3/`;

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
    | { tipo: 'momento'; minutos: number; momento: string; ritmo: string; material: string; observar: string; sinProyector: string; enlaces?: Enlace[] }
    | { tipo: 'item-prueba'; numero: number; fila: string; objetivo: string; audio: string; opciones: Opcion[]; respuesta: number }
    | { tipo: 'imagenes'; titulo?: string; columnas: number; items: ItemImagen[]; etiquetas: boolean; recortable?: boolean }
    | { tipo: 'guion'; texto: string }
    | { tipo: 'clave'; texto: string }
    | { tipo: 'casillas'; columnas: string[]; filas: string[] }
    | { tipo: 'nota'; id: string; texto: string; etiqueta: string }
    | { tipo: 'hueco'; titulo: string; trae: string[]; imprime?: boolean }
  );

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
  tipo: 'guia' | 'planeador' | 'laminas' | 'ficha' | 'decir' | 'prueba' | 'casa';
  tema: string;
  titulo: string;
  subtitulo: string;
  privacidad: 'publico' | 'con-datos';
  formatos: { proyectar: 'todo' | 'solo-consignas' | 'no'; imprimir: 'carta' | 'media-carta'; copias: number };
  impresiones?: Impresion[];
  editable?: string[];
  avisoColor?: string;
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
  materiales: { id: string; tipo: string; titulo: string; subtitulo: string; estado: 'listo'; proyectar: string }[];
}

export interface Indice {
  cartilla: string;
  tipos: Record<string, TipoCatalogo>;
  temas: EntradaTema[];
}

/** Lo que cada tema trae, en orden fijo (catálogo §3.2). `tipo` apunta a `Indice.tipos`. */
export const RANURAS = [
  { ranura: 'guia', tipo: 'guia', nombre: 'Guía del tema' },
  { ranura: 'planeador-1', tipo: 'planeador', nombre: 'Planeador de la clase 1' },
  { ranura: 'planeador-2', tipo: 'planeador', nombre: 'Planeador de la clase 2' },
  { ranura: 'laminas', tipo: 'laminas', nombre: 'Láminas' },
  { ranura: 'ficha-1', tipo: 'fichas', nombre: 'Ficha de trabajo 1' },
  { ranura: 'ficha-2', tipo: 'fichas', nombre: 'Ficha de trabajo 2' },
  { ranura: 'decir', tipo: 'decir', nombre: 'Decir en parejas' },
  { ranura: 'prueba', tipo: 'prueba', nombre: 'Prueba del tema' },
  { ranura: 'caritas', tipo: 'caritas', nombre: 'Hoja de caritas' },
  { ranura: 'casa', tipo: 'casa', nombre: 'Nota para la casa' },
] as const;

const cacheTemas = new Map<string, Promise<TemaDoc>>();
let cacheIndice: Promise<Indice> | null = null;

async function pedir<T>(ruta: string): Promise<T> {
  const r = await fetch(BASE + ruta);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()) as T;
}

export function cargarIndice(): Promise<Indice> {
  cacheIndice ??= pedir<Indice>('materiales/indice.json').catch((e) => {
    cacheIndice = null;
    throw e;
  });
  return cacheIndice;
}

export function cargarTema(entrada: EntradaTema): Promise<TemaDoc> {
  if (!entrada.archivo) return Promise.reject(new Error('Tema sin materiales'));
  let p = cacheTemas.get(entrada.id);
  if (!p) {
    p = pedir<TemaDoc>(entrada.archivo).catch((e) => {
      cacheTemas.delete(entrada.id);
      throw e;
    });
    cacheTemas.set(entrada.id, p);
  }
  return p;
}

/** Un material por su identificador (`escuela-ficha-1`) o, si no existe, la ranura que aún no tiene contenido. */
export async function cargarMaterial(temaId: string, materialId: string) {
  const indice = await cargarIndice();
  const entrada = indice.temas.find((t) => t.id === temaId);
  if (!entrada) return { indice, entrada: undefined, tema: undefined, material: undefined, ranura: undefined };
  const tema = entrada.estado === 'listo' ? await cargarTema(entrada) : undefined;
  const material = tema?.materiales.find((m) => m.id === materialId);
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
};
