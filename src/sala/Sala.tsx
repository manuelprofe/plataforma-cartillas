// Sala de juegos del docente (/docente/juegos): todos los juegos de todas las cartillas en un
// solo lugar, por materia, grado y tipo de juego, más los que arma el propio docente. Cada juego
// se abre en /jugar/… (paquete del niño, sin tocar el progreso de nadie) para probarlo o proyectarlo.
import { useMemo, useState, useSyncExternalStore } from 'react';
import { Boton, Encabezado, Panel, Vacio } from '../adultos/base';
import { Cargado, Confirmar, useCarga, useTitulo } from '../adultos/comun';
import { Icono } from '../adultos/Icono';
import { rutaCartilla } from '../cartillas';
import { navegar } from '../navegacion';
import { MATERIAS } from '../pensum/datos';
import { alCambiarJuegosPropios, borrarJuegoPropio, leerJuegosPropios, type JuegoPropio } from './propios';
import './sala.css';
import '../armador/armador.css';

export const RUTA_SALA = '/docente/juegos';
export const RUTA_ARMAR_JUEGO = '/docente/juegos/armar';

export interface JuegoIndice { id: string; titulo: string; plantilla: string; icono: string; tema?: string; lugar: string; periodo: number; repaso?: boolean }
export interface CartillaJuegos { id: string; materia: string; grado: number; gradoNombre: string; guia: string; titulo: string; juegos: JuegoIndice[] }

/** Cómo se llama cada plantilla para el docente y qué hace el niño. */
export const TIPOS: Record<string, { nombre: string; hace: string }> = {
  'escucha-toca': { nombre: 'Escucha y toca', hace: 'Oye una palabra y toca su imagen.' },
  'escucha-atrapa': { nombre: 'Atrapa lo que oyes', hace: 'Las imágenes cruzan la pantalla; atrapa la que se nombra.' },
  memoria: { nombre: 'Memoria', hace: 'Encuentra las parejas de imagen y palabra.' },
  'di-brilla': { nombre: 'Di y brilla', hace: 'Dice la palabra en voz alta; se premia el intento.' },
  'contar-toca': { nombre: 'Contar y tocar', hace: 'Toca la cantidad que se pide, contando en voz alta.' },
  ordenar: { nombre: 'Ordenar', hace: 'Pone en orden números, secuencias o lo que pasó en un cuento.' },
  operacion: { nombre: 'Sumas y restas', hace: 'Ve la cuenta con objetos y elige el resultado.' },
  silabas: { nombre: 'Arma la palabra', hace: 'Toca las sílabas en orden para armar la palabra.' },
  plataformas: { nombre: 'Plataformas', hace: 'Salta, mueve cajas y abre puertas razonando.' },
  cuento: { nombre: 'Cuento vivo', hace: 'Escucha o lee un cuento y muestra que lo entendió.' },
};
export const nombreTipo = (p: string) => TIPOS[p]?.nombre ?? p;

let indice: Promise<CartillaJuegos[]> | null = null;
export function cargarSala(): Promise<CartillaJuegos[]> {
  indice ??= fetch(`${import.meta.env.BASE_URL}cartillas/juegos.json`)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
    .then((d: { cartillas: CartillaJuegos[] }) => d.cartillas)
    .catch((e) => {
      indice = null;
      throw e;
    });
  return indice;
}

export const rutaJugar = (cartilla: string, juego: string) => `/jugar/${encodeURIComponent(cartilla)}/${encodeURIComponent(juego)}`;

export function useJuegosPropios(): JuegoPropio[] {
  const crudo = useSyncExternalStore(alCambiarJuegosPropios, () => JSON.stringify(leerJuegosPropios()));
  return useMemo(() => JSON.parse(crudo) as JuegoPropio[], [crudo]);
}

const FILTRO = 'cuaderno.sala-filtro';
type Filtro = { materia: string; grado: string; tipo: string };
function filtroInicial(): Filtro {
  const q = new URLSearchParams(location.search);
  if (q.get('materia') || q.get('grado')) return { materia: q.get('materia') ?? '', grado: q.get('grado') ?? '', tipo: '' };
  try {
    const f = JSON.parse(localStorage.getItem(FILTRO) ?? 'null') as Filtro | null;
    if (f && typeof f.materia === 'string') return { materia: f.materia, grado: String(f.grado ?? ''), tipo: String(f.tipo ?? '') };
  } catch {
    // Sin almacenamiento: se empieza con todo.
  }
  return { materia: '', grado: '', tipo: '' };
}

function Chips({ etiqueta, opciones, valor, elegir }: { etiqueta: string; opciones: { valor: string; etiqueta: string }[]; valor: string; elegir: (v: string) => void }) {
  return (
    <div className="sala-chips" role="group" aria-label={etiqueta}>
      {opciones.map((o) => (
        <button key={o.valor || 'todo'} type="button" className="sala-chip" aria-pressed={valor === o.valor} onClick={() => elegir(o.valor)}>
          {o.etiqueta}
        </button>
      ))}
    </div>
  );
}

export function Sala() {
  useTitulo('Sala de juegos');
  const carga = useCarga(cargarSala, 'sala');
  const propios = useJuegosPropios();
  const [filtro, setFiltro] = useState<Filtro>(filtroInicial);
  const cambiar = (f: Partial<Filtro>) => {
    const nuevo = { ...filtro, ...f };
    if (f.materia !== undefined && f.materia !== filtro.materia) nuevo.grado = '';
    setFiltro(nuevo);
    try {
      localStorage.setItem(FILTRO, JSON.stringify(nuevo));
    } catch {
      // Sin almacenamiento: el filtro dura lo que dure la pantalla.
    }
  };

  return (
    <>
      <Encabezado titulo="Sala de juegos" meta="Todos los juegos de las cartillas, para probarlos o proyectarlos en clase" />
      <JuegoListo propios={propios} />
      <Panel titulo="Mis juegos" fin={<Boton variante="texto" icono="crear" ruta={RUTA_ARMAR_JUEGO}>Armar un juego</Boton>}>
        {propios.length ? (
          <MisJuegos propios={propios} carga={carga.datos} />
        ) : (
          <Vacio titulo="Arme su propio juego" texto="Elija un tipo de juego y las palabras e imágenes del tema; queda listo para proyectar o para pegar en su planeación." personaje="goma-senalar">
            <Boton variante="primario" icono="crear" ruta={RUTA_ARMAR_JUEGO}>
              Armar un juego
            </Boton>
          </Vacio>
        )}
      </Panel>
      <Cargado carga={carga}>
        {(cartillas) => {
          const materias = MATERIAS.filter((m) => cartillas.some((c) => c.materia === m));
          const deMateria = cartillas.filter((c) => !filtro.materia || c.materia === filtro.materia);
          const grados = [...new Map(deMateria.map((c) => [String(c.grado), c.gradoNombre])).entries()].sort((a, b) => Number(a[0]) - Number(b[0]));
          const visibles = deMateria.filter((c) => !filtro.grado || String(c.grado) === filtro.grado);
          const tipos = [...new Set(visibles.flatMap((c) => c.juegos.map((j) => j.plantilla)))];
          const total = visibles.reduce((n, c) => n + c.juegos.filter((j) => !filtro.tipo || j.plantilla === filtro.tipo).length, 0);
          return (
            <>
              <section className="sala-filtros" aria-label="Filtrar juegos">
                <Chips etiqueta="Materia" valor={filtro.materia} elegir={(materia) => cambiar({ materia })} opciones={[{ valor: '', etiqueta: 'Todas' }, ...materias.map((m) => ({ valor: m, etiqueta: m }))]} />
                <Chips etiqueta="Grado" valor={filtro.grado} elegir={(grado) => cambiar({ grado })} opciones={[{ valor: '', etiqueta: 'Todos los grados' }, ...grados.map(([v, e]) => ({ valor: v, etiqueta: e }))]} />
                <Chips etiqueta="Tipo de juego" valor={tipos.includes(filtro.tipo) ? filtro.tipo : ''} elegir={(tipo) => cambiar({ tipo })} opciones={[{ valor: '', etiqueta: 'Todos los tipos' }, ...tipos.map((t) => ({ valor: t, etiqueta: nombreTipo(t) }))]} />
                <p className="meta" role="status">
                  {total} {total === 1 ? 'juego' : 'juegos'}
                </p>
              </section>
              {visibles.map((c) => {
                const juegos = c.juegos.filter((j) => !filtro.tipo || !tipos.includes(filtro.tipo) || j.plantilla === filtro.tipo);
                if (!juegos.length) return null;
                return (
                  <section key={c.id} className="sala-cartilla">
                    <h2 className="sala-cartilla__titulo">
                      {c.materia} · {c.gradoNombre}
                      <span className="meta"> · con {c.guia}</span>
                    </h2>
                    <ul className="sala-rejilla">
                      {juegos.map((j) => (
                        <li key={j.id}>
                          <TarjetaJuego cartilla={c.id} id={j.id} titulo={j.titulo} icono={j.icono} tipo={j.plantilla} detalle={j.tema ?? j.lugar} repaso={j.repaso} />
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
              {cartillas.length > 0 && (
                <p className="meta sala-pie">Las demás materias y grados suman sus juegos a medida que se terminan sus cartillas; aparecen aquí solos.</p>
              )}
            </>
          );
        }}
      </Cargado>
    </>
  );
}

function TarjetaJuego({ cartilla, id, titulo, icono, tipo, detalle, repaso }: { cartilla: string; id: string; titulo: string; icono?: string; tipo: string; detalle?: string; repaso?: boolean }) {
  const ruta = rutaJugar(cartilla, id);
  return (
    <a
      className="sala-juego"
      href={ruta}
      onClick={(e) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        navegar(ruta);
      }}
    >
      <span className="sala-juego__dibujo" aria-hidden="true">
        {icono && <img src={rutaCartilla(cartilla) + icono} alt="" width="56" height="56" loading="lazy" decoding="async" />}
      </span>
      <span className="sala-juego__texto">
        <span className="sala-juego__titulo">{titulo}</span>
        <span className="sala-juego__tipo">
          {nombreTipo(tipo)}
          {repaso ? ' · repaso' : ''}
        </span>
        {detalle && <span className="meta sala-juego__detalle">{detalle}</span>}
      </span>
      <span className="sala-juego__jugar">
        <Icono nombre="proyectar" />
        Jugar
      </span>
    </a>
  );
}

function MisJuegos({ propios, carga }: { propios: JuegoPropio[]; carga?: CartillaJuegos[] }) {
  return (
    <ul className="sala-mios">
      {propios.map((j) => {
        const c = carga?.find((x) => x.id === j.cartilla);
        return (
          <li key={j.id} className="sala-mio">
            <TarjetaJuego cartilla={j.cartilla} id={j.id} titulo={j.titulo} icono={j.icono} tipo={j.plantilla} detalle={`${c ? `${c.materia} · ${c.gradoNombre} · ` : ''}${j.palabras.length} palabras`} />
            <div className="sala-mio__acciones">
              <Boton variante="texto" icono="planear" ruta={`${RUTA_ARMAR_JUEGO}/${j.id}`}>
                Cambiar
              </Boton>
              <Confirmar etiqueta="Borrar" pregunta={`¿Borrar «${j.titulo}»? Se quita de este aparato.`} si="Sí, borrar" alConfirmar={() => borrarJuegoPropio(j.id)} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Al volver del armador: el juego recién guardado, con el botón para jugarlo ya. */
function JuegoListo({ propios }: { propios: JuegoPropio[] }) {
  const id = new URLSearchParams(location.search).get('listo');
  const j = id ? propios.find((x) => x.id === id) : undefined;
  if (!j) return null;
  return (
    <div className="sala-listo" role="status">
      <p>
        <strong>«{j.titulo}» quedó en Mis juegos.</strong> Ábralo para probarlo o proyectarlo.
      </p>
      <Boton variante="primario" icono="proyectar" ruta={rutaJugar(j.cartilla, j.id)}>
        Jugar ahora
      </Boton>
    </div>
  );
}
