// Plantilla de juego "completar la operación" (sumas y restas). No contiene números fijos: cada
// nivel llega del contenido (mision.operacion) con su signo y su rango, y el juego arma las
// cuentas dentro de ese rango. La cuenta se ve con objetos (hasta 10) o con bloques de diez, y
// con cifras; el niño elige el resultado entre 3. Equivocarse no quita nada: la opción tocada
// se apaga, el guía anima y la voz repite la cuenta; al segundo intento brilla la buena.
import { useEffect, useRef, useState } from 'react';
import type { NivelOperacion, PropsJuego } from '../tipos';
import { CierreMision } from './CierreMision';
import { decirAyuda } from './ayuda';
import { mezclar } from './mezclar';
import { callar, decir, sonar } from '../audio';
import './operacion.css';

interface Cuenta {
  signo: '+' | '-';
  a: number;
  b: number;
  c: number;
  opciones: number[];
  objeto?: string;
}

const azar = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

/** Arma una cuenta dentro del rango del nivel, distinta de las ya usadas si se puede. */
function armar(nivel: NivelOperacion, usadas: Set<string>): Cuenta {
  const desde = Math.max(2, Math.min(nivel.desde, nivel.hasta));
  const hasta = Math.max(desde, nivel.hasta);
  let cuenta = { a: 1, b: 1, c: 2 };
  for (let intento = 0; intento < 30; intento++) {
    const mayor = azar(desde, hasta);
    const parte = azar(1, mayor - 1);
    cuenta = nivel.signo === '+' ? { a: parte, b: mayor - parte, c: mayor } : { a: mayor, b: parte, c: mayor - parte };
    if (!usadas.has(`${cuenta.a}${nivel.signo}${cuenta.b}`)) break;
  }
  usadas.add(`${cuenta.a}${nivel.signo}${cuenta.b}`);
  // Dos opciones cercanas: los errores típicos son contar uno de más o de menos (o una decena).
  const cerca = [cuenta.c - 1, cuenta.c + 1, cuenta.c - 2, cuenta.c + 2];
  if (cuenta.c > 10) cerca.push(cuenta.c - 10, cuenta.c + 10);
  const otras = mezclar(cerca.filter((n, i, l) => n >= 0 && n !== cuenta.c && l.indexOf(n) === i)).slice(0, 2);
  return { signo: nivel.signo, ...cuenta, opciones: mezclar([cuenta.c, ...otras]), objeto: nivel.objeto };
}

function armarTodas(niveles: NivelOperacion[]): Cuenta[] {
  const usadas = new Set<string>();
  return niveles.flatMap((n) => Array.from({ length: Math.max(1, n.rondas) }, () => armar(n, usadas)));
}

const llenar = (frase: string, k: Cuenta) => frase.replace(/\{a\}/g, String(k.a)).replace(/\{b\}/g, String(k.b)).replace(/\{c\}/g, String(k.c));

/** Una cantidad dibujada: objetos sueltos hasta 10; con más, barras de diez y cuadritos. */
function Cantidad({ n, objeto, base, tachados = 0 }: { n: number; objeto?: string; base: string; tachados?: number }) {
  const conObjetos = objeto && n <= 10;
  if (conObjetos) {
    return (
      <span className="operacion__grupo" style={{ gridTemplateColumns: `repeat(${Math.min(n, 5)}, 28px)` }} aria-hidden="true">
        {Array.from({ length: n }, (_, i) => (
          <img key={i} src={base + objeto} alt="" draggable={false} className={i >= n - tachados ? 'operacion__se-va' : undefined} />
        ))}
      </span>
    );
  }
  const decenas = Math.floor(n / 10);
  const unidades = n % 10;
  return (
    <span className="operacion__grupo operacion__grupo--bloques" aria-hidden="true">
      {Array.from({ length: decenas }, (_, i) => (
        <i key={`d${i}`} className="operacion__diez" />
      ))}
      <span className="operacion__unos">
        {Array.from({ length: unidades }, (_, i) => (
          <i key={`u${i}`} className="operacion__uno" />
        ))}
      </span>
    </span>
  );
}

export function Operacion(props: PropsJuego) {
  const { mision, base, idiomaVoz, imagenGuia, imagenFiesta, onTerminar, onSalir } = props;
  const ajustes = mision.operacion;
  const [cuentas] = useState(() => armarTodas(ajustes?.niveles ?? []));
  const [indice, setIndice] = useState(0);
  const [apagadas, setApagadas] = useState<number[]>([]);
  const [errores, setErrores] = useState(0);
  const [resuelta, setResuelta] = useState(false);
  const [cierre, setCierre] = useState(false);
  const esperas = useRef<number[]>([]);
  const cuenta = cuentas[indice];

  const luego = (f: () => void, ms: number) => {
    esperas.current.push(window.setTimeout(f, ms));
  };

  useEffect(
    () => () => {
      esperas.current.forEach(clearTimeout);
      callar();
    },
    [],
  );

  // Sin niveles en el contenido no hay juego: se vuelve al mapa.
  useEffect(() => {
    if (!cuentas.length) onSalir();
  }, [cuentas.length, onSalir]);

  const preguntar = () => {
    if (ajustes && cuenta) decir(llenar(ajustes.pregunta[cuenta.signo], cuenta), idiomaVoz);
  };

  useEffect(() => {
    if (cierre || !cuenta) return;
    setApagadas([]);
    setResuelta(false);
    const t = window.setTimeout(preguntar, 400);
    return () => clearTimeout(t);
  }, [indice, cierre]);

  if (!cuenta || !ajustes) return null;

  const elegir = (n: number) => {
    if (resuelta || apagadas.includes(n)) return;
    if (n === cuenta.c) {
      sonar('acierto');
      setResuelta(true);
      decir(llenar(ajustes.respuesta[cuenta.signo], cuenta), idiomaVoz);
      luego(() => {
        if (indice + 1 < cuentas.length) setIndice(indice + 1);
        else {
          sonar('fiesta');
          setCierre(true);
        }
      }, 2200);
      return;
    }
    sonar('intenta');
    setErrores(errores + 1);
    setApagadas([...apagadas, n]);
    decirAyuda(props, 'operacion-otra-vez', preguntar);
  };

  const pista = apagadas.length >= 2 || (apagadas.length >= 1 && cuenta.opciones.length <= 2);
  const resta = cuenta.signo === '-';

  return (
    <div className="mision">
      <header className="mision__barra">
        <button type="button" className="boton-salir" onClick={onSalir} aria-label="Volver al mapa">
          ✕
        </button>
        {!cierre && (
          <div className="puntos" aria-hidden="true">
            {cuentas.map((_, i) => (
              <span key={i} className={`punto${i < indice ? ' punto--hecho' : i === indice ? ' punto--ahora' : ''}`} />
            ))}
          </div>
        )}
      </header>

      {!cierre && (
        <main className="operacion">
          <button type="button" className="oir operacion__oir" onClick={() => { sonar('toque'); preguntar(); }} aria-label="Escuchar otra vez">
            <img src={base + imagenGuia} alt="" width="96" height="76" draggable={false} />
            <span className="oir__onda" aria-hidden="true">🔊</span>
          </button>

          <div className="operacion__pizarra" key={indice} aria-label={`${cuenta.a} ${cuenta.signo} ${cuenta.b}`}>
            {resta ? (
              // En la resta se ven todos y se apagan los que se van.
              <div className="operacion__lado">
                <Cantidad n={cuenta.a} objeto={cuenta.objeto} base={base} tachados={cuenta.a <= 10 ? cuenta.b : 0} />
              </div>
            ) : (
              <div className="operacion__lado">
                <Cantidad n={cuenta.a} objeto={cuenta.objeto} base={base} />
                <span className="operacion__signo operacion__signo--chico" aria-hidden="true">+</span>
                <Cantidad n={cuenta.b} objeto={cuenta.objeto} base={base} />
              </div>
            )}
            {resta && cuenta.a > 10 && (
              <div className="operacion__lado operacion__lado--quita">
                <span className="operacion__signo operacion__signo--chico" aria-hidden="true">−</span>
                <Cantidad n={cuenta.b} base={base} />
              </div>
            )}
            <p className="operacion__cifras" aria-hidden="true">
              <span>{cuenta.a}</span>
              <span className="operacion__signo">{resta ? '−' : '+'}</span>
              <span>{cuenta.b}</span>
              <span className="operacion__signo">=</span>
              <span className={`operacion__hueco${resuelta ? ' operacion__hueco--lleno' : ''}`}>{resuelta ? cuenta.c : '?'}</span>
            </p>
          </div>

          <div className="operacion__opciones">
            {cuenta.opciones.map((n) => {
              const apagada = apagadas.includes(n);
              const bien = resuelta && n === cuenta.c;
              return (
                <button
                  key={n}
                  type="button"
                  className={`operacion__opcion${apagada ? ' operacion__opcion--apagada' : ''}${bien ? ' operacion__opcion--bien' : ''}${pista && n === cuenta.c && !resuelta ? ' operacion__opcion--pista' : ''}`}
                  onClick={() => elegir(n)}
                  disabled={apagada}
                  aria-label={String(n)}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </main>
      )}

      {cierre && <CierreMision mision={mision} errores={errores} base={base} imagenFiesta={imagenFiesta} alRegistrar={() => {}} onTerminar={onTerminar} />}
    </div>
  );
}
