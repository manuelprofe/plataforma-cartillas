// Conversación con los personajes: una línea a la vez, con voz, opciones para
// decidir y el idioma que corresponde al avance del niño.
import { useEffect, useState } from 'react';
import type { Escena, Linea, ModoIdioma, Opcion, Personaje } from './tipos';
import { callar, decir, sonar } from './audio';

interface Props {
  lineas: Linea[];
  luego?: string;
  escenas: Record<string, Escena>;
  personajes: Record<string, Personaje>;
  base: string;
  modo: ModoIdioma;
  vozIngles: string;
  vozEspanol: string;
  onDestino: (mision: string) => void;
  onCerrar: () => void;
}

export function Dialogo({ lineas, luego, escenas, personajes, base, modo, vozIngles, vozEspanol, onDestino, onCerrar }: Props) {
  const [actual, setActual] = useState<{ lineas: Linea[]; luego?: string }>({ lineas, luego });
  const [indice, setIndice] = useState(0);
  const [verOtro, setVerOtro] = useState(false);

  const linea = actual.lineas[indice];
  const enIngles = modo !== 'es';
  const principal = enIngles ? linea.en : linea.es;
  const otro = enIngles ? linea.es : linea.en;
  const personaje = personajes[linea.quien];

  const hablar = () => decir(principal, enIngles ? vozIngles : vozEspanol);

  useEffect(() => {
    setVerOtro(false);
    const t = window.setTimeout(hablar, 250);
    return () => clearTimeout(t);
    // Solo debe repetirse al cambiar de línea.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actual, indice]);

  useEffect(() => callar, []);

  const abrirEscena = (id: string | undefined) => {
    const escena = id ? escenas[id] : undefined;
    if (!escena) {
      onCerrar();
      return;
    }
    setActual(escena);
    setIndice(0);
  };

  const avanzar = () => {
    sonar('toque');
    if (indice + 1 < actual.lineas.length) setIndice(indice + 1);
    else abrirEscena(actual.luego);
  };

  const elegir = (opcion: Opcion) => {
    sonar('acierto');
    if (opcion.destino) onDestino(opcion.destino);
    if (opcion.ir) abrirEscena(opcion.ir);
    else if (indice + 1 < actual.lineas.length) setIndice(indice + 1);
    else abrirEscena(actual.luego);
  };

  return (
    <div className="dialogo" role="dialog" aria-label={`Habla ${personaje.nombre}`}>
      <img className="dialogo__retrato" key={linea.quien} src={base + personaje.imagen} alt="" width="150" height="130" draggable={false} />
      <div className="dialogo__caja" key={`${indice}-${principal}`}>
        <div className="dialogo__cabeza">
          <strong>{personaje.nombre}</strong>
          <span className="dialogo__utiles">
            <button type="button" className="chip" onClick={hablar} aria-label="Escuchar otra vez">
              🔊
            </button>
            {modo !== 'mixto' && (
              <button type="button" className="chip" onClick={() => setVerOtro(!verOtro)} aria-pressed={verOtro}>
                {enIngles ? 'ES' : 'EN'}
              </button>
            )}
          </span>
        </div>
        <p className="dialogo__texto" lang={enIngles ? 'en' : 'es'}>
          {principal}
        </p>
        {(modo === 'mixto' || verOtro) && (
          <p className="dialogo__apoyo" lang={enIngles ? 'es' : 'en'}>
            {otro}
          </p>
        )}

        {linea.opciones ? (
          <div className="dialogo__opciones">
            {linea.opciones.map((o) => (
              <button type="button" className="opcion-historia" key={o.es} onClick={() => elegir(o)}>
                {o.icono && <img src={base + o.icono} alt="" width="36" height="36" draggable={false} />}
                <span>
                  {enIngles ? o.en : o.es}
                  {modo === 'mixto' && o.en !== o.es && <small>{o.es}</small>}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <button type="button" className="boton-continuar" onClick={avanzar}>
            {enIngles ? 'Continue' : 'Continuar'} ➜
          </button>
        )}
      </div>
    </div>
  );
}
