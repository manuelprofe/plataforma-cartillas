-- 011: misiones de El cuaderno de Renglón · Transición, territorio 1 (25 nov 2026).
-- Igual que la 010: deja las misiones en la base para cuando la cartilla se publique. No la publica.
-- Se puede volver a correr sin daño.
-- misiones:inicio (generado por herramientas/misiones_sql.py desde el paquete; no editar a mano)
insert into public.cartillas (id, titulo, materia, grado) values ('espanol-0', 'El cuaderno de Renglón · Transición', 'Español', '0')
  on conflict (id) do update set titulo = excluded.titulo, materia = excluded.materia, grado = excluded.grado;
insert into public.misiones (cartilla_id, mision_id) values
  ('espanol-0', 'renglon-saludos'),
  ('espanol-0', 'renglon-saludos-2'),
  ('espanol-0', 'renglon-saludos-3'),
  ('espanol-0', 'renglon-animales'),
  ('espanol-0', 'renglon-animales-2'),
  ('espanol-0', 'renglon-animales-3'),
  ('espanol-0', 'renglon-cosas'),
  ('espanol-0', 'renglon-cosas-2'),
  ('espanol-0', 'renglon-cosas-3'),
  ('espanol-0', 'renglon-rondas'),
  ('espanol-0', 'renglon-rondas-2'),
  ('espanol-0', 'renglon-rondas-3'),
  ('espanol-0', 'renglon-nombres'),
  ('espanol-0', 'renglon-nombres-2'),
  ('espanol-0', 'renglon-nombres-3'),
  ('espanol-0', 'renglon-naturaleza'),
  ('espanol-0', 'renglon-naturaleza-2'),
  ('espanol-0', 'renglon-pozo')
  on conflict do nothing;
-- 18 misiones de espanol-0
-- misiones:fin
