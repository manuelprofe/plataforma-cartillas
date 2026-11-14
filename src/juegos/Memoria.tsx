// Plantilla "Memory": cartas boca abajo, cada palabra tiene dos. Una muestra el dibujo y la
// otra el sonido (sin texto) o la palabra escrita, según la forma del tablero que pida el
// contenido. No contiene vocabulario: recibe las palabras de la misión.
// La carta de dibujo no suena al girar (regalaría la respuesta); la otra siempre suena.
// Sin reloj, sin contador a la vista y sin sonido de error: si no son pareja, se voltean solas.
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { FormaMemoria, Palabra, PropsJuego } from '../tipos';
import { anotarPractica, marcarVista, useProgreso } from '../progreso';
import { callar, decir, sonar } from '../audio';
import { CierreMision } from './CierreMision';
import { EscuchaToca } from './EscuchaToca';
import { decirAyuda } from './ayuda';
import { mezclar } from './mezclar';

const MS_VER_FALLO = 1100;
const MS_MEDIO_GIRO = 200;
const MS_GIRO = 420;
const S_QUIETO_1 = 15;
const S_QUIETO_2 = 25;

interface Carta {
  id: number;
  palabra: Palabra;
  cara: 'imagen' | 'otra';
}

/** Elige las palabras de un tablero: primero las que el niño tiene por repasar. */
function elegir(palabras: Palabra[], repasar: Palabra[], cuantas: number): Palabra[] {
  const pendientes = new Set(repasar.map((p) => p.en));
  const primero = mezclar(palabras.filter((p) => pendientes.has(p.en)));
  const resto = mezclar(palabras.filter((p) => !pendientes.has(p.en)));
  return [...primero, ...resto].slice(0, cuantas);
}

function armar(palabras: Palabra[]): Carta[] {
  return mezclar(palabras.flatMap((p, i) => [{ id: i * 2, palabra: p, cara: 'imagen' as const }, { id: i * 2 + 1, palabra: p, cara: 'otra' as const }]));
}

export function Memoria(props: PropsJuego) {
  const { mision } = props;
  // Con menos de 3 palabras no hay juego de memoria: se juega "escucha y toca".
  if (mision.palabras.length < 3) {
    console.warn(`Memory "${mision.id}" tiene menos de 3 palabras: se usa escucha y toca.`);
    return <EscuchaToca {...props} />;
  }
  return <Tableros {...props} />;
}

function Tableros(props: PropsJuego) {
  const { mision, base, idiomaVoz, imagenFiesta, onTerminar, onSalir } = props;
  const progreso = useProgreso();
  const formas: FormaMemoria[] = mision.formas?.length ? mision.formas : ['imagen-palabra'];
  const parejas = Math.min(mision.parejas ?? 4, mision.palabras.length);

  const [tablero, setTablero] = useState(0);
  const [cartas, setCartas] = useState(() => armar(elegir(mision.palabras, progreso.repasar, parejas)));
  const [arriba, setArriba] = useState<number[]>([]);
  const [hechas, setHechas] = useState<string[]>([]);
  const [pista, setPista] = useState<number[]>([]);
  const [latido, setLatido] = useState<number | null>(null);
  // Gesto de Lumi: inclina la cabeza (mira, no juzga) o brinca cuando ayuda. n reinicia la animación.
  const [gesto, setGesto] = useState<{ tipo: 'inclina' | 'habla'; n: number } | null>(null);
  const [demo, setDemo] = useState(() => !progreso.vistas.includes('tutorial-memoria'));
  const [manita, setManita] = useState(false);
  const [fin, setFin] = useState(false);
  // Contadores que no se dibujan: van en refs para no rearmar la pantalla.
  const errores = useRef(0);
  const seguidos = useRef(0);
  const nivel = useRef(0);
  const vistas = useRef(new Set<number>());
  const giros = useRef(new Map<string, number>()); // giros sin acierto después de ver las dos cartas
  const costaron = useRef(new Set<string>());
  const jugadas = useRef(new Map<string, Palabra>());
  const girando = useRef(new Set<number>());
  const quieto = useRef(0);
  const esperas = useRef<number[]>([]);
  const volteo = useRef<number | null>(null);

  const forma = formas[tablero];
  const luego = (f: () => void, ms: number) => {
    const t = window.setTimeout(f, ms);
    esperas.current.push(t);
    return t;
  };

  useEffect(
    () => () => {
      esperas.current.forEach(clearTimeout);
      callar();
    },
    [],
  );

  useEffect(() => {
    cartas.forEach((c) => jugadas.current.set(c.palabra.en, c.palabra));
  }, [cartas]);

  // Pestaña oculta: se calla y, al volver, la inactividad empieza de cero.
  useEffect(() => {
    const cambio = () => {
      if (document.hidden) callar();
      quieto.current = 0;
    };
    document.addEventListener('visibilitychange', cambio);
    return () => document.removeEventListener('visibilitychange', cambio);
  }, []);

  // Primera vez en la vida: Lumi gira sola una pareja, despacio, y luego aparece la manita.
  useEffect(() => {
    if (!demo) return;
    const a = cartas[0];
    const b = cartas.find((c) => c.palabra.en === a.palabra.en && c.id !== a.id)!;
    luego(() => girar(a, true), 900);
    luego(() => girar(b, true), 2100);
    luego(() => decirAyuda(props, 'memoria-tutorial'), 3300);
    luego(() => {
      sonar('volver');
      setArriba([]);
      vistas.current.clear();
      setDemo(false);
      setManita(true);
      marcarVista('tutorial-memoria');
    }, 5000);
    // Solo al entrar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ayuda si se queda quieto: a los 15 s habla Lumi, a los 25 s marca una carta.
  useEffect(() => {
    if (fin || demo) return;
    const reloj = window.setInterval(() => {
      // Con la pestaña oculta no cuenta como quieto.
      if (document.hidden) return;
      quieto.current += 1;
      if (quieto.current === S_QUIETO_1) ayudar(1);
      if (quieto.current === S_QUIETO_2) ayudar(2);
    }, 1000);
    return () => clearInterval(reloj);
    // ayudar lee el estado actual por medio de setState funcional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fin, demo, tablero, arriba, hechas]);

  const pareja = (c: Carta) => cartas.find((o) => o.palabra.en === c.palabra.en && o.id !== c.id)!;
  const suena = (c: Carta) => c.cara === 'otra';

  const latir = (id: number) => {
    setLatido(id);
    luego(() => setLatido((l) => (l === id ? null : l)), 320);
  };
  const gesticular = (tipo: 'inclina' | 'habla') => setGesto((g) => ({ tipo, n: (g?.n ?? 0) + 1 }));

  function ayudar(n: number) {
    if (n <= nivel.current) return;
    nivel.current = n;
    gesticular('habla');
    if (n === 1) {
      decirAyuda(props, 'memoria-pista1');
      return;
    }
    const libres = cartas.filter((c) => !hechas.includes(c.palabra.en));
    let marcar: number[] = [];
    if (n === 2) {
      const sola = arriba.length === 1 ? cartas.find((c) => c.id === arriba[0]) : undefined;
      const vista = libres.find((c) => vistas.current.has(c.id) && vistas.current.has(pareja(c).id));
      if (sola) marcar = [pareja(sola).id];
      else if (vista) marcar = [vista.id];
      else if (libres[0]) marcar = [libres[0].id];
    } else if (libres[0]) {
      marcar = [libres[0].id, pareja(libres[0]).id];
    }
    setPista(marcar);
    decirAyuda(props, 'memoria-pista2');
  }

  function girar(c: Carta, solo = false) {
    girando.current.add(c.id);
    luego(() => girando.current.delete(c.id), MS_GIRO);
    vistas.current.add(c.id);
    sonar('girar');
    if (suena(c) || solo) luego(() => decir(c.palabra.en, idiomaVoz), MS_MEDIO_GIRO);
    setArriba((a) => [...a, c.id]);
  }

  const tocar = (c: Carta) => {
    if (demo || fin) return;
    quieto.current = 0;
    setManita(false);
    if (pista.length) setPista([]);
    if (girando.current.has(c.id)) return;
    // En pareja o ya boca arriba sola: late y repite la palabra (sirve para practicar).
    if (hechas.includes(c.palabra.en) || (arriba.length === 1 && arriba[0] === c.id)) {
      latir(c.id);
      if (hechas.includes(c.palabra.en) || suena(c)) decir(c.palabra.en, idiomaVoz);
      return;
    }
    let abiertas = arriba;
    // Dos fallidas siguen arriba: se voltean ya y la nueva gira enseguida (el niño no espera).
    if (abiertas.length === 2) {
      if (volteo.current) clearTimeout(volteo.current);
      volteo.current = null;
      abiertas = [];
      setArriba([]);
    }
    girar(c);
    if (abiertas.length !== 1) return;

    const otra = cartas.find((o) => o.id === abiertas[0])!;
    if (otra.palabra.en === c.palabra.en) {
      // Pareja.
      const nuevas = [...hechas, c.palabra.en];
      // Al formar pareja siempre suena la palabra (si cerró con el dibujo, aún no había sonado).
      if (!suena(c)) luego(() => decir(c.palabra.en, idiomaVoz), MS_MEDIO_GIRO);
      luego(() => sonar('pareja'), 300);
      setHechas(nuevas);
      setArriba([]);
      seguidos.current = 0;
      nivel.current = 0;
      if (nuevas.length === cartas.length / 2) {
        luego(() => sonar('fiesta'), 700);
        luego(() => {
          if (tablero + 1 < formas.length) {
            setTablero(tablero + 1);
            setCartas(armar(elegir(mision.palabras, progreso.repasar, parejas)));
            setHechas([]);
            vistas.current.clear();
            giros.current.clear();
          } else setFin(true);
        }, 1600);
      }
      return;
    }
    // No son pareja: se ven y se oyen un momento y vuelven. Lumi inclina la cabeza; nada más.
    errores.current += 1;
    seguidos.current += 1;
    // Costó: girar 2 veces o más una carta de la pareja sin acertar, ya vistas sus dos cartas.
    for (const carta of [otra, c]) {
      const companera = pareja(carta);
      if (vistas.current.has(companera.id) && companera.id !== c.id && companera.id !== otra.id) {
        const n = (giros.current.get(carta.palabra.en) ?? 0) + 1;
        giros.current.set(carta.palabra.en, n);
        if (n >= 2) costaron.current.add(carta.palabra.en);
      }
    }
    gesticular('inclina');
    if (seguidos.current >= 8) ayudar(3);
    else if (seguidos.current >= 5) ayudar(2);
    else if (seguidos.current >= 3) ayudar(1);
    volteo.current = luego(() => {
      sonar('volver');
      setArriba([]);
      volteo.current = null;
    }, MS_VER_FALLO);
  };

  const halo = [0.15, 0.35, 0.55, 0.8, 1][Math.min(4, Math.round((hechas.length / (cartas.length / 2)) * 4))];
  const conLumiAlCentro = cartas.length === 8;
  const lumi = (
    <button
      type="button"
      key="lumi"
      className="memoria__lumi"
      style={{ '--halo': halo } as CSSProperties}
      onClick={() => {
        if (demo) return;
        quieto.current = 0;
        nivel.current = 0;
        ayudar(1);
      }}
      aria-label="Pedir ayuda a Lumi"
    >
      <img key={gesto?.n ?? 0} className={gesto ? `es-${gesto.tipo}` : ''} src={base + imagenFiesta} alt="" width="170" height="152" draggable={false} />
    </button>
  );

  const celdas: (Carta | 'lumi')[] = conLumiAlCentro ? [...cartas.slice(0, 4), 'lumi', ...cartas.slice(4)] : cartas;

  return (
    <div className="mision memoria">
      <header className="mision__barra">
        <button type="button" className="boton-salir" onClick={() => (callar(), onSalir())} aria-label="Volver al mapa">
          ✕
        </button>
        {!fin && (
          <div className="puntos" aria-hidden="true">
            {cartas
              .filter((c) => c.cara === 'imagen')
              .map((c, i) => (
                <span key={c.id} className={`punto${i < hechas.length ? ' punto--hecho' : i === hechas.length ? ' punto--ahora' : ''}`} />
              ))}
          </div>
        )}
      </header>

      {!fin && (
        <main className="memoria__juego">
          {!conLumiAlCentro && lumi}
          <div className={`memoria__tablero${conLumiAlCentro ? ' memoria__tablero--centro' : ''}`} key={tablero}>
            {celdas.map((c, i) => {
              if (c === 'lumi') return lumi;
              const boca = arriba.includes(c.id) || hechas.includes(c.palabra.en);
              const enPareja = hechas.includes(c.palabra.en);
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`carta${boca ? ' es-boca-arriba' : ''}${enPareja ? ' es-pareja' : ''}${pista.includes(c.id) ? ' es-pista' : ''}${latido === c.id ? ' es-late' : ''}`}
                  style={{ animationDelay: `${i * 40}ms` }}
                  onClick={() => tocar(c)}
                  aria-label={boca && (c.cara === 'otra' || enPareja) ? c.palabra.en : `Carta ${i + 1}`}
                >
                  <span className="carta__giro">
                    <span className="carta__cara carta__dorso" aria-hidden="true">
                      ★
                    </span>
                    <span className="carta__cara carta__frente" aria-hidden="true">
                      {c.cara === 'imagen' ? (
                        <img src={base + c.palabra.icono} alt="" width="96" height="96" draggable={false} />
                      ) : forma === 'imagen-sonido' ? (
                        <span className="carta__sonido">🔊</span>
                      ) : (
                        <>
                          <strong lang="en" className={c.palabra.en.length > 8 ? 'es-larga' : ''}>
                            {c.palabra.en}
                          </strong>
                          <small>🔊</small>
                        </>
                      )}
                    </span>
                  </span>
                  {manita && i === 0 && (
                    <span className="memoria__manita" aria-hidden="true">
                      👆
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </main>
      )}

      {fin && (
        <CierreMision
          mision={mision}
          errores={errores.current}
          base={base}
          imagenFiesta={imagenFiesta}
          alRegistrar={() => {
            const todas = [...jugadas.current.values()];
            anotarPractica(
              todas.filter((p) => !costaron.current.has(p.en)),
              todas.filter((p) => costaron.current.has(p.en)),
            );
          }}
          onTerminar={onTerminar}
        />
      )}
    </div>
  );
}
