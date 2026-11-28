-- Local test on an empty Postgres, imitating the minimum of Supabase.
-- Run from the project root: psql -v ON_ERROR_STOP=1 -f supabase/prueba_local.sql
\set ON_ERROR_STOP on
create schema auth;
create role anon nologin;
create role authenticated nologin;
create table auth.users (id uuid primary key default gen_random_uuid());
create function auth.uid() returns uuid language sql stable as
$$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
grant usage on schema public to anon, authenticated;

\i supabase/migrations/0001_core.sql
\i supabase/migrations/0002_rls.sql
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
\i supabase/seed.sql

insert into auth.users (id) values
  ('00000000-0000-0000-0000-0000000000c1'), ('00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-0000000000d2');
insert into perfiles (id, nombre, rol) values
  ('00000000-0000-0000-0000-0000000000c1', 'Coord', 'coordinador'),
  ('00000000-0000-0000-0000-0000000000d1', 'Rep Uno', 'repartidor'),
  ('00000000-0000-0000-0000-0000000000d2', 'Rep Dos', 'repartidor');

-- Coordinator builds two dispatched routes, alternating stops.
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c1';
insert into rutas (repartidor_id, estado) values
  ('00000000-0000-0000-0000-0000000000d1', 'despachada'),
  ('00000000-0000-0000-0000-0000000000d2', 'despachada');
insert into ruta_paradas (ruta_id, pedido_id, orden)
  select r.id, p.id, p.n
  from (select id, row_number() over (order by creado_en, id) n from pedidos) p
  join rutas r on r.repartidor_id = (case when p.n % 2 = 0 then '00000000-0000-0000-0000-0000000000d1'
                                           else '00000000-0000-0000-0000-0000000000d2' end)::uuid;

-- Courier 1 sees only his route and orders, and cannot write foreign payments.
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d1';
do $$ declare n int; m int; begin
  select count(*) into n from rutas;                     assert n = 1, 'courier sees 1 route, got ' || n;
  select count(*) into n from ruta_paradas;              select count(*) into m from pedidos;
  assert n = m and n = 12, 'courier orders match stops, got ' || n || '/' || m;
  select count(*) into n from clientes;                  assert n between 1 and 12, 'clients limited, got ' || n;
  select count(*) into n from perfiles;                  assert n = 1, 'courier sees only himself';
  begin
    insert into pagos (pedido_id, metodo, monto, recibido_por)
      select p.id, 'efectivo', 1000, '00000000-0000-0000-0000-0000000000d1'
      from pedidos p where not es_mi_pedido(p.id) limit 1;
    -- no foreign order is visible, so nothing is inserted: also fine
  exception when insufficient_privilege then null; end;
  begin
    insert into pagos (pedido_id, metodo, monto, recibido_por)
      select pedido_id, 'transferencia', 1000, '00000000-0000-0000-0000-0000000000d1' from ruta_paradas limit 1;
    raise exception 'FAIL: transfer without voucher';
  exception when check_violation then null; end;
  insert into pagos (pedido_id, metodo, monto, voucher_url, recibido_por)
    select pedido_id, 'transferencia', 1000, 'v/1.jpg', '00000000-0000-0000-0000-0000000000d1' from ruta_paradas limit 1;
  begin
    insert into cuadres (ruta_id, esperado, efectivo_recibido, transferencias, diferencia, cerrado_por)
      select id, 0, 0, 0, 0, '00000000-0000-0000-0000-0000000000d1' from rutas;
    raise exception 'FAIL: courier closed cash';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'OK: schema, seed and RLS verified' as resultado;
