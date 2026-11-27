// Tableros "en vivo": vuelven a leer cada minuto mientras la pestaña está a la vista, y al volver
// a ella. No abren canales en tiempo real (más liviano y funciona igual en gama baja).
import { useEffect, useState } from 'react';

const CADA_MS = 60_000;

/** Llama a `recargar` cada minuto con la pestaña visible; devuelve la hora de la última lectura. */
export function useEnVivo(recargar: () => void, listo: boolean): string {
  const [hora, setHora] = useState(() => new Date());
  useEffect(() => {
    if (listo) setHora(new Date());
  }, [listo]);
  useEffect(() => {
    const leer = () => {
      if (document.visibilityState !== 'visible') return;
      recargar();
      setHora(new Date());
    };
    const t = window.setInterval(leer, CADA_MS);
    document.addEventListener('visibilitychange', leer);
    return () => {
      window.clearInterval(t);
      document.removeEventListener('visibilitychange', leer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return hora.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
}

/** Días entre dos fechas AAAA-MM-DD (b − a). */
export const diasEntre = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

/** La fecha AAAA-MM-DD de `n` días antes de `iso`. */
export const restarDias = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10);

/** "12/11" (día/mes) de una fecha AAAA-MM-DD. */
export const diaMes = (iso: string) => `${Number(iso.slice(8, 10))}/${Number(iso.slice(5, 7))}`;

export const porciento = (n: number, de: number) => (de > 0 ? `${Math.round((n / de) * 100)} %` : '—');
