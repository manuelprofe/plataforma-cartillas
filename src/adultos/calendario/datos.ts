// Datos de "Mi mes": las clases de cada grupo (fechas de planes_tema) y las planeaciones propias
// con fecha (campo `fecha` dentro de la planeación, que ya sube a la cuenta). Sin migración.
import { cargarGrupos, cartillaDeGrupo, hoyCo, type GrupoDoc } from '../docente';
import { cargarPlan, estadoPorFechas, guardarPlan, type PlanTema } from '../planGrupo';
import { cargarPensum, type Pensum } from '../../pensum/datos';
import { cargarIndice, type Indice } from '../../materiales/datos';
import { festivo } from './festivos';

/** Color de cada grupo, en orden fijo (paleta categórica validada; el nombre del grupo va siempre escrito). */
export const COLORES = ['#257de0', '#f47230', '#00b894', '#f2a600'];

export interface GrupoMes {
  g: GrupoDoc;
  cartilla: string;
  color: string;
  plan: PlanTema[];
  pensum: Pensum | null;
}

export interface DatosMes {
  grupos: GrupoMes[];
  indice: Indice | null;
}

export async function cargarMes(): Promise<DatosMes> {
  const grupos = await cargarGrupos();
  const pensums = new Map<string, Promise<Pensum | null>>();
  const pensumDe = (c: string) => {
    if (!pensums.has(c)) pensums.set(c, cargarPensum(c).catch(() => null));
    return pensums.get(c)!;
  };
  const [filas, indice] = await Promise.all([
    Promise.all(
      grupos.map(async (g, i) => {
        const cartilla = cartillaDeGrupo(g);
        const [plan, pensum] = await Promise.all([cargarPlan(g.id, cartilla).catch(() => [] as PlanTema[]), pensumDe(cartilla)]);
        return { g, cartilla, color: COLORES[i % COLORES.length], plan, pensum };
      }),
    ),
    cargarIndice().catch(() => null),
  ]);
  return { grupos: filas, indice };
}

/** Un tema del pensum que cabe en una o dos clases: cada tema de cada unidad, en orden. */
export interface TemaClase {
  id: string;
  nombre: string;
  unidad: string;
}
export const temasDelPensum = (p: Pensum): TemaClase[] => p.unidades.flatMap((u) => u.temas.map((t, i) => ({ id: `${u.id}-${i + 1}`, nombre: t.charAt(0).toUpperCase() + t.slice(1), unidad: u.id })));

/** Nombre y enlace de un tema del plan: del pensum ("u3-2") o de las láminas ("colores"). */
export function temaDe(gm: GrupoMes, indice: Indice | null, tema: string): { nombre: string; ruta: string } {
  const t = gm.pensum && temasDelPensum(gm.pensum).find((x) => x.id === tema);
  if (t) return { nombre: t.nombre, ruta: `/docente/planear/tema/${encodeURIComponent(gm.cartilla)}/${encodeURIComponent(t.unidad)}` };
  const l = indice?.temas.find((x) => x.id === tema);
  return { nombre: l?.nombre ?? tema, ruta: `/docente/planear/${encodeURIComponent(tema)}` };
}

export interface ClaseDia {
  grupo: GrupoMes;
  fila: PlanTema;
  clase: 1 | 2;
  fecha: string;
}

/** Las clases de todos los grupos, con su fecha. */
export const clasesDe = (grupos: GrupoMes[]): ClaseDia[] =>
  grupos.flatMap((grupo) =>
    grupo.plan.flatMap((fila) => [
      ...(fila.clase1 ? [{ grupo, fila, clase: 1 as const, fecha: fila.clase1 }] : []),
      ...(fila.clase2 ? [{ grupo, fila, clase: 2 as const, fecha: fila.clase2 }] : []),
    ]),
  );

// ---------------------------------------------------------------- Fechas

const MS = 86_400_000;
export const sumarDias = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * MS).toISOString().slice(0, 10);
/** 0 lunes … 6 domingo. */
export const diaSemana = (iso: string) => (new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7;
export const mesDe = (iso: string) => iso.slice(0, 7);
export const mesSiguiente = (mes: string, n: number) => {
  const [a, m] = mes.split('-').map(Number);
  const d = new Date(Date.UTC(a, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
};
export const nombreMes = (mes: string) => {
  const [a, m] = mes.split('-').map(Number);
  const t = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(a, m - 1, 1)));
  return t.charAt(0).toUpperCase() + t.slice(1).replace(' de ', ' ');
};
/** Las semanas (lunes a domingo) que cubren el mes, como fechas AAAA-MM-DD. */
export function semanasDelMes(mes: string): string[][] {
  const primero = `${mes}-01`;
  let d = sumarDias(primero, -diaSemana(primero));
  const semanas: string[][] = [];
  while (semanas.length === 0 || mesDe(d) === mes) {
    semanas.push(Array.from({ length: 7 }, (_, i) => sumarDias(d, i)));
    d = sumarDias(d, 7);
  }
  return semanas;
}

// ---------------------------------------------------------------- Armar el mes

export interface Propuesta {
  tema: TemaClase;
  clase1: string;
  clase2: string | null;
}

/**
 * Reparte los temas que siguen (los que aún no tienen fecha ni están hechos) en los días de clase
 * desde `desde` hasta `hasta`, saltando festivos. Con `porTema` 2, cada tema ocupa dos clases.
 */
export function armarMes(gm: GrupoMes, desde: string, hasta: string, dias: number[], porTema: 1 | 2): Propuesta[] {
  if (!gm.pensum || !dias.length) return [];
  const ocupados = new Set(gm.plan.filter((f) => f.clase1 || f.estado === 'hecho').map((f) => f.tema_id));
  const temas = temasDelPensum(gm.pensum).filter((t) => !ocupados.has(t.id));
  const yaTienenClase = new Set(clasesDe([gm]).map((c) => c.fecha));
  const fechas: string[] = [];
  for (let d = desde; d <= hasta; d = sumarDias(d, 1)) if (dias.includes(diaSemana(d)) && !festivo(d) && !yaTienenClase.has(d)) fechas.push(d);
  const salida: Propuesta[] = [];
  for (let i = 0; i + porTema <= fechas.length && salida.length < temas.length; i += porTema) {
    salida.push({ tema: temas[salida.length], clase1: fechas[i], clase2: porTema === 2 ? fechas[i + 1] : null });
  }
  return salida;
}

export async function guardarPropuesta(gm: GrupoMes, propuesta: Propuesta[]) {
  for (const p of propuesta) {
    await guardarPlan({ grupo_id: gm.g.id, cartilla_id: gm.cartilla, tema_id: p.tema.id, clase1: p.clase1, clase2: p.clase2, estado: estadoPorFechas(p.clase1) });
  }
}

/** Mueve una clase a otra fecha (la clase 2 nunca antes que la 1). */
export async function moverClase(c: ClaseDia, fecha: string) {
  const fila = { ...c.fila, [c.clase === 1 ? 'clase1' : 'clase2']: fecha };
  if (fila.estado !== 'hecho') fila.estado = estadoPorFechas(fila.clase1);
  await guardarPlan(fila);
}

export const esHoy = (iso: string) => iso === hoyCo();
