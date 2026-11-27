// Tablero del docente (/docente/grupos/:g/avance): cómo va su grupo en los juegos. Lo ve solo el
// docente del grupo (la base lo decide con puedo_ver_estudiante). Sin rankings: la tabla va en
// orden alfabético y "A quién apoyar" invita a acompañar, no a señalar.
import { Boton, Encabezado, Panel, Vacio } from '../base';
import { Cargado, useCarga, useTitulo } from '../comun';
import { leer } from '../cuenta';
import { cargarSala, type CartillaJuegos } from '../../sala/Sala';
import { CALCOMANIAS } from '../../Calcomania';
import { cartillaDeGrupo, hoyCo, type GrupoDoc, type Nino } from '../docente';
import { fechaCorta } from '../docenteComun';
import { Alertas, Barras, Cifra, Cifras, Columnas, type Dato } from './graficos';
import { diaMes, diasEntre, porciento, restarDias, useEnVivo } from './vivo';

interface Progreso { estudiante_id: string; mision_id: string; veces: number; mejor_errores: number; autoeval: number | null }
interface Estrella { estudiante_id: string; motivo: string; cantidad: number }
interface Dia { estudiante_id: string; fecha: string }
interface Lectura { progreso: Progreso[]; estrellas: Estrella[]; dias: Dia[]; sala: CartillaJuegos | null }

const SEMANAS = 8;
/** Errores desde los que una misión "costó" (la mejor vez). */
const COSTO = 3;

async function leerAvance(cartilla: string, ninos: Nino[]): Promise<Lectura> {
  const ids = ninos.map((n) => n.id).join(',');
  const desde = restarDias(hoyCo(), SEMANAS * 7 - 1);
  const c = encodeURIComponent(cartilla);
  const [progreso, estrellas, dias, sala] = await Promise.all([
    leer<Progreso>('progreso_misiones', `select=estudiante_id,mision_id,veces,mejor_errores,autoeval&cartilla_id=eq.${c}&estudiante_id=in.(${ids})`),
    leer<Estrella>('estrellas', `select=estudiante_id,motivo,cantidad&cartilla_id=eq.${c}&estudiante_id=in.(${ids})`),
    leer<Dia>('dias_practica', `select=estudiante_id,fecha&fecha=gte.${desde}&estudiante_id=in.(${ids})`),
    cargarSala()
      .then((cs) => cs.find((x) => x.id === cartilla) ?? null)
      .catch(() => null),
  ]);
  return { progreso, estrellas, dias, sala };
}

export function AvanceGrupo({ grupo, ninos }: { grupo: GrupoDoc; ninos: Nino[] }) {
  useTitulo(`Avance de ${grupo.nombre}`);
  const cartilla = cartillaDeGrupo(grupo);
  const carga = useCarga(() => (ninos.length ? leerAvance(cartilla, ninos) : Promise.resolve(null)), `avance-${grupo.id}`);
  const hora = useEnVivo(carga.recargar, Boolean(carga.datos));
  const volver = { ruta: `/docente/grupos/${encodeURIComponent(grupo.id)}`, etiqueta: `Grupo ${grupo.nombre}` };
  return (
    <div className="tablero">
      <div className="cabeza-pagina">
        <Encabezado titulo={`Avance de ${grupo.nombre}`} meta={`En los juegos de la cartilla · se actualiza solo · ${hora}`} volver={volver} />
        <div className="no-imprimir">
          <Boton icono="imprimir" onClick={() => window.print()}>Imprimir</Boton>
        </div>
      </div>
      <Cargado carga={carga}>
        {(l) =>
          !l ? (
            <Panel>
              <Vacio titulo="Todavía no hay niños en el grupo" texto="Agregue los apodos y entregue las tarjetas. Cuando jueguen con su cuenta, aquí verá su avance." />
            </Panel>
          ) : (
            <Tablero l={l} ninos={ninos} />
          )
        }
      </Cargado>
    </div>
  );
}

function Tablero({ l, ninos }: { l: Lectura; ninos: Nino[] }) {
  const hoy = hoyCo();
  const conCuenta = ninos.filter((n) => n.autorizacion);
  const N = conCuenta.length;
  const deNino = <T extends { estudiante_id: string }>(filas: T[], id: string) => filas.filter((f) => f.estudiante_id === id);

  // Participación
  const semana = new Set(l.dias.filter((d) => diasEntre(d.fecha, hoy) < 7).map((d) => d.estudiante_id));
  const diasSemana = l.dias.filter((d) => diasEntre(d.fecha, hoy) < 7).length;
  const columnas: Dato[] = Array.from({ length: SEMANAS }, (_, i) => {
    const k = SEMANAS - 1 - i; // semanas atrás
    const inicio = restarDias(hoy, k * 7 + 6);
    const n = new Set(l.dias.filter((d) => Math.floor(diasEntre(d.fecha, hoy) / 7) === k).map((d) => d.estudiante_id)).size;
    return { etiqueta: k === 0 ? 'Esta' : diaMes(inicio), nombre: k === 0 ? 'Esta semana' : `Semana del ${diaMes(inicio)}`, valor: n, texto: String(n) };
  });

  // Avance por tema (en el orden de la cartilla)
  const juegos = (l.sala?.juegos ?? []).filter((j) => !j.repaso);
  const temas = new Map<string, string[]>();
  for (const j of juegos) {
    const t = j.tema || j.titulo;
    temas.set(t, [...(temas.get(t) ?? []), j.id]);
  }
  const porTema: Dato[] = [];
  let sinEmpezar = 0;
  for (const [tema, misiones] of temas) {
    let fluido = 0;
    let costo = 0;
    for (const n of conCuenta) {
      const hechas = l.progreso.filter((p) => p.estudiante_id === n.id && misiones.includes(p.mision_id));
      if (!hechas.length) continue;
      if (Math.min(...hechas.map((p) => p.mejor_errores)) <= 1) fluido++;
      else costo++;
    }
    if (fluido + costo === 0) sinEmpezar++;
    else porTema.push({ etiqueta: tema, nombre: tema, valor: fluido, resto: costo, texto: `${fluido + costo} de ${N}` });
  }

  // Conductas, caritas y mejora
  const motivos = Object.keys(CALCOMANIAS) as (keyof typeof CALCOMANIAS)[];
  const conductas: Dato[] = motivos.map((m) => {
    const v = l.estrellas.filter((e) => e.motivo === m).reduce((a, e) => a + e.cantidad, 0);
    return { etiqueta: CALCOMANIAS[m].nombre, nombre: CALCOMANIAS[m].nombre, valor: v };
  });
  const caritas: Dato[] = (
    [
      [3, '😄 Muy bien'],
      [2, '🙂 Bien'],
      [1, '🤔 Me costó'],
    ] as const
  ).map(([v, e]) => ({ etiqueta: e, nombre: e, valor: l.progreso.filter((p) => p.autoeval === v).length }));
  const totalCaritas = caritas.reduce((a, d) => a + d.valor, 0);
  const repetidas = l.progreso.filter((p) => p.veces > 1).length;
  const totalCalcos = l.estrellas.reduce((a, e) => a + e.cantidad, 0);

  // Por niño (alfabético, como llega)
  const filas = conCuenta.map((n) => {
    const dias = deNino(l.dias, n.id).map((d) => d.fecha).sort();
    const prog = deNino(l.progreso, n.id);
    return {
      n,
      dias: dias.length,
      ultima: dias[dias.length - 1] as string | undefined,
      misiones: prog.length,
      costaron: prog.filter((p) => p.mejor_errores >= COSTO).length,
      calcos: deNino(l.estrellas, n.id).reduce((a, e) => a + e.cantidad, 0),
    };
  });
  const apoyar = filas
    .filter((f) => !f.ultima || diasEntre(f.ultima, hoy) >= 7 || f.costaron >= 2)
    .map((f) => {
      const motivos: string[] = [];
      if (!f.ultima) motivos.push('aún no ha jugado con su cuenta');
      else if (diasEntre(f.ultima, hoy) >= 7) motivos.push(`no practica desde el ${fechaCorta(f.ultima)}`);
      if (f.costaron >= 2) motivos.push(`${f.costaron} misiones le costaron; vale repasarlas con él o ella en clase`);
      return { titulo: f.n.apodo, detalle: motivos.join(' · ') };
    });

  return (
    <>
      <Cifras>
        <Cifra valor={String(semana.size)} de={`de ${N}`} etiqueta="Practicaron esta semana" nota={N < ninos.length ? `${ninos.length - N} sin autorización no se cuentan` : undefined} />
        <Cifra valor={semana.size ? (diasSemana / semana.size).toLocaleString('es-CO', { maximumFractionDigits: 1 }) : '0'} etiqueta="Días de práctica por niño activo" nota="Últimos 7 días" />
        <Cifra valor={String(l.progreso.length)} etiqueta="Misiones completadas" nota={N && juegos.length ? `Promedio ${porciento(l.progreso.length, N * juegos.length)} de las ${juegos.length} misiones` : undefined} />
        <Cifra valor={String(repetidas)} etiqueta="Misiones repetidas para mejorar" />
        <Cifra valor={String(totalCalcos)} etiqueta="Calcomanías" />
      </Cifras>

      <Panel titulo="A quién apoyar" fin={<span className="meta">Solo lo ve usted</span>}>
        <Alertas items={apoyar} vacio="Todos practicaron esta semana y ninguna misión les está costando de más." />
      </Panel>

      <Panel titulo="Niños que practicaron cada semana" fin={<span className="meta">Últimas {SEMANAS} semanas</span>}>
        <Columnas datos={columnas} nombre="Niños que practicaron cada semana" />
      </Panel>

      <Panel titulo="Avance por tema" fin={<span className="meta">Niños que completaron al menos una misión</span>}>
        {porTema.length ? (
          <Barras datos={porTema} maximo={N} leyenda={['Con 0 o 1 error', 'Les costó más']} />
        ) : (
          <p className="meta">Todavía nadie completa una misión de esta cartilla.</p>
        )}
        {sinEmpezar > 0 && porTema.length > 0 && <p className="t-nota">{sinEmpezar === 1 ? 'Un tema aún sin empezar' : `${sinEmpezar} temas aún sin empezar`}.</p>}
      </Panel>

      <div className="tablero__par">
        <Panel titulo="Conductas reconocidas" fin={<span className="meta">Calcomanías</span>}>
          <Barras datos={conductas} />
        </Panel>
        <Panel titulo="Cómo se sintieron" fin={<span className="meta">Caritas al cerrar la misión</span>}>
          {totalCaritas ? <Barras datos={caritas} maximo={totalCaritas} /> : <p className="meta">Aún no hay caritas.</p>}
        </Panel>
      </div>

      <Panel titulo="Cada niño" fin={<span className="meta">En orden alfabético</span>}>
        {filas.length === 0 ? (
          <p className="meta">Ningún niño tiene la autorización marcada todavía.</p>
        ) : (
          <div className="t-tabla-caja">
            <table className="t-tabla">
              <thead>
                <tr>
                  <th scope="col">Niño</th>
                  <th scope="col">Días ({SEMANAS} sem.)</th>
                  <th scope="col">Misiones</th>
                  <th scope="col">Calcomanías</th>
                  <th scope="col">Última vez</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.n.id}>
                    <th scope="row">{f.n.apodo}</th>
                    <td>{f.dias}</td>
                    <td>{f.misiones}</td>
                    <td>{f.calcos}</td>
                    <td>{f.ultima ? fechaCorta(f.ultima) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <p className="t-nota">
        Cuenta lo que los niños juegan con su tarjeta, en casa o en el colegio. Complementa la nota institucional; no sirve para calificar ni para comparar niños.
      </p>
    </>
  );
}
