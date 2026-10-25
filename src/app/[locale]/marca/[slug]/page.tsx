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
  valoresUnicos,
} from '@/lib/marcas'
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

const SITIO = 'https://maquinariaocasion.online'

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
    .or('estado_moderacion.is.null,estado_moderacion.eq.aprobado,estado_moderacion.eq.pendiente')
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
      es_demo: a.es_demo,
    }))

  return {
    fabricante,
    modelos,
    subs,
    familias,
    anuncios,
    est: calcularEstadisticas(paraEstadistica),
  }
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
  const ogUrl = `https://maquinariaocasion.online/api/og/catalog?categoria=${familiaKey}`
  const titleOg = title

  return {
    title: tituloSeo(title),
    description,
    alternates: alternatesSeo(`/marca/${slug}`),
    openGraph: {
      title: titleOg,
      description,
      url,
      siteName: 'MaquinariaOcasión',
      locale: 'es_ES',
      images: [{ url: ogUrl, width: 1200, height: 630, alt: titleOg }],
    },
    twitter: { card: 'summary_large_image', title: titleOg, description, images: [ogUrl] },
  }
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
    respuesta: `En MaquinariaOcasión encontrarás ${modelos.length} modelos de ${fabricante} en catálogo${subLabels.length ? `, centrados en ${subLabels.join(', ')}` : ''}: ${modelos.slice(0, 6).map(etiquetaModelo).join(', ')}${modelos.length > 6 ? ' y otros' : ''}. Cada ficha incluye año, horas de uso, potencia y documentación.`,
  })
  if (est && est.muestra >= 3 && est.mediana) {
    faqs.push({
      pregunta: `¿Cuánto cuesta una ${fabricante} de segunda mano?`,
      respuesta: `Según los ${est.muestra} anuncios activos de nuestra base, el precio de referencia de la gama ${fabricante} es de ${formatPrecio(est.mediana)} de mediana, con la mitad de los anuncios entre ${formatPrecio(est.p25)} y ${formatPrecio(est.p75)}. El precio final depende del modelo, el año y las horas de uso.`,
    })
  }
  faqs.push({
    pregunta: `¿Cuántos anuncios de ${fabricante} hay ahora mismo?`,
    respuesta: anuncios.length > 0
      ? `Hay ${anuncios.length} anuncios activos de ${fabricante} en MaquinariaOcasión, de toda España. Filtra por modelo, precio y horas en el catálogo.`
      : `Ahora mismo no hay anuncios activos de ${fabricante}, pero puedes publicar el tuyo gratis o ver modelos cercanos en el catálogo de maquinaria.`,
  })
  faqs.push({
    pregunta: `¿Qué revisar al comprar ${fabricante} de ocasión?`,
    respuesta: `Las horas de uso y su coherencia con el desgaste, el libro de mantenimiento con facturas, la documentación (marcado CE, factura y ITP si aplica), el estado de motor e hidráulica y una prueba en funcionamiento. Si el vendedor aporta los papeles, el anuncio aparece con documentación verificada.`,
  })

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITIO}/` },
      { '@type': 'ListItem', position: 2, name: 'Marcas', item: `${SITIO}/marcas` },
      { '@type': 'ListItem', position: 3, name: fabricante, item: pageUrl },
    ],
  }

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
            lowPrice: est.p25,
            highPrice: est.p75,
            offerCount: est.muestra,
          },
        }
      : {}),
  }

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
            url: productAbsoluteUrl(p, SITIO),
          },
        })),
      }
    : null

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.pregunta,
      acceptedAnswer: { '@type': 'Answer', text: f.respuesta },
    })),
  }

  const graphJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbJsonLd,
      collectionJsonLd,
      ...(itemListJsonLd ? [itemListJsonLd] : []),
      faqJsonLd,
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(graphJsonLd) }}
      />

      <section className="max-w-7xl mx-auto px-4 pt-10 pb-6">
        {/* Migas */}
        <nav aria-label="Breadcrumb" className="text-xs text-gray-500 mb-4 flex flex-wrap gap-1">
          <LocalLink href="/" className="hover:text-brand-accent">Inicio</LocalLink>
          <span aria-hidden="true">›</span>
          <LocalLink href="/marcas" className="hover:text-brand-accent">Marcas</LocalLink>
          <span aria-hidden="true">›</span>
          <span className="text-gray-800 font-semibold">{fabricante}</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
          {fabricante} de ocasión en España
        </h1>
        <p className="text-gray-600 max-w-3xl leading-relaxed mb-6">
          {modelos.length} modelos de {fabricante} en catálogo
          {familiaLabels.length ? ` (${familiaLabels.join(' · ')})` : ''}.
          Compara precios reales, horas de uso y documentación verificada entre los anuncios
          activos de vendedores de toda España.{' '}
          <LocalLink href="/publicar" className="text-brand-primary font-semibold hover:underline">
            Publica gratis
          </LocalLink>{' '}
          si tienes una {fabricante} que vender.
        </p>

        {/* Cifras de la marca */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="text-2xl font-black text-brand-primary">{anuncios.length}</p>
            <p className="text-xs text-gray-500 mt-1">Anuncios activos</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="text-2xl font-black text-brand-primary">{modelos.length}</p>
            <p className="text-xs text-gray-500 mt-1">Modelos en catálogo</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="text-2xl font-black text-brand-primary">{subLabels.length || '—'}</p>
            <p className="text-xs text-gray-500 mt-1">Subcategorías</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="text-2xl font-black text-brand-primary">
              {est && est.muestra >= 3 && est.mediana ? formatPrecio(est.mediana) : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Precio mediano{est && est.muestra >= 3 ? ` (${est.muestra} anuncios)` : ''}
            </p>
          </div>
        </div>
      </section>

      {/* Modelos del fabricante */}
      <section className="max-w-7xl mx-auto px-4 pb-10" aria-labelledby="modelos-title">
        <h2 id="modelos-title" className="text-xl md:text-2xl font-black text-gray-900 mb-4">
          Modelos de {fabricante}: precios de mercado
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modelos.map(m => (
            <div
              key={m.valor}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition p-5 flex flex-col"
            >
              <p className="font-bold text-gray-900 text-lg">{etiquetaModelo(m)}</p>
              {m.nota && <p className="text-xs text-gray-500 mt-1 flex-1">{m.nota}</p>}
              <div className="mt-3 flex flex-wrap gap-1">
                {m.aptoPara.map(s => {
                  const sub = TODAS_LAS_SUBS.find(x => x.slug === s)
                  if (!sub) return null
                  return (
                    <span
                      key={s}
                      className="text-[10px] bg-green-50 text-brand-primary border border-green-200 rounded-full px-1.5 py-0.5 font-semibold"
                    >
                      {sub.label}
                    </span>
                  )
                })}
              </div>
              <LocalLink
                href={`/modelo/${slugModelo(m)}`}
                className="text-sm font-semibold text-brand-primary hover:underline inline-flex items-center gap-1 mt-3"
              >
                Ver precios <ArrowRight size={14} />
              </LocalLink>
            </div>
          ))}
        </div>
      </section>

      {/* Anuncios activos de la marca */}
      <section className="max-w-7xl mx-auto px-4 pb-10" aria-labelledby="anuncios-title">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 id="anuncios-title" className="text-xl md:text-2xl font-black text-gray-900">
            {fabricante} de segunda mano: {anuncios.length} anuncios
          </h2>
          <LocalLink
            href={`/catalogo?marca=${encodeURIComponent(fabricante)}`}
            className="text-sm font-bold text-brand-accent hover:text-brand-dark whitespace-nowrap inline-flex items-center gap-1"
          >
            Ver en catálogo <ArrowRight size={14} />
          </LocalLink>
        </div>
        {anuncios.length > 0 ? (
          <ProductGridTraducido
            productos={anuncios}
            currentPage={1}
            itemsPerPage={12}
          />
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
            <p className="text-gray-600 mb-4">
              Todavía no hay anuncios activos de {fabricante}. Publica el tuyo y sé el primero.
            </p>
            <LocalLink
              href="/publicar"
              className="inline-block bg-brand-accent text-white font-bold px-6 py-3 rounded-lg hover:brightness-95 transition"
            >
              Publicar anuncio gratis
            </LocalLink>
          </div>
        )}
      </section>

      {/* FAQ visible */}
      <section className="max-w-7xl mx-auto px-4 py-10 border-t border-gray-100">
        <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-4">
          Preguntas frecuentes sobre {fabricante}
        </h2>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <details key={i} className="bg-white border border-gray-100 rounded-xl p-4 group">
              <summary className="font-bold text-gray-900 cursor-pointer list-none flex justify-between items-center gap-4">
                {f.pregunta}
                <ArrowRight size={16} className="text-brand-accent shrink-0 transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm text-gray-700 leading-relaxed">{f.respuesta}</p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-sm text-gray-500">
          ¿Buscas otra marca?{' '}
          <LocalLink href="/marcas" className="text-brand-primary font-semibold hover:underline">
            Ver todas las marcas y modelos
          </LocalLink>
        </p>
      </section>
    </>
  )
}
