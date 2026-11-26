// Materia y grado: dos filas de botones que eligen la cartilla del catálogo. Lo usan el armador y
// el pensum de la Biblioteca; el docente puede ver cualquier materia y grado, no solo los suyos.
import type { EntradaCatalogo } from './datos';
import { MATERIAS } from './datos';
import '../armador/armador.css';

export function ElegirPensum({ catalogo, valor, elegir }: { catalogo: EntradaCatalogo[]; valor: string; elegir: (id: string) => void }) {
  const actual = catalogo.find((c) => c.id === valor) ?? catalogo[0];
  const materias = MATERIAS.filter((m) => catalogo.some((c) => c.materia === m));
  const grados = catalogo.filter((c) => c.materia === actual?.materia).sort((a, b) => a.grado - b.grado);
  const ir = (materia: string, grado: number) => {
    const c = catalogo.find((x) => x.materia === materia && x.grado === grado) ?? catalogo.find((x) => x.materia === materia);
    if (c) elegir(c.id);
  };
  if (!actual) return null;
  return (
    <div className="elegir-pensum">
      <div className="armar-opciones" role="group" aria-label="Materia">
        {materias.map((m) => (
          <button key={m} type="button" className="boton boton--secundario" aria-pressed={actual.materia === m} onClick={() => ir(m, actual.grado)}>
            {m}
          </button>
        ))}
      </div>
      <div className="armar-opciones" role="group" aria-label="Grado">
        {grados.map((c) => (
          <button key={c.id} type="button" className="boton boton--secundario" aria-pressed={actual.id === c.id} onClick={() => elegir(c.id)}>
            {c.gradoNombre}
          </button>
        ))}
      </div>
    </div>
  );
}
