# Catálogo de interfaces: qué contenido vive en cada modo

Asesor pedagógico, 17 de noviembre de 2026. Fase **definir**. Sirve para que el esqueleto (base de
datos y paquete de la cartilla) tenga un lugar para cada cosa antes de llenarlo. No describe
pantallas (diseñador) ni tablas SQL (desarrollador). Base: `CLAUDE.md`,
`docs/pedagogia/ronda-2-docente.md` (proyector en clase, celular familiar en casa).

**Columnas.** **Proy.** = se proyecta · **Imp.** = se imprime (regla 9) · **Origen**: **Paquete**
(contenido fijo por tema, igual para todos los colegios) · **Colegio** (lo crea o cambia el
docente o el colegio; base de datos) · **Generado** (se arma al vuelo con datos del colegio y una
plantilla de la plataforma) · **Aparato** (solo en el celular). **Prior.**: P imprescindible para
el piloto · C conviene · E puede esperar.

Ninguna sección, en ningún modo, afirma que la cartilla mejora el aprendizaje o la motivación.

---

## 1. Estudiante (celular de la familia; sin texto obligatorio)

| Sección | Qué contiene | Origen | Prior. |
| --- | --- | --- | --- |
| ¿Quién va a jugar? | Caras y apodos de los perfiles guardados en ese celular; "otro niño con tarjeta"; "jugar sin tarjeta" | Aparato (lista de perfiles) + Colegio (apodo, personaje) | P |
| Entrada | Código del grupo, elección de cara, PIN de tres imágenes | Colegio (grupo, PIN cifrado) + Paquete de plataforma (10 imágenes del PIN) | P |
| Mapa | Territorios, lugares, estaciones con sus luces, estatuas, puertas, puente | Paquete (fondos, posiciones, textos y audio de estatuas) + Colegio (qué está encendido) | P |
| Misiones | Plantilla de juego + palabras, imágenes, audios, frases de los personajes y sus gemelas en español | Paquete (contenido) + motor (plantillas) | P |
| Álbum de palabras | Palabras encendidas con imagen y audio | Paquete (palabra) + Colegio (cuáles tiene) | P |
| Repasar | Hasta 3 a 5 palabras que el niño todavía está aprendiendo | Colegio (calculado del progreso) | C |
| Mission Stars | Total, motivo de cada estrella con frase de Lumi, estelas y accesorios desbloqueados | Paquete (catálogo de accesorios, frases) + Colegio (estrellas) | P |
| Autoevaluación | Caritas al cerrar la sesión | Paquete (imágenes, audio) + Colegio (respuesta) | P |
| Recuerdos | Cinemáticas ya vistas | Paquete (video 9:16 y 16:9) + Colegio (cuáles vio) | C |
| Encargos y luciérnagas | Encargos de los vecinos, contador del álbum | Paquete + Colegio | C |
| El reto de Cosmo (repaso) | Misión de repaso del tema; no es la prueba | Paquete | C |

Perfil **invitado**: todo lo anterior guardado solo en el aparato, hasta que se sume a una cuenta.

## 2. Familia (zona protegida dentro del celular; sin cuenta)

| Sección | Qué contiene | Origen | Imp. | Prior. |
| --- | --- | --- | --- | --- |
| Puerta para adultos | Reto simple para adultos | Paquete de plataforma | — | P |
| Cómo ayudar | Audio corto y texto por territorio: qué se practica, cómo acompañar sin corregir, que el error es parte del juego | Paquete | Sí | P |
| Perfiles en este celular | Lista de niños guardados, quitar uno, "olvidar este celular" | Aparato | — | P |
| Límite diario | 3 misiones al día o "sin límite", por niño | Aparato | — | P |
| Micrófono | Sí o no, por niño | Aparato | — | P |
| Empezar de nuevo | Borra lo del aparato, no lo de la cuenta | Aparato | — | P |
| Qué se guarda | Versión corta de la autorización (incluye que los datos están en Estados Unidos) | Paquete de plataforma | Sí | P |
| Lo que ha logrado | Faroles, palabras del álbum, estrellas por conducta del niño activo; sin nota | Colegio | — | C |

## 3. Docente

### 3.1 Secciones

| Sección | Qué contiene | Prior. |
| --- | --- | --- |
| Mis grupos | Grupos, código, estudiantes (apodo, personaje), autorización recibida, PIN (cambiar), tarjetas | P |
| Planear | Plan del tema por grupo, planeador de clase, materiales del tema | P |
| Proyectar | Láminas y juegos del tema, sin cuenta ni datos de niños | P |
| Estrellas | Lista del grupo para pasar participar y colaborar | P |
| Avance | Vistas de §1.4 de la ronda 2 | P (grupo, lista, niño) · C (resumen familia) |
| Prueba del tema | Material y registro de resultados | P (material) · C (registro) |
| Registro del piloto | Cotejo, incidencias, encuestas | C |
| Ayuda | Cómo se usa la plataforma, en una página imprimible | C |

### 3.2 Tipos de material del docente

| Tipo | Qué contiene (campos) | Para qué | Proy. | Imp. | Origen | Prior. |
| --- | --- | --- | --- | --- | --- | --- |
| **Guía del tema** (para el docente) | Tema y territorio; objetivo en una línea; palabras (palabra, imagen, audio, "cómo suena" en español); frases modelo; errores previsibles y cómo responderlos sin corregir en público; conexión con el entorno de Los Patios (ejemplos del barrio, la casa, el colegio); estándar y DBA (pendiente de cotejo); misiones de la app del tema | Que el docente domine el tema antes de clase; aprendizaje significativo (Ausubel) | No | Sí | Paquete | P |
| **Planeador de clase** | Por clase (1 y 2): momentos de la hora tipo con minutos, ritmo (mirar, jugar, decir), material de cada momento, qué observar, variante sin proyector; campo de notas | Planear en 5 minutos; progresión enactivo → icónico → simbólico (Bruner) | No | Sí | Paquete (sugerido) + Colegio (copia ajustada y notas del docente) | P (sugerido) · C (ajustar) |
| **Plan del tema por grupo** | Grupo, tema, fechas de clase 1 y 2, estado (por hacer, en curso, hecho) | Calendario real; coordinador ve en qué tema va cada grupo | No | Sí | Colegio | P |
| **Láminas** | Por palabra: imagen grande, palabra, audio, "cómo suena"; formato horizontal (proyectar) y carta o media carta (imprimir) | Mirar antes de jugar; entrada comprensible (Krashen) | Sí | Sí | Paquete | P |
| **Juegos para proyectar** | Plantilla (Escucha y toca, Memory, Listen & Catch, Di y brilla en coro) + lista de palabras del tema + opciones (equipos o "todos señalan", velocidad, repetir y despacio) | Jugar en grupo con el error tratado como parte del juego; mecánica al servicio de escuchar (Kapp) | Sí | Equivalente impreso: Memory recortable | Paquete (contenido) + motor (plantilla) | P (Escucha y toca, Memory) · C (resto) |
| **Fichas de trabajo** | Tipo (escucha y señala, colorea lo que oyes, une palabra e imagen, Memory recortable, bingo); instrucción con ícono y audio; imágenes; guion de lo que dice el docente; clave de respuestas | Jugar en parejas con apoyo del compañero (Vygotsky; relación, Ryan y Deci) | Solo la instrucción | Sí | Paquete | P (escucha y señala, Memory) · C (resto) |
| **Actividad de decir en parejas** | Consigna, frases modelo, cómo se turnan, qué hace el docente al pasar | Producir después de oír, sin exponer a nadie (Krashen) | La consigna | Sí | Paquete | P |
| **Prueba del tema** | 6 ítems de escucha (dibujo de la fila, palabra objetivo, 4 imágenes, audio); 3 ítems de decir (palabra, lámina); hoja del niño sin casilla de nota; pantallas proyectables; clave del docente; variante sin proyector | Evidencia para la nota institucional, igual para todos | Sí | Sí | Paquete | P |
| **Resultado de la prueba** | Por niño: aciertos de 6, intentos de 3, fecha; por grupo: palabras que costaron | Que el docente califique y decida si repasa | No | Sí (solo para el docente) | Colegio | C |
| **Lista del grupo para estrellas** | Apodos en orden alfabético, casillas participar y colaborar por fecha | Dar estrellas proyectando desde el celular; regla 5 | No | Sí | Generado | P |
| **Lista de cotejo** | Conductas (participa, pide repetir, ayuda a un compañero; en la prueba: intentó o todavía no), por niño y fecha | Observar conductas, no solo aciertos; registro del piloto | No | Sí | Paquete (plantilla) + Colegio (marcas) | P (en la prueba) · C (semanal) |
| **Hoja de caritas** | Tres caritas por pregunta, con dibujo; preguntas por audio o leídas por el docente | Autoevaluación (calcomanía de pensar en lo que aprendí; competencia, Ryan y Deci) | Sí | Sí | Paquete | P |
| **Autorización de padres** | Texto base (§4.4 de la ronda 2) + campos del colegio (responsable, docente, contacto) + registro por niño (recibida, fecha) | Ley 1581 | No | Sí | Paquete de plataforma (texto) + Colegio (campos y registro) | P |
| **Tarjetas de entrada** | Apodo, personaje, código del grupo (y QR), tres imágenes del PIN, tres pasos para el adulto | Primera entrada en casa con el adulto | Nunca | Sí | Generado | P |
| **Nota para la casa** | Por tema: qué se vio en clase, 3 palabras con imagen, invitación opcional a practicar en la app o con la lámina en la nevera | Conectar clase y casa sin exigir celular (Ausubel) | No | Sí | Paquete | C |
| **Encuesta de acceso** | Celular disponible, cuántos niños lo comparten, datos o wifi, adulto que acompaña | Planear con lo real; piloto | No | Sí | Paquete del piloto + Colegio (conteos) | P |
| **Prueba de entrada y salida del piloto** | 10 palabras de escuchar y señalar, 5 de decir; encuesta de caritas | Registro antes y después | Sí | Sí | Paquete del piloto + Colegio (resultados) | P |
| **Incidencias del aula** | Fecha, grupo, tipo (sin proyector, sin sonido, sin red, sin aula) | Condiciones reales del piloto | No | No | Colegio | C |
| **Resumen para la familia** | Lo encendido, palabras, estrellas por conducta, lo de clase; sin nota | Informar a la casa | No | Sí | Generado | C |
| **Cinemáticas y canciones del tema** | Video 16:9, audio, letra | Mirar y cantar en grupo | Sí | La letra | Paquete | C |
| **Material propio del docente** | Archivos que sube el docente | Adaptar a su grupo | Sí | Sí | Colegio (almacenamiento) | E |

## 4. Coordinador

| Sección | Qué contiene | Origen | Imp. | Prior. |
| --- | --- | --- | --- | --- |
| Uso por grado y grupo | Niños con cuenta, cuántos practican en casa, clases dadas con la cartilla | Colegio (sumado; nada de grupos de menos de 5) | Sí | P |
| Avance por grupo | Tema según el plan, faroles encendidos en proporción | Colegio (sumado) | Sí | P |
| Estrellas por conducta | Totales por tipo y grupo | Colegio (sumado) | Sí | C |
| Condiciones | Incidencias y encuesta de acceso, en conteos | Colegio (sumado) | Sí | C |
| Autorizaciones | Recibidas por grupo, sin nombres | Colegio (sumado) | Sí | P |
| Docentes y grupos | Invitar, desactivar, asignar docente a grupo, renovar código | Colegio | No | P |
| Cierre del año | Dispara el borrado del detalle | Colegio | No | C |
| Materiales de la cartilla | Guías, planeadores y estándares, solo lectura | Paquete | Sí | C |

## 5. Dueño (Manuel)

| Sección | Qué contiene | Origen | Prior. |
| --- | --- | --- | --- |
| Colegios | Nombre, municipio, convenio, coordinador, cartillas habilitadas | Base de datos (plataforma) | P |
| Cartillas | Publicar una versión del paquete; ver qué versión usa cada colegio | Paquete + base de datos (versión publicada) | P |
| Documentos de plataforma | Texto base de la autorización, instrucciones de la tarjeta, ayuda | Paquete de plataforma | P |
| Datos del piloto | Exportación sin apodo ni grupo identificable | Base de datos (sumado) | C |
| Cuentas | Crear coordinadores; soporte | Base de datos | P |

---

## 6. Qué trae el paquete de la cartilla por tema

Para que el paquete tenga un lugar fijo para cada cosa (lista mínima por tema):
palabras (texto, imagen, audio, "cómo suena"), frases modelo, frases de personajes con gemela en
español y palabras exigidas, misiones de la app, láminas, guía del tema, planeador de clase 1 y 2,
fichas, actividad de decir en parejas, prueba del tema con clave, hoja de caritas, nota para la
casa, cómo ayudar (familia), estándar y DBA (cuando se cotejen), cinemáticas y estatuas del lugar.

## 7. Dónde vive cada cosa

| Paquete de la cartilla (igual para todos) | Base de datos (dato del colegio) | Solo en el aparato |
| --- | --- | --- |
| Palabras, imágenes, audios, frases | Colegios, docentes, coordinadores | Lista de perfiles del celular y códigos de grupo recordados |
| Mapa, estaciones, estatuas, cinemáticas | Grupos, código, estudiantes (apodo, personaje, PIN cifrado) | Perfil invitado y su avance |
| Misiones (contenido; las plantillas son motor) | Autorización recibida y fecha | Límite diario, micrófono, "sin límite" |
| Guía, planeador sugerido, láminas, fichas | Plan del tema, planeador ajustado, notas del docente | Copia de trabajo del progreso con cuenta, pendiente por subir |
| Prueba del tema, cotejo y caritas (plantillas) | Progreso, álbum, repasar, días de práctica, caritas | Estrellas del docente aún sin subir |
| Nota para la casa, cómo ayudar | Mission Stars (motivo, fecha, quién) | Tema descargado para proyectar sin red |
| Catálogo de accesorios y estelas | Resultados de prueba, cotejo, incidencias, encuesta (conteos) | — |
| Textos de plataforma (autorización base, tarjeta) | Versión de cartilla habilitada por colegio | — |

Nunca en ninguna de las tres: audio de la voz del niño, apellidos, datos de la familia, hora exacta
de juego, la nota institucional.
