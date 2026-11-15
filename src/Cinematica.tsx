// Reproductor de cinemáticas. Elige el video vertical (celular) u horizontal (computador o
// proyector) según la pantalla, dice la narración del contenido en su momento y siempre se
// puede saltar. Si el video no carga (sin red), sigue de largo sin darlo por visto y avisa
// a quien la abrió (`onTerminar(false)`), sin mostrarle ningún error al niño.
import { useEffect, useRef, useState } from 'react';
import type { Cinematica as DatosCinematica } from './tipos';
import { callar, decir } from './audio';
import { marcarVista } from './progreso';

interface Props {
  cine: DatosCinematica;
  base: string;
  vozEspanol: string;
  /** `vista` es falso si el video no se pudo ver. */
  onTerminar: (vista: boolean) => void;
}

export function Cinematica({ cine, base, vozEspanol, onTerminar }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const dichas = useRef(new Set<number>());
  const listo = useRef(false);
  const [linea, setLinea] = useState<number | null>(null);
  const [vertical] = useState(() => window.matchMedia('(orientation: portrait)').matches);

  const terminar = (vista: boolean) => {
    if (listo.current) return;
    listo.current = true;
    callar();
    if (vista) marcarVista(cine.vista);
    onTerminar(vista);
  };

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    // Con sonido si el navegador lo permite; si no, sin sonido del video (la narración sigue).
    v.play().catch(() => {
      v.muted = true;
      v.play().catch(() => terminar(false));
    });
    return () => callar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const alAvanzar = () => {
    const t = video.current?.currentTime ?? 0;
    cine.lineas.forEach((l, i) => {
      if (t >= l.t && !dichas.current.has(i)) {
        dichas.current.add(i);
        setLinea(i);
        decir(l.es, vozEspanol);
      }
    });
  };

  return (
    <div className="cine">
      <video
        ref={video}
        className="cine__video"
        src={base + (vertical ? cine.videos.vertical : cine.videos.horizontal)}
        poster={cine.poster ? base + cine.poster : undefined}
        playsInline
        preload="auto"
        onTimeUpdate={alAvanzar}
        onEnded={() => terminar(true)}
        onError={() => terminar(false)}
        aria-hidden="true"
      />
      {linea !== null && (
        <p className="cine__texto" key={linea}>
          {cine.lineas[linea].es}
        </p>
      )}
      <button type="button" className="cine__saltar" onClick={() => terminar(true)} aria-label="Saltar">
        ⏭
      </button>
    </div>
  );
}
