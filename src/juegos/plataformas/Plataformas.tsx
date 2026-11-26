// Plantilla de juego "plataformas" (matemáticas, transición a 2.°). El héroe del niño recorre
// un nivel visto de lado: camina, salta, empuja cajas para subir y abre puertas resolviendo un
// reto (contar, comparar, elegir). No contiene niveles ni preguntas: todo llega del contenido
// (mision.plataformas). Si cae al agua, Goma lo saca y vuelve a su último sitio firme: nunca
// se pierde. El botón ↺ deja el nivel como empezó si una caja quedó atascada.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactElement } from 'react';
import type { PropsJuego, RetoPuerta } from '../../tipos';
import { CierreMision } from '../CierreMision';
import { decirAyuda } from '../ayuda';
import { callar, decir, sonar } from '../../audio';
import { abrirPuerta, casilla, leerMapa, mover, palancaCerca, puertas, saltar, usarPalanca, type Estado, type Paso, type Punto } from './motor';
import './plataformas.css';

const MS_CUADRO = 110;
const SOLIDAS = new Set(['#', '=', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
type Gesto = '' | 'anda' | 'salta' | 'aterriza' | 'choca' | 'fiesta';

export function Plataformas(props: PropsJuego) {
  const { mision, base, idiomaVoz, imagenGuia, imagenFiesta, imagenHeroe, onTerminar, onSalir } = props;
  const niveles = mision.plataformas ?? [];
  const [indice, setIndice] = useState(0);
  const nivel = niveles[indice];
  const [estado, setEstado] = useState<Estado | null>(() => (nivel ? leerMapa(nivel.mapa) : null));
  const [ocupado, setOcupado] = useState(false);
  const [reto, setReto] = useState<{ puerta: Punto; datos: RetoPuerta } | null>(null);
  const [fallosReto, setFallosReto] = useState(0);
  const [bien, setBien] = useState<number | null>(null);
  const [errores, setErrores] = useState(0);
  const [splash, setSplash] = useState(false);
  const [llego, setLlego] = useState(false);
  const [cierre, setCierre] = useState(false);
  const [tam, setTam] = useState({ casilla: 48, ancho: 390, alto: 500 });
  // Gesto del héroe (camina, salta, aterriza, choca, celebra) y destellos de lo que pasa.
  const [gesto, setGesto] = useState<{ tipo: Gesto; n: number }>({ tipo: '', n: 0 });
  const [destellos, setDestellos] = useState<{ id: number; x: number; y: number; texto?: string }[]>([]);
  const sostenido = useRef<'izq' | 'der' | null>(null);
  const numeros = mision.numeros ?? [];
  const escenario = useRef<HTMLDivElement>(null);
  const esperas = useRef<number[]>([]);
  const choques = useRef(0);
  const estadoRef = useRef(estado);
  estadoRef.current = estado;
  const ocupadoRef = useRef(ocupado);
  ocupadoRef.current = ocupado;

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
    if (!niveles.length) onSalir();
  }, [niveles.length, onSalir]);

  // Cada nivel empieza con su mapa y el guía dice qué hacer.
  useEffect(() => {
    if (!nivel || cierre) return;
    setEstado(leerMapa(nivel.mapa));
    setLlego(false);
    setOcupado(false);
    choques.current = 0;
    if (nivel.dice) {
      const t = window.setTimeout(() => decir(nivel.dice!, idiomaVoz), 500);
      return () => clearTimeout(t);
    }
  }, [indice, nivel, cierre, idiomaVoz]);

  // La casilla se ajusta para que el nivel entre a lo alto; a lo ancho, la cámara sigue al héroe.
  useLayoutEffect(() => {
    const el = escenario.current;
    if (!el || !estado) return;
    const medir = () => {
      const { width, height } = el.getBoundingClientRect();
      // Unas 8 casillas a lo ancho en un celular: se ve lo que viene sin que todo quede diminuto.
      const casillaAlto = Math.floor(height / (estado.alto + 1));
      const casillaAncho = Math.floor(width / Math.min(estado.ancho, 8));
      setTam({ casilla: Math.max(36, Math.min(64, casillaAlto, casillaAncho)), ancho: width, alto: height });
    };
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, [estado?.alto, estado?.ancho, cierre]); // eslint-disable-line react-hooks/exhaustive-deps

  const hacerGesto = (tipo: Gesto) => setGesto((g) => ({ tipo, n: g.n + 1 }));
  const destellar = (x: number, y: number, texto?: string) => {
    const id = Date.now() + Math.random();
    setDestellos((d) => [...d, { id, x, y, texto }]);
    luego(() => setDestellos((d) => d.filter((v) => v.id !== id)), 900);
  };

  /** Pasa los cuadros de un paso uno por uno y luego cuenta lo que pasó. */
  const jugar = useCallback(
    (paso: Paso) => {
      setOcupado(true);
      paso.cuadros.forEach((c, i) => luego(() => setEstado(c), i * MS_CUADRO));
      const fin = paso.cuadros.length * MS_CUADRO;
      const ultimo = paso.cuadros[paso.cuadros.length - 1];
      const primero = paso.cuadros[0];
      if (paso.suceso === 'camina' || paso.suceso === 'empuja') hacerGesto('anda');
      if (paso.suceso === 'salta') hacerGesto('salta');
      if (paso.suceso === 'choca') hacerGesto('choca');
      // Al caer desde lo alto se aplasta un poquito al tocar el piso.
      if ((paso.suceso === 'salta' || paso.suceso === 'cae') && ultimo.heroe.y >= primero.heroe.y) luego(() => hacerGesto('aterriza'), fin - MS_CUADRO);
      if (paso.recogio) {
        const llevas = ultimo.totalFrutas - ultimo.frutas.length;
        luego(() => {
          sonar('estrella');
          destellar(ultimo.heroe.x, ultimo.heroe.y, String(llevas));
          if (numeros[llevas - 1]) decir(numeros[llevas - 1], idiomaVoz);
        }, fin - MS_CUADRO);
      }
      if (paso.placa) {
        const { numero, como } = paso.placa;
        luego(() => {
          if (como === 'otra vez') {
            sonar('intenta');
            // La ayuda dice cuál sigue: {n} se cambia por ese número dicho en palabras.
            const sigue = ultimo.placa;
            const frase = props.ayudas['plataformas-placa-orden'];
            if (frase) decir(frase.es.replace('{n}', numeros[sigue - 1] ?? String(sigue)), props.vozHistoria);
          } else {
            sonar(como === 'todas' ? 'acierto' : 'toque');
            destellar(ultimo.heroe.x, ultimo.heroe.y + 1, String(numero));
            const dicho = numeros[numero - 1] ?? String(numero);
            decir(dicho, idiomaVoz, como === 'todas' ? () => decirAyuda(props, 'plataformas-placas') : undefined);
          }
        }, fin - MS_CUADRO);
      }
      if (paso.suceso === 'cesta') {
        sonar('intenta');
        decirAyuda(props, 'plataformas-cesta');
      }
      if (paso.suceso === 'salta') sonar('salto');
      if (paso.suceso === 'empuja' || paso.suceso === 'palanca') sonar('toque');
      if (paso.suceso === 'choca') {
        choques.current++;
        if (choques.current === 4) decirAyuda(props, 'plataformas-alto');
      } else if (paso.suceso !== 'nada') choques.current = 0;
      if (paso.suceso === 'agua') {
        luego(() => {
          setSplash(true);
          sonar('intenta');
          decirAyuda(props, 'plataformas-agua');
        }, fin - MS_CUADRO);
        luego(() => setSplash(false), fin + 700);
      }
      if (paso.suceso === 'puerta' && paso.puerta) {
        const cual = puertas(paso.cuadros[0]).findIndex((p) => p.x === paso.puerta!.x && p.y === paso.puerta!.y);
        const datos = nivel?.retos?.[cual];
        if (datos) {
          luego(() => {
            setReto({ puerta: paso.puerta!, datos });
            setFallosReto(0);
            setBien(null);
            decir(datos.dice, idiomaVoz);
          }, 60);
        }
      }
      if (paso.suceso === 'meta') {
        luego(() => {
          setLlego(true);
          sonar('acierto');
          hacerGesto('fiesta');
          destellar(ultimo.heroe.x, ultimo.heroe.y - 1);
          decirAyuda(props, 'plataformas-meta');
        }, fin);
        luego(() => {
          if (indice + 1 < niveles.length) setIndice(indice + 1);
          else {
            sonar('fiesta');
            setCierre(true);
          }
        }, fin + 1600);
        return;
      }
      luego(() => {
        setOcupado(false);
        ocupadoRef.current = false;
        // Con la flecha sostenida sigue caminando sin pausa.
        if (sostenido.current && paso.suceso !== 'puerta' && paso.suceso !== 'cesta' && paso.suceso !== 'agua') accionRef.current(sostenido.current);
      }, fin + (paso.suceso === 'agua' ? 500 : 0));
    },
    // props entra entero por decirAyuda; nada de esto cambia dentro de un nivel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [indice, nivel, niveles.length, idiomaVoz],
  );

  const accion = useCallback(
    (que: 'izq' | 'der' | 'saltar' | 'palanca') => {
      const e = estadoRef.current;
      if (!e || ocupadoRef.current || reto || llego) return;
      if (que === 'saltar') jugar(palancaCerca(e) ? usarPalanca(e) : saltar(e));
      else if (que === 'palanca') jugar(usarPalanca(e));
      else jugar(mover(e, que === 'izq' ? -1 : 1));
    },
    [jugar, reto, llego],
  );
  const accionRef = useRef(accion);
  accionRef.current = accion;
  // Flecha sostenida: al terminar cada paso se da el siguiente.
  const soltar = () => {
    sostenido.current = null;
  };
  const apretar = (que: 'izq' | 'der') => {
    sostenido.current = que;
    accion(que);
  };

  // Teclado en computador: flechas y espacio.
  useEffect(() => {
    const tecla = (ev: KeyboardEvent) => {
      if (ev.key === 'ArrowLeft') accion('izq');
      else if (ev.key === 'ArrowRight') accion('der');
      else if (ev.key === 'ArrowUp' || ev.key === ' ') accion('saltar');
      else return;
      ev.preventDefault();
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [accion]);

  const elegir = (i: number) => {
    if (!reto || bien !== null) return;
    if (i === reto.datos.correcta) {
      sonar('acierto');
      setBien(i);
      const abrir = () => {
        setEstado((e) => (e ? abrirPuerta(e, reto.puerta) : e));
        setReto(null);
      };
      if (reto.datos.bien) decir(reto.datos.bien, idiomaVoz);
      luego(abrir, 1300);
      return;
    }
    sonar('intenta');
    setErrores((n) => n + 1);
    setFallosReto((n) => n + 1);
    decirAyuda(props, 'plataformas-reto', () => decir(reto.datos.dice, idiomaVoz));
  };

  const reiniciar = () => {
    if (!nivel || llego) return;
    sonar('volver');
    soltar();
    esperas.current.forEach(clearTimeout);
    setOcupado(false);
    setReto(null);
    setEstado(leerMapa(nivel.mapa));
  };

  if (!nivel || !estado) return null;

  const c = tam.casilla;
  const anchoMundo = estado.ancho * c;
  const altoMundo = estado.alto * c;
  // Cámara: el héroe a un tercio de la pantalla, mirando lo que viene, sin salirse del nivel.
  const camara = Math.max(0, Math.min(anchoMundo - tam.ancho, estado.heroe.x * c + c / 2 - tam.ancho * (estado.mira > 0 ? 0.33 : 0.67)));
  // El nivel queda un poco abajo del centro y la tierra sigue hasta el borde de abajo.
  const arriba = Math.max(0, Math.round((tam.alto - altoMundo) * 0.6));
  const solida = (x: number, y: number) => SOLIDAS.has(casilla(estado, x, y));
  const piezas: ReactElement[] = [];
  const sombras: ReactElement[] = [];
  for (let y = 0; y < estado.alto; y++) {
    for (let x = 0; x < estado.ancho; x++) {
      const t = estado.fondo[y][x];
      if (t === '.') continue;
      const pos = { left: x * c, top: y * c, width: c, height: c };
      const k = `${x},${y}`;
      if (t === '#' || t === '=') {
        const tope = !solida(x, y - 1);
        sombras.push(<div key={k} className={`pl-sombra pl-sombra--${t === '#' ? 'tierra' : 'repisa'}`} style={pos} />);
        piezas.push(<div key={k} className={`pl-${t === '#' ? 'tierra' : 'repisa'}${tope ? ' pl--tope' : ''}`} style={pos} />);
      } else if (t === '~') piezas.push(<div key={k} className={`pl-agua${casilla(estado, x, y - 1) === '~' ? '' : ' pl--tope'}`} style={pos} />);
      else if (t === 'M') piezas.push(<div key={k} className={`pl-meta${llego ? ' pl-meta--llego' : ''}`} style={pos} aria-label="Meta" />);
      else if (t === 'G') {
        const abierta = estado.abiertas.includes(k);
        piezas.push(
          <div key={k} className={`pl-puerta${abierta ? ' pl-puerta--abierta' : ''}`} style={pos}>
            {!abierta && <span aria-hidden="true">?</span>}
          </div>,
        );
      } else if (t === 'B') {
        const abierta = !estado.frutas.length;
        piezas.push(
          <div key={k} className={`pl-cesta${abierta ? ' pl-cesta--abierta' : ''}`} style={pos}>
            {!abierta && <span aria-hidden="true">{estado.totalFrutas - estado.frutas.length}/{estado.totalFrutas}</span>}
          </div>,
        );
      } else if (t >= '1' && t <= '9') {
        const pisada = Number(t) < estado.placa;
        sombras.push(<div key={k} className="pl-sombra pl-sombra--tierra" style={pos} />);
        piezas.push(
          <div key={k} className={`pl-placa${pisada ? ' pl-placa--pisada' : ''}`} style={pos}>
            <span>{t}</span>
          </div>,
        );
      } else if (t === 'N') piezas.push(<div key={k} className={`pl-bloque-numero${estado.placa > estado.totalPlacas ? ' pl-bloque-numero--abierto' : ''}`} style={pos} />);
      else if (t === 'L') piezas.push(<div key={k} className={`pl-palanca${estado.palanca ? ' pl-palanca--on' : ''}`} style={pos} />);
      else if (t === 'X') piezas.push(<div key={k} className={`pl-bloque${estado.palanca ? ' pl-bloque--on' : ''}`} style={pos} />);
    }
  }

  return (
    <div className="mision plataformas">
      <header className="mision__barra">
        <button type="button" className="boton-salir" onClick={onSalir} aria-label="Volver al mapa">
          ✕
        </button>
        {!cierre && (
          <div className="puntos" aria-hidden="true">
            {niveles.map((_, i) => (
              <span key={i} className={`punto${i < indice ? ' punto--hecho' : i === indice ? ' punto--ahora' : ''}`} />
            ))}
          </div>
        )}
        {!cierre && estado.totalFrutas > 0 && nivel.fruta && (
          <span className="pl-contador" aria-label={`Frutas: ${estado.totalFrutas - estado.frutas.length} de ${estado.totalFrutas}`}>
            <img src={base + nivel.fruta} alt="" />
            {estado.totalFrutas - estado.frutas.length}/{estado.totalFrutas}
          </span>
        )}
        {!cierre && (
          <button type="button" className="pl-reiniciar" onClick={reiniciar} aria-label="Empezar el nivel otra vez">
            ↺
          </button>
        )}
      </header>

      {!cierre && (
        <main className="pl-juego">
          <div className="pl-escenario" ref={escenario}>
            <div className="pl-cielo" style={{ backgroundPositionX: `${30 - camara * 0.15}px, ${-camara * 0.4}px, 0, 0` }} />
            <div className="pl-mundo" style={{ ['--c' as string]: `${c}px`, width: anchoMundo, height: altoMundo, transform: `translate3d(${-camara}px, ${arriba}px, 0)` }}>
              <div className="pl-capa pl-capa--sombras">{sombras}</div>
              <div className="pl-capa">{piezas}</div>
              {estado.cajas.map((caja, i) => (
                <div key={`caja${i}`} className="pl-caja" style={{ width: c, height: c, transform: `translate3d(${caja.x * c}px, ${caja.y * c}px, 0)` }} />
              ))}
              {nivel.fruta &&
                estado.frutas.map((f) => (
                  <img key={`f${f.x},${f.y}`} className="pl-fruta" src={base + nivel.fruta} alt="" draggable={false} style={{ width: c * 0.7, height: c * 0.7, left: f.x * c + c * 0.15, top: f.y * c + c * 0.15 }} />
                ))}
              <div className={`pl-heroe${splash ? ' pl-heroe--agua' : ''}`} style={{ width: c, height: c, transform: `translate3d(${estado.heroe.x * c}px, ${estado.heroe.y * c}px, 0)` }}>
                <div className="pl-heroe__mira" style={{ transform: `scaleX(${estado.mira})` }}>
                  <img key={gesto.n} className={gesto.tipo ? `pl-gesto--${gesto.tipo}` : undefined} src={base + (imagenHeroe ?? imagenGuia)} alt="" draggable={false} />
                </div>
              </div>
              {destellos.map((d) => (
                <div key={d.id} className="pl-destello" style={{ left: d.x * c, top: d.y * c, width: c, height: c }}>
                  {d.texto && <b>{d.texto}</b>}
                </div>
              ))}
            </div>
            <div className="pl-suelo" style={{ top: arriba + altoMundo - 2, backgroundPositionX: `${-camara}px` }} />
            {splash && <div className="pl-rescate" aria-hidden="true" />}
          </div>

          <div className="pl-mandos">
            <button
              type="button"
              className="pl-mando"
              aria-label="Caminar a la izquierda"
              onPointerDown={(ev) => {
                ev.preventDefault();
                apretar('izq');
              }}
              onPointerUp={soltar}
              onPointerLeave={soltar}
              onPointerCancel={soltar}
            >
              ◀
            </button>
            <button
              type="button"
              className="pl-mando"
              aria-label="Caminar a la derecha"
              onPointerDown={(ev) => {
                ev.preventDefault();
                apretar('der');
              }}
              onPointerUp={soltar}
              onPointerLeave={soltar}
              onPointerCancel={soltar}
            >
              ▶
            </button>
            <button type="button" className={`pl-mando pl-mando--saltar${palancaCerca(estado) ? ' pl-mando--palanca' : ''}`} aria-label={palancaCerca(estado) ? 'Mover la palanca' : 'Saltar'} onClick={() => accion('saltar')}>
              {palancaCerca(estado) ? '⇅' : '⤴'}
            </button>
          </div>

          {reto && (
            <div className="pl-reto" role="dialog" aria-label="Reto de la puerta">
              <button type="button" className="oir oir--chico" onClick={() => decir(reto.datos.dice, idiomaVoz)} aria-label="Escuchar otra vez">
                <img src={base + imagenGuia} alt="" width="72" height="58" draggable={false} />
                <span className="oir__onda" aria-hidden="true">🔊</span>
              </button>
              {reto.datos.ver && (
                <div className="pl-reto__ver">
                  {Array.from({ length: reto.datos.ver.cantidad }, (_, i) => (
                    <img key={i} src={base + reto.datos.ver!.imagen} alt="" draggable={false} />
                  ))}
                </div>
              )}
              <div className="pl-reto__opciones">
                {reto.datos.opciones.map((o, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`pl-opcion${bien === i ? ' pl-opcion--bien' : ''}${fallosReto >= 2 && bien === null && i === reto.datos.correcta ? ' pl-opcion--pista' : ''}`}
                    onClick={() => elegir(i)}
                    aria-label={o.texto ?? `Opción ${i + 1}`}
                  >
                    {o.imagen && !o.cantidad && <img src={base + o.imagen} alt="" draggable={false} className={o.tam ? `pl-opcion--${o.tam}` : undefined} />}
                    {o.imagen && o.cantidad && (
                      <span className="pl-grupo">
                        {Array.from({ length: o.cantidad }, (_, k) => (
                          <img key={k} src={base + o.imagen} alt="" draggable={false} />
                        ))}
                      </span>
                    )}
                    {o.texto && <span>{o.texto}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>
      )}

      {cierre && <CierreMision mision={mision} errores={errores} base={base} imagenFiesta={imagenFiesta} alRegistrar={() => {}} onTerminar={onTerminar} />}
    </div>
  );
}
