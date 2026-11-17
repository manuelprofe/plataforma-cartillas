# Definición pedagógica, ronda 2: cuentas, docente y coordinador

Asesor pedagógico, 17 de noviembre de 2026 (ajustado el mismo día a la decisión de Manuel: el niño
juega **en casa con el celular de los papás**; en el salón solo hay **proyector**). Fase
**definir**: aquí se dice *qué* debe pasar y *para qué*; el *cómo se ve* es del diseñador. Fuentes:
`CLAUDE.md`, `CONTINUAR.md`, `docs/pedagogia/ronda-1.md` (§3, §4, §5, §7), `supabase/esquema.sql`,
`src/escuchar.ts`. El inventario de materiales y dónde vive cada uno está en
`docs/pedagogia/catalogo-interfaces.md`.

**Límite de lo que se afirma.** Nada está medido en aula. Los tiempos son estimaciones para calibrar
en el piloto. Ninguna pantalla (docente, coordinador, familia) ni material de venta dice que la
cartilla "mejora" el aprendizaje o la motivación.

**Marcas de prioridad:** **P** = imprescindible para el piloto · **C** = conviene, si alcanza ·
**E** = puede esperar.

---

## 0. Una hora de clase a la semana, con proyector

Dónde pasa cada cosa:

| Lugar | Qué hay | Qué se hace |
| --- | --- | --- |
| **Salón** | Proyector; el computador del aula de audiovisuales a veces; el celular del docente | Todo lo que cuenta: juego proyectado con el grupo, fichas impresas, decir en parejas, prueba del tema, estrellas del docente |
| **Casa** | El celular de los papás, compartido, a veces entre hermanos, a veces con un adulto cerca | Práctica en la app: sesiones de unos 15 minutos y 3 misiones, **siempre opcional** |

| Tema | Decisión |
| --- | --- |
| Qué es una "sesión" | Unos 15 minutos y 3 misiones de la app, en casa. Lo nuevo se apaga hasta el día siguiente. **No equivale a una clase.** |
| La clase | Se planea completa **sin que ningún niño haya jugado en casa**. El juego en casa repasa lo de la clase; no lo reemplaza ni lo adelanta. |
| Equidad | Nada que solo se pueda hacer en casa **cuenta para la nota, para la prueba ni para las estrellas del docente**, y **nada lo bloquea**: el docente avanza de tema según su plan, no según los faroles de la app; las sesiones no vencen; quien no tiene celular en casa hace todo lo de la clase igual que los demás. El docente nunca pregunta en público quién jugó en casa. |
| Prueba del tema | En clase, proyectada y con hoja impresa (§1.5). El niño nunca ve ese nombre ni una nota. |
| Ritmo sugerido | Un tema = **2 clases**: clase 1 mirar y jugar; clase 2 decir y prueba. Los 6 temas del Bosque serían unas 12 semanas. A calibrar. |
| Nunca se recorta | El mirar y el decir (ronda 1 §3.2). Lo primero que se quita es Memory. |

Hora de clase tipo (estimada, 55 minutos reales):

| Minutos | Momento | Ritmo | Con qué |
| --- | --- | --- | --- |
| 5 | Saludo y repaso de 2 o 3 palabras de la clase anterior | mirar | Láminas proyectadas o impresas |
| 15 | Juego de aula con todo el grupo (Escucha y toca, Memory, Listen & Catch) | mirar → jugar | Proyector |
| 15 | Clase 1: ficha en parejas (escucha y señala, Memory recortado). Clase 2: **prueba del tema** | jugar | Fichas impresas; proyector en la prueba |
| 10 | Decir en parejas o en coro ("Di y brilla" proyectado, sin micrófono) | decir | Voz |
| 5 | Cierre: qué encendimos hoy, caritas en papel; se anuncia la práctica de casa como invitación ("si en casa pueden…") | — | Proyector y hoja de caritas |
| 5 | Transiciones | — | — |

Las estrellas del docente se marcan durante la clase **en la lista impresa del grupo** y se pasan a
la app al final o después (§1.3).

---

## 1. Docente

Principios para todo el modo docente:

- **Dos aparatos, dos papeles.** El **celular del docente** sirve para preparar, dar estrellas y ver
  el avance. **Lo que se proyecta** sale de un computador o del mismo celular conectado.
- **Lo que se proyecta nunca muestra datos de un niño** (ni apodos, ni estrellas, ni avance, ni
  prueba). Solo el juego, las láminas y logros del grupo completo.
- **Si proyecta desde su celular, la pantalla entera se ve en el telón.** Por eso dar estrellas,
  ver la lista o el avance **no se hace mientras proyecta desde el celular**: se marca en papel y se
  pasa después. Al salir del modo proyectar, la app vuelve a una pantalla neutra, nunca a la lista.
- **El juego proyectado no pide cuenta.** Se abre en cualquier computador sin iniciar sesión y sin
  dejar datos de nadie en ese equipo.
- **Funciona sin red.** El tema se deja listo con anticipación en el aparato que proyecta; lo que
  el docente registra se guarda en su celular y sube cuando vuelve la señal, con aviso discreto de
  "pendiente por subir". Si nada de eso sirve, las láminas impresas sostienen la clase.
- **Sin orden por rendimiento.** Las listas van por apodo, alfabéticas. Sin posiciones, sin rojo,
  sin porcentajes junto a un nombre.
- Lenguaje: "todavía está aprendiendo", "le falta encender"; nunca "perdió", "bajo", "atrasado".

### 1.1 Una sola vez, antes de empezar (preparar el grupo)

| Qué hace o ve | Para qué | Prioridad |
| --- | --- | --- |
| Entra con correo y contraseña; recuperar contraseña | Cuenta de adulto | P |
| Crea el grupo (nombre y grado) y recibe el **código del grupo** | Entrada de los niños | P |
| Agrega estudiantes: escribe **solo el apodo** (primer nombre o apodo, sin apellidos; si se repite, una inicial: "Juan M") | Datos mínimos (regla 7) | P |
| Marca por cada niño "autorización recibida" (casilla y fecha). Sin la marca, ese niño no entra con cuenta (sí juega sin cuenta y en clase hace todo) | Ley 1581 (§4) | P |
| La app propone un PIN de tres imágenes por niño; el docente puede cambiarlo | Que nadie quede sin entrar | P |
| Imprime las **tarjetas de entrada** para llevar a casa (apodo, personaje, código del grupo, sus tres imágenes y tres pasos para el adulto) y la **lista del grupo** con casillas de estrellas | Regla 9; el adulto en casa hace la primera entrada | P |
| Código del grupo también como código QR en la tarjeta (solo el código del grupo, nunca el PIN) | Que el adulto no tenga que teclear | C |
| Imprime la autorización para las familias | §4.4 | P |
| Imprime la **encuesta de acceso** para las familias (¿hay celular para el niño en casa?, ¿cuántos niños lo comparten?, ¿hay datos o wifi?) | Saber con qué cuenta cada casa sin preguntarlo en público; registro del piloto | P |
| Agrega varios niños pegando una lista de apodos | Ahorra tiempo con 35 niños | C |
| Mueve a un niño de grupo o lo retira (borra sus datos) | Traslados y retiro del consentimiento | P (retirar) · E (mover) |

### 1.2 Antes de la clase (planear, 5 minutos)

| Qué hace o ve | Para qué | Prioridad |
| --- | --- | --- |
| **Plan del tema:** elige el tema y las fechas de sus 2 clases. La app le muestra el **planeador** de cada clase (la hora tipo de §0 con el material de ese tema) y qué misiones quedan como práctica en casa entre una clase y otra | Plan por semanas (decisión vigente) | P |
| Ve el plan en una frase: "Clase 1: escuchar y atrapar los colores. Clase 2: decirlos y prueba" | Que planear no exija leer una tabla | P |
| Ajusta el planeador (cambia un momento, anota algo) sin perder el sugerido | Su grupo es suyo | C |
| Cambia el plan a mitad de camino (festivo, clase perdida) sin que ningún niño pierda lo hecho | Realidad del calendario | P |
| **Deja listo el tema para proyectar** en el aparato que va a usar (computador o celular), para no depender de la red del colegio | Funciona sin red | P |
| **Materiales del tema** (guía, láminas, fichas, prueba, lista de cotejo, caritas), todos imprimibles; detalle en el catálogo | Regla 9 | P (guía, láminas, escucha y señala, prueba, caritas, lista del grupo) · C (Memory, cotejo, resto) |
| Qué estándar y DBA cubre el tema, en una línea | Planeación institucional. **Sin número de DBA hasta cotejarlo con el documento oficial** (ronda 1) | C |
| Cómo va el grupo desde la última clase (§1.4), sabiendo que eso solo refleja a quien juega en casa | Andamiaje (Vygotsky) | C |
| Idea de actividad sin pantalla para "decir en parejas" de ese tema | Relación (Ryan y Deci) | P |
| Elegir palabras de la misión de voz (ronda 1 §2.3 lo permitía) | Ajuste fino | E |

### 1.3 Durante la clase

| Qué hace o ve | Para qué | Prioridad |
| --- | --- | --- |
| **Proyectar un juego de aula**: las mismas plantillas (Escucha y toca, Listen & Catch, Memory) con las palabras del tema, en horizontal y en grande. No pide cuenta, no guarda nada de nadie, funciona sin red | Entrada comprensible para todos antes de jugar solos (Krashen) | P (Escucha y toca y Memory) · C (Listen & Catch) |
| **Proyectar láminas** del tema, una por pantalla, con su audio | Mirar antes de jugar (Bruner) | P |
| En el juego proyectado: turnos por equipos o "todos señalan"; el error se trata igual que en la app (se repite la palabra, sin "perdiste"); sin marcador por equipos que deje un perdedor | Regla 6 | P |
| Botón grande para **repetir la palabra** y para decirla **más despacio**, manejable desde el teclado o el mouse del computador y por toque en el celular | Primera ayuda del andamiaje | P |
| "Di y brilla" proyectado: el grupo dice la palabra en coro; **sin micrófono** en modo aula | Filtro afectivo bajo: nadie habla solo frente a todos si no quiere | C |
| **Marcar Mission Stars en la lista impresa** del grupo (casillas participar y colaborar por clase) | Funciona proyectando desde el celular; regla 9 | P |
| **Pasar las estrellas a la app** desde su celular, sin proyectar: toca al niño y elige **participar (10)** o **colaborar (15)**; dos toques como máximo. Puede hacerlo al final de la clase o el mismo día | Regla 5 | P |
| Colaborar se da a **varios a la vez** (pareja o equipo): marca a los niños y da una sola vez | Colaborar es de más de uno | P |
| Toque equivocado: durante unos segundos puede **deshacer antes de que se guarde**. Una vez guardada, la estrella no se quita nunca | "Nunca se quitan" sin castigar el error del docente | P |
| Señal suave de a quién ya reconoció en las últimas clases y a quién no (solo en su celular, nunca proyectado) | Que no reciban estrellas siempre los mismos | P |
| No hay forma de quitar, restar ni condicionar estrellas; tampoco "estrellas por portarse bien": los dos motivos son conductas de aprendizaje | Kapp: mecánica con propósito | P |
| El niño ve la estrella del docente **la próxima vez que entra en casa**, con Lumi diciendo por qué ("Tu profe vio que ayudaste a un compañero"). Quien no entra no pierde nada: las estrellas del docente constan en su registro | Reconocer la conducta, no el número | C |
| Anotar una incidencia del aula con un toque: sin proyector, sin sonido, sin red, sin aula de audiovisuales | Registro del piloto (§1.6) | C |

### 1.4 Ver el avance del grupo sin exponer a nadie

Todo lo que viene de la app refleja solo a quien juega en casa. **No sirve para calificar** y la
pantalla lo dice en una línea.

| Vista | Qué muestra | Qué no muestra | Prioridad |
| --- | --- | --- | --- |
| **Grupo, por tema** | Cuántos niños encendieron cada farol del tema ("Listen & Catch: 21 de 34"). Palabras que el grupo todavía está aprendiendo (las 3 a 5 que más aparecen en "repasar"). Palabras que más costaron en la prueba | Nombres | P |
| **Lista del grupo** | Por apodo, alfabética: estrellas por conducta, resultado de la prueba registrado, y si practica en casa (sí o no, informativo) | Orden por puntaje, total comparado, promedio del grupo al lado | P |
| **"Para acompañar"** | Lista corta y privada: quien no ha llegado a una misión de voz, quien repite la misma misión sin encender, quien no ha recibido estrellas del docente en 3 clases | El título "atrasados"; "no juega en casa" como alerta (puede no tener celular); nunca se proyecta ni se imprime con nombres | P |
| **Un niño** | Lo que encendió, lo que repasó y ahora le sale, hasta 3 palabras para seguir practicando, estrellas por conducta, su carita de autoevaluación, resultado de la prueba | Tiempos exactos, número de errores por misión | P |
| **Resumen para la familia** por niño, imprimible (ronda 1 §4) | Lo logrado primero, incluido lo de clase | Nota de la prueba, comparación con el grupo | C |
| Diferencia entre carita del niño y lo que encendió | Para conversar con él, no para corregir su autoevaluación | — | E |

Regla para el diseñador: si una vista con nombres puede verse desde el puesto de un niño (proyector,
tablero, hoja en la pared), no lleva datos de avance.

### 1.5 Prueba del tema

**Decisión: se hace en clase, proyectada, con hoja impresa para cada niño.** Es la única forma de
que todos la presenten en igualdad de condiciones. En casa existe "El reto de Cosmo" como misión de
repaso, que **no** cuenta para la prueba.

| Aspecto | Definición | Prioridad |
| --- | --- | --- |
| Contenido | 6 ítems de escucha + 3 de decir, donde **cuenta el intento** (ronda 1 §3.2) | P |
| Escucha, proyectada | Cada ítem es una fila marcada con un dibujo (sol, luna, árbol…), no con número ni texto. El telón muestra la fila con 4 imágenes y suena la palabra dos veces; el niño encierra la imagen en su hoja, que tiene las mismas filas | P |
| Decir | El docente pasa por las parejas con la lista de cotejo: el niño dice 3 palabras señalando la lámina; se marca **intentó** o **todavía no**. Nadie habla solo frente al grupo | P |
| Lo que ve el niño | En el telón y en su hoja: "El reto de Cosmo". La hoja **no tiene casilla de nota ni de puntaje**. Al final se repasan juntos los 6 ítems en el telón, como juego, después de recoger las hojas. Si la hoja se devuelve, va sin nota escrita | P |
| Registro | El docente pasa a su celular, por niño, aciertos de escucha (de 6) e intentos de voz (de 3); por grupo, las palabras que más costaron. Si no lo pasa, la prueba vale igual en papel | C |
| Nota institucional | **El docente decide la nota** en la escala del colegio y la registra donde siempre. La app no convierte ni guarda la nota | P |
| Quién más lo ve | **Nadie.** Ni coordinador, ni familia, ni el propio niño | P |
| Sin proyector | El docente dice la palabra en voz alta y señala la fila en una lámina impresa grande | P |
| Quien faltó | La presenta en la clase siguiente con la misma hoja, mientras el grupo hace la ficha | C |
| No bloquea | La prueba no enciende faroles ni abre puertas | P |

### 1.6 Después de la clase

| Qué hace o ve | Para qué | Prioridad |
| --- | --- | --- |
| Pasar las estrellas marcadas en papel y confirmar que todo subió | Conexión inestable | P |
| Registrar resultados de la prueba (§1.5) | Calificar | C |
| Lista de cotejo de la semana, 3 casillas por niño: participa, pide repetir, ayuda a un compañero (impresa; digital si alcanza) | Registro del piloto (ronda 1 §7) | C |
| Enviar o imprimir el resumen para la familia | Ronda 1 §4 | C |
| Cambiar el PIN de un niño e imprimir su tarjeta nueva (la familia avisa por el cuaderno) | PIN olvidado en casa | P |
| Exportar o imprimir el avance del grupo para su planilla | Entrega al colegio | E |
| Historial de planes y comparación entre periodos | — | E |

**Registro del piloto** (lo que debe quedar para poder decir algo después).
- **Antes:** encuesta de acceso de las familias (§1.1); prueba impresa de entrada (10 palabras de
  escuchar y señalar, 5 de decir); encuesta de caritas.
- **Durante:** clases dadas y con qué (proyector, computador, solo papel); estrellas por conducta;
  pruebas del tema; lista de cotejo; incidencias del aula; en la app, por grupo y sin nombres:
  cuántos niños practican en casa, sesiones, misiones encendidas, palabras que salen de "repasar",
  modo de voz usado.
- **Después:** la misma prueba y la misma encuesta; entrevista al docente y a 3 a 5 familias
  (incluir al menos una sin celular disponible). Comparar a quienes practican en casa con quienes
  no solo sirve como pista, no como prueba de efecto: las casas difieren en mucho más que la app.

---

## 2. Estudiante: un celular de la familia, varios niños

Supuestos: el celular es de un adulto; lo usan uno o varios hermanos (a veces de grupos o grados
distintos); a veces hay un adulto al lado y a veces no; el niño lee poco.

### 2.1 Lo que debe pasar

| Paso | Qué ocurre | Pensando en… |
| --- | --- | --- |
| Primera vez en ese celular | **La hace un adulto con la tarjeta de entrada**: toca "Tengo una tarjeta", escribe el código del grupo (o lee el QR) y el niño toca su cara. El código se escribe una vez por grupo y el celular lo recuerda. Teclado propio con letras grandes; el código no usa letras que se confundan | Adulto que ayuda una vez; el niño no vuelve a ver este paso |
| Portada, de ahí en adelante | **"¿Quién va a jugar?"**: las caras y apodos de los niños que ya entraron en ese celular (aunque sean de grupos distintos), más **"Otro niño con tarjeta"** y **"Jugar sin tarjeta"**. Lumi lo dice en voz alta | Hermanos: cada uno toca su cara |
| PIN | Toca sus tres imágenes en orden, entre 10 imágenes grandes, siempre en el mismo lugar, bien distintas en forma y color. Puede borrar la última. **Sin voz que nombre lo que toca** y sin texto obligatorio. Se pide **cada vez que se abre** si en el celular hay más de un perfil; si hay uno solo, entra directo | Que un hermano no juegue en el perfil del otro |
| Bienvenida | Lumi lo saluda por su apodo y lo deja en el mapa donde iba | Relación; continuidad |
| Jugar | Su progreso, su álbum, sus estrellas y **su** límite de 3 misiones al día son solo suyos | No mezclar progresos |
| Cambiar de jugador | Botón visible en el mapa y al terminar cada sesión, con su cara. Cambiar no borra nada. Si el celular queda quieto un rato, al volver se pregunta otra vez "¿Quién va a jugar?" | Hermanos que se turnan; celular que vuelve al adulto |
| Jugar sin tarjeta | Perfil **"Invitado"** aparte, guardado solo en el celular. No se mezcla con ningún perfil con cuenta (ver §2.3) | Familias, conocidos, quien olvidó su clave |
| Zona de la familia | Puerta con un reto para adultos. Ahí: cómo ayudar al niño (audio corto), límite diario o "sin límite" **por niño**, micrófono sí o no, perfiles guardados en este celular, "empezar de nuevo", **"olvidar este celular"** (quita perfiles y avance del aparato, no de la cuenta) y qué datos se guardan | El adulto decide sin que el niño vea menús técnicos (regla 8) |

Quién crea la cuenta: **el docente** (el esquema ya lo exige). El niño no se registra solo ni
escribe datos suyos. En clase el docente puede **proyectar una demostración** de la entrada con un
perfil de ejemplo ("Lumi"), nunca con un niño real.

Sin notificaciones, sin pedir número ni correo de la familia, sin leer contactos ni fotos del
celular.

### 2.2 Si se equivoca o lo olvida

| Situación | Qué ocurre | Qué no ocurre |
| --- | --- | --- |
| PIN equivocado | Las imágenes se sacuden suave y Lumi dice "Esas no son. Prueba otra vez con calma" | Sonido de error, contador de intentos, la palabra "incorrecto" |
| Varios intentos fallidos | "Lumi necesita un descanso. Busca tu tarjeta o pídele ayuda a un adulto", y la opción **"Jugar mientras tanto"** | La palabra "bloqueado", un reloj de cuenta regresiva, quedarse sin jugar |
| Olvidó el PIN | Mira su tarjeta. Si la perdió, juega "mientras tanto"; la familia avisa por el cuaderno y el docente le cambia el PIN e imprime una tarjeta nueva | Preguntas de seguridad, correo, recuperación con datos de la familia |
| Hermanos en grupos distintos | El celular recuerda los dos códigos; en "¿Quién va a jugar?" aparecen todos juntos | Tener que escribir el código cada vez |
| No hay red al entrar | En un celular donde ya entró antes, **entra y juega igual**; lo jugado sube después. En un celular nuevo, juega como invitado y se une luego | Pantalla de "sin conexión" que impida jugar |
| Un hermano entra en el perfil del otro | El PIN lo evita en lo normal. Si pasa, no hay daño grave: el avance solo crece | — |
| El celular se cambia o se pierde | Al entrar en otro celular con la tarjeta, el avance de la cuenta sigue ahí | Perder el recorrido |

"Jugar mientras tanto" guarda lo jugado en el perfil invitado y, cuando el niño logra entrar, **se
suma a su cuenta** (regla de 2.3). Un PIN olvidado nunca deja a un niño por fuera (filtro afectivo).

### 2.3 El avance del perfil invitado

| Caso | Qué ocurre |
| --- | --- |
| Un niño entra con cuenta y en el celular hay avance de invitado | Una sola pregunta, con el personaje y los faroles a la vista y con voz: **"¿Este camino lo recorriste tú?"** Sí / No |
| Dice que sí | El avance se **suma** a su cuenta: farol encendido en cualquiera de los dos lados queda encendido; álbum y palabras por repasar se unen. Nada se pierde ni se pisa |
| Estrellas | No se copia el número guardado en el aparato: la cuenta las **vuelve a calcular** con las reglas de siempre. Puede cambiar un poco el total; se dice con naturalidad ("Lumi contó tus estrellas") |
| Dice que no (era de un hermano) | Ese avance queda como invitado para quien lo reclame |
| Ya fue sumado a una cuenta | El invitado queda vacío; no se ofrece a nadie más |
| Su cuenta ya tenía avance (jugó en otro celular) | Igual: se suma. Nunca se pregunta "¿cuál quieres conservar?" |
| Sigue sin cuenta | Todo funciona como hoy, guardado solo en el aparato |

"Empezar de nuevo" (zona de la familia) con cuenta: borra lo del aparato, **no** lo de la cuenta;
borrar la cuenta lo hace el docente a pedido de la familia.

---

## 3. Coordinador

**Principio:** ve grupos, no niños. No necesita ningún dato individual para su trabajo.

| Ve | Detalle | Prioridad |
| --- | --- | --- |
| Uso por grado y grupo | Niños con cuenta, cuántos practicaron en casa esta semana y este mes, clases dadas con la cartilla | P |
| Avance por grado y grupo | Tema que cursa cada grupo según el plan del docente, faroles encendidos por tema como proporción de quienes juegan, territorio en que va | P |
| Estrellas por conducta, por grupo | Cuántas de cada tipo en total (muestra si se reconoce participar y colaborar, no solo completar) | C |
| Condiciones de uso | Incidencias sumadas por grupo: sin proyector, sin sonido, sin red; acceso en casa según la encuesta, en conteos | C |
| Docentes | Nombre, correo, grupos a cargo, última vez que planeó un tema | P |
| Autorizaciones | Cuántas recibidas por grupo ("31 de 34"), sin nombres | P |
| Materiales de la cartilla | Guías, planeadores y estándares por tema, solo para leer | C |

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

Esto es criterio pedagógico y de mínimos, **no concepto jurídico: el texto final lo revisa el
colegio** (el rector o quien lo asesore en protección de datos).

### 4.1 Qué se guarda

| De quién | Dato | Para qué | Quién lo ve | Cuánto tiempo |
| --- | --- | --- | --- | --- |
| Estudiante | Apodo o primer nombre, personaje elegido, grupo | Entrar y que el docente lo reconozca | Él, su docente; en el celular de su casa, quien lo use | Hasta 30 días después del cierre del año escolar |
| Estudiante | PIN de tres imágenes (cifrado) | Separar perfiles en el celular compartido | Nadie lo lee; el docente lo cambia | Igual |
| Estudiante | Misiones encendidas, veces jugadas, palabras del álbum y por repasar, palabras superadas | Continuar donde iba; resumen para la familia; acompañar | Él (como luz y álbum), su docente | Detalle: hasta el cierre del año. Después solo el resumen sin apodo |
| Estudiante | Fechas en que practicó (día, sin hora) | Sesión del día; "practicó N días" | Su docente; familia en el resumen | Igual |
| Estudiante | Duración por misión redondeada, modo de voz usado (contadores) | Calibrar la sesión de 15 minutos en el piloto | Solo sumado por grupo | Fin del piloto |
| Estudiante | Carita de autoevaluación | Reconocer la conducta; conversar con el niño | Él, su docente | Cierre del año |
| Estudiante | Mission Stars: motivo, cantidad, fecha, si la dio el docente | Reconocer conductas | Él (total y accesorios), su docente; coordinador solo sumado por grupo | Cierre del año |
| Estudiante | Resultado de la prueba del tema (aciertos de 6, intentos de 3), si el docente lo registra | Que el docente califique | **Solo su docente** | Cierre del periodo académico |
| Estudiante | Casilla "autorización recibida" y fecha (el papel se queda en el colegio) | Demostrar el permiso | Docente; coordinador solo el conteo | Mientras exista la cuenta |
| Grupo | Respuestas de la encuesta de acceso, en conteos | Planear con lo que hay en las casas | Docente, coordinador | Fin del piloto |
| Docente | Nombre, correo, colegio, grupos, planes de tema, planeadores ajustados | Cuenta y planeación | Él, su coordinador, el dueño | Mientras trabaje con la plataforma; se borra a solicitud |
| Coordinador | Nombre, correo, colegio | Cuenta | Él, el dueño | Igual |
| Colegio | Nombre, municipio | Organizar | Sus usuarios, el dueño | Mientras dure el convenio |

### 4.2 Qué no se guarda

- Apellidos, documento, fecha de nacimiento, sexo, dirección, teléfono, correo o foto del niño.
- Datos de la familia ni del celular de la familia (número, contactos, identificadores del aparato).
- **Audio de la voz** ni el texto que reconoce el micrófono.
- Hora exacta de juego, ubicación, datos de salud.
- La nota institucional (la pone el docente en el sistema del colegio).
- Nada para publicidad; no se comparte con terceros fuera del servicio de almacenamiento.

Borrado: al cerrar el año se elimina el detalle por niño; para el estudio del piloto queda solo un
resumen sin apodo ni grupo identificable. Si la familia retira el permiso, la cuenta se borra (el
docente lo hace; plazo que debe prometerse: máximo 15 días hábiles) y el niño sigue participando con
el juego proyectado, el material impreso o el modo sin cuenta. Lo guardado en el celular de la
familia lo borra la familia con "olvidar este celular".

### 4.3 Dos riesgos que hay que resolver antes del piloto (para el auditor)

1. **Micrófono.** `src/escuchar.ts` usa el reconocedor de voz del navegador. La app no guarda audio,
   pero en Chrome ese reconocedor suele enviar el sonido al servicio del fabricante para
   convertirlo en texto. Hay que verificarlo y, mientras tanto, **no prometer "la voz no sale del
   celular"**. Decisión vigente: micrófono solo con permiso expreso y siempre la opción de decir la
   palabra en voz alta sin micrófono.
2. **Datos en Estados Unidos.** El proyecto de Supabase está en la región East US (Ohio). Eso es un
   envío de datos personales de menores fuera de Colombia. Según la Ley 1581 (art. 26) y el Decreto
   1377 de 2013, hay que establecer si es **transferencia o transmisión** internacional, si Estados
   Unidos figura entre los países con nivel adecuado según la Superintendencia de Industria y
   Comercio, y si hace falta contrato de transmisión con el proveedor (acuerdo de tratamiento de
   datos de Supabase). Mientras se resuelve, la autorización lo pide **de forma expresa** (§4.4).
   **No es concepto jurídico; lo revisa el colegio.**

### 4.4 Autorización de los padres o acudientes

Hace falta: permiso **previo, expreso, escrito y firmado** por el representante legal de cada niño,
que diga qué datos, para qué, dónde se guardan (incluido el país), quién responde y cómo retirarlo;
que sea **voluntario** y que negarlo no afecte la nota; y contarle al niño, en sus palabras, qué se
guarda (su opinión cuenta). Una hoja, impresa, con desprendible.

**Aviso: este borrador no es concepto jurídico. Antes de imprimirlo lo revisa el colegio.**

Borrador (usted, frases cortas; lo entre corchetes lo completa el colegio):

> **Permiso para usar English Adventure Quest en la clase de inglés**
>
> Señor padre, madre o acudiente:
>
> En la clase de inglés de grado tercero vamos a probar una cartilla llamada English Adventure
> Quest. En clase la usamos proyectada en el tablero y con hojas impresas. En casa, si ustedes
> quieren, el niño o la niña puede jugar en el celular de la familia. **Jugar en casa es opcional y
> no cuenta para la nota.** Para que su hijo o hija pueda continuar donde iba, la cartilla guarda
> unos pocos datos.
>
> **Qué se guarda:** un apodo o el primer nombre (sin apellidos), el personaje que eligió, una clave
> de tres dibujos, las misiones que juega, las palabras que practica, los días en que practicó y las
> estrellas que recibe por participar, completar, pronunciar, colaborar, mejorar y autoevaluarse.
>
> **Qué no se guarda:** apellidos, documento, dirección, teléfono, correo, fotos ni grabaciones de
> voz. Tampoco datos de ustedes ni de su celular. [Si se usa micrófono: Cuando el niño dice una
> palabra, el navegador del celular puede enviar ese sonido a su fabricante para reconocerla. La
> cartilla no lo guarda. Usted puede pedir que su hijo practique sin micrófono.]
>
> **Para qué:** para que el niño siga su recorrido, para que su docente lo acompañe y para evaluar
> si la cartilla sirve en el aula. No se usa para publicidad ni se entrega a otras personas.
>
> **Quién lo ve:** su hijo o hija y su docente de inglés. La coordinación ve solo cifras del grupo
> completo, sin nombres.
>
> **Dónde se guardan:** en un servicio de internet protegido (Supabase) cuyos servidores están en
> **Estados Unidos**. Es decir, estos datos salen de Colombia. Al marcar "sí" usted autoriza de
> forma expresa ese envío. En su celular también queda el avance del niño; puede borrarlo desde la
> zona de la familia de la cartilla.
>
> **Hasta cuándo:** se borran al terminar el año escolar.
>
> **Sus derechos:** usted puede conocer estos datos, pedir que se corrijan o se borren y retirar
> este permiso cuando quiera, hablando con [docente] o escribiendo a [correo o teléfono].
> Responsable de los datos: [colegio]. Opera la plataforma: [Manuel Vega].
>
> **Es voluntario.** Si no autoriza, su hijo o hija participa igual en la clase con los juegos
> proyectados y el material impreso, y su nota no cambia.
>
> ---
> Yo, ________________________, acudiente de ________________________ del grado ____,
> **sí ☐ no ☐** autorizo el uso de estos datos, incluido su almacenamiento en Estados Unidos,
> según la Ley 1581 de 2012.
> Firma: ________________ Fecha: ____________

### 4.5 Comparación con `supabase/esquema.sql` (no se modificó)

**Sobra o da más acceso del necesario**

| Dónde | Qué pasa | Qué se pide |
| --- | --- | --- |
| `puedo_ver_grupo` → `puedo_ver_estudiante` | El coordinador puede leer apodo, progreso y estrellas de **cada niño** de su colegio, y editar o borrar estudiantes | Coordinador: solo cifras por grupo (vista o función sumada); sin lectura de `estudiantes`, `progreso_misiones` ni `estrellas` por fila |
| `dar_estrellas` | Permite al docente dar `pronunciar` sin límite | Decisión vigente: solo participar y colaborar, y `pronunciar` como respaldo una vez por misión |
| `registrar_mision` | Da `mejorar` cada vez que bajan los errores, sin tope | Una vez por misión (ronda 1 §5) |
| `creado`, `actualizado` (`timestamptz`) en progreso, estrellas y sesiones | Queda la hora exacta de juego del niño | Guardar solo el día, o no mostrar ni exportar la hora |
| `estudiantes.avatar` por defecto `'lumi'` | Lumi no es un personaje elegible (son Tavi, Mika, Bruno) | Corregir el valor por defecto |
| `lista_grupo` | Cualquier sesión, incluso anónima, que adivine un código de 5 caracteres recibe los apodos del grupo | Límite de intentos por aparato; revisar en auditoría |

**Falta**

| Qué falta | Para qué (sección) |
| --- | --- |
| Plan del tema por grupo: tema, fechas de clase 1 y 2, planeador ajustado | 1.2 |
| Resultado de la prueba por niño (aciertos de 6, intentos de 3) y palabras que costaron por grupo, con lectura **solo del docente del grupo** | 1.5 |
| Estrella `pronunciar` automática (un intento en Di y brilla, una vez por misión) y `mejorar` cuando una palabra sale de "repasar" | Ronda 1 §5 |
| Autoevaluación "una vez por misión y por día" (hoy es una sola vez por misión) | Ronda 1 §5 |
| Días de práctica, palabras por repasar y superadas, álbum, encargos, duración redondeada, modo de voz | 1.4, resumen familia, piloto |
| Marca de autorización recibida por estudiante, con fecha | 1.1, 4.4 |
| Función para **sumar el avance del invitado** a la cuenta recalculando estrellas en el servidor | 2.3 |
| **Varios perfiles de uno o varios grupos en un mismo aparato**, con entrada sin red donde ya se entró (hoy una sesión anónima apunta a un solo estudiante y el PIN solo se comprueba con red) | 2.1, 2.2 |
| "Cambiar de jugador" (soltar la sesión) y límite diario por perfil | 2.1 |
| Evitar la doble estrella del docente por reintento sin red (identificador de la acción) y dar a varios a la vez | 1.3 |
| Coordinador: invitar y desactivar docentes (hoy solo el dueño crea perfiles) y asignar docente a un grupo (`crear_grupo` siempre asigna a quien lo crea) | 3 |
| Incidencias del aula por grupo; lista de cotejo; encuesta de acceso en conteos | 1.1, 1.3, 1.6 |
| Cierre de año: borrado del detalle y resumen sin apodo | 4.2 |
| Mensaje del bloqueo: hoy devuelve `false` sin distinguir "PIN errado" de "espera"; el niño necesita el segundo caso para oír "busca tu tarjeta" | 2.2 |

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

## 6. Decisiones

### 6.1 Ya tomadas por Manuel (17 nov)

- Los niños juegan en casa con el celular de los papás; en el salón hay proyector (§0, §1, §2).
- Dos clases por tema; práctica en casa opcional que nunca cuenta para la nota.
- Los datos los responde el colegio, con revisión del rector; Manuel opera la plataforma.
- Micrófono solo con permiso expreso; siempre se puede decir la palabra sin micrófono.
- El docente da "pronunciar" solo como respaldo, una vez por misión.
- Se puede jugar sin cuenta (perfil invitado).
- El docente cambia el PIN pero no lo ve.
- La coordinación no ve resultados de la prueba.

### 6.2 Tomadas por el pedagogo en este ajuste

- La prueba del tema es **en clase, proyectada y con hoja impresa**; en casa solo hay un reto de
  repaso que no cuenta. Registrar resultados en la app es C.
- Las estrellas del docente se marcan en **papel durante la clase** y se pasan a la app después.
- En un celular con varios perfiles, el PIN se pide cada vez; con uno solo, entra directo.
- La primera entrada la hace un adulto en casa con la tarjeta; la familia no tiene cuenta.

### 6.3 Pendientes de Manuel

| # | Pregunta | Recomendación |
| --- | --- | --- |
| 1 | **¿Cómo se conecta el proyector del salón?** ¿Cable HDMI a computador, al celular con adaptador, o inalámbrico? | Necesario para el diseñador. Si es desde el celular del docente, vale la regla de no dar estrellas mientras proyecta. |
| 2 | **¿Se mantiene Supabase en Estados Unidos?** | Mantenerlo, con autorización expresa en la hoja y revisión del colegio (§4.3). Cambiar de región no deja los datos en Colombia de todas formas. |
| 3 | **¿Quién envía y recoge la encuesta de acceso y la autorización?** | El docente, en la primera reunión de padres, antes de crear cuentas. |
