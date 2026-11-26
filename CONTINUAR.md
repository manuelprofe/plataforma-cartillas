# Cómo continuar

Cada día es una sesión nueva: escriba **/hoy** y Claude lee solo el plan del día
(`docs/plan/dias/AAAA-MM-DD.md`). Este archivo guarda lo que sirve para todo lo que viene; lo
terminado vive en git, no aquí. Las reglas permanentes están en `CLAUDE.md`.

## Meta

Diciembre de 2026: plataforma terminada (hasta el 4 dic) y las cartillas de inglés, español y
matemáticas de transición a 5.° en versión 1 (del 7 al 30 dic). Versión 1 = malla completa,
territorio 1 jugable y materiales del periodo 1. Inglés 3 ya existe. Lunes a viernes, 6 h al día.
Plan completo: `docs/plan/calendario-diciembre.md` (también en Google Calendar, eventos «Cartillas ·»).

## Datos de trabajo

- Rama `ccr-c31d414e-rt7zgq` (`main` atrasada; unirla solo con permiso). Sin `push --force`.
- Sitio https://cuadernodegoma.pages.dev (Cloudflare Pages, proyecto `cuadernodegoma`, cuenta
  elcuadernodegoma@gmail.com), desde el 25 nov 2026. **Cada push a la rama se publica solo**
  (rama de producción `ccr-c31d414e-rt7zgq`, `npm run build:cloudflare`, salida `dist`). Hacer push
  solo con trabajo probado. Netlify (englishlandmanuelprofe.netlify.app) quedó con la versión del
  24 nov: se pausó al agotar los créditos gratis.
- Supabase `https://jpwwmzfhbdnzsvwuciqa.supabase.co`. Clave pública en `.env.example` y
  `netlify.toml`; la secreta nunca se pide en el chat. Aplicadas las migraciones 002 a 005 (la 005 el 24 nov). Manuel
  aplica las nuevas siguiendo `supabase/PASOS-MANUEL.md`. Prueba local: `supabase/prueba_local.sql`
  (correr una copia sin las líneas `create role`).
- ElevenLabs: secreto del entorno (`ELEVENLABS_API_KEY=proxy-injected`); 40.000 créditos al mes.
  Usar Kokoro para borradores y ElevenLabs solo para guías y frases clave.
- Agentes en `.claude/agents/` (Sonnet/Haiku); Opus orquesta. Si no tienen cupo, Opus lo hace.
- Pruebas: copiar `.env.example` a `.env` (sin él fallan las de adultos), `npm run build`, luego
  `node scripts/pruebas/<nombre>.mjs` (estudiante, docente, biblioteca, materiales, rutas, adultos,
  multicartilla, docente-cartillas, plan-grupo…). `gama-baja.mjs` mide las plantillas en un celular
  barato emulado (CPU 4x, 4G lenta): el 27 nov todas por debajo de 50 ms por toque y la portada en 206 KB.
- Calendario: `herramientas/calendario.py` genera el plan y los archivos de cada día
  (`--sin-pisar` no sobrescribe los días ya editados). Los detalles de cada bloque están en
  `herramientas/calendario_detalle.py`.

## Mapa del código (dónde está cada cosa)

- **Cartilla como datos:** `public/cartillas/<id>/` (`cartilla.json`, `materiales/`,
  `biblioteca/`, `canciones/`, `voz/`, `personajes/`). La ruta sale de `rutaCartilla(id)` en
  `src/cartillas.ts`. El estudiante juega la cartilla de su grupo (`cartillaDe` en
  `src/perfiles.ts`, viene de `lista_grupo`); el invitado usa la predeterminada `ingles-3`. El
  docente ve Planear, Biblioteca y Proyectar de la cartilla elegida (`base()` y
  `elegirCartillaMateriales` en `src/materiales/datos.ts`; selector en `src/adultos/ElegirCartilla.tsx`
  solo si sus grupos tienen cartillas distintas). El service worker baja solo las cartillas del aparato.
- **Estudiante:** `src/estudiante.tsx`, `src/Mundo.tsx` (mapa y movimiento), `src/juegos/`
  (plantillas: EscuchaToca, EscuchaAtrapa, Memoria, DiBrilla, ContarToca, Ordenar, Operacion y
  Silabas; leen `contar`, `ordenar`, `operacion` y `silabas` de la misión, tipos en
  `src/tipos.ts`, ejemplos de contenido en `scripts/pruebas/contar-ordenar.mjs` y
  `operacion-silabas-leer.mjs`. DiBrilla sirve en español: con la voz `es-*` usa `palabra.es`, y
  con `leer: true` la palabra se ve escrita desde el principio para leerla en voz alta), `src/progreso.ts`, `src/nube.ts`,
  `src/entrada/` (tarjeta, código, QR, clave de dibujos), `src/sinConexion.ts`.
- **Adultos:** `src/adultos/Adultos.tsx` (rutas por rol), `Docente.tsx`, `Materiales.tsx`
  (Planear), `Biblioteca.tsx`, `Colegio.tsx` (coordinador; Uso y avance es un tablero por grado
  con cifras de `cifras_grupos`, imprimible en una hoja), `Plataforma.tsx` (dueño),
  componentes base en `base.tsx` y `comun.tsx`.
- **Plan por grupo (27 nov):** fechas de la clase 1 y 2 de cada tema en `planes_tema` (migración 002, sin
  migración nueva). Datos en `src/adultos/planGrupo.ts` (`proximaClase`, `farolClase`), pantallas en
  `src/adultos/FechasPlan.tsx` (plan del grupo en Planear y fechas en el plan del tema). Inicio del docente
  muestra la próxima clase del primer grupo. Falta: que el coordinador vea el tema de cada grupo en Uso y avance.
- **Proyectar:** `src/proyectar/Proyectar.tsx`.
- **Base de datos:** `supabase/migraciones/` (002 esqueleto, 003 ajustes),
  `supabase/funciones/invitar/`. `registrar_mision` está en 002 (línea ~854).
- **Pensum (25 nov):** mallas fuente en `docs/pedagogia/pensum/*.md` (copia en la carpeta del proyecto,
  `contenidos/`). `python3 herramientas/pensum_a_json.py` escribe `public/cartillas/<materia>-<grado>/pensum.json`
  (grado 0 = transición) y `public/cartillas/catalogo.json`. Lo leen el armador (materia, grado, tema → DBA y
  desempeños) y la Biblioteca (`/docente/biblioteca/pensum`); código en `src/pensum/`. Migración 009 (aplicada) da de alta las 17 sin publicar.
- **Cartillas nuevas jugables (paso 2):** el contenido de cada una vive en `docs/pedagogia/cartillas/<id>.json`
  y `python3 -I herramientas/cartilla_desde_molde.py <ese json>` la arma sobre la página 1 de `ingles-3`
  (misma geometría, ids nuevos, escenas propias, iconos SVG compuestos con Twemoji). Listas: `matematicas-0`
  (periodo 1, U1 y U2), `espanol-0` (periodo 1, U1 a U3) e `ingles-0` (Postal, periodo 1, voz en-US, escenas bilingües; `"conservarEscenas": true`); prueba: `node scripts/pruebas/cartilla-nueva.mjs <id>`. Voz del navegador hasta correr `generar_voz.py`. Vista previa sin publicar:
  `/?cartilla=<id>` (invitado). Falta para publicarla: su `materiales/indice.json` y `biblioteca/` (el docente
  de un grupo con esa cartilla los pide) y la migración de misiones (010, 011 y 012, pendientes de Manuel).
  Siguen: 1.° (matemáticas, español, inglés), luego 2.° y así hasta 5.°.
- **Herramientas de contenido:** `herramientas/` (voces, letras sincronizadas,
  `materiales_a_json.py`, `importar/`).
- **Documentos de diseño y pedagogía:** `docs/diseno/esqueleto.md` (tandas 5 y 6 en §8),
  `docs/pedagogia/` (materiales, canciones, catálogo de interfaces).

## Pendientes conocidos

- Identidad nueva **Cuaderno Vivo** (Goma, Cuadrito, Renglón, Postal, Garabato) reemplaza a
  English Adventure Quest: la lleva otro hilo. No agregar contenido con Lumi, Pixie, Cosmo, Nova
  ni la metáfora de la luz.
- Una cartilla nueva (matemáticas, español) necesita: sus misiones en la tabla `misiones`
  (`herramientas/misiones_sql.py`) para que `registrar_mision` las acepte, y palabras en el
  territorio si su mapa trae luciérnagas (`Mundo.tsx` reparte palabras del territorio).
- Videos de la Biblioteca: se ven incrustados de YouTube (miniatura y, al tocarla, el reproductor
  de youtube-nocookie; suman vistas al canal). Para cambiar uno por un capítulo propio basta con
  poner su enlace (watch, youtu.be o shorts) en `biblioteca/recursos.json`, campo `videos`.
- Voz (revisado el 25 nov): la plataforma no graba ni guarda audio; el navegador convierte la voz
  en texto. Donde el aparato tiene el modelo local se usa (`processLocally`); si no, Chrome envía
  el audio a su servicio en línea para transcribirlo. Conviene decirlo en el aviso a las familias.

## Para después de diciembre (sin fecha)

Territorios 2 a 4 de cada cartilla; cinemática C del puente (`docs/cinematicas/guiones.md`); mapa
ronda 2 (`docs/diseno/ronda-2-mapa.md`); voces de vecinos y héroes; medición antes y después del
piloto; confirmar el estándar MEN citado en `docs/pedagogia/canciones-bosque.md`.
