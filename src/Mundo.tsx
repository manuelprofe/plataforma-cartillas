// Mundo explorable de un territorio. El niño mueve al guía con el dedo, habla
// con los personajes, atrapa luciérnagas y decide a qué misión entrar.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Linea, ModoIdioma, Palabra, Territorio } from './tipos';
import { fijarDestino, marcarVista, useProgreso } from './progreso';
import { decir, sonar } from './audio';
import { Dialogo } from './Dialogo';

const VELOCIDAD = 430; // px por segundo
const RADIO_CERCA = 110;
const RADIO_LUCIERNAGA = 52;

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
  const capaLejos = useRef<HTMLDivElement>(null);
  const capaMedia = useRef<HTMLDivElement>(null);
  const guia = useRef<HTMLDivElement>(null);

  const [tam, setTam] = useState({ ancho: 390, alto: 0 });
  const [cerca, setCerca] = useState<string | null>(null);
  const [charla, setCharla] = useState<Charla | null>(null);
  const [, repintar] = useState(0);
  const [destello, setDestello] = useState<{ palabra: Palabra; x: number; y: number; n: number } | null>(null);
  const [flecha, setFlecha] = useState<'izq' | 'der' | null>(null);

  const hechas = misiones.filter((m) => progreso.misiones[m.id]).length;
  const luz = misiones.length ? hechas / misiones.length : 0;
  const modo: ModoIdioma = territorio.idiomaPorAvance[Math.min(hechas, territorio.idiomaPorAvance.length - 1)];
  const puertaAbierta = progreso.estrellas >= puerta.estrellas;
  const [luzVista, setLuzVista] = useState(() => Math.min(luzAnterior, luz));

  const cosas = useMemo<Cosa[]>(
    () => [
      ...mundo.habitantes.map((h, i) => ({ id: h.id, tipo: 'habitante' as const, indice: i, x: h.x, y: h.y * tam.alto })),
      ...misiones.map((m, i) => ({ id: m.id, tipo: 'mision' as const, indice: i, x: m.x, y: m.y * tam.alto })),
      { id: 'puente', tipo: 'puente' as const, indice: 0, x: puerta.x, y: puerta.y * tam.alto },
    ],
    [mundo.habitantes, misiones, puerta, tam.alto],
  );
  const palabras = useMemo(() => misiones.flatMap((m) => m.palabras), [misiones]);

  // Estado del movimiento: vive fuera de React para no repintar en cada cuadro.
  const mov = useRef({
    x: ultimaPosicion?.x ?? mundo.inicio.x,
    y: ultimaPosicion?.y ?? -1,
    objetivo: null as { x: number; y: number } | null,
    pendiente: null as string | null,
    camara: 0,
    teclas: new Set<string>(),
    pausa: false,
  });
  const vivo = useRef({ cosas, cerca, tam, palabras, destino: progreso.destino });
  vivo.current = { cosas, cerca, tam, palabras, destino: progreso.destino };
  mov.current.pausa = charla !== null;

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
    if (m.y < 0) m.y = mundo.inicio.y * tam.alto;
    let cuadro = 0;
    let antes = performance.now();
    let mirando = 1;

    const paso = (ahora: number) => {
      const dt = Math.min(0.05, (ahora - antes) / 1000);
      antes = ahora;
      const { cosas, tam, palabras } = vivo.current;

      if (!m.pausa) {
        let dx = 0;
        let dy = 0;
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
        m.x = Math.max(50, Math.min(mundo.ancho - 50, m.x + dx));
        m.y = Math.max(tam.alto * 0.16, Math.min(tam.alto * 0.82, m.y + dy));
        if (Math.abs(dx) > 0.2) mirando = dx > 0 ? 1 : -1;
        ultimaPosicion = { x: m.x, y: m.y };

        // Luciérnagas: al tocarlas dicen una palabra.
        mundo.luciernagas.forEach((l, i) => {
          if (atrapadas.has(i)) return;
          if (Math.hypot(l.x - m.x, l.y * tam.alto - m.y) < RADIO_LUCIERNAGA) {
            atrapadas.add(i);
            const palabra = palabras[(i * 7 + 3) % palabras.length];
            sonar('estrella');
            window.setTimeout(() => decir(palabra.en, vozIngles), 250);
            setDestello({ palabra, x: l.x, y: l.y * tam.alto, n: i });
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

      m.camara = Math.max(0, Math.min(mundo.ancho - tam.ancho, m.x - tam.ancho * 0.42));
      if (suelo.current) suelo.current.style.transform = `translate3d(${-m.camara}px,0,0)`;
      if (capaLejos.current) capaLejos.current.style.transform = `translate3d(${-m.camara * 0.18}px,0,0)`;
      if (capaMedia.current) capaMedia.current.style.transform = `translate3d(${-m.camara * 0.5}px,0,0)`;
      if (guia.current) {
        guia.current.style.transform = `translate3d(${m.x}px, ${m.y}px, 0)`;
        guia.current.dataset.mira = mirando > 0 ? 'der' : 'izq';
      }

      // Flecha hacia la misión elegida cuando queda fuera de la pantalla.
      const meta = cosas.find((c) => c.id === vivo.current.destino);
      const lado = !meta ? null : meta.x < m.camara + 20 ? 'izq' : meta.x > m.camara + tam.ancho - 20 ? 'der' : null;
      setFlecha((f) => (f === lado ? f : lado));

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

  // El dedo: tocar o arrastrar en cualquier parte lleva al guía hasta ahí.
  const apuntar = (e: React.PointerEvent) => {
    if (mov.current.pausa || (e.target as HTMLElement).closest('button')) return;
    if (e.type === 'pointermove' && e.buttons === 0 && e.pointerType === 'mouse') return;
    const caja = marco.current!.getBoundingClientRect();
    mov.current.objetivo = { x: e.clientX - caja.left + mov.current.camara, y: e.clientY - caja.top - 24 };
    mov.current.pendiente = null;
  };

  const tocarCosa = (cosa: Cosa) => {
    const m = mov.current;
    if (Math.hypot(cosa.x - m.x, cosa.y - m.y) < RADIO_CERCA) {
      abrir(cosa);
      return;
    }
    sonar('salto');
    m.objetivo = { x: cosa.x - 60, y: cosa.y - 10 };
    m.pendiente = cosa.id;
  };

  const filtro = { filter: `grayscale(${(1 - luzVista) * 0.9}) brightness(${0.62 + luzVista * 0.38})` };
  const url = (ruta: string) => `url(${base}${ruta})`;
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
    >
      <div className="mundo__fondo" style={filtro} aria-hidden="true">
        <div ref={capaLejos} className="mundo__capa" style={{ backgroundImage: url(territorio.fondos.lejos), width: mundo.ancho }} />
        <div ref={capaMedia} className="mundo__capa" style={{ backgroundImage: url(territorio.fondos.medio), width: mundo.ancho }} />
      </div>

      <div ref={suelo} className="mundo__suelo" style={{ width: mundo.ancho }}>
        <div className="mundo__capa mundo__capa--cerca" style={{ backgroundImage: url(territorio.fondos.cerca), ...filtro }} aria-hidden="true" />

        {tam.alto > 0 && (
          <>
            {mundo.luciernagas.map((l, i) =>
              atrapadas.has(i) ? null : <span key={i} className="luciernaga" style={{ left: l.x, top: l.y * tam.alto, animationDelay: `${-i * 0.7}s` }} aria-hidden="true" />,
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
                <button key={h.id} type="button" className={`habitante${cerca === h.id ? ' es-cerca' : ''}`} style={{ left: c.x, top: c.y }} onClick={() => tocarCosa(c)} aria-label={`Hablar con ${personajes[h.personaje].nombre}`}>
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
                  style={{ left: c.x, top: c.y }}
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
              style={{ left: puerta.x, top: puerta.y * tam.alto }}
              onClick={() => tocarCosa(cosa('puente'))}
              aria-label={`Puente a ${puerta.destino}: ${progreso.estrellas} de ${puerta.estrellas} estrellas`}
            >
              <img src={base + personajes[puerta.personaje].imagen} alt="" width="120" height="82" draggable={false} />
              <span className="puerta__cuenta">
                ★ {Math.min(progreso.estrellas, puerta.estrellas)}/{puerta.estrellas}
              </span>
              <span className="globito">💬</span>
            </button>

            <div ref={guia} className="guia">
              <img src={base + personajes[territorio.guia].imagen} alt={personajes[territorio.guia].nombre} width="92" height="73" draggable={false} />
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

      {flecha && !charla && <div className={`brujula brujula--${flecha}`} aria-hidden="true">{flecha === 'der' ? '➜' : '⬅'}</div>}

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
