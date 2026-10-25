'use client'

/**
 * Adaptador del grid de productos para páginas Server Components.
 *
 * `OptimizedProductGrid` (y `ProductCardLazy`) reciben `t` como prop: en un
 * Server Component no se puede pasar una función a un Client Component (el
 * build de Next falla con "Functions cannot be passed directly to Client
 * Components"). Este wrapper vive en el lado cliente y construye el mismo
 * traductor multi-namespace que usa `CatalogoPage`, con `useTranslations`.
 */
import { useTranslations } from 'next-intl'
import { OptimizedProductGrid } from './OptimizedProductGrid'

interface ProductoGrid {
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
  es_demo?: boolean | null
  destacado: boolean
  destacado_hasta: string | null
  vendedor_verificado: boolean | null
  vendedor_tipo?: string | null
  reservado?: boolean | null
}

export default function ProductGridTraducido({
  productos,
  currentPage,
  itemsPerPage,
}: {
  productos: ProductoGrid[]
  currentPage: number
  itemsPerPage: number
}) {
  const tc = useTranslations('catalog')
  const tp = useTranslations('product')
  const tcm = useTranslations('common')
  const tfam = useTranslations('familias')
  const ttv = useTranslations('tiposVendedor')
  const tpc = useTranslations('productCard')

  const tr = (key: string, vars?: Record<string, string | number>): string => {
    const parts = key.split('.')
    const ns = parts[0]
    const rest = parts.slice(1).join('.')
    if (ns === 'catalog') return tc(rest, vars as never)
    if (ns === 'product') return tp(rest, vars as never)
    if (ns === 'common') return tcm(rest, vars as never)
    if (ns === 'familias') return tfam(rest, vars as never)
    if (ns === 'tiposVendedor') return ttv(rest, vars as never)
    if (ns === 'productCard') return tpc(rest, vars as never)
    return key
  }

  return (
    <OptimizedProductGrid
      productos={productos}
      t={tr}
      currentPage={currentPage}
      itemsPerPage={itemsPerPage}
    />
  )
}
