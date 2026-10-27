import { serializeJsonLd } from '@/lib/serialize-json-ld'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import LocalLink from '@/components/LocalLink'
import ProductCard from '@/components/ProductCard'
import { supabase } from '@/lib/supabase-server-client'
import { CATALOG_PRODUCT_COLUMNS,
  CATALOG_FILTRO_MODERACION,
  aplicarOrdenCatalogo,
  marcarDestacados,
  ordenarProductosCatalogo, type ProductoCatalogo } from '@/lib/catalog-consulta'
import { descripcionSeo, tituloSeo } from '@/lib/seo'

// ── Landings SEO por tipo de vendedor (Fase 3) ────────────────────────────
// /comprar-a-particulares y /comprar-a-profesionales
// Tres carpetas estáticas (una por slug) que comparten este componente:
// las rutas estáticas ganan la prioridad frente al catch-all /[ciudad] y el
// segmento no depende de la resolución de params dinámicos.

export type SlugTipo = 'particulares' | 'profesionales'

export const SLUG_A_TIPO: Record<SlugTipo, 'particular' | 'taller' | 'profesional'> = {
  particulares: 'particular',
  profesionales: 'profesional' }

const TIPO_A_PLURAL_KEY: Record<SlugTipo, string> = {
  particulares: 'particulares',
  profesionales: 'profesionales' }

const BASE_URL = 'https://maquinaria.click'
const LIMITE = 24

export async function metadataParaTipo(locale: string, slug: SlugTipo): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'vendedorLanding' })
  const tipoKey = SLUG_A_TIPO[slug]

  const canonical = `${BASE_URL}/comprar-a-${slug}`
  const description = descripcionSeo(t(`${tipoKey}.metaDescription`))
  return {
    title: tituloSeo(t(`${tipoKey}.metaTitle`)),
    description,
    alternates: {
      // Solo la versión ES se indexa (la /en lleva X-Robots-Tag: noindex).
      canonical,
      languages: { 'es-ES': canonical, 'x-default': canonical } },
    openGraph: {
      title: t(`${tipoKey}.metaTitle`),
      description,
      locale: 'es_ES',
      url: canonical,
      type: 'website',
      siteName: 'MaquinariaOcasión',
      images: [{ url: BASE_URL + '/api/og/catalog?categoria=agricola', width: 1200, height: 630, alt: t(`${tipoKey}.metaTitle`) }] },
    twitter: {
      card: 'summary_large_image',
      title: t(`${tipoKey}.metaTitle`),
      description,
      images: [BASE_URL + '/api/og/catalog?categoria=agricola'] } }
}

async function getProductosDeTipo(tipo: string) {
  if (!supabase) return [] as ProductoCatalogo[]
  try {
    const { data, error } = await aplicarOrdenCatalogo(
      supabase
        .from('productos')
        .select(CATALOG_PRODUCT_COLUMNS, { count: 'exact' })
        .eq('activo', true)
        .or(CATALOG_FILTRO_MODERACION)
        .eq('vendedor_tipo', tipo),
    ).limit(LIMITE)

    if (error || !data) return []
    // Mismo orden que el catálogo: boost > destacado vigente > fecha.
    return ordenarProductosCatalogo(marcarDestacados(data as unknown as ProductoCatalogo[]))
  } catch {
    return []
  }
}

/**
 * ISR de 5 minutos: estas landings también listan anuncios y se prerenderizan,
 * así que sin `revalidate` se quedaban con los anuncios del día del build.
 */
export const revalidate = 300

export default async function ComprarATipoPage({
  params,
  slug }: {
  params: Promise<{ locale: string }>
  slug: SlugTipo
}) {
  const { locale } = await params
  const tipoKey = SLUG_A_TIPO[slug]
  if (!tipoKey) notFound()

  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'vendedorLanding' })
  const tt = await getTranslations({ locale, namespace: 'tiposVendedor' })
  const tnav = await getTranslations({ locale, namespace: 'nav' })
  const productos = await getProductosDeTipo(tipoKey)

  const pageUrl = BASE_URL + '/comprar-a-' + slug
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL + '/' },
      { '@type': 'ListItem', position: 2, name: 'Catálogo', item: BASE_URL + '/catalogo' },
      { '@type': 'ListItem', position: 3, name: t(`${tipoKey}.title`), item: pageUrl },
    ] }
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': pageUrl + '#collection',
    name: t(`${tipoKey}.title`),
    description: t(`${tipoKey}.intro`),
    url: pageUrl,
    isPartOf: { '@id': BASE_URL + '/#website' },
    breadcrumb: { '@id': pageUrl + '#breadcrumb' },
    ...(productos.length > 0 ? { mainEntity: { '@id': pageUrl + '#itemlist' } } : {}) }
  const itemListJsonLd = productos.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': pageUrl + '#itemlist',
    name: t(`${tipoKey}.title`),
    numberOfItems: productos.length,
    itemListElement: productos.map((p: any, i: number) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: BASE_URL + '/producto/' + (p.slug || p.id),
      name: p.titulo,
      ...(p.imagen_url ? { image: p.imagen_url } : {}),
      offers: { '@type': 'Offer', price: p.precio_usd || 0, priceCurrency: 'EUR', availability: 'https://schema.org/InStock', url: BASE_URL + '/producto/' + (p.slug || p.id) } })) } : null
  const graphJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [breadcrumbJsonLd, collectionJsonLd, ...(itemListJsonLd ? [itemListJsonLd] : [])] }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(graphJsonLd) }} />
      <header className="border-b border-line">
        <div className="shell pb-10 pt-8 md:pb-14 md:pt-12">
          <nav aria-label="breadcrumb" className="t-eyebrow flex flex-wrap items-center gap-2 text-ink/40">
            <LocalLink href="/" className="transition-colors hover:text-ink">{tnav('home')}</LocalLink>
            <span className="text-ink/25">/</span>
            <LocalLink href="/catalogo" className="transition-colors hover:text-ink">{tnav('catalog')}</LocalLink>
            <span className="text-ink/25">/</span>
            <span aria-current="page" className="text-ink">{tt(TIPO_A_PLURAL_KEY[slug])}</span>
          </nav>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="t-display t-display-lg text-ink lg:col-span-8">{t(`${tipoKey}.title`)}</h1>
            <p className="text-[14.5px] leading-relaxed text-muted lg:col-span-4 lg:border-l lg:border-line lg:pl-6">
              {t(`${tipoKey}.intro`)}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <LocalLink href={`/catalogo?vendedor=${tipoKey}`} className="btn btn-ink">
              {t('catalogCta')}
            </LocalLink>
            <LocalLink href="/publicar" className="btn btn-outline">
              {t('publishCta')}
            </LocalLink>
          </div>
        </div>
      </header>

      <div className="shell py-12 md:py-16">
        <h2 className="t-eyebrow border-b border-ink pb-3 text-ink">
          {t('gridTitle', { tipo: tt(TIPO_A_PLURAL_KEY[slug]) })}
        </h2>

        {productos.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {productos.map((p, i) => (
              <ProductCard
                key={p.id}
                p={{
                  ...p,
                  precio_usd: p.precio_usd ?? 0,
                  estado: p.estado || '',
                  boosteado_en: p.boosteado_en ?? null,
                  destacado: !!p.destacado,
                  destacado_hasta: p.destacado_hasta ?? null }}
                // Flag pre-computado en el servidor (marcarDestacados) para
                // evitar mismatch de hidratación con la fecha de caducidad.
                isFeatured={!!p._isFeatured}
                priority={i < 4}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 border border-line bg-[#FBFAF5] px-6 py-14 text-center">
            <p className="mx-auto max-w-md text-[14px] leading-relaxed text-muted">{t('empty')}</p>
            <LocalLink href="/publicar" className="btn btn-ink mt-6">
              {t('publishCta')}
            </LocalLink>
          </div>
        )}

        {/* Internal linking entre las tres landings de tipo de vendedor. */}
        <div className="mt-14 border-t border-line pt-5">
          <p className="t-label mb-3 text-ink/40">Otros vendedores</p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(SLUG_A_TIPO) as SlugTipo[])
              .filter(s => s !== slug)
              .map(s => (
                <LocalLink
                  key={s}
                  href={`/comprar-a-${s}`}
                  className="t-label border border-line px-2.5 py-1.5 text-ink/60 transition-colors hover:border-ink hover:text-ink"
                >
                  {t(`${SLUG_A_TIPO[s]}.title`)}
                </LocalLink>
              ))}
          </div>
        </div>
      </div>
    </>
  )
}
