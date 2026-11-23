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
- Sitio https://englishlandmanuelprofe.netlify.app (Netlify `94f443a2-de53-4029-ab21-f6673073280c`).
  Publicar: herramienta Netlify `deploy-site` y correr desde la raíz el `npx` que devuelve.
  **Solo con permiso de Manuel.**
- Supabase `https://jpwwmzfhbdnzsvwuciqa.supabase.co`. Clave pública en `.env.example` y
  `netlify.toml`; la secreta nunca se pide en el chat. Aplicadas las migraciones 002 y 003. Manuel
  aplica las nuevas siguiendo `supabase/PASOS-MANUEL.md`. Prueba local: `supabase/prueba_local.sql`
  (correr una copia sin las líneas `create role`).
- ElevenLabs: secreto del entorno (`ELEVENLABS_API_KEY=proxy-injected`); 40.000 créditos al mes.
  Usar Kokoro para borradores y ElevenLabs solo para guías y frases clave.
- Agentes en `.claude/agents/` (Sonnet/Haiku); Opus orquesta. Si no tienen cupo, Opus lo hace.
- Pruebas: `npm run build`, luego `node scripts/pruebas/<nombre>.mjs` (estudiante, docente,
  biblioteca, materiales, rutas, adultos…). `docente.mjs` falla a veces por una carrera de carga:
  repetirla antes de buscar un error.
- Calendario: `herramientas/calendario.py` genera el plan y los archivos de cada día
  (`--sin-pisar` no sobrescribe los días ya editados). Los detalles de cada bloque están en
  `herramientas/calendario_detalle.py`.

## Mapa del código (dónde está cada cosa)

- **Cartilla como datos:** `public/cartillas/ingles-3/` (`cartilla.json`, `materiales/`,
  `biblioteca/`, `canciones/`, `voz/`, `personajes/`). Hoy la ruta `ingles-3` está fija en
  `src/App.tsx:22`, `src/adultos/docente.ts:39` y `src/materiales/datos.ts:6`.
- **Estudiante:** `src/estudiante.tsx`, `src/Mundo.tsx` (mapa y movimiento), `src/juegos/`
  (plantillas: EscuchaToca, EscuchaAtrapa, Memoria, DiBrilla), `src/progreso.ts`, `src/nube.ts`,
  `src/entrada/` (tarjeta, código, QR, clave de dibujos), `src/sinConexion.ts`.
- **Adultos:** `src/adultos/Adultos.tsx` (rutas por rol), `Docente.tsx`, `Materiales.tsx`
  (Planear), `Biblioteca.tsx`, `Colegio.tsx` (coordinador), `Plataforma.tsx` (dueño),
  componentes base en `base.tsx` y `comun.tsx`.
- **Proyectar:** `src/proyectar/Proyectar.tsx`.
- **Base de datos:** `supabase/migraciones/` (002 esqueleto, 003 ajustes),
  `supabase/funciones/invitar/`. `registrar_mision` está en 002 (línea ~854).
- **Herramientas de contenido:** `herramientas/` (voces, letras sincronizadas,
  `materiales_a_json.py`, `importar/`).
- **Documentos de diseño y pedagogía:** `docs/diseno/esqueleto.md` (tandas 5 y 6 en §8),
  `docs/pedagogia/` (materiales, canciones, catálogo de interfaces).

## Para después de diciembre (sin fecha)

Territorios 2 a 4 de cada cartilla; cinemática C del puente (`docs/cinematicas/guiones.md`); mapa
ronda 2 (`docs/diseno/ronda-2-mapa.md`); voces de vecinos y héroes; medición antes y después del
piloto; confirmar el estándar MEN citado en `docs/pedagogia/canciones-bosque.md`.
