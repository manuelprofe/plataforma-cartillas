// Piezas que comparten las pantallas del docente: la cara de un niño, la cortina de privacidad
// y el reloj que mueve el aviso de deshacer.
import { useEffect, useState, type ReactNode } from 'react';
import { navegar } from '../navegacion';
import { minutosDesdeProyeccion, terminarClase } from '../proyectando';
import { Cortina } from './base';
import type { Heroe, Paquete } from './docente';

/** La cara de un niño: su personaje recortado en un círculo (el tamaño lo da la clase). */
export function Cara({ paquete, avatar, className = '' }: { paquete: Paquete; avatar: string; className?: string }) {
  const heroe: Heroe | undefined = paquete.heroes.find((h) => h.id === avatar) ?? paquete.heroes[0];
  // Misma cuenta que la cara del niño: el ancla "cara" del paquete centra el recorte.
  const y = heroe?.anclas?.cara ? Math.max(0, heroe.anclas.cara.y * 100 - 18) : 20;
  return (
    <span className={`cara-d ${className}`}>
      {heroe && <img src={paquete.base + heroe.imagen} alt="" width="48" height="48" draggable={false} style={{ objectPosition: `50% ${y}%` }} />}
    </span>
  );
}

/** "20 nov 2026" desde AAAA-MM-DD, sin pasar por la zona horaria (la fecha es la del papel). */
export function fechaCorta(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number);
  const mes = new Intl.DateTimeFormat('es-CO', { month: 'short' }).format(new Date(a, m - 1, d)).replace('.', '');
  return `${d} ${mes} ${a}`;
}

/** Pantalla con apodos: va detrás de la cortina si en este aparato se proyectó hace poco (esqueleto §2.3). */
export function ConCortina({ children }: { children: ReactNode }) {
  const [minutos, setMinutos] = useState(minutosDesdeProyeccion);
  const [mostrar, setMostrar] = useState(false);
  if (minutos === null || mostrar) return <>{children}</>;
  return (
    <Cortina
      motivo={minutos === 0 ? 'Hace menos de un minuto estaba proyectando desde este aparato.' : `Hace ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'} estaba proyectando desde este aparato.`}
      onMostrar={() => setMostrar(true)}
      onInicio={() => navegar('/docente')}
      onTermine={() => {
        terminarClase();
        setMinutos(null);
      }}
    />
  );
}

/** Hora actual que se actualiza cada 200 ms mientras `activo`; mueve el aviso de deshacer. */
export function useAhora(activo: boolean): number {
  const [ahora, setAhora] = useState(Date.now);
  useEffect(() => {
    if (!activo) return;
    setAhora(Date.now());
    const id = window.setInterval(() => setAhora(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [activo]);
  return ahora;
}
