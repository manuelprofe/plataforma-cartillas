-- 009: catálogo completo de cartillas (25 nov 2026). Da de alta las 17 que faltan: matemáticas
-- (Cuadrito), español (Renglón) e inglés (Postal), de transición (grado '0') a 5.°. Entran sin
-- publicar: el dueño las publica cuando su territorio 1 sea jugable. Hasta entonces el docente ya
-- consulta su pensum y arma planeaciones con él (eso no pasa por la base).
-- Se puede volver a correr sin daño: no toca inglés 3 ni cambia una cartilla ya publicada.
insert into public.cartillas (id, titulo, materia, grado, publicada) values
  ('matematicas-0', 'El cuaderno de Cuadrito · Transición', 'Matemáticas', '0', false),
  ('matematicas-1', 'El cuaderno de Cuadrito · 1.°', 'Matemáticas', '1', false),
  ('matematicas-2', 'El cuaderno de Cuadrito · 2.°', 'Matemáticas', '2', false),
  ('matematicas-3', 'El cuaderno de Cuadrito · 3.°', 'Matemáticas', '3', false),
  ('matematicas-4', 'El cuaderno de Cuadrito · 4.°', 'Matemáticas', '4', false),
  ('matematicas-5', 'El cuaderno de Cuadrito · 5.°', 'Matemáticas', '5', false),
  ('espanol-0', 'El cuaderno de Renglón · Transición', 'Español', '0', false),
  ('espanol-1', 'El cuaderno de Renglón · 1.°', 'Español', '1', false),
  ('espanol-2', 'El cuaderno de Renglón · 2.°', 'Español', '2', false),
  ('espanol-3', 'El cuaderno de Renglón · 3.°', 'Español', '3', false),
  ('espanol-4', 'El cuaderno de Renglón · 4.°', 'Español', '4', false),
  ('espanol-5', 'El cuaderno de Renglón · 5.°', 'Español', '5', false),
  ('ingles-0', 'El cuaderno de Postal · Transición', 'Inglés', '0', false),
  ('ingles-1', 'El cuaderno de Postal · 1.°', 'Inglés', '1', false),
  ('ingles-2', 'El cuaderno de Postal · 2.°', 'Inglés', '2', false),
  ('ingles-4', 'El cuaderno de Postal · 4.°', 'Inglés', '4', false),
  ('ingles-5', 'El cuaderno de Postal · 5.°', 'Inglés', '5', false)
on conflict (id) do update set titulo = excluded.titulo, materia = excluded.materia, grado = excluded.grado;
