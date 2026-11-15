# Cómo continuar

Documento de traspaso entre sesiones. Las reglas permanentes están en `CLAUDE.md`; esto es la
foto del momento (15 de noviembre de 2026). El detalle histórico (cómo se armó el mapa, cómo se
saca una imagen de Canva, decisiones del 12 al 14 de noviembre) está en
`docs/historial/continuar-hasta-2026-11-14.md`.

## Dónde está todo

| Qué | Dónde |
| --- | --- |
| Repositorio | `manuelprofe/plataforma-cartillas`, rama de trabajo `ccr-c31d414e-rt7zgq` (todo lo integrado está ahí; `main` está atrasada) |
| Sitio de prueba (lo están probando conocidos de Manuel) | https://curious-stroopwafel-4b70aa.netlify.app — sitio Netlify `94f443a2-de53-4029-ab21-f6673073280c` |
| Prototipo viejo en claude.ai | https://claude.ai/artifact/ABBpsdFyRhwggWZgxYYxxC (ya no hace falta actualizarlo) |
| Supabase | `https://jpwwmzfhbdnzsvwuciqa.supabase.co`, clave pública `sb_publishable_CaFq1L46SKUAHTkjWbk8_w_gCb509s1`; esquema en `supabase/esquema.sql` (ejecutado, la app aún no lo usa). La clave secreta nunca se pide en el chat |
| Especificaciones vigentes | `docs/pedagogia/ronda-1.md`, `docs/diseno/ronda-1.md`, `docs/diseno/accesorios.json`, `docs/referencias/juegos.md`, `docs/cinematicas/guiones.md` |

**Publicar en Netlify:** Netlify construye `main`, pero el trabajo está en la rama de trabajo.
Mientras no se unan, se publica desde el repositorio con la herramienta de Netlify
(`deploy-site` con el id del sitio; devuelve un comando `npx -y @netlify/mcp@latest ...` que se
corre en la raíz). Manuel puede renombrar el sitio en Netlify.

## Qué hay construido (todo comprobado a 390 px)

- **Modo estudiante del Bosque de los Sonidos** (Vite + React + TypeScript, `src/`):
  portada → elegir personaje (Tavi, Mika, Bruno) → cinemática de inicio (solo la primera vez) →
  mapa visto desde arriba. El personaje camina por los caminos (búsqueda de rutas, `src/rutas.ts`).
- **18 misiones:** 5 caminos × 3 (escuchar y tocar → Listen & Catch → Di y brilla), 2 de la hora
  (la segunda con voz) y Memory de repaso en el pozo de la plaza. Encargos de 3 vecinos, álbum de
  palabras, mini mapa, palabras para repasar.
- **Juegos (plantillas en `src/juegos/`)**: EscuchaToca, EscuchaAtrapa (Listen & Catch), Memoria,
  DiBrilla (voz con micrófono; si no hay, decirla en voz alta 🗣️ o escribirla ⌨️; muestra cómo
  se pronuncia, no cómo se escribe). Final común en `CierreMision.tsx`.
- **Contenido** en `public/cartillas/ingles-3/cartilla.json`, generado por
  `herramientas/construir_bosque.py` a partir del suelo (`fondos/bosque-mapa.webp`, pintado con
  `herramientas/pintar_suelo.py`; PNG fuente en Canva `MAHa545H3F0`). **Los textos se editan en el
  guion, no en el JSON.**
- **Sin conexión:** service worker propio (`sw/sw.js`, generado por un plugin en
  `vite.config.ts`), manifiesto e iconos. Primera carga ~150 KB; el paquete (~1,2 MB) se guarda
  después. Los videos no se guardan: sin red la intro se salta.
- **Cinemática de inicio:** `videos/inicio-bosque-9x16.mp4` y `-16x9.mp4` (30 s, < 2 MB), hechos
  aquí con el mapa y los personajes reales (escena HTML grabada cuadro a cuadro + ffmpeg); la
  narración la dice la app (`cinematicas` en el JSON, `src/Cinematica.tsx`).
- **Arte listo sin usar todavía:** 6 accesorios (`accesorios/`, anclas en `docs/diseno/accesorios.json`).
- **Progreso** en el dispositivo (`src/progreso.ts`, `localStorage`). Aún sin cuentas ni servidor.

## Decisiones de Manuel vigentes

- Estrellas **opción B** (aún sin construir): el puente se abre cuando todos los faroles brillan;
  Mission Stars con la escala de la tesis (la app da completar 15, pronunciar 10, mejorar 15,
  autoevaluarse 10; el docente da participar 10 y colaborar 15, que no bloquean nada).
- Sesión diaria de unos 15 minutos y 3 misiones; al terminarla, lo nuevo se apaga hasta mañana.
  Plan por semanas: el docente elige el tema y cuántas sesiones (ver `docs/pedagogia/ronda-1.md` §3).
- Prueba del viernes: el niño nunca ve una nota; la calificación la ve el docente.
- "Empezar de nuevo" pasa a la zona de la familia. "Marker" es "pen" (lapicero en Los Patios).
- Cinemáticas: forma adaptativa (9:16 y 16:9), se ven una vez y quedan en "Recuerdos".
  Las demás pueden hacerse igual que la de inicio o con Gemini (guiones en `docs/cinematicas/`).
- Lo que recomiende el pedagogo queda como decisión (Manuel lo delegó).

## Equipo de agentes y forma de trabajo (aprobada por Manuel)

Agentes en `.claude/agents/`: lider, pedagogo, investigador-juegos, disenador, disenador-grafico,
desarrollador, desarrollador-motor, revisor, auditor. Claude actúa como coordinador (líder).

- **Trabajo por fases, una sola activa a la vez** (detalle en `lider.md`): definir → diseñar →
  construir → revisar → auditar. Los agentes de las otras fases esperan quietos. Construir puede
  gastar más que escribir; lo que no se hace es gastar en paralelo.
- Cada agente tiene una sección "Eficiencia": partir de la punta de la rama, tocar solo sus
  archivos, probar solo lo cambiado, informe de 10 líneas; el revisor da máximo 10 hallazgos.
- Lo que más gastó el 14 de noviembre: varios desarrolladores a la vez sobre los mismos archivos
  y copias de trabajo viejas. Para tareas pequeñas, el coordinador las hace directamente.
- Si se acaba el límite de uso, se para todo y se retoma en el mismo orden.

## Complementos de Claude Code (revisados el 15 de noviembre)

Los cinco que pidió Manuel se identificaron, se leyeron completos y quedaron así. El detalle
(repositorio, commit, licencia, qué se modificó) está en `.claude/skills/ORIGEN.md`.

| Nombre que dio Manuel | Qué era | Estado | Para qué sirve aquí |
| --- | --- | --- | --- |
| Find Skills | `find-skills` de `vercel-labs/skills` | Instalada | Buscar skills en skills.sh cuando falte una capacidad; con la regla de leer antes de instalar |
| AnyDoc | `firecrawl/anydoc` (skill `convert-documents-to-markdown`) | Instalada | Leer Word, Excel, PowerPoint y PDF (tesis, planes de área, listas) convirtiéndolos a Markdown en local. Prohibido `--ocr hosted` sin permiso |
| Claude Code Zeta | Plugin oficial `claude-code-setup` de Anthropic (skill `claude-automation-recommender`) | Instalada | Analiza el proyecto y recomienda hooks, skills y conexiones; solo lee |
| Agent Skills | `addyosmani/agent-skills` | Instaladas 4 de 25 | `planning-and-task-breakdown`, `incremental-implementation`, `test-driven-development`, `code-review-and-quality` (planificar, programar, probar, revisar). El resto no se copió para no cargar el contexto ni chocar con el equipo de agentes |
| Cloud Mem | `thedotmack/claude-mem` | **No instalada** | Guarda en el disco de la máquina (se borra en la nube) o en su servicio; registra todas las acciones y gasta uso extra. La memoria entre sesiones sigue siendo este archivo. Si Manuel usa Claude Code en su propio computador y la quiere allí, se instala allí con la analítica y la sincronización apagadas |

Se instalaron como archivos en `.claude/skills/` (no como plugins) para que estén en toda sesión
nueva sin configurar nada. Cuando una skill externa contradiga `CLAUDE.md` o `lider.md`, mandan
estos.

**Probado:** las siete skills cargan en la sesión; el recomendador se corrió sobre el proyecto
(resultado abajo). **Falta probar** `npx @firecrawl/anydoc` y `npx skills find`: el entorno
bloqueó ejecutar esos paquetes y hace falta que Manuel lo autorice.

Recomendaciones del recomendador (sin aplicar; las decide Manuel):
1. Hook que corra `tsc --noEmit` después de editar `src/` (hoy no hay pruebas ni linter).
2. Hook que impida editar a mano `public/cartillas/ingles-3/cartilla.json` (se genera con
   `herramientas/construir_bosque.py`).
3. Pruebas unitarias (Vitest) para `src/rutas.ts` y `src/progreso.ts` antes de conectar Supabase.
4. Conexión de Supabase para Claude solo cuando empiece la fase de cuentas, y de solo lectura.

## Versión publicada para pruebas (15 de noviembre, tarde)

En Netlify está la punta de la rama hasta el commit de la voz: hora "3:00", estrellas opción B,
vestidor, voz grabada y diálogos en español. Manuel dijo que es la última versión para esta
ronda de pruebas. (El silencio en su computador era Chrome con el sonido apagado, no un error.)

- **Idioma (decisión de Manuel):** en grado tercero los personajes hablan siempre en español;
  en inglés solo suenan las palabras que se aprenden (`idiomaPorAvance = ['es']` en el guion).
  Más adelante el inglés entra poco a poco **mezclado dentro de frases en español, estilo
  "Dora la exploradora"**. Falta que el pedagogo defina esa progresión y escriba la versión
  mezclada de los diálogos (hoy solo existen español completo e inglés completo; el modo
  `mixto` del código dice la frase en inglés y luego en español, que no es lo que se quiere).
- **Voz grabada:** `herramientas/generar_voz.py` genera un MP3 por frase con Piper (voz neuronal
  local, no envía nada a internet) y anota el índice `voz` en `cartilla.json`; los audios van en
  `public/cartillas/ingles-3/voz/` (188 frases, ~1,4 MB, fuera de la primera carga; el service
  worker los guarda con el paquete). Voces: `es_MX-claude-high` (Apache 2.0) y
  `en_US-ljspeech-high` (dominio público), de huggingface.co/rhasspy/piper-voices.
  **Después de cambiar textos: correr `construir_bosque.py` y luego `generar_voz.py`** (solo
  genera lo nuevo). Lo que no esté grabado suena con la voz del navegador. Nadie ha oído aún
  la voz nueva con oído humano: esperar la opinión de Manuel y los probadores.
- **En curso (desarrollador):** resumen para la familia con "Empezar de nuevo" (a medias, sin
  confirmar: `src/Familia.tsx`, `src/BotonSostenido.tsx`) y después "Recuerdos". Al terminar:
  revisor. Nada de esto está publicado.
- No reescribir la historia de la rama (el entorno bloquea `push --force`); si un agente
  enmienda un commit ya subido, se une con `git merge -s ours`.

## Pendientes

1. **Pruebas de los conocidos de Manuel:** él traerá un informe de errores y mejoras. Atenderlo
   primero cuando llegue.
2. **Construir lo ya especificado:** hechos la hora "3:00", estrellas opción B y vestidor;
   faltan el resumen para la familia con "Empezar de nuevo" y la sección "Recuerdos".
3. **Probado solo en simulador:** micrófono real, modo avión e instalación en un Android real.
4. Unir la rama de trabajo con `main` (con permiso de Manuel) para que Netlify publique solo.
5. Voz: ya es generada (Piper). Falta la opinión de Manuel; si no convence, grabar o probar otra.
6. Territorios 2 a 4. Vista para el docente y la familia. Medición antes/después del piloto.
7. Pendiente técnico conocido: la app no carga dentro de un iframe con sandbox sin
   `allow-same-origin`, ni en una subcarpeta escrita sin barra final.

## Siguiente foco propuesto: cuentas, base de datos y modo docente

Recomendación del 15 de noviembre (ver la conversación): es lo que separa el prototipo del
piloto. Sin cuentas no hay seguimiento del docente, ni plan por semanas, ni prueba del viernes,
ni resumen por estudiante. El esquema de Supabase ya existe (roles dueño, coordinador, docente;
estudiantes con código de grupo, apodo y PIN de tres imágenes sobre sesión anónima; estrellas en
un registro que solo crece). Falta confirmar con Manuel que activó *Allow anonymous sign-ins*.

Orden por fases:
1. **Definir (pedagogo):** qué necesita ver y hacer el docente en una hora de clase a la semana
   (grupo, avance, dar estrellas, plan de la semana, prueba del viernes) y qué datos mínimos se
   guardan (Ley 1581). Qué ve el coordinador.
2. **Diseñar (disenador):** entrada del estudiante (código de grupo → apodo → PIN de imágenes),
   pantallas del docente para celular y proyector, y del coordinador.
3. **Construir (desarrollador):** conectar `src/progreso.ts` a Supabase con copia local y
   sincronización (debe seguir funcionando sin red), entrada del estudiante, modo docente básico.
4. **Revisar** y **auditar** (privacidad de menores y seguridad por filas antes del piloto).
