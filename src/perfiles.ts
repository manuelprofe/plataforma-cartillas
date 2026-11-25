// Niños que ya entraron con su tarjeta en este aparato (celular de la familia) y los códigos de
// grupo que el aparato recuerda. Junto con progreso.ts es la capa de datos del modo estudiante:
// ningún componente toca el almacenamiento. Lo que necesita Supabase (consultar un código,
// comprobar un PIN, subir la cola) lo hace src/nube.ts, que se importa bajo demanda: nunca
// entra en la primera carga de `/`.
import { useSyncExternalStore } from 'react';
import { CARTILLA_PREDETERMINADA, esIdCartilla } from './cartillas';
import { descartarDeCola, INVITADO, leerCola, olvidarProgreso, perfilActivo, progresoDe, sumarInvitadoA, usarPerfil } from './progreso';

// Vista previa de una cartilla que aún no está publicada: `/?cartilla=matematicas-0` la abre como
// invitado en esta pestaña (sin cuenta, sin datos). Sirve para que el dueño la pruebe antes de
// publicarla; los niños con perfil siempre juegan la de su grupo.
const CARTILLA_PRUEBA = (() => {
  try {
    const pedida = new URLSearchParams(location.search).get('cartilla');
    if (esIdCartilla(pedida)) sessionStorage.setItem('pc_cartilla_prueba', pedida);
    const v = sessionStorage.getItem('pc_cartilla_prueba');
    return esIdCartilla(v) ? v : null;
  } catch {
    return null;
  }
})();

/** Hay dirección y clave pública de Supabase en esta copia (sin ellas, solo se juega sin tarjeta). */
export const hayNube = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_CLAVE_PUBLICA);

/** Un niño del grupo, como lo devuelve `lista_grupo`. */
export interface Cara {
  id: string;
  apodo: string;
  avatar: string;
  grupo: string;
  /** Cartilla del grupo (migración 004). Sin ella, la predeterminada. */
  cartilla?: string;
}

export interface PerfilNino extends Cara {
  codigo: string;
  /** Huella del PIN para entrar sin red (decisión 3 de esqueleto.md §9): se guarda tras entrar con red. */
  huella?: { sal: string; valor: string };
  /** PIN errados sin red desde el último acierto, y hasta cuándo descansa. */
  fallos?: number;
  esperaHasta?: number;
  /** Cuántas misiones tenía el invitado cuando este niño dijo "No, no lo recorrí yo". */
  noEsMio?: number;
}

export type Entrada = 'ok' | 'errado' | 'descanso' | 'ayuda' | 'no-existe' | 'sin-red';

const LLAVE = 'pc_perfiles_v1';
const LLAVE_CODIGOS = 'pc_codigos_v1';
const FALLOS_SIN_RED = 5;
const DESCANSO_SIN_RED_MS = 5 * 60_000;

function leer<T>(llave: string, vacio: T): T {
  try {
    const v = JSON.parse(localStorage.getItem(llave) ?? 'null') as T | null;
    return Array.isArray(v) ? v : vacio;
  } catch {
    return vacio;
  }
}

function escribir(llave: string, valor: unknown) {
  try {
    localStorage.setItem(llave, JSON.stringify(valor));
  } catch {
    // Sin almacenamiento: los perfiles duran lo que dure la pestaña.
  }
}

let perfiles: PerfilNino[] = leer(LLAVE, []);
const oyentes = new Set<() => void>();

function guardar(nuevos: PerfilNino[]) {
  perfiles = nuevos;
  escribir(LLAVE, nuevos);
  oyentes.forEach((f) => f());
}

// Un perfil que ya no está en el aparato no puede seguir activo.
if (perfilActivo() !== INVITADO && !perfiles.some((p) => p.id === perfilActivo())) usarPerfil(INVITADO);

export function usePerfiles(): PerfilNino[] {
  return useSyncExternalStore(
    (f) => {
      oyentes.add(f);
      return () => oyentes.delete(f);
    },
    () => perfiles,
  );
}

export const perfilDe = (id: string) => perfiles.find((p) => p.id === id);

/** La cartilla que juega un perfil: la de su grupo; el invitado juega la predeterminada. */
export function cartillaDe(id: string): string {
  const c = perfilDe(id)?.cartilla;
  return esIdCartilla(c) ? c : id === INVITADO ? CARTILLA_PRUEBA ?? CARTILLA_PREDETERMINADA : CARTILLA_PREDETERMINADA;
}

function actualizar(id: string, cambio: Partial<PerfilNino>) {
  guardar(perfiles.map((p) => (p.id === id ? { ...p, ...cambio } : p)));
}

/** Misiones que tiene el invitado. */
export const misionesInvitado = () => Object.keys(progresoDe(INVITADO).misiones).length;
/** El invitado ya jugó algo (o eligió personaje): su cara cuenta como un perfil más. */
export const invitadoUsado = () => {
  const p = progresoDe(INVITADO);
  return Boolean(p.heroe) || Object.keys(p.misiones).length > 0;
};

// ---------------------------------------------------------------- Códigos de grupo

export interface Codigo {
  codigo: string;
  grupo: string;
}

export const codigosRecordados = (): Codigo[] => leer(LLAVE_CODIGOS, []);

function recordarCodigo(c: Codigo) {
  escribir(LLAVE_CODIGOS, [c, ...codigosRecordados().filter((x) => x.codigo !== c.codigo)].slice(0, 6));
}

/** Letras y números del código del grupo (sin los que se confunden), como en `nuevo_codigo()`. */
export const LETRAS_CODIGO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export type Busqueda = { tipo: 'ok'; caras: Cara[] } | { tipo: 'no-existe' } | { tipo: 'espera' } | { tipo: 'sin-red' };

/** Caras del grupo de un código. El aparato lo recuerda si existe. */
export async function buscarGrupo(codigo: string): Promise<Busqueda> {
  if (!hayNube || !navigator.onLine) return { tipo: 'sin-red' };
  const nube = await import('./nube');
  const r = await nube.listaGrupo(codigo);
  if (r.tipo === 'ok' && r.caras.length) recordarCodigo({ codigo, grupo: r.caras[0].grupo });
  return r.tipo === 'ok' && !r.caras.length ? { tipo: 'no-existe' } : r;
}

/** Adelanta la descarga del cliente de Supabase cuando ya se sabe que hará falta. */
export function prepararNube() {
  if (hayNube) void import('./nube').catch(() => undefined);
}

// ---------------------------------------------------------------- PIN

async function huellaDe(sal: string, id: string, pin: string): Promise<string> {
  const datos = new TextEncoder().encode(`${sal}:${id}:${pin}`);
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', datos));
  return [...h].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function salNueva() {
  const b = crypto.getRandomValues(new Uint8Array(16));
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Comprueba el PIN (tres imágenes, "0" a "9" cada una). Con red pregunta a Supabase, que lleva
 * la cuenta de errores y esperas; si responde 'ok', el niño queda guardado en el aparato con la
 * huella para entrar sin red. Sin red, compara con la huella guardada.
 */
export async function entrarConPin(nino: Cara & { codigo: string }, pin: string): Promise<Entrada> {
  const guardado = perfilDe(nino.id);
  if (guardado?.esperaHasta && guardado.esperaHasta > Date.now()) return 'descanso';
  if (hayNube && navigator.onLine) {
    const nube = await import('./nube');
    const r = await nube.entrar(nino.codigo, nino.id, pin);
    if (r !== 'red') {
      if (r === 'ok') {
        const sal = salNueva();
        const huella = { sal, valor: await huellaDe(sal, nino.id, pin) };
        const datos: PerfilNino = { ...guardado, id: nino.id, apodo: nino.apodo, avatar: nino.avatar, grupo: nino.grupo, cartilla: nino.cartilla ?? guardado?.cartilla, codigo: nino.codigo, huella, fallos: 0, esperaHasta: undefined };
        guardar(guardado ? perfiles.map((p) => (p.id === nino.id ? datos : p)) : [...perfiles, datos]);
        void nube.traer(nino.id).catch(() => undefined);
      }
      return r;
    }
  }
  if (!guardado?.huella) return 'sin-red';
  if ((await huellaDe(guardado.huella.sal, nino.id, pin)) === guardado.huella.valor) {
    actualizar(nino.id, { fallos: 0, esperaHasta: undefined });
    return 'ok';
  }
  const fallos = (guardado.fallos ?? 0) + 1;
  if (fallos < FALLOS_SIN_RED) {
    actualizar(nino.id, { fallos });
    return 'errado';
  }
  actualizar(nino.id, { fallos: 0, esperaHasta: Date.now() + DESCANSO_SIN_RED_MS });
  return 'descanso';
}

// ---------------------------------------------------------------- Invitado y cola

/** ¿Hay que preguntarle a este niño si el camino del invitado lo recorrió él? */
export function preguntarSiEsSuyo(id: string): boolean {
  const n = misionesInvitado();
  return n > 0 && n > (perfilDe(id)?.noEsMio ?? 0);
}

export function noEsMio(id: string) {
  actualizar(id, { noEsMio: misionesInvitado() });
}

export function sumarInvitado(id: string) {
  sumarInvitadoA(id);
  guardar(perfiles.map((p) => ({ ...p, noEsMio: undefined })));
  sincronizar();
}

let subiendo: Promise<void> | null = null;

/**
 * Sube la cola a Supabase si hay algo, hay red y no se está jugando una misión (la carita de
 * cierre todavía puede sumarse al envío). Nunca avisa al niño: si falla, sigue en la cola.
 */
export function sincronizar(): Promise<void> {
  if (subiendo) return subiendo;
  if (!hayNube || !navigator.onLine || location.pathname.startsWith('/mision/') || !leerCola().length) return Promise.resolve();
  subiendo = import('./nube')
    .then((n) => n.subir())
    .catch(() => undefined)
    .finally(() => {
      subiendo = null;
    });
  return subiendo;
}

/**
 * "Quitar de este celular" (zona de la familia): borra al niño y su avance del aparato, no de
 * su cuenta. Si tiene juego sin subir, o el servidor no pudo soltarlo, no se quita ('pendiente')
 * para no perder nada. Con `descartar` (el adulto ya confirmó) se tira lo pendiente y se quita.
 */
export async function quitarPerfil(id: string, descartar = false): Promise<'ok' | 'pendiente'> {
  if (descartar) descartarDeCola(id);
  else {
    await sincronizar();
    if (leerCola().some((e) => e.estudiante === id)) return 'pendiente';
  }
  if (hayNube && navigator.onLine) {
    try {
      await import('./nube').then((n) => n.soltar(id));
    } catch {
      if (!descartar) return 'pendiente';
    }
  }
  guardar(perfiles.filter((p) => p.id !== id));
  olvidarProgreso(id);
  return 'ok';
}
