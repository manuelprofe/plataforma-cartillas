// Antes de empezar, el niño elige con qué personaje recorre Englishland.
// Se elige tocando: cada personaje saluda en voz alta y un botón grande confirma.
import { useState } from 'react';
import type { Heroe } from './tipos';
import { decir, sonar } from './audio';

interface Props {
  heroes: Heroe[];
  base: string;
  vozEspanol: string;
  elegido?: string;
  onElegir: (id: string) => void;
}

export function ElegirHeroe({ heroes, base, vozEspanol, elegido, onElegir }: Props) {
  const [marcado, setMarcado] = useState<string | undefined>(elegido);

  return (
    <div className="elegir">
      <h1>¿Quién quieres ser?</h1>
      <div className="elegir__fila">
        {heroes.map((h) => (
          <button
            key={h.id}
            type="button"
            className={`elegir__heroe${marcado === h.id ? ' es-elegido' : ''}`}
            aria-pressed={marcado === h.id}
            aria-label={h.nombre}
            onClick={() => {
              sonar('salto');
              setMarcado(h.id);
              decir(h.saludo.es, vozEspanol);
            }}
          >
            <img src={base + h.imagen} alt="" draggable={false} />
            <span>{h.nombre}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        className="boton-jugar"
        aria-label="Empezar"
        disabled={!marcado}
        onClick={() => {
          if (!marcado) return;
          sonar('fiesta');
          onElegir(marcado);
        }}
      >
        ✓
      </button>
    </div>
  );
}
