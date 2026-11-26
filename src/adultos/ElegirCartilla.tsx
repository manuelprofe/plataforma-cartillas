// Qué cartilla ve el docente en Planear y Biblioteca: la de sus grupos. Si tiene grupos de
// cartillas distintas (por ejemplo inglés en tercero y matemáticas en primero), elige aquí; si
// todos sus grupos usan la misma, no se muestra nada y se usa esa.
import { useEffect } from 'react';
import { Fila, Panel } from './base';
import { useCarga } from './comun';
import { cargarGrupos, cartillaDeGrupo, titulosCartillas } from './docente';
import { elegirCartillaMateriales, useCartillaMateriales } from '../materiales/datos';
import { personajeDeMateria } from '../marca';

export function ElegirCartilla() {
  const actual = useCartillaMateriales();
  const carga = useCarga(async () => {
    const grupos = await cargarGrupos();
    const ids = [...new Set(grupos.map(cartillaDeGrupo))];
    // Sin red se elige igual; solo faltan los nombres bonitos.
    const titulos = ids.length > 1 ? await titulosCartillas(ids).catch(() => ({}) as Record<string, string>) : {};
    return { ids, titulos };
  }, 'cartillas-docente');
  const ids = carga.datos?.ids;

  // La cartilla guardada ya no es de ninguno de sus grupos: pasa a la del primero.
  useEffect(() => {
    if (ids?.length && !ids.includes(actual)) elegirCartillaMateriales(ids[0]);
  }, [ids, actual]);

  if (!ids || ids.length < 2) return null;
  return (
    <div className="elegir-cartilla">
      <Panel titulo="Cartilla que está viendo" filas>
        {ids.map((id) => (
          <Fila
            key={id}
            icono="cartillas"
            personaje={carga.datos?.titulos[id] ? personajeDeMateria(carga.datos.titulos[id]) : undefined}
            titulo={carga.datos?.titulos[id] ?? id}
            fin={id === actual ? <span className="elegir-cartilla__actual">Viendo</span> : undefined}
            alTocar={id === actual ? undefined : () => elegirCartillaMateriales(id)}
          />
        ))}
      </Panel>
    </div>
  );
}
