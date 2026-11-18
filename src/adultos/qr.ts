// Generador mínimo de código QR (modo byte, corrección M, versiones 1 a 6: hasta 84 caracteres).
// Sirve para la tarjeta de entrada: una dirección corta. Escrito a mano (unas 150 líneas) para no
// sumar una librería al paquete de adultos. Sigue ISO/IEC 18004; el recorrido de los módulos y la
// información de formato siguen el esquema habitual de las implementaciones de referencia.

/** Por versión (1 a 6) con corrección M: bytes de datos por bloque, bytes de corrección por bloque, cantidad de bloques. */
const TABLA: Record<number, { datos: number; ec: number; bloques: number }> = {
  1: { datos: 16, ec: 10, bloques: 1 },
  2: { datos: 28, ec: 16, bloques: 1 },
  3: { datos: 44, ec: 26, bloques: 1 },
  4: { datos: 32, ec: 18, bloques: 2 },
  5: { datos: 43, ec: 24, bloques: 2 },
  6: { datos: 27, ec: 16, bloques: 4 },
};
/** Centro del patrón de alineación (versiones 2 a 6). */
const ALINEACION: Record<number, number> = { 2: 18, 3: 22, 4: 26, 5: 30, 6: 34 };

// ---- Campo de Galois GF(256) con el polinomio 0x11d
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
for (let i = 0, x = 1; i < 255; i++) {
  EXP[i] = x;
  LOG[x] = i;
  x <<= 1;
  if (x & 0x100) x ^= 0x11d;
}
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
const mul = (a: number, b: number) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);

/** Bytes de corrección de errores de Reed-Solomon para un bloque de datos. */
function corregir(datos: number[], n: number): number[] {
  let gen = [1];
  for (let i = 0; i < n; i++) {
    const sig = new Array(gen.length + 1).fill(0);
    gen.forEach((c, j) => {
      sig[j] ^= c;
      sig[j + 1] ^= mul(c, EXP[i]);
    });
    gen = sig;
  }
  const resto = new Array(n).fill(0);
  for (const d of datos) {
    const f = d ^ resto.shift()!;
    resto.push(0);
    gen.slice(1).forEach((c, j) => (resto[j] ^= mul(c, f)));
  }
  return resto;
}

function bytesDe(texto: string): number[] {
  return [...new TextEncoder().encode(texto)];
}

/** Palabras de código ya entrelazadas (datos y corrección) para la versión dada. */
function palabras(texto: string, v: number): number[] {
  const { datos: porBloque, ec, bloques } = TABLA[v];
  const total = porBloque * bloques;
  const bytes = bytesDe(texto);
  const bits: number[] = [];
  const poner = (valor: number, n: number) => {
    for (let i = n - 1; i >= 0; i--) bits.push((valor >>> i) & 1);
  };
  poner(0b0100, 4);
  poner(bytes.length, 8);
  bytes.forEach((b) => poner(b, 8));
  poner(0, Math.min(4, total * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const cw: number[] = [];
  for (let i = 0; i < bits.length; i += 8) cw.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  for (let relleno = 0xec; cw.length < total; relleno ^= 0xec ^ 0x11) cw.push(relleno);
  const partes = Array.from({ length: bloques }, (_, i) => cw.slice(i * porBloque, (i + 1) * porBloque));
  const correcciones = partes.map((p) => corregir(p, ec));
  const salida: number[] = [];
  for (let i = 0; i < porBloque; i++) partes.forEach((p) => salida.push(p[i]));
  for (let i = 0; i < ec; i++) correcciones.forEach((c) => salida.push(c[i]));
  return salida;
}

const MASCARAS: ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

/** Castigo de una máscara (reglas 1 a 4 de la norma): menor es mejor. */
function castigo(m: boolean[][]): number {
  const n = m.length;
  let pena = 0;
  const lineas = [...m, ...m.map((_, x) => m.map((fila) => fila[x]))];
  for (const l of lineas) {
    let racha = 1;
    for (let i = 1; i <= n; i++) {
      if (i < n && l[i] === l[i - 1]) racha++;
      else {
        if (racha >= 5) pena += 3 + racha - 5;
        racha = 1;
      }
    }
    const texto = l.map((b) => (b ? '1' : '0')).join('');
    for (const p of ['10111010000', '00001011101']) {
      for (let i = texto.indexOf(p); i >= 0; i = texto.indexOf(p, i + 1)) pena += 40;
    }
  }
  for (let y = 0; y < n - 1; y++) for (let x = 0; x < n - 1; x++) if (m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) pena += 3;
  const oscuros = m.flat().filter(Boolean).length;
  pena += Math.floor(Math.abs((oscuros * 100) / (n * n) - 50) / 5) * 10;
  return pena;
}

/** Matriz de módulos del QR (true = oscuro), sin zona de silencio. */
export function crearQr(texto: string): boolean[][] {
  const largo = bytesDe(texto).length;
  const v = [1, 2, 3, 4, 5, 6].find((k) => largo <= TABLA[k].datos * TABLA[k].bloques - 2);
  if (!v) throw new Error('La dirección es demasiado larga para el QR');
  const n = 17 + 4 * v;
  const mod: boolean[][] = Array.from({ length: n }, () => new Array(n).fill(false));
  const fijo: boolean[][] = Array.from({ length: n }, () => new Array(n).fill(false));
  const poner = (x: number, y: number, oscuro: boolean) => {
    mod[y][x] = oscuro;
    fijo[y][x] = true;
  };

  for (let i = 0; i < n; i++) {
    poner(6, i, i % 2 === 0);
    poner(i, 6, i % 2 === 0);
  }
  for (const [cx, cy] of [[3, 3], [n - 4, 3], [3, n - 4]]) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        if (x >= 0 && y >= 0 && x < n && y < n) poner(x, y, d !== 2 && d !== 4);
      }
    }
  }
  if (v >= 2) {
    const c = ALINEACION[v];
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) poner(c + dx, c + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }
  // Información de formato: se reserva ahora y se dibuja con la máscara elegida al final.
  const formato = (destino: (x: number, y: number, oscuro: boolean) => void, mascara: number) => {
    let resto = mascara; // corrección M = 00, luego los 3 bits de máscara
    for (let i = 0; i < 10; i++) resto = (resto << 1) ^ ((resto >>> 9) * 0x537);
    const bits = ((mascara << 10) | resto) ^ 0x5412;
    const b = (i: number) => ((bits >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) destino(8, i, b(i));
    destino(8, 7, b(6));
    destino(8, 8, b(7));
    destino(7, 8, b(8));
    for (let i = 9; i < 15; i++) destino(14 - i, 8, b(i));
    for (let i = 0; i < 8; i++) destino(n - 1 - i, 8, b(i));
    for (let i = 8; i < 15; i++) destino(8, n - 15 + i, b(i));
    destino(8, n - 8, true);
  };
  formato(poner, 0);

  const cw = palabras(texto, v);
  let k = 0;
  for (let derecha = n - 1; derecha >= 1; derecha -= 2) {
    if (derecha === 6) derecha = 5;
    for (let vert = 0; vert < n; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = derecha - j;
        const y = ((derecha + 1) & 2) === 0 ? n - 1 - vert : vert;
        if (!fijo[y][x] && k < cw.length * 8) {
          mod[y][x] = ((cw[k >>> 3] >>> (7 - (k & 7))) & 1) === 1;
          k++;
        }
      }
    }
  }

  let mejor: boolean[][] = mod;
  let menor = Infinity;
  for (let m = 0; m < 8; m++) {
    const copia = mod.map((f, y) => f.map((b, x) => (!fijo[y][x] && MASCARAS[m](x, y) ? !b : b)));
    formato((x, y, oscuro) => (copia[y][x] = oscuro), m);
    const pena = castigo(copia);
    if (pena < menor) {
      menor = pena;
      mejor = copia;
    }
  }
  return mejor;
}

/** Trazo SVG (un rectángulo por tramo de módulos oscuros en cada fila), con zona de silencio de 4. */
export function trazoQr(m: boolean[][]): { trazo: string; lado: number } {
  const partes: string[] = [];
  m.forEach((fila, y) => {
    for (let x = 0; x < fila.length; x++) {
      if (!fila[x]) continue;
      let fin = x;
      while (fin + 1 < fila.length && fila[fin + 1]) fin++;
      partes.push(`M${x + 4} ${y + 4}h${fin - x + 1}v1h-${fin - x + 1}z`);
      x = fin;
    }
  });
  return { trazo: partes.join(''), lado: m.length + 8 };
}
