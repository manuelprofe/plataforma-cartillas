// Reconocimiento de voz para la práctica de pronunciación.
// Nada se graba ni se guarda: el navegador convierte la voz en texto y aquí solo se
// compara ese texto con la palabra. Si el dispositivo no tiene micrófono, el permiso se
// niega o no hay servicio, el juego ofrece escribir o decirlo en voz alta sin micrófono.

interface Alternativa {
  transcript: string;
}
interface EventoResultado {
  results: ArrayLike<ArrayLike<Alternativa>>;
}
interface EventoError {
  error: string;
}
interface Reconocedor {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  processLocally?: boolean;
  onresult: ((e: EventoResultado) => void) | null;
  onerror: ((e: EventoError) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
}
interface ClaseReconocedor {
  new (): Reconocedor;
  available?: (o: { langs: string[]; processLocally: boolean }) => Promise<string>;
}

const Clase: ClaseReconocedor | undefined =
  typeof window === 'undefined'
    ? undefined
    : ((window as unknown as Record<string, ClaseReconocedor | undefined>).SpeechRecognition ??
      (window as unknown as Record<string, ClaseReconocedor | undefined>).webkitSpeechRecognition);

let negado = false;
let local: Promise<boolean> | null = null;

/** Si vale la pena mostrar el botón del micrófono. */
export function hayMicrofono(): boolean {
  return Boolean(Clase) && !negado && typeof navigator !== 'undefined' && navigator.onLine !== false;
}

// Donde el navegador puede reconocer la voz dentro del propio dispositivo, se prefiere:
// así la voz del niño no sale del celular.
function puedeLocal(idioma: string): Promise<boolean> {
  local ??= (async () => {
    try {
      return (await Clase?.available?.({ langs: [idioma], processLocally: true })) === 'available';
    } catch {
      return false;
    }
  })();
  return local;
}

export type Oido = { tipo: 'oido'; frases: string[] } | { tipo: 'silencio' } | { tipo: 'sin-micro' };

const MS_MAXIMO = 7000;

/** Escucha una vez. Devuelve una función para cancelar. */
export function escuchar(idioma: string, alTerminar: (r: Oido) => void): () => void {
  if (!Clase) {
    alTerminar({ tipo: 'sin-micro' });
    return () => {};
  }
  let listo = false;
  let rec: Reconocedor | null = null;
  const terminar = (r: Oido) => {
    if (listo) return;
    listo = true;
    clearTimeout(reloj);
    alTerminar(r);
  };
  const reloj = window.setTimeout(() => {
    rec?.abort();
    terminar({ tipo: 'silencio' });
  }, MS_MAXIMO);

  void puedeLocal(idioma).then((enDispositivo) => {
    if (listo || !Clase) return;
    try {
      rec = new Clase();
      rec.lang = idioma;
      rec.interimResults = false;
      rec.continuous = false;
      rec.maxAlternatives = 5;
      if (enDispositivo) rec.processLocally = true;
      rec.onresult = (e) => {
        const frases: string[] = [];
        for (let i = 0; i < e.results.length; i++) {
          const res = e.results[i];
          for (let k = 0; k < res.length; k++) frases.push(res[k].transcript);
        }
        terminar(frases.length ? { tipo: 'oido', frases } : { tipo: 'silencio' });
      };
      rec.onerror = (e) => {
        if (e.error === 'no-speech' || e.error === 'aborted') terminar({ tipo: 'silencio' });
        else {
          negado = true;
          terminar({ tipo: 'sin-micro' });
        }
      };
      rec.onend = () => terminar({ tipo: 'silencio' });
      rec.start();
    } catch {
      negado = true;
      terminar({ tipo: 'sin-micro' });
    }
  });

  return () => {
    listo = true;
    clearTimeout(reloj);
    rec?.abort();
  };
}

// ---------- Comparar lo dicho o escrito con la palabra ----------

const CIFRAS: Record<string, string> = {
  '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five', '6': 'six',
  '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten', '11': 'eleven', '12': 'twelve',
};

/** Minúsculas, sin tildes ni signos, con las cifras escritas en letras. */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’'`´]/g, '')
    .replace(/[^a-z0-9ñ ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => CIFRAS[w] ?? w)
    .join(' ');
}

/** El reconocedor puede oír "a pencil" o "pencil please": basta con que la palabra esté. */
export function seOyo(frases: string[], palabra: string): boolean {
  const meta = normalizar(palabra);
  return frases.some((f) => ` ${normalizar(f)} `.includes(` ${meta} `));
}

function distancia(a: string, b: string): number {
  const fila = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previo = fila[0];
    fila[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = fila[j];
      fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, previo + (a[i - 1] === b[j - 1] ? 0 : 1));
      previo = tmp;
    }
  }
  return fila[b.length];
}

/** 'bien' si está igual, 'casi' si le falta o sobra una letra (dos en palabras largas). */
export function comparaEscrito(escrito: string, palabra: string): 'bien' | 'casi' | 'otra' {
  const a = normalizar(escrito).replace(/ /g, '');
  const b = normalizar(palabra).replace(/ /g, '');
  if (!a) return 'otra';
  if (a === b) return 'bien';
  const margen = b.length >= 8 ? 2 : b.length >= 4 ? 1 : 0;
  return distancia(a, b) <= margen ? 'casi' : 'otra';
}
