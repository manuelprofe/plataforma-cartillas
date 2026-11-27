// Festivos de Colombia (Ley 51 de 1983, "Ley Emiliani"): fijos, trasladables al lunes siguiente y
// los que dependen de la Pascua. Se calculan para cualquier año; no hace falta red.

const iso = (d: Date) => d.toISOString().slice(0, 10);
const utc = (a: number, m: number, d: number) => new Date(Date.UTC(a, m - 1, d));
const mas = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
/** El mismo día si es lunes; si no, el lunes siguiente. */
const alLunes = (d: Date) => mas(d, (8 - d.getUTCDay()) % 7);

/** Domingo de Pascua (algoritmo de Meeus/Jones/Butcher). */
function pascua(a: number): Date {
  const b = a % 19, c = Math.floor(a / 100), d = a % 100;
  const e = Math.floor(c / 4), f = c % 4, g = Math.floor((c + 8) / 25), h = Math.floor((c - g + 1) / 3);
  const i = (19 * b + c - e - h + 15) % 30, k = Math.floor(d / 4), l = d % 4;
  const m = (32 + 2 * f + 2 * k - i - l) % 7, n = Math.floor((b + 11 * i + 22 * m) / 451);
  const mes = Math.floor((i + m - 7 * n + 114) / 31), dia = ((i + m - 7 * n + 114) % 31) + 1;
  return utc(a, mes, dia);
}

const cache = new Map<number, Map<string, string>>();

/** Festivos de un año: fecha AAAA-MM-DD → nombre. */
export function festivos(a: number): Map<string, string> {
  let f = cache.get(a);
  if (f) return f;
  const p = pascua(a);
  const lista: [Date, string][] = [
    [utc(a, 1, 1), 'Año Nuevo'],
    [alLunes(utc(a, 1, 6)), 'Reyes Magos'],
    [alLunes(utc(a, 3, 19)), 'San José'],
    [mas(p, -3), 'Jueves Santo'],
    [mas(p, -2), 'Viernes Santo'],
    [utc(a, 5, 1), 'Día del Trabajo'],
    [alLunes(mas(p, 39)), 'Ascensión del Señor'],
    [alLunes(mas(p, 60)), 'Corpus Christi'],
    [alLunes(mas(p, 68)), 'Sagrado Corazón'],
    [alLunes(utc(a, 6, 29)), 'San Pedro y San Pablo'],
    [utc(a, 7, 20), 'Independencia'],
    [utc(a, 8, 7), 'Batalla de Boyacá'],
    [alLunes(utc(a, 8, 15)), 'Asunción de la Virgen'],
    [alLunes(utc(a, 10, 12)), 'Día de la Raza'],
    [alLunes(utc(a, 11, 1)), 'Todos los Santos'],
    [alLunes(utc(a, 11, 11)), 'Independencia de Cartagena'],
    [utc(a, 12, 8), 'Inmaculada Concepción'],
    [utc(a, 12, 25), 'Navidad'],
  ];
  f = new Map(lista.map(([d, n]) => [iso(d), n]));
  cache.set(a, f);
  return f;
}

export const festivo = (fecha: string) => festivos(Number(fecha.slice(0, 4))).get(fecha);
