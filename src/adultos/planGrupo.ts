// Plan por grupo (esqueleto §2.2, tanda 5 del calendario): el docente pone la fecha de la clase 1 y
// de la clase 2 de cada tema de su grupo. Vive en la tabla planes_tema (migración 002): la lee el
// docente, su coordinador y el dueño; solo el docente del grupo la escribe. Cambiar fechas nunca
// toca el progreso de los niños. La última lectura queda en el aparato para verla sin red.
import { ErrorCuenta, escribir, leer, miId } from './cuenta';
import { hoyCo } from './docente';

export type EstadoPlan = 'por-hacer' | 'en-curso' | 'hecho';

export interface PlanTema {
  grupo_id: string;
  cartilla_id: string;
  tema_id: string;
  clase1: string | null;
  clase2: string | null;
  estado: EstadoPlan;
}

export interface ProximaClase {
  tema: string;
  clase: 1 | 2;
  fecha: string;
  /** La fecha ya pasó y el tema no se ha marcado como hecho. */
  atrasada: boolean;
}

const LLAVE = 'pc_docente_planes_v1';
const llave = (grupo: string, cartilla: string) => `${grupo}|${cartilla}`;

function copia(): Record<string, PlanTema[]> {
  try {
    const c = JSON.parse(localStorage.getItem(LLAVE) ?? '{}') as { uid?: string; planes?: Record<string, PlanTema[]> };
    return c.uid && c.uid === miId() ? (c.planes ?? {}) : {};
  } catch {
    return {};
  }
}
function guardarCopia(grupo: string, cartilla: string, filas: PlanTema[]) {
  const uid = miId();
  if (!uid) return;
  try {
    const planes = { ...copia(), [llave(grupo, cartilla)]: filas };
    localStorage.setItem(LLAVE, JSON.stringify({ uid, planes }));
  } catch {
    // Sin almacenamiento solo se pierde la copia sin red.
  }
}

/** El plan del grupo para una cartilla (una fila por tema planeado). */
export async function cargarPlan(grupo: string, cartilla: string): Promise<PlanTema[]> {
  try {
    const filas = await leer<PlanTema>('planes_tema', `select=grupo_id,cartilla_id,tema_id,clase1,clase2,estado&grupo_id=eq.${encodeURIComponent(grupo)}&cartilla_id=eq.${encodeURIComponent(cartilla)}`);
    guardarCopia(grupo, cartilla, filas);
    return filas;
  } catch (e) {
    const c = copia()[llave(grupo, cartilla)];
    if (e instanceof ErrorCuenta && e.falla === 'red' && c) return c;
    throw e;
  }
}

/** Estado que sale de las fechas, salvo que el docente ya lo marcó como hecho. */
export function estadoPorFechas(clase1: string | null, hoy = hoyCo()): EstadoPlan {
  return clase1 && clase1 <= hoy ? 'en-curso' : 'por-hacer';
}

/** Guarda las fechas (o el estado) de un tema del grupo. Crea la fila si no existe. */
export async function guardarPlan(fila: PlanTema): Promise<PlanTema> {
  if (fila.clase1 && fila.clase2 && fila.clase2 < fila.clase1) throw new ErrorCuenta('otro', 'La clase 2 va después de la clase 1');
  const [guardada] = await escribir<PlanTema>(
    'planes_tema',
    'POST',
    'on_conflict=grupo_id,cartilla_id,tema_id&select=grupo_id,cartilla_id,tema_id,clase1,clase2,estado',
    { ...fila, actualizado: new Date().toISOString() },
    true,
  );
  return guardada ?? fila;
}

/**
 * La próxima clase del grupo según su plan: la fecha más cercana desde hoy entre las clases de
 * los temas sin terminar. Si todas quedaron atrás, la más reciente que no se marcó como hecha.
 * Sin fechas, null.
 */
export function proximaClase(plan: PlanTema[], hoy = hoyCo()): ProximaClase | null {
  const clases = plan
    .filter((p) => p.estado !== 'hecho')
    .flatMap((p) => [
      p.clase1 ? { tema: p.tema_id, clase: 1 as const, fecha: p.clase1 } : null,
      p.clase2 ? { tema: p.tema_id, clase: 2 as const, fecha: p.clase2 } : null,
    ])
    .filter((c): c is { tema: string; clase: 1 | 2; fecha: string } => c !== null);
  const futuras = clases.filter((c) => c.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha) || a.clase - b.clase);
  if (futuras.length) return { ...futuras[0], atrasada: false };
  const pasadas = clases.sort((a, b) => b.fecha.localeCompare(a.fecha) || b.clase - a.clase);
  return pasadas.length ? { ...pasadas[0], atrasada: true } : null;
}

/** Farol de cada clase: encendido si ya se dio (fecha pasada o tema hecho), medio si es hoy. */
export function farolClase(p: PlanTema | undefined, clase: 1 | 2, hoy = hoyCo()): 'apagado' | 'medio' | 'encendido' {
  if (!p) return 'apagado';
  if (p.estado === 'hecho') return 'encendido';
  const f = clase === 1 ? p.clase1 : p.clase2;
  if (!f) return 'apagado';
  return f < hoy ? 'encendido' : f === hoy ? 'medio' : 'apagado';
}

/** "Hoy", "Mañana" o "Jueves 4 de febrero". */
export function diaDeClase(iso: string, hoy = hoyCo()): string {
  if (iso === hoy) return 'Hoy';
  const [a, m, d] = iso.split('-').map(Number);
  const fecha = new Date(a, m - 1, d);
  const [ha, hm, hd] = hoy.split('-').map(Number);
  const dias = Math.round((fecha.getTime() - new Date(ha, hm - 1, hd).getTime()) / 86400000);
  if (dias === 1) return 'Mañana';
  const t = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(fecha);
  return t.charAt(0).toUpperCase() + t.slice(1);
}
