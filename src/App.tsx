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
import { callar, configurarVoz, decir, sonar } from './audio';
import { elegirHeroe, fijarCartilla, INVITADO, marcarActividad, progresoDe, reconocerVoz, reiniciarProgreso, ultimaActividad, useActivo, useProgreso, usarPerfil } from './progreso';
import { invitadoUsado, noEsMio, perfilDe, preguntarSiEsSuyo, prepararNube, sincronizar, sumarInvitado, usePerfiles, type Cara } from './perfiles';
import { fijarMomentoSeguro } from './sinConexion';
import { navegar, useRuta, volver } from './navegacion';
import { Quien } from './entrada/Quien';
import { TarjetaCodigo, TarjetaQuien } from './entrada/Tarjeta';
import { Clave } from './entrada/Clave';
import { Unir } from './entrada/Unir';
import { Disco, type Paquete } from './entrada/comun';

const BASE = `${import.meta.env.BASE_URL}cartillas/ingles-3/`;
const MS_CORTINA = 420;
/** Celular quieto este rato con más de un niño: al volver se pregunta otra vez quién juega. */
const MS_QUIETO = 10 * 60_000;
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

type Pantalla =
  | { tipo: 'inicio' }
  | { tipo: 'tarjeta' }
  | { tipo: 'caras' }
  | { tipo: 'clave' }
  | { tipo: 'unir' }
  | { tipo: 'elegir' }
  | { tipo: 'cine' }
  | { tipo: 'mapa' }
  | { tipo: 'familia' }
  | { tipo: 'mision'; indice: number };

/** Cómo se cambia de pantalla: sumar al historial, reemplazar la actual o volver a la madre. */
type Paso = 'sumar' | 'reemplazar' | 'volver';

// Cada pantalla tiene su dirección, sin identificadores del niño (esqueleto §1.1).
const RUTAS: Record<Exclude<Pantalla['tipo'], 'mision'>, string> = {
  inicio: '/',
  tarjeta: '/tarjeta',
  caras: '/tarjeta/quien',
  clave: '/clave',
  unir: '/unir',
  elegir: '/elegir',
  cine: '/historia',
  mapa: '/mapa',
  familia: '/familia',
};

function pantallaDe(ruta: string, territorio: Territorio | undefined): Pantalla | null {
  const tipo = (Object.keys(RUTAS) as (keyof typeof RUTAS)[]).find((t) => RUTAS[t] === ruta);
  if (tipo) return { tipo } as Pantalla;
  // El QR de la tarjeta abre /t/CÓDIGO: es la pantalla del código, ya escrito.
  if (/^\/t\/[A-Za-z0-9]+$/.test(ruta)) return { tipo: 'tarjeta' };
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
  const progreso = useProgreso();
  const activo = useActivo();
  const perfiles = usePerfiles();
  // Entrada con tarjeta: código del QR, caras del grupo y niño que va a escribir su PIN.
  const [codigoQR, setCodigoQR] = useState<string | undefined>();
  const [grupo, setGrupo] = useState<{ codigo: string; caras: Cara[] } | null>(null);
  const [elegido, setElegido] = useState<(Cara & { codigo: string }) | null>(null);
  // Mientras Lumi cuenta las estrellas del invitado ya sumado, /unir sigue en pantalla.
  const [uniendo, setUniendo] = useState(false);
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
    const qr = /^\/t\/([A-Za-z0-9]+)$/.exec(ruta)?.[1];
    if (qr) {
      setCodigoQR(qr);
      navegar(RUTAS.tarjeta, true);
      return;
    }
    // Pasos de la entrada que se abren sin lo que necesitan (recarga): a la portada.
    const sinDatos = (pantalla.tipo === 'caras' && !grupo) || (pantalla.tipo === 'clave' && !elegido) || (pantalla.tipo === 'unir' && !uniendo && (activo === INVITADO || !preguntarSiEsSuyo(activo)));
    if (!pantallaDe(ruta, territorio) || sinDatos || (sinHeroe && ['mapa', 'mision', 'cine'].includes(pantalla.tipo))) navegar(RUTAS.inicio, true);
  }, [ruta, cartilla, territorio, sinHeroe, pantalla.tipo, grupo, elegido, activo, uniendo]);

  // Lo jugado por los niños con tarjeta sube cuando hay red, fuera de las misiones.
  useEffect(() => {
    if (pantalla.tipo === 'mapa' || pantalla.tipo === 'inicio') void sincronizar();
  }, [pantalla.tipo]);
  useEffect(() => {
    const alVolverLaRed = () => void sincronizar();
    window.addEventListener('online', alVolverLaRed);
    return () => window.removeEventListener('online', alVolverLaRed);
  }, []);

  // Celular quieto un rato con más de un niño: al volver, "¿Quién va a jugar?".
  const varios = perfiles.length + (invitadoUsado() ? 1 : 0) > 1;
  useEffect(() => {
    const revisar = () => {
      if (document.visibilityState !== 'visible') return;
      if (varios && Date.now() - ultimaActividad() > MS_QUIETO && ['mapa', 'cine', 'mision'].includes(pantallaDe(location.pathname, territorio)?.tipo ?? '')) navegar(RUTAS.inicio, true);
      marcarActividad();
    };
    revisar();
    const tocar = () => marcarActividad();
    document.addEventListener('visibilitychange', revisar);
    window.addEventListener('pointerdown', tocar, { passive: true });
    return () => {
      document.removeEventListener('visibilitychange', revisar);
      window.removeEventListener('pointerdown', tocar);
    };
  }, [varios, territorio]);

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
        fijarCartilla(c.id);
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

  // Lo que las pantallas de entrada toman del paquete: Lumi, personajes y sus frases.
  const paquete = useMemo<Paquete | null>(() => {
    if (!cartilla) return null;
    const frase = (clave: string) => cartilla.ayudas?.[clave]?.es ?? '';
    return {
      base: BASE,
      titulo: cartilla.titulo,
      heroes: cartilla.heroes,
      lumi: cartilla.imagenes?.portada ?? 'personajes/lumi-wave.webp',
      lumiFiesta: cartilla.imagenes?.fiesta ?? IMAGEN_FIESTA,
      frase,
      hablar: (clave) => {
        const texto = frase(clave);
        if (texto) decir(texto, cartilla.idiomaHistoria);
      },
    };
  }, [cartilla]);

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
  if (!cartilla || !territorio || !paquete) return <div className="inicio" aria-busy="true" />;

  const heroe = cartilla.heroes.find((h) => h.id === progreso.heroe);
  const hechas = territorio.misiones.filter((m) => progreso.misiones[m.id]).length;
  const modo = territorio.idiomaPorAvance[Math.min(hechas, territorio.idiomaPorAvance.length - 1)];
  // La cinemática de inicio se ve sola la primera vez que se va al mapa.
  const intro = cartilla.cinematicas?.inicio;
  const alMapa = (): Pantalla => (intro && !progreso.vistas.includes(intro.vista) ? { tipo: 'cine' } : { tipo: 'mapa' });
  /** A dónde va un perfil al entrar: elegir personaje, la historia (una vez) o el mapa. */
  const destinoDe = (perfil: string): Pantalla => {
    const p = progresoDe(perfil);
    if (!cartilla.heroes.some((h) => h.id === p.heroe)) return { tipo: 'elegir' };
    return intro && !p.vistas.includes(intro.vista) ? { tipo: 'cine' } : { tipo: 'mapa' };
  };
  const cambiarA = (perfil: string) => {
    if (perfil !== activo) {
      usarPerfil(perfil);
      olvidarMundo();
    }
  };
  const jugarInvitado = () => {
    cambiarA(INVITADO);
    irA(destinoDe(INVITADO));
  };
  /** Un niño con tarjeta entra: su personaje es el que le puso el docente (esqueleto.md §9, pregunta 1). */
  const entrarComo = (nino: Cara) => {
    cambiarA(nino.id);
    if (!progresoDe(nino.id).heroe && cartilla.heroes.some((h) => h.id === nino.avatar)) elegirHeroe(nino.avatar);
    irA(preguntarSiEsSuyo(nino.id) ? { tipo: 'unir' } : destinoDe(nino.id), pantalla.tipo === 'inicio' ? 'sumar' : 'reemplazar');
  };

  return (
    <>
      {pantalla.tipo === 'inicio' && (
        <Quien
          paquete={paquete}
          perfiles={perfiles}
          heroeInvitado={progresoDe(INVITADO).heroe}
          onPerfil={(p) => {
            // Un solo niño en el celular: entra directo, sin PIN (ronda-2-docente §2.1).
            if (perfiles.length + (invitadoUsado() ? 1 : 0) === 1) entrarComo(p);
            else {
              setElegido(p);
              prepararNube();
              irA({ tipo: 'clave' });
            }
          }}
          onInvitado={jugarInvitado}
          onTarjeta={() => {
            setCodigoQR(undefined);
            prepararNube();
            irA({ tipo: 'tarjeta' });
          }}
          onFamilia={() => irA({ tipo: 'familia' })}
        />
      )}

      {pantalla.tipo === 'tarjeta' && (
        <TarjetaCodigo
          key={codigoQR ?? ''}
          paquete={paquete}
          inicial={codigoQR}
          onCaras={(codigo, caras) => {
            setGrupo({ codigo, caras });
            irA({ tipo: 'caras' });
          }}
          onInvitado={jugarInvitado}
          onVolver={() => irA({ tipo: 'inicio' }, 'volver')}
        />
      )}

      {pantalla.tipo === 'caras' && grupo && (
        <TarjetaQuien
          paquete={paquete}
          caras={grupo.caras}
          onCara={(c) => {
            setElegido({ ...c, codigo: grupo.codigo });
            irA({ tipo: 'clave' });
          }}
          onVolver={() => irA({ tipo: 'tarjeta' }, 'volver')}
        />
      )}

      {pantalla.tipo === 'clave' && elegido && (
        <Clave
          key={elegido.id}
          paquete={paquete}
          nino={elegido}
          onEntrar={() => entrarComo(elegido)}
          onInvitado={jugarInvitado}
          onQuien={() => irA({ tipo: 'inicio' }, 'reemplazar')}
          onVolver={() => history.back()}
        />
      )}

      {pantalla.tipo === 'unir' && activo !== INVITADO && (
        <Unir
          paquete={paquete}
          heroe={progresoDe(INVITADO).heroe}
          misiones={territorio.misiones.filter((m) => progresoDe(INVITADO).misiones[m.id])}
          onSi={() => {
            setUniendo(true);
            sumarInvitado(activo);
          }}
          onNo={() => {
            noEsMio(activo);
            irA(destinoDe(activo), 'reemplazar');
          }}
          onListo={() => {
            irA(destinoDe(activo), 'reemplazar');
            window.setTimeout(() => setUniendo(false), MS_CORTINA * 2);
          }}
        />
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
        <button type="button" className="cambiar-jugador" aria-label="Cambiar de jugador" onClick={() => (sonar('toque'), callar(), irA({ tipo: 'inicio' }, 'volver'))}>
          <Disco paquete={paquete} avatar={activo === INVITADO ? progreso.heroe : (perfilDe(activo)?.avatar ?? progreso.heroe)} />
        </button>
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
