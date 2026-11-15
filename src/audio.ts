// Voz y efectos de sonido.
// La voz viene grabada en el paquete de la cartilla; la síntesis del navegador queda de respaldo.

let ctx: AudioContext | null = null;

/** Debe llamarse dentro de un toque del usuario para que el navegador permita sonar. */
export function activarAudio() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
  if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
}

function tono(frec: number, inicio: number, dur: number, tipo: OscillatorType = 'sine', vol = 0.14) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gan = ctx.createGain();
  const t = ctx.currentTime + inicio;
  osc.type = tipo;
  osc.frequency.setValueAtTime(frec, t);
  gan.gain.setValueAtTime(0.0001, t);
  gan.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  gan.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gan).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export type Efecto = 'toque' | 'acierto' | 'intenta' | 'salto' | 'estrella' | 'fiesta' | 'girar' | 'volver' | 'pareja' | 'atrapar' | 'frasco';

export function sonar(efecto: Efecto) {
  switch (efecto) {
    case 'toque':
      tono(520, 0, 0.08, 'triangle', 0.08);
      break;
    case 'acierto':
      tono(660, 0, 0.12, 'triangle');
      tono(880, 0.1, 0.18, 'triangle');
      break;
    case 'intenta':
      tono(300, 0, 0.14, 'sine', 0.09);
      tono(260, 0.1, 0.16, 'sine', 0.07);
      break;
    case 'salto':
      tono(420, 0, 0.1, 'sine', 0.07);
      tono(560, 0.07, 0.1, 'sine', 0.06);
      break;
    case 'estrella':
      tono(988, 0, 0.1, 'triangle', 0.1);
      tono(1319, 0.08, 0.2, 'triangle', 0.1);
      break;
    case 'fiesta':
      [523, 659, 784, 1047].forEach((f, i) => tono(f, i * 0.11, 0.22, 'triangle'));
      break;
    case 'girar':
      tono(740, 0, 0.06, 'triangle', 0.06);
      tono(980, 0.04, 0.06, 'triangle', 0.05);
      break;
    case 'volver':
      // Muy bajo: las cartas que vuelven no suenan a error.
      tono(500, 0, 0.06, 'sine', 0.04);
      break;
    case 'pareja':
      tono(660, 0, 0.1, 'triangle');
      tono(880, 0.08, 0.1, 'triangle');
      tono(1175, 0.16, 0.18, 'triangle', 0.09);
      break;
    case 'atrapar':
      tono(880, 0, 0.08, 'triangle');
      tono(1320, 0.06, 0.12, 'triangle', 0.08);
      break;
    case 'frasco':
      tono(523, 0, 0.25, 'sine', 0.08);
      tono(784, 0.05, 0.3, 'sine', 0.06);
      break;
  }
}

// ---------- Sonido de ambiente ----------
// Por ahora se sintetiza en el dispositivo (no pesa nada). Cuando haya audio
// definitivo, cada ambiente pasará a ser un archivo del paquete de la cartilla.

let ambiente: { nivel: GainNode; parar: () => void } | null = null;
const NIVEL_AMBIENTE = 0.9;

function nota(salida: AudioNode, frec: number, inicio: number, dur: number, vol: number, hasta = frec) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gan = ctx.createGain();
  const t = ctx.currentTime + inicio;
  osc.frequency.setValueAtTime(frec, t);
  osc.frequency.linearRampToValueAtTime(hasta, t + dur);
  gan.gain.setValueAtTime(0.0001, t);
  gan.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.03, dur / 3));
  gan.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gan).connect(salida);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

/** Enciende el sonido de fondo de un territorio. Requiere que el audio ya esté activado. */
export function iniciarAmbiente(tipo: 'bosque-noche') {
  pararAmbiente();
  if (!ctx || tipo !== 'bosque-noche') return;
  const c = ctx;
  const nivel = c.createGain();
  nivel.gain.value = 0.0001;
  nivel.gain.exponentialRampToValueAtTime(NIVEL_AMBIENTE, c.currentTime + 2);
  nivel.connect(c.destination);

  // Brisa: ruido filtrado que sube y baja despacio.
  const muestras = c.sampleRate * 2;
  const bufer = c.createBuffer(1, muestras, c.sampleRate);
  const datos = bufer.getChannelData(0);
  for (let i = 0; i < muestras; i++) datos[i] = Math.random() * 2 - 1;
  const ruido = c.createBufferSource();
  ruido.buffer = bufer;
  ruido.loop = true;
  const filtro = c.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.value = 420;
  const brisa = c.createGain();
  brisa.gain.value = 0.05;
  const vaiven = c.createOscillator();
  vaiven.frequency.value = 0.07;
  const cuanto = c.createGain();
  cuanto.gain.value = 0.03;
  vaiven.connect(cuanto).connect(brisa.gain);
  ruido.connect(filtro).connect(brisa).connect(nivel);
  ruido.start();
  vaiven.start();

  // Grillos: ráfagas cortas y agudas. Búho: dos notas graves de vez en cuando.
  const grillos = window.setInterval(() => {
    if (c.state !== 'running' || Math.random() < 0.35) return;
    const tono = 3900 + Math.random() * 700;
    const pulsos = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < pulsos; i++) nota(nivel, tono, i * 0.075, 0.05, 0.012);
  }, 900);
  const buho = window.setInterval(() => {
    if (c.state !== 'running' || Math.random() < 0.4) return;
    nota(nivel, 392, 0, 0.32, 0.03, 370);
    nota(nivel, 392, 0.45, 0.6, 0.035, 330);
  }, 13000);

  ambiente = {
    nivel,
    parar: () => {
      clearInterval(grillos);
      clearInterval(buho);
      nivel.gain.cancelScheduledValues(c.currentTime);
      nivel.gain.setTargetAtTime(0.0001, c.currentTime, 0.2);
      window.setTimeout(() => {
        ruido.stop();
        vaiven.stop();
        nivel.disconnect();
      }, 900);
    },
  };
}

export function pararAmbiente() {
  ambiente?.parar();
  ambiente = null;
}

/** Baja el ambiente mientras un personaje habla, para que se entienda la voz. */
export function atenuarAmbiente(bajo: boolean) {
  if (!ambiente || !ctx) return;
  ambiente.nivel.gain.cancelScheduledValues(ctx.currentTime);
  ambiente.nivel.gain.setTargetAtTime(bajo ? NIVEL_AMBIENTE * 0.3 : NIVEL_AMBIENTE, ctx.currentTime, 0.3);
}

let turnoVoz = 0;

// ---------- Voz grabada ----------
// El paquete de la cartilla trae la voz ya generada (herramientas/generar_voz.py): un índice
// texto → archivo por idioma. Lo que no esté en el índice se dice con la voz del navegador.

type IndiceVoz = Record<string, Record<string, string>>;
let voz: { base: string; indice: IndiceVoz } | null = null;
// Se guarda el audio comprimido (pocos KB por frase), no el decodificado: en un celular de
// gama baja el decodificado de todas las frases ocuparía decenas de MB.
const grabaciones = new Map<string, Promise<ArrayBuffer>>();
let sonando: AudioBufferSourceNode | null = null;
/** Si la grabación no está lista en este tiempo, esa frase la dice la voz del navegador. */
const MS_ESPERA_GRABACION = 1500;

/** Le dice al audio dónde está la voz grabada de la cartilla. */
export function configurarVoz(base: string, indice: IndiceVoz | undefined) {
  voz = indice ? { base, indice } : null;
  grabaciones.clear();
}

function grabacion(url: string): Promise<ArrayBuffer> {
  let g = grabaciones.get(url);
  if (!g) {
    g = fetch(url).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)));
    grabaciones.set(url, g);
    // Si falló (sin red y sin guardar todavía), que se pueda volver a intentar después.
    g.catch(() => grabaciones.delete(url));
  }
  return g;
}

// El navegador puede pausar el audio (llamada, cambio de app, pestaña en segundo plano):
// se reanuda al volver y con cualquier toque.
function reanudar() {
  if (ctx && ctx.state !== 'running') void ctx.resume().catch(() => {});
}
if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', reanudar, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => !document.hidden && reanudar());
}

function pararGrabacion() {
  if (!sonando) return;
  sonando.onended = null;
  try {
    sonando.stop();
  } catch {
    // Ya había terminado.
  }
  sonando = null;
}

/**
 * Dice un texto. `alTerminar` se llama cuando termina de sonar, solo si nada lo interrumpió
 * (si no hay voz disponible, se llama enseguida para no trancar el juego).
 */
export function decir(texto: string, idioma: string, alTerminar?: () => void) {
  const turno = ++turnoVoz;
  pararGrabacion();
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  // Pantallas a las que se llega sin pasar por "Jugar" (la de la familia): se intenta aquí.
  if (!ctx) activarAudio();
  const archivo = voz?.indice[idioma.slice(0, 2)]?.[texto.trim()];
  const c = ctx;
  let resuelto = false;
  const respaldo = () => {
    if (resuelto || turno !== turnoVoz) return;
    resuelto = true;
    decirConNavegador(texto, idioma, turno, alTerminar);
  };
  if (!archivo || !voz || !c) {
    respaldo();
    return;
  }
  const plazo = window.setTimeout(respaldo, MS_ESPERA_GRABACION);
  Promise.all([grabacion(voz.base + archivo), c.state === 'running' ? null : c.resume()])
    // decodeAudioData se queda con los datos que recibe: se le pasa una copia.
    .then(([datos]) => c.decodeAudioData(datos.slice(0)))
    .then((bufer) => {
      clearTimeout(plazo);
      if (resuelto || turno !== turnoVoz) return;
      if (c.state !== 'running') {
        respaldo();
        return;
      }
      resuelto = true;
      const fuente = c.createBufferSource();
      fuente.buffer = bufer;
      fuente.connect(c.destination);
      fuente.onended = () => {
        if (sonando === fuente) sonando = null;
        if (turno === turnoVoz) alTerminar?.();
      };
      sonando = fuente;
      fuente.start();
    })
    .catch(() => {
      clearTimeout(plazo);
      respaldo();
    });
}

function decirConNavegador(texto: string, idioma: string, turno: number, alTerminar?: () => void) {
  if (!('speechSynthesis' in window)) {
    alTerminar?.();
    return;
  }
  const sint = window.speechSynthesis;
  const frase = new SpeechSynthesisUtterance(texto);
  const vozNavegador = sint.getVoices().find((v) => v.lang.replace('_', '-').startsWith(idioma.slice(0, 2)));
  if (vozNavegador) frase.voice = vozNavegador;
  frase.lang = idioma;
  frase.rate = 0.82;
  frase.pitch = 1.1;
  if (alTerminar) {
    frase.onend = () => turno === turnoVoz && alTerminar();
    // Sin voz disponible el navegador avisa con error: se sigue igual para no trancar el juego.
    frase.onerror = (e) => e.error !== 'interrupted' && e.error !== 'canceled' && turno === turnoVoz && alTerminar();
  }
  sint.speak(frase);
}

export function callar() {
  turnoVoz++;
  pararGrabacion();
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}
