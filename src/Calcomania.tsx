// Calcomanías: reemplazan las estrellas de la tesis (biblia de Cuaderno Vivo, 24 nov 2026).
// Cada conducta da una calcomanía con su propio dibujo; se cuentan por tipo, sin puntos.
// Son de la plataforma, no de una cartilla: viven en public/calcomanias/.
import type { Conducta } from './progreso';

type Tipo = Exclude<Conducta, 'anterior'>;

export const CALCOMANIAS: Record<Tipo, { nombre: string; dibujo: string }> = {
  participar: { nombre: 'Mano levantada', dibujo: 'participar' },
  completar: { nombre: 'Bandera', dibujo: 'completar' },
  pronunciar: { nombre: 'Lo dije en voz alta', dibujo: 'pronunciar' },
  colaborar: { nombre: 'Trabajo en equipo', dibujo: 'colaborar' },
  mejorar: { nombre: 'Goma: corregí y mejoré', dibujo: 'mejorar' },
  autoevaluar: { nombre: 'Espejo: pensé en lo que aprendí', dibujo: 'autoevaluar' },
};

export const imagenCalcomania = (tipo: Conducta) =>
  `${import.meta.env.BASE_URL}calcomanias/${CALCOMANIAS[tipo === 'anterior' ? 'completar' : tipo].dibujo}.webp`;

/** Dibujo de una calcomanía. Sin `tipo`, la de terminar misión, que representa a todas. */
export function Calcomania({ tipo = 'completar', alto = 32, className }: { tipo?: Conducta; alto?: number; className?: string }) {
  return <img className={className ?? 'calcomania'} src={imagenCalcomania(tipo)} alt="" height={alto} style={{ height: alto, width: 'auto' }} draggable={false} />;
}
