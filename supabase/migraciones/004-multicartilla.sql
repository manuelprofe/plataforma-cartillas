-- Migración 004: varias cartillas. Idempotente (se puede pegar dos veces).
-- Cómo aplicarla: panel de Supabase → SQL Editor → pegar este archivo completo → Run.
-- Va después de la 003. Aplicarla ANTES de publicar el sitio que la usa (la app nueva manda el
-- identificador de envío a registrar_mision y lee la cartilla del grupo en lista_grupo).
--
-- Qué hace:
--   1. Catálogo: cartillas.publicada (materia y grado ya existían). Inglés 3 queda publicada.
--   2. Cada grupo tiene su cartilla: grupos.cartilla_id. Los grupos que ya existen quedan con
--      inglés 3, y es el valor por defecto de los nuevos.
--   3. lista_grupo devuelve también la cartilla del grupo: el código lleva al niño a su cartilla.
--   4. registrar_mision recibe el identificador del envío (p_envio). Si el mismo envío llega dos
--      veces (se cortó la red antes de la respuesta), la segunda vez no suma nada: devuelve las
--      estrellas de la primera. Así "veces" y los días de práctica tampoco se cuentan doble.
--
-- Si alguna vez se vuelve a pegar la 002, pegar después otra vez la 004: la 002 recrea las
-- versiones viejas de lista_grupo y registrar_mision.
--
-- Datos mínimos (Ley 1581 de 2012): el identificador de envío es aleatorio y no dice nada del
-- niño; se borra con el niño.
begin;

-- 1. Catálogo de cartillas
alter table public.cartillas add column if not exists publicada boolean not null default false;
insert into public.cartillas (id, titulo, materia, grado, publicada)
  values ('ingles-3', 'English Adventure Quest', 'Inglés', '3', true)
  on conflict (id) do update set publicada = true;

-- 2. La cartilla de cada grupo
alter table public.grupos add column if not exists cartilla_id text references public.cartillas (id);
update public.grupos set cartilla_id = 'ingles-3' where cartilla_id is null;
alter table public.grupos alter column cartilla_id set default 'ingles-3';
alter table public.grupos alter column cartilla_id set not null;
create index if not exists grupos_cartilla on public.grupos (cartilla_id);
-- grupos.codigo sigue oculto; la cartilla la pueden leer los adultos que ya ven el grupo.
grant select (cartilla_id) on public.grupos to authenticated;

-- 3. El código del grupo dice también su cartilla
drop function if exists public.lista_grupo(text);
create function public.lista_grupo(p_codigo text)
returns table (id uuid, apodo text, avatar text, grupo text, cartilla text)
language plpgsql volatile security definer set search_path = public as
$$
#variable_conflict use_column
declare
  cod text := upper(trim(p_codigo));
  g grupos;
begin
  if auth.uid() is null then
    raise exception 'Falta iniciar la sesión del dispositivo';
  end if;
  -- Es la entrada del niño: una sesión de adulto no lista apodos por código.
  if es_adulto() then
    raise exception 'Esta entrada es para los niños';
  end if;
  if aparato_en_espera('codigo', 10) then
    raise exception 'Demasiados códigos errados en este aparato' using errcode = 'PC429';
  end if;
  select * into g from grupos where codigo = cod;
  if not found then
    perform contar_fallo('codigo');
    return;
  end if;
  return query
    select e.id, e.apodo, e.avatar, g.nombre, g.cartilla_id
    from estudiantes e
    where e.grupo_id = g.id and e.autorizacion is not null
    order by e.apodo;
end
$$;

-- 4. registrar_mision sin sumar dos veces el mismo envío
create table if not exists public.envios_mision (
  envio_id text primary key check (length(envio_id) between 8 and 64),
  estudiante_id uuid not null references public.estudiantes (id) on delete cascade,
  ganadas int not null default 0,
  creado date not null default public.hoy_co()
);
create index if not exists envios_mision_estudiante on public.envios_mision (estudiante_id);
alter table public.envios_mision enable row level security;
-- Sin políticas: solo registrar_mision (security definer) la toca.
revoke all on public.envios_mision from anon, authenticated;

drop function if exists public.registrar_mision(uuid, text, text, int, int);
create or replace function public.registrar_mision(
  p_estudiante uuid, p_cartilla text, p_mision text, p_errores int,
  p_autoeval int default null, p_envio text default null
)
returns int
language plpgsql security definer set search_path = public as
$$
declare
  previo progreso_misiones;
  premio int := 0;
  repetido envios_mision;
begin
  if not es_mio(p_estudiante) then
    raise exception 'Ese estudiante no entró en este aparato';
  end if;
  if p_errores < 0 or (p_autoeval is not null and p_autoeval not between 1 and 3) then
    raise exception 'Datos de misión no válidos';
  end if;
  -- Solo misiones que existen, de una cartilla habilitada para el colegio del niño.
  if not exists (select 1 from misiones where cartilla_id = p_cartilla and mision_id = p_mision)
     or not exists (
       select 1 from estudiantes e join grupos g on g.id = e.grupo_id
       join colegio_cartillas cc on cc.colegio_id = g.colegio_id
       where e.id = p_estudiante and cc.cartilla_id = p_cartilla
     ) then
    raise exception 'Esa misión no es de una cartilla habilitada para este colegio';
  end if;

  -- Un reintento del mismo envío responde lo de la primera vez y no toca nada más. Si dos
  -- reintentos llegan a la vez, el segundo espera aquí a que el primero termine.
  if p_envio is not null then
    insert into envios_mision (envio_id, estudiante_id) values (p_envio, p_estudiante)
      on conflict (envio_id) do nothing;
    if not found then
      select * into repetido from envios_mision where envio_id = p_envio;
      if repetido.estudiante_id <> p_estudiante then
        raise exception 'Ese envío es de otro estudiante';
      end if;
      return repetido.ganadas;
    end if;
  end if;

  insert into dias_practica (estudiante_id) values (p_estudiante) on conflict do nothing;

  select * into previo from progreso_misiones
    where estudiante_id = p_estudiante and cartilla_id = p_cartilla and mision_id = p_mision
    for update;

  if not found then
    insert into progreso_misiones (estudiante_id, cartilla_id, mision_id, mejor_errores, autoeval)
      values (p_estudiante, p_cartilla, p_mision, p_errores, p_autoeval);
    insert into estrellas (estudiante_id, cartilla_id, motivo, cantidad, mision_id)
      values (p_estudiante, p_cartilla, 'completar', valor_estrellas('completar'), p_mision);
    premio := valor_estrellas('completar');
  else
    if p_errores < previo.mejor_errores and not exists (
      select 1 from estrellas
      where estudiante_id = p_estudiante and cartilla_id = p_cartilla and mision_id = p_mision and motivo = 'mejorar'
    ) then
      insert into estrellas (estudiante_id, cartilla_id, motivo, cantidad, mision_id)
        values (p_estudiante, p_cartilla, 'mejorar', valor_estrellas('mejorar'), p_mision);
      premio := valor_estrellas('mejorar');
    end if;
    update progreso_misiones
      set veces = veces + 1,
          mejor_errores = least(mejor_errores, p_errores),
          autoeval = coalesce(autoeval, p_autoeval),
          actualizado = hoy_co()
      where estudiante_id = p_estudiante and cartilla_id = p_cartilla and mision_id = p_mision;
  end if;

  if p_autoeval is not null and previo.autoeval is null then
    insert into estrellas (estudiante_id, cartilla_id, motivo, cantidad, mision_id)
      values (p_estudiante, p_cartilla, 'autoevaluar', valor_estrellas('autoevaluar'), p_mision);
    premio := premio + valor_estrellas('autoevaluar');
  end if;

  if p_envio is not null then
    update envios_mision set ganadas = premio where envio_id = p_envio;
  end if;
  return premio;
end
$$;

revoke execute on function public.lista_grupo(text),
  public.registrar_mision(uuid, text, text, int, int, text) from public, anon;
grant execute on function public.lista_grupo(text),
  public.registrar_mision(uuid, text, text, int, int, text) to authenticated;

commit;
