// Sala de juegos (/jugar/<cartilla>/<juego>): el docente abre cualquier juego de cualquier
// cartilla para probarlo o proyectarlo en clase. Usa las mismas plantillas del niño y el mismo
// contenido; el progreso juega en un perfil de prueba que no se guarda (ver PRUEBA en progreso.ts).
import { Suspense, useEffect, useMemo, useState, type ComponentType } from 'react';
import type { Cartilla, Mision, Palabra, PropsJuego } from '../tipos';
import { JUEGOS, IMAGEN_FIESTA } from '../App';
import { rutaCartilla } from '../cartillas';
import { configurarVoz } from '../audio';
import { fijarCartilla } from '../progreso';
import { cargarJuegoPropio } from './propios';

const SALA = '/docente/juegos';

/** Vuelve a la sala: con el historial si se llegó desde ella; si no, a la dirección. */
function volverASala() {
  if (history.length > 1 && document.referrer.includes('/docente/')) history.back();
  else location.assign(SALA);
}

export function Jugar({ ruta }: { ruta: string }) {
  const [, , cartillaId = '', juegoId = ''] = ruta.split('/').map(decodeURIComponent);
  const BASE = rutaCartilla(cartillaId);
  const [cartilla, setCartilla] = useState<Cartilla | null>(null);
  const [fallo, setFallo] = useState(false);
  const [vuelta, setVuelta] = useState(0);

  useEffect(() => {
    let vigente = true;
    fetch(`${BASE}cartilla.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((c: Cartilla) => {
        if (!vigente) return;
        fijarCartilla(c.id);
        configurarVoz(BASE, c.voz);
        setCartilla(c);
      })
      .catch(() => vigente && setFallo(true));
    return () => {
      vigente = false;
    };
  }, [BASE]);

  const hallado = useMemo(() => {
    if (!cartilla) return null;
    for (const territorio of cartilla.territorios) {
      const propio = cargarJuegoPropio(juegoId, cartilla, territorio);
      const mision = propio ?? territorio.misiones.find((m) => m.id === juegoId);
      if (mision) return { territorio, mision: conPalabrasDeRepaso(mision, territorio.misiones) };
    }
    return null;
  }, [cartilla, juegoId]);

  if (fallo || (cartilla && !hallado)) {
    return (
      <main className="sala-aviso">
        <p>{fallo ? 'No pudimos abrir este juego. Hace falta señal la primera vez.' : 'No encontramos este juego.'}</p>
        <button type="button" className="sala-aviso__boton" onClick={volverASala}>
          Volver a la sala de juegos
        </button>
      </main>
    );
  }
  if (!cartilla || !hallado) return <div className="mision" />;

  const { territorio, mision } = hallado;
  const Juego = (JUEGOS as Partial<Record<string, ComponentType<PropsJuego>>>)[mision.plantilla];
  if (!Juego) return null;
  return (
    <Suspense fallback={<div className="mision" />}>
      <Juego
        key={`${mision.id}-${vuelta}`}
        mision={mision}
        base={BASE}
        idiomaVoz={cartilla.idiomaVoz}
        imagenGuia={territorio.personajes[territorio.guia].imagen}
        imagenFiesta={cartilla.imagenes?.fiesta ?? IMAGEN_FIESTA}
        ayudas={cartilla.ayudas ?? {}}
        modo={territorio.idiomaPorAvance[0]}
        vozHistoria={cartilla.idiomaHistoria}
        imagenHeroe={cartilla.heroes[0]?.imagen}
        onTerminar={() => setVuelta((v) => v + 1)}
        onSalir={volverASala}
      />
    </Suspense>
  );
}

/** En la sala no hay avance: un repaso trae todas las palabras de las misiones que repasa. */
function conPalabrasDeRepaso(m: Mision, todas: Mision[]): Mision {
  if (!m.palabrasDe) return m;
  const vistas = new Map<string, Palabra>();
  todas.filter((o) => m.palabrasDe?.includes(o.id)).forEach((o) => o.palabras.forEach((p) => vistas.set(p.en, p)));
  return { ...m, palabras: [...m.palabras, ...vistas.values()] };
}
