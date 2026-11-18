// Canción con su letra siempre a la vista (decisión de Manuel: el audio tiene algo de eco, así que
// nunca suena sin letra). La línea que suena se resalta, las que siguen quedan visibles y las
// palabras en inglés van destacadas. Los tiempos vienen de canciones/<tema>.letra.json (paquete).
// No guarda nada: solo reproduce. La usan la pantalla del docente, el telón y la hoja impresa.
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Icono } from '../adultos/Icono';
import { BASE, type LineaLetra } from './datos';

const ADELANTO = 0.12; // segundos: la línea se enciende un instante antes de que se oiga

/** Texto de una línea con las palabras en inglés destacadas (insensible a mayúsculas). */
export function resaltar(texto: string, ingles: string[]): ReactNode {
  if (!ingles.length) return texto;
  const rx = new RegExp(`(?<![\\p{L}])(${ingles.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\p{L}])`, 'giu');
  return texto.split(rx).map((trozo, i) => (i % 2 ? <b key={i} className="en">{trozo}</b> : <Fragment key={i}>{trozo}</Fragment>));
}

export function useCancion(audio: string, lineas: LineaLetra[]) {
  const el = useRef<HTMLAudioElement | null>(null);
  const [sonando, setSonando] = useState(false);
  const [activo, setActivo] = useState(-1);
  const [despacio, setDespacio] = useState(false);
  const [duracion, setDuracion] = useState(0);
  const [tiempo, setTiempo] = useState(0);
  const lineasRef = useRef(lineas);
  lineasRef.current = lineas;

  const calcular = () => {
    const a = el.current;
    if (!a) return;
    const t = a.currentTime + ADELANTO;
    let idx = -1;
    for (let i = 0; i < lineasRef.current.length; i++) if (lineasRef.current[i].t <= t) idx = i;
    setActivo((previo) => (previo === idx ? previo : idx));
    setTiempo(a.currentTime);
  };

  useEffect(() => {
    const a = new Audio(BASE + audio);
    a.preload = 'metadata';
    el.current = a;
    const alPlay = () => setSonando(true);
    const alPausa = () => setSonando(false);
    const alFin = () => {
      setSonando(false);
      setActivo(-1);
      setTiempo(0);
    };
    a.addEventListener('play', alPlay);
    a.addEventListener('pause', alPausa);
    a.addEventListener('ended', alFin);
    a.addEventListener('seeked', calcular);
    a.addEventListener('timeupdate', calcular);
    a.addEventListener('loadedmetadata', () => setDuracion(a.duration));
    return () => {
      a.pause();
      a.removeAttribute('src');
      el.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio]);

  // Mientras suena se mira el reloj en cada cuadro: timeupdate solo avisa unas cuatro veces por segundo.
  useEffect(() => {
    if (!sonando) return;
    let id = 0;
    const vuelta = () => {
      calcular();
      id = window.requestAnimationFrame(vuelta);
    };
    id = window.requestAnimationFrame(vuelta);
    return () => window.cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sonando]);

  const reproducir = () => {
    const a = el.current;
    if (!a) return;
    a.playbackRate = despacio ? 0.8 : 1;
    void a.play().catch(() => setSonando(false));
  };
  return {
    sonando,
    activo,
    despacio,
    duracion,
    tiempo,
    alternar: () => (sonando ? el.current?.pause() : reproducir()),
    desdeInicio: () => {
      if (el.current) el.current.currentTime = 0;
      reproducir();
    },
    ir: (i: number) => {
      const a = el.current;
      if (!a) return;
      a.currentTime = Math.max(0, lineasRef.current[Math.max(0, Math.min(i, lineasRef.current.length - 1))].t - 0.05);
      reproducir();
    },
    alternarDespacio: () => {
      setDespacio((d) => {
        if (el.current) el.current.playbackRate = d ? 1 : 0.8;
        return !d;
      });
    },
  };
}

const reducido = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Lista de la letra: cada línea es un botón que lleva la canción a ese punto. */
export function Letra({ lineas, ingles, activo, sonando, alElegir }: { lineas: LineaLetra[]; ingles: string[]; activo: number; sonando: boolean; alElegir: (i: number) => void }) {
  const caja = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const c = caja.current;
    const li = c?.querySelector<HTMLElement>('[aria-current="true"]')?.parentElement;
    if (!c || !li || !sonando) return;
    c.scrollTo({ top: li.offsetTop - c.clientHeight / 3, behavior: reducido() ? 'auto' : 'smooth' });
  }, [activo, sonando]);
  return (
    <ol className="letra" ref={caja} aria-label="Letra de la canción">
      {lineas.map((l, i) => (
        <Fragment key={i}>
          {(i === 0 || lineas[i - 1].seccion !== l.seccion) && <li className="letra__seccion" aria-hidden="true">{l.seccion}</li>}
          <li>
            <button type="button" className={`letra__linea${i === activo ? ' letra__linea--suena' : ''}${i < activo ? ' letra__linea--paso' : ''}`} aria-current={i === activo ? 'true' : undefined} onClick={() => alElegir(i)}>
              {resaltar(l.texto, ingles)}
            </button>
          </li>
        </Fragment>
      ))}
    </ol>
  );
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Pantalla del docente: reproductor y letra a la vez. */
export function CancionPantalla({ audio, ingles, lineas }: { audio: string; ingles: string[]; lineas: LineaLetra[] }) {
  const c = useCancion(audio, lineas);
  return (
    <div className="cancion">
      <div className="cancion__control">
        <button type="button" className="boton boton--primario" onClick={c.alternar}>
          <Icono nombre={c.sonando ? 'pausa' : 'reproducir'} />
          {c.sonando ? 'Pausar' : c.tiempo > 0 ? 'Seguir' : 'Escuchar'}
        </button>
        <button type="button" className="boton" onClick={c.desdeInicio}>
          Desde el inicio
        </button>
        <button type="button" className="boton" aria-pressed={c.despacio} onClick={c.alternarDespacio}>
          <Icono nombre="despacio" />
          Despacio
        </button>
        <span className="meta cancion__tiempo">
          {mmss(c.tiempo)}
          {c.duracion ? ` de ${mmss(c.duracion)}` : ''}
        </span>
      </div>
      <Letra lineas={lineas} ingles={ingles} activo={c.activo} sonando={c.sonando} alElegir={c.ir} />
    </div>
  );
}

/** Hoja impresa: la letra completa con sus secciones y las palabras en inglés en negrita. */
export function LetraImpresa({ ingles, lineas }: { ingles: string[]; lineas: LineaLetra[] }) {
  const secciones: { nombre: string; lineas: string[] }[] = [];
  for (const l of lineas) {
    const ult = secciones[secciones.length - 1];
    if (ult && ult.nombre === l.seccion) ult.lineas.push(l.texto);
    else secciones.push({ nombre: l.seccion, lineas: [l.texto] });
  }
  const todas = useMemo(() => secciones, [lineas]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="letra-imp">
      {todas.map((s, i) => (
        <section key={i}>
          <h3>{s.nombre}</h3>
          {s.lineas.map((t, k) => (
            <p key={k}>{resaltar(t, ingles)}</p>
          ))}
        </section>
      ))}
    </div>
  );
}
