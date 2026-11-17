// Paquete de proyectar (esqueleto §2.3): solo leerá el paquete de la cartilla. No importa nada
// de los datos del colegio ni de Supabase, y no muestra el nombre del docente ni su colegio.
// Tanda 1: rutas, telón y huecos. El menú del tema, las láminas y los juegos son la tanda 5.
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { navegar, useRuta } from '../navegacion';
import { marcarProyectando } from '../proyectando';
import { Boton, Hueco } from '../adultos/base';
import './proyectar.css';

export function montar(raiz: HTMLElement) {
  createRoot(raiz).render(
    <StrictMode>
      <Proyectar />
    </StrictMode>,
  );
}

function Proyectar() {
  const ruta = useRuta().replace(/\/+$/, '') || '/proyectar';
  const [, , tema, ...resto] = ruta.split('/');
  useEffect(() => {
    document.title = 'Proyectar · English Adventure Quest';
  }, []);
  if (tema === 'fin') return <Fin />;
  if (resto.length) return <IrA ruta={`/proyectar/${tema}`} />;
  return <Telon tema={tema ? decodeURIComponent(tema) : undefined} />;
}

function IrA({ ruta }: { ruta: string }) {
  useEffect(() => navegar(ruta, true), [ruta]);
  return null;
}

function Telon({ tema }: { tema?: string }) {
  const [confirmar, setConfirmar] = useState(false);
  // Mientras haya telón, este aparato cuenta como "proyectando" para la cortina del docente.
  useEffect(() => {
    marcarProyectando();
    const cada = window.setInterval(marcarProyectando, 60000);
    return () => window.clearInterval(cada);
  }, []);
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && setConfirmar((c) => !c);
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, []);

  return (
    <div className="telon">
      <header className="telon__cabeza">
        <div>
          <h1>{tema ? 'Menú del tema' : 'Elegir tema'}</h1>
          <p className="meta">English Adventure Quest</p>
        </div>
        <button type="button" className="telon__terminar" onClick={() => setConfirmar(true)}>
          Terminar
        </button>
      </header>
      <main className="telon__cuerpo">
        {tema ? (
          <Hueco titulo="Aquí irá el menú del tema" texto="Láminas, juegos de aula, la canción y el reto, en tarjetas grandes." />
        ) : (
          <Hueco titulo="Aquí irán los temas para proyectar" texto="Cada territorio con sus temas, en tarjetas grandes. Se proyecta sin cuenta y sin datos de nadie." />
        )}
      </main>
      {confirmar && (
        <div className="telon__confirmar" role="dialog" aria-modal="true" aria-labelledby="confirmar-titulo">
          <div>
            <h2 id="confirmar-titulo">¿Terminar la proyección?</h2>
            <div className="acciones">
              <Boton onClick={() => setConfirmar(false)}>Seguir proyectando</Boton>
              <Boton variante="primario" onClick={() => navegar('/proyectar/fin', true)}>
                Terminar
              </Boton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Fin() {
  return (
    <div className="telon">
      <main className="telon__cuerpo telon__fin">
        <h1>Proyección terminada</h1>
        <div className="acciones">
          <Boton ruta="/proyectar">Volver a proyectar</Boton>
          <Boton variante="primario" ruta="/docente">
            Ir a mi inicio
          </Boton>
        </div>
      </main>
    </div>
  );
}
