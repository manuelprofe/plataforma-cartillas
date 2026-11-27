// Goma acompaña al docente: la frase o el tip del día en Inicio y "Pregúntale a Goma", una guía de
// preguntas en árbol (cada respuesta ofrece las siguientes) con buscador y sugerencias según la
// pantalla. El contenido vive en public/goma/guia.json, aparte del código: se amplía sin programar
// y más adelante puede alimentar un asistente con IA.
import { useEffect, useMemo, useRef, useState } from 'react';
import './goma.css';
import { dibujo } from '../../marca';
import { navegar, useRuta } from '../../navegacion';
import { hoyCo } from '../docente';

interface Nodo {
  pregunta: string;
  respuesta: string[];
  siguientes: string[];
  palabras: string[];
  pantallas?: string[];
  ir?: { ruta: string; etiqueta: string };
}
interface Guia {
  frases: { tipo: 'frase' | 'tip'; texto: string }[];
  temas: { id: string; nombre: string; inicio: string[] }[];
  nodos: Record<string, Nodo>;
}

let guia: Promise<Guia> | null = null;
const cargarGuia = () =>
  (guia ??= fetch(`${import.meta.env.BASE_URL}goma/guia.json`)
    .then((r) => (r.ok ? (r.json() as Promise<Guia>) : Promise.reject(new Error(`HTTP ${r.status}`))))
    .catch((e) => {
      guia = null;
      throw e;
    }));

function useGuia(): Guia | null {
  const [g, setG] = useState<Guia | null>(null);
  useEffect(() => {
    let vivo = true;
    cargarGuia().then((x) => vivo && setG(x), () => undefined);
    return () => {
      vivo = false;
    };
  }, []);
  return g;
}

const sinTildes = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Preguntas que coinciden con lo escrito, de la más a la menos parecida. */
export function buscar(g: Guia, texto: string): string[] {
  // Raíz sencilla: "tímidos" encuentra "tímido" y "planeaciones" encuentra "planeación".
  const palabras = sinTildes(texto)
    .split(/[^a-z0-9ñ]+/)
    .filter((p) => p.length > 2)
    .map((p) => (p.length > 5 ? p.replace(/(es|s)$/, '') : p));
  if (!palabras.length) return [];
  return Object.entries(g.nodos)
    .map(([id, n]) => {
      const claves = sinTildes(n.palabras.join(' '));
      const pregunta = sinTildes(n.pregunta);
      const respuesta = sinTildes(n.respuesta.join(' '));
      const puntos = palabras.reduce((a, p) => a + (claves.includes(p) ? 3 : 0) + (pregunta.includes(p) ? 2 : 0) + (respuesta.includes(p) ? 1 : 0), 0);
      return { id, puntos };
    })
    .filter((x) => x.puntos > 0)
    .sort((a, b) => b.puntos - a.puntos)
    .slice(0, 6)
    .map((x) => x.id);
}

// ---------------------------------------------------------------- Frase del día

export function FraseDelDia() {
  const g = useGuia();
  if (!g?.frases.length) return null;
  const dia = Math.floor(Date.parse(`${hoyCo()}T00:00:00Z`) / 86_400_000);
  const f = g.frases[dia % g.frases.length];
  return (
    <aside className="frase-goma" aria-label={f.tipo === 'tip' ? 'Tip de hoy' : 'Frase de hoy'}>
      <img src={dibujo('goma-saludar')} alt="" width="40" height="51" />
      <p>
        <span className="frase-goma__tipo">{f.tipo === 'tip' ? 'Tip de hoy' : 'Frase de hoy'}</span>
        {f.texto}
      </p>
    </aside>
  );
}

// ---------------------------------------------------------------- Pregúntale a Goma

export function GomaGuia() {
  const [abierta, setAbierta] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={boton} type="button" className="goma-boton no-imprimir" aria-expanded={abierta} aria-controls="goma-guia" onClick={() => setAbierta(!abierta)}>
        <img src={dibujo('goma-senalar')} alt="" width="34" height="43" />
        <span>Pregúntale a Goma</span>
      </button>
      {abierta && <Ventana cerrar={() => { setAbierta(false); boton.current?.focus(); }} />}
    </>
  );
}

function Ventana({ cerrar }: { cerrar: () => void }) {
  const g = useGuia();
  const ruta = useRuta();
  const [pila, setPila] = useState<string[]>([]);
  const [tema, setTema] = useState<string>();
  const [texto, setTexto] = useState('');
  const caja = useRef<HTMLDivElement>(null);
  useEffect(() => {
    caja.current?.focus();
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && cerrar();
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, [cerrar]);
  useEffect(() => {
    const cuerpo = caja.current?.querySelector('.goma-guia__cuerpo');
    if (cuerpo) cuerpo.scrollTop = 0;
  }, [pila, tema]);

  const actual = pila[pila.length - 1] as string | undefined;
  const resultados = useMemo(() => (g && texto ? buscar(g, texto) : []), [g, texto]);
  const deAqui = useMemo(() => {
    if (!g) return [];
    // La pantalla más específica primero ("/docente/grupos" antes que "/docente").
    const largo = (n: Nodo) => Math.max(0, ...(n.pantallas ?? []).filter((p) => ruta === p || ruta.startsWith(`${p}/`)).map((p) => p.length));
    return Object.entries(g.nodos)
      .map(([id, n]) => ({ id, l: largo(n) }))
      .filter((x) => x.l > 0)
      .sort((a, b) => b.l - a.l)
      .slice(0, 3)
      .map((x) => x.id);
  }, [g, ruta]);
  const abrir = (id: string) => {
    setPila((p) => [...p, id]);
    setTexto('');
  };
  const Lista = ({ ids }: { ids: string[] }) => (
    <ul className="goma-preguntas">
      {ids.map((id) => (
        <li key={id}>
          <button type="button" onClick={() => abrir(id)}>{g!.nodos[id].pregunta}</button>
        </li>
      ))}
    </ul>
  );

  const nodo = actual && g ? g.nodos[actual] : undefined;
  const temaActual = g?.temas.find((t) => t.id === tema);
  return (
    <div className="goma-guia" id="goma-guia" role="dialog" aria-modal="false" aria-label="Pregúntale a Goma" tabIndex={-1} ref={caja}>
      <div className="goma-guia__cabeza">
        <img src={dibujo('goma-saludar')} alt="" width="36" height="46" />
        <div>
          <p className="goma-guia__titulo">Pregúntale a Goma</p>
          <p className="meta">Dudas de la plataforma y consejos para la clase</p>
        </div>
        <button type="button" className="boton boton--texto goma-guia__cerrar" onClick={cerrar} aria-label="Cerrar">
          ✕
        </button>
      </div>
      <div className="goma-guia__buscar">
        <input type="search" value={texto} placeholder="Escriba su duda: imprimir, tímidos, nota…" aria-label="Buscar una pregunta" onChange={(e) => setTexto(e.target.value)} />
      </div>
      <div className="goma-guia__cuerpo">
        {!g ? (
          <p className="meta">Cargando…</p>
        ) : texto ? (
          resultados.length ? (
            <Lista ids={resultados} />
          ) : (
            <p className="meta">No encontré esa pregunta. Pruebe con otra palabra o elija un tema.</p>
          )
        ) : nodo ? (
          <article className="goma-respuesta">
            <button type="button" className="boton boton--texto goma-volver" onClick={() => setPila((p) => p.slice(0, -1))}>
              ← Volver
            </button>
            <h3>{nodo.pregunta}</h3>
            {nodo.respuesta.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {nodo.ir && (
              <button type="button" className="boton boton--primario" onClick={() => { navegar(nodo.ir!.ruta); cerrar(); }}>
                {nodo.ir.etiqueta}
              </button>
            )}
            {nodo.siguientes.length > 0 && (
              <>
                <p className="goma-guia__sub">También le puede servir</p>
                <Lista ids={nodo.siguientes} />
              </>
            )}
          </article>
        ) : temaActual ? (
          <>
            <button type="button" className="boton boton--texto goma-volver" onClick={() => setTema(undefined)}>
              ← Temas
            </button>
            <p className="goma-guia__sub">{temaActual.nombre}</p>
            <Lista ids={temaActual.inicio} />
          </>
        ) : (
          <>
            {deAqui.length > 0 && (
              <>
                <p className="goma-guia__sub">Para esta pantalla</p>
                <Lista ids={deAqui} />
              </>
            )}
            <p className="goma-guia__sub">Temas</p>
            <div className="goma-temas">
              {g.temas.map((t) => (
                <button key={t.id} type="button" onClick={() => setTema(t.id)}>
                  {t.nombre}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
