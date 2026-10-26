-- Tipo de vendedor `taller` y retirada de la categoría legada sin uso
--
-- El tipo de vendedor heredado del vertical anterior pasa a llamarse
-- `taller` en datos, CHECK y funciones, en línea con el código de la app
-- (que ya solo conoce 'particular' | 'taller' | 'profesional').
--
-- ⚠️ APLICAR COORDINADA CON EL DESPLIEGUE DEL CÓDIGO:
-- el código anterior escribe el valor viejo y violaría los CHECK nuevos;
-- el código nuevo escribe 'taller' y violaría los CHECK viejos. Aplicar
-- esta migración e inmediatamente mergear/desplegar la rama con el renombre
-- (ventana de minutos; la web está en prelanzamiento, sin clientes reales).
--
-- Orden deliberado dentro de la migración:
--   1) Se quitan los CHECK y se migran los datos con las funciones
--      ANTIGUAS todavía vivas: para ellas 'taller' no es un tipo con
--      tienda/prueba, así que el UPDATE no dispara trials ni validaciones.
--   2) Se añaden los CHECK nuevos.
--   3) Se reemplazan las funciones por sus definiciones vivas con el
--      único cambio del valor (verificadas con pg_get_functiondef).
--   4) Se borra la fila de `categorias` legada, solo si sigue sin
--      productos (el código ya usa 'agricola' como familia por defecto).
--
-- No se editan migraciones ya aplicadas.

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Datos: perfiles, productos y (defensivo) metadata de Auth
-- ────────────────────────────────────────────────────────────────────────────

alter table public.perfiles
  drop constraint if exists perfiles_tipo_vendedor_check;

alter table public.productos
  drop constraint if exists productos_vendedor_tipo_check;

update public.perfiles
   set tipo_vendedor = 'taller'
 where tipo_vendedor = 'camperizador';

update public.productos
   set vendedor_tipo = 'taller'
 where vendedor_tipo = 'camperizador';

-- Hoy ningún usuario guarda el tipo en raw_user_meta_data, pero si algún
-- alta antigua lo hiciera, el trigger de creación de perfil lo leería.
update auth.users
   set raw_user_meta_data = jsonb_set(raw_user_meta_data, '{tipo_vendedor}', '"taller"')
 where raw_user_meta_data ->> 'tipo_vendedor' = 'camperizador';

-- ────────────────────────────────────────────────────────────────────────────
-- 2. CHECK nuevos
-- ────────────────────────────────────────────────────────────────────────────

alter table public.perfiles
  add constraint perfiles_tipo_vendedor_check
  check (tipo_vendedor = any (array['particular'::text, 'taller'::text, 'profesional'::text]));

alter table public.productos
  add constraint productos_vendedor_tipo_check
  check (vendedor_tipo = any (array['particular'::text, 'taller'::text, 'profesional'::text]));

-- ────────────────────────────────────────────────────────────────────────────
-- 3. Funciones vivas con el valor nuevo (único cambio: el literal)
-- ────────────────────────────────────────────────────────────────────────────

create or replace function public.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into perfiles (id, nombre, telefono, estado, ciudad, tipo_vendedor)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', ''),
    coalesce(new.raw_user_meta_data->>'telefono', ''),
    coalesce(new.raw_user_meta_data->>'estado', ''),
    coalesce(new.raw_user_meta_data->>'ciudad', ''),
    case
      when new.raw_user_meta_data->>'tipo_vendedor'
        in ('particular', 'taller', 'profesional')
      then new.raw_user_meta_data->>'tipo_vendedor'
      else 'particular'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.fn_iniciar_trial_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dias integer := 30;
  v_activo boolean := true;
begin
  if new.tipo_vendedor not in ('taller', 'profesional') then
    return new;
  end if;

  if tg_op = 'UPDATE' and new.tipo_vendedor is not distinct from old.tipo_vendedor then
    return new;
  end if;

  if new.trial_iniciado_en is not null then
    return new;
  end if;

  if coalesce(new.plan_anuncios, 'gratis') <> 'gratis' then
    return new;
  end if;

  begin
    select
      coalesce((valor ->> 'dias_gratis')::integer, v_dias),
      coalesce((valor ->> 'mes_gratis_activo')::boolean, v_activo)
    into v_dias, v_activo
    from public.plataforma_ajustes
    where clave = 'planes';
  exception when others then
    v_dias := 30;
    v_activo := true;
  end;

  if not coalesce(v_activo, true) then
    return new;
  end if;

  new.trial_iniciado_en := now();
  new.trial_hasta := now() + make_interval(days => coalesce(nullif(v_dias, 0), 30));
  new.trial_plan := case
    when new.trial_plan in ('starter', 'unlimited') then new.trial_plan
    else 'starter'
  end;

  return new;
end;
$$;

create or replace function public.fn_validar_tienda()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.tienda_activa and coalesce(new.tipo_vendedor, 'particular') = 'particular' then
    raise exception 'Solo los talleres y profesionales pueden abrir tienda';
  end if;
  return new;
end;
$$;

create or replace function public.aplicar_cupo_planes(p_ahora timestamp with time zone default now())
returns table(vendedor_id uuid, producto_id uuid, titulo text, cupo integer)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with efectivo as (
    select
      p.id,
      case
        when p.tipo_vendedor not in ('taller', 'profesional') then 'gratis'
        when p.plan_anuncios in ('starter', 'unlimited', 'plus')
             and (p.plan_hasta is null or p.plan_hasta >= p_ahora) then
          case when p.plan_anuncios = 'plus' then 'unlimited' else p.plan_anuncios end
        when p.trial_hasta is not null
             and p.tipo_vendedor in ('taller', 'profesional')
             and p_ahora <= p.trial_hasta + interval '7 days'
             then
          case coalesce(p.trial_plan, 'starter')
            when 'unlimited' then 'unlimited'
            else 'starter'
          end
        else 'gratis'
      end as plan
    from public.perfiles p
  ),
  cupos as (
    select
      e.id,
      case e.plan
        when 'starter' then 5
        when 'unlimited' then null
        else 1
      end as cupo
    from efectivo e
  ),
  orden as (
    select
      pr.id,
      pr.user_id,
      pr.titulo,
      c.cupo,
      row_number() over (
        partition by pr.user_id
        order by
          (pr.destacado is true and (pr.destacado_hasta is null or pr.destacado_hasta > p_ahora)) desc,
          pr.visitas asc nulls first,
          pr.creado_en desc
      ) as rn
    from public.productos pr
    join cupos c on c.id = pr.user_id
    where pr.activo is true
      and coalesce(pr.vendido, false) = false
      and coalesce(pr.es_demo, false) = false
      and c.cupo is not null
  ),
  pausados as (
    update public.productos pr
       set activo = false,
           pausado_por_plan = true,
           pausado_en = p_ahora
      from orden o
     where pr.id = o.id
       and o.rn > o.cupo
    returning pr.user_id, pr.id, pr.titulo, o.cupo
  )
  select p.user_id, p.id, p.titulo, p.cupo
  from pausados p;
end;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- 4. Categoría legada sin productos (el código ya no la usa como fallback)
-- ────────────────────────────────────────────────────────────────────────────

delete from public.categorias c
 where c.nombre = 'camper'
   and not exists (
     select 1 from public.productos p where p.categoria_id = c.id
   );
