// Coordinador (/colegio): docentes, invitaciones, grupos y cifras por grupo (esqueleto §3.1).
// Nunca muestra niños: solo las cifras sumadas de `cifras_grupos`. El código de un grupo no se
// ve aquí: el coordinador solo lo renueva.
import { useState, type FormEvent } from 'react';
import { Boton, Encabezado, Panel, Vacio } from './base';
import { Campo, CampoOpciones, Cargado, Confirmar, FormInvitar, ListaInvitaciones, ListaPersonas, textoAccion, useCarga, useTitulo } from './comun';
import { asignables, asignarDocente, cifrasGrupos, crearGrupo, listarGrupos, listarInvitaciones, listarPersonas, renovarCodigo, type Cifra, type Grupo, type Invitacion, type Persona } from './datos';

const GRADOS = ['Preescolar', '1°', '2°', '3°', '4°', '5°'].map((g) => ({ valor: g, etiqueta: g === 'Preescolar' ? g : `Grado ${g}` }));

/** Uso y avance: una fila por grupo, solo con cifras sumadas. */
export function UsoYAvance() {
  useTitulo('Uso y avance');
  const carga = useCarga(cifrasGrupos, 'cifras');
  return (
    <>
      <Encabezado titulo="Uso y avance" meta="Por grupo, en orden de nombre" />
      <Cargado carga={carga}>
        {(grupos) =>
          grupos.length === 0 ? (
            <Panel>
              <Vacio titulo="Todavía no hay grupos" texto="Cuando sus docentes creen grupos, aquí verá el uso de la cartilla por grado. También puede crearlos usted en Docentes.">
                <Boton ruta="/colegio/docentes">Ir a Docentes</Boton>
              </Vacio>
            </Panel>
          ) : (
            <>
              <Panel filas>
                <ul className="lista">
                  {grupos.map((g) => (
                    <FilaCifras key={g.grupo_id} g={g} />
                  ))}
                </ul>
              </Panel>
              <p className="meta">Lo que viene de la app muestra solo a quienes juegan en casa. No sirve para calificar ni para comparar docentes.</p>
            </>
          )
        }
      </Cargado>
    </>
  );
}

function FilaCifras({ g }: { g: Cifra }) {
  return (
    <li className="item">
      <div className="item__texto">
        <span>
          {g.nombre} <span className="meta">· {g.grado}</span>
        </span>
        <span className="meta">Docente: {g.docente}</span>
      </div>
      {g.con_cifras ? (
        <p className="cifras">
          <span>{g.ninos} niños con cuenta</span>
          <span>{g.practicaron_semana} practicaron esta semana</span>
        </p>
      ) : (
        <p className="meta">No se muestran cifras: hay menos de 5 niños con autorización</p>
      )}
    </li>
  );
}

type Datos = [Persona[], Invitacion[], Grupo[]];

/** Docentes y grupos. */
export function DocentesYGrupos({ sinRed }: { sinRed: boolean }) {
  useTitulo('Docentes y grupos');
  const carga = useCarga<Datos>(() => Promise.all([listarPersonas(), listarInvitaciones(), listarGrupos()]), 'docentes');
  return (
    <>
      <Encabezado titulo="Docentes y grupos" />
      <Cargado carga={carga}>
        {([personas, invitaciones, grupos]) => {
          const docentes = personas.filter((p) => p.rol === 'docente');
          const lista = asignables(docentes, invitaciones);
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
                  <ListaInvitaciones items={invitaciones} sinRed={sinRed} alCambiar={carga.recargar} puedeCancelar={() => true} />
                </Panel>
              )}

              <Panel titulo="Grupos" filas>
                {grupos.length === 0 ? (
                  <div style={{ padding: 'var(--e-4)' }}>
                    <Vacio titulo="Todavía no hay grupos" texto="Cree el primero y asígnelo a un docente que ya haya aceptado su invitación." />
                  </div>
                ) : (
                  <ul className="lista">
                    {grupos.map((g) => (
                      <FilaGrupo key={g.id} g={g} docentes={docentes} lista={lista} sinRed={sinRed} alCambiar={carga.recargar} />
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel titulo="Crear grupo">
                <FormGrupo lista={lista} sinRed={sinRed} alListo={carga.recargar} />
              </Panel>
            </>
          );
        }}
      </Cargado>
    </>
  );
}

function FilaGrupo({ g, docentes, lista, sinRed, alCambiar }: { g: Grupo; docentes: Persona[]; lista: Persona[]; sinRed: boolean; alCambiar: () => void }) {
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

  // El docente actual va siempre en la lista para que el selector lo muestre, aunque ya no se pueda asignar.
  const opciones = [...(actual && !lista.some((d) => d.id === actual.id) ? [actual] : []), ...lista].map((d) => ({ valor: d.id, etiqueta: d.activo ? d.nombre : `${d.nombre} (desactivado)` }));

  return (
    <li className="item">
      <div className="item__texto">
        <span>
          {g.nombre} <span className="meta">· {g.grado}</span>
        </span>
        <span className="meta">Docente: {actual ? actual.nombre : 'sin asignar'}{actual && !actual.activo ? ' (desactivado: asigne a otro docente)' : ''}</span>
        <p className={`mensaje ${aviso?.ok ? 'mensaje--ok' : 'mensaje--error'}`} role={aviso?.ok ? 'status' : 'alert'}>
          {aviso?.texto}
        </p>
      </div>
      <div className="item__acciones">
        <CampoOpciones id={`doc-${g.id}`} etiqueta="Cambiar docente" valor={g.docente_id} opciones={opciones} alCambiar={(v) => v !== g.docente_id && void correr(() => asignarDocente(g.id, v), 'Docente cambiado.')} />
        <Confirmar etiqueta="Renovar código" pregunta="¿Renovar el código?" si="Sí, renovar" disabled={sinRed || ocupado} alConfirmar={() => void correr(() => renovarCodigo(g.id), 'Código renovado. El docente ve el nuevo en su grupo; los niños que ya entraron siguen dentro.')} />
      </div>
    </li>
  );
}

function FormGrupo({ lista, sinRed, alListo }: { lista: Persona[]; sinRed: boolean; alListo: () => void }) {
  const [nombre, setNombre] = useState('');
  const [grado, setGrado] = useState('3°');
  const [docente, setDocente] = useState('');
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
      await crearGrupo({ nombre, grado, docente });
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
      <Boton variante="primario" tipo="submit" disabled={enviando || sinRed}>
        {enviando ? 'Creando…' : 'Crear grupo'}
      </Boton>
      <p className={`mensaje ${resultado?.ok ? 'mensaje--ok' : 'mensaje--error'}`} role={resultado?.ok ? 'status' : 'alert'}>
        {resultado?.texto}
      </p>
    </form>
  );
}
