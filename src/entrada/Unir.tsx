// "¿Este camino lo recorriste tú?" (`/unir`, ronda-2-docente §2.3): un niño entra con su
// tarjeta y en el celular hay avance del invitado. Sí: se suma a su cuenta (nada se pierde ni
// se pisa) y Lumi cuenta sus estrellas. No: queda como invitado para quien lo reclame.
import { useEffect, useRef, useState } from 'react';
import { sonar } from '../audio';
import type { Mision } from '../tipos';
import { Accion, Disco, Globo, Icono, type Paquete } from './comun';

const MS_VOLAR = 600;
const MS_CONTADAS = 1800;
const MAX_FAROLES = 18;

interface Props {
  paquete: Paquete;
  /** Personaje y misiones del invitado. */
  heroe?: string;
  misiones: Mision[];
  onSi: () => void;
  onNo: () => void;
  onListo: () => void;
}

export function Unir({ paquete, heroe, misiones, onSi, onNo, onListo }: Props) {
  const [sumando, setSumando] = useState(false);
  const esperas = useRef<number[]>([]);
  useEffect(() => {
    paquete.hablar('entrada-unir');
    const e = esperas.current;
    return () => e.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const si = () => {
    if (sumando) return;
    setSumando(true);
    onSi();
    sonar('acierto');
    esperas.current.push(
      window.setTimeout(() => {
        sonar('fiesta');
        paquete.hablar('entrada-contadas');
      }, MS_VOLAR),
      window.setTimeout(onListo, MS_VOLAR + MS_CONTADAS),
    );
  };

  return (
    <main className={`nino nino--unir${sumando ? ' es-sumando' : ''}`}>
      <Globo paquete={paquete} clave={sumando ? 'entrada-contadas' : 'entrada-unir'} imagen={sumando ? paquete.lumiFiesta : undefined} />
      <div className="nino__centro">
        <Disco paquete={paquete} avatar={heroe} className="disco--grande disco--borde" />
        <ul className="faroles" aria-label={`${misiones.length} faroles encendidos`}>
          {misiones.slice(0, MAX_FAROLES).map((m, i) => (
            <li key={m.id} className="farol-chico" style={{ transitionDelay: `${i * 25}ms` }}>
              <img src={paquete.base + m.icono} alt="" width="32" height="32" />
            </li>
          ))}
        </ul>
      </div>
      {!sumando && (
        <div className="nino__abajo nino__abajo--fila">
          <Accion icono="si" tipo="si" onClick={si}>
            Sí
          </Accion>
          <button type="button" className="accion accion--tarjeta accion--bajo" onClick={() => (sonar('toque'), onNo())}>
            <span className="accion__ico">
              <Icono nombre="no" />
            </span>
            <span>No</span>
          </button>
        </div>
      )}
    </main>
  );
}
