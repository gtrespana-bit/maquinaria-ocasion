'use client'

import { Ruler } from 'lucide-react';
import { gruposDeFiltros, RANGOS_NUMERICOS } from '@/lib/filtros-tecnicos';
import { RANGOS_SUGERIDOS } from '@/lib/catalog-consulta';

const selectClass = 'field pr-6 text-[13.5px] font-medium';
const labelClass = 't-label mb-1 block text-ink/50';
const inputClass = 'field t-num text-[13.5px]';

interface FiltrosTecnicosPanelProps {
  /**
   * Familia/categoría activa (`?categoria=agricola` o derivada de la
   * subcategoría elegida). Determina qué filtros específicos se muestran;
   * sin familia solo se muestran los transversales. Los rangos numéricos
   * son transversales y siempre se muestran.
   */
  categoria?: string;
  /** Filtros técnicos activos por opción (param → valor). */
  filtrosTecnicos: Record<string, string>;
  /** Rangos numéricos activos tal como están en la URL (param → "5000"). */
  rangos: Record<string, string>;
  t: (key: string, vars?: Record<string, string | number>) => string;
  onSetParam: (key: string, value: string) => void;
}

/**
 * Bloque de filtros técnicos de maquinaria (opciones + rangos numéricos).
 *
 * Extraído de `CatalogFilters` para reutilizarlo también en `/buscar`: la lista
 * de filtros, sus opciones y los rangos salen del registro único
 * `@/lib/filtros-tecnicos`, el mismo dato que captura `/publicar`, así que
 * captura y filtro no pueden divergir. Los grupos vacíos para la familia
 * activa se omiten (`gruposDeFiltros`).
 */
export const FiltrosTecnicosPanel = ({
  categoria,
  filtrosTecnicos,
  rangos,
  t,
  onSetParam }: FiltrosTecnicosPanelProps) => {
  return (
    <>
      {/* Filtros por opción de la familia activa (transversales + específicos). */}
      {gruposDeFiltros(categoria).map(grupo => (
        <div key={grupo.grupo} className="mb-5 border-t border-line pt-4 first:border-t-0 first:pt-0">
          <h4 className="t-label mb-3 flex items-center gap-1.5 text-ink/45">
            <span aria-hidden="true">{grupo.icono}</span> {t(grupo.i18n)}
          </h4>
          {grupo.filtros.map(filtro => (
            <div className="mb-4" key={filtro.param}>
              <label htmlFor={`filtro-tec-${filtro.param}`} className={labelClass}>
                {t(filtro.i18n)}
              </label>
              <select
                id={`filtro-tec-${filtro.param}`}
                value={filtrosTecnicos[filtro.param] || ''}
                onChange={e => onSetParam(filtro.param, e.target.value)}
                className={selectClass}
              >
                <option value="">{t('catalog.all')}</option>
                {filtro.opciones.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      ))}

      {/* Rangos numéricos transversales (horas de uso máximas, año mínimo).
          La comparación se hace sobre las columnas generadas
          (espec_horas / espec_anio). */}
      <div className="mb-5 border-t border-line pt-4">
        <h4 className="t-label mb-3 text-ink/45">
          <span className="inline-flex items-center gap-1">
            <Ruler size={12} aria-hidden="true" /> {t('catalog.filters.rangeTitle')}
          </span>
        </h4>
        {RANGOS_NUMERICOS.map(rango => {
          const sugerido = RANGOS_SUGERIDOS[rango.param];
          return (
            <div className="mb-4" key={rango.param}>
              <label htmlFor={`filtro-rango-${rango.param}`} className={labelClass}>
                {t(rango.i18n)}
              </label>
              <div className="relative">
                <input
                  id={`filtro-rango-${rango.param}`}
                  type="number"
                  inputMode="numeric"
                  min={sugerido?.min ?? rango.min ?? 0}
                  max={sugerido?.max}
                  step={sugerido?.step ?? 1}
                  value={rangos[rango.param] || ''}
                  onChange={e => onSetParam(rango.param, e.target.value)}
                  placeholder={rango.operador === 'lte' ? t('catalog.max') : t('catalog.min')}
                  className={`${inputClass} pr-12`}
                />
                <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[11px] text-ink/40">
                  {rango.unidad}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

  'w-full border border-line-strong rounded-lg px-3 py-2.5 text-sm text-ink bg-[#FBFAF5] font-medium focus:outline-none focus:ring-2 focus:ring-signal-deep';
  'w-full border border-line-strong rounded-lg px-3 py-2.5 text-sm text-ink bg-[#FBFAF5] focus:outline-none focus:ring-2 focus:ring-signal-deep';