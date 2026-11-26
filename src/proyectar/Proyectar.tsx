// Paquete de proyectar (esqueleto §2.3): solo lee el paquete de la cartilla. No importa nada de los
// datos del colegio ni de Supabase, y no muestra el nombre del docente ni su colegio.
// Rutas: /proyectar (temas) · /proyectar/:tema (menú) · /proyectar/:tema/:material (pantallas) · /proyectar/fin.
// Solo se proyectan materiales públicos: un material con datos de niños no tiene ruta aquí.
import { StrictMode, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { navegar, useRuta } from '../navegacion';
import { marcarProyectando } from '../proyectando';
import { NOMBRE } from '../marca';
import { Boton, Enlace, Hueco } from '../adultos/base';
import { Icono, type NombreIcono } from '../adultos/Icono';
import { base, cargarIndice, cargarMaterial, type EntradaTema, type Indice, type Material, type Opcion, type Palabra } from '../materiales/datos';
import { Visual } from '../materiales/Material';
import { resaltar, useCancion } from '../materiales/Cancion';
import { detener, sonar } from '../materiales/sonido';
import './proyectar.css';

export function montar(raiz: HTMLElement) {
  createRoot(raiz).render(
    <StrictMode>
      <Proyectar />
    </StrictMode>,
  );
}

function Proyectar() {
  const ruta = useRuta().replace(/\/+$/, '') || '/proyectar';
  const [, , tema, material] = ruta.split('/');
  useEffect(() => {
    document.title = `Proyectar · ${NOMBRE}`;
  }, []);
  if (tema === 'fin') return <Fin />;
  if (!tema) return <Temas />;
  if (!material) return <MenuTema tema={decodeURIComponent(tema)} />;
  return <Pieza tema={decodeURIComponent(tema)} id={decodeURIComponent(material)} />;
}

function useIndice() {
  const [estado, setEstado] = useState<{ indice?: Indice; error?: boolean }>({});
  useEffect(() => {
    let vivo = true;
    cargarIndice().then(
      (indice) => vivo && setEstado({ indice }),
      () => vivo && setEstado({ error: true }),
    );
    return () => {
      vivo = false;
    };
  }, []);
  return estado;
}

// ---------------------------------------------------------------- Telón

interface TelonProps {
  titulo: string;
  sub?: string;
  atras?: { ruta: string; etiqueta: string };
  ayuda?: boolean;
  alTecla?: (e: KeyboardEvent) => void;
  children: ReactNode;
}

function Telon({ titulo, sub, atras, ayuda, alTecla, children }: TelonProps) {
  const [confirmar, setConfirmar] = useState(false);
  const tecla = useRef(alTecla);
  tecla.current = alTecla;
  const abierto = useRef(false);
  abierto.current = confirmar;
  // Mientras haya telón, este aparato cuenta como "proyectando" para la cortina del docente.
  useEffect(() => {
    marcarProyectando();
    const cada = window.setInterval(marcarProyectando, 60000);
    return () => window.clearInterval(cada);
  }, []);
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return setConfirmar((c) => !c);
      if (!abierto.current) tecla.current?.(e);
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, []);
  useEffect(() => detener, []);

  return (
    <div className="telon">
      <header className="telon__cabeza">
        {atras && (
          <Enlace ruta={atras.ruta} className="telon__atras">
            <Icono nombre="anterior" />
            <span className="sr">{atras.etiqueta}</span>
          </Enlace>
        )}
        <div className="telon__titulo">
          <h1>{titulo}</h1>
          {sub && <p className="meta">{sub}</p>}
        </div>
        {ayuda && (
          <p className="telon__teclas" aria-hidden="true">
            <kbd>Espacio</kbd> otra vez <kbd>D</kbd> despacio <kbd>←</kbd>
            <kbd>→</kbd> pasar <kbd>Esc</kbd> terminar
          </p>
        )}
        <button type="button" className="telon__terminar" onClick={() => setConfirmar(true)}>
          <Icono nombre="cerrar" />
          Terminar
        </button>
      </header>
      {children}
      {confirmar && (
        <div className="telon__confirmar" role="dialog" aria-modal="true" aria-labelledby="confirmar-titulo">
          <div>
            <h2 id="confirmar-titulo">¿Terminar la proyección?</h2>
            <div className="acciones">
              <button type="button" autoFocus className="boton boton--secundario" onClick={() => setConfirmar(false)}>
                Seguir proyectando
              </button>
              <Boton variante="primario" onClick={() => navegar('/proyectar/fin', true)}>
                Terminar
              </Boton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Cargando() {
  return (
    <main className="telon__cuerpo" aria-busy="true">
      <p role="status">Cargando…</p>
    </main>
  );
}

function SinRed({ alReintentar }: { alReintentar?: () => void }) {
  return (
    <main className="telon__cuerpo">
      <Hueco titulo="No se pudo abrir el tema" texto="Hace falta señal la primera vez. Las láminas impresas sostienen la clase.">
        <div>
          <Boton onClick={alReintentar ?? (() => location.reload())}>Reintentar</Boton>
        </div>
      </Hueco>
    </main>
  );
}

// ---------------------------------------------------------------- Temas y menú del tema

function Temas() {
  const { indice, error } = useIndice();
  return (
    <Telon titulo="Elegir tema" sub={NOMBRE}>
      {error ? (
        <SinRed />
      ) : !indice ? (
        <Cargando />
      ) : (
        <main className="telon__cuerpo">
          {indice.temas[0]?.territorio && <p className="telon__lead">{indice.temas[0].territorio.split(",")[0]}</p>}
          <div className="tarjetas">
            {indice.temas.map((t) => {
              const abre = t.estado === 'listo' || t.materiales.length > 0;
              const contenido = (
                <>
                  <span className="tarjeta-t__titulo">{t.nombre}</span>
                  <span className="tarjeta-t__sub">{t.estado === 'listo' ? t.titulo : abre ? 'Por ahora, la canción' : 'Aquí irá'}</span>
                </>
              );
              return abre ? (
                <Enlace key={t.id} ruta={`/proyectar/${t.id}`} className="tarjeta-t">
                  {contenido}
                </Enlace>
              ) : (
                <div key={t.id} className="tarjeta-t tarjeta-t--hueco">
                  {contenido}
                </div>
              );
            })}
          </div>
        </main>
      )}
    </Telon>
  );
}

const ICONO_TIPO: Record<string, NombreIcono> = { laminas: 'materiales', cancion: 'sonido', prueba: 'lista', ficha: 'documento', decir: 'grupos' };

function MenuTema({ tema }: { tema: string }) {
  const { indice, error } = useIndice();
  const e = indice?.temas.find((t) => t.id === tema);
  return (
    <Telon titulo={e?.nombre ?? 'Tema'} sub={e?.territorio} atras={{ ruta: '/proyectar', etiqueta: 'Elegir tema' }}>
      {error ? (
        <SinRed />
      ) : !indice ? (
        <Cargando />
      ) : !e ? (
        <main className="telon__cuerpo">
          <Hueco titulo="Ese tema no existe" />
        </main>
      ) : (
        <main className="telon__cuerpo telon__menu">
          <aside className="telon__guia">
            <img src={`${base()}${indice.guia ?? 'personajes/goma-senalar.webp'}`} width="280" height="320" alt="" />
            <p>Hoy aprendemos {e.nombre.toLowerCase()}</p>
          </aside>
          <div className="tarjetas">{tarjetas(e, indice)}</div>
        </main>
      )}
    </Telon>
  );
}

function tarjetas(e: EntradaTema, _indice: Indice) {
  const lista = e.materiales.filter((m) => m.proyectar !== 'no');
  const juegos = e.juegos ?? [];
  const tiene = (tipo: string) => lista.some((m) => m.tipo === tipo);
  const hueco = (clave: string, titulo: string, sub: string) => (
    <div key={clave} className="tarjeta-t tarjeta-t--hueco">
      <span className="tarjeta-t__titulo">{titulo}</span>
      <span className="tarjeta-t__sub">{sub}</span>
    </div>
  );
  return (
    <>
      {lista.map((m) => (
        <Enlace key={m.id} ruta={`/proyectar/${e.id}/${m.id}`} className="tarjeta-t">
          <span className="tarjeta-t__icono">
            <Icono nombre={ICONO_TIPO[m.tipo] ?? 'documento'} />
          </span>
          <span className="tarjeta-t__titulo">{m.tipo === 'laminas' ? 'Láminas' : m.titulo.replace(/ ·.*$/, '')}</span>
          <span className="tarjeta-t__sub">{m.tipo === 'laminas' ? `${e.palabras} palabras` : m.tipo === 'cancion' ? 'Con la letra' : m.proyectar === 'todo' ? 'Pantalla por pantalla' : 'La instrucción'}</span>
        </Enlace>
      ))}
      {!tiene('laminas') && hueco('laminas', 'Láminas', `Aquí irán las láminas de ${e.nombre.toLowerCase()}`)}
      {juegos.map((j) => hueco(j, j, 'Aquí irá el juego'))}
      {!tiene('cancion') && hueco('cancion', 'Canción del tema', `Aquí irá la canción de ${e.nombre.toLowerCase()}`)}
      {!tiene('prueba') && hueco('prueba', 'El reto', 'Aquí irá la prueba')}
      {hueco('caritas', 'Caritas', 'Aquí irá la hoja de caritas')}
    </>
  );
}

// ---------------------------------------------------------------- Una pieza: pantallas o canción

function Pieza({ tema, id }: { tema: string; id: string }) {
  const [estado, setEstado] = useState<{ material?: Material; nombre?: string; listo: boolean; error?: boolean }>({ listo: false });
  useEffect(() => {
    let vivo = true;
    cargarMaterial(tema, id).then(
      (r) => vivo && setEstado({ material: r.material, nombre: r.entrada?.nombre, listo: true }),
      () => vivo && setEstado({ listo: true, error: true }),
    );
    return () => {
      vivo = false;
    };
  }, [tema, id]);
  const menu = `/proyectar/${encodeURIComponent(tema)}`;
  const { material } = estado;
  // Un material con datos de niños, o que no se proyecta, no tiene pantalla aquí.
  const sirve = material && material.privacidad === 'publico' && material.formatos.proyectar !== 'no';
  if (!estado.listo)
    return (
      <Telon titulo="Proyectar" atras={{ ruta: menu, etiqueta: 'Menú del tema' }}>
        <Cargando />
      </Telon>
    );
  if (estado.error)
    return (
      <Telon titulo="Proyectar" atras={{ ruta: menu, etiqueta: 'Menú del tema' }}>
        <SinRed />
      </Telon>
    );
  if (!sirve)
    return (
      <Telon titulo="Proyectar" atras={{ ruta: menu, etiqueta: 'Menú del tema' }}>
        <main className="telon__cuerpo">
          <Hueco titulo="Aquí irá esta pantalla" texto="Todavía no tiene contenido para proyectar.">
            <div>
              <Boton ruta={menu}>Volver al menú del tema</Boton>
            </div>
          </Hueco>
        </main>
      </Telon>
    );
  const sub = `${estado.nombre ?? ''}`;
  const titulo = material.tipo === 'laminas' ? 'Láminas' : material.titulo;
  const cancion = material.bloques.find((b) => b.tipo === 'cancion');
  return cancion && cancion.tipo === 'cancion' ? (
    <CantoTelon titulo={titulo} sub={sub} menu={menu} audio={cancion.audio} ingles={cancion.ingles} lineas={cancion.lineas} />
  ) : (
    <Pantallas key={material.id} material={material} titulo={titulo} sub={sub} menu={menu} />
  );
}

// ---------------------------------------------------------------- Pantallas (láminas, consignas, prueba)

type Diapositiva =
  | { k: 'palabra'; p: Palabra }
  | { k: 'consigna'; iconos: string[]; texto: string; audio?: string }
  | { k: 'item'; fila: string; objetivo: string; audio: string; opciones: Opcion[]; respuesta: number }
  | { k: 'titulo'; texto: string };

/** Solo lo proyectable: el guion, la clave, las casillas y lo del docente nunca llegan aquí. */
function diapositivas(m: Material): Diapositiva[] {
  const todo = m.formatos.proyectar === 'todo';
  const res: Diapositiva[] = [];
  for (const b of m.bloques) {
    if (b.solo === 'docente') continue;
    if (b.tipo === 'consigna') res.push({ k: 'consigna', iconos: b.iconos, texto: b.texto, audio: b.audio });
    else if (todo && b.tipo === 'palabra') res.push({ k: 'palabra', p: b });
    else if (todo && b.tipo === 'item-prueba') res.push({ k: 'item', fila: b.fila, objetivo: b.objetivo, audio: b.audio, opciones: b.opciones, respuesta: b.respuesta });
    else if (todo && b.tipo === 'titulo' && m.tipo === 'prueba') res.push({ k: 'titulo', texto: b.texto });
  }
  return res;
}

function Pantallas({ material, titulo, sub, menu }: { material: Material; titulo: string; sub: string; menu: string }) {
  const slides = useMemo(() => diapositivas(material), [material]);
  const [i, setI] = useState(0);
  const [visto, setVisto] = useState<number | null>(null);
  const n = slides.length;
  const d = slides[i];

  const oir = useCallback(
    (lento: boolean) => {
      if (!d) return;
      if (d.k === 'palabra') sonar(d.p.audio, { despacio: lento });
      else if (d.k === 'item') sonar(d.audio, { veces: 2, despacio: lento });
      else if (d.k === 'consigna') sonar(d.audio, { despacio: lento });
    },
    [d],
  );
  // Al llegar a una pantalla suena sola (se llegó con un toque o una tecla).
  useEffect(() => {
    setVisto(null);
    oir(false);
    return detener;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  const pasar = (delta: number) => setI((x) => Math.max(0, Math.min(n - 1, x + delta)));
  const alTecla = (e: KeyboardEvent) => {
    if (e.key === ' ') {
      e.preventDefault();
      oir(false);
    } else if (e.key === 'd' || e.key === 'D') oir(true);
    else if (e.key === 'ArrowRight' || e.key === 'PageDown') pasar(1);
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') pasar(-1);
  };

  if (!d)
    return (
      <Telon titulo={titulo} sub={sub} atras={{ ruta: menu, etiqueta: 'Menú del tema' }}>
        <main className="telon__cuerpo">
          <Hueco titulo="Aquí irá esta pantalla" />
        </main>
      </Telon>
    );
  return (
    <Telon titulo={titulo} sub={sub} atras={{ ruta: menu, etiqueta: 'Menú del tema' }} ayuda alTecla={alTecla}>
      <main className="deck" aria-live="polite">
        {d.k === 'palabra' && (
          <button type="button" className="deck__lamina" onClick={() => oir(false)} aria-label={`Oír ${d.p.palabra}`}>
            <Visual p={d.p} tam={400} />
            <span className="deck__texto">
              <span className="deck__palabra">{d.p.palabra}</span>
              <span className="deck__suena">Suena: {d.p.suena}</span>
            </span>
          </button>
        )}
        {d.k === 'consigna' && (
          <div className="deck__consigna">
            {d.iconos.length > 0 && (
              <span className="deck__iconos">
                {d.iconos.map((x) => (
                  <img key={x} src={base() + x} width="120" height="120" alt="" />
                ))}
              </span>
            )}
            <p>{d.texto}</p>
          </div>
        )}
        {d.k === 'titulo' && <h2 className="deck__titulo">{d.texto}</h2>}
        {d.k === 'item' && (
          <div className="deck__item">
            <p className="deck__escucha">
              <Icono nombre="sonido" />
              Escucha y señala
            </p>
            <ol className="deck__opciones">
              {d.opciones.map((o, k) => {
                const correcta = k + 1 === d.respuesta;
                const marcada = visto !== null && correcta;
                return (
                  <li key={k}>
                    <button type="button" className={`deck__opcion${marcada ? ' deck__opcion--si' : ''}`} onClick={() => setVisto(k)} aria-label={visto !== null && correcta ? `${o.palabra}, la que sonó` : `Opción ${k + 1}`}>
                      <Visual p={o} tam={200} />
                      {marcada && <span className="deck__respuesta">{o.palabra}</span>}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </main>
      <div className="deck__ctl">
        <button type="button" className="deck__btn" onClick={() => pasar(-1)} disabled={i === 0} aria-label="Anterior">
          <Icono nombre="anterior" />
        </button>
        <button type="button" className="deck__btn deck__btn--primario" onClick={() => oir(false)}>
          <Icono nombre="sonido" />
          Otra vez
        </button>
        <button type="button" className="deck__btn" onClick={() => oir(true)}>
          <Icono nombre="despacio" />
          Despacio
        </button>
        <button type="button" className="deck__btn" onClick={() => pasar(1)} disabled={i === n - 1} aria-label="Siguiente">
          <Icono nombre="siguiente" />
        </button>
        <span className="deck__cuenta">
          {i + 1} de {n}
        </span>
      </div>
    </Telon>
  );
}

// ---------------------------------------------------------------- Canción en el telón

function CantoTelon({ titulo, sub, menu, audio, ingles, lineas }: { titulo: string; sub: string; menu: string; audio: string; ingles: string[]; lineas: { t: number; seccion: string; texto: string }[] }) {
  const c = useCancion(audio, lineas);
  const alTecla = (e: KeyboardEvent) => {
    if (e.key === ' ') {
      e.preventDefault();
      c.alternar();
    } else if (e.key === 'd' || e.key === 'D') c.alternarDespacio();
    else if (e.key === 'ArrowRight') c.ir(c.activo + 1);
    else if (e.key === 'ArrowLeft') c.ir(c.activo - 1);
  };
  // Ventana de la letra: la que suena, la anterior y las que siguen (siempre hay letra a la vista).
  const desde = Math.max(0, Math.min(c.activo - 1, lineas.length - 5));
  const visibles = lineas.slice(desde, desde + 5);
  return (
    <Telon titulo={titulo} sub={sub} atras={{ ruta: menu, etiqueta: 'Menú del tema' }} alTecla={alTecla}>
      <main className="deck deck--canto">
        <ol className="canto" aria-label="Letra de la canción">
          {visibles.map((l, k) => {
            const i = desde + k;
            return (
              <li key={i}>
                {(k === 0 || lineas[i - 1]?.seccion !== l.seccion) && <span className="canto__seccion">{l.seccion}</span>}
                <button type="button" className={`canto__linea${i === c.activo ? ' canto__linea--suena' : ''}`} aria-current={i === c.activo ? 'true' : undefined} onClick={() => c.ir(i)}>
                  {resaltar(l.texto, ingles)}
                </button>
              </li>
            );
          })}
        </ol>
      </main>
      <div className="deck__ctl">
        <button type="button" className="deck__btn" onClick={() => c.ir(c.activo - 1)} aria-label="Línea anterior">
          <Icono nombre="anterior" />
        </button>
        <button type="button" className="deck__btn deck__btn--primario" onClick={c.alternar}>
          <Icono nombre={c.sonando ? 'pausa' : 'reproducir'} />
          {c.sonando ? 'Pausar' : 'Cantar'}
        </button>
        <button type="button" className="deck__btn" onClick={c.desdeInicio}>
          Desde el inicio
        </button>
        <button type="button" className="deck__btn" aria-pressed={c.despacio} onClick={c.alternarDespacio}>
          <Icono nombre="despacio" />
          Despacio
        </button>
        <button type="button" className="deck__btn" onClick={() => c.ir(c.activo + 1)} aria-label="Línea siguiente">
          <Icono nombre="siguiente" />
        </button>
        <span className="deck__cuenta">{Math.max(1, c.activo + 1)} de {lineas.length}</span>
      </div>
    </Telon>
  );
}

function Fin() {
  return (
    <div className="telon">
      <main className="telon__cuerpo telon__fin">
        <h1>Proyección terminada</h1>
        <div className="acciones">
          <Boton ruta="/proyectar">Volver a proyectar</Boton>
          <Boton variante="primario" ruta="/docente">
            Ir a mi inicio
          </Boton>
        </div>
      </main>
    </div>
  );
}
