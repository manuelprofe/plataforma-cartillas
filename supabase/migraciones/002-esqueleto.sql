-- Migración 002: esqueleto de la plataforma (tanda 2 de docs/diseno/esqueleto.md §8).
-- Se aplica sobre supabase/esquema.sql ya ejecutado. Se pega completa en el editor SQL de
-- Supabase y se ejecuta una vez; volver a ejecutarla no daña nada (es idempotente).
--
-- Qué hace:
--  1. Corrige los dos riesgos de docs/pedagogia/ronda-2-docente.md §4.5:
--     - Solo el docente del grupo lee y borra filas de cada niño. El coordinador y el dueño ven
--       cifras sumadas por grupo (cifras_grupos), sin cifras en grupos de menos de 5 niños.
--     - lista_grupo admite 10 códigos errados por hora y por aparato (sesión anónima) y solo
--       muestra a los niños con autorización recibida.
--  2. Agrega lo que el esqueleto §7 marca como "Falta" para las tandas 2 a 7: varios perfiles
--     por aparato, plan del tema por grupo, autorización y fecha, perfiles.activo, invitaciones,
--     resultados de prueba (solo el docente del grupo), estrellas con identificador de acción y
--     a varios niños, registro del piloto (cotejo, incidencias, encuesta en conteos), versiones
--     de cartilla por colegio, colegios.convenio y días de práctica.
--  3. Fechas sin hora en los datos del niño (día de Colombia).
--
-- Datos mínimos (Ley 1581 de 2012): no se agrega ningún dato del niño fuera de los de
-- docs/pedagogia/catalogo-interfaces.md §7. Nada de correo, apellidos ni hora de juego.

begin;

-- ------------------------------------------------------------ Utilidades

-- El día en Colombia: los datos del niño guardan fecha, nunca hora.
create or replace function public.hoy_co() returns date
language sql stable as
$$ select (now() at time zone 'America/Bogota')::date $$;

-- Un objeto JSON cuyos valores son todos enteros >= 0 (encuesta en conteos).
create or replace function public.son_conteos(j jsonb) returns boolean
language sql immutable as
$$
  select jsonb_typeof(j) = 'object'
     and not exists (
       select 1 from jsonb_each(j) as c(k, v)
       where jsonb_typeof(v) <> 'number' or v::text !~ '^[0-9]{1,6}$'
     )
$$;

-- Código de grupo de 5 caracteres sin letras que se confundan, con azar criptográfico.
create or replace function public.nuevo_codigo() returns text
language plpgsql volatile security definer set search_path = public, extensions as
$$
declare
  letras constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  cod text;
begin
  loop
    select string_agg(substr(letras, 1 + get_byte(b, i) % length(letras), 1), '')
      into cod
      from (select gen_random_bytes(5) as b) x, generate_series(0, 4) as i;
    exit when not exists (select 1 from grupos where codigo = cod);
  end loop;
  return cod;
end
$$;

-- ----------------------------------------------------- Columnas nuevas

alter table public.colegios add column if not exists convenio text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'colegios_convenio_largo') then
    alter table public.colegios add constraint colegios_convenio_largo check (char_length(convenio) <= 200);
  end if;
end $$;

-- Desactivar a un docente le quita todo acceso sin borrar sus grupos.
alter table public.perfiles add column if not exists activo boolean not null default true;
-- Correo del adulto, para que el coordinador vea a sus docentes (auth.users no se lee desde el navegador).
alter table public.perfiles add column if not exists correo text;

-- Fecha en que el docente recibió la autorización firmada; null = no recibida. El papel se
-- queda en el colegio. Sin autorización el niño no entra con cuenta (juega sin cuenta).
alter table public.estudiantes add column if not exists autorizacion date;

-- El personaje lo pone el docente desde los héroes del paquete (esqueleto §9, pregunta 1).
-- Sin valor por defecto: 'lumi' no era un personaje elegible.
alter table public.estudiantes alter column avatar drop default;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'estudiantes_avatar_formato') then
    alter table public.estudiantes add constraint estudiantes_avatar_formato check (avatar ~ '^[a-z0-9-]{1,30}$');
  end if;
end $$;

-- Fechas sin hora para todo lo del niño.
alter table public.estudiantes
  alter column creado type date using creado::date,
  alter column creado set default public.hoy_co();
alter table public.sesiones_estudiante
  alter column creado type date using creado::date,
  alter column creado set default public.hoy_co();
alter table public.progreso_misiones
  alter column actualizado type date using actualizado::date,
  alter column actualizado set default public.hoy_co();
alter table public.estrellas
  alter column creado type date using creado::date,
  alter column creado set default public.hoy_co();

-- Identificador de la acción del docente: reintentar sin red no da doble estrella.
alter table public.estrellas add column if not exists accion uuid;
create unique index if not exists estrellas_accion on public.estrellas (accion, estudiante_id) where accion is not null;
create index if not exists estrellas_mision on public.estrellas (estudiante_id, cartilla_id, mision_id, motivo);

-- Varios perfiles por aparato: una sesión anónima puede tener a varios niños (hermanos).
do $$ begin
  if (select array_length(conkey, 1) from pg_constraint
      where conrelid = 'public.sesiones_estudiante'::regclass and contype = 'p') = 1 then
    alter table public.sesiones_estudiante drop constraint sesiones_estudiante_pkey;
    alter table public.sesiones_estudiante add constraint sesiones_estudiante_pkey primary key (usuario_id, estudiante_id);
  end if;
end $$;

-- ------------------------------------------------------- Tablas nuevas

-- Días en que el niño practicó (solo la fecha).
create table if not exists public.dias_practica (
  estudiante_id uuid not null references public.estudiantes (id) on delete cascade,
  fecha date not null default public.hoy_co(),
  primary key (estudiante_id, fecha)
);

-- Códigos de grupo errados por aparato (sesión anónima), para lista_grupo. Nadie lo lee.
create table if not exists public.intentos_codigo (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  fallidos int not null default 0,
  desde timestamptz not null default now()
);

-- Invitación a un adulto. Al entrar con el enlace del correo, aceptar_invitacion() crea su perfil.
create table if not exists public.invitaciones (
  id uuid primary key default gen_random_uuid(),
  correo text not null check (correo = lower(trim(correo)) and correo ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  nombre text not null check (char_length(nombre) between 1 and 80),
  rol text not null check (rol in ('coordinador', 'docente')),
  colegio_id uuid not null references public.colegios (id) on delete cascade,
  invitada_por uuid references public.perfiles (id) on delete set null,
  creado timestamptz not null default now(),
  aceptada timestamptz
);
create unique index if not exists invitaciones_pendiente on public.invitaciones (correo) where aceptada is null;

-- Plan del tema por grupo: fechas de las dos clases, estado y lo que el docente ajustó del
-- planeador sugerido (por id de material del paquete; el sugerido nunca se pierde).
create table if not exists public.planes_tema (
  grupo_id uuid not null references public.grupos (id) on delete cascade,
  cartilla_id text not null,
  tema_id text not null,
  clase1 date,
  clase2 date,
  estado text not null default 'por-hacer' check (estado in ('por-hacer', 'en-curso', 'hecho')),
  ajustes jsonb not null default '{}' check (jsonb_typeof(ajustes) = 'object'),
  actualizado timestamptz not null default now(),
  primary key (grupo_id, cartilla_id, tema_id)
);

-- Resultado de una prueba por niño. prueba_id es el tema del paquete (6 aciertos, 3 intentos)
-- o 'entrada' / 'salida' del piloto (10 y 5). Solo lo lee el docente del grupo.
create table if not exists public.resultados_prueba (
  estudiante_id uuid not null references public.estudiantes (id) on delete cascade,
  cartilla_id text not null,
  prueba_id text not null,
  aciertos smallint not null check (aciertos between 0 and 10),
  intentos smallint not null check (intentos between 0 and 5),
  fecha date not null default public.hoy_co(),
  primary key (estudiante_id, cartilla_id, prueba_id)
);

-- Palabras que más costaron en la prueba, por grupo. Solo el docente del grupo.
create table if not exists public.pruebas_grupo (
  grupo_id uuid not null references public.grupos (id) on delete cascade,
  cartilla_id text not null,
  prueba_id text not null,
  palabras text[] not null default '{}' check (cardinality(palabras) <= 20),
  fecha date not null default public.hoy_co(),
  primary key (grupo_id, cartilla_id, prueba_id)
);

-- Lista de cotejo semanal por niño. Las casillas las define la plantilla del paquete
-- (hoy: participa, pide repetir, ayuda a un compañero). Solo el docente del grupo.
create table if not exists public.cotejo (
  estudiante_id uuid not null references public.estudiantes (id) on delete cascade,
  semana date not null check (extract(isodow from semana) = 1),
  marcas jsonb not null default '{}' check (jsonb_typeof(marcas) = 'object'),
  primary key (estudiante_id, semana)
);

-- Incidencias del aula, de un toque. accion la genera el aparato: reintentar no duplica.
create table if not exists public.incidencias (
  accion uuid primary key,
  grupo_id uuid not null references public.grupos (id) on delete cascade,
  fecha date not null default public.hoy_co(),
  tipo text not null check (tipo in ('sin-proyector', 'sin-sonido', 'sin-red', 'sin-aula')),
  registrada_por uuid references public.perfiles (id) on delete set null
);
create index if not exists incidencias_grupo on public.incidencias (grupo_id);

-- Encuesta de acceso de las familias, solo en conteos por grupo (antes y después del piloto).
create table if not exists public.encuestas_acceso (
  grupo_id uuid not null references public.grupos (id) on delete cascade,
  momento text not null check (momento in ('antes', 'despues')),
  conteos jsonb not null default '{}' check (public.son_conteos(conteos)),
  fecha date not null default public.hoy_co(),
  primary key (grupo_id, momento)
);

-- Cartillas, sus versiones publicadas y la versión que usa cada colegio.
create table if not exists public.cartillas (
  id text primary key check (id ~ '^[a-z0-9-]{1,40}$'),
  titulo text not null,
  materia text,
  grado text
);
create table if not exists public.cartilla_versiones (
  cartilla_id text not null references public.cartillas (id) on delete cascade,
  version text not null,
  publicada timestamptz not null default now(),
  notas text,
  primary key (cartilla_id, version)
);
create table if not exists public.colegio_cartillas (
  colegio_id uuid not null references public.colegios (id) on delete cascade,
  cartilla_id text not null,
  version text not null,
  primary key (colegio_id, cartilla_id),
  foreign key (cartilla_id, version) references public.cartilla_versiones (cartilla_id, version)
);

-- ---------------------------------------------------- Funciones de apoyo

-- Un adulto desactivado no tiene rol ni colegio: todas las políticas lo dejan fuera.
create or replace function public.mi_rol() returns text
language sql stable security definer set search_path = public as
$$ select rol from perfiles where id = auth.uid() and activo $$;

create or replace function public.mi_colegio() returns uuid
language sql stable security definer set search_path = public as
$$ select colegio_id from perfiles where id = auth.uid() and activo $$;

-- ¿Es quien consulta el docente (activo) de este grupo? Solo él ve filas de niños.
create or replace function public.soy_docente_de(g uuid) returns boolean
language sql stable security definer set search_path = public as
$$
  select mi_rol() = 'docente'
     and exists (select 1 from grupos where id = g and docente_id = auth.uid())
$$;

create or replace function public.soy_docente_del_estudiante(e uuid) returns boolean
language sql stable security definer set search_path = public as
$$
  select mi_rol() = 'docente'
     and exists (
       select 1 from estudiantes x join grupos g on g.id = x.grupo_id
       where x.id = e and g.docente_id = auth.uid()
     )
$$;

-- Grupos que ve un adulto activo: los suyos (docente), los de su colegio (coordinador), todos (dueño).
create or replace function public.puedo_ver_grupo(g uuid) returns boolean
language sql stable security definer set search_path = public as
$$
  select exists (
    select 1 from grupos
    where id = g
      and (
        (docente_id = auth.uid() and mi_rol() = 'docente')
        or (mi_rol() = 'coordinador' and colegio_id = mi_colegio())
        or mi_rol() = 'dueno'
      )
  )
$$;

-- ¿Este niño entró en este aparato?
create or replace function public.es_mio(e uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from sesiones_estudiante where usuario_id = auth.uid() and estudiante_id = e) $$;

-- Filas de un niño: él mismo (en un aparato donde entró) y su docente. Nadie más.
create or replace function public.puedo_ver_estudiante(e uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select es_mio(e) or soy_docente_del_estudiante(e) $$;

-- Un aparato puede tener varios niños: ya no hay "el" estudiante de la sesión.
drop function if exists public.mi_estudiante();

-- ¿d es un docente activo del colegio c?
create or replace function public.docente_del_colegio(d uuid, c uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from perfiles where id = d and colegio_id = c and rol = 'docente' and activo) $$;

-- ------------------------------------------------- Seguridad por filas

alter table public.dias_practica enable row level security;
alter table public.intentos_codigo enable row level security;
alter table public.invitaciones enable row level security;
alter table public.planes_tema enable row level security;
alter table public.resultados_prueba enable row level security;
alter table public.pruebas_grupo enable row level security;
alter table public.cotejo enable row level security;
alter table public.incidencias enable row level security;
alter table public.encuestas_acceso enable row level security;
alter table public.cartillas enable row level security;
alter table public.cartilla_versiones enable row level security;
alter table public.colegio_cartillas enable row level security;

-- Grupos: los ven su docente, el coordinador del colegio y el dueño. Se crean con
-- crear_grupo(); solo su docente los borra (borrar un grupo borra a sus niños).
drop policy if exists grupos_crear on public.grupos;
drop policy if exists grupos_editar on public.grupos;
drop policy if exists grupos_borrar on public.grupos;
create policy grupos_editar on public.grupos for update to authenticated
  using (soy_docente_de(id) or (mi_rol() = 'coordinador' and colegio_id = mi_colegio()))
  with check (
    colegio_id = mi_colegio()
    and docente_del_colegio(docente_id, colegio_id)
    and (docente_id = auth.uid() or mi_rol() = 'coordinador')
  );
create policy grupos_borrar on public.grupos for delete to authenticated
  using (soy_docente_de(id));

-- Niños: solo su docente los edita o retira. El coordinador ya no ve ni borra filas.
drop policy if exists estudiantes_editar on public.estudiantes;
drop policy if exists estudiantes_borrar on public.estudiantes;
create policy estudiantes_editar on public.estudiantes for update to authenticated
  using (soy_docente_de(grupo_id)) with check (soy_docente_de(grupo_id));
create policy estudiantes_borrar on public.estudiantes for delete to authenticated
  using (soy_docente_de(grupo_id));
-- estudiantes_ver, progreso_ver y estrellas_ver siguen con puedo_ver_estudiante (ya corregida).

drop policy if exists dias_ver on public.dias_practica;
create policy dias_ver on public.dias_practica for select to authenticated
  using (puedo_ver_estudiante(estudiante_id));

drop policy if exists invitaciones_ver on public.invitaciones;
create policy invitaciones_ver on public.invitaciones for select to authenticated
  using (mi_rol() = 'dueno' or (mi_rol() = 'coordinador' and colegio_id = mi_colegio() and rol = 'docente'));
drop policy if exists invitaciones_borrar on public.invitaciones;
create policy invitaciones_borrar on public.invitaciones for delete to authenticated
  using (aceptada is null and (mi_rol() = 'dueno' or (mi_rol() = 'coordinador' and colegio_id = mi_colegio() and rol = 'docente')));

-- Plan del tema: dato del docente; lo leen él, su coordinador y el dueño.
drop policy if exists planes_ver on public.planes_tema;
drop policy if exists planes_escribir on public.planes_tema;
create policy planes_ver on public.planes_tema for select to authenticated
  using (puedo_ver_grupo(grupo_id));
create policy planes_escribir on public.planes_tema for all to authenticated
  using (soy_docente_de(grupo_id)) with check (soy_docente_de(grupo_id));

-- Prueba y cotejo: solo el docente del grupo (ni coordinador, ni dueño, ni el niño).
drop policy if exists resultados_docente on public.resultados_prueba;
create policy resultados_docente on public.resultados_prueba for all to authenticated
  using (soy_docente_del_estudiante(estudiante_id)) with check (soy_docente_del_estudiante(estudiante_id));
drop policy if exists pruebas_grupo_docente on public.pruebas_grupo;
create policy pruebas_grupo_docente on public.pruebas_grupo for all to authenticated
  using (soy_docente_de(grupo_id)) with check (soy_docente_de(grupo_id));
drop policy if exists cotejo_docente on public.cotejo;
create policy cotejo_docente on public.cotejo for all to authenticated
  using (soy_docente_del_estudiante(estudiante_id)) with check (soy_docente_del_estudiante(estudiante_id));

-- Incidencias y encuesta: datos del grupo, sin niños. El coordinador las lee.
drop policy if exists incidencias_ver on public.incidencias;
drop policy if exists incidencias_crear on public.incidencias;
drop policy if exists incidencias_borrar on public.incidencias;
create policy incidencias_ver on public.incidencias for select to authenticated
  using (puedo_ver_grupo(grupo_id));
create policy incidencias_crear on public.incidencias for insert to authenticated
  with check (soy_docente_de(grupo_id) and registrada_por = auth.uid());
create policy incidencias_borrar on public.incidencias for delete to authenticated
  using (soy_docente_de(grupo_id));
drop policy if exists encuestas_ver on public.encuestas_acceso;
drop policy if exists encuestas_escribir on public.encuestas_acceso;
create policy encuestas_ver on public.encuestas_acceso for select to authenticated
  using (puedo_ver_grupo(grupo_id));
create policy encuestas_escribir on public.encuestas_acceso for all to authenticated
  using (soy_docente_de(grupo_id)) with check (soy_docente_de(grupo_id));

-- Cartillas: las lee cualquier sesión; solo el dueño publica y habilita.
drop policy if exists cartillas_ver on public.cartillas;
drop policy if exists cartillas_dueno on public.cartillas;
create policy cartillas_ver on public.cartillas for select to authenticated using (true);
create policy cartillas_dueno on public.cartillas for all to authenticated
  using (mi_rol() = 'dueno') with check (mi_rol() = 'dueno');
drop policy if exists versiones_ver on public.cartilla_versiones;
drop policy if exists versiones_dueno on public.cartilla_versiones;
create policy versiones_ver on public.cartilla_versiones for select to authenticated using (true);
create policy versiones_dueno on public.cartilla_versiones for all to authenticated
  using (mi_rol() = 'dueno') with check (mi_rol() = 'dueno');
drop policy if exists colegio_cartillas_ver on public.colegio_cartillas;
drop policy if exists colegio_cartillas_dueno on public.colegio_cartillas;
create policy colegio_cartillas_ver on public.colegio_cartillas for select to authenticated
  using (colegio_id = mi_colegio() or mi_rol() = 'dueno');
create policy colegio_cartillas_dueno on public.colegio_cartillas for all to authenticated
  using (mi_rol() = 'dueno') with check (mi_rol() = 'dueno');

-- -------------------------------------------- Cuentas de adultos

-- Invita a un adulto. El dueño invita coordinadores (y docentes); el coordinador, docentes de
-- su colegio. Después la app pide a Supabase Auth el correo con el enlace (/auth/v1/otp).
-- Volver a invitar el mismo correo renueva la invitación pendiente.
create or replace function public.invitar(p_correo text, p_nombre text, p_rol text, p_colegio uuid default null)
returns uuid
language plpgsql security definer set search_path = public as
$$
declare
  cor text := lower(trim(p_correo));
  col uuid := coalesce(p_colegio, mi_colegio());
  previa invitaciones;
  nueva uuid;
begin
  if mi_rol() = 'dueno' then
    if p_rol not in ('coordinador', 'docente') or col is null then
      raise exception 'Falta el colegio o el rol de la invitación';
    end if;
  elsif mi_rol() = 'coordinador' then
    if p_rol <> 'docente' or col <> mi_colegio() then
      raise exception 'El coordinador invita docentes de su colegio';
    end if;
  else
    raise exception 'No puede invitar adultos';
  end if;
  if exists (select 1 from perfiles where lower(correo) = cor) then
    raise exception 'Ese correo ya tiene cuenta';
  end if;
  select * into previa from invitaciones where correo = cor and aceptada is null for update;
  if found then
    if previa.colegio_id <> col and mi_rol() <> 'dueno' then
      raise exception 'Ese correo tiene una invitación de otro colegio';
    end if;
    update invitaciones
      set nombre = trim(p_nombre), rol = p_rol, colegio_id = col, invitada_por = auth.uid(), creado = now()
      where id = previa.id;
    return previa.id;
  end if;
  insert into invitaciones (correo, nombre, rol, colegio_id, invitada_por)
    values (cor, trim(p_nombre), p_rol, col, auth.uid())
    returning id into nueva;
  return nueva;
end
$$;

-- Quien entra con el enlace del correo (correo confirmado) y tiene una invitación vigente
-- (14 días) recibe su perfil. Devuelve el rol, o null si no hay invitación ni perfil activo.
create or replace function public.aceptar_invitacion() returns text
language plpgsql security definer set search_path = public as
$$
declare
  usuario record;
  inv invitaciones;
begin
  if exists (select 1 from perfiles where id = auth.uid()) then
    return mi_rol();
  end if;
  select id, email, email_confirmed_at into usuario from auth.users where id = auth.uid();
  if usuario.email is null or usuario.email_confirmed_at is null then
    return null;
  end if;
  select * into inv from invitaciones
    where correo = lower(usuario.email) and aceptada is null and creado > now() - interval '14 days'
    for update;
  if not found then
    return null;
  end if;
  insert into perfiles (id, colegio_id, rol, nombre, correo)
    values (usuario.id, inv.colegio_id, inv.rol, inv.nombre, lower(usuario.email));
  update invitaciones set aceptada = now() where id = inv.id;
  return inv.rol;
end
$$;

create or replace function public.cambiar_mi_nombre(p_nombre text) returns void
language plpgsql security definer set search_path = public as
$$
begin
  if mi_rol() is null or char_length(trim(p_nombre)) not between 1 and 80 then
    raise exception 'Nombre no válido';
  end if;
  update perfiles set nombre = trim(p_nombre) where id = auth.uid();
end
$$;

-- ------------------------------------------------ Acciones del docente

-- Crea un grupo. El docente lo crea para sí; el coordinador puede asignarlo a un docente
-- de su colegio (licencias, reemplazos).
drop function if exists public.crear_grupo(text, text);
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
  elsif mi_rol() = 'coordinador' and docente_del_colegio(doc, mi_colegio()) then
    null;
  else
    raise exception 'Solo un docente, o el coordinador para un docente de su colegio, crea grupos';
  end if;
  insert into grupos (colegio_id, docente_id, nombre, grado, codigo)
    values (mi_colegio(), doc, trim(p_nombre), trim(p_grado), nuevo_codigo())
    returning * into nuevo;
  return nuevo;
end
$$;

-- Código nuevo si el anterior se difundió. Los niños que ya entraron siguen dentro.
create or replace function public.renovar_codigo(p_grupo uuid) returns text
language plpgsql security definer set search_path = public as
$$
declare
  cod text;
begin
  if not (soy_docente_de(p_grupo)
          or (mi_rol() = 'coordinador' and exists (select 1 from grupos where id = p_grupo and colegio_id = mi_colegio()))) then
    raise exception 'No tienes acceso a este grupo';
  end if;
  cod := nuevo_codigo();
  update grupos set codigo = cod where id = p_grupo;
  return cod;
end
$$;

-- Agrega un niño con su apodo, su personaje (id de un héroe del paquete) y su PIN.
drop function if exists public.crear_estudiante(uuid, text, text, text);
create or replace function public.crear_estudiante(p_grupo uuid, p_apodo text, p_pin text, p_avatar text)
returns uuid
language plpgsql security definer set search_path = public, extensions as
$$
declare
  nuevo uuid;
begin
  if not soy_docente_de(p_grupo) then
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

create or replace function public.cambiar_pin(p_estudiante uuid, p_pin text) returns void
language plpgsql security definer set search_path = public, extensions as
$$
begin
  if not soy_docente_del_estudiante(p_estudiante) then
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

-- Estrellas del docente a uno o varios niños (colaborar en equipo). p_accion la genera el
-- aparato una vez por toque: si la cola sin red reintenta, no se duplica. 'pronunciar' es
-- respaldo: una vez por misión y por niño. Devuelve cuántas estrellas nuevas se guardaron.
drop function if exists public.dar_estrellas(uuid, text, text);
create or replace function public.dar_estrellas(p_estudiantes uuid[], p_cartilla text, p_motivo text, p_accion uuid, p_mision text default null)
returns int
language plpgsql security definer set search_path = public as
$$
declare
  cant int := valor_estrellas(p_motivo);
  nuevas int;
begin
  if p_motivo not in ('participar', 'colaborar', 'pronunciar') then
    raise exception 'Ese reconocimiento no lo da el docente';
  end if;
  if p_accion is null or cardinality(p_estudiantes) not between 1 and 60 then
    raise exception 'Faltan los niños o el identificador de la acción';
  end if;
  if p_motivo = 'pronunciar' and p_mision is null then
    raise exception 'Pronunciar se da por una misión';
  end if;
  if exists (select 1 from unnest(p_estudiantes) e where not soy_docente_del_estudiante(e)) then
    raise exception 'No tienes acceso a uno de estos estudiantes';
  end if;
  insert into estrellas (estudiante_id, cartilla_id, motivo, cantidad, mision_id, otorgada_por, accion)
    select distinct e, p_cartilla, p_motivo, cant, p_mision, auth.uid(), p_accion
    from unnest(p_estudiantes) e
    where p_motivo <> 'pronunciar'
       or not exists (
         select 1 from estrellas s
         where s.estudiante_id = e and s.cartilla_id = p_cartilla and s.mision_id = p_mision and s.motivo = 'pronunciar'
       )
  on conflict (accion, estudiante_id) where accion is not null do nothing;
  get diagnostics nuevas = row_count;
  return nuevas * cant;
end
$$;

-- --------------------------------------------- Acciones del estudiante

-- Caras del grupo para la pantalla "¿Quién eres?". Solo niños con autorización recibida.
-- Cada aparato (sesión anónima) tiene 10 códigos errados por hora; después responde el
-- error PC429 hasta que pase la hora. Supabase limita además las sesiones anónimas por IP.
drop function if exists public.lista_grupo(text);
create or replace function public.lista_grupo(p_codigo text)
returns table (id uuid, apodo text, avatar text, grupo text)
language plpgsql volatile security definer set search_path = public as
$$
#variable_conflict use_column
declare
  cod text := upper(trim(p_codigo));
  reg intentos_codigo;
  g grupos;
begin
  if auth.uid() is null then
    raise exception 'Falta iniciar la sesión del dispositivo';
  end if;
  select * into reg from intentos_codigo where usuario_id = auth.uid() for update;
  if found and reg.desde > now() - interval '1 hour' and reg.fallidos >= 10 then
    raise exception 'Demasiados códigos errados en este aparato' using errcode = 'PC429';
  end if;
  select * into g from grupos where codigo = cod;
  if not found then
    insert into intentos_codigo as i (usuario_id, fallidos, desde) values (auth.uid(), 1, now())
      on conflict (usuario_id) do update set
        fallidos = case when i.desde > now() - interval '1 hour' then i.fallidos + 1 else 1 end,
        desde = case when i.desde > now() - interval '1 hour' then i.desde else now() end;
    return;
  end if;
  return query
    select e.id, e.apodo, e.avatar, g.nombre
    from estudiantes e
    where e.grupo_id = g.id and e.autorizacion is not null
    order by e.apodo;
end
$$;

-- Entrada del niño en este aparato, sin cerrar a los demás niños que ya entraron en él.
-- Responde 'ok', 'errado', 'descanso' (5 errores: 5 minutos) o 'no-existe'.
drop function if exists public.entrar_estudiante(text, uuid, text);
create or replace function public.entrar_estudiante(p_codigo text, p_estudiante uuid, p_pin text) returns text
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
    where e.id = p_estudiante and g.codigo = upper(trim(p_codigo)) and e.autorizacion is not null
    for update of p;
  if not found then
    return 'no-existe';
  end if;
  if reg.bloqueado_hasta is not null and reg.bloqueado_hasta > now() then
    return 'descanso';
  end if;
  if reg.pin_hash <> crypt(p_pin, reg.pin_hash) then
    update estudiantes_pin
      set intentos_fallidos = case when intentos_fallidos + 1 >= 5 then 0 else intentos_fallidos + 1 end,
          bloqueado_hasta = case when intentos_fallidos + 1 >= 5 then now() + interval '5 minutes' else null end
      where estudiante_id = p_estudiante;
    return case when reg.intentos_fallidos + 1 >= 5 then 'descanso' else 'errado' end;
  end if;
  update estudiantes_pin set intentos_fallidos = 0, bloqueado_hasta = null
    where estudiante_id = p_estudiante;
  insert into sesiones_estudiante (usuario_id, estudiante_id)
    values (auth.uid(), p_estudiante)
    on conflict (usuario_id, estudiante_id) do update set creado = hoy_co();
  return 'ok';
end
$$;

-- "Quitar de este celular" en la zona de la familia: suelta a un niño de este aparato.
create or replace function public.soltar_estudiante(p_estudiante uuid) returns void
language sql security definer set search_path = public as
$$ delete from sesiones_estudiante where usuario_id = auth.uid() and estudiante_id = p_estudiante $$;

-- Registra una misión terminada por un niño de este aparato. Estrellas en el servidor:
-- completar la primera vez, mejorar una sola vez por misión, autoevaluarse la primera vez.
drop function if exists public.registrar_mision(text, text, int, int);
create or replace function public.registrar_mision(p_estudiante uuid, p_cartilla text, p_mision text, p_errores int, p_autoeval int default null)
returns int
language plpgsql security definer set search_path = public as
$$
declare
  previo progreso_misiones;
  ganadas int := 0;
begin
  if not es_mio(p_estudiante) then
    raise exception 'Ese estudiante no entró en este aparato';
  end if;
  if p_errores < 0 or (p_autoeval is not null and p_autoeval not between 1 and 3) then
    raise exception 'Datos de misión no válidos';
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
    ganadas := valor_estrellas('completar');
  else
    if p_errores < previo.mejor_errores and not exists (
      select 1 from estrellas
      where estudiante_id = p_estudiante and cartilla_id = p_cartilla and mision_id = p_mision and motivo = 'mejorar'
    ) then
      insert into estrellas (estudiante_id, cartilla_id, motivo, cantidad, mision_id)
        values (p_estudiante, p_cartilla, 'mejorar', valor_estrellas('mejorar'), p_mision);
      ganadas := valor_estrellas('mejorar');
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
    ganadas := ganadas + valor_estrellas('autoevaluar');
  end if;
  return ganadas;
end
$$;

-- --------------------------------------- Cifras sumadas (coordinador y dueño)

-- Una fila por grupo del colegio, en orden de nombre. Las cifras que salen de los niños
-- (cuántos, autorizaciones, práctica, misiones, estrellas, encuesta) van en null si el grupo
-- tiene menos de 5 niños: así no se identifica a nadie. El plan y las incidencias son del
-- docente y del aula, no de los niños. El dueño pasa el colegio; el coordinador, el suyo.
create or replace function public.cifras_grupos(p_colegio uuid default null)
returns table (
  grupo_id uuid, nombre text, grado text, docente text,
  con_cifras boolean, ninos int, autorizaciones int, practicaron_semana int, practicaron_mes int,
  misiones jsonb, estrellas jsonb, encuesta jsonb, plan jsonb, incidencias jsonb
)
language sql stable security definer set search_path = public as
$$
  with gs as (
    select g.id, g.nombre, g.grado, p.nombre as docente
    from grupos g join perfiles p on p.id = g.docente_id
    where (mi_rol() = 'coordinador' and g.colegio_id = mi_colegio())
       or (mi_rol() = 'dueno' and g.colegio_id = p_colegio)
  ),
  n as (
    select gs.id, count(e.id)::int as total, count(e.autorizacion)::int as aut
    from gs left join estudiantes e on e.grupo_id = gs.id group by gs.id
  )
  select
    gs.id, gs.nombre, gs.grado, gs.docente,
    n.total >= 5,
    case when n.total >= 5 then n.total end,
    case when n.total >= 5 then n.aut end,
    case when n.total >= 5 then (
      select count(distinct d.estudiante_id)::int from dias_practica d join estudiantes e on e.id = d.estudiante_id
      where e.grupo_id = gs.id and d.fecha > hoy_co() - 7) end,
    case when n.total >= 5 then (
      select count(distinct d.estudiante_id)::int from dias_practica d join estudiantes e on e.id = d.estudiante_id
      where e.grupo_id = gs.id and d.fecha > hoy_co() - 30) end,
    case when n.total >= 5 then (
      select coalesce(jsonb_object_agg(m.k, m.c), '{}') from (
        select pm.cartilla_id || '/' || pm.mision_id as k, count(*) as c
        from progreso_misiones pm join estudiantes e on e.id = pm.estudiante_id
        where e.grupo_id = gs.id group by 1) m) end,
    case when n.total >= 5 then (
      select coalesce(jsonb_object_agg(s.motivo, s.c), '{}') from (
        select st.motivo, sum(st.cantidad) as c
        from estrellas st join estudiantes e on e.id = st.estudiante_id
        where e.grupo_id = gs.id group by st.motivo) s) end,
    case when n.total >= 5 then (
      select coalesce(jsonb_object_agg(ea.momento, ea.conteos), '{}') from encuestas_acceso ea where ea.grupo_id = gs.id) end,
    (select coalesce(jsonb_object_agg(pt.cartilla_id || '/' || pt.tema_id,
       jsonb_build_object('estado', pt.estado, 'clase1', pt.clase1, 'clase2', pt.clase2, 'actualizado', pt.actualizado::date)), '{}')
     from planes_tema pt where pt.grupo_id = gs.id),
    (select coalesce(jsonb_object_agg(i.tipo, i.c), '{}') from (
       select tipo, count(*) as c from incidencias where grupo_id = gs.id group by tipo) i)
  from gs join n on n.id = gs.id
  order by gs.nombre
$$;

-- -------------------------------------------------------------- Permisos

revoke all on all tables in schema public from anon;
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
grant select on public.total_estrellas to authenticated;

-- Columnas que se pueden cambiar desde el navegador (lo demás va por funciones).
revoke update on public.grupos, public.estudiantes, public.perfiles from authenticated;
grant update (nombre, grado, docente_id) on public.grupos to authenticated;
grant update (apodo, avatar, autorizacion) on public.estudiantes to authenticated;
grant update (nombre, activo) on public.perfiles to authenticated;

-- Tablas que solo tocan las funciones.
revoke all on public.estudiantes_pin, public.intentos_codigo from authenticated;
revoke insert, update on public.invitaciones from authenticated;
revoke insert, update, delete on public.dias_practica, public.estrellas, public.progreso_misiones,
  public.sesiones_estudiante from authenticated;

commit;
