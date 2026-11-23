-- Migración 005: cambiar la cartilla de un grupo. Idempotente (se puede pegar dos veces).
-- Cómo aplicarla: panel de Supabase → SQL Editor → pegar este archivo completo → Run.
-- Va después de la 004.
--
-- Qué hace:
--   1. Deja cambiar grupos.cartilla_id a quien ya puede editar el grupo (su docente o el
--      coordinador del colegio; la política grupos_editar no cambia).
--   2. Solo se puede pasar un grupo a una cartilla habilitada para su colegio: así los niños
--      siempre pueden registrar sus misiones (registrar_mision exige lo mismo).
begin;

grant update (cartilla_id) on public.grupos to authenticated;

create or replace function public.validar_cartilla_grupo() returns trigger
language plpgsql security definer set search_path = public as
$$
begin
  if new.cartilla_id is distinct from old.cartilla_id and not exists (
    select 1 from colegio_cartillas where colegio_id = new.colegio_id and cartilla_id = new.cartilla_id
  ) then
    raise exception 'Esa cartilla no está habilitada para el colegio de este grupo';
  end if;
  return new;
end
$$;
revoke execute on function public.validar_cartilla_grupo() from public, anon, authenticated;

drop trigger if exists grupos_cartilla_habilitada on public.grupos;
create trigger grupos_cartilla_habilitada before update of cartilla_id on public.grupos
  for each row execute function public.validar_cartilla_grupo();

commit;
