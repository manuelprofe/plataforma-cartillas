// Motor del juego de plataformas de matemáticas: una cuadrícula vista de lado. No sabe de
// números ni de preguntas: el nivel llega del contenido como un dibujo de letras y las puertas
// traen su reto. Todo es por casillas y por turnos (cada toque es un paso), así un niño de 5
// años entiende qué pasa y un celular barato lo mueve sin esfuerzo.
//
// Letras del mapa:
//   .  aire          #  tierra       =  repisa (sólida, se ve más delgada)
//   C  caja que se empuja             P  donde empieza el héroe
//   M  meta           G  puerta con reto (ocupa también la casilla de arriba; se abre al resolverlo)
//   ~  agua (si el héroe cae, Goma lo saca; una caja que cae ahí flota y sirve de puente)
//   L  palanca        X  bloque que aparece al mover la palanca

export type Casilla = '.' | '#' | '=' | '~' | 'M' | 'G' | 'L' | 'X';

export interface Punto {
  x: number;
  y: number;
}

export interface Estado {
  ancho: number;
  alto: number;
  /** Lo fijo del nivel, sin héroe ni cajas. */
  fondo: Casilla[][];
  heroe: Punto;
  mira: 1 | -1;
  cajas: Punto[];
  /** Puertas ya abiertas, por "x,y". */
  abiertas: string[];
  palanca: boolean;
  /** Último sitio firme del héroe, para volver si cae al agua. */
  seguro: Punto;
}

/** Lo que pasó en un paso, para que la pantalla lo cuente con sonido y voz. */
export type Suceso = 'camina' | 'choca' | 'empuja' | 'salta' | 'cae' | 'agua' | 'puerta' | 'palanca' | 'meta' | 'nada';

export interface Paso {
  /** Cuadros de la animación, del primero al último. */
  cuadros: Estado[];
  suceso: Suceso;
  /** Puerta que pide su reto (cuando el suceso es 'puerta'). */
  puerta?: Punto;
}

const clave = (p: Punto) => `${p.x},${p.y}`;

export function leerMapa(mapa: string[]): Estado {
  const alto = mapa.length;
  const ancho = Math.max(...mapa.map((f) => f.length));
  const fondo: Casilla[][] = [];
  const cajas: Punto[] = [];
  let heroe: Punto = { x: 0, y: 0 };
  for (let y = 0; y < alto; y++) {
    const fila: Casilla[] = [];
    for (let x = 0; x < ancho; x++) {
      const c = mapa[y][x] ?? '.';
      if (c === 'P') {
        heroe = { x, y };
        fila.push('.');
      } else if (c === 'C') {
        cajas.push({ x, y });
        fila.push('.');
      } else fila.push(('.#=~MGLX'.includes(c) ? c : '.') as Casilla);
    }
    fondo.push(fila);
  }
  const inicio: Estado = { ancho, alto, fondo, heroe, mira: 1, cajas, abiertas: [], palanca: false, seguro: heroe };
  // Las cajas dibujadas en el aire caen antes de empezar.
  return asentar(inicio);
}

export function casilla(e: Estado, x: number, y: number): Casilla {
  if (y < 0) return '.';
  if (x < 0 || x >= e.ancho || y >= e.alto) return '#';
  return e.fondo[y][x];
}

const hayCaja = (e: Estado, x: number, y: number) => e.cajas.findIndex((c) => c.x === x && c.y === y);

/** Lo que no deja pasar: tierra, repisa, puerta cerrada, bloque de palanca encendido. */
function firme(e: Estado, x: number, y: number) {
  // Los bordes del nivel y el techo no dejan pasar: el héroe nunca sale de la pantalla.
  if (x < 0 || x >= e.ancho || y < 0) return true;
  if (y >= e.alto) return false;
  const c = casilla(e, x, y);
  if (c === '#' || c === '=') return true;
  if (c === 'G') return !e.abiertas.includes(`${x},${y}`);
  // La puerta cerrada es alta: tampoco se pasa saltando por encima.
  if (casilla(e, x, y + 1) === 'G' && !e.abiertas.includes(`${x},${y + 1}`)) return true;
  if (c === 'X') return e.palanca;
  return false;
}

/** Ocupada por algo sólido o por una caja. */
export function ocupada(e: Estado, x: number, y: number) {
  return firme(e, x, y) || hayCaja(e, x, y) >= 0;
}

const copia = (e: Estado): Estado => ({ ...e, heroe: { ...e.heroe }, cajas: e.cajas.map((c) => ({ ...c })), abiertas: [...e.abiertas], seguro: { ...e.seguro } });

/** El héroe está parado sobre algo (no cae). El agua sola no lo sostiene. */
export function apoyado(e: Estado, p: Punto = e.heroe) {
  return ocupada(e, p.x, p.y + 1);
}

/** Deja caer las cajas sueltas: una caja que llega al agua se queda flotando en ella. */
function asentar(e: Estado): Estado {
  const s = copia(e);
  let cambio = true;
  while (cambio) {
    cambio = false;
    for (const c of s.cajas) {
      if (casilla(s, c.x, c.y) === '~') continue;
      const abajo = c.y + 1;
      if (abajo < s.alto && !ocupada(s, c.x, abajo) && !(s.heroe.x === c.x && s.heroe.y === abajo)) {
        c.y = abajo;
        cambio = true;
      }
    }
  }
  return s;
}

/** Hace caer al héroe cuadro por cuadro. Devuelve los cuadros y si terminó en el agua. */
function caer(e: Estado, cuadros: Estado[]): { final: Estado; agua: boolean } {
  let s = e;
  for (let i = 0; i < 40; i++) {
    const { x, y } = s.heroe;
    if (casilla(s, x, y) === '~' && hayCaja(s, x, y) < 0) return { final: s, agua: true };
    if (apoyado(s)) break;
    if (y + 1 >= s.alto) return { final: s, agua: true };
    s = copia(s);
    s.heroe.y++;
    cuadros.push(s);
  }
  if (casilla(s, s.heroe.x, s.heroe.y) === '~' && hayCaja(s, s.heroe.x, s.heroe.y) < 0) return { final: s, agua: true };
  return { final: s, agua: false };
}

/** Cierra un paso: gravedad del héroe, agua, meta y punto seguro. */
function terminar(e: Estado, cuadros: Estado[], suceso: Suceso): Paso {
  const { final, agua } = caer(e, cuadros);
  if (agua) {
    const rescate = copia(final);
    rescate.heroe = { ...final.seguro };
    cuadros.push(rescate);
    return { cuadros, suceso: 'agua' };
  }
  const listo = copia(final);
  listo.seguro = { ...listo.heroe };
  if (cuadros.length) cuadros[cuadros.length - 1] = listo;
  else cuadros.push(listo);
  const cayo = final.heroe.y > e.heroe.y;
  if (casilla(listo, listo.heroe.x, listo.heroe.y) === 'M') return { cuadros, suceso: 'meta' };
  return { cuadros, suceso: cayo && suceso === 'camina' ? 'cae' : suceso };
}

/** Un paso a la izquierda (-1) o a la derecha (1): camina, empuja una caja o toca una puerta. */
export function mover(e: Estado, dir: 1 | -1): Paso {
  const s = copia(e);
  s.mira = dir;
  const x = s.heroe.x + dir;
  const y = s.heroe.y;
  if (casilla(s, x, y) === 'G' && firme(s, x, y)) return { cuadros: [s], suceso: 'puerta', puerta: { x, y } };
  // La parte de arriba de una puerta cerrada también la abre.
  if (casilla(s, x, y + 1) === 'G' && firme(s, x, y)) return { cuadros: [s], suceso: 'puerta', puerta: { x, y: y + 1 } };
  const caja = hayCaja(s, x, y);
  if (caja >= 0) {
    const mas = x + dir;
    // Solo se empuja una caja que no lleva otra encima, hacia un sitio libre.
    if (ocupada(s, mas, y) || hayCaja(s, x, y - 1) >= 0) return { cuadros: [s], suceso: 'choca' };
    s.cajas[caja] = { x: mas, y };
    s.heroe = { x, y };
    const asentado = asentar(s);
    return terminar(asentado, [asentado], 'empuja');
  }
  if (ocupada(s, x, y)) return { cuadros: [s], suceso: 'choca' };
  s.heroe = { x, y };
  return terminar(s, [s], 'camina');
}

/**
 * Salto hacia donde mira: sube una casilla y avanza una; si ahí no hay piso, avanza otra
 * (así pasa un hueco de una casilla). Para subir dos casillas hace falta una caja.
 */
export function saltar(e: Estado): Paso {
  if (!apoyado(e) || ocupada(e, e.heroe.x, e.heroe.y - 1)) return { cuadros: [copia(e)], suceso: 'nada' };
  const cuadros: Estado[] = [];
  let s = copia(e);
  s.heroe.y--;
  cuadros.push(s);
  for (let i = 0; i < 2; i++) {
    const x = s.heroe.x + s.mira;
    if (ocupada(s, x, s.heroe.y) || (casilla(s, x, s.heroe.y) === 'G' && firme(s, x, s.heroe.y))) break;
    s = copia(s);
    s.heroe.x = x;
    cuadros.push(s);
    if (apoyado(s)) break;
  }
  return terminar(s, cuadros, 'salta');
}

/** Mueve la palanca si el héroe está en ella o al lado, mirándola. */
export function palancaCerca(e: Estado): Punto | null {
  for (const x of [e.heroe.x, e.heroe.x + e.mira]) if (casilla(e, x, e.heroe.y) === 'L') return { x, y: e.heroe.y };
  return null;
}

export function usarPalanca(e: Estado): Paso {
  if (!palancaCerca(e)) return { cuadros: [copia(e)], suceso: 'nada' };
  const s = copia(e);
  s.palanca = !s.palanca;
  // Un bloque que aparece donde está el héroe lo deja encima.
  if (s.palanca && casilla(s, s.heroe.x, s.heroe.y) === 'X') s.heroe.y--;
  return terminar(asentar(s), [s], 'palanca');
}

export function abrirPuerta(e: Estado, p: Punto): Estado {
  const s = copia(e);
  if (!s.abiertas.includes(clave(p))) s.abiertas.push(clave(p));
  return s;
}

/** Puertas del nivel de izquierda a derecha: el reto i es de la puerta i. */
export function puertas(e: Estado): Punto[] {
  const lista: Punto[] = [];
  for (let x = 0; x < e.ancho; x++) for (let y = 0; y < e.alto; y++) if (e.fondo[y][x] === 'G') lista.push({ x, y });
  return lista;
}
