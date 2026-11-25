// Duración de la clase: tres opciones fijas (45, 55 y 90 min) para que todos los colegios usen el
// mismo formato. Los planeadores de la cartilla están escritos para 55 min; al elegir otra
// duración, los minutos de cada momento (y los que se nombran dentro del texto) se reparten en
// proporción y siempre suman el total. La elección se recuerda en este aparato.
import { useSyncExternalStore } from 'react';
import type { Bloque, Material } from './datos';

export const DURACIONES = [45, 55, 90] as const;
export type Duracion = (typeof DURACIONES)[number];
const BASE: Duracion = 55;
const LLAVE = 'cuaderno.duracion-clase';

/** Reparte `total` en enteros proporcionales a `pesos` (mayor residuo); ninguno baja de `minimo`. */
export function repartir(pesos: number[], total: number, minimo = 1): number[] {
  const suma = pesos.reduce((a, b) => a + b, 0);
  if (!suma) return pesos.map(() => 0);
  const exactos = pesos.map((p) => (p * total) / suma);
  const r = exactos.map((x, i) => (pesos[i] > 0 ? Math.max(minimo, Math.floor(x)) : 0));
  let falta = total - r.reduce((a, b) => a + b, 0);
  const orden = exactos.map((x, i) => ({ i, resto: x - Math.floor(x) })).filter(({ i }) => pesos[i] > 0).sort((a, b) => b.resto - a.resto || pesos[b.i] - pesos[a.i]);
  for (let k = 0; falta > 0 && orden.length; k++, falta--) r[orden[k % orden.length].i]++;
  // Si el mínimo pasó del total, se quita a los más grandes.
  while (falta < 0) {
    const mayor = r.indexOf(Math.max(...r));
    if (r[mayor] <= minimo) break;
    r[mayor]--;
    falta++;
  }
  return r;
}

const MIN = /(\d+)(\s?min(?:utos)?\b)/g;

/** Cambia los "N min" de un texto por su parte de `nuevo`, en proporción a `viejo`. */
function textoAjustado(t: string, viejo: number, nuevo: number): string {
  const citados = [...t.matchAll(MIN)].map((m) => Number(m[1]));
  if (!citados.length || viejo === nuevo) return t;
  const suma = citados.reduce((a, b) => a + b, 0);
  // Si lo citado no cubre el momento (p. ej. "5 min" de 10), la parte se calcula sobre el momento.
  const nuevos = suma === viejo ? repartir(citados, nuevo) : citados.map((c) => Math.max(1, Math.round((c * nuevo) / viejo)));
  let k = 0;
  return t.replace(MIN, (_, _n, cola: string) => `${nuevos[k++]}${cola}`);
}

/** El material con sus momentos repartidos para `total` minutos. Sin cambio si ya dura eso. */
export function ajustarDuracion(material: Material, total: Duracion): Material {
  const momentos = material.bloques.filter((b) => b.tipo === 'momento') as Extract<Bloque, { tipo: 'momento' }>[];
  const actual = momentos.reduce((a, m) => a + m.minutos, 0);
  if (!momentos.length || actual === total) return material;
  const nuevos = repartir(
    momentos.map((m) => m.minutos),
    total,
    3,
  );
  let k = 0;
  const bloques = material.bloques.flatMap((b): Bloque[] => {
    if (b.tipo === 'momento') {
      const n = nuevos[k++];
      return [{ ...b, minutos: n, momento: textoAjustado(b.momento, b.minutos, n) }];
    }
    // La "hora tipo" describe la clase de 55; con otra duración se dice cómo se ajustó.
    if (b.tipo === 'parrafo' && /^Hora tipo/.test(b.texto)) {
      const resto = b.texto.replace(/^Hora tipo[\s\S]*?Suman \d+\.\s*/, '');
      return [{ ...b, texto: `Tiempos repartidos para ${total} min a partir de la clase tipo de ${actual} min. Ajústelos a su grupo.${resto && resto !== b.texto ? ` ${resto}` : ''}` }];
    }
    return [b];
  });
  return { ...material, bloques };
}

// Preferencia del docente en este aparato (puede faltar el almacenamiento: se usa 55).
const oyentes = new Set<() => void>();
function leerDuracion(): Duracion {
  try {
    const v = Number(localStorage.getItem(LLAVE));
    return (DURACIONES as readonly number[]).includes(v) ? (v as Duracion) : BASE;
  } catch {
    return BASE;
  }
}
let actual: Duracion = leerDuracion();

export function elegirDuracion(d: Duracion) {
  actual = d;
  try {
    localStorage.setItem(LLAVE, String(d));
  } catch {
    /* sin almacenamiento: vale para esta visita */
  }
  oyentes.forEach((f) => f());
}

export function useDuracion(): Duracion {
  return useSyncExternalStore(
    (f) => {
      oyentes.add(f);
      return () => oyentes.delete(f);
    },
    () => actual,
    () => BASE,
  );
}
