// Forma del paquete de datos de una cartilla. El motor solo conoce estos tipos:
// todo el contenido llega desde public/cartillas/<id>/cartilla.json.

export interface Palabra {
  en: string;
  es: string;
  icono: string;
}

export interface Mision {
  id: string;
  titulo: string;
  plantilla: 'escucha-toca';
  icono: string;
  palabras: Palabra[];
}

export interface Territorio {
  id: string;
  nombre: string;
  guia: { nombre: string; imagen: string };
  saludo: string;
  fondos: { lejos: string; medio: string; cerca: string };
  puerta: { estrellas: number; destino: string; imagen: string };
  misiones: Mision[];
}

export interface Cartilla {
  id: string;
  titulo: string;
  materia: string;
  grado: string;
  idiomaVoz: string;
  territorios: Territorio[];
}
