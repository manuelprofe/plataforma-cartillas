-- Migración 003: ajustes tras la revisión de la tanda 7. Idempotente (se puede pegar dos veces).
-- Cómo aplicarla: panel de Supabase → SQL Editor → pegar este archivo completo → Run.
--   1. crear_grupo ya no devuelve el código a quien no es el docente del grupo: el coordinador
--      lo recibía por la API y podía usarlo desde una sesión anónima para ver apodos.
--   2. lista_invitaciones(): las invitaciones que ve cada rol, con `del_dueno` para que la app
--      oculte Reenviar y Cancelar al coordinador cuando la invitó el dueño (la base las rechaza).
begin;

create or replace function public.crear_grupo(p_nombre text, p_grado text, p_docente uuid default null)
returns public.grupos
language plpgsql security definer set search_path = public as
$$
declare
  doc uuid := coalesce(p_docente, auth.uid());
  nuevo grupos;
begin
  if mi_rol() = 'docente' and doc = auth.uid() then
    null;
  elsif mi_rol() = 'coordinador' and docente_asignable(doc, mi_colegio()) then
    null;
  else
    raise exception 'Solo un docente, o el coordinador para un docente de su colegio, crea grupos';
  end if;
  insert into grupos (colegio_id, docente_id, nombre, grado, codigo)
    values (mi_colegio(), doc, trim(p_nombre), trim(p_grado), nuevo_codigo())
    returning * into nuevo;
  -- Solo el docente del grupo recibe el código.
  if not soy_docente_de(nuevo.id) then
    nuevo.codigo := null;
  end if;
  return nuevo;
end
$$;

create or replace function public.lista_invitaciones()
returns table (id uuid, correo text, nombre text, rol text, colegio_id uuid, creado timestamptz, aceptada timestamptz, del_dueno boolean)
language sql stable security definer set search_path = public as
$$
  select i.id, i.correo, i.nombre, i.rol, i.colegio_id, i.creado, i.aceptada, coalesce(es_dueno(i.invitada_por), false)
  from invitaciones i
  where mi_rol() = 'dueno'
     or (mi_rol() = 'coordinador' and i.colegio_id = mi_colegio() and i.rol = 'docente')
  order by i.creado desc
$$;

revoke execute on function public.crear_grupo(text, text, uuid), public.lista_invitaciones() from public, anon;
grant execute on function public.crear_grupo(text, text, uuid), public.lista_invitaciones() to authenticated;

commit;
