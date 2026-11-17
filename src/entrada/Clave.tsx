// PIN de tres imágenes (`/clave`, boceto 02). Diez imágenes grandes siempre en el mismo sitio;
// cada toque llena la ranura siguiente y a la tercera se comprueba. Errar no suena a error ni
// cuenta intentos; tras varios errores Lumi "descansa" y ofrece jugar mientras tanto. Nunca
// se dice "bloqueado" (regla 6). Ninguna voz nombra la imagen tocada.
import { useEffect, useRef, useState } from 'react';
import { sonar } from '../audio';
import { entrarConPin, type Cara } from '../perfiles';
import { Accion, Disco, Globo, Icono, type Paquete } from './comun';
import { DibujoPin, IMAGENES_PIN } from './pin';
import { SinRed } from './Tarjeta';

const MS_SACUDIR = 380;
const MS_BIENVENIDA = 1400;

type Estado = 'escribiendo' | 'comprobando' | 'errado' | 'bien' | 'descanso' | 'ayuda' | 'sin-red';

interface Props {
  paquete: Paquete;
  nino: Cara & { codigo: string };
  onEntrar: () => void;
  onInvitado: () => void;
  onQuien: () => void;
  onVolver: () => void;
}

/** Descanso tras varios errores: nunca un bloqueo; siempre se puede seguir jugando. */
export function Descanso({ paquete, ayuda, onInvitado, onQuien }: { paquete: Paquete; ayuda: boolean; onInvitado: () => void; onQuien: () => void }) {
  const clave = ayuda ? 'entrada-ayuda' : 'entrada-descanso';
  useEffect(() => paquete.hablar(clave), [paquete, clave]);
  return (
    <main className="nino nino--descanso">
      <div className="nino__centro">
        <Globo paquete={paquete} clave={clave} grande />
      </div>
      <div className="nino__abajo">
        <Accion icono="jugar" tipo="jugar" onClick={() => (sonar('fiesta'), onInvitado())}>
          Jugar mientras tanto
        </Accion>
        <Accion icono="atras" tipo="tarjeta" className="accion--bajo" onClick={onQuien}>
          ¿Quién va a jugar?
        </Accion>
      </div>
    </main>
  );
}

export function Clave({ paquete, nino, onEntrar, onInvitado, onQuien, onVolver }: Props) {
  const [pin, setPin] = useState<number[]>([]);
  const [estado, setEstado] = useState<Estado>('escribiendo');
  const esperas = useRef<number[]>([]);
  useEffect(() => {
    paquete.hablar('entrada-clave');
    const e = esperas.current;
    return () => e.forEach(clearTimeout);
    // Solo al entrar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const comprobar = (completo: number[]) => {
    setEstado('comprobando');
    entrarConPin(nino, completo.join(''))
      .catch(() => 'sin-red' as const)
      .then((r) => {
        if (r === 'ok') {
          setEstado('bien');
          sonar('acierto');
          esperas.current.push(window.setTimeout(() => sonar('fiesta'), 300));
          paquete.hablar('entrada-hola');
          esperas.current.push(window.setTimeout(onEntrar, MS_BIENVENIDA));
        } else if (r === 'errado') {
          setEstado('errado');
          sonar('intenta');
          paquete.hablar('entrada-errado');
          esperas.current.push(
            window.setTimeout(() => {
              setPin([]);
              setEstado((e) => (e === 'errado' ? 'escribiendo' : e));
            }, MS_SACUDIR),
          );
        } else if (r === 'descanso') setEstado('descanso');
        else if (r === 'sin-red') setEstado('sin-red');
        // 'ayuda' (el docente debe cambiar el PIN) y 'no-existe' (ya no está en el grupo): pedir ayuda a la profe.
        else setEstado('ayuda');
      });
  };

  const tocar = (cifra: number) => {
    if (estado !== 'escribiendo' || pin.length >= 3) return;
    sonar('toque');
    const nuevo = [...pin, cifra];
    setPin(nuevo);
    if (nuevo.length === 3) comprobar(nuevo);
  };

  if (estado === 'descanso' || estado === 'ayuda') return <Descanso paquete={paquete} ayuda={estado === 'ayuda'} onInvitado={onInvitado} onQuien={onQuien} />;
  if (estado === 'sin-red') return <SinRed paquete={paquete} onInvitado={onInvitado} onVolver={onQuien} />;

  const bien = estado === 'bien';
  return (
    <main className={`nino nino--clave${estado === 'errado' ? ' es-errado' : ''}${bien ? ' es-bien' : ''}`}>
      <div className="nino__barra">
        {bien ? (
          <span className="redondo redondo--vacio" />
        ) : (
          <button type="button" className="redondo" aria-label="Volver" onClick={onVolver}>
            <Icono nombre="atras" />
          </button>
        )}
        <div className="quien-soy">
          <Disco paquete={paquete} avatar={nino.avatar} className="disco--borde" />
          <span>{nino.apodo}</span>
        </div>
        <span className="redondo redondo--vacio" />
      </div>
      <div className="ranuras" aria-label={`${pin.length} de 3 dibujos`} role="status">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`ranura${pin[i] !== undefined ? ' ranura--llena' : ''}${bien ? ' ranura--brilla' : ''}`}>
            {pin[i] !== undefined && <DibujoPin cifra={pin[i]} tam={44} />}
          </span>
        ))}
        <button type="button" className="redondo" aria-label="Borrar el último dibujo" disabled={!pin.length || estado !== 'escribiendo'} onClick={() => (sonar('volver'), setPin(pin.slice(0, -1)))}>
          <Icono nombre="borrar" />
        </button>
      </div>
      {bien ? (
        <div className="nino__centro">
          <Globo paquete={paquete} texto={`¡Hola, ${nino.apodo}! ${paquete.frase('entrada-hola').replace(/^¡Hola!\s*/, '')}`} clave="entrada-hola" imagen={paquete.lumiFiesta} grande />
        </div>
      ) : (
        <>
          <Globo paquete={paquete} clave={estado === 'errado' ? 'entrada-errado' : 'entrada-clave'} />
          <div className="teclado-pin">
            {IMAGENES_PIN.map((img, i) => (
              <button key={img.nombre} type="button" className="tecla-pin" aria-label={img.nombre} onClick={() => tocar(i)} disabled={estado !== 'escribiendo'}>
                <DibujoPin cifra={i} />
              </button>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
