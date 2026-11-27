// Tablero del dueño (/plataforma/tablero): cómo va cada colegio. Lee las mismas cifras sumadas por
// grupo que ve el coordinador (`cifras_grupos` con el colegio), más docentes y cartillas.
import { Boton, Encabezado, Enlace, Panel, Vacio } from '../base';
import { Cargado, useCarga, useTitulo } from '../comun';
import { cifrasGrupos, listarColegios, listarHabilitadas, listarPersonas, type Cifra, type Colegio } from '../datos';
import { Alertas, Barras, Cifra as CifraGrande, Cifras, type Dato } from './graficos';
import { totales } from './ResumenColegio';
import { porciento, useEnVivo } from './vivo';

interface Fila { c: Colegio; grupos: Cifra[]; docentes: number; cartillas: number; t: ReturnType<typeof totales> }

async function leerTablero(): Promise<Fila[]> {
  const [colegios, personas, habilitadas] = await Promise.all([listarColegios(), listarPersonas(), listarHabilitadas()]);
  const cifras = await Promise.all(colegios.map((c) => cifrasGrupos(c.id).catch(() => [] as Cifra[])));
  return colegios.map((c, i) => ({
    c,
    grupos: cifras[i],
    docentes: personas.filter((p) => p.colegio_id === c.id && p.rol === 'docente' && p.activo !== false).length,
    cartillas: habilitadas.filter((h) => h.colegio_id === c.id).length,
    t: totales(cifras[i]),
  }));
}

const fmt = (n: number) => n.toLocaleString('es-CO');

export function TableroDueno() {
  useTitulo('Tablero de colegios');
  const carga = useCarga(leerTablero, 'tablero-dueno');
  const hora = useEnVivo(carga.recargar, Boolean(carga.datos));
  return (
    <div className="tablero">
      <div className="cabeza-pagina">
        <Encabezado titulo="Tablero de colegios" meta={`Se actualiza solo · ${hora}`} />
        <div className="no-imprimir">
          <Boton icono="imprimir" onClick={() => window.print()}>Imprimir</Boton>
        </div>
      </div>
      <Cargado carga={carga}>
        {(filas) => {
          if (!filas.length)
            return (
              <Panel>
                <Vacio titulo="Todavía no hay colegios" texto="Cuando cree el primero, aquí verá su uso.">
                  <Boton variante="primario" icono="crear" ruta="/plataforma/colegios/nuevo">Crear colegio</Boton>
                </Vacio>
              </Panel>
            );
          const todo = totales(filas.flatMap((f) => f.grupos));
          const docentes = filas.reduce((a, f) => a + f.docentes, 0);
          const activos: Dato[] = filas
            .filter((f) => f.t.conCuenta)
            .map((f) => ({ etiqueta: f.c.nombre, nombre: f.c.nombre, valor: Math.round((f.t.semana / f.t.conCuenta) * 100), texto: porciento(f.t.semana, f.t.conCuenta) }));
          const alertas = filas.flatMap((f) => {
            const a: { titulo: string; detalle?: string }[] = [];
            if (!f.cartillas) a.push({ titulo: `${f.c.nombre}: sin cartilla habilitada` });
            if (!f.docentes) a.push({ titulo: `${f.c.nombre}: sin docentes`, detalle: 'Invite al coordinador o a los docentes desde la ficha del colegio.' });
            else if (!f.grupos.length) a.push({ titulo: `${f.c.nombre}: sin grupos`, detalle: `${f.docentes} ${f.docentes === 1 ? 'docente' : 'docentes'}, ningún grupo creado.` });
            else if (f.t.conCuenta && !f.t.semana) a.push({ titulo: `${f.c.nombre}: sin actividad esta semana` });
            return a;
          });
          return (
            <>
              <Cifras>
                <CifraGrande valor={fmt(filas.length)} etiqueta="Colegios" />
                <CifraGrande valor={fmt(docentes)} etiqueta="Docentes" nota={`${fmt(todo.grupos)} grupos`} />
                <CifraGrande valor={fmt(todo.semana)} de={`de ${fmt(todo.conCuenta)}`} etiqueta="Niños activos esta semana" nota={todo.conCuenta ? porciento(todo.semana, todo.conCuenta) : undefined} />
                <CifraGrande valor={fmt(todo.misiones)} etiqueta="Misiones completadas" />
                <CifraGrande valor={fmt(todo.temasHechos)} etiqueta="Temas dados" />
              </Cifras>
              <Panel titulo="Para atender">
                <Alertas items={alertas} vacio="Todos los colegios tienen cartilla, grupos y actividad esta semana." />
              </Panel>
              <Panel titulo="Niños activos esta semana" fin={<span className="meta">Por colegio, de los que tienen cuenta</span>}>
                {activos.length ? <Barras datos={activos} maximo={100} /> : <p className="meta">Ningún colegio tiene todavía grupos con 5 o más niños autorizados.</p>}
              </Panel>
              <Panel titulo="Cada colegio">
                <div className="t-tabla-caja">
                  <table className="t-tabla">
                    <thead>
                      <tr>
                        <th scope="col">Colegio</th>
                        <th scope="col">Docentes</th>
                        <th scope="col">Grupos</th>
                        <th scope="col">Con cuenta</th>
                        <th scope="col">Activos semana</th>
                        <th scope="col">Activos mes</th>
                        <th scope="col">Misiones</th>
                        <th scope="col">Temas dados</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filas.map((f) => (
                        <tr key={f.c.id}>
                          <th scope="row">
                            <Enlace ruta={`/plataforma/colegios/${f.c.id}`} className="enlace">{f.c.nombre}</Enlace>
                          </th>
                          <td>{fmt(f.docentes)}</td>
                          <td>{fmt(f.t.grupos)}</td>
                          <td>{fmt(f.t.conCuenta)}</td>
                          <td>{fmt(f.t.semana)}</td>
                          <td>{fmt(f.t.mes)}</td>
                          <td>{fmt(f.t.misiones)}</td>
                          <td>{fmt(f.t.temasHechos)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
              <p className="t-nota">Los grupos con menos de 5 niños autorizados no suman cifras de niños. Sirve para acompañar a los colegios, no para compararlos en público.</p>
            </>
          );
        }}
      </Cargado>
    </div>
  );
}
