// Docente (esqueleto §2, tanda 4): Inicio, Mis grupos, un Grupo (código, niños, autorización, PIN,
// personaje, retirar) y Dar estrellas. Lo imprimible vive en Imprimibles.tsx.
// Inicio y Mis grupos nunca muestran apodos; solo el grupo y las estrellas los muestran, y ambos
// van detrás de la cortina si se proyectó hace poco desde este aparato.
import { useEffect, useRef, useState, type FormEvent } from 'react';
import './docente.css';
import { navegar } from '../navegacion';
import { Boton, Encabezado, Enlace, Fila, Hueco, Panel, Farol, Vacio } from './base';
import { Campo, CampoOpciones, Cargado, Confirmar, textoAccion, useCarga, useTitulo } from './comun';
import { agregarNinos, apodosDe, cambiarPin, cargarGrupos, cargarNinos, cargarPaquete, crearMiGrupo, GRADOS, hoyCo, nombreColegio, ponerAutorizacion, ponerPersonaje, reconocidosHoy, retirar, type GrupoDoc, type Nino, type Paquete } from './docente';
import { Cara, ConCortina, fechaCorta, useAhora } from './docenteComun';
import { darEstrellas, deshacer, olvidarRechazo, useCola, VALOR, type Motivo } from './estrellas';
import { Icono } from './Icono';
import { Tarjetas, ListaEstrellas } from './Imprimibles';
import { cargarIndice, cargarTema } from '../materiales/datos';

const SIN_INTERNET = 'Necesita internet';

/** El primer tema con materiales y cómo se llaman sus dos clases (texto del paquete). */
async function primerTema() {
  const indice = await cargarIndice();
  const e = indice.temas.find((t) => t.estado === 'listo');
  if (!e) throw new Error('sin temas');
  const doc = await cargarTema(e);
  return { id: e.id, nombre: e.nombre, titulo: e.titulo, clases: doc.materiales.filter((m) => m.tipo === 'planeador').map((m) => m.titulo).join('. ') };
}

const hoyEscrito = () => {
  const t = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const rutaGrupo = (id: string, sub = '') => `/docente/grupos/${encodeURIComponent(id)}${sub}`;

// ---------------------------------------------------------------- Inicio

export function DocenteInicio({ colegioId }: { colegioId: string | null }) {
  useTitulo('Inicio');
  const grupos = useCarga(cargarGrupos, 'grupos');
  const colegio = useCarga(() => nombreColegio(colegioId).catch(() => null), 'colegio');
  const cola = useCola();
  const primero = useCarga(primerTema, 'primer-tema');
  return (
    <>
      <Encabezado titulo="Inicio" meta={colegio.datos ? `${hoyEscrito()} · ${colegio.datos}` : hoyEscrito()} />
      <Cargado carga={grupos}>
        {(lista) =>
          lista.length === 0 ? (
            <>
              <Panel>
                <Vacio titulo="Todavía no tiene grupos" texto="Cree su grupo y la plataforma le da el código que los niños usan en casa. Después agrega los apodos.">
                  <Boton variante="primario" icono="crear" ruta="/docente/grupos">
                    Crear un grupo
                  </Boton>
                </Vacio>
              </Panel>
              <Panel titulo="Mientras tanto puede proyectar">
                <p className="sec">Los juegos y las láminas no necesitan grupo ni cuenta.</p>
                <div>
                  <Boton icono="proyectar" ruta="/proyectar">
                    Abrir proyectar
                  </Boton>
                </div>
              </Panel>
            </>
          ) : (
            <>
              <Panel
                titulo={`Próxima clase · ${lista[0].nombre}`}
                fin={
                  <span className="faroles">
                    <Farol estado="apagado" de="Clase 1" />
                    <Farol estado="apagado" de="Clase 2" />
                  </span>
                }
              >
                {primero.datos ? (
                  <>
                    <p>
                      <strong>{primero.datos.nombre}</strong> <span className="meta">· {primero.datos.titulo}</span>
                    </p>
                    <p className="sec">{primero.datos.clases}</p>
                    <div className="atajos">
                      <Boton variante="primario" icono="proyectar" ruta={`/proyectar/${primero.datos.id}`}>
                        Proyectar {primero.datos.nombre.toLowerCase()}
                      </Boton>
                      <Boton icono="planear" ruta={`/docente/planear/${primero.datos.id}`}>
                        Ver el planeador
                      </Boton>
                    </div>
                    <p className="meta">Empiece por el primer tema. Las fechas por grupo llegan con el plan de cada grupo.</p>
                  </>
                ) : (
                  <Hueco titulo="Aquí irá su próxima clase" texto="El tema, si es la clase 1 o la 2, y el planeador." />
                )}
              </Panel>
              <div className="atajos atajos--cuatro">
                <Boton variante="primario" icono="proyectar" ruta="/proyectar">
                  Proyectar
                </Boton>
                <Boton icono="estrella" ruta={rutaGrupo(lista[0].id, '/estrellas')}>
                  Dar estrellas
                </Boton>
                <Boton icono="lista" ruta={rutaGrupo(lista[0].id)}>
                  Lista de {lista[0].nombre}
                </Boton>
                <Boton icono="imprimir" ruta={rutaGrupo(lista[0].id, '/lista')}>
                  Imprimir lista
                </Boton>
              </div>
              {cola.porSubir > 0 && (
                <Panel filas>
                  <Fila icono="subir" titulo={`${cola.porSubir} ${cola.porSubir === 1 ? 'estrella' : 'estrellas'} por subir`} detalle="Suben solas cuando hay señal" />
                </Panel>
              )}
              {cola.rechazo && <Rechazo texto={cola.rechazo} />}
              {lista.length > 1 && (
                <p className="meta otros-grupos">
                  Otros grupos:{' '}
                  {lista.slice(1).map((g, i) => (
                    <span key={g.id}>
                      {i > 0 && ', '}
                      <Enlace ruta={rutaGrupo(g.id)}>{g.nombre}</Enlace>
                    </span>
                  ))}
                </p>
              )}
            </>
          )
        }
      </Cargado>
      <Panel titulo="Primeros pasos" filas>
        <Fila ruta="/docente/biblioteca" icono="documento" titulo="Biblioteca" detalle="La historia, recursos por tema, actividades y fundamentos" />
        <a className="fila" href="/guias/guia-docentes.pdf" target="_blank" rel="noopener">
          <Icono nombre="descargar" />
          <span className="fila__texto">
            <span>Guía rápida para docentes</span>
            <span className="meta">PDF de dos páginas</span>
          </span>
        </a>
      </Panel>
    </>
  );
}

function Rechazo({ texto }: { texto: string }) {
  return (
    <p className="nota" role="alert">
      {texto} <Boton variante="texto" onClick={olvidarRechazo}>Entendido</Boton>
    </p>
  );
}

// ---------------------------------------------------------------- Mis grupos

export function MisGrupos({ sinRed }: { sinRed: boolean }) {
  useTitulo('Mis grupos');
  const grupos = useCarga(cargarGrupos, 'grupos');
  return (
    <>
      <Encabezado titulo="Mis grupos" />
      <Cargado carga={grupos}>
        {(lista) => (
          <>
            {lista.length === 0 ? (
              <Panel>
                <Vacio titulo="Todavía no tiene grupos" texto="Cree su grupo y la plataforma le da el código que los niños usan en casa. Después agrega los apodos. Si su coordinador ya debía asignarle uno, pídaselo a él y aparecerá aquí." />
              </Panel>
            ) : (
              <Panel filas>
                {lista.map((g) => (
                  <Fila key={g.id} ruta={rutaGrupo(g.id)} titulo={g.nombre} detalle={`${g.grado === 'Preescolar' ? g.grado : `Grado ${g.grado}`} · ${g.ninos} ${g.ninos === 1 ? 'niño' : 'niños'}`} fin={<span className="codigo-chico">{g.codigo}</span>} />
                ))}
              </Panel>
            )}
            <Panel titulo="Crear un grupo">
              <FormGrupo sinRed={sinRed} />
            </Panel>
          </>
        )}
      </Cargado>
    </>
  );
}

function FormGrupo({ sinRed }: { sinRed: boolean }) {
  const [nombre, setNombre] = useState('');
  const [grado, setGrado] = useState('3°');
  const [error, setError] = useState<string>();
  const [ocupado, setOcupado] = useState(false);
  const alEnviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return setError('Escriba el nombre del grupo, por ejemplo 3B.');
    setError(undefined);
    setOcupado(true);
    try {
      const g = await crearMiGrupo(nombre, grado);
      navegar(rutaGrupo(g.id));
    } catch (falla) {
      setError(textoAccion(falla));
      setOcupado(false);
    }
  };
  return (
    <form className="formulario" onSubmit={alEnviar} noValidate>
      <Campo id="grupo-nombre" etiqueta="Nombre del grupo" autoComplete="off" nombre valor={nombre} alCambiar={setNombre} maximo={20} />
      <CampoOpciones id="grupo-grado" etiqueta="Grado" valor={grado} alCambiar={setGrado} opciones={GRADOS} />
      <Boton variante="primario" tipo="submit" icono="crear" disabled={ocupado || sinRed}>
        {sinRed ? SIN_INTERNET : ocupado ? 'Creando…' : 'Crear grupo'}
      </Boton>
      <p className="mensaje mensaje--error" role="alert">
        {error}
      </p>
    </form>
  );
}

// ---------------------------------------------------------------- Un grupo

/** Rutas bajo /docente/grupos/:g: el grupo, sus estrellas y lo imprimible. */
export function PaginaGrupo({ resto, sinRed }: { resto: string[]; sinRed: boolean }) {
  const id = decodeURIComponent(resto[0]);
  const sub = resto[1] ?? '';
  const grupos = useCarga(cargarGrupos, 'grupos');
  const paquete = useCarga(cargarPaquete, 'paquete');
  const ninos = useCarga(() => cargarNinos(id), `ninos-${id}`);
  const grupo = grupos.datos?.find((g) => g.id === id);
  useTitulo(grupo ? `Grupo ${grupo.nombre}` : 'Grupo');

  if (grupos.datos && !grupo)
    return (
      <>
        <Encabezado titulo="Grupo" volver={{ ruta: '/docente/grupos', etiqueta: 'Mis grupos' }} />
        <Panel>
          <Vacio titulo="No se encontró este grupo" texto="Puede que ya no sea suyo. Vuelva a Mis grupos." />
        </Panel>
      </>
    );
  if (!grupo || !paquete.datos || !ninos.datos)
    return (
      <>
        <Encabezado titulo="Grupo" volver={{ ruta: '/docente/grupos', etiqueta: 'Mis grupos' }} />
        <Cargado carga={(!grupo ? grupos : !paquete.datos ? paquete : ninos) as typeof grupos}>{() => null}</Cargado>
      </>
    );
  return (
    <ConCortina>
      {sub === 'estrellas' ? (
        <Estrellas grupo={grupo} ninos={ninos.datos} paquete={paquete.datos} />
      ) : sub === 'tarjetas' ? (
        <Tarjetas grupo={grupo} ninos={ninos.datos} paquete={paquete.datos} solo={resto[2]} sinRed={sinRed} />
      ) : sub === 'lista' ? (
        <ListaEstrellas grupo={grupo} ninos={ninos.datos} />
      ) : (
        <Grupo grupo={grupo} ninos={ninos.datos} paquete={paquete.datos} sinRed={sinRed} recargar={() => (ninos.recargar(), grupos.recargar())} />
      )}
    </ConCortina>
  );
}

function Grupo({ grupo, ninos, paquete, sinRed, recargar }: { grupo: GrupoDoc; ninos: Nino[]; paquete: Paquete; sinRed: boolean; recargar: () => void }) {
  const campo = useRef<HTMLTextAreaElement>(null);
  const sinAutorizar = ninos.filter((n) => !n.autorizacion).length;
  return (
    <>
      <Encabezado titulo={`Grupo ${grupo.nombre}`} meta={`${grupo.grado === 'Preescolar' ? grupo.grado : `Grado ${grupo.grado}`} · ${ninos.length} ${ninos.length === 1 ? 'niño' : 'niños'}`} volver={{ ruta: '/docente/grupos', etiqueta: 'Mis grupos' }} />
      <Panel titulo="Código del grupo">
        <p className="codigo-grande" aria-label={`Código ${grupo.codigo.split('').join(' ')}`}>
          {grupo.codigo}
        </p>
        <p className="meta">Va en la tarjeta de cada niño y en su QR. Solo muestra a los niños con autorización; para entrar hace falta además su PIN.</p>
        <div className="acciones">
          <Boton variante="primario" icono="estrella" ruta={rutaGrupo(grupo.id, '/estrellas')}>
            Dar estrellas
          </Boton>
          <Boton icono="imprimir" ruta={rutaGrupo(grupo.id, '/tarjetas')}>
            Imprimir tarjetas
          </Boton>
          <Boton icono="imprimir" ruta={rutaGrupo(grupo.id, '/lista')}>
            Imprimir lista
          </Boton>
        </div>
      </Panel>

      <Panel titulo="Niños" filas>
        {ninos.length === 0 ? (
          <div className="panel__relleno">
            <Vacio titulo={`Aquí aparecerán los niños de ${grupo.nombre}`} texto="Escriba solo el apodo o el primer nombre, sin apellidos.">
              <Boton variante="primario" icono="crear" onClick={() => campo.current?.focus()}>
                Agregar niños
              </Boton>
            </Vacio>
          </div>
        ) : (
          <>
            <ul className="lista">
              {ninos.map((n) => (
                <FilaNino key={n.id} n={n} grupo={grupo} paquete={paquete} sinRed={sinRed} alCambiar={recargar} />
              ))}
            </ul>
            {sinAutorizar > 0 && (
              <p className="meta panel__relleno">
                {sinAutorizar === 1 ? 'Un niño no tiene' : `${sinAutorizar} niños no tienen`} la autorización marcada. Sin ella no entra con tarjeta; juega sin cuenta y en clase hace todo igual.
              </p>
            )}
          </>
        )}
      </Panel>

      <Panel titulo="Agregar niños">
        <AgregarNinos grupo={grupo} ninos={ninos} paquete={paquete} sinRed={sinRed} alListo={recargar} campo={campo} />
      </Panel>
    </>
  );
}

function FilaNino({ n, grupo, paquete, sinRed, alCambiar }: { n: Nino; grupo: GrupoDoc; paquete: Paquete; sinRed: boolean; alCambiar: () => void }) {
  const [abierta, setAbierta] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string; imprimir?: boolean }>();

  const hacer = async (que: () => Promise<unknown>, ok?: { texto: string; imprimir?: boolean }) => {
    setOcupado(true);
    setAviso(undefined);
    try {
      await que();
      if (ok) setAviso({ ok: true, ...ok });
      alCambiar();
    } catch (falla) {
      setAviso({ ok: false, texto: textoAccion(falla) });
    } finally {
      setOcupado(false);
    }
  };
  const bloqueado = sinRed || ocupado;
  const id = `n-${n.id}`;

  return (
    <li className="nino">
      <div className="nino__fila">
        <Cara paquete={paquete} avatar={n.avatar} className="cara-d--32" />
        <span className="nino__texto">
          <span className="nino__apodo">{n.apodo}</span>
          <span className={n.autorizacion ? 'meta' : 'meta meta--aviso'}>{n.autorizacion ? `Autorización: ${fechaCorta(n.autorizacion)}` : 'Falta la autorización'}</span>
        </span>
        <label className="casilla" title={sinRed ? SIN_INTERNET : 'Autorización recibida'}>
          <input type="checkbox" checked={Boolean(n.autorizacion)} disabled={bloqueado} aria-label={`Autorización recibida de ${n.apodo}`} onChange={(e) => void hacer(() => ponerAutorizacion(n.id, e.target.checked ? hoyCo() : null))} />
          <span className="casilla__caja" aria-hidden="true">
            <Icono nombre="marca" />
          </span>
        </label>
        <button type="button" className="boton boton--texto nino__mas" aria-expanded={abierta} aria-controls={id} aria-label={`Opciones de ${n.apodo}`} onClick={() => setAbierta(!abierta)}>
          <Icono nombre="mas" />
        </button>
      </div>
      {abierta && (
        <div className="nino__opciones" id={id}>
          {n.autorizacion && (
            <div className="campo">
              <label htmlFor={`${id}-fecha`}>Fecha de la autorización</label>
              <input id={`${id}-fecha`} type="date" value={n.autorizacion} max={hoyCo()} disabled={bloqueado} onChange={(e) => e.target.value && void hacer(() => ponerAutorizacion(n.id, e.target.value))} />
            </div>
          )}
          <fieldset className="personajes">
            <legend>Personaje</legend>
            {paquete.heroes.map((h) => (
              <label key={h.id} className="personaje">
                <input type="radio" name={`${id}-personaje`} checked={n.avatar === h.id} disabled={bloqueado} onChange={() => void hacer(() => ponerPersonaje(n.id, h.id))} />
                <Cara paquete={paquete} avatar={h.id} className="cara-d--40" />
                <span>{h.nombre}</span>
              </label>
            ))}
          </fieldset>
          <div className="item__acciones">
            <Boton disabled={bloqueado} onClick={() => void hacer(() => cambiarPin(n.id), { texto: 'PIN nuevo guardado. Se ve solo en la tarjeta impresa.', imprimir: true })}>
              Cambiar PIN
            </Boton>
            <Confirmar etiqueta="Retirar del grupo" pregunta={`¿Retirar a ${n.apodo}? Se borran su progreso y sus estrellas.`} si="Sí, retirar" disabled={bloqueado} alConfirmar={() => void hacer(() => retirar(n.id))} />
          </div>
          {sinRed && <p className="meta">{SIN_INTERNET} para cambiar algo de un niño.</p>}
          {aviso && (
            <p className={`mensaje ${aviso.ok ? 'mensaje--ok' : 'mensaje--error'}`} role={aviso.ok ? 'status' : 'alert'}>
              {aviso.texto}{' '}
              {aviso.imprimir && (
                <Enlace ruta={rutaGrupo(grupo.id, `/tarjetas/${encodeURIComponent(n.id)}`)} className="enlace">
                  Imprimir la tarjeta
                </Enlace>
              )}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

function AgregarNinos({ grupo, ninos, paquete, sinRed, alListo, campo }: { grupo: GrupoDoc; ninos: Nino[]; paquete: Paquete; sinRed: boolean; alListo: () => void; campo: React.RefObject<HTMLTextAreaElement | null> }) {
  const [texto, setTexto] = useState('');
  const [avatar, setAvatar] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; lineas: string[]; imprimir?: boolean }>();

  const alEnviar = async (e: FormEvent) => {
    e.preventDefault();
    const apodos = apodosDe(texto);
    if (apodos.length === 0) return setResultado({ ok: false, lineas: ['Escriba al menos un apodo.'] });
    if (apodos.length > 60) return setResultado({ ok: false, lineas: ['Agregue hasta 60 niños a la vez.'] });
    const largo = apodos.find((a) => a.length > 30);
    if (largo) return setResultado({ ok: false, lineas: [`"${largo}" tiene más de 30 letras. Use solo el apodo o el primer nombre.`] });
    const existentes = new Set(ninos.map((n) => n.apodo.toLocaleLowerCase('es')));
    const repetidos = apodos.filter((a) => existentes.has(a.toLocaleLowerCase('es')));
    const nuevos = apodos.filter((a) => !existentes.has(a.toLocaleLowerCase('es')));
    setOcupado(true);
    setResultado(undefined);
    try {
      const r = await agregarNinos(grupo.id, nuevos, avatar, paquete.heroes, ninos.length);
      const fallas = [...repetidos.map((apodo) => ({ apodo, motivo: 'ya está en el grupo' })), ...r.fallas];
      setTexto(fallas.map((f) => f.apodo).join('\n'));
      setResultado({
        ok: fallas.length === 0,
        imprimir: r.creados.length > 0,
        lineas: [r.creados.length > 0 ? `Se ${r.creados.length === 1 ? 'agregó 1 niño' : `agregaron ${r.creados.length} niños`}.` : '', ...fallas.map((f) => `${f.apodo}: ${f.motivo}. Si se repite un apodo, agregue una inicial (Juan M).`)].filter(Boolean),
      });
      if (r.creados.length) alListo();
    } catch (falla) {
      setResultado({ ok: false, lineas: [textoAccion(falla)] });
      alListo();
    } finally {
      setOcupado(false);
    }
  };

  return (
    <form className="formulario" onSubmit={alEnviar} noValidate>
      <div className="campo">
        <label htmlFor="nuevos-apodos">Apodos</label>
        <textarea id="nuevos-apodos" ref={campo} rows={4} value={texto} onChange={(e) => setTexto(e.target.value)} autoCapitalize="words" spellCheck={false} autoComplete="off" aria-describedby="nuevos-ayuda" />
        <p id="nuevos-ayuda" className="meta">
          Uno por línea. Para varios a la vez, pegue la lista. Solo el apodo o el primer nombre, sin apellidos; si se repite, agregue una inicial (Juan M).
        </p>
      </div>
      <CampoOpciones id="nuevos-personaje" etiqueta="Personaje" valor={avatar} alCambiar={setAvatar} vacio="Alternar entre los tres" opciones={paquete.heroes.map((h) => ({ valor: h.id, etiqueta: h.nombre }))} />
      <Boton variante="primario" tipo="submit" icono="crear" disabled={ocupado || sinRed}>
        {sinRed ? SIN_INTERNET : ocupado ? 'Agregando…' : 'Agregar'}
      </Boton>
      {resultado && (
        <div className={`mensaje ${resultado.ok ? 'mensaje--ok' : 'mensaje--error'}`} role={resultado.ok ? 'status' : 'alert'}>
          {resultado.lineas.map((l) => (
            <p key={l}>{l}</p>
          ))}
          {resultado.imprimir && (
            <p className="meta">
              Marque la autorización de cada niño para que pueda entrar. El PIN solo se ve al imprimir:{' '}
              <Enlace ruta={rutaGrupo(grupo.id, '/tarjetas')} className="enlace">
                imprimir tarjetas
              </Enlace>
              .
            </p>
          )}
        </div>
      )}
    </form>
  );
}

// ---------------------------------------------------------------- Dar estrellas

const NOMBRE_MOTIVO: Record<Motivo, string> = { participar: 'participar', colaborar: 'colaborar' };

function Estrellas({ grupo, ninos, paquete }: { grupo: GrupoDoc; ninos: Nino[]; paquete: Paquete }) {
  useTitulo(`Estrellas · ${grupo.nombre}`);
  const cola = useCola();
  const ids = ninos.map((n) => n.id);
  const hoy = useCarga(() => reconocidosHoy(ids), `hoy-${grupo.id}-${ids.length}`);
  const [hoja, setHoja] = useState<Nino | null>(null);
  const [equipo, setEquipo] = useState(false);
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const hayPorDeshacer = cola.acciones.some((a) => a.listoEn > Date.now());
  const ahora = useAhora(hayPorDeshacer);

  const nombres = new Map(ninos.map((n) => [n.id, n.apodo]));
  const deHoy = new Set(cola.acciones.filter((a) => a.creado > Date.now() - 24 * 3600e3).flatMap((a) => a.ninos));
  const reconocido = (id: string) => deHoy.has(id) || cola.subidas.includes(id) || Boolean(hoy.datos?.has(id));
  const avisos = cola.acciones.filter((a) => a.listoEn > ahora && a.ninos.some((id) => nombres.has(id))).slice(-3).reverse();

  const dar = (idsNinos: string[], motivo: Motivo) => {
    darEstrellas(idsNinos, motivo, paquete.cartilla);
    setHoja(null);
    setEquipo(false);
    setMarcados(new Set());
  };

  const quien = (a: { ninos: string[] }) => {
    const primero = nombres.get(a.ninos[0]) ?? 'Un niño';
    return a.ninos.length === 1 ? primero : `${primero} y ${a.ninos.length - 1} más`;
  };

  return (
    <>
      <Encabezado titulo={`Estrellas · ${grupo.nombre}`} meta="Toque a un niño y elija. Participar vale 10 y colaborar 15. Una estrella guardada no se quita." volver={{ ruta: rutaGrupo(grupo.id), etiqueta: `Grupo ${grupo.nombre}` }} />
      {cola.rechazo && <Rechazo texto={cola.rechazo} />}
      {ninos.length === 0 ? (
        <Panel>
          <Vacio titulo="Todavía no hay niños" texto="Cuando agregue niños al grupo podrá darles estrellas aquí.">
            <Boton variante="primario" icono="crear" ruta={rutaGrupo(grupo.id)}>
              Agregar niños
            </Boton>
          </Vacio>
        </Panel>
      ) : (
        <>
          <div className="acciones">
            <Boton icono="grupos" onClick={() => (setEquipo(!equipo), setMarcados(new Set()))}>
              {equipo ? 'Cancelar el equipo' : 'Colaborar en equipo'}
            </Boton>
          </div>
          <Panel filas>
            <ul className="lista">
              {ninos.map((n) => {
                const reciente = cola.acciones.find((a) => a.ninos.includes(n.id) && ahora - a.creado < 1200 && a.listoEn > ahora);
                const contenido = (
                  <>
                    <Cara paquete={paquete} avatar={n.avatar} className="cara-d--32" />
                    <span className="nino__apodo">{n.apodo}</span>
                    {reconocido(n.id) && (
                      <span className="punto" role="img" aria-label="Ya reconocido hoy" title="Ya reconocido hoy" />
                    )}
                    {reciente && <span className="mas-estrellas">+{VALOR[reciente.motivo]}</span>}
                  </>
                );
                return (
                  <li key={n.id}>
                    {equipo ? (
                      <label className="estrella-fila estrella-fila--marca">
                        <input type="checkbox" checked={marcados.has(n.id)} onChange={() => setMarcados((m) => { const s = new Set(m); if (!s.delete(n.id)) s.add(n.id); return s; })} />
                        <span className="casilla__caja" aria-hidden="true">
                          <Icono nombre="marca" />
                        </span>
                        {contenido}
                      </label>
                    ) : (
                      <button type="button" className="estrella-fila" onClick={() => setHoja(n)}>
                        {contenido}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </Panel>
          <p className="meta">
            <span className="punto punto--texto" aria-hidden="true" /> Ya reconocido hoy. Solo usted lo ve.
          </p>
        </>
      )}

      {equipo && (
        <div className="barra-equipo">
          <Boton variante="primario" ancho disabled={marcados.size === 0} onClick={() => dar([...marcados], 'colaborar')}>
            {marcados.size === 0 ? 'Marque a los niños' : `Dar colaborar a ${marcados.size}`}
          </Boton>
        </div>
      )}

      {avisos.length > 0 && (
        <div className={`avisos${equipo ? ' avisos--alto' : ''}`} role="status" aria-live="polite">
          {avisos.map((a) => (
            <p key={a.accion} className="aviso-estrella">
              <span>
                {quien(a)}: {NOMBRE_MOTIVO[a.motivo]}
              </span>
              <button type="button" className="boton boton--texto" onClick={() => deshacer(a.accion)}>
                Deshacer
              </button>
            </p>
          ))}
        </div>
      )}

      {hoja && <HojaEstrellas nino={hoja} paquete={paquete} alElegir={(m) => dar([hoja.id], m)} alCerrar={() => setHoja(null)} />}
    </>
  );
}

function HojaEstrellas({ nino, paquete, alElegir, alCerrar }: { nino: Nino; paquete: Paquete; alElegir: (m: Motivo) => void; alCerrar: () => void }) {
  const primero = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    primero.current?.focus();
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && alCerrar();
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [alCerrar]);
  return (
    <div className="hoja-fondo" onClick={(e) => e.target === e.currentTarget && alCerrar()}>
      <div className="hoja" role="dialog" aria-modal="true" aria-labelledby="hoja-titulo">
        <div className="hoja__cabeza">
          <Cara paquete={paquete} avatar={nino.avatar} className="cara-d--40" />
          <h2 id="hoja-titulo" className="h3">
            {nino.apodo}
          </h2>
        </div>
        <button type="button" ref={primero} className="boton boton--primario hoja__boton" onClick={() => alElegir('participar')}>
          <span>Participar</span>
          <span className="hoja__valor">+{VALOR.participar}</span>
        </button>
        <button type="button" className="boton boton--primario hoja__boton" onClick={() => alElegir('colaborar')}>
          <span>Colaborar</span>
          <span className="hoja__valor">+{VALOR.colaborar}</span>
        </button>
        <Boton variante="texto" ancho onClick={alCerrar}>
          Cerrar
        </Boton>
      </div>
    </div>
  );
}
