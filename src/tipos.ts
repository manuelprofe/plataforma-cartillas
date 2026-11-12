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
  /** Ancho con que se dibuja en el mundo. */
  ancho?: number;
}

/** Personaje que el niño elige para recorrer el mundo. */
export interface Heroe {
  id: string;
  nombre: string;
  imagen: string;
  ancho: number;
  saludo: { es: string; en: string };
}

/** Estela que deja el personaje al caminar; se desbloquea con estrellas. */
export interface Estela {
  id: string;
  estrellas: number;
  colores: string[];
}

/** Un habitante perdió una palabra: el niño la busca entre varias y se la trae. */
export interface Encargo {
  pide: Palabra;
  opciones: Palabra[];
  x: number;
  y: number;
  escenaPide: string;
  escenaOtra: string;
  escenaGracias: string;
  escenaListo: string;
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
      /** Palabra que regala al álbum cuando el niño se acerca. */
      palabra?: Palabra;
    }[];
    /** Sonido de fondo del territorio. */
    ambiente?: Ambiente;
    /** Zonas iluminadas desde el principio; cada misión completada enciende la suya. */
    luces: { x: number; y: number; radio: number }[];
    radioLuzMision: number;
    inicio: { x: number; y: number };
    habitantes: { id: string; personaje: string; x: number; y: number; escena: string; encargo?: Encargo }[];
    /** Casas, faroles y demás cosas de la aldea; `choque` es el radio que no se puede pisar. */
    objetos: { imagen: string; ancho: number; x: number; y: number; choque: number; luz?: boolean }[];
    /** Copas en primer plano, por encima de todo. */
    frente: { x: number; y: number; tipo: number }[];
    /** Cuadrícula de agua ('1' = no se puede caminar) y tamaño de cada celda. */
    agua: string[];
    celda: number;
    /** Color de la penumbra: cada territorio tiene su hora del día. */
    colorPenumbra: string;
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
  heroes: Heroe[];
  estelas: Estela[];
  territorios: Territorio[];
}
