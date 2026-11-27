-- 014: lo que crea el docente queda en su cuenta (27 nov 2026). Sus planeaciones del armador y sus
-- juegos armados se guardaban solo en el aparato; con esta tabla los ve en el celular y en el
-- computador. Cada fila es de un docente y solo él la ve o la cambia (ni el coordinador, ni el
-- dueño, ni los niños, que entran con sesiones anónimas). No guarda datos de niños.
-- Idempotente: se puede correr dos veces.

create table if not exists public.creaciones_docente (
  docente_id uuid not null default auth.uid() references public.perfiles (id) on delete cascade,
  id text not null check (id ~ '^[a-z0-9-]{1,60}$'),
  tipo text not null check (tipo in ('planeacion', 'juego')),
  datos jsonb not null check (jsonb_typeof(datos) = 'object' and pg_column_size(datos) <= 20000),
  actualizado timestamptz not null default now(),
  primary key (docente_id, id)
);

alter table public.creaciones_docente enable row level security;

drop policy if exists creaciones_propias on public.creaciones_docente;
create policy creaciones_propias on public.creaciones_docente for all to authenticated
  using (docente_id = auth.uid() and es_adulto())
  with check (docente_id = auth.uid() and es_adulto());

revoke all on public.creaciones_docente from anon;
grant select, insert, update, delete on public.creaciones_docente to authenticated;

-- Comprobación: debe dar 0 filas y ningún error.
select count(*) as creaciones from public.creaciones_docente;
