# Cómo continuar

Solo lo pendiente (18 nov 2026). Reglas permanentes en `CLAUDE.md`; lo ya hecho está en git y en
los documentos de `docs/`. Al empezar: leer esto, `CLAUDE.md`, y seguir "Siguiente" en orden.

## Datos de trabajo

- Rama `ccr-c31d414e-rt7zgq` (`main` atrasada). Sitio de prueba:
  https://englishlandmanuelprofe.netlify.app (Netlify `94f443a2-de53-4029-ab21-f6673073280c`).
  Publicar: herramienta Netlify `deploy-site` y correr el `npx` que devuelve. **Solo con permiso de Manuel.**
  Última publicación: 18 nov (dueño y coordinador con invitaciones por correo; 2ccb2e5).
- Supabase `https://jpwwmzfhbdnzsvwuciqa.supabase.co` (EE. UU.), clave pública en `.env.example` y
  `netlify.toml`. Migración 002 aplicada y gancho activo; **la 003 (`supabase/migraciones/003-ajustes.sql`) debe pegarla Manuel** (sin ella fallan las listas de invitaciones). Pasos de Manuel en `supabase/PASOS-MANUEL.md`
  (faltan 9 y 10: SMTP propio y correos en español, antes del piloto). Cuenta de profesor de prueba:
  la que dio Manuel en el chat (no guardarla en el repo).
- ElevenLabs: clave como secreto del entorno (`ELEVENLABS_API_KEY=proxy-injected` en scripts) y
  conector MCP. Voces y modelo en `herramientas/generar_voz.py`. Plan 40.000 créditos/mes; el
  17 nov se gastaron ~30.000 (se renueva el ciclo mensual).
- Git: sin `push --force`; commits nuevos y push normal. Agentes en Sonnet/Haiku; Opus orquesta y aprueba.

## Siguiente (en orden)

1. **Informe de los probadores:** atenderlo primero cuando llegue.
2. **Primera invitación real** con la cuenta de profesor de prueba (dueño → colegio → habilitar
   cartilla → invitar docente → aceptar desde el correo). Hecho y revisado: dueño y coordinador.
3. **Esqueleto, tandas 4 a 6** (`docs/diseno/esqueleto.md` §8; desarrollador → revisor → prueba a
   390 px): 4 docente base (grupos, niños con apodo, autorización, PIN, tarjetas imprimibles,
   estrellas sin red) — con esto los niños entran con tarjeta; 5 proyectar, cortina y plantilla de
   material; 6 planear, materiales, avance, prueba, registro (estados "Aquí irá").
4. **Contenidos por interfaz**, empezando por el docente (`docs/pedagogia/catalogo-interfaces.md`).
5. **Pantalla de canciones** con letra sincronizada (tiempos con Scribe), audios ya en
   `public/cartillas/ingles-3/canciones/`. Revisar términos de uso de ElevenLabs Music antes de difundirlas.
6. **Cinemática C del puente** (fiesta y llegada de Nova; guion en `docs/cinematicas/guiones.md`):
   mismo método que el video de inicio (imágenes clave con personajes reales + Veo 3.1 Lite con
   imagen inicial y final; ~6.000-8.000 créditos).
7. **Mapa ronda 2** (estaciones y estatua): `docs/diseno/ronda-2-mapa.md` §7 (textos, pedagogo) y
   §8 (5 tandas). Espera al esqueleto.
8. Auditor antes del piloto: seguridad por filas, datos de menores, si `src/escuchar.ts` envía audio.

## Pendientes menores

- Voces de vecinos y héroes (siguen con Kokoro): proponer muestras a Manuel.
- `registrar_mision` sin identificador de envío (al reintentar sube `veces`); requiere migración 003.
- El PIN sin red es barrera contra niños, no contra adultos (documentado, aceptado).
- Las caritas del cierre no tienen voz. Preguntas abiertas: mochila cohete en la misión 15, 3 s
  para entrar al resumen, el pozo da 15 estrellas.
- Probado solo en simulador: micrófono real, modo avión, instalación en Android real.
- Unir la rama con `main` (con permiso). `npx skills find` y AnyDoc: cuando toque esa parte.
- Confirmar la redacción del estándar MEN citado en `docs/pedagogia/canciones-bosque.md`.
- Territorios 2 a 4. Medición antes/después del piloto.
