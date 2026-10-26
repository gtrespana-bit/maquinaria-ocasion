import { serializeJsonLd } from '@/lib/serialize-json-ld'
import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import LocalLink from '@/components/LocalLink'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { aplicarOrdenCatalogo } from '@/lib/catalog-consulta'
import {
  LANDINGS_CATEGORIA_LIST,
  SUBCATEGORIAS_SEO,
  getLandingCategoriaSEO,
  type LandingCategoriaSEO,
} from '@/lib/categorias-seo'
import { FAMILIAS, familiaDeSub } from '@/lib/categorias'
import { productUrl } from '@/lib/product-url'
import { formatPrecio } from '@/lib/precio'
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
        alt: `${categoria.nombre} en venta en España`,
      }],
    },
    robots: locale === 'en'
      ? { index: false, follow: true }
      : { index: true, follow: true },
  }
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
          icono: FAMILIAS.find((f) => f.key === categoria.familiaSlug)?.icon ?? '',
        },
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
      item: canonical,
    },
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
        isPartOf: { '@id': `${BASE_URL}/#website` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbJsonLd,
      },
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
            url: `${BASE_URL}${productUrl(producto)}`,
          },
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: categoria.faq.map((item) => ({
          '@type': 'Question',
          name: item.pregunta,
          acceptedAnswer: { '@type': 'Answer', text: item.respuesta },
        })),
      },
    ],
  }

  return (
    <div className="bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
      />

      <section className="bg-gradient-to-br from-brand-dark via-brand-primary to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">
          <nav aria-label="Migas de pan" className="text-sm text-blue-100 mb-5">
            <LocalLink href="/" className="hover:text-white">Inicio</LocalLink>
            <span aria-hidden="true" className="mx-2">/</span>
            <LocalLink href="/catalogo" className="hover:text-white">Catálogo</LocalLink>
            <span aria-hidden="true" className="mx-2">/</span>
            {categoria.tipo === 'subcategoria' && (
              <>
                <LocalLink href={`/categoria/${categoria.familiaSlug}`} className="hover:text-white">{categoria.familiaNombre}</LocalLink>
                <span aria-hidden="true" className="mx-2">/</span>
              </>
            )}
            <span aria-current="page">{categoria.nombre}</span>
          </nav>

          <div className="max-w-4xl">
            <span className="text-5xl" aria-hidden="true">{categoria.icono}</span>
            <h1 className="text-3xl md:text-5xl font-black mt-3 mb-4">
              {categoria.nombre} en venta en España
            </h1>
            <p className="text-lg md:text-xl text-blue-50 leading-relaxed">
              {categoria.descripcion}
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <LocalLink
                href={hrefCatalogo}
                className="bg-brand-accent text-brand-dark px-5 py-3 rounded-xl font-bold hover:brightness-105 transition"
              >
                Explorar y filtrar anuncios
              </LocalLink>
              <LocalLink
                href="/publicar"
                className="bg-white/10 border border-white/30 text-white px-5 py-3 rounded-xl font-bold hover:bg-white/20 transition"
              >
                Publicar gratis
              </LocalLink>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <section aria-labelledby="anuncios-categoria">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
            <div>
              <h2 id="anuncios-categoria" className="text-2xl md:text-3xl font-black text-gray-900">
                Anuncios de {categoria.nombre.toLowerCase()}
              </h2>
              <p className="text-gray-600 mt-1">
                {total === 1 ? '1 producto disponible' : `${total} productos disponibles`}
              </p>
            </div>
            {total > PRODUCT_LIMIT && (
              <LocalLink href={hrefCatalogo} className="font-bold text-brand-primary hover:underline">
                Ver todos los anuncios →
              </LocalLink>
            )}
          </div>

          {productos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {productos.map((producto) => (
                <LocalLink
                  key={producto.id}
                  href={productUrl(producto)}
                  className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition group"
                >
                  <div className="aspect-square bg-gray-100 overflow-hidden relative">
                    <Image
                      src={producto.imagen_url || '/placeholder-product.webp'}
                      alt={`${producto.titulo} en venta`}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 line-clamp-2 min-h-12">{producto.titulo}</h3>
                    <p className="text-xl font-black text-brand-primary mt-2">
                      {formatPrecio(producto.precio_usd || 0)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 truncate">
                      {producto.ubicacion_ciudad || producto.ubicacion_estado || 'España'}
                    </p>
                  </div>
                </LocalLink>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
              <p className="text-xl font-bold text-gray-900">Todavía no hay anuncios en esta categoría</p>
              <p className="text-gray-600 mt-2 mb-5">Sé la primera persona en publicar un producto.</p>
              <LocalLink href="/publicar" className="inline-block bg-brand-primary text-white px-6 py-3 rounded-xl font-bold">
                Publicar gratis
              </LocalLink>
            </div>
          )}
        </section>

        <section aria-labelledby="sobre-categoria" className="bg-white border border-gray-200 rounded-2xl p-6 md:p-9 mt-10">
          <h2 id="sobre-categoria" className="text-2xl font-black text-gray-900 mb-4">
            Comprar y vender {categoria.nombre.toLowerCase()} en España
          </h2>
          <div className="space-y-4 text-gray-700 leading-relaxed max-w-4xl">
            {categoria.introduccion.map((parrafo) => <p key={parrafo}>{parrafo}</p>)}
          </div>
          <div className="flex flex-wrap gap-2 mt-6">
            {categoria.terminos.map((termino) => (
              <span key={termino} className="bg-blue-50 text-brand-primary px-3 py-1.5 rounded-full text-sm font-medium">
                {termino}
              </span>
            ))}
          </div>
        </section>

        <section aria-labelledby="otras-categorias" className="mt-10">
          <h2 id="otras-categorias" className="text-2xl font-black text-gray-900 mb-5">Explora otras categorías</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {relacionadas.map((item) => (
              <LocalLink
                key={item.slug}
                href={`/categoria/${item.slug}`}
                className="bg-white border border-gray-200 rounded-xl p-4 font-bold text-gray-900 hover:border-brand-primary hover:text-brand-primary transition"
              >
                <span className="mr-2" aria-hidden="true">{item.icono}</span>{item.nombre}
              </LocalLink>
            ))}
          </div>
        </section>

        <section aria-labelledby="preguntas-categoria" className="mt-10 mb-4 max-w-4xl">
          <h2 id="preguntas-categoria" className="text-2xl font-black text-gray-900 mb-5">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {categoria.faq.map((item) => (
              <details key={item.pregunta} className="bg-white border border-gray-200 rounded-xl p-5 group">
                <summary className="font-bold text-gray-900 cursor-pointer">{item.pregunta}</summary>
                <p className="text-gray-700 mt-3 leading-relaxed">{item.respuesta}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export const revalidate = 600
