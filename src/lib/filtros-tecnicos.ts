/**
 * Registro único de los filtros técnicos del catálogo.
 *
 * Antes cada filtro técnico se declaraba en tres sitios que tenían que
 * mantenerse a mano: el bloque "Ficha técnica" de `CatalogFilters`, el mapa
 * `CAMPOS_TECNICOS` de `useProductLoader` y una copia de ese mismo mapa en
 * `usePrefetch`. Añadir un campo obligaba a tocar tres archivos y, si uno se
 * olvidaba, la caché del prefetch devolvía páginas con filtros distintos a los
 * que pedía el loader (la clave de caché es el conjunto de filtros).
 *
 * Aquí vive la única fuente de verdad: qué parámetro de la query string
 * corresponde a qué clave del JSONB `productos.especificaciones`, en qué grupo
 * de la UI se muestra y con qué opciones (las opciones salen de las mismas
 * listas que usa el formulario de publicación, así que captura y filtro no
 * pueden divergir).
 *
 * ── Sobre la consulta ────────────────────────────────────────────────────
 * Los filtros por opción se aplican con contención JSONB (`@>`, en supabase-js
 * `.contains()`), que es exactamente el operador que cubre el índice GIN
 * `productos_especificaciones_idx` (migración 025). La extracción campo a campo
 * (`especificaciones->>'Campo' = 'valor'`) devuelve el mismo resultado pero NO
 * puede usar ese índice: fuerza un recorrido secuencial de `productos`.
 * Además, todos los filtros activos viajan en una sola condición `@>`, en vez
 * de una condición por campo.
 *
 * Los filtros por RANGO numérico (horas de uso máximas, año mínimo) son otra
 * cosa: `@>` compara igualdad de texto y no sirve para ">" y "<". Esos filtros
 * viven en `RANGOS_NUMERICOS` y su traducción a la consulta está en
 * `src/lib/catalog-consulta.ts` (`aplicarRangosNumericos`): se comparan los
 * números extraídos del JSONB con las claves canónicas (`Horas de uso`,
 * `Año`, …) a través de columnas generadas (`espec_horas`, `espec_anio`).
 *
 * ── Filtros por categoría ───────────────────────────────────────────────
 * La taxonomía tiene tres familias (agrícola, obra, herramientas) con filtros
 * específicos además de los transversales (combustible, documentación y
 * transporte, comunes a todas). `camposPorCategoria` da el conjunto de cada
 * familia para el panel lateral (con el contexto de `?categoria=` o de la
 * subcategoría activa) y `FILTROS_TECNICOS` es la UNIÓN deduplicada por
 * `param`, que es lo que usan la lectura de query, la firma de caché y la
 * traducción a consulta: el contrato de consulta no cambia por categoría.
 *
 * Las claves y los valores llevan espacios y acentos ("Plazas para dormir",
 * "C (Verde)"): supabase-js los envía percent-encoded y PostgREST los decodifica
 * como formulario (`+` → espacio, `%C3%A9` → `é`), así que llegan intactos y el
 * documento de contención se compara tal cual se guardó al publicar.
 */

import {
  OPCIONES_COMBUSTIBLE,
  OPCIONES_DOCUMENTACION,
  OPCIONES_SI_NO,
  OPCIONES_TRACCION_AGRICOLA,
  OPCIONES_ENGANCHE,
  OPCIONES_PTO,
  OPCIONES_TRACCION_OBRA,
  OPCIONES_CAPACIDAD_CARGA,
  OPCIONES_MEDIDAS_TRANSPORTE,
  OPCIONES_POTENCIA_W,
  OPCIONES_TENSION } from './categorias'

/** Bloques en los que se agrupan los filtros técnicos en la barra lateral. */
export type GrupoFiltroTecnico = 'tecnica' | 'documentacion' | 'logistica'

/** Familias/categorías con filtros específicos (claves de `categoriasData`). */
export type SlugCategoria = 'agricola' | 'obra' | 'herramientas'

/** Tipo de control con el que se captura el filtro. */
export type TipoFiltro = 'select' | 'rango'

export interface FiltroTecnico {
  /** Parámetro de la query string: /catalogo?combustible=Diésel */
  param: string
  /** Clave con la que el campo se guarda en el JSONB `especificaciones`. */
  campo: string
  grupo: GrupoFiltroTecnico
  /** Valores ofrecidos. Deben coincidir con las opciones del formulario. */
  opciones: readonly string[]
  /** Clave i18n completa, p. ej. `catalog.filters.fuel`. */
  i18n: string
}

/** Filtros comunes a las tres familias (siempre visibles en el panel). */
const FILTROS_TRANSVERSALES: readonly FiltroTecnico[] = [
  { param: 'combustible', campo: 'Combustible', grupo: 'tecnica', opciones: OPCIONES_COMBUSTIBLE, i18n: 'catalog.filters.fuel' },
  { param: 'documentacion', campo: 'Documentación', grupo: 'documentacion', opciones: OPCIONES_DOCUMENTACION, i18n: 'catalog.filters.docs' },
  { param: 'transporte', campo: '¿Incluye transporte?', grupo: 'logistica', opciones: OPCIONES_SI_NO, i18n: 'catalog.filters.transport' },
]

/** Filtros propios de cada familia. Misma `param` ⇒ misma `campo` (JSONB). */
const FILTROS_ESPECIFICOS: Record<SlugCategoria, readonly FiltroTecnico[]> = {
  agricola: [
    { param: 'traccion', campo: 'Tracción', grupo: 'tecnica', opciones: OPCIONES_TRACCION_AGRICOLA, i18n: 'catalog.filters.drive' },
    { param: 'enganche', campo: 'Enganche', grupo: 'tecnica', opciones: OPCIONES_ENGANCHE, i18n: 'catalog.filters.hitch' },
    { param: 'pto', campo: 'Toma de fuerza (PTO)', grupo: 'tecnica', opciones: OPCIONES_PTO, i18n: 'catalog.filters.pto' },
  ],
  obra: [
    { param: 'traccion', campo: 'Tracción', grupo: 'tecnica', opciones: OPCIONES_TRACCION_OBRA, i18n: 'catalog.filters.drive' },
    { param: 'capacidad', campo: 'Capacidad de carga', grupo: 'logistica', opciones: OPCIONES_CAPACIDAD_CARGA, i18n: 'catalog.filters.capacity' },
    { param: 'medidas', campo: 'Medidas de transporte', grupo: 'logistica', opciones: OPCIONES_MEDIDAS_TRANSPORTE, i18n: 'catalog.filters.transportSize' },
  ],
  herramientas: [
    { param: 'potenciaW', campo: 'Potencia (W)', grupo: 'tecnica', opciones: OPCIONES_POTENCIA_W, i18n: 'catalog.filters.powerW' },
    { param: 'tension', campo: 'Tensión', grupo: 'tecnica', opciones: OPCIONES_TENSION, i18n: 'catalog.filters.voltage' },
    { param: 'bateriaIncluida', campo: 'Batería incluida', grupo: 'tecnica', opciones: OPCIONES_SI_NO, i18n: 'catalog.filters.batteryIncluded' },
  ] }

/** Conjunto de filtros (transversales + específicos) de cada familia. */
export const camposPorCategoria: Record<string, readonly FiltroTecnico[]> =
  Object.fromEntries(
    (Object.keys(FILTROS_ESPECIFICOS) as SlugCategoria[]).map(key => [
      key,
      [...FILTROS_TRANSVERSALES, ...FILTROS_ESPECIFICOS[key]],
    ])
  )

/**
 * Filtros a mostrar para una familia. Sin contexto de familia (catálogo
 * abierto) solo se muestran los transversales: los específicos de una familia
 * no tienen sentido mezclados con los de otra.
 */
export function filtrosDeCategoria(categoria?: string | null): readonly FiltroTecnico[] {
  return (categoria && camposPorCategoria[categoria]) || FILTROS_TRANSVERSALES
}

const vistosParam = new Set<string>()

/**
 * UNIÓN de todos los filtros (transversales + específicos), deduplicada por
 * `param`. Es el contrato que usan la lectura de query, las firmas y la
 * traducción a consulta: un parámetro de cualquier familia se lee siempre,
 * aunque el panel no lo muestre sin su contexto.
 */
export const FILTROS_TECNICOS: readonly FiltroTecnico[] = Object.values(camposPorCategoria)
  .flat()
  .filter(f => {
    if (vistosParam.has(f.param)) return false
    vistosParam.add(f.param)
    return true
  })

const DEFINICION_GRUPOS: readonly {
  grupo: GrupoFiltroTecnico
  icono: string
  i18n: string
}[] = [
  { grupo: 'tecnica', icono: '🔧', i18n: 'catalog.filters.groups.technique' },
  { grupo: 'documentacion', icono: '📄', i18n: 'catalog.filters.groups.docs' },
  { grupo: 'logistica', icono: '🚚', i18n: 'catalog.filters.groups.logistics' },
]

/**
 * Grupos del panel para una familia, SIN los grupos que quedan vacíos
 * (un grupo solo se muestra si lleva al menos un filtro).
 */
export function gruposDeFiltros(categoria?: string | null): readonly {
  grupo: GrupoFiltroTecnico
  icono: string
  i18n: string
  filtros: FiltroTecnico[]
}[] {
  const filtros = filtrosDeCategoria(categoria)
  return DEFINICION_GRUPOS.map(g => ({
    ...g,
    filtros: filtros.filter(f => f.grupo === g.grupo) })).filter(g => g.filtros.length > 0)
}

/** Parámetros de URL que corresponden a un filtro técnico por opción. */
export const PARAMETROS_TECNICOS: readonly string[] = FILTROS_TECNICOS.map(f => f.param)

/** Mapa param → clave del JSONB, mantenido por compatibilidad con los hooks. */
export const CAMPOS_TECNICOS: Record<string, string> = Object.fromEntries(
  FILTROS_TECNICOS.map(f => [f.param, f.campo])
)

export const FILTROS_POR_PARAM: Record<string, FiltroTecnico> = Object.fromEntries(
  FILTROS_TECNICOS.map(f => [f.param, f])
)

// ── Filtros por rango numérico ─────────────────────────────────────────────
//
// Los dos campos numéricos que de verdad segmentan la búsqueda de maquinaria
// (horas de uso máximas y año mínimo) se capturan como número en el
// formulario y se guardan como TEXTO en el JSONB (`String(valor)`), así que un
// `@>` de igualdad no sirve: hay que comparar su valor numérico.
//
// La migración `202609170003_rangos_numericos.sql` añadió columnas GENERATED
// (`espec_anio` entre ellas) y la `202610240001_taxonomia_maquinaria.sql`
// añade `espec_horas`; todas extraen y caste el número del JSONB con COALESCE
// y llevan índice funcional. La consulta de rangos filtra por ESAS columnas
// (comparación numérica real, indexada), no por la clave JSONB — filtrar con
// `->>` hace comparación ALFABÉTICA de texto ('9' > '10') y las claves con
// espacios rompen la ruta.
//
// Si la migración aún no está aplicada, la query falla con "column ... does
// not exist" y `quitarRangos()` + un reintento (en los cargadores) deja el
// catálogo funcionando SOLO con los filtros que no dependen de esa columna.
// La taxonomía actual solo filtra por `espec_horas` y `espec_anio`; cualquier
// columna histórica que quede en la base no forma parte de la búsqueda.

export type OperadorRango = 'gte' | 'lte'

export interface RangoNumerico {
  /** Parámetro de la query string: /catalogo?horasMax=5000&anioMin=2015 */
  param: string
  /** Clave canónica con la que el campo se guarda en el JSONB. */
  campo: string
  /**
   * Claves alternativas (históricas) que también cuentan como el mismo dato.
   * Por ejemplo, el año se guardó alguna vez como "Año de matriculación".
   * La columna generada de la migración las lee todas con COALESCE.
   */
  claves: readonly string[]
  operador: OperadorRango
  grupo: GrupoFiltroTecnico
  /** Columna generada (migraciones 202609170003 / 202610240001) para filtrar. */
  columnaGenerada: string
  i18n: string
  /** Sufijo para el placeholder del input ("h", "año"). */
  unidad: string
  min?: number
}

export const RANGOS_NUMERICOS: readonly RangoNumerico[] = [
  {
    param: 'horasMax',
    campo: 'Horas de uso',
    claves: ['Horas de uso', 'Horas', 'Horas de uso (h)'],
    operador: 'lte',
    grupo: 'tecnica',
    columnaGenerada: 'espec_horas',
    i18n: 'catalog.filters.hoursMax',
    unidad: 'h',
    min: 0 },
  {
    param: 'anioMin',
    campo: 'Año',
    claves: ['Año', 'Año de matriculación', 'Ano de matriculación'],
    operador: 'gte',
    grupo: 'tecnica',
    columnaGenerada: 'espec_anio',
    i18n: 'catalog.filters.anioMin',
    unidad: 'año',
    min: 1950 },
]

export const PARAMETROS_RANGO: readonly string[] = RANGOS_NUMERICOS.map(r => r.param)

export const RANGOS_POR_PARAM: Record<string, RangoNumerico> = Object.fromEntries(
  RANGOS_NUMERICOS.map(r => [r.param, r])
)

/** Columnas generadas que espera la consulta de rangos (para el reintento). */
export const COLUMNAS_RANGO: readonly string[] = RANGOS_NUMERICOS.map(r => r.columnaGenerada)

/**
 * Parseo de un número en los formatos que puede traer el JSONB de
 * `especificaciones`: enteros sueltos ("145000"), separadores de millares en
 * español ("145.000"), decimales con coma ("12,5") y la mezcla ("1.450,5").
 * También el formato US ("1450.5").
 */
export function parsearNumeroEs(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v !== 'string') return null

  let s = v.trim().replace(/[^0-9.,\-]/g, '')
  if (!s || s === '-' || s === '.' || s === ',') return null

  const tieneComaDecimal = /,(\d{1,2})$/.test(s)
  const tienePuntoMiles = /\d\.\d{3}(?=(\D|$))/.test(s)

  if (tieneComaDecimal) {
    // "145.000,5" o "145000,5": la coma es el decimal, los puntos son miles.
    s = s.replace(/\./g, '').replace(',', '.').replace(/^-\./, '-0.')
  } else if (tienePuntoMiles) {
    // "145.000": el punto separa millares → lo quitamos.
    // Ojo: "1450.500" también encaja y se leería como 1.450.500; es el caso
    // ambiguo y se acepta el heurístico (no hay tal formato en la semilla).
    s = s.replace(/\./g, '')
  }

  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/** Filtros técnicos activos por opción: `{ combustible: 'Diésel', traccion: 'Oruga' }`. */
export type FiltrosTecnicos = Record<string, string>

/** Filtros de rango activos: `{ horasMax: 5000, anioMin: 2019 }`. */
export type FiltrosRango = Record<string, number>

type EntradaParams =
  | URLSearchParams
  | Record<string, string | string[] | undefined>
  | null
  | undefined

function leerParam(params: EntradaParams, param: string): string {
  if (!params) return ''
  if (typeof (params as URLSearchParams).get === 'function') {
    return (params as URLSearchParams).get(param) || ''
  }
  const raw = (params as Record<string, string | string[] | undefined>)[param]
  const valor = Array.isArray(raw) ? raw[0] : raw
  return valor || ''
}

/**
 * Extrae de la query string los filtros técnicos conocidos y con valor.
 * Descarta parámetros desconocidos y valores vacíos.
 */
export function leerFiltrosTecnicos(params: EntradaParams): Record<string, string> {
  const filtros: Record<string, string> = {}
  for (const { param } of FILTROS_TECNICOS) {
    const valor = leerParam(params, param).trim()
    if (valor) filtros[param] = valor
  }
  return filtros
}

/** Deja solo los filtros técnicos conocidos y no vacíos. */
export function limpiarFiltrosTecnicos(filtros?: Record<string, unknown> | null): Record<string, string> {
  const limpios: Record<string, string> = {}
  if (!filtros) return limpios
  for (const { param } of FILTROS_TECNICOS) {
    const raw = filtros[param]
    const valor = typeof raw === 'string' ? raw.trim() : ''
    if (valor) limpios[param] = valor
  }
  return limpios
}

/** ¿Hay algún filtro técnico activo? */
export function hayFiltrosTecnicos(filtros?: Record<string, unknown> | null): boolean {
  return Object.keys(limpiarFiltrosTecnicos(filtros)).length > 0
}

/** Lee los filtros de rango de la query string; los no numéricos se descartan. */
export function leerFiltrosRango(params: EntradaParams): FiltrosRango {
  const filtros: FiltrosRango = {}
  for (const rango of RANGOS_NUMERICOS) {
    const valor = leerParam(params, rango.param).trim()
    if (!valor) continue
    const n = parsearNumeroEs(valor)
    if (n != null) filtros[rango.param] = n
  }
  return filtros
}

/** Deja solo los filtros de rango conocidos, numéricos y con valor. */
export function limpiarFiltrosRango(filtros?: Record<string, unknown> | null): FiltrosRango {
  const limpios: FiltrosRango = {}
  if (!filtros) return limpios
  for (const rango of RANGOS_NUMERICOS) {
    const n = typeof filtros[rango.param] === 'number'
      ? (filtros[rango.param] as number)
      : parsearNumeroEs(filtros[rango.param])
    if (n != null) limpios[rango.param] = n
  }
  return limpios
}

/** ¿Hay algún filtro de rango activo? */
export function hayFiltrosRango(filtros?: Record<string, unknown> | null): boolean {
  return Object.keys(limpiarFiltrosRango(filtros)).length > 0
}

/**
 * Traduce los filtros activos al documento JSONB que se busca por contención:
 * `{ combustible: 'Diésel', traccion: 'Oruga' }` → `{ 'Combustible': 'Diésel', 'Tracción': 'Oruga' }`.
 */
export function especificacionesDeFiltros(filtros?: Record<string, unknown> | null): Record<string, string> {
  const specs: Record<string, string> = {}
  const limpios = limpiarFiltrosTecnicos(filtros)
  for (const [param, valor] of Object.entries(limpios)) {
    specs[FILTROS_POR_PARAM[param].campo] = valor
  }
  return specs
}

interface QueryConContains<T> {
  contains: (column: string, value: Record<string, string>) => T
}

/**
 * Aplica los filtros técnicos activos a una consulta de productos con una sola
 * condición `@>` sobre `especificaciones` (índice GIN). Sin filtros activos
 * devuelve la consulta intacta.
 */
export function aplicarFiltrosTecnicos<T extends QueryConContains<unknown>>(
  query: T,
  filtros?: Record<string, unknown> | null
): T {
  const specs = especificacionesDeFiltros(filtros)
  if (Object.keys(specs).length === 0) return query
  return query.contains('especificaciones', specs) as unknown as T
}

/**
 * Firma estable de los filtros técnicos activos (solo los de opción). Se usa
 * para detectar cambios de filtro (y resetear la paginación) sin depender de
 * la identidad del objeto. Los rangos numéricos firman aparte.
 */
export function firmaFiltrosTecnicos(filtros?: Record<string, unknown> | null): string {
  const limpios = limpiarFiltrosTecnicos(filtros)
  return FILTROS_TECNICOS
    .filter(f => limpios[f.param])
    .map(f => `${f.param}=${limpios[f.param]}`)
    .join('&')
}

/** Firma estable de los rangos numéricos activos. */
export function firmaFiltrosRango(filtros?: Record<string, unknown> | null): string {
  const limpios = limpiarFiltrosRango(filtros)
  return RANGOS_NUMERICOS
    .filter(r => limpios[r.param] != null)
    .map(r => `${r.param}=${limpios[r.param]}`)
    .join('&')
}
