// Reproduce el audio de una palabra del paquete (voz nativa en inglés). Una sola voz a la vez:
// tocar otra cosa corta la anterior. No guarda nada; solo suena.
import { base } from './datos';

let actual: HTMLAudioElement | null = null;
let temporizador = 0;

export function detener() {
  window.clearTimeout(temporizador);
  if (actual) {
    actual.onended = null;
    actual.pause();
    actual = null;
  }
}

/** Suena `veces` veces seguidas; `despacio` baja la velocidad (el tono se conserva). */
export function sonar(ruta: string | undefined, { veces = 1, despacio = false }: { veces?: number; despacio?: boolean } = {}) {
  detener();
  if (!ruta) return;
  const audio = new Audio(base() + ruta);
  audio.playbackRate = despacio ? 0.7 : 1;
  actual = audio;
  let faltan = veces;
  const una = () => {
    audio.currentTime = 0;
    audio.play().catch(() => {
      // El navegador pidió un toque antes de sonar: la palabra siempre está escrita en pantalla.
    });
  };
  audio.onended = () => {
    faltan -= 1;
    if (faltan > 0) temporizador = window.setTimeout(una, 600);
  };
  una();
}
