// Tablero del coordinador o rector: ejecución de los docentes (plan y planeaciones entregadas) y
// avance de los estudiantes por grado. Nunca muestra niños: solo las cifras sumadas por grupo de
// `cifras_grupos`, que no da cifras de grupos con menos de 5 niños autorizados.
import { Enlace, Panel } from '../base';
import type { Cifra } from '../datos';
import type { Entrega } from '../entregas';
import { Alertas, Barras, Cifra as CifraGrande, Cifras, type Dato } from './graficos';
import { porciento } from './vivo';

const sumar = (o?: Record<string, number> | null) => Object.values(o ?? {}).reduce((a, b) => a + Number(b || 0), 0);
const fmt = (n: number) => n.toLocaleString('es-CO');
export const etiquetaGrado = (g: string) => (g === 'Preescolar' ? g : /^\d/.test(g) ? `Grado ${g}` : g || 'Sin grado');

/** Totales de un conjunto de grupos (solo los que tienen cifras suman niños). */
export function totales(grupos: Cifra[]) {
  const con = grupos.filter((g) => g.con_cifras);
  const planes = grupos.flatMap((g) => Object.values(g.plan ?? {}));
  return {
    grupos: grupos.length,
    conCifras: con.length,
    conCuenta: con.reduce((a, g) => a + (g.autorizaciones ?? 0), 0),
    semana: con.reduce((a, g) => a + (g.practicaron_semana ?? 0), 0),
    mes: con.reduce((a, g) => a + (g.practicaron_mes ?? 0), 0),
    misiones: con.reduce((a, g) => a + sumar(g.misiones), 0),
    calcomanias: con.reduce((a, g) => a + sumar(g.estrellas), 0),
    temasHechos: planes.filter((p) => p.estado === 'hecho').length,
    temasEnCurso: planes.filter((p) => p.estado === 'en-curso').length,
  };
}

export function ResumenColegio({ grupos, entregas, orden }: { grupos: Cifra[]; entregas: Entrega[] | null; orden: (a: string, b: string) => number }) {
  const t = totales(grupos);
  const porRevisar = entregas?.filter((e) => e.estado === 'por-revisar').length ?? 0;

  const grados = [...new Set(grupos.map((g) => g.grado))].sort(orden);
  const participacion: Dato[] = grados.flatMap((grado) => {
    const tg = totales(grupos.filter((g) => g.grado === grado));
    if (!tg.conCuenta) return [];
    const nombre = etiquetaGrado(grado);
    return [{ etiqueta: nombre, nombre, valor: Math.round((tg.semana / tg.conCuenta) * 100), texto: porciento(tg.semana, tg.conCuenta) }];
  });

  const docentes = [...new Set(grupos.map((g) => g.docente))].sort((a, b) => a.localeCompare(b, 'es'));
  const ejecucion: Dato[] = docentes.map((d) => {
    const tg = totales(grupos.filter((g) => g.docente === d));
    return { etiqueta: d, nombre: d, valor: tg.temasHechos, resto: tg.temasEnCurso, texto: `${tg.temasHechos} + ${tg.temasEnCurso}` };
  });

  const nombresEntrega = entregas ? [...new Set([...docentes, ...entregas.map((e) => e.docente_nombre)])].sort((a, b) => a.localeCompare(b, 'es')) : [];
  const planeaciones: Dato[] = nombresEntrega.map((d) => {
    const suyas = entregas!.filter((e) => e.docente_nombre === d);
    const revisadas = suyas.filter((e) => e.estado === 'revisada').length;
    return { etiqueta: d, nombre: d, valor: revisadas, resto: suyas.length - revisadas, texto: String(suyas.length) };
  });

  const alertas = [
    ...grupos.filter((g) => g.con_cifras && !g.practicaron_semana).map((g) => ({ titulo: `${g.nombre}: nadie practicó esta semana`, detalle: `Docente: ${g.docente}` })),
    ...grupos.filter((g) => !g.con_cifras).map((g) => ({ titulo: `${g.nombre}: faltan autorizaciones`, detalle: `Tiene menos de 5 niños con autorización; sin ellas no se ven cifras. Docente: ${g.docente}` })),
    ...grupos.filter((g) => !Object.keys(g.plan ?? {}).length).map((g) => ({ titulo: `${g.nombre}: sin temas en el plan`, detalle: `Docente: ${g.docente}` })),
    ...(porRevisar ? [{ titulo: <Enlace ruta="/colegio/planeaciones" className="enlace">{porRevisar === 1 ? '1 planeación por revisar' : `${porRevisar} planeaciones por revisar`}</Enlace> }] : []),
  ];

  return (
    <>
      <Cifras>
        <CifraGrande valor={fmt(t.semana)} de={`de ${fmt(t.conCuenta)}`} etiqueta="Niños activos esta semana" nota={t.conCuenta ? porciento(t.semana, t.conCuenta) : undefined} />
        <CifraGrande valor={fmt(t.mes)} etiqueta="Activos en el último mes" />
        <CifraGrande valor={fmt(t.misiones)} etiqueta="Misiones completadas" />
        <CifraGrande valor={fmt(t.temasHechos)} etiqueta="Temas dados" nota={t.temasEnCurso ? `${t.temasEnCurso} en curso` : undefined} />
        {entregas && <CifraGrande valor={fmt(entregas.length)} etiqueta="Planeaciones entregadas" nota={porRevisar ? `${porRevisar} por revisar` : 'Todas revisadas'} />}
      </Cifras>

      <div className="no-imprimir">
        <Panel titulo="Para atender">
          <Alertas items={alertas} vacio="Todos los grupos tienen actividad, autorizaciones y plan." />
        </Panel>
      </div>

      <div className="tablero__par">
        <Panel titulo="Ejecución del plan por docente" fin={<span className="meta">Temas</span>}>
          {ejecucion.some((d) => d.valor || d.resto) ? <Barras datos={ejecucion} leyenda={['Dados', 'En curso']} /> : <p className="meta">Aún no hay temas marcados en los planes de los grupos.</p>}
        </Panel>
        {entregas && (
          <Panel titulo="Planeaciones entregadas" fin={<Enlace ruta="/colegio/planeaciones" className="enlace">Revisar</Enlace>}>
            {planeaciones.some((d) => d.valor || d.resto) ? <Barras datos={planeaciones} leyenda={['Revisadas', 'Por revisar o en ajuste']} /> : <p className="meta">Todavía ningún docente entrega una planeación.</p>}
          </Panel>
        )}
      </div>

      <Panel titulo="Participación por grado" fin={<span className="meta">Activos esta semana / con cuenta</span>}>
        {participacion.length ? <Barras datos={participacion} maximo={100} /> : <p className="meta">Ningún grado tiene todavía grupos con 5 o más niños autorizados.</p>}
      </Panel>
    </>
  );
}
