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
- La historia se narra en español al principio y en inglés hacia los niveles finales.

## Qué hay construido

| Pieza | Estado | Dónde |
| --- | --- | --- |
| Equipo de agentes (líder, diseñador, pedagogo, desarrollador, revisor, auditor) | Escritos, aún sin usar | `.claude/agents/` |
| Skills (2 oficiales de Anthropic revisadas + `diseno-infantil` y `auditoria`) | Instaladas | `.claude/skills/` |
| Aplicación (Vite + React + TypeScript) | Prototipo del modo estudiante | `src/` |
| Mundo explorable del Bosque de los Sonidos | Funciona, con el problema descrito abajo | `src/Mundo.tsx` |
| Diálogos con personajes, opciones y cambio de idioma | Funciona | `src/Dialogo.tsx` |
| Juego "escucha y toca" (plantilla que recibe contenido) | Funciona; es el único juego | `src/juegos/EscuchaToca.tsx` |
| Mission Stars en el dispositivo | Funciona con `localStorage` | `src/progreso.ts` |
| Contenido de la cartilla (5 misiones del nivel 1, historia, personajes) | Solo el territorio 1 | `public/cartillas/ingles-3/cartilla.json` |
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

### 1. El personaje no se ve moverse — hecho, falta que Manuel lo confirme

Causa confirmada: la cámara estaba amarrada al guía, que quedaba fijo al 42 % del ancho.
Ahora (`src/Mundo.tsx`, constantes `CAMARA_*`):

- La cámara es un resorte amortiguado con zona libre: el guía cruza la pantalla y la cámara
  lo alcanza después. En carrera sostenida el guía queda al 74 % del ancho.
- El guía se inclina hacia donde va, trota y deja una estela de chispas; tiene sombra.
- Cada toque deja una onda en el punto y un aro dorado marca el destino hasta llegar.
- Con el dedo apoyado, el guía lo persigue aunque la cámara se mueva.
- Comprobado a 390 px con capturas seguidas; el prototipo publicado ya tiene el cambio.

Pendiente:

- Que Manuel lo pruebe en su celular y diga si ya se percibe bien.
- Manuel mencionó "la estrella que aparece al inicio": confirmar con él a qué personaje
  espera controlar. Hoy el guía del Bosque es Cosmo (el planeta morado); la estrella es
  Lumi y solo aparece en la portada y a mitad del bosque. Cambiarlo es un dato de
  `cartilla.json` (`guia`), pero Lumi dejaría de ser habitante del bosque.

### 2. Más juego dentro de las misiones

Las cinco misiones usan la misma plantilla. Faltan los juegos propuestos en el informe:
Speak & Shine (voz), Listen & Catch, Memory con cartas que giran, Sentence Builder con
arrastre, Paint the World, Story Theater, Town Builder y Star Duel. Cada uno debe ser una
plantilla que reciba su contenido del paquete de la cartilla.

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

- "Empezar de nuevo" borra las estrellas, pero la posición del guía y las luciérnagas
  atrapadas solo se reinician al recargar la página.
- Al recargar con misiones ya hechas, Cosmo repite la frase de "el bosque tiene más luz".
- El cambio de español a inglés ocurre muy rápido (tras 2 misiones) para que se note en el
  prototipo. En la cartilla real debe repartirse entre los cuatro territorios; se ajusta en
  `idiomaPorAvance` dentro de `cartilla.json`.
- No hay funcionamiento sin conexión todavía.
- Faltan los territorios 2, 3 y 4 y su contenido.
- El filtro que apaga y enciende el color del bosque puede ser pesado en celulares de gama
  baja; medirlo.
- Vista para la familia y medición antes/después del piloto: propuestas, sin empezar.

## Límites del entorno que conviene saber

- La sesión en la nube no puede crear repositorios de GitHub; los crea Manuel y se conectan.
- No hay acceso al computador de Manuel; todo se hace en el contenedor de la sesión.
- Canva está conectado y disponible, aún sin usar.
- En las pruebas con Playwright, los botones animados necesitan `force: true` al hacer clic.
- El prototipo publicado es el contenido de `dist/` con un `index.html` sin `<head>` que
  apunta a `assets/index-*.js` y `.css`; al republicar se quitan los dos archivos viejos.
