// Plan por grupo en Planear: el plan de cada grupo (temas en orden con fechas y faroles) y, en el
// plan de un tema, las fechas de la clase 1 y la clase 2 para cada grupo. Sin apodos: no lleva cortina.
import { useEffect, useState, type FormEvent } from 'react';
import { Boton, Farol, Fila, Panel, Vacio } from './base';
import { Cargado, textoAccion, useCarga } from './comun';
import { cargarGrupos, cartillaDeGrupo, type GrupoDoc } from './docente';
import { fechaCorta } from './docenteComun';
import { cargarPlan, estadoPorFechas, farolClase, guardarPlan, type PlanTema } from './planGrupo';
import { useCartillaMateriales, type Indice } from '../materiales/datos';

const rutaPlan = (t: string) => `/docente/planear/${encodeURIComponent(t)}`;

/** Los grupos del docente que usan la cartilla que está viendo, cada uno con su plan. */
function usePlanes(cartilla: string) {
  return useCarga(async () => {
    const grupos = (await cargarGrupos()).filter((g) => cartillaDeGrupo(g) === cartilla);
    const planes = await Promise.all(grupos.map((g) => cargarPlan(g.id, cartilla)));
    return grupos.map((g, i) => ({ grupo: g, plan: planes[i] }));
  }, `planes-${cartilla}`);
}

const fechas = (p: PlanTema | undefined) =>
  p?.clase1 || p?.clase2 ? [p.clase1 && `Clase 1: ${fechaCorta(p.clase1)}`, p.clase2 && `Clase 2: ${fechaCorta(p.clase2)}`].filter(Boolean).join(' · ') : 'Sin fechas';

function Faroles({ p }: { p: PlanTema | undefined }) {
  return (
    <span className="faroles">
      <Farol estado={farolClase(p, 1)} de="Clase 1" />
      <Farol estado={farolClase(p, 2)} de="Clase 2" />
    </span>
  );
}

// ---------------------------------------------------------------- Planear: plan de cada grupo

export function PlanDeGrupos({ indice }: { indice: Indice }) {
  const cartilla = useCartillaMateriales();
  const carga = usePlanes(cartilla);
  const temas = indice.temas.filter((t) => t.estado === 'listo');
  return (
    <Cargado carga={carga}>
      {(lista) =>
        lista.length === 0 ? (
          <Panel titulo="Plan de cada grupo">
            <Vacio texto="Cree un grupo y aquí le pone fecha a la clase 1 y a la clase 2 de cada tema." personaje={null}>
              <Boton icono="crear" ruta="/docente/grupos">
                Crear un grupo
              </Boton>
            </Vacio>
          </Panel>
        ) : (
          <>
            {lista.map(({ grupo, plan }) => (
              <Panel key={grupo.id} titulo={`Plan de ${grupo.nombre}`} filas>
                {plan.length === 0 && <p className="sec plan-grupo__nota">Elija el primer tema de {grupo.nombre} y las fechas de sus dos clases.</p>}
                {temas.map((t) => {
                  const p = plan.find((x) => x.tema_id === t.id);
                  return <Fila key={t.id} ruta={rutaPlan(t.id)} icono="planear" titulo={t.nombre} detalle={p?.estado === 'hecho' ? `Hecho · ${fechas(p)}` : fechas(p)} fin={<Faroles p={p} />} />;
                })}
              </Panel>
            ))}
          </>
        )
      }
    </Cargado>
  );
}

// ---------------------------------------------------------------- Plan de un tema: fechas por grupo

export function FechasDelTema({ tema, nombre }: { tema: string; nombre: string }) {
  const cartilla = useCartillaMateriales();
  const carga = usePlanes(cartilla);
  return (
    <Cargado carga={carga}>
      {(lista) =>
        lista.length === 0 ? (
          <Panel titulo="Fechas de las clases">
            <Vacio texto={`Cree un grupo y aquí le pone fecha a las dos clases de ${nombre.toLowerCase()}.`} personaje={null}>
              <Boton icono="crear" ruta="/docente/grupos">
                Crear un grupo
              </Boton>
            </Vacio>
          </Panel>
        ) : (
          <>
            {lista.map(({ grupo, plan }) => (
              <FechasGrupo key={grupo.id} grupo={grupo} cartilla={cartilla} tema={tema} inicial={plan.find((p) => p.tema_id === tema)} />
            ))}
          </>
        )
      }
    </Cargado>
  );
}

function FechasGrupo({ grupo, cartilla, tema, inicial }: { grupo: GrupoDoc; cartilla: string; tema: string; inicial?: PlanTema }) {
  const [fila, setFila] = useState<PlanTema | undefined>(inicial);
  const [c1, setC1] = useState(inicial?.clase1 ?? '');
  const [c2, setC2] = useState(inicial?.clase2 ?? '');
  const [estado, setEstado] = useState<{ ocupado?: boolean; error?: string; aviso?: string }>({});
  useEffect(() => setEstado((e) => (e.aviso ? { ...e, aviso: undefined } : e)), [c1, c2]);
  const id = `fechas-${grupo.id}`;
  const cambio = (c1 || null) !== (fila?.clase1 ?? null) || (c2 || null) !== (fila?.clase2 ?? null);

  async function guardar(extra?: Partial<PlanTema>) {
    const nueva: PlanTema = {
      grupo_id: grupo.id,
      cartilla_id: cartilla,
      tema_id: tema,
      clase1: c1 || null,
      clase2: c2 || null,
      estado: fila?.estado === 'hecho' ? 'hecho' : estadoPorFechas(c1 || null),
      ...extra,
    };
    setEstado({ ocupado: true });
    try {
      setFila(await guardarPlan(nueva));
      setEstado({ aviso: extra?.estado === 'hecho' ? 'Marcado como dado' : extra?.estado ? 'Vuelve a estar pendiente' : 'Fechas guardadas' });
    } catch (e) {
      setEstado({ error: textoAccion(e) });
    }
  }
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    void guardar();
  };

  return (
    <Panel titulo={`Fechas de ${grupo.nombre}`} fin={<Faroles p={fila} />}>
      <form className="plan-grupo" onSubmit={enviar}>
        <div className="plan-grupo__fechas">
          <div className="campo">
            <label htmlFor={`${id}-1`}>Clase 1</label>
            <input id={`${id}-1`} type="date" value={c1} onChange={(e) => setC1(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor={`${id}-2`}>Clase 2</label>
            <input id={`${id}-2`} type="date" value={c2} onChange={(e) => setC2(e.target.value)} />
          </div>
        </div>
        {estado.error && (
          <p className="mensaje mensaje--error" role="alert">
            {estado.error}
          </p>
        )}
        {estado.aviso && (
          <p className="mensaje mensaje--ok" role="status">
            {estado.aviso}
          </p>
        )}
        <div className="mat-acciones">
          <Boton variante="primario" tipo="submit" disabled={estado.ocupado || !cambio}>
            Guardar fechas
          </Boton>
          {fila && (fila.estado === 'hecho' ? (
            <Boton disabled={estado.ocupado} onClick={() => void guardar({ estado: estadoPorFechas(c1 || null) })}>
              Volver a pendiente
            </Boton>
          ) : (
            <Boton disabled={estado.ocupado} onClick={() => void guardar({ estado: 'hecho' })}>
              Marcar como dado
            </Boton>
          ))}
        </div>
      </form>
    </Panel>
  );
}
