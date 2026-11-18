// Datos del docente: sus grupos, los niños de cada grupo, el paquete de personajes y las acciones
// sobre los niños. Todo pasa por cuenta.ts (rpc, leer, escribir); la seguridad por filas de
// Supabase decide qué ve y qué cambia. Nunca se guarda un PIN legible: se genera aquí, se manda
// a la base (que guarda solo su huella) y se conserva en memoria hasta imprimir la tarjeta.
import { ErrorCuenta, escribir, leer, rpc } from './cuenta';

export interface GrupoDoc {
  id: string;
  nombre: string;
  grado: string;
  colegio_id: string;
  codigo: string;
  /** Niños del grupo (solo el conteo: Inicio y Mis grupos nunca traen apodos). */
  ninos: number;
}

export interface Nino {
  id: string;
  apodo: string;
  avatar: string;
  /** Fecha (AAAA-MM-DD) en que se recibió la autorización; null si falta. */
  autorizacion: string | null;
}

export interface Heroe {
  id: string;
  nombre: string;
  imagen: string;
  anclas?: { cara?: { x: number; y: number } };
}

/** Lo que el docente toma del paquete de la cartilla: sus personajes y su identificador. */
export interface Paquete {
  cartilla: string;
  base: string;
  heroes: Heroe[];
}

const BASE = `${import.meta.env.BASE_URL}cartillas/ingles-3/`;
/** Dirección pública a la que lleva el QR de la tarjeta (se puede cambiar con VITE_URL_PUBLICA). */
export const URL_PUBLICA = ((import.meta.env.VITE_URL_PUBLICA as string | undefined) || 'https://englishlandmanuelprofe.netlify.app').replace(/\/+$/, '');

export const GRADOS = ['Preescolar', '1°', '2°', '3°', '4°', '5°'].map((g) => ({ valor: g, etiqueta: g === 'Preescolar' ? g : `Grado ${g}` }));

let paquete: Promise<Paquete> | null = null;
export function cargarPaquete(): Promise<Paquete> {
  paquete ??= fetch(`${BASE}cartilla.json`)
    .then((r) => {
      if (!r.ok) throw new ErrorCuenta('red');
      return r.json() as Promise<{ id: string; heroes: Heroe[] }>;
    })
    .then((c) => ({ cartilla: c.id, base: BASE, heroes: c.heroes }))
    .catch(() => {
      paquete = null;
      throw new ErrorCuenta('red');
    });
  return paquete;
}

/** Hoy en Colombia, AAAA-MM-DD (misma cuenta de fechas que `hoy_co()` en la base). */
export const hoyCo = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());

// ---------------------------------------------------------------- Lecturas

/** Los grupos del docente con su código y el número de niños. Sin grupos devuelve una lista vacía. */
export async function cargarGrupos(): Promise<GrupoDoc[]> {
  const codigos = await rpc<{ grupo_id: string; codigo: string }[]>('mis_codigos', {});
  if (codigos.length === 0) return [];
  const ids = codigos.map((c) => c.grupo_id).join(',');
  const [grupos, filas] = await Promise.all([
    leer<Omit<GrupoDoc, 'codigo' | 'ninos'>>('grupos', `select=id,nombre,grado,colegio_id&id=in.(${ids})&order=nombre.asc`),
    leer<{ grupo_id: string }>('estudiantes', `select=grupo_id&grupo_id=in.(${ids})`),
  ]);
  return grupos.map((g) => ({ ...g, codigo: codigos.find((c) => c.grupo_id === g.id)?.codigo ?? '', ninos: filas.filter((f) => f.grupo_id === g.id).length }));
}

const alfabetico = (a: Nino, b: Nino) => a.apodo.localeCompare(b.apodo, 'es', { sensitivity: 'base' });

export async function cargarNinos(grupo: string): Promise<Nino[]> {
  const filas = await leer<Nino>('estudiantes', `select=id,apodo,avatar,autorizacion&grupo_id=eq.${encodeURIComponent(grupo)}`);
  return filas.sort(alfabetico);
}

/** Niños del grupo que ya recibieron participar o colaborar hoy del docente (para el punto suave). */
export async function reconocidosHoy(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const filas = await leer<{ estudiante_id: string }>('estrellas', `select=estudiante_id&creado=eq.${hoyCo()}&motivo=in.(participar,colaborar)&estudiante_id=in.(${ids.join(',')})`);
  return new Set(filas.map((f) => f.estudiante_id));
}

export async function nombreColegio(id: string | null): Promise<string | null> {
  if (!id) return null;
  const filas = await leer<{ nombre: string }>('colegios', `select=nombre&id=eq.${encodeURIComponent(id)}`);
  return filas[0]?.nombre ?? null;
}

// ---------------------------------------------------------------- Cambios

/** Crea el grupo del docente. La base lo permite solo a un docente, para sí mismo (`crear_grupo`). */
export const crearMiGrupo = (nombre: string, grado: string) => rpc<{ id: string }>('crear_grupo', { p_nombre: nombre.trim(), p_grado: grado });

/** PIN de tres imágenes (cifras 0 a 9) con el generador seguro del navegador. */
export function pinNuevo(): string {
  const b = crypto.getRandomValues(new Uint8Array(3));
  return [...b].map((x) => String(x % 10)).join('');
}

/** PIN de cada niño desde que se generó, solo en memoria: se pierde al recargar y nunca se pinta en pantalla. */
const pines = new Map<string, string>();
export const pinDe = (id: string) => pines.get(id);

/** Apodos de una lista pegada: uno por línea, o separados por coma o punto y coma; sin numeración ni repetidos. */
export function apodosDe(texto: string): string[] {
  const vistos = new Set<string>();
  return texto
    .split(/[\n;,]+/)
    .map((t) => t.replace(/^\s*(?:\d+\s*[.)\-:]|[-*•])\s*/, '').replace(/\s+/g, ' ').trim())
    .filter((t) => {
      const k = t.toLocaleLowerCase('es');
      if (!t || vistos.has(k)) return false;
      vistos.add(k);
      return true;
    });
}

export interface ResultadoAgregar {
  creados: string[];
  fallas: { apodo: string; motivo: string }[];
}

/**
 * Agrega niños de uno en uno. Con `avatar` vacío el personaje alterna entre los del paquete,
 * siguiendo desde cuántos niños ya tiene el grupo (esqueleto §9, pregunta 1).
 */
export async function agregarNinos(grupo: string, apodos: string[], avatar: string, heroes: Heroe[], yaHay: number): Promise<ResultadoAgregar> {
  const r: ResultadoAgregar = { creados: [], fallas: [] };
  for (const [i, apodo] of apodos.entries()) {
    const personaje = avatar || heroes[(yaHay + i) % heroes.length]?.id;
    const pin = pinNuevo();
    try {
      const id = await rpc<string>('crear_estudiante', { p_grupo: grupo, p_apodo: apodo, p_pin: pin, p_avatar: personaje });
      pines.set(id, pin);
      r.creados.push(apodo);
    } catch (e) {
      if (e instanceof ErrorCuenta && (e.falla === 'red' || e.falla === 'credenciales')) throw e;
      const duplicado = e instanceof ErrorCuenta && (e.codigo === '23505' || /duplicate|unique/i.test(e.message));
      r.fallas.push({ apodo, motivo: duplicado ? 'ya está en el grupo' : e instanceof ErrorCuenta && e.message !== 'otro' ? e.message : 'no se pudo agregar' });
    }
  }
  return r;
}

export async function ponerAutorizacion(id: string, fecha: string | null) {
  await escribir('estudiantes', 'PATCH', `id=eq.${encodeURIComponent(id)}&select=id`, { autorizacion: fecha });
}

export async function ponerPersonaje(id: string, avatar: string) {
  await escribir('estudiantes', 'PATCH', `id=eq.${encodeURIComponent(id)}&select=id`, { avatar });
}

/** Genera un PIN nuevo, lo manda a la base y lo deja en memoria para la tarjeta impresa. */
export async function cambiarPin(id: string): Promise<void> {
  const pin = pinNuevo();
  await rpc('cambiar_pin', { p_estudiante: id, p_pin: pin });
  pines.set(id, pin);
}

/** Retira al niño: la base borra su progreso, sus estrellas y su PIN con él. */
export async function retirar(id: string) {
  await escribir('estudiantes', 'DELETE', `id=eq.${encodeURIComponent(id)}&select=id`);
  pines.delete(id);
}
