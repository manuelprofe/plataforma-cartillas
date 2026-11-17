// Capa de datos de la cuenta del adulto: la única que habla con Supabase y guarda la sesión.
// Cliente mínimo con fetch (src/supabase.ts, compartido con el aparato del niño) en vez de @supabase/supabase-js: usamos seis
// llamadas y la librería agregaría unos 45 KB comprimidos y una dependencia al paquete de adultos.
// Solo la importa el paquete de adultos: el celular del niño nunca la descarga.
import { useSyncExternalStore } from 'react';
import { campo, ErrorCuenta, errorDe, pedir, renovarTokens, tokensDe, type Tokens } from '../supabase';

export { configurada, ErrorCuenta, type Falla } from '../supabase';

const LLAVE = 'pc_adulto_v1';

export type Rol = 'dueno' | 'coordinador' | 'docente';
export interface Perfil {
  rol: Rol;
  nombre: string;
  colegio_id: string | null;
}

/** Inicio de cada rol. Un adulto que entra a la sección de otro rol vuelve aquí. */
export const INICIO: Record<Rol, string> = { dueno: '/plataforma', coordinador: '/colegio', docente: '/docente' };

interface Sesion extends Tokens {
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

/** Convierte la respuesta de /auth/v1/token en sesión. */
function sesionDe(datos: unknown, previa?: Sesion | null): Sesion {
  const correo = (datos as { user?: { email?: string } }).user?.email;
  return { ...tokensDe(datos), correo: correo ?? previa?.correo, perfil: previa?.perfil };
}

/** Renueva el token de acceso. Devuelve false si la sesión ya no sirve. */
async function renovar(): Promise<boolean> {
  if (!sesion) return false;
  const r = await renovarTokens(sesion.refresh);
  if (!r) return false;
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
  if (!r.ok) throw errorDe(r);
  return r.datos as T;
}

/** Lee filas de una tabla con la sintaxis de PostgREST (`select=...&id=eq...`). La seguridad por filas decide qué vuelve. */
export async function leer<T>(tabla: string, consulta: string): Promise<T[]> {
  const r = await pedir(`/rest/v1/${tabla}?${consulta}`, { token: await token() });
  if (!r.ok) throw errorDe(r);
  return r.datos as T[];
}

// ---------------------------------------------------------------- Perfil

type FilaPerfil = Perfil & { activo: boolean };

/**
 * Pide el perfil propio al servidor (`mi_perfil()`: una sola fila, la del usuario de la sesión;
 * leer la tabla perfiles devolvería también los de otros adultos que el rol deja ver) y fija el
 * estado. Sin perfil, intenta aceptar una invitación.
 */
async function cargarPerfil(): Promise<void> {
  let fila = await rpc<FilaPerfil | null>('mi_perfil');
  if (!fila) {
    const rol = await rpc<Rol | null>('aceptar_invitacion');
    if (rol) fila = await rpc<FilaPerfil | null>('mi_perfil');
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
 * Invita a un adulto (dueño: coordinadores o docentes; coordinador: docentes de su colegio).
 * Lo hace la Edge Function `invitar` (supabase/funciones/invitar): registra la invitación con
 * la sesión de quien invita y envía el correo con la clave de servicio, que nunca llega aquí.
 * El enlace del correo lleva a /adultos/invitacion.
 */
export async function invitar(datos: { correo: string; nombre: string; rol: 'coordinador' | 'docente'; colegio_id?: string }): Promise<'enviada' | 'ya-registrado'> {
  const r = await pedir('/functions/v1/invitar', { cuerpo: datos, token: await token() });
  if (!r.ok) throw new ErrorCuenta('otro', campo(r.datos, 'error') || `HTTP ${r.status}`);
  return campo(r.datos, 'estado') === 'ya-registrado' ? 'ya-registrado' : 'enviada';
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
