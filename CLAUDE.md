# Plataforma de cartillas

Plataforma web donde viven cartillas interactivas por materia y grado. La primera cartilla es
**English Adventure Quest** (inglés, grado tercero), nacida del trabajo de grado de Manuel Vega
en la I.E. Jorge Barco Mora (Los Patios, Norte de Santander). El piloto en aula está previsto
para el próximo año escolar con grado tercero; después vienen preescolar y el resto de primaria.

## Para quién se construye

| Modo | Quién | Qué hace |
| --- | --- | --- |
| Estudiante | Niños de 5 a 9 años | Recorre un mapa interactivo, juega misiones de 3 a 5 minutos, practica voz, gana estrellas |
| Docente | Profesor de aula | Planea con materiales por tema, proyecta juegos de aula, da estrellas, sigue el avance |
| Coordinador | Directivo del colegio | Ve uso y avance por grado y grupo, administra docentes y grupos |
| Dueño | Manuel | Crea colegios y publica cartillas |

Jerarquía de datos: colegio → docentes → grupos → estudiantes.

## Reglas que no se negocian

1. **Contenido separado del motor.** Una cartilla es un paquete de datos (textos, imágenes,
   audio, video). Los juegos son plantillas que reciben ese contenido. Nunca se escribe
   vocabulario o preguntas dentro del código de un juego.
2. **Primero audio e imagen, después texto.** Todo debe poder usarse sin saber leer
   (preescolar). El texto acompaña, no es requisito.
3. **Celular primero.** Táctil, objetivos de toque de 48 px o más, fluido en gama baja.
   Se adapta a tableta y computador.
4. **Liviano y sin conexión.** Primera carga por debajo de 2 MB. Imágenes en WebP o AVIF al
   tamaño en que se muestran. El sitio anterior descargaba 53 MB; eso no se repite.
5. **Mission Stars reconoce conductas, no solo aciertos.** Participar 10, completar una misión
   15, pronunciar 10, trabajo colaborativo 15, corregir y mejorar 15, autoevaluarse 10.
   Complementa la nota institucional, no la reemplaza. Nunca se quitan estrellas.
6. **El error es parte del juego.** Sin pantallas de "perdiste", sin tablas de posiciones que
   expongan al que va despacio. La práctica de voz es privada y premia el intento.
7. **Datos de menores, lo mínimo.** Nombre o apodo y progreso. Sin correo del niño, sin
   guardar grabaciones de voz. Aplica la Ley 1581 de 2012.
8. **Nada técnico a la vista del niño.** Sin nombres de variables, modos internos ni paneles
   de exportación en el modo estudiante.
9. **Alternativa análoga.** Todo material de clase debe poder imprimirse.

## Universo de English Adventure Quest

Englishland es un mundo donde las palabras perdieron su luz; los estudiantes la recuperan.

| Nivel | Territorio | Guía | Contenido |
| --- | --- | --- | --- |
| 1 English Explorer | Bosque de los Sonidos | Cosmo | School objects, colors, numbers, body parts, time |
| 2 Word Builder | Valle de las Palabras | Nova | Emotions, food, clothes, animals |
| 3 Sentence Hero | Ciudad de las Frases | Astro | Daily routine, action verbs, present simple |
| 4 English Communicator | Plaza del Encuentro | Nebu | Places in town, there is/are, dialogues |

La puerta de cada territorio se abre cuando todos sus faroles brillan (cada misión completada
enciende el suyo). Las Mission Stars no abren puertas: abren estelas y accesorios y las ve el
docente; las que da el docente (participar, colaborar) nunca bloquean el avance del niño.

Pixie introduce la aventura. Lumi acompaña todo el recorrido y normaliza el error.

Marco teórico vigente (el de la tesis): Bruner, Ausubel, Vygotsky, Ryan y Deci, Krashen, Kapp.

## Cómo se trabaja aquí

- El idioma del proyecto es español: interfaz, comentarios y mensajes de commit.
  El contenido de inglés va en inglés.
- El equipo de agentes está en `.claude/agents/`. El flujo normal es
  líder → diseñador o pedagogo → desarrollador → revisor → auditor.
- Las skills están en `.claude/skills/`. Antes de instalar una skill externa se lee completa.
- Todo cambio visible se comprueba en un navegador a 390 px de ancho antes de darlo por hecho.
- El sitio anterior está en `manuelprofe/cartillaenglishadventure`; de ahí se reutilizan
  personajes, fondos, narrativa y bancos de contenido, no el código.
