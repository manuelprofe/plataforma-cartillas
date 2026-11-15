// Álbum del explorador: las palabras que el niño encontró en el mundo, para
// volver a escucharlas, y las palabras de las misiones que conviene repasar porque
// costaron un poco. Las estelas viven en el vestidor (son del personaje).
import type { Palabra } from './tipos';
import { decir, sonar } from './audio';

interface Props {
  palabras: Palabra[];
  /** Palabras de misión que costaron; se muestran primero para volver a oírlas. */
  repasar: Palabra[];
  total: number;
  base: string;
  vozIngles: string;
  onCerrar: () => void;
}

export function Album({ palabras, repasar, total, base, vozIngles, onCerrar }: Props) {
  return (
    <div className="panel" role="dialog" aria-label="Álbum de palabras">
      <div className={`panel__caja${repasar.length ? '' : ' panel__caja--corta'}`}>
        <div className="panel__cabeza">
          <strong>
            📖 {palabras.length}/{total}
          </strong>
          <button type="button" className="panel__cerrar" onClick={onCerrar} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {repasar.length > 0 && (
          <div className="repasar" aria-label="Para repasar">
            <span className="repasar__marca" aria-hidden="true">
              🔁
            </span>
            {repasar.map((p) => (
              <button
                key={p.en}
                type="button"
                className="repasar__una"
                onClick={() => {
                  sonar('toque');
                  decir(p.en, vozIngles);
                }}
                aria-label={`Repasar ${p.en}`}
              >
                <img src={base + p.icono} alt="" width="44" height="44" draggable={false} />
                <span lang="en">{p.en}</span>
              </button>
            ))}
          </div>
        )}

        {palabras.length === 0 ? (
          <p className="panel__vacio">✦ 🦋 🐸 → 📖</p>
        ) : (
          <div className="album">
            {palabras.map((p) => (
              <button
                key={p.en}
                type="button"
                className="album__carta"
                onClick={() => {
                  sonar('toque');
                  decir(p.en, vozIngles);
                }}
              >
                <img src={base + p.icono} alt="" width="56" draggable={false} />
                <span lang="en">{p.en}</span>
                <small>{p.es}</small>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
