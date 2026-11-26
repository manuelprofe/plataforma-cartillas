-- 008: identidad de cada colegio en sus impresos (25 nov 2026). El escudo y dos colores salen en
-- las planeaciones y demás hojas del docente; el modo estudiante conserva la del Cuaderno de Goma.
-- El escudo se guarda como imagen PNG pequeña (data URL, 240 px máximo, redimensionada en el
-- navegador), así cabe en el Word que se descarga sin un depósito de archivos aparte.
-- Los pone el dueño al crear el colegio; el coordinador también los puede cambiar.
-- Idempotente: se puede correr dos veces.

alter table public.colegios add column if not exists escudo text;
alter table public.colegios add column if not exists color_1 text;
alter table public.colegios add column if not exists color_2 text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'colegios_escudo_png') then
    alter table public.colegios add constraint colegios_escudo_png
      check (escudo is null or (escudo like 'data:image/png;base64,%' and char_length(escudo) <= 200000));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'colegios_colores_hex') then
    alter table public.colegios add constraint colegios_colores_hex
      check ((color_1 is null or color_1 ~ '^#[0-9a-f]{6}$') and (color_2 is null or color_2 ~ '^#[0-9a-f]{6}$'));
  end if;
end $$;

-- El dueño ya puede escribir en colegios; el coordinador solo cambia la identidad del suyo.
create or replace function public.identidad_colegio(p_colegio uuid, p_escudo text, p_color_1 text, p_color_2 text)
returns void
language plpgsql security definer set search_path = public as
$$
begin
  if not (mi_rol() = 'dueno' or (mi_rol() = 'coordinador' and p_colegio = mi_colegio())) then
    raise exception 'No puedes cambiar la identidad de este colegio';
  end if;
  update colegios
    set escudo = p_escudo, color_1 = lower(p_color_1), color_2 = lower(p_color_2)
    where id = p_colegio;
end
$$;

revoke all on function public.identidad_colegio(uuid, text, text, text) from public, anon;
grant execute on function public.identidad_colegio(uuid, text, text, text) to authenticated;
