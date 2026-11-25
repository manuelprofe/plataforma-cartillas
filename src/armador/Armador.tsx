// Pantalla del armador: el docente elige duración, cuántas actividades, el tema y las actividades;
// el armador sugiere sin obligar. Al armar, la planeación queda en "Mis planeaciones" (este aparato)
// y se abre en el formato único, lista para imprimir o bajar en Word.
import { useEffect, useState } from 'react';
import { Boton, Encabezado, Fila, Panel, Vacio } from '../adultos/base';
import { Cargado, useCarga, useTitulo } from '../adultos/comun';
import { cargarIndice, cargarTema, cartillaMateriales } from '../materiales/datos';
import { DURACIONES, elegirDuracion, type Duracion } from '../materiales/duracion';
import { MaterialPantalla } from '../materiales/Material';
import { navegar } from '../navegacion';
import { ACTIVIDADES, armarMaterial, borrarPlan, guardarPlan, sugeridas, SUGERIDAS, useMisPlanes, type Plan } from './armar';
import './armador.css';

export const RUTA_ARMAR = '/docente/planear/armar';
const VOLVER = { ruta: '/docente/planear', etiqueta: 'Planear' };

/** Grado de la cartilla por su identificador (`ingles-3` → 3; preescolar → 0). */
function gradoDe(cartilla: string) {
  const n = /-(\d+)$/.exec(cartilla);
  return n ? Number(n[1]) : 0;
}

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
        <Vacio titulo="Aún no ha armado planeaciones" texto="Las que arme quedan aquí, en este aparato." />
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

export function Armador() {
  useTitulo('Armar mi planeación');
  const carga = useCarga(cargarIndice, 'indice');
  const cartilla = cartillaMateriales();
  const grado = gradoDe(cartilla);
  const [duracion, setDuracion] = useState<Duracion>(55);
  const [cuantas, setCuantas] = useState(SUGERIDAS[55]);
  const [tema, setTema] = useState<string | null>(null);
  const [elegidas, setElegidas] = useState<string[]>([]);
  const [error, setError] = useState('');
  // Cualquier cambio borra el aviso anterior.
  useEffect(() => setError(''), [duracion, cuantas, tema, elegidas]);
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
      <Encabezado titulo="Armar mi planeación" meta="Elija la duración, cuántas actividades, el tema y las actividades" volver={VOLVER} />
      <Cargado carga={carga}>
        {(indice) => {
          const temas = indice.temas.filter((t) => t.estado === 'listo');
          const armar = async () => {
            const entrada = temas.find((t) => t.id === tema);
            if (!entrada) return setError('Elija el tema de la clase.');
            if (elegidas.length !== cuantas) return setError(`Elija ${cuantas} ${cuantas === 1 ? 'actividad' : 'actividades'}.`);
            const plan = guardarPlan({ cartilla, tema: entrada.id, nombreTema: entrada.nombre, duracion, actividades: elegidas });
            elegirDuracion(duracion);
            navegar(`${RUTA_ARMAR}/${plan.id}`);
          };
          return (
            <div className="armar">
              <Panel titulo="1. Duración de la clase">
                <Opciones etiqueta="Duración de la clase" valores={DURACIONES} valor={duracion} elegir={cambiarDuracion} texto={(d) => `${d} min`} />
              </Panel>
              <Panel titulo="2. ¿Cuántas actividades?">
                <p className="sec">Además de la apertura y el cierre, que van siempre. Para {duracion} min sugerimos {SUGERIDAS[duracion]}.</p>
                <Opciones etiqueta="Cuántas actividades" valores={[1, 2, 3, 4] as const} valor={cuantas} elegir={cambiarCuantas} texto={(n) => String(n)} />
              </Panel>
              <Panel titulo="3. Tema">
                <Opciones etiqueta="Tema" valores={temas.map((t) => t.id)} valor={tema} elegir={setTema} texto={(id) => temas.find((t) => t.id === id)?.nombre ?? id} />
              </Panel>
              <Panel titulo={`4. Actividades (${elegidas.length} de ${cuantas})`} fin={<Boton variante="texto" onClick={() => setElegidas(sugerencia)}>Usar las sugeridas</Boton>}>
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
              <Boton variante="primario" ancho icono="planear" onClick={() => void armar()}>
                Armar planeación
              </Boton>
              <MisPlaneaciones />
            </div>
          );
        }}
      </Cargado>
    </>
  );
}

/** Una planeación guardada, en el formato único. */
export function PlaneacionArmada({ id }: { id: string }) {
  const planes = useMisPlanes();
  const plan = planes.find((p) => p.id === id);
  const carga = useCarga(async () => {
    if (!plan) return null;
    const indice = await cargarIndice();
    const entrada = indice.temas.find((t) => t.id === plan.tema);
    return entrada ? { entrada, tema: await cargarTema(entrada) } : null;
  }, `${id}-${plan?.tema}`);
  useTitulo('Mi planeación');
  if (!plan)
    return (
      <Panel>
        <Vacio titulo="No encontramos esa planeación" texto="Las planeaciones quedan en el aparato donde se armaron.">
          <Boton ruta={RUTA_ARMAR}>Armar una nueva</Boton>
        </Vacio>
      </Panel>
    );
  return (
    <Cargado carga={carga}>
      {(d) => (d ? <Armada plan={plan} {...d} /> : <Vacio titulo="Ese tema ya no está en la cartilla" texto="Arme una planeación nueva." />)}
    </Cargado>
  );
}

function Armada({ plan, entrada, tema }: { plan: Plan } & { entrada: { id: string; nombre: string }; tema: Awaited<ReturnType<typeof cargarTema>> }) {
  const material = armarMaterial(plan, tema);
  return (
    <>
      <MaterialPantalla material={material} nombreTema={entrada.nombre} volver={{ ruta: RUTA_ARMAR, etiqueta: 'Armar' }} rutaProyectar={`/proyectar/${entrada.id}`} rutaMaterial={(m) => `/docente/temas/${encodeURIComponent(entrada.id)}/${encodeURIComponent(m)}`} />
      <div className="mat-acciones no-imprimir armar-borrar">
        <Boton
          variante="texto"
          onClick={() => {
            borrarPlan(plan.id);
            navegar(RUTA_ARMAR, true);
          }}
        >
          Borrar esta planeación
        </Boton>
      </div>
    </>
  );
}
