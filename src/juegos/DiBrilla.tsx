// Plantilla "Di y brilla" (Speak & Shine): el niño escucha la palabra y la dice.
// No contiene vocabulario: recibe las palabras de la misión.
// Se premia el intento (regla 6): cualquier cosa que diga cuenta y nunca se marca un error.
// Lo que oye el reconocedor no cuenta como tropiezo (falla con voces de niños y con ruido):
// solo lo que escribe y no le sale queda para repasar.
// Si no hay micrófono, puede escribirla o decirla en voz alta y tocar la mano.
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { PropsJuego } from '../tipos';
import { anotarPractica } from '../progreso';
import { callar, decir, sonar } from '../audio';
import { comparaEscrito, escuchar, hayMicrofono, seOyo } from '../escuchar';
import { CierreMision } from './CierreMision';
import { mezclar } from './mezclar';

const RONDAS = 5;

/** Qué pasa con la palabra de esta ronda. */
type Estado = 'listo' | 'escuchando' | 'brilla' | 'intento' | 'silencio' | 'escribir' | 'casi' | 'otra';

export function DiBrilla({ mision, base, idiomaVoz, imagenFiesta, onTerminar, onSalir }: PropsJuego) {
  const [rondas] = useState(() => mezclar(mision.palabras).slice(0, RONDAS));
  const [indice, setIndice] = useState(0);
  const [estado, setEstado] = useState<Estado>('listo');
  // El micrófono falló solo en esta ronda (red, otro programa usándolo...): la siguiente lo ofrece de nuevo.
  const [sinMicroAhora, setSinMicroAhora] = useState(false);
  const [escrito, setEscrito] = useState('');
  // Palabras que le costaron al escribirlas ('casi' u 'otra'). La voz nunca entra aquí.
  const [costaron, setCostaron] = useState<string[]>([]);
  // Palabras que brillaron: solo estas pueden salir de la lista de repaso.
  const [salieron, setSalieron] = useState<string[]>([]);
  const [fin, setFin] = useState(false);
  const cancelar = useRef<() => void>(() => {});
  const campo = useRef<HTMLInputElement>(null);
  const esperas = useRef<number[]>([]);

  const luego = (f: () => void, ms: number) => {
    const t = window.setTimeout(f, ms);
    esperas.current.push(t);
    return t;
  };
  const limpiarEsperas = () => {
    esperas.current.forEach(clearTimeout);
    esperas.current = [];
  };
  // Calla todo lo pendiente: voz que iba a sonar, voz sonando y micrófono abierto.
  const detener = () => {
    limpiarEsperas();
    cancelar.current();
    cancelar.current = () => {};
    callar();
  };

  // hayMicrofono() se consulta en cada render: si el permiso se negó, deja de ofrecerse.
  const micro = hayMicrofono() && !sinMicroAhora;

  const palabra = rondas[indice];
  // Después de intentarlo una vez, ya puede seguir.
  const intento = estado !== 'listo' && estado !== 'escuchando' && estado !== 'silencio' && estado !== 'escribir';
  // Después del intento se revela cómo se escribe, como modelo.
  const mostrarEscrita = intento;

  useEffect(() => detener, []);

  useEffect(() => {
    if (fin || !palabra) return;
    const t = luego(() => decir(palabra.en, idiomaVoz), 400);
    return () => clearTimeout(t);
  }, [indice, fin, palabra, idiomaVoz]);

  useEffect(() => {
    if (estado === 'escribir') campo.current?.focus();
  }, [estado]);

  const costo = () => {
    if (!costaron.includes(palabra.en)) setCostaron([...costaron, palabra.en]);
  };

  const brillar = () => {
    sonar('acierto');
    setEstado('brilla');
    setSalieron((s) => (s.includes(palabra.en) ? s : [...s, palabra.en]));
  };

  const oir = () => {
    // Si el micrófono está abierto, se cierra antes de hablar: así no se oye a sí mismo.
    if (estado === 'escuchando') {
      detener();
      setEstado('listo');
    }
    sonar('toque');
    decir(palabra.en, idiomaVoz);
  };

  const hablar = () => {
    if (estado === 'escuchando') return;
    // Nada de voz sintética mientras escucha: ni la palabra pendiente ni la que está sonando.
    detener();
    sonar('toque');
    setEstado('escuchando');
    cancelar.current = escuchar(idiomaVoz, (r) => {
      cancelar.current = () => {};
      if (r.tipo === 'sin-micro') {
        // Sin micrófono en esta ronda: se ofrece la mano o escribir, sin decirle nada técnico.
        setSinMicroAhora(true);
        setEstado('listo');
      } else if (r.tipo === 'silencio') {
        sonar('salto');
        setEstado('silencio');
      } else if (seOyo(r.frases, palabra)) {
        brillar();
      } else {
        // Dijo algo: se celebra el intento y se le vuelve a modelar la palabra.
        // No cuenta como tropiezo: el reconocedor se equivoca con niños y con ruido.
        sonar('salto');
        setEstado('intento');
        luego(() => decir(palabra.en, idiomaVoz), 600);
      }
    });
  };

  const loDije = () => brillar();

  const revisarEscrito = (e: FormEvent) => {
    e.preventDefault();
    const r = comparaEscrito(escrito, palabra.en);
    if (r === 'otra' && !escrito.trim()) return;
    detener();
    if (r === 'bien') brillar();
    else {
      sonar('salto');
      costo();
      setEstado(r);
    }
    decir(palabra.en, idiomaVoz);
  };

  const seguir = () => {
    detener();
    sonar('toque');
    setEscrito('');
    setEstado('listo');
    setSinMicroAhora(false);
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
            {/* Antes de intentarlo solo se ve cómo suena: si estuviera escrita, escribirla no sería reto. */}
            {mostrarEscrita || !palabra.pronuncia ? (
              <strong lang="en">{palabra.en}</strong>
            ) : (
              <strong className="decir__suena">{palabra.pronuncia}</strong>
            )}
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
                  detener();
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
              rondas.filter((p) => salieron.includes(p.en) && !costaron.includes(p.en)),
              rondas.filter((p) => costaron.includes(p.en)),
            )
          }
          onTerminar={onTerminar}
        />
      )}
    </div>
  );
}
