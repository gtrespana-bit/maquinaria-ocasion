import { serializeJsonLd } from '@/lib/serialize-json-ld'
import type { Metadata } from 'next'
import Image from 'next/image'
import { setRequestLocale } from 'next-intl/server'
import LocalLink from '@/components/LocalLink'
import { supabase } from '@/lib/supabase-server-client'
import BadgeVerificado from '@/components/BadgeVerificado'
import { Store, MapPin } from 'lucide-react'

/**
 * Directorio de talleres y vendedores profesionales.
 *
 * Doble función: al comprador le da una vía de entrada distinta a la del
 * catálogo (buscar por taller, no por máquina) y al profesional le da un
 * motivo para abrir tienda, porque aparecer aquí es tráfico gratis.
 */

export const revalidate = 600

const SITIO = 'https://maquinaria.click'

export async function generateMetadata(): Promise<Metadata> {
  const title = 'Talleres y profesionales en España'
  const description =
    'Directorio de talleres y profesionales de maquinaria en España. Consulta stock, ubicación y valoraciones.'
  return {
    title,
    description,
    alternates: {
      canonical: `${SITIO}/tiendas`,
      languages: { 'es-ES': `${SITIO}/tiendas`, 'x-default': `${SITIO}/tiendas` } },
    openGraph: { title, description, url: `${SITIO}/tiendas`, siteName: 'MaquinariaOcasión', locale: 'es_ES' } }
}

async function getTiendas() {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('perfiles')
    .select('id, slug, nombre, descripcion, ciudad, estado, verificado, foto_perfil_url, tipo_vendedor')
    .eq('tienda_activa', true)
    .not('slug', 'is', null)
    .order('nombre')
    .limit(200)

  // Sin la migración aplicada, la columna no existe: lista vacía en lugar de 500.
  if (error) return []
  return data || []
}

export default async function TiendasPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const tiendas = await getTiendas()

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITIO + '/' },
      { '@type': 'ListItem', position: 2, name: 'Tiendas', item: SITIO + '/tiendas' },
    ] }
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': SITIO + '/tiendas#collection',
    name: 'Talleres y concesionarios de maquinaria en España',
    description: 'Directorio de talleres y vendedores profesionales de maquinaria en España.',
    url: SITIO + '/tiendas',
    isPartOf: { '@id': SITIO + '/#website' },
    breadcrumb: { '@id': SITIO + '/tiendas#breadcrumb' },
    ...(tiendas.length > 0 ? { mainEntity: { '@id': SITIO + '/tiendas#itemlist' } } : {}) }
  const itemListJsonLd = tiendas.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': SITIO + '/tiendas#itemlist',
    name: 'Talleres y profesionales',
    numberOfItems: tiendas.length,
    itemListElement: tiendas.slice(0, 30).map((t: any, i: number) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: SITIO + '/tienda/' + t.slug,
      name: t.nombre || 'Tienda' })) } : null
  const graphJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [breadcrumbJsonLd, collectionJsonLd, ...(itemListJsonLd ? [itemListJsonLd] : [])] }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(graphJsonLd) }} />
      <header className="border-b border-line">
        <div className="shell pb-10 pt-10 md:pb-14 md:pt-14">
          <p className="t-eyebrow text-ink/40">Directorio</p>
          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="t-display t-display-lg text-ink lg:col-span-8">
              Talleres y <span className="t-serif-italic">profesionales</span>
            </h1>
            <p className="text-[14.5px] leading-relaxed text-muted lg:col-span-4 lg:border-l lg:border-line lg:pl-6">
              Talleres y vendedores profesionales con stock en MaquinariaOcasión. Mira su catálogo
              completo, dónde están y qué dicen sus clientes.
            </p>
          </div>
        </div>
      </header>

      <div className="shell py-12 md:py-16">
        {tiendas.length === 0 ? (
          <div className="border border-line bg-[#FBFAF5] px-6 py-14 text-center">
            <p className="t-display t-display-sm text-ink">Todavía no hay tiendas publicadas</p>
            <p className="mx-auto mt-3 max-w-md text-[13.5px] leading-relaxed text-muted">
              ¿Eres taller o vendedor profesional? Abre tu escaparate con el plan Básico (19 €/mes) o
              Profesional (49 €/mes) y enseña todo tu stock en una página propia.
            </p>
            <LocalLink href="/para-profesionales" className="btn btn-ink mt-6">
              Ver planes y abrir mi tienda
            </LocalLink>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {tiendas.map(t => {
                const ubicacion = [t.ciudad, t.estado].filter(Boolean).join(', ')
                return (
                  <LocalLink
                    key={t.id}
                    href={`/tienda/${t.slug}`}
                    className="flex gap-4 bg-[#FBFAF5] p-5 transition-colors hover:bg-paper"
                  >
                    <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden border border-line bg-paper">
                      {t.foto_perfil_url ? (
                        <Image
                          src={t.foto_perfil_url}
                          alt={t.nombre || 'Tienda'}
                          width={56}
                          height={56}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Store size={20} strokeWidth={1.4} className="text-ink/25" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h2 className="truncate text-[14.5px] font-semibold text-ink">{t.nombre}</h2>
                        {t.verificado && <BadgeVerificado size="sm" />}
                      </div>
                      <p className="t-label mt-1 text-ink/40">
                        {t.tipo_vendedor === 'taller' ? 'Taller' : 'Profesional'}
                      </p>
                      {ubicacion && (
                        <p className="mt-1.5 inline-flex items-center gap-1 text-[13px] text-ink/60">
                          <MapPin size={11} strokeWidth={1.7} className="text-ink/35" />
                          {ubicacion}
                        </p>
                      )}
                      {t.descripcion && (
                        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">{t.descripcion}</p>
                      )}
                    </div>
                  </LocalLink>
                )
              })}
            </div>

            <section className="on-dark mt-14 bg-ink px-6 py-10 text-paper md:px-10 md:py-12">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
                <div className="lg:col-span-7">
                  <h2 className="t-display t-display-md text-paper">¿Vendes maquinaria de forma profesional?</h2>
                  <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-paper/60">
                    Abre tu escaparate con un pack: una página con tu logo, tu stock completo y tu
                    dirección web propia que puedes enlazar desde tu Instagram.
                  </p>
                </div>
                <div className="lg:col-span-5 lg:border-l lg:border-line-dark lg:pl-8">
                  <LocalLink href="/para-profesionales" className="btn btn-signal">
                    Ver planes
                  </LocalLink>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  )
}
