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

- **Decisiones del 17 nov (Manuel: "sí a lo que recomiendas"):** Supabase se queda en EE. UU.
  con autorización expresa de los padres para la transferencia; el docente reparte y recoge la
  autorización y la encuesta de acceso en la reunión de padres; el modo docente se diseña para
  proyectar con computador, celular con adaptador o inalámbrico (no se sabe cuál usa cada colegio),
  sin que el telón muestre nunca datos de niños; las 4 preguntas de `ronda-2-mapa.md` §6 van como
  recomendó el diseñador (bandeja se abre sola, repetir no gasta cupo, una estatua común, quitar los 6 postes).
- Skill `unslop` instalada: solo pantallas de adultos.

## Trabajo en curso (retomar aquí, en este orden)

**Foco nuevo de Manuel (17 nov):** primero el **esqueleto** de la plataforma (interfaces de los
cuatro modos y base de datos), después llenar cada interfaz con su contenido (en el docente:
guías, fichas, planeadores de clase...). `npx skills find` y AnyDoc quedan para cuando toque esa parte.

Hecho: el diseño del mapa con estaciones y estatua (`docs/diseno/ronda-2-mapa.md`, commit
f85fec0). Sus 4 preguntas (§6) se construyen con lo recomendado si Manuel no dice otra cosa. La
construcción del mapa (§8, 5 tandas) y los textos del mapa (§7, pedagogo) esperan a que el esqueleto esté listo.

1. **Pedagogo (hecho, 17 nov):** ajustar `docs/pedagogia/ronda-2-docente.md` a proyector en el salón,
   juego en casa con celular familiar, prueba del tema y autorización con datos en EE. UU.; y escribir
   `docs/pedagogia/catalogo-interfaces.md` (qué contenido vive en cada interfaz, campos de cada
   material del docente, si sale del paquete de la cartilla o de la base de datos).
2. **Diseñador (hecho, aprobado por Manuel el 17 nov con sus 5 recomendaciones; ver `docs/diseno/esqueleto.md`):** mapa de pantallas de los cuatro modos (estudiante con código, apodo y PIN; familia;
   docente con plan, materiales y clase proyectada; coordinador; dueño), navegación, bocetos a
   390 px y en proyector. **Mostrar a Manuel antes de construir.**
3. **Desarrollador (en curso, por las 7 tandas de `esqueleto.md` §8). Tandas 1 y 2 hechas y revisadas (fb276cf, a89cb71); la migración 002 espera a que Manuel siga `supabase/PASOS-MANUEL.md`. Decisión del coordinador: el registro público queda encendido (los niños usan sesiones anónimas) y lo filtra el gancho `antes_de_crear_usuario` (solo anónimos o con invitación). Siguiente: tanda 3 (estudiante).** corregir `supabase/esquema.sql` según ronda-2-docente §4.5 (el coordinador lee
   y borra datos de cada niño; `lista_grupo` entrega apodos a quien adivine el código), agregar las
   tablas que pida el catálogo, armar la app con entrada por rol y secciones vacías, y sincronizar
   `src/progreso.ts` con Supabase sin perder el modo sin conexión.
4. **Revisor** y **auditor** (seguridad por filas, datos de menores, si `src/escuchar.ts` envía
   audio al fabricante).
5. **Contenidos** por interfaz, empezando por la del docente.

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
