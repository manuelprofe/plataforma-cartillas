import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import type { Cartilla, Mision, Palabra, PropsJuego } from './tipos';
import { Mundo, olvidarMundo } from './Mundo';
import { ElegirHeroe } from './ElegirHeroe';
import { activarAudio, sonar } from './audio';
import { elegirHeroe, reiniciarProgreso, useProgreso } from './progreso';

const BASE = `${import.meta.env.BASE_URL}cartillas/ingles-3/`;
const MS_CORTINA = 420;
const IMAGEN_FIESTA = 'personajes/lumi-celebrate.webp';

/** Qué componente juega cada plantilla del contenido. Cada juego se descarga al abrirlo. */
const JUEGOS: Record<Mision['plantilla'], ComponentType<PropsJuego>> = {
  'escucha-toca': lazy(() => import('./juegos/EscuchaToca').then((m) => ({ default: m.EscuchaToca }))),
  'escucha-atrapa': lazy(() => import('./juegos/EscuchaAtrapa').then((m) => ({ default: m.EscuchaAtrapa }))),
  'di-brilla': lazy(() => import('./juegos/DiBrilla').then((m) => ({ default: m.DiBrilla }))),
  memoria: lazy(() => import('./juegos/Memoria').then((m) => ({ default: m.Memoria }))),
};

type Pantalla = { tipo: 'inicio' } | { tipo: 'elegir' } | { tipo: 'mapa' } | { tipo: 'mision'; indice: number };

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
      .then(setCartilla)
      .catch(() => setFallo(true));
    return () => esperas.current.forEach(clearTimeout);
  }, []);

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

  return (
    <>
      {pantalla.tipo === 'inicio' && (
        <div className="inicio">
          <img src={`${BASE}personajes/lumi-wave.webp`} alt="" width="200" height="188" className="inicio__lumi" />
          <h1>{cartilla.titulo}</h1>
          <p>{territorio.nombre}</p>
          <button
            type="button"
            className="boton-jugar"
            aria-label="Jugar"
            onClick={() => {
              activarAudio();
              sonar('fiesta');
              irA({ tipo: heroe ? 'mapa' : 'elegir' });
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
            irA({ tipo: 'mapa' });
          }}
        />
      )}

      {pantalla.tipo === 'mapa' && heroe && (
        <Mundo territorio={territorio} heroe={heroe} estelas={cartilla.estelas} base={BASE} vozIngles={cartilla.idiomaVoz} vozEspanol={cartilla.idiomaHistoria} onEntrar={(indice) => irA({ tipo: 'mision', indice })} />
      )}

      {mision && Juego && (
        <Suspense fallback={<div className="mision" aria-busy="true" />}>
        <Juego
          key={mision.id}
          mision={mision}
          base={BASE}
          idiomaVoz={cartilla.idiomaVoz}
          imagenGuia={territorio.personajes[territorio.guia].imagen}
          imagenFiesta={IMAGEN_FIESTA}
          ayudas={cartilla.ayudas ?? {}}
          modo={modo}
          vozHistoria={cartilla.idiomaHistoria}
          onTerminar={() => irA({ tipo: 'mapa' })}
          onSalir={() => irA({ tipo: 'mapa' })}
        />
        </Suspense>
      )}

      {cortina && <div className={`cortina cortina--${cortina}`} aria-hidden="true" />}
    </>
  );
}
