import { supabase } from '@/lib/supabase-server-client'
import { aplicarOrdenCatalogo } from '@/lib/catalog-consulta'
import LocalLink from '@/components/LocalLink'
import Image from 'next/image'
import { MapPin, ChevronRight, ArrowRight } from 'lucide-react'
import { getCiudadesPorEstado } from '@/lib/ubicaciones-seo'
import { SUBCATEGORIAS_SEO } from '@/lib/categorias-seo'
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
          : `Aún no hay anuncios activos de maquinaria en ${nombre}. Publica gratis tu anuncio y sé el primero en aparecer cuando alguien busque maquinaria en ${nombre}.`,
    },
    {
      pregunta: `¿Cuánto cuesta la maquinaria en ${nombre}?`,
      respuesta:
        precioTexto && rangoTexto
          ? `El precio medio de la maquinaria en ${nombre} es de ${formatPrecio(stats.precioMedio)}, con anuncios que van ${rangoTexto} según tipo, año, horas de uso y estado. El catálogo permite filtrar por rango de precio para ajustar la búsqueda a tu presupuesto.`
          : `Los precios en ${nombre} varían según el tipo de máquina, año y estado. Usa los filtros de precio del catálogo para ver maquinaria dentro de tu presupuesto y, si el ejemplar está matriculado, comprueba el ITP de tu comunidad antes de comprar.`,
    },
    ...(topSub
      ? [{
          pregunta: `¿Qué tipo de maquinaria se vende más en ${nombre}?`,
          respuesta: `Según los anuncios activos, la categoría más habitual en ${nombre} es ${topSub.nombre.toLowerCase()} (${topSub.total} anuncios), aunque también hay oferta de otras subcategorías de maquinaria. Pulsa en cada tipo para ver solo los anuncios de esa categoría en ${nombre}.`,
        }]
      : []),
    {
      pregunta: `¿Cómo comprar maquinaria en ${nombre} con seguridad?`,
      respuesta: `Antes de pagar, revisa la documentación (factura, ficha técnica y manual), las horas de uso, el estado general y el mantenimiento de la máquina. Si está matriculada, comprueba el ITP que te toca en ${estado} y, para el cambio de nombre, la documentación necesaria. Pide pruebas de funcionamiento y acuerda por escrito quién asume el transporte.`,
    },
    {
      pregunta: `¿Puedo publicar mi maquinaria en ${nombre} gratis?`,
      respuesta: `Sí. Publicar un anuncio en MaquinariaOcasión es gratuito: crea tu cuenta, sube fotos, precio y ficha técnica (año, horas de uso, estado, potencia) y tu anuncio aparecerá en la landing de ${nombre} y en el catálogo nacional.`,
    },
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
        text: f.respuesta,
      },
    })),
  }

  const precioMedioTexto =
    stats.precioMedio !== null ? ` con un precio medio de ${formatPrecio(stats.precioMedio)}` : ''

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqJsonLd) }}
      />
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
        <LocalLink href="/" className="hover:text-brand-primary">Inicio</LocalLink>
        <ChevronRight size={14} />
        <span className="text-gray-800 font-medium">{nombre}</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
        Maquinaria y herramienta de ocasión en {nombre}, {estado}
      </h1>
      <p className="text-gray-500 mb-8">
        {descripcion} Encuentra la excavadora, el tractor o la herramienta de ocasión ideal en {nombre}. Publica gratis tu anuncio.
      </p>

      {/* ── Datos reales de la provincia (únicos por página) ── */}
      {stats.total > 0 && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10" aria-label={`Estadísticas de maquinaria en ${nombre}`}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl md:text-3xl font-black text-brand-primary">{stats.total}</p>
            <p className="text-xs text-gray-500 mt-1">Anuncios activos en {nombre}</p>
          </div>
          {stats.precioMedio !== null && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-2xl md:text-3xl font-black text-brand-primary">{formatPrecio(stats.precioMedio)}</p>
              <p className="text-xs text-gray-500 mt-1">Precio medio</p>
            </div>
          )}
          {stats.precioMin !== null && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-2xl md:text-3xl font-black text-brand-primary">{formatPrecio(stats.precioMin)}</p>
              <p className="text-xs text-gray-500 mt-1">Desde</p>
            </div>
          )}
          {stats.precioMax !== null && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-2xl md:text-3xl font-black text-brand-primary">{formatPrecio(stats.precioMax)}</p>
              <p className="text-xs text-gray-500 mt-1">Hasta</p>
            </div>
          )}
        </section>
      )}

      {productos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {productos.map((p: any) => (
            <LocalLink key={p.id} href={productUrl(p)} className="bg-white rounded-xl overflow-hidden shadow-sm border hover:shadow-lg transition group block">
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                {p.destacado && new Date(p.destacado_hasta) > new Date() && (
                  <div className="absolute top-2 left-2 z-10 bg-brand-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full">⭐ Destacado</div>
                )}
                {p.imagen_url ? (
                  <Image src={p.imagen_url} alt={p.titulo} width={300} height={300} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-4xl"></div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{p.titulo}</h3>
                <p className="text-lg font-black text-brand-primary mt-1">{formatPrecio(p.precio_usd || 0)}</p>
                <p className="text-xs text-gray-500">{p.estado}</p>
                {p.ubicacion_ciudad && (
                  <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={10} />{p.ubicacion_ciudad}</p>
                )}
              </div>
            </LocalLink>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">
          <p className="text-xl mb-2">Aún no hay maquinaria publicada en {nombre}</p>
          <p className="mb-4">¡Sé el primero en publicar!</p>
          <LocalLink href="/publicar" className="inline-block bg-brand-primary text-white px-6 py-3 rounded-lg font-bold">Publicar gratis</LocalLink>
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <LocalLink href={`/catalogo?ciudad=${nombre}`} className="inline-block bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-200 transition">
          Ver todos los anuncios en {nombre} ({total})
        </LocalLink>
      </div>

      {/* ── Contenido único por provincia (topicalidad + long-tail) ── */}
      <section className="mt-14 border-t border-gray-100 pt-10">
        <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-4">
          Comprar maquinaria en {nombre}: el mercado de ocasión en {estado}
        </h2>
        <div className="grid md:grid-cols-2 gap-4 text-gray-700 leading-relaxed">
          <p>
            {nombre} es una provincia con demanda constante de maquinaria de segunda mano en {estado}: campo, obra pública y red de talleres mantienen el mercado activo todo el año. En MaquinariaOcasión filtramos cada anuncio por provincia real, así que las máquinas que ves aquí están en {nombre} o en municipios cercanos de la misma zona.
          </p>
          <p>
            Nuestro catálogo de {nombre} cubre las tres familias de la vertical: maquinaria agrícola (tractores, cosechadoras, aperos y ganadería), maquinaria de obra (excavadoras, cargadores, compactación y plataformas) y herramienta profesional (eléctrica, motores, sierra-poda y taller). Cada ficha incluye los datos que importan —año, horas de uso, estado, potencia, peso y documentación— y los filtros por categoría afinan la búsqueda sin pedirte datos que no aplican.
          </p>
        </div>
      </section>

      {/* ── Subcategorías con conteo real ── */}
      {stats.porSubcategoria.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-4">
            Maquinaria de ocasión en {nombre} por tipo
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.porSubcategoria.map(sub => (
              <LocalLink
                key={sub.slug}
                href={`/${slug}/${sub.slug}`}
                className="flex items-center justify-between bg-white border border-gray-200 hover:border-brand-accent hover:bg-green-50 rounded-xl px-4 py-3 transition"
              >
                <span className="font-semibold text-gray-800 text-sm">{sub.nombre}</span>
                <span className="text-xs font-bold text-brand-primary bg-green-50 border border-green-100 rounded-full px-2 py-0.5">
                  {sub.total} {sub.total === 1 ? 'anuncio' : 'anuncios'}
                </span>
              </LocalLink>
            ))}
          </div>
        </section>
      )}

      {/* ── Marcas populares (enlazado a catálogo filtrado) ── */}
      {stats.porMarca.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-4">
            Marcas de maquinaria más habituales en {nombre}
          </h2>
          <div className="flex flex-wrap gap-2">
            {stats.porMarca.map(m => (
              <LocalLink
                key={m.marca}
                href={`/catalogo?ciudad=${encodeURIComponent(nombre)}&marca=${encodeURIComponent(m.marca)}`}
                className="text-sm font-semibold bg-white border border-gray-200 hover:border-brand-accent hover:bg-green-50 rounded-full px-4 py-2 transition"
              >
                {m.marca} <span className="text-gray-400 font-normal">({m.total})</span>
              </LocalLink>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-3">
            También puedes explorar modelos concretos en la <LocalLink href="/marcas" className="text-brand-primary font-semibold hover:underline">guía de marcas y modelos de maquinaria</LocalLink>.
          </p>
        </section>
      )}

      {/* ── FAQ dinámica (La gente también pregunta) ── */}
      <section className="mt-12">
        <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-4">
          Preguntas frecuentes sobre maquinaria en {nombre}
        </h2>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <details key={i} className="bg-white border border-gray-200 rounded-xl p-4 group">
              <summary className="font-bold text-gray-900 cursor-pointer list-none flex justify-between items-center gap-4">
                {f.pregunta}
                <ArrowRight size={16} className="text-brand-accent shrink-0 transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm text-gray-700 leading-relaxed">{f.respuesta}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Provincias hermanas de la misma CC.AA. ── */}
      {hermanas.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-4">
            Maquinaria de ocasión en otras provincias de {estado}
          </h2>
          <div className="flex flex-wrap gap-2">
            {hermanas.map(h => (
              <LocalLink
                key={h.slug}
                href={`/${h.slug}`}
                className="text-sm font-semibold bg-white border border-gray-200 hover:border-brand-accent hover:bg-green-50 rounded-full px-4 py-2 transition"
              >
                <MapPin size={12} className="inline mr-1 text-brand-accent" />
                Maquinaria en {h.nombre}
              </LocalLink>
            ))}
          </div>
        </section>
      )}

      {/* ── Cierre con enlaces de confianza ── */}
      <section className="mt-12 bg-gradient-to-r from-brand-primary to-brand-dark rounded-2xl p-6 md:p-8 text-white">
        <h2 className="text-xl md:text-2xl font-black mb-2">
          Compra tu maquinaria en {nombre} con confianza
        </h2>
        <p className="text-gray-100 text-sm md:text-base mb-5 max-w-2xl">
          Revisa los {stats.total > 0 ? stats.total : 'nuestros'} anuncios de {nombre}{precioMedioTexto} y, antes de pagar, comprueba la documentación, las horas de uso y el historial de mantenimiento de la máquina.
        </p>
        <div className="flex flex-wrap gap-3">
          <LocalLink href="/catalogo" className="bg-white text-brand-dark font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-gray-100 transition">
            Ver todo el catálogo
          </LocalLink>
          <LocalLink href="/como-funciona" className="bg-white/15 hover:bg-white/25 border border-white/30 font-bold px-5 py-2.5 rounded-lg text-sm transition">
            Cómo funciona
          </LocalLink>
        </div>
      </section>
    </div>
  )
}
