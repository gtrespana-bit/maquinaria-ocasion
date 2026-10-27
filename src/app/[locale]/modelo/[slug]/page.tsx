import { serializeJsonLd } from '@/lib/serialize-json-ld'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { supabase } from '@/lib/supabase-server-client'
import { COLUMNAS_PRECIO, formatPrecio, getPrecioEur } from '@/lib/precio'
import {
  MARCAS_MODELOS,
  etiquetaModelo,
  modeloPorSlug,
  slugModelo } from '@/lib/marcas'
import {
  calcularEstadisticas,
  estadisticasPorTramo,
  resumenMercado } from '@/lib/precios-mercado'
import ModeloClient from './ModeloClient'
import { productAbsoluteUrl } from '@/lib/product-url'
import LocalLink from '@/components/LocalLink'
import { alternatesSeo, descripcionSeo, tituloSeo } from '@/lib/seo'

/**
 * Página de modelo: «excavadora CAT de ocasión: precios reales».
 *
 * El contenido único no es la lista de anuncios (eso lo tiene cualquiera), son
 * **las estadísticas de precio calculadas con nuestro propio inventario**.
 * Nadie más en España publica la mediana y el rango P25-P75 de una excavadora
 * CAT por tramo de antigüedad. Eso es lo que Google premia y lo que hace
 * que alguien enlace la página.
 *
 * Regla que no se negocia: si no hay muestra suficiente, **no se publica
 * ningún número**. Una cifra inventada en una página que la gente cita como
 * referencia destruye justo el activo que estamos construyendo.
 */

export const revalidate = 3600

type Props = { params: Promise<{ locale: string; slug: string }> }

const SITIO = 'https://maquinaria.click'

/**
 * Prerenderizamos las páginas de modelo en build: son 95 URLs estáticas con
 * ISR de una hora, que es justo el caso para el que sirve `generateStaticParams`.
 */
export function generateStaticParams() {
  return MARCAS_MODELOS.map(m => ({ slug: slugModelo(m) }))
}

async function getDatosModelo(slug: string) {
  const modelo = modeloPorSlug(slug)
  if (!modelo) return null
  if (!supabase) return { modelo, anuncios: [], est: null, tramos: [] }

  const { data } = await supabase
    .from('productos')
    .select(
      `id, slug, titulo, ${COLUMNAS_PRECIO}, imagen_url, subcategoria, ` +
        'ubicacion_ciudad, ubicacion_estado, estado, boosteado_en, destacado, destacado_hasta, ' +
        'vendedor_verificado, vendedor_tipo, reservado, es_demo, ' +
        'espec_horas, espec_anio'
    )
    .eq('marca', modelo.valor)
    .eq('activo', true)
    .or('estado_moderacion.is.null,estado_moderacion.eq.aprobado')
    .order('creado_en', { ascending: false })
    .limit(200)

  const anuncios = data || []

  const paraEstadistica = anuncios.map(a => ({
    precio: getPrecioEur(a),
    anio: a.espec_anio != null ? Number(a.espec_anio) : null,
    horas: a.espec_horas != null ? Number(a.espec_horas) : null,
    es_demo: a.es_demo }))

  return {
    modelo,
    anuncios,
    est: calcularEstadisticas(paraEstadistica),
    tramos: estadisticasPorTramo(paraEstadistica) }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const datos = await getDatosModelo(slug)

  if (!datos) {
    return { title: 'Modelo no encontrado', robots: { index: false, follow: false } }
  }

  const { modelo, anuncios, est } = datos
  const nombre = modelo.valor
  const anio = new Date().getFullYear()

  const title = est
    ? `${nombre} de ocasión: precios reales ${anio} (${est.muestra} anuncios)`
    : `${nombre} de ocasión en España`

  const description = descripcionSeo(resumenMercado(nombre, est))
  const url = `${SITIO}/modelo/${slug}`

  // OG con categoria según el modelo (usa endpoint existente)
  // OG con la subcategoría real del modelo (el endpoint reconoce familias y
  // subcategorías de maquinaria; lo desconocido cae a su fallback).
  const subCat = (modelo as any).aptoPara?.[0] || 'agricola'
  const ogParam = subCat

  return {
    title: tituloSeo(title),
    description,
    alternates: alternatesSeo(`/modelo/${slug}`),
    // La página de modelo solo se indexa con stock visible; sin anuncios ni
    // muestra de precios sería una plantilla casi duplicada.
    robots: anuncios.length > 0 ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title, description, url, siteName: 'MaquinariaOcasión', locale: 'es_ES', images: [{ url: `https://maquinaria.click/api/og/catalog?categoria=${ogParam}`, width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [`https://maquinaria.click/api/og/catalog?categoria=${ogParam}`] } }
}

export default async function ModeloPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const datos = await getDatosModelo(slug)
  if (!datos) notFound()

  const { modelo, anuncios, est, tramos } = datos

  // Modelos hermanos del mismo fabricante, para enlazado interno: es lo que
  // reparte autoridad entre las 95 páginas en vez de dejarlas aisladas.
  const hermanos = MARCAS_MODELOS.filter(
    m => m.fabricante === modelo.fabricante && m.valor !== modelo.valor
  ).slice(0, 8)

  const pageUrl = SITIO + '/modelo/' + slug

  // FAQ dinámica: las dos primeras respuestas se construyen con las
  // estadísticas REALES del inventario (nunca se publica una cifra
  // sin muestra suficiente — ver la regla del comentario arriba).
  const nombre = modelo.valor
  const faqs: { pregunta: string; respuesta: string }[] = []
  if (est && est.muestra >= 3 && est.mediana) {
    faqs.push({
      pregunta: `¿Cuánto cuesta un ${nombre} de segunda mano?`,
      respuesta: `Según los ${est.muestra} anuncios activos de MaquinariaOcasión, el precio de referencia de un ${nombre} es de ${formatPrecio(est.mediana)} de mediana, con la mitad de los anuncios entre ${formatPrecio(est.p25)} y ${formatPrecio(est.p75)}. El precio final depende del año, las horas de uso, el estado general y la documentación (factura, ficha técnica y manual).` })
  }
  faqs.push({
    pregunta: `¿Cuántos ${nombre} hay en venta ahora mismo?`,
    respuesta: anuncios.length > 0
      ? `Hay ${anuncios.length} anuncios activos de ${nombre} en MaquinariaOcasión, de toda España. Puedes filtrarlos por precio, horas de uso y año en el catálogo filtrado por ${nombre}.`
      : `Ahora mismo no hay anuncios activos de ${nombre}, pero puedes publicar el tuyo gratis o filtrar el catálogo por la marca ${modelo.fabricante} para ver modelos cercanos.` })
  faqs.push({
    pregunta: `¿Qué debo revisar en un ${nombre} de segunda mano?`,
    respuesta: `Antes de pagar: la documentación (factura, ficha técnica y manual), las horas certificadas de uso, el motor y el sistema hidráulico, el estado general y el mantenimiento reciente. Conviene probar la máquina en funcionamiento y llevar la factura y la transferencia en regla.` })
  faqs.push({
    pregunta: `¿Cómo se transporta un ${nombre} tras la compra?`,
    respuesta: `Depende del peso y las dimensiones: la herramienta ligera viaja en furgoneta o paletizada; la maquinaria pesada suele necesitar camión rígido o góndola. Acuerda por escrito quién paga la carga, el transporte y el seguro, y comprueba medidas y peso en la ficha antes de cerrar el precio.` })

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': pageUrl + '#faq',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.pregunta,
      acceptedAnswer: { '@type': 'Answer', text: f.respuesta } })) }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITIO + '/' },
      { '@type': 'ListItem', position: 2, name: 'Marcas', item: SITIO + '/marcas' },
      { '@type': 'ListItem', position: 3, name: modelo.fabricante, item: SITIO + '/catalogo?marca=' + encodeURIComponent(modelo.fabricante) },
      { '@type': 'ListItem', position: 4, name: etiquetaModelo(modelo), item: pageUrl },
    ] }

  // Schema principal: Product + AggregateOffer con el rango real observado.
  const productModelJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: modelo.valor + ' de ocasión',
    model: modelo.valor,
    brand: { '@type': 'Brand', name: modelo.fabricante },
    ...(modelo.nota ? { description: modelo.nota } : {}),
    url: pageUrl,
    // Oferta agregada con datos de mercado reales
    ...(est
      ? {
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'EUR',
            lowPrice: est.minimo,
            highPrice: est.maximo,
            offerCount: est.muestra,
            availability: 'https://schema.org/InStock' } }
      : {}) }

  // Si hay anuncios, añadir ItemList
  const itemListJsonLd = anuncios.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': pageUrl + '#itemlist',
    name: 'Anuncios de ' + modelo.valor + ' de ocasión',
    numberOfItems: Math.min(anuncios.length, 20),
    itemListElement: anuncios.slice(0, 20).map((p: any, i: number) => ({
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
        url: productAbsoluteUrl(p, SITIO) } })) } : null

  // Grafo único: migas de pan, producto/modelo, listado y FAQ.
  const graphJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbJsonLd,
      productModelJsonLd,
      ...(itemListJsonLd ? [itemListJsonLd] : []),
      faqJsonLd,
    ] }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(graphJsonLd) }}
      />
      <ModeloClient
        modelo={modelo}
        etiqueta={etiquetaModelo(modelo)}
        anuncios={anuncios}
        est={est}
        tramos={tramos}
        hermanos={hermanos.map(h => ({
          valor: h.valor,
          etiqueta: etiquetaModelo(h),
          slug: slugModelo(h) }))}
      />

      {/* FAQ visible (Google la usa para "La gente también pregunta") */}
      <section className="border-t border-line bg-paper">
        <div className="shell py-12 md:py-16">
          <h2 className="t-display t-display-md max-w-3xl text-ink">
            Preguntas frecuentes sobre el {nombre}
          </h2>
          <div className="mt-8 max-w-4xl divide-y divide-line border-y border-line">
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
            ¿Quieres vender el tuyo?{' '}
            <LocalLink href="/publicar" className="font-medium text-ink underline underline-offset-4">
              Publica gratis tu {nombre}
            </LocalLink>{' '}
            y llega a compradores de toda España.
          </p>
        </div>
      </section>
    </>
  )
}
