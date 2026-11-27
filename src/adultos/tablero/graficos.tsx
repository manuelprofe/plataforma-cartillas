// Gráficos de los tableros de adultos, en HTML y CSS (sin librería: el paquete sigue liviano).
// Una sola tinta para la magnitud; el texto va siempre en las tintas de texto; cada marca lleva
// su valor en `title` (se ve al pasar el dedo o el ratón) y los valores clave van escritos.
import type { ReactNode } from 'react';
import './tablero.css';

export interface Dato {
  etiqueta: ReactNode;
  /** Texto plano para el título emergente y los lectores de pantalla. */
  nombre: string;
  valor: number;
  /** Lo que se escribe a la derecha (por defecto, el valor). */
  texto?: string;
  /** Segunda parte de la barra (apilada): se pinta más clara. */
  resto?: number;
}

/** Cifra grande con su explicación debajo: para lo que es una sola respuesta. */
export function Cifra({ valor, de, etiqueta, nota }: { valor: string; de?: string; etiqueta: string; nota?: string }) {
  return (
    <div className="t-cifra">
      <p className="t-cifra__valor">
        {valor}
        {de && <span className="t-cifra__de"> {de}</span>}
      </p>
      <p className="t-cifra__etiqueta">{etiqueta}</p>
      {nota && <p className="meta">{nota}</p>}
    </div>
  );
}

export function Cifras({ children }: { children: ReactNode }) {
  return <div className="t-cifras">{children}</div>;
}

/** Barras horizontales sobre una escala común (`maximo`, por defecto el mayor valor). */
export function Barras({ datos, maximo, leyenda, unidad = '' }: { datos: Dato[]; maximo?: number; leyenda?: [string, string]; unidad?: string }) {
  const tope = Math.max(maximo ?? 0, ...datos.map((d) => d.valor + (d.resto ?? 0)), 1);
  return (
    <figure className="t-barras">
      {leyenda && (
        <figcaption className="t-leyenda">
          <span><i className="t-muestra" /> {leyenda[0]}</span>
          <span><i className="t-muestra t-muestra--resto" /> {leyenda[1]}</span>
        </figcaption>
      )}
      <ul>
        {datos.map((d, i) => (
          <li key={i} className="t-barra" title={`${d.nombre}: ${d.texto ?? d.valor}${unidad}`}>
            <span className="t-barra__etiqueta">{d.etiqueta}</span>
            <span className="t-barra__pista" aria-hidden="true">
              <span className="t-barra__valor" style={{ width: `${(d.valor / tope) * 100}%` }} />
              {d.resto ? <span className="t-barra__resto" style={{ width: `${(d.resto / tope) * 100}%` }} /> : null}
            </span>
            <span className="t-barra__texto">
              {d.texto ?? d.valor}
              {unidad}
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** Columnas en el tiempo (semanas). Se escribe el valor de la última y del pico. */
export function Columnas({ datos, nombre }: { datos: Dato[]; nombre: string }) {
  const tope = Math.max(...datos.map((d) => d.valor), 1);
  const pico = datos.reduce((m, d, i) => (d.valor > datos[m].valor ? i : m), 0);
  return (
    <figure className="t-columnas" aria-label={nombre}>
      <ol>
        {datos.map((d, i) => (
          <li key={i} title={`${d.nombre}: ${d.texto ?? d.valor}`}>
            <span className="t-columna__valor">{i === datos.length - 1 || (i === pico && d.valor > 0) ? (d.texto ?? d.valor) : ''}</span>
            <span className="t-columna__pista">
              <span className={`t-columna${i === datos.length - 1 ? ' t-columna--actual' : ''}`} style={{ height: `${Math.max((d.valor / tope) * 100, d.valor > 0 ? 4 : 0)}%` }} />
            </span>
            <span className="t-columna__etiqueta">{d.etiqueta}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}

/** Lista corta con un ícono de estado y su texto: alertas y "a quién apoyar". */
export function Alertas({ items, vacio }: { items: { titulo: ReactNode; detalle?: ReactNode; tono?: 'aviso' | 'ok' }[]; vacio: string }) {
  if (!items.length) return <p className="t-alerta t-alerta--ok">✓ {vacio}</p>;
  return (
    <ul className="t-alertas">
      {items.map((a, i) => (
        <li key={i} className={`t-alerta t-alerta--${a.tono ?? 'aviso'}`}>
          <span className="t-alerta__titulo">{a.titulo}</span>
          {a.detalle && <span className="meta">{a.detalle}</span>}
        </li>
      ))}
    </ul>
  );
}
