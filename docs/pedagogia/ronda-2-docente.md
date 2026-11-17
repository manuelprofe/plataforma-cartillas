# Definición pedagógica, ronda 2: cuentas, docente y coordinador

Asesor pedagógico, 17 de noviembre de 2026. Fase **definir**: aquí se dice *qué* debe pasar y *para
qué*; el *cómo se ve* es del diseñador. Fuentes: `CLAUDE.md`, `CONTINUAR.md`,
`docs/pedagogia/ronda-1.md` (§3, §4, §5, §7), `supabase/esquema.sql`, `src/escuchar.ts`.

**Límite de lo que se afirma.** Nada está medido en aula. Los tiempos son estimaciones para calibrar
en el piloto. Ninguna pantalla (docente, coordinador, familia) ni material de venta dice que la
cartilla "mejora" el aprendizaje o la motivación.

**Marcas de prioridad:** **P** = imprescindible para el piloto · **C** = conviene, si alcanza ·
**E** = puede esperar.

---

## 0. Lo que cambia por tener una hora de clase a la semana

La ronda 1 (§3) pensó la semana como 5 sesiones diarias. Con una sola hora de aula eso no cabe.
Decisiones pedagógicas (delegadas; la 6.1 y la 6.2 necesitan datos que solo tiene Manuel):

| Tema | Decisión |
| --- | --- |
| Qué es una "sesión" | Sigue siendo unos 15 minutos y 3 misiones de la app, y lo nuevo se apaga hasta el día siguiente. **Ya no equivale a un día de clase.** |
| Dónde ocurren | **Una sesión por clase es la base** (se hace en el aula). Las demás son práctica en casa, **siempre opcionales**. |
| Equidad | Nada de lo que solo se puede hacer en casa cuenta para la nota, para la prueba ni para dar estrellas del docente. Las sesiones no vencen: quien no pudo en casa las encuentra abiertas en la clase siguiente. |
| "Prueba del viernes" | Se llama **prueba del tema** en el modo docente. No ocurre sola por calendario: **la abre el docente** en la clase que elija. El niño nunca ve ese nombre ni una nota. |
| Ritmo sugerido | Un tema = **2 clases**: clase 1 mirar y jugar; clase 2 decir y prueba. Los 6 temas del Bosque serían unas 12 semanas. A calibrar. |
| Nunca se recorta | El mirar y el decir (ronda 1 §3.2). Lo primero que se quita es Memory. |

Hora de clase tipo (estimada, 55 minutos reales):

| Minutos | Momento | Ritmo | Con qué |
| --- | --- | --- | --- |
| 5 | Saludo y repaso de 2 o 3 palabras de la clase anterior | mirar | Proyector o lámina impresa |
| 15 | Juego de aula con todo el grupo | mirar → jugar | Proyector |
| 20 | Sesión del día en la app, o estación impresa si no hay celular | jugar → decir | Celulares o fichas |
| 10 | Decir en parejas; el docente reconoce participar y colaborar | decir | Voz, sin pantalla |
| 5 | Cierre: qué encendimos hoy, caritas de autoevaluación | — | Proyector o papel |

---

## 1. Docente

Principios para todo el modo docente:

- **Se usa en el celular del docente, de pie y con una mano.** El proyector es una segunda vista.
- **Lo que se proyecta nunca muestra datos de un niño** (ni estrellas, ni avance, ni prueba). Solo
  el juego y logros del grupo completo.
- **Sin orden por rendimiento.** Las listas van siempre por apodo en orden alfabético. Sin
  posiciones, sin rojo, sin porcentajes junto a un nombre.
- **Funciona sin red.** Lo que el docente hace en clase (dar estrellas, abrir la prueba) se guarda en
  su celular y sube cuando vuelve la señal; debe verse un aviso discreto de "pendiente por subir".
- Lenguaje: "todavía está aprendiendo", "le falta encender"; nunca "perdió", "bajo", "atrasado".

### 1.1 Una sola vez, antes de empezar (preparar el grupo)

| Qué hace o ve | Para qué | Prioridad |
| --- | --- | --- |
| Entra con correo y contraseña; recuperar contraseña | Cuenta de adulto | P |
| Crea el grupo (nombre y grado) y recibe el **código del grupo** | Entrada de los niños | P |
| Agrega estudiantes: escribe **solo el apodo** (primer nombre o apodo, sin apellidos; si se repite, una inicial: "Juan M") | Datos mínimos (regla 7) | P |
| Marca por cada niño "autorización recibida" (casilla y fecha). Sin la marca, ese niño no entra con cuenta | Ley 1581 (§4) | P |
| La app propone un PIN de tres imágenes por niño; el docente puede cambiarlo | Que nadie quede sin entrar | P |
| Imprime las **tarjetas de entrada** (una por niño: apodo, personaje, código del grupo y sus tres imágenes) y la **lista del grupo** | Regla 9; niño que lee poco; PIN olvidado | P |
| Imprime la autorización para las familias | §4.4 | P |
| Agrega varios niños pegando una lista de apodos | Ahorra tiempo con 35 niños | C |
| Mueve a un niño de grupo o lo retira (borra sus datos) | Traslados y retiro del consentimiento | P (retirar) · E (mover) |

### 1.2 Antes de la clase (planear, 5 minutos)

| Qué hace o ve | Para qué | Prioridad |
| --- | --- | --- |
| **Plan del tema:** elige el tema (uno de los caminos del Bosque) y **cuántas sesiones** (1 a 5). La app le muestra qué misiones quedan en cada sesión (tabla de ronda 1 §3.2) y cuál se hace en clase | Plan por semanas (decisión vigente) | P |
| Ve el plan en una frase: "Clase 1: escuchar y atrapar los colores. Clase 2: decirlos y prueba" | Que planear no exija leer una tabla | P |
| Cambia el plan a mitad de camino (festivo, clase perdida) sin que ningún niño pierda lo hecho | Realidad del calendario | P |
| **Materiales del tema**, todos imprimibles: láminas de palabras (imagen + palabra + cómo suena), fichas de Memory para recortar, hoja de "escucha y señala", prueba impresa, lista de cotejo | Regla 9; aulas con pocos celulares | P (láminas, prueba, cotejo) · C (Memory, fichas) |
| Qué estándar y DBA cubre el tema, en una línea | Planeación institucional. **Sin número de DBA hasta cotejarlo con el documento oficial** (ronda 1) | C |
| Cómo va el grupo desde la última clase (§1.4), para decidir si repasa antes de avanzar | Andamiaje (Vygotsky) | P |
| Idea de actividad sin pantalla para "decir en parejas" de ese tema | Relación (Ryan y Deci) | C |
| Elegir palabras de la misión de voz (ronda 1 §2.3 lo permitía) | Ajuste fino | E |

### 1.3 Durante la clase

| Qué hace o ve | Para qué | Prioridad |
| --- | --- | --- |
| **Proyectar un juego de aula**: las mismas plantillas (Escucha y toca, Listen & Catch, Memory) con las palabras del tema, en horizontal y en grande. No pide cuenta de niño, no guarda nada de nadie, funciona sin red | Entrada comprensible para todos antes de jugar solos (Krashen) | P (Escucha y toca y Memory) · C (Listen & Catch) |
| En el juego proyectado: turnos por equipos o "todos señalan"; el error se trata igual que en la app (se repite la palabra, sin "perdiste"); sin marcador por equipos que deje un perdedor | Regla 6 | P |
| Botón grande para **repetir la palabra** y para decirla **más despacio** | Primera ayuda del andamiaje | P |
| "Di y brilla" proyectado: el grupo dice la palabra en coro; **sin micrófono** en modo aula | Filtro afectivo bajo: nadie habla solo frente a todos si no quiere | C |
| **Dar Mission Stars** desde la lista del grupo en su celular: toca al niño y elige **participar (10)** o **colaborar (15)**. Dos toques como máximo | Regla 5 | P |
| Colaborar se da a **varios a la vez** (pareja o equipo): marca a los niños y da una sola vez | Colaborar es de más de uno | P |
| Toque equivocado: durante unos segundos puede **deshacer antes de que se guarde**. Una vez guardada, la estrella no se quita nunca | "Nunca se quitan" sin castigar el error del docente | P |
| Señal suave de a quién ya reconoció hoy y a quién no (un punto junto al apodo, solo en su celular) | Que no reciban estrellas siempre los mismos | P |
| No hay forma de quitar, restar ni condicionar estrellas; tampoco "estrellas por portarse bien": los dos motivos son conductas de aprendizaje | Kapp: mecánica con propósito | P |
| El niño ve la estrella del docente **la próxima vez que entra**, con Lumi diciendo por qué ("Tu profe vio que ayudaste a un compañero") | Reconocer la conducta, no el número | C |
| **Ayuda de entrada** en clase: ver quién no ha entrado hoy, mostrar o cambiar el PIN de un niño | PIN olvidado sin perder la hora | P |
| **Abrir la prueba del tema** para el grupo y cerrarla al final | §1.5 | P |
| Anotar una incidencia con un toque: sin micrófono, sin señal, celular lento, faltó celular | Registro del piloto (§1.6) | C |

### 1.4 Ver el avance del grupo sin exponer a nadie

| Vista | Qué muestra | Qué no muestra | Prioridad |
| --- | --- | --- | --- |
| **Grupo, por tema** | Los faroles del tema y cuántos niños encendieron cada uno ("Listen & Catch: 21 de 34"). Palabras que el grupo todavía está aprendiendo (las 3 a 5 que más aparecen en "repasar") | Nombres | P |
| **Lista del grupo** | Por apodo, alfabética: faroles del tema (encendido, a medias, sin empezar), si ya hizo la sesión de esta semana, estrellas por conducta | Orden por puntaje, total comparado, promedio del grupo al lado | P |
| **"Para acompañar"** | Lista corta y privada: quien no ha entrado en 2 semanas, quien no ha llegado a una misión de voz, quien repite la misma misión sin encender | El título "atrasados"; nunca se proyecta ni se imprime con nombres | P |
| **Un niño** | Lo que encendió, lo que repasó y ahora le sale, hasta 3 palabras para seguir practicando, estrellas por conducta, su carita de autoevaluación, resultado de la prueba | Tiempos exactos, número de errores por misión | P |
| **Resumen para la familia** por niño, imprimible (ronda 1 §4) | Lo logrado primero | Nota de la prueba, comparación con el grupo | C |
| Diferencia entre carita del niño y lo que encendió | Para conversar con él, no para corregir su autoevaluación | — | E |

Regla para el diseñador: si una vista con nombres puede verse desde el puesto de un niño (proyector,
tablero, hoja en la pared), no lleva datos de avance.

### 1.5 Prueba del tema (antes "del viernes")

| Aspecto | Definición | Prioridad |
| --- | --- | --- |
| Contenido | 6 ítems de Escucha y toca sin pistas + 3 de Di y brilla, donde **cuenta el intento** (ronda 1 §3.2) | P |
| Lo que ve el niño | Una misión más, con otro nombre ("El reto de Cosmo"). Al final: "¡Terminaste!" y lo que encendió. **Nunca nota, aciertos ni la palabra "prueba"** | P |
| Lo que ve el docente | Por niño: aciertos de escucha (de 6), intentos de voz (de 3), y qué palabras no reconoció. Por grupo: palabras que más costaron | P |
| Quién más lo ve | **Nadie.** Ni coordinador, ni familia, ni el propio niño | P |
| Nota institucional | La app muestra "5 de 6 y 3 intentos"; **el docente decide la nota** en la escala del colegio y la registra donde siempre. La app no convierte ni guarda la nota | P |
| Sin celular o sin red | Versión impresa: el docente dice o reproduce la palabra, el niño encierra la imagen; la voz se observa en parejas con la lista de cotejo. El docente puede registrar el resultado a mano | P (impresa) · C (registro a mano) |
| Quien faltó | La prueba queda disponible para ese niño cuando el docente la vuelva a abrir | C |
| No bloquea | La prueba no enciende faroles ni abre puertas | P |

### 1.6 Después de la clase

| Qué hace o ve | Para qué | Prioridad |
| --- | --- | --- |
| Confirmación de que todo lo de la clase subió | Conexión inestable | P |
| Resultados de la prueba (§1.5) | Calificar | P |
| Lista de cotejo de la semana, 3 casillas por niño: participa, pide repetir, ayuda a un compañero (digital o impresa) | Registro del piloto (ronda 1 §7) | C |
| Enviar o imprimir el resumen para la familia | Ronda 1 §4 | C |
| Exportar o imprimir el avance del grupo para su planilla | Entrega al colegio | E |
| Historial de planes y comparación entre periodos | — | E |

**Registro del piloto** (lo que debe quedar para poder decir algo después). Antes: prueba impresa de
entrada (10 palabras de escuchar y señalar, 5 de decir) y encuesta de caritas. Durante: sesiones
hechas en clase y en casa, misiones encendidas, palabras que salen de "repasar", modo de voz usado,
estrellas por conducta, incidencias. Después: la misma prueba y la misma encuesta; entrevista al
docente y a 3 a 5 familias.

---

## 2. Estudiante: entrar con código → apodo → PIN

### 2.1 Lo que debe pasar

| Paso | Qué ocurre | Pensando en… |
| --- | --- | --- |
| 0. Portada | Dos caminos con imagen y voz: **"Tengo mi tarjeta"** y **"Jugar"** (sin cuenta, como hoy). Lumi lo dice en voz alta | Regla 2; los conocidos de Manuel y las familias siguen jugando sin cuenta |
| 1. Código del grupo | Se escribe **una vez por celular** (lo hace el docente o un adulto) y el aparato lo recuerda. Teclado propio con letras grandes; el código no usa letras que se confundan (ya es así) | Niño que lee poco: no vuelve a ver este paso |
| 2. ¿Quién eres? | Ve los personajes y apodos **de su grupo** y toca el suyo. En un celular donde ya entró, primero aparecen solo los que han jugado ahí ("¿Quién va a jugar?": Mika, Bruno, "otra persona") | Celular compartido entre hermanos: cada uno toca su cara |
| 3. PIN | Toca sus tres imágenes en orden, entre 10 imágenes grandes, siempre en el mismo lugar, bien distintas en forma y color (no solo en color). Puede borrar la última. **Sin voz que nombre lo que toca** (lo oiría el de al lado) y sin texto obligatorio | Lee poco; privacidad en un salón |
| 4. Bienvenida | Lumi lo saluda por su apodo y lo deja en el mapa donde iba | Relación; continuidad |
| Salir | "Cambiar de jugador" visible en la portada, no escondido. Cambiar no borra nada | Hermanos |

Quién crea la cuenta: **el docente** (el esquema ya lo exige). El niño no se registra solo ni
escribe datos suyos. La primera entrada se hace en clase, con la tarjeta en la mano.

### 2.2 Si se equivoca o lo olvida

| Situación | Qué ocurre | Qué no ocurre |
| --- | --- | --- |
| PIN equivocado | Las imágenes se sacuden suave y Lumi dice "Esas no son. Prueba otra vez con calma" | Sonido de error, contador de intentos, la palabra "incorrecto" |
| Varios intentos fallidos | "Lumi necesita un descanso. Pídele ayuda a tu profe o mira tu tarjeta", y la opción **"Jugar mientras tanto"** | La palabra "bloqueado", un reloj de cuenta regresiva, quedarse sin jugar |
| Olvidó el PIN en clase | El docente lo consulta en la lista impresa o lo cambia en su celular (dos toques) | Preguntas de seguridad, correo |
| Olvidó el PIN en casa | Mira su tarjeta impresa; si la perdió, juega "mientras tanto" y el docente lo arregla en la próxima clase | Recuperación por la familia con datos personales |
| No hay red al entrar | En un celular donde ya entró antes, **entra y juega igual**; lo jugado sube después. En un celular nuevo, juega sin cuenta y se une luego | Pantalla de "sin conexión" que impida jugar |
| Un hermano entra en el perfil del otro | El PIN lo evita en lo normal. Si pasa, no hay daño grave: el avance solo crece | — |

"Jugar mientras tanto" guarda en el aparato lo que el niño hace y, cuando logra entrar, **se suma a
su cuenta** (misma regla de 2.3). Un PIN olvidado nunca deja a un niño por fuera (filtro afectivo).

### 2.3 El avance que ya está guardado en el dispositivo sin cuenta

| Caso | Qué ocurre |
| --- | --- |
| Entra por primera vez con cuenta en un celular que ya tiene avance | Una sola pregunta, con el personaje y los faroles a la vista y con voz: **"¿Este camino lo recorriste tú?"** Sí / No |
| Dice que sí | El avance se **suma** a su cuenta: farol encendido en cualquiera de los dos lados queda encendido; álbum y palabras por repasar se unen. Nada se pierde ni se pisa |
| Estrellas | No se copia el número guardado en el aparato: la cuenta las **vuelve a calcular** con las reglas de siempre (completar una vez por misión, etc.). Puede cambiar un poco el total; se dice con naturalidad ("Lumi contó tus estrellas") |
| Dice que no (era de un hermano) | Ese avance queda en el aparato para quien lo reclame; su cuenta empieza con lo que tenga |
| Ya fue sumado a una cuenta | No se ofrece a nadie más |
| Su cuenta ya tenía avance (jugó en otro celular) | Igual: se suma. Nunca se pregunta "¿cuál quieres conservar?" |
| Sigue sin cuenta | Todo funciona como hoy, guardado solo en el aparato |

"Empezar de nuevo" (zona de la familia) con cuenta: borra lo del aparato, **no** lo de la cuenta;
borrar la cuenta lo hace el docente a pedido de la familia.

---

## 3. Coordinador

**Principio:** ve grupos, no niños. No necesita ningún dato individual para su trabajo.

| Ve | Detalle | Prioridad |
| --- | --- | --- |
| Uso por grado y grupo | Niños con cuenta, cuántos entraron esta semana y este mes, sesiones hechas en clase y fuera de clase | P |
| Avance por grado y grupo | Tema que cursa cada grupo, faroles encendidos por tema como proporción del grupo, territorio en que va | P |
| Estrellas por conducta, por grupo | Cuántas de cada tipo en total (muestra si se reconoce participar y colaborar, no solo completar) | C |
| Condiciones de uso | Incidencias sumadas por grupo: sin micrófono, sin señal, celular lento | C |
| Docentes | Nombre, correo, grupos a cargo, última vez que planeó un tema | P |
| Autorizaciones | Cuántas recibidas por grupo ("31 de 34"), sin nombres | P |

| Administra | Prioridad |
| --- | --- |
| Invitar a un docente de su colegio y desactivar su acceso | P |
| Crear grupos y **asignar o cambiar** el docente de un grupo (licencias, reemplazos) | P |
| Renovar el código de un grupo si se difundió | C |
| Cerrar el año escolar (dispara el borrado de §4.2) | C |

| No ve ni hace | Por qué |
| --- | --- |
| Lista de apodos, avance o estrellas de un niño | No lo necesita (regla 7) |
| Resultados de la prueba, ni por niño ni promedio por grupo | La calificación es del docente; un promedio por grupo invita a comparar docentes con un instrumento no validado |
| PIN, tarjetas de entrada | Son del aula |
| Tabla de grupos ordenada de mejor a peor | Misma regla 6, aplicada a docentes |
| Cifras de grupos de menos de 5 niños | Se identificaría a cada niño |

Si en el colegio la coordinadora también dicta clase, usa además una cuenta de docente para su grupo.

---

## 4. Datos mínimos (regla 7 y Ley 1581 de 2012)

Esto es criterio pedagógico y de mínimos, no concepto jurídico: **el texto final debe revisarlo el
rector o quien asesore al colegio en protección de datos.**

### 4.1 Qué se guarda

| De quién | Dato | Para qué | Quién lo ve | Cuánto tiempo |
| --- | --- | --- | --- | --- |
| Estudiante | Apodo o primer nombre, personaje elegido, grupo | Entrar y que el docente lo reconozca | Él, su docente, compañeros del grupo (solo apodo y personaje, al entrar) | Hasta 30 días después del cierre del año escolar |
| Estudiante | PIN de tres imágenes | Separar perfiles en celulares compartidos | Su docente (para ayudarle) | Igual |
| Estudiante | Misiones encendidas, veces jugadas, palabras del álbum y por repasar, palabras superadas | Continuar donde iba; resumen para la familia; acompañar | Él (como luz y álbum), su docente | Detalle: hasta el cierre del año. Después solo el resumen sin apodo |
| Estudiante | Fechas en que practicó (día, sin hora) | Sesión del día; "practicó N días" | Su docente; familia en el resumen | Igual |
| Estudiante | Duración por misión redondeada, modo de voz usado (contadores) | Calibrar la sesión de 15 minutos en el piloto | Solo sumado por grupo | Fin del piloto |
| Estudiante | Carita de autoevaluación | Reconocer la conducta; conversar con el niño | Él, su docente | Cierre del año |
| Estudiante | Mission Stars: motivo, cantidad, fecha, si la dio el docente | Reconocer conductas | Él (total y accesorios), su docente; coordinador solo sumado por grupo | Cierre del año |
| Estudiante | Resultado de la prueba del tema por ítem | Que el docente califique | **Solo su docente** | Cierre del periodo académico |
| Estudiante | Casilla "autorización recibida" y fecha (el papel se queda en el colegio) | Demostrar el permiso | Docente; coordinador solo el conteo | Mientras exista la cuenta |
| Docente | Nombre, correo, colegio, grupos, planes de tema | Cuenta y planeación | Él, su coordinador, el dueño | Mientras trabaje con la plataforma; se borra a solicitud |
| Coordinador | Nombre, correo, colegio | Cuenta | Él, el dueño | Igual |
| Colegio | Nombre, municipio | Organizar | Sus usuarios, el dueño | Mientras dure el convenio |

### 4.2 Qué no se guarda

- Apellidos, documento, fecha de nacimiento, sexo, dirección, teléfono, correo o foto del niño.
- **Audio de la voz** ni el texto que reconoce el micrófono.
- Hora exacta de juego, ubicación, identificadores del aparato, datos de la familia o de salud.
- La nota institucional (la pone el docente en el sistema del colegio).
- Nada para publicidad; no se comparte con terceros.

Borrado: al cerrar el año se elimina el detalle por niño; para el estudio del piloto queda solo un
resumen sin apodo ni grupo identificable. Si la familia retira el permiso, la cuenta se borra (el
docente lo hace; plazo que debe prometerse: máximo 15 días hábiles) y el niño sigue participando con
el juego proyectado, el material impreso o el modo sin cuenta.

### 4.3 Dos riesgos que hay que resolver antes del piloto (para el auditor)

1. **Micrófono.** `src/escuchar.ts` usa el reconocedor de voz del navegador. La app no guarda audio,
   pero en Chrome ese reconocedor suele enviar el sonido al servicio del fabricante para
   convertirlo en texto. Hay que verificarlo y, mientras tanto, **no prometer "la voz no sale del
   celular"**. Opciones: decirlo en la autorización (así está en el borrador) o usar en el piloto
   solo "decirla en voz alta" sin micrófono.
2. **Dónde quedan los datos.** Supabase es un servicio en la nube; hay que confirmar en qué país
   está el proyecto y decirlo en la autorización.

### 4.4 Autorización de los padres o acudientes

Hace falta: permiso **previo, escrito y firmado** por el representante legal de cada niño, que diga
qué datos, para qué, quién responde y cómo retirarlo; que sea **voluntario** y que negarlo no
afecte la nota; y contarle al niño, en sus palabras, qué se guarda (su opinión cuenta). Una hoja,
impresa, con desprendible.

Borrador (usted, frases cortas; lo entre corchetes lo completa el colegio):

> **Permiso para usar English Adventure Quest en la clase de inglés**
>
> Señor padre, madre o acudiente:
>
> En la clase de inglés de grado tercero vamos a probar una cartilla con juegos para el celular
> llamada English Adventure Quest. Para que su hijo o hija pueda continuar donde iba, la cartilla
> guarda unos pocos datos.
>
> **Qué se guarda:** un apodo o el primer nombre (sin apellidos), el personaje que eligió, una clave
> de tres dibujos, las misiones que juega, las palabras que practica, los días en que practicó y las
> estrellas que recibe por participar, completar, pronunciar, colaborar, mejorar y autoevaluarse.
>
> **Qué no se guarda:** apellidos, documento, dirección, teléfono, correo, fotos ni grabaciones de
> voz. [Si se usa micrófono: Cuando el niño dice una palabra, el navegador del celular puede enviar
> ese sonido a su fabricante para reconocerla. La cartilla no lo guarda. Usted puede pedir que su
> hijo practique sin micrófono.]
>
> **Para qué:** para que el niño siga su recorrido, para que su docente lo acompañe y para evaluar
> si la cartilla sirve en el aula. No se usa para publicidad ni se entrega a otras personas.
>
> **Quién lo ve:** su hijo o hija y su docente de inglés. La coordinación ve solo cifras del grupo
> completo, sin nombres.
>
> **Dónde y hasta cuándo:** los datos se guardan en un servicio de internet protegido, ubicado en
> [país]. Se borran al terminar el año escolar.
>
> **Sus derechos:** usted puede conocer estos datos, pedir que se corrijan o se borren y retirar
> este permiso cuando quiera, hablando con [docente] o escribiendo a [correo o teléfono].
> Responsable de los datos: [colegio / Manuel Vega].
>
> **Es voluntario.** Si no autoriza, su hijo o hija participa igual en la clase con los juegos
> proyectados y el material impreso, y su nota no cambia.
>
> ---
> Yo, ________________________, acudiente de ________________________ del grado ____,
> **sí ☐ no ☐** autorizo el uso de estos datos según la Ley 1581 de 2012.
> Firma: ________________ Fecha: ____________

### 4.5 Comparación con `supabase/esquema.sql` (no se modificó)

**Sobra o da más acceso del necesario**

| Dónde | Qué pasa | Qué se pide |
| --- | --- | --- |
| `puedo_ver_grupo` → `puedo_ver_estudiante` | El coordinador puede leer apodo, progreso y estrellas de **cada niño** de su colegio, y editar o borrar estudiantes | Coordinador: solo cifras por grupo (vista o función sumada); sin lectura de `estudiantes`, `progreso_misiones` ni `estrellas` por fila |
| `dar_estrellas` | Permite al docente dar `pronunciar` | Decisión vigente: el docente da solo participar y colaborar. Quitarlo, o dejarlo solo para el aula sin micrófono (decisión 6.5) |
| `registrar_mision` | Da `mejorar` cada vez que bajan los errores, sin tope | Una vez por misión (ronda 1 §5) |
| `creado`, `actualizado` (`timestamptz`) en progreso, estrellas y sesiones | Queda la hora exacta de juego del niño | Guardar solo el día, o no mostrar ni exportar la hora |
| `estudiantes.avatar` por defecto `'lumi'` | Lumi no es un personaje elegible (son Tavi, Mika, Bruno) | Corregir el valor por defecto |
| `lista_grupo` | Cualquier sesión, incluso anónima, que adivine un código de 5 caracteres recibe los apodos del grupo | Límite de intentos por aparato; revisar en auditoría |

**Falta**

| Qué falta | Para qué (sección) |
| --- | --- |
| Plan del tema por grupo: tema, número de sesiones, desde, estado de la prueba (abierta o cerrada) | 1.2, 1.5 |
| Resultado de la prueba por ítem, con lectura **solo del docente del grupo** (ni el niño ni el coordinador) | 1.5 |
| Estrella `pronunciar` automática (un intento en Di y brilla, una vez por misión) y `mejorar` cuando una palabra sale de "repasar" | Ronda 1 §5 |
| Autoevaluación "una vez por misión y por día" (hoy es una sola vez por misión) | Ronda 1 §5 |
| Días de práctica, palabras por repasar y superadas, álbum, encargos, duración redondeada, modo de voz | 1.4, resumen familia, piloto |
| Marca de autorización recibida por estudiante, con fecha | 1.1, 4.4 |
| Función para **sumar el avance del aparato** a la cuenta recalculando estrellas en el servidor | 2.3 |
| Varios perfiles recordados en un mismo aparato y entrada sin red donde ya se entró (hoy una sesión anónima apunta a un solo estudiante y el PIN solo se comprueba con red) | 2.1, 2.2 |
| "Cambiar de jugador" (soltar la sesión) | 2.1 |
| Que el docente pueda **consultar** el PIN (hoy solo puede cambiarlo, porque se guarda cifrado). Alternativa suficiente: cambiarlo e imprimir la tarjeta nueva | 2.2 |
| Evitar la doble estrella del docente por reintento sin red (identificador de la acción) y dar a varios a la vez | 1.3 |
| Coordinador: invitar y desactivar docentes (hoy solo el dueño crea perfiles) y asignar docente a un grupo (`crear_grupo` siempre asigna a quien lo crea) | 3 |
| Incidencias de clase por grupo; lista de cotejo semanal | 1.3, 1.6 |
| Cierre de año: borrado del detalle y resumen sin apodo | 4.2 |
| Mensaje del bloqueo: hoy devuelve `false` sin distinguir "PIN errado" de "espera"; el niño necesita el segundo caso para oír "pídele ayuda a tu profe" | 2.2 |

---

## 5. Progresión del inglés dentro del español (estilo "Dora")

**Idea.** El personaje habla en español y deja caer en inglés palabras que el niño **ya encendió**.
La palabra en inglés es entrada comprensible (Krashen) porque el niño ya la conoce y la imagen está
en pantalla; el español sostiene el sentido (andamiaje que se retira por territorios).

| Territorio | Qué entra en inglés | Cuánto | Qué sigue en español |
| --- | --- | --- | --- |
| 1 Bosque | **Una palabra suelta** ya encendida (objeto, color, número, parte del cuerpo, hora) y las fórmulas `Hello`, `Thank you`, `Good morning` cuando ya se encendieron. Desde el segundo tema que el niño juegue | 1 por frase; como mucho 1 de cada 3 frases | Todo lo demás, y **siempre** la instrucción de qué hacer |
| 2 Valle | Dos palabras por frase, o un **trozo completo** corto (`a red apple`, `I'm happy`). Órdenes de clase que ya se oyen a diario (`Look!`, `Listen!`, `Let's go!`) | Hasta 2 por frase; 1 de cada 2 frases | La instrucción y lo nuevo |
| 3 Ciudad | Una **oración corta entera** en inglés dentro del turno (`I wake up at six o'clock. ¿Y tú?`). Instrucciones conocidas ya van en inglés, con gesto o imagen | Una oración por turno | La historia y lo que aún no se ha encendido |
| 4 Plaza | El personaje **pregunta en inglés** y espera (`Where is the park?`); el español aparece solo como ayuda si el niño tarda o la pide | El inglés lleva la conversación | Ayuda a pedido y lo emocional (ánimo, consuelo de Lumi) |

Lumi consuela y anima **siempre en español**, en los cuatro territorios: el filtro afectivo manda.

### 5.1 Frases de ejemplo del Bosque

| Quién | Frase mezclada | Palabras que exige encendidas | Si no, se dice |
| --- | --- | --- | --- |
| Tito | ¡Mi sombrero es **red**! ¿Lo ves por ahí? | red | ¡Mi sombrero es rojo! ¿Lo ves por ahí? |
| Caro | Se me perdió mi **eraser**. ¿Me ayudas a buscarlo? | eraser | Se me perdió mi borrador. ¿Me ayudas a buscarlo? |
| Abu | Llevo cien años contando piedras: **one, two, three**… ¡y siempre me pierdo! | one, two, three | …contando piedras: una, dos, tres… |
| Púa | Con mi **nose** huelo todas las flores del bosque. | nose | Con mi nariz huelo… |
| Nuez | ¡**Thank you**! Ya está en tu álbum. | thank you | ¡Gracias! Ya está en tu álbum. |
| Rayo | ¡Uy, ya son las **three o'clock**! Otra vez voy tarde. | three o'clock | ¡Uy, ya son las tres! Otra vez voy tarde. |
| Lumi | Encendiste el color **blue**. ¡Mira cómo brilla el río! | blue | Encendiste el color azul… |
| Cosmo | ¡**Hello**, Explorer! Hoy vamos al camino de los números. | hello | ¡Hola, Explorer! Hoy vamos… |

("Explorer" es el título del nivel y se usa desde el inicio como nombre propio; no cuenta como palabra.)

### 5.2 Regla para escribir las demás

1. **Solo palabras encendidas.** Cada frase mezclada declara qué palabras exige; si al niño le falta
   alguna, suena la versión en español. Toda frase mezclada tiene su gemela en español.
2. **La palabra en inglés nombra algo que se ve** en pantalla en ese momento (objeto, color, gesto).
3. **Una palabra o un trozo entero, nunca media gramática.** Bien: "mi sombrero es red", "quiero
   a red apple". Mal: "una apple roja", "yo want manzana".
4. **El artículo o posesivo va en español y concuerda con la palabra en español**: "mi nose" (la
   nariz), "el color blue", "las three o'clock".
5. **No se traduce enseguida** ("red, o sea rojo"): el niño aprende a esperar el español. Si hace
   falta ayuda, la da la imagen o tocar la palabra para oírla.
6. **La instrucción de la misión nunca depende del inglés** en los territorios 1 y 2.
7. **Va al final de la frase o antes de una pausa**, y se dice una sola vez con la voz en inglés.
   Invitar a repetir es opcional y sin evaluar ("¿La dices conmigo?"), como máximo una vez por escena.
8. **Nunca en una corrección ni en un consuelo.** Cuando el niño se equivoca, todo va en español,
   salvo la palabra que se repite como modelo.
9. **Tope por territorio** de la tabla anterior. Ante la duda, menos.
10. Contracciones (`I'm`, `It's`, `Let's`) y trato neutro ("Explorer"), como en la ronda 1.

Notas para quien construya (son de datos, no de pantallas): la frase mezclada necesita marcar qué
trozo va en inglés para que cada trozo suene con su voz (hoy el modo `mixto` dice la frase entera en
inglés y luego en español; eso se reemplaza), y el campo de palabras exigidas va en el guion
(`herramientas/construir_bosque.py`), no en el código del juego (regla 1). En el piloto conviene
anotar si los niños repiten espontáneamente la palabra mezclada: es la señal de si la dosis funciona.

---

## 6. Decisiones que debe tomar Manuel

| # | Pregunta | Recomendación |
| --- | --- | --- |
| 1 | **¿Con qué celulares se juega en la hora de clase?** ¿Cada niño trae uno, hay unos pocos para compartir, o solo el del docente con el proyector? | Dígame lo que hay de verdad en ese salón. Mientras tanto se diseña para lo más pobre: **proyector + material impreso siempre alcanzan**, y los celulares suman. Si hay pocos, se rota por estaciones o se juega en parejas. |
| 2 | **¿Cuántas clases dura un tema?** Con una hora semanal, la semana de 5 sesiones ya no existe. | **Dos clases por tema** (una para mirar y jugar, otra para decir y hacer la prueba), con práctica en casa opcional que nunca cuenta para la nota. El Bosque tomaría unas 12 semanas. |
| 3 | **¿Quién responde por los datos de los niños ante las familias: el colegio o usted?** | **El colegio** firma y guarda las autorizaciones (es quien tiene la relación con las familias) y usted figura como quien opera la plataforma. Que el rector revise el texto del §4.4 antes de imprimirlo. |
| 4 | **¿Se usa el micrófono en el piloto?** El navegador puede enviar la voz del niño a su fabricante para reconocer la palabra, aunque la cartilla no la guarde. | Usarlo **solo con permiso expreso** (ya está en el borrador) y dejar siempre la opción de decir la palabra en voz alta sin micrófono. Si el colegio duda, piloto sin micrófono. |
| 5 | **¿El docente puede dar estrellas de "pronunciar"?** Hoy la base de datos lo permite, pero lo acordado es que las da la app. | **Sí, pero solo como respaldo** para el niño que no tiene micrófono, una vez por misión. Así nadie se queda sin esa estrella por su celular. |
| 6 | **¿Se sigue pudiendo jugar sin cuenta?** | **Sí.** Para las familias, para quien prueba la cartilla y para el niño que olvidó su clave. Al entrar con cuenta, lo jugado se suma. |
| 7 | **¿El docente puede ver la clave de dibujos de cada niño?** Verla es más cómodo; guardarla cifrada es más seguro. | **No verla: cambiarla e imprimir la tarjeta.** La clave solo separa hermanos; con la tarjeta impresa basta. |
| 8 | **¿La coordinación ve resultados de la prueba?** | **No**, ni por niño ni por grupo, al menos durante el piloto. |
