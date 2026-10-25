'use client'
import { formatPrecio } from '@/lib/precio'
import { boostVigente } from '@/lib/catalog-consulta'

import LocalLink from '@/components/LocalLink'
import BadgeTipoVendedor from '@/components/BadgeTipoVendedor'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { productUrl } from '@/lib/product-url'
import { MapPin, Zap, Star } from 'lucide-react'

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
   * El campo se conserva porque viene en las filas del catálogo.
   */
  es_demo?: boolean | null
}

const PLACEHOLDER_IMAGES = [
  '/placeholder-product.webp',
]

export default function ProductCard({ p, isPromoted, isFeatured, priority }: { p: ProductCardData; isPromoted?: boolean; isFeatured?: boolean; priority?: boolean }) {
  const t = useTranslations()
  // El boost dura BOOST_DIAS (la misma regla que ordena el catálogo):
  // si no se comprueba aquí, la etiqueta ⚡ quedaría para siempre.
  const isBoosted = boostVigente(p.boosteado_en)
  const promoted = isPromoted ?? (isBoosted || isFeatured)

  const imgUrl = p.imagen_url || PLACEHOLDER_IMAGES[p.titulo.charCodeAt(0) % PLACEHOLDER_IMAGES.length]

  return (
    <LocalLink
      href={productUrl(p)}
      className={`bg-white rounded-2xl overflow-hidden group block border transition-all duration-200
        ${promoted
          ? 'border-brand-signal shadow-card hover:shadow-card-hover hover:-translate-y-1.5'
          : 'border-gray-200/80 shadow-card hover:shadow-card-hover hover:-translate-y-1.5 hover:border-brand-signal/70'
        }`}
    >
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {isFeatured && (
          <div className="absolute top-3 left-3 z-10 bg-brand-signal text-brand-darkNav text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
            <Star size={11} className="fill-current" /> {t('productCard.featured')}
          </div>
        )}
        {isBoosted && !isFeatured && (
          <div className="absolute top-3 left-3 z-10 bg-brand-darkNav text-brand-signal text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
            <Zap size={11} className="fill-current" /> {t('productCard.boost')}
          </div>
        )}
        <Image
          src={imgUrl}
          alt={p.titulo}
          width={400}
          height={400}
          sizes="(max-width: 768px) 50vw, 25vw"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading={priority ? 'eager' : 'lazy'}
          priority={priority}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            if (!target.src.includes('/placeholder-product.webp')) {
              target.src = '/placeholder-product.webp'
            }
          }}
        />
        {/* Precio sobre la foto: lo primero que se mira en un marketplace */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-darkNav/90 via-brand-darkNav/50 to-transparent p-3 pt-8">
          <p className="text-2xl font-black tracking-tight text-white leading-none">
            {formatPrecio(p.precio_usd || 0)}
          </p>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 truncate group-hover:text-brand-darkNav transition-colors leading-snug">
          {p.titulo}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {p.reservado && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md">
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              {t('productCard.reserved')}
            </span>
          )}
          {p.vendedor_tipo && <BadgeTipoVendedor tipo={p.vendedor_tipo} />}
          {p.vendedor_verificado && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {t('productCard.verified')}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2 truncate flex items-center gap-1">
          <MapPin size={12} className="shrink-0 text-brand-signal-dark" />
          {p.estado}{p.ubicacion_ciudad ? ` · ${p.ubicacion_ciudad}` : ''}
        </p>
      </div>
    </LocalLink>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200/80 shadow-card animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-6 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  )
}
