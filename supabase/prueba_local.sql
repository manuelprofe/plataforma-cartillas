-- Prueba del esquema en un Postgres local, imitando lo mínimo de Supabase.
-- Uso: psql -v ON_ERROR_STOP=1 -f supabase/prueba_local.sql  (sobre una base vacía)
\set ON_ERROR_STOP on

create schema auth;
create schema extensions;
create role anon nologin;
create role authenticated nologin;
create table auth.users (id uuid primary key default gen_random_uuid());
create function auth.uid() returns uuid language sql stable as
$$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth, extensions to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
-- Supabase da estos privilegios por defecto; la seguridad real son las políticas.
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
grant usage on schema public to anon, authenticated;

\i supabase/esquema.sql

-- Datos: dos colegios, un docente en cada uno, un coordinador en el primero.
insert into auth.users (id) values
  ('00000000-0000-0000-0000-0000000000a1'), ('00000000-0000-0000-0000-0000000000a2'),
  ('00000000-0000-0000-0000-0000000000a3'), ('00000000-0000-0000-0000-0000000000b1'),
  ('00000000-0000-0000-0000-0000000000b2');
insert into colegios (id, nombre) values
  ('10000000-0000-0000-0000-000000000001', 'Colegio Uno'),
  ('10000000-0000-0000-0000-000000000002', 'Colegio Dos');
insert into perfiles (id, colegio_id, rol, nombre) values
  ('00000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-000000000001', 'docente', 'Docente Uno'),
  ('00000000-0000-0000-0000-0000000000a2', '10000000-0000-0000-0000-000000000002', 'docente', 'Docente Dos'),
  ('00000000-0000-0000-0000-0000000000a3', '10000000-0000-0000-0000-000000000001', 'coordinador', 'Coordinador Uno');

create function pg_temp.soy(u text) returns void language sql as
$$ select set_config('request.jwt.claim.sub', u, false) $$;
create function pg_temp.verificar(ok boolean, que text) returns void language plpgsql as
$$ begin if ok is not true then raise exception 'FALLA: %', que; end if; raise notice 'ok: %', que; end $$;
create function pg_temp.debe_fallar(sentencia text, que text) returns void language plpgsql as
$$ begin
  begin execute sentencia; exception when others then raise notice 'ok: % (%)', que, sqlerrm; return; end;
  raise exception 'FALLA: % no fue rechazado', que;
end $$;

create temp table t (clave text primary key, valor text);
grant all on t to authenticated;

set role authenticated;

-- Docente Uno crea grupo y estudiantes.
select pg_temp.soy('00000000-0000-0000-0000-0000000000a1');
insert into t select 'grupo1', (crear_grupo('Tercero A', '3')).id::text;
insert into t select 'codigo1', codigo from grupos;
insert into t select 'ana', crear_estudiante((select valor from t where clave = 'grupo1')::uuid, 'Ana', '123')::text;
insert into t select 'luis', crear_estudiante((select valor from t where clave = 'grupo1')::uuid, 'Luis', '456')::text;
select pg_temp.verificar((select count(*) from estudiantes) = 2, 'docente ve a sus 2 estudiantes');
select pg_temp.verificar((select char_length(valor) from t where clave = 'codigo1') = 5, 'código de grupo de 5 caracteres');
select pg_temp.verificar((select count(*) from estudiantes_pin) = 0, 'los PIN no son visibles');

-- Docente Dos (otro colegio) no ve nada del colegio uno.
select pg_temp.soy('00000000-0000-0000-0000-0000000000a2');
select pg_temp.verificar((select count(*) from grupos) = 0, 'docente de otro colegio no ve grupos ajenos');
select pg_temp.verificar((select count(*) from estudiantes) = 0, 'docente de otro colegio no ve estudiantes ajenos');
select pg_temp.debe_fallar(format('select dar_estrellas(%L, %L, %L)', (select valor from t where clave = 'ana'), 'ingles-3', 'participar'), 'docente ajeno no puede dar estrellas');
select pg_temp.debe_fallar(format('select crear_estudiante(%L, %L, %L)', (select valor from t where clave = 'grupo1'), 'Intruso', '111'), 'docente ajeno no puede crear estudiantes');

-- Coordinador del colegio uno ve el grupo; no ve el colegio dos.
select pg_temp.soy('00000000-0000-0000-0000-0000000000a3');
select pg_temp.verificar((select count(*) from grupos) = 1, 'coordinador ve los grupos de su colegio');
select pg_temp.verificar((select count(*) from colegios) = 1, 'coordinador solo ve su colegio');

-- Estudiante: sesión anónima b1 entra como Ana.
select pg_temp.soy('00000000-0000-0000-0000-0000000000b1');
select pg_temp.verificar((select count(*) from lista_grupo((select lower(valor) from t where clave = 'codigo1'))) = 2, 'la lista del grupo muestra 2 apodos');
select pg_temp.verificar(entrar_estudiante((select valor from t where clave = 'codigo1'), (select valor from t where clave = 'ana')::uuid, '999') = false, 'PIN errado no entra');
select pg_temp.debe_fallar($$select registrar_mision('ingles-3', 'bosque-school', 2, 3)$$, 'sin entrar no se registran misiones');
select pg_temp.verificar(entrar_estudiante((select valor from t where clave = 'codigo1'), (select valor from t where clave = 'ana')::uuid, '123'), 'PIN correcto entra');
select pg_temp.verificar(registrar_mision('ingles-3', 'bosque-school', 4, 3) = 25, 'primera vez: 15 por completar + 10 por autoevaluarse');
select pg_temp.verificar(registrar_mision('ingles-3', 'bosque-school', 4, 2) = 0, 'repetir sin mejorar no da estrellas');
select pg_temp.verificar(registrar_mision('ingles-3', 'bosque-school', 1, 2) = 15, 'repetir con menos errores da 15');
select pg_temp.verificar((select estrellas from total_estrellas) = 40, 'el total de Ana es 40');
select pg_temp.verificar((select count(*) from estudiantes) = 1, 'Ana solo se ve a sí misma');
select pg_temp.debe_fallar(format('insert into estrellas (estudiante_id, cartilla_id, motivo, cantidad) values (%L, %L, %L, 500)', (select valor from t where clave = 'ana'), 'ingles-3', 'completar'), 'el navegador no puede inventar estrellas');
select pg_temp.debe_fallar(format('select dar_estrellas(%L, %L, %L)', (select valor from t where clave = 'ana'), 'ingles-3', 'participar'), 'un estudiante no puede darse estrellas de docente');
select pg_temp.debe_fallar($$select crear_grupo('Falso', '3')$$, 'un estudiante no puede crear grupos');

-- Otra sesión anónima (b2) sin entrar no ve nada; cinco PIN errados bloquean.
select pg_temp.soy('00000000-0000-0000-0000-0000000000b2');
select pg_temp.verificar((select count(*) from estrellas) = 0, 'otra sesión no ve estrellas de Ana');
select entrar_estudiante((select valor from t where clave = 'codigo1'), (select valor from t where clave = 'luis')::uuid, '000') from generate_series(1, 5);
select pg_temp.verificar(entrar_estudiante((select valor from t where clave = 'codigo1'), (select valor from t where clave = 'luis')::uuid, '456') = false, 'tras 5 errores el PIN correcto queda bloqueado');

-- Docente Uno reconoce participación y ve el total.
select pg_temp.soy('00000000-0000-0000-0000-0000000000a1');
select pg_temp.verificar(dar_estrellas((select valor from t where clave = 'ana')::uuid, 'ingles-3', 'participar') = 10, 'docente da 10 por participar');
select pg_temp.debe_fallar(format('select dar_estrellas(%L, %L, %L)', (select valor from t where clave = 'ana'), 'ingles-3', 'completar'), 'docente no puede dar estrellas de misión');
select pg_temp.verificar((select estrellas from total_estrellas where estudiante_id = (select valor from t where clave = 'ana')::uuid) = 50, 'docente ve el total de Ana: 50');
with x as (update estrellas set cantidad = 1 returning 1) select pg_temp.verificar((select count(*) from x) = 0, 'las estrellas no se pueden modificar');
with x as (delete from estrellas returning 1) select pg_temp.verificar((select count(*) from x) = 0, 'las estrellas no se pueden borrar');

-- Sin sesión (anon) no hay acceso.
reset role;
set role anon;
select pg_temp.debe_fallar('select * from grupos', 'visitante sin sesión no lee tablas');
select pg_temp.debe_fallar($$select * from lista_grupo('AAAAA')$$, 'visitante sin sesión no ejecuta funciones');
reset role;
\echo TODAS LAS PRUEBAS PASARON
