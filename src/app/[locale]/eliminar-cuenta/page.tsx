import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'Eliminar tu cuenta',
  description: 'Solicita la eliminación de tu cuenta y datos asociados en MaquinariaOcasión.' }

export default async function EliminarCuentaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'deleteAccount' })
  return (
    <div className="bg-paper">
      <header className="border-b border-line">
        <div className="shell pb-10 pt-8 md:pb-12 md:pt-10">
          <p className="t-eyebrow text-ink/40">Privacidad</p>
          <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="t-display t-display-lg text-ink lg:col-span-8">{t('title')}</h1>
            <p className="text-[14px] leading-relaxed text-muted lg:col-span-4 lg:border-l lg:border-line lg:pl-6">
              {t('subtitle')}
            </p>
          </div>
        </div>
      </header>

      <div className="shell max-w-3xl py-12 md:py-14">
        <div className="space-y-10">
          <section>
            <h2 className="t-eyebrow border-b border-ink pb-3 text-ink">{t('howTitle')}</h2>
            <div className="mt-5 space-y-3 text-[13.5px] leading-relaxed text-ink/70">
              <p>
                <a
                  href="mailto:privacidad@maquinaria.click?subject=Solicitud%20de%20eliminaci%C3%B3n%20de%20cuenta%20%E2%80%94%20MaquinariaOcasión"
                  className="text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-ink"
                >
                  privacidad@maquinaria.click
                </a>{' '}
                — {t('howP1')}
              </p>
              <p>{t('howBody')}</p>
              <ul className="space-y-1.5 border-l border-line pl-4">
                <li>{t('howLi1')}</li>
                <li>{t('howLi2')}</li>
              </ul>
              <p className="text-[12.5px] text-ink/50">{t('howP2')}</p>
            </div>
          </section>

          <section>
            <h2 className="t-eyebrow border-b border-ink pb-3 text-ink">{t('deletedTitle')}</h2>
            <ul className="mt-5 space-y-1.5 border-l border-line pl-4 text-[13.5px] leading-relaxed text-ink/70">
              <li>{t('delLi1')}</li>
              <li>{t('delLi2')}</li>
              <li>{t('delLi3')}</li>
              <li>{t('delLi4')}</li>
              <li>{t('delLi5')}</li>
            </ul>
          </section>

          <section>
            <h2 className="t-eyebrow border-b border-ink pb-3 text-ink">{t('keptTitle')}</h2>
            <p className="mt-5 text-[13.5px] leading-relaxed text-ink/70">{t('keptText')}</p>
          </section>

          <section className="on-dark bg-ink px-6 py-7 text-paper">
            <h3 className="t-label text-signal">{t('contactTitle')}</h3>
            <a
              href="mailto:privacidad@maquinaria.click"
              className="mt-2 inline-block border-b border-paper/40 text-[15px] font-medium text-paper transition-colors hover:border-signal"
            >
              privacidad@maquinaria.click
            </a>
            <p className="mt-3 text-[12px] leading-relaxed text-paper/50">{t('tagline')}</p>
          </section>
        </div>
      </div>
    </div>
  )
}
