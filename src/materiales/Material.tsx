// Plantilla única de material (esqueleto §4): un documento de bloques que se ve en pantalla (celular
// del docente) y se imprime (carta o media carta, @media print en material.css). El telón de
// proyectar lee el mismo documento (src/proyectar). El contenido nunca vive aquí: todo sale del
// documento. Lo que falta se muestra como hueco "Aquí irá…".
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import './material.css';
import { Boton, Encabezado, Enlace, Hueco, Panel, Fila } from '../adultos/base';
import { Icono } from '../adultos/Icono';
import { base, TIPO_NOMBRE, type Bloque, type Impresion, type ItemImagen, type Material, type Palabra, type TipoCatalogo } from './datos';
import { sonar } from './sonido';
import { CancionPantalla, LetraImpresa } from './Cancion';

// ---------------------------------------------------------------- Piezas de imagen

/** Texto con **negritas** (el único formato inline de los .md). */
export function Texto({ t }: { t: string }) {
  return (
    <>
      {t.split(/\*\*/).map((parte, i) => (i % 2 ? <strong key={i}>{parte}</strong> : <Fragment key={i}>{parte}</Fragment>))}
    </>
  );
}

const ESTRELLA = (() => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? 4.5 : 10;
    pts.push(`${(10 + r * Math.cos(a)).toFixed(1)},${(10.5 + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
})();

/** N estrellas en filas de cinco: la cantidad que acompaña al numeral. */
export function Estrellas({ n }: { n: number }) {
  const filas = Math.ceil(n / 5);
  const ancho = Math.min(n, 5) * 24;
  return (
    <svg className="mat-estrellas" viewBox={`0 0 ${ancho} ${filas * 24}`} role="img" aria-label={`${n} estrellas`}>
      {Array.from({ length: n }, (_, i) => (
        <polygon key={i} points={ESTRELLA} transform={`translate(${(i % 5) * 24} ${Math.floor(i / 5) * 24})`} fill="#ffd23f" stroke="#4a2a14" strokeWidth="1.4" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

function Img({ src, alt = '', tam }: { src: string; alt?: string; tam: number }) {
  return <img src={base() + src} alt={alt} width={tam} height={tam} decoding="async" draggable={false} />;
}

/** Lo que se ve de una palabra: su imagen, el objeto o la mano, y las estrellas si es un número. */
export function Visual({ p, tam }: { p: { imagen?: string; apoyo?: string; cantidad?: number; alt?: string }; tam: number }) {
  return (
    <span className="mat-visual">
      {p.imagen && <Img src={p.imagen} tam={tam} alt={p.alt ?? ''} />}
      {p.cantidad ? <Estrellas n={p.cantidad} /> : null}
      {p.apoyo && <Img src={p.apoyo} tam={tam} />}
    </span>
  );
}

/** Marca de cada fila de la prueba (sol, luna…): la hoja del niño no lleva número ni texto. */
function MarcaFila({ nombre }: { nombre: string }) {
  const n = nombre.toLowerCase();
  const trazo = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  let dibujo: ReactNode;
  if (n === 'sol')
    dibujo = (
      <>
        <circle cx="16" cy="16" r="6" {...trazo} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <path key={a} d="M16 4v4" transform={`rotate(${a} 16 16)`} {...trazo} />
        ))}
      </>
    );
  else if (n === 'luna') dibujo = <path d="M24 20A10 10 0 1 1 12 6a8 8 0 0 0 12 14z" {...trazo} />;
  else if (n === 'árbol')
    dibujo = (
      <>
        <circle cx="16" cy="12" r="8" {...trazo} />
        <path d="M16 20v9M12 29h8" {...trazo} />
      </>
    );
  else if (n === 'estrella') dibujo = <polygon points="16,3 19.5,12 29,12.6 21.6,18.6 24,28 16,22.8 8,28 10.4,18.6 3,12.6 12.5,12" {...trazo} />;
  else if (n === 'nube') dibujo = <path d="M9 24a6 6 0 0 1-.6-11.9A8 8 0 0 1 23.6 11 6.5 6.5 0 0 1 23 24z" {...trazo} />;
  else if (n === 'flor')
    dibujo = (
      <>
        <circle cx="16" cy="13" r="3" {...trazo} />
        {[0, 72, 144, 216, 288].map((a) => (
          <circle key={a} cx="16" cy="6.5" r="3.5" transform={`rotate(${a} 16 13)`} {...trazo} />
        ))}
        <path d="M16 21v9" {...trazo} />
      </>
    );
  else dibujo = <text x="16" y="22" textAnchor="middle" fontSize="16">{nombre.slice(0, 1)}</text>;
  return (
    <svg className="mat-marca" viewBox="0 0 32 32" role="img" aria-label={nombre}>
      {dibujo}
    </svg>
  );
}

// ---------------------------------------------------------------- Bloques

interface Ctx {
  modo: 'pantalla' | 'impresion';
  material: Material;
  /** Tipos de bloque (o `docente`, `objetivo`) que esta vista oculta. */
  oculta: Set<string>;
  rutaMaterial?: (id: string) => string;
  abrirMomentos?: boolean;
}

function SonidoBoton({ audio, veces = 1, etiqueta }: { audio?: string; veces?: number; etiqueta: string }) {
  if (!audio) return null;
  return (
    <button type="button" className="mat-oir" onClick={() => sonar(audio, { veces })} aria-label={etiqueta}>
      <Icono nombre="sonido" />
    </button>
  );
}

function TarjetaPalabra({ b, ctx }: { b: Palabra; ctx: Ctx }) {
  const lamina = ctx.material.tipo === 'laminas';
  const dentro = (
    <>
      <Visual p={b} tam={lamina ? 120 : 64} />
      <span className="mat-palabra__en">{b.palabra}</span>
      <span className="mat-palabra__suena">{b.suena}</span>
      {!lamina && <span className="mat-palabra__es">{b.es}</span>}
    </>
  );
  const clase = `mat-palabra${lamina ? ' mat-palabra--lamina' : ''}`;
  if (ctx.modo === 'impresion') return <div className={clase}>{dentro}</div>;
  return (
    <button type="button" className={clase} onClick={() => sonar(b.audio)} aria-label={`Oír ${b.palabra}`}>
      {dentro}
      <span className="mat-palabra__oir" aria-hidden="true">
        <Icono nombre="sonido" />
      </span>
    </button>
  );
}

function CeldaImagen({ it, etiquetas, tam }: { it: ItemImagen; etiquetas: boolean; tam: number }) {
  return (
    <li className="mat-celda">
      <Visual p={it} tam={tam} />
      {etiquetas && it.palabra && <span>{it.palabra}</span>}
    </li>
  );
}

function ItemPrueba({ b, ctx }: { b: Extract<Bloque, { tipo: 'item-prueba' }>; ctx: Ctx }) {
  const verObjetivo = !ctx.oculta.has('objetivo');
  const imp = ctx.modo === 'impresion';
  return (
    <div className="mat-item">
      <div className="mat-item__cab">
        <MarcaFila nombre={b.fila} />
        {verObjetivo && (
          <span className="objetivo">
            <span className="meta">Suena dos veces</span>
            <strong>{b.objetivo}</strong>
          </span>
        )}
        {!imp && <SonidoBoton audio={b.audio} veces={2} etiqueta={`Oír ${b.objetivo} dos veces`} />}
      </div>
      <ol className="mat-item__opciones">
        {b.opciones.map((o, i) => (
          <li key={i} className={imp && verObjetivo && i + 1 === b.respuesta ? 'correcta' : ''}>
            <Visual p={o} tam={56} />
            {imp && verObjetivo && i + 1 === b.respuesta && <span className="correcta__marca">Respuesta</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Momento({ b, ctx }: { b: Extract<Bloque, { tipo: 'momento' }>; ctx: Ctx }) {
  const m = /^\*\*(.+?)\*\*\s*(.*)$/.exec(b.momento);
  const titulo = m ? m[1].replace(/\.$/, '') : b.momento;
  const cuerpo = m ? m[2] : '';
  const enlaces = b.enlaces?.map((e) =>
    ctx.rutaMaterial ? (
      <Enlace key={e.id} ruta={ctx.rutaMaterial(e.id)} className="mat-chip">
        {e.texto}
      </Enlace>
    ) : (
      <span key={e.id} className="mat-chip">
        {e.texto}
      </span>
    ),
  );
  const hay = cuerpo || b.material || b.observar || b.sinProyector;
  return (
    <li className="mat-momento">
      <details open={ctx.abrirMomentos} className="mat-momento__det">
        <summary>
          <span className="mat-momento__min">{b.minutos} min</span>
          <span className="mat-momento__tit">{titulo}</span>
          {b.ritmo && <span className="meta mat-momento__ritmo">{b.ritmo}</span>}
        </summary>
        {hay ? (
          <dl>
            {cuerpo && (
              <div>
                <dt className="sr">Qué se hace</dt>
                <dd>
                  <Texto t={cuerpo} />
                </dd>
              </div>
            )}
            {b.material && (
              <div>
                <dt>Material</dt>
                <dd>
                  {b.material}
                  {enlaces && <span className="mat-chips">{enlaces}</span>}
                </dd>
              </div>
            )}
            {b.observar && (
              <div>
                <dt>Qué observar</dt>
                <dd>{b.observar}</dd>
              </div>
            )}
            {b.sinProyector && (
              <div>
                <dt>Sin proyector</dt>
                <dd>{b.sinProyector}</dd>
              </div>
            )}
          </dl>
        ) : null}
      </details>
    </li>
  );
}

function MomentoImpreso({ b }: { b: Extract<Bloque, { tipo: 'momento' }> }) {
  const m = /^\*\*(.+?)\*\*\s*(.*)$/.exec(b.momento);
  return (
    <tr>
      <td className="num">{b.minutos}</td>
      <td>
        {m ? (
          <>
            <strong>{m[1]}</strong> {m[2] && <Texto t={m[2]} />}
          </>
        ) : (
          b.momento
        )}
      </td>
      <td>{b.material}</td>
      <td>{b.observar}</td>
      <td>{b.sinProyector}</td>
    </tr>
  );
}

function BloqueUno({ b, ctx }: { b: Bloque; ctx: Ctx }) {
  switch (b.tipo) {
    case 'titulo':
      return <h2 className="mat-titulo h3">{b.texto}</h2>;
    case 'parrafo':
      return (
        <p className="mat-parrafo">
          <Texto t={b.texto} />
        </p>
      );
    case 'lista':
      return (
        <ul className="mat-lista">
          {b.items.map((x, i) => (
            <li key={i}>
              <Texto t={x} />
            </li>
          ))}
        </ul>
      );
    case 'tabla':
      return (
        <div className="mat-tabla">
          <table>
            <thead>
              <tr>
                {b.columnas.map((c) => (
                  <th key={c} scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.filas.map((f, i) => (
                <tr key={i}>
                  {f.map((c, j) => (
                    <td key={j} data-etiqueta={b.columnas[j]}>
                      <Texto t={c} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'consigna':
      return (
        <div className="mat-consigna">
          {b.iconos.length > 0 && (
            <span className="mat-consigna__iconos">
              {b.iconos.map((i) => (
                <Img key={i} src={i} tam={40} />
              ))}
            </span>
          )}
          <p>{b.texto}</p>
          {ctx.modo === 'pantalla' && <SonidoBoton audio={b.audio} etiqueta="Oír la consigna" />}
        </div>
      );
    case 'item-prueba':
      return <ItemPrueba b={b} ctx={ctx} />;
    case 'imagenes':
      return (
        <div className={`mat-imagenes${b.recortable ? ' mat-imagenes--recortable' : ''}`}>
          {b.titulo && <h3 className="mat-imagenes__tit">{b.titulo}</h3>}
          <ul style={{ ['--cols' as string]: b.columnas }}>
            {b.items.map((it, i) => (
              <CeldaImagen key={i} it={it} etiquetas={b.etiquetas} tam={64} />
            ))}
          </ul>
        </div>
      );
    case 'guion':
      return (
        <blockquote className="mat-guion">
          <span className="mat-etiqueta">Lo que dice el docente</span>
          <Texto t={b.texto} />
        </blockquote>
      );
    case 'clave':
      return (
        <div className="mat-clave">
          <span className="mat-etiqueta">Clave</span>
          <p>
            <Texto t={b.texto} />
          </p>
          {ctx.modo === 'pantalla' && <p className="meta">Solo en su pantalla y en la hoja del docente. Nunca se proyecta.</p>}
        </div>
      );
    case 'casillas':
      return (
        <div className="mat-tabla mat-casillas">
          <table>
            <thead>
              <tr>
                <th scope="col">Se marca</th>
                {b.columnas.map((c) => (
                  <th key={c} scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.filas.map((f) => (
                <tr key={f}>
                  <th scope="row">{f}</th>
                  {b.columnas.map((c) => (
                    <td key={c}>
                      <span className="mat-caja" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'nota':
      return ctx.modo === 'impresion' ? (
        <div className="mat-nota">
          <span className="mat-etiqueta">{b.etiqueta}</span>
          <span className="mat-rayas" />
          <span className="mat-rayas" />
        </div>
      ) : (
        <Hueco titulo="Aquí irán sus notas de la clase" texto="Mientras tanto, escríbalas en la hoja impresa: trae renglones al final." />
      );
    case 'hueco':
      if (ctx.modo === 'impresion') return b.imprime ? <div className="mat-hueco-imp">{b.titulo}</div> : null;
      return <Hueco titulo={b.titulo} texto="Llega con la próxima versión de la cartilla. Traerá:" trae={b.trae} />;
    case 'cancion':
      return ctx.modo === 'impresion' ? <LetraImpresa ingles={b.ingles} lineas={b.lineas} /> : <CancionPantalla audio={b.audio} ingles={b.ingles} lineas={b.lineas} />;
    default:
      return null;
  }
}

/** Recorre los bloques agrupando los que van juntos (palabras, momentos, imágenes con título). */
export function Bloques({ bloques, ctx }: { bloques: Bloque[]; ctx: Ctx }) {
  const visibles = bloques.filter((b) => {
    if (ctx.oculta.has(b.tipo)) return false;
    if (b.solo === 'docente' && ctx.oculta.has('docente')) return false;
    return true;
  });
  const salida: ReactNode[] = [];
  for (let i = 0; i < visibles.length; ) {
    const b = visibles[i];
    const mismo = (t: string) => {
      let j = i;
      while (j < visibles.length && visibles[j].tipo === t) j++;
      return visibles.slice(i, j);
    };
    if (b.tipo === 'palabra') {
      const grupo = mismo('palabra') as Palabra[];
      salida.push(
        <div key={i} className="mat-palabras">
          {grupo.map((p) => (
            <TarjetaPalabra key={p.palabra} b={p} ctx={ctx} />
          ))}
        </div>,
      );
      i += grupo.length;
    } else if (b.tipo === 'momento') {
      const grupo = mismo('momento') as Extract<Bloque, { tipo: 'momento' }>[];
      salida.push(
        ctx.modo === 'impresion' ? (
          <div key={i} className="mat-tabla mat-momentos-imp">
            <table>
              <thead>
                <tr>
                  <th>Min</th>
                  <th>Momento</th>
                  <th>Material</th>
                  <th>Qué observar</th>
                  <th>Sin proyector</th>
                </tr>
              </thead>
              <tbody>
                {grupo.map((m, k) => (
                  <MomentoImpreso key={k} b={m} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <ol key={i} className="mat-momentos">
            {grupo.map((m, k) => (
              <Momento key={k} b={m} ctx={ctx} />
            ))}
          </ol>
        ),
      );
      i += grupo.length;
    } else if (b.tipo === 'item-prueba') {
      const grupo = mismo('item-prueba');
      salida.push(
        <div key={i} className="mat-items">
          {grupo.map((it, k) => (
            <BloqueUno key={k} b={it} ctx={ctx} />
          ))}
        </div>,
      );
      i += grupo.length;
    } else if (b.tipo === 'imagenes' && b.titulo) {
      const grupo = mismo('imagenes');
      salida.push(
        <div key={i} className="mat-imagenes-grupo">
          {grupo.map((g, k) => (
            <BloqueUno key={k} b={g} ctx={ctx} />
          ))}
        </div>,
      );
      i += grupo.length;
    } else {
      salida.push(<BloqueUno key={i} b={b} ctx={ctx} />);
      i += 1;
    }
  }
  return <>{salida}</>;
}

/** Bloques de un material en pantalla, sin cabecera (los usa Planear para mostrar los dos planeadores). */
export function CuerpoMaterial({ material, rutaMaterial, abrirMomentos }: { material: Material; rutaMaterial?: (id: string) => string; abrirMomentos?: boolean }) {
  return (
    <div className="mat-cuerpo">
      <Bloques bloques={material.bloques} ctx={{ modo: 'pantalla', material, oculta: new Set(), rutaMaterial, abrirMomentos }} />
    </div>
  );
}

// ---------------------------------------------------------------- Impresión

function Hoja({ material, impresion, nombreTema, copia, bloques }: { material: Material; impresion: Impresion; nombreTema: string; copia: number; bloques: Bloque[] }) {
  const oculta = new Set(impresion.oculta ?? []);
  const nino = oculta.size > 0;
  const ctx: Ctx = { modo: 'impresion', material, oculta, abrirMomentos: true };
  return (
    <section className="mat-hoja" data-copia={copia}>
      <header className="mat-hoja__cab">
        <span>English Adventure Quest · {nombreTema}</span>
        {nino && <span className="mat-hoja__nombre">Nombre:</span>}
      </header>
      {material.tipo !== 'ficha' && material.tipo !== 'laminas' && <h1 className="mat-hoja__titulo">{material.titulo}</h1>}
      {material.avisoColor && <p className="mat-hoja__aviso">{material.avisoColor}</p>}
      <div className="mat-hoja__cuerpo">
        <Bloques bloques={bloques} ctx={ctx} />
      </div>
      <footer className="mat-hoja__pie">
        <span>
          {material.tipo === 'laminas' ? material.titulo : TIPO_NOMBRE[material.tipo]}
          {material.tipo === 'ficha' ? ` · ${material.titulo}` : ''}
        </span>
        {material.tipo === 'prueba' && nino && <span>Sin nota ni puntaje</span>}
      </footer>
    </section>
  );
}

function Impreso({ material, indice, nombreTema }: { material: Material; indice: number; nombreTema: string }) {
  const impresion: Impresion = material.impresiones?.[indice] ?? { nombre: 'Hoja' };
  const formato = impresion.formato ?? material.formatos.imprimir;
  const copias = impresion.copias ?? material.formatos.copias;
  const incluye = impresion.incluye;
  const bloques = material.bloques.filter((b) => !incluye || incluye.includes(b.tipo));
  // Láminas: una por media hoja. El resto: el documento entero, tantas veces como pida la hoja.
  const porPalabra = incluye?.length === 1 && incluye[0] === 'palabra';
  const hojas = porPalabra ? bloques.map((b) => [b]) : Array.from({ length: copias }, () => bloques);
  return (
    <div className={`mat-imp mat-imp--${formato}`} data-formato={formato} data-hoja={indice}>
      {hojas.map((bl, i) => (
        <Hoja key={i} material={material} impresion={impresion} nombreTema={nombreTema} copia={i + 1} bloques={bl} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- Pantalla del material

const FORMATO_ETIQUETA = { carta: 'Carta', 'media-carta': 'Media carta · dos por hoja' } as const;

export function MaterialPantalla({ material, nombreTema, volver, rutaProyectar, rutaMaterial }: { material: Material; nombreTema: string; volver: { ruta: string; etiqueta: string }; rutaProyectar: string; rutaMaterial: (id: string) => string }) {
  const [hoja, setHoja] = useState(0);
  const [eligiendo, setEligiendo] = useState(false);
  const [pedir, setPedir] = useState(0);
  const impresiones = material.impresiones ?? [];
  const proyecta = material.privacidad === 'publico' && material.formatos.proyectar !== 'no';
  const primero = useRef(true);

  // Imprimir es dos pasos: se elige la hoja (se pinta) y, ya pintada, se abre el diálogo del navegador.
  useEffect(() => {
    if (primero.current) {
      primero.current = false;
      return;
    }
    const id = window.requestAnimationFrame(() => window.print());
    return () => window.cancelAnimationFrame(id);
  }, [pedir]);

  const imprimir = (i: number) => {
    setHoja(i);
    setEligiendo(false);
    setPedir((n) => n + 1);
  };

  return (
    <article className="mat">
      <div className="mat-pantalla">
        <Encabezado titulo={material.titulo} meta={material.subtitulo} volver={volver} />
        <div className="mat-marcas">
          <span className="mat-marca-fmt">
            <Icono nombre="imprimir" />
            {FORMATO_ETIQUETA[material.formatos.imprimir]}
          </span>
          <span className="mat-marca-fmt">
            <Icono nombre="proyectar" />
            {material.formatos.proyectar === 'todo' ? 'Se proyecta' : material.formatos.proyectar === 'solo-consignas' ? 'Se proyecta la instrucción' : 'No se proyecta'}
          </span>
        </div>
        <div className="mat-acciones">
          {proyecta && (
            <Boton icono="proyectar" ruta={rutaProyectar} variante={material.tipo === 'laminas' || material.tipo === 'prueba' ? 'primario' : 'secundario'}>
              Proyectar
            </Boton>
          )}
          <Boton icono="imprimir" variante={proyecta && (material.tipo === 'laminas' || material.tipo === 'prueba') ? 'secundario' : 'primario'} onClick={() => (impresiones.length > 1 ? setEligiendo((v) => !v) : imprimir(0))}>
            Imprimir
          </Boton>
        </div>
        {eligiendo && (
          <Panel titulo="¿Qué hoja imprime?">
            <div className="mat-hojas">
              {impresiones.map((h, i) => (
                <Boton key={h.nombre} ancho onClick={() => imprimir(i)}>
                  {h.nombre}
                </Boton>
              ))}
            </div>
          </Panel>
        )}
        {material.avisoColor && <p className="nota">{material.avisoColor}</p>}
        <CuerpoMaterial material={material} rutaMaterial={rutaMaterial} />
      </div>
      <Impreso material={material} indice={hoja} nombreTema={nombreTema} />
    </article>
  );
}

// ---------------------------------------------------------------- Hueco: lo que aún no tiene contenido

export function MaterialHueco({ nombre, aqui, tipo, tema, volver, mientras }: { nombre: string; aqui: string; tipo?: TipoCatalogo; tema: string; volver: { ruta: string; etiqueta: string }; mientras: { ruta: string; titulo: string }[] }) {
  return (
    <article className="mat">
      <div className="mat-pantalla">
        <Encabezado titulo={nombre} meta={tema} volver={volver} />
        <div className="mat-acciones">
          <Boton icono="imprimir" disabled>
            Imprimir
          </Boton>
        </div>
        <Hueco titulo={`Aquí irá ${aqui}`} texto="Llega con la próxima versión de la cartilla. Traerá:" trae={tipo?.trae} />
        {mientras.length > 0 && (
          <>
            <h2 className="h3">Mientras tanto</h2>
            <Panel filas>
              {mientras.map((m) => (
                <Fila key={m.ruta} ruta={m.ruta} icono="documento" titulo={m.titulo} />
              ))}
            </Panel>
          </>
        )}
      </div>
    </article>
  );
}
