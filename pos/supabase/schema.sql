-- ============================================================
-- Osadian POS — Esquema completo de base de datos
-- Ejecutar en: Supabase > SQL Editor > New query
-- ============================================================

create table if not exists perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  rol text not null check (rol in ('admin', 'ventas')),
  created_at timestamptz default now()
);

create table if not exists categorias (
  id bigint generated always as identity primary key,
  nombre text not null unique
);

insert into categorias (nombre) values
  ('Accesorios'), ('Perfumería'), ('Calzado'), ('Ropa'), ('Maquillaje')
on conflict (nombre) do nothing;

create table if not exists productos (
  id bigint generated always as identity primary key,
  nombre text not null,
  marca text default '',
  categoria_id bigint references categorias(id),
  precio numeric(10,2) not null default 0,
  costo numeric(10,2) not null default 0,
  stock integer not null default 0,
  codigo_barras text unique,
  stock_minimo integer not null default 3,
  activo boolean not null default true,
  created_at timestamptz default now()
);

create index if not exists idx_productos_codigo on productos(codigo_barras);

create table if not exists ventas (
  id bigint generated always as identity primary key,
  fecha timestamptz default now(),
  total numeric(10,2) not null default 0,
  metodo_pago text not null check (metodo_pago in ('Efectivo', 'Tarjeta', 'Yape')),
  usuario_id uuid references perfiles(id),
  anulada boolean not null default false
);

create table if not exists venta_items (
  id bigint generated always as identity primary key,
  venta_id bigint references ventas(id) on delete cascade,
  producto_id bigint references productos(id),
  nombre_producto text not null,
  cantidad integer not null default 1,
  precio_unitario numeric(10,2) not null,
  costo_unitario numeric(10,2) not null default 0
);

create table if not exists caja_movimientos (
  id bigint generated always as identity primary key,
  fecha timestamptz default now(),
  tipo text not null check (tipo in ('Apertura', 'Ingreso', 'Egreso')),
  detalle text not null,
  monto numeric(10,2) not null,
  usuario_id uuid references perfiles(id),
  venta_id bigint references ventas(id)
);

-- Función principal que registra la venta, descuenta stock y crea ingreso en caja
create or replace function registrar_venta(
  p_items jsonb,
  p_metodo_pago text,
  p_usuario_id uuid
)
returns bigint
language plpgsql
security definer
as $$
declare
  v_venta_id bigint;
  v_total numeric(10,2) := 0;
  v_item jsonb;
  v_costo numeric(10,2);
begin
  select coalesce(sum((i->>'cantidad')::int * (i->>'precio_unitario')::numeric), 0)
  into v_total from jsonb_array_elements(p_items) i;

  insert into ventas (total, metodo_pago, usuario_id)
  values (v_total, p_metodo_pago, p_usuario_id)
  returning id into v_venta_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select costo into v_costo from productos where id = (v_item->>'producto_id')::bigint;

    insert into venta_items (venta_id, producto_id, nombre_producto, cantidad, precio_unitario, costo_unitario)
    values (v_venta_id, (v_item->>'producto_id')::bigint, v_item->>'nombre_producto', (v_item->>'cantidad')::int, (v_item->>'precio_unitario')::numeric, coalesce(v_costo, 0));

    update productos set stock = greatest(stock - (v_item->>'cantidad')::int, 0)
    where id = (v_item->>'producto_id')::bigint;
  end loop;

  insert into caja_movimientos (tipo, detalle, monto, usuario_id, venta_id)
  values ('Ingreso', 'Venta #' || v_venta_id || ' — ' || p_metodo_pago, v_total, p_usuario_id, v_venta_id);

  return v_venta_id;
end;
$$;

-- Seguridad: solo usuarios autenticados
alter table perfiles enable row level security;
alter table categorias enable row level security;
alter table productos enable row level security;
alter table ventas enable row level security;
alter table venta_items enable row level security;
alter table caja_movimientos enable row level security;

create policy "auth_perfiles" on perfiles for select using (auth.role() = 'authenticated');
create policy "auth_categorias" on categorias for all using (auth.role() = 'authenticated');
create policy "auth_productos" on productos for all using (auth.role() = 'authenticated');
create policy "auth_ventas" on ventas for all using (auth.role() = 'authenticated');
create policy "auth_venta_items" on venta_items for all using (auth.role() = 'authenticated');
create policy "auth_caja" on caja_movimientos for all using (auth.role() = 'authenticated');
