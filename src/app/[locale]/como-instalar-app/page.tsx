import type { Metadata } from 'next'
import { alternatesSeo } from '@/lib/seo'
import LocalLink from '@/components/LocalLink'
import { ArrowLeft, Smartphone, Download, ArrowDownToLine, CheckCircle2, Apple, MonitorDown } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'Instala nuestra app',
  description: 'Instala MaquinariaOcasión en tu móvil como una app: guía paso a paso para Android y iPhone, sin descargas desde una tienda de aplicaciones.',
  alternates: alternatesSeo('/como-instalar-app') }

export default async function ComoInstalarAppPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'installApp' })
  return (
    <div className="bg-paper">
      <header className="border-b border-line">
        <div className="shell pb-10 pt-8 md:pb-12 md:pt-10">
          <LocalLink
            href="/"
            className="t-label inline-flex items-center gap-2 text-ink/45 transition-colors hover:text-ink"
          >
            <ArrowLeft size={11} /> {t('backHome')}
          </LocalLink>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <p className="t-eyebrow text-ink/40">App</p>
              <h1 className="t-display t-display-lg mt-5 text-ink">{t('title')}</h1>
            </div>
            <p className="text-[14px] leading-relaxed text-muted lg:col-span-4 lg:border-l lg:border-line lg:pl-6">
              {t('subtitle')}
            </p>
          </div>
        </div>
      </header>

      <div className="shell max-w-4xl py-12 md:py-14">

      {/* Sección Android */}
      <section className="mb-10">
        <div className="mb-4 flex items-baseline gap-3 border-b border-ink pb-3">
          <h2 className="t-display t-display-sm text-ink">Android</h2>
          <span className="t-label ml-auto flex items-center gap-1.5 text-ink/35">
            <MonitorDown size={11} /> Chrome
          </span>
        </div>

        <div className="border border-line bg-[#FBFAF5]">
          <div className="border-b border-line bg-paper-2/70 px-5 py-3">
            <p className="text-[12.5px] font-medium text-ink/70">{t('androidReq')}</p>
          </div>

          <div className="divide-y divide-line">
            {/* Paso 1 */}
            <div className="flex gap-4 py-4">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-ink bg-ink">
                <span className="t-num text-[11px] font-semibold text-paper">1</span>
              </div>
              <div>
                <p className="text-[14px] font-semibold text-ink">{t('androidStep1Title')}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{t('androidStep1Desc')}</p>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="flex gap-4 py-4">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-ink bg-ink">
                <span className="t-num text-[11px] font-semibold text-paper">2</span>
              </div>
              <div>
                <p className="text-[14px] font-semibold text-ink">{t('androidStep2Title')}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{t('androidStep2Desc')}</p>
              </div>
            </div>

            {/* Paso 3 */}
            <div className="flex gap-4 py-4">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-ink bg-ink">
                <span className="t-num text-[11px] font-semibold text-paper">3</span>
              </div>
              <div>
                <p className="text-[14px] font-semibold text-ink">{t('androidStep3Title')}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">
                  Dependiendo de tu versión de Chrome, verás una de estas opciones. También puede aparecer un banner en la parte inferior diciendo "Instalar MaquinariaOcasión".
                </p>
              </div>
            </div>

            {/* Paso 4 */}
            <div className="flex gap-4 py-4">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-moss bg-moss">
                <CheckCircle2 size={14} className="text-paper" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-ink">Confirma la instalación</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">
                  Aparecerá un diálogo de confirmación. Toca <strong>"Instalar"</strong>. ¡Listo! Ahora tienes MaquinariaOcasión como app en tu pantalla de inicio.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección iPhone (iOS) */}
      <section className="mb-10">
        <div className="mb-4 flex items-baseline gap-3 border-b border-ink pb-3">
          <h2 className="t-display t-display-sm text-ink">iPhone / iPad</h2>
          <span className="t-label ml-auto flex items-center gap-1.5 text-ink/35">
            <Apple size={11} /> Safari
          </span>
        </div>

        <div className="border border-line bg-[#FBFAF5]">
          <div className="border-b border-line bg-paper-2/70 px-5 py-3">
            <p className="text-[12.5px] font-medium text-ink/70">{t('iosReq')}</p>
          </div>

          <div className="divide-y divide-line">
            {/* Paso 1 */}
            <div className="flex gap-4 py-4">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-ink bg-ink">
                <span className="t-num text-[11px] font-semibold text-paper">1</span>
              </div>
              <div>
                <p className="text-[14px] font-semibold text-ink">{t('iosStep1Title')}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">
                  ⚠️ Importante: No funciona con Chrome, Firefox ni otros navegadores en iPhone. <strong>Solo Safari</strong> permite instalar apps.
                </p>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="flex gap-4 py-4">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-ink bg-ink">
                <span className="t-num text-[11px] font-semibold text-paper">2</span>
              </div>
              <div>
                <p className="text-[14px] font-semibold text-ink">{t('iosStep2Title')}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">
                  Está en la barra de Safari, abajo en la pantalla (en iPhones con Face ID está arriba en la barra).
                </p>
              </div>
            </div>

            {/* Paso 3 */}
            <div className="flex gap-4 py-4">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-ink bg-ink">
                <span className="t-num text-[11px] font-semibold text-paper">3</span>
              </div>
              <div>
                <p className="text-[14px] font-semibold text-ink">{t('iosStep3Title')}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">
                  Está un poco más abajo en el menú de compartir. Si no lo ves, desliza más.
                </p>
              </div>
            </div>

            {/* Paso 4 */}
            <div className="flex gap-4 py-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white font-bold text-sm">4</span>
              </div>
              <div>
                <p className="text-[14px] font-semibold text-ink">{t('iosStep4Title')}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">
                  Puedes cambiarle el nombre si quieres. Luego toca <strong>"Añadir"</strong> en la esquina superior derecha. ¡Listo!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ¿Por qué instalar? */}
      <section className="mt-12">
        <h2 className="t-eyebrow border-b border-ink pb-3 text-ink">{t('whyTitle')}</h2>
        <div className="mt-6 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2">
          <div className="bg-[#FBFAF5] p-5">
            <Smartphone size={18} strokeWidth={1.4} className="mb-4 text-ink" />
            <p className="text-[14px] font-semibold text-ink">{t('why1')}</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{t('why1desc')}</p>
          </div>
          <div className="bg-[#FBFAF5] p-5">
            <Download size={18} strokeWidth={1.4} className="mb-4 text-ink" />
            <p className="text-[14px] font-semibold text-ink">{t('why2')}</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{t('why2desc')}</p>
          </div>
          <div className="bg-[#FBFAF5] p-5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="mb-4 text-ink"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/></svg>
            <p className="text-[14px] font-semibold text-ink">{t('why3')}</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{t('why3desc')}</p>
          </div>
          <div className="bg-[#FBFAF5] p-5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="mb-4 text-ink"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            <p className="text-[14px] font-semibold text-ink">{t('why4')}</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{t('why4desc')}</p>
          </div>
        </div>
      </section>

      <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-line pt-8">
        <LocalLink href="/" className="btn btn-ink btn-lg">
          Ir al marketplace <ArrowDownToLine size={15} />
        </LocalLink>
        <LocalLink href="/como-funciona" className="btn btn-outline btn-lg">
          Cómo funciona
        </LocalLink>
      </div>
      </div>
    </div>
  )
}
