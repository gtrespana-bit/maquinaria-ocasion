/**
 * Cálculos del estimador de precios (Observatorio del portal).
 *
 * Los comparables se buscan en `productos` (anuncios activos) y aquí se
 * calculan los cuartiles y el veredicto. Separado de la ruta para poder
 * testear la matemática sin tocar Supabase.
 */

import { parsearNumeroEs } from '@/lib/filtros-tecnicos'

export interface RangoPrecio {
  n: number
  min: number | null
  p25: number | null
  mediana: number | null
  p75: number | null
  max: number | null
}

export const RANGO_VACIO: RangoPrecio = { n: 0, min: null, p25: null, mediana: null, p75: null, max: null }

/** Percentil por rank-order más cercano sobre una lista YA ordenada asc. */
export function percentil(ordenadosAsc: number[], q: number): number | null {
  if (ordenadosAsc.length === 0) return null
  const idx = Math.max(0, Math.min(ordenadosAsc.length - 1, Math.ceil(q * ordenadosAsc.length) - 1))
  return ordenadosAsc[idx]
}

/** Min/p25/mediana/p75/max de una lista de precios (ignora ≤0 y no numéricos). */
export function calcularRango(precios: unknown[]): RangoPrecio {
  const validos = precios
    .map(p => Number(p))
    .filter(p => Number.isFinite(p) && p > 0)
    .sort((a, b) => a - b)
  if (validos.length === 0) return RANGO_VACIO
  return {
    n: validos.length,
    min: validos[0],
    p25: percentil(validos, 0.25),
    mediana: percentil(validos, 0.5),
    p75: percentil(validos, 0.75),
    max: validos[validos.length - 1],
  }
}

/**
 * Parsea números del JSONB delegando en el parser canónico de
 * `filtros-tecnicos` (enteros, millares ES "145.000", coma decimal "12,5",
 * mezcla "1.450,5" y formato US "1450.5") — el mismo que ya probamos allí.
 */
export function parseNumeroEspec(v: unknown): number | null {
  return parsearNumeroEs(v)
}

export type Veredicto = 'dentro' | 'encima' | 'abajo' | null

/** ¿Dónde cae el precio del vendedor respecto al rango del portal? */
export function veredictoPrecio(tuPrecio: unknown, rango: RangoPrecio): Veredicto {
  const p = Number(tuPrecio)
  if (!Number.isFinite(p) || p <= 0) return null
  if (rango.p25 == null || rango.p75 == null) return null
  if (p > rango.p75) return 'encima'
  if (p < rango.p25) return 'abajo'
  return 'dentro'
}
