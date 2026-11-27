// Armador de juegos (/docente/juegos/armar[/id]): el docente elige la materia y el grado, el tipo
// de juego y las palabras con imagen del banco de esa cartilla. El juego queda en "Mis juegos",
// listo para proyectar. No se escribe contenido nuevo: solo se elige del paquete de la cartilla.
import { useEffect, useMemo, useState } from 'react';
import { Boton, Encabezado, Panel, Vacio } from '../adultos/base';
import { Cargado, useCarga, useTitulo } from '../adultos/comun';
import { rutaCartilla } from '../cartillas';
import { navegar } from '../navegacion';
import type { Cartilla } from '../tipos';
import { bancoDePalabras, guardarJuegoPropio, leerJuegosPropios, plantillasDe, type PlantillaPropia } from './propios';
import { cargarSala, fuenteJuegos, nombreTipo, RUTA_SALA, rutaJugar, TIPOS } from './Sala';
import { miId } from '../adultos/cuenta';
import { subirCreacion } from '../adultos/nubeCreaciones';

const MINIMO = 3;
const MAXIMO = 12;
const VOLVER = { ruta: RUTA_SALA, etiqueta: 'Sala de juegos' };

const cache = new Map<string, Promise<Cartilla>>();
function cargarCartilla(id: string): Promise<Cartilla> {
  let p = cache.get(id);
  if (!p) {
    p = fetch(`${rutaCartilla(id)}cartilla.json`).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))));
    p.catch(() => cache.delete(id));
    cache.set(id, p);
  }
  return p;
}

export function ArmarJuego({ id }: { id?: string }) {
  const previo = useMemo(() => (id ? leerJuegosPropios().find((j) => j.id === id) : undefined), [id]);
  useTitulo(previo ? 'Cambiar mi juego' : 'Armar un juego');
  const sala = useCarga(cargarSala, 'sala');
  const [cartilla, setCartilla] = useState(previo?.cartilla ?? '');
  useEffect(() => {
    if (!cartilla && sala.datos?.length) setCartilla(sala.datos[0].id);
  }, [cartilla, sala.datos]);
  return (
    <>
      <Encabezado titulo={previo ? 'Cambiar mi juego' : 'Armar un juego'} meta="Elija la materia y el grado, el tipo de juego y las palabras" volver={VOLVER} />
      <Cargado carga={sala}>
        {(cartillas) => (
          <div className="armar-juego">
            <Panel titulo="1. Materia y grado">
              <div className="sala-chips" role="group" aria-label="Materia y grado">
                {cartillas.map((c) => (
                  <button key={c.id} type="button" className="sala-chip" aria-pressed={cartilla === c.id} onClick={() => setCartilla(c.id)}>
                    {c.materia} · {c.gradoNombre}
                  </button>
                ))}
              </div>
              <p className="meta">Aparecen las cartillas que ya tienen palabras e imágenes listas.</p>
            </Panel>
            {cartilla && <Pasos key={cartilla} cartillaId={cartilla} previo={previo?.cartilla === cartilla ? previo : undefined} />}
          </div>
        )}
      </Cargado>
    </>
  );
}

function Pasos({ cartillaId, previo }: { cartillaId: string; previo?: ReturnType<typeof leerJuegosPropios>[number] }) {
  const carga = useCarga(() => cargarCartilla(cartillaId), `cartilla-${cartillaId}`);
  const [plantilla, setPlantilla] = useState<PlantillaPropia | null>(previo?.plantilla ?? null);
  const [elegidas, setElegidas] = useState<string[]>(previo?.palabras ?? []);
  const [titulo, setTitulo] = useState(previo?.titulo ?? '');
  const [error, setError] = useState('');
  useEffect(() => setError(''), [plantilla, elegidas, titulo]);

  return (
    <Cargado carga={carga}>
      {(c) => {
        const banco = bancoDePalabras(c);
        const tipos = plantillasDe(c);
        const grupos = [...new Set(banco.map((b) => b.mision))];
        const alternar = (en: string) => setElegidas((e) => (e.includes(en) ? e.filter((x) => x !== en) : e.length < MAXIMO ? [...e, en] : e));
        const verPalabra = (en: string) => banco.find((b) => b.palabra.en === en)?.palabra;
        const decirla = (en: string) => {
          const p = verPalabra(en);
          if (!p) return '';
          return c.idiomaVoz.startsWith('en') ? p.en : p.es;
        };
        const guardar = () => {
          if (!plantilla) return setError('Elija el tipo de juego.');
          if (elegidas.length < MINIMO) return setError(`Elija al menos ${MINIMO} palabras.`);
          const nombre = titulo.trim() || `${nombreTipo(plantilla)}: ${elegidas.slice(0, 3).map(decirla).join(', ')}`;
          const j = guardarJuegoPropio({ id: previo?.id, cartilla: c.id, plantilla, titulo: nombre.slice(0, 80), palabras: elegidas, icono: verPalabra(elegidas[0])?.icono, uid: previo?.uid ?? miId(), nube: previo?.nube });
          void subirCreacion(fuenteJuegos, j);
          navegar(`${RUTA_SALA}?listo=${encodeURIComponent(j.id)}`);
        };
        if (!banco.length) return <Vacio texto="Esta cartilla todavía no tiene palabras con imagen para armar juegos." />;
        return (
          <>
            <Panel titulo="2. Tipo de juego">
              <ul className="armar-juego__tipos">
                {tipos.map((t) => (
                  <li key={t}>
                    <button type="button" className="armar-actividad" aria-pressed={plantilla === t} onClick={() => setPlantilla(t)}>
                      <span className="armar-actividad__nombre">{TIPOS[t].nombre}</span>
                      <span className="armar-actividad__para">{TIPOS[t].hace}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel titulo={`3. Palabras (${elegidas.length} de ${MAXIMO})`} fin={elegidas.length > 0 && <Boton variante="texto" onClick={() => setElegidas([])}>Quitar todas</Boton>}>
              <p className="sec">Toque de {MINIMO} a {MAXIMO} palabras. Puede mezclar temas para un repaso.</p>
              {grupos.map((g) => (
                <div key={g} className="armar-juego__grupo">
                  <p className="armar-periodo">{g}</p>
                  <ul className="armar-juego__palabras">
                    {banco
                      .filter((b) => b.mision === g)
                      .map(({ palabra: p }) => {
                        const puesta = elegidas.includes(p.en);
                        return (
                          <li key={p.en}>
                            <button type="button" className="palabra-chip" aria-pressed={puesta} disabled={!puesta && elegidas.length >= MAXIMO} onClick={() => alternar(p.en)}>
                              <img src={rutaCartilla(c.id) + p.icono} alt="" width="40" height="40" loading="lazy" decoding="async" />
                              <span>{c.idiomaVoz.startsWith('en') ? p.en : p.es}</span>
                            </button>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              ))}
            </Panel>
            <Panel titulo="4. Nombre del juego">
              <div className="campo">
                <label htmlFor="nombre-juego">Así lo verá en Mis juegos (opcional)</label>
                <input id="nombre-juego" type="text" maxLength={80} value={titulo} placeholder={plantilla ? `${nombreTipo(plantilla)} de…` : 'Por ejemplo: Memoria de los colores'} onChange={(e) => setTitulo(e.target.value)} />
              </div>
            </Panel>
            <p className={`mensaje${error ? ' mensaje--error' : ''}`} role="status">
              {error}
            </p>
            <div className="mat-acciones">
              <Boton variante="primario" icono="guardado" onClick={guardar}>
                Guardar en Mis juegos
              </Boton>
              {previo && (
                <Boton icono="proyectar" ruta={rutaJugar(previo.cartilla, previo.id)}>
                  Jugar
                </Boton>
              )}
            </div>
          </>
        );
      }}
    </Cargado>
  );
}
