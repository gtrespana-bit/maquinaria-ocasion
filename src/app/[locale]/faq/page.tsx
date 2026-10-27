import { serializeJsonLd } from '@/lib/serialize-json-ld'
import type { Metadata } from 'next'
import { alternatesSeo } from '@/lib/seo'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import LocalLink from '@/components/LocalLink'
import { ArrowUpRight } from 'lucide-react'
import { Eyebrow } from '@/components/ui/Bits'
import { Reveal } from '@/components/ui/Motion'

export const metadata: Metadata = {
  title: 'Preguntas frecuentes sobre maquinaria',
  description:
    'Resuelve tus dudas sobre MaquinariaOcasión: publicar anuncios, seguridad, créditos, métodos de pago y compra de maquinaria en España.',
  alternates: alternatesSeo('/faq') }

export default async function FAQPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'faq' })

  const faqData = Array.from({ length: 11 }, (_, i) => ({
    question: t(`q${i + 1}` as any),
    answer: t(`a${i + 1}` as any) }))

  const SITIO = 'https://maquinaria.click'
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITIO + '/' },
      { '@type': 'ListItem', position: 2, name: 'Preguntas Frecuentes', item: SITIO + '/faq' },
    ] }
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': SITIO + '/faq#faq',
    mainEntity: faqData.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer } })) }
  const jsonLd = { '@context': 'https://schema.org', '@graph': [breadcrumbJsonLd, faqJsonLd] }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      <header className="border-b border-line bg-paper">
        <div className="shell pb-12 pt-10 md:pb-16 md:pt-14">
          <nav className="t-eyebrow flex items-center gap-2 text-ink/40" aria-label="Breadcrumb">
            <LocalLink href="/" className="hover:text-ink">
              Inicio
            </LocalLink>
            <span aria-hidden="true">/</span>
            <span className="text-ink">FAQ</span>
          </nav>
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Eyebrow marker="dot">Dudas resueltas</Eyebrow>
              <h1 className="t-display t-display-lg mt-5 text-ink">{t('title')}</h1>
            </div>
            <div className="lg:col-span-5">
              <p className="text-[15px] leading-relaxed text-muted lg:border-l lg:border-line lg:pl-6">
                {t('subtitle')}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="bg-paper">
        <div className="shell py-12 md:py-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8 lg:col-start-3">
              <div className="border-t border-line">
                {faqData.map((faq, i) => (
                  <Reveal key={i} delay={Math.min(i, 6) * 35}>
                    <details className="group border-b border-line">
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5">
                        <span className="flex gap-4">
                          <span className="t-label mt-1 shrink-0 text-ink/30">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span className="text-[16px] font-medium leading-snug text-ink">
                            {faq.question}
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
                        {faq.answer}
                      </div>
                    </details>
                  </Reveal>
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-5 border border-line bg-paper-2/60 p-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[16px] font-semibold text-ink">{t('noAnswer')}</p>
                  <p className="mt-1 text-[13.5px] text-muted">{t('noAnswerDesc')}</p>
                </div>
                <a
                  href="mailto:soporte@maquinaria.click"
                  className="btn btn-ink btn-sm shrink-0"
                >
                  soporte@maquinaria.click
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
