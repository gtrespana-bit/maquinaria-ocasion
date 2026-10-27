import { serializeJsonLd } from '@/lib/serialize-json-ld'
import type { Metadata } from 'next'
import { alternatesSeo } from '@/lib/seo'
import Image from 'next/image'
import LocalLink from '@/components/LocalLink'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ArrowRight } from 'lucide-react'
import { Eyebrow, SectionHead } from '@/components/ui/Bits'
import { Reveal } from '@/components/ui/Motion'

export const metadata: Metadata = {
  title: 'Quiénes somos',
  description:
    'Conoce MaquinariaOcasión, el marketplace especializado en maquinaria y herramienta de ocasión en España, con contacto directo y sin comisiones.',
  alternates: alternatesSeo('/sobre-nosotros') }

export default async function SobreNosotrosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'about' })
  const SITIO = 'https://maquinaria.click'
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITIO + '/' },
      { '@type': 'ListItem', position: 2, name: t('title'), item: SITIO + '/sobre-nosotros' },
    ] }
  const aboutJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': SITIO + '/sobre-nosotros#about',
    name: t('title'),
    description: t('subtitle'),
    url: SITIO + '/sobre-nosotros',
    isPartOf: { '@id': SITIO + '/#website' },
    breadcrumb: { '@id': SITIO + '/sobre-nosotros#breadcrumb' },
    mainEntity: {
      '@type': 'Organization',
      '@id': SITIO + '/#organization',
      name: 'MaquinariaOcasión',
      url: SITIO,
      description: t('subtitle'),
      foundingDate: '2024',
      areaServed: { '@type': 'Country', name: 'España' },
      serviceType: 'Marketplace' } }
  const jsonLd = { '@context': 'https://schema.org', '@graph': [breadcrumbJsonLd, aboutJsonLd] }

  const motivos = [
    { titulo: t('why1_title'), desc: t('why1_desc') },
    { titulo: t('why2_title'), desc: t('why2_desc') },
    { titulo: t('why3_title'), desc: t('why3_desc') },
    { titulo: t('why4_title'), desc: t('why4_desc') },
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      {/* Cabecera con imagen */}
      <header className="on-dark relative isolate overflow-hidden bg-ink text-paper">
        <Image
          src="/images/anuncios/excavadora-1.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-30 saturate-[0.6]"
          priority
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-ink/40" />
        <div className="shell relative pb-14 pt-12 md:pb-20 md:pt-16">
          <nav className="t-eyebrow flex items-center gap-2 text-paper/40" aria-label="Breadcrumb">
            <LocalLink href="/" className="hover:text-paper">
              Inicio
            </LocalLink>
            <span aria-hidden="true">/</span>
            <span className="text-paper">Sobre nosotros</span>
          </nav>
          <div className="mt-8 max-w-3xl">
            <Eyebrow tone="signal" marker="dot">
              Quiénes somos
            </Eyebrow>
            <h1 className="t-display t-display-lg mt-5 text-paper">{t('title')}</h1>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-paper/65">{t('subtitle')}</p>
          </div>
        </div>
      </header>

      {/* Texto en dos columnas con letra capital */}
      <section className="bg-paper">
        <div className="shell py-14 md:py-20">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-4">
              <Reveal>
                <Eyebrow marker="dot">{t('whoTitle')}</Eyebrow>
              </Reveal>
            </div>
            <div className="lg:col-span-8">
              <Reveal>
                <p className="t-serif text-[1.35rem] leading-[1.45] text-ink first-letter:t-display first-letter:float-left first-letter:mr-3 first-letter:text-[4rem] first-letter:leading-[0.8]">
                  {t('whoP1')}
                </p>
                <p className="mt-6 text-[15px] leading-relaxed text-muted">{t('whoP2')}</p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Misión: banda oscura */}
      <section className="on-dark bg-ink text-paper">
        <div className="shell py-14 md:py-20">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-4">
              <Eyebrow tone="signal" marker="dot">
                {t('missionTitle')}
              </Eyebrow>
            </div>
            <div className="lg:col-span-8">
              <p className="t-serif text-[1.5rem] leading-[1.35] text-paper md:text-[1.75rem]">
                {t('missionP1')}
              </p>
              <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-paper/60">{t('missionP2')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Por qué existimos */}
      <section className="border-b border-line bg-paper">
        <div className="shell py-14 md:py-20">
          <Reveal>
            <SectionHead
              eyebrow={t('whyTitle')}
              title="Cuatro razones para no volver a los clasificados de siempre"
              align="stack"
            />
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-px bg-line sm:grid-cols-2">
            {motivos.map((item, i) => (
              <Reveal key={i} delay={i * 70}>
                <div className="h-full bg-paper p-7 md:p-8">
                  <span className="t-label text-ink/30">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="mt-6 text-[18px] font-semibold tracking-[-0.02em] text-ink">
                    {item.titulo}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-muted">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Cierre */}
      <section className="bg-paper-2/60">
        <div className="shell flex flex-col gap-6 py-14 md:flex-row md:items-end md:justify-between md:py-16">
          <div className="max-w-xl">
            <h2 className="t-display t-display-md text-ink">{t('ctaTitle')}</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">{t('ctaDesc')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <LocalLink href="/register" className="btn btn-ink">
              {t('ctaRegister')}
              <ArrowRight size={15} />
            </LocalLink>
            <LocalLink href="/catalogo" className="btn btn-outline">
              {t('ctaBrowse')}
            </LocalLink>
          </div>
        </div>
      </section>
    </>
  )
}
