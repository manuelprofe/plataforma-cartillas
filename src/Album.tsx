// Álbum del explorador: las palabras que el niño encontró en el mundo, para
// volver a escucharlas, y las palabras de las misiones que conviene repasar porque
// costaron un poco. Las estelas viven en el vestidor (son del personaje).
// También guarda los "Recuerdos": las cinemáticas que ya vio, para volver a verlas.
import { useState } from 'react';
import type { Palabra } from './tipos';
import { decir, sonar } from './audio';

export interface Recuerdo {
  id: string;
  titulo: string;
  poster?: string;
}

interface Props {
  palabras: Palabra[];
  /** Palabras de misión que costaron; se muestran primero para volver a oírlas. */
  repasar: Palabra[];
  total: number;
  /** Cinemáticas ya vistas. Sin red no hay video: la tarjeta lo muestra y no pasa nada más. */
  recuerdos: Recuerdo[];
  /** Recuerdo que se intentó ver y no cargó. */
  sinVideo: string | null;
  onVerRecuerdo: (id: string) => void;
  base: string;
  vozIngles: string;
  onCerrar: () => void;
}

export function Album({ palabras, repasar, total, recuerdos, sinVideo, onVerRecuerdo, base, vozIngles, onCerrar }: Props) {
  // Tarjeta que no se pudo abrir: tiembla y muestra una nube en vez de ▶.
  const [dormido, setDormido] = useState<string | null>(sinVideo);
  const verRecuerdo = (id: string) => {
    if (!navigator.onLine) {
      sonar('intenta');
      setDormido(null);
      requestAnimationFrame(() => setDormido(id));
      return;
    }
    sonar('toque');
    onVerRecuerdo(id);
  };

  return (
    <div className="panel" role="dialog" aria-label="Álbum de palabras">
      <div className={"panel__caja panel__caja--album"}>
        <div className="panel__cabeza">
          <strong>
            📖 {palabras.length}/{total}
          </strong>
          <button type="button" className="panel__cerrar" onClick={onCerrar} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {recuerdos.length > 0 && (
          <div className="recuerdos" role="group" aria-label="Recuerdos">
            <span className="repasar__marca" aria-hidden="true">
              🎬
            </span>
            {recuerdos.map((r) => (
              <button key={r.id} type="button" className={`recuerdos__uno${dormido === r.id ? ' es-dormido' : ''}`} onClick={() => verRecuerdo(r.id)} aria-label={`Volver a ver: ${r.titulo}${dormido === r.id ? ' (ahora no se puede, hace falta internet)' : ''}`}>
                {r.poster && <img src={base + r.poster} alt="" width="54" height="96" loading="lazy" draggable={false} />}
                <span className="recuerdos__ver" aria-hidden="true">
                  {dormido === r.id ? '☁️' : '▶'}
                </span>
                <small>{r.titulo}</small>
              </button>
            ))}
          </div>
        )}

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
