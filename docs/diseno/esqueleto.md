# Diseño del esqueleto de la plataforma

Diseñador, 17 de noviembre de 2026. Fase **diseñar**: no hay código de la app. Parte de `CLAUDE.md`,
`CONTINUAR.md`, `docs/pedagogia/catalogo-interfaces.md` (en adelante **catálogo**),
`docs/pedagogia/ronda-2-docente.md` (en adelante **R2**), `supabase/esquema.sql` y `src/App.tsx`.

Objetivo: que el desarrollador arme **todas las pantallas de los cinco modos con sus secciones
vacías**, listas para recibir contenido después sin rediseñar. Lo que aquí se llama "hueco" es el
lugar fijo donde luego cae una guía, un planeador o una ficha.

Bocetos en `docs/diseno/esqueleto/*.webp` (fuente HTML estática en `docs/diseno/esqueleto/fuente/`,
con los tokens en `fuente/tokens.css`). Se ven con el repositorio instalado (`npm install` trae la fuente).

---

## 1. Mapa de pantallas y rutas

### 1.1 Principios de navegación

| Regla | Cómo se cumple |
| --- | --- |
| El niño no se topa con la entrada de adultos | En `/` solo existe "Para la familia" (sostener 3 s, como hoy). La entrada con correo está **dentro** de la zona de la familia y en su propia dirección `/adultos` |
| Rutas reales, no estados ocultos | Rutas con la API de historial; Netlify reescribe todo a `index.html` (`/* /index.html 200`) y el service worker responde las navegaciones con el `index.html` guardado. El botón atrás de Android funciona en todos los modos |
| Cada modo es un trozo de código aparte | Tres paquetes: **estudiante** (lo de hoy; Supabase se carga solo al usar una tarjeta o al sincronizar), **adultos** (docente, coordinador, dueño, con Supabase) y **proyectar** (sin Supabase, sin datos de nadie). La primera carga de `/` no crece por el esqueleto |
| Nada técnico en la dirección del niño | Sin identificadores en las rutas del niño; el perfil activo vive en memoria y en el aparato |
| Una sesión de adulto no cambia lo que ve el niño | Si en el celular hay sesión de docente, `/` sigue siendo "¿Quién va a jugar?". El docente entra por `/docente` (acceso directo del manifiesto: "Docente") |

### 1.2 Árbol de pantallas

```
/                        ¿Quién va a jugar?  ─┬─ cara con cuenta ──> /clave ──> (/unir) ──> /mapa
                                              ├─ cara invitado ─────────────────────────> /mapa
                                              ├─ Jugar sin tarjeta ──> /elegir ──> /historia ──> /mapa
                                              ├─ Tengo una tarjeta ──> /tarjeta ──> /tarjeta/quien ──> /clave
                                              └─ Para la familia (sostener 3 s) ──> /familia
/t/K7M2P                 Lo abre la cámara del celular desde el QR de la tarjeta: /tarjeta con el código puesto
/mapa                    Mundo (ronda-2-mapa)  ── /mision/:id · /album · /vestidor · /recuerdos · /estrellas
/familia                 Zona protegida ── ... ── "¿Es docente o directivo? Entrar" ──> /adultos

/adultos                 Correo y contraseña ──> según el rol: /docente · /colegio · /plataforma
/adultos/recuperar       /adultos/clave-nueva (enlace del correo) · /adultos/invitacion (primera contraseña)

/docente                 Inicio
/docente/grupos          Mis grupos ── /:g (lista) ── /:g/estrellas · /:g/avance · /:g/acompanar
                                       /:g/nino/:e · /:g/prueba/:tema · /:g/tarjetas · /:g/ajustes
/docente/planear         Plan por grupo ── /:g/:tema (clases 1 y 2) 
/docente/temas/:tema     Materiales del tema ── /:material   (plantilla común, §4)
/docente/registro        Registro del piloto ── /cotejo · /incidencias · /encuesta · /entrada-salida
/docente/ayuda · /docente/cuenta

/proyectar               Elegir tema (sin cuenta)  ── /:tema (menú) ── /:tema/:material · /:tema/juego/:plantilla
/proyectar/fin           Pantalla neutra al terminar

/colegio                 Coordinador: uso y avance ── /docentes · /grupos · /materiales · /cierre · /cuenta
/plataforma              Dueño: colegios ── /cartillas · /documentos · /cuentas · /piloto
```

### 1.3 Estudiante (celular familiar compartido)

| Pantalla | Ruta | Qué hay | Qué pasa al tocar | Voz |
| --- | --- | --- | --- | --- |
| ¿Quién va a jugar? | `/` | Lumi arriba con globo; rejilla de 2 columnas con una cara de 112 px por perfil (tarjeta 176 px de alto), apodo debajo; perfil invitado con borde punteado oro y "Sin tarjeta"; abajo "Otro niño con tarjeta" (72 px). Sin perfiles: Lumi grande, título, "Jugar sin tarjeta" (88 px, oro) y "Tengo una tarjeta". Pie: "Para la familia" | Cara con cuenta: se eleva, las demás se apagan, Lumi dice "¡Hola!", y a `/clave` (o directo al mapa si es el único perfil, R2 §2.1). Invitado: al mapa. "Otro niño con tarjeta": a `/tarjeta` | "¿Quién va a jugar?" al entrar; se repite tocando el globo |
| Tarjeta: código | `/tarjeta` | Para el adulto: 5 casillas de 56 px, teclado propio de 6 columnas con las 31 letras y números del código (teclas de 53 × 48), "Seguir". Texto: "Escriba el código del grupo que está en la tarjeta" | Al completar 5 caracteres se consulta. Bien: a `/tarjeta/quien`. Mal: "Ese código no existe. Revise la tarjeta" (sin voz de Lumi: lo lee el adulto) | No |
| Tarjeta: ¿quién eres? | `/tarjeta/quien` | Caras y apodos del grupo, orden alfabético, 3 columnas (108 × 120) | Toca su cara: a `/clave` | Lumi: "Busca tu cara" |
| Clave (PIN) | `/clave` | Cara y apodo arriba (88 px); 3 ranuras de 72 px y "borrar la última" (64 px); Lumi con globo; 10 imágenes en 4 + 4 + 2 teclas de 72 px, siempre en el mismo sitio, en la mitad de abajo | Cada toque llena la ranura siguiente. A la tercera se comprueba. Ver estados en §6, boceto 02 | "Toca tus tres dibujos". Nunca nombra la imagen tocada |
| Descanso | (estado de `/clave`) | Tras 5 errores: Lumi, "Jugar mientras tanto" (oro) y "¿Quién va a jugar?" | "Jugar mientras tanto": al perfil invitado | "Lumi necesita un descanso. Busca tu tarjeta o pídele ayuda a un adulto" |
| ¿Lo recorriste tú? | `/unir` | Personaje y faroles del invitado a la vista; "Sí" (menta, 88 px) y "No" | Sí: suma (R2 §2.3) y Lumi "Lumi contó tus estrellas". No: sigue al mapa | La pregunta, con voz |
| Elegir personaje | `/elegir` | Lo de hoy (`ElegirHeroe`), solo para el invitado | — | Lo de hoy |
| Mapa | `/mapa` | Lo de `ronda-2-mapa.md`, más **cambiar de jugador**: cara del niño en un círculo de 56 px arriba a la izquierda | Cambiar de jugador: a `/`. Inactivo 10 min con más de un perfil: al volver, `/` | — |

Sin red: celular donde ya entró, **entra igual** (el PIN se comprueba con una huella guardada en el
aparato tras la primera entrada con red; ver pregunta 3); celular nuevo, "Otro niño con tarjeta"
lleva a la pantalla "Para usar tu tarjeta hace falta internet una vez. Mientras tanto, ¡a jugar!"
(boceto 01). Lo jugado se guarda en el aparato y sube después; el niño nunca ve un aviso de red.

### 1.4 Familia (zona protegida, sin cuenta)

Entrada: "Para la familia" sostenido 3 s (como hoy) y después un **reto para adultos**: "Toque el
número veintisiete" con cuatro botones numéricos de 64 px (un niño que no lee no lo resuelve). Al
fallar, otro número; sin castigo. Página única `/familia` con secciones ancladas, sistema de adultos
(§5) y botón "Volver al juego" fijo arriba.

| Sección (orden) | Contenido | Hueco si falta contenido |
| --- | --- | --- |
| Lo que ha logrado | Selector de niño (caras de 48 px) y su resumen sin nota, imprimible (lo de hoy) | "Aquí verá lo que [apodo] ha encendido cuando juegue su primera misión" |
| Cómo ayudar | Audio corto y texto por territorio | "Aquí irá cómo acompañar en el [territorio]" |
| En este celular | Perfiles guardados (quitar uno), límite diario por niño (3 o sin límite), micrófono por niño | — |
| Qué se guarda | Versión corta de la autorización, con Estados Unidos | Texto de plataforma; nunca vacío |
| Empezar de nuevo y olvidar este celular | Lo de hoy (sostener 2 s, recuperable 7 días) | — |
| Pie | "¿Es docente o directivo? Entrar" → `/adultos` | — |

### 1.5 Adultos: entrada

`/adultos`: nombre de la plataforma, correo, contraseña (con "ver"), "Entrar", "Olvidé mi
contraseña". Error: "El correo o la contraseña no coinciden" bajo el campo. Sin red: "Para entrar la
primera vez hace falta internet". Con sesión guardada y sin red, entra con lo último que tenía (solo
lectura, §2.6). Tras entrar, redirige por rol; un coordinador que también dicta clase tiene dos
cuentas (R2 §3), así que no hay selector de rol.

---

## 2. Docente

### 2.1 Forma

- **Celular** (390 px): barra superior de 56 px (nombre de la plataforma y estado de guardado a la
  derecha: "Todo guardado" o "3 por subir") y pestañas abajo de 64 px: **Inicio, Grupos, Planear,
  Proyectar, Más**. Más: Registro del piloto, Ayuda, Cuenta, Salir.
- **Computador** (≥ 1024 px): las mismas cinco secciones en una barra lateral de 256 px; contenido
  hasta 960 px de ancho, alineado a la izquierda.
- **Inicio sin datos de niños.** Inicio nunca muestra apodos: es la pantalla a la que se vuelve
  después de proyectar. Los apodos solo aparecen dentro de un grupo.
- Lo más usado a un toque desde Inicio: **Proyectar** el tema de la próxima clase, **Dar estrellas**
  y **Lista** del grupo de esa clase (boceto 03).

### 2.2 Secciones y huecos

| Sección | Ruta | Qué hay | Estado vacío (texto exacto) | Acción del vacío |
| --- | --- | --- | --- | --- |
| Inicio | `/docente` | Fecha de hoy, colegio; panel "Próxima clase" (grupo, tema, clase 1 o 2, los dos faroles de la firma, "Proyectar [tema]", "Ver el planeador"); 4 atajos; otros grupos en una línea | Sin grupos: "Todavía no tiene grupos" + "Cree su grupo y la plataforma le da el código que los niños usan en casa. Después agrega los apodos." Sin plan: "Su grupo 3B no tiene tema planeado" | "Crear un grupo" / "Planear el primer tema" |
| Mis grupos | `/docente/grupos` | Una fila por grupo: nombre, grado, número de niños, código | Igual que Inicio sin grupos | "Crear un grupo" |
| Grupo | `/docente/grupos/:g` | Código (y "Imprimir tarjetas"), lista alfabética de apodos (filas de 56 px con cara de 32 px, casilla de autorización con fecha), "Agregar niños" (uno o pegar lista), menú de fila: cambiar PIN, cambiar personaje, retirar | "Aquí aparecerán los niños de 3B. Escriba solo el apodo o el primer nombre, sin apellidos" | "Agregar niños" |
| Estrellas | `/:g/estrellas` | Lista alfabética; estrella hueca y gris junto a quien no recibe estrellas del docente hace 3 clases. Toque en un niño: hoja inferior con **Participar +10** y **Colaborar +15** (72 px). "Colaborar en equipo": casillas y "Dar colaborar a 3". Aviso de 5 s "Sara: participar. Deshacer" | "Cuando agregue niños al grupo podrá darles estrellas aquí" | "Agregar niños" |
| Avance | `/:g/avance` | Línea fija: "Muestra solo a quienes juegan en casa. No sirve para calificar." Por tema: faroles con "21 de 34"; palabras que el grupo todavía está aprendiendo; palabras que costaron en la prueba. Pestañas: Grupo · Lista · Para acompañar | "Aquí verá cuántos niños encienden cada farol cuando empiecen a jugar en casa" | — |
| Para acompañar | `/:g/acompanar` | Lista corta y privada (R2 §1.4); nunca se imprime | "Por ahora nadie necesita un apoyo especial" | — |
| Un niño | `/:g/nino/:e` | Lo de R2 §1.4 "Un niño"; "Imprimir resumen para la familia" | "[Apodo] todavía no ha jugado en casa. Lo de la clase cuenta igual" | — |
| Planear | `/docente/planear` | Por grupo, los 6 temas del territorio en orden con su farol (por hacer, en curso, hecho) y fechas de clase 1 y 2 | "Elija el primer tema de 3B y las fechas de sus dos clases" | "Planear Escuela" |
| Plan del tema | `/docente/planear/:g/:tema` | Frase del plan ("Clase 1: escuchar y atrapar los colores. Clase 2: decirlos y prueba"), fechas, planeador de cada clase, misiones de casa entre clases, "Dejar listo para proyectar sin red" | Planeador ausente: hueco (§4.4) | — |
| Materiales del tema | `/docente/temas/:tema` | Lista de los tipos del catálogo §3.2 en orden fijo; cada fila con su estado: listo, o "Aquí irá" atenuado | Todo el tema sin contenido: "Los materiales de [tema] llegan con la próxima versión de la cartilla. Ya puede proyectar las láminas y los juegos" | "Proyectar [tema]" |
| Prueba del tema | `/:g/prueba/:tema` | Material (plantilla §4) y registro por niño: aciertos 0 a 6 (botones), intentos 0 a 3; palabras que costaron | "Cuando dé el reto de Cosmo en clase, registre aquí lo de cada niño. Si no lo registra, la prueba vale igual en papel" | "Ver la prueba" |
| Registro del piloto | `/docente/registro` | Cotejo, incidencias (4 botones de un toque: sin proyector, sin sonido, sin red, sin aula), encuesta de acceso (conteos), prueba de entrada y salida | Cada parte: "Aquí irá [parte]" con su plantilla imprimible | — |
| Ayuda | `/docente/ayuda` | Una página imprimible | "Aquí irá la guía de uso de la plataforma" | — |

### 2.3 Modo proyectar

Funciona igual por cable a un computador, por adaptador desde el celular o en inalámbrico, porque
**el telón nunca puede mostrar datos de niños, venga de donde venga la imagen**.

| Aspecto | Diseño |
| --- | --- |
| Qué es | Un paquete aparte (`/proyectar`) que solo lee el paquete de la cartilla. No importa el código de datos del colegio ni lee Supabase. No muestra el nombre del docente ni su colegio |
| Cómo se entra | (a) Desde el celular o computador del docente: "Proyectar [tema]" en Inicio, pestaña Proyectar o un material. (b) En cualquier computador sin sesión: escribir la dirección y `/proyectar`. Se elige territorio y tema con tarjetas grandes |
| Al entrar | Pide pantalla completa y, en celular, gira a horizontal (bloqueo de orientación dentro de pantalla completa). Guarda en el aparato "proyectando" (con hora) y lo avisa a otras pestañas (`BroadcastChannel`) |
| Menú del tema | Cabecera de 88 px (tema, territorio, "Terminar"); a la izquierda el guía del territorio y "Listo sin red"; a la derecha tarjetas de 168 px: Láminas, Escucha y toca, Memory, Listen & Catch, Di y brilla (en coro, sin micrófono), El reto de Cosmo, Canción, Caritas. Lo que aún no tiene contenido va punteado: "Aquí irá la canción de los colores" (boceto 04) |
| Controles | Abajo, 112 px: anterior, **Otra vez** (principal), **Despacio**, siguiente (72 px de alto). Teclado: Espacio otra vez, D despacio, flechas pasar, Esc terminar. Puntero o toque igual. Indicador "3 de 8" |
| Pantallas | Base 1366 × 768. Escala con la altura: palabra a 19,5 vh, ningún texto bajo 28 px a 768 de alto. Funciona en 1024 × 768 (proyectores 4:3: la lámina pasa a una columna) y en un celular en horizontal (844 × 390: controles de 56 px, sin cabecera de ayuda de teclas) |
| Cómo se sale | "Terminar" arriba a la derecha (56 px) o Esc o atrás en el menú del tema. Siempre pide confirmar en el telón: "¿Terminar la proyección?" con "Seguir proyectando" y "Terminar". En un juego o lámina, atrás vuelve al menú del tema |
| Después de salir | `/proyectar/fin`: el guía, "Proyección terminada", "Volver a proyectar" e "Ir a mi inicio" (si hay sesión). Inicio no tiene apodos, así que aunque el telón siga conectado no se ve nada de nadie |
| Si abre la lista mientras proyecta | Toda pantalla con datos de niños (grupo, estrellas, avance, acompañar, un niño, prueba, tarjetas) se abre detrás de una **cortina** si en ese aparato se proyectó hace menos de 90 minutos o si otra pestaña está proyectando: ojo tachado, "¿Su pantalla se ve en el telón?", "Esta sección muestra los apodos de los niños. Hace 12 minutos estaba proyectando desde este celular.", y tres salidas: "Mostrar la lista aquí", "Volver al inicio", "Ya terminé la clase" (quita la cortina hasta la próxima proyección). Con una pestaña proyectando, el texto dice "Hay otra pestaña proyectando" (boceto 03) |
| Juego proyectado | Mismas plantillas de juego en modo aula: turnos por equipos o "todos señalan", sin marcador que deje perdedor, sin micrófono, sin guardar nada |
| Sin red | "Dejar listo sin red" en el plan del tema y en el menú: descarga láminas, audio y juegos del tema (no los videos). En el menú, "Listo sin red" en verde. Tema no descargado y sin red: su tarjeta atenuada con "Necesita internet una vez"; las láminas impresas sostienen la clase |
| Demostración de la entrada | En el menú de proyectar, al final: "Cómo se entra en casa", con el perfil de ejemplo "Lumi" (nunca un niño real) |

### 2.4 Dar estrellas (detalle)

1. Desde Inicio, "Dar estrellas" (o el grupo): lista alfabética (cortina si aplica).
2. Toque en un apodo: hoja inferior con dos botones de 72 px. Toque en uno: la hoja se cierra, la
   fila muestra "+10" en oro tenue 1 s y aparece el aviso "Sara: participar. Deshacer" durante 5 s.
3. Pasados 5 s se guarda en la cola del aparato con un identificador único; sube cuando hay red.
   Nunca hay botón de quitar después.
4. Colaborar a varios: "Colaborar en equipo" cambia las filas a casillas; "Dar colaborar a 3".

### 2.5 Vista de impresión del docente

Grupo → "Imprimir tarjetas" (8 por hoja carta, 95 × 60 mm, con líneas de corte: apodo, cara, código,
QR de `/t/CÓDIGO`, sus tres imágenes del PIN y tres pasos para el adulto) e "Imprimir lista para
estrellas" (apodos y casillas participar y colaborar por fecha). Ambas usan la plantilla §4 con
`privacidad: con-datos` (sin proyectar).

### 2.6 Sin red (adultos)

Todo lo leído se guarda en el aparato. Sin red: banda gris arriba "Sin conexión. Lo que marque se
guarda en este celular y sube solo cuando vuelva la señal."; estrellas, registro de prueba,
incidencias y cotejo se encolan; crear grupo, agregar niños, cambiar PIN y todo lo del coordinador y
el dueño se desactivan con "Necesita internet". El estado de la barra superior pasa a "3 por subir"
y, al subir, "Todo guardado".

---

## 3. Coordinador y dueño

### 3.1 Coordinador (`/colegio`)

Computador primero (es quien más usa computador), y a 390 px las tablas pasan a filas apiladas.
Barra lateral: **Uso y avance, Docentes y grupos, Materiales, Cierre del año**, Salir (boceto 06).

| Sección | Qué hay | Vacío |
| --- | --- | --- |
| Uso y avance | Selector de grado; 3 cifras (niños con cuenta, practicaron en casa esta semana, clases dadas) y la nota fija "Lo que viene de la app muestra solo a quienes juegan en casa. No sirve para calificar ni para comparar docentes". Tabla por grupo **en orden de nombre**: docente, tema según el plan (6 faroles), con cuenta "32 de 34", practicaron esta semana, autorizaciones. Grupo de menos de 5: "no se muestran cifras". Imprimir | "Cuando sus docentes creen grupos, aquí verá el uso de la cartilla por grado" |
| Estrellas por conducta | Bajo la tabla: por grupo, totales de cada tipo en una barra apilada | "Aquí verá qué conductas se reconocen en cada grupo" |
| Condiciones | Incidencias y encuesta de acceso, en conteos por grupo | "Aquí irán las condiciones del aula cuando los docentes las registren" |
| Docentes y grupos | Docentes (nombre, correo, grupos, última vez que planeó), "Invitar docente", desactivar; grupos (crear, asignar docente, renovar código) | "Invite a su primer docente con su correo" |
| Materiales | Los mismos materiales de la cartilla, solo lectura e imprimir (plantilla §4, sin notas del docente) | Huecos "aquí irá" |
| Cierre del año | Explicación de qué se borra y "Cerrar el año escolar" (escribir el año para confirmar) | — |

Nunca: apodos, resultados de prueba, PIN ni tarjetas.

### 3.2 Dueño (`/plataforma`)

| Sección | Qué hay | Vacío |
| --- | --- | --- |
| Colegios | Tabla: nombre, municipio, convenio, coordinador, cartillas habilitadas; "Crear colegio" | "Cree el primer colegio" |
| Cartillas | Cartillas y sus versiones; "Publicar versión"; qué versión usa cada colegio | "Aquí aparecerán las cartillas al subir su paquete" |
| Documentos de plataforma | Autorización base, instrucciones de la tarjeta, ayuda (plantilla §4) | Huecos |
| Cuentas | Crear coordinador (correo, colegio); reenviar invitación | — |
| Datos del piloto | "Descargar resumen sin apodos" (CSV) | "Aún no hay datos para exportar" |

---

## 4. Plantilla común de material

Una sola pantalla para **guía, planeador, ficha, lámina, prueba, actividad de decir, caritas,
cotejo, nota para la casa, autorización, tarjetas, lista para estrellas y resumen para la familia**.
Recibe un documento normalizado; el contenido se agrega después cambiando datos, no pantallas.

### 4.1 Documento que recibe

```
Material {
  id, tipo, cartilla, tema?, version
  titulo, subtitulo?            // "Ficha de trabajo · en parejas"
  origen: paquete | colegio | generado
  privacidad: publico | con-datos     // con-datos: jamás se proyecta ni se cachea en /proyectar
  formatos: { proyectar: todo | solo-consignas | no, imprimir: carta | media-carta | tarjetas | no }
  impresiones?: [{ nombre: "Hoja del niño", oculta: [clave, guion, nota] }, { nombre: "Clave del docente" }]
  bloques: Bloque[]
  editable?: [ids de bloques que el docente puede ajustar] // planeador: momentos y notas
}
```

| Bloque | Campos | Pantalla | Proyectar | Imprimir |
| --- | --- | --- | --- | --- |
| `titulo` | texto | sí | cabecera | cabecera |
| `parrafo` / `lista` | texto | sí | no | sí |
| `consigna` | icono, audio, texto | sí, con botón de oír | sí, una pantalla | sí, con icono |
| `palabra` | palabra, imagen, audio, cómo suena | tarjeta 4 por fila | una por pantalla (lámina) | rejilla o una por hoja |
| `momento` | minutos, ritmo, material (enlace), qué observar, sin proyector | fila desplegable | no | tabla |
| `item-prueba` | dibujo de la fila, palabra, 4 imágenes, audio | sí | una fila por pantalla, suena 2 veces | fila con 4 casillas |
| `guion` | lo que dice el docente | cita | **nunca** | solo hoja del docente |
| `clave` | respuestas | sí | **nunca** | solo hoja del docente |
| `casillas` | filas (apodos o conductas) × columnas | tabla | **nunca** | sí |
| `nota` | texto del docente (colegio) | campo editable | nunca | opcional |
| `hueco` | qué irá, lista de lo que traerá | recuadro punteado | tarjeta punteada | no se imprime |

### 4.2 Pantalla

Cabecera (boceto 05): volver al tema, subtítulo (tipo), título; marcas de formato ("Media carta",
"Se proyecta la instrucción"); acciones en una fila de 48 px: **Proyectar** (solo si
`privacidad = publico` y `formatos.proyectar ≠ no`), **Imprimir** (principal si no se proyecta) y
descargar para sin red. Cuerpo: bloques en orden, separados 20 px, títulos de bloque a 20 px.
Si `origen` incluye colegio: "Ajustar" y "Volver al sugerido" (el sugerido nunca se pierde).

### 4.3 Proyectar e imprimir

- **Proyectar** abre `/proyectar/:tema/:material` y pagina solo los bloques proyectables, con los
  controles de §2.3. La plantilla lo impide para `con-datos` (no hay botón ni ruta).
- **Imprimir** usa la hoja de estilos de impresión, sin generar PDF: `@page { size: letter; margin:
  12mm }`; cabecera "English Adventure Quest · tema" y pie con tipo y página; media carta = dos copias
  por hoja con línea de corte; tarjetas = 8 por hoja. Sin fondos de color; bordes negros de 1 pt;
  nada depende del color salvo las palabras de color (se avisa: "Esta ficha necesita impresión a
  color o colorear a mano"). Hoja del niño: sin casilla de nota ni puntaje.
- Si hay varias `impresiones`, "Imprimir" abre una hoja inferior para elegir ("Hoja del niño",
  "Clave del docente").

### 4.4 Hueco ("aquí irá")

El paquete declara por tema **todos** los materiales del catálogo §6, cada uno con `estado: listo |
pendiente`. Pendiente pinta un recuadro punteado con "Aquí irá [nombre]", "Llega con la próxima
versión de la cartilla. Traerá:" y la lista de lo que traerá (sale del catálogo §3.2, columna
"Qué contiene"), más "Mientras tanto" con los materiales listos del mismo tema y, si es editable,
"Sus notas". Imprimir se ve deshabilitado. Así se llena el esqueleto material por material sin
tocar pantallas.

---

## 5. Sistema visual de adultos

Dirección (`unslop`): **Producto:** la hora de inglés de un docente de tercero con proyector, y el
colegio que la acompaña. **Carácter:** sereno, de aula, con una luz cálida. **Mundo:** el salón
de clase de noche en Englishland: neutros apenas violeta, tinta de la noche y el oro de los faroles.
**Momento:** el guía del territorio en el panel de la próxima clase y la lámina proyectada.
**Firma:** el **farol** (apagado, medio, encendido) para el estado de un tema o clase; solo ahí.

| Token | Valor | Uso |
| --- | --- | --- |
| `--a-fondo` / `--a-superficie` / `--a-hundido` | `#f6f5f9` / `#ffffff` / `#eeecf3` | Fondo, paneles, avisos y selección |
| `--a-linea` / `--a-linea-fuerte` | texto al 10 % / 20 % | Líneas finas, bordes de botón |
| `--a-texto` / `-2` / `-3` | `#221a33` / `#4f4862` / `#6b6580` | Principal, secundario, tenue (todos ≥ 4,5:1) |
| `--a-tinta` | `#2a1458` (la `--noche` del niño) | Botón principal y pestaña activa; texto blanco |
| `--a-farol` / `--a-farol-tinta` | `#ffcf3a` / `#7a5200` | Solo la firma y "+10" de estrellas |
| `--a-ok` / `--a-aviso` / `--a-error` | `#2d7a57` / `#8a5a00` / `#a1453a` | Guardado, pendiente, error de formulario de adulto (nunca sobre un niño) |
| `--a-foco` | `#0f8a7b`, anillo de 3 px | Foco de teclado |
| `--p-fondo` / `--p-texto` / `--p-marco` | `#fff8ec` / `#24123f` / `#170a36` | Telón claro (el salón tiene luz y el proyector lava los negros), cabecera noche |
| Tipo de marca | Baloo 2 Variable, 600 (ya va en la primera carga) | Títulos, cifras, todo el telón |
| Tipo de texto | `system-ui` (Roboto en Android): 0 KB | Texto, botones, tablas |
| Escala | 14/20 · 16/24 · 18/26 · 20/26 · 24/30 · 30/36 (h1 de 26 en celular) | Meta, texto, entradilla, h3, h2, h1 |
| Pesos | 400, 500, 600 | Sin 700 en adultos; el telón usa 700 solo en la palabra |
| Espacio | 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 | Rejilla de 4; borde de página 16 en celular, 40 en computador |
| Radios | control 10 · tarjeta 14 · panel 20 | Anidados; las caras son círculos |
| Toque | 48 mínimo; filas 56; telón 64 a 72; niño 72 a 88 | |
| Iconos | Lucide, línea 1,75, 20 px, color del texto | Copiar solo los ~25 usados a un `Icono.tsx` (menos de 4 KB) |
| Movimiento | curva `cubic-bezier(.2,.7,.2,1)`; 120 · 200 · 280 ms | Respuesta, hojas, entradas |

Prohibido en adultos: degradados de color, brillos, emojis, mayúsculas sostenidas, signos de
exclamación (salvo en lo que dice Lumi), cifras con color de rendimiento junto a un nombre.
El niño conserva sus tokens de `src/estilos.css`; acento por territorio: Bosque `--menta`, Valle
`--rosa`; Ciudad `#ff8a3d` y Plaza `#5b8cff` (propuestos, sin construir).

---

## 6. Bocetos

| Archivo | Qué muestra |
| --- | --- |
| `esqueleto/01-quien-va-a-jugar.webp` | Vacío (primera vez), inicial con 3 niños e invitado, acierto al tocar su cara, sin red en celular nuevo (390 px) |
| `esqueleto/02-entrada-pin.webp` | PIN inicial con dos tocados, error, acierto, descanso tras 5 intentos |
| `esqueleto/03-docente-inicio.webp` | Inicio, vacío sin grupos, sin red con 3 por subir, cortina al abrir la lista después de proyectar |
| `esqueleto/04-proyectar.webp` | Menú del tema y lámina a 1366 × 768, con un hueco "aquí irá" |
| `esqueleto/05-plantilla-material.webp` | Ficha en pantalla, planeador vacío con hueco, la misma ficha impresa en media carta |
| `esqueleto/06-coordinador-inicio.webp` | Uso y avance a 1366 × 768, con un grupo de menos de 5 |

Las imágenes del PIN de los bocetos son provisionales.

### 6.1 Animaciones

Con `prefers-reduced-motion`: todo lo que se mueve pasa a un cambio de opacidad de 200 ms; las
sacudidas no se hacen (solo se vacían las ranuras).

| Qué | Disparador | Movimiento | Duración |
| --- | --- | --- | --- |
| Cara en "¿Quién va a jugar?" | Toque | Baja a 0,96 y sube 6 px con anillo oro; las otras a 40 % | 120 + 200 ms |
| Tecla del PIN | Toque | Escala 0,92; la imagen viaja a su ranura | 100 + 220 ms |
| PIN errado | Tercera imagen equivocada | Ranuras se sacuden ±8 px tres veces y se vacían | 360 ms |
| PIN acertado | Tercera imagen correcta | Ranuras con anillo oro, Lumi celebra, cortina circular de hoy | 400 + 420 ms |
| Sumar invitado | "Sí" en `/unir` | Faroles del invitado vuelan a los de la cuenta | 600 ms |
| Hoja inferior (adultos) | Abrir | Sube 16 px y aparece | 200 ms |
| Aviso "Deshacer" | Dar estrella | Aparece abajo; una línea fina se acorta (transform) | 5 s |
| "+10" en la fila | Estrella guardada | Aparece y se desvanece | 1 s |
| Cortina de privacidad | Abrir pantalla con apodos tras proyectar | Aparece sobre el contenido ya oculto | 200 ms |
| Cambio de lámina | Siguiente o anterior | Fundido y desplazamiento de 24 px | 200 ms |
| Farol de la firma | Cambio de estado del tema | Relleno oro | 280 ms |

### 6.2 Sonidos

Los efectos son sintetizados (`src/audio.ts`), sin archivos. Adultos: ningún sonido salvo en el telón.

| Momento | Sonido |
| --- | --- |
| Tocar cara, tecla del PIN, botones del niño | `toque` (existe) |
| PIN errado | `intenta` (existe; suave, no zumbido) |
| PIN acertado, sumar invitado | `acierto` y después `fiesta` (existen) |
| Lámina proyectada | La palabra grabada (Kokoro, existe); "Despacio" a 0,7 de velocidad |
| Frases nuevas de Lumi (Kokoro `ef_dora`, 0,82) | "¿Quién va a jugar?", "Busca tu cara", "Toca tus tres dibujos", "Esas no son. Prueba otra vez con calma", "Lumi necesita un descanso. Busca tu tarjeta o pídele ayuda a un adulto", "¡Hola! Vamos al bosque", "¿Este camino lo recorriste tú?", "Lumi contó tus estrellas", "Para usar tu tarjeta hace falta internet una vez. Mientras tanto, ¡a jugar!" |

El apodo no se dice en voz (no se puede grabar de antemano y la voz del navegador desentona): se
muestra escrito junto a la cara.

### 6.3 Recursos gráficos que faltan

| Recurso | Formato y tamaño final | Nota |
| --- | --- | --- |
| 10 imágenes del PIN (sol, luna, pez, hoja, corazón, casa, gota, estrella, nube, flor) | SVG plano, viewBox 64, menos de 2 KB cada una | Se ven a 48 px en pantalla y a 14 mm en la tarjeta impresa; distintas en forma y color; ninguna es palabra de la cartilla |
| Lumi en descanso | WebP 280 × 263 (se muestra a 170 px de ancho, 2x en tamaño medio) | Pose tranquila, ojos entrecerrados |
| Portada de cada tema (6 del Bosque) | WebP 640 × 360 | Menú de proyectar y panel de próxima clase; mientras tanto, el guía del territorio |
| Ícono de acceso directo "Docente" para el manifiesto | PNG 192 × 192 | Farol sobre noche |

---

## 7. Datos que necesita cada pantalla

**L** lee, **E** escribe. **Falta** = no existe hoy en `supabase/esquema.sql`. Lo del paquete y lo
del aparato no van en la base de datos.

| Pantalla | Lee | Escribe | Falta en el esquema |
| --- | --- | --- | --- |
| ¿Quién va a jugar? | Aparato: perfiles (id, apodo, personaje, grupo, huella del PIN) | — | **Falta:** varios perfiles por aparato (hoy `sesiones_estudiante` ata una sesión a un solo estudiante) |
| Tarjeta: código y caras | `lista_grupo` | Aparato: código recordado | Límite de intentos por aparato en `lista_grupo` (R2 §4.5) |
| Clave (PIN) | `entrar_estudiante` | Aparato: huella del PIN | **Falta:** respuesta que distinga "PIN errado" de "descanso"; entrega de una huella para comprobar sin red; cambiar de jugador sin cerrar las otras sesiones |
| ¿Lo recorriste tú? | Aparato: avance invitado | Función de sumar | **Falta:** función que sume el invitado y recalcule estrellas |
| Mapa, misiones, álbum, estrellas | Progreso, estrellas, álbum, repasar, días | `registrar_mision` | **Falta:** álbum, repasar, superadas, días de práctica (solo fecha), encargos, duración redondeada, modo de voz; `pronunciar` automática y `mejorar` una vez por misión; autoevaluación por día |
| Familia | Aparato; resumen del niño activo | Aparato: límite diario, micrófono | — (todo en el aparato) |
| Entrada de adultos | Supabase Auth, `perfiles.rol` | — | **Falta:** `perfiles.activo` (desactivar docente) e invitación por correo |
| Docente: Inicio | Grupos del docente, plan del tema, cola local | — | **Falta:** plan del tema por grupo (tema, fecha clase 1 y 2, estado) |
| Grupo | `estudiantes`, `grupos.codigo` | `crear_estudiante`, `cambiar_pin`, borrar | **Falta:** autorización recibida y fecha; `avatar` por defecto `'lumi'` debe ser un personaje real; cambiar personaje |
| Tarjetas (imprimir) | Apodo, personaje, código, **las tres imágenes del PIN** | — | **Choque:** el docente "no ve el PIN" pero la tarjeta lo imprime. Ver pregunta 2 |
| Estrellas | Estudiantes, estrellas del docente por fecha | `dar_estrellas` | **Falta:** identificador de la acción (sin doble estrella al reintentar), dar a varios a la vez, `dar_estrellas` limitado a participar, colaborar y `pronunciar` de respaldo |
| Avance, acompañar, un niño | Progreso sumado por tema, repasar, estrellas, autoevaluación, prueba | — | **Falta:** vista por grupo; lo de "Mapa" arriba |
| Planear y plan del tema | Plan del tema; paquete (planeador sugerido) | Plan del tema, planeador ajustado, notas | **Falta:** planeador ajustado y notas del docente |
| Materiales y plantilla | Paquete (manifiesto por tema); notas del docente | Notas | Lo de "Planear" |
| Prueba del tema | Paquete; resultados del grupo | Aciertos de 6, intentos de 3, palabras que costaron | **Falta:** resultado de prueba, solo legible por el docente del grupo |
| Registro del piloto | Cotejo, incidencias, encuesta | Las tres | **Falta:** las tres tablas (encuesta en conteos) |
| Proyectar | Solo paquete | Aparato: "proyectando" y hora | — |
| Coordinador: uso y avance | Cifras sumadas por grupo, mínimo 5 niños | — | **Falta:** vista o función sumada; **sobra:** hoy lee filas de cada niño (`puedo_ver_estudiante`) |
| Coordinador: docentes y grupos | Perfiles del colegio, grupos | Invitar, desactivar, crear grupo, asignar docente, renovar código | **Falta:** invitar y desactivar; `crear_grupo` asigna siempre a quien lo crea; renovar código |
| Coordinador: cierre del año | — | Cierre | **Falta:** función de cierre con borrado y resumen sin apodo |
| Dueño: colegios y cuentas | `colegios`, `perfiles` | Crear | **Falta:** `colegios.convenio`, coordinador a cargo |
| Dueño: cartillas | Cartillas, versiones, colegio ↔ versión | Publicar | **Falta:** tabla de versiones publicadas y habilitadas por colegio |
| Dueño: datos del piloto | Resumen sin apodo | — | **Falta:** vista de exportación sin apodo ni grupo identificable |

Además, `creado` y `actualizado` guardan hora exacta: para el niño basta la fecha (R2 §4.5).

---

## 8. Tandas de construcción

Cada tanda se prueba a **390 × 844** (y a **1366 × 768** donde se indica) antes de seguir. El
esquema lo corrige el desarrollador en la tanda 2 con la §7.

| # | Tanda | Criterio de aceptación verificable |
| --- | --- | --- |
| 1 | **Rutas y cascarón**: rutas con historial, `_redirects`, navegación sin red en el service worker, tres paquetes (estudiante, adultos, proyectar), tokens de adultos, componentes base (barra, pestañas, panel, fila, botón, hueco, farol, cortina) | A 390: `/`, `/adultos`, `/docente`, `/colegio`, `/plataforma` y `/proyectar` cargan y el atrás de Android vuelve a la anterior. Recargar `/mapa` en modo avión carga. La primera carga de `/` sigue por debajo de 160 KB comprimidos y no incluye Supabase |
| 2 | **Esquema y entrada de adultos**: §7, login, recuperar, invitación, redirección por rol | Un docente, un coordinador y el dueño de prueba entran y caen en su inicio; un docente que escribe `/colegio` vuelve a `/docente`; el coordinador no puede leer una fila de `estudiantes` (consulta directa devuelve 0 filas) |
| 3 | **Estudiante**: ¿Quién va a jugar?, tarjeta (código, QR `/t/`), caras, PIN, descanso, invitado, `/unir`, cambiar de jugador, familia con reto y entrada de adultos | Dos niños de grupos distintos y un invitado en el mismo celular, cada uno con su avance. PIN errado 5 veces: descanso y "Jugar mientras tanto", nunca "bloqueado". En modo avión, un perfil ya usado entra con su PIN. Todos los botones del niño miden 72 px o más |
| 4 | **Docente base**: Inicio, Mis grupos, Grupo (agregar, autorización, PIN, retirar), tarjetas y lista imprimibles, estrellas con deshacer y cola sin red | A 390, desde Inicio se llega en un toque a proyectar, dar estrellas y la lista. Dar una estrella son 2 toques. En modo avión se dan 3 estrellas, el estado dice "3 por subir" y al volver la red sube una sola vez cada una. Inicio no contiene ningún apodo (búsqueda en el DOM) |
| 5 | **Proyectar, cortina y plantilla de material** con huecos, láminas y Escucha y toca en modo aula; impresión | A 1366 × 768, 1024 × 768 y 844 × 390: menú, lámina y juego sin desbordes, texto ≥ 28 px a 768 de alto, teclado completo. Al terminar se ve `/proyectar/fin`. Abrir la lista antes de 90 min muestra la cortina. Ningún material `con-datos` tiene ruta en `/proyectar`. Imprimir una ficha da una hoja carta con dos medias cartas |
| 6 | **Planear, materiales del tema, avance, prueba y registro** con sus estados vacíos | Grupo sin datos: cada sección muestra su texto de vacío de §2.2 y su acción. Un tema sin contenido muestra todos los tipos del catálogo como "Aquí irá". Cambiar las fechas del plan no altera el progreso de ningún niño |
| 7 | **Coordinador y dueño** | A 1366 y 390: tabla en orden de nombre, grupo de menos de 5 sin cifras, sin apodos ni pruebas en la página (búsqueda en el DOM). El dueño crea un colegio y un coordinador; el coordinador invita un docente que entra con su correo |

---

## 9. Preguntas para Manuel

| # | Pregunta | Recomendación |
| --- | --- | --- |
| 1 | ¿El personaje del niño lo pone el docente al crearlo o lo elige el niño? | **Lo pone el docente** (va alternando Tavi, Mika, Bruno y se puede cambiar). Así la cara existe desde la tarjeta impresa y el niño se reconoce en "¿Quién eres?" |
| 2 | La tarjeta imprime las tres imágenes del PIN, pero la decisión vigente dice que el docente "no ve el PIN". | **El PIN se ve solo al imprimir la tarjeta**, nunca en pantalla. Al cambiarlo, se imprime la tarjeta nueva en ese momento y no queda guardado legible |
| 3 | Sin red, el PIN se comprueba con una huella guardada en el celular. Con 1.000 combinaciones, alguien con el celular en la mano podría adivinarla. | **Aceptarlo**: el PIN separa hermanos, no protege secretos (el avance solo crece). El auditor lo revisa |
| 4 | ¿Cortina de privacidad durante 90 minutos después de proyectar desde ese aparato? | **Sí, 90 minutos**: una hora de clase con margen; "Ya terminé la clase" la quita antes |
| 5 | ¿El QR de la tarjeta abre la dirección `/t/CÓDIGO` con la cámara del celular, sin pedir cámara dentro de la app? | **Sí**: funciona en cualquier Android reciente y la app no pide permisos |
