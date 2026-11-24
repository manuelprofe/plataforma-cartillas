-- 006: la cartilla de inglés 3 cambia de nombre por la identidad nueva (24 nov 2026).
-- "English Adventure Quest" venía del trabajo de grado; ahora todo el sitio es "El Cuaderno de Goma".
-- Solo cambia el título que ven docentes, coordinadores y el dueño. No toca progreso ni grupos.
update public.cartillas set titulo = 'El Cuaderno de Goma' where id = 'ingles-3';
