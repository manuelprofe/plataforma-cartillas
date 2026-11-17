// Capa de datos de la cuenta del adulto: la única que habla con Supabase y guarda la sesión.
// Cliente mínimo con fetch (Auth y PostgREST) en vez de @supabase/supabase-js: usamos seis
// llamadas y la librería agregaría unos 45 KB comprimidos y una dependencia al paquete de adultos.
// Solo la importa el paquete de adultos: el celular del niño nunca la descarga.
import { useSyncExternalStore } from 'react';

const URL_SB = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/+$/, '');
const CLAVE_PUBLICA = import.meta.env.VITE_SUPABASE_CLAVE_PUBLICA as string | undefined;
/** Esta copia de la app se compiló con la dirección y la clave pública de Supabase. */
export const configurada = Boolean(URL_SB && CLAVE_PUBLICA);

const LLAVE = 'pc_adulto_v1';
const ESPERA_MS = 12000;

export type Rol = 'dueno' | 'coordinador' | 'docente';
export interface Perfil {
  rol: Rol;
  nombre: string;
  colegio_id: string | null;
}

/** Inicio de cada rol. Un adulto que entra a la sección de otro rol vuelve aquí. */
export const INICIO: Record<Rol, string> = { dueno: '/plataforma', coordinador: '/colegio', docente: '/docente' };

interface Sesion {
  access: string;
  refresh: string;
  /** Milisegundos (época) en que vence el token de acceso. */
  vence: number;
  correo?: string;
  perfil?: Perfil;
}

export type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'fuera' }
  /** Con sesión, pero sin rol: invitación sin aceptar o acceso desactivado. */
  | { tipo: 'sin-acceso'; correo?: string }
  /** `sinRed`: entró con lo último que tenía guardado; solo lectura. */
  | { tipo: 'dentro'; perfil: Perfil; correo?: string; sinRed: boolean };

export type Falla = 'red' | 'credenciales' | 'clave-corta' | 'misma-clave' | 'enlace' | 'sin-config' | 'otro';

export class ErrorCuenta extends Error {
  constructor(public falla: Falla, detalle = '') {
    super(detalle || falla);
  }
}

// ---------------------------------------------------------------- Estado observable

let estado: Estado = { tipo: 'cargando' };
const oyentes = new Set<() => void>();

function poner(nuevo: Estado) {
  estado = nuevo;
  oyentes.forEach((o) => o());
}

/** Estado de la cuenta; el componente se vuelve a pintar cuando cambia. */
export function useCuenta(): Estado {
  return useSyncExternalStore(
    (o) => {
      oyentes.add(o);
      return () => oyentes.delete(o);
    },
    () => estado,
  );
}

// ---------------------------------------------------------------- Almacenamiento

function leerSesion(): Sesion | null {
  try {
    const s = JSON.parse(localStorage.getItem(LLAVE) ?? 'null') as Sesion | null;
    return s && typeof s.access === 'string' && typeof s.refresh === 'string' ? s : null;
  } catch {
    return null;
  }
}

function guardarSesion(s: Sesion | null) {
  try {
    if (s) localStorage.setItem(LLAVE, JSON.stringify(s));
    else localStorage.removeItem(LLAVE);
  } catch {
    // Almacenamiento lleno o bloqueado: la sesión dura lo que dure la pestaña.
  }
}

let sesion: Sesion | null = null;

// ---------------------------------------------------------------- HTTP

interface Respuesta {
  ok: boolean;
  status: number;
  datos: unknown;
}

async function pedir(ruta: string, opciones: { metodo?: string; cuerpo?: unknown; token?: string; cabeceras?: Record<string, string> } = {}): Promise<Respuesta> {
  if (!configurada) throw new ErrorCuenta('sin-config');
  if (!navigator.onLine) throw new ErrorCuenta('red');
  let r: Response;
  try {
    r = await fetch(URL_SB + ruta, {
      method: opciones.metodo ?? (opciones.cuerpo === undefined ? 'GET' : 'POST'),
      headers: {
        apikey: CLAVE_PUBLICA!,
        'Content-Type': 'application/json',
        ...(opciones.token ? { Authorization: `Bearer ${opciones.token}` } : {}),
        ...opciones.cabeceras,
      },
      body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo),
      signal: AbortSignal.timeout(ESPERA_MS),
    });
  } catch {
    throw new ErrorCuenta('red');
  }
  const texto = await r.text();
  let datos: unknown = null;
  try {
    datos = texto ? JSON.parse(texto) : null;
  } catch {
    datos = texto;
  }
  return { ok: r.ok, status: r.status, datos };
}

const campo = (datos: unknown, nombre: string): string => {
  const v = datos && typeof datos === 'object' ? (datos as Record<string, unknown>)[nombre] : undefined;
  return typeof v === 'string' ? v : '';
};

/** Convierte la respuesta de /auth/v1/token en sesión. */
function sesionDe(datos: unknown, previa?: Sesion | null): Sesion {
  const d = datos as { access_token: string; refresh_token: string; expires_in?: number; expires_at?: number; user?: { email?: string } };
  const vence = d.expires_at ? d.expires_at * 1000 : Date.now() + (d.expires_in ?? 3600) * 1000;
  return { access: d.access_token, refresh: d.refresh_token, vence, correo: d.user?.email ?? previa?.correo, perfil: previa?.perfil };
}

/** Renueva el token de acceso. Devuelve false si la sesión ya no sirve. */
async function renovar(): Promise<boolean> {
  if (!sesion) return false;
  const r = await pedir('/auth/v1/token?grant_type=refresh_token', { cuerpo: { refresh_token: sesion.refresh } });
  if (!r.ok) return false;
  sesion = sesionDe(r.datos, sesion);
  guardarSesion(sesion);
  return true;
}

/** Token vigente, renovándolo si le queda menos de un minuto. */
async function token(): Promise<string> {
  if (!sesion) throw new ErrorCuenta('credenciales');
  if (sesion.vence - Date.now() < 60_000 && !(await renovar())) {
    cerrarLocal();
    throw new ErrorCuenta('credenciales');
  }
  return sesion.access;
}

/** Llama una función de la base de datos (`supabase/migraciones`). */
export async function rpc<T>(funcion: string, args: Record<string, unknown> = {}): Promise<T> {
  const r = await pedir(`/rest/v1/rpc/${funcion}`, { cuerpo: args, token: await token() });
  if (!r.ok) throw new ErrorCuenta('otro', campo(r.datos, 'message') || `HTTP ${r.status}`);
  return r.datos as T;
}

/** Lee filas de una tabla con la sintaxis de PostgREST (`select=...&id=eq...`). La seguridad por filas decide qué vuelve. */
export async function leer<T>(tabla: string, consulta: string): Promise<T[]> {
  const r = await pedir(`/rest/v1/${tabla}?${consulta}`, { token: await token() });
  if (!r.ok) throw new ErrorCuenta('otro', campo(r.datos, 'message') || `HTTP ${r.status}`);
  return r.datos as T[];
}

// ---------------------------------------------------------------- Perfil

/** Pide el perfil al servidor y fija el estado. Sin perfil activo intenta aceptar una invitación. */
async function cargarPerfil(): Promise<void> {
  const filas = await leer<Perfil & { activo: boolean }>('perfiles', 'select=rol,nombre,colegio_id,activo');
  let fila = filas[0];
  if (!fila) {
    const rol = await rpc<Rol | null>('aceptar_invitacion');
    if (rol) fila = (await leer<Perfil & { activo: boolean }>('perfiles', 'select=rol,nombre,colegio_id,activo'))[0];
  }
  if (!sesion) return;
  if (!fila || !fila.activo) {
    sesion.perfil = undefined;
    guardarSesion(sesion);
    poner({ tipo: 'sin-acceso', correo: sesion.correo });
    return;
  }
  sesion.perfil = { rol: fila.rol, nombre: fila.nombre, colegio_id: fila.colegio_id };
  guardarSesion(sesion);
  poner({ tipo: 'dentro', perfil: sesion.perfil, correo: sesion.correo, sinRed: false });
}

let vigilando = false;

/**
 * Al abrir la app: recupera la sesión guardada. Sin red, entra con el último perfil (solo
 * lectura) y vuelve a comprobarlo cuando regresa la señal. Si la sesión viene del enlace de
 * una invitación, aceptarla es parte de cargar el perfil.
 */
export async function iniciar(): Promise<void> {
  if (!vigilando) {
    vigilando = true;
    window.addEventListener('online', () => {
      if (estado.tipo === 'dentro' && estado.sinRed) void iniciar();
    });
  }
  sesion = leerSesion();
  if (!sesion) return poner({ tipo: 'fuera' });
  const guardado = sesion.perfil;
  if (guardado) poner({ tipo: 'dentro', perfil: guardado, correo: sesion.correo, sinRed: !navigator.onLine });
  try {
    await cargarPerfil();
  } catch (e) {
    if (e instanceof ErrorCuenta && e.falla === 'red') {
      if (guardado) poner({ tipo: 'dentro', perfil: guardado, correo: sesion?.correo, sinRed: true });
      else poner({ tipo: 'fuera' });
      return;
    }
    // Token revocado o vencido sin remedio: hay que entrar de nuevo.
    if (e instanceof ErrorCuenta && e.falla === 'credenciales') return poner({ tipo: 'fuera' });
    if (guardado) poner({ tipo: 'dentro', perfil: guardado, correo: sesion?.correo, sinRed: false });
    else poner({ tipo: 'fuera' });
  }
}

// ---------------------------------------------------------------- Acciones

export async function entrar(correo: string, clave: string): Promise<void> {
  const r = await pedir('/auth/v1/token?grant_type=password', { cuerpo: { email: correo.trim(), password: clave } });
  if (!r.ok) throw new ErrorCuenta(r.status === 400 || r.status === 401 ? 'credenciales' : 'otro', campo(r.datos, 'error_description') || campo(r.datos, 'msg'));
  sesion = sesionDe(r.datos);
  guardarSesion(sesion);
  await cargarPerfil();
}

/** Pide el correo para crear una contraseña nueva. Responde igual exista o no la cuenta. */
export async function recuperar(correo: string): Promise<void> {
  const destino = encodeURIComponent(`${location.origin}/adultos/clave-nueva`);
  const r = await pedir(`/auth/v1/recover?redirect_to=${destino}`, { cuerpo: { email: correo.trim() } });
  if (!r.ok) throw new ErrorCuenta('otro', r.status === 429 ? 'demasiados' : campo(r.datos, 'msg'));
}

/**
 * Envía a un adulto el correo con el enlace de entrada (la invitación ya debe existir en la base
 * con `invitar`). El enlace lleva a /adultos/invitacion. Lo usan el coordinador y el dueño.
 */
export async function enviarInvitacion(correo: string): Promise<void> {
  const destino = encodeURIComponent(`${location.origin}/adultos/invitacion`);
  const r = await pedir(`/auth/v1/otp?redirect_to=${destino}`, { cuerpo: { email: correo.trim().toLowerCase(), create_user: true } });
  if (!r.ok) throw new ErrorCuenta('otro', campo(r.datos, 'msg'));
}

/**
 * Lee la sesión que trae el enlace de un correo (recuperar o invitación) y la borra de la
 * dirección. Devuelve 'ok', 'enlace' (vencido o ya usado) o 'nada' (se abrió sin enlace).
 */
export function tomarEnlace(): 'ok' | 'enlace' | 'nada' {
  const datos = new URLSearchParams(location.hash.slice(1));
  const consulta = new URLSearchParams(location.search);
  if (location.hash || location.search) history.replaceState(history.state, '', location.pathname);
  if (datos.get('error') || datos.get('error_code') || consulta.get('error')) return 'enlace';
  const access = datos.get('access_token');
  const refresh = datos.get('refresh_token');
  if (!access || !refresh) return sesion ? 'ok' : 'nada';
  sesion = sesionDe({ access_token: access, refresh_token: refresh, expires_in: Number(datos.get('expires_in')) || 3600, expires_at: Number(datos.get('expires_at')) || undefined });
  guardarSesion(sesion);
  return 'ok';
}

/** Correo de la sesión abierta con el enlace, para mostrarlo en el formulario. */
export async function correoDeSesion(): Promise<string | undefined> {
  if (sesion?.correo) return sesion.correo;
  const r = await pedir('/auth/v1/user', { token: await token() });
  const correo = r.ok ? campo(r.datos, 'email') : '';
  if (sesion && correo) {
    sesion.correo = correo;
    guardarSesion(sesion);
  }
  return correo || undefined;
}

/** Fija la contraseña de la sesión abierta (recuperar o primera vez). */
export async function cambiarClave(clave: string): Promise<void> {
  const r = await pedir('/auth/v1/user', { metodo: 'PUT', cuerpo: { password: clave }, token: await token() });
  if (!r.ok) {
    const codigo = campo(r.datos, 'error_code') || campo(r.datos, 'code');
    if (codigo === 'weak_password' || r.status === 422) throw new ErrorCuenta(codigo === 'same_password' ? 'misma-clave' : 'clave-corta', campo(r.datos, 'msg'));
    throw new ErrorCuenta(r.status === 401 ? 'enlace' : 'otro', campo(r.datos, 'msg'));
  }
}

function cerrarLocal() {
  sesion = null;
  guardarSesion(null);
}

/** Cierra la sesión en el servidor (si hay red) y en este aparato. */
export async function salir(): Promise<void> {
  const access = sesion?.access;
  cerrarLocal();
  poner({ tipo: 'fuera' });
  if (access) await pedir('/auth/v1/logout', { cuerpo: {}, token: access }).catch(() => undefined);
}
