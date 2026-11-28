-- Bodega Ruta · Phase 1 core schema.
-- Quantities are always stored in base units; trays (bandejas) are a presentation.

create type rol_usuario as enum ('dueno', 'coordinador', 'repartidor', 'tienda');
create type estado_pedido as enum ('recibido', 'en_ruta', 'entregado', 'parcial', 'no_entregado');
create type origen_pedido as enum ('planta', 'puerta');
create type estado_ruta as enum ('borrador', 'despachada', 'en_curso', 'cerrada');
create type metodo_pago as enum ('efectivo', 'transferencia');

create table perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  rol rol_usuario not null,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create table productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  variante text,
  unidades_por_bandeja integer not null check (unidades_por_bandeja > 0),
  -- PROVISIONAL: invented prices in COP, replace with the real price list.
  precio_unidad integer not null check (precio_unidad >= 0),
  activo boolean not null default true,
  unique (nombre, variante)
);

create table clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  direccion text not null,
  telefono text,
  lat double precision,
  lng double precision,
  notas text,
  creado_en timestamptz not null default now()
);

create table pedidos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default (now() at time zone 'America/Bogota')::date,
  cliente_id uuid not null references clientes (id),
  estado estado_pedido not null default 'recibido',
  origen origen_pedido not null default 'planta',
  motivo_no_entrega text,
  creado_en timestamptz not null default now()
);
create index on pedidos (fecha, estado);

create table pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos (id) on delete cascade,
  producto_id uuid not null references productos (id),
  cantidad_pedida_unidades integer not null check (cantidad_pedida_unidades > 0),
  cantidad_entregada_unidades integer check (cantidad_entregada_unidades >= 0),
  texto_original text
);
create index on pedido_items (pedido_id);

create table rutas (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default (now() at time zone 'America/Bogota')::date,
  repartidor_id uuid not null references perfiles (id),
  estado estado_ruta not null default 'borrador',
  despachada_en timestamptz,
  cerrada_en timestamptz,
  unique (fecha, repartidor_id)
);

create table ruta_paradas (
  id uuid primary key default gen_random_uuid(),
  ruta_id uuid not null references rutas (id) on delete cascade,
  pedido_id uuid not null unique references pedidos (id),
  orden integer not null,
  llegada_ts timestamptz,
  salida_ts timestamptz
);
create index on ruta_paradas (ruta_id, orden);

create table pagos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos (id),
  metodo metodo_pago not null,
  monto integer not null check (monto >= 0),
  voucher_url text,
  recibido_por uuid not null references perfiles (id),
  creado_en timestamptz not null default now(),
  -- A transfer must carry its voucher photo.
  check (metodo = 'efectivo' or voucher_url is not null)
);
create index on pagos (pedido_id);

create table cuadres (
  id uuid primary key default gen_random_uuid(),
  ruta_id uuid not null unique references rutas (id),
  esperado integer not null,
  efectivo_recibido integer not null,
  transferencias integer not null,
  diferencia integer not null,
  cerrado_por uuid not null references perfiles (id),
  creado_en timestamptz not null default now()
);

-- Saved column mappings for the Excel importer (the plant's real format is unknown).
create table importador_mapeos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  mapeo jsonb not null,
  creado_en timestamptz not null default now()
);

-- Expected cash for a route: delivered units x unit price, over the route's stops.
create view v_esperado_pedido as
select p.id as pedido_id,
       coalesce(sum(coalesce(i.cantidad_entregada_unidades, 0) * pr.precio_unidad), 0)::integer as esperado
from pedidos p
left join pedido_items i on i.pedido_id = p.id
left join productos pr on pr.id = i.producto_id
group by p.id;
