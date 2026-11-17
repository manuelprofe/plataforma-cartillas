// La tarjeta de entrada (esqueleto.md §1.3): el adulto escribe el código del grupo (o lo trae el
// QR de la tarjeta: /t/CÓDIGO) y el niño busca su cara. El código se escribe una vez por grupo:
// el celular lo recuerda. Sin red en un celular nuevo, Lumi invita a jugar sin tarjeta.
import { useEffect, useRef, useState } from 'react';
import { sonar } from '../audio';
import { buscarGrupo, codigosRecordados, LETRAS_CODIGO, type Cara } from '../perfiles';
import { Accion, Disco, Globo, Icono, type Paquete } from './comun';

const LARGO = 5;

/** "Para usar tu tarjeta hace falta internet una vez. Mientras tanto, ¡a jugar!" (boceto 01). */
export function SinRed({ paquete, onInvitado, onVolver }: { paquete: Paquete; onInvitado: () => void; onVolver: () => void }) {
  useEffect(() => paquete.hablar('entrada-sin-red'), [paquete]);
  return (
    <main className="nino">
      <div className="nino__centro">
        <Globo paquete={paquete} clave="entrada-sin-red" grande />
      </div>
      <div className="nino__abajo">
        <Accion icono="jugar" tipo="jugar" onClick={() => (sonar('fiesta'), onInvitado())}>
          Jugar sin tarjeta
        </Accion>
        <Accion icono="atras" tipo="tarjeta" className="accion--bajo" onClick={onVolver}>
          Volver
        </Accion>
      </div>
    </main>
  );
}

interface PropsCodigo {
  paquete: Paquete;
  /** Código que trajo el QR de la tarjeta (/t/CÓDIGO): se consulta solo. */
  inicial?: string;
  onCaras: (codigo: string, caras: Cara[]) => void;
  onInvitado: () => void;
  onVolver: () => void;
}

/** Pantalla para el adulto: escribe el código del grupo con un teclado propio de letras grandes. */
export function TarjetaCodigo({ paquete, inicial, onCaras, onInvitado, onVolver }: PropsCodigo) {
  const limpio = (t: string) => [...t.toUpperCase()].filter((c) => LETRAS_CODIGO.includes(c)).join('').slice(0, LARGO);
  const [codigo, setCodigo] = useState(() => limpio(inicial ?? ''));
  const [estado, setEstado] = useState<'escribiendo' | 'buscando' | 'no-existe' | 'espera' | 'sin-red' | 'fallo'>(() => (navigator.onLine ? 'escribiendo' : 'sin-red'));
  const recordados = codigosRecordados();
  const pedido = useRef(0);

  const consultar = (c: string) => {
    if (c.length < LARGO) return;
    const turno = ++pedido.current;
    setEstado('buscando');
    buscarGrupo(c)
      .then((r) => {
        if (turno !== pedido.current) return;
        if (r.tipo === 'ok') onCaras(c, r.caras);
        else setEstado(r.tipo);
      })
      .catch(() => turno === pedido.current && setEstado('fallo'));
  };

  // El QR trae el código completo: se consulta enseguida.
  useEffect(() => {
    if (codigo.length === LARGO && estado === 'escribiendo') consultar(codigo);
    // Solo al abrir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const poner = (nuevo: string) => {
    if (estado === 'buscando') return;
    const c = limpio(nuevo);
    setCodigo(c);
    setEstado('escribiendo');
    if (c.length === LARGO) consultar(c);
  };

  // Teclado físico (computador o tableta con teclado).
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Backspace') poner(codigo.slice(0, -1));
      else if (e.key.length === 1 && LETRAS_CODIGO.includes(e.key.toUpperCase())) poner(codigo + e.key);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  });

  if (estado === 'sin-red') return <SinRed paquete={paquete} onInvitado={onInvitado} onVolver={onVolver} />;

  const aviso = {
    escribiendo: '',
    buscando: 'Buscando el grupo…',
    'no-existe': 'Ese código no existe. Revise la tarjeta.',
    espera: 'Se probaron muchos códigos en este celular. Intente de nuevo en una hora.',
    fallo: 'No se pudo consultar. Intente de nuevo en un momento.',
  }[estado];

  return (
    <main className="nino nino--tarjeta">
      <div className="nino__barra">
        <button type="button" className="redondo" aria-label="Volver" onClick={onVolver}>
          <Icono nombre="atras" />
        </button>
      </div>
      <h1 className="tarjeta__titulo">Escriba el código del grupo que está en la tarjeta</h1>
      {recordados.length > 0 && (
        <div className="tarjeta__recordados">
          {recordados.map((r) => (
            <button key={r.codigo} type="button" className="tarjeta__recordado" onClick={() => poner(r.codigo)}>
              {r.grupo} · {r.codigo}
            </button>
          ))}
        </div>
      )}
      <div className="tarjeta__casillas" aria-label={`Código: ${codigo.split('').join(' ') || 'vacío'}`} role="status">
        {Array.from({ length: LARGO }, (_, i) => (
          <span key={i} className={`tarjeta__casilla${i === codigo.length ? ' es-actual' : ''}`}>
            {codigo[i] ?? ''}
          </span>
        ))}
      </div>
      <p className={`tarjeta__aviso${estado !== 'buscando' && aviso ? ' es-error' : ''}`} role="alert">
        {aviso}
      </p>
      <div className="teclado-codigo" aria-busy={estado === 'buscando'}>
        {[...LETRAS_CODIGO].map((c) => (
          <button key={c} type="button" onClick={() => poner(codigo + c)} disabled={codigo.length >= LARGO}>
            {c}
          </button>
        ))}
        <button type="button" className="teclado-codigo__borrar" aria-label="Borrar la última" onClick={() => poner(codigo.slice(0, -1))} disabled={!codigo}>
          <Icono nombre="borrar" tam={22} />
        </button>
      </div>
      <button type="button" className="tarjeta__seguir" disabled={codigo.length < LARGO || estado === 'buscando'} onClick={() => consultar(codigo)}>
        Seguir
      </button>
    </main>
  );
}

/** "¿Quién eres?": las caras del grupo, en orden alfabético. */
export function TarjetaQuien({ paquete, caras, onCara, onVolver }: { paquete: Paquete; caras: Cara[]; onCara: (c: Cara) => void; onVolver: () => void }) {
  useEffect(() => paquete.hablar('entrada-busca'), [paquete]);
  const orden = [...caras].sort((a, b) => a.apodo.localeCompare(b.apodo, 'es'));
  return (
    <main className="nino nino--caras">
      <div className="nino__barra">
        <button type="button" className="redondo" aria-label="Volver" onClick={onVolver}>
          <Icono nombre="atras" />
        </button>
      </div>
      <Globo paquete={paquete} clave="entrada-busca" />
      <div className="rejilla rejilla--tres">
        {orden.map((c) => (
          <button key={c.id} type="button" className="cara cara--chica" onClick={() => (sonar('toque'), onCara(c))}>
            <Disco paquete={paquete} avatar={c.avatar} />
            <span className="cara__apodo">{c.apodo}</span>
          </button>
        ))}
      </div>
    </main>
  );
}
