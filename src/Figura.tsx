// El personaje con lo que lleva puesto. Lo usan el mundo y el vestidor: las piezas se colocan
// con las anclas del héroe y el punto de agarre de cada pieza, todo del contenido.
import type { CSSProperties, Ref } from 'react';
import type { Accesorio, Heroe, Ranura } from './tipos';

/** Las piezas elegidas que de verdad se pueden llevar: existen y ya se abrieron. */
export function accesoriosPuestos(accesorios: Accesorio[], elegidos: Partial<Record<Ranura, string>> | undefined, estrellas: number): Accesorio[] {
  return accesorios.filter((a) => elegidos?.[a.ranura] === a.id && estrellas >= a.estrellas);
}

interface Props {
  heroe: Heroe;
  puestos: Accesorio[];
  base: string;
  /** Ancho en píxeles con que se dibuja el héroe. */
  ancho: number;
  ref?: Ref<HTMLDivElement>;
}

export function Figura({ heroe, puestos, base, ancho, ref }: Props) {
  const alto = heroe.alto ? Math.round((heroe.alto / heroe.ancho) * ancho) : undefined;
  return (
    <div ref={ref} className="figura" style={{ width: ancho }}>
      <img className="figura__heroe" src={base + heroe.imagen} alt={heroe.nombre} width={ancho} height={alto} draggable={false} />
      {puestos.map((a) => {
        const ancla = heroe.anclas?.[a.ranura];
        if (!ancla) return null;
        const lugar = { '--x': ancla.x, '--y': ancla.y, '--ancho': a.ancho * ancla.escala, '--px': a.punto[0], '--py': a.punto[1] } as CSSProperties;
        return <img key={a.id} className={`figura__accesorio figura__accesorio--${a.ranura}`} src={base + a.imagen} alt="" width="128" height="128" draggable={false} style={lugar} />;
      })}
    </div>
  );
}
