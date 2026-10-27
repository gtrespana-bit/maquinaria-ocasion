'use client'

import { serializeJsonLd } from '@/lib/serialize-json-ld'
import { useEffect, useMemo, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import LocalLink from '@/components/LocalLink'
import BotonComparar from '@/components/BotonComparar'
import Image from 'next/image'
import { Search, ChevronRight, XCircle, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { TODAS_LAS_SUBS, familiaDeSub, categoriaDeSubcategoria } from '@/lib/categorias'
import UbicacionSelector from '@/components/UbicacionSelector'
import { Pagination } from '@/components/Pagination'
import { OptimizedProductGrid } from '@/components/OptimizedProductGrid'
import { CatalogFilters } from '@/components/CatalogFilters'
import BadgeTipoVendedor from '@/components/BadgeTipoVendedor'
import { useProductPagination } from '@/hooks/useProductPagination'
import { useProductLoader } from '@/hooks/useProductLoader'
import { CATALOG_PAGE_SIZE } from '@/lib/catalog-pagination'
import {
  PARAMETROS_RANGO,
  firmaFiltrosTecnicos,
  firmaFiltrosRango,
  hayFiltrosTecnicos,
  hayFiltrosRango,
  leerFiltrosTecnicos,
  leerFiltrosRango } from '@/lib/filtros-tecnicos'
import { FILTRO_VENDEDOR_PARAM } from '@/lib/catalog-consulta'
import { LoadingIndicator } from '@/components/LoadingIndicator'
import { usePrefetch } from '@/hooks/usePrefetch'
import { esErrorDeCredenciales, esErrorDeRed } from '@/lib/supabase-diagnostico'

type Producto = {
  id: string
  slug?: string | null
  titulo: string
  precio_usd: number
  estado: string
  imagen_url: string | null
  ubicacion_ciudad: string | null
  ubicacion_estado: string | null
  creado_en: string
  subcategoria: string | null
  boosteado_en: string | null
  destacado: boolean
  destacado_hasta: string | null
  vendedor_verificado: boolean | null
  vendedor_tipo?: string | null
  reservado?: boolean | null
}

interface CatalogoPageProps {
  initialProducts?: Producto[]
  initialCount?: number
}


export default function CatalogoClient({ initialProducts = [], initialCount = 0 }: CatalogoPageProps) {
  const tc = useTranslations('catalog')
  const tp = useTranslations('product')
  const tcm = useTranslations('common')
  const tfam = useTranslations('familias')
  const tpcard = useTranslations('productCard')
  const ttv = useTranslations('tiposVendedor')
  // Universal translator function (supports any namespace with variables)
  const t = (key: string, vars?: Record<string, string | number>) => {
    const parts = key.split('.')
    const ns = parts[0]
    const rest = parts.slice(1).join('.')
    if (ns === 'catalog') return tc(rest, vars as any)
    if (ns === 'product') return tp(rest, vars as any)
    if (ns === 'common') return tcm(rest, vars as any)
    if (ns === 'familias') return tfam(rest, vars as any)
    if (ns === 'tiposVendedor') return ttv(rest, vars as any)
    if (ns === 'productCard') return tpcard(rest, vars as any)
    return key
  }
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  // En móvil la columna de filtros se pliega: es larga y empujaría el listado
  // fuera de la primera pantalla.
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)

  // Usar hook de paginación
  const { currentPage, itemsPerPage, goToPage } = useProductPagination({ itemsPerPage: CATALOG_PAGE_SIZE })

  const categoria = searchParams.get('categoria') || ''
  const subcategoria = searchParams.get('subcategoria') || ''
  const marca = searchParams.get('marca') || ''
  const q = searchParams.get('q') || ''
  const precioMin = searchParams.get('precioMin') || ''
  const precioMax = searchParams.get('precioMax') || ''
  const ubicacionEstado = searchParams.get('estado') || ''
  const ubicacionCiudad = searchParams.get('ciudad') || ''

  // Filtros técnicos (ficha técnica): año, horas, combustible, tracción…
  // Todos se leen de una vez desde el registro
  // @/lib/filtros-tecnicos, que también decide las opciones que ofrece la barra
  // lateral.
  //
  // Se memoiza con el string de la query (primitivo) y no con el objeto de
  // `useSearchParams`: si su identidad cambiase entre renders, los efectos que
  // dependen de los filtros se reejecutarían en bucle.
  // Filtro "¿Quién vende?" (Fase 3): particular, taller o profesional.
  const vendedor = searchParams.get(FILTRO_VENDEDOR_PARAM) || ''

  const queryString = searchParams.toString()
  const filtrosTecnicos = useMemo(() => leerFiltrosTecnicos(new URLSearchParams(queryString)), [queryString])
  const firmaTecnica = firmaFiltrosTecnicos(filtrosTecnicos)

  // Rangos numéricos del catálogo (horas máximas y año mínimo): se leen
  // como número para la query, pero el input los conserva como texto de forma
  // directa desde la URL para poder editar sin volver a parsear.
  const filtrosRango = useMemo(() => leerFiltrosRango(new URLSearchParams(queryString)), [queryString])
  const firmaRango = firmaFiltrosRango(filtrosRango)
  const rangosEnBruto = useMemo(() => {
    const enBruto: Record<string, string> = {}
    const sp = new URLSearchParams(queryString)
    for (const k of PARAMETROS_RANGO) {
      const v = sp.get(k)
      if (v) enBruto[k] = v
    }
    return enBruto
  }, [queryString])

  const hasActiveFilters = !!(
    categoria || subcategoria || marca || q || precioMin || precioMax ||
    ubicacionEstado || ubicacionCiudad || vendedor || hayFiltrosTecnicos(filtrosTecnicos) ||
    hayFiltrosRango(filtrosRango)
  )

  // Carga real por página desde el servidor (range()).
  const { productos: loadedProductos, loading, error, totalCount: loaderTotalCount, loadPage } = useProductLoader();
  const { prefetchPage } = usePrefetch();

  // Durante la primera renderización SSR (página 1 sin filtros) usamos los
  // productos servidos por el servidor. En cuanto se navega o se filtran, se
  // pasa a los productos cargados desde el cliente (server-driven por página).
  const [useServerData, setUseServerData] = useState(false)

  // ¿Mostramos los iniciales del SSR o los cargados por página?
  const showInitialSSR = !useServerData && !hasActiveFilters && currentPage === 1
  const productosToShow = showInitialSSR ? initialProducts : loadedProductos
  const totalCountToUse = showInitialSSR ? initialCount : loaderTotalCount

  // totalPages se calcula con el total REAL (totalCount), no con las filas
  // cargadas. Así la paginación es correcta aunque solo se cargue una página.
  const totalPages = Math.max(1, Math.ceil(totalCountToUse / itemsPerPage))

  // Firma de filtros para detectar cambios y resetear la página.
  const filterSig = [categoria, subcategoria, marca, q, precioMin, precioMax, ubicacionEstado, ubicacionCiudad, firmaTecnica, firmaRango, vendedor].join('|')
  const prevFilterSig = useRef(filterSig)

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value); else params.delete(key)
    if (key === 'categoria') params.delete('subcategoria')
    router.push(`${pathname}?${params.toString()}`)
  }

  useEffect(() => {
    // Si cambian los filtros y no estamos en la página 1, resetear a la página 1.
    if (prevFilterSig.current !== '' && prevFilterSig.current !== filterSig && currentPage !== 1) {
      prevFilterSig.current = filterSig
      goToPage(1)
      return
    }
    prevFilterSig.current = filterSig

    // Durante la primera renderización SSR (página 1 sin filtros) usamos los
    // productos del servidor; no hace falta recargar.
    if (!hasActiveFilters && currentPage === 1 && !useServerData) {
      return
    }

    setUseServerData(true)
    loadPage({
      page: currentPage,
      pageSize: itemsPerPage,
      filters: {
        categoria,
        subcategoria,
        marca,
        q,
        precioMin,
        precioMax,
        ubicacionEstado,
        ubicacionCiudad,
        [FILTRO_VENDEDOR_PARAM]: vendedor || undefined,
        ...filtrosTecnicos,
        ...filtrosRango
      }
    });
  }, [filterSig, currentPage, itemsPerPage, hasActiveFilters, useServerData, goToPage, loadPage, categoria, subcategoria, marca, q, precioMin, precioMax, ubicacionEstado, ubicacionCiudad, filtrosTecnicos, filtrosRango, vendedor]);

  // Precargar la siguiente página cuando sea apropiado
  useEffect(() => {
    if (!loading && productosToShow.length > 0 && totalPages > currentPage) {
      // Precargar la siguiente página después de un breve retraso
      const prefetchTimer = setTimeout(() => {
        prefetchPage(
          currentPage + 1,
          itemsPerPage,
          {
            categoria,
            subcategoria,
            marca,
            q,
            precioMin,
            precioMax,
            ubicacionEstado,
            ubicacionCiudad,
                [FILTRO_VENDEDOR_PARAM]: vendedor || undefined,
            ...filtrosTecnicos,
            ...filtrosRango
          }
        );
      }, 2000); // Precargar después de 2 segundos para permitir la carga completa de la página actual

      return () => clearTimeout(prefetchTimer);
    }
  }, [currentPage, totalPages, loading, productosToShow.length, categoria, subcategoria, marca, q, precioMin, precioMax, ubicacionEstado, ubicacionCiudad, filtrosTecnicos, filtrosRango, vendedor, itemsPerPage, prefetchPage]);

  const subActiva = TODAS_LAS_SUBS.find(s => s.label === subcategoria)
  // Familia/contexto de filtros: `?categoria=` o la familia de la subelegida.
  const categoriaFiltros = categoria || categoriaDeSubcategoria(subcategoria)
  const subLabel = subcategoria
    ? (subActiva?.label || subcategoria)
    : ''

  const tituloMostrar = q
    ? t('catalog.resultsFor', { q })
    : subcategoria
      ? subLabel
      : t('catalog.allProducts')

  // Generar breadcrumbs jerárquicos con schema.org
  const breadcrumbs = [
    { label: t('catalog.breadcrumb'), href: '/' },
    { label: t('catalog.title'), href: '/catalogo' }
  ]

  if (subcategoria) {
    // Jerarquía real del vertical: Familia → Tipo.
    const familia = subActiva ? familiaDeSub(subActiva.slug) : undefined
    if (familia) {
      breadcrumbs.push({
        label: `${familia.icon} ${t('familias.' + familia.key + '.label')}`,
        href: '' // Agrupación, sin página propia
      })
    }
    breadcrumbs.push({ 
      label: subLabel, 
      href: '' // Página actual
    })
  }
  
  if (q) {
    breadcrumbs.push({ 
      label: `${t('catalog.searchLabel')}: "${q}"`, 
      href: '' // Página actual
    })
  }
  
  // Schema.org BreadcrumbList JSON-LD
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label.replace(/^[^ ]+ /, ''), // Remover emoji del nombre para schema
      item: item.href ? `https://maquinaria.click${item.href}` : undefined
    }))
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbSchema) }}
      />
      {/* Cabecera del catálogo */}
      <div className="border-b border-line bg-paper">
        <div className="shell pt-5 pb-7 md:pt-7 md:pb-9">
          <nav className="t-eyebrow flex flex-wrap items-center gap-2 text-ink/40" aria-label="Breadcrumb">
            {breadcrumbs.map((item, index) => (
              <span key={index} className="flex items-center gap-2">
                {index > 0 && <span aria-hidden="true" className="text-ink/25">/</span>}
                {item.href ? (
                  <LocalLink href={item.href} className="transition-colors hover:text-ink">
                    {item.label.replace(/^[^ ]+ /, '')}
                  </LocalLink>
                ) : (
                  <span className="text-ink">{item.label.replace(/^[^ ]+ /, '')}</span>
                )}
              </span>
            ))}
          </nav>

          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="t-display t-display-lg text-ink">{tituloMostrar}</h1>
              <p className="t-label mt-3 text-muted">
                {loading ? t('common.loading') : t('catalog.results', { count: totalCountToUse || 0 })}
              </p>
            </div>
            <form action="/buscar" method="GET" className="flex w-full items-center gap-2 md:w-auto">
              <label htmlFor="catalogo-q" className="sr-only">
                {t('common.search')}
              </label>
              <div className="flex flex-1 items-center gap-2 border-b border-line-strong focus-within:border-ink md:w-64">
                <Search size={15} strokeWidth={1.6} className="shrink-0 text-ink/35" />
                <input
                  id="catalogo-q"
                  name="q"
                  defaultValue={q}
                  placeholder={t('catalog.searchLabel')}
                  className="w-full bg-transparent py-2 text-sm text-ink placeholder:text-ink/35 focus:outline-none"
                />
              </div>
              <button type="submit" className="btn btn-ink btn-sm shrink-0">
                {t('common.search')}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="shell py-8 md:py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[264px_1fr] lg:gap-10">
          {/* Filtros */}
          <aside className="w-full">
            <button
              type="button"
              onClick={() => setFiltrosAbiertos((v) => !v)}
              aria-expanded={filtrosAbiertos}
              className="mb-4 flex w-full items-center justify-between border border-line px-4 py-3 text-left lg:hidden"
            >
              <span className="t-eyebrow text-ink">{t('catalog.filtersTitle')}</span>
              <ChevronRight
                size={15}
                className={`text-ink/50 transition-transform ${filtrosAbiertos ? 'rotate-90' : ''}`}
              />
            </button>
            <div className={`${filtrosAbiertos ? 'block' : 'hidden'} lg:block`}>
              <CatalogFilters
                categoria={categoriaFiltros}
                subcategoria={subcategoria}
                marca={marca}
                precioMin={precioMin}
                precioMax={precioMax}
                ubicacionEstado={ubicacionEstado}
                ubicacionCiudad={ubicacionCiudad}
                filtrosTecnicos={filtrosTecnicos}
                rangos={rangosEnBruto}
                vendedor={vendedor}
                t={t}
              />
              <div className="mt-4">
                <UbicacionSelector
                  estado={ubicacionEstado}
                  ciudad={ubicacionCiudad}
                  onChange={(estado, ciudad) => {
                    const params = new URLSearchParams(searchParams.toString())
                    if (estado) params.set('estado', estado)
                    else params.delete('estado')
                    if (ciudad) params.set('ciudad', ciudad)
                    else params.delete('ciudad')
                    router.push(`${pathname}?${params.toString()}`)
                  }}
                />
              </div>
            </div>
          </aside>

          {/* Resultados */}
          <div className="min-w-0">
            {error && (
              <div
                className="mb-6 flex items-start gap-3 border border-clay/40 bg-clay/[0.04] p-5 text-clay"
                role="alert"
              >
                <XCircle size={18} strokeWidth={1.8} className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{t('catalog.loadErrorTitle')}</p>
                  {/* Nunca se muestra el mensaje técnico de Supabase. */}
                  <p className="mt-1 text-[13px] text-ink/70">
                    {esErrorDeCredenciales(error) || esErrorDeRed(error)
                      ? t('catalog.serviceUnavailable')
                      : error}
                  </p>
                  <button
                    onClick={() =>
                      loadPage({
                        page: currentPage,
                        pageSize: itemsPerPage,
                        filters: {
                          categoria, subcategoria, marca, q, precioMin, precioMax,
                          ubicacionEstado, ubicacionCiudad,
                          [FILTRO_VENDEDOR_PARAM]: vendedor || undefined,
                          ...filtrosTecnicos, ...filtrosRango } })
                    }
                    className="t-eyebrow mt-3 border-b border-clay pb-0.5 text-clay"
                  >
                    {t('catalog.retry')}
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <LoadingIndicator count={6} />
            ) : !error && productosToShow.length === 0 ? (
              <div className="flex flex-col items-start gap-4 border border-dashed border-line-strong px-6 py-14 md:px-10">
                <span className="flex h-11 w-11 items-center justify-center border border-line">
                  <Search size={18} strokeWidth={1.5} className="text-ink/40" />
                </span>
                <h2 className="t-display t-display-sm text-ink">{t('catalog.empty')}</h2>
                <p className="max-w-md text-sm text-muted">{t('catalog.emptyCta')}</p>
                <LocalLink href="/publicar" className="btn btn-signal btn-sm mt-1">
                  {t('catalog.publishFree')}
                  <ArrowRight size={14} />
                </LocalLink>
              </div>
            ) : (
              <OptimizedProductGrid
                productos={productosToShow}
                t={t}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
              />
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={totalCountToUse}
            />
          </div>
        </div>
      </div>
    </>
  )
}