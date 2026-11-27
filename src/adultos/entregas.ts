// Entregas de planeación al coordinador (migración 015). El docente entrega una copia de su
// planeación; el coordinador de su colegio la revisa o pide ajustes con un comentario.
import { leer, miId, rpc } from './cuenta';
import type { Plan } from '../armador/armar';

export type EstadoEntrega = 'por-revisar' | 'revisada' | 'ajustar';

export interface Entrega {
  docente_id: string;
  planeacion_id: string;
  docente_nombre: string;
  titulo: string;
  datos: Plan;
  entregada: string;
  estado: EstadoEntrega;
  comentario: string | null;
  revisada: string | null;
}

export const NOMBRE_ESTADO: Record<EstadoEntrega, string> = {
  'por-revisar': 'Por revisar',
  revisada: 'Revisada',
  ajustar: 'Con ajustes pedidos',
};

/** La copia que viaja: sin las marcas internas del aparato. */
const copia = ({ nube: _n, uid: _u, ...resto }: Plan) => resto;

export const tituloPlan = (p: Plan) => `${p.nombreTema} · ${p.duracion} min`;

export async function entregarPlan(p: Plan): Promise<void> {
  await rpc('entregar_planeacion', { p_id: p.id, p_titulo: tituloPlan(p).slice(0, 160), p_datos: copia(p) });
}

export async function retirarEntrega(id: string): Promise<void> {
  await rpc('retirar_entrega', { p_id: id });
}

/** La entrega de una planeación propia, si existe. */
export async function miEntrega(id: string): Promise<Entrega | null> {
  const yo = miId();
  if (!yo) return null;
  const filas = await leer<Entrega>('entregas_planeacion', `select=docente_id,planeacion_id,docente_nombre,titulo,entregada,estado,comentario,revisada&docente_id=eq.${encodeURIComponent(yo)}&planeacion_id=eq.${encodeURIComponent(id)}`);
  return filas[0] ?? null;
}

/** Todas las entregas del colegio (el coordinador); lo más reciente primero. */
export function entregasColegio(): Promise<Entrega[]> {
  return leer<Entrega>('entregas_planeacion', 'select=docente_id,planeacion_id,docente_nombre,titulo,datos,entregada,estado,comentario,revisada&order=entregada.desc');
}

export async function revisarEntrega(e: Pick<Entrega, 'docente_id' | 'planeacion_id'>, estado: Exclude<EstadoEntrega, 'por-revisar'>, comentario: string): Promise<void> {
  await rpc('revisar_planeacion', { p_docente: e.docente_id, p_id: e.planeacion_id, p_estado: estado, p_comentario: comentario });
}
