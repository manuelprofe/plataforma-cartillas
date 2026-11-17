// Paquete de adultos: entrada, docente, coordinador y dueño (esqueleto §1.5, §2 y §3).
// Tanda 1: rutas y cascarón con sus huecos. Sin datos ni Supabase todavía (tanda 2).
import { StrictMode, useEffect, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { navegar, useRuta } from '../navegacion';
import { minutosDesdeProyeccion, terminarClase } from '../proyectando';
import { Boton, Cascaron, Cortina, Encabezado, Farol, Fila, Hueco, Panel, Vacio, type Seccion } from './base';
import { Icono } from './Icono';

export function montar(raiz: HTMLElement) {
  createRoot(raiz).render(
    <StrictMode>
      <Adultos />
    </StrictMode>,
  );
}

/** Título de la pestaña del navegador para cada pantalla. */
function useTitulo(titulo: string) {
  useEffect(() => {
    document.title = `${titulo} · English Adventure Quest`;
  }, [titulo]);
}

function Adultos() {
  const ruta = useRuta().replace(/\/+$/, '') || '/';
  const [, modo, ...resto] = ruta.split('/');
  if (modo === 'docente') return <Docente resto={resto} />;
  if (modo === 'colegio') return <Colegio resto={resto} />;
  if (modo === 'plataforma') return <Plataforma resto={resto} />;
  return <Entrada />;
}

/** Ruta desconocida dentro de un modo: a su inicio, sin dejarla en el historial. */
function AlInicio({ ruta }: { ruta: string }) {
  useEffect(() => navegar(ruta, true), [ruta]);
  return null;
}

// ---------------------------------------------------------------- Entrada (/adultos)

function Entrada() {
  useTitulo('Entrar');
  const [ver, setVer] = useState(false);
  const [aviso, setAviso] = useState('');
  const entrar = (e: FormEvent) => {
    e.preventDefault();
    setAviso('La entrada con cuenta todavía no está abierta. Llega con la próxima versión.');
  };
  return (
    <main className="entrada">
      <form className="entrada__caja" onSubmit={entrar} noValidate>
        <div className="encabezado">
          <p className="entrada__marca">English Adventure Quest</p>
          <h1>Entrar</h1>
          <p className="sec">Para docentes y directivos del colegio.</p>
        </div>
        <div className="campo">
          <label htmlFor="correo">Correo</label>
          <input id="correo" type="email" autoComplete="username" inputMode="email" />
        </div>
        <div className="campo">
          <label htmlFor="clave">Contraseña</label>
          <div className="campo__fila">
            <input id="clave" type={ver ? 'text' : 'password'} autoComplete="current-password" />
            <Boton onClick={() => setVer(!ver)}>{ver ? 'Ocultar' : 'Ver'}</Boton>
          </div>
        </div>
        <Boton variante="primario" ancho tipo="submit">
          Entrar
        </Boton>
        <p className="sec" role="status">
          {aviso}
        </p>
        <Boton variante="texto" onClick={() => setAviso('Recuperar la contraseña llega con la entrada con cuenta.')}>
          Olvidé mi contraseña
        </Boton>
      </form>
    </main>
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
const MAS = ['registro', 'ayuda', 'cuenta'];

const hoy = () => new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

function Docente({ resto }: { resto: string[] }) {
  const [seccion = '', ...mas] = resto;
  const activa = seccion === '' ? '/docente' : MAS.includes(seccion) || seccion === 'mas' ? '/docente/mas' : `/docente/${seccion}`;
  const estado = (
    <>
      <Icono nombre="guardado" />
      Todo guardado
    </>
  );
  return (
    <Cascaron inicio="/docente" estado={estado} secciones={DOCENTE} activa={activa} nombre="Secciones del docente">
      <PaginaDocente seccion={seccion} mas={mas} />
    </Cascaron>
  );
}

function PaginaDocente({ seccion, mas }: { seccion: string; mas: string[] }) {
  switch (seccion) {
    case '':
      return <DocenteInicio />;
    case 'grupos':
      return mas[0] ? <Grupo g={decodeURIComponent(mas[0])} /> : <Grupos />;
    case 'planear':
      return <SeccionVacia titulo="Planear" hueco="Aquí irá el plan de cada grupo" texto="Elija el primer tema del grupo y las fechas de sus dos clases. Verá los seis temas del territorio en orden, cada uno con su farol." />;
    case 'temas':
      return <SeccionVacia titulo="Materiales del tema" hueco="Aquí irán los materiales del tema" texto="Los materiales de este tema llegan con la próxima versión de la cartilla. Ya puede proyectar las láminas y los juegos." volver={{ ruta: '/docente', etiqueta: 'Inicio' }} />;
    case 'registro':
      return <SeccionVacia titulo="Registro del piloto" hueco="Aquí irá el registro del piloto" texto="Cotejo, incidencias, encuesta de acceso y prueba de entrada y salida, cada parte con su plantilla imprimible." volver={{ ruta: '/docente/mas', etiqueta: 'Más' }} />;
    case 'ayuda':
      return <SeccionVacia titulo="Ayuda" hueco="Aquí irá la guía de uso de la plataforma" volver={{ ruta: '/docente/mas', etiqueta: 'Más' }} />;
    case 'cuenta':
      return <SeccionVacia titulo="Cuenta" hueco="Aquí irán los datos de su cuenta" volver={{ ruta: '/docente/mas', etiqueta: 'Más' }} />;
    case 'mas':
      return <DocenteMas />;
    default:
      return <AlInicio ruta="/docente" />;
  }
}

function DocenteInicio() {
  useTitulo('Inicio');
  return (
    <>
      <Encabezado titulo="Inicio" meta={hoy()} />
      <Panel
        titulo="Próxima clase"
        fin={
          <span className="faroles">
            <Farol estado="apagado" de="Clase 1" />
            <Farol estado="apagado" de="Clase 2" />
          </span>
        }
      >
        <Hueco titulo="Aquí irá su próxima clase" texto="El grupo, el tema y si es la clase 1 o la 2, con el botón para proyectarla y el planeador." />
      </Panel>
      <div className="atajos">
        <Boton variante="primario" icono="proyectar" ruta="/proyectar">
          Proyectar
        </Boton>
        <Boton icono="estrella" ruta="/docente/grupos">
          Dar estrellas
        </Boton>
        <Boton icono="lista" ruta="/docente/grupos">
          Lista
        </Boton>
      </div>
      <Panel>
        <Vacio titulo="Todavía no tiene grupos" texto="Cree su grupo y la plataforma le da el código que los niños usan en casa. Después agrega los apodos.">
          <Boton ruta="/docente/grupos">Crear un grupo</Boton>
        </Vacio>
      </Panel>
    </>
  );
}

function Grupos() {
  useTitulo('Mis grupos');
  return (
    <>
      <Encabezado titulo="Mis grupos" />
      <Panel>
        <Vacio titulo="Todavía no tiene grupos" texto="Cree su grupo y la plataforma le da el código que los niños usan en casa. Después agrega los apodos." />
        <Hueco titulo="Aquí irá cada grupo" texto="Una fila por grupo: nombre, grado, número de niños y código." />
      </Panel>
    </>
  );
}

/** Pantalla con apodos: va detrás de la cortina si en este aparato se proyectó hace poco. */
function Grupo({ g }: { g: string }) {
  useTitulo(`Grupo ${g}`);
  const [minutos, setMinutos] = useState(minutosDesdeProyeccion);
  const [mostrar, setMostrar] = useState(false);
  const tapada = minutos !== null && !mostrar;
  return (
    <>
      <Encabezado titulo={`Grupo ${g}`} volver={{ ruta: '/docente/grupos', etiqueta: 'Mis grupos' }} />
      {!tapada && (
        <Panel titulo="Lista">
          <Hueco titulo={`Aquí aparecerán los niños de ${g}`} texto="Escriba solo el apodo o el primer nombre, sin apellidos." />
        </Panel>
      )}
      {tapada && (
        <Cortina
          motivo={minutos === 0 ? 'Hace menos de un minuto estaba proyectando desde este aparato.' : `Hace ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'} estaba proyectando desde este aparato.`}
          onMostrar={() => setMostrar(true)}
          onInicio={() => navegar('/docente')}
          onTermine={() => {
            terminarClase();
            setMinutos(null);
          }}
        />
      )}
    </>
  );
}

function DocenteMas() {
  useTitulo('Más');
  return (
    <>
      <Encabezado titulo="Más" />
      <Panel filas>
        <Fila ruta="/docente/registro" icono="registro" titulo="Registro del piloto" />
        <Fila ruta="/docente/ayuda" icono="ayuda" titulo="Ayuda" />
        <Fila ruta="/docente/cuenta" icono="cuenta" titulo="Cuenta" />
        <Fila ruta="/adultos" icono="salir" titulo="Salir" />
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

function Colegio({ resto }: { resto: string[] }) {
  const [seccion = ''] = resto;
  const activa = seccion === '' ? '/colegio' : `/colegio/${seccion === 'grupos' ? 'docentes' : seccion}`;
  let pagina;
  switch (seccion) {
    case '':
      pagina = (
        <SeccionVacia
          titulo="Uso y avance"
          hueco="Aquí verá el uso de la cartilla por grado"
          texto="Cuando sus docentes creen grupos, aquí verá por grupo el tema según el plan, cuántos niños tienen cuenta y cuántos practicaron esta semana. Lo que viene de la app muestra solo a quienes juegan en casa. No sirve para calificar ni para comparar docentes."
        />
      );
      break;
    case 'docentes':
    case 'grupos':
      pagina = <SeccionVacia titulo="Docentes y grupos" hueco="Aquí irán sus docentes y sus grupos" texto="Invite a su primer docente con su correo." />;
      break;
    case 'materiales':
      pagina = <SeccionVacia titulo="Materiales" hueco="Aquí irán los materiales de la cartilla" texto="Solo para leer e imprimir." />;
      break;
    case 'cierre':
      pagina = <SeccionVacia titulo="Cierre del año" hueco="Aquí irá el cierre del año escolar" texto="Explicará qué se borra al cerrar el año y pedirá escribir el año para confirmar." />;
      break;
    case 'cuenta':
      pagina = <SeccionVacia titulo="Cuenta" hueco="Aquí irán los datos de su cuenta" />;
      break;
    default:
      pagina = <AlInicio ruta="/colegio" />;
  }
  return (
    <Cascaron inicio="/colegio" secciones={COLEGIO} activa={activa} nombre="Secciones del colegio">
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
  '': { titulo: 'Colegios', hueco: 'Aquí irán los colegios', texto: 'Cree el primer colegio.' },
  cartillas: { titulo: 'Cartillas', hueco: 'Aquí aparecerán las cartillas al subir su paquete', texto: 'Cada cartilla con sus versiones y qué versión usa cada colegio.' },
  documentos: { titulo: 'Documentos de plataforma', hueco: 'Aquí irán los documentos de la plataforma', texto: 'Autorización base, instrucciones de la tarjeta y ayuda.' },
  cuentas: { titulo: 'Cuentas', hueco: 'Aquí irán las cuentas de coordinador', texto: 'Crear un coordinador con su correo y su colegio, y reenviar la invitación.' },
  piloto: { titulo: 'Datos del piloto', hueco: 'Aún no hay datos para exportar', texto: 'El resumen se descargará sin apodos.' },
};

function Plataforma({ resto }: { resto: string[] }) {
  const [seccion = ''] = resto;
  const datos = PAGINAS_PLATAFORMA[seccion];
  return (
    <Cascaron inicio="/plataforma" secciones={PLATAFORMA} activa={seccion ? `/plataforma/${seccion}` : '/plataforma'} nombre="Secciones de la plataforma">
      {datos ? <SeccionVacia {...datos} /> : <AlInicio ruta="/plataforma" />}
    </Cascaron>
  );
}
