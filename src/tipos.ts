// Forma del paquete de datos de una cartilla. El motor solo conoce estos tipos:
// todo el contenido llega desde public/cartillas/<id>/cartilla.json.

export type Ambiente = 'bosque-noche';

export interface Palabra {
  en: string;
  es: string;
  icono: string;
}

/** Cómo se narra la historia: en español, en inglés con apoyo, o solo en inglés. */
export type ModoIdioma = 'es' | 'mixto' | 'en';

export interface Opcion {
  es: string;
  en: string;
  icono?: string;
  /** Escena a la que salta la conversación. */
  ir?: string;
  /** Misión que el niño eligió visitar. */
  destino?: string;
}

export interface Linea {
  quien: string;
  es: string;
  en: string;
  opciones?: Opcion[];
}

export interface Escena {
  lineas: Linea[];
  luego?: string;
}

export interface Mision {
  id: string;
  titulo: string;
  plantilla: 'escucha-toca';
  icono: string;
  x: number;
  y: number;
  antes: Linea[];
  palabras: Palabra[];
}

export interface Personaje {
  nombre: string;
  imagen: string;
}

export interface Territorio {
  id: string;
  nombre: string;
  guia: string;
  personajes: Record<string, Personaje>;
  idiomaPorAvance: ModoIdioma[];
  /** Mundo visto desde arriba. Todas las posiciones van en píxeles del mapa. */
  mundo: {
    mapa: string;
    ancho: number;
    alto: number;
    /** Árboles sueltos sobre el suelo: el guía pasa por detrás de los que están más abajo. */
    tiposArbol: { imagen: string; ancho: number; alto: number }[];
    arboles: { x: number; y: number; tipo: number; escala: number }[];
    /** Animales que se mueven solos alrededor de un punto. */
    criaturas: {
      imagen: string;
      ancho: number;
      x: number;
      y: number;
      radio: number;
      movimiento: 'revolotea' | 'zumba' | 'planea' | 'salta';
      rapidez: number;
    }[];
    /** Sonido de fondo del territorio. */
    ambiente?: Ambiente;
    /** Zonas iluminadas desde el principio; cada misión completada enciende la suya. */
    luces: { x: number; y: number; radio: number }[];
    radioLuzMision: number;
    inicio: { x: number; y: number };
    habitantes: { id: string; personaje: string; x: number; y: number; escena: string }[];
    luciernagas: { x: number; y: number }[];
  };
  puerta: {
    estrellas: number;
    destino: string;
    personaje: string;
    x: number;
    y: number;
    escenaCerrada: string;
    escenaAbierta: string;
  };
  escenas: Record<string, Escena>;
  misiones: Mision[];
}

export interface Cartilla {
  id: string;
  titulo: string;
  materia: string;
  grado: string;
  idiomaVoz: string;
  idiomaHistoria: string;
  territorios: Territorio[];
}
