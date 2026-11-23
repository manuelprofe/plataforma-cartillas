---
name: hoy
description: Arranca la sesión de trabajo del día. Lee solo el plan de hoy (docs/plan/dias/AAAA-MM-DD.md) y CONTINUAR.md, y trabaja los bloques en orden. Al cerrar, borra lo terminado para que el contexto no crezca. Úsala al inicio de cada sesión diaria o cuando Manuel diga "/hoy" o "retoma el bloque".
---

# Sesión del día

Cada día es una sesión nueva. El contexto se mantiene corto: solo se lee lo de hoy.

## Al empezar

1. Fecha de hoy en Colombia: `TZ=America/Bogota date +%F`.
2. Leer `CONTINUAR.md` y `docs/plan/dias/<fecha>.md`. **No** leer el calendario completo ni los
   archivos de otros días, salvo que haga falta para un bloque.
3. Si el archivo de hoy no existe (fin de semana, festivo o ya terminado), avisar a Manuel y
   proponer el siguiente archivo pendiente de `docs/plan/dias/`.
4. Si Manuel dijo "Retoma el bloque: …", empezar por ese; si no, por el primero sin marcar.
5. Decir en una línea qué bloque se empieza y qué significa "listo". Luego trabajar, sin re-explicar
   el plan.

## Durante

- Marcar `- [x]` en el archivo del día cada paso terminado y hacer commit al cerrar cada bloque.
- Reglas de `CLAUDE.md` siempre. Todo cambio visible se prueba a 390 px.
- No publicar en Netlify sin permiso de Manuel.

## Al cerrar el día

1. Si un bloque quedó a medias, mover sus pasos pendientes al inicio del archivo del siguiente día
   hábil (sección `## Pendiente de ayer`) y decirle a Manuel que conviene mover el evento.
2. Borrar `docs/plan/dias/<fecha>.md`: lo hecho queda en git, no en el contexto.
3. Actualizar `CONTINUAR.md` solo si cambió algo que sirva para lo que viene (un archivo nuevo
   importante, un dato de trabajo, una decisión de Manuel). Quitar de ahí lo que ya no aplique.
4. Commit y push a la rama de trabajo. Resumen a Manuel en 3 a 5 líneas.
