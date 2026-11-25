// Armador de planeaciones: con la duración, el tema y las actividades que elige el docente, arma
// un planeador en el formato único (el mismo de los planeadores de la cartilla: pantalla,
// impresión y Word). Las actividades son plantillas (actividades.json) que se llenan con las
// palabras del tema. Las planeaciones se guardan en este aparato y solo las ve quien las hizo.
import { useSyncExternalStore } from 'react';
import { repartir, type Duracion } from '../materiales/duracion';
import type { Bloque, Material, TemaDoc } from '../materiales/datos';
import datos from './actividades.json';

export interface Actividad {
  id: string;
  nombre: string;
  fase: 'inicio' | 'desarrollo' | 'cierre';
  usa: 'laminas' | 'juego' | null;
  desdeGrado?: number;
  paraQue: string;
  necesita: string;
  pasos: string[];
  dice: string;
  minutos: Record<'45' | '55' | '90', number>;
  sinProyector: string;
  conProyector: string;
  observar: string;
}

export const ACTIVIDADES = datos.actividades as Actividad[];

/** Cuántas actividades se sugieren por duración (el docente puede elegir de 1 a 4). */
export const SUGERIDAS: Record<Duracion, number> = { 45: 2, 55: 2, 90: 3 };
/** Orden en que se sugieren: de lo más conocido y fácil a lo que pide más preparación. */
const ORDEN_SUGERIDO = ['simon', 'bingo', 'escalera', 'tingo', 'proyectado', 'memoria', 'tienda'];

export function sugeridas(n: number, grado: number): string[] {
  return ORDEN_SUGERIDO.filter((id) => (ACTIVIDADES.find((a) => a.id === id)?.desdeGrado ?? 0) <= grado).slice(0, n);
}

export interface Plan {
  id: string;
  creada: string;
  cartilla: string;
  tema: string;
  nombreTema: string;
  duracion: Duracion;
  actividades: string[];
}

type Momento = Extract<Bloque, { tipo: 'momento' }>;

/** Las primeras palabras del tema, en el idioma de la cartilla. */
function palabrasDe(tema: TemaDoc, cartilla: string, n = 5) {
  const ingles = cartilla.startsWith('ingles');
  return tema.palabras
    .slice(0, n)
    .map((p) => (ingles ? p.en : p.es))
    .join(', ');
}

function llenar(t: string, tema: TemaDoc, palabras: string) {
  return t.split('{tema}').join(tema.nombre.toLowerCase()).split('{palabras}').join(palabras);
}

/** El planeador de una planeación armada, listo para el formato único. */
export function armarMaterial(plan: Plan, tema: TemaDoc): Material {
  const palabras = palabrasDe(tema, plan.cartilla);
  const existe = (id: string) => tema.materiales.some((m) => m.id === id);
  const laminas = existe(`${tema.id}-laminas`) ? [{ id: `${tema.id}-laminas`, texto: 'Láminas' }] : undefined;
  const elegidas = plan.actividades.map((id) => ACTIVIDADES.find((a) => a.id === id)).filter((a): a is Actividad => !!a);
  const orden = { inicio: 0, desarrollo: 1, cierre: 2 };
  elegidas.sort((a, b) => orden[a.fase] - orden[b.fase]);

  const apertura = plan.duracion === 90 ? 10 : 5;
  const cierre = 5;
  const transiciones = plan.duracion === 45 ? 0 : 5;
  const reparto = repartir(
    elegidas.map((a) => a.minutos[String(plan.duracion) as '45' | '55' | '90']),
    plan.duracion - apertura - cierre - transiciones,
    3,
  );

  const momentos: Momento[] = [
    {
      tipo: 'momento',
      fase: 'inicio',
      minutos: apertura,
      momento: `**Apertura.** Salude y cuente qué se aprende hoy: ${tema.nombre.toLowerCase()}. Muestre las láminas (${palabras}) y diga cada una una vez; el grupo escucha y señala.`,
      ritmo: 'mirar',
      material: `Láminas de ${tema.nombre.toLowerCase()}`,
      observar: 'Quién mira y señala sin que se le pida',
      sinProyector: 'Láminas impresas en el tablero',
      enlaces: laminas,
    },
    ...elegidas.map(
      (a, i): Momento => ({
        tipo: 'momento',
        fase: a.fase === 'inicio' ? 'inicio' : a.fase === 'cierre' ? 'cierre' : 'desarrollo',
        minutos: reparto[i],
        momento: `**${a.nombre}.** ${a.pasos.map((p, k) => `${k + 1}) ${llenar(p, tema, palabras)}`).join(' ')} Diga: "${a.dice}"`,
        ritmo: 'jugar',
        material: `${llenar(a.necesita, tema, palabras)}. Con proyector: ${a.conProyector}`,
        observar: a.observar,
        sinProyector: a.sinProyector,
        enlaces: a.usa ? laminas : undefined,
      }),
    ),
    {
      tipo: 'momento',
      fase: 'cierre',
      minutos: cierre,
      momento: `**Cierre.** Repasen en coro tres palabras de hoy. Cada niño muestra con la mano cómo se sintió (arriba, en medio, abajo) y dice qué le gustó.`,
      ritmo: 'autoevaluar',
      material: 'Láminas del tema',
      observar: 'Cómo se sienten; qué palabra recuerdan',
      sinProyector: 'Igual: no usa proyector',
    },
  ];
  if (transiciones) momentos.splice(momentos.length - 1, 0, { tipo: 'momento', minutos: transiciones, momento: '**Transiciones.**', ritmo: '', material: '', observar: '', sinProyector: '' });

  const referentes = tema.materiales.find((m) => m.tipo === 'planeador' && m.referentes)?.referentes;
  return {
    id: plan.id,
    tipo: 'planeador',
    tema: tema.id,
    titulo: `Clase de ${plan.duracion} min: ${elegidas.map((a) => a.nombre).join(', ')}`,
    subtitulo: `Mi planeación · ${tema.nombre}`,
    privacidad: 'publico',
    formatos: { proyectar: 'no', imprimir: 'carta', copias: 1 },
    referentes,
    duracionFija: true,
    bloques: [...momentos, { tipo: 'nota', id: 'notas', texto: '', etiqueta: 'Notas del docente' }],
  };
}

// ---------------------------------------------------------------- Mis planeaciones (en este aparato)

const LLAVE = 'cuaderno.mis-planeaciones';
const oyentes = new Set<() => void>();

function leer(): Plan[] {
  try {
    const v = JSON.parse(localStorage.getItem(LLAVE) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
let planes = leer();

function escribir(nuevos: Plan[]) {
  planes = nuevos;
  try {
    localStorage.setItem(LLAVE, JSON.stringify(nuevos));
  } catch {
    /* sin almacenamiento: vale para esta visita */
  }
  oyentes.forEach((f) => f());
}

export function guardarPlan(p: Omit<Plan, 'id' | 'creada'>): Plan {
  const plan: Plan = { ...p, id: `p${Date.now().toString(36)}`, creada: new Date().toISOString() };
  escribir([plan, ...planes]);
  return plan;
}

export function borrarPlan(id: string) {
  escribir(planes.filter((p) => p.id !== id));
}

export function useMisPlanes(): Plan[] {
  return useSyncExternalStore(
    (f) => {
      oyentes.add(f);
      return () => oyentes.delete(f);
    },
    () => planes,
    () => planes,
  );
}
