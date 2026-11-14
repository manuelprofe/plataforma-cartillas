# Revisión pedagógica, ronda 1: Bosque de los Sonidos

Asesor pedagógico. Fuentes: `herramientas/construir_bosque.py`, `public/cartillas/ingles-3/cartilla.json`,
`src/juegos/*.tsx`, `src/progreso.ts`, `CONTINUAR.md`, `CLAUDE.md`.
Marco: el de la tesis (Bruner, Krashen, Vygotsky, Ryan y Deci, Ausubel, Kapp) y los referentes del MEN.

**Límite de lo que se afirma.** Nada de lo que sigue está medido en aula. Las duraciones son
estimaciones para calibrar el piloto. Ningún texto de la plataforma ni de venta debe decir que la
cartilla "mejora el aprendizaje" o "aumenta la motivación" hasta que el piloto lo muestre.

**Referentes MEN que se citan.** *Estándares Básicos de Competencias en Lenguas Extranjeras: Inglés*
(Guía 22, 2006), grados 1 a 3, nivel Principiante (A1). *Derechos Básicos de Aprendizaje de Inglés,
Transición a 5°* (2016), grado 3. Los DBA se nombran por su contenido: **antes de imprimir un número de
DBA en material del colegio, hay que cotejarlo con el documento oficial** (no lo tengo a mano para
verificar la numeración).

---

## 1. Revisión de palabras y textos del Bosque

Todo se corrige en `herramientas/construir_bosque.py` (no a mano en el JSON).

### 1.1 Problema de estructura (el más importante)

**Qué está mal.** Cada camino tiene dos grupos de palabras distintos: el grupo A se presenta con
"Escucha y toca" (mirar, jugar) y el grupo B va directo a "Di y brilla" (decir). Resultado:

- Las palabras del grupo A se oyen y se reconocen, pero **nunca se dicen**.
- Las palabras del grupo B se dicen **sin haber pasado por el juego de comprensión**. Solo se ven y se
  oyen una vez antes de pedir que el niño las diga.

**Por qué.** Esto rompe el ritmo mirar → jugar → decir (Bruner) y la entrada comprensible antes de la
producción (Krashen). Pedir que el niño diga palabras que acaba de oír una sola vez sube el filtro
afectivo, justo en la misión de voz.

**Corrección.** Se propone en la sección 2.3: tres misiones por camino, en el orden *Escucha y toca (A)
→ Listen & Catch (B) → Di y brilla (mezcla de A y B)*. Si Manuel prefiere quedarse con dos misiones,
el arreglo mínimo es que "Di y brilla" use **las mismas palabras** de la primera misión (grupo A) y que
el grupo B pase a una misión de escucha.

### 1.2 Palabras añadidas

| Palabra | Veredicto | Problema y corrección |
| --- | --- | --- |
| crayon | Cambiar la glosa | En Colombia el niño dice "crayola", no "crayón". `W('crayon', 'crayola', '1f58d')` |
| chair | Bien, pero el texto no cuadra | Una silla no es un "útil". El texto de la misión dice "útiles" (ver 1.4, school-2). |
| pink | Bien | "rosado" es la forma usual en Norte de Santander. |
| brown | Bien | "café" es la forma usual en Colombia; no cambiar a "marrón". |
| black | Bien | Diseño: el círculo negro se pierde en la penumbra del mapa. Necesita un borde claro. |
| white | Bien | Diseño: el círculo blanco sobre una carta clara necesita un borde oscuro. |
| arms | Cambiar el icono | 💪 (`1f4aa`) se lee como "fuerte" o "músculo", y muestra un solo brazo. Hace falta un icono propio con los dos brazos (Canva). |
| legs | Cambiar el icono | 🦵 muestra una pierna y la palabra está en plural. Icono propio con dos piernas. |
| good night | Bien | Encaja con la familia y la rutina de la casa. Bien usada como distractor de Nuez: no es un saludo de llegada. |
| grandmother / grandfather | Bien, muy pertinentes | En Los Patios muchos niños viven con los abuelos o los abuelos los crían (Ausubel: entorno cercano). Son difíciles de pronunciar: se oyen en la misión de escucha y solo "grandmother" va en la de voz (ver 2.3). |
| baby | Bien | |

### 1.3 Otras palabras e iconos ya existentes con problema

| Dónde | Qué está mal | Corrección |
| --- | --- | --- |
| school-2, `marker` | El icono `1f58a` es un lapicero 🖊, no un marcador. El niño aprende una palabra que no corresponde. | Cambiar la palabra: `W('pen', 'lapicero', '1f58a')`. "pen" es vocabulario básico de aula. Que la docente confirme si en el colegio dicen "lapicero" o "esfero". |
| school-1, `eraser` | `1f9fd` es una esponja 🧽. El niño dirá "esponja". Es además la palabra del encargo de Caro. | Icono propio: un borrador de nata (Canva). Prioridad alta. |
| body-1, `head` | `1f642` es una carita sonriente 🙂: el niño asocia "head" con "cara" o "feliz". | Icono propio (cabeza completa, con pelo y cuello). |
| body | El título "My face" incluye "head", y "mouth" está en "My body". | Reordenar (abajo). |
| body, `ears`, `feet` | Un solo oído y un solo pie para palabras en plural. | Iconos propios en pareja. Prioridad baja: se puede salir así en la primera prueba. |
| family-2 | Tiene 7 palabras y "Di y brilla" toma 5 al azar (`RONDAS = 5`): en cada partida quedan 2 sin practicar, y pueden ser siempre las mismas. | Con la propuesta 2.3 la misión de voz trae exactamente 5 palabras elegidas. |
| hora | Los emojis de reloj (`1f550`…) tienen las manecillas muy finas a 96 px. En un celular de gama baja cuesta distinguir las tres de las nueve. | Relojes propios grandes, con números. En la fase *mirar* conviene mostrar "3:00" en pequeño debajo: es como los niños ven la hora en el celular (Ausubel). |

Partes del cuerpo reordenadas:

```python
'body': (
    [W('eyes', 'ojos', '1f440'), W('ears', 'orejas', '1f442'), W('nose', 'nariz', '1f443'), W('mouth', 'boca', '1f444')],
    [W('head', 'cabeza', 'cuerpo-head'), W('arms', 'brazos', 'cuerpo-arms'), W('hands', 'manos', '1f64c'), W('legs', 'piernas', 'cuerpo-legs'), W('feet', 'pies', '1f9b6')],
),
```

El encargo de Púa (`eyes`, `nose`, `ears`) sigue en el grupo A; no cambia.

### 1.4 Textos `ANTES` corregidos

En inglés se usan contracciones (`Let's`, `It's`, `I'm`, `That's`), que es como el niño las oirá en
canciones y en clase. `Let us start` suena rígido y la voz sintética lo marca aún más. **Esta regla
vale para todas las líneas en inglés de las escenas.**

Primeras misiones (Escucha y toca):

```python
'school': L('cosmo', 'Aquí se apagaron los útiles de la escuela. Escucha y toca el correcto.', "The school things lost their light here. Listen and tap the right one."),
'colors': L('cosmo', 'Los colores del bosque se volvieron grises. ¡Vamos a encenderlos!', "The colors of the forest turned gray. Let's light them up!"),   # sin cambio
'numbers': L('cosmo', 'Los números se escondieron entre los árboles. Empecemos del uno al cinco.', "The numbers are hiding in the trees. Let's count from one to five."),
'body': L('cosmo', 'Mira tu cara: ojos, orejas, nariz y boca. Cuando oigas una, tócatela tú también.', 'Look at your face: eyes, ears, nose and mouth. When you hear one, touch it too!'),
'family': L('cosmo', 'Aquí aprendemos a saludar y a dar las gracias.', "Here we learn to say hello and thank you."),   # sin cambio
```

Para el cuerpo, "tócatela tú también" agrega el paso enactivo (Bruner) sin cambiar el juego: el
niño toca su propia nariz además de la carta.

Misiones de escucha del grupo B (Listen & Catch, si se aprueba la sección 2.3):

```python
'school': L('cosmo', '¡Mira! Hay más cosas del salón flotando. Atrapa la que escuches.', "Look! More classroom things are floating. Catch the one you hear."),
'colors': L('cosmo', 'Cinco colores más vuelan por el aire. Escucha y atrapa el que te digo.', "Five more colors are flying. Listen and catch the one I say."),
'numbers': L('cosmo', '¡Ya llegas al cinco! Ahora atrapa del seis al diez.', "You can count to five! Now catch six to ten."),
'body': L('cosmo', 'Ahora el resto del cuerpo: cabeza, brazos, manos, piernas y pies. ¡Atrápalos!', "Now the rest of the body: head, arms, hands, legs and feet. Catch them!"),
'family': L('cosmo', 'En cada casa vive una familia distinta. Escucha y atrapa a cada persona.', "Every home has a different family. Listen and catch each person."),
```

La línea de familia reemplaza "¿Quién vive en tu casa?". En la frontera hay muchos hogares con
migración, padres ausentes o niños criados por abuelos; la pregunta directa puede exponer al niño.
La nueva línea no le pide contar nada de su casa.

Misiones de voz (Di y brilla). Hoy school-2 dice "Escucha con atención" en una misión de hablar. Las
cinco deben anunciar que ahora habla el niño y quitarle presión:

```python
'school': L('cosmo', 'Ahora tú le das voz a las palabras. Escucha, y cuando quieras, dila. ¡Cada intento cuenta!', "Now you give the words a voice. Listen, and when you're ready, say it. Every try counts!"),
'colors': L('cosmo', '¡Tu voz enciende los colores! Escucha cada uno y dilo como te salga.', "Your voice lights up the colors! Listen to each one and say it your way."),
'numbers': L('cosmo', 'Abu quiere oírte contar. Escucha el número y dilo tú.', "Abu wants to hear you count. Listen to the number and say it."),
'body': L('cosmo', 'Púa quiere oírte nombrar el cuerpo. Escucha y dilo en voz alta.', "Púa wants to hear you name the body. Listen and say it out loud."),
'family': L('cosmo', 'Vamos a saludar a la familia del bosque. Escucha y dilo tú.', "Let's say hello to the forest family. Listen and say it."),
```

### 1.5 Textos de los habitantes

| Escena | Qué está mal y por qué | Texto corregido (es / en) |
| --- | --- | --- |
| `pua-otra` | "¡Ja, ja!" se ríe del error del niño. Va contra la regla 6 y sube el filtro afectivo (Krashen). **Prioridad alta.** | `'¡Uy, con eso no huelo! No importa: escucha otra vez y prueba con otra.'` / `"Oops, I can't smell with that! Never mind. Listen again and try another one."` |
| `tito-gracias` (2) | "¡Eres el mejor explorador del bosque!" compara con otros y premia el resultado, no la conducta (Ryan y Deci). Además "explorador" es masculino. | `'Ya está en tu álbum. ¡Escuchaste con mucha atención!'` / `"It's in your album now. You listened very carefully!"` |
| `tito-otra` | "¡Tranquilo!" es masculino; dos de los tres personajes pueden ser niñas. | `'¡Uy! Ese no es el color de mi sombrero. ¡No pasa nada! Escucha otra vez y prueba otro.'` / `"Oops! That's not the color of my hat. That's okay! Listen again and try another one."` |
| `caro-gracias` (2) | "…no ir tan rápido como los demás" compara con otros niños. | `'La guardé en tu álbum. ¡Gracias por tomarte tu tiempo conmigo!'` / `"I put it in your album. Thank you for taking your time with me!"` |
| `abu-pide` (1) | "pequeño explorador" es masculino. Se usa el título del nivel, que es neutro y ya está en inglés. | `'Buenas, Explorer. Soy Abu. Llevo cien años contando las piedras del camino...'` / `"Good day, Explorer. I'm Abu. I've counted the stones on this path for a hundred years..."` |
| `nuez-listo` | "explorador" es masculino. | `'¡Hello, Explorer! ¿Ves? Ya no se me olvida.'` / `"Hello, Explorer! See? I never forget it now."` |
| `nuez-otra` | "¡Casi!" no es cierto: "thank you" no está cerca de "hello", y el niño recibe una pista falsa. | `'¡Buen intento! Esa palabra es bonita, pero no es para saludar. Escucha otra vez. ¡Tú puedes!'` / `"Good try! That's a nice word, but it's not for saying hello. Listen again. You can do it!"` |
| `nuez-gracias` (2) | "a bread party" no es natural en inglés. | es sin cambio / `"It's in your album. And when all the words come back, I'll bake bread for a party!"` |
| `puente-cerrado` (2) | "me da estrellas" hace creer que las estrellas son de Nova y no del niño. | `'Cada misión que completas te da estrellas. Cuando tengas 50, el puente se encenderá.'` / `"Every mission you complete gives you stars. When you have 50, the bridge will light up."` Si Manuel elige la opción B de la sección 5: `'Cuando todos los faroles del bosque brillen, el puente se encenderá.'` / `"When all the forest lanterns shine, the bridge will light up."` |
| `rayo` (3) | Depende de la sección 5, igual que la línea anterior. | Opción A: sin cambio. Opción B: `'Enciende todos los faroles del bosque y el puente se encenderá.'` / `"Light all the forest lanterns and the bridge will light up."` |
| Todas las líneas `en` | "I am", "It is", "That is", "Let us". | Usar contracciones: "I'm", "It's", "That's", "Let's". |

**Lo que está bien y no se toca:** `caro-otra` ("Yo también me equivoco"), `abu-otra` ("Los sabios
también se equivocan"), `caro-gracias` (1) ("Ya puedo borrar y volver a intentar") y la escena de
Lumi normalizan el error. Así debe sonar todo. Mezclar inglés dentro de frases en español ("¡Mi
sombrero es red!") es buena entrada comprensible. Que el niño elija a dónde ir en `elegir` sirve a la
autonomía.

### 1.6 Misión de la hora

**Lo que cumple.** Los relojes en punto son el alcance correcto para tercero. Las seis horas cubren
las cuatro posiciones claras (12, 3, 6, 9) más dos (1 y 10). La historia de Rayo ("siempre llego
tarde") le da sentido. Se conecta con matemáticas, donde en estos grados se aprende a leer la hora.

**Lo que falla:**

1. **No tiene fase de decir.** Es el único tema que no llega a la voz. Corrección: agregar
   `bosque-time-2` con la plantilla `di-brilla` y 3 relojes (three, six, twelve o'clock), con Rayo
   preguntando. Línea `antes`: `L('rayo', '¡Rayo necesita saber la hora! Él pregunta "What time is it?" y tú le dices la hora.', "Rayo needs to know the time! He asks \"What time is it?\" and you tell him.")`.
   Va despierta después de `bosque-time` (`requiere`).
2. **La pregunta nunca suena.** El título es "What time is it?", pero en el juego solo se oye "three
   o'clock". Corrección de contenido: agregar a cada palabra un campo opcional `frase`
   (`"frase": "It's three o'clock."`). La plantilla dice la frase en la fase *mirar* y la palabra sola
   en *jugar*. Es un campo de datos; la plantilla lo usa solo si existe.
3. **Iconos.** Ver 1.3.

### 1.7 Notas para el desarrollador que tocan el código (no son textos)

- "Escucha y toca": la pista aparece tras 2 fallos, pero con 3 opciones a esa altura solo queda la
  correcta, así que la pista no ayuda. Corrección: tras el **primer** fallo, repetir la palabra más
  despacio (velocidad 0,75). Es la primera ayuda del andamiaje (Vygotsky).
- "Escucha y toca" tiene `RONDAS = 6`, pero casi todas las misiones traen 4 o 5 palabras. En la
  práctica son 4 o 5 rondas (6 solo en la hora y 6 de las 7 en familia).
- Las caritas del final no tienen voz. Un niño que no lee no sabe qué se le pregunta (regla 2).
  Hay que agregar a la cartilla un texto que se diga en voz alta al llegar ahí:
  `"autoevaluacion": {"es": "¿Cómo te fue en esta misión?", "en": "How did it go?"}`.

---

## 2. Dos juegos nuevos

Los dos son plantillas: reciben `palabras` y un bloque `juego` con sus parámetros. Las dos usan
`CierreMision` y `anotarPractica`, igual que las actuales.

### 2.1 Memory (cartas que giran)

**Propósito (Kapp).** Recuperar de la memoria la relación entre la imagen y la palabra después de
haberla oído. En el segundo tablero, empezar a reconocer la palabra escrita. Estándar de grados 1 a 3:
"Relaciono ilustraciones con oraciones simples" e "Identifico palabras relacionadas entre sí sobre
temas que me son familiares". DBA de 3°: reconocer vocabulario del entorno escolar y familiar con apoyo
visual.

**Qué forma pareja.** La carta de imagen no suena al girar, porque si sonara regalaría la respuesta.
La carta de palabra siempre suena al girar.

| Forma | Carta 1 | Carta 2 | Para quién |
| --- | --- | --- | --- |
| `imagen-sonido` | Imagen | Onda de sonido de color, sin texto; suena la palabra | Preescolar siempre; tercero en el primer tablero |
| `imagen-palabra` | Imagen | Palabra escrita; suena al girar | Tercero, segundo tablero |

En tercero, una partida tiene dos tableros: primero solo con sonido y luego con la palabra escrita.
El apoyo se va retirando de forma visible, y el texto sigue acompañado de audio (regla 2).

**Cuántas parejas.**

| Grado | Parejas por tablero | Cuadrícula a 390 px | Tableros |
| --- | --- | --- | --- |
| Preescolar | 3 | 2 × 3 | 1 |
| Tercero | 4 | 2 × 4 (cartas de unos 80 × 100 px) | 2 |
| Repaso del viernes | 6 | 3 × 4 | 1 |

**Reglas de juego.**

- Sin reloj, sin contador de jugadas a la vista, sin "perdiste".
- Si las cartas no son pareja, se voltean solas a los 1,2 s y se repite la palabra de la carta de
  palabra.
- Andamiaje: si el niño falla 3 veces seguidas con una pareja que ya vio completa, la compañera brilla
  un instante.
- Al formar la pareja suena la palabra, la carta vuela al álbum y aparece 🗣️ "dilo tú" (opcional, sin
  micrófono). Es un "decir" corto que no se evalúa.
- Qué cuenta como "costó" para `repasar`: girar 2 veces o más una carta de la pareja sin acertar,
  **después** de haber visto ya sus dos cartas. Los fallos de memoria pura (no haber visto aún la otra
  carta) no cuentan, porque no son de idioma.

**Vocabulario.** Sale del camino del tema: grupos A y B. Primero entran las palabras que están en
`repasar`; el resto se completa al azar.

**Dónde va.** No va como misión fija de cada camino. Es el **repaso**:

- "Pozo de los recuerdos" en la plaza (el pozo ya existe en `mundo.objetos`). Despierta cuando el niño
  completa la primera misión de cualquier camino y usa las palabras de los caminos ya abiertos.
- Bloque de repaso en la sesión del día (sección 3).

### 2.2 Listen & Catch (atrapa lo que oyes)

**Propósito (Kapp).** Discriminar palabras al oído con un poco de ritmo, para que el reconocimiento
se vuelva automático. Es el paso de jugar entre "Escucha y toca" (sin tiempo) y "Di y brilla".
Estándares: "Reconozco cuando me hablan en inglés y reacciono de manera verbal y no verbal", "Sigo
instrucciones relacionadas con actividades de clase y recreativas".

**Mecánica.** Luciérnagas bajan desde las copas cargando un objeto cada una. Lumi dice una palabra y
el niño toca la luciérnaga que la lleva. La luciérnaga vuela al farol.

| Parámetro | Valor sugerido | Por qué |
| --- | --- | --- |
| Fase *mirar* | Cada palabra se muestra y se oye una vez (como en "Escucha y toca") | Entrada antes de jugar |
| Rondas | Una por palabra de la misión (5; 7 en familia) + 1 con una palabra que costó en esa partida | Todas las palabras se juegan |
| Objetos en pantalla | Rondas 1 y 2: el objetivo y 2 distractores. Desde la 3: el objetivo y 3 distractores. Preescolar: el objetivo y 1 distractor siempre | El reto sube poco a poco |
| De dónde salen los distractores | Del mismo tema | Discriminar dentro del campo semántico |
| Velocidad | Cruzar la pantalla en 6 s al principio y en 4,5 s al final; **nunca más rápido** | Niños de 8 años en celulares de gama baja; no es un juego de reflejos |
| Tamaño | Objetos de 72 px o más, en 3 o 4 carriles fijos | Regla 3 |
| Si el objetivo pasa sin tocarse | No hay fallo: vuelve a subir, se repite la palabra y la siguiente pasada va 30 % más lenta y brillando | Andamiaje |
| Si toca un distractor | Se aparta con un rebote, se dice su nombre ("That's blue.") y se repite el objetivo ("Red!") | Corrección que también es entrada |
| "Costó" | Tocar un distractor, o dejar pasar el objetivo 2 veces | Para `repasar` |
| `prefers-reduced-motion` | Los objetos aparecen quietos, sin caer | Accesibilidad; queda como "Escucha y toca" |

Rendimiento: como máximo 5 elementos animados con `transform`, sin motor de física.

### 2.3 Dónde van: tres misiones por camino

| # | Plantilla | Palabras | Lugar | Ritmo |
| --- | --- | --- | --- | --- |
| 1 | `escucha-toca` | Grupo A | Claro A (hoy) | mirar + jugar |
| 2 | `listen-catch` | Grupo B | Claro B (hoy es `di-brilla`) | mirar + jugar |
| 3 | `di-brilla` | 5 elegidas de A y B, siempre con la palabra del vecino | Claro A, junto al habitante, al volver | decir |

**Por qué.** Cada palabra se oye y se juega antes de pedir que se diga (Krashen). El camino completo
sigue el orden mirar → jugar → decir (Bruner). La tercera misión ocurre donde vive el vecino ("Caro
quiere oírte"). Es una razón social para hablar (relación, Ryan y Deci), y el niño le habla a un
personaje, no a una prueba. No hace falta un claro nuevo, solo un segundo farol en el claro A.
Memory queda como repaso transversal en el pozo.

Palabras sugeridas para la misión 3 (5 cada una; la docente puede cambiarlas). Se evitan las más
difíciles de reconocer por voz (scissors, purple):

| Tema | Di y brilla |
| --- | --- |
| school | pencil, eraser, notebook, book, chair |
| colors | red, blue, green, pink, black |
| numbers | one, three, five, eight, ten |
| body | nose, eyes, mouth, hands, legs |
| family | hello, thank you, mother, father, grandmother |

Desarrollo: el reconocimiento debe aceptar "thank you", "thankyou" y "thanks", y "good morning" con o
sin espacio.

Estrellas: hoy el guion exige que la suma sea 50. Con 3 misiones por camino quedarían 3 + 3 + 3 por
camino (45) más la hora (5). Esto depende de la decisión de la sección 5.

---

## 3. Sesión diaria de unos 15 minutos

### 3.1 Duración estimada de cada misión (sin medir: a calibrar en el piloto)

| Misión | Cómo se calcula | Estimación |
| --- | --- | --- |
| Diálogo `antes` | 1 o 2 líneas con voz | 15 a 20 s |
| Escucha y toca (5 palabras) | Mirar 5 × 6 s = 30 s; jugar 5 × 10 a 12 s = 60 s | 2 a 2,5 min |
| Escucha y toca (6 palabras, la hora) | | 2,5 a 3 min |
| Di y brilla (5 palabras) | Ver y oír 3 s, micrófono 3 s, respuesta 2 s, algún reintento: 15 a 25 s por palabra | 2 a 3 min |
| Memory de 2 tableros con 4 parejas | Unos 10 a 12 giros por tablero × 4 s | 2,5 a 3,5 min |
| Memory de repaso (6 parejas) | | 2,5 a 3 min |
| Listen & Catch (5 palabras + 1) | Mirar 30 s; 6 rondas × 8 a 10 s | 2 a 2,5 min |
| Cierre y caritas | | 15 s |
| Caminar entre claros | | 30 a 60 s por trayecto |

Una sesión de 15 minutos alcanza para **3 misiones** más caminar, el saludo y el cierre. No conviene
poner 4: un niño de 8 años que va despacio se pasaría de 20 minutos.

### 3.2 Cómo se arma la sesión del día con el plan por semanas

- **Una semana es un tema, y cada tema es un camino del Bosque.** Lumi abre la sesión con "Hoy vamos
  al camino de los colores" y los faroles del día brillan en ese camino. El mapa sigue siendo el
  escenario y el niño puede caminar libre.
- **Autonomía.** Las misiones del día se pueden hacer en el orden que el niño elija. El repaso del
  pozo siempre es opcional.
- **Estructura de la sesión.** Saludo de Lumi con 2 palabras del día anterior (30 s), 2 o 3 misiones,
  y cierre de Lumi ("Hoy encendiste…"). Al terminar, las misiones nuevas se apagan hasta mañana; el
  álbum y el mapa siguen abiertos.

Semana tipo de 5 sesiones:

| Sesión | Ritmo | Bloques |
| --- | --- | --- |
| 1 | mirar | Escucha y toca A · Encargo del vecino · Escucha y toca B (versión de presentación) |
| 2 | jugar | Listen & Catch B · Memory `imagen-sonido` (A + B) |
| 3 | jugar → decir | Memory `imagen-palabra` · Di y brilla (A) |
| 4 | decir | Di y brilla (selección A + B) · Listen & Catch con las palabras de `repasar` |
| 5 | prueba | Memory de repaso corto (2 min) · Prueba del tema · Autoevaluación |

Si hay menos días (festivos), se respeta lo que el docente responde en "cuántas sesiones". **Nunca se
quitan el mirar ni el decir; lo primero que se quita es Memory.**

| Sesiones | Se juntan así |
| --- | --- |
| 5 | 1 · 2 · 3 · 4 · 5 |
| 4 | 1 · 2 · 3 + 4 (Memory `imagen-palabra` + Di y brilla A + B) · 5 |
| 3 | 1 · 2 + 4 (Listen & Catch + Di y brilla) · 5 |
| 2 | 1 · Di y brilla + prueba |
| 1 | Escucha y toca A + B + Di y brilla (sin prueba) |

La hora es un tema corto: 3 sesiones.

**Prueba del viernes.** Debe usar los formatos que el niño ya practicó, sin pistas: 6 ítems de "Escucha
y toca" y 3 de "Di y brilla", donde el intento cuenta. El niño ve "¡Terminaste!" y lo que encendió,
**nunca una nota**. La calificación la ve solo el docente y se traduce a la escala del colegio.

### 3.3 Formato de datos sugerido (ejemplo, no implementado)

En `cartilla.json`, dentro del territorio:

```json
{
  "temas": [
    {
      "id": "colors",
      "nombre": { "es": "Los colores", "en": "Colors" },
      "icono": "iconos/1f7e3.svg",
      "camino": ["bosque-colors", "bosque-colors-2", "bosque-colors-3"],
      "grupos": {
        "a": ["red", "blue", "green", "yellow", "orange"],
        "b": ["purple", "pink", "brown", "black", "white"],
        "decir": ["red", "blue", "green", "pink", "black"]
      }
    }
  ],
  "plantillas": {
    "escucha-toca": { "minutosEstimados": 2.5 },
    "listen-catch": { "minutosEstimados": 2.5, "distractores": [2, 2, 3, 3, 3, 3], "cruceSegundos": { "inicio": 6, "final": 4.5 } },
    "memory": { "minutosEstimados": 3, "tableros": [ { "parejas": 4, "forma": "imagen-sonido" }, { "parejas": 4, "forma": "imagen-palabra" } ] },
    "di-brilla": { "minutosEstimados": 2.5 }
  },
  "planSemana": {
    "minutosObjetivo": 15,
    "bloques": {
      "et-a":    { "plantilla": "escucha-toca", "grupo": "a" },
      "et-b":    { "plantilla": "escucha-toca", "grupo": "b" },
      "encargo": { "tipo": "encargo" },
      "lc-b":    { "plantilla": "listen-catch", "grupo": "b" },
      "lc-rep":  { "plantilla": "listen-catch", "grupo": "repasar", "respaldo": "b" },
      "me-son":  { "plantilla": "memory", "grupo": ["a", "b"], "tableros": [ { "parejas": 4, "forma": "imagen-sonido" } ] },
      "me-pal":  { "plantilla": "memory", "grupo": ["a", "b"], "tableros": [ { "parejas": 4, "forma": "imagen-palabra" } ] },
      "me-rep":  { "plantilla": "memory", "grupo": "repasar", "respaldo": ["a", "b"], "tableros": [ { "parejas": 6, "forma": "imagen-palabra" } ] },
      "db-a":    { "plantilla": "di-brilla", "grupo": "a" },
      "db-ab":   { "plantilla": "di-brilla", "grupo": "decir" },
      "prueba":  { "tipo": "prueba", "items": [ { "plantilla": "escucha-toca", "cantidad": 6, "pistas": false }, { "plantilla": "di-brilla", "cantidad": 3 } ] }
    },
    "porCantidad": {
      "5": [["et-a", "encargo", "et-b"], ["lc-b", "me-son"], ["me-pal", "db-a"], ["db-ab", "lc-rep"], ["me-rep", "prueba"]],
      "4": [["et-a", "encargo", "et-b"], ["lc-b", "me-son"], ["me-pal", "db-ab"], ["me-rep", "prueba"]],
      "3": [["et-a", "encargo", "et-b"], ["lc-b", "db-ab"], ["me-rep", "prueba"]],
      "2": [["et-a", "et-b"], ["db-ab", "prueba"]],
      "1": [["et-a", "et-b", "db-ab"]]
    }
  }
}
```

Lo que elige el docente **no va en la cartilla**, va en la base de datos por grupo:
`{ "grupo": "...", "tema": "colors", "sesiones": 4, "desde": "2027-02-08" }`.

Si se cambia un parámetro (número de distractores, parejas, velocidad), se cambia aquí, no en la
plantilla (regla 1).

---

## 4. Resumen para la familia

### 4.1 Qué dice

Una sola pantalla, imprimible (regla 9), con un botón 🔊 "Escuchar este resumen" en español para las
familias que leen poco. Cada palabra en inglés lleva su botón para oírla: así el adulto puede
acompañar aunque no sepa inglés.

1. **Lo que aprendió esta semana.** Tema e iconos de las palabras, en inglés, con la traducción y 🔊.
2. **Lo que repasó.** Misiones que volvió a jugar, y las palabras que antes le costaban y ahora le
   salen. Esto es lo primero que se muestra con fuerza: es el progreso del niño.
3. **Para seguir practicando.** Hasta 3 palabras de `repasar`. Nunca la lista completa.
4. **Días que practicó.** Solo si fue 1 o más ("Esta semana practicó 3 días"). Si fue 0, el bloque no
   aparece.
5. **Una idea para hacer juntos, si tienen un ratico** (opcional, ver 4.3).

### 4.2 Cómo se dice

- **Usted**, como se habla en Norte de Santander. Frases cortas, sin términos técnicos (nada de
  "vocabulario", "DBA", "competencia", "nivel A1").
- Para lo que costó: **"Palabras que todavía está aprendiendo"** o **"Para seguir practicando"**.
  Nunca: "le costó", "falló", "débil", "bajo", "no sabe", "errores", ni porcentajes, ni comparaciones
  con el grupo (regla 6).
- Siempre se abre con lo logrado y se cierra con la sugerencia.
- No se afirma lo que no está medido: nada de "su hijo mejoró su inglés gracias a…".

Ejemplo:

> **Esta semana Mika practicó 4 días.**
> Aprendió los colores en inglés: red (rojo) 🔊, blue (azul) 🔊, green (verde) 🔊…
> Volvió a jugar "More colors", y ahora ya le salen *purple* y *brown*.
> Palabras que todavía está aprendiendo: *white* 🔊, *pink* 🔊.
> Si tienen un ratico: jueguen a "Veo, veo un color" camino a la escuela. Usted no necesita saber
> inglés: él o ella le enseña.

Acceso: se llega desde el álbum, detrás de una puerta de adulto (por ejemplo, mantener pulsado 3 s).
Así no se convierte en algo que el niño mira como una nota (regla 8).

### 4.3 Actividad casera opcional por tema (5 minutos, sin materiales nuevos)

La idea común: **el niño le enseña al adulto**. El adulto no necesita saber inglés y el niño se siente
capaz (competencia, Ryan y Deci).

| Tema | Sugerencia |
| --- | --- |
| Útiles del salón | Al alistar la mochila por la noche, el niño saca cada cosa y la nombra en inglés. Si no se acuerdan, la oyen en la app. |
| Colores | "Veo, veo un color": en la casa, en la ropa, en las frutas del mercado o camino a la escuela. |
| Números | Contar en inglés lo que hay: escalones, arepas en la mesa, dedos. |
| Cuerpo | "Simón dice" (Simon says): el adulto lo dice en español y el niño se toca la parte y la dice en inglés. |
| Saludos y familia | Decir "Good morning" al levantarse y "Good night" al acostarse. Mirar fotos y nombrar quién es quién. |
| La hora | Cuando sea una hora en punto, preguntar "What time is it?" y el niño responde mirando el reloj o el celular. |

### 4.4 Qué más guardar (regla 7: lo mínimo)

Hoy se guarda `repasar`, `misiones` (`veces`, `mejorErrores`, `autoeval`, `mejoras`), `album`,
`ayudados` y `estrellas`. Faltan estos datos para el resumen, el docente y el piloto:

| Dato | Forma | Para qué |
| --- | --- | --- |
| `dias` | Lista de fechas `AAAA-MM-DD` (sin hora) | "Practicó N días" y la sesión del día |
| `superadas` | `[{ en, fecha }]`: palabras que salieron de `repasar` | "Ahora ya le salen…", que es el dato más positivo |
| Por misión: `primera`, `ultima` | Fecha | "Lo que repasó esta semana" |
| Por misión: `segundos` | Duración redondeada a 10 s, última vez y promedio | Calibrar la sesión de 15 minutos en el piloto |
| Por sesión: `tema`, `bloquesHechos` | Ids | Seguir el plan semanal |
| `di-brilla`: modo usado | Contadores `voz`, `escrito`, `dicho` | Saber cuántos niños tienen micrófono y si escriben. **Sin audio y sin el texto reconocido** |
| `prueba` | Aciertos por ítem, solo para el docente | Calificación del viernes |

**No se guarda:** audio, transcripciones del reconocedor (pueden contener otras voces de la casa),
hora exacta, ubicación, datos de la familia ni identificadores del aparato. Al cerrar el año escolar,
el detalle por misión se borra y queda solo el resumen. La autorización de los representantes (Ley
1581 de 2012, datos de menores) debe mencionar estos datos.

---

## 5. Decisión pendiente sobre las estrellas (la decide Manuel)

**Qué contradice hoy.** La regla 5 y la tesis dan estrellas por conducta: participar 10, completar 15,
pronunciar 10, colaborar 15, corregir y mejorar 15, autoevaluarse 10. El prototipo da 4 o 5 por
completar una misión, cambia "mejorar" por una medalla y no da nada por autoevaluarse. Lo positivo es
que tampoco premia aciertos sueltos.

**Opción A: actualizar la regla 5 al prototipo.** Es lo más simple y el puente se abre con justicia
(se completa todo). En contra: el piloto ya no probaría la escala de Mission Stars de la tesis, y
autoevaluarse y mejorar, que son conductas centrales de la estrategia, dejan de reconocerse con
estrellas.

**Opción B (recomendada): separar dos cosas, como Manuel ya anotó** ("los juegos tienen su propio
sistema de puntos, separado de Mission Stars").

- **Luz de los faroles.** Cada misión completada enciende su farol, y el puente se abre cuando todos
  los faroles del territorio brillan. Esto calza con la historia (Englishland recupera su luz), no
  depende del docente y nadie queda trancado porque su profesor no dio estrellas.
- **Mission Stars con la escala de la tesis, sin cambios.** La app da automáticamente: completar 15
  (la primera vez), pronunciar 10 (un intento en "Di y brilla", una vez por misión), corregir y
  mejorar 15 (rejugar con menos tropiezos, o una palabra que sale de `repasar`; una vez por misión) y
  autoevaluarse 10 (las caritas; una vez por misión y por día, para que no se acumulen rejugando). El
  docente da participar 10 y colaborar 15, y esas no cuentan para el puente. Las estrellas abren
  estelas y accesorios del personaje y se ven en el álbum y en el modo docente.

**Por qué B.** Mantiene intacta la estrategia que el piloto debe probar. Resuelve la pregunta
pendiente de si las estrellas del docente cuentan para el puente: no cuentan. Además le da un uso a
los encargos: ayudar a un vecino puede reconocerse como "colaborar" si el docente lo decide. Cambios
que exige: la tabla "Puerta" de `CLAUDE.md` pasaría a decir "todos los faroles"; el `assert` de suma
50 en `construir_bosque.py` se quita, y las estelas se recalibran (con B se ganan unas 50 estrellas
por misión).

**Si Manuel prefiere A,** al menos hay que volver a dar estrellas por autoevaluarse (aunque sean 1 o
2), para que esa conducta se siga reconociendo.

---

## 6. Guía de pronunciación

Revisión del diccionario `PRONUNCIA` (`herramientas/construir_bosque.py`, línea 180). El diccionario
aparece en "Di y brilla" en lugar de la palabra escrita.

**Reglas de escritura (para que sea coherente):**

1. **Las palabras de una sílaba van sin tilde**, como en español ("pan", "sol"): `red`, `uan`,
   `nain`. Hoy unas la llevan (`uán`, `éit`, `bráun`) y otras no (`red`, `blak`). En "ai", "au" y "ei"
   la vocal fuerte ya suena sola; la tilde no aporta y confunde a un niño que está aprendiendo a
   tildar.
2. **Las palabras de dos o más sílabas siempre llevan tilde en la sílaba fuerte y guion entre
   sílabas**, aunque en español no la llevarían: `pén-sil`, `ru-ler` → `rú-ler`. Así la tilde
   significa siempre "aquí se pega más fuerte".
3. **No se duplican vocales** (`griin`, `zrii`, `fiit`). Un niño de 8 años lee "gri-in" en dos
   sílabas, y la convención no se aplicaba igual en todas (`blu` y `tu` no la tenían). La duración la
   da el audio.
4. **`z` = el sonido "th".** En Colombia la z se lee como s, así que `zri` se leerá "sri". Se mantiene
   la `z` como señal de "lengua entre los dientes", pero esto hay que enseñarlo una vez: la docente lo
   modela en clase y Cosmo puede decirlo en la primera misión de voz. No hay letra del español que lo
   resuelva. Con `d` no pasa: "mó-der" leído en español ya suena casi igual que *mother*.
5. Las palabras de varias partes se separan con espacio (`gud mór-ning`, `uan o-klók`) y la `j` marca
   la h inglesa (`jed`, `je-lóu`). Ambas reglas están bien y no cambian.

**Palabras que cambian y palabras nuevas** (las que no aparecen aquí están bien como están):

| Palabra | Actual | Propuesta | Motivo |
| --- | --- | --- | --- |
| scissors | sí-sors | sí-sers | La segunda vocal es neutra, "er", no "o" (/ˈsɪzərz/). |
| purple | pér-pol | pér-pel | Misma vocal neutra; queda coherente con `rú-ler` y `sí-sers`. |
| green | griin | grin | Regla 3. |
| brown | bráun | braun | Regla 1. |
| white | uáit | uait | Regla 1. "uai" se lee bien, como en "Uruguay". |
| one | uán | uan | Regla 1. |
| three | zrii | zri | Reglas 3 y 4. |
| five | fáiv | faiv | Regla 1. |
| eight | éit | eit | Regla 1. |
| nine | náin | nain | Regla 1. |
| eyes | áis | ais | Regla 1. |
| ears | írs | irs | Regla 1. |
| nose | nóus | nous | Regla 1. |
| mouth | máuz | mauz | Regla 1 (la `z` final es el "th", regla 4). |
| feet | fiit | fit | Regla 3. |
| good night | gud náit | gud nait | Regla 1. |
| one o'clock | uán o-klók | uan o-klók | Regla 1 en "one". |
| three o'clock | zrii o-klók | zri o-klók | Reglas 3 y 4. |
| nine o'clock | náin o-klók | nain o-klók | Regla 1. |
| twelve o'clock | tuelv o-klók | tuelv o-klók | Sin cambio; se lista para confirmarla. |
| pen (nueva, reemplaza a *marker*) | — | pen | Si se mantiene *marker*, `már-ker` está bien. |
| goodbye (nueva, si se agrega) | — | gud-bái | Es una sola palabra en inglés de dos sílabas: va con guion y tilde. |
| bee (álbum) | — | bi | |
| bird (álbum) | — | berd | La "ir" inglesa suena "er". |
| butterfly (álbum) | — | bá-ter-flai | Sílaba fuerte al inicio. |
| frog (álbum) | — | frog | |
| owl (álbum) | — | aul | |
| It's three o'clock (campo `frase`, si se agrega) | — | its zri o-klók | Para la misión 2 de la hora. |

Nota para el desarrollador: los animales del álbum no pasan por `W` (se arman en `PAL` y `criatura`).
Para que reciban `pronuncia` hay que tomarla de `PRONUNCIA` también allí.

---

## 7. Qué registrar en el piloto

- **Antes.** Prueba corta imprimible: escuchar y señalar 10 palabras del Bosque con imagen, y decir 5
  palabras (el docente marca "lo intentó" y "se entiende"). Encuesta de agrado con caritas de 4 o 5
  ítems, leída en voz alta. Si se puede, un grupo de tercero que no use la plataforma, para comparar.
- **Durante.** Datos de la sección 4.4 (días, segundos por misión, `repasar`, `superadas`, modo de voz,
  estrellas por conducta). Lista de cotejo semanal del docente: participa, pide repetir, ayuda a un
  compañero. Incidencias: sin micrófono, sin conexión, celular lento.
- **Después.** La misma prueba y la misma encuesta. Entrevista breve con el docente y con 3 a 5
  familias sobre el resumen y la actividad casera. Hasta tener estos datos no se escribe ninguna
  afirmación de mejora.
