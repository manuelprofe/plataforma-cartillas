# Cómo continuar

Estado al 21 nov 2026. Las reglas permanentes están en `CLAUDE.md` y el plan día por día en
`docs/plan/calendario-diciembre.md` (también en Google Calendar). Al empezar una sesión, leer esto,
`CLAUDE.md` y el bloque del calendario que toca hoy.

## Meta

Terminar la plataforma en diciembre de 2026 y dejar listas las cartillas de inglés, español y
matemáticas de transición a quinto (18 cartillas; inglés 3 ya existe). Piloto en aula el próximo
año escolar.

## Datos de trabajo

- Rama `ccr-c31d414e-rt7zgq` (`main` está atrasada; unirla solo con permiso). Sin `push --force`.
- Sitio: https://englishlandmanuelprofe.netlify.app (Netlify `94f443a2-de53-4029-ab21-f6673073280c`).
  Para publicar: herramienta Netlify `deploy-site` y correr desde la raíz el `npx` que devuelve.
  **Solo con permiso de Manuel.** Última publicación: 21 nov.
- Supabase `https://jpwwmzfhbdnzsvwuciqa.supabase.co`. La clave pública está en `.env.example` y
  `netlify.toml`; la secreta nunca se pide en el chat. Migraciones 002 y 003 aplicadas, gancho
  `antes_de_crear_usuario` activo, función `invitar` y SMTP con Gmail funcionando. Los pasos de
  Manuel están en `supabase/PASOS-MANUEL.md`.
- ElevenLabs: la clave es un secreto del entorno (en los scripts, `ELEVENLABS_API_KEY=proxy-injected`).
  Las voces están en `herramientas/generar_voz.py`. El plan da 40.000 créditos al mes: cuidarlos,
  porque 17 cartillas con audio los superan (ver el plan, §Riesgos).
- Agentes en `.claude/agents/` (Sonnet/Haiku); Opus orquesta y aprueba. Si los agentes no tienen
  cupo, Opus hace el trabajo directamente.
- Pruebas: `npm run build`, luego `node scripts/pruebas/<nombre>.mjs` (docente, biblioteca,
  materiales, rutas, adultos, estudiante…). Todo cambio visible se mira a 390 px.

## Lo que ya está hecho

- **Estudiante** (inglés 3, Bosque de los Sonidos): mapa con movimiento suave, misiones con 4
  plantillas de juego (`src/juegos/`: EscuchaToca, EscuchaAtrapa, Memoria, DiBrilla), faroles,
  Mission Stars, vestidor, álbum y entrada con tarjeta (código, QR y clave de tres dibujos). Voces
  de ElevenLabs y video de inicio de 31 s.
- **Adultos**: entrada e invitación por correo según el rol (dueño, coordinador, docente).
- **Docente**:
  - grupos, niños con apodo, autorización de los padres y tarjetas imprimibles;
  - estrellas sin red;
  - Proyectar (telón sin datos de niños);
  - Planear, con los materiales de escuela, colores y números (guía, planeador, láminas, fichas en
    carta y media carta, canciones con letra);
  - **Biblioteca**, con la historia bilingüe, recursos por tema, 20 actividades y fundamentos;
  - guía rápida en PDF (`public/guias/guia-docentes.pdf`).
- **Contenido**:
  - 3 canciones Spanglish propias con letra sincronizada (`canciones/*.letra.json`);
  - lo importado de la cartilla anterior en `biblioteca/*.json` (`herramientas/importar/`).

## Lo que falta (detalle y orden en el calendario)

**Plataforma (23 nov – 5 dic)**
1. Volverla **multicartilla**. Hoy `ingles-3` está fijo en `src/App.tsx`,
   `src/adultos/docente.ts` y `src/materiales/datos.ts`. Hace falta un catálogo por materia y grado,
   el grupo con su cartilla y que el dueño publique cartillas. Este punto bloquea todo lo demás.
2. Faltan plantillas de juego para matemáticas y lectura:
   - contar y tocar;
   - ordenar;
   - completar la operación;
   - armar la palabra o la sílaba.

   DiBrilla debe servir también para leer en voz alta en español.
3. Esqueleto, tandas 5 y 6 (`docs/diseno/esqueleto.md` §8): plan por grupo, avance, prueba del tema
   y registro. Coordinador: uso y avance por grado y grupo. Dueño: colegios y cartillas.
4. **Pantalla de canciones** en el modo estudiante (los audios y las letras ya existen).
5. Materiales de inglés 3: cuerpo, familia y hora; rehacer las manos de números.
6. Deudas técnicas:
   - `solo:"docente"` para clave, guion, casillas y momento en `materiales_a_json.py`;
   - textos fijos de `Proyectar.tsx` y `RANURAS` de `datos.ts` al JSON (regla 1);
   - la tecla Espacio dispara dos veces en Proyectar;
   - `registrar_mision` idempotente (migración 004);
   - correos de Supabase en español (paso 9 de Manuel);
   - `scripts/pruebas/docente.mjs` falla a veces por una carrera de carga.
7. Revisor y auditor antes de cerrar la plataforma: seguridad por filas, datos de menores, peso por
   debajo de 2 MB, y comprobar si `src/escuchar.ts` envía audio.

**Cartillas (7 – 30 dic).** Cada cartilla es un paquete de datos en `public/cartillas/<materia>-<grado>/`:
- malla basada en los DBA del MEN;
- universo y guías;
- 4 territorios con sus misiones;
- materiales del docente.

En diciembre cada cartilla queda con la **versión 1**: la malla completa, el primer territorio
jugable y los materiales del primer periodo. El resto de territorios se completa en enero y febrero.

**Después (sin fecha):**
- cinemática C del puente (`docs/cinematicas/guiones.md`);
- mapa ronda 2 (`docs/diseno/ronda-2-mapa.md`);
- voces de vecinos y héroes;
- probar en un Android real con micrófono y modo avión;
- medición antes y después del piloto.
