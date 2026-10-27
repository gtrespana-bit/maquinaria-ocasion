import { serializeJsonLd } from '@/lib/serialize-json-ld'
import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import LocalLink from '@/components/LocalLink'
import ProductCard from '@/components/ProductCard'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { aplicarOrdenCatalogo } from '@/lib/catalog-consulta'
import {
  LANDINGS_CATEGORIA_LIST,
  SUBCATEGORIAS_SEO,
  getLandingCategoriaSEO, type LandingCategoriaSEO} from '@/lib/categorias-seo'
import { FAMILIAS, familiaDeSub } from '@/lib/categorias'
import { productUrl } from '@/lib/product-url'
import { alternatesSeo, descripcionSeo, tituloSeo } from '@/lib/seo'

const BASE_URL = 'https://maquinaria.click'
const PRODUCT_LIMIT = 24

type Props = {
  params: Promise<{ locale: string; categoria: string }>
}

type ProductoCategoria = {
  id: string
  slug?: string | null
  titulo: string
  precio_usd: number | null
  estado: string | null
  imagen_url: string | null
  ubicacion_ciudad: string | null
  ubicacion_estado: string | null
  subcategoria: string | null
  creado_en: string
}

export function generateStaticParams() {
  // Familias (3) + subcategorías (12): las landings nacionales indexables.
  return LANDINGS_CATEGORIA_LIST.map((categoria) => ({ categoria: categoria.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria: slug, locale } = await params
  const categoria = getLandingCategoriaSEO(slug)

  if (!categoria) {
    return { title: 'Categoría no encontrada', robots: { index: false, follow: false } }
  }

  const canonical = `${BASE_URL}/categoria/${categoria.slug}`

  return {
    title: tituloSeo(categoria.titulo),
    description: descripcionSeo(categoria.descripcion),
    keywords: categoria.terminos,
    alternates: alternatesSeo(`/categoria/${categoria.slug}`),
    openGraph: {
      type: 'website',
      locale: 'es_ES',
      url: canonical,
      title: categoria.titulo,
      description: categoria.descripcion,
      images: [{
        url: `${BASE_URL}/api/og/catalog?categoria=${categoria.slug}`,
        width: 1200,
        height: 630,
        alt: `${categoria.nombre} en venta en España` }] },
    robots: locale === 'en'
      ? { index: false, follow: true }
      : { index: true, follow: true } }
}

async function getProductos(categoria: LandingCategoriaSEO): Promise<{ productos: ProductoCategoria[]; total: number }> {
  const supabase = getSupabaseServerClient()
  if (!supabase) return { productos: [], total: 0 }

  try {
    // Familia → categoria_id (fila de `categorias`); subcategoría → la
    // etiqueta visible guardada en productos.subcategoria.
    let query = supabase
      .from('productos')
      .select('id, slug, titulo, precio_usd, estado, imagen_url, ubicacion_ciudad, ubicacion_estado, subcategoria, creado_en', { count: 'exact' })
      .eq('activo', true)
      .or('estado_moderacion.is.null,estado_moderacion.eq.aprobado')

    if (categoria.tipo === 'subcategoria') {
      query = query.eq('subcategoria', categoria.subEtiqueta ?? categoria.nombre)
    } else {
      const { data: fila } = await supabase
        .from('categorias')
        .select('id')
        .eq('nombre', categoria.slug)
        .maybeSingle()

      if (!fila?.id) return { productos: [], total: 0 }
      query = query.eq('categoria_id', fila.id)
    }

    // Mismo ORDER BY compartido que el catálogo: prioridad pagada primero.
    const { data, count, error } = await aplicarOrdenCatalogo(query).limit(PRODUCT_LIMIT)

    if (error) return { productos: [], total: 0 }
    return { productos: (data || []) as ProductoCategoria[], total: count || 0 }
  } catch {
    return { productos: [], total: 0 }
  }
}

function jsonLd(value: unknown) {
  return serializeJsonLd(value)
}

export default async function CategoriaPage({ params }: Props) {
  const { categoria: slug } = await params
  const categoria = getLandingCategoriaSEO(slug)
  if (!categoria) notFound()

  const { productos, total } = await getProductos(categoria)
  const canonical = `${BASE_URL}/categoria/${categoria.slug}`

  // Enlace al catálogo ya filtrado (la landing posiciona; el catálogo filtra).
  const hrefCatalogo = categoria.tipo === 'subcategoria'
    ? `/catalogo?subcategoria=${encodeURIComponent(categoria.subEtiqueta ?? categoria.nombre)}`
    : `/catalogo?categoria=${categoria.slug}`

  // Relacionadas: una familia enlaza a sus subcategorías (las landings con
  // volumen); una subcategoría enlaza a su familia y a sus hermanas.
  const subsDeFamilia = SUBCATEGORIAS_SEO
    .filter((s) => familiaDeSub(s.slug)?.key === categoria.familiaSlug)
    .map((s) => ({ slug: s.slug, nombre: s.nombre, icono: s.icono }))
  const relacionadas = categoria.tipo === 'familia'
    ? subsDeFamilia
    : [
        {
          slug: categoria.familiaSlug,
          nombre: categoria.familiaNombre,
          icono: FAMILIAS.find((f) => f.key === categoria.familiaSlug)?.icon ?? '' },
        ...subsDeFamilia.filter((s) => s.slug !== categoria.slug),
      ]

  const breadcrumbJsonLd: Record<string, unknown>[] = [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
    { '@type': 'ListItem', position: 2, name: 'Catálogo', item: `${BASE_URL}/catalogo` },
    ...(categoria.tipo === 'subcategoria'
      ? [{ '@type': 'ListItem', position: 3, name: categoria.familiaNombre, item: `${BASE_URL}/categoria/${categoria.familiaSlug}` }]
      : []),
    {
      '@type': 'ListItem',
      position: categoria.tipo === 'subcategoria' ? 4 : 3,
      name: categoria.nombre,
      item: canonical },
  ]

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': canonical,
        url: canonical,
        name: categoria.titulo,
        description: categoria.descripcion,
        inLanguage: 'es-ES',
        isPartOf: { '@id': `${BASE_URL}/#website` } },
      {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbJsonLd },
      {
        '@type': 'ItemList',
        name: `${categoria.nombre} en venta en España`,
        numberOfItems: productos.length,
        itemListElement: productos.map((producto, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `${BASE_URL}${productUrl(producto)}`,
          name: producto.titulo,
          ...(producto.imagen_url ? { image: producto.imagen_url } : {}),
          offers: {
            '@type': 'Offer',
            price: producto.precio_usd || 0,
            priceCurrency: 'EUR',
            availability: 'https://schema.org/InStock',
            url: `${BASE_URL}${productUrl(producto)}` } })) },
      {
        '@type': 'FAQPage',
        mainEntity: categoria.faq.map((item) => ({
          '@type': 'Question',
          name: item.pregunta,
          acceptedAnswer: { '@type': 'Answer', text: item.respuesta } })) },
    ] }

  return (
    <div className="bg-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
      />

      <header className="border-b border-line bg-paper">
        <div className="shell pb-10 pt-8 md:pb-14 md:pt-12">
          <nav aria-label="Migas de pan" className="t-eyebrow flex flex-wrap items-center gap-2 text-ink/40">
            <LocalLink href="/" className="transition-colors hover:text-ink">Inicio</LocalLink>
            <span className="text-ink/25">/</span>
            <LocalLink href="/catalogo" className="transition-colors hover:text-ink">Catálogo</LocalLink>
            <span className="text-ink/25">/</span>
            {categoria.tipo === 'subcategoria' && (
              <>
                <LocalLink href={`/categoria/${categoria.familiaSlug}`} className="transition-colors hover:text-ink">
                  {categoria.familiaNombre}
                </LocalLink>
                <span className="text-ink/25">/</span>
              </>
            )}
            <span aria-current="page" className="text-ink">{categoria.nombre}</span>
          </nav>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="t-display t-display-lg text-ink lg:col-span-8">
              {categoria.nombre} en venta en España
            </h1>
            <p className="text-[15px] leading-relaxed text-muted lg:col-span-4 lg:border-l lg:border-line lg:pl-6">
              {categoria.descripcion}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <LocalLink href={hrefCatalogo} className="btn btn-ink">
              Explorar y filtrar anuncios
            </LocalLink>
            <LocalLink href="/publicar" className="btn btn-outline">
              Publicar gratis
            </LocalLink>
            <span className="t-label ml-auto hidden text-ink/40 md:block">
              {total === 1 ? '1 anuncio activo' : `${total} anuncios activos`}
            </span>
          </div>
        </div>
      </header>

      <div className="shell py-12 md:py-16">
        <section aria-labelledby="anuncios-categoria">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink pb-3">
            <h2 id="anuncios-categoria" className="t-display t-display-sm text-ink">
              Anuncios de {categoria.nombre.toLowerCase()}
            </h2>
            {total > PRODUCT_LIMIT && (
              <LocalLink href={hrefCatalogo} className="t-label inline-flex items-center gap-1.5 text-ink hover:underline hover:underline-offset-4">
                Ver todos los anuncios <span aria-hidden="true">→</span>
              </LocalLink>
            )}
          </div>

          {productos.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {productos.map((producto, i) => (
                <ProductCard
                  key={producto.id}
                  priority={i < 2}
                  p={{
                    id: producto.id,
                    slug: producto.slug ?? null,
                    titulo: producto.titulo,
                    precio_usd: producto.precio_usd,
                    imagen_url: producto.imagen_url,
                    ubicacion_ciudad: producto.ubicacion_ciudad,
                    ubicacion_estado: producto.ubicacion_estado,
                    estado: producto.estado ?? '',
                    boosteado_en: null,
                    destacado: null,
                    destacado_hasta: null,
                    vendedor_verificado: null }}
                />
              ))}
            </div>
          ) : (
            <div className="mt-8 border border-line bg-[#FBFAF5] px-6 py-14 text-center">
              <p className="t-display t-display-sm text-ink">Todavía no hay anuncios en esta categoría</p>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted">
                Sé la primera persona en publicar un producto.
              </p>
              <LocalLink href="/publicar" className="btn btn-ink mt-6">
                Publicar gratis
              </LocalLink>
            </div>
          )}
        </section>

        <section aria-labelledby="sobre-categoria" className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <h2 id="sobre-categoria" className="t-display t-display-sm text-ink lg:col-span-4">
            Comprar y vender {categoria.nombre.toLowerCase()} en España
          </h2>
          <div className="lg:col-span-8 lg:border-l lg:border-line lg:pl-8">
            <div className="space-y-4 text-[14.5px] leading-relaxed text-ink/75">
              {categoria.introduccion.map((parrafo) => (
                <p key={parrafo}>{parrafo}</p>
              ))}
            </div>
            <ul className="mt-6 flex flex-wrap gap-1.5">
              {categoria.terminos.map((termino) => (
                <li key={termino} className="t-label border border-line bg-paper-2/60 px-2 py-1 text-ink/55">
                  {termino}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="otras-categorias" className="mt-14">
          <h2 id="otras-categorias" className="t-eyebrow border-b border-ink pb-3 text-ink">Explora otras categorías</h2>
          <div className="mt-6 grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
            {relacionadas.map((item) => (
              <LocalLink
                key={item.slug}
                href={`/categoria/${item.slug}`}
                className="group flex items-center justify-between gap-3 bg-[#FBFAF5] p-4 transition-colors hover:bg-paper"
              >
                <span className="text-[13.5px] font-medium text-ink">{item.nombre}</span>
                <span aria-hidden="true" className="text-ink/25 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-ink">→</span>
              </LocalLink>
            ))}
          </div>
        </section>

        <section aria-labelledby="preguntas-categoria" className="mt-14 max-w-4xl">
          <h2 id="preguntas-categoria" className="t-display t-display-sm text-ink">Preguntas frecuentes</h2>
          <div className="mt-5 divide-y divide-line border-y border-line">
            {categoria.faq.map((item, i) => (
              <details key={item.pregunta} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium text-ink">
                  <span className="flex items-baseline gap-3">
                    <span className="t-label text-ink/30">{String(i + 1).padStart(2, '0')}</span>
                    {item.pregunta}
                  </span>
                  <span aria-hidden="true" className="relative h-3 w-3 shrink-0 transition-transform duration-300 group-open:rotate-45">
                    <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-ink" />
                    <span className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-ink" />
                  </span>
                </summary>
                <p className="mt-2 pl-8 text-[13.5px] leading-relaxed text-muted">{item.respuesta}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export const revalidate = 600
