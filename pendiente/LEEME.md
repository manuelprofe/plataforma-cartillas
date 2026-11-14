# Trabajo terminado pero sin integrar (14 de noviembre)

Manuel pidió detener a los agentes para no gastar más. Esto es lo que hicieron y no alcanzó a
integrarse. Todo parte de la rama en el commit `4525d3c` (el motor parte de `89e437a`).
Se aplica con `git am pendiente/<carpeta>/*.patch` y, si hay, `git apply pendiente/<carpeta>/sin-commit.diff`.

| Carpeta | Qué es | Estado de revisión |
| --- | --- | --- |
| `1-juegos-y-tres-misiones` | Plantillas Memory y Listen & Catch, carga bajo demanda, 3 misiones por camino, misión de la hora con voz, Memory del pozo, textos corregidos, lapicero, pronunciación revisada, `aceptar` | Probado por el desarrollador a 390 y 1280 px. **La revisión quedó a medias**: revisar antes de integrar |
| `2-sin-conexion` | Service worker propio, manifiesto, iconos de la app, huella por archivo | 2 revisiones; 8 de 10 hallazgos resueltos. `sin-commit.diff` tiene las correcciones de la segunda revisión **a medio hacer** (recarga solo en momento seguro, filtro que altera el HTML, proxy que recomprime imágenes, nombres con ñ, pestaña que nunca se cierra) |
| `3-motor-caminos` | El guía sigue los caminos (A*, rejilla caminable generada por el guion, aceleración, trote, aro de destino) | 1 revisión. `sin-commit.diff` tiene correcciones **a medio hacer** (dedo apoyado sobre una luciérnaga, segundo dedo, parpadeo al arrastrar, giro del "hmm", velocidad de rutas) |
| `4-suelo-nuevo` | Suelo del Bosque de calidad de estudio (`herramientas/pintar_suelo.py`, 464 KB) y ajustes al guion | Revisado visualmente por el coordinador; aprobado |

Orden sugerido para integrar: 1 → 4 → 3 → 2. Los cuatro tocan `construir_bosque.py` y
`cartilla.json`: juntar los cambios del guion y volver a correrlo una sola vez con el suelo
nuevo (PNG en Canva `MAHa545H3F0`; se regenera también con `pintar_suelo.py`).
