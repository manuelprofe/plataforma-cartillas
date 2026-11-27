// Componentes base de los modos de adultos (esqueleto §8, tanda 1): barra, pestañas, panel,
// fila, botón, hueco, farol y cortina. Sin datos: cada pantalla les pasa lo que muestra.
import type { MouseEvent, ReactNode } from 'react';
import '@fontsource-variable/atkinson-hyperlegible-next';
import './base.css';
import { navegar } from '../navegacion';
import { Icono, type NombreIcono } from './Icono';
import { dibujo, NOMBRE, type Personaje } from '../marca';

/** Enlace real (se puede abrir en otra pestaña) que navega sin recargar dentro del mismo modo. */
export function Enlace({ ruta, className, children, actual }: { ruta: string; className?: string; children: ReactNode; actual?: boolean }) {
  const alTocar = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navegar(ruta);
  };
  return (
    <a href={ruta} className={className} onClick={alTocar} aria-current={actual ? 'page' : undefined}>
      {children}
    </a>
  );
}

export interface Seccion {
  ruta: string;
  etiqueta: string;
  icono: NombreIcono;
  /** Solo en las pestañas del celular o solo en la barra lateral del computador. */
  solo?: 'celular' | 'computador';
  /** Otras rutas activas que marcan esta pestaña (p. ej. "Más" en el celular). */
  activaEn?: string[];
}

/** Barra superior de 56 px: nombre de la plataforma y, a la derecha, el estado de guardado y acciones. */
export function Barra({ inicio, estado, fin }: { inicio: string; estado?: ReactNode; fin?: ReactNode }) {
  return (
    <header className="barra">
      <Enlace ruta={inicio} className="barra__marca">
        <img src={dibujo('goma-saludar')} alt="" width="26" height="33" />
        {NOMBRE}
      </Enlace>
      {estado && (
        <p className="barra__estado" role="status">
          {estado}
        </p>
      )}
      {fin && <div className="barra__fin">{fin}</div>}
    </header>
  );
}

/** Secciones del modo: pestañas abajo en celular, barra lateral de 256 px en computador. */
export function Pestanas({ secciones, activa, nombre }: { secciones: Seccion[]; activa: string; nombre: string }) {
  return (
    <nav className="pestanas" aria-label={nombre}>
      {secciones.map((s) => (
        <Enlace key={s.ruta} ruta={s.ruta} className={`pestanas__item${s.solo ? ` pestanas__item--${s.solo}` : ''}`} actual={s.ruta === activa || Boolean(s.activaEn?.includes(activa))}>
          <Icono nombre={s.icono} />
          {s.etiqueta}
        </Enlace>
      ))}
    </nav>
  );
}

/** Cascarón de una pantalla de adultos: barra, pestañas, un aviso opcional y el contenido. */
export function Cascaron(props: { inicio: string; estado?: ReactNode; fin?: ReactNode; aviso?: ReactNode; secciones: Seccion[]; activa: string; nombre: string; children: ReactNode }) {
  return (
    <div className="cascaron">
      <Barra inicio={props.inicio} estado={props.estado} fin={props.fin} />
      <Pestanas secciones={props.secciones} activa={props.activa} nombre={props.nombre} />
      <main className="contenido">
        {props.aviso}
        {props.children}
      </main>
    </div>
  );
}

/** Título de la página, con una línea de apoyo y, si hace falta, el enlace para volver. */
export function Encabezado({ titulo, meta, volver }: { titulo: string; meta?: ReactNode; volver?: { ruta: string; etiqueta: string } }) {
  return (
    <div className="encabezado">
      {volver && (
        <Enlace ruta={volver.ruta} className="boton boton--texto encabezado__volver">
          <Icono nombre="volver" />
          {volver.etiqueta}
        </Enlace>
      )}
      <div className="encabezado__margen">
        <h1>{titulo}</h1>
        {meta && <p className="meta">{meta}</p>}
      </div>
    </div>
  );
}

export function Panel({ titulo, fin, filas, children }: { titulo?: string; fin?: ReactNode; filas?: boolean; children: ReactNode }) {
  return (
    <section className="panel">
      {titulo && (
        <div className="panel__cabeza">
          <h2 className="h3">
            {titulo}
          </h2>
          {fin && <div className="fila__fin">{fin}</div>}
        </div>
      )}
      <div className={filas ? 'panel__cuerpo panel__cuerpo--filas' : 'panel__cuerpo'}>{children}</div>
    </section>
  );
}

/** Fila de 56 px. Con `ruta` es un enlace con flecha; con `alTocar`, un botón; sin ninguno, solo muestra. */
/** `personaje` pone un dibujo pequeño en lugar del ícono (la materia de una cartilla). */
export function Fila({ ruta, alTocar, icono, personaje, titulo, detalle, fin, tenue }: { ruta?: string; alTocar?: () => void; icono?: NombreIcono; personaje?: Personaje; titulo: ReactNode; detalle?: ReactNode; fin?: ReactNode; tenue?: boolean }) {
  const dentro = (
    <>
      {personaje ? <img className="fila__personaje" src={dibujo(personaje)} alt="" width="32" height="32" /> : icono && <Icono nombre={icono} />}
      <span className="fila__texto">
        <span>{titulo}</span>
        {detalle && <span className="meta">{detalle}</span>}
      </span>
      {(fin || ruta) && (
        <span className="fila__fin">
          {fin}
          {ruta && <Icono nombre="siguiente" />}
        </span>
      )}
    </>
  );
  if (alTocar)
    return (
      <button type="button" className={tenue ? 'fila fila--tenue' : 'fila'} onClick={alTocar}>
        {dentro}
      </button>
    );
  return ruta ? (
    <Enlace ruta={ruta} className={tenue ? 'fila fila--tenue' : 'fila'}>
      {dentro}
    </Enlace>
  ) : (
    <div className={tenue ? 'fila fila--tenue' : 'fila'}>{dentro}</div>
  );
}

type Variante = 'primario' | 'secundario' | 'texto';

/** Botón de 48 px o más. Con `ruta` es un enlace con forma de botón. */
export function Boton(props: { variante?: Variante; ancho?: boolean; icono?: NombreIcono; ruta?: string; onClick?: () => void; disabled?: boolean; tipo?: 'button' | 'submit'; children: ReactNode }) {
  const clase = ['boton', `boton--${props.variante ?? 'secundario'}`, props.ancho ? 'boton--ancho' : ''].filter(Boolean).join(' ');
  const dentro = (
    <>
      {props.icono && <Icono nombre={props.icono} />}
      {props.children}
    </>
  );
  if (props.ruta)
    return (
      <Enlace ruta={props.ruta} className={clase}>
        {dentro}
      </Enlace>
    );
  return (
    <button type={props.tipo ?? 'button'} className={clase} onClick={props.onClick} disabled={props.disabled}>
      {dentro}
    </button>
  );
}

/**
 * Hueco: el lugar fijo donde luego cae una guía, un planeador o una ficha. Recuadro punteado
 * con "Aquí irá …", qué traerá y, si se da, una acción. No se imprime.
 */
export function Hueco({ titulo, texto, trae, children }: { titulo: string; texto?: ReactNode; trae?: string[]; children?: ReactNode }) {
  return (
    <div className="hueco" data-hueco="">
      <p className="hueco__titulo">{titulo}</p>
      {texto && <p>{texto}</p>}
      {trae && trae.length > 0 && (
        <ul>
          {trae.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
      {children}
    </div>
  );
}

/** Texto de un estado vacío con su acción (esqueleto §2.2). */
/** Vacío con acción. Goma señala qué hacer; `personaje={null}` lo quita (pantallas muy chicas). */
export function Vacio({ titulo, texto, children, personaje = 'goma-senalar' }: { titulo?: string; texto: ReactNode; children?: ReactNode; personaje?: Personaje | null }) {
  return (
    <div className={personaje ? 'vacio vacio--con-dibujo' : 'vacio'}>
      {personaje && <img className="vacio__dibujo" src={dibujo(personaje)} alt="" width="72" height="82" loading="lazy" />}
      <div className="vacio__texto">
        {titulo && <h2 className="h3">{titulo}</h2>}
        <p className="sec">{texto}</p>
        {children}
      </div>
    </div>
  );
}

export type EstadoFarol = 'apagado' | 'medio' | 'encendido';
const NOMBRE_FAROL: Record<EstadoFarol, string> = { apagado: 'por hacer', medio: 'en curso', encendido: 'hecho' };

/** La firma visual: el estado de un tema o una clase. Solo para eso. */
export function Farol({ estado, de }: { estado: EstadoFarol; de: string }) {
  return <span className={`farol farol--${estado}`} role="img" aria-label={`${de}: ${NOMBRE_FAROL[estado]}`} />;
}

/**
 * Cortina de privacidad: tapa una pantalla con apodos si la del aparato puede estar en el telón.
 * El contenido de detrás no se pinta mientras la cortina está (lo decide quien la usa).
 */
export function Cortina({ motivo, onMostrar, onInicio, onTermine }: { motivo: string; onMostrar: () => void; onInicio: () => void; onTermine: () => void }) {
  return (
    <div className="cortina-a" role="dialog" aria-modal="true" aria-labelledby="cortina-titulo">
      <div className="cortina-a__caja">
        <Icono nombre="ojoTachado" />
        <h2 id="cortina-titulo">¿Su pantalla se ve en el telón?</h2>
        <p className="sec">Esta sección muestra los apodos de los niños. {motivo}</p>
        <Boton variante="primario" ancho onClick={onMostrar}>
          Mostrar la lista aquí
        </Boton>
        <Boton ancho onClick={onInicio}>
          Volver al inicio
        </Boton>
        <Boton variante="texto" ancho onClick={onTermine}>
          Ya terminé la clase
        </Boton>
      </div>
    </div>
  );
}
