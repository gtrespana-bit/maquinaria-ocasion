import { serializeJsonLd } from '@/lib/serialize-json-ld'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { supabase } from '@/lib/supabase-server-client'
import { COLUMNAS_PRECIO, formatPrecio, getPrecioEur } from '@/lib/precio'
import {
  MARCAS_MODELOS,
  etiquetaModelo,
  fabricantesUnicos,
  fabricantePorSlug,
  modelosDeFabricante,
  slugFabricante,
  slugModelo,
  valoresUnicos } from '@/lib/marcas'
import { TODAS_LAS_SUBS, familiaDeSub } from '@/lib/categorias'
import { calcularEstadisticas, resumenMercado } from '@/lib/precios-mercado'
import ProductGridTraducido from '@/components/ProductGridTraducido'
import LocalLink from '@/components/LocalLink'
import { ArrowRight } from 'lucide-react'
import { alternatesSeo, descripcionSeo, tituloSeo } from '@/lib/seo'
import { productAbsoluteUrl } from '@/lib/product-url'

/**
 * Página de fabricante: «John Deere de ocasión en España».
 *
 * Complementa a `/marcas` (directorio completo) y a `/modelo/[slug]`
 * (ficha con precios por modelo): aquí el contenido único es el conjunto
 * de modelos del fabricante dentro de nuestra vertical + las estadísticas
 * de precio agregadas de TODA su gama en nuestro inventario.
 *
 * Misma regla que en modelo: sin muestra suficiente no se publica ningún
 * número. Los anuncios demo (`es_demo`) sí alimentan la lista visible
 * (etiquetados como ejemplo en su ficha) pero nunca cifras de mercado.
 */

export const revalidate = 3600

type Props = { params: Promise<{ locale: string; slug: string }> }

const SITIO = 'https://maquinaria.click'

export function generateStaticParams() {
  return fabricantesUnicos(MARCAS_MODELOS).map(f => ({ slug: slugFabricante(f) }))
}

async function getDatosFabricante(slug: string) {
  const fabricante = fabricantePorSlug(slug)
  if (!fabricante) return null

  const modelos = modelosDeFabricante(fabricante)
  const subs = [...new Set(modelos.flatMap(m => m.aptoPara))]
  const familias = [
    ...new Set(subs.map(s => familiaDeSub(s)?.key).filter(Boolean)),
  ] as string[]

  if (!supabase) return { fabricante, modelos, subs, familias, anuncios: [], est: null }

  const { data } = await supabase
    .from('productos')
    .select(
      `id, slug, titulo, ${COLUMNAS_PRECIO}, imagen_url, subcategoria, ` +
        'ubicacion_ciudad, ubicacion_estado, estado, boosteado_en, destacado, destacado_hasta, ' +
        'vendedor_verificado, vendedor_tipo, reservado, es_demo, espec_anio, espec_horas'
    )
    .in('marca', valoresUnicos(modelos))
    .eq('activo', true)
    .or('estado_moderacion.is.null,estado_moderacion.eq.aprobado')
    .order('boosteado_en', { ascending: false, nullsFirst: false })
    .order('creado_en', { ascending: false })
    .limit(100)

  const anuncios = data || []
  const paraEstadistica = anuncios
    .filter(a => !a.es_demo)
    .map(a => ({
      precio: getPrecioEur(a),
      anio: a.espec_anio != null ? Number(a.espec_anio) : null,
      horas: a.espec_horas != null ? Number(a.espec_horas) : null,
      es_demo: a.es_demo }))

  return {
    fabricante,
    modelos,
    subs,
    familias,
    anuncios,
    est: calcularEstadisticas(paraEstadistica) }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const datos = await getDatosFabricante(slug)

  if (!datos) {
    return { title: 'Marca no encontrada', robots: { index: false, follow: false } }
  }

  const { fabricante, modelos, subs, anuncios, est } = datos
  const anio = new Date().getFullYear()

  const subLabels = subs
    .map(s => TODAS_LAS_SUBS.find(x => x.slug === s)?.label)
    .filter(Boolean) as string[]
  const gama = subLabels.slice(0, 3).join(', ')

  const title = est && est.muestra >= 3
    ? `${fabricante} de ocasión: precios reales y ${modelos.length} modelos (${est.muestra} anuncios)`
    : `${fabricante} de ocasión en España: ${modelos.length} modelos de ${gama || 'maquinaria'}`

  const description = est
    ? descripcionSeo(resumenMercado(fabricante, est))
    : descripcionSeo(
        `Maquinaria ${fabricante} de segunda mano en España: ${modelos.length} modelos en catálogo${anuncios.length ? ` y ${anuncios.length} anuncios activos` : ''}. Ficha con horas de uso, documentación y precios del mercado.`
      )

  const url = `${SITIO}/marca/${slug}`
  const familiaKey = familiaDeSub(subs[0] || '')?.key || 'agricola'
  const ogUrl = `https://maquinaria.click/api/og/catalog?categoria=${familiaKey}`
  const titleOg = title

  return {
    title: tituloSeo(title),
    description,
    alternates: alternatesSeo(`/marca/${slug}`),
    // Sin stock visible, la ficha de fabricante es un hub enlazable pero no
    // una página que merezca índice: entra cuando haya anuncios reales.
    robots: anuncios.length > 0 ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title: titleOg,
      description,
      url,
      siteName: 'MaquinariaOcasión',
      locale: 'es_ES',
      images: [{ url: ogUrl, width: 1200, height: 630, alt: titleOg }] },
    twitter: { card: 'summary_large_image', title: titleOg, description, images: [ogUrl] } }
}

export default async function MarcaPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const datos = await getDatosFabricante(slug)
  if (!datos) notFound()

  const { fabricante, modelos, subs, familias, anuncios, est } = datos
  const t = await getTranslations()

  const pageUrl = `${SITIO}/marca/${slug}`


  const subLabels = subs
    .map(s => TODAS_LAS_SUBS.find(x => x.slug === s)?.label)
    .filter(Boolean) as string[]
  const familiaLabels = familias.map(f => t(`familias.${f}.label`))

  // FAQ con cifras reales solo si hay muestra (misma regla que /modelo).
  const faqs: { pregunta: string; respuesta: string }[] = []
  faqs.push({
    pregunta: `¿Qué modelos de ${fabricante} se venden en España?`,
    respuesta: `En MaquinariaOcasión encontrarás ${modelos.length} modelos de ${fabricante} en catálogo${subLabels.length ? `, centrados en ${subLabels.join(', ')}` : ''}: ${modelos.slice(0, 6).map(etiquetaModelo).join(', ')}${modelos.length > 6 ? ' y otros' : ''}. Cada ficha incluye año, horas de uso, potencia y documentación.` })
  if (est && est.muestra >= 3 && est.mediana) {
    faqs.push({
      pregunta: `¿Cuánto cuesta una ${fabricante} de segunda mano?`,
      respuesta: `Según los ${est.muestra} anuncios activos de nuestra base, el precio de referencia de la gama ${fabricante} es de ${formatPrecio(est.mediana)} de mediana, con la mitad de los anuncios entre ${formatPrecio(est.p25)} y ${formatPrecio(est.p75)}. El precio final depende del modelo, el año y las horas de uso.` })
  }
  faqs.push({
    pregunta: `¿Cuántos anuncios de ${fabricante} hay ahora mismo?`,
    respuesta: anuncios.length > 0
      ? `Hay ${anuncios.length} anuncios activos de ${fabricante} en MaquinariaOcasión, de toda España. Filtra por modelo, precio y horas en el catálogo.`
      : `Ahora mismo no hay anuncios activos de ${fabricante}, pero puedes publicar el tuyo gratis o ver modelos cercanos en el catálogo de maquinaria.` })
  faqs.push({
    pregunta: `¿Qué revisar al comprar ${fabricante} de ocasión?`,
    respuesta: `Las horas de uso y su coherencia con el desgaste, el libro de mantenimiento con facturas, la documentación (marcado CE, factura y ITP si aplica), el estado de motor e hidráulica y una prueba en funcionamiento. Si el vendedor aporta los papeles, el anuncio aparece con documentación verificada.` })

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITIO}/` },
      { '@type': 'ListItem', position: 2, name: 'Marcas', item: `${SITIO}/marcas` },
      { '@type': 'ListItem', position: 3, name: fabricante, item: pageUrl },
    ] }

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${fabricante} de ocasión en España`,
    url: pageUrl,
    ...(est && est.muestra >= 3
      ? {
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'EUR',
            lowPrice: est.minimo,
            highPrice: est.maximo,
            offerCount: est.muestra } }
      : {}) }

  const itemListJsonLd = anuncios.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        '@id': `${pageUrl}#itemlist`,
        name: `Anuncios de ${fabricante} de ocasión`,
        numberOfItems: Math.min(anuncios.length, 20),
        itemListElement: anuncios.slice(0, 20).map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: productAbsoluteUrl(p, SITIO),
          name: p.titulo,
          ...(p.imagen_url ? { image: p.imagen_url } : {}),
          offers: {
            '@type': 'Offer',
            price: getPrecioEur(p) || 0,
            priceCurrency: 'EUR',
            availability: 'https://schema.org/InStock',
            url: productAbsoluteUrl(p, SITIO) } })) }
    : null

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.pregunta,
      acceptedAnswer: { '@type': 'Answer', text: f.respuesta } })) }

  const graphJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbJsonLd,
      collectionJsonLd,
      ...(itemListJsonLd ? [itemListJsonLd] : []),
      faqJsonLd,
    ] }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(graphJsonLd) }}
      />

      <header className="border-b border-line">
        <div className="shell pb-10 pt-8 md:pb-14 md:pt-12">
          <nav aria-label="Breadcrumb" className="t-eyebrow flex flex-wrap items-center gap-2 text-ink/40">
            <LocalLink href="/" className="transition-colors hover:text-ink">Inicio</LocalLink>
            <span className="text-ink/25">/</span>
            <LocalLink href="/marcas" className="transition-colors hover:text-ink">Marcas</LocalLink>
            <span className="text-ink/25">/</span>
            <span aria-current="page" className="text-ink">{fabricante}</span>
          </nav>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="t-display t-display-lg text-ink lg:col-span-8">
              {fabricante} de ocasión en España
            </h1>
            <p className="text-[14.5px] leading-relaxed text-muted lg:col-span-4 lg:border-l lg:border-line lg:pl-6">
              {modelos.length} modelos de {fabricante} en catálogo
              {familiaLabels.length ? ` (${familiaLabels.join(' · ')})` : ''}. Compara precios
              reales, horas de uso y documentación verificada entre los anuncios activos de
              vendedores de toda España.{' '}
              <LocalLink href="/publicar" className="font-medium text-ink underline underline-offset-4">
                Publica gratis
              </LocalLink>{' '}
              si tienes una {fabricante} que vender.
            </p>
          </div>

          <dl className="mt-9 grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
            <div className="bg-paper px-4 py-4">
              <dd className="t-display t-num text-[1.6rem] leading-none text-ink">{anuncios.length}</dd>
              <dt className="t-label mt-2 text-ink/45">Anuncios activos</dt>
            </div>
            <div className="bg-paper px-4 py-4">
              <dd className="t-display t-num text-[1.6rem] leading-none text-ink">{modelos.length}</dd>
              <dt className="t-label mt-2 text-ink/45">Modelos en catálogo</dt>
            </div>
            <div className="bg-paper px-4 py-4">
              <dd className="t-display t-num text-[1.6rem] leading-none text-ink">{subLabels.length || '—'}</dd>
              <dt className="t-label mt-2 text-ink/45">Subcategorías</dt>
            </div>
            <div className="bg-signal px-4 py-4">
              <dd className="t-display t-num text-[1.6rem] leading-none text-ink">
                {est && est.muestra >= 3 && est.mediana ? formatPrecio(est.mediana) : '—'}
              </dd>
              <dt className="t-label mt-2 text-ink/60">
                Precio mediano{est && est.muestra >= 3 ? ` · ${est.muestra} anuncios` : ''}
              </dt>
            </div>
          </dl>
        </div>
      </header>

      <div className="shell py-12 md:py-16">
        {/* Modelos del fabricante */}
        <section aria-labelledby="modelos-title">
          <h2 id="modelos-title" className="t-eyebrow border-b border-ink pb-3 text-ink">
            Modelos de {fabricante}: precios de mercado
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {modelos.map(m => (
              <div key={m.valor} className="flex flex-col bg-[#FBFAF5] p-5 transition-colors hover:bg-paper">
                <p className="text-[15px] font-semibold leading-tight tracking-[-0.01em] text-ink">
                  {etiquetaModelo(m)}
                </p>
                {m.nota && <p className="mt-1 flex-1 text-[11.5px] leading-snug text-muted">{m.nota}</p>}
                <div className="mt-3 flex flex-wrap gap-1">
                  {m.aptoPara.map(s => {
                    const sub = TODAS_LAS_SUBS.find(x => x.slug === s)
                    if (!sub) return null
                    return (
                      <span key={s} className="whitespace-nowrap border border-line px-1.5 py-0.5 text-[10px] font-medium text-ink/55">
                        {sub.label}
                      </span>
                    )
                  })}
                </div>
                <LocalLink
                  href={`/modelo/${slugModelo(m)}`}
                  className="t-label mt-3 inline-flex items-center gap-1 text-ink/55 transition-colors hover:text-ink"
                >
                  Ver precios <ArrowRight size={10} />
                </LocalLink>
              </div>
            ))}
          </div>
        </section>

        {/* Anuncios activos de la marca */}
        <section className="mt-14" aria-labelledby="anuncios-title">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink pb-3">
            <h2 id="anuncios-title" className="t-display t-display-sm text-ink">
              {fabricante} de segunda mano: {anuncios.length} anuncios
            </h2>
            <LocalLink
              href={`/catalogo?marca=${encodeURIComponent(fabricante)}`}
              className="t-label inline-flex items-center gap-1.5 whitespace-nowrap text-ink hover:underline hover:underline-offset-4"
            >
              Ver en catálogo <ArrowRight size={12} />
            </LocalLink>
          </div>
          <div className="mt-8">
            {anuncios.length > 0 ? (
              <ProductGridTraducido productos={anuncios} currentPage={1} itemsPerPage={12} />
            ) : (
              <div className="border border-line bg-[#FBFAF5] px-6 py-14 text-center">
                <p className="mx-auto max-w-md text-[14px] leading-relaxed text-muted">
                  Todavía no hay anuncios activos de {fabricante}. Publica el tuyo y sé el primero.
                </p>
                <LocalLink href="/publicar" className="btn btn-ink mt-6">
                  Publicar anuncio gratis
                </LocalLink>
              </div>
            )}
          </div>
        </section>

        {/* FAQ visible */}
        <section className="mt-14 max-w-4xl" aria-labelledby="faq-marca">
          <h2 id="faq-marca" className="t-display t-display-sm text-ink">
            Preguntas frecuentes sobre {fabricante}
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
          <p className="mt-6 text-[13px] text-muted">
            ¿Buscas otra marca?{' '}
            <LocalLink href="/marcas" className="font-medium text-ink underline underline-offset-4">
              Ver todas las marcas y modelos
            </LocalLink>
          </p>
        </section>
      </div>
    </>
  )
}
