// Armador de planeaciones: con la duración, el tema y las actividades que elige el docente, arma
// un planeador en el formato único (el mismo de los planeadores de la cartilla: pantalla,
// impresión y Word). Las actividades son plantillas (actividades.json) que se llenan con las
// palabras del tema. Las planeaciones se guardan en este aparato y solo las ve quien las hizo.
import { useMemo, useSyncExternalStore } from 'react';
import { conDueno, esMia, quitarCreacion, subirCreacion, type Creacion, type FuenteCreaciones } from '../adultos/nubeCreaciones';
import { repartir, type Duracion } from '../materiales/duracion';
import type { Bloque, Material, Referentes, TemaDoc } from '../materiales/datos';
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

export interface Plan extends Creacion {
  id: string;
  creada: string;
  cartilla: string;
  tema: string;
  nombreTema: string;
  duracion: Duracion;
  actividades: string[];
  /** `pensum`: el tema es una unidad del pensum de la cartilla (sin láminas propias todavía). */
  fuente?: 'pensum';
  /** Día en que se dará (AAAA-MM-DD), puesto en "Mi mes". */
  fecha?: string;
}

/** Lo que una unidad del pensum pone en la planeación cuando el tema no trae palabras ni láminas. */
export interface DelPensum {
  palabras: string;
  referentes: Referentes;
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
export function armarMaterial(plan: Plan, tema: TemaDoc, pensum?: DelPensum): Material {
  const palabras = pensum?.palabras ?? palabrasDe(tema, plan.cartilla);
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
      momento: laminas || !pensum
        ? `**Apertura.** Salude y cuente qué se aprende hoy: ${tema.nombre.toLowerCase()}. Muestre las láminas (${palabras}) y diga cada una una vez; el grupo escucha y señala.`
        : `**Apertura.** Salude y cuente qué se aprende hoy: ${tema.nombre.toLowerCase()}. Muestre con objetos del salón o dibujos en el tablero (${palabras}) y pregunte qué saben; el grupo mira, escucha y señala.`,
      ritmo: 'mirar',
      material: laminas || !pensum ? `Láminas de ${tema.nombre.toLowerCase()}` : 'Objetos del salón o dibujos en el tablero',
      observar: 'Quién mira y señala sin que se le pida',
      sinProyector: laminas || !pensum ? 'Láminas impresas en el tablero' : 'Igual: no usa proyector',
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
      momento: `**Cierre.** Repasen en coro ${pensum ? 'lo que aprendieron hoy' : 'tres palabras de hoy'}. Cada niño muestra con la mano cómo se sintió (arriba, en medio, abajo) y dice qué le gustó.`,
      ritmo: 'autoevaluar',
      material: pensum ? 'Nada' : 'Láminas del tema',
      observar: pensum ? 'Cómo se sienten; qué recuerdan del tema' : 'Cómo se sienten; qué palabra recuerdan',
      sinProyector: 'Igual: no usa proyector',
    },
  ];
  if (transiciones) momentos.splice(momentos.length - 1, 0, { tipo: 'momento', minutos: transiciones, momento: '**Transiciones.**', ritmo: '', material: '', observar: '', sinProyector: '' });

  const referentes = pensum?.referentes ?? tema.materiales.find((m) => m.tipo === 'planeador' && m.referentes)?.referentes;
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

/** Las planeaciones como creaciones del docente: se guardan aquí y suben a su cuenta. */
export const fuentePlanes: FuenteCreaciones<Plan> = {
  tipo: 'planeacion',
  leer: () => planes,
  poner: (lista) => escribir([...lista].sort((a, b) => b.creada.localeCompare(a.creada))),
};

export function guardarPlan(p: Omit<Plan, 'id' | 'creada'>): Plan {
  const plan: Plan = conDueno({ ...p, id: `p${Date.now().toString(36)}`, creada: new Date().toISOString() });
  escribir([plan, ...planes]);
  void subirCreacion(fuentePlanes, plan);
  return plan;
}

/** Pone o quita la fecha de una planeación ("Mi mes") y la sube a la cuenta. */
export function ponerFechaPlan(id: string, fecha: string | null) {
  const plan = planes.find((p) => p.id === id);
  if (!plan) return;
  const nuevo: Plan = { ...plan, nube: undefined };
  if (fecha) nuevo.fecha = fecha;
  else delete nuevo.fecha;
  escribir(planes.map((p) => (p.id === id ? nuevo : p)));
  void subirCreacion(fuentePlanes, nuevo);
}

export function borrarPlan(id: string) {
  const plan = planes.find((p) => p.id === id);
  escribir(planes.filter((p) => p.id !== id));
  if (plan) void quitarCreacion('planeacion', plan);
}

export function useMisPlanes(): Plan[] {
  const todos = useSyncExternalStore(
    (f) => {
      oyentes.add(f);
      return () => oyentes.delete(f);
    },
    () => planes,
    () => planes,
  );
  // En un aparato compartido, cada docente ve solo las suyas.
  return useMemo(() => todos.filter((p) => esMia(p)), [todos]);
}
