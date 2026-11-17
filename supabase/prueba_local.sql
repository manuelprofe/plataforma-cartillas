-- Prueba del esquema y sus migraciones en un Postgres local, imitando lo mínimo de Supabase.
-- Uso (sobre una base vacía, desde la raíz del repositorio):
--   psql -v ON_ERROR_STOP=1 -f supabase/prueba_local.sql
-- Aplica esquema.sql, después cada migración dos veces (deben ser idempotentes) y comprueba
-- la seguridad por filas con roles simulados (docente, coordinador, dueño, sesiones anónimas).
\set ON_ERROR_STOP on

create schema auth;
create schema extensions;
create role anon nologin;
create role authenticated nologin;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  email_confirmed_at timestamptz
);
create function auth.uid() returns uuid language sql stable as
$$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth, extensions to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
-- Supabase da estos privilegios por defecto; la seguridad real son las políticas.
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
grant usage on schema public to anon, authenticated;

\i supabase/esquema.sql
\i supabase/migraciones/002-esqueleto.sql
\i supabase/migraciones/002-esqueleto.sql

-- Datos: dos colegios; en el uno, dos docentes y un coordinador; en el dos, un docente y un
-- coordinador; el dueño; tres aparatos anónimos; dos adultos que llegan por invitación.
insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-0000000000a1', 'uno@x.co', now()),
  ('00000000-0000-0000-0000-0000000000a2', 'dos@x.co', now()),
  ('00000000-0000-0000-0000-0000000000a3', 'coord@x.co', now()),
  ('00000000-0000-0000-0000-0000000000a4', 'coord2@x.co', now()),
  ('00000000-0000-0000-0000-0000000000a5', 'tres@x.co', now()),
  ('00000000-0000-0000-0000-0000000000d0', 'dueno@x.co', now()),
  ('00000000-0000-0000-0000-0000000000b1', null, null),
  ('00000000-0000-0000-0000-0000000000b2', null, null),
  ('00000000-0000-0000-0000-0000000000b3', null, null),
  ('00000000-0000-0000-0000-0000000000c1', 'nueva@x.co', now()),
  ('00000000-0000-0000-0000-0000000000c2', 'sinconfirmar@x.co', null);
insert into colegios (id, nombre) values
  ('10000000-0000-0000-0000-000000000001', 'Colegio Uno'),
  ('10000000-0000-0000-0000-000000000002', 'Colegio Dos');
insert into perfiles (id, colegio_id, rol, nombre, correo) values
  ('00000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-000000000001', 'docente', 'Docente Uno', 'uno@x.co'),
  ('00000000-0000-0000-0000-0000000000a5', '10000000-0000-0000-0000-000000000001', 'docente', 'Docente Tres', 'tres@x.co'),
  ('00000000-0000-0000-0000-0000000000a2', '10000000-0000-0000-0000-000000000002', 'docente', 'Docente Dos', 'dos@x.co'),
  ('00000000-0000-0000-0000-0000000000a3', '10000000-0000-0000-0000-000000000001', 'coordinador', 'Coordinador Uno', 'coord@x.co'),
  ('00000000-0000-0000-0000-0000000000a4', '10000000-0000-0000-0000-000000000002', 'coordinador', 'Coordinador Dos', 'coord2@x.co'),
  ('00000000-0000-0000-0000-0000000000d0', null, 'dueno', 'Dueño', 'dueno@x.co');

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
grant all on t to authenticated, anon;
create function pg_temp.v(k text) returns text language sql as $$ select valor from t where clave = k $$;

set role authenticated;

-- ------------------------------------------------ Docente Uno arma su grupo
select pg_temp.soy('00000000-0000-0000-0000-0000000000a1');
insert into t select 'grupo1', (crear_grupo('Tercero A', '3')).id::text;
insert into t select 'codigo1', codigo from grupos where id = pg_temp.v('grupo1')::uuid;
insert into t select 'ana', crear_estudiante(pg_temp.v('grupo1')::uuid, 'Ana', '123', 'tavi')::text;
insert into t select 'luis', crear_estudiante(pg_temp.v('grupo1')::uuid, 'Luis', '456', 'mika')::text;
insert into t select 'n' || i, crear_estudiante(pg_temp.v('grupo1')::uuid, 'Niño ' || i, '111', 'bruno')::text from generate_series(3, 5) i;
select pg_temp.verificar((select count(*) from estudiantes) = 5, 'docente ve a sus 5 estudiantes');
select pg_temp.verificar(pg_temp.v('codigo1') ~ '^[A-Z2-9]{5}$', 'código de grupo de 5 caracteres');
select pg_temp.debe_fallar('select * from estudiantes_pin', 'los PIN no son legibles');
select pg_temp.debe_fallar(format('select crear_estudiante(%L, %L, %L, %L)', pg_temp.v('grupo1'), 'Mal', '111', 'Lumi Grande'), 'personaje con formato inválido');
-- Autorización: Ana, Luis y n3 tienen; n4 y n5 todavía no.
update estudiantes set autorizacion = hoy_co() where id in (pg_temp.v('ana')::uuid, pg_temp.v('luis')::uuid, pg_temp.v('n3')::uuid);
select pg_temp.verificar((select count(autorizacion) from estudiantes) = 3, 'docente marca 3 autorizaciones con fecha');
select pg_temp.debe_fallar(format('update estudiantes set grupo_id = gen_random_uuid() where id = %L', pg_temp.v('ana')), 'no se cambia el grupo de un niño a mano');
select pg_temp.debe_fallar(format('update grupos set codigo = %L where id = %L', 'AAAAA', pg_temp.v('grupo1')), 'el código no se escribe a mano');
select pg_temp.debe_fallar($$insert into grupos (colegio_id, docente_id, nombre, grado, codigo) values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'X', '3', 'ZZZZZ')$$, 'los grupos solo se crean con crear_grupo');
-- Plan del tema y registro del piloto.
insert into planes_tema (grupo_id, cartilla_id, tema_id, clase1, clase2, estado) values (pg_temp.v('grupo1')::uuid, 'ingles-3', 'colores', '2027-02-08', '2027-02-15', 'en-curso');
insert into resultados_prueba (estudiante_id, cartilla_id, prueba_id, aciertos, intentos) values (pg_temp.v('ana')::uuid, 'ingles-3', 'colores', 5, 3);
insert into pruebas_grupo (grupo_id, cartilla_id, prueba_id, palabras) values (pg_temp.v('grupo1')::uuid, 'ingles-3', 'colores', '{purple,brown}');
insert into cotejo (estudiante_id, semana, marcas) values (pg_temp.v('ana')::uuid, '2027-02-08', '{"participa": true}');
select pg_temp.debe_fallar(format($$insert into cotejo (estudiante_id, semana) values (%L, '2027-02-10')$$, pg_temp.v('ana')), 'la semana del cotejo empieza el lunes');
insert into t values ('inc', gen_random_uuid()::text);
insert into incidencias (accion, grupo_id, tipo, registrada_por) values (pg_temp.v('inc')::uuid, pg_temp.v('grupo1')::uuid, 'sin-sonido', auth.uid());
insert into incidencias (accion, grupo_id, tipo, registrada_por) values (pg_temp.v('inc')::uuid, pg_temp.v('grupo1')::uuid, 'sin-sonido', auth.uid()) on conflict do nothing;
select pg_temp.verificar((select count(*) from incidencias) = 1, 'la incidencia reintentada no se duplica');
insert into encuestas_acceso (grupo_id, momento, conteos) values (pg_temp.v('grupo1')::uuid, 'antes', '{"respondieron": 30, "con_celular": 22}');
select pg_temp.debe_fallar(format($$insert into encuestas_acceso (grupo_id, momento, conteos) values (%L, 'despues', '{"nombre": "Ana"}')$$, pg_temp.v('grupo1')), 'la encuesta solo guarda conteos');

-- ------------------------------------------- Estrellas del docente
insert into t values ('acc1', gen_random_uuid()::text), ('acc2', gen_random_uuid()::text);
select pg_temp.verificar(dar_estrellas(array[pg_temp.v('ana')::uuid], 'ingles-3', 'participar', pg_temp.v('acc1')::uuid) = 10, 'docente da 10 por participar');
select pg_temp.verificar(dar_estrellas(array[pg_temp.v('ana')::uuid], 'ingles-3', 'participar', pg_temp.v('acc1')::uuid) = 0, 'reintentar la misma acción no da doble estrella');
select pg_temp.verificar(dar_estrellas(array[pg_temp.v('ana'), pg_temp.v('luis'), pg_temp.v('n3')]::uuid[], 'ingles-3', 'colaborar', pg_temp.v('acc2')::uuid) = 45, 'colaborar a 3 a la vez');
select pg_temp.verificar(dar_estrellas(array[pg_temp.v('luis')::uuid], 'ingles-3', 'pronunciar', gen_random_uuid(), 'bosque-colores-3') = 10, 'pronunciar de respaldo');
select pg_temp.verificar(dar_estrellas(array[pg_temp.v('luis')::uuid], 'ingles-3', 'pronunciar', gen_random_uuid(), 'bosque-colores-3') = 0, 'pronunciar de respaldo una vez por misión');
select pg_temp.debe_fallar(format('select dar_estrellas(array[%L]::uuid[], %L, %L, gen_random_uuid())', pg_temp.v('ana'), 'ingles-3', 'completar'), 'docente no da estrellas de misión');
select pg_temp.debe_fallar(format('select dar_estrellas(array[%L]::uuid[], %L, %L, null)', pg_temp.v('ana'), 'ingles-3', 'participar'), 'sin identificador de acción no se dan');
select pg_temp.debe_fallar('update estrellas set cantidad = 1', 'las estrellas no se modifican');
select pg_temp.debe_fallar('delete from estrellas', 'las estrellas no se borran');

-- ------------------------------------------- Otro docente del mismo colegio
select pg_temp.soy('00000000-0000-0000-0000-0000000000a5');
select pg_temp.verificar((select count(*) from estudiantes) = 0, 'otro docente del colegio no ve niños ajenos');
select pg_temp.verificar((select count(*) from resultados_prueba) + (select count(*) from cotejo) = 0, 'otro docente no ve pruebas ni cotejo ajenos');
select pg_temp.debe_fallar(format('select dar_estrellas(array[%L]::uuid[], %L, %L, gen_random_uuid())', pg_temp.v('ana'), 'ingles-3', 'participar'), 'docente ajeno no da estrellas');

-- ------------------------------------------- Docente de otro colegio
select pg_temp.soy('00000000-0000-0000-0000-0000000000a2');
select pg_temp.verificar((select count(*) from grupos) = 0, 'docente de otro colegio no ve grupos ajenos');
select pg_temp.debe_fallar(format('select crear_estudiante(%L, %L, %L, %L)', pg_temp.v('grupo1'), 'Intruso', '111', 'tavi'), 'docente ajeno no crea estudiantes');

-- ------------------------------------------- Aparato b1: Ana y Luis (hermanos) en el mismo celular
select pg_temp.soy('00000000-0000-0000-0000-0000000000b1');
select pg_temp.verificar((select count(*) from lista_grupo(lower(pg_temp.v('codigo1')))) = 3, 'la lista muestra solo a los 3 con autorización');
select pg_temp.verificar(entrar_estudiante(pg_temp.v('codigo1'), pg_temp.v('n4')::uuid, '111') = 'no-existe', 'sin autorización no entra con cuenta');
select pg_temp.verificar(entrar_estudiante(pg_temp.v('codigo1'), pg_temp.v('ana')::uuid, '999') = 'errado', 'PIN errado responde errado');
select pg_temp.debe_fallar(format('select registrar_mision(%L, %L, %L, 2, 3)', pg_temp.v('ana'), 'ingles-3', 'bosque-school'), 'sin entrar no se registran misiones');
select pg_temp.verificar(entrar_estudiante(pg_temp.v('codigo1'), pg_temp.v('ana')::uuid, '123') = 'ok', 'Ana entra');
select pg_temp.verificar(entrar_estudiante(pg_temp.v('codigo1'), pg_temp.v('luis')::uuid, '456') = 'ok', 'Luis entra en el mismo aparato');
select pg_temp.verificar((select count(*) from estudiantes) = 2, 'el aparato ve a sus dos niños');
select pg_temp.verificar(registrar_mision(pg_temp.v('ana')::uuid, 'ingles-3', 'bosque-school', 4, 3) = 25, 'primera vez: 15 + 10 por autoevaluarse');
select pg_temp.verificar(registrar_mision(pg_temp.v('ana')::uuid, 'ingles-3', 'bosque-school', 4, 2) = 0, 'repetir sin mejorar no da estrellas');
select pg_temp.verificar(registrar_mision(pg_temp.v('ana')::uuid, 'ingles-3', 'bosque-school', 2, 2) = 15, 'mejorar da 15');
select pg_temp.verificar(registrar_mision(pg_temp.v('ana')::uuid, 'ingles-3', 'bosque-school', 1, 2) = 0, 'mejorar solo una vez por misión');
select pg_temp.verificar(registrar_mision(pg_temp.v('luis')::uuid, 'ingles-3', 'bosque-school', 0) = 15, 'Luis registra su misión aparte');
select pg_temp.verificar((select estrellas from total_estrellas where estudiante_id = pg_temp.v('ana')::uuid) = 65, 'total de Ana: 10 + 15 + 25 + 15 = 65');
select pg_temp.verificar((select count(*) from dias_practica) = 2, 'un día de práctica por niño, sin hora');
select pg_temp.verificar((select pg_typeof(actualizado)::text from progreso_misiones limit 1) = 'date', 'el progreso guarda fecha, no hora');
select pg_temp.verificar((select count(*) from resultados_prueba) = 0, 'el niño no ve su resultado de prueba');
select pg_temp.debe_fallar(format('insert into estrellas (estudiante_id, cartilla_id, motivo, cantidad) values (%L, %L, %L, 500)', pg_temp.v('ana'), 'ingles-3', 'completar'), 'el navegador no inventa estrellas');
select soltar_estudiante(pg_temp.v('luis')::uuid);
select pg_temp.verificar((select count(*) from estudiantes) = 1, 'soltar a Luis deja a Ana en el aparato');

-- ------------------------------------------- Aparato b2: PIN y descanso
select pg_temp.soy('00000000-0000-0000-0000-0000000000b2');
select pg_temp.verificar((select count(*) from estrellas) = 0, 'otro aparato no ve estrellas de Ana');
select entrar_estudiante(pg_temp.v('codigo1'), pg_temp.v('n3')::uuid, '000') from generate_series(1, 4);
select pg_temp.verificar(entrar_estudiante(pg_temp.v('codigo1'), pg_temp.v('n3')::uuid, '000') = 'descanso', 'el quinto error responde descanso');
select pg_temp.verificar(entrar_estudiante(pg_temp.v('codigo1'), pg_temp.v('n3')::uuid, '111') = 'descanso', 'en descanso ni el PIN correcto entra');

-- ------------------------------------------- Aparato b3: adivinar códigos
select pg_temp.soy('00000000-0000-0000-0000-0000000000b3');
select count(*) from generate_series(1, 10) i, lateral lista_grupo('ZZZZ' || i) l;
select pg_temp.debe_fallar(format('select * from lista_grupo(%L)', pg_temp.v('codigo1')), 'tras 10 códigos errados el aparato espera, aun con el código bueno');

-- ------------------------------------------- Coordinador del colegio uno
select pg_temp.soy('00000000-0000-0000-0000-0000000000a3');
select pg_temp.verificar((select count(*) from grupos) = 1, 'coordinador ve los grupos de su colegio');
select pg_temp.verificar((select count(*) from colegios) = 1, 'coordinador solo ve su colegio');
select pg_temp.verificar((select count(*) from estudiantes) = 0, 'coordinador no lee filas de estudiantes');
select pg_temp.verificar((select count(*) from progreso_misiones) + (select count(*) from estrellas) + (select count(*) from dias_practica) = 0, 'coordinador no lee progreso, estrellas ni días por niño');
select pg_temp.verificar((select count(*) from resultados_prueba) + (select count(*) from pruebas_grupo) + (select count(*) from cotejo) = 0, 'coordinador no ve pruebas ni cotejo');
with x as (delete from estudiantes returning 1) select pg_temp.verificar((select count(*) from x) = 0, 'coordinador no borra niños');
with x as (delete from grupos returning 1) select pg_temp.verificar((select count(*) from x) = 0, 'coordinador no borra grupos (borraría niños)');
select pg_temp.debe_fallar(format('select cambiar_pin(%L, %L)', pg_temp.v('ana'), '222'), 'coordinador no cambia PIN');
select pg_temp.verificar((select con_cifras and ninos = 5 and autorizaciones = 3 and practicaron_semana = 2 and (estrellas->>'colaborar')::int = 45 from cifras_grupos()), 'cifras sumadas del grupo de 5');
select pg_temp.verificar((select (plan->'ingles-3/colores'->>'estado') = 'en-curso' and (incidencias->>'sin-sonido')::int = 1 from cifras_grupos()), 'plan e incidencias del grupo');
select pg_temp.verificar((select count(*) from incidencias) = 1 and (select count(*) from planes_tema) = 1, 'coordinador lee incidencias y planes');
-- Crea un grupo para Docente Tres y renueva su código.
insert into t select 'grupo3', (crear_grupo('Tercero B', '3', '00000000-0000-0000-0000-0000000000a5')).id::text;
select pg_temp.verificar((select docente_id from grupos where id = pg_temp.v('grupo3')::uuid) = '00000000-0000-0000-0000-0000000000a5', 'coordinador asigna el docente del grupo');
select pg_temp.verificar((select not con_cifras and ninos is null from cifras_grupos() where grupo_id = pg_temp.v('grupo3')::uuid), 'grupo de menos de 5: sin cifras');
select pg_temp.debe_fallar(format('select crear_grupo(%L, %L, %L)', 'X', '3', '00000000-0000-0000-0000-0000000000a2'), 'no asigna un docente de otro colegio');
select pg_temp.debe_fallar(format('update grupos set docente_id = %L where id = %L', '00000000-0000-0000-0000-0000000000a2', pg_temp.v('grupo3')), 'no pasa un grupo a un docente de otro colegio');
select pg_temp.verificar(renovar_codigo(pg_temp.v('grupo1')::uuid) <> pg_temp.v('codigo1'), 'coordinador renueva el código');
-- Invita a una docente; no puede invitar coordinadores.
select invitar('Nueva@X.co ', 'Docente Nueva', 'docente');
select pg_temp.debe_fallar($$select invitar('otro@x.co', 'Otro', 'coordinador')$$, 'coordinador no invita coordinadores');
select pg_temp.debe_fallar($$select invitar('uno@x.co', 'Repetido', 'docente')$$, 'no invita un correo que ya tiene cuenta');
select pg_temp.verificar((select count(*) from invitaciones) = 1, 'coordinador ve su invitación');
-- Desactiva a Docente Tres.
update perfiles set activo = false where id = '00000000-0000-0000-0000-0000000000a5';
select pg_temp.debe_fallar($$update perfiles set rol = 'coordinador' where id = '00000000-0000-0000-0000-0000000000a5'$$, 'el rol no se cambia desde el navegador');

-- ------------------------------------------- Coordinador del colegio dos
select pg_temp.soy('00000000-0000-0000-0000-0000000000a4');
select pg_temp.verificar((select count(*) from cifras_grupos()) = 0 and (select count(*) from invitaciones) = 0, 'coordinador de otro colegio no ve cifras ni invitaciones ajenas');
select pg_temp.debe_fallar($$select invitar('nueva@x.co', 'Robo', 'docente')$$, 'no se apropia de la invitación de otro colegio');
with x as (update perfiles set activo = true where id = '00000000-0000-0000-0000-0000000000a5' returning 1) select pg_temp.verificar((select count(*) from x) = 0, 'no reactiva docentes de otro colegio');

-- ------------------------------------------- Docente desactivado
select pg_temp.soy('00000000-0000-0000-0000-0000000000a5');
select pg_temp.verificar(mi_rol() is null and (select count(*) from grupos) = 0, 'docente desactivado no ve nada');
select pg_temp.debe_fallar($$select crear_grupo('X', '3')$$, 'docente desactivado no crea grupos');

-- ------------------------------------------- Invitaciones
select pg_temp.soy('00000000-0000-0000-0000-0000000000c2');
select pg_temp.verificar(aceptar_invitacion() is null, 'sin correo confirmado no hay perfil');
select pg_temp.soy('00000000-0000-0000-0000-0000000000c1');
select pg_temp.verificar(aceptar_invitacion() = 'docente', 'la invitada confirma su correo y recibe el rol docente');
select pg_temp.verificar(aceptar_invitacion() = 'docente' and (select count(*) from perfiles) = 1, 'aceptar de nuevo no duplica');
select pg_temp.verificar(mi_colegio() = '10000000-0000-0000-0000-000000000001', 'queda en el colegio que la invitó');
select pg_temp.soy('00000000-0000-0000-0000-0000000000b1');
select pg_temp.verificar(aceptar_invitacion() is null and mi_rol() is null, 'una sesión anónima no recibe rol');

-- ------------------------------------------- Dueño
select pg_temp.soy('00000000-0000-0000-0000-0000000000d0');
select pg_temp.verificar((select count(*) from colegios) = 2, 'el dueño ve todos los colegios');
select pg_temp.verificar((select count(*) from estudiantes) + (select count(*) from estrellas) + (select count(*) from resultados_prueba) = 0, 'el dueño no lee filas de niños');
select pg_temp.verificar((select count(*) from cifras_grupos('10000000-0000-0000-0000-000000000001')) = 2, 'el dueño ve cifras sumadas de un colegio');
update colegios set convenio = 'Convenio 2027' where id = '10000000-0000-0000-0000-000000000001';
insert into cartillas (id, titulo, materia, grado) values ('ingles-3', 'English Adventure Quest', 'Inglés', '3');
insert into cartilla_versiones (cartilla_id, version) values ('ingles-3', '2027.1');
insert into colegio_cartillas values ('10000000-0000-0000-0000-000000000001', 'ingles-3', '2027.1');
select invitar('coord3@x.co', 'Coordinadora Tres', 'coordinador', '10000000-0000-0000-0000-000000000002');
select pg_temp.soy('00000000-0000-0000-0000-0000000000a4');
select pg_temp.verificar((select count(*) from colegio_cartillas) = 0, 'el colegio dos no ve versiones del uno');
select pg_temp.debe_fallar($$insert into cartillas (id, titulo) values ('x', 'X')$$, 'solo el dueño publica cartillas');
select pg_temp.soy('00000000-0000-0000-0000-0000000000a1');
select pg_temp.verificar((select count(*) from colegio_cartillas) = 1 and (select convenio from colegios) = 'Convenio 2027', 'el docente ve la versión y el convenio de su colegio');
-- El docente retira a un niño: se borra todo lo suyo.
delete from estudiantes where id = pg_temp.v('ana')::uuid;
select pg_temp.verificar((select count(*) from estudiantes) = 4, 'el docente retira a un niño');

-- ------------------------------------------- Sin sesión (anon)
reset role;
select pg_temp.verificar((select count(*) from estrellas where estudiante_id = pg_temp.v('ana')::uuid) + (select count(*) from resultados_prueba) = 0, 'retirar borra estrellas y prueba del niño');
set role anon;
select pg_temp.debe_fallar('select * from grupos', 'visitante sin sesión no lee tablas');
select pg_temp.debe_fallar('select * from cartillas', 'visitante sin sesión no lee cartillas');
select pg_temp.debe_fallar($$select * from lista_grupo('AAAAA')$$, 'visitante sin sesión no ejecuta funciones');
reset role;
\echo TODAS LAS PRUEBAS PASARON
