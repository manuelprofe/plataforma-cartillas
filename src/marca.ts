// Marca de la plataforma (El Cuaderno de Goma) para los modos de adultos, materiales y proyectar.
// Los dibujos viven en public/marca/: copias pequeñas de las poses de los personajes, al doble
// del tamaño en que se muestran. Goma acompaña; cada materia tiene su personaje.
export const NOMBRE = 'El Cuaderno de Goma';
export const MARCA = `${import.meta.env.BASE_URL}marca/`;

export type Personaje = 'goma-saludar' | 'goma-senalar' | 'goma-celebrar' | 'cuadrito-saludar' | 'renglon-saludar' | 'postal-saludar';
export const dibujo = (p: Personaje) => `${MARCA}${p}.webp`;

/** Personaje de cada materia (Cuadrito en matemáticas, Renglón en español, Postal en inglés). */
export function personajeDeMateria(materia?: string | null): Personaje {
  const m = (materia ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (m.startsWith('mate')) return 'cuadrito-saludar';
  if (m.startsWith('espa') || m.startsWith('lengua')) return 'renglon-saludar';
  if (m.startsWith('ingl')) return 'postal-saludar';
  return 'goma-saludar';
}
