import { serializeJsonLd } from '@/lib/serialize-json-ld'
import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'
import LocalLink from '@/components/LocalLink'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { TODAS_LAS_SUBS, FAMILIAS } from '@/lib/categorias'
import {
  MARCAS_MODELOS,
  agruparPorFabricante,
  etiquetaModelo,
  slugModelo,
  slugFabricante, type MarcaModelo, type SubSlug} from '@/lib/marcas'

const SITIO = 'https://maquinaria.click'

export const metadata: Metadata = {
  title: 'Marcas de maquinaria y herramienta',
  description:
    'Marcas y modelos de maquinaria: John Deere, Kubota, CAT, Komatsu, Stihl, Makita y más. Encuentra tu máquina de ocasión.',
  keywords: [
    'marcas de maquinaria',
    'marcas de excavadoras',
    'modelos de tractores',
    'John Deere tractor',
    'CAT excavadora',
    'Kubota maquinaria',
    'Stihl herramienta',
    'maquinaria de ocasión',
  ],
  alternates: {
    canonical: `${SITIO}/marcas`,
    languages: {
      'es-ES': `${SITIO}/marcas`,
      'x-default': `${SITIO}/marcas` } },
  openGraph: {
    title: 'Marcas y modelos de maquinaria',
    description:
      'Catálogo completo de fabricantes y modelos de maquinaria organizado por marca y subcategoría: tractores, cosechadoras, excavadoras, cargadores, plataformas y herramienta profesional.',
    url: `${SITIO}/marcas`,
    siteName: 'MaquinariaOcasión',
    locale: 'es_ES',
    type: 'website' } }

function hrefCatalogo(subLabel: string, valor?: string): string {
  const params = new URLSearchParams({ subcategoria: subLabel })
  if (valor) params.set('marca', valor)
  return `/catalogo?${params.toString()}`
}

/** Insignias de los tipos para los que un modelo es apto. */
function AptasBadges({ m, subActual }: { m: MarcaModelo; subActual: SubSlug }) {
  const otras = m.aptoPara.filter(s => s !== subActual)
  if (otras.length === 0) return null
  const subs = TODAS_LAS_SUBS
  return (
    <span className="inline-flex flex-wrap gap-1 align-middle">
      {otras.map(slug => {
        const sub = subs.find(s => s.slug === slug)
        if (!sub) return null
        return (
          <span
            key={slug}
            title={sub.label}
            className="whitespace-nowrap border border-line bg-paper px-1.5 py-0.5 text-[11.5px] font-medium text-ink/55"
          >
            {sub.label}
          </span>
        )
      })}
    </span>
  )
}

export default async function MarcasPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'marcasPage' })
  const tf = await getTranslations({ locale, namespace: 'familias' })

  const fabricantes = agruparPorFabricante(MARCAS_MODELOS)
  const subs = TODAS_LAS_SUBS

  const SITIO = 'https://maquinaria.click'
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITIO + '/' },
      { '@type': 'ListItem', position: 2, name: 'Marcas', item: SITIO + '/marcas' },
    ] }
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': SITIO + '/marcas#collection',
    name: 'Marcas y modelos de maquinaria',
    description: 'Catálogo de fabricantes y modelos de maquinaria agrícola, de obra y herramienta profesional.',
    url: SITIO + '/marcas',
    isPartOf: { '@id': SITIO + '/#website' },
    breadcrumb: { '@id': SITIO + '/marcas#breadcrumb' } }
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': SITIO + '/marcas#itemlist',
    name: 'Marcas y modelos de maquinaria',
    description: 'Catálogo de fabricantes y modelos de maquinaria agrícola, de obra y herramienta profesional.',
    numberOfItems: MARCAS_MODELOS.length,
    itemListElement: MARCAS_MODELOS.slice(0, 30).map((m, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: etiquetaModelo(m),
      url: SITIO + '/modelo/' + slugModelo(m) })) }
  // FAQ visible + FAQPage schema: responde las dudas de marca
  // que Google muestra en "La gente también pregunta".
  const faqs = [
    {
      pregunta: '¿Qué marcas de maquinaria hay en España?',
      respuesta: 'Depende de la familia: en agrícola destacan John Deere, New Holland, Kubota, Case IH, Massey Ferguson, Fendt y Claas (cosechadoras, Krone y Ponsse en forraje); en obra, Caterpillar, Komatsu, Volvo, Hitachi y JCB (excavadoras), Bobcat, Manitou y Merlo (cargadores y manipuladores), Bomag y Hamm (compactación) y Genie y Haulotte (plataformas); en herramienta, Makita, Bosch, DeWalt, Milwaukee, Stihl, Husqvarna, Bahco y Knipex, con Himoinsa, Honda y Cummins en generadores.' },
    {
      pregunta: '¿Qué marca de maquinaria es más fiable?',
      respuesta: 'No hay una marca universalmente mejor: la fiabilidad depende de la máquina concreta (horas de uso, mantenimiento, estado del sistema hidráulico), no del logotipo. Como regla general, las marcas con red de talleres y recambios amplia en España —John Deere, Kubota, CAT, Komatsu o Stihl— facilitan la reparación y sostienen la reventa. Antes de comprar, revisa el historial de mantenimiento y las horas certificadas, no solo la marca.' },
    {
      pregunta: '¿Marcas europeas o asiáticas: qué conviene?',
      respuesta: 'Ambas tienen mercado en España. Las europeas (John Deere, Fendt, Claas, CAT, Volvo) suelen tener más red de servicio y mejor reventa; las asiáticas (Kubota, Hitachi, Doosan, Sany, Hyundai) ofrecen buen equipamiento por precio. En herramienta eléctrica, japonesas (Makita, HiKoki) y alemanas (Bosch, Metabo) conviven con americanas (DeWalt, Milwaukee). Filtra por marca en el catálogo y compara siempre modelos de la misma subcategoría.' },
    {
      pregunta: '¿Excavadora de oruga o de rueda?',
      respuesta: 'Son perfiles distintos: la de oruga trabaja mejor en terreno blando y obras grandes, con más tracción y estabilidad; la de rueda se desplaza rápido por vía pública sin dañar el firme y es la habitual en urbano y servidumbres. Fíjate en las horas de uso, el estado de cadenas o neumáticos y el sistema hidráulico, y elige según el terreno donde vayas a trabajarla.' },
    {
      pregunta: '¿Todas estas marcas se venden de segunda mano en MaquinariaOcasión?',
      respuesta: 'El catálogo refleja las marcas y modelos presentes en el mercado de ocasión español: si un modelo no tiene anuncios activos, no aparecerá en el listado de precios. Las páginas de modelo muestran mediana y rango P25–P75 solo cuando hay una muestra suficiente de anuncios reales; nunca publicamos cifras inventadas.' },
    {
      pregunta: '¿Dónde veo el precio real de un modelo concreto?',
      respuesta: 'En la página de cada modelo (/modelo/[modelo]): mostramos el precio mediano, el rango P25–P75 y el precio por tramo de antigüedad, calculados con los anuncios activos de MaquinariaOcasión. Es la referencia más útil antes de negociar una compra o de publicar tu propia maquinaria.' },
  ]
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': SITIO + '/marcas#faq',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.pregunta,
      acceptedAnswer: { '@type': 'Answer', text: f.respuesta } })) }
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [breadcrumbJsonLd, collectionJsonLd, itemListJsonLd, faqJsonLd] }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <header className="border-b border-line bg-paper">
        <div className="shell pb-10 pt-8 md:pb-14 md:pt-12">
          <nav aria-label="breadcrumb" className="t-eyebrow flex items-center gap-2 text-ink/40">
            <LocalLink href="/" className="transition-colors hover:text-ink">
              {t('home')}
            </LocalLink>
            <span className="text-ink/25">/</span>
            <span className="text-ink">{t('breadcrumb')}</span>
          </nav>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="t-display t-display-lg text-ink lg:col-span-8">{t('heroTitle')}</h1>
            <p className="text-[15px] leading-relaxed text-muted lg:col-span-4 lg:border-l lg:border-line lg:pl-6">
              {t('heroSubtitle')}
            </p>
          </div>

          <dl className="mt-9 flex flex-wrap items-center gap-x-10 gap-y-4 border-t border-line pt-5">
            <div className="flex items-baseline gap-2">
              <dd className="t-num text-[22px] font-semibold leading-none text-ink">
                {fabricantes.length}
              </dd>
              <dt className="t-label text-ink/45">Fabricantes</dt>
            </div>
            <div className="flex items-baseline gap-2">
              <dd className="t-num text-[22px] font-semibold leading-none text-ink">
                {MARCAS_MODELOS.length}
              </dd>
              <dt className="t-label text-ink/45">Marcas y modelos</dt>
            </div>
          </dl>

          <div className="hide-scrollbar mt-6 flex gap-1 overflow-x-auto border-y border-line py-2">
            {subs.map((s) => (
              <a
                key={s.slug}
                href={`#${s.slug}`}
                className="t-label shrink-0 whitespace-nowrap px-2.5 py-1.5 text-ink/55 transition-colors hover:bg-paper-2 hover:text-ink"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* Guía */}
      <section className="border-b border-line bg-paper-2/50">
        <div className="shell grid grid-cols-1 gap-6 py-12 md:grid-cols-12 md:py-14">
          <h2 className="t-display t-display-sm text-ink md:col-span-4">{t('guideTitle')}</h2>
          <div className="space-y-4 text-[14px] leading-relaxed text-ink/70 md:col-span-8 md:border-l md:border-line md:pl-8">
            <p>{t('guideP1')}</p>
            <p>{t('guideP2')}</p>
          </div>
        </div>
      </section>

      <div className="shell py-12 md:py-16">
        {FAMILIAS.map((familia, idx) => {
          const subsFamilia = familia.subs
            .map((slug) => subs.find((s) => s.slug === slug))
            .filter((s): s is NonNullable<typeof s> => Boolean(s))
          return (
            <section key={familia.key} className={idx > 0 ? 'mt-16 md:mt-20' : ''}>
              <div className="flex items-baseline gap-4 border-b border-ink pb-3">
                <span className="t-label text-ink/30">{String(idx + 1).padStart(2, '0')}</span>
                <h2 className="t-display t-display-md text-ink">{tf(`${familia.key}.label`)}</h2>
                <p className="ml-auto hidden text-[13px] text-muted md:block">{tf(`${familia.key}.desc`)}</p>
              </div>

              <div className="mt-10 space-y-14">
                {subsFamilia.map((sub) => {
                  const grupos = agruparPorFabricante(sub.marcas)
                  return (
                    <section key={sub.slug} id={sub.slug} aria-labelledby={`titulo-${sub.slug}`} className="scroll-mt-24">
                      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
                        <h3 id={`titulo-${sub.slug}`} className="t-eyebrow text-ink">
                          {sub.label}
                        </h3>
                        <p className="max-w-2xl text-[13px] leading-relaxed text-muted">{t(`desc.${sub.slug}`)}</p>
                      </div>

                      <div className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {grupos.map((g) => {
                          const soloFabricante = g.modelos.length === 1 && !g.modelos[0].modelo
                          const entrada = g.modelos[0]
                          return (
                            <div
                              key={g.fabricante}
                              className="group/card flex flex-col bg-[#FBFAF5] p-5 transition-colors hover:bg-paper"
                            >
                              <div className="mb-3 flex items-start justify-between gap-2">
                                <h4 className="text-[15px] font-semibold leading-tight tracking-[-0.01em] text-ink">
                                  <LocalLink
                                    href={`/marca/${slugFabricante(g.fabricante)}`}
                                    className="hover:underline hover:underline-offset-4"
                                  >
                                    {g.fabricante}
                                  </LocalLink>
                                </h4>
                                <LocalLink
                                  href={soloFabricante ? hrefCatalogo(sub.label, entrada.valor) : hrefCatalogo(sub.label)}
                                  aria-label={`${t('viewAds')}: ${g.fabricante}`}
                                  className="shrink-0 text-ink/30 transition-colors hover:text-ink"
                                >
                                  <ArrowRight size={14} strokeWidth={1.5} />
                                </LocalLink>
                              </div>

                              {soloFabricante ? (
                                <div className="flex-1">
                                  {entrada.nota && (
                                    <p className="text-[13px] leading-relaxed text-muted">{entrada.nota}</p>
                                  )}
                                  <div className="mt-2">
                                    <AptasBadges m={entrada} subActual={sub.slug} />
                                  </div>
                                  <LocalLink
                                    href={`/modelo/${slugModelo(entrada)}`}
                                    className="t-label mt-3 inline-flex items-center gap-1 text-ink/55 transition-colors hover:text-ink"
                                  >
                                    Ver precios de mercado <ArrowRight size={10} />
                                  </LocalLink>
                                </div>
                              ) : (
                                <ul className="flex-1 divide-y divide-line/70">
                                  {g.modelos.map((m) => (
                                    <li key={m.valor} className="py-2 first:pt-0">
                                      <LocalLink href={`/modelo/${slugModelo(m)}`} className="group block">
                                        <span className="flex items-baseline justify-between gap-2">
                                          <span className="text-[13px] font-medium text-ink/85 transition-colors group-hover:text-ink group-hover:underline group-hover:underline-offset-4">
                                            {etiquetaModelo(m)}
                                          </span>
                                          <ArrowRight
                                            size={11}
                                            strokeWidth={1.5}
                                            className="shrink-0 text-ink/20 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
                                          />
                                        </span>
                                        {m.nota && (
                                          <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{m.nota}</span>
                                        )}
                                        <AptasBadges m={m} subActual={sub.slug} />
                                      </LocalLink>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  )
                })}
              </div>
            </section>
          )
        })}

        {/* FAQ */}
        <section className="mt-16 md:mt-20">
          <h2 className="t-display t-display-md text-ink">{t('faqTitle')}</h2>
          <div className="mt-6 divide-y divide-line border-y border-line">
            {faqs.map((f, i) => (
              <details key={i} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium text-ink">
                  <span className="flex items-baseline gap-3">
                    <span className="t-label text-ink/30">{String(i + 1).padStart(2, '0')}</span>
                    {f.pregunta}
                  </span>
                  <span
                    aria-hidden="true"
                    className="relative h-3 w-3 shrink-0 transition-transform duration-300 group-open:rotate-45"
                  >
                    <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-ink" />
                    <span className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-ink" />
                  </span>
                </summary>
                <p className="mt-2 max-w-3xl pl-8 text-[13.5px] leading-relaxed text-muted">{f.respuesta}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="on-dark mt-16 bg-ink px-6 py-12 text-paper md:mt-20 md:px-12 md:py-16">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
            <h2 className="t-display t-display-md text-paper lg:col-span-7">{t('ctaTitle')}</h2>
            <p className="text-[14px] leading-relaxed text-paper/60 lg:col-span-5 lg:border-l lg:border-line-dark lg:pl-6">
              {t('ctaSubtitle')}
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <LocalLink href="/catalogo" className="btn btn-signal">
              {t('viewCatalog')}
            </LocalLink>
            <LocalLink href="/publicar" className="btn btn-outline-light">
              {t('publishCta')}
            </LocalLink>
          </div>
        </section>
      </div>
    </>
  )
}
