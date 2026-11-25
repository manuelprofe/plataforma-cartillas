// Docente: Planear y Materiales del tema (esqueleto §2.2). Todo sale del paquete de la cartilla
// (src/materiales); no hay datos de niños, así que estas pantallas no llevan cortina.
// El plan por grupo (fechas, estado) es de la tanda 6: aquí el planeador sugerido ya se ve y se imprime.
import { Boton, Encabezado, Fila, Hueco, Panel, Vacio } from './base';
import { Cargado, useCarga, useTitulo } from './comun';
import { ElegirCartilla } from './ElegirCartilla';
import { cargarIndice, cargarMaterial, cargarTema, RANURAS, type EntradaTema, type Indice, type Material } from '../materiales/datos';
import { useDuracion } from '../materiales/duracion';
import { CuerpoMaterial, MaterialHueco, MaterialPantalla } from '../materiales/Material';

const rutaTema = (t: string, id = '') => `/docente/temas/${encodeURIComponent(t)}${id ? `/${encodeURIComponent(id)}` : ''}`;
const rutaPlan = (t: string) => `/docente/planear/${encodeURIComponent(t)}`;

/** "Clase 1: mirar y jugar" desde el título del planeador (el texto viene del .md). */
const nombreClase = (m: Material) => m.titulo;

// ---------------------------------------------------------------- Planear (lista de temas)

export function Planear() {
  useTitulo('Planear');
  const duracion = useDuracion();
  const carga = useCarga(cargarIndice, 'indice');
  return (
    <>
      <Encabezado titulo="Planear" meta="Los temas de la cartilla, en orden" />
      <ElegirCartilla />
      <Cargado carga={carga}>
        {(indice) => (
          <>
            <Panel titulo="Plan y planeador de cada tema" filas>
              {indice.temas.map((t) => (
                <Fila key={t.id} ruta={rutaPlan(t.id)} icono="planear" tenue={t.estado === 'pendiente'} titulo={t.nombre} detalle={t.estado === 'listo' ? `${t.titulo} · 2 clases de ${duracion} minutos` : 'Aquí irá'} />
              ))}
            </Panel>
            <Panel titulo="Materiales por tema" filas>
              {indice.temas.map((t) => (
                <Fila key={t.id} ruta={rutaTema(t.id)} icono="documento" tenue={t.estado === 'pendiente'} titulo={t.nombre} detalle={t.estado === 'listo' ? `${t.materiales.length} materiales listos` : 'Aquí irá'} />
              ))}
            </Panel>
            <Hueco titulo="Aquí irá el plan de cada grupo" texto="Elija el tema de cada grupo y las fechas de sus dos clases, y el coordinador verá en qué tema va cada uno." />
          </>
        )}
      </Cargado>
    </>
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
                <Hueco titulo="Aquí irán las fechas de sus clases" texto="Cuando elija el tema de un grupo, la clase 1 y la clase 2 llevarán su fecha y su casilla de avance." />
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
