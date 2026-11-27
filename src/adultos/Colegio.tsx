// Coordinador (/colegio): docentes, invitaciones, grupos y cifras por grupo (esqueleto §3.1).
// Nunca muestra niños: solo las cifras sumadas de `cifras_grupos`. El código de un grupo no se
// ve aquí: el coordinador solo lo renueva.
import { useState, type FormEvent } from 'react';
import { Boton, Encabezado, Panel, Vacio } from './base';
import { Campo, CampoOpciones, Cargado, Confirmar, FormInvitar, ListaInvitaciones, ListaPersonas, textoAccion, useCarga, useTitulo } from './comun';
import { asignables, asignarDocente, cambiarCartillaGrupo, cifrasGrupos, crearGrupo, listarCartillas, listarGrupos, listarHabilitadas, listarInvitaciones, listarPersonas, nombreCartilla, renovarCodigo, type CartillaCat, type Cifra, type Grupo, type Habilitada, type Invitacion, type Persona } from './datos';
import { CARTILLA_PREDETERMINADA } from '../cartillas';
import { entregasColegio } from './entregas';
import { ResumenColegio } from './tablero/ResumenColegio';
import { useEnVivo } from './tablero/vivo';

const GRADOS = ['Preescolar', '1°', '2°', '3°', '4°', '5°'].map((g) => ({ valor: g, etiqueta: g === 'Preescolar' ? g : `Grado ${g}` }));

/** Suma los valores de un objeto de cifras ({"ingles-3/bosque-school": 4, …}). */
const sumar = (o?: Record<string, number> | null) => Object.values(o ?? {}).reduce((a, b) => a + Number(b || 0), 0);
const fmt = (n: number) => n.toLocaleString('es-CO');
const etiquetaGrado = (g: string) => (g === 'Preescolar' ? g : /^\d/.test(g) ? `Grado ${g}` : g || 'Sin grado');

interface Cuenta { activos: number; conCuenta: number; misiones: number; estrellas: number }
const cuentaDe = (g: Cifra): Cuenta => ({ activos: g.practicaron_semana ?? 0, conCuenta: g.autorizaciones ?? 0, misiones: sumar(g.misiones), estrellas: sumar(g.estrellas) });
const juntar = (cs: Cuenta[]): Cuenta => cs.reduce((a, c) => ({ activos: a.activos + c.activos, conCuenta: a.conCuenta + c.conCuenta, misiones: a.misiones + c.misiones, estrellas: a.estrellas + c.estrellas }), { activos: 0, conCuenta: 0, misiones: 0, estrellas: 0 });

/**
 * Uso y avance: un tablero por grado y, dentro, una fila por grupo. Solo cifras del grupo
 * (niños que practicaron esta semana, misiones completadas y estrellas); los grupos de menos
 * de 5 niños con autorización no muestran cifras. Se imprime en una hoja (base.css).
 */
export function UsoYAvance() {
  useTitulo('Uso y avance');
  const carga = useCarga(() => Promise.all([cifrasGrupos(), entregasColegio().catch(() => null)]), 'cifras');
  const hora = useEnVivo(carga.recargar, Boolean(carga.datos));
  const hoy = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <div className="tablero-uso tablero">
      <div className="cabeza-pagina">
        <Encabezado titulo="Uso y avance" meta={`${hoy} · se actualiza solo · ${hora}`} />
        <div className="no-imprimir">
          <Boton icono="imprimir" onClick={() => window.print()}>Imprimir</Boton>
        </div>
      </div>
      <Cargado carga={carga}>
        {([grupos, entregas]) => {
          if (grupos.length === 0)
            return (
              <Panel>
                <Vacio titulo="Todavía no hay grupos" texto="Cuando sus docentes creen grupos, aquí verá el uso de la cartilla por grado. También puede crearlos usted en Docentes.">
                  <Boton ruta="/colegio/docentes">Ir a Docentes</Boton>
                </Vacio>
              </Panel>
            );
          const grados = [...new Set(grupos.map((g) => g.grado))].sort((a, b) => ordenGrado(a) - ordenGrado(b) || a.localeCompare(b));
          return (
            <>
              <ResumenColegio grupos={grupos} entregas={entregas} orden={(a, b) => ordenGrado(a) - ordenGrado(b) || a.localeCompare(b)} />
              <h2 className="tablero__seccion">Por grado y grupo</h2>
              {grados.map((grado) => {
                const delGrado = grupos.filter((g) => g.grado === grado);
                const conCifras = delGrado.filter((g) => g.con_cifras);
                const total = juntar(conCifras.map(cuentaDe));
                return (
                  <Panel key={grado} titulo={etiquetaGrado(grado)} fin={<span className="meta">{delGrado.length === 1 ? '1 grupo' : `${delGrado.length} grupos`}</span>}>
                    {conCifras.length > 0 && delGrado.length > 1 && (
                      <div className="tablero-uso__total">
                        <span className="meta">Todo el grado{conCifras.length < delGrado.length ? ' (solo grupos con cifras)' : ''}</span>
                        <Cifras c={total} />
                      </div>
                    )}
                    <ul className="lista">
                      {delGrado.map((g) => (
                        <FilaCifras key={g.grupo_id} g={g} />
                      ))}
                    </ul>
                  </Panel>
                );
              })}
              <p className="meta">
                Activos: niños que jugaron al menos una vez en los últimos 7 días. Misiones: cuántas veces un niño completó una misión por primera vez. Lo que viene de la app muestra solo a quienes juegan con cuenta; no sirve para calificar ni para comparar docentes.
              </p>
            </>
          );
        }}
      </Cargado>
    </div>
  );
}

function Cifras({ c }: { c: Cuenta }) {
  return (
    <dl className="tablero-uso__cifras">
      <div>
        <dt>Activos esta semana</dt>
        <dd>
          {fmt(c.activos)} <span className="meta">de {fmt(c.conCuenta)}</span>
        </dd>
      </div>
      <div>
        <dt>Misiones completadas</dt>
        <dd>{fmt(c.misiones)}</dd>
      </div>
      <div>
        <dt>Calcomanías</dt>
        <dd>{fmt(c.estrellas)}</dd>
      </div>
    </dl>
  );
}

function FilaCifras({ g }: { g: Cifra }) {
  return (
    <li className="item tablero-uso__grupo">
      <div className="item__texto">
        <span className="tablero-uso__nombre">{g.nombre}</span>
        <span className="meta">Docente: {g.docente}</span>
      </div>
      {g.con_cifras ? <Cifras c={cuentaDe(g)} /> : <p className="meta">Sin cifras: hay menos de 5 niños con autorización</p>}
    </li>
  );
}

type Datos = [Persona[], Invitacion[], Grupo[], Habilitada[], CartillaCat[]];
type Opcion = { valor: string; etiqueta: string };

/** Cartillas que el colegio puede usar en sus grupos (las habilitadas), con su nombre. */
const opcionesCartilla = (habilitadas: Habilitada[], catalogo: CartillaCat[]): Opcion[] =>
  habilitadas.map((h) => {
    const c = catalogo.find((k) => k.id === h.cartilla_id);
    return { valor: h.cartilla_id, etiqueta: c ? nombreCartilla(c) : h.cartilla_id };
  });
const cartillaDe = (g: Grupo) => g.cartilla_id ?? CARTILLA_PREDETERMINADA;
/** Grados en el orden de la escuela; un grado escrito distinto va al final. */
const ordenGrado = (g: string) => {
  const i = GRADOS.findIndex((x) => x.valor === g);
  return i < 0 ? GRADOS.length : i;
};

/** Docentes y grupos. */
export function DocentesYGrupos({ sinRed }: { sinRed: boolean }) {
  useTitulo('Docentes y grupos');
  const carga = useCarga<Datos>(() => Promise.all([listarPersonas(), listarInvitaciones(), listarGrupos(), listarHabilitadas(), listarCartillas()]), 'docentes');
  return (
    <>
      <Encabezado titulo="Docentes y grupos" />
      <Cargado carga={carga}>
        {([personas, invitaciones, grupos, habilitadas, catalogo]) => {
          const docentes = personas.filter((p) => p.rol === 'docente');
          const lista = asignables(docentes, invitaciones);
          const cartillas = opcionesCartilla(habilitadas, catalogo);
          const grados = [...new Set(grupos.map((g) => g.grado))].sort((a, b) => ordenGrado(a) - ordenGrado(b));
          const nombreDe = (id: string) => cartillas.find((c) => c.valor === id)?.etiqueta ?? catalogo.find((k) => k.id === id)?.titulo ?? id;
          return (
            <>
              <Panel titulo="Docentes" filas>
                {docentes.length === 0 ? (
                  <div style={{ padding: 'var(--e-4)' }}>
                    <Vacio titulo="Todavía no hay docentes" texto="Invite a su primer docente con su correo, más abajo. Cuando acepte, aparece aquí." />
                  </div>
                ) : (
                  <ListaPersonas items={docentes} sinRed={sinRed} alCambiar={carga.recargar} puedeCambiar={() => true} />
                )}
              </Panel>

              <Panel titulo="Invitar docente">
                <FormInvitar roles={['docente']} sinRed={sinRed} alListo={carga.recargar} />
              </Panel>

              {invitaciones.length > 0 && (
                <Panel titulo="Invitaciones" filas>
                  <ListaInvitaciones items={invitaciones} sinRed={sinRed} alCambiar={carga.recargar} puedeCancelar={(i) => !i.del_dueno} />
                </Panel>
              )}

              {grupos.length === 0 ? (
                <Panel titulo="Grupos">
                  <Vacio titulo="Todavía no hay grupos" texto="Cree el primero y asígnelo a un docente que ya haya aceptado su invitación." />
                </Panel>
              ) : (
                grados.map((grado) => (
                  <Panel key={grado} titulo={`Grupos de ${GRADOS.find((x) => x.valor === grado)?.etiqueta.replace('Grado ', 'grado ') ?? grado}`} filas>
                    <ul className="lista">
                      {grupos
                        .filter((g) => g.grado === grado)
                        .map((g) => (
                          <FilaGrupo key={g.id} g={g} docentes={docentes} lista={lista} cartillas={cartillas} nombreCartilla={nombreDe(cartillaDe(g))} sinRed={sinRed} alCambiar={carga.recargar} />
                        ))}
                    </ul>
                  </Panel>
                ))
              )}

              <Panel titulo="Crear grupo">
                <FormGrupo lista={lista} cartillas={cartillas} sinRed={sinRed} alListo={carga.recargar} />
              </Panel>
            </>
          );
        }}
      </Cargado>
    </>
  );
}

function FilaGrupo({ g, docentes, lista, cartillas, nombreCartilla, sinRed, alCambiar }: { g: Grupo; docentes: Persona[]; lista: Persona[]; cartillas: Opcion[]; nombreCartilla: string; sinRed: boolean; alCambiar: () => void }) {
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string }>();
  const [ocupado, setOcupado] = useState(false);
  const actual = docentes.find((d) => d.id === g.docente_id);

  const correr = async (que: () => Promise<unknown>, textoOk?: string) => {
    setOcupado(true);
    setAviso(undefined);
    try {
      await que();
      if (textoOk) setAviso({ ok: true, texto: textoOk });
      alCambiar();
    } catch (falla) {
      setAviso({ ok: false, texto: textoAccion(falla) });
    } finally {
      setOcupado(false);
    }
  };

  const opcionesCar = cartillas.some((c) => c.valor === cartillaDe(g)) ? cartillas : [{ valor: cartillaDe(g), etiqueta: nombreCartilla }, ...cartillas];
  // El docente actual va siempre en la lista para que el selector lo muestre, aunque ya no se pueda asignar.
  const opciones = [...(actual && !lista.some((d) => d.id === actual.id) ? [actual] : []), ...lista].map((d) => ({ valor: d.id, etiqueta: d.activo ? d.nombre : `${d.nombre} (desactivado)` }));

  return (
    <li className="item">
      <div className="item__texto">
        <span>
          {g.nombre} <span className="meta">· {g.grado}</span>
        </span>
        <span className="meta">Docente: {actual ? actual.nombre : 'sin asignar'}{actual && !actual.activo ? ' (desactivado: asigne a otro docente)' : ''}</span>
        <span className="meta">Cartilla: {nombreCartilla}</span>
        <p className={`mensaje ${aviso?.ok ? 'mensaje--ok' : 'mensaje--error'}`} role={aviso?.ok ? 'status' : 'alert'}>
          {aviso?.texto}
        </p>
      </div>
      <div className="item__acciones">
        <CampoOpciones id={`doc-${g.id}`} etiqueta="Cambiar docente" disabled={sinRed || ocupado} valor={g.docente_id} opciones={opciones} alCambiar={(v) => v !== g.docente_id && void correr(() => asignarDocente(g.id, v), 'Docente cambiado.')} />
        {/* Solo si el colegio tiene más de una cartilla habilitada (o el grupo usa una que ya no lo está). */}
        {opcionesCar.length > 1 && (
          <CampoOpciones id={`car-${g.id}`} etiqueta="Cambiar cartilla" disabled={sinRed || ocupado} valor={cartillaDe(g)} opciones={opcionesCar} alCambiar={(v) => v !== cartillaDe(g) && void correr(() => cambiarCartillaGrupo(g.id, v), 'Cartilla cambiada. Los niños la ven la próxima vez que entren con el código.')} />
        )}
        <Confirmar etiqueta="Renovar código" pregunta="¿Renovar el código?" si="Sí, renovar" disabled={sinRed || ocupado} alConfirmar={() => void correr(() => renovarCodigo(g.id), 'Código renovado. El docente ve el nuevo en su grupo; los niños que ya entraron siguen dentro.')} />
      </div>
    </li>
  );
}

function FormGrupo({ lista, cartillas, sinRed, alListo }: { lista: Persona[]; cartillas: Opcion[]; sinRed: boolean; alListo: () => void }) {
  const [nombre, setNombre] = useState('');
  const [grado, setGrado] = useState('3°');
  const [docente, setDocente] = useState('');
  const [cartilla, setCartilla] = useState(cartillas.find((c) => c.valor === CARTILLA_PREDETERMINADA)?.valor ?? cartillas[0]?.valor ?? '');
  const [errores, setErrores] = useState<{ nombre?: string; docente?: string }>({});
  const [resultado, setResultado] = useState<{ ok: boolean; texto: string }>();
  const [enviando, setEnviando] = useState(false);

  if (lista.length === 0)
    return <p className="nota">Para crear un grupo hace falta un docente que ya haya aceptado su invitación. Invítelo en "Invitar docente".</p>;

  const alEnviar = async (e: FormEvent) => {
    e.preventDefault();
    const nuevos = { nombre: nombre.trim() ? undefined : 'Escriba el nombre del grupo, por ejemplo 3B.', docente: docente ? undefined : 'Elija el docente del grupo.' };
    setErrores(nuevos);
    setResultado(undefined);
    if (nuevos.nombre || nuevos.docente) return;
    setEnviando(true);
    try {
      const nuevo = await crearGrupo({ nombre, grado, docente });
      // El grupo nace con la cartilla predeterminada; si se eligió otra, se cambia enseguida.
      if (cartilla && nuevo?.id && cartilla !== (nuevo.cartilla_id ?? CARTILLA_PREDETERMINADA)) await cambiarCartillaGrupo(nuevo.id, cartilla);
      setResultado({ ok: true, texto: `Grupo ${nombre.trim()} creado.` });
      setNombre('');
      setDocente('');
      alListo();
    } catch (falla) {
      setResultado({ ok: false, texto: textoAccion(falla) });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form className="formulario" onSubmit={alEnviar} noValidate>
      <Campo id="gr-nombre" etiqueta="Nombre del grupo" nombre autoComplete="off" valor={nombre} alCambiar={setNombre} error={errores.nombre} maximo={30} />
      <CampoOpciones id="gr-grado" etiqueta="Grado" valor={grado} alCambiar={setGrado} opciones={GRADOS} />
      <CampoOpciones id="gr-docente" etiqueta="Docente" valor={docente} alCambiar={setDocente} vacio="Elija un docente" opciones={lista.map((d) => ({ valor: d.id, etiqueta: d.nombre }))} error={errores.docente} />
      {cartillas.length > 1 && <CampoOpciones id="gr-cartilla" etiqueta="Cartilla" valor={cartilla} alCambiar={setCartilla} opciones={cartillas} />}
      <Boton variante="primario" tipo="submit" disabled={enviando || sinRed}>
        {enviando ? 'Creando…' : 'Crear grupo'}
      </Boton>
      <p className={`mensaje ${resultado?.ok ? 'mensaje--ok' : 'mensaje--error'}`} role={resultado?.ok ? 'status' : 'alert'}>
        {resultado?.texto}
      </p>
    </form>
  );
}
