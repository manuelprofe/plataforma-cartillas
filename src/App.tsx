import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import type { Cartilla, Mision, Palabra, PropsJuego, Territorio } from './tipos';
import { Mundo, olvidarMundo } from './Mundo';
import { EscuchaToca } from './juegos/EscuchaToca';
import { EscuchaAtrapa } from './juegos/EscuchaAtrapa';
import { DiBrilla } from './juegos/DiBrilla';
import { Memoria } from './juegos/Memoria';
import { ElegirHeroe } from './ElegirHeroe';
import { Cinematica } from './Cinematica';
import { Familia } from './Familia';
import { BotonSostenido } from './BotonSostenido';
import { activarAudio, callar, configurarVoz, sonar } from './audio';
import { elegirHeroe, reconocerVoz, reiniciarProgreso, useProgreso } from './progreso';
import { fijarMomentoSeguro } from './sinConexion';
import { navegar, useRuta, volver } from './navegacion';

const BASE = `${import.meta.env.BASE_URL}cartillas/ingles-3/`;
const MS_CORTINA = 420;
const MS_PUERTA_FAMILIA = 3000;
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

type Pantalla = { tipo: 'inicio' } | { tipo: 'elegir' } | { tipo: 'cine' } | { tipo: 'mapa' } | { tipo: 'familia' } | { tipo: 'mision'; indice: number };

/** Cómo se cambia de pantalla: sumar al historial, reemplazar la actual o volver a la madre. */
type Paso = 'sumar' | 'reemplazar' | 'volver';

// Cada pantalla tiene su dirección, sin identificadores del niño (esqueleto §1.1).
const RUTAS: Record<Exclude<Pantalla['tipo'], 'mision'>, string> = {
  inicio: '/',
  elegir: '/elegir',
  cine: '/historia',
  mapa: '/mapa',
  familia: '/familia',
};

function pantallaDe(ruta: string, territorio: Territorio | undefined): Pantalla | null {
  const tipo = (Object.keys(RUTAS) as (keyof typeof RUTAS)[]).find((t) => RUTAS[t] === ruta);
  if (tipo) return { tipo } as Pantalla;
  const id = /^\/mision\/([^/]+)$/.exec(ruta)?.[1];
  if (id === undefined) return null;
  const indice = territorio?.misiones.findIndex((m) => m.id === decodeURIComponent(id)) ?? -1;
  return indice >= 0 ? { tipo: 'mision', indice } : null;
}

function rutaDe(pantalla: Pantalla, territorio: Territorio): string {
  return pantalla.tipo === 'mision' ? `/mision/${encodeURIComponent(territorio.misiones[pantalla.indice].id)}` : RUTAS[pantalla.tipo];
}

export function App() {
  const [cartilla, setCartilla] = useState<Cartilla | null>(null);
  const [fallo, setFallo] = useState(false);
  const ruta = useRuta();
  const [cortina, setCortina] = useState<'cierra' | 'abre' | null>(null);
  const [pistaFamilia, setPistaFamilia] = useState(false);
  const progreso = useProgreso();
  const esperas = useRef<number[]>([]);

  const territorio = cartilla?.territorios[0];
  // Una dirección desconocida (o una misión que ya no existe) se trata como la portada.
  const pantalla: Pantalla = pantallaDe(ruta, territorio) ?? { tipo: 'inicio' };
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
      navegar(RUTAS.mapa, true);
    }
  }, [pantalla, cartilla, Juego, mision]);

  // Dirección que no corresponde: a la portada, sin dejarla en el historial. Mapa, misión e
  // historia sin personaje elegido (recarga tras borrar el avance): también a la portada.
  const sinHeroe = cartilla && !cartilla.heroes.some((h) => h.id === progreso.heroe);
  useEffect(() => {
    if (!cartilla) return;
    if (!pantallaDe(ruta, territorio) || (sinHeroe && ['mapa', 'mision', 'cine'].includes(pantalla.tipo))) navegar(RUTAS.inicio, true);
  }, [ruta, cartilla, territorio, sinHeroe, pantalla.tipo]);

  // Salir de una misión con el atrás del celular: que no siga sonando la voz del juego.
  const tipoAnterior = useRef(pantalla.tipo);
  useEffect(() => {
    if (tipoAnterior.current === 'mision' && pantalla.tipo !== 'mision') callar();
    tipoAnterior.current = pantalla.tipo;
  }, [pantalla.tipo]);

  useEffect(() => {
    fetch(`${BASE}cartilla.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((c: Cartilla) => {
        // Progreso de antes de la opción B: las misiones de voz ya hechas reciben "pronunciar".
        reconocerVoz(c.territorios.flatMap((t) => t.misiones.filter((m) => m.plantilla === 'di-brilla').map((m) => m.id)));
        configurarVoz(BASE, c.voz);
        setCartilla(c);
      })
      .catch(() => setFallo(true));
    return () => esperas.current.forEach(clearTimeout);
  }, []);

  // Solo en la portada, sin cortina, puede entrar una versión nueva de la app (recarga).
  useEffect(() => fijarMomentoSeguro(pantalla.tipo === 'inicio' && !cortina), [pantalla.tipo, cortina]);

  // Cambia de pantalla detrás de una cortina circular. Mientras la cortina se mueve no se
  // atiende otro cambio, salvo que se pida esperar: así una cinemática que falla enseguida
  // (sin red) no deja al niño en una pantalla vacía.
  const ocupada = useRef(false);
  const irA = (destino: Pantalla, paso: Paso = 'sumar', esperar = false) => {
    if (ocupada.current) {
      if (esperar) esperas.current.push(window.setTimeout(() => irA(destino, paso, true), MS_CORTINA));
      return;
    }
    if (!territorio) return;
    const hacia = rutaDe(destino, territorio);
    ocupada.current = true;
    setCortina('cierra');
    esperas.current.push(
      window.setTimeout(() => {
        if (paso === 'volver') volver(hacia);
        else navegar(hacia, paso === 'reemplazar');
        setCortina('abre');
      }, MS_CORTINA),
      window.setTimeout(() => {
        ocupada.current = false;
        setCortina(null);
      }, MS_CORTINA * 2),
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
          {/* Puerta del adulto: solo abre si se mantiene presionado; la instrucción la entiende quien lee. */}
          <BotonSostenido ms={MS_PUERTA_FAMILIA} className="enlace" onListo={() => irA({ tipo: 'familia' })} onCorto={() => setPistaFamilia(true)}>
            Para la familia
          </BotonSostenido>
          <p className="inicio__pista" role="status">
            {pistaFamilia ? 'Mantenga presionado 3 segundos.' : ''}
          </p>
        </div>
      )}

      {pantalla.tipo === 'familia' && (
        <Familia
          cartilla={cartilla}
          territorio={territorio}
          base={BASE}
          onVolver={() => irA({ tipo: 'inicio' }, 'volver')}
          onBorrar={() => {
            reiniciarProgreso();
            olvidarMundo();
            irA({ tipo: 'inicio' }, 'volver');
          }}
        />
      )}

      {pantalla.tipo === 'elegir' && (
        <ElegirHeroe
          heroes={cartilla.heroes}
          base={BASE}
          vozEspanol={cartilla.idiomaHistoria}
          elegido={progreso.heroe}
          onElegir={(id) => {
            elegirHeroe(id);
            irA(alMapa(), 'reemplazar');
          }}
        />
      )}

      {pantalla.tipo === 'cine' && intro && (
        <Cinematica cine={intro} base={BASE} vozEspanol={cartilla.idiomaHistoria} onTerminar={() => irA({ tipo: 'mapa' }, 'reemplazar', true)} />
      )}

      {pantalla.tipo === 'mapa' && heroe && (
        <Mundo territorio={territorio} heroe={heroe} estelas={cartilla.estelas} accesorios={cartilla.accesorios ?? []} cinematicas={cartilla.cinematicas ?? {}} ayudas={cartilla.ayudas ?? {}} base={BASE} vozIngles={cartilla.idiomaVoz} vozEspanol={cartilla.idiomaHistoria} onEntrar={(indice) => irA({ tipo: 'mision', indice })} />
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
          onTerminar={() => irA({ tipo: 'mapa' }, 'volver')}
          onSalir={() => irA({ tipo: 'mapa' }, 'volver')}
        />
      )}

      {cortina && <div className={`cortina cortina--${cortina}`} aria-hidden="true" />}
    </>
  );
}
