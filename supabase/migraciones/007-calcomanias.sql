-- 007: Mission Stars se reemplaza por calcomanías (24 nov 2026). Cada conducta da una
-- calcomanía de su tipo (mano, bandera, voz, equipo, goma, espejo); ya no valen 10 o 15 puntos.
-- Lo ya otorgado se convierte en una calcomanía por registro. No se borra nada.
create or replace function public.valor_estrellas(motivo text) returns int
language sql immutable as
$$
  select case when motivo in ('participar','completar','pronunciar','colaborar','mejorar','autoevaluar') then 1 end
$$;

update public.estrellas set cantidad = 1 where cantidad <> 1;
