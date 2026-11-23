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
create role supabase_auth_admin nologin;
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
\i supabase/migraciones/003-ajustes.sql
\i supabase/migraciones/003-ajustes.sql
\i supabase/migraciones/004-multicartilla.sql
\i supabase/migraciones/004-multicartilla.sql
\i supabase/migraciones/005-cartilla-del-grupo.sql
\i supabase/migraciones/005-cartilla-del-grupo.sql

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
  ('00000000-0000-0000-0000-0000000000b4', null, null),
  ('00000000-0000-0000-0000-0000000000b5', null, null),
  ('00000000-0000-0000-0000-0000000000b6', null, null),
  ('00000000-0000-0000-0000-0000000000b7', null, null),
  ('00000000-0000-0000-0000-0000000000b8', null, null),
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
-- Docente Uno y Docente Dos llegaron por invitación (aceptada); Docente Tres se creó por fuera.
insert into invitaciones (correo, nombre, rol, colegio_id, aceptada) values
  ('uno@x.co', 'Docente Uno', 'docente', '10000000-0000-0000-0000-000000000001', now()),
  ('dos@x.co', 'Docente Dos', 'docente', '10000000-0000-0000-0000-000000000002', now());

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
-- Mensaje de error de una sentencia (o null si no falla).
create function pg_temp.mensaje(sentencia text) returns text language plpgsql as
$$ begin execute sentencia; return null; exception when others then return sqlerrm; end $$;
-- Vence la espera del PIN de un niño (como si pasara el tiempo). Se llama sin rol simulado.
create function pg_temp.pasar_espera(e text) returns void language sql as
$$ update estudiantes_pin set bloqueado_hasta = now() - interval '1 second' where estudiante_id = e::uuid $$;
create function pg_temp.v(k text) returns text language sql as $$ select valor from t where clave = k $$;

-- Las misiones del paquete las cargó la migración.
select pg_temp.verificar((select count(*) from misiones where cartilla_id = 'ingles-3') >= 17, 'la migración carga las misiones del paquete');

set role authenticated;

-- ------------------------------------------------ El dueño habilita la cartilla y deja invitaciones
select pg_temp.soy('00000000-0000-0000-0000-0000000000d0');
insert into cartilla_versiones (cartilla_id, version) values ('ingles-3', '2027.1');
insert into colegio_cartillas values ('10000000-0000-0000-0000-000000000001', 'ingles-3', '2027.1');
select invitar('profe@x.co', 'Profe del dueño', 'docente', '10000000-0000-0000-0000-000000000001');
select invitar('jefe@x.co', 'Jefe', 'coordinador', '10000000-0000-0000-0000-000000000001');

-- ------------------------------------------------ Docente Uno arma su grupo
select pg_temp.soy('00000000-0000-0000-0000-0000000000a1');
with g as (select * from crear_grupo('Tercero A', '3')) insert into t select 'grupo1', id::text from g union all select 'codigo1_api', codigo from g;
select pg_temp.verificar(pg_temp.v('codigo1_api') is not null, 'crear_grupo sí devuelve el código al docente del grupo');
insert into t select 'codigo1', codigo from mis_codigos() where grupo_id = pg_temp.v('grupo1')::uuid;
select pg_temp.debe_fallar('select codigo from grupos', 'ni el docente lee grupos.codigo directo (usa mis_codigos)');
select pg_temp.debe_fallar('select * from lista_grupo(''AAAAA'')', 'una sesión de adulto no usa lista_grupo');
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
select pg_temp.verificar(dar_estrellas(array[pg_temp.v('luis')::uuid], 'ingles-3', 'pronunciar', gen_random_uuid(), 'bosque-colors-3') = 10, 'pronunciar de respaldo');
select pg_temp.verificar(dar_estrellas(array[pg_temp.v('luis')::uuid], 'ingles-3', 'pronunciar', gen_random_uuid(), 'bosque-colors-3') = 0, 'pronunciar de respaldo una vez por misión');
select pg_temp.debe_fallar(format('select dar_estrellas(array[%L]::uuid[], %L, %L, gen_random_uuid(), %L)', pg_temp.v('luis'), 'ingles-3', 'pronunciar', 'inventada'), 'pronunciar solo por misiones que existen');
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
select pg_temp.verificar((select bool_and(cartilla = 'ingles-3') from lista_grupo(pg_temp.v('codigo1'))), 'el código dice la cartilla del grupo');
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
select pg_temp.verificar(registrar_mision(pg_temp.v('luis')::uuid, 'ingles-3', 'bosque-school-2', 1, null, 'envio-luis-0001') = 15, 'envío con identificador: 15');
select pg_temp.verificar(registrar_mision(pg_temp.v('luis')::uuid, 'ingles-3', 'bosque-school-2', 1, null, 'envio-luis-0001') = 15, 'el reintento responde lo mismo');
select pg_temp.verificar((select veces from progreso_misiones where estudiante_id = pg_temp.v('luis')::uuid and mision_id = 'bosque-school-2') = 1, 'el reintento no cuenta otra vez');
select pg_temp.verificar((select count(*) from estrellas where estudiante_id = pg_temp.v('luis')::uuid and mision_id = 'bosque-school-2') = 1, 'el reintento no suma estrellas');
select pg_temp.verificar(registrar_mision(pg_temp.v('luis')::uuid, 'ingles-3', 'bosque-school-2', 1, 2, 'envio-luis-0002') = 10, 'un envío nuevo de la misma misión sí cuenta');
select pg_temp.debe_fallar(format('select registrar_mision(%L, %L, %L, 0, null, %L)', pg_temp.v('ana'), 'ingles-3', 'bosque-school-2', 'envio-luis-0001'), 'un envío de Luis no vale para Ana');
select pg_temp.debe_fallar('select * from envios_mision', 'el aparato no lee los envíos');
select pg_temp.debe_fallar(format('select registrar_mision(%L, %L, %L, 0, 1)', pg_temp.v('luis'), 'ingles-3', 'inventada-1'), 'no se registran misiones inventadas');
select pg_temp.debe_fallar(format('select registrar_mision(%L, %L, %L, 0, 1)', pg_temp.v('luis'), 'otra-cartilla', 'bosque-school'), 'no se registran misiones de otra cartilla');
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
-- Cada tanda de 5 errores alarga la espera (5 min, 15 min, 1 h); a la cuarta, ayuda del profe.
reset role;
select pg_temp.pasar_espera(pg_temp.v('n3'));
set role authenticated;
select pg_temp.soy('00000000-0000-0000-0000-0000000000b4');
select entrar_estudiante(pg_temp.v('codigo1'), pg_temp.v('n3')::uuid, '000') from generate_series(1, 5);
reset role;
select pg_temp.verificar((select bloqueado_hasta between now() + interval '14 minutes' and now() + interval '16 minutes' from estudiantes_pin where estudiante_id = pg_temp.v('n3')::uuid), 'segunda tanda de errores: espera de 15 minutos');
select pg_temp.pasar_espera(pg_temp.v('n3'));
set role authenticated;
select pg_temp.soy('00000000-0000-0000-0000-0000000000b5');
select entrar_estudiante(pg_temp.v('codigo1'), pg_temp.v('n3')::uuid, '000') from generate_series(1, 5);
reset role;
select pg_temp.verificar((select bloqueado_hasta between now() + interval '59 minutes' and now() + interval '61 minutes' from estudiantes_pin where estudiante_id = pg_temp.v('n3')::uuid), 'tercera tanda: espera de 1 hora');
select pg_temp.pasar_espera(pg_temp.v('n3'));
set role authenticated;
select pg_temp.soy('00000000-0000-0000-0000-0000000000b6');
select entrar_estudiante(pg_temp.v('codigo1'), pg_temp.v('n3')::uuid, '000') from generate_series(1, 4);
select pg_temp.verificar(entrar_estudiante(pg_temp.v('codigo1'), pg_temp.v('n3')::uuid, '000') = 'ayuda', 'cuarta tanda: responde ayuda (pídele ayuda a tu profe)');
reset role;
select pg_temp.pasar_espera(pg_temp.v('n3'));
set role authenticated;
select pg_temp.verificar(entrar_estudiante(pg_temp.v('codigo1'), pg_temp.v('n3')::uuid, '111') = 'ayuda', 'en ayuda ni el PIN correcto entra, aunque pase el tiempo');
select pg_temp.soy('00000000-0000-0000-0000-0000000000a1');
select cambiar_pin(pg_temp.v('n3')::uuid, '333');
select pg_temp.soy('00000000-0000-0000-0000-0000000000b6');
select pg_temp.verificar(entrar_estudiante(pg_temp.v('codigo1'), pg_temp.v('n3')::uuid, '333') = 'ok', 'el docente cambia el PIN y el niño vuelve a entrar');

-- ------------------------------------------- Aparato b7: 15 PIN errados por hora y por aparato
select pg_temp.soy('00000000-0000-0000-0000-0000000000b7');
select entrar_estudiante(pg_temp.v('codigo1'), pg_temp.v('luis')::uuid, '000') from generate_series(1, 5);
reset role;
select pg_temp.pasar_espera(pg_temp.v('luis'));
set role authenticated;
select entrar_estudiante(pg_temp.v('codigo1'), pg_temp.v('luis')::uuid, '000') from generate_series(1, 5);
reset role;
select pg_temp.pasar_espera(pg_temp.v('luis'));
set role authenticated;
select entrar_estudiante(pg_temp.v('codigo1'), pg_temp.v('luis')::uuid, '000') from generate_series(1, 5);
reset role;
select pg_temp.pasar_espera(pg_temp.v('luis'));
set role authenticated;
select pg_temp.verificar(entrar_estudiante(pg_temp.v('codigo1'), pg_temp.v('luis')::uuid, '456') = 'descanso', 'tras 15 PIN errados el aparato descansa, aun con el PIN bueno');
select pg_temp.soy('00000000-0000-0000-0000-0000000000b8');
select pg_temp.verificar(entrar_estudiante(pg_temp.v('codigo1'), pg_temp.v('luis')::uuid, '456') = 'ok', 'otro aparato no hereda el descanso');

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
select pg_temp.verificar(mi_perfil()->>'rol' = 'coordinador' and (select count(*) from perfiles) > 1, 'mi_perfil da el propio aunque se vean varios perfiles');
select pg_temp.debe_fallar('select codigo from grupos', 'coordinador no lee grupos.codigo');
select pg_temp.debe_fallar('select * from lista_grupo(''AAAAA'')', 'coordinador no usa lista_grupo');
-- Cartilla del grupo (migración 005): solo una habilitada para el colegio.
reset role;
insert into cartillas (id, titulo, materia, grado) values ('mate-1', 'Mate', 'Matemáticas', '1');
insert into cartilla_versiones (cartilla_id, version) values ('mate-1', '2027.1');
set role authenticated;
select pg_temp.soy('00000000-0000-0000-0000-0000000000a3');
select pg_temp.debe_fallar($$update grupos set cartilla_id = 'mate-1'$$, 'no se pasa un grupo a una cartilla no habilitada');
reset role;
insert into colegio_cartillas values ('10000000-0000-0000-0000-000000000001', 'mate-1', '2027.1');
set role authenticated;
select pg_temp.soy('00000000-0000-0000-0000-0000000000a3');
with x as (update grupos set cartilla_id = 'mate-1' returning 1) select pg_temp.verificar((select count(*) from x) = 1, 'el coordinador pasa el grupo a otra cartilla habilitada');
with x as (update grupos set cartilla_id = 'ingles-3' returning 1) select pg_temp.verificar((select count(*) from x) = 1, 'y lo devuelve');
reset role;
delete from colegio_cartillas where cartilla_id = 'mate-1';
set role authenticated;
select pg_temp.soy('00000000-0000-0000-0000-0000000000a3');
select pg_temp.verificar((select not con_cifras and ninos is null from cifras_grupos() where grupo_id = pg_temp.v('grupo1')::uuid), '5 niños pero 3 con autorización: sin cifras');
select pg_temp.soy('00000000-0000-0000-0000-0000000000a1');
update estudiantes set autorizacion = hoy_co() where autorizacion is null;
select pg_temp.soy('00000000-0000-0000-0000-0000000000a3');
select pg_temp.verificar((select con_cifras and ninos = 5 and autorizaciones = 5 and practicaron_semana = 2 and (estrellas->>'colaborar')::int = 45 from cifras_grupos()), 'cifras sumadas con 5 autorizados');
select pg_temp.verificar((select (plan->'ingles-3/colores'->>'estado') = 'en-curso' and (incidencias->>'sin-sonido')::int = 1 from cifras_grupos()), 'plan e incidencias del grupo');
select pg_temp.verificar((select count(*) from incidencias) = 1 and (select count(*) from planes_tema) = 1, 'coordinador lee incidencias y planes');
-- Crea un grupo para Docente Tres y renueva su código.
select pg_temp.debe_fallar(format('select crear_grupo(%L, %L, %L)', 'X', '3', '00000000-0000-0000-0000-0000000000a5'), 'no asigna un docente que no llegó por invitación');
select pg_temp.debe_fallar(format('select crear_grupo(%L, %L, %L)', 'X', '3', '00000000-0000-0000-0000-0000000000a3'), 'el coordinador no se asigna grupos a sí mismo');
select pg_temp.debe_fallar($$insert into perfiles (id, colegio_id, rol, nombre) values ('00000000-0000-0000-0000-0000000000b8', '10000000-0000-0000-0000-000000000001', 'docente', 'Yo')$$, 'el coordinador no crea perfiles');
with g as (select * from crear_grupo('Tercero B', '3', '00000000-0000-0000-0000-0000000000a1')) insert into t select 'grupo3', id::text from g union all select 'codigo3_api', coalesce(codigo, 'sin código') from g;
select pg_temp.verificar(pg_temp.v('codigo3_api') = 'sin código', 'crear_grupo no devuelve el código al coordinador');
select pg_temp.verificar((select docente_id from grupos where id = pg_temp.v('grupo3')::uuid) = '00000000-0000-0000-0000-0000000000a1', 'coordinador asigna un docente invitado de su colegio');
select pg_temp.debe_fallar(format('update grupos set docente_id = %L where id = %L', '00000000-0000-0000-0000-0000000000a5', pg_temp.v('grupo3')), 'no pasa un grupo a un docente sin invitación');
select pg_temp.verificar((select not con_cifras and ninos is null from cifras_grupos() where grupo_id = pg_temp.v('grupo3')::uuid), 'grupo de menos de 5: sin cifras');
select pg_temp.debe_fallar(format('select crear_grupo(%L, %L, %L)', 'X', '3', '00000000-0000-0000-0000-0000000000a2'), 'no asigna un docente de otro colegio');
select pg_temp.debe_fallar(format('update grupos set docente_id = %L where id = %L', '00000000-0000-0000-0000-0000000000a2', pg_temp.v('grupo3')), 'no pasa un grupo a un docente de otro colegio');
select pg_temp.verificar(renovar_codigo(pg_temp.v('grupo1')::uuid) is null, 'coordinador renueva el código sin verlo');
select pg_temp.verificar(pg_temp.mensaje($$select invitar('dos@x.co', 'X', 'docente')$$) like 'No se pudo invitar%', 'correo con cuenta en otro colegio: mensaje genérico');
select pg_temp.verificar(pg_temp.mensaje($$select invitar('profe@x.co', 'Otra', 'docente')$$) like 'No se pudo invitar%', 'no sobrescribe una invitación del dueño');
select pg_temp.verificar(pg_temp.mensaje($$select invitar('jefe@x.co', 'Jefe', 'docente')$$) like 'No se pudo invitar%', 'no degrada a docente una invitación de coordinador');
with x as (delete from invitaciones where correo = 'profe@x.co' returning 1) select pg_temp.verificar((select count(*) from x) = 0, 'no borra una invitación del dueño');
-- Invita a una docente; no puede invitar coordinadores.
select invitar('Nueva@X.co ', 'Docente Nueva', 'docente');
select pg_temp.debe_fallar($$select invitar('otro@x.co', 'Otro', 'coordinador')$$, 'coordinador no invita coordinadores');
select pg_temp.debe_fallar($$select invitar('uno@x.co', 'Repetido', 'docente')$$, 'no invita un correo que ya tiene cuenta');
select pg_temp.verificar((select count(*) from invitaciones where aceptada is null) = 2, 'coordinador ve las invitaciones de docente pendientes de su colegio');
-- Desactiva a Docente Tres.
update perfiles set activo = false where id = '00000000-0000-0000-0000-0000000000a5';
select pg_temp.debe_fallar($$update perfiles set rol = 'coordinador' where id = '00000000-0000-0000-0000-0000000000a5'$$, 'el rol no se cambia desde el navegador');

-- ------------------------------------------- Coordinador del colegio dos
select pg_temp.soy('00000000-0000-0000-0000-0000000000a4');
select pg_temp.verificar((select count(*) from cifras_grupos()) = 0 and (select count(*) from invitaciones where colegio_id <> '10000000-0000-0000-0000-000000000002') = 0, 'coordinador de otro colegio no ve cifras ni invitaciones ajenas');
select pg_temp.verificar(pg_temp.mensaje($$select invitar('nueva@x.co', 'Robo', 'docente')$$) like 'No se pudo invitar%', 'no se apropia de la invitación de otro colegio (mensaje genérico)');
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
select pg_temp.soy('00000000-0000-0000-0000-0000000000a3');
update grupos set docente_id = '00000000-0000-0000-0000-0000000000c1' where id = pg_temp.v('grupo3')::uuid;
select pg_temp.verificar((select count(*) from cambios_docente) = 1, 'el cambio de docente queda registrado');
select pg_temp.debe_fallar('delete from cambios_docente', 'el registro de cambios no se borra');
select pg_temp.soy('00000000-0000-0000-0000-0000000000a1');
select pg_temp.verificar((select count(*) from cambios_docente where docente_anterior = auth.uid() and docente_nuevo = '00000000-0000-0000-0000-0000000000c1') = 1, 'el docente anterior ve el cambio');
select pg_temp.soy('00000000-0000-0000-0000-0000000000a2');
select pg_temp.verificar((select count(*) from cambios_docente) = 0, 'otro docente no ve el cambio');
select pg_temp.soy('00000000-0000-0000-0000-0000000000b1');
select pg_temp.verificar(aceptar_invitacion() is null and mi_rol() is null, 'una sesión anónima no recibe rol');

-- ------------------------------------------- Dueño
select pg_temp.soy('00000000-0000-0000-0000-0000000000d0');
select pg_temp.verificar((select count(*) from colegios) = 2, 'el dueño ve todos los colegios');
select pg_temp.verificar((select count(*) from estudiantes) + (select count(*) from estrellas) + (select count(*) from resultados_prueba) = 0, 'el dueño no lee filas de niños');
select pg_temp.verificar((select count(*) from cifras_grupos('10000000-0000-0000-0000-000000000001')) = 2, 'el dueño ve cifras sumadas de un colegio');
update colegios set convenio = 'Convenio 2027' where id = '10000000-0000-0000-0000-000000000001';
select pg_temp.verificar((select count(*) from cambios_docente) = 1, 'el dueño ve el registro de cambios');
select pg_temp.debe_fallar('select codigo from grupos', 'el dueño no lee grupos.codigo');
select invitar('coord3@x.co', 'Coordinadora Tres', 'coordinador', '10000000-0000-0000-0000-000000000002');
select pg_temp.soy('00000000-0000-0000-0000-0000000000a4');
select pg_temp.verificar((select count(*) from colegio_cartillas) = 0, 'el colegio dos no ve versiones del uno');
select pg_temp.debe_fallar($$insert into cartillas (id, titulo) values ('x', 'X')$$, 'solo el dueño publica cartillas');
select pg_temp.soy('00000000-0000-0000-0000-0000000000a1');
select pg_temp.verificar((select count(*) from colegio_cartillas) = 1 and (select convenio from colegios) = 'Convenio 2027', 'el docente ve la versión y el convenio de su colegio');
-- El docente retira a un niño: se borra todo lo suyo.
delete from estudiantes where id = pg_temp.v('ana')::uuid;
select pg_temp.verificar((select count(*) from estudiantes) = 4, 'el docente retira a un niño');

-- Cartilla no habilitada: un niño del colegio dos no registra misiones.
select pg_temp.soy('00000000-0000-0000-0000-0000000000a2');
insert into t select 'grupo2', (crear_grupo('Tercero Dos', '3')).id::text;
insert into t select 'codigo2', codigo from mis_codigos();
insert into t select 'pepa', crear_estudiante(pg_temp.v('grupo2')::uuid, 'Pepa', '777', 'mika')::text;
update estudiantes set autorizacion = hoy_co();
select pg_temp.soy('00000000-0000-0000-0000-0000000000b8');
select pg_temp.verificar(entrar_estudiante(pg_temp.v('codigo2'), pg_temp.v('pepa')::uuid, '777') = 'ok', 'Pepa entra');
select pg_temp.verificar(pg_temp.mensaje(format('select registrar_mision(%L, %L, %L, 0)', pg_temp.v('pepa'), 'ingles-3', 'bosque-school')) like '%no es de una cartilla habilitada%', 'sin cartilla habilitada en el colegio no se registran misiones');

-- Gancho de Auth: solo cuentas anónimas o con invitación vigente.
select pg_temp.debe_fallar($$select antes_de_crear_usuario('{"user": {"email": "x@y.co"}}')$$, 'el navegador no ejecuta el gancho de Auth');
reset role;
set role supabase_auth_admin;
select pg_temp.verificar(antes_de_crear_usuario('{"user": {"email": "", "is_anonymous": true}}') = '{}', 'el gancho deja crear sesiones anónimas');
select pg_temp.verificar(antes_de_crear_usuario('{"user": {"email": "Coord3@x.co", "is_anonymous": false}}') = '{}', 'el gancho deja crear a quien tiene invitación');
select pg_temp.verificar((antes_de_crear_usuario('{"user": {"email": "intruso@x.co", "is_anonymous": false}}') -> 'error' ->> 'http_code') = '403', 'el gancho rechaza correos sin invitación');
reset role;
set role authenticated;

-- ------------------------------------------- Sin sesión (anon)
reset role;
select pg_temp.verificar((select count(*) from estrellas where estudiante_id = pg_temp.v('ana')::uuid) + (select count(*) from resultados_prueba) = 0, 'retirar borra estrellas y prueba del niño');
set role anon;
select pg_temp.debe_fallar('select * from grupos', 'visitante sin sesión no lee tablas');
select pg_temp.debe_fallar('select * from cartillas', 'visitante sin sesión no lee cartillas');
select pg_temp.debe_fallar($$select * from lista_grupo('AAAAA')$$, 'visitante sin sesión no ejecuta funciones');
reset role;
-- Multicartilla: cada grupo tiene su cartilla (inglés 3 por defecto) y debe existir.
select pg_temp.verificar((select count(*) from grupos where cartilla_id = 'ingles-3') = (select count(*) from grupos), 'todos los grupos quedan con inglés 3');
select pg_temp.verificar((select publicada from cartillas where id = 'ingles-3'), 'inglés 3 está publicada');
select pg_temp.debe_fallar($$update grupos set cartilla_id = 'no-existe'$$, 'un grupo no apunta a una cartilla que no existe');
\echo TODAS LAS PRUEBAS PASARON
