// Datos del dueño y del coordinador: colegios, personas, invitaciones, cartillas habilitadas y
// grupos. Todo pasa por cuenta.ts (rpc, leer, escribir); la seguridad por filas de Supabase
// decide qué ve y qué cambia cada rol. Nunca se piden datos de niños: solo cifras sumadas.
import { escribir, invitar, leer, rpc } from './cuenta';

export { invitar };

export interface Colegio {
  id: string;
  nombre: string;
  municipio: string | null;
  convenio: string | null;
}
export interface Persona {
  id: string;
  colegio_id: string | null;
  rol: 'dueno' | 'coordinador' | 'docente';
  nombre: string;
  correo: string | null;
  activo: boolean;
}
export interface Invitacion {
  id: string;
  correo: string;
  nombre: string;
  rol: 'coordinador' | 'docente';
  colegio_id: string;
  creado: string;
  aceptada: string | null;
  /** La envió el dueño: el coordinador no puede reenviarla ni cancelarla (la base la rechaza). */
  del_dueno: boolean;
}
export interface Habilitada {
  colegio_id: string;
  cartilla_id: string;
  version: string;
}
export interface Version {
  cartilla_id: string;
  version: string;
}
/** Una cartilla del catálogo (migración 004: `publicada`). */
export interface CartillaCat {
  id: string;
  titulo: string;
  materia: string | null;
  grado: string | null;
  publicada: boolean;
}
export interface Grupo {
  id: string;
  colegio_id: string;
  docente_id: string;
  nombre: string;
  grado: string;
  /** Cartilla del grupo (migración 004). */
  cartilla_id?: string;
}
export interface Cifra {
  grupo_id: string;
  nombre: string;
  grado: string;
  docente: string;
  con_cifras: boolean;
  ninos: number | null;
  autorizaciones: number | null;
  practicaron_semana: number | null;
}

/** La invitación dura 14 días (`aceptar_invitacion` en la migración 002). */
const VIGENCIA_MS = 14 * 24 * 3600e3;

export type EstadoInvitacion = 'aceptada' | 'pendiente' | 'vencida';
export function estadoInvitacion(i: Invitacion, ahora = Date.now()): EstadoInvitacion {
  if (i.aceptada) return 'aceptada';
  return ahora - new Date(i.creado).getTime() > VIGENCIA_MS ? 'vencida' : 'pendiente';
}

// ---------------------------------------------------------------- Lecturas

export const listarColegios = () => leer<Colegio>('colegios', 'select=id,nombre,municipio,convenio&order=nombre.asc');
export const listarHabilitadas = () => leer<Habilitada>('colegio_cartillas', 'select=colegio_id,cartilla_id,version');
export const listarCartillas = () => leer<CartillaCat>('cartillas', 'select=id,titulo,materia,grado,publicada&order=materia.asc,grado.asc');
/** "Inglés 3° · English Adventure Quest". */
export const nombreCartilla = (c: Pick<CartillaCat, 'titulo' | 'materia' | 'grado'>) => [[c.materia, c.grado && `${c.grado}°`].filter(Boolean).join(' '), c.titulo].filter(Boolean).join(' · ');
/** La versión más nueva de una cartilla (las versiones llegan de la más nueva a la más vieja). */
export const ultimaVersion = (versiones: Version[], cartilla: string) => versiones.find((v) => v.cartilla_id === cartilla);
export const listarVersiones = () => leer<Version>('cartilla_versiones', 'select=cartilla_id,version&order=version.desc');
export const listarPersonas = () => leer<Persona>('perfiles', 'select=id,colegio_id,rol,nombre,correo,activo&order=nombre.asc');
/** Migración 003: `lista_invitaciones()` trae lo que ve cada rol y si la invitó el dueño. */
export const listarInvitaciones = () => rpc<Invitacion[]>('lista_invitaciones', {});
export const listarGrupos = () => leer<Grupo>('grupos', 'select=id,colegio_id,docente_id,nombre,grado,cartilla_id&order=nombre.asc');
export const cifrasGrupos = () => rpc<Cifra[]>('cifras_grupos', {});

// ---------------------------------------------------------------- Cambios

export async function crearColegio(d: { nombre: string; municipio: string; convenio: string }): Promise<Colegio> {
  const [fila] = await escribir<Colegio>('colegios', 'POST', 'select=id,nombre,municipio,convenio', {
    nombre: d.nombre.trim(),
    municipio: d.municipio.trim() || null,
    convenio: d.convenio.trim() || null,
  });
  return fila;
}

export const habilitarCartilla = (colegio: string, v: Version) =>
  escribir('colegio_cartillas', 'POST', 'on_conflict=colegio_id,cartilla_id&select=colegio_id', { colegio_id: colegio, cartilla_id: v.cartilla_id, version: v.version }, true);

/** Publicar u ocultar una cartilla. Oculta no se puede habilitar en más colegios; los que ya la tienen la siguen usando. */
export const publicarCartilla = (id: string, publicada: boolean) => escribir('cartillas', 'PATCH', `id=eq.${encodeURIComponent(id)}&select=id`, { publicada });

export const cancelarInvitacion = (id: string) => escribir('invitaciones', 'DELETE', `id=eq.${encodeURIComponent(id)}&aceptada=is.null&select=id`);

export const cambiarActivo = (persona: string, activo: boolean) => escribir('perfiles', 'PATCH', `id=eq.${encodeURIComponent(persona)}&select=id`, { activo });

/** Vuelve a enviar el correo: la función de la base renueva la invitación y el servidor manda el enlace. */
export const reenviar = (i: Invitacion) => invitar({ correo: i.correo, nombre: i.nombre, rol: i.rol, colegio_id: i.colegio_id });

export const crearGrupo = (d: { nombre: string; grado: string; docente: string }) => rpc<Grupo>('crear_grupo', { p_nombre: d.nombre.trim(), p_grado: d.grado, p_docente: d.docente });

/** Pasa un grupo a otra cartilla habilitada en su colegio (migración 005; la base lo comprueba). */
export const cambiarCartillaGrupo = (grupo: string, cartilla: string) => escribir('grupos', 'PATCH', `id=eq.${encodeURIComponent(grupo)}&select=id`, { cartilla_id: cartilla });

export const asignarDocente = (grupo: string, docente: string) => escribir('grupos', 'PATCH', `id=eq.${encodeURIComponent(grupo)}&select=id`, { docente_id: docente });

export const renovarCodigo = (grupo: string) => rpc('renovar_codigo', { p_grupo: grupo });

/** Docentes a quienes se puede asignar un grupo: activos y con la invitación aceptada (lo exige la base). */
export function asignables(personas: Persona[], invitaciones: Invitacion[], colegio?: string): Persona[] {
  const aceptados = new Set(invitaciones.filter((i) => i.rol === 'docente' && i.aceptada && (!colegio || i.colegio_id === colegio)).map((i) => i.correo.toLowerCase()));
  return personas.filter((p) => p.rol === 'docente' && p.activo && (!colegio || p.colegio_id === colegio) && p.correo && aceptados.has(p.correo.toLowerCase()));
}
