// Mundo explorable de un territorio, visto desde arriba. El niño mueve al guía con
// el dedo en cualquier dirección, habla con los personajes, atrapa luciérnagas y
// decide a qué misión entrar.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Linea, ModoIdioma, Palabra, Territorio } from './tipos';
import { fijarDestino, marcarVista, useProgreso } from './progreso';
import { decir, sonar } from './audio';
import { Dialogo } from './Dialogo';

const VELOCIDAD = 430; // px por segundo
const RADIO_CERCA = 110;
const RADIO_LUCIERNAGA = 52;

// Cámara: sigue al guía con retraso y con una zona libre, para que sea el guía
// (y no solo el fondo) lo que se ve moverse por la pantalla.
const CAMARA_RAPIDEZ = 2.6; // rigidez del resorte: arranca despacio y alcanza al guía después
const CAMARA_ZONA = 0.08; // fracción del ancho en que el guía se mueve sin que la cámara lo siga
const CAMARA_BORDE = 0.24; // el guía nunca queda más cerca que esto del borde
const CAMARA_PIES = 0.58; // altura de la pantalla en que descansa el guía (su cuerpo queda encima)
// El mundo se ajusta al tamaño de la pantalla: en celular se ve el claro con sus caminos
// y en pantallas grandes sigue habiendo algo que explorar.
const LADO_DE_REFERENCIA = 1000;
const ESCALA_MINIMA = 0.75;
const ESCALA_MAXIMA = 2;
const CHISPAS = 14;
const MS_ENTRE_CHISPAS = 55;
const sinMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Se conservan mientras la app está abierta para volver al mismo punto tras una misión.
let ultimaPosicion: { x: number; y: number } | null = null;
let luzAnterior = 0;
const atrapadas = new Set<number>();

interface Props {
  territorio: Territorio;
  base: string;
  vozIngles: string;
  vozEspanol: string;
  onEntrar: (indiceMision: number) => void;
}

interface Cosa {
  id: string;
  tipo: 'habitante' | 'mision' | 'puente';
  indice: number;
  x: number;
  y: number;
}

interface Charla {
  lineas: Linea[];
  luego?: string;
  alCerrar?: () => void;
}

export function Mundo({ territorio, base, vozIngles, vozEspanol, onEntrar }: Props) {
  const progreso = useProgreso();
  const { misiones, puerta, mundo, personajes, escenas } = territorio;

  const marco = useRef<HTMLDivElement>(null);
  const suelo = useRef<HTMLDivElement>(null);
  const guia = useRef<HTMLDivElement>(null);
  const meta = useRef<HTMLSpanElement>(null);
  const chispas = useRef<HTMLDivElement>(null);
  const brujula = useRef<HTMLDivElement>(null);
  const ondas = useRef<HTMLDivElement>(null);

  const [tam, setTam] = useState({ ancho: 390, alto: 0 });
  const [cerca, setCerca] = useState<string | null>(null);
  const [charla, setCharla] = useState<Charla | null>(null);
  const [, repintar] = useState(0);
  const [destello, setDestello] = useState<{ palabra: Palabra; x: number; y: number; n: number } | null>(null);

  const hechas = misiones.filter((m) => progreso.misiones[m.id]).length;
  const luz = misiones.length ? hechas / misiones.length : 0;
  const modo: ModoIdioma = territorio.idiomaPorAvance[Math.min(hechas, territorio.idiomaPorAvance.length - 1)];
  const puertaAbierta = progreso.estrellas >= puerta.estrellas;
  const [luzVista, setLuzVista] = useState(() => Math.min(luzAnterior, luz));

  const cosas = useMemo<Cosa[]>(
    () => [
      ...mundo.habitantes.map((h, i) => ({ id: h.id, tipo: 'habitante' as const, indice: i, x: h.x, y: h.y })),
      ...misiones.map((m, i) => ({ id: m.id, tipo: 'mision' as const, indice: i, x: m.x, y: m.y })),
      { id: 'puente', tipo: 'puente' as const, indice: 0, x: puerta.x, y: puerta.y },
    ],
    [mundo.habitantes, misiones, puerta],
  );
  const palabras = useMemo(() => misiones.flatMap((m) => m.palabras), [misiones]);

  // Estado del movimiento: vive fuera de React para no repintar en cada cuadro.
  const mov = useRef({
    x: ultimaPosicion?.x ?? mundo.inicio.x,
    y: ultimaPosicion?.y ?? mundo.inicio.y,
    objetivo: null as { x: number; y: number } | null,
    pendiente: null as string | null,
    // Dedo apoyado, en coordenadas de pantalla: mientras siga ahí, el guía lo persigue.
    dedo: null as { x: number; y: number } | null,
    camara: { x: 0, y: 0 },
    camaraVel: { x: 0, y: 0 },
    escala: 1,
    camaraLista: false,
    teclas: new Set<string>(),
    pausa: false,
  });
  const vivo = useRef({ cosas, cerca, tam, palabras, destino: progreso.destino });
  vivo.current = { cosas, cerca, tam, palabras, destino: progreso.destino };
  mov.current.pausa = charla !== null;
  if (charla) mov.current.dedo = null;

  useLayoutEffect(() => {
    const el = marco.current;
    if (!el) return;
    const medir = () => setTam({ ancho: el.clientWidth, alto: el.clientHeight });
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const abrir = (cosa: Cosa) => {
    sonar('toque');
    mov.current.objetivo = null;
    mov.current.pendiente = null;
    if (cosa.tipo === 'habitante') {
      const escena = escenas[mundo.habitantes[cosa.indice].escena];
      setCharla({ lineas: escena.lineas, luego: escena.luego });
    } else if (cosa.tipo === 'mision') {
      const indice = cosa.indice;
      setCharla({
        lineas: misiones[indice].antes,
        alCerrar: () => {
          if (progreso.destino === misiones[indice].id) fijarDestino(undefined);
          onEntrar(indice);
        },
      });
    } else {
      if (puertaAbierta) sonar('fiesta');
      const escena = escenas[puertaAbierta ? puerta.escenaAbierta : puerta.escenaCerrada];
      setCharla({ lineas: escena.lineas, luego: escena.luego });
    }
  };
  const abrirRef = useRef(abrir);
  abrirRef.current = abrir;

  // Historia: la introducción la primera vez; un comentario al volver con más luz.
  useEffect(() => {
    if (!progreso.vistas.includes('intro')) {
      marcarVista('intro');
      setCharla({ lineas: escenas.intro.lineas, luego: escenas.intro.luego });
      return;
    }
    if (luz <= luzAnterior) return;
    const t = window.setTimeout(() => {
      sonar('estrella');
      luzAnterior = luz;
      setLuzVista(luz);
      if (hechas < misiones.length) setCharla({ lineas: escenas.despues.lineas });
    }, 800);
    return () => clearTimeout(t);
    // Solo al montar: decide con qué recibe el mundo al niño.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bucle de movimiento.
  useEffect(() => {
    if (!tam.alto) return;
    const m = mov.current;
    let cuadro = 0;
    let antes = performance.now();
    let mirando = 1;
    let andaba = false;
    let inclinacion = 0;
    let esperaChispa = 0;
    let turnoChispa = 0;
    const quieto = sinMovimiento();

    const paso = (ahora: number) => {
      const dt = Math.min(0.05, (ahora - antes) / 1000);
      antes = ahora;
      const { cosas, tam, palabras } = vivo.current;
      const escala = Math.max(ESCALA_MINIMA, Math.min(ESCALA_MAXIMA, Math.max(tam.ancho, tam.alto) / LADO_DE_REFERENCIA));
      const vista = { x: tam.ancho / escala, y: tam.alto / escala };
      m.escala = escala;

      let dx = 0;
      let dy = 0;
      if (!m.pausa) {
        if (m.dedo) m.objetivo = { x: m.dedo.x / escala + m.camara.x, y: m.dedo.y / escala + m.camara.y - 24 };
        const t = m.teclas;
        if (t.size) {
          dx = (t.has('arrowright') || t.has('d') ? 1 : 0) - (t.has('arrowleft') || t.has('a') ? 1 : 0);
          dy = (t.has('arrowdown') || t.has('s') ? 1 : 0) - (t.has('arrowup') || t.has('w') ? 1 : 0);
          if (dx || dy) {
            m.objetivo = null;
            m.pendiente = null;
            const largo = Math.hypot(dx, dy);
            dx = (dx / largo) * VELOCIDAD * dt;
            dy = (dy / largo) * VELOCIDAD * dt;
          }
        }
        if (m.objetivo) {
          const ox = m.objetivo.x - m.x;
          const oy = m.objetivo.y - m.y;
          const dist = Math.hypot(ox, oy);
          if (dist < 4) m.objetivo = null;
          else {
            const avance = Math.min(dist, VELOCIDAD * dt * Math.min(1, 0.35 + dist / 160));
            dx = (ox / dist) * avance;
            dy = (oy / dist) * avance;
          }
        }
        const x0 = m.x;
        const y0 = m.y;
        m.x = Math.max(50, Math.min(mundo.ancho - 50, m.x + dx));
        m.y = Math.max(110, Math.min(mundo.alto - 20, m.y + dy));
        dx = m.x - x0;
        dy = m.y - y0;
        if (Math.abs(dx) > 0.2) mirando = dx > 0 ? 1 : -1;
        ultimaPosicion = { x: m.x, y: m.y };

        // Luciérnagas: al tocarlas dicen una palabra.
        mundo.luciernagas.forEach((l, i) => {
          if (atrapadas.has(i)) return;
          if (Math.hypot(l.x - m.x, l.y - m.y) < RADIO_LUCIERNAGA) {
            atrapadas.add(i);
            const palabra = palabras[(i * 7 + 3) % palabras.length];
            sonar('estrella');
            window.setTimeout(() => decir(palabra.en, vozIngles), 250);
            setDestello({ palabra, x: l.x, y: l.y, n: i });
            repintar((n) => n + 1);
          }
        });

        // Qué hay cerca para hablar o entrar.
        let masCerca: string | null = null;
        let menor = RADIO_CERCA;
        for (const c of cosas) {
          const d = Math.hypot(c.x - m.x, c.y - m.y);
          if (d < menor) {
            menor = d;
            masCerca = c.id;
          }
        }
        if (masCerca !== vivo.current.cerca) setCerca(masCerca);
        if (m.pendiente && masCerca === m.pendiente && menor < 80) {
          const cosa = cosas.find((c) => c.id === m.pendiente);
          if (cosa) abrirRef.current(cosa);
        }
      }

      // Cámara con retraso y zona libre, en las dos direcciones.
      const pies = { x: 0.5, y: CAMARA_PIES };
      for (const eje of ['x', 'y'] as const) {
        const largoMundo = eje === 'x' ? mundo.ancho : mundo.alto;
        const tope = largoMundo - vista[eje];
        const deseada = m[eje] - vista[eje] * pies[eje];
        if (!m.camaraLista) {
          m.camara[eje] = deseada;
        } else {
          // Resorte con amortiguación crítica: la cámara tarda en arrancar y no rebota.
          const atraso = deseada - m.camara[eje];
          const zona = vista[eje] * CAMARA_ZONA;
          const falta = Math.abs(atraso) > zona ? atraso - Math.sign(atraso) * zona : 0;
          m.camaraVel[eje] += (CAMARA_RAPIDEZ * CAMARA_RAPIDEZ * falta - 2 * CAMARA_RAPIDEZ * m.camaraVel[eje]) * dt;
          m.camara[eje] += m.camaraVel[eje] * dt;
        }
        const previa = m.camara[eje];
        m.camara[eje] = Math.max(m[eje] - vista[eje] * (1 - CAMARA_BORDE), Math.min(m[eje] - vista[eje] * CAMARA_BORDE, m.camara[eje]));
        // Si el mundo cabe entero en la pantalla, se centra.
        m.camara[eje] = tope <= 0 ? tope / 2 : Math.max(0, Math.min(tope, m.camara[eje]));
        // Si el guía la empuja desde el borde, o llega al final del mundo, pierde el impulso.
        if (m.camara[eje] !== previa && dt > 0) m.camaraVel[eje] = eje === 'x' ? dx / dt : dy / dt;
        if (m.camara[eje] === 0 || m.camara[eje] === tope) m.camaraVel[eje] = 0;
      }
      m.camaraLista = true;
      if (suelo.current) suelo.current.style.transform = `scale(${escala}) translate3d(${-m.camara.x}px, ${-m.camara.y}px, 0)`;
      if (guia.current) {
        guia.current.style.transform = `translate3d(${m.x}px, ${m.y}px, 0)`;
        guia.current.dataset.mira = mirando > 0 ? 'der' : 'izq';
        // Lo que está más abajo en el mapa queda por delante.
        guia.current.style.zIndex = String(Math.round(m.y));
        // Se inclina hacia donde va y trota mientras avanza.
        const anda = Math.hypot(dx, dy) > 0.3;
        if (anda !== andaba) {
          andaba = anda;
          guia.current.dataset.anda = anda ? 'si' : 'no';
        }
        const inclina = Math.round(Math.max(-1, Math.min(1, dx / (VELOCIDAD * dt || 1))) * 13);
        if (inclina !== inclinacion) {
          inclinacion = inclina;
          guia.current.style.setProperty('--inclina', `${inclina}deg`);
        }

        // Estela de chispas detrás del guía.
        esperaChispa -= dt * 1000;
        if (anda && !quieto && esperaChispa <= 0 && chispas.current) {
          esperaChispa = MS_ENTRE_CHISPAS;
          const chispa = chispas.current.children[turnoChispa++ % CHISPAS] as HTMLElement;
          const largo = Math.hypot(dx, dy) || 1;
          const cx = m.x - (dx / largo) * 30 + (Math.random() - 0.5) * 30;
          const cy = m.y - 62 - (dy / largo) * 26 + (Math.random() - 0.5) * 40;
          const giro = Math.random() * 180;
          chispa.animate(
            [
              { transform: `translate3d(${cx}px, ${cy}px, 0) scale(1) rotate(${giro}deg)`, opacity: 1 },
              { transform: `translate3d(${cx - (dx / largo) * 36}px, ${cy - (dy / largo) * 36 + 22}px, 0) scale(0.15) rotate(${giro + 160}deg)`, opacity: 0 },
            ],
            { duration: 620, easing: 'ease-out' },
          );
        }
      }

      // Marca del lugar al que va.
      if (meta.current) {
        const o = m.pausa || m.pendiente ? null : m.objetivo;
        if (o) meta.current.style.transform = `translate3d(${o.x}px, ${o.y + 24}px, 0)`;
        const ver = o ? 'si' : 'no';
        if (meta.current.dataset.ver !== ver) meta.current.dataset.ver = ver;
      }

      // Brújula: apunta a la misión elegida cuando queda fuera de la pantalla.
      if (brujula.current) {
        const elegida = cosas.find((c) => c.id === vivo.current.destino);
        const px = elegida ? (elegida.x - m.camara.x) * escala : 0;
        const py = elegida ? (elegida.y - m.camara.y) * escala : 0;
        const fuera = elegida && (px < 20 || px > tam.ancho - 20 || py < 20 || py > tam.alto - 20);
        if (fuera) {
          const bx = Math.max(42, Math.min(tam.ancho - 42, px));
          const by = Math.max(110, Math.min(tam.alto - 60, py));
          const giro = Math.atan2(py - by, px - bx);
          brujula.current.style.transform = `translate3d(${bx}px, ${by}px, 0) rotate(${giro}rad)`;
        }
        const ver = fuera ? 'si' : 'no';
        if (brujula.current.dataset.ver !== ver) brujula.current.dataset.ver = ver;
      }

      cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);

    const bajar = (e: KeyboardEvent) => m.teclas.add(e.key.toLowerCase());
    const subir = (e: KeyboardEvent) => m.teclas.delete(e.key.toLowerCase());
    window.addEventListener('keydown', bajar);
    window.addEventListener('keyup', subir);
    return () => {
      cancelAnimationFrame(cuadro);
      window.removeEventListener('keydown', bajar);
      window.removeEventListener('keyup', subir);
    };
  }, [tam.alto, mundo, vozIngles]);

  // Pasa un punto de la pantalla a coordenadas del mundo.
  const alMundo = (x: number, y: number) => ({
    x: x / mov.current.escala + mov.current.camara.x,
    y: y / mov.current.escala + mov.current.camara.y,
  });

  // El dedo: tocar o arrastrar en cualquier parte lleva al guía hasta ahí.
  const apuntar = (e: React.PointerEvent) => {
    if (mov.current.pausa || (e.target as HTMLElement).closest('button')) return;
    if (e.type === 'pointermove' && e.buttons === 0 && e.pointerType === 'mouse') return;
    const caja = marco.current!.getBoundingClientRect();
    const x = e.clientX - caja.left;
    const y = e.clientY - caja.top;
    const punto = alMundo(x, y);
    mov.current.dedo = { x, y };
    mov.current.objetivo = { x: punto.x, y: punto.y - 24 };
    mov.current.pendiente = null;
    if (e.type === 'pointerdown') {
      sonar('toque');
      ondear(punto.x, punto.y);
    }
  };
  const soltar = () => {
    mov.current.dedo = null;
  };

  // Onda en el punto tocado: muestra la causa de que el guía se mueva.
  const turnoOnda = useRef(0);
  const ondear = (x: number, y: number) => {
    const caja = ondas.current;
    if (!caja) return;
    const onda = caja.children[turnoOnda.current++ % caja.children.length] as HTMLElement;
    const lugar = `translate3d(${x}px, ${y}px, 0)`;
    onda.animate(
      sinMovimiento()
        ? [{ transform: `${lugar} scale(1)`, opacity: 0.9 }, { transform: `${lugar} scale(1)`, opacity: 0 }]
        : [{ transform: `${lugar} scale(0.25)`, opacity: 1 }, { transform: `${lugar} scale(1.5)`, opacity: 0 }],
      { duration: 560, easing: 'ease-out' },
    );
  };

  const tocarCosa = (cosa: Cosa) => {
    const m = mov.current;
    if (Math.hypot(cosa.x - m.x, cosa.y - m.y) < RADIO_CERCA) {
      abrir(cosa);
      return;
    }
    sonar('salto');
    m.objetivo = { x: cosa.x, y: cosa.y + 62 };
    m.pendiente = cosa.id;
  };

  const filtro = { filter: `grayscale(${(1 - luzVista) * 0.6}) brightness(${0.78 + luzVista * 0.22})` };
  const cosa = (id: string) => cosas.find((c) => c.id === id)!;
  const restantes = mundo.luciernagas.length - atrapadas.size;

  return (
    <div
      ref={marco}
      className="mundo"
      onPointerDown={(e) => {
        if (!(e.target as HTMLElement).closest('button')) e.currentTarget.setPointerCapture(e.pointerId);
        apuntar(e);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) apuntar(e);
      }}
      onPointerUp={soltar}
      onPointerCancel={soltar}
      onLostPointerCapture={soltar}
    >
      <div ref={suelo} className="mundo__suelo" style={{ width: mundo.ancho, height: mundo.alto }}>
        <img className="mundo__mapa" src={base + mundo.mapa} alt="" style={filtro} draggable={false} />

        {tam.alto > 0 && (
          <>
            {mundo.luciernagas.map((l, i) =>
              atrapadas.has(i) ? null : <span key={i} className="luciernaga" style={{ left: l.x, top: l.y, animationDelay: `${-i * 0.7}s` }} aria-hidden="true" />,
            )}

            {destello && (
              <span key={destello.n} className="destello" style={{ left: destello.x, top: destello.y }}>
                <img src={base + destello.palabra.icono} alt="" width="52" height="52" draggable={false} />
                {destello.palabra.en}
              </span>
            )}

            {mundo.habitantes.map((h) => {
              const c = cosa(h.id);
              return (
                <button key={h.id} type="button" className={`habitante${cerca === h.id ? ' es-cerca' : ''}`} style={{ left: c.x, top: c.y, zIndex: Math.round(c.y) }} onClick={() => tocarCosa(c)} aria-label={`Hablar con ${personajes[h.personaje].nombre}`}>
                  <img src={base + personajes[h.personaje].imagen} alt="" width="104" height="92" draggable={false} />
                  <span className="globito">💬</span>
                </button>
              );
            })}

            {misiones.map((m) => {
              const c = cosa(m.id);
              const hecha = Boolean(progreso.misiones[m.id]);
              const elegida = progreso.destino === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`nodo nodo--${hecha ? 'hecha' : 'abierta'}${elegida ? ' nodo--siguiente' : ''}${cerca === m.id ? ' es-cerca' : ''}`}
                  style={{ left: c.x, top: c.y, zIndex: Math.round(c.y) }}
                  onClick={() => tocarCosa(c)}
                  aria-label={m.titulo}
                >
                  <span className="nodo__isla" />
                  <span className="nodo__farol">
                    <img src={base + m.icono} alt="" width="44" height="44" draggable={false} />
                  </span>
                  {hecha && <span className="nodo__sello">★</span>}
                  <span className="globito">▶</span>
                </button>
              );
            })}

            <button
              type="button"
              className={`puerta${puertaAbierta ? ' puerta--abierta' : ''}${cerca === 'puente' ? ' es-cerca' : ''}`}
              style={{ left: puerta.x, top: puerta.y, zIndex: Math.round(puerta.y) }}
              onClick={() => tocarCosa(cosa('puente'))}
              aria-label={`Puente a ${puerta.destino}: ${progreso.estrellas} de ${puerta.estrellas} estrellas`}
            >
              <img src={base + personajes[puerta.personaje].imagen} alt="" width="120" height="82" draggable={false} />
              <span className="puerta__cuenta">
                ★ {Math.min(progreso.estrellas, puerta.estrellas)}/{puerta.estrellas}
              </span>
              <span className="globito">💬</span>
            </button>

            <span ref={meta} className="meta" data-ver="no" aria-hidden="true" />
            <div ref={ondas} aria-hidden="true">
              <span className="onda-toque" />
              <span className="onda-toque" />
              <span className="onda-toque" />
            </div>
            <div ref={chispas} aria-hidden="true">
              {Array.from({ length: CHISPAS }, (_, i) => (
                <span key={i} className="chispa" />
              ))}
            </div>

            <div ref={guia} className="guia" data-anda="no">
              <span className="guia__sombra" />
              <div className="guia__cuerpo">
                <img src={base + personajes[territorio.guia].imagen} alt={personajes[territorio.guia].nombre} width="92" height="73" draggable={false} />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="marcador" aria-label={`${progreso.estrellas} estrellas`}>
        <span className="marcador__estrella" key={progreso.estrellas}>
          ★
        </span>
        <span>{progreso.estrellas}</span>
      </div>
      <div className="lugar">
        {territorio.nombre}
        <span className="lugar__luciernagas" aria-label={`Luciérnagas atrapadas: ${atrapadas.size}`}>
          ✦ {atrapadas.size}/{mundo.luciernagas.length}
          {restantes === 0 ? ' ✓' : ''}
        </span>
      </div>

      {!charla && (
        <div ref={brujula} className="brujula" data-ver="no" aria-hidden="true">
          <span>➜</span>
        </div>
      )}

      {charla && (
        <Dialogo
          lineas={charla.lineas}
          luego={charla.luego}
          escenas={escenas}
          personajes={personajes}
          base={base}
          modo={modo}
          vozIngles={vozIngles}
          vozEspanol={vozEspanol}
          onDestino={fijarDestino}
          onCerrar={() => {
            const despues = charla.alCerrar;
            setCharla(null);
            despues?.();
          }}
        />
      )}
    </div>
  );
}
