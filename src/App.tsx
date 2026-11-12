import { useEffect, useRef, useState } from 'react';
import type { Cartilla } from './tipos';
import { Mundo } from './Mundo';
import { EscuchaToca } from './juegos/EscuchaToca';
import { activarAudio, sonar } from './audio';
import { reiniciarProgreso, useProgreso } from './progreso';

const BASE = `${import.meta.env.BASE_URL}cartillas/ingles-3/`;
const MS_CORTINA = 420;

type Pantalla = { tipo: 'inicio' } | { tipo: 'mapa' } | { tipo: 'mision'; indice: number };

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
              irA({ tipo: 'mapa' });
            }}
          >
            ▶
          </button>
          {progreso.estrellas > 0 && (
            <button type="button" className="enlace" onClick={reiniciarProgreso}>
              Empezar de nuevo
            </button>
          )}
        </div>
      )}

      {pantalla.tipo === 'mapa' && (
        <Mundo territorio={territorio} base={BASE} vozIngles={cartilla.idiomaVoz} vozEspanol={cartilla.idiomaHistoria} onEntrar={(indice) => irA({ tipo: 'mision', indice })} />
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
