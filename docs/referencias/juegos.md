# Referencias de juegos para Englishland

Investigador de juegos. Fecha: 14 de noviembre de 2026. Parte de `CLAUDE.md`, `CONTINUAR.md`,
`docs/pedagogia/ronda-1.md`, `docs/diseno/ronda-1.md` y del código actual de `src/Mundo.tsx`.

**Cómo leer este documento.** En cada tema separo tres cosas:

- **Comprobado:** lo que dice una fuente que se puede abrir (enlace al lado).
- **Interpretación:** lo que deduzco yo; no está medido.
- **Propuesta:** cómo se vería en Englishland, con su autor del marco, el riesgo frente a
  `CLAUDE.md` y el costo (baja, media, alta).

Advertencia general: varias fuentes son wikis, reseñas o foros, no estudios. Ninguna propuesta
de este documento está probada con niños de Los Patios; el piloto es el que decide.

Juegos estudiados: Teach Your Monster to Read (TYMTR), Duolingo ABC, Khan Academy Kids,
Lingokids, Endless Alphabet, Pok Pok, Animal Crossing (New Horizons y Pocket Camp),
A Short Hike, Alba: A Wildlife Adventure, Stardew Valley (versión móvil) y Monument Valley
(como referencia de tocar-para-ir).

---

## 1. Movimiento por el mundo (tocar para ir)

> Sección escrita primero para el desarrollador de motor. Lo urgente está en 1.3 y 1.4.

### 1.1 Qué hace hoy el motor (leído en `src/Mundo.tsx`)

- El guía va **en línea recta** hacia el punto tocado (`m.objetivo`), a 430 px/s, y frena
  suave al llegar (`0.35 + dist / 160`).
- Si choca con agua, árbol u objeto, **se desliza por el borde**; si queda quieto 0,6 s,
  **suelta el destino sin decir nada** (`atascado > 0.6`).
- Si el dedo se queda apoyado, el guía **sigue al dedo** en línea recta.
- Tocar una cosa (habitante, luciérnaga, misión) pone el destino al pie de la cosa y la
  interacción se dispara al llegar (`m.pendiente`).
- Ya hay onda en cada toque, aro dorado en el destino, inclinación, trote, chispas, sombra y
  cámara con resorte. El mini mapa solo se mira; no lleva a ningún lado.
- La rejilla `mundo.agua` (celdas de `mundo.celda` px) ya existe: es la base natural para
  buscar caminos.

**Interpretación del problema.** Para un niño de 5 a 7 años, "toqué allá y el muñeco se quedó
pegado a un árbol y no hizo nada" se lee como "no me hizo caso" o "lo hice mal". Es la peor
señal posible para la sensación de control (Ryan y Deci: competencia) y para el error que no
castiga (regla 6). Con el bosque de 2800 × 2800, con río y casas, ese caso pasa seguido.

### 1.2 Hallazgos

| Juego | Comprobado | Fuente |
| --- | --- | --- |
| Stardew Valley (móvil) | "Tap anywhere on screen and the farmer will walk to where you tapped". Si el camino está bloqueado, la casilla se marca en rojo. Mantener el dedo hace que el personaje lo siga en línea recta, sin rodear obstáculos ("very literal"). Tocar un vecino o animal lleva hasta él y abre la interacción al llegar. Hay modos alternativos con joystick para tareas de precisión. | [Stardew Valley Wiki, Mobile Controls](https://stardewvalleywiki.com/Mobile_Controls) |
| Stardew Valley (foros) | Queja recurrente: el tocar-para-ir manda al personaje detrás de un edificio en vez de entrar. Mascotas y animales que se cruzan desvían o detienen al personaje. | [Foro oficial, "tap to move can send the player behind buildings"](https://forums.stardewvalley.net/threads/tap-to-move-can-send-the-player-behind-buildings-instead-of-entering.55558/), [Mobile Controls](https://stardewvalleywiki.com/Mobile_Controls) |
| Animal Crossing: Pocket Camp | "A player can move around the screen by either tapping a destination or dragging a path for the character to follow." Se interactúa con objetos y vecinos tocándolos. El mundo está partido en zonas y se viaja entre ellas desde una pantalla de mapa (viaje rápido por selección). | [Pocket Camp Wiki](https://animalcrossingpocketcamp.wiki.gg/wiki/How_to_Play_Guide_for_Animal_Crossing:_Pocket_Camp), [Gamezebo](https://www.gamezebo.com/2017/11/23/animal-crossing-pocket-camp-review-home/) |
| Animal Crossing: New Horizons | En la isla propia se camina siempre; el único "viaje" es el aeropuerto, que lleva a otras islas. | [Nookipedia / Animal Crossing Wiki, Wilbur y el aeropuerto](https://animalcrossing.fandom.com/wiki/Wilbur) |
| Monument Valley | Desde el primer prototipo se movía a Ida tocando el camino. Al tocar aparece un punto que marca adónde irá; el toque suena y vibra. Lo que "parece camino" es caminable. | [Creative Bloq, The making of Monument Valley](https://creativebloq.com/computer-arts/making-monument-valley-71412213), [MacStories](https://www.macstories.net/reviews/monument-valley-review/), [Critical Play (Medium)](https://medium.com/game-design-fundamentals/critical-play-monument-valley-719a45181592) |
| Tutorial tipo Monument Valley | Sin un icono en el punto tocado "users have no indication of exactly where they're clicking". El camino se busca por anchura (BFS) y el personaje gira hacia donde va. | [Kodeco, How to Make a Game Like Monument Valley](https://kodeco.com/13582558-how-to-make-a-game-like-monument-valley?page=4) |
| Alba: A Wildlife Adventure | En móvil no es tocar-para-ir: se arrastra en la parte baja para caminar y en la alta para girar la cámara. Una reseña lo llama fácil "for any age"; otra dice que se controla "a bit awkwardly". | [The Casual App Gamer](https://thecasualappgamer.com/alba-a-wildlife-adventure-review/amp), [Engadget](https://www.engadget.com/alba-a-wildlife-adventure-steam-apple-arcade-ustwo-review-152045112.html) |
| A Short Hike | Isla pequeña; senderos marcados que se pueden ignorar para ir por donde uno quiera. (No encontré detalle público de su cámara ni de su mapa más allá de la charla de GDC.) | [80.lv, GDC postmortem](https://80.lv/articles/gdc-a-short-hike-postmortem), [GDC Vault](https://gdcvault.com/play/1026613/Independent-Games-Summit-Crafting-A) |
| Teach Your Monster to Read | Common Sense Media: "Navigation is sometimes a bit awkward and requires good fine motor skills". En tableta es más fácil que en computador. El soporte oficial tiene una entrada para monstruos que no se pueden mover tras la introducción. | [Common Sense Media](https://www.commonsensemedia.org/app-reviews/teach-your-monster-to-read), [TYM soporte](https://teachyourmonster.org/support) |
| Patrón técnico general | Ante un toque en sitio no caminable, lo habitual es llevar al punto caminable más cercano y alcanzable; lo que falla es cuando el toque cae en una zona sin acceso y el personaje no hace nada. Elegir el más cercano por costo de camino, no en línea recta. | [Devlog "Fixing invalid click locations"](https://goodfaithcompany.itch.io/return-to-divinity/devlog/870202/devlog-fixing-invalid-click-locations-in-pathfinding-keegen-love), [Foro A* Pathfinding Project](https://forum.arongranberg.com/t/pathfinding-locked-to-a-grid-nearest-neighbor-to-blocked-tile/13919) |
| Guía de controles táctiles | "A tap should never feel like it did nothing, even if the move is illegal": el jugador debe ver por qué no se pudo. El toque debe tolerar un pequeño temblor del dedo. | [Cursa, Touch controls](https://cursa.app/en/page/touch-controls-for-mobile-games-input-patterns-and-feedback), [Game UX best practices](https://poe-app-platform-docs.pages.dev/skills/app-creator/references/game-ux-best-practices) |
| Niños y precisión táctil | En pantalla táctil, los toques de niños quedaron fuera del objetivo 46 % de las veces frente a 32 % de los adultos. Con ratón, los niños de 4 y 5 años necesitan más ayuda cerca del objetivo. | [Brown y Anthony, CHI 2012](https://lisa-anthony.com/wp-content/uploads/2012/03/brown-and-anthony-chi2012eist.pdf), [Hourcade et al. 2004](https://www.doi.org/10.1145/1035575.1035577) |
| Orientación espacial infantil | La navegación egocéntrica (ruta, "giro aquí") está a los 5 años; la alocéntrica (tipo mapa) se desarrolla entre los 5 y los 8. La memoria de trabajo visoespacial se relaciona con la navegación. Las pistas direccionales ayudaron más que las solo posicionales. | [Van Hoogmoed et al. 2022, Brain Sciences](https://pmc.ncbi.nlm.nih.gov/articles/PMC9221540/) |
| Orientación espacial infantil | Los más pequeños se apoyan en hitos cercanos a la ruta; los mayores usan también hitos lejanos. Niños de 5 años pudieron usar hitos en un mapa. El entrenamiento de navegación mejora el desempeño. | [Bold Science](https://boldscience.org/?p=26641), [Frontiers in Neuroscience 2017](https://www.frontiersin.org/articles/10.3389/fnins.2017.00574/full) |

**Lo que no pude comprobar.** No encontré descripción verificable del mapa de TYMTR ni de cómo se
mueve el monstruo entre lugares, ni del viaje rápido de A Short Hike. Lo que digo de ellos se
limita a lo citado.

### 1.3 Propuestas para el motor (en orden de urgencia)

#### M1. Buscar camino en la rejilla, no ir en línea recta — costo media

- Al tocar, calcular un camino A* sobre la rejilla `mundo.agua` (8 vecinos), con los
  `choques` (árboles con tronco, casas, pozo) estampados como celdas bloqueadas al cargar el
  mundo. Se calcula una vez por toque, no por cuadro.
- Suavizar el camino: quitar puntos intermedios cuando hay línea de vista entre dos puntos
  (recorrido "de cuerda"). Así el guía no camina en zigzag de casilla.
- El guía sigue la lista de puntos con la misma velocidad y frenado de hoy.
- Si el dedo se queda apoyado (arrastre), se mantiene el comportamiento literal de hoy
  (como Stardew): seguir al dedo, deslizarse por los bordes. Arrastrar es "yo manejo";
  tocar es "llévame".
- Límite de búsqueda para gama baja: el mapa de 2800 px con celdas de, por ejemplo, 20 px son
  140 × 140 = 19 600 celdas; A* sobre eso es de pocos milisegundos. Si `mundo.celda` es más
  fina, se busca sobre una rejilla reducida.

Por qué: es la diferencia entre "me obedece" y "se atasca". Respalda: **Ryan y Deci**
(competencia y autonomía: cada decisión del niño produce el resultado que quiso) y **Kapp**
(retroalimentación inmediata y clara). Riesgo frente a `CLAUDE.md`: ninguno; ayuda a la regla 3
(fluido en gama baja) si se calcula solo al tocar.

#### M2. Qué pasa si se toca agua, un árbol o una casa — costo baja (con M1)

1. **Si el toque cae sobre una cosa con la que se puede hablar o jugar** (habitante, animal,
   luciérnaga, claro de misión, tarjeta de palabra): el destino es el punto de pie frente a ella
   y la interacción se abre al llegar. Ya funciona así; con M1 además llega rodeando.
   Agrandar el área que acepta el toque de cada cosa a un círculo de al menos 64 px de mapa
   en pantalla (los niños fallan casi la mitad de los toques, Brown y Anthony 2012).
2. **Si cae en agua u obstáculo:** buscar la celda caminable más cercana **que sea alcanzable**
   desde donde está el guía (búsqueda por anillos desde el punto tocado, radio máximo unos
   160 px de mapa). Ir ahí. El aro dorado se dibuja en ese punto, no donde cayó el dedo, para
   que el niño vea adónde va realmente.
3. **Si no hay nada alcanzable cerca** (por ejemplo, la otra orilla del río sin puente): el guía
   da dos pasitos hacia allá, se detiene en la orilla, mira hacia el punto y hace un gesto de
   "hmm"; la onda del toque sale gris claro y se deshace. **Nunca rojo, nunca sonido de error**
   (Stardew usa rojo; aquí no, por la regla 6). Si pasa tres veces seguidas en el mismo sitio,
   Lumi vuela hacia el puente o vado más cercano y deja una estela de chispas: "¡Por aquí!".
   Esto reemplaza el "soltar en silencio" de hoy (`atascado`).
4. **Nunca mostrar texto técnico** ni un aviso escrito como "no se puede caminar" (regla 8 y
   regla 2: el aviso es gesto y sonido, no letra).

Respalda: **Vygotsky** (Lumi da la ayuda justa cuando el niño no lo logra solo, y solo
entonces) y **Krashen** (filtro afectivo bajo: no hay sensación de fallo). Riesgo: si Lumi
interviene demasiado, se vuelve ruido; por eso solo al tercer intento.

#### M3. Indicador de destino y huella del camino — costo baja

- Mantener el aro dorado; que **aparezca con un pequeño rebote** donde el guía de verdad va a
  parar y **se apague al llegar** (hoy se mantiene la idea; revisar que desaparezca).
- Al elegir un destino lejano (más de una pantalla), dibujar el camino calculado como **una fila
  de puntitos de luz** que se van apagando a medida que el guía pasa. Dura solo ese viaje.
  Ayuda a construir la ruta con hitos cercanos (lo que usan los de 5 a 7 años) y deja ver que
  el guía "sabe" ir.
- Sonido corto y suave al tocar (ya hay `sonar('toque')`), distinto del de "llegué".
- Toque tolerante: si el dedo se mueve menos de 10 px y se levanta antes de 250 ms es un toque,
  no un arrastre. Ignorar el segundo dedo.

Respalda: **Kapp** (retroalimentación) y **Bruner** (representación icónica: el camino dibujado
es el puente entre moverse y entender el mapa). Riesgo: peso visual en gama baja; con 20 a 40
puntos CSS no es un problema.

#### M4. Velocidad — costo baja

- 430 px/s cruza el bosque de 2800 px en unos 6,5 s, lo cual está bien para tramos cortos.
- Para viajes largos, que el guía **acelere a un trote** (hasta 1,4 veces) después de 1 s de
  camino recto, y frene igual que hoy al llegar. Un niño de 5 años pierde el hilo si la caminata
  pasa de unos 5 a 6 s sin que ocurra nada (interpretación, no medido; medir en el piloto).
- Que nada interrumpa el viaje salvo un nuevo toque. Un nuevo toque **reemplaza** el destino al
  instante (nunca se pone en cola).

#### M5. Cámara — costo baja

- Mantener el resorte con zona libre (ya aprobado por Manuel).
- Agregar **mirada adelantada**: la cámara se corre un poco (10 a 15 % de la pantalla) hacia
  donde camina el guía, para que el niño vea lo que viene y no lo que deja atrás.
- Cuando el destino está fuera de la pantalla (toque cerca del borde o viaje desde el mini mapa),
  la cámara se adelanta al destino un instante y vuelve al guía. Ayuda a orientarse ("voy para
  allá") sin perder al personaje.
- Nunca girar la cámara: el norte siempre arriba. Los niños de 5 a 8 años todavía están
  construyendo la orientación tipo mapa; rotar la vista la rompe (Van Hoogmoed et al. 2022:
  la memoria visoespacial pesa más justo cuando hay rotación).
- Con `prefers-reduced-motion`: la cámara sigue sin resorte y sin adelantarse.

#### M6. Animación de caminar — costo media (depende de Rive)

- Hoy hay inclinación, trote, chispas y sombra. Con el personaje en piezas (Rive), los estados
  mínimos son: **quieto** (respira y parpadea), **caminar** (ciclo de 4 a 6 cuadros, velocidad
  del ciclo atada a la velocidad real para que los pies no "patinen"), **llegar** (pequeño
  rebote), **mirar** (gira la cabeza hacia lo tocado cuando no puede ir), **hmm** (para M2.3).
- Mirar hacia los lados ya funciona (`mirando`). Para vista desde arriba basta con izquierda y
  derecha más un leve cambio de postura al subir o bajar; no hacen falta cuatro direcciones
  completas para el piloto.

Ver también el tema 5 (personajes y animaciones).

#### M7. Viaje rápido con Lumi — costo media

- **Caminar sigue siendo lo normal**: recorrer el bosque construye el mapa mental, que es una
  habilidad que se está formando justo entre los 5 y los 8 años.
- **Viaje rápido solo a lugares ya encendidos** (claros con misión completada, la aldea, el
  puente). Se abre desde el mini mapa: al tocar un claro encendido aparece un botón grande con
  Lumi (≥ 64 px). Lumi recoge al guía en una burbuja de luz y vuela **por encima del mapa**
  (la cámara se aleja un poco, se ve el trayecto, se acerca al llegar). Dura 1,5 a 2 s. Nunca
  es un salto instantáneo: el niño debe ver de dónde a dónde fue.
- La misión del día (tema 2) siempre aparece en el mini mapa con un brillo y se puede alcanzar
  con Lumi si queda lejos; así la sesión de 15 minutos no se gasta caminando.
- Equivalencia: Pocket Camp viaja entre zonas por un mapa; New Horizons solo tiene viaje entre
  islas. Aquí el equivalente sería: entre territorios, el puente; dentro del territorio, Lumi.

Respalda: **Ryan y Deci** (autonomía: el niño elige caminar o volar) y **Kapp** (el ritmo de la
sesión importa). Riesgo frente a `CLAUDE.md`: el mini mapa hoy es solo para mirar; la regla 8 se
respeta si el botón es un dibujo de Lumi, sin texto técnico. Riesgo pedagógico: si se abusa del
viaje rápido el niño deja de explorar; por eso solo a sitios encendidos.

#### M8. Hitos para orientarse — costo baja

- Cada camino ya tiene un tema, un habitante y huellas con iconos. Proponer además **un hito
  grande y único a la entrada de cada camino**, visible desde la plaza (por ejemplo, el reloj
  grande junto al puente, el árbol de los colores), y que el mini mapa muestre ese mismo
  dibujo. Mismo dibujo en el mundo y en el mapa = el niño conecta las dos vistas.
- La brújula que apunta al destino ya existe; que apunte a la misión del día por defecto.

Respalda: **Ausubel** (lo nuevo se ancla en algo ya conocido: el hito) y **Bruner** (de lo
enactivo, caminar, a lo icónico, el mapa).

#### M9. Para computador y proyector — costo baja

- Mantener flechas y WASD (ya existen). Clic funciona igual que toque.
- El tamaño de las zonas tocables se mide en píxeles de pantalla, no de mapa: a escala pequeña
  del mundo, un habitante no puede quedar por debajo de 48 px tocables (regla 3).

### 1.4 Resumen para el desarrollador de motor

| Caso | Hoy | Propuesto |
| --- | --- | --- |
| Toque en suelo caminable | Línea recta; se desliza; si se atasca 0,6 s, se rinde en silencio | A* en la rejilla + suavizado; llega siempre que haya camino |
| Toque sobre cosa | Va a su pie y abre la interacción | Igual, rodeando; zona tocable ≥ 64 px en pantalla |
| Toque en agua u obstáculo | Va en recta hasta el borde y se rinde | Punto caminable alcanzable más cercano (radio ~160 px); el aro se pone ahí |
| Toque sin acceso posible | Se rinde en silencio | Dos pasos, se detiene en la orilla, mira y "hmm"; onda gris; al tercer intento Lumi señala el puente |
| Dedo apoyado y arrastrando | Sigue al dedo en recta | Igual (modo "yo manejo") |
| Indicador | Onda + aro dorado | Aro en el destino real, rebota al aparecer, se apaga al llegar; puntitos de luz en viajes largos |
| Velocidad | 430 px/s, frena al llegar | Igual; trote a 1,4× tras 1 s en viajes largos |
| Cámara | Resorte con zona libre | + mirada adelantada; se asoma al destino lejano; norte siempre arriba |
| Lejos | Caminar | Viaje con Lumi desde el mini mapa, solo a lugares encendidos |
| Nuevo toque mientras camina | Reemplaza | Igual: reemplaza al instante, sin cola |

**Por qué importa para niños de 5 a 9 años (síntesis).** Carga cognitiva: si el niño tiene que
pensar cómo rodear el río, gasta en moverse la atención que debería ir al inglés; el motor debe
resolver el "cómo" y dejar al niño el "a dónde". Sensación de control: cada toque debe producir
una respuesta visible en menos de 100 ms, aunque sea "no se puede" dicho con gestos. Orientación
espacial: entre los 5 y los 8 años pasan de rutas con hitos cercanos a mapas; los puntitos de
camino, los hitos repetidos en el mini mapa y el norte fijo acompañan ese paso en vez de
exigirlo.

---

## 2. Por qué volver cada día sin rachas que castigan

_(en preparación)_

## 3. Repetición espaciada y repaso dentro del juego

_(en preparación)_

## 4. Feedback al error y práctica de voz

_(en preparación)_

## 5. Personajes que acompañan y animaciones de bajo costo

_(en preparación)_

## 6. Lo que NO hacer

_(en preparación)_

## 7. Top 10 de propuestas priorizadas

_(en preparación)_
