'use client'

import { formatPrecio } from '@/lib/precio'
import { boostVigente } from '@/lib/catalog-consulta'

import LocalLink from '@/components/LocalLink'
import BadgeTipoVendedor from '@/components/BadgeTipoVendedor'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { productUrl } from '@/lib/product-url'
import { MapPin, ArrowUpRight } from 'lucide-react'
import BotonComparar from '@/components/BotonComparar'

export interface ProductCardData {
  id: string
  slug?: string | null
  titulo: string
  precio_usd: number | null
  imagen_url: string | null
  ubicacion_ciudad: string | null
  ubicacion_estado: string | null
  estado: string
  boosteado_en: string | null
  destacado: boolean | null
  destacado_hasta: string | null
  vendedor_verificado: boolean | null
  vendedor_tipo?: string | null
  reservado?: boolean | null
  /**
   * Anuncio sembrado por la plataforma. La tarjeta NO lo etiqueta: se muestra
   * igual que cualquier otro anuncio (ver tests/unit/anuncios-sembrados.test.tsx).
   */
  es_demo?: boolean | null
}

const PLACEHOLDER_IMAGES = ['/placeholder-product.webp']

/**
 * Ficha de anuncio.
 *
 * Lenguaje: foto 4:3 en marco de 1 px, precio en display con cifras tabulares
 * y metadatos en monoespaciada. La foto se apaga ligeramente en reposo y
 * recupera color al pasar el ratón: el gesto es intencionado, no decorativo —
 * centra la atención en la máquina solo cuando el usuario la señala.
 */
export default function ProductCard({
  p,
  isPromoted,
  isFeatured,
  priority,
  className = '' }: {
  p: ProductCardData
  isPromoted?: boolean
  isFeatured?: boolean
  priority?: boolean
  className?: string
}) {
  const t = useTranslations()
  const isBoosted = boostVigente(p.boosteado_en)
  const promoted = isPromoted ?? (isBoosted || isFeatured || Boolean(p.destacado))
  const imgUrl = p.imagen_url || PLACEHOLDER_IMAGES[0]
  const ubicacion = p.ubicacion_ciudad || p.ubicacion_estado || 'España'

  return (
    <LocalLink
      href={productUrl(p)}
      className={`group/card relative flex flex-col border bg-[#FBFAF5] transition-[border-color,transform,box-shadow] duration-300 ease-editorial hover:-translate-y-1 hover:border-ink hover:shadow-card-hover ${
        promoted ? 'border-ink' : 'border-line'
      } ${className}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-paper-2">
        <Image
          src={imgUrl}
          alt={p.titulo}
          fill
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 24vw"
          className="object-cover saturate-[0.92] transition-[transform,filter] duration-700 ease-editorial group-hover/card:scale-[1.035] group-hover/card:saturate-100"
          loading={priority ? 'eager' : 'lazy'}
          priority={priority}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
          quality={78}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            if (!target.src.includes('/placeholder-product.webp')) {
              target.src = '/placeholder-product.webp'
            }
          }}
        />

        {/* Etiquetas */}
        <div className="absolute left-0 top-0 flex flex-col items-start">
          {isFeatured && (
            <span className="t-label bg-signal px-2 py-1.5 text-ink">
              {t('productCard.featured')}
            </span>
          )}
          {isBoosted && !isFeatured && (
            <span className="t-label bg-ink px-2 py-1.5 text-signal">{t('productCard.boost')}</span>
          )}
        </div>

        {p.reservado && (
          <span className="t-label absolute right-2 top-2 border border-ink bg-paper/95 px-2 py-1 text-ink">
            {t('productCard.reserved')}
          </span>
        )}

        <BotonComparar
          item={{
            id: p.id,
            slug: p.slug ?? null,
            titulo: p.titulo,
            precio_usd: p.precio_usd ?? null,
            imagen_url: p.imagen_url ?? null }}
          className="absolute bottom-2 right-2 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100 focus-visible:opacity-100"
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-[-0.01em] text-ink">
            {p.titulo}
          </h3>
          <ArrowUpRight
            size={15}
            strokeWidth={1.6}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-ink/25 transition-all duration-300 group-hover/card:text-ink"
          />
        </div>

        <p className="t-label mt-2 flex items-center gap-1.5 truncate text-ink/45">
          <MapPin size={10} strokeWidth={1.8} className="shrink-0" />
          {[p.estado, ubicacion].filter(Boolean).join(' · ')}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {p.vendedor_verificado && (
            <span className="t-label inline-flex items-center gap-1 border border-moss/30 bg-moss-soft px-1.5 py-1 text-moss">
              <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {t('productCard.verified')}
            </span>
          )}
          {p.vendedor_tipo && <BadgeTipoVendedor tipo={p.vendedor_tipo} />}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <p className="t-display t-num text-[1.35rem] leading-none text-ink">
            {formatPrecio(p.precio_usd || 0)}
          </p>
        </div>
      </div>
    </LocalLink>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="border border-line bg-[#FBFAF5]">
      <div className="aspect-[4/3] bg-paper-2" />
      <div className="space-y-3 p-4">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text w-1/2" />
        <div className="skeleton skeleton-price" />
      </div>
    </div>
  )
}
