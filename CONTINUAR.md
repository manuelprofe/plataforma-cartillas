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

## Pendientes

1. **Pruebas de los conocidos de Manuel:** él traerá un informe de errores y mejoras. Atenderlo
   primero cuando llegue.
2. **Construir lo ya especificado:** estrellas opción B, vestidor de accesorios (recalibrar los
   umbrales con la escala nueva), resumen para la familia imprimible con "Empezar de nuevo",
   sección "Recuerdos" para volver a ver cinemáticas, la hora muestra "3:00" en la fase de mirar.
3. **Probado solo en simulador:** micrófono real, modo avión e instalación en un Android real.
4. Unir la rama de trabajo con `main` (con permiso de Manuel) para que Netlify publique solo.
5. Voz definitiva grabada o generada (hoy es la del navegador).
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
