import { useEffect, useRef, useState } from 'react';
import type { Cartilla } from './tipos';
import { Mundo, olvidarMundo } from './Mundo';
import { ElegirHeroe } from './ElegirHeroe';
import { EscuchaToca } from './juegos/EscuchaToca';
import { activarAudio, sonar } from './audio';
import { elegirHeroe, reiniciarProgreso, useProgreso } from './progreso';

const BASE = `${import.meta.env.BASE_URL}cartillas/ingles-3/`;
const MS_CORTINA = 420;

type Pantalla = { tipo: 'inicio' } | { tipo: 'elegir' } | { tipo: 'mapa' } | { tipo: 'mision'; indice: number };

export function App() {
  const [cartilla, setCartilla] = useState<Cartilla | null>(null);
  const [fallo, setFallo] = useState(false);
  const [pantalla, setPantalla] = useState<Pantalla>({ tipo: 'inicio' });
  const [cortina, setCortina] = useState<'cierra' | 'abre' | null>(null);
  const progreso = useProgreso();
  const esperas = useRef<number[]>([]);

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
  if (!cartilla) return <div className="inicio" aria-busy="true" />;

  const territorio = cartilla.territorios[0];
  const heroe = cartilla.heroes.find((h) => h.id === progreso.heroe);

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

      {pantalla.tipo === 'mision' && (
        <EscuchaToca
          key={territorio.misiones[pantalla.indice].id}
          mision={territorio.misiones[pantalla.indice]}
          base={BASE}
          idiomaVoz={cartilla.idiomaVoz}
          imagenGuia={territorio.personajes[territorio.guia].imagen}
          imagenFiesta="personajes/lumi-celebrate.webp"
          onTerminar={() => irA({ tipo: 'mapa' })}
          onSalir={() => irA({ tipo: 'mapa' })}
        />
      )}

      {cortina && <div className={`cortina cortina--${cortina}`} aria-hidden="true" />}
    </>
  );
}
