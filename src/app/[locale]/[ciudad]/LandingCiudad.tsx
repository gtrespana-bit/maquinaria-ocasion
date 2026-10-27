import { supabase } from '@/lib/supabase-server-client'
import { aplicarOrdenCatalogo } from '@/lib/catalog-consulta'
import LocalLink from '@/components/LocalLink'
import Image from 'next/image'
import { MapPin } from 'lucide-react'
import { getCiudadesPorEstado } from '@/lib/ubicaciones-seo'
import { estadisticasCiudad } from '@/lib/seo-landings'
import { productUrl } from '@/lib/product-url'
import { formatPrecio, formatRango } from '@/lib/precio'
import { serializeJsonLd } from '@/lib/serialize-json-ld'

interface Props {
  slug: string
  nombre: string
  municipio?: string
  estado: string
  descripcion: string
}

async function getProductos(ciudad: string, municipio?: string) {
  if (!supabase) return { productos: [], total: 0 }
  try {
    // Prioridad pagada primero, igual que el catálogo (mismo ORDER BY
    // compartido: boost vigente > destacado vigente > fecha).
    let query = aplicarOrdenCatalogo(
      supabase
        .from('productos')
        .select('id, slug, titulo, precio_usd, estado, imagen_url, ubicacion_ciudad, subcategoria, destacado, destacado_hasta', { count: 'exact' })
        .eq('activo', true)
        .or('estado_moderacion.is.null,estado_moderacion.eq.aprobado'),
    ).limit(24)

    if (municipio && municipio !== ciudad) {
      query = query.or(`ubicacion_ciudad.eq.\"${ciudad}\",ubicacion_ciudad.eq.\"${municipio}\"`)
    } else {
      query = query.eq('ubicacion_ciudad', ciudad)
    }

    const { data, count } = await query

    return { productos: data || [], total: count || 0 }
  } catch (error) {
    console.error('Error fetching productos:', error)
    return { productos: [], total: 0 }
  }
}

/**
 * FAQ específica de la provincia. Las dos primeras respuestas se
 * construyen con los agregados REALES de la provincia (nº de anuncios,
 * precio medio, rango), lo que hace la página única frente a las
 * demás provincias y responde a las preguntas que Google muestra en
 * "La gente también pregunta".
 */
function faqsDeCiudad(
  nombre: string,
  estado: string,
  stats: { total: number; precioMedio: number | null; precioMin: number | null; precioMax: number | null; porSubcategoria: { nombre: string; total: number }[] },
) {
  const topSub = stats.porSubcategoria[0]
  const precioTexto =
    stats.precioMedio !== null
      ? `alrededor de ${formatPrecio(stats.precioMedio)} de media`
      : null
  const rangoTexto =
    stats.precioMin !== null && stats.precioMax !== null
      ? formatRango(stats.precioMin, stats.precioMax)
      : null

  const faqs = [
    {
      pregunta: `¿Cuánta maquinaria de ocasión hay en ${nombre}?`,
      respuesta:
        stats.total > 0
          ? `Ahora mismo hay ${stats.total} anuncios activos de maquinaria y herramienta en ${nombre} (${estado}), entre particulares, talleres y profesionales. El catálogo se actualiza cada vez que se publica o vende una máquina, así que la selección cambia a diario.`
          : `Aún no hay anuncios activos de maquinaria en ${nombre}. Publica gratis tu anuncio y sé el primero en aparecer cuando alguien busque maquinaria en ${nombre}.` },
    {
      pregunta: `¿Cuánto cuesta la maquinaria en ${nombre}?`,
      respuesta:
        precioTexto && rangoTexto
          ? `El precio medio de la maquinaria en ${nombre} es de ${formatPrecio(stats.precioMedio)}, con anuncios que van ${rangoTexto} según tipo, año, horas de uso y estado. El catálogo permite filtrar por rango de precio para ajustar la búsqueda a tu presupuesto.`
          : `Los precios en ${nombre} varían según el tipo de máquina, año y estado. Usa los filtros de precio del catálogo para ver maquinaria dentro de tu presupuesto y, si el ejemplar está matriculado, comprueba el ITP de tu comunidad antes de comprar.` },
    ...(topSub
      ? [{
          pregunta: `¿Qué tipo de maquinaria se vende más en ${nombre}?`,
          respuesta: `Según los anuncios activos, la categoría más habitual en ${nombre} es ${topSub.nombre.toLowerCase()} (${topSub.total} anuncios), aunque también hay oferta de otras subcategorías de maquinaria. Pulsa en cada tipo para ver solo los anuncios de esa categoría en ${nombre}.` }]
      : []),
    {
      pregunta: `¿Cómo comprar maquinaria en ${nombre} con seguridad?`,
      respuesta: `Antes de pagar, revisa la documentación (factura, ficha técnica y manual), las horas de uso, el estado general y el mantenimiento de la máquina. Si está matriculada, comprueba el ITP que te toca en ${estado} y, para el cambio de nombre, la documentación necesaria. Pide pruebas de funcionamiento y acuerda por escrito quién asume el transporte.` },
    {
      pregunta: `¿Puedo publicar mi maquinaria en ${nombre} gratis?`,
      respuesta: `Sí. Publicar un anuncio en MaquinariaOcasión es gratuito: crea tu cuenta, sube fotos, precio y ficha técnica (año, horas de uso, estado, potencia) y tu anuncio aparecerá en la landing de ${nombre} y en el catálogo nacional.` },
  ]

  return faqs
}

export default async function LandingCiudad({ slug, nombre, municipio, estado, descripcion }: Props) {
  const [productosResult, stats] = await Promise.all([
    getProductos(nombre, municipio),
    estadisticasCiudad(supabase, nombre, municipio),
  ])
  const { productos, total } = productosResult

  // Otras provincias de la misma comunidad autónoma (enlazado interno
  // entre landings y señales de topicalidad regional).
  const hermanas = getCiudadesPorEstado(estado)
    .filter(c => c.slug !== slug)
    .slice(0, 8)

  const faqs = faqsDeCiudad(nombre, estado, stats)

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `https://maquinaria.click/${slug}#faq`,
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.pregunta,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.respuesta } })) }

  const precioMedioTexto =
    stats.precioMedio !== null ? ` con un precio medio de ${formatPrecio(stats.precioMedio)}` : ''

  return (
    <div className="bg-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqJsonLd) }}
      />

      <header className="border-b border-line">
        <div className="shell pb-10 pt-8 md:pb-14 md:pt-12">
          <nav aria-label="Migas de pan" className="t-eyebrow flex flex-wrap items-center gap-2 text-ink/40">
            <LocalLink href="/" className="transition-colors hover:text-ink">Inicio</LocalLink>
            <span className="text-ink/25">/</span>
            <span aria-current="page" className="text-ink">{nombre}</span>
          </nav>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="t-display t-display-lg text-ink lg:col-span-8">
              Maquinaria y herramienta de ocasión en {nombre}
              {estado !== nombre && <span className="text-ink/40">, {estado}</span>}
            </h1>
            <p className="text-[14.5px] leading-relaxed text-muted lg:col-span-4 lg:border-l lg:border-line lg:pl-6">
              {descripcion} Encuentra la excavadora, el tractor o la herramienta de ocasión ideal en{' '}
              {nombre}. Publica gratis tu anuncio.
            </p>
          </div>

          {stats.total > 0 && (
            <dl
              className="mt-9 grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4"
              aria-label={`Estadísticas de maquinaria en ${nombre}`}
            >
              <div className="bg-paper px-4 py-4">
                <dd className="t-display t-num text-[1.6rem] leading-none text-ink">{stats.total}</dd>
                <dt className="t-label mt-2 text-ink/45">Anuncios activos en {nombre}</dt>
              </div>
              {stats.precioMedio !== null && (
                <div className="bg-paper px-4 py-4">
                  <dd className="t-display t-num text-[1.6rem] leading-none text-ink">{formatPrecio(stats.precioMedio)}</dd>
                  <dt className="t-label mt-2 text-ink/45">Precio medio</dt>
                </div>
              )}
              {stats.precioMin !== null && (
                <div className="bg-paper px-4 py-4">
                  <dd className="t-display t-num text-[1.6rem] leading-none text-ink">{formatPrecio(stats.precioMin)}</dd>
                  <dt className="t-label mt-2 text-ink/45">Desde</dt>
                </div>
              )}
              {stats.precioMax !== null && (
                <div className="bg-paper px-4 py-4">
                  <dd className="t-display t-num text-[1.6rem] leading-none text-ink">{formatPrecio(stats.precioMax)}</dd>
                  <dt className="t-label mt-2 text-ink/45">Hasta</dt>
                </div>
              )}
            </dl>
          )}
        </div>
      </header>

      <div className="shell py-12 md:py-16">
        {productos.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {productos.map((p: any) => (
              <LocalLink
                key={p.id}
                href={productUrl(p)}
                className="group/card flex flex-col border border-line bg-[#FBFAF5] transition-colors hover:border-ink"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-paper-2">
                  {p.destacado && new Date(p.destacado_hasta) > new Date() && (
                    <span className="t-label absolute left-0 top-0 z-10 bg-signal px-2 py-1.5 text-ink">Destacado</span>
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
                  <p className="t-label mt-1.5 flex items-center gap-1.5 text-ink/45">
                    <MapPin size={9} strokeWidth={1.8} />
                    {[p.estado, p.ubicacion_ciudad].filter(Boolean).join(' · ')}
                  </p>
                  <p className="t-display t-num mt-auto pt-3 text-[1.15rem] leading-none text-ink">
                    {formatPrecio(p.precio_usd || 0)}
                  </p>
                </div>
              </LocalLink>
            ))}
          </div>
        ) : (
          <div className="border border-line bg-[#FBFAF5] px-6 py-16 text-center">
            <p className="t-display t-display-sm text-ink/30">Aún no hay maquinaria publicada en {nombre}</p>
            <p className="mx-auto mt-3 max-w-sm text-[13.5px] text-muted">¡Sé el primero en publicar!</p>
            <LocalLink href="/publicar" className="btn btn-ink mt-6">Publicar gratis</LocalLink>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <LocalLink href={`/catalogo?ciudad=${nombre}`} className="btn btn-outline">
            Ver todos los anuncios en {nombre} ({total})
          </LocalLink>
        </div>

        {/* Contenido único por provincia */}
        <section className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <h2 className="t-display t-display-sm text-ink lg:col-span-4">
            Comprar maquinaria en {nombre}: el mercado de ocasión en {estado}
          </h2>
          <div className="space-y-4 text-[14px] leading-relaxed text-ink/70 lg:col-span-8 lg:border-l lg:border-line lg:pl-8">
            <p>
              {nombre} es una provincia con demanda constante de maquinaria de segunda mano en {estado}:
              campo, obra pública y red de talleres mantienen el mercado activo todo el año. En
              MaquinariaOcasión filtramos cada anuncio por provincia real, así que las máquinas que ves
              aquí están en {nombre} o en municipios cercanos de la misma zona.
            </p>
            <p>
              Nuestro catálogo de {nombre} cubre las tres familias de la vertical: maquinaria agrícola
              (tractores, cosechadoras, aperos y ganadería), maquinaria de obra (excavadoras,
              cargadores, compactación y plataformas) y herramienta profesional (eléctrica, motores,
              sierra-poda y taller). Cada ficha incluye los datos que importan —año, horas de uso,
              estado, potencia, peso y documentación— y los filtros por categoría afinan la búsqueda sin
              pedirte datos que no aplican.
            </p>
          </div>
        </section>

        {stats.porSubcategoria.length > 0 && (
          <section className="mt-14">
            <h2 className="t-eyebrow border-b border-ink pb-3 text-ink">
              Maquinaria de ocasión en {nombre} por tipo
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {stats.porSubcategoria.map(sub => (
                <LocalLink
                  key={sub.slug}
                  href={`/${slug}/${sub.slug}`}
                  className="flex items-center justify-between gap-3 bg-[#FBFAF5] px-4 py-3 transition-colors hover:bg-paper"
                >
                  <span className="text-[13.5px] font-medium text-ink">{sub.nombre}</span>
                  <span className="t-label shrink-0 text-ink/40">
                    {sub.total} {sub.total === 1 ? 'anuncio' : 'anuncios'}
                  </span>
                </LocalLink>
              ))}
            </div>
          </section>
        )}

        {stats.porMarca.length > 0 && (
          <section className="mt-14">
            <h2 className="t-eyebrow border-b border-line pb-3 text-ink/50">
              Marcas más habituales en {nombre}
            </h2>
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {stats.porMarca.map(m => (
                <li key={m.marca}>
                  <LocalLink
                    href={`/catalogo?ciudad=${encodeURIComponent(nombre)}&marca=${encodeURIComponent(m.marca)}`}
                    className="t-label inline-flex items-center gap-1.5 border border-line px-2.5 py-1.5 text-ink/60 transition-colors hover:border-ink hover:text-ink"
                  >
                    {m.marca} <span className="text-ink/30">{m.total}</span>
                  </LocalLink>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12.5px] text-muted">
              También puedes explorar modelos concretos en la{' '}
              <LocalLink href="/marcas" className="font-medium text-ink underline underline-offset-4">
                guía de marcas y modelos de maquinaria
              </LocalLink>
              .
            </p>
          </section>
        )}

        <section className="mt-14 max-w-4xl">
          <h2 className="t-display t-display-sm text-ink">
            Preguntas frecuentes sobre maquinaria en {nombre}
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

        {hermanas.length > 0 && (
          <section className="mt-14">
            <h2 className="t-eyebrow border-b border-line pb-3 text-ink/50">
              Otras provincias de {estado}
            </h2>
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {hermanas.map(h => (
                <li key={h.slug}>
                  <LocalLink
                    href={`/${h.slug}`}
                    className="t-label inline-flex items-center gap-1.5 border border-line px-2.5 py-1.5 text-ink/60 transition-colors hover:border-ink hover:text-ink"
                  >
                    <MapPin size={9} strokeWidth={1.8} /> Maquinaria en {h.nombre}
                  </LocalLink>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="on-dark mt-14 bg-ink px-6 py-10 text-paper md:px-10 md:py-12">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <h2 className="t-display t-display-md text-paper">
                Compra tu maquinaria en {nombre} con confianza
              </h2>
              <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-paper/60">
                Revisa los {stats.total > 0 ? stats.total : 'nuestros'} anuncios de {nombre}
                {precioMedioTexto} y, antes de pagar, comprueba la documentación, las horas de uso y
                el historial de mantenimiento de la máquina.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:col-span-5 lg:border-l lg:border-line-dark lg:pl-8">
              <LocalLink href="/catalogo" className="btn btn-signal">Ver todo el catálogo</LocalLink>
              <LocalLink href="/como-funciona" className="btn btn-outline-light">Cómo funciona</LocalLink>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

