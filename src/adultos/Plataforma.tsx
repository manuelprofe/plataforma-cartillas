// Dueño (/plataforma): colegios, cartillas (publicar, ocultar y habilitar por colegio), personas e
// invitaciones (esqueleto §3.2).
import { IdentidadColegio } from './Identidad';
import { personajeDeMateria } from '../marca';
import { useState, type FormEvent } from 'react';
import { navegar } from '../navegacion';
import { Boton, Encabezado, Fila, Panel, Vacio } from './base';
import { Campo, Cargado, Confirmar, FormInvitar, ListaInvitaciones, ListaPersonas, textoAccion, useCarga, useTitulo } from './comun';
import { crearColegio, habilitarCartilla, listarCartillas, listarColegios, listarHabilitadas, listarInvitaciones, listarPersonas, listarVersiones, nombreCartilla, publicarCartilla, ultimaVersion, type CartillaCat, type Colegio, type Habilitada, type Invitacion, type Persona, type Version } from './datos';

/** Páginas del dueño que tienen datos. Devuelve null si la sección no es de este archivo. */
export function PaginaDueno({ seccion, id, sinRed }: { seccion: string; id?: string; sinRed: boolean }) {
  if (seccion === '') return <Colegios />;
  if (seccion === 'colegios' && id === 'nuevo') return <NuevoColegio sinRed={sinRed} />;
  if (seccion === 'colegios' && id) return <ColegioDueno id={id} sinRed={sinRed} />;
  if (seccion === 'cuentas') return <Cuentas sinRed={sinRed} />;
  if (seccion === 'cartillas') return <Cartillas sinRed={sinRed} />;
  return null;
}

const detalleColegio = (c: Colegio) => [c.municipio, c.convenio].filter(Boolean).join(' · ');

function Colegios() {
  useTitulo('Colegios');
  const carga = useCarga(() => Promise.all([listarColegios(), listarHabilitadas()]), 'colegios');
  return (
    <>
      <div className="cabeza-pagina">
        <Encabezado titulo="Colegios" meta={carga.datos && carga.datos[0].length > 0 ? `${carga.datos[0].length} ${carga.datos[0].length === 1 ? 'colegio' : 'colegios'}` : undefined} />
        {carga.datos && carga.datos[0].length > 0 && (
          <Boton variante="primario" icono="crear" ruta="/plataforma/colegios/nuevo">
            Crear colegio
          </Boton>
        )}
      </div>
      <Cargado carga={carga}>
        {([colegios, habilitadas]) =>
          colegios.length === 0 ? (
            <Panel>
              <Vacio titulo="Todavía no hay colegios" texto="Cree el primero. Después podrá habilitarle la cartilla e invitar a su coordinador por correo.">
                <Boton variante="primario" icono="crear" ruta="/plataforma/colegios/nuevo">
                  Crear colegio
                </Boton>
              </Vacio>
            </Panel>
          ) : (
            <Panel filas>
              {colegios.map((c) => {
                const n = habilitadas.filter((x) => x.colegio_id === c.id).length;
                return <Fila key={c.id} ruta={`/plataforma/colegios/${c.id}`} icono="colegio" titulo={c.nombre} detalle={detalleColegio(c) || undefined} fin={<span className="meta">{n === 0 ? 'Sin cartilla' : n === 1 ? '1 cartilla' : `${n} cartillas`}</span>} />;
              })}
            </Panel>
          )
        }
      </Cargado>
    </>
  );
}

function NuevoColegio({ sinRed }: { sinRed: boolean }) {
  useTitulo('Crear colegio');
  const [nombre, setNombre] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [convenio, setConvenio] = useState('');
  const [error, setError] = useState<string>();
  const [general, setGeneral] = useState<string>();
  const [enviando, setEnviando] = useState(false);

  const alEnviar = async (e: FormEvent) => {
    e.preventDefault();
    const malo = nombre.trim() ? undefined : 'Escriba el nombre del colegio.';
    setError(malo);
    setGeneral(undefined);
    if (malo) return;
    setEnviando(true);
    try {
      const c = await crearColegio({ nombre, municipio, convenio });
      navegar(`/plataforma/colegios/${c.id}`, true);
    } catch (falla) {
      setGeneral(textoAccion(falla));
      setEnviando(false);
    }
  };

  return (
    <>
      <Encabezado titulo="Crear colegio" volver={{ ruta: '/plataforma', etiqueta: 'Colegios' }} />
      <Panel>
        <form className="formulario" onSubmit={alEnviar} noValidate>
          <Campo id="col-nombre" etiqueta="Nombre del colegio" nombre autoComplete="off" valor={nombre} alCambiar={setNombre} error={error} maximo={120} />
          <Campo id="col-municipio" etiqueta="Municipio" nombre autoComplete="off" valor={municipio} alCambiar={setMunicipio} maximo={80} />
          <Campo id="col-convenio" etiqueta="Convenio" nombre autoComplete="off" valor={convenio} alCambiar={setConvenio} maximo={200} />
          <p className="meta">El convenio es opcional: número o nombre del acuerdo con la institución.</p>
          <Boton variante="primario" tipo="submit" disabled={enviando || sinRed}>
            {enviando ? 'Creando…' : 'Crear colegio'}
          </Boton>
          <p className="mensaje mensaje--error" role="alert">
            {general}
          </p>
        </form>
      </Panel>
    </>
  );
}

type DatosColegio = [Colegio[], Habilitada[], Version[], Persona[], Invitacion[], CartillaCat[]];

function ColegioDueno({ id, sinRed }: { id: string; sinRed: boolean }) {
  const carga = useCarga<DatosColegio>(() => Promise.all([listarColegios(), listarHabilitadas(), listarVersiones(), listarPersonas(), listarInvitaciones(), listarCartillas()]), `colegio-${id}`);
  const colegio = carga.datos?.[0].find((c) => c.id === id);
  useTitulo(colegio?.nombre ?? 'Colegio');
  return (
    <Cargado carga={carga}>
      {([colegios, habilitadas, versiones, personas, invitaciones, cartillas]) => {
        const c = colegios.find((x) => x.id === id);
        if (!c)
          return (
            <>
              <Encabezado titulo="Colegio no encontrado" volver={{ ruta: '/plataforma', etiqueta: 'Colegios' }} />
              <Panel>
                <Vacio texto="Este colegio no existe o ya no tiene acceso a él." />
              </Panel>
            </>
          );
        return <FichaColegio c={c} cartillas={cartillas} habilitadas={habilitadas.filter((h) => h.colegio_id === id)} versiones={versiones} personas={personas.filter((p) => p.colegio_id === id)} invitaciones={invitaciones.filter((i) => i.colegio_id === id)} sinRed={sinRed} recargar={carga.recargar} />;
      }}
    </Cargado>
  );
}

function FichaColegio({ c, cartillas, habilitadas, versiones, personas, invitaciones, sinRed, recargar }: { c: Colegio; cartillas: CartillaCat[]; habilitadas: Habilitada[]; versiones: Version[]; personas: Persona[]; invitaciones: Invitacion[]; sinRed: boolean; recargar: () => void }) {
  const [error, setError] = useState<string>();
  const [ocupado, setOcupado] = useState(false);
  const pendientes = invitaciones.filter((i) => !i.aceptada).length;
  // Las publicadas, más las ocultas que este colegio ya usa.
  const visibles = cartillas.filter((k) => k.publicada || habilitadas.some((h) => h.cartilla_id === k.id));

  const habilitar = async (v: Version) => {
    setOcupado(true);
    setError(undefined);
    try {
      await habilitarCartilla(c.id, v);
      recargar();
    } catch (falla) {
      setError(textoAccion(falla));
    } finally {
      setOcupado(false);
    }
  };

  return (
    <>
      <Encabezado titulo={c.nombre} meta={detalleColegio(c) || undefined} volver={{ ruta: '/plataforma', etiqueta: 'Colegios' }} />

      <Panel titulo="Cartillas" filas>
        {visibles.length === 0 ? (
          <div style={{ padding: 'var(--e-4)' }}>
            <Vacio titulo="No hay cartillas publicadas" texto="Publique una cartilla y aquí podrá habilitarla para este colegio.">
              <Boton ruta="/plataforma/cartillas">Ver cartillas</Boton>
            </Vacio>
          </div>
        ) : (
          visibles.map((k) => {
            const h = habilitadas.find((x) => x.cartilla_id === k.id);
            const ultima = ultimaVersion(versiones, k.id);
            const nombre = nombreCartilla(k);
            const detalle = h ? `Versión ${h.version} habilitada: sus docentes la ven` : ultima ? `Versión ${ultima.version} lista para habilitar` : 'Falta cargar una versión';
            const accion =
              ultima && (!h || h.version !== ultima.version) ? (
                <Confirmar principal={!h} etiqueta={h ? `Pasar a ${ultima.version}` : `Habilitar ${ultima.version}`} pregunta={`¿${h ? 'Pasar' : 'Habilitar'} ${k.titulo} ${ultima.version} para ${c.nombre}?`} si={h ? 'Sí, pasar' : 'Sí, habilitar'} disabled={sinRed || ocupado} alConfirmar={() => void habilitar(ultima)} />
              ) : undefined;
            return <Fila key={k.id} icono="cartillas" personaje={personajeDeMateria(k.materia)} titulo={nombre} detalle={detalle} fin={accion} />;
          })
        )}
        {error && (
          <p className="mensaje mensaje--error" role="alert" style={{ padding: '0 var(--e-4)' }}>
            {error}
          </p>
        )}
      </Panel>

      <IdentidadColegio colegioId={c.id} sinRed={sinRed} />

      <Panel titulo="Invitar por correo">
        <p className="sec">La persona recibe un enlace, crea su contraseña y entra a la parte que le corresponde.</p>
        <FormInvitar colegioId={c.id} roles={['coordinador', 'docente']} sinRed={sinRed} alListo={recargar} />
      </Panel>

      <Panel titulo="Personas" filas>
        {personas.length === 0 ? (
          <div style={{ padding: 'var(--e-4)' }}>
            <Vacio titulo="Todavía no hay personas" texto="Invite al coordinador o rector de este colegio; cuando acepte, aparece aquí." />
          </div>
        ) : (
          <ListaPersonas items={[...personas].sort((a, b) => Number(b.rol === 'coordinador') - Number(a.rol === 'coordinador'))} sinRed={sinRed} alCambiar={recargar} puedeCambiar={(p) => p.rol !== 'dueno'} />
        )}
      </Panel>

      <Panel titulo={pendientes ? `Invitaciones (${pendientes} sin aceptar)` : 'Invitaciones'} filas>
        {invitaciones.length === 0 ? (
          <div style={{ padding: 'var(--e-4)' }}>
            <Vacio texto="Todavía no ha enviado invitaciones a este colegio." />
          </div>
        ) : (
          <ListaInvitaciones items={invitaciones} sinRed={sinRed} alCambiar={recargar} />
        )}
      </Panel>
    </>
  );
}

/** Todas las invitaciones de todos los colegios. */
function Cuentas({ sinRed }: { sinRed: boolean }) {
  useTitulo('Cuentas');
  const carga = useCarga(() => Promise.all([listarColegios(), listarInvitaciones()]), 'cuentas');
  return (
    <>
      <Encabezado titulo="Cuentas" meta="Invitaciones de todos los colegios" />
      <Cargado carga={carga}>
        {([colegios, invitaciones]) => (
          <Panel filas>
            {invitaciones.length === 0 ? (
              <div style={{ padding: 'var(--e-4)' }}>
                <Vacio titulo="Todavía no hay invitaciones" texto="Entre a un colegio para invitar a su coordinador o a un docente.">
                  <Boton ruta="/plataforma">Ver colegios</Boton>
                </Vacio>
              </div>
            ) : (
              <ListaInvitaciones items={invitaciones} colegios={colegios} sinRed={sinRed} alCambiar={carga.recargar} />
            )}
          </Panel>
        )}
      </Cargado>
    </>
  );
}

// ---------------------------------------------------------------- Cartillas

/** Catálogo: cada cartilla con su versión, en cuántos colegios está y si está publicada. */
function Cartillas({ sinRed }: { sinRed: boolean }) {
  useTitulo('Cartillas');
  const carga = useCarga(() => Promise.all([listarCartillas(), listarVersiones(), listarHabilitadas()]), 'cartillas');
  const [error, setError] = useState<string>();
  const [ocupado, setOcupado] = useState(false);

  const cambiar = async (k: CartillaCat, publicada: boolean) => {
    setOcupado(true);
    setError(undefined);
    try {
      await publicarCartilla(k.id, publicada);
      carga.recargar();
    } catch (falla) {
      setError(textoAccion(falla));
    } finally {
      setOcupado(false);
    }
  };

  const meta = carga.datos ? `${carga.datos[0].length} ${carga.datos[0].length === 1 ? 'cartilla' : 'cartillas'} · ${((n) => (n === 1 ? '1 publicada' : `${n} publicadas`))(carga.datos[0].filter((k) => k.publicada).length)}` : undefined;
  return (
    <>
      <Encabezado titulo="Cartillas" meta={meta} />
      <Cargado carga={carga}>
        {([cartillas, versiones, habilitadas]) => (
          <>
            <Panel filas>
              {cartillas.length === 0 ? (
                <div style={{ padding: 'var(--e-4)' }}>
                  <Vacio titulo="Todavía no hay cartillas" texto="Una cartilla aparece aquí cuando su paquete se carga en la base de datos." />
                </div>
              ) : (
                cartillas.map((k) => {
                  const ultima = ultimaVersion(versiones, k.id);
                  const colegios = habilitadas.filter((h) => h.cartilla_id === k.id).length;
                  const detalle = [ultima ? `Versión ${ultima.version}` : 'Sin versión cargada', colegios === 1 ? 'en 1 colegio' : `en ${colegios} colegios`].join(' · ');
                  const accion = k.publicada ? (
                    <Confirmar etiqueta="Ocultar" pregunta={`¿Ocultar ${k.titulo}? Los colegios que ya la tienen la siguen usando.`} si="Sí, ocultar" disabled={sinRed || ocupado} alConfirmar={() => void cambiar(k, false)} />
                  ) : (
                    <Confirmar principal etiqueta="Publicar" pregunta={`¿Publicar ${k.titulo}? Podrá habilitarla para cada colegio.`} si="Sí, publicar" disabled={sinRed || ocupado || !ultima} alConfirmar={() => void cambiar(k, true)} />
                  );
                  return (
                    <Fila
                      key={k.id}
                      icono="cartillas"
                      personaje={personajeDeMateria(k.materia)}
                      titulo={nombreCartilla(k)}
                      detalle={
                        <>
                          <span className={k.publicada ? 'estado-cartilla estado-cartilla--publicada' : 'estado-cartilla'}>{k.publicada ? 'Publicada' : 'Oculta'}</span> · {detalle}
                        </>
                      }
                      fin={accion}
                    />
                  );
                })
              )}
              {error && (
                <p className="mensaje mensaje--error" role="alert" style={{ padding: '0 var(--e-4)' }}>
                  {error}
                </p>
              )}
            </Panel>
            <p className="meta">Publicada: se puede habilitar para cualquier colegio desde su ficha. Oculta: no se ofrece a más colegios, y los que ya la tienen la siguen usando.</p>
          </>
        )}
      </Cargado>
    </>
  );
}
