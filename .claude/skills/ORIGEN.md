# Origen de las skills

| Skill | Origen | Licencia | Revisión |
| --- | --- | --- | --- |
| `frontend-design` | github.com/anthropics/skills, commit 2c5958e | Apache 2.0 | Leída completa; solo instrucciones de diseño, sin scripts |
| `webapp-testing` | github.com/anthropics/skills, commit 2c5958e | Apache 2.0 | Leída completa; un script que levanta servidores locales y ejemplos de Playwright, sin llamadas a red externa |
| `diseno-infantil` | Escrita para este proyecto | Propia | — |
| `auditoria` | Escrita para este proyecto | Propia | — |
| `hoy` | Escrita para este proyecto (sesión diaria con contexto corto) | Propia | — |
| `find-skills` ("Find Skills") | github.com/vercel-labs/skills, `skills/find-skills`, commit b716f9d | MIT | Leída completa; solo instrucciones. Usa `npx skills find` (consulta el catálogo público skills.sh). **Modificada:** se añadió un bloque con las reglas del proyecto (leer antes de instalar, sin `-g`) |
| `convert-documents-to-markdown` ("AnyDoc") | github.com/firecrawl/anydoc, `skills/convert-documents-to-markdown`, commit e56a49b | MIT | Leída completa, junto con `node/cli.js` y `node/anydoc.js`. Ejecuta `npx @firecrawl/anydoc` (binario precompilado, conversión local). Solo usa la red con `--ocr hosted`, que sube el documento a Firecrawl. **Modificada:** se añadió la prohibición de `--ocr hosted` sin permiso |
| `claude-automation-recommender` ("Claude Code Setup") | github.com/anthropics/claude-plugins-official, `plugins/claude-code-setup`, commit b5b01ac | Apache 2.0 | Leída completa (SKILL.md y 5 referencias); solo lectura, sin scripts, no modifica archivos |
| `planning-and-task-breakdown`, `incremental-implementation`, `test-driven-development`, `code-review-and-quality` ("Agent Skills") | github.com/addyosmani/agent-skills, commit 39b723c (v0.6.16) | MIT | Leídas completas; solo instrucciones, sin scripts. Sus enlaces `../../references/` apuntan a `.claude/references/` (4 listas de chequeo del mismo repositorio, también leídas). De las 25 skills del repositorio solo se copiaron estas cuatro; no se instalaron sus hooks ni sus comandos |
| `unslop` | github.com/heydamir/unslop, `skills/unslop`, commit 620163e | CC BY 4.0 (mantener el crédito a Damir Sokolovsky) | Leída completa (17-11-2026): SKILL.md, 6 referencias, 3 scripts. `snapshot.mjs` guarda una copia local de una página con Playwright; `story.mjs` arma un video con un servidor en 127.0.0.1 y ffmpeg; ninguno envía datos a terceros. **Modificada:** bloque de reglas del proyecto (solo modos de adultos; en el del niño manda `diseno-infantil`; toques de 48 px; marca existente). Se quitó `agents/openai.yaml` (para Codex) |

## Revisadas y no instaladas

| Complemento | Origen | Motivo |
| --- | --- | --- |
| `claude-mem` ("Cloud Mem") | github.com/thedotmack/claude-mem, commit 0c488b5 (v15.18.3), Apache 2.0 | Guarda la memoria en `~/.claude-mem` de la máquina: en las sesiones en la nube ese disco se borra, así que solo persistiría con su sincronización a cmem.ai (un tercero). Además registra **todas** las llamadas a herramientas (lo que se lee, edita y ejecuta) y las pasa a un segundo agente que gasta uso adicional; trae analítica activada por defecto y un instalador que pide cuenta y medio de pago. Con datos de estudiantes en Supabase a la vista, no cumple "datos de menores, lo mínimo". La memoria entre sesiones de este proyecto es `CONTINUAR.md` |

Las skills externas ceden ante `CLAUDE.md` y `.claude/agents/lider.md` cuando se contradicen
(por ejemplo: trabajo por fases, un solo agente de código a la vez, informes cortos).

Antes de agregar una skill externa: leerla completa, incluidos sus scripts, y anotarla aquí.
