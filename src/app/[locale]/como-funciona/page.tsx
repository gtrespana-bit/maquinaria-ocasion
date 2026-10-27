import { serializeJsonLd } from '@/lib/serialize-json-ld'
import type { Metadata } from 'next'
import { alternatesSeo } from '@/lib/seo'
import { Camera, Eye, MessageCircle, Shield, ArrowRight, Check, Minus } from 'lucide-react'
import LocalLink from '@/components/LocalLink'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Eyebrow, SectionHead } from '@/components/ui/Bits'
import { Reveal } from '@/components/ui/Motion'

export const metadata: Metadata = {
  title: 'Cómo funciona el marketplace de maquinaria',
  description:
    'Publica gratis tu maquinaria en cuatro pasos y contacta directamente con compradores y vendedores en toda España, sin comisiones por venta.',
  alternates: alternatesSeo('/como-funciona') }

export default async function ComoFuncionaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'howItWorks' })

  const SITIO = 'https://maquinaria.click'
  const CANONICAL = SITIO + '/como-funciona'
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITIO + '/' },
      { '@type': 'ListItem', position: 2, name: t('heroTitle') || 'Cómo funciona', item: CANONICAL },
    ] }
  const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    '@id': CANONICAL + '#howto',
    name: t('heroTitle'),
    description: t('heroSubtitle'),
    url: CANONICAL,
    totalTime: 'PT30M',
    estimatedCost: { '@type': 'MonetaryAmount', currency: 'EUR', value: '0' },
    step: [
      { '@type': 'HowToStep', position: 1, name: t('step1Title'), text: t('step1Desc'), url: CANONICAL + '#paso-1' },
      { '@type': 'HowToStep', position: 2, name: t('step2Title'), text: t('step2Desc'), url: CANONICAL + '#paso-2' },
      { '@type': 'HowToStep', position: 3, name: t('step3Title'), text: t('step3Desc'), url: CANONICAL + '#paso-3' },
      { '@type': 'HowToStep', position: 4, name: t('step4Title'), text: t('step4Desc'), url: CANONICAL + '#paso-4' },
    ] }
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': CANONICAL + '#faq',
    mainEntity: [
      { '@type': 'Question', name: t('faq1q'), acceptedAnswer: { '@type': 'Answer', text: t('faq1a') } },
      { '@type': 'Question', name: t('faq2q'), acceptedAnswer: { '@type': 'Answer', text: t('faq2a') } },
      { '@type': 'Question', name: t('faq3q'), acceptedAnswer: { '@type': 'Answer', text: t('faq3a') } },
      { '@type': 'Question', name: t('faq4q'), acceptedAnswer: { '@type': 'Answer', text: t('faq4a') } },
      { '@type': 'Question', name: t('faq5q'), acceptedAnswer: { '@type': 'Answer', text: t('faq5a') } },
      { '@type': 'Question', name: t('faq6q'), acceptedAnswer: { '@type': 'Answer', text: t('faq6a') } },
    ] }
  const jsonLd = { '@context': 'https://schema.org', '@graph': [breadcrumbJsonLd, howToJsonLd, faqJsonLd] }

  const pasos = [
    { icon: Camera, titulo: t('step1Title'), desc: t('step1Desc'), nota: '5 minutos · 0 €' },
    { icon: Eye, titulo: t('step2Title'), desc: t('step2Desc'), nota: 'Catálogo + buscadores' },
    { icon: MessageCircle, titulo: t('step3Title'), desc: t('step3Desc'), nota: 'Chat interno o WhatsApp' },
    { icon: Shield, titulo: t('step4Title'), desc: t('step4Desc'), nota: 'Perfiles verificados' },
  ]

  const faqs = [
    { pregunta: t('faq1q'), respuesta: t('faq1a') },
    { pregunta: t('faq2q'), respuesta: t('faq2a') },
    { pregunta: t('faq3q'), respuesta: t('faq3a') },
    { pregunta: t('faq4q'), respuesta: t('faq4a') },
    { pregunta: t('faq5q'), respuesta: t('faq5a') },
    { pregunta: t('faq6q'), respuesta: t('faq6a') },
  ]

  const razonItems = ['razon1', 'razon2', 'razon3', 'razon4', 'razon5'] as const
  const othersItems = ['others1', 'others2', 'others3', 'others4', 'others5'] as const

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      {/* Cabecera editorial */}
      <header className="border-b border-line bg-paper">
        <div className="shell pb-12 pt-10 md:pb-16 md:pt-14">
          <nav className="t-eyebrow flex items-center gap-2 text-ink/40" aria-label="Breadcrumb">
            <LocalLink href="/" className="hover:text-ink">
              Inicio
            </LocalLink>
            <span aria-hidden="true">/</span>
            <span className="text-ink">Cómo funciona</span>
          </nav>
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <Eyebrow marker="dot">El proceso, sin rodeos</Eyebrow>
              <h1 className="t-display t-display-lg mt-5 max-w-3xl text-ink">{t('heroTitle')}</h1>
            </div>
            <div className="lg:col-span-4 lg:pl-6">
              <p className="text-[15px] leading-relaxed text-muted lg:border-l lg:border-line lg:pl-6">
                {t('heroSubtitle')}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Pasos */}
      <section className="bg-paper">
        <div className="shell py-14 md:py-20">
          <div className="grid grid-cols-1 gap-px bg-line md:grid-cols-2">
            {pasos.map((paso, i) => (
              <Reveal key={i} delay={i * 80}>
                <div
                  id={`paso-${i + 1}`}
                  className="flex h-full flex-col bg-paper p-7 md:p-9"
                >
                  <div className="flex items-start justify-between">
                    <span className="t-display t-num text-[2.4rem] leading-none text-ink/15">
                      0{i + 1}
                    </span>
                    <paso.icon size={22} strokeWidth={1.4} className="text-ink" />
                  </div>
                  <h2 className="mt-8 text-[20px] font-semibold tracking-[-0.02em] text-ink">
                    {paso.titulo}
                  </h2>
                  <p className="mt-2.5 flex-1 text-[14px] leading-relaxed text-muted">{paso.desc}</p>
                  <p className="t-label mt-6 border-t border-line pt-3 text-ink/40">{paso.nota}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Comparativa */}
      <section className="border-y border-line bg-paper-2/60">
        <div className="shell py-14 md:py-20">
          <Reveal>
            <SectionHead
              eyebrow="Comparativa"
              title={t('vsTitle')}
              subtitle="Lo que cambia cuando el negocio no es cobrar comisiones."
              align="stack"
            />
          </Reveal>

          <div className="mt-9 grid grid-cols-1 gap-5 md:grid-cols-2">
            <Reveal>
              <div className="h-full border border-ink bg-paper p-7">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <h3 className="t-display t-display-sm text-ink">{t('razonTitle')}</h3>
                  <span className="t-label bg-signal px-2 py-1 text-ink">Recomendado</span>
                </div>
                <ul className="mt-5 space-y-3">
                  {razonItems.map((k) => (
                    <li key={k} className="flex items-baseline gap-3 text-[14px] text-ink">
                      <Check size={14} strokeWidth={2.4} className="mt-0.5 shrink-0 text-moss" />
                      {t(k)}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={90}>
              <div className="h-full border border-line bg-paper/60 p-7">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <h3 className="t-display t-display-sm text-ink/50">{t('othersTitle')}</h3>
                </div>
                <ul className="mt-5 space-y-3">
                  {othersItems.map((k) => (
                    <li key={k} className="flex items-baseline gap-3 text-[14px] text-muted">
                      <Minus size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-ink/30" />
                      {t(k)}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-paper">
        <div className="shell py-14 md:py-20">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Reveal>
                <Eyebrow marker="dot">Dudas</Eyebrow>
                <h2 className="t-display t-display-md mt-5 text-ink">{t('faqTitle')}</h2>
              </Reveal>
            </div>
            <div className="lg:col-span-8">
              <div className="border-t border-line">
                {faqs.map((faq, i) => (
                  <Reveal key={i} delay={i * 40}>
                    <details className="group border-b border-line">
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5">
                        <span className="flex gap-4">
                          <span className="t-label mt-1 shrink-0 text-ink/30">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span className="text-[16px] font-medium leading-snug text-ink">
                            {faq.pregunta}
                          </span>
                        </span>
                        <span
                          aria-hidden="true"
                          className="relative mt-1.5 h-3 w-3 shrink-0 transition-transform duration-300 group-open:rotate-45"
                        >
                          <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-ink" />
                          <span className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-ink" />
                        </span>
                      </summary>
                      <div className="max-w-2xl pb-6 pl-9 text-[14px] leading-relaxed text-muted">
                        {faq.respuesta}
                      </div>
                    </details>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cierre */}
      <section className="on-dark bg-ink text-paper">
        <div className="shell flex flex-col gap-6 py-14 md:flex-row md:items-center md:justify-between md:py-16">
          <div>
            <p className="t-eyebrow text-signal">Empieza hoy</p>
            <p className="t-display t-display-sm mt-3 text-paper">
              Publicar es gratis. Vender también.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <LocalLink href="/publicar" className="btn btn-signal">
              {t('ctaPublish')}
              <ArrowRight size={15} />
            </LocalLink>
            <LocalLink href="/catalogo" className="btn btn-outline-light">
              {t('ctaCatalog')}
            </LocalLink>
          </div>
        </div>
      </section>
    </>
  )
}
