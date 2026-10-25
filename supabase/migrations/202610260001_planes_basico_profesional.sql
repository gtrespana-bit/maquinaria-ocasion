-- Planes Básico (starter) y Profesional (unlimited)
--
-- Sustituye el plan provisional único `plus` (19 €/15 anuncios) por la
-- escalera aprobada en docs/ESTRATEGIA-PLANES-2026-10.md:
--   Básico      `starter`    19 €/mes · 5 anuncios · prueba de 30 días
--   Profesional `unlimited`  49 €/mes · sin límite (uso justo)
--
-- La web aún no se ha lanzado: no hay clientes reales con `plus`. Las filas
-- semilla/internas que lo conserven se normalizan al final de esta migración
-- (`plus` contratado → Profesional; `plus` en prueba → Básico). El valor
-- `plus` se mantiene en los CHECK por compatibilidad/rollback, pero el código
-- ya no lo crea ni lo ofrece.
--
-- No se editan migraciones ya aplicadas: aquí se reemplazan las dos funciones
-- que conocían el plan de prueba por defecto y el cupo de `plus`.

-- ────────────────────────────────────────────────────────────────────────────
-- 1. La prueba automática concede Básico, no `plus`
--    (copia de 202610220001 con el único cambio del plan por defecto)
-- ────────────────────────────────────────────────────────────────────────────

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
  if new.tipo_vendedor not in ('camperizador', 'profesional') then
    return new;
  end if;

  -- Solo en el alta o en un cambio real de tipo a profesional.
  if tg_op = 'UPDATE' and new.tipo_vendedor is not distinct from old.tipo_vendedor then
    return new;
  end if;

  if new.trial_iniciado_en is not null then
    return new; -- ya la usó (o la está usando)
  end if;

  if coalesce(new.plan_anuncios, 'gratis') <> 'gratis' then
    return new; -- acaba de contratar un pack: no es una prueba
  end if;

  -- Si la tabla de ajustes no existiera, el alta no debe fallar: se usa la
  -- configuración por defecto.
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
end $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Pausa masiva por cupo con la escalera nueva
--    · Básico (starter): 5 · Profesional (unlimited): sin cupo
--    · `plus` contratado (residual) se equipara a Profesional: sin cupo
--    · `trial_plan = 'plus'` (residual) se equipara a Básico: 5
-- ────────────────────────────────────────────────────────────────────────────

create or replace function public.aplicar_cupo_planes(p_ahora timestamptz default now())
returns table (vendedor_id uuid, producto_id uuid, titulo text, cupo integer)
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
        when p.tipo_vendedor not in ('camperizador', 'profesional') then 'gratis'
        when p.plan_anuncios in ('starter', 'unlimited', 'plus')
             and (p.plan_hasta is null or p.plan_hasta >= p_ahora) then
          case when p.plan_anuncios = 'plus' then 'unlimited' else p.plan_anuncios end
        when p.trial_hasta is not null
             and p.tipo_vendedor in ('camperizador', 'profesional')
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
      -- Los anuncios de demostración no son stock del vendedor.
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
end $$;

revoke all on function public.aplicar_cupo_planes(timestamptz) from public;
grant execute on function public.aplicar_cupo_planes(timestamptz) to service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. Normalización de datos residuales (solo filas semilla/internas)
--    Idempotente: tras la primera pasada no queda ningún `plus` vivo.
--    La bitácora `planes_regalos` no se toca: es histórico.
-- ────────────────────────────────────────────────────────────────────────────

update public.perfiles
   set plan_anuncios = 'unlimited'
 where plan_anuncios = 'plus';

update public.perfiles
   set trial_plan = 'starter'
 where trial_plan = 'plus';

update public.cupones
   set plan = 'unlimited'
 where plan = 'plus';
