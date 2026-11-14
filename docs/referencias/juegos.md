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

Contexto: Manuel ya decidió el plan por semanas (la docente pone el tema, la misión cambia cada
día) y una sesión diaria de unos 15 minutos. Esta sección no reabre eso: propone cómo se siente
"volver" dentro del juego.

### 2.1 Hallazgos

| Fuente | Comprobado |
| --- | --- |
| Teach Your Monster (blog oficial) | Dice que nunca usan *dark patterns* como las rachas para animar a jugar, y critica los juegos que dan premio de juego por responder preguntas educativas. [teachyourmonster.org](https://www.teachyourmonster.org/?p=3079) |
| Animal Crossing (charla de Eguchi, GDC) | Los ganchos diarios son pequeños y del mundo: cartas en el buzón, fósiles, lo que hay en la tienda. "None of the things in the game are compulsory." El reloj real es la base del diseño. [Game Developer](https://www.gamedeveloper.com/design/gdc-is-that-a-franchise-in-your-pocket-an-i-animal-crossing-wild-world-i-case-study), [Game Developer, cambios en tiempo real](https://gamedeveloper.com/design/why-nintendo-s-new-i-animal-crossing-i-features-allow-instant-change-in-the-real-time-game) |
| Estudio de 859 diseños de rachas (Mobbin) | Las rachas casi siempre cuentan días y se apoyan en la aversión a la pérdida. Perder una puede producir el efecto "ya qué" (Polivy y Herman). En el estudio de Lally (UCL), faltar una vez "did not materially affect the habit formation process". Alternativas: bajar la exigencia diaria (+40 % mantuvo 7 días en una prueba de Duolingo), **reparar en vez de reiniciar** (Finch), pausas largas (Alma, 14 días). [Mobbin](https://mobbin.com/blog/streaks-are-about-losing-a-study-of-859-streak-designs) |
| Críticas a la racha de Duolingo con niños | Guías para padres reportan ansiedad por el "todo o nada" de la racha y notificaciones culpabilizadoras. Son fuentes de divulgación, no estudios. [ScreenWise](https://screenwiseapp.com/guides/duolingo-streaks-and-anxiety-in-kids), [análisis de diseño de conducta](https://jtbdux-protocol.pages.dev/adoption-and-behavior/behavior-design-patterns/how-duolingo-engineered-50-million-daily-users-and-the-backlash-that-came-with-it) |
| Radesky et al. 2022 (JAMA Network Open) | Ejemplo clasificado como presión parasocial: "Come back tomorrow to get THIS dragon! Then visit Dragolandia each day for other valuable rewards!". El 24,8 % de las apps usaba personajes para alargar el juego. [PMC9206186](https://pmc.ncbi.nlm.nih.gov/articles/PMC9206186/) |
| Khan Academy Kids (guía docente) | Cita un estudio de UMass Amherst con preescolares que usaron la app "around 20 minutes a day". El docente asigna práctica según su secuencia. [Guía de implementación](https://sites.google.com/khanacademy.org/khanacademykids/implementation-guidance) |

**Interpretación.** Lo que hace volver en los juegos amables es la **curiosidad por lo que cambió**
(algo nuevo en el mundo) y **la relación con los personajes**, no el miedo a perder. Para niños
de 5 a 9 años que dependen de que un adulto les preste el celular, una racha castiga al niño por
algo que no controla (regla 6, y Ryan y Deci: autonomía).

### 2.2 Propuestas

**D1. Algo nuevo cada día en el bosque, que espera — costo media.** Cada día del plan semanal
aparece una novedad atada al tema: un vecino con un encargo nuevo, luciérnagas con las palabras
del día, una carta de Pixie en el buzón de la aldea con una adivinanza en audio. **Nada caduca**:
si el niño no entra el martes, la novedad del martes lo sigue esperando el miércoles. Respalda:
Ausubel (el tema de clase es el ancla), Ryan y Deci (autonomía). Riesgo: si las novedades se
acumulan y el niño encuentra seis cosas pendientes, se agobia; mostrar como máximo dos.

**D2. Los cinco farolitos de la semana — costo baja.** En la plaza, un poste con cinco farolitos
(lunes a viernes). Cada día que se juega se enciende uno; el orden no importa y uno apagado
**nunca se rompe ni se reinicia**: se puede encender después, dentro de la misma semana. El lunes
siguiente empieza un poste nuevo; el anterior queda en el álbum como recuerdo. Nunca se muestra
"días seguidos". Respalda: Kapp (meta visible y alcanzable), Ryan y Deci (competencia sin
amenaza). Riesgo frente a la regla 6: si alguien añade luego un contador de días seguidos, se
convierte en racha. Dejarlo escrito como prohibido.

**D3. Una sesión con principio y final — costo media.** 15 minutos en cuatro tiempos:
1. **Llegada (1 min):** Lumi saluda y repasa 2 o 3 palabras que tocan hoy (ver tema 3).
2. **Misión del día (5 a 6 min):** la que puso la docente; brilla en el mini mapa y Lumi lleva si
   está lejos (M7).
3. **Libre (5 min):** explorar, encargos, álbum, otra misión si quiere.
4. **Cierre (1 min):** las luciérnagas se van a dormir, Lumi bosteza y deja una pista de mañana
   ("Mañana Nova trae algo del Valle…"). Un final natural, lo contrario de alargar el juego. El
   niño puede seguir si quiere; no hay bloqueo ni castigo.
Respalda: Bruner (la narración da estructura y deja un hilo abierto), Ryan y Deci. Riesgo: el
"te dejo una pista de mañana" puede volverse presión si va atado a un premio; debe ser historia,
nunca "vuelve mañana o pierdes X".

**D4. Sin notificaciones al niño — costo nula.** El recordatorio lo da la docente o la familia,
no el celular. Si algún día se notifica, solo al adulto y solo sobre lo aprendido.

---

## 3. Repetición espaciada y repaso dentro del juego

### 3.1 Hallazgos

| Fuente | Comprobado |
| --- | --- |
| Duolingo (blog) | Al final de una lección se repasan los errores. La práctica personalizada usa repetición espaciada y precisión para elegir qué palabras volver a ver. Principio: "review newer information more frequently, and older information less frequently". No describe Duolingo ABC. [blog.duolingo.com](https://blog.duolingo.com/spaced-repetition-for-learning) |
| Duolingo ABC (Common Sense Media) | Ruta fija; "new games review what's already been introduced". No pude comprobar que use un algoritmo de intervalos. [Common Sense Media](https://www.commonsensemedia.org/app-reviews/duolingo-abc-learn-to-read) |
| Khan Academy Kids | La ruta ajusta la dificultad según las respuestas; la mayoría de habilidades tiene 4 lecciones de práctica, que permiten "additional practice, spiral review, and remediation as-needed". El docente ve datos y asigna práctica. [Guía de implementación](https://sites.google.com/khanacademy.org/khanacademykids/implementation-guidance) |
| Teach Your Monster | "Repetition is crucial" y da espacio para equivocarse y oír los sonidos varias veces. Common Sense: hay repeticiones, pero con mucho en medio no molestan. [teachyourmonster.org](https://www.teachyourmonster.org/?p=3079), [Common Sense Media](https://www.commonsensemedia.org/app-reviews/teach-your-monster-to-read) |
| Investigación con niños | Quinto grado: palabras repasadas con una semana de separación se recordaron más cinco semanas después que las repasadas en bloque (Sobel, Cepeda y Kapler). En preescolar, practicar recordando ayuda cuando es **recuerdo con pista** y hay **retroalimentación inmediata**; con recuerdo libre el efecto desaparece (Kliegl et al. 2018). Resultados mixtos en primaria (Goossens et al. 2016). [Resumen Structural Learning](https://www.structural-learning.com/research-briefings/space-it-out), [Kliegl et al. 2018](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2018.01446/full), [Leonard et al. 2024](https://pubs.asha.org/doi/10.1044/2024_JSLHR-23-00528), [Learning Scientists sobre límites en aula](https://www.learningscientists.org/blog/2017/7/20-1) |

**Interpretación.** Para 5 a 9 años el repaso funciona mejor como **reconocer con pista**
(oír y tocar entre pocas opciones) que como "dime la palabra" en frío, y el repaso no debe
sentirse como examen: debe aparecer como parte del mundo.

### 3.2 Propuestas

**R1. La palabra que costó vuelve en la misma misión — costo baja.** Hoy `EscuchaToca` anota la
palabra que costó (`costaron`) y la repite. Proponer: al terminar la ronda, esa palabra vuelve
**una vez más** antes del cierre, con dos opciones en lugar de tres (más fácil). Así el niño
termina con un acierto en la palabra difícil (como el repaso de errores de Duolingo). Respalda:
Vygotsky (se baja la ayuda a su zona), Krashen (cierra con éxito, filtro afectivo bajo).

**R2. El repaso vive en el mundo — costo media.** Las palabras de `repasar` aparecen al día
siguiente como luciérnagas que dicen su palabra o como un encargo de un vecino ("Tito volvió a
perder *red*"). El niño la encuentra entre tres: recuerdo con pista. Respalda: Bruner (de lo
icónico a lo simbólico), Ausubel (se ancla en el personaje que ya conoce). Riesgo: ninguno si no
se muestra como "palabras que fallaste" al niño (regla 6); el adulto sí lo ve en el resumen.

**R3. Calendario simple por palabra, contado en sesiones — costo media.** Cada palabra tiene un
estado: nueva → la reconoce → la dice → firme. Al acertarla vuelve a las 1, 3, 7 y 15 sesiones
jugadas (no días de calendario, porque el niño falta días sin culpa). Al fallar, vuelve a la
siguiente sesión. La llegada de cada sesión (D3) toma 2 o 3 de las que tocan. Cabe en
`progreso.ts`. Respalda: Ausubel (aprendizaje significativo que se consolida), Kapp.

**R4. El viernes mezcla — costo baja.** La prueba o repaso del viernes del plan semanal incluye
palabras de esta semana y de dos semanas atrás. El docente ve qué palabras le costaron al grupo
(R5).

**R5. El docente ve lo que costó al grupo — costo media (necesita Supabase).** Como Khan Kids:
"Estas 5 palabras le costaron a más de la mitad del grupo" con botón para proyectar un juego de
aula con ellas. Respalda: Vygotsky (el docente es el otro más capaz). Riesgo regla 7: es dato de
progreso, permitido; no mostrar nombres de niños en la vista proyectada.

---

## 4. Feedback al error y práctica de voz

### 4.1 Hallazgos

| Fuente | Comprobado |
| --- | --- |
| Teach Your Monster | Señales visuales y sonoras que "make them feel good about getting the right answer, while not making them feel bad about getting a wrong answer". [teachyourmonster.org](https://www.teachyourmonster.org/?p=3079) |
| Endless Alphabet / Wordplay | Sin respuestas "malas", sin temporizador, sin puntajes; la letra mal puesta se devuelve suave a su sitio para otro intento. Las letras son monstruos que dicen su sonido al arrastrarlas. [ScreenWise](https://screenwiseapp.com/media/endless-alphabet-app), [Common Sense Media](https://www.commonsensemedia.org/app-reviews/endless-alphabet) |
| Lingokids | La única actividad de voz documentada es un bebé robot que **repite lo que dice el niño**; no encontré que califique la pronunciación. [Ayuda Lingokids](https://help.lingokids.com/hc/en-us/articles/11465888382865-In-App-Audio-Gallery-and-Camera-Features) |
| Reconocimiento de voz infantil | El error de reconocimiento sube cuanto más pequeño es el niño: se reportan 15 a 21 % de palabras mal reconocidas en niños de 6 a 10 años y hasta 35 % en 4 a 6 años; también para oyentes humanos. En aula, el ruido empeora todo. [The Learning Agency](https://the-learning-agency.com/the-cutting-ed/article/how-speech-recognition-systems-struggle-with-childrens-voices/), [CogSci 2020](https://cognitivesciencesociety.org/cogsci20/papers/0340/index.html), [Universidad de Colorado](https://www.colorado.edu/research/ai-institute/media/53) |
| Mueller y Dweck 1998 | Elogiar la inteligencia ("eres listo") llevó a elegir tareas fáciles y a rendir peor tras un fallo; elogiar el esfuerzo, lo contrario. Muestra de quinto grado. [PDF](https://www.columbia.edu/cu/psychology/courses/3615/Readings/Mueller_Dweck.pdf) |
| Deci, Koestner y Ryan 1999 | Metaanálisis de 128 estudios: las recompensas tangibles esperadas bajan la motivación intrínseca, más en niños; la retroalimentación verbal positiva la sube. [PDF](https://home.ubalt.edu/ntygmitc/642/Articles%20syllabus/Deci%20Koestner%20Ryan%20meta%20IM%20psy%20bull%2099.pdf) |
| Kliegl et al. 2018 | La retroalimentación inmediata es ingrediente necesario para que practicar recordando sirva en preescolar. [Frontiers](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2018.01446/full) |

**Interpretación.** El reconocedor de voz se equivoca con niños pequeños una de cada tres a cinco
veces. Por eso nunca puede ser juez: "Di y brilla" ya hace bien en premiar el intento. Lo que
falta es que el error **enseñe algo** en los juegos de escucha.

### 4.2 Propuestas

**V1. El error dice su propio nombre — costo baja.** En `EscuchaToca`, hoy la carta equivocada se
apaga, suena "intenta" y se repite la palabra objetivo. Propuesta: la carta tocada **dice su
palabra** ("*blue*") con un giro suave, y después Cosmo repite la que se buscaba. El error se
vuelve entrada comprensible: el niño aprendió qué es *blue*. Respalda: Krashen (entrada
comprensible), Kapp (retroalimentación informativa, no solo correctiva).

**V2. Ayuda en escalera — costo baja.** Primer intento fallido: se repite la palabra. Segundo:
la carta correcta respira con un brillo leve. Tercero: Lumi vuela a la carta. Nunca se pierde
nada ni se cuenta en pantalla. Respalda: Vygotsky (andamiaje graduado que se retira).

**V3. Guion de elogios — costo baja.** Lumi y Cosmo elogian **lo que el niño hizo**, nunca lo
que el niño "es": "¡Lo dijiste con tu voz!", "Escuchaste con atención", "Lo intentaste otra vez
y lo lograste". Prohibido: "¡Eres muy inteligente!", "¡Perfecto!" tras cada toque (pierde valor).
Respalda: Ryan y Deci (retroalimentación que informa competencia), Mueller y Dweck como apoyo.
Entregar al pedagogo como lista para `construir_bosque.py`.

**V4. "Eco de Lumi" para quien aún no escribe — costo media, riesgo alto.** Como el bebé robot
de Lingokids: el niño habla y Lumi le devuelve su propia voz con tono de estrella (al instante,
en memoria, sin guardar ni enviar), y luego la voz modelo. Compara su voz con el modelo sin que
nadie lo califique. **Riesgo frente a la regla 7:** aunque no se guarde, es manejar la grabación
de un menor; necesita visto bueno del auditor y de Manuel, y del consentimiento de las familias.
Solo proponer si el reconocimiento por servidor (ya señalado en `CONTINUAR.md`) se descarta.

**V5. La voz siempre es privada — costo nula.** Nada de lo que el niño dice se muestra en el
proyector ni se compara. El docente da las estrellas de "pronunciar" desde su modo, por conducta
observada en clase; la app solo puede sugerir "lo intentó 12 veces esta semana".

---

## 5. Personajes que acompañan y animaciones de bajo costo

### 5.1 Hallazgos

| Fuente | Comprobado |
| --- | --- |
| Duolingo con Rive | Cada personaje tiene animaciones de reposo (asentir, parpadear, cejas), un estado final según acierto o error, y más de 20 formas de boca sincronizadas con el audio. Todo va en un archivo de Rive con máquina de estados: "much less than sending down a little movie". [blog.duolingo.com](https://blog.duolingo.com/world-character-visemes) |
| Rive | No hay sincronía labial automática desde texto; los estados de boca se activan desde el código con una entrada numérica. [Foro Rive](https://rive.app/community/forums/support/fsnLLkXUaA62/lip-sync/ftyrdnSzhsd7) |
| Principios de animación en juegos | La anticipación larga en una acción del jugador se siente como retraso; basta un cuadro breve de "aplastar" en el momento del toque. Las acciones secundarias (orejas, cola, reposo) dan mucha vida con poco costo. [Game Developer](https://www.gamedeveloper.com/production/the-12-principles-of-animation-in-video-games) |
| Khan Academy Kids | Kodi saluda, guía y enseña a tocar y arrastrar; así niños desde 2 años usan la app solos. [Sitio docente Khan Kids](https://sites.google.com/khanacademy.org/khanacademykids/getting-students-into-the-app/three-ways-to-play) |
| Radesky et al. 2022 | Personajes usados para culpar o presionar: "Do you want to give up?", "You're making me want to go to sleep" (Talking Tom 2). [PMC9206186](https://pmc.ncbi.nlm.nih.gov/articles/PMC9206186/) |

### 5.2 Propuestas

**A1. Seis estados por personaje, no más — costo media (Rive).** Para Tavi, Mika, Bruno, Lumi y
Cosmo: **reposo** (respira; parpadeo cada 3 a 6 s al azar), **habla** (3 bocas: cerrada, media,
abierta, movidas por el volumen del audio; no 20 visemas), **escucha** (inclina la cabeza mientras
el micrófono está abierto), **celebra**, **ánimo** (gesto de "otra vez" tras un error, nunca triste),
**duerme** (cierre de sesión, D3). Respalda: Kapp (el personaje es la retroalimentación). Riesgo
regla 4: un archivo Rive por personaje suele pesar decenas de KB y el motor de Rive para web
varios cientos; medir y cargarlo después de la primera pantalla.

**A2. Mientras llega Rive, emoción con CSS — costo baja.** Sobre las imágenes actuales:
respirar (escala 1 a 1,03 en 2,5 s), aplastar 80 ms al tocar, salto con estiramiento al celebrar,
inclinar al escuchar. **Lumi es una estrella: su emoción es su luz** (brilla más al acertar,
titila curiosa al esperar, se acerca al niño tras un error). Es el recurso más barato y más
coherente con "la luz vuelve a Englishland". Con `prefers-reduced-motion`, solo cambia el brillo.

**A3. Reposo que guía — costo baja.** Si el niño no toca nada en 6 s, su personaje mira hacia lo
más cercano que tiene algo (luciérnaga, misión del día). A los 12 s, Lumi da una vuelta en esa
dirección. Acción secundaria que sirve de pista sin texto (regla 2). Respalda: Vygotsky.

**A4. Papeles claros — costo nula.** Lumi = el andamio (pistas, normaliza el error, retira la ayuda
cuando el niño ya puede). Cosmo = narrador del bosque. Pixie = el misterio de la semana. Vecinos =
piden palabras. Un niño de 5 años entiende mejor un mundo donde cada uno hace una cosa.

**A5. Lista de frases prohibidas para personajes — costo nula.** Ningún personaje dice que se
pone triste si el niño se va, ni pide volver, ni apura con tiempo, ni compara al niño con otros.
Despedida permitida: "Cuando vuelvas, aquí estaré" (sin premio atado). Va al pedagogo y al revisor.

---

## 6. Lo que NO hacer

| No hacer | Por qué (fuente) | Regla de `CLAUDE.md` |
| --- | --- | --- |
| Racha de días con reinicio, contador de "días seguidos" | Se apoya en la aversión a la pérdida y castiga al niño por algo que depende del adulto. TYM lo llama *dark pattern* y no lo usa. ([Mobbin](https://mobbin.com/blog/streaks-are-about-losing-a-study-of-859-streak-designs), [TYM](https://www.teachyourmonster.org/?p=3079)) | 6 |
| Personajes que culpan, presionan o se ponen tristes si el niño se va | Presión parasocial en 24,8 % de las apps estudiadas. ([Radesky 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9206186/)) | 6 |
| Temporizadores falsos, "¡rápido!", "solo hoy" | Presión de tiempo en 17,3 % de las apps. (Radesky 2022) | 6 |
| Cofres, ruletas, sobres sorpresa o premios al azar | Mecánica parecida al juego de azar; asociada a problemas de juego en estudios correlacionales. ([GambleAware 2021](https://www.gambleaware.org/media/inochmdq/gaming_and_gambling_report_final.pdf), [Zendle](https://committees.parliament.uk/writtenevidence/83/html/)) | 5 (las estrellas reconocen conductas, no suerte) |
| Anuncios, premios por ver anuncios, botones de compra | 95 % de 135 apps infantiles tenía publicidad; "host selling" con personajes. ([Meyer et al. 2019](https://www.michiganmedicine.org/health-lab/advertising-kids-apps-more-prevalent-parents-may-realize), Radesky 2022) | 7 y 8 |
| Tablas de posiciones, ranking del grupo en el proyector | Insignias, tablas y puntos son los elementos más reportados con efectos negativos; los de abajo se desaniman. ([Mapeo sistemático](https://arxiv.org/abs/2305.08346), [NSF](https://par.nsf.gov/servlets/purl/10510520)) | 6 |
| Premio tangible por cada acierto | Las recompensas tangibles esperadas bajan la motivación intrínseca, más en niños. (Deci, Koestner y Ryan 1999). La decisión de Manuel (estrellas al completar la misión, no por acierto) va en la buena dirección. | 5 |
| Encadenar la siguiente actividad sola, "una más" sin pausa | "Gameplay prolonging" y restricción de navegación: 45,9 % de las apps. (Radesky 2022) | 6 |
| Botón de cerrar pequeño o escondido | 46 % de apps dificultaba salir de un anuncio. (Radesky 2022) | 3 (48 px) |
| Juez automático de pronunciación | Reconocimiento de voz infantil con errores de 15 a 35 %. ([The Learning Agency](https://the-learning-agency.com/the-cutting-ed/article/how-speech-recognition-systems-struggle-with-childrens-voices/)) | 6 |

**En lugar de la tabla de posiciones: una meta del grupo.** En el modo docente, "la luz del grupo":
un faro de la aldea que se enciende con las misiones de **todos** los niños, sin decir quién aportó
cuánto. Respalda: Ryan y Deci (relación), Vygotsky (aprendizaje social). Costo media, necesita
Supabase. Riesgo: que el docente lo use para señalar al que no aportó; el faro nunca muestra
nombres.

---

## 7. Top 10 de propuestas priorizadas

Orden: primero lo que desbloquea trabajo en curso o evita frustración; después lo que mejora el
aprendizaje con poco costo; al final lo que depende de Supabase o de Rive.

| # | Propuesta | Tema | Autor que la respalda | Riesgo frente a `CLAUDE.md` | Costo |
| --- | --- | --- | --- | --- | --- |
| 1 | **Buscar camino (A*) y resolver toques en agua u obstáculos** (M1, M2): llega siempre que haya camino; si no, gesto amable y Lumi señala el paso | 1 | Ryan y Deci, Vygotsky | Ninguno; cuidar gama baja calculando solo al tocar | Media |
| 2 | **El error dice su propio nombre** y ayuda en escalera (V1, V2) | 4 | Krashen, Vygotsky, Kapp | Ninguno | Baja |
| 3 | **La palabra que costó vuelve al final de la misión** con dos opciones (R1) | 3 | Vygotsky, Krashen | Ninguno | Baja |
| 4 | **Indicador honesto y cámara que mira adelante** (M3, M5): aro en el destino real, puntitos en viajes largos, norte fijo | 1 | Bruner, Kapp | Ninguno | Baja |
| 5 | **Sesión de 15 min con llegada, misión del día, libre y cierre** con el bosque que se duerme (D3) | 2 | Bruner, Ryan y Deci | Que el gancho de mañana se ate a un premio (prohibido) | Media |
| 6 | **Cinco farolitos de la semana** sin reinicio ni días seguidos (D2) y novedades que esperan (D1) | 2 | Kapp, Ryan y Deci, Ausubel | Que alguien lo convierta en racha | Baja a media |
| 7 | **Emoción con CSS y la luz de Lumi** (A2) + reposo que guía (A3), mientras llega Rive | 5 | Kapp, Vygotsky | `prefers-reduced-motion` | Baja |
| 8 | **Guion de elogios y lista de frases prohibidas** para todos los personajes (V3, A5) | 4, 5 | Ryan y Deci | Ninguno | Baja |
| 9 | **Repaso en el mundo con calendario por sesiones** (R2, R3) y viaje con Lumi a lugares encendidos (M7) | 3, 1 | Ausubel, Bruner, Ryan y Deci | Que el repaso se sienta examen; no mostrar "fallaste" | Media |
| 10 | **Docente: palabras que costaron al grupo + faro del grupo en vez de ranking** (R5, sección 6) | 3, 6 | Vygotsky, Ryan y Deci | Regla 7: sin nombres en lo proyectado | Media (Supabase) |

Fuera del top por riesgo: el "Eco de Lumi" (V4) toca la regla 7 y queda para decisión del
auditor y de Manuel.

**Decisiones que este documento deja a Manuel y al pedagogo:**
1. ¿El viaje rápido con Lumi solo a lugares encendidos, o a cualquier claro? (recomiendo encendidos).
2. ¿Los farolitos de la semana dan algo (una estela, un accesorio) o solo se ven? Recomiendo que
   solo se vean: si dan premio, se acercan a una racha.
3. ¿Se acepta el "Eco de Lumi" con la voz del niño en memoria, sin guardar?
