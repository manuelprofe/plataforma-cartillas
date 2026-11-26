-- 012: misiones de El cuaderno de Postal · Transición, territorio 1 (26 nov 2026).
-- Igual que la 010 y la 011: deja las misiones en la base para cuando la cartilla se publique. No la publica.
-- Se puede volver a correr sin daño.
-- misiones:inicio (generado por herramientas/misiones_sql.py desde el paquete; no editar a mano)
insert into public.cartillas (id, titulo, materia, grado) values ('ingles-0', 'El cuaderno de Postal · Transición', 'Inglés', '0')
  on conflict (id) do update set titulo = excluded.titulo, materia = excluded.materia, grado = excluded.grado;
insert into public.misiones (cartilla_id, mision_id) values
  ('ingles-0', 'postal-hello'),
  ('ingles-0', 'postal-hello-2'),
  ('ingles-0', 'postal-hello-3'),
  ('ingles-0', 'postal-colors'),
  ('ingles-0', 'postal-colors-2'),
  ('ingles-0', 'postal-colors-3'),
  ('ingles-0', 'postal-numbers'),
  ('ingles-0', 'postal-numbers-2'),
  ('ingles-0', 'postal-numbers-3'),
  ('ingles-0', 'postal-face'),
  ('ingles-0', 'postal-face-2'),
  ('ingles-0', 'postal-face-3'),
  ('ingles-0', 'postal-toys'),
  ('ingles-0', 'postal-toys-2'),
  ('ingles-0', 'postal-toys-3'),
  ('ingles-0', 'postal-shapes'),
  ('ingles-0', 'postal-shapes-2'),
  ('ingles-0', 'postal-pozo')
  on conflict do nothing;
-- 18 misiones de ingles-0
-- misiones:fin
