'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { XCircle } from 'lucide-react';
import { TODAS_LAS_SUBS, FAMILIAS } from '@/lib/categorias';
import {
  FILTROS_TECNICOS, type FiltrosTecnicos} from '@/lib/filtros-tecnicos'
import { hayFiltrosRango } from '@/lib/filtros-tecnicos'
import { FILTRO_VENDEDOR_PARAM } from '@/lib/catalog-consulta';
import { TIPOS_VENDEDOR } from '@/components/BadgeTipoVendedor';
import { FiltrosTecnicosPanel } from './FiltrosTecnicosPanel';
import { SelectorMarca } from './SelectorMarca';

interface CatalogFiltersProps {
  /**
   * Familia/categoría activa (derivada de `?categoria=` o de la subcategoría
   * elegida). Los filtros técnicos específicos de cada familia solo se
   * muestran cuando hay contexto; sin él, solo los transversales.
   */
  categoria?: string;
  subcategoria: string;
  marca: string;
  precioMin: string;
  precioMax: string;
  ubicacionEstado: string;
  ubicacionCiudad: string;
  /**
   * Filtros técnicos activos (param → valor), leídos con
   * `leerFiltrosTecnicos(searchParams)`. El listado de filtros disponibles lo
   * define el registro `@/lib/filtros-tecnicos`.
   */
  filtrosTecnicos: FiltrosTecnicos;
  /** Rangos numéricos activos tal como están en la URL (param → "5000"). */
  rangos: Record<string, string>;
  /** Tipo de vendedor activo ('particular' | 'taller' | 'profesional'). */
  vendedor: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

// Controles del sistema editorial: sin cajas, con línea inferior y etiquetas
// monoespaciadas. Mismo lenguaje que el buscador de la portada.
// Controles del sistema editorial: sin cajas, con línea inferior y etiquetas
// monoespaciadas. Mismo lenguaje que el buscador de la portada.
const selectClass = 'field text-[13.5px]';
const labelClass = 't-label mb-1 block text-ink/50';
const inputClass = 'field t-num text-[13.5px]';

export const CatalogFilters = ({
  categoria,
  subcategoria,
  marca,
  precioMin,
  precioMax,
  ubicacionEstado,
  ubicacionCiudad,
  filtrosTecnicos,
  rangos,
  vendedor,
  t }: CatalogFiltersProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // No hay selector de categoría: la navegación la organizan las
  // familias → tipos → marca/modelo (los tipos de TODAS las familias).
  const subs = TODAS_LAS_SUBS;
  // Con subcategoría elegida solo se ofrecen los modelos aptos para ella:
  // una marca de ordeño no tiene sentido filtrando excavadoras.
  const subActiva = subcategoria ? subs.find(s => s.label === subcategoria) : undefined;
  const modelosMarca = subActiva ? subActiva.marcas : subs.flatMap(s => s.marcas || []);

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  };

  const hasActiveFilters = !!(
    subcategoria || marca || precioMin || precioMax ||
    ubicacionEstado || ubicacionCiudad || vendedor ||
    FILTROS_TECNICOS.some(f => filtrosTecnicos[f.param]) ||
    hayFiltrosRango(rangos)
  );

  return (
    // En escritorio la columna de filtros es sticky: al crecer con los bloques
    // técnicos se le da scroll propio para que el pie (limpiar filtros) siga
    // siendo alcanzable sin perder la posición en el listado.
    <div className="lg:sticky lg:top-[var(--header-offset)] lg:z-10 lg:max-h-[calc(100dvh-var(--header-offset)-1rem)] lg:overflow-y-auto">
      <div className="mb-5 flex items-center justify-between border-b border-ink pb-2">
        <h2 className="t-eyebrow text-ink">{t('catalog.filtersTitle')}</h2>
        {hasActiveFilters && (
          <button
            onClick={() => router.push(pathname)}
            className="t-label flex items-center gap-1 text-ink/50 transition-colors hover:text-ink"
          >
            <XCircle size={12} /> {t('catalog.clearFilters')}
          </button>
        )}
      </div>

      {/* Familias y subcategorías de la vertical (agrícola / obra /
          herramientas), siempre visibles. */}
      <div className="mb-4">
        <label htmlFor="filter-subcategoria" className={labelClass}>
          {t('catalog.typeLabel')}
        </label>
        <select
          id="filter-subcategoria"
          value={subcategoria}
          onChange={e => setParam('subcategoria', e.target.value)}
          className={selectClass}
        >
          <option value="">{t('catalog.allTypes')}</option>
          {FAMILIAS.map(f => (
            <optgroup key={f.key} label={`${f.icon} ${t(`familias.${f.key}.label`)}`}>
              {f.subs.map(slug => {
                const s = subs.find(x => x.slug === slug);
                if (!s) return null;
                return (
                  <option key={s.label} value={s.label}>
                    {s.icon} {s.label}
                  </option>
                );
              })}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between">
          <label htmlFor="filter-marca" className={labelClass}>
            {t('catalog.brandLabel')}
          </label>
          {marca && (
            <button
              onClick={() => setParam('marca', '')}
              className="text-xs text-clay hover:text-clay flex items-center gap-1"
            >
              <XCircle size={12} /> {t('catalog.remove')}
            </button>
          )}
        </div>
        <SelectorMarca
          id="filter-marca"
          value={marca}
          modelos={modelosMarca}
          allLabel={t('catalog.allBrands')}
          onChange={v => setParam('marca', v)}
          className={selectClass}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="filter-precio-min" className={labelClass}>
          {t('catalog.priceEur')}
        </label>
        <div className="flex gap-2">
          <input
            id="filter-precio-min"
            type="number"
            value={precioMin}
            onChange={e => setParam('precioMin', e.target.value)}
            placeholder={t('catalog.min')}
            min="0"
            className={inputClass}
          />
          <input
            type="number"
            value={precioMax}
            onChange={e => setParam('precioMax', e.target.value)}
            placeholder={t('catalog.max')}
            min="0"
            aria-label={t('catalog.max')}
            className={inputClass}
          />
        </div>
      </div>

      {/* ¿Quién vende? (Fase 3): particulares, talleres o pros. */}
      <div className="mb-5">
        <span className={labelClass}>{t('catalog.whoSells')}</span>
        <div className="flex flex-wrap gap-1.5">
          {TIPOS_VENDEDOR.map(tipo => {
            const activo = vendedor === tipo
            return (
              <button
                key={tipo}
                type="button"
                aria-pressed={activo}
                onClick={() => setParam(FILTRO_VENDEDOR_PARAM, activo ? '' : tipo)}
                className={`t-label border px-2.5 py-1.5 transition-colors ${
                  activo
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line text-ink/60 hover:border-ink hover:text-ink'
                }`}
              >
                {t(`tiposVendedor.${tipo}`)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Filtros técnicos (transversales + específicos de la familia activa)
          y rangos numéricos: la lista sale del registro único
          @/lib/filtros-tecnicos, el mismo dato que captura /publicar (captura
          y filtro no pueden divergir). El panel es el mismo componente que usa
          /buscar. */}
      <FiltrosTecnicosPanel
        categoria={categoria}
        filtrosTecnicos={filtrosTecnicos}
        rangos={rangos}
        t={t}
        onSetParam={setParam}
      />

      <div className="mt-6 border-t border-line pt-4">
        <p className="t-label text-ink/30">MaquinariaOcasión · España</p>
      </div>
    </div>
  );
};

  'w-full border border-line-strong rounded-lg px-3 py-2.5 text-sm text-ink bg-[#FBFAF5] font-medium focus:outline-none focus:ring-2 focus:ring-signal-deep';