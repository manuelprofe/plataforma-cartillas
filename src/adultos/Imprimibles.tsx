// Lo que el docente imprime (regla 9; esqueleto §2.5): las tarjetas de entrada, 8 por hoja carta,
// y la lista del grupo para marcar estrellas. En pantalla es una vista previa; la hoja sale con
// @media print (docente.css). El PIN nunca se pinta en pantalla: sus tres imágenes solo aparecen
// al imprimir, y solo para los niños cuyo PIN se generó en esta sesión (la base no lo guarda legible).
import { useState } from 'react';
import { DibujoPin } from '../entrada/pin';
import { Boton, Encabezado, Panel, Vacio } from './base';
import { Confirmar, textoAccion, useTitulo } from './comun';
import { cambiarPin, pinDe, URL_PUBLICA, type GrupoDoc, type Nino, type Paquete } from './docente';
import { Cara } from './docenteComun';
import { crearQr, trazoQr } from './qr';

const rutaGrupo = (id: string) => `/docente/grupos/${encodeURIComponent(id)}`;

function Qr({ texto }: { texto: string }) {
  const { trazo, lado } = trazoQr(crearQr(texto));
  return (
    <svg className="qr" viewBox={`0 0 ${lado} ${lado}`} role="img" aria-label={`Código QR de ${texto}`} shapeRendering="crispEdges">
      <rect width={lado} height={lado} fill="#fff" />
      <path d={trazo} fill="#000" />
    </svg>
  );
}

const SIN_HTTPS = URL_PUBLICA.replace(/^https?:\/\//, '');

function TarjetaEntrada({ nino, grupo, paquete, pin }: { nino: Nino; grupo: GrupoDoc; paquete: Paquete; pin: string }) {
  return (
    <article className="tarjeta-caja">
      <div className="tarjeta">
        <div className="tarjeta__quien">
          <Cara paquete={paquete} avatar={nino.avatar} className="tarjeta__cara" />
          <p>
            <strong>{nino.apodo}</strong>
            <span>Grupo {grupo.nombre}</span>
          </p>
        </div>
        <div className="tarjeta__qr">
          <Qr texto={`${URL_PUBLICA}/t/${grupo.codigo}`} />
          <p className="tarjeta__codigo">{grupo.codigo}</p>
        </div>
        <ol className="tarjeta__pasos">
          <li>Escanee el cuadro, o escriba el código en {SIN_HTTPS}</li>
          <li>Toque la cara del niño.</li>
          <li>Toque sus tres imágenes en orden.</li>
        </ol>
        <div className="tarjeta__pin">
          <span className="tarjeta__pin-titulo">Su clave</span>
          {/* En pantalla, tres recuadros vacíos; las imágenes solo salen en la hoja impresa. */}
          {[0, 1, 2].map((i) => (
            <span key={i} className="tarjeta__imagen">
              <span className="solo-pantalla" />
              <span className="solo-impresion">
                <DibujoPin cifra={Number(pin[i])} tam={64} />
              </span>
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export function Tarjetas({ grupo, ninos, paquete, solo, sinRed }: { grupo: GrupoDoc; ninos: Nino[]; paquete: Paquete; solo?: string; sinRed: boolean }) {
  useTitulo(`Tarjetas · ${grupo.nombre}`);
  const [, repintar] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string>();
  const elegidos = solo ? ninos.filter((n) => n.id === solo) : ninos;
  const listos = elegidos.filter((n) => pinDe(n.id));
  const sinPin = elegidos.filter((n) => !pinDe(n.id));
  const sinAutorizar = listos.filter((n) => !n.autorizacion);

  const generar = async () => {
    setOcupado(true);
    setError(undefined);
    try {
      for (const n of sinPin) await cambiarPin(n.id);
    } catch (e) {
      setError(textoAccion(e));
    } finally {
      setOcupado(false);
      repintar((v) => v + 1);
    }
  };

  return (
    <>
      <div className="no-imprimir">
        <Encabezado titulo={solo && elegidos[0] ? `Tarjeta de ${elegidos[0].apodo}` : 'Tarjetas de entrada'} meta="Ocho por hoja carta, con línea de corte." volver={{ ruta: rutaGrupo(grupo.id), etiqueta: `Grupo ${grupo.nombre}` }} />
      </div>
      {elegidos.length === 0 ? (
        <Panel>
          <Vacio titulo="No hay tarjetas para imprimir" texto="Agregue niños al grupo y vuelva aquí." />
        </Panel>
      ) : (
        <>
          <div className="no-imprimir imprimir-cabeza">
            <Panel>
              <p className="sec">El PIN de cada niño no se ve en pantalla: sus tres imágenes aparecen solo en la hoja impresa. La base no lo guarda legible, así que al recargar esta página hay que generar uno nuevo.</p>
              {sinAutorizar.length > 0 && (
                <p className="meta">
                  Sin autorización marcada: {sinAutorizar.map((n) => n.apodo).join(', ')}. Sus tarjetas no abren la entrada hasta que la marque.
                </p>
              )}
              {sinPin.length > 0 && (
                <div className="item__acciones">
                  <Confirmar
                    principal={listos.length === 0}
                    etiqueta={sinPin.length === 1 ? 'Generar un PIN nuevo' : `Generar PIN nuevos para ${sinPin.length} niños`}
                    pregunta="¿Generar PIN nuevos? Las tarjetas anteriores de estos niños dejan de servir."
                    si="Sí, generar"
                    disabled={sinRed || ocupado}
                    alConfirmar={() => void generar()}
                  />
                  {sinRed && <span className="meta">Necesita internet</span>}
                </div>
              )}
              <p className="mensaje mensaje--error" role="alert">
                {error}
              </p>
              {listos.length > 0 && (
                <div>
                  <Boton variante="primario" icono="imprimir" onClick={() => window.print()}>
                    Imprimir {listos.length === 1 ? 'la tarjeta' : `${listos.length} tarjetas`}
                  </Boton>
                </div>
              )}
            </Panel>
          </div>
          <div className="tarjetas imprimible">
            {listos.map((n) => (
              <TarjetaEntrada key={n.id} nino={n} grupo={grupo} paquete={paquete} pin={pinDe(n.id)!} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

/** Cuántas fechas lleva la lista: ocho clases bastan para un período. */
const FECHAS = 8;

export function ListaEstrellas({ grupo, ninos }: { grupo: GrupoDoc; ninos: Nino[] }) {
  useTitulo(`Lista · ${grupo.nombre}`);
  return (
    <>
      <div className="no-imprimir">
        <Encabezado titulo="Lista para estrellas" meta="En orden alfabético, con casillas para participar y colaborar por fecha." volver={{ ruta: rutaGrupo(grupo.id), etiqueta: `Grupo ${grupo.nombre}` }} />
        {ninos.length > 0 && (
          <div className="imprimir-cabeza">
            <Boton variante="primario" icono="imprimir" onClick={() => window.print()}>
              Imprimir lista
            </Boton>
          </div>
        )}
      </div>
      {ninos.length === 0 ? (
        <Panel>
          <Vacio titulo="No hay niños en la lista" texto="Agregue niños al grupo y vuelva aquí." />
        </Panel>
      ) : (
        <div className="imprimible lista-hoja">
          <h2 className="solo-impresion">Lista del grupo {grupo.nombre} · Mission Stars</h2>
          <p className="meta lista-hoja__ayuda">P: participar (10 estrellas). C: colaborar (15). Marque la casilla en la fecha de la clase y pase las estrellas a la plataforma después.</p>
          <div className="lista-hoja__tabla">
            <table>
              <thead>
                <tr>
                  <th scope="col" rowSpan={2}>
                    Apodo
                  </th>
                  {Array.from({ length: FECHAS }, (_, i) => (
                    <th key={i} scope="colgroup" colSpan={2} className="fecha-celda">
                      <span className="solo-impresion">Fecha</span>
                      <span className="solo-pantalla">Fecha {i + 1}</span>
                    </th>
                  ))}
                </tr>
                <tr>
                  {Array.from({ length: FECHAS }, (_, i) => (
                    <FragmentoPC key={i} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {ninos.map((n) => (
                  <tr key={n.id}>
                    <th scope="row">{n.apodo}</th>
                    {Array.from({ length: FECHAS * 2 }, (_, i) => (
                      <td key={i}>
                        <span className="caja-marca" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function FragmentoPC() {
  return (
    <>
      <th scope="col" className="pc">
        P
      </th>
      <th scope="col" className="pc">
        C
      </th>
    </>
  );
}
