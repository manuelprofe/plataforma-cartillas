// Mapa pequeño del territorio: dónde está el niño, qué claros ya tienen luz y
// quién necesita ayuda. Se cierra tocando en cualquier parte.
interface Punto {
  x: number;
  y: number;
}

interface Props {
  imagen: string;
  ancho: number;
  alto: number;
  yo: Punto & { imagen: string };
  misiones: (Punto & { id: string; icono: string; hecha: boolean; elegida: boolean })[];
  vecinos: (Punto & { id: string; imagen: string; ayudado: boolean })[];
  puente: Punto & { abierto: boolean };
  onCerrar: () => void;
}

export function MiniMapa({ imagen, ancho, alto, yo, misiones, vecinos, puente, onCerrar }: Props) {
  const lugar = (p: Punto) => ({ left: `${(p.x / ancho) * 100}%`, top: `${(p.y / alto) * 100}%` });
  return (
    <div className="panel" role="dialog" aria-label="Mapa del bosque" onClick={onCerrar}>
      <div className="minimapa">
        <img className="minimapa__fondo" src={imagen} alt="" draggable={false} />
        {misiones.map((m) => (
          <span key={m.id} className={`minimapa__punto${m.hecha ? ' es-hecha' : ''}${m.elegida ? ' es-elegida' : ''}`} style={lugar(m)}>
            <img src={m.icono} alt="" width="26" height="26" draggable={false} />
          </span>
        ))}
        {vecinos.map((v) => (
          <span key={v.id} className={`minimapa__vecino${v.ayudado ? '' : ' es-apagado'}`} style={lugar(v)}>
            <img src={v.imagen} alt="" width="30" draggable={false} />
          </span>
        ))}
        <span className={`minimapa__puente${puente.abierto ? ' es-hecha' : ''}`} style={lugar(puente)}>
          ★
        </span>
        <span className="minimapa__yo" style={lugar(yo)}>
          <img src={yo.imagen} alt="" width="34" draggable={false} />
        </span>
        <button type="button" className="panel__cerrar minimapa__cerrar" onClick={onCerrar} aria-label="Cerrar">
          ✕
        </button>
      </div>
    </div>
  );
}
