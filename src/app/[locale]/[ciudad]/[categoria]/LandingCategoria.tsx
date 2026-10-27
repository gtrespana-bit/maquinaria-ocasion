import LocalLink from '@/components/LocalLink'
import Image from 'next/image'
import { supabase } from '@/lib/supabase-server-client'
import { aplicarOrdenCatalogo } from '@/lib/catalog-consulta'
import { ArrowRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { productUrl } from '@/lib/product-url'
import { SUBCATEGORIAS_SEO, getSubcategoriaSEO } from '@/lib/categorias-seo'
import { formatPrecio, formatRango } from '@/lib/precio'
import { estadisticasCiudad } from '@/lib/seo-landings'
import { serializeJsonLd } from '@/lib/serialize-json-ld'

interface Props {
  ciudadSlug: string
  ciudadNombre: string
  ciudadMunicipio?: string
  estado: string
  categoriaSlug: string
  categoriaNombre: string
  descripcion: string
}

// Subcategorías de maquinaria: slug → etiqueta tal como se guarda en la BD
const CATEGORIA_MAP: Record<string, string> = Object.fromEntries(
  SUBCATEGORIAS_SEO.map(s => [s.slug, s.categoria])
)

async function getProductos(ciudadNombre: string, ciudadMunicipio: string | undefined, categoriaSlug: string) {
  if (!supabase) return []
  try {
    // Mismo ORDER BY compartido que el catálogo: prioridad pagada primero.
    let query = aplicarOrdenCatalogo(
      supabase
        .from('productos')
        .select('id, slug, titulo, precio_usd, estado, imagen_url, ubicacion_ciudad, subcategoria, destacado, destacado_hasta')
        .eq('activo', true)
        .or('estado_moderacion.is.null,estado_moderacion.eq.aprobado'),
    ).limit(24)

    // La landing filtra por la etiqueta real de subcategoría
    const subLabel = CATEGORIA_MAP[categoriaSlug]
    if (subLabel) {
      query = query.eq('subcategoria', subLabel)
    }

    if (ciudadMunicipio && ciudadMunicipio !== ciudadNombre) {
      query = query.or(`ubicacion_ciudad.eq.\"${ciudadNombre}\",ubicacion_ciudad.eq.\"${ciudadMunicipio}\"`)
    } else {
      query = query.eq('ubicacion_ciudad', ciudadNombre)
    }

    const { data } = await query
    return data || []
  } catch (error) {
    console.error('Error fetching productos:', error)
    return []
  }
}

const CATEGORIA_NAMES: Record<string, string> = Object.fromEntries(
  SUBCATEGORIAS_SEO.map(s => [s.slug, s.nombre])
)

function ProductosGrid({ productos, categoriaNombre, ciudadNombre, t }: { productos: any[], categoriaNombre: string, ciudadNombre: string, t: any }) {
  if (productos.length === 0) {
    return (
      <div className="border border-line bg-[#FBFAF5] px-6 py-16 text-center">
        <p className="t-display t-display-sm text-ink/30">
          {t('noAds', { category: categoriaNombre.toLowerCase(), city: ciudadNombre })}
        </p>
        <p className="mx-auto mt-3 max-w-sm text-[13.5px] text-muted">{t('beFirst')}</p>
        <LocalLink href="/publicar" className="btn btn-ink mt-6">{t('postFree')}</LocalLink>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {productos.map((p: any) => (
        <LocalLink
          key={p.id}
          href={productUrl(p)}
          className="group/card flex flex-col border border-line bg-[#FBFAF5] transition-colors hover:border-ink"
        >
          <div className="relative aspect-[4/3] overflow-hidden bg-paper-2">
            {p.destacado && new Date(p.destacado_hasta) > new Date() && (
              <span className="t-label absolute left-0 top-0 z-10 bg-signal px-2 py-1.5 text-ink">{t('featured')}</span>
            )}
            {p.imagen_url ? (
              <Image
                src={p.imagen_url}
                alt={p.titulo}
                width={400}
                height={300}
                className="h-full w-full object-cover saturate-[0.92] transition-[transform,filter] duration-700 group-hover/card:scale-[1.035] group-hover/card:saturate-100"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full bg-paper-2" />
            )}
          </div>
          <div className="flex flex-1 flex-col p-4">
            <h3 className="truncate text-[13.5px] font-medium text-ink">{p.titulo}</h3>
            <p className="t-label mt-1.5 text-ink/45">
              {[p.estado, p.subcategoria].filter(Boolean).join(' · ')}
            </p>
            <p className="t-display t-num mt-auto pt-3 text-[1.15rem] leading-none text-ink">
              {formatPrecio(p.precio_usd || 0)}
            </p>
          </div>
        </LocalLink>
      ))}
    </div>
  )
}

export default async function LandingCategoria({ ciudadSlug, ciudadNombre, ciudadMunicipio, estado, categoriaSlug, categoriaNombre }: Props) {
  // getTranslations (API server de next-intl) en vez de useTranslations:
  // useTranslations dentro de un Server Component async bajo <Suspense>
  // lanzaba "Expected a suspended thenable" en Next 16 → 500.
  const t = await getTranslations('catLanding')
  const subLabel = CATEGORIA_MAP[categoriaSlug]
  const [productos, stats] = await Promise.all([
    getProductos(ciudadNombre, ciudadMunicipio, categoriaSlug),
    // Agregados de ESTA categoría en ESTA provincia (fail-open:
    // si la DB falla, stats.total = 0 y las secciones se omiten).
    estadisticasCiudad(supabase, ciudadNombre, ciudadMunicipio, subLabel),
  ])
  const seoCat = getSubcategoriaSEO(categoriaSlug)

  // Categorias relacionadas para la ciudad
  const categoriasRelacionadas = Object.entries(CATEGORIA_MAP)
    .filter(([k]) => k !== categoriaSlug)
    .map(([k, v]) => ({ slug: k, nombre: CATEGORIA_NAMES[k] || k }))

  // FAQ: la de la categoría (ya redactada) + 2 específicas de
  // provincia con datos reales de precio → contenido único por URL.
  const precioTexto =
    stats.precioMedio !== null
      ? `alrededor de ${formatPrecio(stats.precioMedio)} de media`
      : null
  const rangoTexto =
    stats.precioMin !== null && stats.precioMax !== null
      ? formatRango(stats.precioMin, stats.precioMax)
      : null

  const faqs = [
    ...(seoCat?.faq || []),
    {
      pregunta: `¿Cuánto cuesta una ${categoriaNombre.toLowerCase()} en ${ciudadNombre}?`,
      respuesta:
        precioTexto && rangoTexto
          ? `En ${ciudadNombre} (${estado}) el precio medio de una ${categoriaNombre.toLowerCase()} de ocasión es ${precioTexto}, con anuncios que van ${rangoTexto} según año, horas de uso y equipamiento. Filtra el catálogo por rango de precio para ajustar la búsqueda y, si la máquina está matriculada, comprueba el ITP de tu comunidad antes de comprar.`
          : `El precio de una ${categoriaNombre.toLowerCase()} de ocasión en ${ciudadNombre} depende del año, las horas de uso y el equipamiento. Filtra el catálogo por rango de precio para ajustar la búsqueda y, si está matriculada, comprueba el ITP de tu comunidad antes de comprar.` },
    {
      pregunta: `¿Dónde veo todas las ${categoriaNombre.toLowerCase()} de ${ciudadNombre}?`,
      respuesta: `Esta landing muestra las ${stats.total > 0 ? stats.total : 'principales'} ${categoriaNombre.toLowerCase()} de ocasión en ${ciudadNombre}. Para ver el listado completo con todos los filtros (precio, horas de uso, año, estado y documentación), entra al catálogo filtrado por ${ciudadNombre}.` },
  ]

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `https://maquinaria.click/${ciudadSlug}/${categoriaSlug}#faq`,
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.pregunta,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.respuesta } })) }

  return (
    <div className="bg-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqJsonLd) }}
      />

      <header className="border-b border-line">
        <div className="shell pb-10 pt-8 md:pb-14 md:pt-12">
          <nav aria-label="Migas de pan" className="t-eyebrow flex flex-wrap items-center gap-2 text-ink/40">
            <LocalLink href="/" className="transition-colors hover:text-ink">{t('breadcrumb')}</LocalLink>
            <span className="text-ink/25">/</span>
            <LocalLink href={`/${ciudadSlug}`} className="transition-colors hover:text-ink">{ciudadNombre}</LocalLink>
            <span className="text-ink/25">/</span>
            <span aria-current="page" className="text-ink">{categoriaNombre}</span>
          </nav>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="t-display t-display-lg text-ink lg:col-span-8">
              {categoriaNombre} en {ciudadNombre}
            </h1>
            <p className="text-[14.5px] leading-relaxed text-muted lg:col-span-4 lg:border-l lg:border-line lg:pl-6">
              {t('desc', { category: categoriaNombre.toLowerCase(), city: ciudadNombre })}
            </p>
          </div>

          <div className="hide-scrollbar mt-8 flex gap-1 overflow-x-auto border-y border-line py-2">
            {categoriasRelacionadas.map((cat) => (
              <LocalLink
                key={cat.slug}
                href={`/${ciudadSlug}/${cat.slug}`}
                className="t-label shrink-0 whitespace-nowrap px-2.5 py-1.5 text-ink/55 transition-colors hover:bg-paper-2 hover:text-ink"
              >
                {cat.nombre}
              </LocalLink>
            ))}
          </div>
        </div>
      </header>

      <div className="shell py-12 md:py-16">
        {(stats.total > 0 || seoCat?.introduccion) && (
          <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h2 className="t-eyebrow border-b border-ink pb-3 text-ink">
                {stats.total > 0 ? `${stats.total} ${stats.total === 1 ? 'anuncio' : 'anuncios'}` : 'Mercado'}
              </h2>
              {stats.total > 0 && (
                <p className="mt-4 text-[13px] leading-relaxed text-ink/65">
                  De {categoriaNombre.toLowerCase()} de ocasión en {ciudadNombre} ({estado})
                  {precioTexto ? <> con un precio medio de <strong className="font-semibold text-ink">{formatPrecio(stats.precioMedio)}</strong></> : ''}
                  {rangoTexto ? <> (rango {rangoTexto})</> : ''}.
                  {stats.porMarca.length > 0 && (
                    <> Las marcas más habituales aquí: {stats.porMarca.slice(0, 4).map(m => m.marca).join(', ')}.</>
                  )}
                </p>
              )}
            </div>
            <div className="space-y-4 text-[14px] leading-relaxed text-ink/70 lg:col-span-8 lg:border-l lg:border-line lg:pl-8">
              {seoCat?.introduccion?.map((parrafo, i) => (
                <p key={i}>{parrafo}</p>
              ))}
            </div>
          </section>
        )}

        <div className="mt-12">
          {/* Sin <Suspense>: los productos ya están cargados (await arriba) y el
              Suspense alrededor de un Server Component con thenables de next-intl
              causaba "Expected a suspended thenable" en Next 16. */}
          <ProductosGrid productos={productos} categoriaNombre={categoriaNombre} ciudadNombre={ciudadNombre} t={t} />
        </div>

        <section className="mt-14 max-w-4xl">
          <h2 className="t-display t-display-sm text-ink">
            Preguntas frecuentes: {categoriaNombre} en {ciudadNombre}
          </h2>
          <div className="mt-5 divide-y divide-line border-y border-line">
            {faqs.map((f, i) => (
              <details key={i} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium text-ink">
                  <span className="flex items-baseline gap-3">
                    <span className="t-label text-ink/30">{String(i + 1).padStart(2, '0')}</span>
                    {f.pregunta}
                  </span>
                  <span aria-hidden="true" className="relative h-3 w-3 shrink-0 transition-transform duration-300 group-open:rotate-45">
                    <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-ink" />
                    <span className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-ink" />
                  </span>
                </summary>
                <p className="mt-2 pl-8 text-[13.5px] leading-relaxed text-muted">{f.respuesta}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-12 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:gap-8">
          <LocalLink
            href={`/${ciudadSlug}`}
            className="t-label inline-flex items-center gap-2 text-ink hover:underline hover:underline-offset-4"
          >
            <ArrowRight size={12} className="rotate-180" /> Toda la maquinaria en {ciudadNombre}
          </LocalLink>
          <LocalLink
            href={`/catalogo?subcategoria=${encodeURIComponent(subLabel || categoriaNombre)}`}
            className="t-label inline-flex items-center gap-2 text-ink/55 transition-colors hover:text-ink"
          >
            Ver todas las {categoriaNombre.toLowerCase()} de España <ArrowRight size={12} />
          </LocalLink>
        </section>
      </div>
    </div>
  )
}
