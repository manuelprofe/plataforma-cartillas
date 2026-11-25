// Biblioteca del docente: el contenido de la cartilla anterior (historia, recursos por tema,
// banco de actividades y documentos), leído del paquete de la cartilla (`biblioteca/*.json`,
// generado por herramientas/importar/importar_biblioteca.py). Nada de contenido escrito aquí.
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Boton, Encabezado, Fila, Panel, Vacio } from './base';
import { Cargado, useCarga, useTitulo } from './comun';
import { ElegirCartilla } from './ElegirCartilla';
import { base } from '../materiales/datos';
import './biblioteca.css';

type Idioma = 'es' | 'en';
interface Escena { n: number; imagen?: string | null; es: { titulo: string; parrafos: string[] }; en?: { titulo: string; parrafos: string[] }; palabras: string[] }
interface Historia { titulo: string; en_titulo: string; intro: string; escenas: Escena[]; personajes: { nombre: string; funcion: string }[] }
interface BloqueDoc { t: 'titulo' | 'parrafo' | 'item'; n?: number; texto: string }
interface Documentos { documentos: { id: string; titulo: string; bloques: BloqueDoc[] }[] }
interface Actividad { nombre: string; nivel: string; nivel_nombre: string; tema: string; estilo: string; recurso: string; adaptacion: string; dba: string; estandar: string; fases: { enactiva?: string; iconica?: string; simbolica?: string } }
interface Recurso { id: string; tema: string; nivel: string | null; nota?: string; imagen?: string | null; descargables: string[]; videos: string[]; juego_en_linea?: string | null }
interface Recursos { niveles: Record<string, { titulo: string; territorio: string; importancia?: string; pensum?: string; evidencia?: string }>; recursos: Recurso[] }

const cache = new Map<string, Promise<unknown>>();
function pedir<T>(archivo: string): Promise<T> {
  const url = `${base()}biblioteca/${archivo}`;
  let p = cache.get(url);
  if (!p) {
    p = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    });
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return p as Promise<T>;
}

const VOLVER = { ruta: '/docente/biblioteca', etiqueta: 'Biblioteca' };

/** Rutas /docente/biblioteca[/…]. */
export function Biblioteca({ resto }: { resto: string[] }) {
  const [parte, id] = resto;
  if (parte === 'historia') return <PaginaHistoria />;
  if (parte === 'recursos') return <PaginaRecursos destacar={id} />;
  if (parte === 'actividades') return <PaginaActividades />;
  if (parte === 'doc' && id) return <PaginaDocumento id={id} />;
  return <Inicio />;
}

// Iconos de los documentos de fundamentos que se conocen; los demás llevan el de documento.
const ICONO_DOC: Record<string, 'cartillas' | 'estrella'> = { niveles: 'cartillas', 'mission-stars': 'estrella' };

function Inicio() {
  useTitulo('Biblioteca');
  // Títulos y cantidades salen del paquete de la cartilla elegida, no de aquí.
  const carga = useCarga(
    () => Promise.all([pedir<Historia>('historia.json'), pedir<{ actividades: Actividad[] }>('actividades.json'), pedir<Documentos>('documentos.json')]),
    base(),
  );
  return (
    <>
      <Encabezado titulo="Biblioteca" meta="Historia, recursos, actividades y fundamentos de la cartilla" />
      <ElegirCartilla />
      <Cargado carga={carga}>
        {([historia, actividades, docs]) => (
          <>
            <Panel filas>
              <Fila ruta="/docente/biblioteca/historia" icono="documento" titulo={`La historia: ${historia.titulo}`} detalle={`${historia.escenas.length} escenas${historia.escenas.some((e) => e.en) ? ' en español e inglés' : ''}. Para leer, proyectar o imprimir.`} />
              <Fila ruta="/docente/biblioteca/recursos" icono="descargar" titulo="Recursos por tema" detalle="Fichas descargables, videos y juegos en línea por nivel." />
              <Fila ruta="/docente/biblioteca/actividades" icono="lista" titulo="Banco de actividades" detalle={`${actividades.actividades.length} actividades con sus fases enactiva, icónica y simbólica.`} />
            </Panel>
            <Panel titulo="Fundamentos" filas>
              {docs.documentos.map((d) => (
                <Fila key={d.id} ruta={`/docente/biblioteca/doc/${d.id}`} icono={ICONO_DOC[d.id] ?? 'documento'} titulo={d.titulo} />
              ))}
            </Panel>
          </>
        )}
      </Cargado>
      <Panel titulo="Guía rápida para docentes">
        <p>Cómo activar la cuenta, crear el grupo, imprimir tarjetas y usar los materiales, en dos páginas.</p>
        <div className="atajos">
          <a className="boton boton--secundario" href="/guias/guia-docentes.pdf" target="_blank" rel="noopener">Abrir la guía (PDF)</a>
        </div>
      </Panel>
    </>
  );
}

// ---------------------------------------------------------------- La historia

function PaginaHistoria() {
  useTitulo('La historia');
  const carga = useCarga(() => pedir<Historia>('historia.json'), 'bib-historia');
  const [idioma, setIdioma] = useState<Idioma>('es');
  const [telon, setTelon] = useState<number | null>(null);
  return (
    <Cargado carga={carga}>
      {(h) =>
        telon !== null ? (
          <Telon h={h} idioma={idioma} n={telon} ir={setTelon} />
        ) : (
          <div className="bib-historia">
            <Encabezado titulo={idioma === 'es' ? h.titulo : h.en_titulo} volver={VOLVER} />
            <p className="sec no-imprimir bib-intro">{h.intro}</p>
            <div className="atajos no-imprimir">
              <div className="bib-idioma" role="group" aria-label="Idioma de la historia">
                <button type="button" className="boton boton--secundario" aria-pressed={idioma === 'es'} onClick={() => setIdioma('es')}>Español</button>
                <button type="button" className="boton boton--secundario" aria-pressed={idioma === 'en'} onClick={() => setIdioma('en')}>English</button>
              </div>
              <Boton icono="proyectar" onClick={() => setTelon(0)}>Proyectar</Boton>
              <Boton icono="imprimir" onClick={() => window.print()}>Imprimir</Boton>
            </div>
            {h.escenas.map((e) => (
              <article key={e.n} className="bib-escena">
                <Arte e={e} />
                <div>
                  <p className="meta">Escena {e.n}</p>
                  <h2>{(e[idioma] ?? e.es).titulo}</h2>
                  {(e[idioma] ?? e.es).parrafos.map((p, i) => (
                    <p key={i}>{conPalabras(p, e.palabras)}</p>
                  ))}
                </div>
              </article>
            ))}
            {h.personajes.length > 0 && (
              <Panel titulo="Personajes como mediadores pedagógicos">
                <ul className="bib-personajes">
                  {h.personajes.map((p) => (
                    <li key={p.nombre}>
                      <img src={`${base()}personajes/${p.nombre.toLowerCase()}-wave.webp`} alt="" onError={(ev) => (ev.currentTarget.style.visibility = 'hidden')} />
                      <span><strong>{p.nombre}.</strong> {p.funcion}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
          </div>
        )
      }
    </Cargado>
  );
}

function Arte({ e }: { e: Escena }) {
  const src = e.imagen ? base() + e.imagen : null;
  return src ? <img className={e.imagen ? 'bib-escena__img' : 'bib-escena__img bib-escena__img--personaje'} src={src} alt="" loading="lazy" /> : <span />;
}

/** Resalta las palabras mágicas de la escena dentro del párrafo. */
function conPalabras(texto: string, palabras: string[]): ReactNode {
  const lista = palabras.filter((p) => p.length > 1).sort((a, b) => b.length - a.length);
  if (!lista.length) return texto;
  const re = new RegExp(`(${lista.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  return texto.split(re).map((trozo, i) => (lista.includes(trozo) ? <mark key={i} className="bib-magica">{trozo}</mark> : trozo));
}

/** La historia en grande para el telón: una escena por pantalla, sin datos de nadie. */
function Telon({ h, idioma, n, ir }: { h: Historia; idioma: Idioma; n: number; ir: (n: number | null) => void }) {
  const e = h.escenas[n];
  useEffect(() => {
    const tecla = (ev: KeyboardEvent) => {
      if (ev.key === 'ArrowRight' && n < h.escenas.length - 1) ir(n + 1);
      else if (ev.key === 'ArrowLeft' && n > 0) ir(n - 1);
      else if (ev.key === 'Escape') ir(null);
    };
    window.addEventListener('keydown', tecla);
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => window.removeEventListener('keydown', tecla);
  }, [n, h.escenas.length, ir]);
  const salir = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    ir(null);
  };
  return (
    <div className="bib-telon">
      <div className="bib-telon__escena">
        <Arte e={e} />
        <div>
          <h2>{(e[idioma] ?? e.es).titulo}</h2>
          {(e[idioma] ?? e.es).parrafos.map((p, i) => (
            <p key={i}>{conPalabras(p, e.palabras)}</p>
          ))}
        </div>
      </div>
      <div className="bib-telon__ctl">
        <Boton icono="anterior" onClick={() => ir(n - 1)} disabled={n === 0}>Anterior</Boton>
        <span className="meta">{n + 1} de {h.escenas.length}</span>
        <Boton variante="primario" icono="siguiente" onClick={() => ir(n + 1)} disabled={n === h.escenas.length - 1}>Siguiente</Boton>
        <Boton icono="cerrar" onClick={salir}>Terminar</Boton>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Recursos por tema

// Acepta youtube.com/watch?v=, youtu.be/, /shorts/ y /embed/.
const idVideo = (url: string) => /[?&]v=([\w-]{6,})/.exec(url)?.[1] ?? /(?:youtu\.be\/|\/shorts\/|\/embed\/)([\w-]{6,})/.exec(url)?.[1];
/**
 * Video de YouTube dentro de la página, en un cuadrito 16:9. Al principio es solo la miniatura
 * (liviana); el reproductor se carga al tocarla, desde youtube-nocookie.com (sin cookies hasta
 * que se reproduce). Se reproduce en YouTube, así que suma vistas al canal. Para cambiar un
 * video basta con cambiar su enlace en `biblioteca/recursos.json`.
 */
function VideoYoutube({ url, id }: { url: string; id: string }) {
  const [abierto, setAbierto] = useState(false);
  if (abierto) {
    return (
      <div className="bib-video">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`}
          title="Video de YouTube"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }
  return (
    <div className="bib-video">
      <button type="button" className="bib-video__portada" onClick={() => setAbierto(true)} aria-label="Ver el video aquí">
        <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" />
        <span className="bib-video__play" aria-hidden="true">▶</span>
      </button>
      <a className="bib-video__fuera" href={url} target="_blank" rel="noopener">Abrir en YouTube</a>
    </div>
  );
}

const nombreArchivo = (url: string) => decodeURIComponent(url.split('/').pop() ?? url).replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ');

function PaginaRecursos({ destacar }: { destacar?: string }) {
  useTitulo('Recursos por tema');
  const carga = useCarga(() => pedir<Recursos>('recursos.json'), 'bib-recursos');
  useEffect(() => {
    if (destacar) setTimeout(() => document.getElementById(`tema-${destacar}`)?.scrollIntoView({ block: 'start' }), 200);
  }, [destacar]);
  return (
    <>
      <Encabezado titulo="Recursos por tema" volver={VOLVER} />
      <p className="sec">Recursos seleccionados: fichas descargables (British Council), videos de YouTube que se ven aquí mismo y juegos en línea. Revíselos antes de proyectarlos.</p>
      <Cargado carga={carga}>
        {(d) =>
          Object.entries(d.niveles).map(([clave, nivel]) => {
            const temas = d.recursos.filter((r) => r.nivel === clave);
            if (!temas.length) return null;
            return (
              <section key={clave} className="bib-nivel">
                <h2>{nivel.titulo}</h2>
                <p className="meta">{nivel.territorio}</p>
                <div className="bib-temas">
                  {temas.map((r) => (
                    <article key={r.id} id={`tema-${r.id}`} className={`bib-tema${destacar === r.id ? ' bib-tema--destacado' : ''}`}>
                      <div className="bib-tema__cabeza">
                        {r.imagen && <img src={base() + r.imagen} alt="" loading="lazy" />}
                        <div>
                          <h3>{r.tema}</h3>
                          {r.nota && <p className="sec">{r.nota}</p>}
                        </div>
                      </div>
                      {r.videos.length > 0 && (
                        <ul className="bib-videos">
                          {r.videos.map((v) => {
                            const vid = idVideo(v);
                            return (
                              <li key={v}>
                                {vid ? (
                                  <VideoYoutube url={v} id={vid} />
                                ) : (
                                  <a href={v} target="_blank" rel="noopener">Ver el video</a>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      <ul className="bib-enlaces">
                        {r.descargables.map((f) => (
                          <li key={f}><a href={f} target="_blank" rel="noopener">Ficha: {nombreArchivo(f)}</a></li>
                        ))}
                        {r.juego_en_linea && <li><a href={r.juego_en_linea} target="_blank" rel="noopener">Juego en línea (Kahoot)</a></li>}
                      </ul>
                    </article>
                  ))}
                </div>
              </section>
            );
          })
        }
      </Cargado>
    </>
  );
}

// ---------------------------------------------------------------- Banco de actividades

/** Solo las etiquetas de formato simples del contenido original; nada más pasa. */
function saneado(html: string): string {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const permitidas = new Set(['OL', 'UL', 'LI', 'STRONG', 'EM', 'B', 'I', 'P', 'BR']);
  const limpiar = (n: Element) => {
    for (const hijo of [...n.children]) {
      limpiar(hijo);
      if (!permitidas.has(hijo.tagName)) hijo.replaceWith(...hijo.childNodes);
      else for (const a of [...hijo.attributes]) hijo.removeAttribute(a.name);
    }
  };
  const raiz = doc.body.firstElementChild!;
  limpiar(raiz);
  return raiz.innerHTML;
}

function PaginaActividades() {
  useTitulo('Banco de actividades');
  const carga = useCarga(() => pedir<{ actividades: Actividad[] }>('actividades.json'), 'bib-actividades');
  const [nivel, setNivel] = useState('');
  const [tema, setTema] = useState('');
  return (
    <>
      <Encabezado titulo="Banco de actividades" volver={VOLVER} />
      <Cargado carga={carga}>
        {(d) => <Actividades lista={d.actividades} nivel={nivel} setNivel={setNivel} tema={tema} setTema={setTema} />}
      </Cargado>
    </>
  );
}

function Actividades({ lista, nivel, setNivel, tema, setTema }: { lista: Actividad[]; nivel: string; setNivel: (v: string) => void; tema: string; setTema: (v: string) => void }) {
  const niveles = useMemo(() => [...new Map(lista.map((a) => [a.nivel, a.nivel_nombre])).entries()], [lista]);
  const temas = useMemo(() => [...new Set(lista.filter((a) => !nivel || a.nivel === nivel).map((a) => a.tema))], [lista, nivel]);
  const vista = lista.filter((a) => (!nivel || a.nivel === nivel) && (!tema || a.tema === tema));
  return (
    <>
      <div className="bib-filtros no-imprimir">
        <label className="campo">
          <span className="campo__etiqueta">Nivel</span>
          <select className="campo__control" value={nivel} onChange={(e) => (setNivel(e.target.value), setTema(''))}>
            <option value="">Todos</option>
            {niveles.map(([k, n]) => <option key={k} value={k}>{n}</option>)}
          </select>
        </label>
        <label className="campo">
          <span className="campo__etiqueta">Tema</span>
          <select className="campo__control" value={tema} onChange={(e) => setTema(e.target.value)}>
            <option value="">Todos</option>
            {temas.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <Boton icono="imprimir" onClick={() => window.print()}>Imprimir</Boton>
      </div>
      {vista.length === 0 && <Vacio texto="No hay actividades con ese filtro." />}
      {vista.map((a) => (
        <article key={`${a.nivel}-${a.nombre}`} className="bib-actividad">
          <p className="meta">{a.nivel_nombre} · {a.tema} · {a.estilo}</p>
          <h2>{a.nombre}</h2>
          <dl className="bib-ficha">
            <dt>Recurso</dt><dd>{a.recurso}</dd>
            <dt>DBA</dt><dd>{a.dba}</dd>
            <dt>Estándar</dt><dd>{a.estandar}</dd>
            {a.adaptacion && (<><dt>Adaptación sugerida</dt><dd>{a.adaptacion}</dd></>)}
          </dl>
          <div className="bib-fases">
            {(['enactiva', 'iconica', 'simbolica'] as const).map((f) =>
              a.fases[f] ? (
                <section key={f}>
                  <h3>Fase {f === 'iconica' ? 'icónica' : f === 'simbolica' ? 'simbólica' : 'enactiva'}</h3>
                  <div dangerouslySetInnerHTML={{ __html: saneado(a.fases[f]!) }} />
                </section>
              ) : null,
            )}
          </div>
        </article>
      ))}
    </>
  );
}

// ---------------------------------------------------------------- Documentos

function PaginaDocumento({ id }: { id: string }) {
  const carga = useCarga(() => pedir<Documentos>('documentos.json'), 'bib-documentos');
  return (
    <Cargado carga={carga}>
      {(d) => {
        const doc = d.documentos.find((x) => x.id === id);
        if (!doc) return <Vacio titulo="No se encontró este documento" texto="Vuelva a la biblioteca." />;
        return <Documento titulo={doc.titulo} bloques={doc.bloques} />;
      }}
    </Cargado>
  );
}

function Documento({ titulo, bloques }: { titulo: string; bloques: BloqueDoc[] }) {
  useTitulo(titulo);
  // Los ítems seguidos van en una sola lista.
  const grupos: (BloqueDoc | BloqueDoc[])[] = [];
  for (const b of bloques) {
    const ultimo = grupos[grupos.length - 1];
    if (b.t === 'item') Array.isArray(ultimo) ? ultimo.push(b) : grupos.push([b]);
    else grupos.push(b);
  }
  return (
    <div className="bib-doc">
      <Encabezado titulo={titulo} volver={VOLVER} />
      <div className="atajos no-imprimir"><Boton icono="imprimir" onClick={() => window.print()}>Imprimir</Boton></div>
      {grupos.map((g, i) =>
        Array.isArray(g) ? (
          <ul key={i}>{g.map((b, j) => <li key={j}>{b.texto}</li>)}</ul>
        ) : g.t === 'titulo' ? (
          (g.n ?? 2) <= 2 ? <h2 key={i}>{g.texto}</h2> : <h3 key={i}>{g.texto}</h3>
        ) : (
          <p key={i}>{g.texto}</p>
        ),
      )}
    </div>
  );
}
