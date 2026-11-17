# Cómo continuar

Documento de traspaso entre sesiones. Las reglas permanentes están en `CLAUDE.md`; esto es la
foto del momento (**17 de noviembre de 2026**). El detalle histórico hasta el 14 de noviembre está
en `docs/historial/continuar-hasta-2026-11-14.md`.

**Al empezar una sesión nueva:** leer este archivo y `CLAUDE.md`, ir a "Trabajo en curso" y
retomar en ese orden. Una sola fase activa a la vez; el coordinador (Claude, rol `lider`) reparte.

## Dónde está todo

| Qué | Dónde |
| --- | --- |
| Repositorio | `manuelprofe/plataforma-cartillas`, rama de trabajo `ccr-c31d414e-rt7zgq` (todo lo integrado está ahí; `main` está atrasada) |
| Sitio de prueba (lo usan conocidos de Manuel) | https://curious-stroopwafel-4b70aa.netlify.app — sitio Netlify `94f443a2-de53-4029-ab21-f6673073280c` |
| Supabase | `https://jpwwmzfhbdnzsvwuciqa.supabase.co`, región **East US (Ohio)**, clave pública `sb_publishable_CaFq1L46SKUAHTkjWbk8_w_gCb509s1`; esquema en `supabase/esquema.sql` (ejecutado; la app aún no lo usa). *Allow anonymous sign-ins* activado según Manuel (sin comprobar desde aquí). La clave secreta nunca se pide en el chat |
| Especificaciones ronda 1 (construidas) | `docs/pedagogia/ronda-1.md`, `docs/diseno/ronda-1.md`, `docs/diseno/accesorios.json`, `docs/referencias/juegos.md`, `docs/cinematicas/guiones.md` |
| Especificaciones ronda 2 (por construir) | `docs/diseno/ronda-2-mapa.md` (+ capturas en `docs/diseno/ronda-2/`), `docs/pedagogia/ronda-2-docente.md` |
| Skills y su origen | `.claude/skills/` y `.claude/skills/ORIGEN.md` |
| Hooks | `.claude/settings.json`: revisa tipos (`tsc`) al editar `src/` y bloquea editar a mano `cartilla.json` |

**Publicar en Netlify:** Netlify construye `main`, pero el trabajo está en la rama. Mientras no se
unan, se publica con la herramienta de Netlify (`deploy-site` con el id del sitio): devuelve un
comando `npx -y @netlify/mcp@latest ...` que se corre en la raíz. **No publicar sin permiso de
Manuel.**

**Git:** el entorno bloquea `push --force` y reescribir historia. Commits nuevos y `git push`
normal. Si algo quedó enmendado, unir con `git merge -s ours`.

## Qué está publicado (17 de noviembre)

Lo publicado es la punta de la rama hasta el commit "Voz más natural: Kokoro reemplaza a Piper".

- **Modo estudiante del Bosque de los Sonidos** (Vite + React + TypeScript, `src/`): portada →
  elegir personaje (Tavi, Mika, Bruno) → cinemática de inicio (una vez) → mapa visto desde arriba
  donde el personaje camina por los caminos (`src/rutas.ts`).
- **18 misiones:** 5 caminos × 3 (escuchar y tocar → Listen & Catch → Di y brilla), 2 de la hora y
  Memory de repaso en el pozo (opcional). Encargos de 3 vecinos, luciérnagas, álbum, mini mapa.
- **Estrellas opción B:** el puente se abre con los 17 faroles; Mission Stars con la escala de la
  tesis (completar 15, pronunciar 10, mejorar 15, autoevaluarse 10; participar 10 y colaborar 15
  quedan en el tipo, sin interfaz, para el docente). Migración de `pc_progreso_v3` a `v4` sin perder nada.
- **Vestidor** (6 accesorios y las estelas), **"Recuerdos"** (volver a ver la cinemática), la hora
  muestra "3:00" en la fase de mirar.
- **Para la familia:** desde la portada, sosteniendo 3 s. Resumen sin notas, imprimible en una hoja,
  "Empezar de nuevo" al final (sostener 2 s) y **recuperable durante 7 días** desde esa pantalla.
- **Idioma:** los personajes hablan siempre en español; en inglés solo suenan las palabras que se
  aprenden (`idiomaPorAvance = ['es']` en el guion).
- **Voz grabada con Kokoro** (Kokoro-82M, Apache 2.0, corre local): `ef_dora` en español (0,82 de
  velocidad) y `af_heart` en inglés (0,85). 158 frases, ~1,5 MB en `public/cartillas/ingles-3/voz/`,
  fuera de la primera carga. Se reanuda si el sistema pausa el audio; si una frase no está o tarda
  más de 1,5 s, la dice la voz del navegador. **No volver a Piper** (a Manuel le sonó robótica).
- **Sin conexión:** service worker propio (`sw/sw.js`, generado en `vite.config.ts`). Primera carga
  ~140 KB comprimidos; el paquete se guarda después. Los videos no se guardan.

**Cómo se edita el contenido:** los textos van en `herramientas/construir_bosque.py`, nunca en el
JSON. Correr `python3 -I herramientas/construir_bosque.py public/cartillas/ingles-3/fondos/bosque-mapa.webp public/cartillas/ingles-3/cartilla.json --solo-contenido`
(sin `--solo-contenido` mueve casas y misiones, porque el PNG del suelo sigue solo en Canva
`MAHa545H3F0`) y después `herramientas/generar_voz.py` (solo genera lo nuevo; la cabecera del
guion dice cómo instalar Kokoro y bajar el modelo, que no está en el repositorio). Pruebas con
Playwright en `scripts/pruebas/*.mjs`.

## Decisiones de Manuel vigentes

- **Dónde se juega (17 nov):** los niños de tercero **no tienen celular**. El modo estudiante se
  usa **en casa, con el celular de los papás**. En el salón solo hay **proyector** (a veces el aula
  de audiovisuales con computador, pero no es seguro contar con ella). Consecuencias: el docente
  trabaja proyectando; el juego en casa es la práctica; el celular es compartido en familia.
- **Voz:** se queda Kokoro como está. **Más adelante** quiere voces clonadas a partir de ~10 s de
  grabación (Chatterbox multilingüe, licencia MIT, lo permite; en la prueba del 17 nov tardó
  ~15 s por frase en CPU). Requiere permiso escrito de quien grabe. No tocar la voz hasta entonces.
- **Mapa:** aprobado "mirador y senderos" (`docs/diseno/ronda-2-mapa.md`) y **sí a las 7
  preguntas de su §6** (paradas en vez de caminar libre; faroles en fila; encargos con tres
  tarjetas junto al vecino; luciérnagas automáticas, dos por día, contador al álbum; límite de 3
  misiones al día con interruptor "sin límite" en la zona de la familia; orden escuela, colores,
  números, cuerpo, familia, reloj; frases nuevas por el pedagogo). Con **dos cambios de Manuel**:
  1. **Estaciones:** los ejercicios de un mismo tema van juntos en **una sola estación**, no un
     farol suelto por ejercicio, para caminar menos y no perderse.
  2. **Una estatua o escultura por lugar** que, al tocarla, explique algo breve (audio primero;
     el texto acompaña).
- **Docente, cuentas y coordinador:** sí a las recomendaciones 2 a 8 de
  `docs/pedagogia/ronda-2-docente.md` §6 (dos clases por tema; los datos los responde el colegio
  con revisión del rector; micrófono solo con permiso expreso; el docente da "pronunciar" solo
  como respaldo; se puede jugar sin cuenta; el docente cambia el PIN pero no lo ve; la
  coordinación no ve resultados de la prueba).
- El niño nunca ve una nota; la calificación de la prueba la ve solo el docente.
- "Empezar de nuevo" vive en la zona de la familia. "Marker" es "pen" (lapicero en Los Patios).
- Cinemáticas: 9:16 y 16:9, se ven una vez y quedan en "Recuerdos".
- Lo que recomiende el pedagogo queda como decisión (Manuel lo delegó).

## Trabajo en curso (retomar aquí, en este orden)

### 1. Diseñador: ajustar el mapa con estaciones y estatua — **interrumpido por límite de uso**

El diseñador empezó y solo alcanzó a dejar `docs/diseno/ronda-2/10-boceto-estacion.webp`; el
documento **no** está actualizado. Relanzar el agente `disenador` (fase diseñar, sin programar)
con este encargo:

> Actualiza `docs/diseno/ronda-2-mapa.md` en el sitio (reescribe las secciones afectadas; que no
> queden versiones contradictorias) con los dos cambios de Manuel. (1) **Estaciones:** los
> ejercicios de un tema van en una sola estación (lo natural: una por tema con sus 3 ejercicios;
> define qué pasa con las 2 de la hora y el Memory del pozo), cómo se ve, cómo muestra sin texto
> cuántos ejercicios tiene y cuáles brillan (pueden ser tres luces de la misma estación; cada
> misión sigue encendiendo su luz), cómo se entra al siguiente y se repite uno hecho, cómo encaja
> con la sesión de 3 misiones y el puente de 17 luces; qué se simplifica de §3. (2) **Estatua por
> lugar** que explica algo breve: posición, tamaño y zona de toque, qué muestra (tarjeta,
> duración, cierre), audio primero, datos del paquete. Además, **ajusta a la decisión de que el
> niño juega en casa con el celular de los papás** (celular compartido, sesiones cortas, un
> adulto cerca a veces). Usa o rehace el boceto `10-boceto-estacion.webp` (uno solo). Al final:
> "Encargo para el pedagogo" (frases de Lumi, nombres de los 7 lugares, textos de las estatuas,
> con límites de largo y tono) y "Tandas de construcción" con criterio de aceptación a 390 px.
> Commit en español, push normal. Informe de 10 líneas.

### 2. Pedagogo: textos del mapa y ajuste del documento docente

Después del diseñador, en una sola tarea del agente `pedagogo`:
- Escribir lo que pida "Encargo para el pedagogo" (frases de Lumi, nombres de lugares, textos de
  las estatuas) directamente en `herramientas/construir_bosque.py` o en una sección del documento
  que el desarrollador pase al guion.
- **Ajustar `docs/pedagogia/ronda-2-docente.md`** a que en el salón no hay celulares: el docente
  trabaja con proyector (juegos de aula proyectados, dar estrellas de participar y colaborar
  en clase), el niño practica en casa con el celular de los papás, y la **prueba del tema** debe
  poder hacerse proyectada en clase o en casa (decidir cuál y cómo, sin que el niño vea notas).
  Revisar la entrada con código de grupo, apodo y PIN pensando en un celular familiar compartido
  entre hermanos.
- **Región East US (Ohio):** los datos quedan en Estados Unidos; el borrador de autorización para
  los padres debe decir dónde se guardan y que hay transferencia internacional (Ley 1581). El texto
  no es concepto jurídico: que lo revise el colegio.

### 3. Desarrollador-motor: construir el mapa nuevo por tandas

Con el documento del mapa ya actualizado y los textos del pedagogo. Una tanda por vez, commit por
tanda, comprobación a 390 px con Playwright, sin publicar. Después de cada tanda grande, `revisor`
(máximo 10 hallazgos). Mostrar a Manuel antes de publicar.

### 4. Diseñador: pantallas del docente, la entrada del estudiante y el coordinador

Partir de `docs/pedagogia/ronda-2-docente.md` ya ajustado. Pantallas del docente **para
proyector** (y celular del docente para preparar la clase), entrada del estudiante en celular
familiar, coordinador. Antes de construir: corregir `supabase/esquema.sql` según su §4.5 (el
coordinador hoy puede leer y borrar datos de cada niño; `lista_grupo` entrega apodos a cualquier
sesión anónima que adivine el código) y que el `auditor` verifique si el reconocedor de voz del
navegador (`src/escuchar.ts`) envía audio al fabricante.

## Pendientes menores

1. **Pruebas de los conocidos de Manuel:** cuando traiga su informe, atenderlo primero.
2. Las caritas del cierre de misión no tienen voz (pedagogía ronda 1 §1.7).
3. Preguntas abiertas para Manuel (sin urgencia): ¿la mochila cohete tan al final (misión 15 de
   17)?, ¿3 s para entrar al resumen?, ¿el pozo debe dar estrellas (hoy da 15)?
4. Probado solo en simulador: micrófono real, modo avión, instalación en un Android real.
5. Unir la rama con `main` (con permiso de Manuel) para que Netlify publique solo.
6. Falta probar `npx @firecrawl/anydoc` y `npx skills find` (el entorno los bloqueó; requiere
   permiso de Manuel).
7. La app no carga dentro de un iframe con sandbox sin `allow-same-origin`, ni en una subcarpeta
   escrita sin barra final.
8. Territorios 2 a 4. Medición antes/después del piloto (pedagogía ronda 1 §7).

## Equipo de agentes y forma de trabajo (aprobada por Manuel)

Agentes en `.claude/agents/`: lider, pedagogo, investigador-juegos, disenador, disenador-grafico,
desarrollador, desarrollador-motor, revisor, auditor. Claude actúa como coordinador.

- **Una sola fase activa a la vez** (detalle en `lider.md`): definir → diseñar → construir →
  revisar → auditar. Un solo agente de código a la vez sobre los mismos archivos.
- Cada agente parte de la punta de la rama, toca solo sus archivos, prueba solo lo cambiado e
  informa en 10 líneas; el revisor da máximo 10 hallazgos.
- **Si se acaba el límite de uso**, el agente se detiene con su trabajo a medias en el árbol de
  trabajo: revisar `git status`, confirmar lo que sirva y retomar con el mismo encargo.
- Los subagentes sin terminal (pedagogo) no pueden hacer commit: el coordinador lo hace.
- Tareas pequeñas: el coordinador las hace directamente.

## Complementos de Claude Code (15 de noviembre)

Instalados como archivos en `.claude/skills/` (detalle en `ORIGEN.md`): `find-skills`,
`convert-documents-to-markdown` (AnyDoc; prohibido `--ocr hosted` sin permiso),
`claude-automation-recommender` y cuatro de `addyosmani/agent-skills` (planificar, construir,
probar, revisar). **Claude-mem no se instala** (Manuel estuvo de acuerdo): la memoria entre
sesiones es este archivo. Cuando una skill externa contradiga `CLAUDE.md` o `lider.md`, mandan estos.
