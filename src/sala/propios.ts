// Juegos que arma el docente (armador de juegos): eligen una plantilla de palabras y las palabras
// del banco de la cartilla. No traen contenido propio: solo dicen qué plantilla y qué palabras
// del paquete se usan, así que siguen la regla de contenido separado del motor.
// Viven en este aparato (localStorage, compartido entre el panel del docente y el reproductor
// /jugar/…); subirlos a la nube va con la migración de planeaciones.
import type { Cartilla, Mision, Palabra, Territorio } from '../tipos';

/** Plantillas que se arman solo con palabras e imágenes del banco. */
export const PLANTILLAS_PROPIAS = ['escucha-toca', 'escucha-atrapa', 'memoria', 'di-brilla'] as const;
export type PlantillaPropia = (typeof PLANTILLAS_PROPIAS)[number];

export interface JuegoPropio {
  id: string;
  cartilla: string;
  plantilla: PlantillaPropia;
  titulo: string;
  /** Claves (`en`) de las palabras elegidas del banco de la cartilla. */
  palabras: string[];
  /** Imagen de la tarjeta en la sala (la de la primera palabra). */
  icono?: string;
  creado: string;
  /** Cuenta del docente que lo creó y si ya está en su cuenta (ver adultos/nubeCreaciones.ts). */
  uid?: string;
  nube?: boolean;
}

const CLAVE = 'cuaderno.mis-juegos';
export const PREFIJO = 'propio-';
const oyentes = new Set<() => void>();

export function leerJuegosPropios(): JuegoPropio[] {
  try {
    const j = JSON.parse(localStorage.getItem(CLAVE) ?? '[]') as JuegoPropio[];
    return Array.isArray(j) ? j.filter((x) => x && typeof x.id === 'string' && Array.isArray(x.palabras)) : [];
  } catch {
    return [];
  }
}

function escribir(lista: JuegoPropio[]) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista));
  } catch {
    // Sin almacenamiento el juego dura lo que dure la pestaña.
  }
  oyentes.forEach((f) => f());
}

export function guardarJuegoPropio(j: Omit<JuegoPropio, 'id' | 'creado'> & { id?: string }): JuegoPropio {
  const lista = leerJuegosPropios();
  const previo = j.id ? lista.find((x) => x.id === j.id) : undefined;
  const nuevo: JuegoPropio = { ...j, id: previo?.id ?? `${PREFIJO}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, creado: previo?.creado ?? new Date().toISOString() };
  escribir([nuevo, ...lista.filter((x) => x.id !== nuevo.id)]);
  return nuevo;
}

/** Reemplaza la lista entera (al juntarla con la de la cuenta del docente). */
export function ponerJuegosPropios(lista: JuegoPropio[]) {
  escribir([...lista].sort((a, b) => b.creado.localeCompare(a.creado)));
}

export function borrarJuegoPropio(id: string) {
  escribir(leerJuegosPropios().filter((x) => x.id !== id));
}

export function alCambiarJuegosPropios(f: () => void) {
  oyentes.add(f);
  const otraPestana = (e: StorageEvent) => e.key === CLAVE && f();
  window.addEventListener('storage', otraPestana);
  return () => {
    oyentes.delete(f);
    window.removeEventListener('storage', otraPestana);
  };
}

/** Todas las palabras con imagen de una cartilla, sin repetir, en el orden en que aparecen. */
export function bancoDePalabras(cartilla: Cartilla): { palabra: Palabra; mision: string }[] {
  const vistas = new Map<string, { palabra: Palabra; mision: string }>();
  for (const t of cartilla.territorios) for (const m of t.misiones) for (const p of m.palabras) if (p.icono && !vistas.has(p.en)) vistas.set(p.en, { palabra: p, mision: m.titulo });
  return [...vistas.values()];
}

/** Plantillas que la cartilla ya usa con palabras: de ahí se toman sus ajustes (ritmo, formas). */
export function plantillasDe(cartilla: Cartilla): PlantillaPropia[] {
  const usadas = new Set(cartilla.territorios.flatMap((t) => t.misiones.filter((m) => m.palabras.length >= 3).map((m) => m.plantilla)));
  return PLANTILLAS_PROPIAS.filter((p) => usadas.has(p) || p === 'escucha-toca' || p === 'memoria');
}

/** Arma la misión de un juego propio sobre una misión de la cartilla con la misma plantilla. */
export function misionPropia(j: JuegoPropio, cartilla: Cartilla, territorio: Territorio): Mision | null {
  const banco = new Map(bancoDePalabras(cartilla).map((b) => [b.palabra.en, b.palabra]));
  const palabras = j.palabras.map((en) => banco.get(en)).filter((p): p is Palabra => Boolean(p));
  if (palabras.length < 3) return null;
  const molde = territorio.misiones.find((m) => m.plantilla === j.plantilla && m.palabras.length >= 3) ?? territorio.misiones[0];
  if (!molde) return null;
  return {
    ...molde,
    id: j.id,
    titulo: j.titulo,
    plantilla: j.plantilla,
    antes: [],
    palabras,
    palabrasDe: undefined,
    parejas: j.plantilla === 'memoria' ? Math.min(molde.plantilla === 'memoria' ? (molde.parejas ?? 4) : 4, palabras.length) : molde.parejas,
    formas: j.plantilla === 'memoria' ? (molde.plantilla === 'memoria' && molde.formas?.length ? molde.formas : ['imagen-palabra']) : molde.formas,
  };
}

export function cargarJuegoPropio(id: string, cartilla: Cartilla, territorio: Territorio): Mision | null {
  if (!id.startsWith(PREFIJO)) return null;
  const j = leerJuegosPropios().find((x) => x.id === id && x.cartilla === cartilla.id);
  return j ? misionPropia(j, cartilla, territorio) : null;
}
