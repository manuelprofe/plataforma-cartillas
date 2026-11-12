// Voz y efectos de sonido.
// La voz usa por ahora la síntesis del navegador como sustituto temporal: se
// reemplazará por archivos de audio generados una sola vez con una voz de calidad.

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

export type Efecto = 'toque' | 'acierto' | 'intenta' | 'salto' | 'estrella' | 'fiesta';

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

export function decir(texto: string, idioma: string) {
  if (!('speechSynthesis' in window)) return;
  const sint = window.speechSynthesis;
  sint.cancel();
  const frase = new SpeechSynthesisUtterance(texto);
  const voz = sint.getVoices().find((v) => v.lang.replace('_', '-').startsWith(idioma.slice(0, 2)));
  if (voz) frase.voice = voz;
  frase.lang = idioma;
  frase.rate = 0.82;
  frase.pitch = 1.1;
  sint.speak(frase);
}

export function callar() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}
