// Única capa que lee y escribe el progreso del estudiante. Guarda en el aparato, un progreso
// por perfil (varios niños y un invitado en el mismo celular), y anota en una cola lo que los
// niños con cuenta deben subir a Supabase (lo sube src/nube.ts, que se carga bajo demanda).
// El progreso de siempre (`pc_progreso_v4`) es el del invitado: lo que había no se mueve.
import { useSyncExternalStore } from 'react';
import type { Palabra, Ranura } from './tipos';

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
  /** Identificador de la fila en Supabase, si vino de allá (para no traerla dos veces). */
  nube?: number;
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
  /** Accesorio que lleva puesto en cada ranura. */
  accesorios?: Partial<Record<Ranura, string>>;
  /** Accesorios que ya desenvolvió (los abiertos que no están aquí son nuevos). */
  accesoriosVistos?: string[];
  /** Palabras encontradas en el mundo. */
  album: Palabra[];
  /** Habitantes que ya recuperaron su palabra. */
  ayudados: string[];
  /** Habitante al que se le está buscando su palabra. */
  encargo?: string;
  /** Palabras de misión que le costaron: salen de aquí cuando las vuelve a hacer sin tropiezo. */
  repasar: Palabra[];
  /** Palabras (en inglés) que estuvieron en `repasar` y ya salieron: lo que ahora sí le sale. */
  superadas?: string[];
  /** Días en que completó alguna misión (AAAA-MM-DD, sin hora). */
  dias?: string[];
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

/** Perfil que juega sin tarjeta. Su progreso vive solo en el aparato. */
export const INVITADO = 'invitado';
const CLAVE_ACTIVO = 'pc_activo_v1';
const claveDe = (perfil: string) => (perfil === INVITADO ? CLAVE : `${CLAVE}:${perfil}`);

const sumar = (registro: Estrella[]) => registro.reduce((a, e) => a + e.estrellas, 0);
/** Fecha local sin hora, AAAA-MM-DD. */
export const diaDe = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const hoy = () => diaDe(new Date());

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

function leer(perfil: string): Progreso {
  try {
    const crudo = localStorage.getItem(claveDe(perfil));
    if (crudo) return { ...VACIO, ...JSON.parse(crudo) };
    if (perfil !== INVITADO) return VACIO;
    const anterior = localStorage.getItem(CLAVE_V3);
    if (anterior) {
      const migrado = migrarV3(JSON.parse(anterior));
      try {
        localStorage.setItem(CLAVE, JSON.stringify(migrado));
      } catch {
        // Sin espacio para guardar: igual se juega con lo migrado; la copia vieja sigue ahí.
      }
      return migrado;
    }
  } catch {
    // Almacenamiento bloqueado o dañado: se empieza de cero sin romper la app.
  }
  return VACIO;
}

function leerActivo(): { perfil: string; actividad: number } {
  try {
    const a = JSON.parse(localStorage.getItem(CLAVE_ACTIVO) ?? 'null') as { perfil?: unknown; actividad?: unknown } | null;
    if (a && typeof a.perfil === 'string') return { perfil: a.perfil, actividad: Number(a.actividad) || 0 };
  } catch {
    // Dañado o bloqueado: juega el invitado.
  }
  return { perfil: INVITADO, actividad: 0 };
}

let { perfil: activo, actividad } = leerActivo();
let estado = leer(activo);
const oyentes = new Set<() => void>();

function guardarActivo() {
  try {
    localStorage.setItem(CLAVE_ACTIVO, JSON.stringify({ perfil: activo, actividad }));
  } catch {
    // Sin almacenamiento: el perfil activo dura lo que dure la pestaña.
  }
}

/** Escribe el progreso de un perfil; si es el activo, también lo pinta. */
function escribir(perfil: string, nuevo: Progreso) {
  if (perfil === activo) estado = nuevo;
  try {
    localStorage.setItem(claveDe(perfil), JSON.stringify(nuevo));
  } catch {
    // Sin almacenamiento el progreso vive solo en memoria durante la sesión.
  }
  if (perfil === activo) oyentes.forEach((f) => f());
}

const guardar = (nuevo: Progreso) => escribir(activo, nuevo);

/** Perfil que está jugando ahora. */
export const perfilActivo = () => activo;

export function useActivo(): string {
  return useSyncExternalStore(
    (f) => {
      oyentes.add(f);
      return () => oyentes.delete(f);
    },
    () => activo,
  );
}

/** Cambia de jugador. El progreso de cada perfil queda guardado aparte. */
export function usarPerfil(perfil: string) {
  activo = perfil;
  estado = leer(perfil);
  actividad = Date.now();
  guardarActivo();
  oyentes.forEach((f) => f());
  if (misionesDeVoz.length) reconocerVoz(misionesDeVoz);
}

/** Progreso guardado de un perfil, sin cambiar de jugador (resumen de la familia, sumar invitado). */
export const progresoDe = (perfil: string): Progreso => (perfil === activo ? estado : leer(perfil));

/** Anota que alguien está usando la app (para volver a preguntar quién juega tras un rato quieto). */
export function marcarActividad() {
  const ahora = Date.now();
  if (ahora - actividad < 30_000) return;
  actividad = ahora;
  guardarActivo();
}

/** Momento del último uso (milisegundos). */
export const ultimaActividad = () => actividad;

/** Quita del aparato el progreso de un perfil (no el de su cuenta). */
export function olvidarProgreso(perfil: string) {
  try {
    localStorage.removeItem(claveDe(perfil));
    localStorage.removeItem(respaldoDe(perfil));
  } catch {
    // Almacenamiento bloqueado: no hay nada que borrar.
  }
  if (perfil === activo) usarPerfil(INVITADO);
}

// ---------------------------------------------------------------- Cola para subir

/** Una misión terminada por un niño con cuenta, esperando subir a Supabase (`registrar_mision`). */
export interface Envio {
  /** Identificador propio: se quita de la cola solo cuando el servidor respondió. */
  id: string;
  estudiante: string;
  cartilla: string;
  mision: string;
  errores: number;
  autoeval?: number;
  intentos?: number;
}

const CLAVE_COLA = 'pc_cola_v1';
let cartillaId = '';

/** La cartilla que se está jugando (su id va en cada envío). */
export function fijarCartilla(id: string) {
  cartillaId = id;
}
export const cartillaActual = () => cartillaId;

export function leerCola(): Envio[] {
  try {
    const c = JSON.parse(localStorage.getItem(CLAVE_COLA) ?? '[]') as Envio[];
    return Array.isArray(c) ? c : [];
  } catch {
    return [];
  }
}

function guardarCola(cola: Envio[]) {
  try {
    if (cola.length) localStorage.setItem(CLAVE_COLA, JSON.stringify(cola));
    else localStorage.removeItem(CLAVE_COLA);
  } catch {
    // Sin almacenamiento la cola vive en memoria: se pierde al cerrar, el progreso local no.
  }
}

const nuevoId = () => (typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

function encolar(envio: Omit<Envio, 'id' | 'cartilla' | 'estudiante'>, estudiante = activo) {
  if (estudiante === INVITADO || !cartillaId) return;
  guardarCola([...leerCola(), { id: nuevoId(), estudiante, cartilla: cartillaId, ...envio }]);
}

/** El servidor ya lo guardó (o no lo aceptará nunca): sale de la cola. */
export function quitarDeCola(id: string) {
  guardarCola(leerCola().filter((e) => e.id !== id));
}

/** El adulto descarta lo que un niño tenía pendiente de subir (al quitarlo de este celular). */
export function descartarDeCola(estudiante: string) {
  guardarCola(leerCola().filter((e) => e.estudiante !== estudiante));
}

/** Un intento fallido que no fue por falta de red. */
export function anotarIntento(id: string) {
  guardarCola(leerCola().map((e) => (e.id === id ? { ...e, intentos: (e.intentos ?? 0) + 1 } : e)));
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

/** Pone una pieza en su ranura, o la quita si no se da ninguna. Queda como vista. */
export function ponerAccesorio(ranura: Ranura, id: string | undefined) {
  const vistos = estado.accesoriosVistos ?? [];
  guardar({
    ...estado,
    accesorios: { ...estado.accesorios, [ranura]: id },
    accesoriosVistos: id && !vistos.includes(id) ? [...vistos, id] : vistos,
  });
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
  const salieron = estado.repasar.filter((p) => fuera.has(p.en)).map((p) => p.en);
  const superadas = [...new Set([...(estado.superadas ?? []), ...salieron])];
  guardar({ ...estado, repasar: [...quedan, ...nuevas], superadas });
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
  encolar({ mision: id, errores });
  guardar(
    conEstrellas(
      {
        ...estado,
        dias: estado.dias?.includes(dia) ? estado.dias : [...(estado.dias ?? []), dia],
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
  // La carita viaja con la misión que acaba de entrar en la cola; si esa ya subió, va sola.
  const cola = leerCola();
  let pendiente = cola.length - 1;
  while (pendiente >= 0 && !(cola[pendiente].estudiante === activo && cola[pendiente].mision === id)) pendiente--;
  if (pendiente >= 0) guardarCola(cola.map((e, i) => (i === pendiente ? { ...e, autoeval } : e)));
  else encolar({ mision: id, errores: previo.mejorErrores, autoeval });
  guardar(conEstrellas({ ...estado, misiones: { ...estado.misiones, [id]: { ...previo, autoeval } } }, nueva ? [nueva] : []));
  return nueva && { clave: nueva.conducta, estrellas: nueva.estrellas };
}

/**
 * Reconoce "pronunciar" en las misiones de voz ya completadas que aún no lo tienen (progreso
 * de antes de la opción B). Lo llama la app al cargar la cartilla; repetirlo no suma dos veces.
 */
let misionesDeVoz: string[] = [];
export function reconocerVoz(deVoz: string[]) {
  misionesDeVoz = deVoz;
  const nuevas = deVoz
    .filter((id) => estado.misiones[id] && !yaTiene('pronunciar', id))
    .map((id): Estrella => ({ conducta: 'pronunciar', estrellas: ESCALA.pronunciar, mision: id, origen: 'app' }));
  if (nuevas.length) guardar(conEstrellas(estado, nuevas));
}

// "Empezar de nuevo" se puede deshacer durante unos días: un niño que sepa leer puede llegar
// hasta el botón, y el avance de meses no debe perderse por un toque. La copia vive solo en
// este dispositivo y se borra sola al vencer.
const CLAVE_RESPALDO = 'pc_progreso_respaldo';
const DIAS_RESPALDO = 7;
function respaldoDe(perfil: string) {
  return perfil === INVITADO ? CLAVE_RESPALDO : `${CLAVE_RESPALDO}:${perfil}`;
}

function leerRespaldo(perfil = activo): Progreso | null {
  try {
    const crudo = localStorage.getItem(respaldoDe(perfil));
    if (!crudo) return null;
    const { fecha, progreso } = JSON.parse(crudo) as { fecha: number; progreso: Progreso };
    if (Date.now() - fecha < DIAS_RESPALDO * 86_400_000) return progreso;
    localStorage.removeItem(respaldoDe(perfil));
  } catch {
    // Almacenamiento bloqueado o copia dañada: no hay nada que recuperar.
  }
  return null;
}

export const hayAvanceBorrado = () => leerRespaldo() !== null;
/** El invitado tiene un avance que se puede recuperar (lo borraron o se sumó a un niño con tarjeta). */
export const hayRespaldoInvitado = () => leerRespaldo(INVITADO) !== null;

/** Guarda una copia del progreso de un perfil por 7 días, antes de vaciarlo. */
function respaldar(perfil: string, p: Progreso) {
  try {
    if (p.heroe || p.estrellas > 0 || Object.keys(p.misiones).length > 0) localStorage.setItem(respaldoDe(perfil), JSON.stringify({ fecha: Date.now(), progreso: p }));
  } catch {
    // Sin espacio no hay copia; se vacía igual.
  }
}

/** Devuelve el avance que se borró con "Empezar de nuevo". */
export function recuperarProgreso() {
  const copia = leerRespaldo();
  if (!copia) return;
  guardar({ ...VACIO, ...copia });
  try {
    localStorage.removeItem(respaldoDe(activo));
  } catch {
    // Nada que hacer.
  }
}

/** "Empezar de nuevo": solo para el invitado. Un niño con tarjeta se quita con `quitarPerfil`. */
export function reiniciarProgreso() {
  if (activo !== INVITADO) return;
  respaldar(INVITADO, estado);
  try {
    // Que no quede en el dispositivo la copia de antes de la opción B.
    localStorage.removeItem(CLAVE_V3);
  } catch {
    // Almacenamiento bloqueado: no hay nada que borrar.
  }
  guardar(VACIO);
}

// ---------------------------------------------------------------- Sumar avances

const porEn = <T extends { en: string }>(a: T[], b: T[]) => [...a, ...b.filter((x) => !a.some((y) => y.en === x.en))];
const union = (a: string[] = [], b: string[] = []) => [...new Set([...a, ...b])];

/** Clave con que una estrella se reconoce una sola vez (las del docente, por su fila). */
function claveEstrella(e: Estrella): string | null {
  if (e.nube !== undefined && e.origen === 'docente') return `n${e.nube}`;
  if (e.conducta === 'anterior') return null;
  if (e.conducta === 'autoevaluar') return `${e.conducta}|${e.mision}|${e.dia ?? ''}`;
  return e.mision ? `${e.conducta}|${e.mision}` : null;
}

/** Suma al registro de `base` lo de `otro` que no tenga ya: las estrellas se vuelven a contar con las reglas de siempre. */
function unirRegistro(base: Estrella[], otro: Estrella[], mismaConducta = false): Estrella[] {
  const vistas = new Set(base.map((e) => claveEstrella(e)).filter(Boolean));
  // Con la nube, autoevaluarse cuenta una vez por misión (así lo guarda el servidor).
  const yaAutoevaluada = (e: Estrella) => mismaConducta && e.conducta === 'autoevaluar' && base.some((b) => b.conducta === 'autoevaluar' && b.mision === e.mision);
  const nuevas = otro.filter((e) => {
    const k = claveEstrella(e);
    if (k && vistas.has(k)) return false;
    if (yaAutoevaluada(e)) return false;
    if (k) vistas.add(k);
    return true;
  });
  return [...base, ...nuevas];
}

function unirProgreso(cuenta: Progreso, otro: Progreso): Progreso {
  const misiones = { ...cuenta.misiones };
  for (const [id, r] of Object.entries(otro.misiones)) {
    const c = misiones[id];
    misiones[id] = c
      ? { veces: c.veces + r.veces, mejorErrores: Math.min(c.mejorErrores, r.mejorErrores), autoeval: c.autoeval ?? r.autoeval, mejoras: (c.mejoras ?? 0) + (r.mejoras ?? 0) }
      : r;
  }
  const registro = unirRegistro(cuenta.registro, otro.registro);
  return {
    ...cuenta,
    misiones,
    registro,
    estrellas: sumar(registro),
    vistas: union(cuenta.vistas, otro.vistas),
    heroe: cuenta.heroe ?? otro.heroe,
    estela: cuenta.estela ?? otro.estela,
    accesorios: cuenta.accesorios ?? otro.accesorios,
    accesoriosVistos: union(cuenta.accesoriosVistos, otro.accesoriosVistos),
    album: porEn(cuenta.album, otro.album),
    ayudados: union(cuenta.ayudados, otro.ayudados),
    repasar: porEn(cuenta.repasar, otro.repasar),
    superadas: union(cuenta.superadas, otro.superadas),
    dias: union(cuenta.dias, otro.dias).sort(),
  };
}

/**
 * "¿Este camino lo recorriste tú?" — Sí: el avance del invitado se suma al del niño (farol
 * encendido en cualquiera de los dos lados queda encendido; álbum y repaso se unen) y el
 * invitado queda vacío. Sus misiones entran en la cola para que la cuenta las cuente también.
 */
export function sumarInvitadoA(perfil: string) {
  if (perfil === INVITADO) return;
  const invitado = progresoDe(INVITADO);
  escribir(perfil, unirProgreso(progresoDe(perfil), invitado));
  for (const [mision, r] of Object.entries(invitado.misiones)) encolar({ mision, errores: r.mejorErrores, ...(r.autoeval ? { autoeval: r.autoeval } : {}) }, perfil);
  // Con respaldo de 7 días: la familia puede deshacerlo (se ve en "Sin tarjeta").
  respaldar(INVITADO, invitado);
  escribir(INVITADO, VACIO);
}

/** Lo que la cuenta tiene en Supabase (de otro celular o del docente), en el formato de aquí. */
export interface AvanceNube {
  misiones: { mision_id: string; veces: number; mejor_errores: number; autoeval: number | null }[];
  estrellas: { id: number; motivo: Exclude<Conducta, 'anterior'>; cantidad: number; mision_id: string | null; creado: string; otorgada_por?: string | null }[];
}

/** Suma lo de la cuenta al progreso del aparato. Nunca quita nada de lo que ya había aquí. */
export function mezclarNube(perfil: string, nube: AvanceNube) {
  const base = progresoDe(perfil);
  const misiones = { ...base.misiones };
  for (const m of nube.misiones) {
    const c = misiones[m.mision_id];
    // Lo jugado aquí ya subió y está contado allá: se toma el mayor, no la suma.
    misiones[m.mision_id] = c
      ? { ...c, veces: Math.max(c.veces, m.veces), mejorErrores: Math.min(c.mejorErrores, m.mejor_errores), autoeval: c.autoeval ?? m.autoeval ?? undefined }
      : { veces: m.veces, mejorErrores: m.mejor_errores, ...(m.autoeval ? { autoeval: m.autoeval } : {}) };
  }
  const deLaNube = nube.estrellas.map(
    (e): Estrella => ({
      conducta: e.motivo,
      estrellas: e.cantidad,
      ...(e.mision_id ? { mision: e.mision_id } : {}),
      dia: e.creado.slice(0, 10),
      origen: e.otorgada_por || e.motivo === 'participar' || e.motivo === 'colaborar' ? 'docente' : 'app',
      nube: e.id,
    }),
  );
  const registro = unirRegistro(base.registro, deLaNube, true);
  const dias = union(base.dias, deLaNube.filter((e) => e.origen === 'app' && e.dia).map((e) => e.dia!)).sort();
  escribir(perfil, { ...base, misiones, registro, estrellas: sumar(registro), dias });
}
