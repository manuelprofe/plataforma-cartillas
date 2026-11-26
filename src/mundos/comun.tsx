// Lo que comparten los mundos propios de cada materia (camino de Cuadrito, biblioteca de
// Renglón): en qué estado está cada misión, cómo se agrupan por tema y cómo se entra a una
// (el guía dice su frase de "antes" y luego se abre el juego).
import { useState } from 'react';
import type { Escena, Heroe, Mision, Territorio } from '../tipos';
import type { Progreso } from '../progreso';
import { Dialogo } from '../Dialogo';
import { Vestidor } from '../Vestidor';
import { callar, decir, sonar } from '../audio';

export type EstadoMision = 'hecha' | 'libre' | 'dormida';

/**
 * Estado de cada misión. En orden ('camino'), cada una despierta al terminar la anterior; si no,
 * valen sus `requiere` y `requiereAlguna` (cada estante de la biblioteca abre su primer libro).
 */
export function estados(misiones: Mision[], progreso: Progreso, enOrden: boolean): EstadoMision[] {
  const hecha = (id: string) => Boolean(progreso.misiones[id]);
  return misiones.map((m, i) => {
    if (hecha(m.id)) return 'hecha';
    if (enOrden) return i === 0 || hecha(misiones[i - 1].id) ? 'libre' : 'dormida';
    if (m.requiere && !hecha(m.requiere)) return 'dormida';
    if (m.requiereAlguna && !m.requiereAlguna.some(hecha)) return 'dormida';
    return 'libre';
  });
}

/** Grupos de misiones seguidas que comparten tema (una zona del contenido); el repaso va aparte. */
export function porTema(misiones: Mision[]): { tema: string; indices: number[] }[] {
  const grupos: { tema: string; indices: number[] }[] = [];
  misiones.forEach((m, i) => {
    const tema = m.familia?.tema ?? 'repaso';
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.tema === tema) ultimo.indices.push(i);
    else grupos.push({ tema, indices: [i] });
  });
  return grupos;
}

interface PropsEntrada {
  territorio: Territorio;
  base: string;
  voz: string;
  onEntrar: (indice: number) => void;
}

/** Charla antes de una misión (o una frase suelta del guía) y la entrada al juego. */
export function useEntrada({ territorio, base, voz, onEntrar }: PropsEntrada) {
  const [charla, setCharla] = useState<{ lineas: Escena['lineas']; indice?: number } | null>(null);
  const guia = territorio.guia;
  const abrir = (indice: number) => {
    sonar('toque');
    callar();
    const m = territorio.misiones[indice];
    if (m.antes.length) setCharla({ lineas: m.antes, indice });
    else onEntrar(indice);
  };
  const decirGuia = (texto: string) => {
    callar();
    setCharla({ lineas: [{ quien: guia, es: texto, en: texto }] });
  };
  const dialogo = charla && (
    <Dialogo
      lineas={charla.lineas}
      escenas={{}}
      personajes={territorio.personajes}
      base={base}
      modo="es"
      vozIngles={voz}
      vozEspanol={voz}
      onDestino={() => {}}
      onCerrar={() => {
        const indice = charla.indice;
        setCharla(null);
        if (indice !== undefined) onEntrar(indice);
      }}
    />
  );
  return { abrir, decirGuia, dialogo, hablando: Boolean(charla), decir: (t: string) => decir(t, voz) };
}

interface PropsUtiles {
  heroe: Heroe;
  base: string;
  progreso: Progreso;
  vestidor: Omit<Parameters<typeof Vestidor>[0], 'heroe' | 'base' | 'onCerrar' | 'alTocarCerrada' | 'estrellas' | 'puestos' | 'vistos' | 'estela'> & { estela: string };
  alTocarCerrada: () => void;
}

/** Botón para vestir al héroe (las calcomanías abren piezas) y su panel. */
export function useVestidor({ heroe, base, progreso, vestidor, alTocarCerrada }: PropsUtiles) {
  const [abierto, setAbierto] = useState(false);
  const nueva = vestidor.accesorios.some((a) => progreso.estrellas >= a.estrellas && !progreso.accesoriosVistos?.includes(a.id));
  const boton = (
    <button type="button" className={`utiles__vestidor${nueva ? ' es-nuevo' : ''}`} onClick={() => (sonar('toque'), setAbierto(true))} aria-label={nueva ? 'Vestir al personaje: hay algo nuevo' : 'Vestir al personaje'}>
      <img src={base + heroe.imagen} alt="" width="56" height="56" draggable={false} />
      {nueva && <small>🎁</small>}
    </button>
  );
  const panel = abierto && (
    <Vestidor
      heroe={heroe}
      accesorios={vestidor.accesorios}
      estelas={vestidor.estelas}
      estela={vestidor.estela}
      estrellas={progreso.estrellas}
      puestos={progreso.accesorios ?? {}}
      vistos={progreso.accesoriosVistos ?? []}
      base={base}
      alTocarCerrada={alTocarCerrada}
      onCerrar={() => (callar(), setAbierto(false))}
    />
  );
  return { boton, panel, abierto };
}
