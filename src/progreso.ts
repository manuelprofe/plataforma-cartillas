// Única capa que lee y escribe el progreso del estudiante. Hoy guarda en el
// dispositivo; cuando exista el servidor, solo cambia este archivo.
import { useSyncExternalStore } from 'react';
import type { Palabra } from './tipos';

export interface RegistroMision {
  veces: number;
  mejorErrores: number;
  autoeval?: number;
  /** Veces que volvió a jugarla y lo hizo con menos errores. */
  mejoras?: number;
}

/**
 * Conductas que reconocen las Mission Stars (regla 5 de CLAUDE.md, escala de la tesis).
 * Las cuatro primeras las da la app; `participar` y `colaborar` las dará el docente desde su
 * modo (aún no existe) y nunca cuentan para abrir el puente. `anterior` solo aparece al migrar.
 */
export type Conducta = 'completar' | 'pronunciar' | 'mejorar' | 'autoevaluar' | 'participar' | 'colaborar' | 'anterior';

/** Estrellas de cada conducta. No son contenido de una cartilla: son la regla de la plataforma. */
export const ESCALA: Record<Exclude<Conducta, 'anterior'>, number> = {
  completar: 15,
  pronunciar: 10,
  mejorar: 15,
  autoevaluar: 10,
  participar: 10,
  colaborar: 15,
};

/** Un reconocimiento. El registro solo crece: nunca se borra ni se cambia una entrada. */
export interface Estrella {
  conducta: Conducta;
  estrellas: number;
  /** Misión en que se ganó. Las del docente pueden no tenerla. */
  mision?: string;
  /** Día en que se ganó (AAAA-MM-DD, sin hora). Las migradas no lo traen. */
  dia?: string;
  /** Quién la dio. */
  origen: 'app' | 'docente';
}

export interface Progreso {
  /** Total de Mission Stars: siempre la suma de `registro`. */
  estrellas: number;
  /** De dónde salió cada estrella. Solo crece. */
  registro: Estrella[];
  /** Escenas de la historia que el niño ya vio. */
  vistas: string[];
  /** Misión que eligió visitar. */
  destino?: string;
  misiones: Record<string, RegistroMision>;
  /** Personaje elegido para recorrer el mundo. */
  heroe?: string;
  /** Estela elegida. */
  estela?: string;
  /** Palabras encontradas en el mundo. */
  album: Palabra[];
  /** Habitantes que ya recuperaron su palabra. */
  ayudados: string[];
  /** Habitante al que se le está buscando su palabra. */
  encargo?: string;
  /** Palabras de misión que le costaron: salen de aquí cuando las vuelve a hacer sin tropiezo. */
  repasar: Palabra[];
}

/** Lo que se reconoce al terminar una misión, para mostrarlo en el cierre. */
export interface Premio {
  clave: Conducta;
  estrellas: number;
}

const CLAVE = 'pc_progreso_v4';
/** Progreso de antes de la opción B (estrellas por misión, sin registro). Se lee una vez y no se borra. */
const CLAVE_V3 = 'pc_progreso_v3';
const VACIO: Progreso = { estrellas: 0, registro: [], vistas: [], misiones: {}, album: [], ayudados: [], repasar: [] };

/**
 * Cuánto vale una estrella de antes en la escala nueva. Las estelas pedían 12, 26 y 40 y ahora
 * piden 100, 225 y 350 (herramientas/construir_bosque.py): 350 / 40 es la mayor de esas
 * razones, así que con ella toda estela que ya estaba abierta sigue abierta.
 */
const CAMBIO_V3 = 8.75;

const sumar = (registro: Estrella[]) => registro.reduce((a, e) => a + e.estrellas, 0);
const hoy = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Pasa el progreso anterior a la escala de la tesis sin que nadie pierda nada: cada misión ya
 * completada vale lo que valdría hoy (completar, mejorar si la repitió mejor, autoevaluarse si
 * eligió carita). Las de pronunciar se reconocen al cargar la cartilla (`reconocerVoz`), que es
 * quien sabe cuáles misiones son de voz. Si aun así la suma quedara por debajo de lo que
 * tenía llevado a la escala nueva, la diferencia se conserva como `anterior`.
 */
export function migrarV3(viejo: Partial<Progreso>): Progreso {
  const registro: Estrella[] = [];
  for (const [mision, r] of Object.entries(viejo.misiones ?? {})) {
    registro.push({ conducta: 'completar', estrellas: ESCALA.completar, mision, origen: 'app' });
    if (r.mejoras) registro.push({ conducta: 'mejorar', estrellas: ESCALA.mejorar, mision, origen: 'app' });
    if (r.autoeval) registro.push({ conducta: 'autoevaluar', estrellas: ESCALA.autoevaluar, mision, origen: 'app' });
  }
  const falta = Math.ceil((viejo.estrellas ?? 0) * CAMBIO_V3) - sumar(registro);
  if (falta > 0) registro.push({ conducta: 'anterior', estrellas: falta, origen: 'app' });
  return { ...VACIO, ...viejo, registro, estrellas: sumar(registro) };
}

function leer(): Progreso {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (crudo) return { ...VACIO, ...JSON.parse(crudo) };
    const anterior = localStorage.getItem(CLAVE_V3);
    if (anterior) {
      const migrado = migrarV3(JSON.parse(anterior));
      localStorage.setItem(CLAVE, JSON.stringify(migrado));
      return migrado;
    }
  } catch {
    // Almacenamiento bloqueado o dañado: se empieza de cero sin romper la app.
  }
  return VACIO;
}

let estado = leer();
const oyentes = new Set<() => void>();

function guardar(nuevo: Progreso) {
  estado = nuevo;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(nuevo));
  } catch {
    // Sin almacenamiento el progreso vive solo en memoria durante la sesión.
  }
  oyentes.forEach((f) => f());
}

export function useProgreso(): Progreso {
  return useSyncExternalStore(
    (f) => {
      oyentes.add(f);
      return () => oyentes.delete(f);
    },
    () => estado,
  );
}

export function marcarVista(escena: string) {
  if (!estado.vistas.includes(escena)) guardar({ ...estado, vistas: [...estado.vistas, escena] });
}

export function fijarDestino(mision: string | undefined) {
  guardar({ ...estado, destino: mision });
}

export function elegirHeroe(id: string) {
  guardar({ ...estado, heroe: id });
}

export function elegirEstela(id: string) {
  guardar({ ...estado, estela: id });
}

/** Guarda una palabra en el álbum. Devuelve si era nueva. */
export function agregarAlAlbum(palabra: Palabra): boolean {
  if (estado.album.some((p) => p.en === palabra.en)) return false;
  guardar({ ...estado, album: [...estado.album, palabra] });
  return true;
}

export function fijarEncargo(habitante: string | undefined) {
  if (estado.encargo !== habitante) guardar({ ...estado, encargo: habitante });
}

export function marcarAyudado(habitante: string) {
  if (!estado.ayudados.includes(habitante)) guardar({ ...estado, ayudados: [...estado.ayudados, habitante], encargo: undefined });
}

/** Agrega reconocimientos al registro. Es la única forma de cambiar las estrellas: solo suma. */
function conEstrellas(base: Progreso, nuevas: Estrella[]): Progreso {
  if (!nuevas.length) return base;
  const registro = [...base.registro, ...nuevas];
  return { ...base, registro, estrellas: sumar(registro) };
}

const yaTiene = (conducta: Conducta, mision: string, dia?: string) =>
  estado.registro.some((e) => e.conducta === conducta && e.mision === mision && (dia === undefined || e.dia === dia));

// Si en la práctica que se acaba de anotar alguna palabra salió de la lista de repaso.
// `anotarPractica` se llama justo antes de `registrarMision`, que lo reconoce como mejora.
let salioDeRepasar = false;

/**
 * Anota cómo le fue con cada palabra de una misión: las que le costaron quedan para repasar
 * y las que salieron sin tropiezo se quitan de esa lista. Es para el resumen de la familia
 * y del docente; nunca quita estrellas.
 */
export function anotarPractica(bien: Palabra[], costaron: Palabra[]) {
  const fuera = new Set(bien.map((p) => p.en));
  const quedan = estado.repasar.filter((p) => !fuera.has(p.en));
  salioDeRepasar = quedan.length < estado.repasar.length;
  const nuevas = costaron.filter((p) => !quedan.some((q) => q.en === p.en));
  guardar({ ...estado, repasar: [...quedan, ...nuevas] });
}

/**
 * Registra una misión terminada y devuelve lo que se reconoce (cada cosa, una vez por misión):
 * completarla la primera vez; pronunciar, si el juego dice que hubo intento de voz; y corregir y
 * mejorar, si la repitió con menos tropiezos o una palabra salió de su lista de repaso.
 */
export function registrarMision(id: string, errores: number, pronuncio = false): Premio[] {
  const previo = estado.misiones[id];
  const dia = hoy();
  const nuevas: Estrella[] = [];
  const dar = (conducta: Exclude<Conducta, 'anterior'>) => nuevas.push({ conducta, estrellas: ESCALA[conducta], mision: id, dia, origen: 'app' });
  if (!previo) dar('completar');
  if (pronuncio && !yaTiene('pronunciar', id)) dar('pronunciar');
  const mejoro = (previo !== undefined && errores < previo.mejorErrores) || salioDeRepasar;
  if (mejoro && !yaTiene('mejorar', id)) dar('mejorar');
  salioDeRepasar = false;
  guardar(
    conEstrellas(
      {
        ...estado,
        misiones: {
          ...estado.misiones,
          [id]: {
            veces: (previo?.veces ?? 0) + 1,
            mejorErrores: Math.min(errores, previo?.mejorErrores ?? Infinity),
            autoeval: previo?.autoeval,
            mejoras: (previo?.mejoras ?? 0) + (mejoro ? 1 : 0),
          },
        },
      },
      nuevas,
    ),
  );
  return nuevas.map((e) => ({ clave: e.conducta, estrellas: e.estrellas }));
}

/**
 * Guarda cómo se sintió con una misión ya registrada. Autoevaluarse se reconoce una vez por
 * misión y por día, para que no se acumule repitiendo.
 */
export function fijarAutoevaluacion(id: string, autoeval: number): Premio | null {
  const previo = estado.misiones[id];
  if (!previo) return null;
  const dia = hoy();
  const nueva: Estrella | null = yaTiene('autoevaluar', id, dia) ? null : { conducta: 'autoevaluar', estrellas: ESCALA.autoevaluar, mision: id, dia, origen: 'app' };
  if (!nueva && previo.autoeval === autoeval) return null;
  guardar(conEstrellas({ ...estado, misiones: { ...estado.misiones, [id]: { ...previo, autoeval } } }, nueva ? [nueva] : []));
  return nueva && { clave: nueva.conducta, estrellas: nueva.estrellas };
}

/**
 * Reconoce "pronunciar" en las misiones de voz ya completadas que aún no lo tienen (progreso
 * de antes de la opción B). Lo llama la app al cargar la cartilla; repetirlo no suma dos veces.
 */
export function reconocerVoz(misionesDeVoz: string[]) {
  const nuevas = misionesDeVoz
    .filter((id) => estado.misiones[id] && !yaTiene('pronunciar', id))
    .map((id): Estrella => ({ conducta: 'pronunciar', estrellas: ESCALA.pronunciar, mision: id, origen: 'app' }));
  if (nuevas.length) guardar(conEstrellas(estado, nuevas));
}

export function reiniciarProgreso() {
  guardar(VACIO);
}
