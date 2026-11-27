-- 015: el docente entrega su planeación al coordinador (27 nov 2026). Hasta hoy las planeaciones
-- se pedían por correo o impresas; ahora el docente toca "Entregar" y el coordinador de su colegio
-- la ve en el formato del colegio, la marca como revisada o pide ajustes con un comentario, y la
-- baja en Word. Se guarda una copia de la planeación tal como se entregó. No guarda datos de niños.
-- Solo se escribe por funciones; la tabla se lee con la seguridad por filas.
-- Idempotente: se puede correr dos veces.

create table if not exists public.entregas_planeacion (
  docente_id uuid not null references public.perfiles (id) on delete cascade,
  planeacion_id text not null check (planeacion_id ~ '^[a-z0-9-]{1,60}$'),
  colegio_id uuid not null references public.colegios (id) on delete cascade,
  docente_nombre text not null,
  titulo text not null check (char_length(titulo) between 1 and 160),
  datos jsonb not null check (jsonb_typeof(datos) = 'object' and pg_column_size(datos) <= 20000),
  entregada timestamptz not null default now(),
  estado text not null default 'por-revisar' check (estado in ('por-revisar', 'revisada', 'ajustar')),
  comentario text check (comentario is null or char_length(comentario) <= 1000),
  revisada timestamptz,
  revisada_por uuid references public.perfiles (id) on delete set null,
  primary key (docente_id, planeacion_id)
);
create index if not exists entregas_planeacion_colegio on public.entregas_planeacion (colegio_id, estado);

alter table public.entregas_planeacion enable row level security;

-- La ve el docente que la entregó y el coordinador de su colegio.
drop policy if exists entregas_ver on public.entregas_planeacion;
create policy entregas_ver on public.entregas_planeacion for select to authenticated
  using (docente_id = auth.uid() or (mi_rol() = 'coordinador' and colegio_id = mi_colegio()));

revoke all on public.entregas_planeacion from anon;
revoke insert, update, delete on public.entregas_planeacion from authenticated;
grant select on public.entregas_planeacion to authenticated;

-- El docente entrega (o vuelve a entregar, ya ajustada) una de sus planeaciones.
create or replace function public.entregar_planeacion(p_id text, p_titulo text, p_datos jsonb)
returns void
language plpgsql security definer set search_path = public as
$$
declare
  yo perfiles%rowtype;
begin
  select * into yo from perfiles where id = auth.uid() and activo;
  if yo.id is null or yo.rol <> 'docente' or yo.colegio_id is null then
    raise exception 'Solo un docente con colegio entrega planeaciones';
  end if;
  insert into entregas_planeacion (docente_id, planeacion_id, colegio_id, docente_nombre, titulo, datos)
  values (yo.id, p_id, yo.colegio_id, yo.nombre, p_titulo, p_datos)
  on conflict (docente_id, planeacion_id) do update
    set titulo = excluded.titulo, datos = excluded.datos, docente_nombre = excluded.docente_nombre,
        colegio_id = excluded.colegio_id, entregada = now(), estado = 'por-revisar',
        comentario = null, revisada = null, revisada_por = null;
end;
$$;

-- El docente retira una entrega (por ejemplo, si borró la planeación).
create or replace function public.retirar_entrega(p_id text)
returns void
language sql security definer set search_path = public as
$$ delete from entregas_planeacion where docente_id = auth.uid() and planeacion_id = p_id $$;

-- El coordinador la marca como revisada o pide ajustes, con un comentario opcional.
create or replace function public.revisar_planeacion(p_docente uuid, p_id text, p_estado text, p_comentario text)
returns void
language plpgsql security definer set search_path = public as
$$
begin
  if mi_rol() is distinct from 'coordinador' then
    raise exception 'Solo el coordinador revisa planeaciones';
  end if;
  if p_estado not in ('revisada', 'ajustar') then
    raise exception 'Estado no válido';
  end if;
  update entregas_planeacion
     set estado = p_estado, comentario = nullif(trim(p_comentario), ''), revisada = now(), revisada_por = auth.uid()
   where docente_id = p_docente and planeacion_id = p_id and colegio_id = mi_colegio();
  if not found then
    raise exception 'Esa planeación no es de su colegio';
  end if;
end;
$$;

revoke execute on function public.entregar_planeacion(text, text, jsonb), public.retirar_entrega(text), public.revisar_planeacion(uuid, text, text, text) from public, anon;
grant execute on function public.entregar_planeacion(text, text, jsonb), public.retirar_entrega(text), public.revisar_planeacion(uuid, text, text, text) to authenticated;

-- Comprobación: debe dar 0 filas y ningún error.
select count(*) as entregas from public.entregas_planeacion;
