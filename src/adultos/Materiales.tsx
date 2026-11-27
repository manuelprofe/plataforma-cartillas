// Docente: Planear y Materiales del tema (esqueleto §2.2). Todo sale del paquete de la cartilla
// (src/materiales); no hay datos de niños, así que estas pantallas no llevan cortina.
// El plan por grupo (fechas de la clase 1 y 2 y su estado) vive en FechasPlan.tsx.
import { Boton, Encabezado, Fila, Hueco, Panel, Vacio } from './base';
import { Cargado, useCarga, useTitulo } from './comun';
import { ElegirCartilla } from './ElegirCartilla';
import { cargarIndice, cargarMaterial, cargarTema, cartillaMateriales, RANURAS, type EntradaTema, type Indice, type Material } from '../materiales/datos';
import { useDuracion } from '../materiales/duracion';
import { armarConTema, MisPlaneaciones, RUTA_ARMAR } from '../armador/Armador';
import { cargarCatalogo, cargarPensum, elegirPensum, nombreCartilla, nombreUnidad, porPeriodo, usePensumElegido } from '../pensum/datos';
import { ElegirPensum } from '../pensum/ElegirPensum';
import { UnidadVista } from '../pensum/PaginaPensum';
import { FechasDelTema, PlanDeGrupos } from './FechasPlan';
import { CuerpoMaterial, MaterialHueco, MaterialPantalla } from '../materiales/Material';

const rutaTema = (t: string, id = '') => `/docente/temas/${encodeURIComponent(t)}${id ? `/${encodeURIComponent(id)}` : ''}`;
const rutaPlan = (t: string) => `/docente/planear/${encodeURIComponent(t)}`;

/** "Clase 1: mirar y jugar" desde el título del planeador (el texto viene del .md). */
const nombreClase = (m: Material) => m.titulo;

// ---------------------------------------------------------------- Planear (lista de temas)

export function Planear() {
  useTitulo('Planear');
  const duracion = useDuracion();
  // Solo algunas cartillas traen láminas y planeadores listos: sin ellos, Planear sigue con el pensum.
  const carga = useCarga(() => cargarIndice().catch(() => null), 'indice-planear');
  return (
    <>
      <Encabezado titulo="Planear" meta="Todos los temas del año, de transición a 5.°" />
      <ElegirCartilla />
      <Panel titulo="Mi planeación">
        <p className="sec">Elija la duración, cuántas actividades, el tema y las actividades; sale en el formato del colegio, para imprimir o bajar en Word.</p>
        <div className="acciones">
          <Boton variante="primario" icono="planear" ruta={RUTA_ARMAR}>
            Armar mi planeación
          </Boton>
          <Boton icono="calendario" ruta="/docente/calendario">
            Mi mes
          </Boton>
        </div>
      </Panel>
      <MisPlaneaciones />
      <Cargado carga={carga}>
        {(indice) =>
          indice && (
            <>
              <PlanDeGrupos indice={indice} />
              <Panel titulo="Temas con láminas de la cartilla" filas>
                {indice.temas.map((t) => (
                  <Fila key={t.id} ruta={t.estado === 'listo' ? rutaPlan(t.id) : rutaTema(t.id)} icono="planear" tenue={t.estado === 'pendiente'} titulo={t.nombre} detalle={t.estado === 'listo' ? `${t.titulo} · 2 clases de ${duracion} minutos · ${t.materiales.length} materiales` : 'Láminas en camino'} />
                ))}
              </Panel>
            </>
          )
        }
      </Cargado>
      <TemasDelAno />
    </>
  );
}

/** Todos los temas del pensum, por materia, grado y periodo. Cada uno abre su ficha. */
function TemasDelAno() {
  const cartilla = usePensumElegido(cartillaMateriales());
  const carga = useCarga(() => Promise.all([cargarCatalogo(), cargarPensum(cartilla)]), `temas-${cartilla}`);
  return (
    <Cargado carga={carga}>
      {([catalogo, p]) => (
        <>
          <Panel titulo="Temas del año">
            <p className="sec">Matemáticas, español e inglés de transición a 5.°, con sus DBA y desempeños. Toque un tema para verlo y armar su clase.</p>
            <ElegirPensum catalogo={catalogo} valor={cartilla} elegir={elegirPensum} />
          </Panel>
          {porPeriodo(p).map((per) => (
            <Panel key={per.numero} titulo={`${nombreCartilla(p)} · Periodo ${per.numero}${per.titulo ? ` · ${per.titulo}` : ''}`} filas>
              {per.unidades.map((u) => (
                <Fila key={u.id} ruta={rutaTemaPensum(p.cartilla, u.id)} icono="documento" titulo={u.eje ? u.titulo : nombreUnidad(u)} detalle={resumen(u.temas)} />
              ))}
            </Panel>
          ))}
        </>
      )}
    </Cargado>
  );
}

const rutaTemaPensum = (cartilla: string, unidad: string) => `/docente/planear/tema/${encodeURIComponent(cartilla)}/${encodeURIComponent(unidad)}`;
const resumen = (temas: string[]) => {
  const t = temas.join('; ');
  return t.length > 110 ? `${t.slice(0, 107).trimEnd()}…` : t;
};

/** Ficha de un tema del pensum: qué se ve, DBA y desempeños, y el atajo para armar su clase. */
export function TemaPensum({ cartilla, unidad }: { cartilla: string; unidad: string }) {
  const carga = useCarga(() => cargarPensum(cartilla), `pensum-${cartilla}`);
  const u = carga.datos?.unidades.find((x) => x.id === unidad);
  useTitulo(u ? u.titulo : 'Tema');
  return (
    <Cargado carga={carga}>
      {(p) => {
        const un = p.unidades.find((x) => x.id === unidad);
        if (!un) return <NoHay volver="/docente/planear" etiqueta="Planear" />;
        const dba = (id: string) => p.dba.find((d) => d.id === id)?.texto;
        return (
          <div className="pensum">
            <Encabezado titulo={un.titulo} meta={`${nombreCartilla(p)} · Periodo ${un.periodo['4']}`} volver={{ ruta: '/docente/planear', etiqueta: 'Planear' }} />
            <div className="mat-acciones">
              <Boton variante="primario" icono="planear" onClick={() => armarConTema(p.cartilla, un.id)}>
                Armar la clase de este tema
              </Boton>
              <Boton icono="juegos" ruta={`/docente/juegos?materia=${encodeURIComponent(p.materia)}&grado=${p.grado}`}>
                Juegos de {p.materia.toLowerCase()} {p.gradoNombre}
              </Boton>
            </div>
            <article className="pensum__doc">
              <UnidadVista u={un} dba={dba} />
            </article>
          </div>
        );
      }}
    </Cargado>
  );
}

// ---------------------------------------------------------------- Plan de un tema

export function PlanTema({ tema }: { tema: string }) {
  const carga = useCarga(async () => {
    const indice = await cargarIndice();
    const entrada = indice.temas.find((t) => t.id === tema);
    return { indice, entrada, doc: entrada?.estado === 'listo' ? await cargarTema(entrada) : undefined };
  }, tema);
  useTitulo(`Plan de ${carga.datos?.entrada?.nombre ?? 'un tema'}`);
  return (
    <Cargado carga={carga}>
      {({ indice, entrada, doc }) => {
        if (!entrada) return <NoHay volver="/docente/planear" etiqueta="Planear" />;
        const planeadores = doc?.materiales.filter((m) => m.tipo === 'planeador') ?? [];
        return (
          <>
            <Encabezado titulo={`Plan de ${entrada.nombre}`} meta={planeadores.length ? planeadores.map(nombreClase).join('. ') : entrada.titulo} volver={{ ruta: '/docente/planear', etiqueta: 'Planear' }} />
            {doc ? (
              <>
                <div className="mat-acciones">
                  <Boton variante="primario" icono="proyectar" ruta={`/proyectar/${entrada.id}`}>
                    Proyectar {entrada.nombre.toLowerCase()}
                  </Boton>
                  <Boton icono="documento" ruta={rutaTema(entrada.id)}>
                    Materiales del tema
                  </Boton>
                </div>
                <FechasDelTema tema={entrada.id} nombre={entrada.nombre} />
                {planeadores.map((m) => (
                  <section key={m.id} className="plan-clase">
                    <h2 className="h3">{m.titulo}</h2>
                    <CuerpoMaterial material={m} nombreTema={entrada.nombre} otros={entrada.materiales} temaId={entrada.id} rutaMaterial={(id) => rutaTema(entrada.id, id)} />
                    <div className="mat-acciones">
                      <Boton icono="imprimir" ruta={rutaTema(entrada.id, m.id)}>
                        Abrir para imprimir
                      </Boton>
                    </div>
                  </section>
                ))}
              </>
            ) : (
              <Hueco titulo={`Aquí irá el plan de ${entrada.nombre.toLowerCase()}`} texto="Llega con la próxima versión de la cartilla. Traerá:" trae={indice.tipos.planeador?.trae} />
            )}
          </>
        );
      }}
    </Cargado>
  );
}

// ---------------------------------------------------------------- Materiales de un tema

export function TemaMateriales({ tema }: { tema: string }) {
  const carga = useCarga(cargarIndice, 'indice');
  const entrada = carga.datos?.temas.find((t) => t.id === tema);
  useTitulo(entrada ? `Materiales de ${entrada.nombre}` : 'Materiales del tema');
  return (
    <Cargado carga={carga}>
      {(indice) => {
        const e = indice.temas.find((t) => t.id === tema);
        if (!e) return <NoHay volver="/docente/planear" etiqueta="Planear" />;
        return (
          <>
            <Encabezado titulo={e.nombre} meta={`${e.titulo} · ${e.territorio}`} volver={{ ruta: '/docente/planear', etiqueta: 'Planear' }} />
            {e.estado === 'listo' ? (
              <div className="mat-acciones">
                <Boton variante="primario" icono="proyectar" ruta={`/proyectar/${e.id}`}>
                  Proyectar {e.nombre.toLowerCase()}
                </Boton>
                <Boton icono="planear" ruta={rutaPlan(e.id)}>
                  Ver el plan
                </Boton>
              </div>
            ) : (
              <Vacio texto={`Los materiales de ${e.nombre.toLowerCase()} llegan con la próxima versión de la cartilla.`} />
            )}
            <Panel filas>{RANURAS.map((r) => fila(e, r, indice))}</Panel>
          </>
        );
      }}
    </Cargado>
  );
}

function fila(e: EntradaTema, r: (typeof RANURAS)[number], _indice: Indice) {
  const id = `${e.id}-${r.ranura}`;
  const listo = e.materiales.find((m) => m.id === id);
  return listo ? (
    <Fila key={id} ruta={rutaTema(e.id, id)} icono="documento" titulo={listo.titulo} detalle={listo.subtitulo} />
  ) : (
    <Fila key={id} ruta={rutaTema(e.id, id)} icono="documento" tenue titulo={r.nombre} detalle="Aquí irá" />
  );
}

// ---------------------------------------------------------------- Un material

export function MaterialPagina({ tema, id }: { tema: string; id: string }) {
  const carga = useCarga(() => cargarMaterial(tema, id), `${tema}/${id}`);
  useTitulo(carga.datos?.material?.titulo ?? carga.datos?.ranura?.nombre ?? 'Material');
  return (
    <Cargado carga={carga}>
      {({ indice, entrada, tema: doc, material, ranura }) => {
        if (!entrada) return <NoHay volver="/docente/planear" etiqueta="Planear" />;
        const volver = { ruta: rutaTema(entrada.id), etiqueta: entrada.nombre };
        if (material)
          return <MaterialPantalla material={material} nombreTema={entrada.nombre} volver={volver} rutaProyectar={`/proyectar/${entrada.id}/${material.id}`} rutaMaterial={(m) => rutaTema(entrada.id, m)} />;
        if (!ranura) return <NoHay volver={volver.ruta} etiqueta={volver.etiqueta} />;
        const mientras = (doc?.materiales ?? []).map((m) => ({ ruta: rutaTema(entrada.id, m.id), titulo: m.titulo }));
        return <MaterialHueco nombre={ranura.nombre} aqui={ranura.aqui} tipo={indice.tipos[ranura.tipo]} tema={`${entrada.nombre} · ${entrada.titulo}`} volver={volver} mientras={mientras} />;
      }}
    </Cargado>
  );
}

function NoHay({ volver, etiqueta }: { volver: string; etiqueta: string }) {
  return (
    <Panel>
      <Vacio titulo="No encontramos ese material" texto="Puede que el enlace sea viejo.">
        <Boton ruta={volver}>Volver a {etiqueta}</Boton>
      </Vacio>
    </Panel>
  );
}
