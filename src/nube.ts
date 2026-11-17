// Supabase para el aparato del niño. Se importa bajo demanda (perfiles.ts) solo cuando hace
// falta: al usar una tarjeta, comprobar un PIN con red o subir la cola. Nunca en la primera
// carga de `/`. El aparato tiene una sesión anónima propia (no la del adulto, que vive en otra
// llave): con ella `entrar_estudiante` une a cada niño con este aparato (varios por aparato).
import { campo, ErrorCuenta, errorDe, pedir, renovarTokens, tokensDe, type Tokens } from './supabase';
import { anotarIntento, cartillaActual, leerCola, mezclarNube, quitarDeCola, type AvanceNube } from './progreso';
import type { Busqueda, Cara, Entrada } from './perfiles';

const LLAVE = 'pc_aparato_v1';
/** Envíos que fallan por algo que no es la red: tras estos intentos salen de la cola (el avance sigue en el aparato). */
const MAX_INTENTOS = 5;

function leerSesion(): Tokens | null {
  try {
    const s = JSON.parse(localStorage.getItem(LLAVE) ?? 'null') as Tokens | null;
    return s && typeof s.access === 'string' && typeof s.refresh === 'string' ? s : null;
  } catch {
    return null;
  }
}

function guardarSesion(s: Tokens) {
  try {
    localStorage.setItem(LLAVE, JSON.stringify({ access: s.access, refresh: s.refresh, vence: s.vence }));
  } catch {
    // Sin almacenamiento: la sesión dura lo que dure la pestaña.
  }
}

let sesion = leerSesion();

/** Sesión anónima del aparato, creándola la primera vez o si la anterior ya no sirve. */
async function token(): Promise<string> {
  if (sesion && sesion.vence - Date.now() > 60_000) return sesion.access;
  if (sesion) {
    const r = await renovarTokens(sesion.refresh);
    if (r) {
      sesion = r.tokens;
      guardarSesion(sesion);
      return sesion.access;
    }
  }
  // Sesión nueva (la anterior no existe o Auth la rechazó): los niños tendrán que volver a entrar con su PIN y red para que lo jugado suba.
  const r = await pedir('/auth/v1/signup', { cuerpo: { data: {} } });
  if (!r.ok) throw new ErrorCuenta('otro', campo(r.datos, 'msg') || `HTTP ${r.status}`);
  sesion = tokensDe(r.datos);
  guardarSesion(sesion);
  return sesion.access;
}

async function rpc<T>(funcion: string, args: Record<string, unknown>): Promise<T> {
  const r = await pedir(`/rest/v1/rpc/${funcion}`, { cuerpo: args, token: await token() });
  if (!r.ok) throw errorDe(r);
  return r.datos as T;
}

async function leer<T>(tabla: string, consulta: string): Promise<T[]> {
  const r = await pedir(`/rest/v1/${tabla}?${consulta}`, { token: await token() });
  if (!r.ok) throw errorDe(r);
  return r.datos as T[];
}

const esRed = (e: unknown) => e instanceof ErrorCuenta && (e.falla === 'red' || e.falla === 'sin-config');

/** Caras del grupo de un código. Muchos códigos errados en una hora: 'espera'. */
export async function listaGrupo(codigo: string): Promise<Busqueda> {
  try {
    const caras = await rpc<Cara[]>('lista_grupo', { p_codigo: codigo });
    return { tipo: 'ok', caras: Array.isArray(caras) ? caras : [] };
  } catch (e) {
    if (esRed(e)) return { tipo: 'sin-red' };
    if (e instanceof ErrorCuenta && e.codigo === 'PC429') return { tipo: 'espera' };
    throw e;
  }
}

/** `entrar_estudiante`: 'ok', 'errado', 'descanso', 'ayuda' o 'no-existe'; 'red' si no se pudo preguntar. */
export async function entrar(codigo: string, estudiante: string, pin: string): Promise<Exclude<Entrada, 'sin-red'> | 'red'> {
  try {
    const r = await rpc<string>('entrar_estudiante', { p_codigo: codigo, p_estudiante: estudiante, p_pin: pin });
    return r === 'ok' || r === 'errado' || r === 'descanso' || r === 'ayuda' || r === 'no-existe' ? r : 'errado';
  } catch (e) {
    if (esRed(e)) return 'red';
    throw e;
  }
}

/**
 * Sube la cola en orden, una misión por llamada. Cada envío sale de la cola solo cuando el
 * servidor respondió; sin red se detiene y sigue la próxima vez. Las estrellas no se duplican al
 * reintentar: `registrar_mision` da completar, mejorar y autoevaluarse una sola vez por misión.
 */
export async function subir(): Promise<void> {
  const tocados = new Set<string>();
  for (const envio of leerCola()) {
    try {
      await rpc('registrar_mision', {
        p_estudiante: envio.estudiante,
        p_cartilla: envio.cartilla,
        p_mision: envio.mision,
        p_errores: envio.errores,
        p_autoeval: envio.autoeval ?? null,
      });
      quitarDeCola(envio.id);
      tocados.add(envio.estudiante);
    } catch (e) {
      if (esRed(e)) return;
      // El niño no está unido a esta sesión (sesión nueva): espera a que vuelva a entrar con red.
      // Cuenta como intento: tras MAX_INTENTOS sale de la cola y no bloquea "Quitar de este celular".
      if ((envio.intentos ?? 0) + 1 >= MAX_INTENTOS) quitarDeCola(envio.id);
      else anotarIntento(envio.id);
    }
  }
  for (const id of tocados) await traer(id).catch(() => undefined);
}

/** Trae lo que la cuenta tiene en Supabase y lo suma al progreso del aparato. */
export async function traer(estudiante: string): Promise<void> {
  const cartilla = cartillaActual();
  if (!cartilla) return;
  const filtro = `estudiante_id=eq.${encodeURIComponent(estudiante)}&cartilla_id=eq.${encodeURIComponent(cartilla)}`;
  const [misiones, estrellas] = await Promise.all([
    leer<AvanceNube['misiones'][number]>('progreso_misiones', `select=mision_id,veces,mejor_errores,autoeval&${filtro}`),
    leer<AvanceNube['estrellas'][number]>('estrellas', `select=id,motivo,cantidad,mision_id,creado,otorgada_por&${filtro}`),
  ]);
  mezclarNube(estudiante, { misiones, estrellas });
}

/** "Quitar de este celular": suelta al niño de la sesión del aparato. */
export async function soltar(estudiante: string): Promise<void> {
  await rpc('soltar_estudiante', { p_estudiante: estudiante });
}
