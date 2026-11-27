// Coordinador: planeaciones que entregan los docentes de su colegio (/colegio/planeaciones).
// Las ve en el formato del colegio, las marca como revisadas o pide ajustes con un comentario,
// y las baja en Word desde el mismo formato. Datos en entregas_planeacion (migración 015).
import { useState } from 'react';
import { Boton, Encabezado, Fila, Panel, Vacio } from './base';
import { Cargado, textoAccion, useCarga, useTitulo } from './comun';
import { entregasColegio, NOMBRE_ESTADO, revisarEntrega, type Entrega, type EstadoEntrega } from './entregas';
import { PlanEnFormato } from '../armador/Armador';
import '../armador/armador.css';

const RUTA = '/colegio/planeaciones';
const rutaEntrega = (e: Entrega) => `${RUTA}/${encodeURIComponent(e.docente_id)}/${encodeURIComponent(e.planeacion_id)}`;
const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
const ORDEN: EstadoEntrega[] = ['por-revisar', 'ajustar', 'revisada'];

export function EstadoEntregaChip({ estado }: { estado: EstadoEntrega }) {
  return <span className={`estado-entrega estado-entrega--${estado}`}>{NOMBRE_ESTADO[estado]}</span>;
}

export function PlaneacionesColegio({ resto }: { resto: string[] }) {
  const [docente, id] = resto;
  return docente && id ? <RevisarEntrega docente={docente} id={id} /> : <ListaEntregas />;
}

function ListaEntregas() {
  useTitulo('Planeaciones');
  const carga = useCarga(entregasColegio, 'entregas');
  return (
    <>
      <Encabezado titulo="Planeaciones" meta="Las que entregan sus docentes, para revisar y bajar en Word" />
      <Cargado carga={carga}>
        {(lista) =>
          lista.length === 0 ? (
            <Panel>
              <Vacio titulo="Todavía no hay entregas" texto="Cuando un docente arme su planeación y toque Entregar, llega aquí en el formato del colegio. Ya no hace falta pedirlas por correo ni impresas." />
            </Panel>
          ) : (
            <>
              <Resumen lista={lista} />
              {ORDEN.map((estado) => {
                const del = lista.filter((e) => e.estado === estado);
                if (!del.length) return null;
                return (
                  <Panel key={estado} titulo={`${NOMBRE_ESTADO[estado]} (${del.length})`} filas>
                    {del.map((e) => (
                      <Fila key={`${e.docente_id}-${e.planeacion_id}`} ruta={rutaEntrega(e)} icono="planear" titulo={e.titulo} detalle={`${e.docente_nombre} · entregada el ${fecha(e.entregada)}`} />
                    ))}
                  </Panel>
                );
              })}
            </>
          )
        }
      </Cargado>
    </>
  );
}

/** Cuántas entregó cada docente y cuántas faltan por revisar. */
function Resumen({ lista }: { lista: Entrega[] }) {
  const docentes = [...new Set(lista.map((e) => e.docente_nombre))].sort((a, b) => a.localeCompare(b, 'es'));
  return (
    <Panel titulo="Por docente" filas>
      {docentes.map((d) => {
        const suyas = lista.filter((e) => e.docente_nombre === d);
        const porRevisar = suyas.filter((e) => e.estado === 'por-revisar').length;
        return <Fila key={d} icono="cuenta" titulo={d} detalle={`${suyas.length} ${suyas.length === 1 ? 'entregada' : 'entregadas'}${porRevisar ? ` · ${porRevisar} por revisar` : ' · todas revisadas'}`} />;
      })}
    </Panel>
  );
}

function RevisarEntrega({ docente, id }: { docente: string; id: string }) {
  const [vuelta, setVuelta] = useState(0);
  const carga = useCarga(entregasColegio, `entregas-${vuelta}`);
  const e = carga.datos?.find((x) => x.docente_id === docente && x.planeacion_id === id);
  useTitulo(e ? e.titulo : 'Planeación');
  return (
    <Cargado carga={carga}>
      {() =>
        !e ? (
          <>
            <Encabezado titulo="Planeación" volver={{ ruta: RUTA, etiqueta: 'Planeaciones' }} />
            <Panel>
              <Vacio texto="Esa entrega ya no está: el docente pudo retirarla." />
            </Panel>
          </>
        ) : (
          <PlanEnFormato
            plan={{ ...e.datos, id: e.planeacion_id }}
            docente={e.docente_nombre}
            volver={{ ruta: RUTA, etiqueta: 'Planeaciones' }}
            antes={
              <div className="revisar-atajo no-imprimir">
                <span>
                  {e.docente_nombre} · <EstadoEntregaChip estado={e.estado} />
                </span>
                <a className="boton boton--primario" href="#revision">
                  Revisar
                </a>
              </div>
            }
          >
            <FormRevisar entrega={e} alListo={() => setVuelta((v) => v + 1)} />
          </PlanEnFormato>
        )
      }
    </Cargado>
  );
}

function FormRevisar({ entrega, alListo }: { entrega: Entrega; alListo: () => void }) {
  const [comentario, setComentario] = useState(entrega.comentario ?? '');
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string }>();
  const revisar = async (estado: 'revisada' | 'ajustar') => {
    if (estado === 'ajustar' && !comentario.trim()) return setAviso({ ok: false, texto: 'Escriba qué hay que ajustar, para que el docente lo vea.' });
    setOcupado(true);
    setAviso(undefined);
    try {
      await revisarEntrega(entrega, estado, comentario);
      setAviso({ ok: true, texto: estado === 'revisada' ? 'Marcada como revisada. El docente lo ve en su planeación.' : 'Ajustes pedidos. El docente ve su comentario.' });
      alListo();
    } catch (err) {
      setAviso({ ok: false, texto: textoAccion(err) });
    } finally {
      setOcupado(false);
    }
  };
  return (
    <section id="revision" className={`entrega no-imprimir entrega--${entrega.estado}`} aria-label="Revisión">
      <div className="entrega__texto revisar">
        <h2 className="h3">
          Revisión <EstadoEntregaChip estado={entrega.estado} />
        </h2>
        <p className="sec">
          De {entrega.docente_nombre}, entregada el {fecha(entrega.entregada)}.
        </p>
        <div className="campo">
          <label htmlFor="comentario-revision">Comentario para el docente (opcional al marcar revisada)</label>
          <textarea id="comentario-revision" maxLength={1000} value={comentario} onChange={(ev) => setComentario(ev.target.value)} />
        </div>
        <div className="acciones">
          <Boton variante="primario" icono="marca" disabled={ocupado} onClick={() => void revisar('revisada')}>
            Marcar como revisada
          </Boton>
          <Boton icono="volver" disabled={ocupado} onClick={() => void revisar('ajustar')}>
            Pedir ajustes
          </Boton>
        </div>
        <p className={`mensaje${aviso ? (aviso.ok ? ' mensaje--ok' : ' mensaje--error') : ''}`} role="status">
          {aviso?.texto}
        </p>
      </div>
    </section>
  );
}
