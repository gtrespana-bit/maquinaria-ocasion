-- Foro de la comunidad (Fase 12): categorías, hilos y mensajes.
-- Ya aplicado en producción (2026-10-25); el fichero queda como registro del
-- esquema desplegado. Idempotente a propósito.

create table if not exists public.foro_categorias (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nombre_es text not null,
  nombre_en text not null,
  descripcion_es text,
  descripcion_en text,
  icono text default '💬',
  orden integer not null default 0
);

create table if not exists public.foro_hilos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references public.foro_categorias(id) on delete cascade,
  user_id uuid not null,
  titulo text not null,
  cuerpo text not null,
  estado_moderacion text default 'aprobado',
  motivo_moderacion text,
  cerrado boolean default false,
  mensajes_count integer default 0,
  actualizado_en timestamptz default now(),
  creado_en timestamptz default now()
);

create table if not exists public.foro_mensajes (
  id uuid primary key default gen_random_uuid(),
  hilo_id uuid not null references public.foro_hilos(id) on delete cascade,
  user_id uuid not null,
  cuerpo text not null,
  estado_moderacion text default 'aprobado',
  motivo_moderacion text,
  creado_en timestamptz default now()
);

create index if not exists idx_foro_hilos_categoria
  on public.foro_hilos (categoria_id, actualizado_en desc);
create index if not exists idx_foro_hilos_moderacion
  on public.foro_hilos (estado_moderacion, actualizado_en desc);
create index if not exists idx_foro_mensajes_hilo
  on public.foro_mensajes (hilo_id, creado_en);
create index if not exists idx_foro_mensajes_user
  on public.foro_mensajes (user_id);

alter table public.foro_categorias enable row level security;
alter table public.foro_hilos enable row level security;
alter table public.foro_mensajes enable row level security;

drop policy if exists "Foro categorias lectura" on public.foro_categorias;
create policy "Foro categorias lectura" on public.foro_categorias
  for select using (true);

drop policy if exists "Foro hilos lectura" on public.foro_hilos;
create policy "Foro hilos lectura" on public.foro_hilos
  for select using (
    estado_moderacion is null
    or estado_moderacion = 'aprobado'
    or user_id = auth.uid()
  );

drop policy if exists "Foro hilos insert" on public.foro_hilos;
create policy "Foro hilos insert" on public.foro_hilos
  for insert with check (
    user_id = auth.uid()
    and (estado_moderacion is null or estado_moderacion in ('aprobado', 'pendiente'))
  );

drop policy if exists "Foro mensajes lectura" on public.foro_mensajes;
create policy "Foro mensajes lectura" on public.foro_mensajes
  for select using (
    estado_moderacion is null
    or estado_moderacion = 'aprobado'
    or user_id = auth.uid()
  );

drop policy if exists "Foro mensajes insert" on public.foro_mensajes;
create policy "Foro mensajes insert" on public.foro_mensajes
  for insert with check (
    user_id = auth.uid()
    and (estado_moderacion is null or estado_moderacion in ('aprobado', 'pendiente'))
  );

-- Categorías iniciales (localizadas por columna: nombre_es / nombre_en).
insert into public.foro_categorias (slug, nombre_es, nombre_en, descripcion_es, descripcion_en, icono, orden)
values
  ('compra', 'Compra, precios y presupuestos', 'Buying, prices and budgets',
   'Dudas antes de comprar y qué precio es justo.', 'Questions before buying and what price is fair.', '❓', 10),
  ('venta', 'Vender y publicar', 'Selling and listing',
   'Cómo publicar, fotos, y vender más rápido.', 'How to list, photos, and sell faster.', '💰', 20),
  ('taller', 'Talleres y reparación', 'Workshops and repairs',
   'Averías, mantenimiento y reparaciones.', 'Faults, maintenance and repairs.', '🔧', 30),
  ('marcas', 'Marcas y modelos', 'Brands and models',
   'Comparativas y experiencias concretas por marca.', 'Brand-by-brand comparisons and experiences.', '🏷️', 40),
  ('general', 'General', 'General',
   'Todo lo que no encaje en las otras categorías.', 'Everything that does not fit elsewhere.', '💬', 90)
on conflict (slug) do nothing;
