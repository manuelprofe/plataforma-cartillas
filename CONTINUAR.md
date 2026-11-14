# Estado del proyecto y cómo continuar

Resumen para retomar el trabajo en otra conversación. Las reglas permanentes del proyecto
están en `CLAUDE.md`; este archivo es la foto del momento y se puede borrar cuando deje de
servir.

## Qué es

Plataforma web de cartillas interactivas por materia y grado, con modos estudiante, docente
y coordinador. La primera cartilla es **English Adventure Quest** (inglés, grado tercero),
basada en el trabajo de grado de Manuel Vega en la I.E. Jorge Barco Mora (Los Patios).

- **Piloto:** grado tercero, el próximo año escolar. Después preescolar y el resto de primaria.
- **Negocio:** Manuel vende la plataforma a colegios; ya tiene entrada en el Jorge Barco Mora.
- **Sitio anterior:** `manuelprofe/cartillaenglishadventure`. Se reutilizan personajes, fondos,
  narrativa y bancos de contenido; el código no.
- **Informe de revisión del sitio anterior:** https://claude.ai/artifact/Qz8tfSCTYM2HgjWvzA7r2S
- **Prototipo publicado para probar:** https://claude.ai/artifact/ABBpsdFyRhwggWZgxYYxxC

## Decisiones ya tomadas por Manuel

- Empezar de cero en este repositorio, no sobre el sitio anterior.
- Debe funcionar en celular, tableta y computador.
- Voz generada de buena calidad por ahora (no grabada por una persona).
- Tres modos: estudiante, docente, coordinador. Varios docentes y varios colegios.
- El docente tiene materiales por tema y juegos de aula (Bingo, Simon Says); el estudiante
  tiene los juegos individuales; el coordinador ve el seguimiento por grupo.
- El mundo del estudiante no debe ser lineal: movimiento libre, historia narrada con
  personajes que hablan, botón "Continuar" y menús donde el niño decide.
- **Vista desde arriba** (aprobada): el mundo se recorre en todas las direcciones, no de
  lado hacia la derecha. Se descartó la primera persona.
- **El material gráfico lo genera Claude en Canva** (aprobado): mapas, fondos y objetos.
  Los personajes se conservan y sus animaciones se harán en otra herramienta (propuesta:
  Rive), porque Canva no produce personajes animados para juego.
- La voz definitiva es lo último.
- El niño no controla a Cosmo: elige entre tres personajes (Tavi, Mika, Bruno) antes de
  empezar. Cosmo, Pixie y Lumi son personajes del bosque con los que se habla.
- Englishland tiene habitantes: una aldea en el claro central con vecinos que perdieron
  sus palabras. Referencia de juego que le gusta a Manuel: Teach Your Monster to Read.
- Seguir añadiendo capas al mapa.
- **Estrellas:** se ganan al completar una misión entera, no por acierto, y la suma de
  todas las misiones del bosque es exactamente lo que pide el puente (50). Cada misión
  trae sus estrellas en el contenido (`estrellas`): 4 las primeras, 5 las segundas y 5 la
  de la hora. Volver a jugar y mejorar da una medalla, no estrellas. Autoevaluarse sigue
  al final de la misión pero ya no suma aparte.
  **Esto contradice la regla 5 de `CLAUDE.md`** (completar 15, mejorar 15, autoevaluarse
  10): Manuel lo pidió así el 12 de noviembre; falta que decida si se actualiza la regla.
  Cuando el docente pueda dar estrellas (participar, pronunciar, colaborar), hay que
  decidir si cuentan para el puente.
- Orden de trabajo acordado: llevar el Bosque a calidad final, probarlo con niños y
  después replicar en los otros territorios.
- La historia se narra en español al principio y en inglés hacia los niveles finales.

Respuestas de Manuel del 14 de noviembre a las preguntas "como niño" y "como padre":

- **Varios juegos**, no uno solo repetido (ver punto 2).
- **Voz con micrófono, pero nunca solo con micrófono.** Si el computador o el celular no
  tiene micrófono o no funciona, el niño debe poder escribir la palabra. Hecho en
  "Di y brilla"; además hay un botón para decirla en voz alta sin micrófono (para los que
  aún no escriben, regla 2).
- **Cinemáticas en video.** Manuel usa una página que convierte un guion en video
  ("viani pro", nombre por confirmar: dijo que pasaría el enlace). Idea: escribir guiones
  cortos para la llegada a cada territorio y el cierre de cada camino, generarlos allá y
  traerlos como archivos del paquete de la cartilla. Ojo con el peso (regla 4): video corto,
  baja resolución, cargado solo cuando se va a ver y siempre con botón para saltarlo.
- **"¿Por qué volver mañana?"**: ya resuelto con el plan por semanas: la docente pone las
  clases y las misiones cambian cada día según el tema de la semana.
- **Personificar al personaje** (vestirlo, cambiarle cosas): viable si Claude lo ve viable.
  Propuesta: accesorios que se abren con estrellas, igual que las estelas.
- **Personajes con movimiento**: sigue pendiente, como estaba acordado (Rive).
- **Resumen para la familia**: al final, qué se aprendió, qué se repasó y qué tema hay que
  reforzar porque costó. Primer paso hecho: el progreso anota las palabras que costaron
  (`repasar`) y el álbum las muestra arriba con 🔁 para volver a oírlas. Falta la vista
  de resumen para el adulto.
- **Voz de los personajes**: se corrige más adelante (servicio de voz con IA o grabaciones).
- **Tiempo diario: unos 15 minutos.** Hay que estimar la duración de cada actividad para
  que la sesión del día quepa ahí.
- **Sin datos móviles** sería ideal; si es muy difícil, basta con que funcione con internet.
  Recomendación: sí se puede con una aplicación instalable que guarda la cartilla en el
  celular (service worker) y sube el progreso cuando vuelve la conexión.
- **Algo para hacer juntos en casa**: no como obligación (muchos padres trabajan); queda
  como recomendación que la docente da a las familias.

Decisiones de Manuel del 14 de noviembre (segunda tanda):

- **Tres misiones por camino** (las misiones son muy cortas): escuchar y tocar, Listen &
  Catch, y Di y brilla con palabras de las dos primeras (propuesta del pedagogo en
  `docs/pedagogia/ronda-1.md`).
- **"Marker" se cambia por "pen"; en Los Patios le dicen "lapicero".** El icono de eraser
  parece una esponja: se rehace.
- **Iconos y accesorios se diseñan en Canva.** Accesorios aprobados tal como están en
  `docs/diseno/ronda-1.md`.
- **Arte del mapa de nivel profesional**, con un equipo de diseñadores gráficos
  (agente `disenador-grafico`).
- **"Empezar de nuevo" pasa a la zona de la familia**, con confirmación.
- **Cinemáticas con Gemini (Veo) u otra herramienta similar, no con Canva.** Claude entrega
  guiones y prompts; Manuel genera los videos. Forma adaptativa: versión vertical 9:16 para
  celular y horizontal 16:9 para computador o proyector; el reproductor elige.
  Se ven solas la primera vez (con botón de saltar) y quedan en "Recuerdos" en el álbum para
  volver a verlas (decisión de Claude, delegada por Manuel).

Decisiones de Manuel del 14 de noviembre (tercera tanda): **lo que recomienda el pedagogo
queda como decisión** (`docs/pedagogia/ronda-1.md`), pensando en lo mejor para el docente que
hace el seguimiento y para el niño que completa las misiones:

- **Estrellas, opción B.** El puente se abre cuando todos los faroles del territorio brillan.
  Mission Stars vuelve a la escala de la tesis (regla 5): la app da completar 15, pronunciar
  10, corregir y mejorar 15 y autoevaluarse 10 (una vez por misión; autoevaluarse una vez por
  misión y día); el docente da participar 10 y colaborar 15, que no cuentan para el puente.
  Ayudar a un vecino del bosque puede reconocerse como "colaborar" si el docente lo decide.
  Hay que quitar el `assert` de suma 50 del guion, cambiar los textos del puente
  (`puente-cerrado`, `rayo`) y recalibrar estelas y accesorios. `CLAUDE.md` ya está ajustado.
  **Esto reemplaza la decisión del 12 de noviembre** (estrellas por misión que suman 50).
- **Sesión del día:** 3 misiones; al terminarla, las misiones nuevas se apagan hasta mañana
  y el álbum y el mapa siguen abiertos.
- **Prueba del viernes:** el niño ve "¡Terminaste!" y lo que encendió, nunca una nota; la
  calificación la ve solo el docente.
- **Misión de la hora con voz** (`bosque-time-2`), con las mismas salidas si no hay micrófono
  (decirla en voz alta o escribirla).
- **Guía de pronunciación:** la `z` marca el sonido "th" (lengua entre los dientes); la
  docente lo enseña una vez.

## Trabajo sin integrar

El 14 de noviembre Manuel pidió detener a los agentes para ahorrar. Lo que hicieron y no se
integró está en `pendiente/` (ver `pendiente/LEEME.md`): juegos nuevos y 3 misiones por
camino, funcionamiento sin conexión, movimiento por caminos y suelo nuevo del Bosque.
Pendiente además: opción B de estrellas, vestidor de accesorios (umbrales a recalibrar),
resumen para la familia y reproductor de cinemáticas.

## Qué hay construido

| Pieza | Estado | Dónde |
| --- | --- | --- |
| Equipo de agentes (líder, diseñador, pedagogo, desarrollador, revisor, auditor) | Escritos, aún sin usar | `.claude/agents/` |
| Skills (2 oficiales de Anthropic revisadas + `diseno-infantil` y `auditoria`) | Instaladas | `.claude/skills/` |
| Aplicación (Vite + React + TypeScript) | Prototipo del modo estudiante | `src/` |
| Mundo explorable del Bosque de los Sonidos, visto desde arriba | Funciona; falta que Manuel lo pruebe | `src/Mundo.tsx` |
| Suelo del bosque pintado por capas con texturas de Canva (2800 × 2800, WebP de 2000 px, 464 KB) | Hecho | `public/cartillas/ingles-3/fondos/bosque-mapa.webp` |
| Árboles (9) y animales (6) generados en Canva, recortados con transparencia | Hecho | `public/cartillas/ingles-3/mundo/` |
| Tres personajes para elegir, seis habitantes y nueve objetos de aldea (Canva) | Hecho | `public/cartillas/ingles-3/personajes/`, `mundo/` |
| Elegir personaje, álbum de palabras y mini mapa | Funciona | `src/ElegirHeroe.tsx`, `src/Album.tsx`, `src/MiniMapa.tsx` |
| Sonido de ambiente del bosque (brisa, grillos, búho) | Sintetizado en el dispositivo, provisional | `src/audio.ts` |
| Diálogos con personajes, opciones y cambio de idioma | Funciona | `src/Dialogo.tsx` |
| Juego "escucha y toca" (plantilla que recibe contenido) | Funciona; primera misión de cada camino | `src/juegos/EscuchaToca.tsx` |
| Juego "Listen & Catch" (farolitos que bajan, frasco que se llena) | Funciona; segunda misión de cada camino | `src/juegos/EscuchaAtrapa.tsx` |
| Juego "Di y brilla" (voz, o escribir, o decirlo sin micrófono) | Funciona; tercera misión de cada camino y la hora con voz | `src/juegos/DiBrilla.tsx`, `src/escuchar.ts` |
| Juego "Memory" (cartas que giran, dos tableros) | Funciona; repaso en el pozo de la plaza | `src/juegos/Memoria.tsx` |
| Final de misión compartido (premios y caritas) | Funciona | `src/juegos/CierreMision.tsx` |
| Palabras para repasar | Se anotan al terminar cada misión y se ven en el álbum | `src/progreso.ts` (`anotarPractica`), `src/Album.tsx` |
| Mission Stars en el dispositivo | Funciona con `localStorage` | `src/progreso.ts` |
| Contenido de la cartilla (18 misiones del nivel 1: 3 por camino, 2 de la hora y el pozo; historia, personajes) | Solo el territorio 1 | `public/cartillas/ingles-3/cartilla.json` |
| Base de datos con seguridad por filas | Creada en Supabase; la app aún no la usa | `supabase/esquema.sql` |

Comandos: `npm install`, `npm run dev`, `npm run build`. Hay `netlify.toml` listo, pero el
repositorio aún no está conectado a Netlify.

## Supabase

- Proyecto: `https://jpwwmzfhbdnzsvwuciqa.supabase.co`
- Clave pública (se puede usar en el código): `sb_publishable_CaFq1L46SKUAHTkjWbk8_w_gCb509s1`
- La clave secreta (`service_role`) nunca se pide ni se pega en un chat.
- Hecho: esquema ejecutado; colegio "I.E. Jorge Barco Mora" y perfil de Manuel con rol `dueno`.
- **Por confirmar con Manuel:** que activó *Allow anonymous sign-ins* en
  Authentication → Sign In / Providers. Sin eso los estudiantes no pueden entrar.
- El esquema se probó en un Postgres local (`supabase/prueba_local.sql`), no contra el
  proyecto real. La prueba no se puede ejecutar dos veces sobre el mismo servidor porque
  crea roles; hay que usar un servidor limpio.

Diseño de acceso: los adultos entran con correo y contraseña; los estudiantes con código de
grupo, apodo y PIN de tres imágenes sobre una sesión anónima. Las estrellas son un registro
que solo crece: las de misión las calcula el servidor (`registrar_mision`) y las de
participar, pronunciar y colaborar solo las da el docente (`dar_estrellas`).

## Lo que hay que mejorar, en orden

### 1. Mundo visto desde arriba — primera versión hecha, falta que Manuel la pruebe

Hecho en `src/Mundo.tsx` (constantes `CAMARA_*` y `ESCALA_*`):

- El guía cruza la pantalla y la cámara lo alcanza después (resorte amortiguado con zona
  libre, en las dos direcciones). Se inclina, trota, deja chispas y tiene sombra. Cada toque
  deja una onda y un aro dorado marca el destino. Manuel ya aprobó este movimiento.
- El bosque es un mapa de 1800 × 1800: claro central, cinco claros con una misión cada uno,
  puente hacia el Valle a la derecha y luciérnagas fuera de los caminos.
- Todas las posiciones de `cartilla.json` van en píxeles del mapa (`mundo.mapa`, `ancho`,
  `alto`); ya no existe `fondos`.
- El mundo se escala según la pantalla y la brújula apunta en cualquier dirección.
- Comprobado a 390 px y a 1366 px con capturas seguidas; el prototipo publicado lo tiene.

Mapa por capas (pedido por Manuel):

- Suelo sin árboles + 138 árboles sueltos ordenados por profundidad: el guía pasa por detrás
  y el árbol se vuelve translúcido. Las posiciones están en `mundo.arboles`.
- Penumbra por zonas: un lienzo oscuro con huecos de luz (`mundo.luces` y cada misión
  completada, `radioLuzMision`). Los árboles sin luz se ven apagados. Reemplaza al filtro
  de color sobre todo el mapa.
- Animales que se mueven solos (`mundo.criaturas`): mariposas, abejas, pájaro, búho, ranas.
- Sombras de nubes que cruzan y sonido de ambiente (`mundo.ambiente`), que baja cuando
  alguien habla.
- Los árboles se sembraron con un guion que evita claros, caminos y agua leyendo los
  colores del suelo; si cambia el mapa hay que volver a sembrar.

Habitantes y mejoras de juego (pedido por Manuel):

- **Elegir personaje** antes de empezar (`cartilla.heroes`); queda en el progreso.
- **Aldea** en el claro central: casas, pozo, carreta, faroles (`mundo.objetos`).
- **Habitantes** (`mundo.habitantes`): Tito, Abu y Caro perdieron una palabra y están sin
  color. El niño la busca entre tres (`encargo`), se la lleva y el habitante recupera el
  color. Si trae otra, se le anima a escuchar de nuevo. Púa, Nuez y Rayo solo conversan.
- **Álbum**: las palabras de luciérnagas, animales y encargos se guardan y se pueden
  volver a escuchar. Los animales saludan con su palabra al acercarse y se apartan.
- **Estelas** del personaje que se abren con estrellas (`cartilla.estelas`).
- **Obstáculos**: no se camina sobre agua, troncos ni casas (`mundo.agua`, `choque`).
- **Mini mapa** con lo encendido, los vecinos y dónde está el niño.
- **Más capas**: copas en primer plano con paralaje (`mundo.frente`), bordes oscurecidos,
  faroles con halo. El color de la penumbra va por territorio (`mundo.colorPenumbra`).
- "Empezar de nuevo" ya reinicia también el mundo.

Bosque grande (pedido por Manuel tras probar):

- Mapa de 2800 × 2800 generado en Canva: plaza central y cinco caminos con **dos claros
  cada uno**. Cada camino es un tema con dos misiones; la segunda duerme hasta completar
  la primera (`requiere`). Así se repasan todas las palabras: 10 números, familia completa,
  10 colores, 10 útiles, 9 partes del cuerpo y 4 saludos. Se añadieron palabras e iconos.
- Un habitante por camino, en el primer claro, con su casa al borde (`zona` = su misión).
  Recupera el color cuando vuelve su palabra **o** cuando se enciende su claro, y brilla
  cuando el niño le devuelve la palabra.
- **Pistas en el piso** (`mundo.huellas`): los iconos de las palabras de cada misión
  marcan su camino y se encienden al completarla.
- Nada que suene queda escondido: luciérnagas y tarjetas de palabra van por encima de los
  árboles, y se quitan los árboles que taparían luciérnagas o ranas.
- Solo se dibuja lo que está cerca de la pantalla (`CUADRO_VISTA`, `MARGEN_VISTA`).
- Textos de los habitantes reescritos, cada uno con su manera de hablar.

Todo el bosque lo arma `herramientas/construir_bosque.py` a partir de la imagen del suelo
(detecta claros, caminos y agua por color) y lo escribe en `cartilla.json`. **Los textos,
las palabras y la distribución se editan en ese guion, no a mano en el JSON**, porque al
volver a ejecutarlo se sobrescriben. Necesita el suelo en PNG de 2800 px (Canva:
`MAHa545H3F0`; el anterior, `MAHau81HHYQ`). `herramientas/recortar.py` convierte hojas de
figuras en imágenes sueltas.

Suelo de calidad de estudio (pedido de Manuel, 14 nov):

- Se probaron tres direcciones. A y C: repintar el mapa entero en Canva con el suelo
  anterior como referencia (`MAHa3rnq9hM`, `MAHa3ngm1N8`, este con el estilo del mapa
  original). Se ven bien de lejos, pero Canva las entrega a 1264 px: a 390 px quedan
  borrosas, y los claros con corona de flores confundían la detección. B (elegida): el suelo
  se compone con `herramientas/pintar_suelo.py` a partir de texturas de Canva de 2048 px
  (bosque, prado, tierra, agua, empedrado), una hoja de detalles (flores, piedras, hongos,
  raíces, charcos, helechos) y un puente, sobre la topología exacta del suelo anterior. Así
  queda nítido, con la misma plaza, los mismos diez claros, caminos más anchos, anillo de
  piedra en la plaza y orillas con arena. Las fuentes y sus ID están en ese guion.
- `construir_bosque.py` ahora aplica una mediana de 5 × 5 celdas antes de clasificar los
  colores (borra flores, piedras y brillos) y busca sitio para luciérnagas y animales junto
  a caminos o bordes de claros en 130 px (antes 90 px y solo caminos: el suelo anterior tenía
  manchas sueltas que contaban como camino). Los arbustos se intentan 2000 veces (antes 400).
- Los charcos del bosque van un poco verdosos a propósito, para que no cuenten como agua.
- El diseño de Canva compartido `DAHarW2Gyck` lo están usando otras sesiones; para exportar
  sin pisarse se usa una copia propia (`DAHa3hWc7ik`, una página por imagen).

Pendiente:

- Que Manuel lo pruebe en su celular.
- **Decisión del pedagogo y de Manuel:** los encargos no dan estrellas. Las reglas de
  Mission Stars no tienen una conducta para "ayudar a un habitante"; hoy premian con
  color, álbum y celebración.
- Las palabras añadidas (crayon, chair, pink, brown, black, white, arms, legs, good night,
  grandmother, grandfather, baby) y los textos necesitan revisión pedagógica.
- La misión de la hora ("What time is it?", seis relojes en punto) está junto al camino
  del puente; es una sola misión y no tiene habitante con encargo.
- Iconos nuevos: Noto Emoji (Apache 2.0), tomados del paquete `@svgmoji/noto`.
- Las frases de Cosmo en las misiones siguen hablando en primera persona como guía.
- Medir en un celular de gama baja: son 138 árboles en pantalla más los animales.
- No hay botón para silenciar el ambiente.
- No hay obstáculos: el guía pasa por encima de árboles y agua. Decidir si se quedan así
  (vuela) o si los caminos mandan.
- Personajes animados: partir cada personaje en piezas y animarlo (Rive).
- Manuel mencionó "la estrella que aparece al inicio": confirmar a qué personaje espera
  controlar. Hoy es Cosmo; la estrella es Lumi.

Cómo se trae una imagen de Canva: `generate-image` solo devuelve una miniatura de 200 px.
Para el tamaño completo se inserta la imagen a página completa en un diseño
(`read-design` con transacción, `edit-design` con `insert_fill`, guardar) y se exporta en
PNG. El diseño contenedor es `DAHarW2Gyck` (se reemplaza su imagen con `update_fill`). Imágenes
en Canva: mapa original `MAHarXMYl7M`, suelo `MAHarSCZ4iM`, árboles `MAHarYMJvlw`,
animales `MAHarYhC0EU`, personajes `MAHauU4SB-Y`, habitantes `MAHauWDSNKA`, objetos de aldea
`MAHauWqQimo`. Las hojas de figuras se piden sobre fondo blanco y se recortan
aquí; usar el mapa original como referencia mantiene el estilo.

### 2. Más juego dentro de las misiones

**Hecho: "Di y brilla" (Speak & Shine).** La segunda misión de cada camino ya no repite
"escucha y toca": el niño ve y oye la palabra, toca 🎤 y la dice. Cómo funciona:

- Si se reconoce la palabra, la carta brilla. Si dice otra cosa, se aplaude el intento y
  se le vuelve a decir la palabra; nunca hay error en pantalla. Si no habló, 👂 y repite.
- **Pedido de Manuel (14 nov):** la carta no muestra la palabra escrita sino cómo se
  pronuncia, escrito como se lee en español ("bák-pak"). Si estuviera escrita, escribirla
  no sería reto. La palabra escrita aparece solo después del intento, como modelo. Las
  guías están en `PRONUNCIA` dentro de `construir_bosque.py` (campo `pronuncia` de cada
  palabra); falta que el pedagogo las revise.
- ⌨️ abre un campo para escribirla. Igual o con una letra de diferencia cuenta como
  intento bueno; si no, se le muestra cómo se escribe y puede seguir igual.
- Sin micrófono (no existe, permiso negado, sin conexión) el 🎤 se cambia solo por 🗣️
  "ya la dije en voz alta" y queda el ⌨️. Al niño no se le muestra nada técnico.
- Nada se graba ni se guarda (regla 7). **Para revisar con el auditor y con Manuel:** en
  Chrome y Edge el reconocimiento de voz suele enviar el audio a los servidores de Google
  o Microsoft para convertirlo en texto. Donde el navegador ofrece reconocerlo dentro del
  dispositivo, el código lo prefiere (`processLocally`). Antes del piloto hay que decidir
  si esto se informa en el consentimiento de las familias o si el micrófono se apaga por
  defecto y lo activa el docente.
- Se probó a 390 px con un reconocedor simulado (acierta, dice otra cosa) y sin
  micrófono. Falta probar la voz real en un celular.
- Desde la ronda 1, `di-brilla` es la tercera misión de cada camino (ver abajo).

**Hecho (ronda 1): tres misiones por camino, Listen & Catch y Memory.** Según
`docs/pedagogia/ronda-1.md` (secciones 1, 2 y 6) y `docs/diseno/ronda-1.md` (1, 2, 6, 7, 9):

- Cada camino: *Escucha y toca* con el grupo A en el claro A → *Listen & Catch* con el grupo
  B en el claro B → *Di y brilla* con 5 palabras de A y B (siempre la del vecino) de vuelta en
  el claro A, junto al vecino (`bosque-<tema>-3`). `requiere` las encadena.
- **Listen & Catch** (`escucha-atrapa`): mirar cada palabra y luego farolitos que bajan por
  3 o 4 carriles (objetivo + 2 distractores en las dos primeras rondas, luego 3). El ritmo lo
  trae el contenido (`mision.atrapa`: cruce de 6 s al principio a 4,5 s al final, nunca más
  rápido). Lo que no se atrapa vuelve a pasar; el objetivo que pasa sin tocarse vuelve 30 %
  más lento y brillando, y se repite la palabra. Tocar otro: tiembla, queda translúcido, se
  dice su nombre y luego el objetivo. Una ronda más al final con una palabra que costó. Un
  solo bucle de `requestAnimationFrame` que solo cambia `transform`; se pausa si la pestaña
  se oculta. Con movimiento reducido (decidido en JS) los farolitos quedan quietos.
  Medido en Chromium sin cabeza a 390 px con la CPU 4 veces más lenta: 60 fps.
- **Memory** (`memoria`): 4 parejas por tablero en 3 × 3 con Lumi al centro; un tablero por
  forma de `mision.formas` (`imagen-sonido` y luego `imagen-palabra`). La carta de dibujo no
  suena al girar; la otra sí. Sin reloj ni sonido de error; si no son pareja se voltean a
  los 1,1 s. Ayuda de Lumi por niveles (3 fallos o 15 s quieto: habla; 5 fallos o 25 s:
  marca una carta; 3 fallos más: marca una pareja) y tocar a Lumi pide ayuda. La primera vez
  en la vida Lumi juega una pareja de ejemplo (`vistas: 'tutorial-memoria'`). Las palabras
  que están en `repasar` entran primero.
- **Pozo de los recuerdos** (`bosque-pozo`): Memory junto al pozo de la plaza. Despierta al
  completar la primera misión de cualquier camino (`requiereAlguna`) y usa las palabras de
  las misiones ya completadas (`palabrasDe`; las resuelve `App.tsx`). Da 0 estrellas.
  Dormido cuenta su propia escena (`escenaDormida: 'pozo-dormido'`).
- Los cuatro juegos van en la carga inicial (unos 10 kB comprimidos): sin conexión, abrir un
  juego nunca deja la pantalla en blanco. Con la pestaña oculta los juegos se pausan y al
  volver repiten la palabra. Las ayudas en modo `mixto` se dicen en inglés y luego en español.
- Misión de la hora con voz (`bosque-time-2`, Rayo pregunta) con three, six y twelve
  o'clock. Las horas traen `frase` ("It's three o'clock."), que se dice al presentarlas.
- Frases de ayuda de los juegos en el contenido (`cartilla.ayudas`); se dicen en español o
  inglés según el avance.
- Textos corregidos (pedagogía 1.4 y 1.5), contracciones en todas las líneas en inglés,
  pen "lapicero", crayon "crayola", partes del cuerpo reordenadas, iconos nuevos de Canva,
  guía de pronunciación de la sección 6 (también los animales del álbum) y `aceptar` con
  cifras y homófonos (one: 1, won; two: 2, to, too; four: 4, for; eight: 8, ate; feet: feat;
  thank you: thanks; horas: "3:00").
- **Estrellas provisionales:** 3 por misión de camino y 3 + 2 en la hora (suman los 50 del
  puente); se quitó el `assert` de suma 50. **Pendiente: la opción B** (puente con todos los
  faroles, Mission Stars con la escala de la tesis, textos de `puente-cerrado` y `rayo`,
  estelas recalibradas). `Mundo.tsx` solo cambió para entender `requiereAlguna`.
- Los cambios se hicieron en el guion y, con un script aparte, en `cartilla.json` (el suelo
  PNG está en Canva). La tercera misión de cada camino y la de la hora se ubicaron en el JSON
  con el mismo cálculo que el guion, pero sobre los datos ya escritos: al volver a correr el
  guion pueden moverse unos píxeles. Se quitaron 4 árboles que tapaban las misiones nuevas.

Pendiente de esta ronda: chispa que viaja de la carta a Lumi; onda al tocar el fondo en
Listen & Catch; la fase *mirar* de la hora no muestra "3:00"; probar en un celular real (la medición de
fps es en Chromium de escritorio con la CPU frenada, no en gama baja real).

Faltan los demás juegos propuestos en el informe: Sentence Builder con arrastre, Paint the
World, Story Theater, Town Builder y Star Duel. Cada uno debe ser una plantilla que reciba su
contenido del paquete de la cartilla.

### 3. Conectar la aplicación a Supabase

- Pantalla de entrada del estudiante: código de grupo, lista de apodos, PIN de imágenes.
- Cambiar `src/progreso.ts` para que guarde en Supabase y conserve copia local.
- Modo docente básico: crear grupos, agregar estudiantes, dar estrellas, ver avance.
- Después, modo coordinador.

### 4. Voz definitiva

Hoy la voz es la del navegador, en español e inglés. Hay que generar los audios una sola
vez con un servicio de voz de calidad y guardarlos como archivos. Manuel deberá dar la
clave de ese servicio por el formulario seguro, nunca en el chat.

### 5. Pendientes menores

- Al recargar con misiones ya hechas, Cosmo repite la frase de "el bosque tiene más luz".
- El cambio de español a inglés ocurre muy rápido (tras 2 misiones) para que se note en el
  prototipo. En la cartilla real debe repartirse entre los cuatro territorios; se ajusta en
  `idiomaPorAvance` dentro de `cartilla.json`.
- Sin conexión: hecho con un service worker propio (`sw/sw.js`; `vite.config.ts` genera
  `dist/sw.js`). Guarda el armazón al instalar y, después, todo archivo que nombre
  `cartilla.json`. Toda imagen que use la app debe figurar en `cartilla.json`; si solo
  está en el código, no se guarda hasta que se muestre una vez. Todo se sirve desde el
  caché de la versión activa (también index y `cartilla.json`), así que una versión
  publicada llega la próxima vez que se abre la app: se instala en segundo plano y entra
  sola si el niño aún no ha tocado nada; si ya está jugando, espera. Falta probarlo en un
  celular Android real (instalar y jugar en modo avión).
- Límites conocidos del modo sin conexión: `/sub` sin barra final queda fuera del alcance
  del service worker (sin red no abre; con red el servidor redirige a `/sub/`). Con dos
  pestañas abiertas, la vieja pasa a ser atendida por la versión nueva: sus archivos con
  hash siguen disponibles (los cachés viejos no se borran mientras haya otra pestaña),
  pero si volviera a pedir `cartilla.json` recibiría el nuevo.
- **Pendiente sin resolver:** dentro de un iframe con `sandbox` sin `allow-same-origin` la
  app no carga, con o sin service worker: el origen queda `null` y el navegador bloquea
  el JS y el CSS por CORS (`Access to script ... from origin 'null' has been blocked`).
  Además `localStorage` no está disponible ahí. Hay que decidir cómo se va a incrustar.
- Faltan los territorios 2, 3 y 4 y su contenido.
- El filtro que apaga y enciende el color del bosque puede ser pesado en celulares de gama
  baja; medirlo.
- Vista para la familia (resumen de lo aprendido y lo que hay que reforzar) y medición
  antes/después del piloto: los datos de "qué costó" ya se guardan; falta la pantalla.
- Sesión diaria de unos 15 minutos: medir cuánto dura cada misión y armar la del día.

## Ideas anotadas por Manuel (sin desarrollar todavía)

- **Plan por semanas.** El juego se actualiza día a día según el tema que se vea en clase
  (por ejemplo, una semana de colores). Cada día refuerza el tema con un tipo de misión
  distinto (escucha y toca, completa la palabra, sopa de letras, memoria, voz) y el viernes
  hay una prueba de la que se pueda obtener una calificación. Así no es repetitivo y el uso
  diario queda limitado. Los juegos tienen su propio sistema de puntos, separado de Mission
  Stars (que es el reconocimiento de las actividades del salón).
- **El docente elige la sesión y cuántas.** Una sesión es un tema. El docente escoge cuál
  ven los niños y responde cuántas sesiones habrá; ese número es la cantidad de días, para
  ajustarlo a festivos o días sin clase. Lo ideal sigue siendo que los niños repasen todos
  los días.
- Preguntas abiertas que dejé a Manuel: quién decide el tema de la semana, si la prueba del
  viernes es solo en el salón, y qué pasa con los festivos (la idea anterior responde la
  primera y la tercera). La calificación necesita la base de datos conectada, cuentas de
  estudiante y la escala de evaluación del colegio.

## Límites del entorno que conviene saber

- La sesión en la nube no puede crear repositorios de GitHub; los crea Manuel y se conectan.
- No hay acceso al computador de Manuel; todo se hace en el contenedor de la sesión.
- Canva está conectado y disponible, aún sin usar.
- En las pruebas con Playwright, los botones animados necesitan `force: true` al hacer clic.
- El prototipo publicado es el contenido de `dist/` con un `index.html` sin `<head>` que
  apunta a `assets/index-*.js` y `.css`; al republicar se quitan los dos archivos viejos.
