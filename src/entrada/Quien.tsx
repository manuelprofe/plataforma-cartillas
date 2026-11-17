// "¿Quién va a jugar?" (`/`): la portada del celular de la familia (esqueleto.md §1.3, boceto 01).
// Sin niños con tarjeta: Lumi, "Jugar sin tarjeta" y "Tengo una tarjeta". Con niños: una cara
// por niño, la del invitado ("Sin tarjeta") y "Otro niño con tarjeta". El pie es la puerta del
// adulto (sostener 3 s), como siempre.
import { useEffect, useRef, useState } from 'react';
import { BotonSostenido } from '../BotonSostenido';
import { sonar } from '../audio';
import type { PerfilNino } from '../perfiles';
import { Accion, Disco, Globo, Icono, type Paquete } from './comun';
import './entrada.css';

const MS_PUERTA_FAMILIA = 3000;
const MS_ELEGIR = 320;

interface Props {
  paquete: Paquete;
  perfiles: PerfilNino[];
  /** Personaje del invitado, si ya eligió. */
  heroeInvitado?: string;
  onPerfil: (perfil: PerfilNino) => void;
  onInvitado: () => void;
  onTarjeta: () => void;
  onFamilia: () => void;
}

export function Quien({ paquete, perfiles, heroeInvitado, onPerfil, onInvitado, onTarjeta, onFamilia }: Props) {
  const [elegido, setElegido] = useState<string | null>(null);
  const [pista, setPista] = useState(false);
  const espera = useRef<number | undefined>(undefined);
  useEffect(() => {
    paquete.hablar('entrada-quien');
    return () => clearTimeout(espera.current);
    // Solo al entrar a la pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const elegir = (id: string, luego: () => void) => {
    if (elegido) return;
    sonar('toque');
    setElegido(id);
    espera.current = window.setTimeout(luego, MS_ELEGIR);
  };
  const apodo = perfiles.find((p) => p.id === elegido)?.apodo;

  const pie = (
    <>
      <BotonSostenido ms={MS_PUERTA_FAMILIA} className="pie-familia" onListo={onFamilia} onCorto={() => setPista(true)}>
        Para la familia
      </BotonSostenido>
      <p className="pie-familia__pista" role="status">
        {pista ? 'Mantenga presionado 3 segundos.' : ''}
      </p>
    </>
  );

  if (!perfiles.length) {
    return (
      <main className="nino nino--quien">
        <div className="nino__centro">
          <img className="nino__lumi" src={paquete.base + paquete.lumi} alt="" width="280" height="263" draggable={false} />
          <h1 className="nino__titulo">{paquete.titulo}</h1>
          <Globo paquete={paquete} clave="entrada-quien" imagen={undefined} />
        </div>
        <div className="nino__abajo">
          <Accion icono="jugar" tipo="jugar" className="jugar-invitado" onClick={() => (sonar('fiesta'), onInvitado())}>
            Jugar sin tarjeta
          </Accion>
          <Accion icono="tarjeta" tipo="tarjeta" onClick={onTarjeta}>
            Tengo una tarjeta
          </Accion>
        </div>
        {pie}
      </main>
    );
  }

  return (
    <main className="nino nino--quien">
      <Globo paquete={paquete} clave={elegido ? undefined : 'entrada-quien'} texto={elegido ? `¡Hola${apodo ? `, ${apodo}` : ''}!` : undefined} imagen={elegido ? paquete.lumiFiesta : undefined} />
      <div className={`rejilla${elegido ? ' rejilla--eligiendo' : ''}`}>
        {perfiles.map((p) => (
          <button key={p.id} type="button" className={`cara${elegido === p.id ? ' cara--elegida' : ''}`} onClick={() => elegir(p.id, () => onPerfil(p))}>
            <Disco paquete={paquete} avatar={p.avatar} />
            <span className="cara__apodo">{p.apodo}</span>
          </button>
        ))}
        <button type="button" className={`cara cara--invitado jugar-invitado${elegido === 'invitado' ? ' cara--elegida' : ''}`} onClick={() => elegir('invitado', onInvitado)}>
          <Disco paquete={paquete} avatar={heroeInvitado} />
          <span className="cara__apodo">Sin tarjeta</span>
        </button>
      </div>
      <button type="button" className="accion accion--tarjeta accion--otro" onClick={() => (sonar('toque'), onTarjeta())}>
        <span className="accion__ico">
          <Icono nombre="mas" tam={28} />
        </span>
        <span>Otro niño con tarjeta</span>
      </button>
      {pie}
    </main>
  );
}
