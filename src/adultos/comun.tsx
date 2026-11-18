// Piezas compartidas por las pantallas de adultos: formularios, carga de datos, invitaciones y
// personas. Las usan la entrada (Adultos.tsx), el dueño (Plataforma.tsx) y el coordinador (Colegio.tsx).
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Boton, Panel, Vacio } from './base';
import { ErrorCuenta } from './cuenta';
import { cancelarInvitacion, cambiarActivo, estadoInvitacion, invitar, reenviar, type Colegio, type Invitacion, type Persona } from './datos';

/** Título de la pestaña del navegador para cada pantalla. */
export function useTitulo(titulo: string) {
  useEffect(() => {
    document.title = `${titulo} · English Adventure Quest`;
  }, [titulo]);
}

export const correoValido = (c: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.trim());

/** Texto para el adulto cuando una acción sobre los datos falla. */
export function textoAccion(e: unknown): string {
  if (e instanceof ErrorCuenta) {
    if (e.falla === 'red') return 'Sin conexión. Intente de nuevo cuando vuelva la señal.';
    if (e.falla === 'credenciales') return 'Su sesión venció. Salga y vuelva a entrar.';
    if (e.falla === 'sin-config') return 'Esta copia de la plataforma no está conectada a Supabase.';
    if (e.falla === 'otro' && e.message && e.message !== 'otro' && !/^HTTP \d+$/.test(e.message)) return e.message;
  }
  return 'No se pudo completar. Intente de nuevo en un momento.';
}

const FECHA = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
export const fecha = (iso: string) => FECHA.format(new Date(iso));

export const NOMBRE_ROL_PERSONA = { dueno: 'Dueño', coordinador: 'Coordinador o rector', docente: 'Docente' } as const;

// ---------------------------------------------------------------- Carga de datos

interface Carga<T> {
  datos?: T;
  error?: string;
  cargando: boolean;
  recargar: () => void;
}

/** Carga datos al montar y cuando cambia `clave`; `recargar` los pide otra vez sin vaciar la pantalla. */
export function useCarga<T>(cargar: () => Promise<T>, clave: string): Carga<T> {
  const [estado, setEstado] = useState<{ datos?: T; error?: string; cargando: boolean }>({ cargando: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    let vivo = true;
    cargar().then(
      (datos) => vivo && setEstado({ datos, cargando: false }),
      (e) => vivo && setEstado((previo) => ({ datos: previo.datos, error: textoAccion(e), cargando: false })),
    );
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, n]);
  return { ...estado, recargar: () => setN((v) => v + 1) };
}

/** Muestra "Cargando", el error con reintento o, cuando hay datos, el contenido. */
export function Cargado<T>({ carga, children }: { carga: Carga<T>; children: (datos: T) => ReactNode }) {
  if (carga.datos === undefined) {
    if (carga.cargando) return <p className="sec" role="status">Cargando…</p>;
    return (
      <Panel>
        <Vacio titulo="No se pudo cargar" texto={carga.error ?? 'Intente de nuevo.'}>
          <Boton onClick={carga.recargar}>Reintentar</Boton>
        </Vacio>
      </Panel>
    );
  }
  return (
    <>
      {carga.error && (
        <p className="nota" role="alert">
          {carga.error} <Boton variante="texto" onClick={carga.recargar}>Reintentar</Boton>
        </p>
      )}
      {children(carga.datos)}
    </>
  );
}

// ---------------------------------------------------------------- Formularios

/** Campo de texto con etiqueta y su mensaje de error debajo. */
export function Campo(props: { id: string; etiqueta: string; tipo?: 'email' | 'password' | 'text'; valor: string; alCambiar: (v: string) => void; error?: string; autoComplete: string; ver?: { activo: boolean; alternar: () => void }; nombre?: boolean; maximo?: number }) {
  const idError = `${props.id}-error`;
  const entrada = (
    <input
      id={props.id}
      type={props.ver ? (props.ver.activo ? 'text' : 'password') : (props.tipo ?? 'text')}
      inputMode={props.tipo === 'email' ? 'email' : undefined}
      autoComplete={props.autoComplete}
      autoCapitalize={props.nombre ? 'words' : 'none'}
      spellCheck={props.nombre ? undefined : false}
      maxLength={props.maximo}
      value={props.valor}
      onChange={(e) => props.alCambiar(e.target.value)}
      aria-invalid={props.error ? true : undefined}
      aria-describedby={props.error ? idError : undefined}
    />
  );
  return (
    <div className="campo">
      <label htmlFor={props.id}>{props.etiqueta}</label>
      {props.ver ? (
        <div className="campo__fila">
          {entrada}
          <Boton onClick={props.ver.alternar}>{props.ver.activo ? 'Ocultar' : 'Ver'}</Boton>
        </div>
      ) : (
        entrada
      )}
      <p id={idError} className="mensaje mensaje--error">
        {props.error}
      </p>
    </div>
  );
}

export function CampoOpciones(props: { id: string; etiqueta: string; valor: string; alCambiar: (v: string) => void; opciones: { valor: string; etiqueta: string }[]; vacio?: string; error?: string; disabled?: boolean }) {
  const idError = `${props.id}-error`;
  return (
    <div className="campo">
      <label htmlFor={props.id}>{props.etiqueta}</label>
      <select id={props.id} value={props.valor} disabled={props.disabled} onChange={(e) => props.alCambiar(e.target.value)} aria-invalid={props.error ? true : undefined} aria-describedby={props.error ? idError : undefined}>
        {props.vacio !== undefined && <option value="">{props.vacio}</option>}
        {props.opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </select>
      <p id={idError} className="mensaje mensaje--error">
        {props.error}
      </p>
    </div>
  );
}

/** Botón que pide confirmar antes de una acción que no se puede deshacer. */
export function Confirmar({ etiqueta, pregunta, si, alConfirmar, disabled, principal }: { etiqueta: string; pregunta: string; si: string; alConfirmar: () => void; disabled?: boolean; principal?: boolean }) {
  const [abierto, setAbierto] = useState(false);
  if (!abierto)
    return (
      <Boton variante={principal ? 'primario' : 'texto'} onClick={() => setAbierto(true)} disabled={disabled}>
        {etiqueta}
      </Boton>
    );
  return (
    <span className="pregunta" role="group" aria-label={pregunta}>
      <span>{pregunta}</span>
      <Boton
        onClick={() => {
          setAbierto(false);
          alConfirmar();
        }}
      >
        {si}
      </Boton>
      <Boton variante="texto" onClick={() => setAbierto(false)}>
        No
      </Boton>
    </span>
  );
}

// ---------------------------------------------------------------- Invitar

/** Formulario de invitación por correo. El dueño elige el rol; el coordinador solo invita docentes. */
export function FormInvitar({ colegioId, roles, sinRed, alListo }: { colegioId?: string; roles: ('coordinador' | 'docente')[]; sinRed: boolean; alListo: () => void }) {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [rol, setRol] = useState<'coordinador' | 'docente'>(roles[0]);
  const [errores, setErrores] = useState<{ nombre?: string; correo?: string }>({});
  const [resultado, setResultado] = useState<{ ok: boolean; texto: string }>();
  const [enviando, setEnviando] = useState(false);

  const alEnviar = async (e: FormEvent) => {
    e.preventDefault();
    const nuevos = {
      nombre: nombre.trim() ? undefined : 'Escriba el nombre de la persona.',
      correo: !correo.trim() ? 'Escriba el correo.' : !correoValido(correo) ? 'Revise el correo: debe ser como nombre@colegio.edu.co.' : undefined,
    };
    setErrores(nuevos);
    setResultado(undefined);
    if (nuevos.nombre || nuevos.correo) return;
    setEnviando(true);
    try {
      const estado = await invitar({ correo: correo.trim(), nombre: nombre.trim(), rol, colegio_id: colegioId });
      setResultado({
        ok: true,
        texto:
          estado === 'ya-registrado'
            ? `${correo.trim()} ya tiene cuenta. La invitación quedó registrada y entra con "Olvidé mi contraseña".`
            : `Invitación enviada a ${correo.trim()}. El enlace dura 14 días; si no llega, pida revisar el correo no deseado.`,
      });
      setNombre('');
      setCorreo('');
      alListo();
    } catch (falla) {
      setResultado({ ok: false, texto: textoAccion(falla) });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form className="formulario" onSubmit={alEnviar} noValidate>
      <Campo id="inv-nombre" etiqueta="Nombre" nombre autoComplete="off" valor={nombre} alCambiar={setNombre} error={errores.nombre} maximo={80} />
      <Campo id="inv-correo" etiqueta="Correo" tipo="email" autoComplete="off" valor={correo} alCambiar={setCorreo} error={errores.correo} />
      {roles.length > 1 && (
        <CampoOpciones
          id="inv-rol"
          etiqueta="Rol"
          valor={rol}
          alCambiar={(v) => setRol(v === 'coordinador' ? 'coordinador' : 'docente')}
          opciones={roles.map((r) => ({ valor: r, etiqueta: r === 'coordinador' ? 'Coordinador o rector' : 'Docente' }))}
        />
      )}
      <Boton variante="primario" tipo="submit" disabled={enviando || sinRed}>
        {enviando ? 'Enviando…' : 'Enviar invitación'}
      </Boton>
      <p className={`mensaje ${resultado?.ok ? 'mensaje--ok' : 'mensaje--error'}`} role={resultado?.ok ? 'status' : 'alert'}>
        {resultado?.texto}
      </p>
    </form>
  );
}

const ETIQUETA_ESTADO = { aceptada: 'Aceptada', pendiente: 'Pendiente', vencida: 'Vencida' } as const;

/** Invitaciones con su estado; las que no se aceptaron se reenvían o se cancelan. */
export function ListaInvitaciones({ items, colegios, sinRed, alCambiar, puedeCancelar = () => true }: { items: Invitacion[]; colegios?: Colegio[]; sinRed: boolean; alCambiar: () => void; puedeCancelar?: (i: Invitacion) => boolean }) {
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string }>();
  const [ocupada, setOcupada] = useState<string>();

  const accion = async (i: Invitacion, que: () => Promise<unknown>, textoOk: string) => {
    setOcupada(i.id);
    setAviso(undefined);
    try {
      await que();
      setAviso({ ok: true, texto: textoOk });
      alCambiar();
    } catch (falla) {
      setAviso({ ok: false, texto: textoAccion(falla) });
    } finally {
      setOcupada(undefined);
    }
  };

  return (
    <>
      <ul className="lista">
        {items.map((i) => {
          const estado = estadoInvitacion(i);
          const colegio = colegios?.find((c) => c.id === i.colegio_id)?.nombre;
          return (
            <li key={i.id} className="item">
              <div className="item__texto">
                <span className="item__nombre">
                  {i.nombre}
                  <span className={`etiqueta ${estado === 'aceptada' ? 'etiqueta--ok' : estado === 'pendiente' ? 'etiqueta--aviso' : ''}`}>{ETIQUETA_ESTADO[estado]}</span>
                </span>
                <span className="meta">
                  {i.correo} · {NOMBRE_ROL_PERSONA[i.rol]}
                  {colegio ? ` · ${colegio}` : ''} · {estado === 'aceptada' ? `aceptó el ${fecha(i.aceptada!)}` : `enviada el ${fecha(i.creado)}`}
                </span>
                {estado !== 'aceptada' && !puedeCancelar(i) && <span className="meta">Esta invitación la envió el administrador de la plataforma; pídale que la gestione.</span>}
              </div>
              {estado !== 'aceptada' && puedeCancelar(i) && (
                <div className="item__acciones">
                  <Boton onClick={() => void accion(i, () => reenviar(i), `Invitación reenviada a ${i.correo}.`)} disabled={sinRed || ocupada === i.id}>
                    Reenviar
                  </Boton>
                  <Confirmar etiqueta="Cancelar invitación" pregunta="¿Cancelar la invitación?" si="Sí, cancelar" disabled={sinRed || ocupada === i.id} alConfirmar={() => void accion(i, () => cancelarInvitacion(i.id), `Invitación a ${i.correo} cancelada.`)} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p className={`mensaje ${aviso?.ok ? 'mensaje--ok' : 'mensaje--error'}`} role={aviso?.ok ? 'status' : 'alert'} style={{ padding: '0 var(--e-4) var(--e-3)' }}>
        {aviso?.texto}
      </p>
    </>
  );
}

// ---------------------------------------------------------------- Personas

/** Personas del colegio, con el botón de desactivar o activar. `puedeCambiar` deja fuera al dueño y a quien no corresponda. */
export function ListaPersonas({ items, sinRed, alCambiar, puedeCambiar }: { items: Persona[]; sinRed: boolean; alCambiar: () => void; puedeCambiar: (p: Persona) => boolean }) {
  const [aviso, setAviso] = useState<string>();
  const [ocupada, setOcupada] = useState<string>();

  const cambiar = async (p: Persona) => {
    setOcupada(p.id);
    setAviso(undefined);
    try {
      await cambiarActivo(p.id, !p.activo);
      alCambiar();
    } catch (falla) {
      setAviso(textoAccion(falla));
    } finally {
      setOcupada(undefined);
    }
  };

  return (
    <>
      <ul className="lista">
        {items.map((p) => (
          <li key={p.id} className="item">
            <div className="item__texto">
              <span className="item__nombre">
                {p.nombre}
                {!p.activo && <span className="etiqueta">Desactivado</span>}
              </span>
              <span className="meta">
                {p.correo ?? 'Sin correo'} · {NOMBRE_ROL_PERSONA[p.rol]}
              </span>
            </div>
            {puedeCambiar(p) && (
              <div className="item__acciones">
                {p.activo ? (
                  <Confirmar etiqueta="Desactivar" pregunta={p.rol === 'coordinador' ? '¿Quitarle el acceso? Sus docentes y grupos quedan sin quien los administre.' : '¿Quitarle el acceso?'} si="Sí, desactivar" disabled={sinRed || ocupada === p.id} alConfirmar={() => void cambiar(p)} />
                ) : (
                  <Boton onClick={() => void cambiar(p)} disabled={sinRed || ocupada === p.id}>
                    Activar de nuevo
                  </Boton>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="mensaje mensaje--error" role="alert" style={{ padding: '0 var(--e-4) var(--e-3)' }}>
        {aviso}
      </p>
    </>
  );
}
