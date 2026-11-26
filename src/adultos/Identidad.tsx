// Identidad del colegio en sus impresos: escudo y dos colores. La usan el dueño (ficha del
// colegio) y el coordinador (Cuenta). El escudo se achica en el navegador a un PNG de 240 px como
// máximo, para que quepa en la base y en el Word que se descarga. El modo estudiante no la usa.
import { useEffect, useState, type ChangeEvent } from 'react';
import { Boton, Panel } from './base';
import { textoAccion } from './comun';
import { guardarIdentidad, identidadColegio } from './docente';

export const COLOR_1 = '#2a1458';
export const COLOR_2 = '#f5c542';
const LARGO_MAXIMO = 200000;

/** Blanco o tinta sobre un color de fondo, según cuánto brilla. */
export function tintaSobre(c: string): string {
  const n = parseInt(c.replace('#', ''), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? '#1f2430' : '#ffffff';
}


/** Lee la imagen elegida y la devuelve como PNG pequeño (data URL). */
async function achicar(archivo: File): Promise<string> {
  const url = URL.createObjectURL(archivo);
  try {
    const img = await new Promise<HTMLImageElement>((ok, mal) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => mal(new Error('imagen'));
      i.src = url;
    });
    for (const lado of [240, 180, 120]) {
      const k = Math.min(1, lado / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.naturalWidth * k));
      c.height = Math.max(1, Math.round(img.naturalHeight * k));
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      const png = c.toDataURL('image/png');
      if (png.length <= LARGO_MAXIMO) return png;
    }
    throw new Error('grande');
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Franja de encabezado tal como sale en la planeación: escudo, nombre y colores. */
export function MuestraEncabezado({ nombre, escudo, color1, color2 }: { nombre: string; escudo: string | null; color1: string; color2: string }) {
  return (
    <div className="identidad-muestra" style={{ borderColor: color1 }} aria-label="Así sale el encabezado de las planeaciones">
      {escudo ? <img src={escudo} alt="" /> : <span className="identidad-muestra__hueco">Escudo</span>}
      <div>
        <strong style={{ color: color1 }}>{nombre}</strong>
        <span>Planeador de clase</span>
      </div>
      <span className="identidad-muestra__raya" style={{ background: color2 }} />
    </div>
  );
}

export function IdentidadColegio({ colegioId, sinRed }: { colegioId: string; sinRed: boolean }) {
  const [nombre, setNombre] = useState('');
  const [escudo, setEscudo] = useState<string | null>(null);
  const [color1, setColor1] = useState(COLOR_1);
  const [color2, setColor2] = useState(COLOR_2);
  const [estado, setEstado] = useState<{ tipo: 'error' | 'ok'; texto: string }>();
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    let vigente = true;
    identidadColegio(colegioId, true)
      .then((d) => {
        if (!vigente || !d) return;
        setNombre(d.nombre);
        setEscudo(d.escudo);
        setColor1(d.color_1 ?? COLOR_1);
        setColor2(d.color_2 ?? COLOR_2);
      })
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, [colegioId]);

  const elegir = async (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setEstado(undefined);
    try {
      setEscudo(await achicar(archivo));
    } catch {
      setEstado({ tipo: 'error', texto: 'No se pudo leer esa imagen. Pruebe con una foto o un PNG del escudo.' });
    }
  };

  const guardar = async () => {
    setOcupado(true);
    setEstado(undefined);
    try {
      await guardarIdentidad(colegioId, { escudo, color_1: color1, color_2: color2 });
      setEstado({ tipo: 'ok', texto: 'Guardado. Las planeaciones ya salen así.' });
    } catch (falla) {
      setEstado({ tipo: 'error', texto: textoAccion(falla) });
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Panel titulo="Escudo y colores del colegio">
      <p className="sec">Salen en el encabezado de las planeaciones y hojas que imprimen o descargan sus docentes. Los niños no los ven.</p>
      <MuestraEncabezado nombre={nombre || 'Nombre del colegio'} escudo={escudo} color1={color1} color2={color2} />
      <div className="identidad-campos">
        <label className="boton boton--secundario identidad-subir">
          {escudo ? 'Cambiar escudo' : 'Subir escudo'}
          <input type="file" accept="image/*" onChange={(e) => void elegir(e)} />
        </label>
        {escudo && (
          <Boton variante="texto" onClick={() => setEscudo(null)}>
            Quitar escudo
          </Boton>
        )}
        <label className="identidad-color">
          <input type="color" value={color1} onChange={(e) => setColor1(e.target.value)} />
          Color principal
        </label>
        <label className="identidad-color">
          <input type="color" value={color2} onChange={(e) => setColor2(e.target.value)} />
          Color de acento
        </label>
      </div>
      <Boton variante="primario" onClick={() => void guardar()} disabled={ocupado || sinRed}>
        {ocupado ? 'Guardando…' : 'Guardar escudo y colores'}
      </Boton>
      <p className={`mensaje${estado ? ` mensaje--${estado.tipo}` : ''}`} role="status">
        {estado?.texto}
      </p>
    </Panel>
  );
}
