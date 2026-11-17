// Resumen para la familia: una página tranquila para el adulto, que también se imprime.
// Abre con lo logrado y cierra con una sugerencia. Sin notas, porcentajes ni comparaciones:
// lo que falta se nombra como "para seguir practicando" (pedagogía, ronda 1, sección 4).
// Todo sale del progreso y del paquete de la cartilla. Aquí vive también "Empezar de nuevo".
import { useEffect, useState } from 'react';
import type { Cartilla, Palabra, Territorio } from './tipos';
import { callar, decir, sonar } from './audio';
import { diaDe, hayAvanceBorrado, recuperarProgreso, useProgreso } from './progreso';
import { BotonSostenido } from './BotonSostenido';

interface Props {
  cartilla: Cartilla;
  territorio: Territorio;
  base: string;
  onVolver: () => void;
  /** Borra el avance del dispositivo (ya confirmado por el adulto). */
  onBorrar: () => void;
}

const MAX_PRACTICAR = 3;
const MS_BORRAR = 2000;
const veces = (n: number) => (n === 1 ? '1 vez' : `${n} veces`);
/** "a, b y c" */
const lista = (partes: string[]) => (partes.length < 2 ? partes.join('') : `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`);

export function Familia({ cartilla, territorio, base, onVolver, onBorrar }: Props) {
  const progreso = useProgreso();
  const [leyendo, setLeyendo] = useState(false);
  const [borrar, setBorrar] = useState(false);
  useEffect(() => callar, []);

  const hechas = territorio.misiones.filter((m) => progreso.misiones[m.id]);
  const faroles = territorio.misiones.filter((m) => !m.opcional);
  const encendidos = faroles.filter((m) => progreso.misiones[m.id]).length;

  // Días de práctica de los últimos siete (contando hoy).
  const haceUnaSemana = new Date();
  haceUnaSemana.setDate(haceUnaSemana.getDate() - 6);
  const dias = (progreso.dias ?? []).filter((d) => d >= diaDe(haceUnaSemana)).length;

  // Lo que ya reconoce, por tema: palabras de misiones completas que no están por repasar.
  const porRepasar = new Set(progreso.repasar.map((p) => p.en));
  const temas = new Map<string, Palabra[]>();
  for (const m of hechas) {
    const tema = m.familia?.tema ?? '';
    const palabras = temas.get(tema) ?? [];
    m.palabras.forEach((p) => !porRepasar.has(p.en) && !palabras.some((q) => q.en === p.en) && palabras.push(p));
    temas.set(tema, palabras);
  }
  const reconoce = [...temas].filter(([, palabras]) => palabras.length);

  const repetidas = hechas.filter((m) => progreso.misiones[m.id].veces > 1);
  const mejoradas = repetidas.filter((m) => progreso.misiones[m.id].mejoras);
  const superadas = (progreso.superadas ?? []).filter((en) => !porRepasar.has(en));
  const practicar = progreso.repasar.slice(0, MAX_PRACTICAR);

  const sentir = [3, 2, 1].map((valor) => hechas.filter((m) => progreso.misiones[m.id].autoeval === valor).length);
  const CARAS = ['😄', '🙂', '🤔'];
  const NOMBRE_CARA = ['contento', 'tranquilo', 'pensativo'];

  // La idea para hacer juntos: la del tema con más palabras por practicar; si no hay, la del último tema jugado.
  const conIdea = territorio.misiones.filter((m) => m.familia);
  const pendientes = (m: (typeof conIdea)[number]) => m.palabras.filter((p) => porRepasar.has(p.en)).length;
  const ultima = [...progreso.registro].reverse().find((e) => conIdea.some((m) => m.id === e.mision))?.mision;
  const deLaIdea = [...conIdea].sort((a, b) => pendientes(b) - pendientes(a)).find((m) => pendientes(m) > 0) ?? conIdea.find((m) => m.id === ultima) ?? hechas.find((m) => m.familia);

  // Las mismas frases se muestran y se leen en voz alta.
  const frases = {
    avance: `${territorio.nombre}. Encendió ${encendidos} de ${faroles.length} faroles y tiene ${progreso.estrellas} estrellas.`,
    vecinos: progreso.ayudados.length ? `Ayudó a ${progreso.ayudados.length === 1 ? '1 vecino' : `${progreso.ayudados.length} vecinos`}.` : '',
    dias: dias ? `Esta semana practicó ${dias === 1 ? '1 día' : `${dias} días`}.` : '',
    repaso: repetidas.length ? `Volvió a jugar ${lista(repetidas.map((m) => `"${m.titulo}"`))}${mejoradas.length ? ' y le fue mejor que la primera vez' : ''}.` : '',
    superadas: superadas.length ? `Ahora ya le ${superadas.length === 1 ? 'sale' : 'salen'}: ${lista(superadas)}.` : '',
    sentir: `Al terminar las misiones eligió ${lista(sentir.map((n, i) => (n ? `${CARAS[i]} ${veces(n)}` : '')).filter(Boolean))}.`,
    preguntar: sentir[2] > sentir[0] ? 'Si quiere, pregúntele qué le pareció difícil.' : '',
    cierre: 'Usted no necesita saber inglés: él o ella le enseña. Cinco minutos bastan.',
    nota: 'Las estrellas reconocen el esfuerzo en la cartilla; no son la nota.',
  };
  const hayCaritas = sentir.some(Boolean);

  const leer = () => {
    if (leyendo) {
      callar();
      setLeyendo(false);
      return;
    }
    const texto = [
      frases.avance,
      frases.vecinos,
      frases.dias,
      ...reconoce.map(([tema, palabras]) => `${tema ? `De ${tema}, ya` : 'Ya'} reconoce ${lista(palabras.map((p) => p.es))}.`),
      frases.repaso,
      frases.superadas,
      practicar.length ? `Para seguir practicando: ${lista(practicar.map((p) => p.es))}.` : 'Por ahora no hay palabras pendientes.',
      hayCaritas ? `Al terminar las misiones dijo que se sintió ${lista(sentir.map((n, i) => (n ? `${NOMBRE_CARA[i]} ${veces(n)}` : '')).filter(Boolean))}.` : '',
      frases.preguntar,
      deLaIdea?.familia ? `Una idea para hacer juntos, si tienen un ratico. ${deLaIdea.familia.idea} ${frases.cierre}` : '',
      frases.nota,
    ]
      .filter(Boolean)
      .join(' ');
    setLeyendo(true);
    decir(texto, cartilla.idiomaHistoria, () => setLeyendo(false));
  };

  const oir = (p: Palabra) => {
    sonar('toque');
    setLeyendo(false);
    decir(p.en, cartilla.idiomaVoz);
  };
  const ficha = (p: Palabra) => (
    <li key={p.en}>
      <img src={base + p.icono} alt="" width="36" height="36" />
      <span>
        <strong lang="en">{p.en}</strong> <small>{p.es}</small>
      </span>
      <button type="button" className="familia__oir" onClick={() => oir(p)} aria-label={`Oír ${p.en}`}>
        🔊
      </button>
    </li>
  );

  return (
    <div className="familia">
      <div className="familia__hoja">
        <p className="familia__imprimir-solo">
          {cartilla.titulo} · {cartilla.materia}, grado {cartilla.grado} · {new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <header className="familia__cabeza">
          <h1>Lo que practicó en {cartilla.materia.toLowerCase()}</h1>
          <button type="button" className="familia__boton" onClick={onVolver}>
            Volver
          </button>
        </header>

        {hechas.length === 0 ? (
          <p>Todavía no hay misiones completas. Cuando termine la primera, aquí verá las palabras que practicó.</p>
        ) : (
          <>
            <button type="button" className="familia__boton familia__boton--claro" onClick={leer} aria-pressed={leyendo}>
              {leyendo ? '⏹ Detener' : '🔊 Escuchar este resumen'}
            </button>
            <p>
              {frases.avance} {frases.vecinos} {frases.dias}
            </p>

            <h2>Ya las reconoce</h2>
            {reconoce.map(([tema, palabras]) => (
              <section key={tema}>
                {tema && <h3>De {tema}</h3>}
                <ul className="familia__chips">{palabras.map(ficha)}</ul>
              </section>
            ))}

            {(frases.repaso || frases.superadas) && (
              <>
                <h2>Repasó por su cuenta</h2>
                <p>
                  {frases.repaso} {frases.superadas}
                </p>
              </>
            )}

            <h2>Para seguir practicando</h2>
            {practicar.length ? (
              <>
                <p>
                  Son palabras que todavía está aprendiendo. <span className="familia__pantalla-solo">Toque 🔊 para oírlas y pídale que las repita con usted.</span>
                </p>
                <ul className="familia__lista">{practicar.map(ficha)}</ul>
              </>
            ) : (
              <p>Por ahora no hay palabras pendientes.</p>
            )}

            {hayCaritas && (
              <>
                <h2>Cómo se sintió</h2>
                <p>
                  {frases.sentir} {frases.preguntar}
                </p>
              </>
            )}

            {deLaIdea?.familia && (
              <>
                <h2>Una idea para hacer juntos, si tienen un ratico</h2>
                <p>
                  {deLaIdea.familia.idea} {frases.cierre}
                </p>
              </>
            )}

            <p className="familia__nota">{frases.nota}</p>

            <div className="familia__imprimir-solo">
              <p>Observaciones de la familia:</p>
              <div className="familia__renglon" />
              <p>Observaciones de la docente:</p>
              <div className="familia__renglon" />
            </div>

            <button type="button" className="familia__boton" onClick={() => window.print()}>
              Imprimir
            </button>
          </>
        )}

        {hayAvanceBorrado() && (
          <button type="button" className="familia__boton familia__boton--claro" onClick={() => (recuperarProgreso(), onVolver())}>
            Recuperar el avance que se borró
          </button>
        )}
        {(hechas.length > 0 || progreso.heroe) && (
          <button type="button" className="enlace familia__borrar" onClick={() => setBorrar(true)}>
            Empezar de nuevo: borrar el avance de este dispositivo
          </button>
        )}
      </div>

      {borrar && (
        <div className="familia__confirmar" role="alertdialog" aria-label="Borrar el avance">
          <div>
            <p>¿Borrar el avance de este dispositivo? Se quitan las estrellas, el álbum y lo que lleva puesto el personaje. Durante 7 días se puede recuperar desde esta misma pantalla.</p>
            <BotonSostenido ms={MS_BORRAR} className="familia__boton familia__boton--peligro" onListo={onBorrar}>
              Borrar (mantenga presionado 2 segundos)
            </BotonSostenido>
            <button type="button" className="familia__boton familia__boton--claro" onClick={() => setBorrar(false)}>
              No borrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
