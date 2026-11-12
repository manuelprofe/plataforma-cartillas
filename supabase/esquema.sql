-- Esquema de la plataforma de cartillas.
-- Se pega completo en el editor SQL de Supabase y se ejecuta una vez.
--
-- Jerarquía: colegio -> docentes -> grupos -> estudiantes.
-- Adultos (dueño, coordinador, docente) entran con correo y contraseña.
-- Estudiantes entran con el código del grupo, su apodo y un PIN de imágenes,
-- sobre una sesión anónima: no se guarda correo ni dato personal del niño.
-- Las estrellas son un registro que solo crece: nunca se quitan.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------- Tablas

create table public.colegios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  municipio text,
  creado timestamptz not null default now()
);

create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  colegio_id uuid references public.colegios (id) on delete restrict,
  rol text not null check (rol in ('dueno', 'coordinador', 'docente')),
  nombre text not null,
  creado timestamptz not null default now()
);

create table public.grupos (
  id uuid primary key default gen_random_uuid(),
  colegio_id uuid not null references public.colegios (id) on delete restrict,
  docente_id uuid not null references public.perfiles (id) on delete restrict,
  nombre text not null,
  grado text not null,
  codigo text not null unique,
  creado timestamptz not null default now()
);
create index on public.grupos (docente_id);
create index on public.grupos (colegio_id);

create table public.estudiantes (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos (id) on delete cascade,
  apodo text not null check (char_length(apodo) between 1 and 30),
  avatar text not null default 'lumi',
  creado timestamptz not null default now(),
  unique (grupo_id, apodo)
);

-- El PIN vive aparte y sin políticas de lectura: nadie lo consulta desde el
-- navegador, solo las funciones de abajo.
create table public.estudiantes_pin (
  estudiante_id uuid primary key references public.estudiantes (id) on delete cascade,
  pin_hash text not null,
  intentos_fallidos int not null default 0,
  bloqueado_hasta timestamptz
);

-- Une una sesión anónima del navegador con un estudiante.
create table public.sesiones_estudiante (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  estudiante_id uuid not null references public.estudiantes (id) on delete cascade,
  creado timestamptz not null default now()
);
create index on public.sesiones_estudiante (estudiante_id);

create table public.progreso_misiones (
  estudiante_id uuid not null references public.estudiantes (id) on delete cascade,
  cartilla_id text not null,
  mision_id text not null,
  veces int not null default 1,
  mejor_errores int not null,
  autoeval int check (autoeval between 1 and 3),
  actualizado timestamptz not null default now(),
  primary key (estudiante_id, cartilla_id, mision_id)
);

create table public.estrellas (
  id bigint generated always as identity primary key,
  estudiante_id uuid not null references public.estudiantes (id) on delete cascade,
  cartilla_id text not null,
  motivo text not null check (motivo in ('participar', 'completar', 'pronunciar', 'colaborar', 'mejorar', 'autoevaluar')),
  cantidad int not null check (cantidad > 0),
  mision_id text,
  otorgada_por uuid references public.perfiles (id) on delete set null,
  creado timestamptz not null default now()
);
create index on public.estrellas (estudiante_id, cartilla_id);

-- ---------------------------------------------------- Funciones de apoyo

create function public.mi_rol() returns text
language sql stable security definer set search_path = public as
$$ select rol from perfiles where id = auth.uid() $$;

create function public.mi_colegio() returns uuid
language sql stable security definer set search_path = public as
$$ select colegio_id from perfiles where id = auth.uid() $$;

create function public.mi_estudiante() returns uuid
language sql stable security definer set search_path = public as
$$ select estudiante_id from sesiones_estudiante where usuario_id = auth.uid() $$;

-- ¿Puede el adulto que consulta ver este grupo?
create function public.puedo_ver_grupo(g uuid) returns boolean
language sql stable security definer set search_path = public as
$$
  select exists (
    select 1 from grupos
    where id = g
      and (
        docente_id = auth.uid()
        or (mi_rol() = 'coordinador' and colegio_id = mi_colegio())
        or mi_rol() = 'dueno'
      )
  )
$$;

create function public.puedo_ver_estudiante(e uuid) returns boolean
language sql stable security definer set search_path = public as
$$
  select e = mi_estudiante()
      or exists (select 1 from estudiantes where id = e and puedo_ver_grupo(grupo_id))
$$;

-- Criterios de Mission Stars (tabla 7 del trabajo de grado).
create function public.valor_estrellas(motivo text) returns int
language sql immutable as
$$
  select case motivo
    when 'participar' then 10
    when 'completar' then 15
    when 'pronunciar' then 10
    when 'colaborar' then 15
    when 'mejorar' then 15
    when 'autoevaluar' then 10
  end
$$;

-- ------------------------------------------------- Seguridad por filas

alter table public.colegios enable row level security;
alter table public.perfiles enable row level security;
alter table public.grupos enable row level security;
alter table public.estudiantes enable row level security;
alter table public.estudiantes_pin enable row level security;
alter table public.sesiones_estudiante enable row level security;
alter table public.progreso_misiones enable row level security;
alter table public.estrellas enable row level security;

create policy colegios_ver on public.colegios for select to authenticated
  using (id = mi_colegio() or mi_rol() = 'dueno');
create policy colegios_dueno on public.colegios for all to authenticated
  using (mi_rol() = 'dueno') with check (mi_rol() = 'dueno');

create policy perfiles_ver on public.perfiles for select to authenticated
  using (
    id = auth.uid()
    or mi_rol() = 'dueno'
    or (mi_rol() = 'coordinador' and colegio_id = mi_colegio())
  );
create policy perfiles_dueno on public.perfiles for all to authenticated
  using (mi_rol() = 'dueno') with check (mi_rol() = 'dueno');
create policy perfiles_coordinador on public.perfiles for update to authenticated
  using (mi_rol() = 'coordinador' and colegio_id = mi_colegio() and rol = 'docente')
  with check (colegio_id = mi_colegio() and rol = 'docente');

create policy grupos_ver on public.grupos for select to authenticated
  using (puedo_ver_grupo(id));
create policy grupos_crear on public.grupos for insert to authenticated
  with check (
    colegio_id = mi_colegio()
    and (docente_id = auth.uid() or mi_rol() = 'coordinador')
  );
create policy grupos_editar on public.grupos for update to authenticated
  using (puedo_ver_grupo(id))
  with check (colegio_id = mi_colegio() or mi_rol() = 'dueno');
create policy grupos_borrar on public.grupos for delete to authenticated
  using (puedo_ver_grupo(id));

create policy estudiantes_ver on public.estudiantes for select to authenticated
  using (puedo_ver_estudiante(id));
create policy estudiantes_editar on public.estudiantes for update to authenticated
  using (puedo_ver_grupo(grupo_id)) with check (puedo_ver_grupo(grupo_id));
create policy estudiantes_borrar on public.estudiantes for delete to authenticated
  using (puedo_ver_grupo(grupo_id));
-- Los estudiantes se crean con crear_estudiante(), que también guarda el PIN.

create policy progreso_ver on public.progreso_misiones for select to authenticated
  using (puedo_ver_estudiante(estudiante_id));
create policy estrellas_ver on public.estrellas for select to authenticated
  using (puedo_ver_estudiante(estudiante_id));
-- Progreso y estrellas solo se escriben con las funciones de abajo, para que
-- el navegador no pueda inventar estrellas.

-- ------------------------------------------------ Acciones del docente

create function public.crear_grupo(p_nombre text, p_grado text) returns public.grupos
language plpgsql security definer set search_path = public, extensions as
$$
declare
  nuevo grupos;
  letras constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  cod text;
begin
  if mi_rol() is null or mi_colegio() is null then
    raise exception 'Solo un docente con colegio asignado puede crear grupos';
  end if;
  loop
    select string_agg(substr(letras, 1 + floor(random() * length(letras))::int, 1), '')
      into cod from generate_series(1, 5);
    exit when not exists (select 1 from grupos where codigo = cod);
  end loop;
  insert into grupos (colegio_id, docente_id, nombre, grado, codigo)
    values (mi_colegio(), auth.uid(), p_nombre, p_grado, cod)
    returning * into nuevo;
  return nuevo;
end
$$;

create function public.crear_estudiante(p_grupo uuid, p_apodo text, p_pin text, p_avatar text default 'lumi')
returns uuid
language plpgsql security definer set search_path = public, extensions as
$$
declare
  nuevo uuid;
begin
  if not puedo_ver_grupo(p_grupo) then
    raise exception 'No tienes acceso a este grupo';
  end if;
  if p_pin !~ '^[0-9]{3}$' then
    raise exception 'El PIN son tres imágenes';
  end if;
  insert into estudiantes (grupo_id, apodo, avatar)
    values (p_grupo, trim(p_apodo), p_avatar) returning id into nuevo;
  insert into estudiantes_pin (estudiante_id, pin_hash)
    values (nuevo, crypt(p_pin, gen_salt('bf')));
  return nuevo;
end
$$;

create function public.cambiar_pin(p_estudiante uuid, p_pin text) returns void
language plpgsql security definer set search_path = public, extensions as
$$
begin
  if not exists (select 1 from estudiantes where id = p_estudiante and puedo_ver_grupo(grupo_id)) then
    raise exception 'No tienes acceso a este estudiante';
  end if;
  if p_pin !~ '^[0-9]{3}$' then
    raise exception 'El PIN son tres imágenes';
  end if;
  update estudiantes_pin
    set pin_hash = crypt(p_pin, gen_salt('bf')), intentos_fallidos = 0, bloqueado_hasta = null
    where estudiante_id = p_estudiante;
end
$$;

-- Estrellas que solo el docente puede ver y reconocer en clase.
create function public.dar_estrellas(p_estudiante uuid, p_cartilla text, p_motivo text) returns int
language plpgsql security definer set search_path = public as
$$
declare
  cant int := valor_estrellas(p_motivo);
begin
  if p_motivo not in ('participar', 'pronunciar', 'colaborar') then
    raise exception 'Ese reconocimiento no lo da el docente';
  end if;
  if not exists (select 1 from estudiantes where id = p_estudiante and puedo_ver_grupo(grupo_id)) then
    raise exception 'No tienes acceso a este estudiante';
  end if;
  insert into estrellas (estudiante_id, cartilla_id, motivo, cantidad, otorgada_por)
    values (p_estudiante, p_cartilla, p_motivo, cant, auth.uid());
  return cant;
end
$$;

-- --------------------------------------------- Acciones del estudiante

-- Lista de apodos de un grupo para la pantalla de entrada.
create function public.lista_grupo(p_codigo text)
returns table (id uuid, apodo text, avatar text, grupo text)
language sql stable security definer set search_path = public as
$$
  select e.id, e.apodo, e.avatar, g.nombre
  from grupos g join estudiantes e on e.grupo_id = g.id
  where g.codigo = upper(trim(p_codigo))
  order by e.apodo
$$;

-- Entrada del estudiante. Tras 5 PIN errados se bloquea 5 minutos.
create function public.entrar_estudiante(p_codigo text, p_estudiante uuid, p_pin text) returns boolean
language plpgsql security definer set search_path = public, extensions as
$$
declare
  reg estudiantes_pin;
begin
  if auth.uid() is null then
    raise exception 'Falta iniciar la sesión del dispositivo';
  end if;
  select p.* into reg
    from estudiantes_pin p
    join estudiantes e on e.id = p.estudiante_id
    join grupos g on g.id = e.grupo_id
    where e.id = p_estudiante and g.codigo = upper(trim(p_codigo))
    for update of p;
  if not found then
    return false;
  end if;
  if reg.bloqueado_hasta is not null and reg.bloqueado_hasta > now() then
    return false;
  end if;
  if reg.pin_hash <> crypt(p_pin, reg.pin_hash) then
    update estudiantes_pin
      set intentos_fallidos = case when intentos_fallidos + 1 >= 5 then 0 else intentos_fallidos + 1 end,
          bloqueado_hasta = case when intentos_fallidos + 1 >= 5 then now() + interval '5 minutes' else null end
      where estudiante_id = p_estudiante;
    return false;
  end if;
  update estudiantes_pin set intentos_fallidos = 0, bloqueado_hasta = null
    where estudiante_id = p_estudiante;
  insert into sesiones_estudiante (usuario_id, estudiante_id)
    values (auth.uid(), p_estudiante)
    on conflict (usuario_id) do update set estudiante_id = excluded.estudiante_id, creado = now();
  return true;
end
$$;

-- Registra una misión terminada y calcula las estrellas en el servidor.
create function public.registrar_mision(p_cartilla text, p_mision text, p_errores int, p_autoeval int default null)
returns int
language plpgsql security definer set search_path = public as
$$
declare
  est uuid := mi_estudiante();
  previo progreso_misiones;
  ganadas int := 0;
begin
  if est is null then
    raise exception 'No hay un estudiante en esta sesión';
  end if;
  if p_errores < 0 or (p_autoeval is not null and p_autoeval not between 1 and 3) then
    raise exception 'Datos de misión no válidos';
  end if;

  select * into previo from progreso_misiones
    where estudiante_id = est and cartilla_id = p_cartilla and mision_id = p_mision
    for update;

  if not found then
    insert into progreso_misiones (estudiante_id, cartilla_id, mision_id, mejor_errores, autoeval)
      values (est, p_cartilla, p_mision, p_errores, p_autoeval);
    insert into estrellas (estudiante_id, cartilla_id, motivo, cantidad, mision_id)
      values (est, p_cartilla, 'completar', valor_estrellas('completar'), p_mision);
    ganadas := valor_estrellas('completar');
  else
    if p_errores < previo.mejor_errores then
      insert into estrellas (estudiante_id, cartilla_id, motivo, cantidad, mision_id)
        values (est, p_cartilla, 'mejorar', valor_estrellas('mejorar'), p_mision);
      ganadas := valor_estrellas('mejorar');
    end if;
    update progreso_misiones
      set veces = veces + 1,
          mejor_errores = least(mejor_errores, p_errores),
          autoeval = coalesce(autoeval, p_autoeval),
          actualizado = now()
      where estudiante_id = est and cartilla_id = p_cartilla and mision_id = p_mision;
  end if;

  if p_autoeval is not null and (previo.autoeval is null) then
    insert into estrellas (estudiante_id, cartilla_id, motivo, cantidad, mision_id)
      values (est, p_cartilla, 'autoevaluar', valor_estrellas('autoevaluar'), p_mision);
    ganadas := ganadas + valor_estrellas('autoevaluar');
  end if;
  return ganadas;
end
$$;

-- Total de estrellas por estudiante y cartilla. Respeta la seguridad por filas.
create view public.total_estrellas with (security_invoker = true) as
  select estudiante_id, cartilla_id, sum(cantidad)::int as estrellas
  from public.estrellas
  group by estudiante_id, cartilla_id;

-- -------------------------------------------------------------- Permisos

revoke all on all tables in schema public from anon;
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
grant select on public.total_estrellas to authenticated;
