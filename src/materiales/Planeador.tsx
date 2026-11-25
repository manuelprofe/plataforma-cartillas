// Formato del planeador de clase, en cuadrícula como un formato institucional: encabezado
// (institución, docente, área, grado, grupo, fecha, tema, clase, duración), referentes (DBA,
// estándares y desempeños) y la clase por momentos (inicio, desarrollo, cierre) con su tiempo,
// actividades, recursos y evaluación. En celular las filas se apilan; impreso cabe en carta.
// El contenido sale del documento del material; aquí solo se acomoda.
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Enlace } from '../adultos/base';
import { Icono } from '../adultos/Icono';
import { leer, useCuenta } from '../adultos/cuenta';
import { cartillaMateriales } from './datos';
import { identidadColegio, type IdentidadColegio } from '../adultos/docente';
import { COLOR_1, COLOR_2, tintaSobre } from '../adultos/Identidad';
import { Boton } from '../adultos/base';
import type { Bloque, EntradaTema, Fase, Material } from './datos';
import { Texto } from './Material';
import { ajustarDuracion, DURACIONES, elegirDuracion, useDuracion } from './duracion';
import './planeador.css';

type Momento = Extract<Bloque, { tipo: 'momento' }>;

const NOMBRE_FASE: Record<Fase, string> = { inicio: 'Inicio', desarrollo: 'Desarrollo', cierre: 'Cierre' };

/** Título y texto de un momento ("**Apertura.** Cuente…"); `punto`: el título cerraba con punto. */
function partes(m: Momento) {
  const r = /^\*\*(.+?)\*\*\s*(.*)$/.exec(m.momento);
  return r ? { titulo: r[1].replace(/[.:]$/, ''), cuerpo: r[2], punto: /[.:]$/.test(r[1]) } : { titulo: m.momento, cuerpo: '', punto: false };
}

/** Un momento sin nada que hacer (las transiciones) no es una fila: sus minutos van aparte. */
const vacio = (m: Momento) => !partes(m).cuerpo && !m.material && !m.observar && !m.sinProyector;

/** Fase de cada momento: la del contenido; si no la trae, el primero abre, el de autoevaluar o "Cierre" cierra. */
export function fases(momentos: Momento[]): Fase[] {
  const conTexto = momentos.map((m, i) => ({ m, i })).filter(({ m }) => !vacio(m));
  const primero = conTexto[0]?.i;
  return momentos.map((m, i) => {
    if (m.fase) return m.fase;
    if (/^cierre\b/i.test(partes(m).titulo) || m.ritmo === 'autoevaluar') return 'cierre';
    return i === primero ? 'inicio' : 'desarrollo';
  });
}

/** Nombre del docente y de su colegio, si hay sesión; si no, renglones para llenar a mano. */
function useQuien() {
  const cuenta = useCuenta();
  const perfil = cuenta.tipo === 'dentro' ? cuenta.perfil : undefined;
  const [identidad, setIdentidad] = useState<IdentidadColegio | null>(null);
  const colegioId = perfil?.colegio_id ?? null;
  useEffect(() => {
    let vigente = true;
    identidadColegio(colegioId)
      .then((n) => vigente && setIdentidad(n))
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, [colegioId]);
  // Área y grado: del catálogo de cartillas (una lectura pequeña); el contenido puede fijarlos.
  const [cartilla, setCartilla] = useState<{ materia?: string | null; grado?: string | null }>({});
  const id = cartillaMateriales();
  useEffect(() => {
    let vigente = true;
    if (perfil)
      leer<{ materia: string | null; grado: string | null }>('cartillas', `select=materia,grado&id=eq.${encodeURIComponent(id)}`)
        .then((f) => vigente && f[0] && setCartilla(f[0]))
        .catch(() => {});
    return () => {
      vigente = false;
    };
  }, [id, perfil]);
  return { docente: perfil?.rol === 'docente' ? perfil.nombre : undefined, colegio: identidad?.nombre ?? null, identidad, area: cartilla.materia ?? undefined, grado: cartilla.grado ? `${cartilla.grado}.°` : undefined };
}

function Celda({ etiqueta, children, ancha }: { etiqueta: string; children?: ReactNode; ancha?: boolean }) {
  return (
    <div className={`plan-celda${ancha ? ' plan-celda--ancha' : ''}`}>
      <span className="plan-celda__et">{etiqueta}</span>
      <span className="plan-celda__val">{children || <span className="plan-raya" aria-label="Por llenar" />}</span>
    </div>
  );
}

function Lista({ items, falta }: { items?: string[]; falta: string }) {
  if (!items?.length) return <span className="plan-falta">{falta}</span>;
  if (items.length === 1) return <Texto t={items[0]} />;
  return (
    <ul>
      {items.map((t, i) => (
        <li key={i}>
          <Texto t={t} />
        </li>
      ))}
    </ul>
  );
}

/**
 * `otros`: los materiales del tema según el índice, para saber qué se proyecta y qué se imprime; `temaId` arma
 * el enlace al telón. Sin ellos, cada recurso abre su hoja.
 */
export function FormatoPlaneador({ material: original, nombreTema, rutaMaterial, impreso, otros, temaId }: { material: Material; nombreTema: string; rutaMaterial?: (id: string) => string; impreso?: boolean; otros?: EntradaTema['materiales']; temaId?: string }) {
  const quien = useQuien();
  const duracion = useDuracion();
  const material = ajustarDuracion(original, duracion);
  const { docente, colegio, identidad, area, grado } = quien;
  const color1 = identidad?.color_1 ?? COLOR_1;
  const color2 = identidad?.color_2 ?? COLOR_2;
  const ref = material.referentes ?? {};
  const momentos = material.bloques.filter((b): b is Momento => b.tipo === 'momento');
  const fase = fases(momentos);
  const filas = momentos.map((m, i) => ({ m, fase: fase[i] })).filter(({ m }) => !vacio(m));
  const transiciones = momentos.filter(vacio).reduce((a, m) => a + m.minutos, 0);
  const total = momentos.reduce((a, m) => a + m.minutos, 0);
  const observaciones = material.bloques.filter((b) => b.tipo === 'parrafo') as Extract<Bloque, { tipo: 'parrafo' }>[];
  const notas = material.bloques.find((b) => b.tipo === 'nota') as Extract<Bloque, { tipo: 'nota' }> | undefined;

  // Cada paso abre su recurso sin salir a buscarlo: lo que se proyecta, al telón; lo demás, a su hoja.
  const enlaces = (m: Momento) => {
    if (!m.enlaces?.length) return null;
    if (impreso)
      return (
        <span className="mat-chips">
          {m.enlaces.map((e) => (
            <span key={e.id} className="mat-chip">
              {e.texto}
            </span>
          ))}
        </span>
      );
    return (
      <span className="plan-recursos">
        {m.enlaces.flatMap((e) => {
          const otro = otros?.find((x) => x.id === e.id);
          const nombre = e.texto.toLowerCase();
          const proyectar = otro && otro.proyectar !== 'no' && temaId ? `/proyectar/${temaId}/${e.id}` : undefined;
          const hoja = rutaMaterial ? rutaMaterial(e.id) : undefined;
          if (otros && !otro)
            return [
              <span key={e.id} className="plan-recurso plan-recurso--falta">
                {e.texto}: aquí irá
              </span>,
            ];
          // Lo que se reparte en papel: primero imprimir; su consigna también se puede proyectar.
          if (otro?.tipo === 'ficha' || otro?.tipo === 'casa')
            return [
              hoja && (
                <Enlace key={e.id} ruta={hoja} className="plan-recurso">
                  <Icono nombre="imprimir" />
                  Imprimir {nombre}
                </Enlace>
              ),
              proyectar && (
                <Enlace key={`${e.id}-p`} ruta={proyectar} className="plan-recurso">
                  <Icono nombre="proyectar" />
                  Proyectar consigna
                </Enlace>
              ),
            ];
          if (proyectar)
            return [
              <Enlace key={e.id} ruta={proyectar} className="plan-recurso plan-recurso--proyectar">
                <Icono nombre="proyectar" />
                Proyectar {nombre}
              </Enlace>,
            ];
          return [
            hoja && (
              <Enlace key={e.id} ruta={hoja} className="plan-recurso">
                <Icono nombre="documento" />
                Abrir {nombre}
              </Enlace>
            ),
          ];
        })}
      </span>
    );
  };

  return (
    <div className="plan-formato" style={{ '--plan-color-1': color1, '--plan-color-2': color2, '--plan-tinta-1': tintaSobre(color1) } as CSSProperties}>
      {!impreso && (
        <div className="plan-acciones no-imprimir">
          <div className="plan-duracion" role="group" aria-label="Duración de la clase">
            <span className="plan-duracion__et">Duración</span>
            {DURACIONES.map((d) => (
              <button key={d} type="button" className="boton boton--secundario" aria-pressed={duracion === d} onClick={() => elegirDuracion(d)}>
                {d} min
              </button>
            ))}
          </div>
          <Boton icono="descargar" onClick={() => void import('./word').then((w) => w.descargarPlaneador({ material, nombreTema, docente, colegio, identidad, area: material.referentes?.area ?? area, grado: material.referentes?.grado ?? grado }))}>
            Descargar en Word
          </Boton>
        </div>
      )}
      <div className="plan-membrete">
        {identidad?.escudo ? <img src={identidad.escudo} alt="" className="plan-membrete__escudo" /> : <span className="plan-membrete__escudo plan-membrete__escudo--hueco">Escudo</span>}
        <div className="plan-membrete__texto">
          <span className="plan-membrete__colegio">{colegio || 'Institución educativa'}</span>
          <span className="plan-membrete__titulo">Planeador de clase</span>
        </div>
      </div>
      <div className="plan-cab" role="group" aria-label="Datos de la clase">
        <Celda etiqueta="Institución">{colegio}</Celda>
        <Celda etiqueta="Docente">{docente}</Celda>
        <Celda etiqueta="Área">{ref.area ?? area}</Celda>
        <Celda etiqueta="Grado">{ref.grado ?? grado}</Celda>
        <Celda etiqueta="Grupo" />
        <Celda etiqueta="Fecha" />
        <Celda etiqueta="Tema">{nombreTema}</Celda>
        <Celda etiqueta="Duración">
          {total} min{transiciones ? ` (incluye ${transiciones} de transiciones)` : ''}
        </Celda>
        <Celda etiqueta="Clase" ancha>
          {material.titulo}
        </Celda>
      </div>

      <table className="plan-ref">
        <tbody>
          <tr>
            <th scope="row">DBA</th>
            <td>
              <Lista items={ref.dba} falta="Por definir en la malla de la cartilla" />
            </td>
          </tr>
          <tr>
            <th scope="row">Estándares (EBC)</th>
            <td>
              <Lista items={ref.ebc} falta="Por definir en la malla de la cartilla" />
            </td>
          </tr>
          <tr>
            <th scope="row">Desempeños</th>
            <td>
              <Lista items={ref.desempenos} falta="Por definir en la malla de la cartilla" />
            </td>
          </tr>
        </tbody>
      </table>
      {ref.fuente && <p className="plan-fuente">Fuente: {ref.fuente}</p>}

      <table className="plan-clase">
        <caption>Momentos de la clase</caption>
        <thead>
          <tr>
            <th scope="col">Momento</th>
            <th scope="col">Tiempo</th>
            <th scope="col">Actividades</th>
            <th scope="col">Recursos</th>
            <th scope="col">Evaluación: qué observar</th>
            <th scope="col">Sin proyector</th>
          </tr>
        </thead>
        <tbody>
          {filas.map(({ m, fase: f }, i) => {
            const { titulo, cuerpo, punto } = partes(m);
            const nueva = i === 0 || filas[i - 1].fase !== f;
            const cuantas = filas.filter((x) => x.fase === f).length;
            return (
              <tr key={i} className={`plan-fila plan-fila--${f}${nueva ? ' plan-fila--abre' : ''}`}>
                {nueva && (
                  <th scope="rowgroup" rowSpan={cuantas} className="plan-fase">
                    {NOMBRE_FASE[f]}
                  </th>
                )}
                <td className="plan-min" data-etiqueta="Tiempo">
                  {m.minutos} min
                </td>
                <td data-etiqueta="Actividades">
                  <strong>{titulo}</strong>
                  {cuerpo && (
                    <>
                      {punto ? '. ' : ' '}
                      <Texto t={cuerpo} />
                    </>
                  )}
                </td>
                <td data-etiqueta="Recursos">
                  {enlaces(m)}
                  {m.material && <span className="plan-material">{m.material}</span>}
                </td>
                <td data-etiqueta="Evaluación: qué observar">{m.observar}</td>
                <td data-etiqueta="Sin proyector" className="plan-sin">{m.sinProyector}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <table className="plan-ref plan-pie">
        <tbody>
          {observaciones.length > 0 && (
            <tr>
              <th scope="row">Observaciones</th>
              <td>
                {observaciones.map((o, i) => (
                  <p key={i}>
                    <Texto t={o.texto} />
                  </p>
                ))}
              </td>
            </tr>
          )}
          <tr>
            <th scope="row">Adaptaciones (ritmos y necesidades educativas)</th>
            <td>
              <span className="plan-raya" />
            </td>
          </tr>
          <tr>
            <th scope="row">{notas?.etiqueta ?? 'Notas del docente'}</th>
            <td>
              <span className="plan-raya" />
              <span className="plan-raya" />
            </td>
          </tr>
          <tr>
            <th scope="row">Firma del docente</th>
            <td>
              <span className="plan-raya" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
