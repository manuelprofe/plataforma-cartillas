// Marca de "en este aparato se proyectó hace poco" (esqueleto §2.3). La escribe el modo
// proyectar y la lee la cortina de privacidad del docente. Solo guarda una hora, nada de nadie.
// Es la única capa que toca este dato en el almacenamiento.

const CLAVE = 'pc_proyectando';
/** Minutos durante los que una pantalla con apodos sale detrás de la cortina (pregunta 4). */
export const MINUTOS_CORTINA = 90;

export function marcarProyectando() {
  try {
    localStorage.setItem(CLAVE, String(Date.now()));
  } catch {
    // Sin almacenamiento la cortina no sabrá de la proyección; el telón funciona igual.
  }
}

/** Minutos desde la última proyección en este aparato, o null si no hubo o ya pasó la cortina. */
export function minutosDesdeProyeccion(): number | null {
  try {
    const hora = Number(localStorage.getItem(CLAVE));
    if (!hora) return null;
    const minutos = Math.floor((Date.now() - hora) / 60000);
    return minutos >= 0 && minutos < MINUTOS_CORTINA ? minutos : null;
  } catch {
    return null;
  }
}

/** "Ya terminé la clase": quita la cortina hasta la próxima proyección. */
export function terminarClase() {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // Nada que hacer.
  }
}
