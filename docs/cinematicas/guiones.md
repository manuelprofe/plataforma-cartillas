# Cinemáticas del Bosque de los Sonidos: guiones y prompts para Veo

Para Manuel. Aquí está todo lo necesario para generar en Gemini (Veo) las tres cinemáticas del
territorio 1, unirlas y dejarlas listas para la plataforma:

- **A. Inicio**: Englishland, el bosque que pierde el color, Pixie y Lumi presentan la misión. 30 s.
- **B. Un camino recupera su luz**: una toma común más una toma final por tema. 12 s.
- **C. Se abre el puente al Valle de las Palabras**: celebración y llegada de Nova. 15 s.

Cada cinemática se hace dos veces: **vertical 9:16** (celular) y **horizontal 16:9**
(computador y proyector). El reproductor elige según la pantalla.

Complementa la sección 5 de `docs/diseno/ronda-1.md`. La tabla de formato y peso de la
sección 8 de este documento **reemplaza** a la de 5.3, que suponía video cuadrado.

---

## 0. Antes de empezar

### 0.1 Cómo se trabaja con Veo (y por qué así)

Veo hace clips de unos 8 segundos con imagen y sonido. Cada cinemática se arma con varias tomas
de 8 s recortadas en el editor. Hay cuatro decisiones que ahorran trabajo y dolores de cabeza.

1. **Veo hace la imagen, el ambiente y los efectos. Las voces se ponen en el editor.**
   Los prompts piden "sin voz". Así:
   - el texto de la narración es exactamente el de este guion;
   - cada personaje tiene la misma voz en todas las tomas (Veo inventa una voz distinta en
     cada clip);
   - cuando llegue la voz definitiva de la plataforma, se cambia la pista de voz sin volver a
     generar video.

   Si de todos modos quieres que Veo hable, cada toma con diálogo trae una línea
   "Audio, opción B" para reemplazar la línea `Audio:` del prompt.
2. **Sin música de Veo.** Cada clip traería una música distinta y se notarían los cortes.
   Basta con el ambiente del bosque y las campanitas mágicas. Si más adelante se quiere música,
   se pone una sola pista en el editor (ver 7.3).
3. **El niño no aparece.** El héroe que elige el niño (Tavi, Mika o Bruno) no sale en los videos.
   Así no hay que hacer tres versiones de cada uno. La cámara es el niño: los personajes lo miran
   y le hablan de tú.
4. **Las mismas descripciones fijas en todos los prompts.** Los bloques de la sección 1 se repiten
   palabra por palabra en todas las tomas. No los cambies: si cambia la descripción, el personaje
   cambia de cara entre tomas.

### 0.2 Cuántos clips hay que generar

| Cinemática | Tomas | Clips por orientación | Total (9:16 y 16:9) |
| --- | --- | --- | --- |
| A. Inicio | A1, A2, A3, A4 | 4 | 8 |
| B. Camino | B1 (común a los 5 caminos) + B2 (una por tema) | 1 + 5 = 6 | 12 |
| C. Puente | C1, C2 | 2 | 4 |
| **Total** | | **12** | **24** |

Cuenta con repetir cada toma una o dos veces hasta que salga bien: entre 40 y 60
generaciones. Tu plan de Gemini tiene un cupo diario de videos, así que conviene ir por orden:

1. **Todo en 9:16 primero**, porque el celular es lo principal.
2. Después, A y C en 16:9: son las que se proyectan en clase.
3. Por último, B en 16:9. Si se acaba el cupo, el reproductor puede mostrar la versión 9:16 en
   la pantalla ancha, centrada sobre el fondo de estrellas (sección 5.2 del documento de
   diseño). Se ve bien. Las demás opciones (recortar o estirar) se ven mal.

### 0.3 Preparar las imágenes de referencia

Las imágenes de los personajes tienen el fondo transparente y son pequeñas (140 a 280 px).
Algunas herramientas ponen el fondo transparente en negro, y eso confunde a Veo. Antes de
subirlas, conviértelas a PNG sobre fondo blanco y al cuádruple de tamaño. Guárdalas en una
carpeta tuya, **fuera del repositorio** (por ejemplo `referencias/`).

Con ffmpeg (una línea por imagen; funciona igual en Windows, Mac y Linux):

```bash
ffmpeg -i public/cartillas/ingles-3/personajes/pixie-wave.webp -filter_complex "[0]scale=iw*4:ih*4:flags=lanczos,format=rgba,split[a][b];[a]drawbox=c=white:t=fill[bg];[bg][b]overlay=format=auto,format=rgb24" -frames:v 1 referencias/pixie-wave.png
```

Sin ffmpeg: abre el `.webp` en Canva sobre una página blanca y descárgalo como PNG.

**Mejor todavía:** si los originales de Canva están a mayor tamaño (diseños de personajes
`MAHauU4SB-Y` y de habitantes `MAHauWDSNKA`), descárgalos de ahí sobre fondo blanco. Con más
detalle, Veo copia mejor.

Para la toma A1 se usa el mapa del bosque como primer cuadro, recortado a cada proporción:

```bash
ffmpeg -i public/cartillas/ingles-3/fondos/bosque-mapa.webp -vf "crop=1125:2000,scale=720:1280" referencias/mapa-9x16.png
ffmpeg -i public/cartillas/ingles-3/fondos/bosque-mapa.webp -vf "crop=2000:1125,scale=1280:720" referencias/mapa-16x9.png
```

Para que una toma continúe donde terminó la anterior, saca el último cuadro y súbelo como
primer cuadro de la siguiente:

```bash
ffmpeg -sseof -0.1 -i A1-9x16.mp4 -frames:v 1 -update 1 referencias/A1-final-9x16.png
```

### 0.4 Cómo subir las referencias

Depende de lo que permita tu cuenta (revisa qué opciones te muestra Gemini):

- **Si Gemini acepta una sola imagen**, la usa como **primer cuadro** del video. Para las tomas
  con personajes, arma ese cuadro en Canva: una página de 720 × 1280 (9:16) o 1280 × 720
  (16:9) con un fondo de bosque y encima los PNG de los personajes que pide la toma, en la
  posición que indica el encuadre. Cada toma trae su "Cuadro inicial sugerido".
- **Si aceptas varias imágenes como ingredientes** (en Flow, la herramienta de video de Google,
  se llama "Ingredients to video" y admite hasta 3), sube los PNG de los personajes tal cual.
  Por eso ninguna toma pide más de 3 personajes con referencia.

En las dos formas, el prompt va completo: la imagen fija la apariencia y el prompt fija lo que
pasa.

### 0.5 Reglas del mundo en video

- **Una palabra es una luz.** Cada palabra perdida se ve como un orbe dorado pequeño con halo,
  como una luciérnaga grande. Es lo mismo que el niño ve en el juego: luciérnagas, faroles,
  claros que se encienden.
- **Perder el color no es oscuridad.** Los colores se destiñen a un gris plateado azulado, como
  un dibujo a lápiz. El cielo sigue claro. No hay tormenta, ni noche, ni villano, ni nadie llora.
  Los personajes se ven curiosos y decididos, nunca tristes.
- **Lumi siempre brilla.** Donde llega su luz vuelve un poco de color. Es la esperanza visible.
- **Sin texto generado.** Ningún letrero, letra, número escrito ni subtítulo. Los números se
  muestran contando cosas (piedras que se encienden), nunca con cifras. Si hace falta un
  título, se pone en el editor con Baloo 2 (la letra de la plataforma).
- **Ninguna persona.** Solo los personajes del bosque.

---

## 1. Biblia visual: bloques fijos en inglés

Se copian **idénticos** dentro de cada prompt. Ya están incluidos en los prompts de las
secciones 3 a 5. Aquí están solos para consulta.

**STYLE**

```text
Style: bright, cozy 2D cartoon animation for young children, like a modern picture book come to life. Chunky rounded shapes, clean dark-brown outlines, soft painterly shading, glossy highlights, saturated candy colors (purple, teal, golden yellow, pink, leaf green). Gentle, smooth camera moves. Warm, safe, hopeful mood.
```

**WORLD**

```text
Setting: Englishland, the Forest of Sounds, a lush magical forest in daylight: round green and purple trees, glowing orange and violet mushrooms, round mossy stones, small blue ponds, sandy dirt paths, flowering bushes. In the central clearing there is a tiny village: mushroom-shaped cottages (one red cap with cream spots, one purple cap), a tree-stump cottage, a stone well with a purple roof, a log bench, a fruit cart with a red-and-white striped awning, and wooden lamp posts with hanging lanterns.
```

**WORD-LIGHTS**

```text
Word-lights: each word is a small glowing golden orb of light with a soft halo and a few sparkles, like a big friendly firefly.
```

**FADED** (solo en las tomas donde hay gris)

```text
Faded areas are not dark: their colors simply drain into soft silvery gray-blue, like a pencil sketch, while the sky stays light and calm.
```

**AVOID**

```text
Avoid: any written text, letters, numbers or symbols on screen, subtitles, captions, logos, watermarks; humans, human faces or children; scary, stormy, gloomy or sad imagery; tears; villains; fast or shaky camera; photorealism.
```

**Personajes.** Archivo de referencia entre paréntesis.

| Personaje | Referencia (ruta en el repositorio) | Descripción fija |
| --- | --- | --- |
| Pixie | `public/cartillas/ingles-3/personajes/pixie-wave.webp` | `Pixie: a small five-pointed star character, hot pink and magenta with golden-orange highlights and glitter speckles, wearing a clear glass bubble helmet with a light-blue rim, big shiny black eyes, rosy cheeks, wide happy smile; she flies fast and leaves a trail of rainbow sparkles.` |
| Lumi | `public/cartillas/ingles-3/personajes/lumi-wave.webp` (también `lumi-point.webp`, `lumi-celebrate.webp`) | `Lumi: a small five-pointed star character, bright golden yellow turning orange at the tips, always softly glowing with tiny sparkles around her, wearing a clear round glass bubble helmet, big shiny black eyes, rosy cheeks, open happy smile; she floats gently.` |
| Cosmo | `public/cartillas/ingles-3/personajes/cosmo-wave.webp` (también `cosmo-point.webp`) | `Cosmo: a small round planet character with a sparkly purple-lavender surface, a glossy light-blue ring tilted around his middle like Saturn, a thin clear glass dome on top, big shiny black eyes, rosy pink cheeks, small kind smile, one tiny purple hand; he floats, no legs.` |
| Nova | `public/cartillas/ingles-3/personajes/nova-ready.webp` | `Nova: a small comet character: a round glowing head in yellow, orange and pink inside a clear glass bubble helmet, big shiny black eyes, rosy cheeks, confident smile, one little fist forward like a superhero, and a long flowing rainbow tail (orange, pink, yellow, blue, purple) full of sparkles.` |
| Tito | `public/cartillas/ingles-3/personajes/vecino-1.webp` | `Tito: a small mushroom villager with a big red cap with white spots, a round cream-colored body and face, big brown eyes, rosy cheeks, a little cape of green leaves and a small brown satchel; he walks on two short legs.` |
| Púa | `public/cartillas/ingles-3/personajes/vecino-2.webp` | `Pua: a small round hedgehog villager with a light-brown face, spiky brown quills, big brown eyes, rosy cheeks, a red knitted scarf, carrying a woven basket full of berries and fruit.` |
| Abu | `public/cartillas/ingles-3/personajes/vecino-3.webp` | `Abu: a kind old turtle villager with green skin, round brown glasses, a brown shell, a wooden walking stick and a brown shoulder bag, standing upright, gentle smile.` |
| Nuez | `public/cartillas/ingles-3/personajes/vecino-4.webp` | `Nuez: a cheerful squirrel baker with orange-red fur, a big fluffy tail, a white chef hat, a cream apron with an acorn on the pocket, a wooden spoon in one hand and a round bread bun in the other.` |
| Caro | `public/cartillas/ingles-3/personajes/vecino-5.webp` | `Caro: a gentle light-green snail villager with two antennae, a straw sun hat with white flowers, a shell shaped like a tiny cottage with a red roof and a chimney, carrying a small glowing lantern and a brown satchel; she moves slowly.` |
| Rayo | `public/cartillas/ingles-3/personajes/vecino-6.webp` | `Rayo: a friendly raccoon mail carrier with gray fur, a black eye mask, a striped tail, a blue postal jacket, a blue cap with a gold badge, and a brown mail bag full of blank envelopes.` |

Pixie y Lumi son las dos estrellas: Pixie es **rosada**, Lumi es **amarilla**. Es lo primero
que Veo confunde; revísalo en cada toma.

---

## 2. Encuadre: 9:16 y 16:9

Cada prompt trae una línea `Framing:` para 9:16. Debajo está la línea que la reemplaza para
16:9; el resto del prompt no cambia. Reglas comunes:

| | 9:16 (celular) | 16:9 (computador y proyector) |
| --- | --- | --- |
| Composición | Un protagonista por toma en el centro; si hay dos, uno encima del otro o uno más cerca de la cámara. Planos medios y cercanos. | Plano más abierto: personajes en los tercios izquierdo y derecho, más bosque alrededor. Se lee desde el fondo del salón. |
| Zona libre | Esquina **superior derecha** sin nada importante: ahí va el botón de saltar (56 px). Lo importante, dentro del 80 % central del ancho, por si el celular recorta los lados. | Esquina superior derecha libre, igual. |
| Movimiento de cámara | Más vertical: subir, bajar, acercarse. | Más lateral: paneos y travellings suaves. |

---

## 3. Cinemática A: Inicio (30 s)

**Cuándo:** después de elegir personaje, antes de la primera escena de Pixie. Solo la primera
vez, con botón de saltar. Queda en Recuerdos como **"Así empezó todo"**.
**Archivos finales:** `videos/inicio-bosque-9x16.mp4`, `videos/inicio-bosque-16x9.mp4`.
**Escena de respaldo:** `intro` (ya existe).

| Toma | Tiempo | Qué se ve | Qué se oye | Narración exacta |
| --- | --- | --- | --- | --- |
| A1 | 0–7 s | El bosque desde arriba, lleno de color. La cámara baja hacia la aldea. Orbes dorados flotan sobre cada cosa: flores, faroles, frutas. | Brisa, pájaros, campanitas suaves. | **Pixie** (fuera de cuadro): "Esta es Englishland. Aquí cada cosa tiene una palabra... y cada palabra brilla." |
| A2 | 7–14 s | Las luces se sueltan y suben despacio como semillas de diente de león. Detrás de ellas, el color se destiñe a gris plateado, de afuera hacia el centro. Los faroles quedan con una chispita. | La brisa sigue, más suave. Un "fiuuu" al subir las luces. Los pájaros callan; queda un grillo. | **Pixie** (fuera de cuadro): "Un día, las palabras se fueron volando... y el bosque empezó a perder su color." |
| A3 | 14–22 s | En el claro gris entra Pixie volando con estela de arcoíris y se detiene frente a la cámara. Lumi llega flotando a su lado. Donde cae la luz de Lumi, el pasto recupera algo de verde. | "Swoosh" de Pixie, campanita cálida de Lumi. | **Pixie**: "¡Hola! Soy Pixie. Y ella es Lumi: su luz nunca se apaga." **Lumi**: "¡Hola!" |
| A4 | 22–30 s | Junto a un farol gris y a Tito, sin color. Un orbe dorado baja y entra al farol. El farol se enciende, una ola de color sale en círculo y Tito recupera su sombrero rojo y sonríe. Pixie y Lumi miran a la cámara. | Campanita ascendente al encenderse, "plin" de Tito. | **Pixie**: "Escucha, juega y habla en inglés: cada palabra devuelve la luz." **Lumi**: "¡Vamos juntos!" |

### A1. Englishland con color (0–7 s)

- **Primer cuadro:** `referencias/mapa-9x16.png` (o `mapa-16x9.png`), recortado de
  `public/cartillas/ingles-3/fondos/bosque-mapa.webp`.
- **Recorte en el editor:** usar del segundo 0,5 al 7,5.

```text
Style: bright, cozy 2D cartoon animation for young children, like a modern picture book come to life. Chunky rounded shapes, clean dark-brown outlines, soft painterly shading, glossy highlights, saturated candy colors (purple, teal, golden yellow, pink, leaf green). Gentle, smooth camera moves. Warm, safe, hopeful mood.
Setting: Englishland, the Forest of Sounds, a lush magical forest in daylight: round green and purple trees, glowing orange and violet mushrooms, round mossy stones, small blue ponds, sandy dirt paths, flowering bushes. In the central clearing there is a tiny village: mushroom-shaped cottages (one red cap with cream spots, one purple cap), a tree-stump cottage, a stone well with a purple roof, a log bench, a fruit cart with a red-and-white striped awning, and wooden lamp posts with hanging lanterns.
Word-lights: each word is a small glowing golden orb of light with a soft halo and a few sparkles, like a big friendly firefly.
Shot: start from this top-down map of the forest. The camera slowly descends and tilts from a bird's-eye view into a three-quarter view of the central clearing and its village. The forest is full of color. Dozens of golden word-lights float gently above everything: above flowers, lanterns, the fruit cart, the well, the mushrooms.
Camera: one slow, smooth descending tilt, ending on the village.
Light: sunny late morning, soft warm light, sparkles in the air.
Motion: leaves sway, butterflies flutter, word-lights bob softly up and down.
Audio: gentle forest ambience with a light breeze and birdsong, soft magical chimes. No music. No speech, no voiceover, no singing.
Framing: vertical 9:16. Keep the village in the center of the frame; the top-right corner holds only sky and treetops.
Avoid: any written text, letters, numbers or symbols on screen, subtitles, captions, logos, watermarks; humans, human faces or children; scary, stormy, gloomy or sad imagery; tears; villains; fast or shaky camera; photorealism.
```

**16:9:** `Framing: horizontal 16:9. A wide view: the village in the center, paths leading out to the left and right; the top-right corner holds only treetops.`

### A2. Las palabras se van volando (7–14 s)

- **Primer cuadro:** el último cuadro de A1 (`referencias/A1-final-9x16.png`, ver 0.3).
  Así la toma empieza exactamente donde terminó la anterior.
- **Recorte:** del segundo 0 al 7.

```text
Style: bright, cozy 2D cartoon animation for young children, like a modern picture book come to life. Chunky rounded shapes, clean dark-brown outlines, soft painterly shading, glossy highlights, saturated candy colors (purple, teal, golden yellow, pink, leaf green). Gentle, smooth camera moves. Warm, safe, hopeful mood.
Setting: Englishland, the Forest of Sounds, a lush magical forest in daylight: round green and purple trees, glowing orange and violet mushrooms, round mossy stones, small blue ponds, sandy dirt paths, flowering bushes. In the central clearing there is a tiny village: mushroom-shaped cottages (one red cap with cream spots, one purple cap), a tree-stump cottage, a stone well with a purple roof, a log bench, a fruit cart with a red-and-white striped awning, and wooden lamp posts with hanging lanterns.
Word-lights: each word is a small glowing golden orb of light with a soft halo and a few sparkles, like a big friendly firefly.
Faded areas are not dark: their colors simply drain into soft silvery gray-blue, like a pencil sketch, while the sky stays light and calm.
Shot: continue from this image of the village. One by one, the golden word-lights let go of the objects and drift slowly up into the sky like dandelion seeds carried by the breeze. Behind each departing light, the color of the forest gently fades into soft silvery gray-blue, starting at the edges of the frame and moving toward the center. The lanterns dim but each keeps one tiny warm spark. The mood is calm and curious, not sad.
Camera: very slow push-in toward the central lamp post.
Light: the sunlight stays soft and bright; only the colors fade.
Motion: lights drift up in gentle spirals; leaves keep swaying slowly.
Audio: soft breeze, a gentle airy whoosh as the lights rise, birdsong fades away, one cricket remains. No music. No speech, no voiceover, no singing.
Framing: vertical 9:16. The rising lights go up through the center of the frame; the top-right corner stays calm and empty.
Avoid: any written text, letters, numbers or symbols on screen, subtitles, captions, logos, watermarks; humans, human faces or children; scary, stormy, gloomy or sad imagery; tears; villains; fast or shaky camera; photorealism.
```

**16:9:** `Framing: horizontal 16:9. Wide view of the village; the lights rise across the whole frame from left to right; the top-right corner stays calm and empty.`

### A3. Llegan Pixie y Lumi (14–22 s)

- **Referencias:** `public/cartillas/ingles-3/personajes/pixie-wave.webp` y
  `public/cartillas/ingles-3/personajes/lumi-wave.webp` (como PNG, ver 0.3).
- **Cuadro inicial sugerido** (si solo se sube una imagen): claro gris plateado con un farol;
  Pixie entrando por la izquierda, pequeña y lejos; Lumi abajo a la derecha, más cerca.
- **Recorte:** del segundo 0 al 8.

```text
Style: bright, cozy 2D cartoon animation for young children, like a modern picture book come to life. Chunky rounded shapes, clean dark-brown outlines, soft painterly shading, glossy highlights, saturated candy colors (purple, teal, golden yellow, pink, leaf green). Gentle, smooth camera moves. Warm, safe, hopeful mood.
Setting: Englishland, the Forest of Sounds, a lush magical forest in daylight: round green and purple trees, glowing orange and violet mushrooms, round mossy stones, small blue ponds, sandy dirt paths, flowering bushes. In the central clearing there is a tiny village: mushroom-shaped cottages (one red cap with cream spots, one purple cap), a tree-stump cottage, a stone well with a purple roof, a log bench, a fruit cart with a red-and-white striped awning, and wooden lamp posts with hanging lanterns.
Faded areas are not dark: their colors simply drain into soft silvery gray-blue, like a pencil sketch, while the sky stays light and calm.
Pixie: a small five-pointed star character, hot pink and magenta with golden-orange highlights and glitter speckles, wearing a clear glass bubble helmet with a light-blue rim, big shiny black eyes, rosy cheeks, wide happy smile; she flies fast and leaves a trail of rainbow sparkles.
Lumi: a small five-pointed star character, bright golden yellow turning orange at the tips, always softly glowing with tiny sparkles around her, wearing a clear round glass bubble helmet, big shiny black eyes, rosy cheeks, open happy smile; she floats gently.
Shot: the village clearing is faded to silvery gray-blue. Pixie zooms in from the left with a rainbow sparkle trail, does a happy loop and stops in front of the camera, waving at the viewer. Lumi floats in calmly beside her. Wherever Lumi's warm glow touches the ground, the grass and a few flowers turn green and colorful again in a soft circle. Pixie talks happily toward the camera, her mouth moving as she speaks, but no voice is heard. At the end Lumi waves at the camera.
Camera: medium shot at the characters' eye level, a gentle drift toward them as Pixie stops.
Light: soft daylight; Lumi is the warmest light in the scene.
Motion: Pixie's sparkle trail fades slowly; Lumi bobs softly.
Audio: soft breeze, a bright sparkly whoosh when Pixie arrives, a warm chime when Lumi's glow brings color back. No music. No speech, no voiceover, no singing.
Framing: vertical 9:16. Pixie in the upper middle, Lumi lower and slightly closer to the camera; both inside the central 80% of the width; the top-right corner stays empty.
Avoid: any written text, letters, numbers or symbols on screen, subtitles, captions, logos, watermarks; humans, human faces or children; scary, stormy, gloomy or sad imagery; tears; villains; fast or shaky camera; photorealism.
```

**16:9:** `Framing: horizontal 16:9. Pixie on the left third, Lumi on the right third, the gray village between and behind them; the top-right corner stays empty.`

**Audio, opción B** (si Veo pone las voces): `Audio: soft breeze, a sparkly whoosh when Pixie arrives. Pixie says in Latin American Spanish, with a bright, warm, cheerful young female voice: "¡Hola! Soy Pixie. Y ella es Lumi: su luz nunca se apaga." Then Lumi says softly and warmly in Spanish: "¡Hola!" No music.`

### A4. Así se recupera la luz (22–30 s)

- **Referencias:** `public/cartillas/ingles-3/personajes/pixie-wave.webp`,
  `public/cartillas/ingles-3/personajes/lumi-point.webp`,
  `public/cartillas/ingles-3/personajes/vecino-1.webp` (Tito).
- **Cuadro inicial sugerido:** farol en el centro, Tito al pie del farol (desaturado en Canva
  con el ajuste de saturación al mínimo), Pixie y Lumi a los lados, más cerca de la cámara.
- **Recorte:** del segundo 0 al 8. Es el final: deja 0,5 s quietos al terminar.

```text
Style: bright, cozy 2D cartoon animation for young children, like a modern picture book come to life. Chunky rounded shapes, clean dark-brown outlines, soft painterly shading, glossy highlights, saturated candy colors (purple, teal, golden yellow, pink, leaf green). Gentle, smooth camera moves. Warm, safe, hopeful mood.
Setting: Englishland, the Forest of Sounds, a lush magical forest in daylight: round green and purple trees, glowing orange and violet mushrooms, round mossy stones, small blue ponds, sandy dirt paths, flowering bushes. In the central clearing there is a tiny village: mushroom-shaped cottages (one red cap with cream spots, one purple cap), a tree-stump cottage, a stone well with a purple roof, a log bench, a fruit cart with a red-and-white striped awning, and wooden lamp posts with hanging lanterns.
Word-lights: each word is a small glowing golden orb of light with a soft halo and a few sparkles, like a big friendly firefly.
Faded areas are not dark: their colors simply drain into soft silvery gray-blue, like a pencil sketch, while the sky stays light and calm.
Pixie: a small five-pointed star character, hot pink and magenta with golden-orange highlights and glitter speckles, wearing a clear glass bubble helmet with a light-blue rim, big shiny black eyes, rosy cheeks, wide happy smile; she flies fast and leaves a trail of rainbow sparkles.
Lumi: a small five-pointed star character, bright golden yellow turning orange at the tips, always softly glowing with tiny sparkles around her, wearing a clear round glass bubble helmet, big shiny black eyes, rosy cheeks, open happy smile; she floats gently.
Tito: a small mushroom villager with a big red cap with white spots, a round cream-colored body and face, big brown eyes, rosy cheeks, a little cape of green leaves and a small brown satchel; he walks on two short legs.
Shot: in the gray clearing, Tito stands faded to silvery gray next to a gray wooden lamp post, looking up with curiosity. Lumi points up. A single golden word-light floats down from the sky and slips into the lantern. The lantern lights up warmly and a soft ring of color spreads out in a circle across the grass. Tito's cap turns bright red again, his whole body regains its colors, and he hops with joy. Pixie and Lumi turn to the camera and smile; Pixie talks happily toward the camera, mouth moving, but no voice is heard. End on a calm, happy frame.
Camera: static medium-wide shot, a slight push-in when the lantern lights.
Light: soft daylight; a warm golden burst from the lantern.
Motion: the ring of color spreads smoothly; flowers pop open inside it.
Audio: a rising magical chime as the lantern lights, a soft whoosh of color spreading, a happy little bloop when Tito hops, gentle birdsong returning. No music. No speech, no voiceover, no singing.
Framing: vertical 9:16. Lamp post and Tito in the center; Pixie and Lumi in the lower third, closer to the camera; the top-right corner stays empty.
Avoid: any written text, letters, numbers or symbols on screen, subtitles, captions, logos, watermarks; humans, human faces or children; scary, stormy, gloomy or sad imagery; tears; villains; fast or shaky camera; photorealism.
```

**16:9:** `Framing: horizontal 16:9. Lamp post and Tito in the center; Pixie on the left third and Lumi on the right third, slightly closer to the camera; the top-right corner stays empty.`

**Audio, opción B:** `... Pixie says in Latin American Spanish, bright and cheerful: "Escucha, juega y habla en inglés: cada palabra devuelve la luz." Then Lumi says warmly in Spanish: "¡Vamos juntos!" No music.`

---

## 4. Cinemática B: Un camino recupera su luz (12 s)

**Cuándo:** al volver al mundo después de la segunda misión de un camino, 1,2 s después de que
el claro se enciende (sección 5.1 del documento de diseño). Una por camino, solo la primera vez.
**Estructura:** B1 (5 s, la misma en los cinco caminos) + B2 (7 s, distinta por tema).
Generar B1 una sola vez por orientación ahorra cupo, y todas las celebraciones empiezan
igual, así el niño reconoce el momento.

| Toma | Tiempo | Qué se ve | Qué se oye | Narración exacta |
| --- | --- | --- | --- | --- |
| B1 | 0–5 s | Un claro gris con un farol. Un remolino de orbes dorados baja del cielo y entra al farol. Sale una ola de color: el pasto se pone verde, se abren flores, se encienden los hongos. | Campanitas que suben, "fiuuu" de color, pájaros que vuelven. | **Lumi** (fuera de cuadro): "¡Lo lograste! ¡El camino brilla otra vez!" |
| B2 | 5–12 s | El vecino del camino, a todo color, celebra con los objetos del tema, que brillan. Ver tabla. | Efectos del tema (tabla). | El vecino dice sus palabras **en inglés** (tabla). |

### B1. La luz vuelve al claro (común)

- **Referencia:** `public/cartillas/ingles-3/mundo/objeto-4.webp` (el farol del juego).
- **Recorte:** del segundo 1 al 6.

```text
Style: bright, cozy 2D cartoon animation for young children, like a modern picture book come to life. Chunky rounded shapes, clean dark-brown outlines, soft painterly shading, glossy highlights, saturated candy colors (purple, teal, golden yellow, pink, leaf green). Gentle, smooth camera moves. Warm, safe, hopeful mood.
Setting: Englishland, the Forest of Sounds, a lush magical forest in daylight: round green and purple trees, glowing orange and violet mushrooms, round mossy stones, small blue ponds, sandy dirt paths, flowering bushes.
Word-lights: each word is a small glowing golden orb of light with a soft halo and a few sparkles, like a big friendly firefly.
Faded areas are not dark: their colors simply drain into soft silvery gray-blue, like a pencil sketch, while the sky stays light and calm.
Shot: a small round forest clearing at the end of a sandy path, faded to silvery gray-blue, with one wooden lamp post holding a hanging lantern in the middle. A swirl of golden word-lights spirals down from the sky and flows into the lantern. The lantern bursts into warm light and a wave of color sweeps out in a circle: the grass turns bright green, flowers pop open in pink and yellow, mushrooms start glowing orange and violet, the trees regain their green and purple. Sparkles float in the air.
Camera: starts slightly high, then a gentle downward glide toward the lantern as it lights.
Light: soft daylight, a warm golden burst from the lantern.
Motion: smooth spiral of lights; the color wave spreads in about two seconds.
Audio: rising magical chimes, a soft whoosh as the color spreads, birdsong returning. No music. No speech, no voiceover, no singing.
Framing: vertical 9:16. Lamp post centered; the color wave reaches the edges of the frame; the top-right corner stays free of important action.
Avoid: any written text, letters, numbers or symbols on screen, subtitles, captions, logos, watermarks; humans, human faces or children; scary, stormy, gloomy or sad imagery; tears; villains; fast or shaky camera; photorealism.
```

**16:9:** `Framing: horizontal 16:9. Lamp post centered in a wide view of the clearing; the color wave rolls out to the left and right edges; the top-right corner stays free of important action.`

### B2. Toma final por tema

El prompt de B2 es el mismo para los cinco caminos. Solo cambian tres partes: el vecino
(su línea de la biblia, sección 1), `Shot:` y `Audio:`. Aquí está completo para el camino de los
útiles; para los demás, cambia esas tres líneas según la tabla.

| Camino (misiones) | Vecino y referencia | Qué se ve | Efectos | El vecino dice (voz en inglés) | Archivo final |
| --- | --- | --- | --- | --- | --- |
| Útiles (`bosque-school`, `-2`) | Caro, `public/cartillas/ingles-3/personajes/vecino-5.webp` | Lápices, cuadernos, reglas, libros y crayones brillantes giran despacio alrededor de Caro, que levanta su farolito. | Campanitas, papel que pasa páginas. | "Pencil! Book! Ruler!" | `videos/camino-school-<orientación>.mp4` |
| Colores (`bosque-colors`, `-2`) | Tito, `.../personajes/vecino-1.webp` | Mariposas y pétalos de rojo, azul, amarillo, verde, naranja y morado salen en espiral; el sombrero de Tito brilla rojo. | Aleteo de mariposas, "plin" por color. | "Red! Blue! Yellow!" | `videos/camino-colors-<orientación>.mp4` |
| Números (`bosque-numbers`, `-2`) | Abu, `.../personajes/vecino-3.webp` | Cinco piedras redondas del camino se encienden de una en una cuando Abu las toca con su bastón. **Sin cifras.** | "Tok" de bastón y una nota más alta por cada piedra. | "One, two, three, four, five!" | `videos/camino-numbers-<orientación>.mp4` |
| Cuerpo (`bosque-body`, `-2`) | Púa, `.../personajes/vecino-2.webp` | Púa baila: se toca la cabeza, se tapa los ojos y los destapa, se toca la nariz; las bayas de su canasta brillan. | Pasos de baile, "boing" alegre. | "Head! Eyes! Nose!" | `videos/camino-body-<orientación>.mp4` |
| Saludos y familia (`bosque-family`, `-2`) | Nuez, `.../personajes/vecino-4.webp` | En la puerta de su casa de tronco, Nuez saluda con la cuchara; pan calientito con vapor dorado; se encienden los faroles de la casa. | Campanita de puerta, vapor suave. | "Hello! Good morning!" | `videos/camino-family-<orientación>.mp4` |

Los vecinos dicen solo palabras en inglés, con una voz en inglés. Así el niño oye la palabra
bien pronunciada, y la voz española de Lumi en B1 ya dijo lo demás.

**Prompt completo, camino de los útiles (Caro):**

- **Referencia:** `public/cartillas/ingles-3/personajes/vecino-5.webp`.
- **Recorte:** del segundo 0,5 al 7,5.

```text
Style: bright, cozy 2D cartoon animation for young children, like a modern picture book come to life. Chunky rounded shapes, clean dark-brown outlines, soft painterly shading, glossy highlights, saturated candy colors (purple, teal, golden yellow, pink, leaf green). Gentle, smooth camera moves. Warm, safe, hopeful mood.
Setting: Englishland, the Forest of Sounds, a lush magical forest in daylight: round green and purple trees, glowing orange and violet mushrooms, round mossy stones, small blue ponds, sandy dirt paths, flowering bushes.
Word-lights: each word is a small glowing golden orb of light with a soft halo and a few sparkles, like a big friendly firefly.
Caro: a gentle light-green snail villager with two antennae, a straw sun hat with white flowers, a shell shaped like a tiny cottage with a red roof and a chimney, carrying a small glowing lantern and a brown satchel; she moves slowly.
Shot: in a bright, colorful forest clearing, Caro raises her little lantern happily. Around her, glowing school objects float up out of golden word-lights and circle slowly: a yellow pencil, a notebook, a wooden ruler, a red book, colorful crayons. Caro looks at the camera and smiles, her mouth moving as if she speaks, but no voice is heard.
Camera: medium shot at Caro's eye level, a slow gentle orbit around her.
Light: warm daylight with sparkles; the objects glow softly.
Motion: objects turn slowly as they float; Caro sways her lantern.
Audio: soft magical chimes, the light flutter of notebook pages, birdsong. No music. No speech, no voiceover, no singing.
Framing: vertical 9:16. Caro centered in the lower half, the floating objects around and above her; the top-right corner stays free of important action.
Avoid: any written text, letters, numbers or symbols on screen, subtitles, captions, logos, watermarks; humans, human faces or children; scary, stormy, gloomy or sad imagery; tears; villains; fast or shaky camera; photorealism.
```

**16:9:** `Framing: horizontal 16:9. Caro slightly left of center, the floating objects circling into the right half of the frame; the top-right corner stays free of important action.`

**Líneas `Shot:` y `Audio:` para los otros cuatro caminos** (más la línea del vecino tomada de
la sección 1):

- **Colores (Tito):**
  `Shot: in a bright, colorful forest clearing, Tito spins with joy as butterflies and flower petals in red, blue, yellow, green, orange and purple swirl up around him in a spiral; his red cap glows. Tito looks at the camera and smiles, his mouth moving as if he speaks, but no voice is heard.`
  `Audio: fluttering butterfly wings, a soft bright chime for each new color, birdsong. No music. No speech, no voiceover, no singing.`
- **Números (Abu):**
  `Shot: on a sandy forest path, Abu walks slowly past five round mossy stepping stones in a row. He taps each stone with his walking stick, one after another, and each stone lights up with a warm golden glow, five in total. The stones show no numbers or marks. At the end Abu turns to the camera and smiles, his mouth moving as if he speaks, but no voice is heard.`
  `Audio: a soft wooden tap for each stone followed by a musical note that rises one step each time, five notes in total, birdsong. No music. No speech, no voiceover, no singing.`
- **Cuerpo (Púa):**
  `Shot: in a bright, colorful forest clearing, Pua sets down her basket of glowing berries and does a happy little dance: she touches her head, covers her eyes and uncovers them, touches her nose, then spins. Her mouth moves as if she speaks, but no voice is heard.`
  `Audio: light bouncy footsteps, a playful boing, soft chimes, birdsong. No music. No speech, no voiceover, no singing.`
- **Saludos y familia (Nuez):**
  `Shot: at the round door of a cozy tree-stump cottage, Nuez waves hello with her wooden spoon at the camera, holding a warm bread bun with golden steam rising from it. The little lanterns of her cottage light up one by one. Her mouth moves as if she speaks, but no voice is heard.`
  `Audio: a small door bell, a soft puff of warm steam, gentle chimes, birdsong. No music. No speech, no voiceover, no singing.`

**Escena de respaldo:** para B no hace falta una nueva. Si el video no carga, basta con la
celebración que ya existe al volver al mundo.

---

## 5. Cinemática C: Se abre el puente al Valle de las Palabras (15 s)

**Cuándo:** al llegar al puente con las 50 estrellas, en lugar de la escena `puente-abierto`, que
pasa a ser su respaldo. Queda en Recuerdos como **"El puente al Valle"**.
**Archivos finales:** `videos/puente-valle-9x16.mp4`, `videos/puente-valle-16x9.mp4`.

| Toma | Tiempo | Qué se ve | Qué se oye | Narración exacta |
| --- | --- | --- | --- | --- |
| C1 | 0–7 s | La aldea toda encendida, con banderines de hojas. Cosmo, Lumi y Pixie saltan y giran adelante; detrás, los seis vecinos celebran: Nuez reparte pan, Rayo lanza sobres en blanco al aire, Abu aplaude. | Celebración: campanitas, aplausos suaves, un "¡yupi!" sin palabras. | **Cosmo**: "¡El bosque brilla otra vez! ¡Gracias!" **Todos**: "Hooray!" |
| C2 | 7–15 s | El río y el puente de tablas. Las tablas se encienden una por una hacia la otra orilla. Allá llega Nova volando con su cola de arcoíris, se detiene y saluda con el puño adelante. | Notas que suben con cada tabla, "swoosh" de cometa, campanita final. | **Nova**: "¡Hola! Soy Nova. ¡Te espero en el Valle de las Palabras!" |

Idioma: el guion queda en español, como pediste para el Bosque. Ojo: según `idiomaPorAvance`,
cuando el niño completa el bosque la historia ya va en inglés. Si quieres que el puente
acompañe ese paso, usa la variante en inglés: **Cosmo**: "The forest is shining again! Thank
you!" **Nova**: "Hello! I am Nova. See you in the Valley of Words!" No cambia nada del video,
solo la pista de voz.

### C1. Fiesta en la aldea (0–7 s)

- **Referencias:** `public/cartillas/ingles-3/personajes/cosmo-wave.webp`,
  `public/cartillas/ingles-3/personajes/lumi-celebrate.webp`,
  `public/cartillas/ingles-3/personajes/pixie-wave.webp`.
- **Cuadro inicial sugerido (recomendado aquí):** como son nueve personajes, la forma más
  segura de que los vecinos se parezcan es armar el cuadro en Canva: la aldea de fondo
  (`mundo/objeto-1.webp` a `objeto-9.webp`), los seis vecinos (`personajes/vecino-1.webp` a
  `vecino-6.webp`) en una fila al fondo, más pequeños, y Cosmo, Lumi y Pixie adelante.
- **Recorte:** del segundo 0,5 al 7,5.

```text
Style: bright, cozy 2D cartoon animation for young children, like a modern picture book come to life. Chunky rounded shapes, clean dark-brown outlines, soft painterly shading, glossy highlights, saturated candy colors (purple, teal, golden yellow, pink, leaf green). Gentle, smooth camera moves. Warm, safe, hopeful mood.
Setting: Englishland, the Forest of Sounds, a lush magical forest in daylight: round green and purple trees, glowing orange and violet mushrooms, round mossy stones, small blue ponds, sandy dirt paths, flowering bushes. In the central clearing there is a tiny village: mushroom-shaped cottages (one red cap with cream spots, one purple cap), a tree-stump cottage, a stone well with a purple roof, a log bench, a fruit cart with a red-and-white striped awning, and wooden lamp posts with hanging lanterns.
Cosmo: a small round planet character with a sparkly purple-lavender surface, a glossy light-blue ring tilted around his middle like Saturn, a thin clear glass dome on top, big shiny black eyes, rosy pink cheeks, small kind smile, one tiny purple hand; he floats, no legs.
Lumi: a small five-pointed star character, bright golden yellow turning orange at the tips, always softly glowing with tiny sparkles around her, wearing a clear round glass bubble helmet, big shiny black eyes, rosy cheeks, open happy smile; she floats gently.
Pixie: a small five-pointed star character, hot pink and magenta with golden-orange highlights and glitter speckles, wearing a clear glass bubble helmet with a light-blue rim, big shiny black eyes, rosy cheeks, wide happy smile; she flies fast and leaves a trail of rainbow sparkles.
Background villagers, smaller and slightly out of focus: Tito, a mushroom with a red cap with white spots and a leaf cape; Pua, a hedgehog with a red scarf and a fruit basket; Abu, an old green turtle with round glasses and a walking stick; Nuez, a squirrel baker with a white chef hat and apron holding bread; Caro, a green snail with a straw hat and a cottage-shaped shell; Rayo, a raccoon mail carrier in a blue jacket and cap.
Shot: a joyful celebration in the fully lit, colorful village. Garlands of leaves and flowers hang between the lamp posts, every lantern glows. In the foreground Cosmo, Lumi and Pixie jump, spin and cheer toward the camera; Cosmo's mouth moves as if he speaks, but no voice is heard. Behind them the villagers celebrate: Nuez hands out bread, Rayo tosses blank envelopes into the air like confetti, Abu claps, Pua and Tito dance, Caro waves her lantern. Golden sparkles rain gently.
Camera: medium-wide shot, a slow gentle pull-back to reveal the whole party.
Light: warm golden late-afternoon light, glowing lanterns.
Motion: lively but soft; confetti of leaves and sparkles drifts down slowly.
Audio: happy celebration sounds: soft chimes, light cheerful clapping, wordless happy cheers. No music. No speech, no voiceover, no singing.
Framing: vertical 9:16. Cosmo, Lumi and Pixie in the lower half, close to the camera; the villagers in a row across the middle; the top-right corner holds only sky and garlands.
Avoid: any written text, letters, numbers or symbols on screen, subtitles, captions, logos, watermarks; humans, human faces or children; scary, stormy, gloomy or sad imagery; tears; villains; fast or shaky camera; photorealism.
```

**16:9:** `Framing: horizontal 16:9. Cosmo, Lumi and Pixie together in the center foreground; the six villagers spread across the background from left to right; the top-right corner holds only sky and garlands.`

**Audio, opción B:** `... Cosmo says in Latin American Spanish, with a kind, happy, young voice: "¡El bosque brilla otra vez! ¡Gracias!" Then everyone cheers together in English: "Hooray!" No music.`

### C2. El puente se enciende y llega Nova (7–15 s)

- **Referencias:** `public/cartillas/ingles-3/personajes/nova-ready.webp` y, como guía del
  lugar, `public/cartillas/ingles-3/fondos/bosque-mapa.webp` (el puente de tablas sobre el río,
  a la derecha del mapa).
- **Cuadro inicial sugerido:** el puente de madera visto de lado sobre un río azul, la orilla
  cercana con color y la otra orilla con un valle suave de colinas rosadas a lo lejos. Sin Nova
  (ella entra volando).
- **Recorte:** del segundo 0 al 8. Es el final: deja 0,5 s con Nova saludando.

```text
Style: bright, cozy 2D cartoon animation for young children, like a modern picture book come to life. Chunky rounded shapes, clean dark-brown outlines, soft painterly shading, glossy highlights, saturated candy colors (purple, teal, golden yellow, pink, leaf green). Gentle, smooth camera moves. Warm, safe, hopeful mood.
Setting: Englishland, the Forest of Sounds, a lush magical forest in daylight: round green and purple trees, glowing orange and violet mushrooms, round mossy stones, small blue ponds, sandy dirt paths, flowering bushes. At the forest's edge a sparkling blue river runs between rounded stones, crossed by a wooden plank bridge. Beyond the river lies a soft valley of rolling pink and lilac hills.
Nova: a small comet character: a round glowing head in yellow, orange and pink inside a clear glass bubble helmet, big shiny black eyes, rosy cheeks, confident smile, one little fist forward like a superhero, and a long flowing rainbow tail (orange, pink, yellow, blue, purple) full of sparkles.
Shot: the wooden plank bridge over the blue river. One by one, from the near bank to the far bank, each plank lights up with a warm golden glow until the whole bridge shines. The camera follows the light across. On the far bank, Nova swoops down from the sky with her rainbow tail, lands softly at the end of the bridge, puts one fist forward and then waves at the camera with a big smile; her mouth moves as if she speaks, but no voice is heard.
Camera: a smooth glide along the bridge toward the far bank, settling on Nova in a medium shot.
Light: golden late-afternoon light; the glowing planks reflect on the water.
Motion: water ripples gently; Nova's tail flows and sparkles.
Audio: a rising musical note for each plank that lights, the gentle sound of the river, a bright whoosh when Nova arrives, a final warm chime. No music. No speech, no voiceover, no singing.
Framing: vertical 9:16. The bridge runs from the bottom of the frame up toward the far bank; Nova ends in the center of the upper half, below the top-right corner, which stays empty.
Avoid: any written text, letters, numbers or symbols on screen, subtitles, captions, logos, watermarks; humans, human faces or children; scary, stormy, gloomy or sad imagery; tears; villains; fast or shaky camera; photorealism.
```

**16:9:** `Framing: horizontal 16:9. The bridge runs from left to right across the frame; Nova lands on the right third, below the top-right corner, which stays empty.`

**Audio, opción B:** `... Nova says in Latin American Spanish, with an energetic, friendly young voice: "¡Hola! Soy Nova. ¡Te espero en el Valle de las Palabras!" No music.`

---

## 6. Voces

Se generan en el editor con texto a voz (los dos editores de la sección 7 lo traen) y se
eligen **una vez** para todo:

| Personaje | Idioma de la voz | Carácter | Velocidad |
| --- | --- | --- | --- |
| Pixie | Español latinoamericano (Colombia o México) | Femenina joven, alegre y cálida | 0,9× |
| Lumi | Español latinoamericano | Femenina, suave y tranquila | 0,9× |
| Cosmo | Español latinoamericano | Masculina joven, amable | 0,9× |
| Nova | Español latinoamericano (o inglés en la variante) | Enérgica, de aventurera | 0,95× |
| Vecinos (B2, solo palabras en inglés) | Inglés (EE. UU.), la misma que usa la plataforma para el vocabulario si es posible | Clara y pausada | 0,85× |
| "Hooray!" de todos (C1) | Inglés: dos o tres voces encimadas | Alegre | 1× |

- Anota en una nota del proyecto qué voz elegiste para cada personaje. Cuando llegue la voz
  definitiva de la plataforma, solo se cambia esta pista.
- La voz va al menos 6 dB por encima del ambiente. El ambiente de Veo se baja a un 40 o 50 %
  mientras alguien habla.
- **No uses voces de estudiantes** ni de otros niños (regla 7). Las voces son sintéticas o de
  adultos que hayan dado permiso.

---

## 7. Cómo unir los clips

### 7.1 Clipchamp (recomendado)

Es gratis, funciona en el navegador o en Windows, exporta sin marca de agua y trae texto a voz
en español de Colombia y México.

1. **Crear video** y, en la vista previa, elegir la proporción **9:16**.
2. Importar los clips de la cinemática (`A1-9x16.mp4` ... `A4-9x16.mp4`) y arrastrarlos a la
   línea de tiempo en orden.
3. Recortar cada clip con las asas de los bordes a los tiempos del guion (el "Recorte" de cada
   toma). Que ninguna toma empiece ni termine en medio de un movimiento brusco.
4. Transiciones: **fundido cruzado de 0,3 s** solo entre A1 y A2 y entre A2 y A3. Entre las
   demás tomas, corte directo. En B y C, corte directo.
5. Voces: **Grabar y crear → Texto a voz**. Pegar cada frase exacta del guion, elegir la voz
   del personaje (sección 6) y colocarla bajo su toma. Cada frase debe terminar al menos 0,3 s
   antes del corte.
6. Bajar el volumen del clip (ambiente) mientras suena la voz.
7. Revisar la duración total: A ≤ 30 s, B ≤ 12 s, C ≤ 15 s.
8. **Exportar en 720p** (más es inútil, se va a reducir). Nombre: `inicio-bosque-9x16-editado.mp4`.
9. **Duplicar el proyecto**, cambiar la proporción a **16:9** y reemplazar cada clip por su
   versión 16:9 (clic derecho → reemplazar). Las voces quedan en su sitio. Exportar como
   `inicio-bosque-16x9-editado.mp4`.
10. Exportar también una versión **sin voces** de cada una (silenciar la pista de voz) y
    guardarla. Sirve para cambiar la voz más adelante.

Para B: un proyecto con B1 + B2 de los útiles; duplicarlo cuatro veces y cambiar solo B2 y la
frase del vecino.

### 7.2 CapCut (alternativa)

Los pasos son los mismos (proporción, recortar, texto a voz, exportar 720p). Dos cuidados:

- No uses su biblioteca de música, efectos ni stickers en estos videos: sus licencias limitan el
  uso comercial y la plataforma se vende a colegios.
- Revisa que la exportación no agregue el cierre con el logo de CapCut. Si aparece, desactívalo
  en la configuración antes de exportar.

### 7.3 Música (opcional)

No hace falta. Si se quiere, una sola pista suave, bajo la voz (unos −24 LUFS), de una fuente
con licencia comercial clara (por ejemplo, Pixabay Music). Guarda el enlace y la licencia de la
pista junto al proyecto.

---

## 8. Formato, peso y comandos finales

Esta tabla reemplaza a la de la sección 5.3 de `docs/diseno/ronda-1.md`. El niño descarga
**solo una orientación**, la de su pantalla, y solo cuando va a ver el video.

| Qué | A. Inicio | B. Camino (cada uno) | C. Puente |
| --- | --- | --- | --- |
| Duración máxima | 30 s | 12 s | 15 s |
| **Peso máximo por archivo** | **2,0 MB** | **0,8 MB** | **1,0 MB** |
| Resolución 9:16 | 480 × 854 | 480 × 854 | 480 × 854 |
| Resolución 16:9 | 854 × 480 | 854 × 480 | 854 × 480 |
| Video | H.264 (MP4), perfil Main, nivel 3.0, 24 cuadros/s, `yuv420p`, CRF 30, tope de 450 kbps | igual | igual |
| Audio | AAC-LC mono, 64 kbps, 44,1 kHz, normalizado a −16 LUFS | igual | igual |
| Contenedor | MP4 con `faststart` | igual | igual |
| Póster | WebP del mismo tamaño que el video, menos de 30 KB | igual | igual |

- 854 × 480 cabe justo en el nivel 3.0 de H.264 (1620 macrobloques por cuadro, el máximo del
  nivel), así que los celulares de gama baja lo siguen decodificando por hardware.
- Por territorio y orientación: 2,0 + 5 × 0,8 + 1,0 = **7 MB como máximo**, repartidos en siete
  descargas que solo ocurren si el niño ve cada video. Nada entra en la primera carga.
- Comprobado con un clip de prueba muy difícil de comprimir (fractal en movimiento constante):
  30 s en 9:16 dieron 1,98 MB con CRF 30, y 1,61 MB con el ajuste de reintento. Los dibujos
  animados pesan bastante menos.

### 8.1 Convertir (una vez por archivo editado)

**Vertical 9:16:**

```bash
ffmpeg -i inicio-bosque-9x16-editado.mp4 -vf "scale=480:854:force_original_aspect_ratio=increase,crop=480:854,setsar=1,fps=24" -c:v libx264 -profile:v main -level 3.0 -preset slow -crf 30 -maxrate 450k -bufsize 900k -pix_fmt yuv420p -c:a aac -ac 1 -b:a 64k -ar 44100 -af loudnorm=I=-16:TP=-1.5:LRA=11 -movflags +faststart inicio-bosque-9x16.mp4
```

**Horizontal 16:9:**

```bash
ffmpeg -i inicio-bosque-16x9-editado.mp4 -vf "scale=854:480:force_original_aspect_ratio=increase,crop=854:480,setsar=1,fps=24" -c:v libx264 -profile:v main -level 3.0 -preset slow -crf 30 -maxrate 450k -bufsize 900k -pix_fmt yuv420p -c:a aac -ac 1 -b:a 64k -ar 44100 -af loudnorm=I=-16:TP=-1.5:LRA=11 -movflags +faststart inicio-bosque-16x9.mp4
```

Para los demás videos, cambia solo el nombre de entrada y de salida.

**Revisar peso y duración:**

```bash
ffprobe -v error -show_entries format=duration,size -of compact inicio-bosque-9x16.mp4
```

**Si pasa del peso máximo**, repetir con `-crf 32 -maxrate 380k -bufsize 760k`. Si todavía pasa,
el video dura más de lo debido: recórtalo en el editor.

**Póster** (un cuadro donde se vean bien los personajes; cambia `-ss 2` por el segundo que
quieras):

```bash
ffmpeg -ss 2 -i inicio-bosque-9x16.mp4 -frames:v 1 -c:v libwebp -quality 60 inicio-bosque-9x16.webp
```

Si pasa de 30 KB, baja `-quality` a 50.

### 8.2 Lista de archivos que se entregan

Van en `public/cartillas/ingles-3/videos/` (los copia el desarrollador):

```text
inicio-bosque-9x16.mp4    inicio-bosque-9x16.webp    inicio-bosque-16x9.mp4    inicio-bosque-16x9.webp
camino-school-9x16.mp4    camino-school-9x16.webp    camino-school-16x9.mp4    camino-school-16x9.webp
camino-colors-…           camino-numbers-…           camino-body-…             camino-family-…
puente-valle-9x16.mp4     puente-valle-9x16.webp     puente-valle-16x9.mp4     puente-valle-16x9.webp
```

Los proyectos del editor, los clips originales de Veo y las versiones sin voz se guardan
**fuera** del repositorio (en tu Drive, por ejemplo): pesan demasiado para el repo.

### 8.3 Subtítulos (opcional)

Si el desarrollador los muestra, este es el archivo de la cinemática A
(`inicio-bosque.vtt`; sirve para las dos orientaciones). Los de B y C salen igual de las
tablas de las secciones 4 y 5.

```text
WEBVTT

00:00.500 --> 00:06.500
Esta es Englishland. Aquí cada cosa tiene una palabra... y cada palabra brilla.

00:07.300 --> 00:13.800
Un día, las palabras se fueron volando... y el bosque empezó a perder su color.

00:14.800 --> 00:20.500
¡Hola! Soy Pixie. Y ella es Lumi: su luz nunca se apaga.

00:20.500 --> 00:21.800
¡Hola!

00:22.500 --> 00:27.800
Escucha, juega y habla en inglés: cada palabra devuelve la luz.

00:27.800 --> 00:29.500
¡Vamos juntos!
```

Ajusta los tiempos a donde quedaron las voces en tu edición.

---

## 9. Lista de verificación para Manuel

Revisa cada video **en las dos orientaciones** antes de entregarlo. Mira cada clip pausándolo
cada segundo, no solo de corrido.

**Personajes**

- [ ] Pixie es rosada y Lumi es amarilla en todas las tomas; no se intercambian.
- [ ] Las estrellas tienen cinco puntas y casco de vidrio.
- [ ] Cosmo es un planeta morado con anillo azul, sin piernas.
- [ ] Nova es un cometa con cola de arcoíris.
- [ ] Cada vecino tiene lo suyo: el sombrero rojo de Tito, la bufanda de Púa, las gafas y el
  bastón de Abu, el gorro de chef de Nuez, la casita-concha de Caro y la gorra azul de Rayo.
- [ ] Ningún personaje aparece duplicado ni con partes de más (manos, ojos, puntas).
- [ ] Ningún personaje se ve triste, asustado ni llorando. El gris de A2 se ve tranquilo, no
  oscuro.
- [ ] El héroe del niño (Tavi, Mika o Bruno) no aparece.

**Sin texto ni personas**

- [ ] No hay letras, números, letreros ni subtítulos inventados por la IA. Revisa con cuidado
  los sobres de Rayo, el pan de Nuez, las piedras de Abu, los libros y cuadernos de Caro y los
  postes del bosque.
- [ ] No hay rostros reales, personas ni niños; tampoco fotos de fondo.
- [ ] No hay logos ni personajes de otras marcas.
- [ ] Si Gemini puso una marca de agua visible en una esquina, revisa en los términos de tu plan
  si se puede quitar antes de recortarla o taparla.

**Sonido y voz**

- [ ] Las frases son exactamente las del guion y se entienden por encima del ambiente.
- [ ] Cada personaje suena con la misma voz en todos los videos.
- [ ] Las palabras en inglés suenan con voz en inglés y bien pronunciadas.
- [ ] No hay música ni voces que haya agregado Veo y no estén en el guion.

**Formato**

- [ ] Duración: A ≤ 30 s, B ≤ 12 s, C ≤ 15 s.
- [ ] Peso: A ≤ 2,0 MB, B ≤ 0,8 MB, C ≤ 1,0 MB (comando de 8.1).
- [ ] Hay versión 9:16 y versión 16:9, con sus pósters.
- [ ] La esquina superior derecha no tapa nada importante (ahí va el botón de saltar).
- [ ] Se vio a 390 px de ancho en un celular, con sonido.

**Derechos y datos**

- [ ] Revisaste en los términos de tu plan de Gemini (y de Clipchamp o CapCut, por las voces)
  que puedes usar los clips de forma comercial: la plataforma se vende a colegios. Guarda una
  captura de esos términos con la fecha.
- [ ] La música, si la hay, tiene licencia comercial guardada junto al proyecto.
- [ ] No se usaron voces, fotos ni nombres de estudiantes reales (regla 7).
- [ ] Los originales y los proyectos están guardados fuera del repositorio, para poder
  cambiar la voz después.

---

## 10. Notas para el líder y el desarrollador (no cambian este guion)

Este documento no modifica otros archivos. Quedan estos ajustes para quien corresponda:

1. **Sección 5 de `docs/diseno/ronda-1.md`:** la caja del video pasa de 1:1 a dos archivos. En
   el celular vertical, el 9:16 ocupa el ancho completo (390 × 693 a 390 px). En pantallas
   anchas se usa el 16:9. La tabla de 5.3 queda reemplazada por la sección 8 de este documento.
2. **Contenido:** cada video necesita dos archivos y dos pósters. Propuesta de forma:
   `"archivos": { "vertical": "videos/inicio-bosque-9x16.mp4", "horizontal": "videos/inicio-bosque-16x9.mp4" }`,
   igual para `posters`, más `"recuerdo": { "es": "Así empezó todo", "en": "How it all began" }`
   para el álbum. Nombres en Recuerdos: "Así empezó todo", "El camino de los útiles", "El camino
   de los colores", "El camino de los números", "El camino del cuerpo", "El camino de los
   saludos", "El puente al Valle".
3. **Escena `intro`:** después del video, Pixie repetiría "Englishland se está apagando".
   Conviene que, si el video se vio, la escena empiece en la presentación de Cosmo. El texto
   completo queda como respaldo cuando el video no carga.
4. **Misión de la hora (Rayo):** no es un camino de dos misiones y no tiene cierre en video.
   Si se quiere, se hace una sexta B2 con Rayo y el reloj del bosque, siguiendo el mismo
   patrón (sin números en la esfera).
5. **Idioma del puente:** decidir si C usa la variante en inglés, según `idiomaPorAvance`.
