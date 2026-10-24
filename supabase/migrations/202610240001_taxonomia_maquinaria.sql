-- ═══════════════════════════════════════════════════════════════════════
-- 202610240001 — Fase 3: taxonomía de maquinaria y rango de horas de uso
-- ═══════════════════════════════════════════════════════════════════════
--
-- Fase 3 (docs/ESTADO-PROYECTO-MAQUINARIA.md): el vertical pasa de un único
-- tipo camper a tres familias/categorías de maquinaria con doce
-- subcategorías. Esta migración:
--
--   1. Da de alta las categorías `agricola` y `obra` en la tabla `categorias`
--      (las filas canónicas que `resolverCategoriaId` resuelve a
--      `productos.categoria_id`; `herramientas` ya existe desde el seed 001
--      y se reinserta de forma idempotente por si acaso).
--   2. Añade la columna generada `espec_horas` (horas de uso), el rango
--      numérico que sustituye a los antiguos `kmMax`/watios del camper, con
--      su comentario e índice funcional, siguiendo el patrón de la migración
--      `202609170003_rangos_numericos.sql`.
--
-- Idempotente: se puede aplicar más de una vez (`on conflict do nothing`,
-- `add column if not exists`, `create index if not exists`). Las claves del
-- JSONB que lee `espec_horas` coinciden con `RANGOS_NUMERICOS` de
-- `src/lib/filtros-tecnicos.ts` (Horas de uso / Horas / Horas de uso (h)).
-- El query builder del catálogo solo filtra por estas columnas generadas
-- cuando la URL lleva `horasMax`, y si la migración no está aplicada,
-- `esErrorColumnasRango()` + el reintento sin rangos dejan el catálogo en pie.

-- ── 1. Categorías de la nueva taxonomía ──────────────────────────────────
insert into categorias (nombre)
values ('agricola'), ('obra'), ('herramientas')
on conflict do nothing;

-- ── 2. Horas de uso (columna generada para el filtro horasMax) ───────────
alter table public.productos
  add column if not exists espec_horas numeric generated always as (
    public.fn_espec_numero(coalesce(
      especificaciones->>'Horas de uso',
      especificaciones->>'Horas',
      especificaciones->>'Horas de uso (h)'
    ))
  ) stored;

comment on column public.productos.espec_horas is
  'Horas de uso extraídas del JSONB especificaciones (número, para filtrar con '
  'lte en vez de comparar texto). Claves leídas: Horas de uso, Horas, Horas de uso (h).';

create index if not exists productos_espec_horas_idx
  on public.productos (espec_horas);
