// Qué paquete de código atiende cada dirección. Lo usan main.tsx (para cargar solo ese
// paquete) y vite.config.ts (para adelantar la descarga del paquete del niño en `/`).
// Sin dependencias: este archivo también lo lee la configuración de compilación.

export type Modo = 'estudiante' | 'adultos' | 'proyectar';

/** Primer tramo de la ruta de cada modo de adultos. Lo demás es del niño. */
export const TRAMOS: Record<Exclude<Modo, 'estudiante'>, readonly string[]> = {
  adultos: ['adultos', 'docente', 'colegio', 'plataforma'],
  proyectar: ['proyectar'],
};

export function modoDe(ruta: string): Modo {
  const tramo = ruta.split('/')[1] ?? '';
  if (TRAMOS.proyectar.includes(tramo)) return 'proyectar';
  if (TRAMOS.adultos.includes(tramo)) return 'adultos';
  return 'estudiante';
}
