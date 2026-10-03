create extension if not exists pgcrypto;

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  category text not null check (category in ('shirt', 'hat')),
  brand text not null check (brand in ('Ferrari', 'Mercedes-Benz', 'Red Bull', 'McLaren', 'BMW', 'Other')),
  cost_price numeric(12, 2) not null check (cost_price >= 0),
  sell_price numeric(12, 2) not null check (sell_price >= 0),
  stock_qty integer not null default 0 check (stock_qty >= 0),
  defect_note text null,
  image_url text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  movement_type text not null check (movement_type in ('IN', 'OUT', 'ADJUST')),
  qty integer not null check (qty > 0),
  unit_cost numeric(12, 2) null,
  unit_price numeric(12, 2) null,
  note text null,
  created_at timestamptz not null default now()
);

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  sale_no text not null unique,
  note text null,
  total_amount numeric(12, 2) not null default 0,
  total_cost numeric(12, 2) not null default 0,
  total_profit numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id),
  product_id uuid not null references products(id),
  qty integer not null check (qty > 0),
  unit_sell_price numeric(12, 2) not null,
  unit_cost_snapshot numeric(12, 2) not null,
  line_profit numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_category on products(category);
create index if not exists idx_products_brand on products(brand);
create index if not exists idx_products_stock_qty on products(stock_qty);
create index if not exists idx_stock_movements_product_id on stock_movements(product_id);
create index if not exists idx_sales_created_at on sales(created_at);
create index if not exists idx_sale_items_sale_id on sale_items(sale_id);
