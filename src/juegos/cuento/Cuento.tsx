// Plantilla de juego "cuento vivo" (español, transición a 2.°). Primero se escucha el cuento,
// página por página, con su dibujo y su texto (el texto acompaña: en transición no hace falta
// leerlo). Luego vienen las preguntas de comprensión: quién, qué pasó, en qué orden, qué sintió.
// No contiene cuentos ni preguntas: todo llega del contenido (mision.cuento). En las preguntas
// se puede volver a ver el cuento cuando se quiera; un error nunca quita nada.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { PreguntaCuento, PropsJuego } from '../../tipos';
import { CierreMision } from '../CierreMision';
import { decirAyuda } from '../ayuda';
import { mezclar } from '../mezclar';
import { callar, decir, sonar } from '../../audio';
import './cuento.css';

type Fase = { tipo: 'leer'; pagina: number; repaso: boolean } | { tipo: 'pregunta'; indice: number };

export function Cuento(props: PropsJuego) {
  const { mision, base, idiomaVoz, imagenGuia, imagenFiesta, onTerminar, onSalir } = props;
  const paginas = mision.cuento?.paginas ?? [];
  const preguntas = mision.cuento?.preguntas ?? [];
  const [fase, setFase] = useState<Fase>({ tipo: 'leer', pagina: 0, repaso: false });
  const [indicePregunta, setIndicePregunta] = useState(0);
  const [hablando, setHablando] = useState(false);
  const [errores, setErrores] = useState(0);
  const [cierre, setCierre] = useState(false);
  const esperas = useRef<number[]>([]);

  const luego = (f: () => void, ms: number) => {
    esperas.current.push(window.setTimeout(f, ms));
  };

  useEffect(
    () => () => {
      esperas.current.forEach(clearTimeout);
      callar();
    },
    [],
  );

  useEffect(() => {
    if (!paginas.length) onSalir();
  }, [paginas.length, onSalir]);

  const narrar = (texto: string) => {
    setHablando(true);
    decir(texto, idiomaVoz, () => setHablando(false));
  };

  // Cada página se cuenta sola al aparecer.
  const pagina = fase.tipo === 'leer' ? paginas[fase.pagina] : undefined;
  useEffect(() => {
    if (!pagina) return;
    const t = window.setTimeout(() => narrar(pagina.texto), 450);
    return () => {
      clearTimeout(t);
      callar();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina]);

  const pasar = (hacia: 1 | -1) => {
    if (fase.tipo !== 'leer') return;
    sonar('girar');
    const otra = fase.pagina + hacia;
    if (otra < 0) return;
    if (otra < paginas.length) {
      setFase({ ...fase, pagina: otra });
      return;
    }
    callar();
    if (!preguntas.length) {
      sonar('fiesta');
      setCierre(true);
      return;
    }
    if (!fase.repaso) decirAyuda(props, 'cuento-preguntas');
    setFase({ tipo: 'pregunta', indice: indicePregunta });
  };

  const siguientePregunta = () => {
    if (indicePregunta + 1 < preguntas.length) {
      setIndicePregunta(indicePregunta + 1);
      setFase({ tipo: 'pregunta', indice: indicePregunta + 1 });
    } else {
      sonar('fiesta');
      setCierre(true);
    }
  };

  const repasar = () => {
    sonar('toque');
    callar();
    setFase({ tipo: 'leer', pagina: 0, repaso: true });
  };

  const total = paginas.length + preguntas.length;
  const hecho = fase.tipo === 'leer' ? (fase.repaso ? paginas.length + indicePregunta : fase.pagina) : paginas.length + fase.indice;

  return (
    <div className="mision cuento">
      <header className="mision__barra">
        <button type="button" className="boton-salir" onClick={onSalir} aria-label="Volver al mapa">
          ✕
        </button>
        {!cierre && (
          <div className="puntos" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
              <span key={i} className={`punto${i < hecho ? ' punto--hecho' : i === hecho ? ' punto--ahora' : ''}`} />
            ))}
          </div>
        )}
        {!cierre && fase.tipo === 'pregunta' && (
          <button type="button" className="cuento__repasar" onClick={repasar} aria-label="Ver el cuento otra vez">
            📖
          </button>
        )}
      </header>

      {!cierre && pagina && fase.tipo === 'leer' && (
        <main className="cuento__pagina" key={fase.pagina}>
          <button type="button" className="cuento__dibujo" onClick={() => narrar(pagina.texto)} aria-label="Escuchar la página otra vez">
            <img src={base + pagina.imagen} alt="" draggable={false} />
          </button>
          <p className="cuento__texto" lang={idiomaVoz}>
            {pagina.texto}
          </p>
          <div className="cuento__pasar">
            <button type="button" className="cuento__boton" onClick={() => pasar(-1)} disabled={fase.pagina === 0} aria-label="Página anterior">
              ◀
            </button>
            <button type="button" className={`cuento__boton cuento__boton--seguir${hablando ? '' : ' cuento__boton--listo'}`} onClick={() => pasar(1)} aria-label="Página siguiente">
              ▶
            </button>
          </div>
        </main>
      )}

      {!cierre && fase.tipo === 'pregunta' && (
        <Pregunta
          key={fase.indice}
          pregunta={preguntas[fase.indice]}
          props={props}
          base={base}
          idiomaVoz={idiomaVoz}
          imagenGuia={imagenGuia}
          alFallar={() => setErrores((n) => n + 1)}
          alTerminar={() => luego(siguientePregunta, 1500)}
        />
      )}

      {cierre && <CierreMision mision={mision} errores={errores} base={base} imagenFiesta={imagenFiesta} alRegistrar={() => {}} onTerminar={onTerminar} />}
    </div>
  );
}

interface PropsPregunta {
  pregunta: PreguntaCuento;
  props: PropsJuego;
  base: string;
  idiomaVoz: string;
  imagenGuia: string;
  alFallar: () => void;
  alTerminar: () => void;
}

function Pregunta({ pregunta, props, base, idiomaVoz, imagenGuia, alFallar, alTerminar }: PropsPregunta) {
  const [fallos, setFallos] = useState(0);
  const [bien, setBien] = useState(false);
  const [elegida, setElegida] = useState<number | null>(null);
  const [orden, setOrden] = useState<number[]>([]);
  // Ordenar: las imágenes se muestran revueltas (nunca en el orden correcto).
  const revueltas = useMemo(() => {
    if (pregunta.tipo !== 'ordenar') return [];
    const indices = pregunta.imagenes.map((_, i) => i);
    let r = mezclar(indices);
    for (let i = 0; i < 5 && r.every((v, j) => v === j); i++) r = mezclar(indices);
    return r;
  }, [pregunta]);

  useEffect(() => {
    const t = window.setTimeout(() => decir(pregunta.dice, idiomaVoz), 1200);
    return () => clearTimeout(t);
  }, [pregunta, idiomaVoz]);

  const acertar = () => {
    sonar('acierto');
    setBien(true);
    if (pregunta.bien) decir(pregunta.bien, idiomaVoz);
    alTerminar();
  };

  const fallar = (despues?: () => void) => {
    sonar('intenta');
    alFallar();
    setFallos((n) => n + 1);
    decirAyuda(props, 'cuento-otra-vez', () => {
      despues?.();
      decir(pregunta.dice, idiomaVoz);
    });
  };

  const elegir = (i: number) => {
    if (bien || pregunta.tipo !== 'elegir') return;
    setElegida(i);
    if (i === pregunta.correcta) acertar();
    else fallar(() => setElegida(null));
  };

  const tocarParaOrdenar = (i: number) => {
    if (bien || pregunta.tipo !== 'ordenar') return;
    if (orden.includes(i)) {
      sonar('toque');
      setOrden(orden.filter((o) => o !== i));
      return;
    }
    sonar('toque');
    const nuevo = [...orden, i];
    setOrden(nuevo);
    if (nuevo.length < pregunta.imagenes.length) return;
    if (nuevo.every((v, j) => v === j)) acertar();
    else fallar(() => setOrden([]));
  };

  return (
    <main className="cuento__pregunta">
      <button type="button" className="oir oir--chico" onClick={() => decir(pregunta.dice, idiomaVoz)} aria-label="Escuchar la pregunta otra vez">
        <img src={base + imagenGuia} alt="" width="72" height="58" draggable={false} />
        <span className="oir__onda" aria-hidden="true">🔊</span>
      </button>
      <p className="cuento__dice" lang={idiomaVoz}>
        {pregunta.dice}
      </p>
      {pregunta.tipo === 'elegir' && (
        <div className="cuento__opciones">
          {pregunta.opciones.map((o, i) => (
            <button
              key={i}
              type="button"
              className={`cuento__opcion${bien && i === pregunta.correcta ? ' cuento__opcion--bien' : ''}${elegida === i && !bien ? ' cuento__opcion--no' : ''}${fallos >= 2 && !bien && i === pregunta.correcta ? ' cuento__opcion--pista' : ''}`}
              onClick={() => elegir(i)}
              aria-label={o.texto ?? `Opción ${i + 1}`}
            >
              <img src={base + o.imagen} alt="" draggable={false} />
              {o.texto && <span>{o.texto}</span>}
            </button>
          ))}
        </div>
      )}
      {pregunta.tipo === 'ordenar' && (
        <div className="cuento__ordenar">
          {revueltas.map((i) => {
            const puesto = orden.indexOf(i);
            return (
              <button
                key={i}
                type="button"
                className={`cuento__escena${puesto >= 0 ? ' cuento__escena--puesta' : ''}${bien ? ' cuento__opcion--bien' : ''}${fallos >= 2 && !bien && puesto < 0 && i === orden.length ? ' cuento__opcion--pista' : ''}`}
                onClick={() => tocarParaOrdenar(i)}
                aria-label={puesto >= 0 ? `Puesta en el lugar ${puesto + 1}` : 'Escena del cuento'}
              >
                <img src={base + pregunta.imagenes[i]} alt="" draggable={false} />
                {puesto >= 0 && <span className="cuento__numero">{puesto + 1}</span>}
              </button>
            );
          })}
        </div>
      )}
    </main>
  );
}
