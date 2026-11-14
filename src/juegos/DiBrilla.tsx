// Plantilla "Di y brilla" (Speak & Shine): el niño escucha la palabra y la dice.
// No contiene vocabulario: recibe las palabras de la misión.
// Se premia el intento (regla 6): cualquier cosa que diga cuenta y nunca se marca un error.
// Si no hay micrófono, puede escribirla o decirla en voz alta y tocar la mano.
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Mision } from '../tipos';
import { anotarPractica } from '../progreso';
import { callar, decir, sonar } from '../audio';
import { comparaEscrito, escuchar, hayMicrofono, seOyo } from '../escuchar';
import { CierreMision } from './CierreMision';
import { mezclar } from './mezclar';

const RONDAS = 5;

interface Props {
  mision: Mision;
  base: string;
  idiomaVoz: string;
  imagenFiesta: string;
  onTerminar: () => void;
  onSalir: () => void;
}

/** Qué pasa con la palabra de esta ronda. */
type Estado = 'listo' | 'escuchando' | 'brilla' | 'intento' | 'silencio' | 'escribir' | 'casi' | 'otra';

export function DiBrilla({ mision, base, idiomaVoz, imagenFiesta, onTerminar, onSalir }: Props) {
  const [rondas] = useState(() => mezclar(mision.palabras).slice(0, RONDAS));
  const [indice, setIndice] = useState(0);
  const [estado, setEstado] = useState<Estado>('listo');
  const [micro, setMicro] = useState(hayMicrofono);
  const [escrito, setEscrito] = useState('');
  const [costaron, setCostaron] = useState<string[]>([]);
  const [fin, setFin] = useState(false);
  const cancelar = useRef<() => void>(() => {});
  const campo = useRef<HTMLInputElement>(null);

  const palabra = rondas[indice];
  // Después de intentarlo una vez, ya puede seguir.
  const intento = estado !== 'listo' && estado !== 'escuchando' && estado !== 'silencio' && estado !== 'escribir';

  useEffect(
    () => () => {
      cancelar.current();
      callar();
    },
    [],
  );

  useEffect(() => {
    if (fin || !palabra) return;
    const t = window.setTimeout(() => decir(palabra.en, idiomaVoz), 400);
    return () => clearTimeout(t);
  }, [indice, fin, palabra, idiomaVoz]);

  useEffect(() => {
    if (estado === 'escribir') campo.current?.focus();
  }, [estado]);

  const costo = () => {
    if (!costaron.includes(palabra.en)) setCostaron([...costaron, palabra.en]);
  };

  const oir = () => {
    sonar('toque');
    decir(palabra.en, idiomaVoz);
  };

  const hablar = () => {
    if (estado === 'escuchando') return;
    callar();
    sonar('toque');
    setEstado('escuchando');
    cancelar.current = escuchar(idiomaVoz, (r) => {
      if (r.tipo === 'sin-micro') {
        // Sin micrófono: se pasa a escribir sin decirle nada técnico al niño.
        setMicro(false);
        setEstado('listo');
      } else if (r.tipo === 'silencio') {
        sonar('salto');
        setEstado('silencio');
      } else if (seOyo(r.frases, palabra.en)) {
        sonar('acierto');
        setEstado('brilla');
      } else {
        // Dijo algo: se celebra el intento y se le vuelve a modelar la palabra.
        sonar('salto');
        costo();
        setEstado('intento');
        window.setTimeout(() => decir(palabra.en, idiomaVoz), 600);
      }
    });
  };

  const loDije = () => {
    sonar('acierto');
    setEstado('brilla');
  };

  const revisarEscrito = (e: FormEvent) => {
    e.preventDefault();
    const r = comparaEscrito(escrito, palabra.en);
    if (r === 'otra' && !escrito.trim()) return;
    if (r === 'bien') sonar('acierto');
    else sonar('salto');
    if (r !== 'bien') costo();
    setEstado(r === 'bien' ? 'brilla' : r);
    decir(palabra.en, idiomaVoz);
  };

  const seguir = () => {
    cancelar.current();
    sonar('toque');
    setEscrito('');
    setEstado('listo');
    if (indice + 1 < rondas.length) setIndice(indice + 1);
    else {
      sonar('fiesta');
      setFin(true);
    }
  };

  return (
    <div className="mision">
      <header className="mision__barra">
        <button type="button" className="boton-salir" onClick={onSalir} aria-label="Volver al mapa">
          ✕
        </button>
        {!fin && (
          <div className="puntos" aria-hidden="true">
            {rondas.map((p, i) => (
              <span key={p.en} className={`punto${i < indice ? ' punto--hecho' : i === indice ? ' punto--ahora' : ''}`} />
            ))}
          </div>
        )}
      </header>

      {!fin && palabra && (
        <main className={`decir decir--${estado}`}>
          <button type="button" className="carta-grande decir__carta" key={palabra.en} onClick={oir} aria-label={`Escuchar ${palabra.en}`}>
            <img src={base + palabra.icono} alt="" width="150" height="150" draggable={false} />
            <strong lang="en">{palabra.en}</strong>
            <small>{palabra.es}</small>
            <span className="carta-grande__oir" aria-hidden="true">🔊</span>
            {estado === 'brilla' && <span className="decir__brillo" aria-hidden="true" />}
          </button>

          <div className="decir__eco" aria-live="polite">
            {estado === 'brilla' && <span aria-label="¡Brilla!">✨⭐✨</span>}
            {(estado === 'intento' || estado === 'casi') && <span aria-label="¡Buen intento!">👏</span>}
            {estado === 'silencio' && <span aria-label="No te oí, inténtalo otra vez">👂</span>}
            {estado === 'otra' && <span aria-label="Mira cómo se escribe">👀</span>}
          </div>

          {estado === 'escribir' || estado === 'casi' || estado === 'otra' ? (
            <form className="escribir" onSubmit={revisarEscrito}>
              <input
                ref={campo}
                className="escribir__campo"
                lang="en"
                value={escrito}
                onChange={(e) => setEscrito(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint="done"
                maxLength={30}
                aria-label="Escribe la palabra"
              />
              <button type="submit" className="escribir__listo" aria-label="Listo">
                ✓
              </button>
            </form>
          ) : (
            <div className="decir__botones">
              {micro ? (
                <button type="button" className={`microfono${estado === 'escuchando' ? ' es-escuchando' : ''}`} onClick={hablar} aria-label="Toca y di la palabra">
                  🎤
                </button>
              ) : (
                <button type="button" className="microfono microfono--mano" onClick={loDije} aria-label="Ya la dije en voz alta">
                  🗣️
                </button>
              )}
              <button
                type="button"
                className="boton-redondo"
                onClick={() => {
                  cancelar.current();
                  sonar('toque');
                  setEstado('escribir');
                }}
                aria-label="Escribir la palabra"
              >
                ⌨️
              </button>
            </div>
          )}

          {intento && (
            <button type="button" className="boton-seguir" onClick={seguir} aria-label="Siguiente">
              ➜
            </button>
          )}
        </main>
      )}

      {fin && (
        <CierreMision
          mision={mision}
          errores={costaron.length}
          base={base}
          imagenFiesta={imagenFiesta}
          alRegistrar={() =>
            anotarPractica(
              rondas.filter((p) => !costaron.includes(p.en)),
              rondas.filter((p) => costaron.includes(p.en)),
            )
          }
          onTerminar={onTerminar}
        />
      )}
    </div>
  );
}
