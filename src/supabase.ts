// Cliente HTTP mínimo de Supabase (Auth y PostgREST con fetch), compartido por la cuenta del
// adulto (src/adultos/cuenta.ts) y la del aparato del niño (src/nube.ts). Sin estado propio:
// cada uno guarda su sesión en su llave. Nunca entra en la primera carga de `/`: los dos que
// lo usan se cargan bajo demanda.

const URL_SB = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/+$/, '');
const CLAVE_PUBLICA = import.meta.env.VITE_SUPABASE_CLAVE_PUBLICA as string | undefined;
/** Esta copia de la app se compiló con la dirección y la clave pública de Supabase. */
export const configurada = Boolean(URL_SB && CLAVE_PUBLICA);

const ESPERA_MS = 12000;

export type Falla = 'red' | 'credenciales' | 'clave-corta' | 'misma-clave' | 'enlace' | 'sin-config' | 'otro';

export class ErrorCuenta extends Error {
  /** Código de PostgreSQL o de PostgREST cuando lo hay ('PC429'...). */
  codigo = '';
  /** Estado HTTP de la respuesta (0 si no hubo respuesta). */
  status = 0;
  constructor(
    public falla: Falla,
    detalle = '',
  ) {
    super(detalle || falla);
  }
}

export interface Respuesta {
  ok: boolean;
  status: number;
  datos: unknown;
}

export async function pedir(ruta: string, opciones: { metodo?: string; cuerpo?: unknown; token?: string; cabeceras?: Record<string, string> } = {}): Promise<Respuesta> {
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

export const campo = (datos: unknown, nombre: string): string => {
  const v = datos && typeof datos === 'object' ? (datos as Record<string, unknown>)[nombre] : undefined;
  return typeof v === 'string' ? v : '';
};

/** Error de una llamada a la base, con su código para quien necesite distinguirlo. */
export function errorDe(r: Respuesta): ErrorCuenta {
  const e = new ErrorCuenta(r.status === 401 ? 'credenciales' : 'otro', campo(r.datos, 'message') || `HTTP ${r.status}`);
  e.codigo = campo(r.datos, 'code');
  e.status = r.status;
  return e;
}

export interface Tokens {
  access: string;
  refresh: string;
  /** Milisegundos (época) en que vence el token de acceso. */
  vence: number;
}

/** Convierte la respuesta de /auth/v1/token (o /signup) en tokens. */
export function tokensDe(datos: unknown): Tokens {
  const d = datos as { access_token: string; refresh_token: string; expires_in?: number; expires_at?: number };
  const vence = d.expires_at ? d.expires_at * 1000 : Date.now() + (d.expires_in ?? 3600) * 1000;
  return { access: d.access_token, refresh: d.refresh_token, vence };
}

/**
 * Renueva el token de acceso. Devuelve null solo si Auth dice que la sesión ya no sirve (400/401).
 * Ante cualquier otra falla (5xx, 429, sin red) lanza un error de red: la sesión se conserva.
 */
export async function renovarTokens(refresh: string): Promise<{ tokens: Tokens; datos: unknown } | null> {
  const r = await pedir('/auth/v1/token?grant_type=refresh_token', { cuerpo: { refresh_token: refresh } });
  if (r.ok) return { tokens: tokensDe(r.datos), datos: r.datos };
  if (r.status === 400 || r.status === 401) return null;
  throw new ErrorCuenta('red', `HTTP ${r.status}`);
}
