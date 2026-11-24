// Cola de estrellas del docente (esqueleto §2.4 y §2.6). Es la única capa que guarda y sube
// estrellas: la pantalla pide `darEstrellas` y lee `useCola`.
// - Cada toque crea una acción con un identificador único y una hora de "listo" 5 s después:
//   hasta entonces se puede deshacer. Después ya no hay forma de quitarla.
// - Sin red (o con el servidor caído) la acción espera en el aparato y se reintenta con el mismo
//   identificador: la base no repite la estrella aunque la respuesta se haya perdido.
import { useSyncExternalStore } from 'react';
import { alCerrarSesion, ErrorCuenta, miId, rpc } from './cuenta';

const LLAVE = 'pc_cola_estrellas_v1';
/** Segundos para deshacer. */
export const ESPERA_DESHACER_MS = 5000;
const REINTENTO_MS = 15000;

export type Motivo = 'participar' | 'colaborar';
/** Cada reconocimiento del docente es una calcomanía (ya no 10 y 15 puntos). */
export const VALOR: Record<Motivo, number> = { participar: 1, colaborar: 1 };

export interface Accion {
  accion: string;
  cartilla: string;
  motivo: Motivo;
  /** Niños que reciben la estrella (colaborar puede ser a varios). Solo identificadores. */
  ninos: string[];
  creado: number;
  /** Hora desde la que se puede subir; antes, deshacer sigue disponible. */
  listoEn: number;
}

export interface EstadoCola {
  acciones: Accion[];
  /** Estrellas (una por niño) que aún no están en la base, incluidas las que se pueden deshacer. */
  porSubir: number;
  /** Niños que recibieron una estrella subida en esta sesión (para el punto de "ya reconocido hoy"). */
  subidas: string[];
  /** Mensaje si la base rechazó una acción (ya no se reintenta). */
  rechazo?: string;
}

/** Las colas del aparato, una por docente: la de otro nunca se sube ni se borra desde esta sesión. */
type Guardado = Record<string, Accion[]>;

function leerTodo(): Guardado {
  try {
    const datos = JSON.parse(localStorage.getItem(LLAVE) ?? '{}') as unknown;
    return datos && typeof datos === 'object' && !Array.isArray(datos) ? (datos as Guardado) : {};
  } catch {
    return {};
  }
}

function leerGuardada(uid: string | undefined): Accion[] {
  const lista = uid ? leerTodo()[uid] : undefined;
  return Array.isArray(lista) ? lista.filter((a) => a && typeof a.accion === 'string' && Array.isArray(a.ninos)) : [];
}

function guardar(uid: string | undefined, acciones: Accion[]) {
  if (!uid) return;
  try {
    const todo = leerTodo();
    if (acciones.length) todo[uid] = acciones;
    else delete todo[uid];
    if (Object.keys(todo).length) localStorage.setItem(LLAVE, JSON.stringify(todo));
    else localStorage.removeItem(LLAVE);
  } catch {
    // Almacenamiento lleno o bloqueado: las acciones siguen en memoria mientras la pestaña viva.
  }
}

const armar = (acciones: Accion[], rechazo?: string, subidas: string[] = []): EstadoCola => ({ acciones, porSubir: acciones.reduce((n, a) => n + a.ninos.length, 0), subidas, rechazo });

let uidActual: string | undefined;
let estado: EstadoCola = armar([]);
const oyentes = new Set<() => void>();

/** Si cambió quien tiene la sesión, la cola en memoria pasa a ser la suya (y se reinicia lo de la sesión anterior). */
function sincronizar() {
  const uid = miId();
  if (uid === uidActual) return;
  uidActual = uid;
  estado = armar(leerGuardada(uid));
  oyentes.forEach((o) => o());
}

function poner(acciones: Accion[], rechazo = estado.rechazo, subidas = estado.subidas) {
  guardar(uidActual, acciones);
  estado = armar(acciones, rechazo, subidas);
  oyentes.forEach((o) => o());
}

/** Lo que hay por subir; el componente se vuelve a pintar cuando cambia. */
export function useCola(): EstadoCola {
  return useSyncExternalStore(
    (o) => {
      oyentes.add(o);
      return () => oyentes.delete(o);
    },
    () => estado,
  );
}

// ---------------------------------------------------------------- Acciones

/** Registra la estrella. Se puede deshacer durante `ESPERA_DESHACER_MS`; después sube sola. */
export function darEstrellas(ninos: string[], motivo: Motivo, cartilla: string): Accion {
  sincronizar();
  const ahora = Date.now();
  const a: Accion = { accion: crypto.randomUUID(), cartilla, motivo, ninos: [...new Set(ninos)], creado: ahora, listoEn: ahora + ESPERA_DESHACER_MS };
  poner([...estado.acciones, a]);
  programar();
  return a;
}

/** Quita la acción si todavía no estaba lista para subir. Devuelve si pudo. */
export function deshacer(id: string): boolean {
  sincronizar();
  const a = estado.acciones.find((x) => x.accion === id);
  if (!a || a.listoEn <= Date.now()) return false;
  poner(estado.acciones.filter((x) => x.accion !== id));
  return true;
}

export const olvidarRechazo = () => poner(estado.acciones, undefined);

// ---------------------------------------------------------------- Subida

let subiendo = false;
let reloj: number | undefined;

/** Sube, en orden, las acciones que ya pasaron su tiempo de deshacer. Se detiene ante una falla de red. */
export async function subir(): Promise<void> {
  sincronizar();
  if (subiendo || !uidActual) return;
  subiendo = true;
  const uid = uidActual;
  try {
    for (;;) {
      if (uid !== miId()) break; // La sesión cambió: la cola de otro docente no se toca.
      const a = estado.acciones.find((x) => x.listoEn <= Date.now());
      if (!a) break;
      try {
        await rpc('dar_estrellas', { p_estudiantes: a.ninos, p_cartilla: a.cartilla, p_motivo: a.motivo, p_accion: a.accion });
        if (uid !== uidActual) break;
        poner(estado.acciones.filter((x) => x.accion !== a.accion), estado.rechazo, [...new Set([...estado.subidas, ...a.ninos])]);
      } catch (e) {
        // Solo un rechazo de la base (4xx con su código, salvo 401 y 429) borra la acción. Una caída
        // del servidor (5xx), el límite de peticiones o cualquier falla sin código se reintenta.
        const rechazada = e instanceof ErrorCuenta && e.status >= 400 && e.status < 500 && e.status !== 401 && e.status !== 429 && Boolean(e.codigo);
        if (!rechazada) break;
        console.warn('La base rechazó una estrella', (e as ErrorCuenta).status, (e as ErrorCuenta).codigo, (e as ErrorCuenta).message);
        if (uid !== uidActual) break;
        poner(estado.acciones.filter((x) => x.accion !== a.accion), 'No se pudo guardar una estrella. Si le pasa de nuevo, avise a su coordinador.');
      }
    }
  } finally {
    subiendo = false;
    programar();
  }
}

/** Agenda la próxima subida: cuando termine el tiempo de deshacer, o más tarde si falló la red. */
function programar() {
  window.clearTimeout(reloj);
  if (estado.acciones.length === 0) return;
  const ahora = Date.now();
  const proxima = Math.min(...estado.acciones.map((a) => a.listoEn));
  const listas = proxima <= ahora;
  reloj = window.setTimeout(() => void subir(), listas ? REINTENTO_MS : proxima - ahora + 50);
}

let vigilando = false;
/** Al abrir el modo docente: sube lo pendiente y vuelve a intentarlo cuando regresa la señal. */
export function iniciarCola() {
  if (!vigilando) {
    vigilando = true;
    window.addEventListener('online', () => void subir());
  }
  uidActual = undefined;
  sincronizar();
  avisoSalida = undefined;
  programar();
  void subir();
}

// ---------------------------------------------------------------- Salir

let avisoSalida: string | undefined;
const oyentesAviso = new Set<() => void>();

/** Aviso en la pantalla de entrada tras salir con estrellas sin subir. */
export function useAvisoSalida(): string | undefined {
  return useSyncExternalStore(
    (o) => {
      oyentesAviso.add(o);
      return () => oyentesAviso.delete(o);
    },
    () => avisoSalida,
  );
}

/** Antes de cerrar la sesión: con red intenta subir todo (ya no hay tiempo de deshacer) y avisa si algo queda. */
export async function prepararSalida(): Promise<void> {
  sincronizar();
  if (estado.acciones.length === 0) return;
  const ahora = Date.now();
  poner(estado.acciones.map((a) => ({ ...a, listoEn: Math.min(a.listoEn, ahora) })));
  if (navigator.onLine) await subir();
  const quedan = estado.porSubir;
  if (quedan > 0) {
    avisoSalida = `Tiene ${quedan} ${quedan === 1 ? 'estrella' : 'estrellas'} sin subir; entre de nuevo con su cuenta para subirlas.`;
    oyentesAviso.forEach((o) => o());
  }
}

// Al cerrarse la sesión se reinicia lo de la sesión (la cola guardada de ese docente se conserva).
alCerrarSesion(() => {
  window.clearTimeout(reloj);
  uidActual = undefined;
  estado = armar([]);
  oyentes.forEach((o) => o());
});
