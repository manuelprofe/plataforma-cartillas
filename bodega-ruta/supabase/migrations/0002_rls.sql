-- Row Level Security. Staff = dueno or coordinador. A courier only sees his own route.

create function rol_actual() returns rol_usuario
language sql stable security definer set search_path = public as
$$ select rol from perfiles where id = auth.uid() and activo $$;

create function es_staff() returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce(rol_actual() in ('dueno', 'coordinador'), false) $$;

create function es_mi_pedido(p uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (
     select 1 from ruta_paradas rp join rutas r on r.id = rp.ruta_id
     where rp.pedido_id = p and r.repartidor_id = auth.uid() and r.estado <> 'borrador') $$;

alter table perfiles enable row level security;
alter table productos enable row level security;
alter table clientes enable row level security;
alter table pedidos enable row level security;
alter table pedido_items enable row level security;
alter table rutas enable row level security;
alter table ruta_paradas enable row level security;
alter table pagos enable row level security;
alter table cuadres enable row level security;
alter table importador_mapeos enable row level security;

-- perfiles
create policy perfiles_ver on perfiles for select using (id = auth.uid() or es_staff());
create policy perfiles_dueno on perfiles for all using (rol_actual() = 'dueno') with check (rol_actual() = 'dueno');

-- catalog: everyone signed in reads, staff writes
create policy productos_ver on productos for select using (auth.uid() is not null);
create policy productos_staff on productos for all using (es_staff()) with check (es_staff());

create policy clientes_staff on clientes for all using (es_staff()) with check (es_staff());
create policy clientes_repartidor on clientes for select using (
  exists (select 1 from pedidos p where p.cliente_id = clientes.id and es_mi_pedido(p.id)));

-- orders
create policy pedidos_staff on pedidos for all using (es_staff()) with check (es_staff());
create policy pedidos_repartidor_ver on pedidos for select using (es_mi_pedido(id));
create policy pedidos_repartidor_upd on pedidos for update using (es_mi_pedido(id)) with check (es_mi_pedido(id));

create policy items_staff on pedido_items for all using (es_staff()) with check (es_staff());
create policy items_repartidor_ver on pedido_items for select using (es_mi_pedido(pedido_id));
create policy items_repartidor_upd on pedido_items for update using (es_mi_pedido(pedido_id)) with check (es_mi_pedido(pedido_id));

-- routes
create policy rutas_staff on rutas for all using (es_staff()) with check (es_staff());
create policy rutas_repartidor_ver on rutas for select using (repartidor_id = auth.uid() and estado <> 'borrador');
create policy rutas_repartidor_upd on rutas for update
  using (repartidor_id = auth.uid() and estado <> 'borrador') with check (repartidor_id = auth.uid());

create policy paradas_staff on ruta_paradas for all using (es_staff()) with check (es_staff());
create policy paradas_repartidor_ver on ruta_paradas for select using (
  exists (select 1 from rutas r where r.id = ruta_id and r.repartidor_id = auth.uid() and r.estado <> 'borrador'));
create policy paradas_repartidor_upd on ruta_paradas for update using (
  exists (select 1 from rutas r where r.id = ruta_id and r.repartidor_id = auth.uid() and r.estado <> 'borrador'));

-- payments: courier records payments for his own stops only
create policy pagos_staff on pagos for select using (es_staff());
create policy pagos_repartidor_ver on pagos for select using (es_mi_pedido(pedido_id));
create policy pagos_repartidor_ins on pagos for insert with check (es_mi_pedido(pedido_id) and recibido_por = auth.uid());

create policy cuadres_staff on cuadres for all using (es_staff()) with check (es_staff() and cerrado_por = auth.uid());
create policy mapeos_staff on importador_mapeos for all using (es_staff()) with check (es_staff());

-- Private bucket for voucher photos (Supabase Storage). Skipped where storage is absent (local test).
do $$ begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public) values ('vouchers', 'vouchers', false) on conflict do nothing;
    create policy vouchers_subir on storage.objects for insert with check (bucket_id = 'vouchers' and auth.uid() is not null);
    create policy vouchers_ver on storage.objects for select using (bucket_id = 'vouchers' and (es_staff() or owner = auth.uid()));
  end if;
end $$;
