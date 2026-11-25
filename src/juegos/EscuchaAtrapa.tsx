// Plantilla "Listen & Catch" (escucha y atrapa): Cosmo dice una palabra y desde arriba bajan
// farolitos con dibujos por carriles fijos. El niño toca el que lleva la palabra y el farolito
// vuela al frasco, que se llena de luz. No contiene vocabulario: recibe las palabras de la
// misión, y el ritmo (segundos de caída y distractores) viene del contenido.
// Nada se pierde: lo que no se atrapa vuelve a pasar, más despacio y brillando.
// El movimiento lo hace un solo bucle de requestAnimationFrame que solo cambia `transform`.
// Con movimiento reducido (se decide aquí, no en CSS) los farolitos aparecen quietos.
import { useEffect, useRef, useState } from 'react';
import type { AjustesAtrapa, Palabra, PropsJuego } from '../tipos';
import { anotarPractica } from '../progreso';
import { callar, decir, sonar } from '../audio';
import { CierreMision } from './CierreMision';
import { EscuchaToca } from './EscuchaToca';
import { decirAyuda } from './ayuda';
import { mezclar } from './mezclar';

/** Solo si el contenido no trae ajustes: los límites del pedagogo (6 s a 4,5 s, nunca más rápido). */
const AJUSTES_BASE: AjustesAtrapa = { cruceInicio: 6, cruceFinal: 4.5, distractores: [2, 2, 3] };
/** Cuánto más lento pasa lo que se dejó pasar o tras dos toques seguidos en otro. */
const MAS_LENTO = 1.3;
const LENTO_MAXIMO = 2;
/** Separación entre farolitos de una misma ronda, en fracciones de la caída. */
const SEPARACION = 0.24;
/** Alturas fijas (fracción de la caída) con movimiento reducido. */
const QUIETOS = [0.18, 0.52, 0.34, 0.68];
const MS_FRASCO = 450;

type Fase = 'mirar' | 'jugar' | 'cierre';

interface Farol {
  clave: string;
  palabra: Palabra;
  carril: number;
  /** Orden de salida: el segundo en salir siempre es el correcto (da tiempo a oír). */
  turno: number;
  correcto: boolean;
  estado: 'cae' | 'no' | 'atrapado' | 'se-va';
  pista: boolean;
}

interface Movimiento {
  p: number;
  lento: number;
  pasadas: number;
}

const reducido = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function EscuchaAtrapa(props: PropsJuego) {
  if (props.mision.palabras.length < 3) {
    console.warn(`Listen & Catch "${props.mision.id}" tiene menos de 3 palabras: se usa escucha y toca.`);
    return <EscuchaToca {...props} />;
  }
  return <Atrapa {...props} />;
}

function Atrapa(props: PropsJuego) {
  const { mision, base, idiomaVoz, imagenGuia, imagenFiesta, onTerminar, onSalir } = props;
  const ajustes = mision.atrapa ?? AJUSTES_BASE;
  const [seleccion] = useState(() => mezclar(mision.palabras));
  const [rondas, setRondas] = useState(() => mezclar(seleccion));
  const [fase, setFase] = useState<Fase>('mirar');
  const [indice, setIndice] = useState(0);
  const [farolitos, setFarolitos] = useState<Farol[]>([]);
  const [llenas, setLlenas] = useState(0);
  const [lleno, setLleno] = useState(false);
  const [quieto] = useState(reducido);
  const [errores, setErrores] = useState(0);
  const costaron = useRef(new Set<string>());
  const extra = useRef(false);
  const malSeguidos = useRef(0);
  const lentoRonda = useRef(1);
  const mov = useRef(new Map<string, Movimiento>());
  const nodos = useRef(new Map<string, HTMLButtonElement>());
  const vivos = useRef<Farol[]>([]);
  const cielo = useRef<HTMLDivElement>(null);
  const frasco = useRef<HTMLDivElement>(null);
  const medida = useRef({ ancho: 358, alto: 500, lado: 84 });
  const esperas = useRef<number[]>([]);
  // Lo que iba a pasar mientras la pestaña estaba oculta: se hace al volver.
  const enPausa = useRef<(() => void)[]>([]);
  // Correcciones tras tocar otro (su nombre, luego el objetivo): se cancelan al acertar.
  const correccion = useRef<number[]>([]);
  const fantasmas = useRef(new Set<HTMLElement>());
  const primeraDicha = useRef(false);

  const luego = (f: () => void, ms: number) => {
    const t = window.setTimeout(() => (document.hidden ? enPausa.current.push(f) : f()), ms);
    esperas.current.push(t);
    return t;
  };
  const cancelarCorreccion = () => {
    correccion.current.forEach(clearTimeout);
    correccion.current = [];
  };
  useEffect(
    () => () => {
      esperas.current.forEach(clearTimeout);
      fantasmas.current.forEach((f) => f.remove());
      callar();
    },
    [],
  );

  const objetivo = fase === 'jugar' ? rondas[indice] : seleccion[indice];
  vivos.current = farolitos;
  const objetivoVivo = useRef(objetivo);
  objetivoVivo.current = objetivo;

  // Pestaña oculta: se calla; al volver sigue lo pendiente y se repite la palabra.
  useEffect(() => {
    const cambio = () => {
      if (document.hidden) {
        callar();
        return;
      }
      const pendientes = enPausa.current;
      enPausa.current = [];
      pendientes.forEach((f) => f());
      if (objetivoVivo.current) decir(objetivoVivo.current.en, idiomaVoz);
    };
    document.addEventListener('visibilitychange', cambio);
    return () => document.removeEventListener('visibilitychange', cambio);
  }, [idiomaVoz]);

  // ---------- Mirar: cada palabra se ve y se oye una vez ----------
  useEffect(() => {
    if (fase !== 'mirar' || !objetivo) return;
    const t = window.setTimeout(() => decir(objetivo.frase ?? objetivo.en, idiomaVoz), 350);
    return () => clearTimeout(t);
  }, [fase, objetivo, idiomaVoz]);

  const siguienteCarta = () => {
    sonar('toque');
    if (indice + 1 < seleccion.length) setIndice(indice + 1);
    else {
      setIndice(0);
      setFase('jugar');
      // La primera palabra se dice cuando termina la instrucción (o a los 5 s si el navegador no avisa).
      const primera = () => {
        // Solo si sigue en la primera ronda: si ya la atrapó, no se dice tarde.
        if (primeraDicha.current || objetivoVivo.current !== rondas[0]) return;
        primeraDicha.current = true;
        decir(rondas[0].en, idiomaVoz);
      };
      luego(() => decirAyuda(props, 'atrapa-inicio', primera), 300);
      luego(primera, 5000);
    }
  };

  // ---------- Jugar: se arma cada ronda ----------
  useEffect(() => {
    if (fase !== 'jugar' || !objetivo) return;
    const tabla = ajustes.distractores;
    const cuantos = Math.min(tabla[Math.min(indice, tabla.length - 1)] ?? 2, mision.palabras.length - 1);
    const otros = mezclar(mision.palabras.filter((p) => p.en !== objetivo.en)).slice(0, cuantos);
    const carriles = mezclar([...Array(cuantos + 1).keys()]);
    // Turnos: un distractor primero, luego el correcto, luego el resto.
    const lista: Farol[] = [objetivo, ...otros].map((p, k) => ({
      clave: `${indice}-${k}`,
      palabra: p,
      carril: carriles[k],
      turno: k === 0 ? 1 : k === 1 ? 0 : k,
      correcto: k === 0,
      estado: 'cae',
      pista: false,
    }));
    mov.current = new Map(lista.map((f) => [f.clave, { p: -f.turno * SEPARACION, lento: 1, pasadas: 0 }]));
    malSeguidos.current = 0;
    lentoRonda.current = 1;
    cancelarCorreccion();
    setFarolitos(lista);
    // La primera ronda la anuncia la instrucción de Cosmo (ver siguienteCarta).
    if (indice === 0) return;
    const t = luego(() => decir(objetivo.en, idiomaVoz), 350);
    return () => clearTimeout(t);
  }, [fase, indice, objetivo, mision.palabras, ajustes, idiomaVoz]);

  // Segundos de caída de esta ronda: del inicio al final, nunca por debajo del final.
  const cruce = (() => {
    const total = Math.max(1, seleccion.length - 1);
    const s = ajustes.cruceInicio + (ajustes.cruceFinal - ajustes.cruceInicio) * Math.min(1, indice / total);
    return Math.max(ajustes.cruceFinal, s);
  })();

  // Posición de un farolito en pantalla (solo transform).
  const colocar = (f: Farol, p: number, adentro = false) => {
    const el = nodos.current.get(f.clave);
    if (!el) return;
    const { ancho, alto, lado } = medida.current;
    const n = vivos.current.length || 3;
    const x = ((f.carril + 0.5) * ancho) / n - lado / 2;
    // Quietos: siempre dentro del cielo. Cayendo: entran por arriba y salen por abajo.
    const y = adentro ? p * Math.max(0, alto - lado) : -lado + p * (alto + lado);
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  };

  // ---------- El bucle: uno solo, solo transform ----------
  // Se arma cuando ya se dibujaron los farolitos de la ronda (no al cambiar el índice, que
  // llega un render antes que la lista nueva).
  const ronda = farolitos[0]?.clave.split('-')[0];
  useEffect(() => {
    if (fase !== 'jugar' || !farolitos.length) return;
    const medir = () => {
      const c = cielo.current;
      if (!c) return;
      const ancho = c.clientWidth;
      const lado = Math.min(88, Math.floor(ancho / farolitos.length) - 6);
      medida.current = { ancho, alto: c.clientHeight, lado };
      c.style.setProperty('--lado', `${lado}px`);
      // Quietos: al girar la pantalla se vuelven a colocar.
      if (quieto) vivos.current.forEach((f) => f.estado !== 'atrapado' && colocar(f, QUIETOS[f.turno % QUIETOS.length], true));
    };
    medir();
    // Se mide el cielo mismo (al girar la pantalla, el evento de la ventana llega antes del nuevo diseño).
    const vigia = new ResizeObserver(medir);
    if (cielo.current) vigia.observe(cielo.current);
    if (quieto) return () => vigia.disconnect();
    let cuadro = 0;
    let antes = performance.now();
    const paso = (ahora: number) => {
      const dt = Math.min(50, ahora - antes);
      antes = ahora;
      for (const f of vivos.current) {
        const m = mov.current.get(f.clave);
        if (!m || f.estado === 'atrapado' || f.estado === 'se-va') continue;
        m.p += dt / (cruce * 1000 * m.lento * lentoRonda.current);
        if (m.p > 1) {
          // Lo que no se atrapa vuelve a pasar.
          m.p = -0.12;
          if (f.estado === 'no') cambiar(f.clave, { estado: 'cae' });
          if (f.correcto) pasoSinTocar(f, m);
        }
        colocar(f, m.p);
      }
      cuadro = requestAnimationFrame(paso);
    };
    const visible = () => {
      cancelAnimationFrame(cuadro);
      if (document.visibilityState === 'visible') {
        antes = performance.now();
        cuadro = requestAnimationFrame(paso);
      }
    };
    cuadro = requestAnimationFrame(paso);
    document.addEventListener('visibilitychange', visible);
    return () => {
      cancelAnimationFrame(cuadro);
      document.removeEventListener('visibilitychange', visible);
      vigia.disconnect();
    };
    // El bucle se arma por ronda; lee el estado vivo por refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, ronda, quieto, cruce]);

  const cambiar = (clave: string, cambio: Partial<Farol>) => setFarolitos((fs) => fs.map((f) => (f.clave === clave ? { ...f, ...cambio } : f)));

  function pasoSinTocar(f: Farol, m: Movimiento) {
    m.pasadas += 1;
    m.lento = Math.min(LENTO_MAXIMO, m.lento * MAS_LENTO);
    if (m.pasadas >= 2) costaron.current.add(f.palabra.en);
    cambiar(f.clave, { pista: true });
    decir(f.palabra.en, idiomaVoz);
  }

  const terminarRonda = () => {
    if (indice + 1 < rondas.length) {
      setIndice(indice + 1);
      return;
    }
    // Una ronda más con una palabra que costó en esta partida.
    const costo = [...costaron.current][0];
    if (!extra.current && costo) {
      extra.current = true;
      setRondas([...rondas, seleccion.find((p) => p.en === costo)!]);
      setIndice(indice + 1);
      return;
    }
    setLleno(true);
    sonar('fiesta');
    luego(() => setFase('cierre'), 1400);
  };

  const tocar = (f: Farol) => {
    if (f.estado !== 'cae' || !objetivo) return;
    if (f.correcto) {
      cancelarCorreccion();
      sonar('atrapar');
      decir(f.palabra.en, idiomaVoz);
      const el = nodos.current.get(f.clave);
      const fr = frasco.current?.getBoundingClientRect();
      if (el && fr && !quieto) {
        // Vuela al frasco una copia fija en la pantalla: el cielo recorta lo que sale de él.
        const r = el.getBoundingClientRect();
        const copia = el.cloneNode(true) as HTMLElement;
        copia.classList.add('farolito--atrapado');
        copia.removeAttribute('aria-label');
        copia.setAttribute('aria-hidden', 'true');
        Object.assign(copia.style, {
          position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`,
          transform: 'none', zIndex: '30', pointerEvents: 'none',
        });
        document.body.append(copia);
        fantasmas.current.add(copia);
        el.style.visibility = 'hidden';
        const dx = fr.left + fr.width / 2 - (r.left + r.width / 2);
        const dy = fr.top + fr.height / 2 - (r.top + r.height / 2);
        window.setTimeout(() => {
          copia.style.transition = `transform ${MS_FRASCO}ms cubic-bezier(0.2, 1.4, 0.4, 1), opacity ${MS_FRASCO}ms`;
          copia.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(0.4)`;
          copia.style.opacity = '0';
        }, 280);
        window.setTimeout(() => {
          copia.remove();
          fantasmas.current.delete(copia);
        }, 280 + MS_FRASCO + 80);
      } else if (el) {
        // Movimiento reducido: el acierto es solo un cambio de opacidad.
        el.style.transition = 'opacity 0.3s';
        el.style.opacity = '0';
      }
      setFarolitos((fs) => fs.map((o) => (o.clave === f.clave ? { ...o, estado: 'atrapado' } : { ...o, estado: 'se-va' })));
      luego(() => {
        sonar('frasco');
        setLlenas((n) => n + 1);
      }, (quieto ? 0 : 280) + MS_FRASCO);
      luego(terminarRonda, 1500);
      return;
    }
    // Otro: tiembla, queda translúcido, se dice su nombre y se repite el objetivo.
    sonar('intenta');
    cambiar(f.clave, { estado: 'no' });
    setErrores((e) => e + 1);
    costaron.current.add(objetivo.en);
    malSeguidos.current += 1;
    if (malSeguidos.current >= 2) lentoRonda.current = MAS_LENTO;
    cancelarCorreccion();
    correccion.current.push(luego(() => decir(f.palabra.en, idiomaVoz), 250), luego(() => decir(objetivo.en, idiomaVoz), 1300));
  };

  const repetir = () => {
    sonar('toque');
    if (objetivo) decir(objetivo.en, idiomaVoz);
  };

  // La ronda extra (una palabra que costó) no suma puntos ni luz: el frasco ya está lleno.
  const puntos = fase === 'mirar' ? seleccion : rondas.slice(0, seleccion.length);

  return (
    <div className={`mision${fase === 'jugar' ? ' mision--noche' : ''}`}>
      <header className="mision__barra">
        <button type="button" className="boton-salir" onClick={() => (callar(), onSalir())} aria-label="Volver al mapa">
          ✕
        </button>
        {fase !== 'cierre' && (
          <div className="puntos" aria-hidden="true">
            {puntos.map((p, i) => (
              <span key={`${p.en}-${i}`} className={`punto${i < indice ? ' punto--hecho' : i === indice ? ' punto--ahora' : ''}${fase === 'mirar' ? ' punto--mirar' : ''}`} />
            ))}
          </div>
        )}
      </header>

      {fase === 'mirar' && objetivo && (
        <main className="mirar">
          <button type="button" className="carta-grande" key={objetivo.en} onClick={repetir} aria-label={`Escuchar ${objetivo.en}`}>
            <img src={base + objetivo.icono} alt="" width="160" height="160" draggable={false} />
            <strong lang={idiomaVoz}>{objetivo.en}</strong>
            {objetivo.es !== objetivo.en && <small>{objetivo.es}</small>}
            <span className="carta-grande__oir" aria-hidden="true">
              🔊
            </span>
          </button>
          <button type="button" className="boton-seguir" onClick={siguienteCarta} aria-label="Siguiente">
            ➜
          </button>
        </main>
      )}

      {fase === 'jugar' && (
        <main className={`escucha-atrapa${quieto ? ' escucha-atrapa--quieto' : ''}`}>
          <button type="button" className="oir oir--chico" onClick={repetir} aria-label="Escuchar otra vez">
            <img src={base + imagenGuia} alt="" width="80" height="63" draggable={false} />
            <span className="oir__onda" aria-hidden="true">
              🔊
            </span>
          </button>
          <div className="escucha-atrapa__cielo" ref={cielo}>
            {farolitos.map((f) => (
              <button
                key={f.clave}
                ref={(el) => {
                  if (el) nodos.current.set(f.clave, el);
                  else nodos.current.delete(f.clave);
                }}
                type="button"
                className={`farolito farolito--${f.estado}${f.pista ? ' es-pista' : ''}`}
                onPointerDown={(e) => {
                  e.preventDefault();
                  tocar(f);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    tocar(f);
                  }
                }}
                aria-label={f.palabra.en}
              >
                <span className="farolito__luz">
                  <img src={base + f.palabra.icono} alt="" width="52" height="52" draggable={false} />
                </span>
              </button>
            ))}
          </div>
          <div className={`frasco${lleno ? ' es-lleno' : ''}`} ref={frasco} aria-hidden="true">
            <span className="frasco__luz" style={{ transform: `translateY(${(1 - Math.min(llenas, seleccion.length) / seleccion.length) * 100}%)` }} />
            <span className="frasco__tapa" />
            {lleno && <img className="frasco__lumi" src={base + imagenFiesta} alt="" width="112" height="100" draggable={false} />}
          </div>
        </main>
      )}

      {fase === 'cierre' && (
        <CierreMision
          mision={mision}
          errores={errores}
          base={base}
          imagenFiesta={imagenFiesta}
          alRegistrar={() =>
            anotarPractica(
              seleccion.filter((p) => !costaron.current.has(p.en)),
              seleccion.filter((p) => costaron.current.has(p.en)),
            )
          }
          onTerminar={onTerminar}
        />
      )}
    </div>
  );
}
