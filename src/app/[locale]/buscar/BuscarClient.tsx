'use client'

import LocalLink from '@/components/LocalLink'
import { TIPOS_VENDEDOR } from '@/components/BadgeTipoVendedor'
import { ProductCardLazy } from '@/components/ProductCardLazy'
import { Search, XCircle, Loader2, Bell, BellRing } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useMemo, use } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { categoriasData, FAMILIAS, TODAS_LAS_SUBS, categoriaDeSubcategoria } from '@/lib/categorias'
import UbicacionSelector from '@/components/UbicacionSelector'
import { useTranslations } from 'next-intl'
import { FiltrosTecnicosPanel } from '@/components/FiltrosTecnicosPanel'
import {
  PARAMETROS_RANGO,
  leerFiltrosTecnicos,
  leerFiltrosRango } from '@/lib/filtros-tecnicos'
import {
  aplicarFiltrosBase,
  aplicarOrdenCatalogo,
  esErrorColumnasRango,
  ordenarProductosCatalogo,
  FILTRO_VENDEDOR_PARAM,
  tipoVendedorFiltro, type FiltrosCatalogo} from '@/lib/catalog-consulta'
import { SelectorMarca } from '@/components/SelectorMarca'

type Producto = {
  id: string
  titulo: string
  precio_usd: number | null
  estado: string
  imagen_url: string | null
  ubicacion_ciudad: string | null
  ubicacion_estado: string | null
  creado_en: string
  visitas: number
  subcategoria: string | null
  boosteado_en: string | null
  destacado: boolean | null
  destacado_hasta: string | null
  vendedor_verificado: boolean | null
  vendedor_tipo?: string | null
  reservado?: boolean | null
  descripcion?: string
}

export default function BuscarClient({ searchParams: searchParamsPromise }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = use(searchParamsPromise)
  const router = useRouter()
  const t = useTranslations('search')
  const tc = useTranslations('catalog')
  const t2 = useTranslations()
  // Traductor universal para el panel técnico (resolve 'catalog.*' y, si la
  // clave no está en 'search', cae a 'catalog').
  const tu = (key: string) => {
    const parts = key.split('.')
    const ns = parts[0]
    const rest = parts.slice(1).join('.')
    if (ns === 'catalog') return tc(rest as any)
    return t(key as any)
  }
  
  const query = searchParams?.q || ''
  const categoria = searchParams?.categoria || ''
  const subcategoria = searchParams?.subcategoria || ''
  const marca = searchParams?.marca || ''
  const condicion = searchParams?.condicion || ''
  const ubicacionEstado = searchParams?.estado || ''
  const ubicacionCiudad = searchParams?.ciudad || ''
  const precioMin = searchParams?.precio_min || ''
  const precioMax = searchParams?.precio_max || ''
  const orden = searchParams?.orden || ''
  // ¿Quién vende? (Fase 3): solo se acepta un tipo válido; cualquier otra
  // cosa que venga en la URL se ignora para no romper la búsqueda.
  const vendedor = tipoVendedorFiltro(searchParams?.[FILTRO_VENDEDOR_PARAM]) || ''

  // Filtros técnicos del catálogo (mismo registro): opciones + rangos.
  // Se memoizan por la referencia de `searchParams`: `use()` devuelve la misma
  // referencia mientras no cambie la query string, así que el efecto no se
  // reejecuta en bucle por identidades nuevas.
  const filtrosTecnicos = useMemo(() => leerFiltrosTecnicos(searchParams ?? {}), [searchParams])
  const filtrosRango = useMemo(() => leerFiltrosRango(searchParams ?? {}), [searchParams])
  const rangosEnBruto: Record<string, string> = {}
  for (const k of PARAMETROS_RANGO) {
    const v = searchParams?.[k]
    if (v) rangosEnBruto[k] = v
  }
  // Familia/contexto para los filtros técnicos del panel.
  const categoriaFiltros = categoria || categoriaDeSubcategoria(subcategoria)

  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(false)
  const [resultCount, setResultCount] = useState(0)

  // ---- Búsqueda guardada ("avísame cuando aparezca") ----
  const { user } = useAuth()
  const [busquedaGuardadaId, setBusquedaGuardadaId] = useState<string | null>(null)
  const [guardandoBusqueda, setGuardandoBusqueda] = useState(false)
  const tieneFiltros = !!(query || categoria || subcategoria || marca || condicion || ubicacionEstado || ubicacionCiudad || precioMin || precioMax)

  // ¿Esta búsqueda ya está guardada? (marca el botón como activo)
  useEffect(() => {
    if (!user || !tieneFiltros) { setBusquedaGuardadaId(null); return }
    let cancelled = false
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch('/api/busquedas-guardadas', {
          headers: { Authorization: `Bearer ${session?.access_token || ''}` } })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        const match = (data.busquedas || []).find((b: any) =>
          (b.q || '') === (query || '') &&
          (b.categoria || '') === (categoria || '') &&
          (b.subcategoria || '') === (subcategoria || '') &&
          (b.marca || '') === (marca || '') &&
          (b.ubicacion_ciudad || '') === (ubicacionCiudad || '') &&
          (b.ubicacion_estado || '') === (ubicacionEstado || '')
        )
        setBusquedaGuardadaId(match?.id || null)
      } catch { /* silencioso */ }
    })()
    return () => { cancelled = true }
  }, [user, query, categoria, subcategoria, marca, ubicacionEstado, ubicacionCiudad, tieneFiltros])

  const toggleGuardarBusqueda = async () => {
    if (guardandoBusqueda) return
    if (!user) {
      const params = new URLSearchParams(window.location.search)
      router.push(`/login?redirect=${encodeURIComponent('/buscar?' + params.toString())}`)
      return
    }
    setGuardandoBusqueda(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers = { Authorization: `Bearer ${session?.access_token || ''}`, 'Content-Type': 'application/json' }

      if (busquedaGuardadaId) {
        const res = await fetch(`/api/busquedas-guardadas?id=${busquedaGuardadaId}`, { method: 'DELETE', headers })
        if (res.ok) setBusquedaGuardadaId(null)
      } else {
        const res = await fetch('/api/busquedas-guardadas', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            q: query || null,
            categoria: categoria || null,
            subcategoria: subcategoria || null,
            marca: marca || null,
            condicion: condicion || null,
            ubicacion_estado: ubicacionEstado || null,
            ubicacion_ciudad: ubicacionCiudad || null,
            precio_min: precioMin || null,
            precio_max: precioMax || null }) })
        const data = await res.json()
        if (res.ok && data.id) setBusquedaGuardadaId(data.id)
      }
    } catch { /* silencioso */ } finally {
      setGuardandoBusqueda(false)
    }
  }

  const cat = categoria ? categoriasData[categoria] : undefined
  // Los tipos se ofrecen siempre: con categoría en la URL solo sus tipos; sin
  // ella, los de todas las familias (`categoria` es parámetro legado — hoy la
  // navegación entra por `?subcategoria=`).
  const subs = cat ? cat.subs : TODAS_LAS_SUBS
  // Marcas/modelos estructurados por fabricante (ver @/lib/marcas). Con
  // subcategoría activa solo se ofrecen los modelos aptos para ella.
  const subActiva = subcategoria ? subs.find((s) => s.label === subcategoria) : undefined
  const modelosMarca = subActiva ? subActiva.marcas : subs.flatMap((s) => s.marcas || [])

  const setParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams ? Object.entries(searchParams).filter(([_, v]) => v).map(([k, v]) => [k, v!]) : [])
    if (value) params.set(key, value); else params.delete(key)
    if (key === 'categoria') params.delete('subcategoria')
    router.push('/buscar?' + params.toString())
  }, [searchParams, router])

  const clearAll = () => router.push('/buscar')

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function buscar() {
      const ejecutar = async (conRangos: boolean) => {
        let sq = supabase
          .from('productos')
          .select('id, slug, titulo, precio_usd, estado, imagen_url, ubicacion_ciudad, ubicacion_estado, creado_en, subcategoria, boosteado_en, destacado, destacado_hasta, vendedor_verificado, vendedor_tipo, reservado', { count: 'exact' })
          .eq('activo', true)
          .or('estado_moderacion.is.null,estado_moderacion.eq.aprobado')

        if (categoria) {
          // maybeSingle(): evita el 406 de single() con cero filas.
          const { data: catRow } = await supabase.from('categorias').select('id').eq('nombre', categoria).maybeSingle()
          if (catRow) sq = sq.eq('categoria_id', catRow.id)
        }

        // Filtros compartidos con el catálogo (subcategoría, marca, q,
        // ubicación, precio, condición, ficha técnica y rangos).
        const filtros: Record<string, unknown> = {
          subcategoria,
          marca,
          q: query,
          ubicacionEstado,
          ubicacionCiudad,
          precioMin,
          precioMax,
          condicion,
          [FILTRO_VENDEDOR_PARAM]: vendedor,
          ...filtrosTecnicos }
        if (conRangos) Object.assign(filtros, filtrosRango)
        const { categoria: _cat, ...resto } = filtros
        sq = aplicarFiltrosBase(sq, resto as FiltrosCatalogo) as typeof sq

        if (orden === 'precio_asc') sq = sq.order('precio_usd', { ascending: true })
        else if (orden === 'precio_desc') sq = sq.order('precio_usd', { ascending: false })
        // Por defecto, el mismo ORDER BY que el catálogo (prioridad pagada +
        // fecha): el buscador también promete esa prioridad.
        else sq = aplicarOrdenCatalogo(sq) as typeof sq

        return await sq
      }

      // Plan B: sin columnas generadas de rangos (migración pendiente), reintenta
      // sin los rangos para que el resto de filtros siga funcionando.
      let result = await ejecutar(true)
      if (result.error && esErrorColumnasRango(result.error) && Object.keys(filtrosRango).length > 0) {
        result = await ejecutar(false)
      }

      const { data, count, error } = result
      if (!cancelled) {
        if (!error) {
          let sorted = data as Producto[]
          if (orden !== 'precio_asc' && orden !== 'precio_desc') {
            // Mismo comparador que el catálogo: una sola definición del orden
            // (boost vigente > destacado vigente > fecha) en todo el sitio.
            sorted = ordenarProductosCatalogo(sorted as any) as Producto[]
          }
          setResultCount(count ?? 0)
          setProductos(sorted)
        } else {
          console.error('Error buscando:', error)
          setResultCount(0)
          setProductos([])
        }
        setLoading(false)
      }
    }

    buscar()
    return () => { cancelled = true }
  }, [query, categoria, subcategoria, marca, condicion, ubicacionEstado, ubicacionCiudad, precioMin, precioMax, orden, vendedor, filtrosTecnicos, filtrosRango])

  return (
    <div className="bg-paper">
      <header className="border-b border-line">
        <div className="shell pb-8 pt-8 md:pb-10 md:pt-10">
          <nav aria-label="Migas de pan" className="t-eyebrow flex flex-wrap items-center gap-2 text-ink/40">
            <LocalLink href="/" className="transition-colors hover:text-ink">Inicio</LocalLink>
            <span className="text-ink/25">/</span>
            <span className="text-ink">{t('title')}</span>
            {query && (
              <>
                <span className="text-ink/25">/</span>
                <span className="max-w-[40ch] truncate text-ink/60">&ldquo;{query}&rdquo;</span>
              </>
            )}
          </nav>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
            <h1 className="t-display t-display-md text-ink lg:col-span-8">
              {query ? (
                <>Resultados para &ldquo;{query}&rdquo;</>
              ) : categoria ? (
                <>{cat?.label || categoria} de ocasión</>
              ) : ubicacionCiudad || ubicacionEstado ? (
                <>Maquinaria de ocasión en {ubicacionCiudad || ubicacionEstado}</>
              ) : (
                <>Buscar maquinaria y herramienta de ocasión</>
              )}
            </h1>
            <p className="text-[13.5px] leading-relaxed text-muted lg:col-span-4 lg:border-l lg:border-line lg:pl-6">
              {query
                ? 'Anuncios de particulares, talleres y profesionales de toda España.'
                : categoria
                  ? 'Ficha técnica completa —año, horas de uso, potencia y documentación— y publicación gratuita.'
                  : ubicacionCiudad || ubicacionEstado
                    ? 'Anuncios con ficha técnica, contacto directo con el vendedor y publicación gratuita.'
                    : 'Busca por marca, tipo o provincia entre la maquinaria y herramienta de ocasión publicadas en España.'}
            </p>
          </div>
        </div>
      </header>

      <div className="shell py-8 md:py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[248px_1fr] lg:gap-10">
          {/* Filtros */}
          <aside className="w-full">
            <div className="border border-line bg-[#FBFAF5] p-5 lg:sticky lg:top-[var(--header-offset)] lg:z-10 lg:max-h-[calc(100dvh-var(--header-offset)-1rem)] lg:overflow-y-auto">
              <div className="flex items-baseline justify-between border-b border-ink pb-2.5">
                <h2 className="t-eyebrow text-ink">{t('filters')}</h2>
                {searchParams && Object.keys(searchParams).length > 0 && (
                  <button onClick={clearAll} className="t-label flex items-center gap-1 text-clay hover:underline hover:underline-offset-4">
                    <XCircle size={10} /> {t('clearAll')}
                  </button>
                )}
              </div>

              <div className="mt-4 space-y-4">
                {/* Tipo: familias y subcategorías de la vertical */}
                <div>
                  <label className="t-label mb-1.5 block text-ink/50">{tc('typeLabel')}</label>
                  <select value={subcategoria} onChange={(e) => setParam('subcategoria', e.target.value)} className="field text-[13px]">
                    <option value="">{tc('allTypes')}</option>
                    {FAMILIAS.map((f) => (
                      <optgroup key={f.key} label={t2(`familias.${f.key}.label`)}>
                        {f.subs.map((slug) => {
                          const s = subs.find((x) => x.slug === slug)
                          if (!s) return null
                          return <option key={s.label} value={s.label}>{s.label}</option>
                        })}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {modelosMarca.length > 0 && (
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="t-label text-ink/50">{t('brand')}</label>
                      {marca && (
                        <button onClick={() => setParam('marca', '')} className="t-label flex items-center gap-1 text-clay hover:underline hover:underline-offset-2">
                          <XCircle size={10} /> Quitar
                        </button>
                      )}
                    </div>
                    <SelectorMarca
                      value={marca}
                      modelos={modelosMarca}
                      allLabel={tc('allBrands')}
                      onChange={(v) => setParam('marca', v)}
                      className="field text-[13px]"
                    />
                  </div>
                )}

                <div>
                  <p className="t-label mb-2 text-ink/50">{t('condition')}</p>
                  <div className="space-y-1.5">
                    {['Nuevo', 'Como nuevo', 'Bueno', 'Usado', 'Para repuestos'].map((e) => (
                      <label key={e} className="flex cursor-pointer items-center gap-2 text-[13px] text-ink/75">
                        <input
                          type="checkbox"
                          checked={condicion === e}
                          onChange={(ev) => setParam('condicion', ev.target.checked ? e : '')}
                          className="h-3 w-3 rounded-none border border-line-strong accent-ink"
                        />
                        {e}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-t border-line pt-4">
                  <p className="t-label mb-2 text-ink/50">{t('location')}</p>
                  <UbicacionSelector
                    estado={ubicacionEstado}
                    ciudad={ubicacionCiudad}
                    onChange={(estado, ciudad) => {
                      const params = new URLSearchParams(searchParams ? Object.entries(searchParams).filter(([_, v]) => v).map(([k, v]) => [k, v!]) : [])
                      if (estado) params.set('estado', estado); else params.delete('estado')
                      if (ciudad) params.set('ciudad', ciudad); else params.delete('ciudad')
                      router.push('/buscar?' + params.toString())
                    }}
                  />
                </div>

                <div>
                  <p className="t-label mb-1.5 text-ink/50">{t('priceUsd')}</p>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={precioMin}
                      onChange={(e) => setParam('precio_min', e.target.value)}
                      placeholder="Min"
                      aria-label="Precio mínimo"
                      className="field text-[13px]"
                    />
                    <input
                      type="number"
                      value={precioMax}
                      onChange={(e) => setParam('precio_max', e.target.value)}
                      placeholder="Max"
                      aria-label="Precio máximo"
                      className="field text-[13px]"
                    />
                  </div>
                </div>

                {/* ¿Quién vende? */}
                <div className="border-t border-line pt-4">
                  <p className="t-label mb-2 text-ink/50">{tc('whoSells')}</p>
                  <div className="flex flex-wrap gap-1">
                    {TIPOS_VENDEDOR.map(tipo => {
                      const activo = vendedor === tipo
                      return (
                        <button
                          key={tipo}
                          type="button"
                          aria-pressed={activo}
                          onClick={() => setParam(FILTRO_VENDEDOR_PARAM, activo ? '' : tipo)}
                          className={`t-label border px-2 py-1.5 transition-colors ${
                            activo
                              ? 'border-ink bg-ink text-paper'
                              : 'border-line text-ink/60 hover:border-ink hover:text-ink'
                          }`}
                        >
                          {t2(`tiposVendedor.${tipo}`)}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Ficha técnica: mismo panel que usa /catalogo */}
                <div className="border-t border-line pt-4">
                  <FiltrosTecnicosPanel
                    categoria={categoriaFiltros}
                    filtrosTecnicos={filtrosTecnicos}
                    rangos={rangosEnBruto}
                    t={tu}
                    onSetParam={setParam}
                  />
                </div>

                <div className="border-t border-line pt-4">
                  <label className="t-label mb-1.5 block text-ink/50">Ordenar</label>
                  <select value={orden} onChange={(e) => setParam('orden', e.target.value)} className="field text-[13px]">
                    <option value="">Relevancia</option>
                    <option value="reciente">Más recientes</option>
                    <option value="precio_asc">Precio: menor a mayor</option>
                    <option value="precio_desc">Precio: mayor a menor</option>
                  </select>
                </div>
              </div>
            </div>
          </aside>

          {/* Resultados */}
          <div className="min-w-0 flex-1">
            <div className="border border-line bg-[#FBFAF5] p-4">
              <form action="/buscar" method="GET" className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
                {categoria && <input type="hidden" name="categoria" value={categoria} />}
                {subcategoria && <input type="hidden" name="subcategoria" value={subcategoria} />}
                {marca && <input type="hidden" name="marca" value={marca} />}
                {condicion && <input type="hidden" name="condicion" value={condicion} />}
                {ubicacionEstado && <input type="hidden" name="estado" value={ubicacionEstado} />}
                {ubicacionCiudad && <input type="hidden" name="ciudad" value={ubicacionCiudad} />}
                {precioMin && <input type="hidden" name="precio_min" value={precioMin} />}
                {precioMax && <input type="hidden" name="precio_max" value={precioMax} />}
                {orden && <input type="hidden" name="orden" value={orden} />}
                <div className="relative min-w-0 flex-1">
                  <Search size={14} strokeWidth={1.6} className="absolute left-0 top-1/2 -translate-y-1/2 text-ink/35" aria-hidden="true" />
                  <input
                    name="q"
                    defaultValue={query}
                    placeholder="¿Qué estás buscando?"
                    aria-label="Buscar maquinaria"
                    autoFocus={query === ''}
                    className="field pl-6 text-[14px]"
                  />
                </div>
                <button type="submit" className="btn btn-ink btn-sm shrink-0">Buscar</button>
              </form>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-ink pb-2.5">
              <p className="t-label text-ink/50">
                {loading ? 'Buscando…' : `${resultCount} resultado${resultCount !== 1 ? 's' : ''}`}
                {query && !loading && <span className="text-ink/30"> · &ldquo;{query}&rdquo;</span>}
              </p>
              {tieneFiltros && (
                <button
                  type="button"
                  onClick={toggleGuardarBusqueda}
                  disabled={guardandoBusqueda}
                  className={`t-label inline-flex items-center gap-1.5 border px-2.5 py-1.5 transition-colors ${
                    busquedaGuardadaId
                      ? 'border-ink bg-ink text-paper'
                      : 'border-line text-ink/60 hover:border-ink hover:text-ink'
                  } ${guardandoBusqueda ? 'opacity-60' : ''}`}
                >
                  {guardandoBusqueda ? <Loader2 size={11} className="animate-spin" /> : busquedaGuardadaId ? <BellRing size={11} /> : <Bell size={11} />}
                  {busquedaGuardadaId ? t('savedAlertOn') : t('saveAlert')}
                </button>
              )}
            </div>

            {loading ? (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="border border-line bg-[#FBFAF5]">
                    <div className="aspect-[4/3] bg-paper-2" />
                    <div className="space-y-3 p-4">
                      <div className="skeleton skeleton-title" />
                      <div className="skeleton skeleton-text w-1/2" />
                      <div className="skeleton skeleton-price" />
                    </div>
                  </div>
                ))}
              </div>
            ) : productos.length === 0 ? (
              <div className="mt-6 border border-line bg-[#FBFAF5] px-6 py-16 text-center">
                <p className="t-display t-display-sm text-ink/30">{t('noResults')}</p>
                <p className="mx-auto mt-3 max-w-sm text-[13.5px] leading-relaxed text-muted">{t('noResultsDesc')}</p>
                {query && (
                  <button onClick={() => setParam('q', '')} className="btn btn-outline mt-5">
                    Ver todos los anuncios
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {productos.map((p) => <ProductCardLazy key={p.id} p={p} t={() => ''} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
