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
