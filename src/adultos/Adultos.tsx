// Paquete de adultos: entrada, docente, coordinador y dueño (esqueleto §1.5, §2 y §3).
// Tanda 2: entrada con cuenta (correo y contraseña, recuperar, invitación) y redirección por rol.
// Las secciones siguen con sus huecos hasta las tandas 4 a 7.
import { StrictMode, useEffect, useState, useSyncExternalStore, type FormEvent, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { navegar, useRuta } from '../navegacion';
import { Boton, Cascaron, Encabezado, Fila, Hueco, Panel, type Seccion } from './base';
import { aceptarEnlace, cambiarClave, correoDeSesion, cuentasEnJuego, descartarEnlace, entrar, ErrorCuenta, iniciar, INICIO, recuperar, salir, tomarEnlace, useCuenta, type Estado, type Falla, type Rol } from './cuenta';
import { Icono } from './Icono';
import { DocentesYGrupos, UsoYAvance } from './Colegio';
import { Campo, correoValido, useTitulo } from './comun';
import { PaginaDueno } from './Plataforma';
import { DocenteInicio, MisGrupos, PaginaGrupo } from './Docente';
import { MaterialPagina, Planear, PlanTema, TemaMateriales } from './Materiales';
import { Biblioteca } from './Biblioteca';
import { olvidarLecturas } from './docente';
import { iniciarCola, prepararSalida, useAvisoSalida, useCola } from './estrellas';

/** Resultado de leer la sesión que traen los enlaces de los correos (se lee antes de pintar). */
let enlace: ReturnType<typeof tomarEnlace> = 'nada';

export function montar(raiz: HTMLElement) {
  if (/^\/adultos\/(clave-nueva|invitacion)\/?$/.test(location.pathname)) {
    // El `type` del enlace decide la pantalla: invite → invitación, recovery → contraseña nueva.
    const tipo = new URLSearchParams(location.hash.slice(1)).get('type');
    const destino = tipo === 'recovery' ? '/adultos/clave-nueva' : tipo === 'invite' ? '/adultos/invitacion' : null;
    if (destino && !location.pathname.startsWith(destino)) history.replaceState(null, '', destino + location.hash);
    enlace = tomarEnlace();
  }
  void iniciar();
  createRoot(raiz).render(
    <StrictMode>
      <Adultos />
    </StrictMode>,
  );
}

/** ¿Hay red ahora? Se vuelve a pintar al perderla o recuperarla. */
function useEnLinea(): boolean {
  return useSyncExternalStore(
    (cambio) => {
      window.addEventListener('online', cambio);
      window.addEventListener('offline', cambio);
      return () => {
        window.removeEventListener('online', cambio);
        window.removeEventListener('offline', cambio);
      };
    },
    () => navigator.onLine,
  );
}

const NOMBRE_ROL: Record<Rol, string> = { dueno: 'Dueño de la plataforma', coordinador: 'Coordinación', docente: 'Docente' };

function Adultos() {
  const ruta = useRuta().replace(/\/+$/, '') || '/';
  const cuenta = useCuenta();
  const enLinea = useEnLinea();
  const [, modo, ...resto] = ruta.split('/');
  if (modo === 'adultos') {
    switch (resto[0]) {
      case undefined:
        return <Entrada cuenta={cuenta} />;
      case 'recuperar':
        return <Recuperar />;
      case 'clave-nueva':
        return <ClaveNueva cuenta={cuenta} />;
      case 'invitacion':
        return <Invitacion cuenta={cuenta} />;
      default:
        return <AlInicio ruta="/adultos" />;
    }
  }
  // Docente, colegio y plataforma piden cuenta; cada rol vive solo en su sección.
  if (cuenta.tipo === 'cargando') return <Cargando />;
  if (cuenta.tipo !== 'dentro') return <AlInicio ruta="/adultos" />;
  const propio = INICIO[cuenta.perfil.rol];
  if (`/${modo}` !== propio) return <AlInicio ruta={propio} />;
  const sinRed = cuenta.sinRed || !enLinea;
  if (modo === 'docente') return <Docente resto={resto} cuenta={cuenta} sinRed={sinRed} />;
  if (modo === 'colegio') return <Colegio resto={resto} cuenta={cuenta} sinRed={sinRed} />;
  return <Plataforma resto={resto} cuenta={cuenta} sinRed={sinRed} />;
}

type Dentro = Extract<Estado, { tipo: 'dentro' }>;

/** Ruta desconocida dentro de un modo: a su inicio, sin dejarla en el historial. */
function AlInicio({ ruta }: { ruta: string }) {
  useEffect(() => navegar(ruta, true), [ruta]);
  return null;
}

function Cargando() {
  return <main className="cargando" aria-busy="true" aria-label="Cargando" />;
}

async function cerrarSesion() {
  // Con estrellas pendientes intenta subirlas antes de cerrar; si no puede, la entrada lo avisa.
  await prepararSalida().catch(() => undefined);
  olvidarLecturas();
  void salir();
  navegar('/adultos', true);
}

/** Banda de "sin conexión" arriba del contenido (esqueleto §2.6). */
function AvisoSinRed({ texto }: { texto: string }) {
  return (
    <p className="aviso-red" role="status">
      <Icono nombre="sinRed" />
      <span>{texto}</span>
    </p>
  );
}

// ---------------------------------------------------------------- Entrada (/adultos)

/** Caja centrada de las pantallas de entrada, con la marca y el título. */
function CajaEntrada({ titulo, texto, alEnviar, children }: { titulo: string; texto?: ReactNode; alEnviar?: (e: FormEvent) => void; children: ReactNode }) {
  useTitulo(titulo);
  const cabeza = (
    <div className="encabezado">
      <p className="entrada__marca">English Adventure Quest</p>
      <h1>{titulo}</h1>
      {texto && <p className="sec">{texto}</p>}
    </div>
  );
  return (
    <main className="entrada">
      {alEnviar ? (
        <form className="entrada__caja" onSubmit={alEnviar} noValidate>
          {cabeza}
          {children}
        </form>
      ) : (
        <div className="entrada__caja">
          {cabeza}
          {children}
        </div>
      )}
    </main>
  );
}

const SIN_RED_ENTRAR = 'Sin conexión. Para entrar la primera vez hace falta internet.';

/** Texto para el adulto según lo que falló. */
function textoFalla(e: unknown, contexto: 'entrar' | 'clave' | 'correo'): string {
  const falla: Falla = e instanceof ErrorCuenta ? e.falla : 'otro';
  switch (falla) {
    case 'red':
      return contexto === 'entrar' ? SIN_RED_ENTRAR : 'Sin conexión. Intente de nuevo cuando vuelva la señal.';
    case 'credenciales':
      return 'El correo o la contraseña no coinciden.';
    case 'clave-corta':
      return 'Use una contraseña de al menos 8 caracteres.';
    case 'misma-clave':
      return 'Esa es la contraseña que ya tenía. Escriba otra.';
    case 'enlace':
      return 'El enlace venció o ya se usó. Pida uno nuevo.';
    case 'sin-config':
      return 'La entrada con cuenta no está disponible en esta copia de la plataforma.';
    default:
      return e instanceof ErrorCuenta && e.message === 'demasiados' ? 'Se pidieron muchos correos seguidos. Espere unos minutos e intente de nuevo.' : 'No se pudo completar. Intente de nuevo en un momento.';
  }
}

function Entrada({ cuenta }: { cuenta: Estado }) {
  const [ver, setVer] = useState(false);
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [errores, setErrores] = useState<{ correo?: string; clave?: string; general?: string }>({});
  const [enviando, setEnviando] = useState(false);
  const avisoSalida = useAvisoSalida();

  if (cuenta.tipo === 'dentro') return <AlInicio ruta={INICIO[cuenta.perfil.rol]} />;
  if (cuenta.tipo === 'cargando') return <Cargando />;
  if (cuenta.tipo === 'sin-red') return <SinRedPerfil />;
  if (cuenta.tipo === 'sin-acceso') return <SinAcceso correo={cuenta.correo} />;

  const alEnviar = async (e: FormEvent) => {
    e.preventDefault();
    const nuevos = {
      correo: !correo.trim() ? 'Escriba su correo.' : !correoValido(correo) ? 'Revise el correo: debe ser como nombre@colegio.edu.co.' : undefined,
      clave: !clave ? 'Escriba su contraseña.' : undefined,
    };
    setErrores(nuevos);
    if (nuevos.correo || nuevos.clave) return;
    setEnviando(true);
    try {
      await entrar(correo, clave);
    } catch (falla) {
      const texto = textoFalla(falla, 'entrar');
      setErrores(falla instanceof ErrorCuenta && falla.falla === 'credenciales' ? { clave: texto } : { general: texto });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <CajaEntrada titulo="Entrar" texto="Para docentes y directivos del colegio." alEnviar={alEnviar}>
      {avisoSalida && (
        <p className="nota" role="status">
          {avisoSalida}
        </p>
      )}
      <Campo id="correo" etiqueta="Correo" tipo="email" autoComplete="username" valor={correo} alCambiar={setCorreo} error={errores.correo} />
      <Campo id="clave" etiqueta="Contraseña" autoComplete="current-password" valor={clave} alCambiar={setClave} error={errores.clave} ver={{ activo: ver, alternar: () => setVer(!ver) }} />
      <Boton variante="primario" ancho tipo="submit" disabled={enviando}>
        {enviando ? 'Entrando…' : 'Entrar'}
      </Boton>
      <p className="mensaje mensaje--error" role="alert">
        {errores.general}
      </p>
      <div className="entrada__pie">
        <Boton variante="texto" ruta="/adultos/recuperar">
          Olvidé mi contraseña
        </Boton>
        <Boton variante="texto" ruta="/">
          Volver al juego
        </Boton>
      </div>
    </CajaEntrada>
  );
}

/** Hay sesión pero no hubo red para saber el perfil (por ejemplo al abrir el enlace de una invitación sin señal). */
function SinRedPerfil() {
  return (
    <CajaEntrada titulo="Sin conexión" texto="No pudimos terminar de entrar porque no hay señal. Su enlace sigue guardado en este aparato; no hace falta abrirlo de nuevo.">
      <Boton variante="primario" ancho onClick={() => void iniciar()}>
        Reintentar
      </Boton>
      <div className="entrada__pie">
        <Boton variante="texto" icono="salir" onClick={cerrarSesion}>
          Salir
        </Boton>
      </div>
    </CajaEntrada>
  );
}

/** Un enlace de correo llegó a un aparato que ya tiene a otra persona dentro: se pregunta antes de cambiar. */
function ConfirmarEntrada({ alCambiar }: { alCambiar: () => void }) {
  const [cuentas, setCuentas] = useState<{ enlace?: string; abierta?: string }>();
  useEffect(() => {
    void cuentasEnJuego().then(setCuentas);
  }, []);
  return (
    <CajaEntrada titulo="Cambiar de cuenta" texto={`Va a entrar como ${cuentas?.enlace ?? 'la persona que recibió el correo'}.${cuentas?.abierta ? ` Ahora está abierta la cuenta de ${cuentas.abierta}; se cerrará en este aparato.` : ' Se cerrará la cuenta que está abierta en este aparato.'}`}>
      <Boton
        variante="primario"
        ancho
        onClick={() => {
          enlace = 'ok';
          void aceptarEnlace();
          alCambiar();
        }}
      >
        Continuar
      </Boton>
      <Boton
        ancho
        onClick={() => {
          descartarEnlace();
          navegar('/adultos', true);
        }}
      >
        Cancelar
      </Boton>
    </CajaEntrada>
  );
}

/** Cuenta que existe en Auth pero no tiene rol: invitación sin aceptar o acceso desactivado. */
function SinAcceso({ correo }: { correo?: string }) {
  return (
    <CajaEntrada titulo="Su cuenta no tiene acceso" texto={`${correo ? `La cuenta ${correo}` : 'Esta cuenta'} no tiene un colegio asignado o su acceso fue desactivado.`}>
      <p className="sec">Si recibió una invitación, ábrala desde el enlace del correo. Si su acceso se desactivó, hable con la coordinación de su colegio.</p>
      <Boton variante="primario" ancho icono="salir" onClick={cerrarSesion}>
        Salir
      </Boton>
    </CajaEntrada>
  );
}

function Recuperar() {
  const [correo, setCorreo] = useState('');
  const [error, setError] = useState<string>();
  const [general, setGeneral] = useState<string>();
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const alEnviar = async (e: FormEvent) => {
    e.preventDefault();
    const malo = !correo.trim() ? 'Escriba su correo.' : !correoValido(correo) ? 'Revise el correo: debe ser como nombre@colegio.edu.co.' : undefined;
    setError(malo);
    setGeneral(undefined);
    if (malo) return;
    setEnviando(true);
    try {
      await recuperar(correo);
      setEnviado(true);
    } catch (falla) {
      setGeneral(textoFalla(falla, 'correo'));
    } finally {
      setEnviando(false);
    }
  };

  if (enviado)
    return (
      <CajaEntrada titulo="Revise su correo" texto={`Si ${correo.trim()} tiene cuenta, le llegó un enlace para crear una contraseña nueva. Revise también el correo no deseado.`}>
        <Boton variante="primario" ancho ruta="/adultos">
          Volver a entrar
        </Boton>
      </CajaEntrada>
    );
  return (
    <CajaEntrada titulo="Recuperar la contraseña" texto="Escriba el correo con el que entra. Le enviaremos un enlace para crear una contraseña nueva." alEnviar={alEnviar}>
      <Campo id="correo" etiqueta="Correo" tipo="email" autoComplete="username" valor={correo} alCambiar={setCorreo} error={error} />
      <Boton variante="primario" ancho tipo="submit" disabled={enviando}>
        {enviando ? 'Enviando…' : 'Enviar el enlace'}
      </Boton>
      <p className="mensaje mensaje--error" role="alert">
        {general}
      </p>
      <div className="entrada__pie">
        <Boton variante="texto" icono="volver" ruta="/adultos">
          Volver a entrar
        </Boton>
      </div>
    </CajaEntrada>
  );
}

/** Formulario de contraseña nueva, común a recuperar e invitación. */
function FormClave({ titulo, texto, boton, alGuardar }: { titulo: string; texto: ReactNode; boton: string; alGuardar: () => void }) {
  const [clave, setClave] = useState('');
  const [ver, setVer] = useState(false);
  const [error, setError] = useState<string>();
  const [general, setGeneral] = useState<string>();
  const [enviando, setEnviando] = useState(false);

  const alEnviar = async (e: FormEvent) => {
    e.preventDefault();
    const malo = clave.length < 8 ? 'Use una contraseña de al menos 8 caracteres.' : undefined;
    setError(malo);
    setGeneral(undefined);
    if (malo) return;
    setEnviando(true);
    try {
      await cambiarClave(clave);
      alGuardar();
    } catch (falla) {
      const f = falla instanceof ErrorCuenta ? falla.falla : 'otro';
      if (f === 'clave-corta' || f === 'misma-clave') setError(textoFalla(falla, 'clave'));
      else setGeneral(textoFalla(falla, 'clave'));
      setEnviando(false);
    }
  };

  return (
    <CajaEntrada titulo={titulo} texto={texto} alEnviar={alEnviar}>
      <Campo id="clave-nueva" etiqueta="Contraseña nueva" autoComplete="new-password" valor={clave} alCambiar={setClave} error={error} ver={{ activo: ver, alternar: () => setVer(!ver) }} />
      <p className="meta">Al menos 8 caracteres. Úsela solo en esta plataforma.</p>
      <Boton variante="primario" ancho tipo="submit" disabled={enviando}>
        {enviando ? 'Guardando…' : boton}
      </Boton>
      <p className="mensaje mensaje--error" role="alert">
        {general}
      </p>
    </CajaEntrada>
  );
}

/** El correo de la sesión que abrió el enlace, para mostrarlo. */
function useCorreo(cuenta: Estado): string | undefined {
  const inicial = cuenta.tipo === 'dentro' || cuenta.tipo === 'sin-acceso' ? cuenta.correo : undefined;
  const [correo, setCorreo] = useState(inicial);
  useEffect(() => {
    if (!correo && (cuenta.tipo === 'dentro' || cuenta.tipo === 'sin-acceso')) void correoDeSesion().then(setCorreo, () => undefined);
  }, [correo, cuenta.tipo]);
  return correo ?? inicial;
}

function EnlaceVencido({ titulo, texto, accion }: { titulo: string; texto: string; accion: { ruta: string; etiqueta: string } }) {
  return (
    <CajaEntrada titulo={titulo} texto={texto}>
      <Boton variante="primario" ancho ruta={accion.ruta}>
        {accion.etiqueta}
      </Boton>
      <div className="entrada__pie">
        <Boton variante="texto" icono="volver" ruta="/adultos">
          Volver a entrar
        </Boton>
      </div>
    </CajaEntrada>
  );
}

/** /adultos/clave-nueva: llega desde el correo de "Olvidé mi contraseña". */
function ClaveNueva({ cuenta }: { cuenta: Estado }) {
  const correo = useCorreo(cuenta);
  if (enlace === 'confirmar') return <ConfirmarEntrada alCambiar={() => navegar('/adultos/clave-nueva', true)} />;
  if (cuenta.tipo === 'cargando') return <Cargando />;
  if (cuenta.tipo === 'sin-red') return <SinRedPerfil />;
  if (enlace === 'enlace' || cuenta.tipo === 'fuera')
    return <EnlaceVencido titulo="El enlace ya no sirve" texto="El enlace venció o ya se usó. Pida uno nuevo: llega en un par de minutos." accion={{ ruta: '/adultos/recuperar', etiqueta: 'Pedir un enlace nuevo' }} />;
  return <FormClave titulo="Contraseña nueva" texto={correo ? `Para la cuenta ${correo}.` : 'Escriba la contraseña con la que va a entrar.'} boton="Guardar y entrar" alGuardar={() => navegar(cuenta.tipo === 'dentro' ? INICIO[cuenta.perfil.rol] : '/adultos', true)} />;
}

/** /adultos/invitacion: llega desde el correo de invitación; crea la contraseña y entra. */
function Invitacion({ cuenta }: { cuenta: Estado }) {
  const correo = useCorreo(cuenta);
  if (enlace === 'confirmar') return <ConfirmarEntrada alCambiar={() => navegar('/adultos/invitacion', true)} />;
  if (cuenta.tipo === 'cargando') return <Cargando />;
  if (cuenta.tipo === 'sin-red') return <SinRedPerfil />;
  // Con sesión abierta y sin enlace (se recargó o se llegó a mano): a su inicio.
  if (cuenta.tipo === 'dentro' && enlace === 'nada') return <AlInicio ruta={INICIO[cuenta.perfil.rol]} />;
  if (enlace === 'enlace')
    return <EnlaceVencido titulo="La invitación ya no sirve" texto="El enlace venció o ya se usó. Pida a quien lo invitó que se la envíe de nuevo. Si ya creó su contraseña, entre con ella." accion={{ ruta: '/adultos', etiqueta: 'Entrar con mi contraseña' }} />;
  if (cuenta.tipo === 'fuera')
    return <EnlaceVencido titulo="Aceptar la invitación" texto="Abra el enlace de la invitación que le llegó al correo. Si ya creó su contraseña, entre con ella." accion={{ ruta: '/adultos', etiqueta: 'Entrar con mi contraseña' }} />;
  if (cuenta.tipo === 'sin-acceso')
    return (
      <CajaEntrada titulo="No encontramos su invitación" texto={`${correo ? `El correo ${correo}` : 'Este correo'} no tiene una invitación vigente. Las invitaciones duran 14 días.`}>
        <p className="sec">Pida a quien lo invitó que se la envíe de nuevo, con este mismo correo.</p>
        <Boton variante="primario" ancho icono="salir" onClick={cerrarSesion}>
          Salir
        </Boton>
      </CajaEntrada>
    );
  return (
    <FormClave
      titulo={`Le damos la bienvenida, ${cuenta.perfil.nombre}`}
      texto={`Entra como ${NOMBRE_ROL[cuenta.perfil.rol].toLowerCase()}${correo ? ` con ${correo}` : ''}. Cree su contraseña para las próximas veces.`}
      boton="Guardar y entrar"
      alGuardar={() => navegar(INICIO[cuenta.perfil.rol], true)}
    />
  );
}

/** Cuenta del adulto: nombre, correo, rol y salir. */
function MiCuenta({ cuenta, volver }: { cuenta: Dentro; volver?: { ruta: string; etiqueta: string } }) {
  useTitulo('Cuenta');
  return (
    <>
      <Encabezado titulo="Cuenta" volver={volver} />
      <Panel filas>
        <Fila icono="cuenta" titulo={cuenta.perfil.nombre} detalle={cuenta.correo} />
        <Fila titulo={NOMBRE_ROL[cuenta.perfil.rol]} detalle="Rol en la plataforma" />
        <Fila alTocar={cerrarSesion} icono="salir" titulo="Salir" detalle="Cierra la sesión en este aparato" />
      </Panel>
    </>
  );
}

// ---------------------------------------------------------------- Docente (/docente)

const DOCENTE: Seccion[] = [
  { ruta: '/docente', etiqueta: 'Inicio', icono: 'inicio' },
  { ruta: '/docente/grupos', etiqueta: 'Grupos', icono: 'grupos' },
  { ruta: '/docente/planear', etiqueta: 'Planear', icono: 'planear' },
  { ruta: '/proyectar', etiqueta: 'Proyectar', icono: 'proyectar' },
  { ruta: '/docente/mas', etiqueta: 'Más', icono: 'mas' },
];

/** Lo que va bajo "Más" en celular; en el computador se llega igual desde esa pestaña. */
const MAS = ['biblioteca', 'registro', 'ayuda', 'cuenta'];

const SIN_RED_DOCENTE = 'Sin conexión. Lo que marque se guarda en este celular y sube solo cuando vuelva la señal.';
const SIN_RED_LECTURA = 'Sin conexión. Ve lo último que se cargó; para cambiar algo hace falta internet.';

function Docente({ resto, cuenta, sinRed }: { resto: string[]; cuenta: Dentro; sinRed: boolean }) {
  const [seccion = '', ...mas] = resto;
  const activa = seccion === '' ? '/docente' : MAS.includes(seccion) || seccion === 'mas' ? '/docente/mas' : seccion === 'temas' ? '/docente/planear' : `/docente/${seccion}`;
  const cola = useCola();
  useEffect(iniciarCola, []);
  const estado = cola.porSubir > 0 ? (
    <>
      <Icono nombre="subir" />
      {cola.porSubir} por subir
    </>
  ) : (
    <>
      <Icono nombre="guardado" />
      Todo guardado
    </>
  );
  return (
    <Cascaron inicio="/docente" estado={estado} aviso={sinRed && <AvisoSinRed texto={SIN_RED_DOCENTE} />} secciones={DOCENTE} activa={activa} nombre="Secciones del docente">
      <PaginaDocente seccion={seccion} mas={mas} cuenta={cuenta} sinRed={sinRed} />
    </Cascaron>
  );
}

function PaginaDocente({ seccion, mas, cuenta, sinRed }: { seccion: string; mas: string[]; cuenta: Dentro; sinRed: boolean }) {
  switch (seccion) {
    case '':
      return <DocenteInicio colegioId={cuenta.perfil.colegio_id} />;
    case 'grupos':
      return mas[0] ? <PaginaGrupo resto={mas} sinRed={sinRed} /> : <MisGrupos sinRed={sinRed} />;
    case 'planear':
      return mas[0] ? <PlanTema tema={mas[0]} /> : <Planear />;
    case 'temas':
      return mas[1] ? <MaterialPagina tema={mas[0]} id={mas[1]} /> : mas[0] ? <TemaMateriales tema={mas[0]} /> : <AlInicio ruta="/docente/planear" />;
    case 'biblioteca':
      return <Biblioteca resto={mas} />;
    case 'registro':
      return <SeccionVacia titulo="Registro del piloto" hueco="Aquí irá el registro del piloto" texto="Cotejo, incidencias, encuesta de acceso y prueba de entrada y salida, cada parte con su plantilla imprimible." volver={{ ruta: '/docente/mas', etiqueta: 'Más' }} />;
    case 'ayuda':
      return <SeccionVacia titulo="Ayuda" hueco="Aquí irá la guía de uso de la plataforma" volver={{ ruta: '/docente/mas', etiqueta: 'Más' }} />;
    case 'cuenta':
      return <MiCuenta cuenta={cuenta} volver={{ ruta: '/docente/mas', etiqueta: 'Más' }} />;
    case 'mas':
      return <DocenteMas />;
    default:
      return <AlInicio ruta="/docente" />;
  }
}

function DocenteMas() {
  useTitulo('Más');
  return (
    <>
      <Encabezado titulo="Más" />
      <Panel filas>
        <Fila ruta="/docente/biblioteca" icono="documento" titulo="Biblioteca" detalle="Historia, recursos por tema, actividades y fundamentos" />
        <Fila ruta="/docente/registro" icono="registro" titulo="Registro del piloto" />
        <Fila ruta="/docente/ayuda" icono="ayuda" titulo="Ayuda" />
        <Fila ruta="/docente/cuenta" icono="cuenta" titulo="Cuenta" />
        <Fila alTocar={cerrarSesion} icono="salir" titulo="Salir" />
      </Panel>
    </>
  );
}

/** Sección todavía sin contenido: su título y el hueco donde caerá. */
function SeccionVacia({ titulo, hueco, texto, volver }: { titulo: string; hueco: string; texto?: string; volver?: { ruta: string; etiqueta: string } }) {
  useTitulo(titulo);
  return (
    <>
      <Encabezado titulo={titulo} volver={volver} />
      <Hueco titulo={hueco} texto={texto} />
    </>
  );
}

// ---------------------------------------------------------------- Coordinador (/colegio)

const COLEGIO: Seccion[] = [
  { ruta: '/colegio', etiqueta: 'Uso y avance', icono: 'uso' },
  { ruta: '/colegio/docentes', etiqueta: 'Docentes', icono: 'grupos' },
  { ruta: '/colegio/materiales', etiqueta: 'Materiales', icono: 'materiales' },
  { ruta: '/colegio/cierre', etiqueta: 'Cierre', icono: 'cierre' },
  { ruta: '/colegio/cuenta', etiqueta: 'Cuenta', icono: 'cuenta' },
];

/** Salir, a la derecha de la barra (coordinador y dueño no tienen pestaña "Más"). */
const BOTON_SALIR = (
  <Boton variante="texto" icono="salir" onClick={cerrarSesion}>
    Salir
  </Boton>
);

function Colegio({ resto, cuenta, sinRed }: { resto: string[]; cuenta: Dentro; sinRed: boolean }) {
  const [seccion = ''] = resto;
  const activa = seccion === '' ? '/colegio' : `/colegio/${seccion === 'grupos' ? 'docentes' : seccion}`;
  let pagina;
  switch (seccion) {
    case '':
      pagina = <UsoYAvance />;
      break;
    case 'docentes':
    case 'grupos':
      pagina = <DocentesYGrupos sinRed={sinRed} />;
      break;
    case 'materiales':
      pagina = <SeccionVacia titulo="Materiales" hueco="Aquí irán los materiales de la cartilla" texto="Solo para leer e imprimir." />;
      break;
    case 'cierre':
      pagina = <SeccionVacia titulo="Cierre del año" hueco="Aquí irá el cierre del año escolar" texto="Explicará qué se borra al cerrar el año y pedirá escribir el año para confirmar." />;
      break;
    case 'cuenta':
      pagina = <MiCuenta cuenta={cuenta} />;
      break;
    default:
      pagina = <AlInicio ruta="/colegio" />;
  }
  return (
    <Cascaron inicio="/colegio" fin={BOTON_SALIR} aviso={sinRed && <AvisoSinRed texto={SIN_RED_LECTURA} />} secciones={COLEGIO} activa={activa} nombre="Secciones del colegio">
      {pagina}
    </Cascaron>
  );
}

// ---------------------------------------------------------------- Dueño (/plataforma)

const PLATAFORMA: Seccion[] = [
  { ruta: '/plataforma', etiqueta: 'Colegios', icono: 'colegio' },
  { ruta: '/plataforma/cartillas', etiqueta: 'Cartillas', icono: 'cartillas' },
  { ruta: '/plataforma/documentos', etiqueta: 'Documentos', icono: 'documento' },
  { ruta: '/plataforma/cuentas', etiqueta: 'Cuentas', icono: 'cuenta' },
  { ruta: '/plataforma/piloto', etiqueta: 'Piloto', icono: 'descargar' },
];

const PAGINAS_PLATAFORMA: Record<string, { titulo: string; hueco: string; texto?: string }> = {
  cartillas: { titulo: 'Cartillas', hueco: 'Aquí aparecerán las cartillas al subir su paquete', texto: 'Cada cartilla con sus versiones y qué versión usa cada colegio.' },
  documentos: { titulo: 'Documentos de plataforma', hueco: 'Aquí irán los documentos de la plataforma', texto: 'Autorización base, instrucciones de la tarjeta y ayuda.' },
  piloto: { titulo: 'Datos del piloto', hueco: 'Aún no hay datos para exportar', texto: 'El resumen se descargará sin apodos.' },
};

function Plataforma({ resto, sinRed }: { resto: string[]; cuenta: Dentro; sinRed: boolean }) {
  const [seccion = '', id] = resto;
  const datos = PAGINAS_PLATAFORMA[seccion];
  const activa = seccion === '' || seccion === 'colegios' ? '/plataforma' : `/plataforma/${seccion}`;
  const propia = datos ? null : <PaginaDueno seccion={seccion} id={id} sinRed={sinRed} />;
  const valida = seccion === '' || seccion === 'cuentas' || (seccion === 'colegios' && id);
  return (
    <Cascaron inicio="/plataforma" fin={BOTON_SALIR} aviso={sinRed && <AvisoSinRed texto={SIN_RED_LECTURA} />} secciones={PLATAFORMA} activa={activa} nombre="Secciones de la plataforma">
      {datos ? <SeccionVacia {...datos} /> : valida ? propia : <AlInicio ruta="/plataforma" />}
    </Cascaron>
  );
}
