// Dónde vive cada cartilla. Una cartilla es un paquete de datos en public/cartillas/<id>/; el
// código nunca escribe la ruta a mano: la pide aquí por el id de la cartilla.

/** La cartilla que se usa cuando todavía no se sabe la del grupo (la primera de la plataforma). */
export const CARTILLA_PREDETERMINADA = 'ingles-3';

/** El mismo formato que exige la base (cartillas.id). */
const ID_VALIDO = /^[a-z0-9-]{1,40}$/;

export const esIdCartilla = (id: unknown): id is string => typeof id === 'string' && ID_VALIDO.test(id);

/** Ruta (con barra final) del paquete de una cartilla. Un id raro cae en la predeterminada. */
export function rutaCartilla(id: string = CARTILLA_PREDETERMINADA): string {
  return `${import.meta.env.BASE_URL}cartillas/${esIdCartilla(id) ? id : CARTILLA_PREDETERMINADA}/`;
}
