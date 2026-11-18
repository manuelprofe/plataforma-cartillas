// Cola de estrellas del docente (esqueleto §2.4 y §2.6). Es la única capa que guarda y sube
// estrellas: la pantalla pide `darEstrellas` y lee `useCola`.
// - Cada toque crea una acción con un identificador único y una hora de "listo" 5 s después:
//   hasta entonces se puede deshacer. Después ya no hay forma de quitarla.
// - Sin red (o con el servidor caído) la acción espera en el aparato y se reintenta con el mismo
//   identificador: la base no repite la estrella aunque la respuesta se haya perdido.
import { useSyncExternalStore } from 'react';
import { ErrorCuenta, rpc } from './cuenta';

const LLAVE = 'pc_cola_estrellas_v1';
/** Segundos para deshacer. */
export const ESPERA_DESHACER_MS = 5000;
const REINTENTO_MS = 15000;

export type Motivo = 'participar' | 'colaborar';
export const VALOR: Record<Motivo, number> = { participar: 10, colaborar: 15 };

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

function leerGuardada(): Accion[] {
  try {
    const datos = JSON.parse(localStorage.getItem(LLAVE) ?? '[]') as Accion[];
    return Array.isArray(datos) ? datos.filter((a) => a && typeof a.accion === 'string' && Array.isArray(a.ninos)) : [];
  } catch {
    return [];
  }
}

function guardar(acciones: Accion[]) {
  try {
    if (acciones.length) localStorage.setItem(LLAVE, JSON.stringify(acciones));
    else localStorage.removeItem(LLAVE);
  } catch {
    // Almacenamiento lleno o bloqueado: las acciones siguen en memoria mientras la pestaña viva.
  }
}

const armar = (acciones: Accion[], rechazo?: string, subidas: string[] = []): EstadoCola => ({ acciones, porSubir: acciones.reduce((n, a) => n + a.ninos.length, 0), subidas, rechazo });

let estado: EstadoCola = armar(leerGuardada());
const oyentes = new Set<() => void>();

function poner(acciones: Accion[], rechazo = estado.rechazo, subidas = estado.subidas) {
  guardar(acciones);
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
  const ahora = Date.now();
  const a: Accion = { accion: crypto.randomUUID(), cartilla, motivo, ninos: [...new Set(ninos)], creado: ahora, listoEn: ahora + ESPERA_DESHACER_MS };
  poner([...estado.acciones, a]);
  programar();
  return a;
}

/** Quita la acción si todavía no estaba lista para subir. Devuelve si pudo. */
export function deshacer(id: string): boolean {
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
  if (subiendo) return;
  subiendo = true;
  try {
    for (;;) {
      const a = estado.acciones.find((x) => x.listoEn <= Date.now());
      if (!a) break;
      try {
        await rpc('dar_estrellas', { p_estudiantes: a.ninos, p_cartilla: a.cartilla, p_motivo: a.motivo, p_accion: a.accion });
        poner(estado.acciones.filter((x) => x.accion !== a.accion), estado.rechazo, [...new Set([...estado.subidas, ...a.ninos])]);
      } catch (e) {
        if (e instanceof ErrorCuenta && (e.falla === 'red' || e.falla === 'credenciales' || e.falla === 'sin-config')) break;
        // La base rechazó la acción (por ejemplo, el niño ya no está): no se reintenta.
        poner(
          estado.acciones.filter((x) => x.accion !== a.accion),
          e instanceof ErrorCuenta && e.message !== 'otro' ? `No se pudo guardar una estrella: ${e.message}` : 'No se pudo guardar una estrella.',
        );
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
  poner(leerGuardada());
  programar();
  void subir();
}
