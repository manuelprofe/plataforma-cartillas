-- 010: misiones de El cuaderno de Cuadrito · Transición, territorio 1 (25 nov 2026).
-- registrar_mision solo acepta progreso de misiones que existen en la tabla `misiones`. La cartilla
-- sigue sin publicar (la 009 la dio de alta): esto solo deja lista la base para cuando se publique.
-- Se puede volver a correr sin daño.
-- misiones:inicio (generado por herramientas/misiones_sql.py desde el paquete; no editar a mano)
insert into public.cartillas (id, titulo, materia, grado) values ('matematicas-0', 'El cuaderno de Cuadrito · Transición', 'Matemáticas', '0')
  on conflict (id) do update set titulo = excluded.titulo, materia = excluded.materia, grado = excluded.grado;
insert into public.misiones (cartilla_id, mision_id) values
  ('matematicas-0', 'cuadrito-arriba'),
  ('matematicas-0', 'cuadrito-arriba-2'),
  ('matematicas-0', 'cuadrito-arriba-3'),
  ('matematicas-0', 'cuadrito-dentro'),
  ('matematicas-0', 'cuadrito-dentro-2'),
  ('matematicas-0', 'cuadrito-dentro-3'),
  ('matematicas-0', 'cuadrito-colores'),
  ('matematicas-0', 'cuadrito-colores-2'),
  ('matematicas-0', 'cuadrito-colores-3'),
  ('matematicas-0', 'cuadrito-tamano'),
  ('matematicas-0', 'cuadrito-tamano-2'),
  ('matematicas-0', 'cuadrito-tamano-3'),
  ('matematicas-0', 'cuadrito-cuantos'),
  ('matematicas-0', 'cuadrito-cuantos-2'),
  ('matematicas-0', 'cuadrito-cuantos-3'),
  ('matematicas-0', 'cuadrito-formas'),
  ('matematicas-0', 'cuadrito-formas-2'),
  ('matematicas-0', 'cuadrito-pozo')
  on conflict do nothing;
-- 18 misiones de matematicas-0
-- misiones:fin
