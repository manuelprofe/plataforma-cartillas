# Canciones de repaso del Bosque (espanglish)

Tres canciones de ~60 s para repasar **colores**, **números 1 a 10** y **cuerpo**, generadas con
ElevenLabs Music. Escritas con la regla de `ronda-2-docente.md` §5.2.

## Reglas que siguen las tres

| Regla | Cómo se cumple |
| --- | --- |
| Solo vocabulario del Bosque | Todas las palabras en inglés están en `PALABRAS` de `construir_bosque.py` (colores, números, cuerpo). Nada más: ni `count`, ni `again`, ni `touch`. |
| Cada palabra tiene apoyo | Gesto (TPR), imagen en pantalla y el objeto en español al lado ("el cielo", "mi nose"). |
| No se traduce enseguida (§5.2.5) | Nunca "red, o sea rojo". El sentido lo da el gesto o el objeto que se señala. |
| Artículo en español (§5.2.4) | "mi nose", "mis eyes", "el cielo es blue". |
| Palabra en inglés al final de frase o antes de pausa (§5.2.7) | Va sola, lenta, y **cada palabra se canta dos veces seguidas** para que se oiga clara. |
| Nada técnico ni evaluativo | Cantar es opcional; no se califica ni se graba al niño (regla 7). |

Nota para el generador: pedir "sing each English word slowly and clearly, never rushed". Revisar el
audio y regenerar si `eyes`, `ears`, `nine`, `ten` o `feet` no se entienden. Un solo intento por
canción; no repetir sin escuchar el resultado (cada generación gasta créditos).

---

## 1. Colores: "¡Red, blue, a cantar!"

**Palabras (10):** red, blue, green, yellow, orange, purple, pink, brown, black, white.

**Letra**

```
[Estrofa 1]
Miro el cielo grande: blue, blue.
Miro el pasto fresco: green, green.
Mi manzana madura: red, red.
La fruta jugosa: orange, orange.

[Coro]
Red, red, red, ¡busca algo red!
Blue, blue, blue, ¡busca algo blue!
Pink, pink, pink, ¡salta y dilo así!
¡Colores, colores, yo los canto aquí!

[Estrofa 2]
El sol de la mañana: yellow, yellow.
La uva del mercado: purple, purple.
El chocolate rico: brown, brown.
La noche tan oscura: black, black.
La nube de algodón: white, white.

[Coro]
Red, red, red, ¡busca algo red!
Blue, blue, blue, ¡busca algo blue!
Pink, pink, pink, ¡salta y dilo así!
¡Colores, colores, yo los canto aquí!
```

**Acciones (TPR)**

| Verso | Qué hace el niño |
| --- | --- |
| Estrofa 1 | Señala cada cosa: arriba (cielo), al suelo (pasto), una manzana imaginaria, redondea las manos (fruta). En el aula, toca un objeto de ese color. |
| Coro, líneas 1 y 2 | Toca un objeto del salón o de la casa del color nombrado. |
| Coro, línea 3 | Un salto en el sitio al decir `pink`. |
| Coro, línea 4 | Brazos abiertos, giro lento. |
| Estrofa 2 | Sol (círculo con los brazos), uva (puño), chocolate (se frota la barriga), noche (cierra los ojos), nube (manos suaves hacia arriba). |

**Estilo para el generador:** `Cheerful children's song, 96 BPM, soft Colombian-Latin feel, light acoustic guitar, tiple, soft hand percussion and shaker, warm young sing-along voice with a few kids joining the chorus, very clear slow pronunciation of the English words, gentle not loud, no heavy bass.`

**Por qué sirve:** entrada comprensible con filtro afectivo bajo (Krashen): el niño canta lo que ya oyó, sin que nadie lo evalúe. El coro repetido y el gesto sostienen la palabra (Bruner: enactivo, luego icónico con la imagen proyectada, luego simbólico al decirla).

**Docente (clase proyectada):** proyectar la letra con un círculo del color en cada palabra; primera vez solo escuchar y señalar, segunda vez cantar el coro, tercera con la estrofa. 5 minutos, al inicio o al final de la hora. Se puede imprimir la letra con los círculos de colores (regla 9).
**En casa:** la familia pone la canción y el niño busca en la casa cosas de cada color; sirve con el juego "Veo, veo un color" que ya sugiere la cartilla.

---

## 2. Números: "One, two, ¡tres dedos!"

**Palabras (10):** one, two, three, four, five, six, seven, eight, nine, ten.

**Letra**

```
[Estrofa 1]
Levanto un dedito: one, one.
Levanto otro dedito: two, two.
Levanto un tercero: three, three.
Levanto otro más: four, four.
Y la mano abierta: five, five.

[Coro]
One, two, three, four, five,
¡cuento con mis dedos, qué bien!
Six, seven, eight, nine, ten,
¡cuento otra vez, de uno a diez!

[Estrofa 2]
Abro la otra mano: six, six.
Un dedito arriba: seven, seven.
Dos deditos más: eight, eight.
Casi, casi todos: nine, nine.
Las dos manos abiertas: ten, ten.

[Coro]
One, two, three, four, five,
¡cuento con mis dedos, qué bien!
Six, seven, eight, nine, ten,
¡cuento otra vez, de uno a diez!
```

**Acciones (TPR)**

| Verso | Qué hace el niño |
| --- | --- |
| Estrofa 1 | Levanta un dedo por número, de la mano izquierda, uno a uno hasta cinco. |
| Coro, líneas 1 y 2 | Recorre los cinco dedos tocándolos con el índice al ritmo; en "qué bien", aplaude. |
| Estrofa 2 | Abre la otra mano y sube dedos de seis a diez (el gesto es el significado). |
| Coro, líneas 3 y 4 | Muestra los diez dedos en `ten` y los baja de nuevo al empezar. |

**Estilo para el generador:** `Upbeat children's counting song, 100 BPM, gentle cumbia-pop groove, soft guitar, bass marimba-like pluck, light guacharaca and claps, clear friendly young voice, each number sung slowly and distinctly, warm and not loud.`

**Por qué sirve:** el gesto de los dedos hace comprensible cada número sin traducirlo (Krashen) y lleva del cuerpo al símbolo (Bruner); el coro es una secuencia que el niño ya conoce.

**Docente:** de pie, todos muestran los dedos; una vez en silencio solo con la música, otra cantando. Tres minutos como calentamiento. Variante análoga: tarjetas del 1 al 10 en el tablero.
**En casa:** cantar en el camino o en la cocina; el adulto levanta los dedos y el niño los sigue. Sin pedir que "lo diga bien".

---

## 3. Cuerpo: "¡A mover el cuerpo!"

**Palabras (9):** eyes, ears, nose, mouth, head, arms, hands, legs, feet.

**Letra**

```
[Estrofa 1]
Con mis eyes miro, eyes, eyes.
Con mis ears escucho, ears, ears.
Con mi nose respiro, nose, nose.
Con mi mouth canto, mouth, mouth.

[Coro]
Head, head, ¡arriba, arriba!
Arms, arms, ¡a bailar, a bailar!
Hands, hands, ¡aplaudo así!
Legs, legs, feet, feet, ¡a caminar!

[Estrofa 2]
Muevo mi head, head, head.
Estiro mis arms, arms, arms.
Aplaudo con mis hands, hands, hands.
Doy un paso con mis legs, legs, legs.
Toco el suelo con mis feet, feet, feet.

[Coro]
Head, head, ¡arriba, arriba!
Arms, arms, ¡a bailar, a bailar!
Hands, hands, ¡aplaudo así!
Legs, legs, feet, feet, ¡a caminar!
```

Nota: aquí la parte del cuerpo no aparece también en español; el niño la entiende porque el
verbo y el gesto la señalan (§5.2.5, sin traducir). El posesivo va en español ("mis", "mi").

**Acciones (TPR)**

| Verso | Qué hace el niño |
| --- | --- |
| Estrofa 1 | Señala los ojos, las orejas, la nariz y la boca con el dedo en cada palabra. |
| Coro | `head` toca la cabeza y sube las manos; `arms` agita los brazos; `hands` aplaude; `legs` y `feet` marcha en el sitio. |
| Estrofa 2 | Hace el movimiento nombrado en cada verso y señala la parte en `head, arms, hands, legs, feet`. |

**Estilo para el generador:** `Playful kids' action song, 104 BPM, light vallenato-pop feel, soft accordion, acoustic guitar, hand drums and clapping, bright young voice with children echoing the chorus, English body words sung slowly and clearly, cheerful but gentle.`

**Por qué sirve:** es respuesta física total (Asher): el niño demuestra que entendió moviéndose, sin hablar (Krashen: producir cuando quiera); el cuerpo propio es el referente concreto (Bruner: enactivo).

**Docente:** de pie con espacio libre, proyectar las imágenes de las partes y marcar el gesto; los niños que prefieran solo moverse, pueden. Primero sin música, luego con ella. Se puede imprimir como cartel con las nueve partes.
**En casa:** "Simón dice" con la canción de fondo; el adulto señala una parte y el niño la dice si quiere, o solo la toca.

---

## Alineación y límites

| Punto | Estado |
| --- | --- |
| Estándares básicos de lenguas extranjeras (MEN), grados 1 a 3, escucha | Reconocer palabras y expresiones muy conocidas con apoyo de gestos e imágenes. Los DBA de inglés del MEN empiezan en grado 6, por lo que para tercero se cita el estándar, no un DBA. Confirmar la redacción exacta con Manuel antes de publicarla. |
| Peso de los audios | ~60 s a 64 kbps mono ≈ 0,5 MB cada una. No entran en la primera carga de 2 MB (regla 4): se descargan al abrir el tema y quedan guardadas para uso sin conexión. |
| Afirmaciones | Estas canciones se diseñaron, no se han medido en aula. No decir que mejoran el aprendizaje ni la motivación hasta que el piloto lo muestre. |
| Mission Stars | La canción no da estrellas por sí sola; el docente puede registrar "participar" (10) a quien cante o se mueva, sin exigir cantar. |

**Qué registrar en el piloto**

| Momento | Registro |
| --- | --- |
| Antes | Cuántos niños ya conocían las palabras del tema (conversación de 2 minutos). |
| Durante | Cuántos se mueven o cantan sin que se les pida; si repiten palabras sueltas; en qué verso se pierden. |
| Después | Si piden la canción otra vez o la cantan en el recreo; si una semana después reconocen la palabra al verla con imagen. |
