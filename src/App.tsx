import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import type { Cartilla, Mision, Palabra, PropsJuego } from './tipos';
import { Mundo, olvidarMundo } from './Mundo';
import { EscuchaToca } from './juegos/EscuchaToca';
import { EscuchaAtrapa } from './juegos/EscuchaAtrapa';
import { DiBrilla } from './juegos/DiBrilla';
import { Memoria } from './juegos/Memoria';
import { ElegirHeroe } from './ElegirHeroe';
import { Cinematica } from './Cinematica';
import { activarAudio, sonar } from './audio';
import { elegirHeroe, reconocerVoz, reiniciarProgreso, useProgreso } from './progreso';
import { fijarMomentoSeguro } from './sinConexion';

const BASE = `${import.meta.env.BASE_URL}cartillas/ingles-3/`;
const MS_CORTINA = 420;
const IMAGEN_FIESTA = 'personajes/lumi-celebrate.webp';

/**
 * Qué componente juega cada plantilla del contenido. Van en la carga inicial (unos 10 kB
 * comprimidos entre los cuatro): así abrir un juego sin conexión nunca deja la pantalla en blanco.
 */
const JUEGOS: Record<Mision['plantilla'], ComponentType<PropsJuego>> = {
  'escucha-toca': EscuchaToca,
  'escucha-atrapa': EscuchaAtrapa,
  'di-brilla': DiBrilla,
  memoria: Memoria,
};

type Pantalla = { tipo: 'inicio' } | { tipo: 'elegir' } | { tipo: 'cine' } | { tipo: 'mapa' } | { tipo: 'mision'; indice: number };

export function App() {
  const [cartilla, setCartilla] = useState<Cartilla | null>(null);
  const [fallo, setFallo] = useState(false);
  const [pantalla, setPantalla] = useState<Pantalla>({ tipo: 'inicio' });
  const [cortina, setCortina] = useState<'cierra' | 'abre' | null>(null);
  const progreso = useProgreso();
  const esperas = useRef<number[]>([]);

  const territorio = cartilla?.territorios[0];
  const misionDelContenido = pantalla.tipo === 'mision' ? territorio?.misiones[pantalla.indice] : undefined;
  // Las misiones de repaso traen sus palabras de las misiones que el niño ya completó.
  const mision = useMemo(() => {
    if (!misionDelContenido?.palabrasDe || !territorio) return misionDelContenido;
    const vistas = new Map<string, Palabra>();
    territorio.misiones
      .filter((m) => misionDelContenido.palabrasDe?.includes(m.id) && progreso.misiones[m.id])
      .forEach((m) => m.palabras.forEach((p) => vistas.set(p.en, p)));
    return { ...misionDelContenido, palabras: [...misionDelContenido.palabras, ...vistas.values()] };
    // Se calcula al entrar: si el progreso cambia al terminar, el juego no debe rearmarse.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [misionDelContenido, territorio]);
  const Juego = mision ? (JUEGOS as Partial<Record<string, ComponentType<PropsJuego>>>)[mision.plantilla] : undefined;

  // Una plantilla que este motor no conoce no se cambia por otro juego: se vuelve al mapa.
  useEffect(() => {
    if (pantalla.tipo === 'mision' && cartilla && !Juego) {
      console.warn(`Misión sin juego disponible (plantilla "${mision?.plantilla}"): se vuelve al mapa.`);
      setPantalla({ tipo: 'mapa' });
    }
  }, [pantalla, cartilla, Juego, mision]);

  useEffect(() => {
    fetch(`${BASE}cartilla.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((c: Cartilla) => {
        // Progreso de antes de la opción B: las misiones de voz ya hechas reciben "pronunciar".
        reconocerVoz(c.territorios.flatMap((t) => t.misiones.filter((m) => m.plantilla === 'di-brilla').map((m) => m.id)));
        setCartilla(c);
      })
      .catch(() => setFallo(true));
    return () => esperas.current.forEach(clearTimeout);
  }, []);

  // Solo en la portada, sin cortina, puede entrar una versión nueva de la app (recarga).
  useEffect(() => fijarMomentoSeguro(pantalla.tipo === 'inicio' && !cortina), [pantalla.tipo, cortina]);

  // Cambia de pantalla detrás de una cortina circular.
  const irA = (destino: Pantalla) => {
    if (cortina) return;
    setCortina('cierra');
    esperas.current.push(
      window.setTimeout(() => {
        setPantalla(destino);
        setCortina('abre');
      }, MS_CORTINA),
      window.setTimeout(() => setCortina(null), MS_CORTINA * 2),
    );
  };

  if (fallo) {
    return (
      <div className="inicio">
        <p>No se pudo abrir la cartilla. Revisa la conexión y vuelve a intentar.</p>
        <button type="button" className="boton-jugar" onClick={() => location.reload()} aria-label="Reintentar">
          ↻
        </button>
      </div>
    );
  }
  if (!cartilla || !territorio) return <div className="inicio" aria-busy="true" />;

  const heroe = cartilla.heroes.find((h) => h.id === progreso.heroe);
  const hechas = territorio.misiones.filter((m) => progreso.misiones[m.id]).length;
  const modo = territorio.idiomaPorAvance[Math.min(hechas, territorio.idiomaPorAvance.length - 1)];
  // La cinemática de inicio se ve sola la primera vez que se va al mapa.
  const intro = cartilla.cinematicas?.inicio;
  const alMapa = (): Pantalla => (intro && !progreso.vistas.includes(intro.vista) ? { tipo: 'cine' } : { tipo: 'mapa' });

  return (
    <>
      {pantalla.tipo === 'inicio' && (
        <div className="inicio">
          <img src={BASE + (cartilla.imagenes?.portada ?? 'personajes/lumi-wave.webp')} alt="" width="200" height="188" className="inicio__lumi" />
          <h1>{cartilla.titulo}</h1>
          <p>{territorio.nombre}</p>
          <button
            type="button"
            className="boton-jugar"
            aria-label="Jugar"
            onClick={() => {
              activarAudio();
              sonar('fiesta');
              irA(heroe ? alMapa() : { tipo: 'elegir' });
            }}
          >
            ▶
          </button>
          {progreso.estrellas > 0 && (
            <button
              type="button"
              className="enlace"
              onClick={() => {
                reiniciarProgreso();
                olvidarMundo();
              }}
            >
              Empezar de nuevo
            </button>
          )}
        </div>
      )}

      {pantalla.tipo === 'elegir' && (
        <ElegirHeroe
          heroes={cartilla.heroes}
          base={BASE}
          vozEspanol={cartilla.idiomaHistoria}
          elegido={progreso.heroe}
          onElegir={(id) => {
            elegirHeroe(id);
            irA(alMapa());
          }}
        />
      )}

      {pantalla.tipo === 'cine' && intro && (
        <Cinematica cine={intro} base={BASE} vozEspanol={cartilla.idiomaHistoria} onTerminar={() => irA({ tipo: 'mapa' })} />
      )}

      {pantalla.tipo === 'mapa' && heroe && (
        <Mundo territorio={territorio} heroe={heroe} estelas={cartilla.estelas} base={BASE} vozIngles={cartilla.idiomaVoz} vozEspanol={cartilla.idiomaHistoria} onEntrar={(indice) => irA({ tipo: 'mision', indice })} />
      )}

      {mision && Juego && (
        <Juego
          key={mision.id}
          mision={mision}
          base={BASE}
          idiomaVoz={cartilla.idiomaVoz}
          imagenGuia={territorio.personajes[territorio.guia].imagen}
          imagenFiesta={cartilla.imagenes?.fiesta ?? IMAGEN_FIESTA}
          ayudas={cartilla.ayudas ?? {}}
          modo={modo}
          vozHistoria={cartilla.idiomaHistoria}
          onTerminar={() => irA({ tipo: 'mapa' })}
          onSalir={() => irA({ tipo: 'mapa' })}
        />
      )}

      {cortina && <div className={`cortina cortina--${cortina}`} aria-hidden="true" />}
    </>
  );
}
