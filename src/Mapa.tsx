import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Territorio } from './tipos';
import { marcarIntroVista, moverA, useProgreso } from './progreso';
import { decir, sonar } from './audio';

const X_INICIAL = 200;
const MARGEN_FINAL = 260;
const ALTURAS = [0.7, 0.5, 0.64, 0.42, 0.6, 0.46, 0.58, 0.44];
const MS_POR_TRAMO = 620;

// Recuerda la luz mostrada la última vez para animar el cambio al volver de una misión.
let luzAnterior = 0;

interface Props {
  territorio: Territorio;
  base: string;
  idiomaVoz: string;
  onEntrar: (indiceMision: number) => void;
}

export function Mapa({ territorio, base, idiomaVoz, onEntrar }: Props) {
  const progreso = useProgreso();
  const { misiones, puerta } = territorio;
  const total = misiones.length;
  const indicePuerta = total + 1;

  const visor = useRef<HTMLDivElement>(null);
  const capaLejos = useRef<HTMLDivElement>(null);
  const capaMedia = useRef<HTMLDivElement>(null);
  const guia = useRef<HTMLDivElement>(null);
  const tramos = useRef<(SVGPathElement | null)[]>([]);
  const caminando = useRef(false);
  const cuadro = useRef(0);

  const [alto, setAlto] = useState(0);
  const [anchoVisor, setAnchoVisor] = useState(390);
  // En celular caben el guía y la siguiente misión en la misma pantalla.
  const PASO = Math.round(Math.max(200, Math.min(340, anchoVisor * 0.52)));
  const [aviso, setAviso] = useState<'puerta-cerrada' | 'puerta-abierta' | null>(null);

  const ancho = X_INICIAL + PASO * indicePuerta + MARGEN_FINAL;
  const nodos = useMemo(
    () =>
      Array.from({ length: indicePuerta + 1 }, (_, i) => ({
        x: X_INICIAL + PASO * i,
        y: Math.round(alto * ALTURAS[i % ALTURAS.length]),
      })),
    [alto, indicePuerta, PASO],
  );

  const hechas = misiones.filter((m) => progreso.misiones[m.id]).length;
  const luz = total ? hechas / total : 0;
  const [luzVista, setLuzVista] = useState(() => Math.min(luzAnterior, luz));
  useEffect(() => {
    const t = setTimeout(() => {
      if (luz > luzAnterior) sonar('estrella');
      luzAnterior = luz;
      setLuzVista(luz);
    }, 700);
    return () => clearTimeout(t);
  }, [luz]);
  const puertaAbierta = progreso.estrellas >= puerta.estrellas;
  const disponible = (i: number) => i === 0 || Boolean(progreso.misiones[misiones[i - 1].id]);

  useLayoutEffect(() => {
    const el = visor.current;
    if (!el) return;
    const medir = () => {
      setAlto(el.clientHeight);
      setAnchoVisor(el.clientWidth);
    };
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const colocarGuia = useCallback((x: number, y: number, salto = 0) => {
    if (guia.current) guia.current.style.transform = `translate3d(${x}px, ${y - salto}px, 0)`;
  }, []);

  const centrar = useCallback((x: number, suave = false) => {
    const el = visor.current;
    if (!el) return;
    const destino = Math.max(0, x - el.clientWidth * 0.28);
    if (suave) el.scrollTo({ left: destino, behavior: 'smooth' });
    else el.scrollLeft = destino;
  }, []);

  // Coloca al guía donde quedó la última vez y centra la cámara en él.
  useLayoutEffect(() => {
    if (!alto || caminando.current) return;
    const n = nodos[Math.min(progreso.posicion, nodos.length - 1)];
    colocarGuia(n.x, n.y);
    centrar(n.x);
  }, [alto, nodos, progreso.posicion, colocarGuia, centrar]);

  useEffect(() => () => cancelAnimationFrame(cuadro.current), []);

  useEffect(() => {
    if (progreso.introVista) return;
    const t = setTimeout(() => decir(territorio.saludo, idiomaVoz), 500);
    return () => clearTimeout(t);
  }, [progreso.introVista, territorio.saludo, idiomaVoz]);

  const alDesplazar = () => {
    const sl = visor.current?.scrollLeft ?? 0;
    if (capaLejos.current) capaLejos.current.style.transform = `translate3d(${-sl * 0.18}px,0,0)`;
    if (capaMedia.current) capaMedia.current.style.transform = `translate3d(${-sl * 0.5}px,0,0)`;
  };

  const caminar = (destino: number, alLlegar: () => void) => {
    if (caminando.current) return;
    if (!progreso.introVista) marcarIntroVista();
    const origen = progreso.posicion;
    if (origen === destino) {
      alLlegar();
      return;
    }
    caminando.current = true;
    guia.current?.classList.add('guia--camina');
    const sentido = destino > origen ? 1 : -1;
    let actual = origen;
    let inicio = 0;

    const paso = (ahora: number) => {
      if (!inicio) {
        inicio = ahora;
        sonar('salto');
      }
      const tramo = tramos.current[sentido > 0 ? actual : actual - 1];
      const t = Math.min(1, (ahora - inicio) / MS_POR_TRAMO);
      const suave = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      if (tramo) {
        const largo = tramo.getTotalLength();
        const p = tramo.getPointAtLength(sentido > 0 ? largo * suave : largo * (1 - suave));
        colocarGuia(p.x, p.y, Math.sin(Math.PI * t) * 34);
        centrar(p.x);
      }
      if (t < 1) {
        cuadro.current = requestAnimationFrame(paso);
        return;
      }
      actual += sentido;
      inicio = 0;
      if (actual !== destino) {
        cuadro.current = requestAnimationFrame(paso);
        return;
      }
      caminando.current = false;
      guia.current?.classList.remove('guia--camina');
      moverA(destino);
      alLlegar();
    };
    cuadro.current = requestAnimationFrame(paso);
  };

  const tocarMision = (i: number) => {
    if (!disponible(i)) {
      sonar('intenta');
      return;
    }
    sonar('toque');
    caminar(i + 1, () => onEntrar(i));
  };

  const tocarPuerta = () => {
    if (!puertaAbierta) {
      sonar('intenta');
      setAviso('puerta-cerrada');
      setTimeout(() => setAviso(null), 900);
      return;
    }
    sonar('toque');
    caminar(indicePuerta, () => {
      sonar('fiesta');
      decir('Great job! You opened the bridge!', idiomaVoz);
      setAviso('puerta-abierta');
    });
  };

  const filtro = { filter: `grayscale(${(1 - luzVista) * 0.9}) brightness(${0.62 + luzVista * 0.38})` };
  const url = (ruta: string) => `url(${base}${ruta})`;

  return (
    <div className="mapa">
      <div className="mapa__fondo" style={filtro} aria-hidden="true">
        <div ref={capaLejos} className="mapa__capa" style={{ backgroundImage: url(territorio.fondos.lejos), width: ancho }} />
        <div ref={capaMedia} className="mapa__capa" style={{ backgroundImage: url(territorio.fondos.medio), width: ancho }} />
      </div>

      <div ref={visor} className="mapa__visor" onScroll={alDesplazar}>
        <div className="mapa__mundo" style={{ width: ancho }}>
          <div className="mapa__capa mapa__capa--cerca" style={{ backgroundImage: url(territorio.fondos.cerca), ...filtro }} aria-hidden="true" />

          {alto > 0 && (
            <svg className="mapa__sendero" width={ancho} height={alto} viewBox={`0 0 ${ancho} ${alto}`} aria-hidden="true">
              {nodos.slice(0, -1).map((a, i) => {
                const b = nodos[i + 1];
                const mx = a.x + (b.x - a.x) / 2;
                const encendido = i < hechas || (i === total && puertaAbierta && hechas === total);
                return (
                  <path
                    key={i}
                    ref={(el) => {
                      tramos.current[i] = el;
                    }}
                    d={`M${a.x} ${a.y} C${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`}
                    className={encendido ? 'tramo tramo--luz' : 'tramo'}
                  />
                );
              })}
            </svg>
          )}

          {alto > 0 && (
            <>
              <div className="campamento" style={{ left: nodos[0].x, top: nodos[0].y }} aria-hidden="true" />

              {misiones.map((m, i) => {
                const n = nodos[i + 1];
                const hecha = Boolean(progreso.misiones[m.id]);
                const abierta = disponible(i);
                const siguiente = abierta && !hecha;
                const estado = hecha ? 'hecha' : abierta ? 'abierta' : 'cerrada';
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`nodo nodo--${estado}${siguiente ? ' nodo--siguiente' : ''}`}
                    style={{ left: n.x, top: n.y }}
                    onClick={() => tocarMision(i)}
                    aria-label={abierta ? m.titulo : `${m.titulo} (cerrada)`}
                  >
                    <span className="nodo__isla" />
                    <span className="nodo__farol">
                      <img src={base + m.icono} alt="" width="44" height="44" draggable={false} />
                    </span>
                    {hecha && <span className="nodo__sello">★</span>}
                    {!abierta && <span className="nodo__candado">🔒</span>}
                  </button>
                );
              })}

              <button
                type="button"
                className={`puerta${puertaAbierta ? ' puerta--abierta' : ''}${aviso === 'puerta-cerrada' ? ' puerta--tiembla' : ''}`}
                style={{ left: nodos[indicePuerta].x, top: nodos[indicePuerta].y }}
                onClick={tocarPuerta}
                aria-label={`Puente a ${puerta.destino}: ${progreso.estrellas} de ${puerta.estrellas} estrellas`}
              >
                <img src={base + puerta.imagen} alt="" width="110" height="75" draggable={false} />
                <span className="puerta__cuenta">
                  ★ {Math.min(progreso.estrellas, puerta.estrellas)}/{puerta.estrellas}
                </span>
                {aviso === 'puerta-abierta' && <span className="puerta__globo">{puerta.destino} · pronto</span>}
              </button>

              <div ref={guia} className="guia">
                <img src={base + territorio.guia.imagen} alt={territorio.guia.nombre} width="92" height="73" draggable={false} />
                {!progreso.introVista && <span className="guia__globo">{territorio.saludo}</span>}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="marcador" aria-label={`${progreso.estrellas} estrellas`}>
        <span className="marcador__estrella" key={progreso.estrellas}>★</span>
        <span>{progreso.estrellas}</span>
      </div>
      <div className="lugar">{territorio.nombre}</div>
    </div>
  );
}
