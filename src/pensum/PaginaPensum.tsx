// Pensum del año en la Biblioteca: por materia y grado, los periodos con sus unidades, temas, DBA
// con su texto, desempeños, juegos y material para imprimir. Se lee, se imprime y lleva al armador.
import { Boton, Encabezado, Panel } from '../adultos/base';
import { Cargado, useCarga, useTitulo } from '../adultos/comun';
import { cartillaMateriales } from '../materiales/datos';
import { cargarCatalogo, cargarPensum, elegirPensum, nombreCartilla, nombreUnidad, porPeriodo, usePensumElegido, type Pensum, type Unidad } from './datos';
import { ElegirPensum } from './ElegirPensum';
import './pensum.css';

const VOLVER = { ruta: '/docente/biblioteca', etiqueta: 'Biblioteca' };

export function PaginaPensum() {
  useTitulo('Pensum del año');
  const cartilla = usePensumElegido(cartillaMateriales());
  const carga = useCarga(() => Promise.all([cargarCatalogo(), cargarPensum(cartilla)]), `pensum-${cartilla}`);
  return (
    <div className="pensum">
      <Encabezado titulo="Pensum del año" meta="Lo que se ve en cada periodo, con sus DBA y desempeños" volver={VOLVER} />
      <Cargado carga={carga}>
        {([catalogo, p]) => (
          <>
            <div className="no-imprimir pensum__elegir">
              <Panel titulo="Materia y grado">
                <ElegirPensum catalogo={catalogo} valor={cartilla} elegir={elegirPensum} />
              </Panel>
            </div>
            <Documento p={p} />
          </>
        )}
      </Cargado>
    </div>
  );
}

function Documento({ p }: { p: Pensum }) {
  const dba = (id: string) => p.dba.find((d) => d.id === id)?.texto;
  return (
    <article className="pensum__doc">
      <header className="pensum__cabeza">
        <h2>{nombreCartilla(p)}</h2>
        {p.proposito && <p>{p.proposito}</p>}
        <p className="meta">
          {p.unidades.length} {p.unidades[0]?.eje ? 'periodos' : 'unidades'} en 4 periodos · {p.fuente}
        </p>
        <div className="atajos no-imprimir">
          <Boton icono="planear" ruta="/docente/planear/armar">Armar una planeación</Boton>
          <Boton icono="imprimir" onClick={() => window.print()}>Imprimir</Boton>
        </div>
      </header>
      {porPeriodo(p).map((per) => (
        <section key={per.numero} className="pensum__periodo">
          <h3>
            Periodo {per.numero}
            {per.titulo ? ` · ${per.titulo}` : ''}
          </h3>
          {per.unidades.map((u) => (
            <UnidadVista key={u.id} u={u} dba={dba} />
          ))}
        </section>
      ))}
      <section className="pensum__periodo">
        <h3>DBA del grado</h3>
        <ol className="pensum__dba">
          {p.dba.map((d) => (
            <li key={d.id}>
              <strong>DBA {d.id}.</strong> {d.texto}
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}

export function UnidadVista({ u, dba }: { u: Unidad; dba: (id: string) => string | undefined }) {
  return (
    <div className="pensum__unidad">
      <h4>{u.eje ? u.titulo : nombreUnidad(u)}</h4>
      {u.eje && <p className="meta">Eje: {u.eje}</p>}
      <dl>
        {u.meta && (<><dt>Meta</dt><dd>{u.meta}</dd></>)}
        {u.funciones?.length ? (<><dt>Qué hace con la lengua</dt><dd>{u.funciones.join('; ')}.</dd></>) : null}
        {u.temas.length > 0 && (<><dt>{u.eje ? 'Vocabulario' : 'Temas'}</dt><dd>{u.temas.join('; ')}</dd></>)}
        {u.gramatica && (<><dt>Frases en uso</dt><dd>{u.gramatica}</dd></>)}
        <dt>DBA</dt>
        <dd>
          <ul>
            {u.dba.map((id) => (
              <li key={id}>
                <strong>DBA {id}.</strong> {dba(id) ?? ''}
              </li>
            ))}
          </ul>
        </dd>
        {u.pensamientos?.length ? (<><dt>Pensamiento</dt><dd>{u.pensamientos.join(', ')}</dd></>) : null}
        {u.factores?.length ? (<><dt>Estándares</dt><dd>{u.factores.map((f) => f.nombre).join(', ')}</dd></>) : null}
        <dt>Desempeños</dt>
        <dd>
          <ul>
            {u.desempenos.map((d, i) => (
              <li key={i}>{d.replace(/\.$/, '')}.</li>
            ))}
          </ul>
        </dd>
        {u.juegos && (<><dt>Juegos</dt><dd>{u.juegos}</dd></>)}
        {u.analogo && (<><dt>Para imprimir y en el aula</dt><dd>{u.analogo}</dd></>)}
        {u.nota && (<><dt>Nota</dt><dd>{u.nota}</dd></>)}
      </dl>
    </div>
  );
}
