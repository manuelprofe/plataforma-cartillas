// Pantalla del armador: el docente elige duración, cuántas actividades, el tema y las actividades;
// el armador sugiere sin obligar. Al armar, la planeación queda en "Mis planeaciones" (aparato y cuenta)
// y se abre en el formato único, lista para imprimir o bajar en Word.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Boton, Encabezado, Fila, Panel, Vacio } from '../adultos/base';
import { Cargado, textoAccion, useCarga, useTitulo } from '../adultos/comun';
import { entregarPlan, miEntrega, NOMBRE_ESTADO, retirarEntrega } from '../adultos/entregas';
import { DocenteDelPlan } from '../materiales/Planeador';
import { cargarIndice, cargarTema, cartillaMateriales, elegirCartillaMateriales, type EntradaTema, type TemaDoc } from '../materiales/datos';
import { DURACIONES, elegirDuracion, type Duracion } from '../materiales/duracion';
import { MaterialPantalla } from '../materiales/Material';
import { navegar } from '../navegacion';
import { cargarCatalogo, cargarPensum, elegirPensum, nombreCartilla, nombreUnidad, porPeriodo, referentesDe, usePensumElegido, type Pensum, type Unidad } from '../pensum/datos';
import { ElegirPensum } from '../pensum/ElegirPensum';
import { ACTIVIDADES, armarMaterial, borrarPlan, guardarPlan, sugeridas, SUGERIDAS, useMisPlanes, type DelPensum, type Plan } from './armar';
import './armador.css';

export const RUTA_ARMAR = '/docente/planear/armar';
const VOLVER = { ruta: '/docente/planear', etiqueta: 'Planear' };

const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });

export function MisPlaneaciones({ vacio }: { vacio?: boolean }) {
  const planes = useMisPlanes();
  if (!planes.length && !vacio) return null;
  return (
    <Panel titulo="Mis planeaciones" filas>
      {planes.length ? (
        planes.map((p) => (
          <Fila
            key={p.id}
            ruta={`${RUTA_ARMAR}/${p.id}`}
            icono="planear"
            titulo={`${p.nombreTema} · ${p.duracion} min`}
            detalle={`${p.actividades.map((id) => ACTIVIDADES.find((a) => a.id === id)?.nombre ?? id).join(', ')} · ${fecha(p.creada)}`}
          />
        ))
      ) : (
        <Vacio titulo="Aún no ha armado planeaciones" texto="Las que arme quedan aquí y en su cuenta, para verlas también en otro aparato." />
      )}
    </Panel>
  );
}

function Opciones<T extends string | number>({ etiqueta, valores, valor, elegir, texto }: { etiqueta: string; valores: readonly T[]; valor: T | null; elegir: (v: T) => void; texto: (v: T) => string }) {
  return (
    <div className="armar-opciones" role="group" aria-label={etiqueta}>
      {valores.map((v) => (
        <button key={v} type="button" className="boton boton--secundario" aria-pressed={valor === v} onClick={() => elegir(v)}>
          {texto(v)}
        </button>
      ))}
    </div>
  );
}

/** Lo que el armador necesita de la cartilla elegida: su pensum y, si es la de los materiales, sus temas con láminas. */
async function cargarArmador(id: string) {
  const [catalogo, pensum] = await Promise.all([cargarCatalogo(), cargarPensum(id)]);
  const listos = id === cartillaMateriales() ? await cargarIndice().then((i) => i.temas.filter((t) => t.estado === 'listo')).catch(() => [] as EntradaTema[]) : [];
  return { catalogo, pensum, listos };
}

/** Tema que se eligió desde su ficha (Planear → tema → Armar la clase): el armador llega con él puesto. */
let temaPendiente: string | null = null;
export function armarConTema(cartilla: string, unidad: string) {
  elegirPensum(cartilla);
  temaPendiente = `p:${unidad}`;
  navegar(RUTA_ARMAR);
}

export function Armador() {
  useTitulo('Armar mi planeación');
  const cartilla = usePensumElegido(cartillaMateriales());
  const carga = useCarga(() => cargarArmador(cartilla), `armador-${cartilla}`);
  const [duracion, setDuracion] = useState<Duracion>(55);
  const [cuantas, setCuantas] = useState(SUGERIDAS[55]);
  const [tema, setTema] = useState<string | null>(() => {
    const t = temaPendiente;
    temaPendiente = null;
    return t;
  });
  const [elegidas, setElegidas] = useState<string[]>([]);
  const [error, setError] = useState('');
  // Cualquier cambio borra el aviso anterior; cambiar de cartilla borra el tema.
  useEffect(() => setError(''), [duracion, cuantas, tema, elegidas, cartilla]);
  const cartillaPrevia = useRef(cartilla);
  useEffect(() => {
    if (cartillaPrevia.current === cartilla) return;
    cartillaPrevia.current = cartilla;
    setTema(null);
  }, [cartilla]);
  const grado = carga.datos?.pensum.grado ?? 0;
  const disponibles = ACTIVIDADES.filter((a) => (a.desdeGrado ?? 0) <= grado);
  const sugerencia = sugeridas(cuantas, grado);

  const cambiarDuracion = (d: Duracion) => {
    setDuracion(d);
    setCuantas(SUGERIDAS[d]);
    setElegidas((e) => e.slice(0, SUGERIDAS[d]));
  };
  const cambiarCuantas = (n: number) => {
    setCuantas(n);
    setElegidas((e) => e.slice(0, n));
  };
  const alternar = (id: string) => setElegidas((e) => (e.includes(id) ? e.filter((x) => x !== id) : e.length < cuantas ? [...e, id] : e));

  return (
    <>
      <Encabezado titulo="Armar mi planeación" meta="Elija la duración, la materia y el grado, el tema y las actividades" volver={VOLVER} />
      <div className="armar">
        <Panel titulo="1. Duración de la clase">
          <Opciones etiqueta="Duración de la clase" valores={DURACIONES} valor={duracion} elegir={cambiarDuracion} texto={(d) => `${d} min`} />
        </Panel>
        <Panel titulo="2. ¿Cuántas actividades?">
          <p className="sec">Además de la apertura y el cierre, que van siempre. Para {duracion} min sugerimos {SUGERIDAS[duracion]}.</p>
          <Opciones etiqueta="Cuántas actividades" valores={[1, 2, 3, 4] as const} valor={cuantas} elegir={cambiarCuantas} texto={(n) => String(n)} />
        </Panel>
        <Cargado carga={carga}>
          {({ catalogo, pensum, listos }) => {
            const unidad = (id: string) => pensum.unidades.find((u) => `p:${u.id}` === id);
            const armar = () => {
              const lista = tema?.startsWith('m:') ? listos.find((t) => `m:${t.id}` === tema) : undefined;
              const u = tema ? unidad(tema) : undefined;
              if (!lista && !u) return setError('Elija el tema de la clase.');
              if (elegidas.length !== cuantas) return setError(`Elija ${cuantas} ${cuantas === 1 ? 'actividad' : 'actividades'}.`);
              const plan = lista
                ? guardarPlan({ cartilla, tema: lista.id, nombreTema: lista.nombre, duracion, actividades: elegidas })
                : guardarPlan({ cartilla, tema: u!.id, nombreTema: `${u!.titulo} (${nombreCartilla(pensum)})`, duracion, actividades: elegidas, fuente: 'pensum' });
              elegirDuracion(duracion);
              navegar(`${RUTA_ARMAR}/${plan.id}`);
            };
            return (
              <>
                <Panel titulo="3. Materia y grado">
                  <ElegirPensum catalogo={catalogo} valor={cartilla} elegir={elegirPensum} />
                </Panel>
                <Panel titulo="4. Tema">
                  <p className="sec">Los DBA, los estándares y los desempeños del tema pasan solos a la planeación.</p>
                  {listos.length > 0 && (
                    <>
                      <p className="armar-periodo">Con láminas y juegos listos</p>
                      <div className="armar-temas" role="group" aria-label="Temas con láminas">
                        {listos.map((t) => (
                          <button key={t.id} type="button" className="boton boton--secundario" aria-pressed={tema === `m:${t.id}`} onClick={() => setTema(`m:${t.id}`)}>
                            {t.nombre}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {porPeriodo(pensum).map((p) => (
                    <div key={p.numero}>
                      <p className="armar-periodo">
                        Periodo {p.numero}
                        {p.titulo ? ` · ${p.titulo}` : ''}
                      </p>
                      <div className="armar-temas" role="group" aria-label={`Temas del periodo ${p.numero}`}>
                        {p.unidades.map((u) => (
                          <button key={u.id} type="button" className="boton boton--secundario" aria-pressed={tema === `p:${u.id}`} onClick={() => setTema(`p:${u.id}`)}>
                            {u.eje ? u.titulo : nombreUnidad(u)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </Panel>
                <Panel titulo={`5. Actividades (${elegidas.length} de ${cuantas})`} fin={<Boton variante="texto" onClick={() => setElegidas(sugerencia)}>Usar las sugeridas</Boton>}>
                  <ul className="armar-actividades">
                    {disponibles.map((a) => {
                      const puesta = elegidas.includes(a.id);
                      return (
                        <li key={a.id}>
                          <button type="button" className="armar-actividad" aria-pressed={puesta} disabled={!puesta && elegidas.length >= cuantas} onClick={() => alternar(a.id)}>
                            <span className="armar-actividad__nombre">
                              {a.nombre}
                              {sugerencia.includes(a.id) && <span className="etiqueta">Sugerida</span>}
                            </span>
                            <span className="armar-actividad__para">{a.paraQue}</span>
                            <span className="armar-actividad__min">{a.minutos[String(duracion) as '45' | '55' | '90']} min</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </Panel>
                <p className={`mensaje${error ? ' mensaje--error' : ''}`} role="status">
                  {error}
                </p>
                <Boton variante="primario" ancho icono="planear" onClick={armar}>
                  Armar planeación
                </Boton>
              </>
            );
          }}
        </Cargado>
        <MisPlaneaciones />
      </div>
    </>
  );
}

/** Una unidad del pensum como tema de la planeación: sin palabras ni láminas, con sus referentes. */
function temaDeUnidad(p: Pensum, u: Unidad): { entrada: { id: string; nombre: string }; tema: TemaDoc; delPensum: DelPensum } {
  const tema: TemaDoc = { id: `${p.cartilla}-${u.id}`, nombre: u.titulo, titulo: u.titulo, territorio: '', palabras: [], juegos: [], materiales: [] };
  const palabras = u.temas.slice(0, 2).join('; ');
  return { entrada: { id: tema.id, nombre: u.titulo }, tema, delPensum: { palabras, referentes: referentesDe(p, u) } };
}

/** Lo que hace falta para pintar una planeación: su tema (con láminas o del pensum). */
async function cargarFormato(plan: Plan) {
  if (plan.fuente === 'pensum') {
    const p = await cargarPensum(plan.cartilla);
    const u = p.unidades.find((x) => x.id === plan.tema);
    return u ? temaDeUnidad(p, u) : null;
  }
  // Los temas con láminas se leen de la cartilla de la planeación (el coordinador puede no tenerla elegida).
  elegirCartillaMateriales(plan.cartilla);
  const indice = await cargarIndice();
  const entrada = indice.temas.find((t) => t.id === plan.tema);
  return entrada ? { entrada, tema: await cargarTema(entrada) } : null;
}

/** Una planeación guardada, en el formato único. */
export function PlaneacionArmada({ id }: { id: string }) {
  const planes = useMisPlanes();
  const plan = planes.find((p) => p.id === id);
  useTitulo('Mi planeación');
  if (!plan)
    return (
      <Panel>
        <Vacio titulo="No encontramos esa planeación" texto="Puede que la haya borrado. Si la armó en otro aparato, aparece aquí cuando ese aparato tenga señal.">
          <Boton ruta={RUTA_ARMAR}>Armar una nueva</Boton>
        </Vacio>
      </Panel>
    );
  return (
    <PlanEnFormato plan={plan} volver={{ ruta: RUTA_ARMAR, etiqueta: 'Armar' }}>
      <EntregarPlan plan={plan} />
      <div className="mat-acciones no-imprimir armar-borrar">
        <Boton
          variante="texto"
          onClick={() => {
            borrarPlan(plan.id);
            void retirarEntrega(plan.id).catch(() => {});
            navegar(RUTA_ARMAR, true);
          }}
        >
          Borrar esta planeación
        </Boton>
      </div>
    </PlanEnFormato>
  );
}

/** Pinta una planeación en el formato del colegio; `children` va debajo (entregar, revisar). */
export function PlanEnFormato({ plan, volver, docente, antes, children }: { plan: Plan; volver: { ruta: string; etiqueta: string }; docente?: string; antes?: ReactNode; children?: ReactNode }) {
  const carga = useCarga(() => cargarFormato(plan), `formato-${plan.id}-${plan.tema}-${plan.cartilla}`);
  return (
    <Cargado carga={carga}>
      {(d) =>
        d ? (
          <DocenteDelPlan.Provider value={docente}>
            {antes}
            <MaterialPantalla material={armarMaterial(plan, d.tema, 'delPensum' in d ? d.delPensum : undefined)} nombreTema={d.entrada.nombre} volver={volver} rutaProyectar={`/proyectar/${d.entrada.id}`} rutaMaterial={(m) => `/docente/temas/${encodeURIComponent(d.entrada.id)}/${encodeURIComponent(m)}`} />
            {children}
          </DocenteDelPlan.Provider>
        ) : (
          <Vacio titulo="Ese tema ya no está en la cartilla" texto="Arme una planeación nueva." />
        )
      }
    </Cargado>
  );
}

/** Entregar la planeación al coordinador y ver cómo va la revisión. */
function EntregarPlan({ plan }: { plan: Plan }) {
  const [vuelta, setVuelta] = useState(0);
  const carga = useCarga(() => miEntrega(plan.id).catch(() => undefined), `entrega-${plan.id}-${vuelta}`);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string }>();
  const entregar = async () => {
    setOcupado(true);
    setAviso(undefined);
    try {
      await entregarPlan(plan);
      setAviso({ ok: true, texto: 'Entregada. Su coordinador ya la puede ver.' });
      setVuelta((v) => v + 1);
    } catch (e) {
      setAviso({ ok: false, texto: textoAccion(e) });
    } finally {
      setOcupado(false);
    }
  };
  const e = carga.datos;
  // undefined: no se pudo leer (sin red o sin la migración); null: todavía no la ha entregado.
  if (carga.datos === undefined && !carga.error && carga.cargando) return null;
  return (
    <section className={`entrega no-imprimir${e ? ` entrega--${e.estado}` : ''}`} aria-label="Entrega al coordinador">
      <div className="entrega__texto">
        <h2 className="h3">{e ? NOMBRE_ESTADO[e.estado] : 'Entregar al coordinador'}</h2>
        <p className="sec">
          {e
            ? e.estado === 'por-revisar'
              ? `La entregó el ${fecha(e.entregada)}. Su coordinador la verá en su panel.`
              : `${e.estado === 'revisada' ? 'Revisada' : 'Su coordinador pidió ajustes'} el ${fecha(e.revisada ?? e.entregada)}.`
            : 'Su coordinador la recibe en su panel, en el formato del colegio. No hace falta imprimirla ni enviarla por correo.'}
        </p>
        {e?.comentario && <blockquote className="entrega__comentario">{e.comentario}</blockquote>}
        <p className={`mensaje${aviso ? (aviso.ok ? ' mensaje--ok' : ' mensaje--error') : ''}`} role="status">
          {aviso?.texto}
        </p>
      </div>
      <Boton variante={e ? 'secundario' : 'primario'} icono="subir" disabled={ocupado} onClick={() => void entregar()}>
        {e ? 'Volver a entregar' : 'Entregar'}
      </Boton>
    </section>
  );
}
