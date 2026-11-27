// "Mi mes" (/docente/calendario[/AAAA-MM]): el mes del docente a pantalla completa. Muestra las
// clases de cada grupo (fechas del plan por grupo) y sus planeaciones con fecha; en computador se
// arrastran entre días y desde la bandeja "Sin fecha"; en celular se usa "Poner fecha". "Armar el
// mes" reparte los temas que siguen del pensum en los días de clase, saltando festivos.
import { useMemo, useState, type DragEvent } from 'react';
import './calendario.css';
import { Boton, Encabezado, Enlace, Panel, Vacio } from '../base';
import { CampoOpciones, Cargado, textoAccion, useCarga, useTitulo } from '../comun';
import { hoyCo } from '../docente';
import { navegar } from '../../navegacion';
import { ponerFechaPlan, useMisPlanes, type Plan } from '../../armador/armar';
import { entregarPlan, tituloPlan } from '../entregas';
import { festivo } from './festivos';
import { armarMes, cargarMes, clasesDe, diaSemana, guardarPropuesta, mesDe, mesSiguiente, moverClase, nombreMes, semanasDelMes, sumarDias, temaDe, type ClaseDia, type DatosMes, type GrupoMes, type Propuesta } from './datos';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DIAS_CORTOS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const rutaMes = (mes: string) => `/docente/calendario/${mes}`;
const fechaLarga = (iso: string) => {
  const t = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export function MiMes({ mes: pedido }: { mes?: string }) {
  useTitulo('Mi mes');
  const hoy = hoyCo();
  const mes = pedido && /^\d{4}-\d{2}$/.test(pedido) ? pedido : mesDe(hoy);
  const carga = useCarga(cargarMes, 'mi-mes');
  const planes = useMisPlanes();
  const [dia, setDia] = useState(() => (mesDe(hoy) === mes ? hoy : `${mes}-01`));
  const [ocultos, setOcultos] = useState<Set<string>>(new Set());
  const [armando, setArmando] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string }>();

  const diaDelMes = mesDe(dia) === mes ? dia : `${mes}-01`;
  return (
    <div className="mi-mes">
      <div className="cabeza-pagina">
        <Encabezado titulo={`Mi mes · ${nombreMes(mes)}`} meta="Sus clases por grupo y sus planeaciones con fecha" />
        <div className="mi-mes__navegar no-imprimir">
          <button type="button" className="boton boton--secundario mi-mes__flecha" aria-label="Mes anterior" onClick={() => navegar(rutaMes(mesSiguiente(mes, -1)))}>
            ‹
          </button>
          <Boton onClick={() => navegar(rutaMes(mesDe(hoy)))}>Hoy</Boton>
          <button type="button" className="boton boton--secundario mi-mes__flecha" aria-label="Mes siguiente" onClick={() => navegar(rutaMes(mesSiguiente(mes, 1)))}>
            ›
          </button>
        </div>
      </div>
      <Cargado carga={carga}>
        {(d) =>
          d.grupos.length === 0 ? (
            <Panel>
              <Vacio titulo="Todavía no tiene grupos" texto="Cree su grupo y aquí verá sus clases del mes.">
                <Boton variante="primario" icono="crear" ruta="/docente/grupos">Crear un grupo</Boton>
              </Vacio>
            </Panel>
          ) : (
            <>
              <div className="mi-mes__barra no-imprimir">
                <div className="mi-mes__chips" role="group" aria-label="Grupos que se ven">
                  {d.grupos.map((gm) => (
                    <button key={gm.g.id} type="button" className="mes-chip" aria-pressed={!ocultos.has(gm.g.id)} style={{ ['--color' as string]: gm.color }} onClick={() => setOcultos((o) => { const n = new Set(o); if (n.has(gm.g.id)) n.delete(gm.g.id); else n.add(gm.g.id); return n; })}>
                      <i className="mes-chip__punto" aria-hidden="true" />
                      {gm.g.nombre}
                    </button>
                  ))}
                </div>
                <div className="acciones">
                  <Boton variante="primario" icono="planear" onClick={() => setArmando(!armando)}>Armar el mes</Boton>
                  <Boton icono="imprimir" onClick={() => window.print()}>Imprimir</Boton>
                  <EntregarMes mes={mes} planes={planes} avisar={setAviso} />
                </div>
              </div>
              {aviso && (
                <p className={`mensaje ${aviso.ok ? 'mensaje--ok' : 'mensaje--error'} no-imprimir`} role={aviso.ok ? 'status' : 'alert'}>
                  {aviso.texto}
                </p>
              )}
              {armando && <ArmarMes d={d} mes={mes} cerrar={() => setArmando(false)} listo={(texto) => { setArmando(false); setAviso({ ok: true, texto }); carga.recargar(); }} />}
              <Mes d={d} mes={mes} planes={planes} ocultos={ocultos} dia={diaDelMes} elegir={setDia} recargar={carga.recargar} avisar={setAviso} />
            </>
          )
        }
      </Cargado>
    </div>
  );
}

// ---------------------------------------------------------------- El mes

interface PropsMes { d: DatosMes; mes: string; planes: Plan[]; ocultos: Set<string>; dia: string; elegir: (d: string) => void; recargar: () => void; avisar: (a: { ok: boolean; texto: string }) => void }

function Mes({ d, mes, planes, ocultos, dia, elegir, recargar, avisar }: PropsMes) {
  const hoy = hoyCo();
  const clases = useMemo(() => clasesDe(d.grupos.filter((g) => !ocultos.has(g.g.id))), [d, ocultos]);
  const delDia = (f: string) => ({ clases: clases.filter((c) => c.fecha === f).sort((a, b) => a.grupo.g.nombre.localeCompare(b.grupo.g.nombre)), planes: planes.filter((p) => p.fecha === f) });
  const sinFecha = planes.filter((p) => !p.fecha);
  const [sobre, setSobre] = useState<string>();

  const mover = async (dato: string, fecha: string) => {
    const [tipo, ...resto] = dato.split('|');
    try {
      if (tipo === 'plan') ponerFechaPlan(resto[0], fecha);
      if (tipo === 'clase') {
        const c = clases.find((x) => x.grupo.g.id === resto[0] && x.fila.tema_id === resto[1] && String(x.clase) === resto[2]);
        if (c && c.fecha !== fecha) {
          await moverClase(c, fecha);
          recargar();
        }
      }
    } catch (e) {
      avisar({ ok: false, texto: textoAccion(e) });
    }
  };
  const soltar = (fecha: string) => (e: DragEvent) => {
    e.preventDefault();
    setSobre(undefined);
    const dato = e.dataTransfer.getData('text/x-mi-mes');
    if (dato) void mover(dato, fecha);
  };

  const elDia = delDia(dia);
  return (
    <div className="mi-mes__cuerpo">
      <div className="mes" role="grid" aria-label={`Calendario de ${nombreMes(mes)}`}>
        <div className="mes__cabeza" role="row">
          {DIAS.map((n, i) => (
            <span key={n} role="columnheader" className={i > 4 ? 'mes__finde' : undefined}>
              <span className="mes__dia-largo">{i > 4 ? n.slice(0, 3) : n}</span>
              <span className="mes__dia-corto" aria-hidden="true">{DIAS_CORTOS[i]}</span>
            </span>
          ))}
        </div>
        {semanasDelMes(mes).map((semana) => (
          <div key={semana[0]} className="mes__semana" role="row">
            {semana.map((f) => {
              const { clases: cs, planes: ps } = delDia(f);
              const fest = festivo(f);
              const fuera = mesDe(f) !== mes;
              const clase = ['mes__celda', fuera && 'mes__celda--fuera', diaSemana(f) > 4 && 'mes__celda--finde', fest && 'mes__celda--festivo', f === hoy && 'mes__celda--hoy', f === dia && 'mes__celda--elegida', sobre === f && 'mes__celda--sobre'].filter(Boolean).join(' ');
              return (
                <div
                  key={f}
                  role="gridcell"
                  className={clase}
                  aria-selected={f === dia}
                  onClick={() => elegir(f)}
                  onDragOver={(e) => { e.preventDefault(); setSobre(f); }}
                  onDragLeave={() => setSobre((s) => (s === f ? undefined : s))}
                  onDrop={soltar(f)}
                >
                  <button type="button" className="mes__numero" aria-label={`${fechaLarga(f)}${cs.length + ps.length ? `, ${cs.length + ps.length} en el calendario` : ''}${fest ? `, festivo: ${fest}` : ''}`} onClick={() => elegir(f)}>
                    {Number(f.slice(8))}
                  </button>
                  {fest && <span className="mes__festivo">{fest}</span>}
                  <div className="mes__items">
                    {cs.map((c) => <ItemClase key={`${c.grupo.g.id}-${c.fila.tema_id}-${c.clase}`} c={c} d={d} />)}
                    {ps.map((p) => <ItemPlan key={p.id} p={p} />)}
                  </div>
                  {cs.length + ps.length > 0 && (
                    <span className="mes__puntos" aria-hidden="true">
                      {cs.slice(0, 4).map((c, i) => <i key={i} style={{ background: c.grupo.color }} />)}
                      {ps.length > 0 && <i className="mes__punto-plan" />}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <aside className="mi-mes__lado">
        <Panel titulo={fechaLarga(dia)} fin={festivo(dia) ? <span className="meta">Festivo: {festivo(dia)}</span> : undefined}>
          {elDia.clases.length + elDia.planes.length === 0 ? (
            <p className="meta">Nada en este día. Ponga aquí una planeación de la bandeja o arme el mes.</p>
          ) : (
            <ul className="dia-lista">
              {elDia.clases.map((c) => {
                const t = temaDe(c.grupo, d.indice, c.fila.tema_id);
                return (
                  <li key={`${c.grupo.g.id}-${c.fila.tema_id}-${c.clase}`} className="dia-item" style={{ ['--color' as string]: c.grupo.color }}>
                    <Enlace ruta={t.ruta} className="dia-item__titulo">{t.nombre}</Enlace>
                    <span className="meta">Grupo {c.grupo.g.nombre} · Clase {c.clase}{c.fila.estado === 'hecho' ? ' · dada' : ''}</span>
                    <CambiarFecha etiqueta="Mover a" valor={c.fecha} alCambiar={(f) => void mover(`clase|${c.grupo.g.id}|${c.fila.tema_id}|${c.clase}`, f)} />
                  </li>
                );
              })}
              {elDia.planes.map((p) => (
                <li key={p.id} className="dia-item dia-item--plan">
                  <Enlace ruta={`/docente/planear/armar/${p.id}`} className="dia-item__titulo">{tituloPlan(p)}</Enlace>
                  <span className="meta">Mi planeación</span>
                  <CambiarFecha etiqueta="Mover a" valor={p.fecha ?? ''} alCambiar={(f) => ponerFechaPlan(p.id, f)} quitar={() => ponerFechaPlan(p.id, null)} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel titulo="Sin fecha" fin={<span className="meta">{sinFecha.length}</span>}>
          {sinFecha.length === 0 ? (
            <p className="meta">
              Todas sus planeaciones tienen fecha. <Enlace ruta="/docente/planear/armar" className="enlace">Armar una planeación</Enlace>
            </p>
          ) : (
            <>
              <p className="meta mi-mes__ayuda-arrastrar">Arrastre una planeación a un día, o póngale fecha.</p>
              <ul className="dia-lista">
                {sinFecha.map((p) => (
                  <li key={p.id} className="dia-item dia-item--plan" draggable onDragStart={(e) => e.dataTransfer.setData('text/x-mi-mes', `plan|${p.id}`)}>
                    <Enlace ruta={`/docente/planear/armar/${p.id}`} className="dia-item__titulo">{tituloPlan(p)}</Enlace>
                    <CambiarFecha etiqueta="Poner fecha" valor="" sugerida={dia} alCambiar={(f) => ponerFechaPlan(p.id, f)} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>
      </aside>
    </div>
  );
}

function ItemClase({ c, d }: { c: ClaseDia; d: DatosMes }) {
  const t = temaDe(c.grupo, d.indice, c.fila.tema_id);
  return (
    <Enlace ruta={t.ruta} className={`mes-item${c.fila.estado === 'hecho' ? ' mes-item--hecho' : ''}`}>
      <span
        className="mes-item__dentro"
        style={{ ['--color' as string]: c.grupo.color }}
        draggable
        onDragStart={(e) => e.dataTransfer.setData('text/x-mi-mes', `clase|${c.grupo.g.id}|${c.fila.tema_id}|${c.clase}`)}
        title={`${c.grupo.g.nombre} · ${t.nombre} · Clase ${c.clase}`}
      >
        <strong>{c.grupo.g.nombre}</strong> · {t.nombre} · C{c.clase}
      </span>
    </Enlace>
  );
}

function ItemPlan({ p }: { p: Plan }) {
  return (
    <Enlace ruta={`/docente/planear/armar/${p.id}`} className="mes-item mes-item--plan">
      <span className="mes-item__dentro" draggable onDragStart={(e) => e.dataTransfer.setData('text/x-mi-mes', `plan|${p.id}`)} title={tituloPlan(p)}>
        {tituloPlan(p)}
      </span>
    </Enlace>
  );
}

function CambiarFecha({ etiqueta, valor, sugerida, alCambiar, quitar }: { etiqueta: string; valor: string; sugerida?: string; alCambiar: (f: string) => void; quitar?: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [f, setF] = useState(valor || sugerida || '');
  if (!abierto)
    return (
      <span className="cambiar-fecha">
        <button type="button" className="boton boton--texto" onClick={(e) => { e.stopPropagation(); setAbierto(true); }}>{etiqueta}</button>
        {quitar && <button type="button" className="boton boton--texto" onClick={quitar}>Quitar fecha</button>}
      </span>
    );
  return (
    <span className="cambiar-fecha">
      <input type="date" value={f} aria-label={etiqueta} onChange={(e) => setF(e.target.value)} />
      <Boton disabled={!f} onClick={() => { alCambiar(f); setAbierto(false); }}>Listo</Boton>
    </span>
  );
}

// ---------------------------------------------------------------- Entregar el mes

function EntregarMes({ mes, planes, avisar }: { mes: string; planes: Plan[]; avisar: (a: { ok: boolean; texto: string }) => void }) {
  const [ocupado, setOcupado] = useState(false);
  const delMes = planes.filter((p) => p.fecha && mesDe(p.fecha) === mes);
  const entregar = async () => {
    if (!delMes.length) return avisar({ ok: false, texto: `No tiene planeaciones con fecha en ${nombreMes(mes).toLowerCase()}. Póngales fecha y vuelva a entregar.` });
    setOcupado(true);
    try {
      for (const p of delMes) await entregarPlan(p);
      avisar({ ok: true, texto: `Entregó al coordinador ${delMes.length === 1 ? 'una planeación' : `${delMes.length} planeaciones`} de ${nombreMes(mes).toLowerCase()}.` });
    } catch (e) {
      avisar({ ok: false, texto: textoAccion(e) });
    } finally {
      setOcupado(false);
    }
  };
  return (
    <Boton icono="subir" disabled={ocupado} onClick={() => void entregar()}>
      {ocupado ? 'Entregando…' : 'Entregar al coordinador'}
    </Boton>
  );
}

// ---------------------------------------------------------------- Armar el mes

function ArmarMes({ d, mes, cerrar, listo }: { d: DatosMes; mes: string; cerrar: () => void; listo: (texto: string) => void }) {
  const hoy = hoyCo();
  const finMes = sumarDias(`${mesSiguiente(mes, 1)}-01`, -1);
  const [grupoId, setGrupoId] = useState(d.grupos[0].g.id);
  const gm = d.grupos.find((g) => g.g.id === grupoId) as GrupoMes;
  const [desde, setDesde] = useState(mesDe(hoy) === mes ? hoy : `${mes}-01`);
  const [hasta, setHasta] = useState(finMes);
  const [dias, setDias] = useState<number[]>([0, 2]);
  const [porTema, setPorTema] = useState<1 | 2>(2);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string>();
  const propuesta: Propuesta[] = useMemo(() => armarMes(gm, desde, hasta, dias, porTema), [gm, desde, hasta, dias, porTema]);

  const guardar = async () => {
    setOcupado(true);
    setError(undefined);
    try {
      await guardarPropuesta(gm, propuesta);
      listo(`Quedaron ${propuesta.length} ${propuesta.length === 1 ? 'tema' : 'temas'} de ${gm.g.nombre} en el calendario. Puede moverlos cuando quiera.`);
    } catch (e) {
      setError(textoAccion(e));
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Panel titulo="Armar el mes" fin={<button type="button" className="boton boton--texto" onClick={cerrar}>Cerrar</button>}>
      <div className="armar-mes">
        <div className="armar-mes__campos">
          <CampoOpciones id="armar-grupo" etiqueta="Grupo" valor={grupoId} alCambiar={setGrupoId} opciones={d.grupos.map((g) => ({ valor: g.g.id, etiqueta: `${g.g.nombre}${g.pensum ? ` · ${g.pensum.materia} ${g.pensum.gradoNombre}` : ''}` }))} />
          <div className="campo">
            <label htmlFor="armar-desde">Desde</label>
            <input id="armar-desde" type="date" value={desde} onChange={(e) => e.target.value && setDesde(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="armar-hasta">Hasta</label>
            <input id="armar-hasta" type="date" value={hasta} min={desde} onChange={(e) => e.target.value && setHasta(e.target.value)} />
          </div>
        </div>
        <fieldset className="armar-mes__dias">
          <legend>Días de clase</legend>
          <div className="mi-mes__chips">
            {DIAS.slice(0, 5).map((n, i) => (
              <button key={n} type="button" className="mes-chip" aria-pressed={dias.includes(i)} onClick={() => setDias((ds) => (ds.includes(i) ? ds.filter((x) => x !== i) : [...ds, i].sort()))}>
                {n}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="armar-mes__dias">
          <legend>Clases por tema</legend>
          <div className="mi-mes__chips">
            {([1, 2] as const).map((n) => (
              <button key={n} type="button" className="mes-chip" aria-pressed={porTema === n} onClick={() => setPorTema(n)}>
                {n === 1 ? 'Una' : 'Dos'}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="meta">Toma los temas del pensum que aún no tienen fecha, en orden, y salta los festivos de Colombia. No cambia lo que ya está en el calendario.</p>
        {!gm.pensum ? (
          <p className="mensaje mensaje--error">No se pudo leer el pensum de este grupo. Revise la conexión.</p>
        ) : propuesta.length === 0 ? (
          <p className="meta">No hay días de clase libres en esas fechas, o ya todos los temas tienen fecha.</p>
        ) : (
          <ol className="armar-mes__vista">
            {propuesta.map((p) => (
              <li key={p.tema.id}>
                <strong>{p.tema.nombre}</strong>
                <span className="meta">
                  {fechaLarga(p.clase1)}
                  {p.clase2 ? ` y ${fechaLarga(p.clase2).toLowerCase()}` : ''}
                </span>
              </li>
            ))}
          </ol>
        )}
        {error && <p className="mensaje mensaje--error" role="alert">{error}</p>}
        <div className="acciones">
          <Boton variante="primario" disabled={ocupado || propuesta.length === 0} onClick={() => void guardar()}>
            {ocupado ? 'Guardando…' : `Poner ${propuesta.length} ${propuesta.length === 1 ? 'tema' : 'temas'} en el calendario`}
          </Boton>
        </div>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------- Hoy (en Inicio)

/** Lo de hoy en "Mi mes": las clases de sus grupos y sus planeaciones con la fecha de hoy. */
export function HoyEnMiMes() {
  const hoy = hoyCo();
  const carga = useCarga(cargarMes, 'mi-mes');
  const planes = useMisPlanes().filter((p) => p.fecha === hoy);
  const clases = carga.datos ? clasesDe(carga.datos.grupos).filter((c) => c.fecha === hoy) : [];
  return (
    <Panel titulo={`Hoy · ${fechaLarga(hoy)}`} fin={<Enlace ruta="/docente/calendario" className="enlace">Ver mi mes</Enlace>}>
      {clases.length + planes.length === 0 ? (
        <p className="meta">{festivo(hoy) ? `Festivo: ${festivo(hoy)}.` : 'No tiene clases ni planeaciones con fecha de hoy.'} En "Mi mes" puede armar el mes en un paso.</p>
      ) : (
        <ul className="dia-lista">
          {clases.map((c) => {
            const t = temaDe(c.grupo, carga.datos!.indice, c.fila.tema_id);
            return (
              <li key={`${c.grupo.g.id}-${c.fila.tema_id}-${c.clase}`} className="dia-item" style={{ ['--color' as string]: c.grupo.color }}>
                <Enlace ruta={t.ruta} className="dia-item__titulo">{t.nombre}</Enlace>
                <span className="meta">Grupo {c.grupo.g.nombre} · Clase {c.clase}</span>
              </li>
            );
          })}
          {planes.map((p) => (
            <li key={p.id} className="dia-item dia-item--plan">
              <Enlace ruta={`/docente/planear/armar/${p.id}`} className="dia-item__titulo">{tituloPlan(p)}</Enlace>
              <span className="meta">Mi planeación · lista para proyectar o imprimir</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
