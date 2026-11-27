// Lo que crea el docente (planeaciones del armador y juegos armados) en su cuenta, para verlo en
// el celular y en el computador (tabla creaciones_docente, migración 014). Lo de cada aparato sigue
// siendo la copia de trabajo: se guarda ahí primero y sube cuando hay red. Si la migración todavía
// no está aplicada, o no hay red, todo sigue funcionando solo en el aparato.
import { escribir, leer, miId } from './cuenta';

export type TipoCreacion = 'planeacion' | 'juego';
/** Lo mínimo que tiene cada creación guardada en el aparato. */
export interface Creacion {
  id: string;
  /** Cuenta que la creó en este aparato (otro docente que use el mismo aparato no la ve ni la sube). */
  uid?: string;
  /** Ya está en la cuenta: si desaparece de la nube es porque se borró en otro aparato. */
  nube?: boolean;
}
export interface FuenteCreaciones<T extends Creacion> {
  tipo: TipoCreacion;
  leer: () => T[];
  poner: (lista: T[]) => void;
}

const TABLA = 'creaciones_docente';
const LLAVE_BORRAR = 'cuaderno.nube-por-borrar';

/** De esta cuenta (o de antes de que hubiera cuentas en el aparato). */
export const esMia = (c: Creacion, uid = miId()) => !c.uid || !uid || c.uid === uid;
export const conDueno = <T extends Creacion>(c: T): T => ({ ...c, uid: c.uid ?? miId() });

function porBorrar(): { tipo: TipoCreacion; id: string; uid?: string }[] {
  try {
    const v = JSON.parse(localStorage.getItem(LLAVE_BORRAR) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function guardarPorBorrar(lista: { tipo: TipoCreacion; id: string; uid?: string }[]) {
  try {
    if (lista.length) localStorage.setItem(LLAVE_BORRAR, JSON.stringify(lista));
    else localStorage.removeItem(LLAVE_BORRAR);
  } catch {
    // Sin almacenamiento: se reintenta mientras dure la pestaña.
  }
}

async function subirUna<T extends Creacion>(tipo: TipoCreacion, c: T): Promise<void> {
  const { nube: _n, uid: _u, ...datos } = c;
  const filas = await escribir<{ id: string }>(TABLA, 'POST', 'on_conflict=docente_id,id&select=id', { id: c.id, tipo, datos, actualizado: new Date().toISOString() }, true);
  // Solo cuenta como guardada si la base devuelve la fila.
  if (!filas.some((f) => f.id === c.id)) throw new Error('No quedó en la cuenta');
}

/** Sube una creación recién guardada; si no se puede, queda para la próxima sincronización. */
export async function subirCreacion<T extends Creacion>(f: FuenteCreaciones<T>, c: T): Promise<void> {
  try {
    await subirUna(f.tipo, c);
    f.poner(f.leer().map((x) => (x.id === c.id ? { ...x, nube: true } : x)));
  } catch {
    // Sin red o sin la migración: sigue en el aparato.
  }
}

/** Quita una creación de la cuenta; sin red, lo anota para hacerlo después. */
export async function quitarCreacion(tipo: TipoCreacion, c: Creacion): Promise<void> {
  if (!c.nube) return;
  try {
    await escribir(TABLA, 'DELETE', `id=eq.${encodeURIComponent(c.id)}&select=id`);
  } catch {
    guardarPorBorrar([...porBorrar(), { tipo, id: c.id, uid: c.uid }]);
  }
}

/**
 * Junta lo del aparato con lo de la cuenta: baja lo creado en otros aparatos, sube lo que solo
 * está aquí y quita lo que se borró en otro aparato. Callado si falla.
 */
export async function sincronizarCreaciones<T extends Creacion>(f: FuenteCreaciones<T>): Promise<void> {
  const uid = miId();
  if (!uid) return;
  let filas: { id: string; datos: T }[];
  try {
    filas = await leer<{ id: string; datos: T }>(TABLA, `select=id,datos&tipo=eq.${f.tipo}&order=actualizado.desc`);
  } catch {
    return;
  }
  // Borrados que quedaron pendientes sin red.
  const pendientes = porBorrar();
  const quedan = [];
  for (const b of pendientes) {
    if (b.tipo !== f.tipo || (b.uid && b.uid !== uid)) {
      quedan.push(b);
      continue;
    }
    try {
      await escribir(TABLA, 'DELETE', `id=eq.${encodeURIComponent(b.id)}&select=id`);
    } catch {
      // Ya no existía o sigue sin red: no se reintenta para siempre.
    }
  }
  guardarPorBorrar(quedan);
  const borradas = new Set(pendientes.filter((b) => b.tipo === f.tipo).map((b) => b.id));

  const enNube = new Map(filas.filter((r) => !borradas.has(r.id)).map((r) => [r.id, { ...r.datos, id: r.id, uid, nube: true } as T]));
  const locales = f.leer();
  const resultado: T[] = [];
  for (const l of locales) {
    if (!esMia(l, uid)) {
      resultado.push(l);
      continue;
    }
    if (enNube.has(l.id)) {
      // Un cambio hecho aquí sin red (p. ej. la fecha en "Mi mes") sube y gana sobre la copia de la nube.
      if (l.nube === undefined && l.uid) {
        try {
          await subirUna(f.tipo, l);
          enNube.set(l.id, { ...l, uid, nube: true });
        } catch {
          enNube.set(l.id, l);
        }
      }
      continue;
    }
    if (l.nube || borradas.has(l.id)) continue; // se borró en otro aparato
    try {
      await subirUna(f.tipo, l);
      resultado.push({ ...l, uid, nube: true });
    } catch {
      resultado.push(conDueno(l));
    }
  }
  f.poner([...enNube.values(), ...resultado]);
}
