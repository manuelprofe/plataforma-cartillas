// Búsqueda de rutas sobre la rejilla de lo caminable que trae el paquete de la cartilla.
// Se usa solo cuando el niño toca: A* en la rejilla, y después la ruta se alisa por línea de
// vista y se redondean las esquinas para que el guía no camine en zigzag de celdas.
// No conoce ningún mapa concreto: todo sale de `mundo.caminable` y de los obstáculos.
import type { RejillaCaminable } from './tipos';

export interface Punto {
  x: number;
  y: number;
}

export interface Circulo {
  x: number;
  y: number;
  r: number;
}

const RAIZ2 = Math.SQRT2;
// Distancia a la que se redondea cada esquina de la ruta, en px del mundo.
const CURVA = 40;
// Margen a los lados de la línea de vista: el guía no roza el borde del bosque.
const HOLGURA = 7;

export class Caminos {
  readonly celda: number;
  readonly ancho: number;
  readonly alto: number;
  private readonly pisa: Uint8Array;
  // Memoria de A*, reservada una vez y marcada por vuelta para no limpiarla en cada búsqueda.
  private readonly g: Float32Array;
  private readonly padre: Int32Array;
  private readonly abierta: Uint32Array;
  private readonly cerrada: Uint32Array;
  private vuelta = 0;
  private montonId: Int32Array;
  private montonF: Float32Array;
  private tam = 0;
  private caliente = false;
  private fi = 0;
  private fj = 0;
  private readonly inicio: Punto;

  constructor(datos: RejillaCaminable, bloqueos: Circulo[], inicio: Punto) {
    this.celda = datos.celda;
    this.ancho = datos.ancho;
    this.alto = datos.alto;
    const n = this.ancho * this.alto;
    const pisa = new Uint8Array(n);
    datos.filas.forEach((fila, j) => {
      let i = 0;
      let dentro = false;
      for (const tramo of fila.split(',')) {
        const largo = Number(tramo);
        if (dentro) pisa.fill(1, j * this.ancho + i, j * this.ancho + Math.min(this.ancho, i + largo));
        i += largo;
        dentro = !dentro;
      }
    });
    // Casas, troncos y demás cosas que no se atraviesan.
    for (const b of bloqueos) {
      const i0 = Math.max(0, Math.floor((b.x - b.r) / this.celda));
      const i1 = Math.min(this.ancho - 1, Math.floor((b.x + b.r) / this.celda));
      const j0 = Math.max(0, Math.floor((b.y - b.r) / this.celda));
      const j1 = Math.min(this.alto - 1, Math.floor((b.y + b.r) / this.celda));
      for (let j = j0; j <= j1; j++)
        for (let i = i0; i <= i1; i++) {
          const cx = (i + 0.5) * this.celda - b.x;
          const cy = (j + 0.5) * this.celda - b.y;
          if (cx * cx + cy * cy < b.r * b.r) pisa[j * this.ancho + i] = 0;
        }
    }
    this.pisa = pisa;
    this.g = new Float32Array(n);
    this.padre = new Int32Array(n);
    this.abierta = new Uint32Array(n);
    this.cerrada = new Uint32Array(n);
    this.montonId = new Int32Array(1024);
    this.montonF = new Float32Array(1024);
    // Lo que un obstáculo dejó aislado ya no cuenta como caminable: todo destino es alcanzable.
    const desde = this.celdaCercana(inicio.x, inicio.y);
    if (desde >= 0) this.dejarSoloLoUnido(desde);
    this.inicio = inicio;
  }

  /**
   * Búsquedas de ensayo para que el primer toque del niño no pague el arranque del compilador
   * de JavaScript (en gama baja eran unos 15 ms). Se llama cuando el navegador está libre.
   */
  calentar() {
    if (this.caliente) return;
    this.caliente = true;
    const lejos = [
      { x: 0, y: 0 },
      { x: this.ancho * this.celda, y: this.alto * this.celda },
      { x: this.ancho * this.celda, y: 0 },
      { x: 0, y: this.alto * this.celda },
    ];
    for (const p of lejos) this.ruta(this.inicio, p);
  }

  /** ¿Se puede pisar este punto del mundo? */
  libre(x: number, y: number): boolean {
    const i = Math.floor(x / this.celda);
    const j = Math.floor(y / this.celda);
    return i >= 0 && j >= 0 && i < this.ancho && j < this.alto && this.pisa[j * this.ancho + i] === 1;
  }

  /** El punto caminable más cercano: el mismo si ya se puede pisar. */
  cercano(x: number, y: number): Punto | null {
    if (this.libre(x, y)) return { x, y };
    const c = this.celdaCercana(x, y);
    if (c < 0) return null;
    // Dentro de esa celda, lo más cerca posible del toque sin quedar pegado al borde.
    const i = c % this.ancho;
    const j = (c - i) / this.ancho;
    const m = this.celda * 0.3;
    return {
      x: Math.max(i * this.celda + m, Math.min((i + 1) * this.celda - m, x)),
      y: Math.max(j * this.celda + m, Math.min((j + 1) * this.celda - m, y)),
    };
  }

  /**
   * Ruta alisada entre dos puntos, empezando en `desde` tal cual. Si `hasta` no se puede pisar,
   * termina en el punto caminable más cercano. Devuelve null si no hay cómo llegar.
   */
  ruta(desde: Punto, hasta: Punto): Punto[] | null {
    const inicio = this.cercano(desde.x, desde.y);
    const fin = this.cercano(hasta.x, hasta.y);
    if (!inicio || !fin) return null;
    const celdas = this.aEstrella(this.indice(inicio), this.indice(fin));
    if (!celdas) return null;
    // Solo las celdas donde la ruta cambia de dirección: en los tramos rectos sobran.
    const puntos: Punto[] = [inicio];
    for (let k = 1; k < celdas.length - 1; k++) {
      if (celdas[k] - celdas[k - 1] !== celdas[k + 1] - celdas[k]) puntos.push(this.centro(celdas[k]));
    }
    puntos.push(fin);
    const recta = this.tensar(puntos);
    // Si el guía estaba fuera de lo caminable (no debería), primero vuelve en línea recta.
    if (inicio.x !== desde.x || inicio.y !== desde.y) recta.unshift({ ...desde });
    return this.redondear(recta);
  }

  private indice(p: Punto) {
    return Math.floor(p.y / this.celda) * this.ancho + Math.floor(p.x / this.celda);
  }

  private centro(c: number): Punto {
    const i = c % this.ancho;
    return { x: (i + 0.5) * this.celda, y: ((c - i) / this.ancho + 0.5) * this.celda };
  }

  /** Celda caminable más cercana a un punto, buscando en anillos que crecen. */
  private celdaCercana(x: number, y: number): number {
    const ci = Math.max(0, Math.min(this.ancho - 1, Math.floor(x / this.celda)));
    const cj = Math.max(0, Math.min(this.alto - 1, Math.floor(y / this.celda)));
    let mejor = -1;
    let menor = Infinity;
    const tope = Math.max(this.ancho, this.alto);
    for (let r = 0; r < tope; r++) {
      // Ya nada en este anillo puede quedar más cerca que lo encontrado.
      if (mejor >= 0 && (r - 1) * this.celda > Math.sqrt(menor)) break;
      for (let j = cj - r; j <= cj + r; j++) {
        if (j < 0 || j >= this.alto) continue;
        const borde = j === cj - r || j === cj + r;
        for (let i = ci - r; i <= ci + r; i += borde ? 1 : 2 * r || 1) {
          if (i < 0 || i >= this.ancho || !this.pisa[j * this.ancho + i]) continue;
          const dx = Math.max(i * this.celda - x, 0, x - (i + 1) * this.celda);
          const dy = Math.max(j * this.celda - y, 0, y - (j + 1) * this.celda);
          const d = dx * dx + dy * dy;
          if (d < menor) {
            menor = d;
            mejor = j * this.ancho + i;
          }
        }
      }
    }
    return mejor;
  }

  private dejarSoloLoUnido(desde: number) {
    const unida = new Uint8Array(this.pisa.length);
    const cola = new Int32Array(this.pisa.length);
    let lee = 0;
    let escribe = 0;
    cola[escribe++] = desde;
    unida[desde] = 1;
    while (lee < escribe) {
      const c = cola[lee++];
      const i = c % this.ancho;
      for (const [v, ok] of [
        [c - 1, i > 0],
        [c + 1, i < this.ancho - 1],
        [c - this.ancho, c >= this.ancho],
        [c + this.ancho, c < this.pisa.length - this.ancho],
      ] as const) {
        if (ok && this.pisa[v] && !unida[v]) {
          unida[v] = 1;
          cola[escribe++] = v;
        }
      }
    }
    this.pisa.set(unida);
  }

  /** Distancia octil a la meta, apenas inflada para desempatar a favor de lo que va más adelante. */
  private h(c: number) {
    const i = c % this.ancho;
    const dx = Math.abs(i - this.fi);
    const dy = Math.abs((c - i) / this.ancho - this.fj);
    return (dx + dy + (RAIZ2 - 2) * Math.min(dx, dy)) * 1.001;
  }

  private meter(c: number, f: number) {
    if (this.tam === this.montonId.length) {
      const id = new Int32Array(this.tam * 2);
      const ff = new Float32Array(this.tam * 2);
      id.set(this.montonId);
      ff.set(this.montonF);
      this.montonId = id;
      this.montonF = ff;
    }
    const ids = this.montonId;
    const fs = this.montonF;
    let k = this.tam++;
    while (k > 0) {
      const p = (k - 1) >> 1;
      if (fs[p] <= f) break;
      ids[k] = ids[p];
      fs[k] = fs[p];
      k = p;
    }
    ids[k] = c;
    fs[k] = f;
  }

  private sacar() {
    const ids = this.montonId;
    const fs = this.montonF;
    const arriba = ids[0];
    const tam = --this.tam;
    const c = ids[tam];
    const f = fs[tam];
    let k = 0;
    for (;;) {
      let hijo = 2 * k + 1;
      if (hijo >= tam) break;
      if (hijo + 1 < tam && fs[hijo + 1] < fs[hijo]) hijo++;
      if (fs[hijo] >= f) break;
      ids[k] = ids[hijo];
      fs[k] = fs[hijo];
      k = hijo;
    }
    ids[k] = c;
    fs[k] = f;
    return arriba;
  }

  private aEstrella(ini: number, fin: number): number[] | null {
    if (ini === fin) return [ini, fin];
    const { ancho, alto, pisa, g, padre, abierta, cerrada } = this;
    const v = ++this.vuelta;
    this.fi = fin % ancho;
    this.fj = (fin - this.fi) / ancho;
    this.tam = 0;
    g[ini] = 0;
    padre[ini] = -1;
    abierta[ini] = v;
    this.meter(ini, this.h(ini));
    while (this.tam > 0) {
      const c = this.sacar();
      if (cerrada[c] === v) continue;
      cerrada[c] = v;
      if (c === fin) {
        const camino: number[] = [];
        for (let k = c; k >= 0; k = padre[k]) camino.push(k);
        return camino.reverse();
      }
      const i = c % ancho;
      const j = (c - i) / ancho;
      for (let dj = -1; dj <= 1; dj++) {
        for (let di = -1; di <= 1; di++) {
          if (!di && !dj) continue;
          const ni = i + di;
          const nj = j + dj;
          if (ni < 0 || nj < 0 || ni >= ancho || nj >= alto) continue;
          const n = nj * ancho + ni;
          if (!pisa[n] || cerrada[n] === v) continue;
          // En diagonal solo si no corta la esquina del bosque.
          if (di && dj && (!pisa[j * ancho + ni] || !pisa[nj * ancho + i])) continue;
          const ng = g[c] + (di && dj ? RAIZ2 : 1);
          if (abierta[n] === v && ng >= g[n]) continue;
          abierta[n] = v;
          g[n] = ng;
          padre[n] = c;
          this.meter(n, ng + this.h(n));
        }
      }
    }
    return null;
  }

  /** ¿Se ve b desde a sin pisar nada prohibido? Se revisa una franja, no solo una línea. */
  private seVe(a: Punto, b: Punto): boolean {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const largo = Math.hypot(dx, dy);
    if (largo < 1) return true;
    const nx = (-dy / largo) * HOLGURA;
    const ny = (dx / largo) * HOLGURA;
    const pasos = Math.ceil(largo / (this.celda * 0.4));
    for (let k = 0; k <= pasos; k++) {
      const x = a.x + (dx * k) / pasos;
      const y = a.y + (dy * k) / pasos;
      if (!this.libre(x, y)) return false;
      // Los costados solo se exigen lejos de los extremos, que pueden estar junto a un borde.
      if (k > 1 && k < pasos - 1 && (!this.libre(x + nx, y + ny) || !this.libre(x - nx, y - ny))) return false;
    }
    return true;
  }

  /** Quita los puntos intermedios que sobran: de cada punto, hasta donde se sigue viendo. */
  private tensar(puntos: Punto[]): Punto[] {
    const salida = [puntos[0]];
    let ancla = 0;
    while (ancla < puntos.length - 1) {
      let siguiente = ancla + 1;
      while (siguiente + 1 < puntos.length && this.seVe(puntos[ancla], puntos[siguiente + 1])) siguiente++;
      salida.push(puntos[siguiente]);
      ancla = siguiente;
    }
    return salida;
  }

  /** Cambia cada esquina por una curva corta, si la curva sigue sobre lo caminable. */
  private redondear(puntos: Punto[]): Punto[] {
    if (puntos.length < 3) return puntos;
    const salida = [puntos[0]];
    for (let k = 1; k < puntos.length - 1; k++) {
      const a = salida[salida.length - 1];
      const b = puntos[k];
      const c = puntos[k + 1];
      const lab = Math.hypot(a.x - b.x, a.y - b.y);
      const lbc = Math.hypot(c.x - b.x, c.y - b.y);
      const d = Math.min(CURVA, lab / 2, lbc / 2);
      if (d < 4) {
        salida.push(b);
        continue;
      }
      const p = { x: b.x + ((a.x - b.x) / lab) * d, y: b.y + ((a.y - b.y) / lab) * d };
      const q = { x: b.x + ((c.x - b.x) / lbc) * d, y: b.y + ((c.y - b.y) / lbc) * d };
      if (!this.seVe(p, q)) {
        salida.push(b);
        continue;
      }
      // Curva de Bézier cuadrática de p a q con b como control.
      for (let s = 0; s <= 4; s++) {
        const t = s / 4;
        const u = 1 - t;
        salida.push({ x: u * u * p.x + 2 * u * t * b.x + t * t * q.x, y: u * u * p.y + 2 * u * t * b.y + t * t * q.y });
      }
    }
    salida.push(puntos[puntos.length - 1]);
    return salida;
  }
}
