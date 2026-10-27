'use client'

import BrandLogo, { BrandMark } from '@/components/BrandLogo'
import LocalLink from '@/components/LocalLink'
import { hayDatosTitular } from '@/lib/datos-legales'
import { useTranslations } from 'next-intl'
import { TODAS_LAS_SUBS, FAMILIAS } from '@/lib/categorias'
import { CIUDADES_SEO } from '@/lib/ubicaciones-seo'
import { ArrowUpRight } from 'lucide-react'

const FAMILIAS_FOOTER = FAMILIAS.map((f) => ({
  key: f.key,
  label: f.label,
  tipos: f.subs
    .map((slug) => TODAS_LAS_SUBS.find((s) => s.slug === slug))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map((s) => ({ label: s.label, href: `/categoria/${s.slug}` })) }))

const PROVINCIAS_FOOTER = ['madrid', 'barcelona', 'valencia', 'sevilla', 'malaga', 'alicante']
  .map((slug) => CIUDADES_SEO.find((c) => c.slug === slug))
  .filter((c): c is NonNullable<typeof c> => Boolean(c))

function FootHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="t-label mb-4 flex items-center gap-2 text-paper/40">
      <span aria-hidden="true" className="h-1 w-1 bg-signal" />
      {children}
    </h3>
  )
}

function FootLink({
  href,
  children,
  external }: {
  href: string
  children: React.ReactNode
  external?: boolean
}) {
  return (
    <li>
      <LocalLink
        href={href}
        className="group inline-flex items-baseline gap-1 text-[13.5px] leading-6 text-paper/65 transition-colors hover:text-paper"
      >
        {children}
        {external && (
          <ArrowUpRight
            size={10}
            className="translate-y-px opacity-0 transition-opacity group-hover:opacity-60"
          />
        )}
      </LocalLink>
    </li>
  )
}

export function Footer() {
  const t = useTranslations()
  const year = new Date().getFullYear()

  return (
    <footer className="on-dark relative mt-auto overflow-hidden bg-ink text-paper">
      {/* Filete de señal en la parte superior */}
      <div aria-hidden="true" className="h-[3px] w-full bg-signal" />

      <div className="shell pt-12 md:pt-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8">
          {/* Identidad */}
          <div className="md:col-span-4 lg:col-span-3">
            <BrandLogo href="/" tone="light" size="md" />
            <p className="mt-5 max-w-xs text-[13.5px] leading-relaxed text-paper/55">
              {t('footer.description')}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <LocalLink href="/publicar" className="btn btn-signal btn-sm self-start">
                Publicar gratis
              </LocalLink>
              <span className="t-label text-paper/35">Sin comisiones · Toda España</span>
            </div>
          </div>

          {/* Taxonomía */}
          <nav className="md:col-span-4 lg:col-span-3" aria-label={t('footer.categories')}>
            <FootHeading>{t('footer.categories')}</FootHeading>
            <div className="space-y-5">
              {FAMILIAS_FOOTER.map((f) => (
                <div key={f.key}>
                  <LocalLink
                    href={`/categoria/${f.key}`}
                    className="mb-1.5 block text-[13px] font-semibold text-paper/90 hover:text-signal"
                  >
                    {t(`familias.${f.key}.label`)}
                  </LocalLink>
                  <ul className="flex flex-wrap gap-x-4 gap-y-1">
                    {f.tipos.map((c) => (
                      <li key={c.label}>
                        <LocalLink
                          href={c.href}
                          className="text-[13px] leading-6 text-paper/50 transition-colors hover:text-paper"
                        >
                          {c.label}
                        </LocalLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>

          {/* Territorio */}
          <nav className="md:col-span-2 lg:col-span-2" aria-label={t('footer.cities')}>
            <FootHeading>{t('footer.cities')}</FootHeading>
            <ul className="space-y-1">
              {PROVINCIAS_FOOTER.map((c) => (
                <FootLink key={c.slug} href={`/${c.slug}`}>
                  {c.nombre}
                </FootLink>
              ))}
              <FootLink href="/catalogo">Ver todo el catálogo</FootLink>
            </ul>
          </nav>

          {/* Información */}
          <nav className="md:col-span-2 lg:col-span-2" aria-label={t('footer.information')}>
            <FootHeading>{t('footer.information')}</FootHeading>
            <ul className="space-y-1">
              <FootLink href="/como-funciona">{t('footer.howItWorks')}</FootLink>
              <FootLink href="/sobre-nosotros">{t('footer.aboutUs')}</FootLink>
              <FootLink href="/marcas">{t('footer.brands')}</FootLink>
              <FootLink href="/tasador">{t('footer.priceTool')}</FootLink>
              <FootLink href="/blog">Blog</FootLink>
              <FootLink href="/foro">{t('foro.title')}</FootLink>
              <FootLink href="/faq">FAQ</FootLink>
              <FootLink href="/contacto">{t('nav.contact')}</FootLink>
            </ul>
          </nav>

          {/* Legal */}
          <nav className="md:col-span-12 lg:col-span-2" aria-label={t('footer.legal')}>
            <FootHeading>{t('footer.legal')}</FootHeading>
            <ul className="space-y-1">
              <FootLink href="/terminos-y-condiciones">{t('footer.terms')}</FootLink>
              <FootLink href="/politica-de-privacidad">{t('footer.privacy')}</FootLink>
              <FootLink href="/politica-de-cookies">{t('footer.cookies')}</FootLink>
              {hayDatosTitular() && (
                <FootLink href="/aviso-legal">{t('footer.legalNotice')}</FootLink>
              )}
              <FootLink href="/para-profesionales">Planes profesionales</FootLink>
            </ul>
          </nav>
        </div>

        {/* Pie legal */}
        <div className="mt-12 flex flex-col gap-3 border-t border-line-dark py-6 md:flex-row md:items-center md:justify-between">
          <p className="t-label text-paper/35">
            © {year} MaquinariaOcasión · {t('footer.allRightsReserved')}
          </p>
          <div className="flex items-center gap-4">
            <span className="t-label text-paper/25">{t('footer.madeWithLove')}</span>
            <span aria-hidden="true" className="h-3 w-px bg-line-dark" />
            <span className="t-label text-paper/25">ES · EUR €</span>
          </div>
        </div>
      </div>

      {/* Wordmark gigante recortado: cierre de página tipo revista */}
      <div aria-hidden="true" className="relative mt-2 select-none overflow-hidden">
        <div className="shell">
          <span
            className="t-display block text-paper/[0.055]"
            style={{ fontSize: 'clamp(2.5rem, 10.4vw, 10.5rem)', lineHeight: 0.84 }}
          >
            MAQUINARIA
          </span>
          <span
            className="t-serif-italic -mt-[0.16em] block text-signal/20"
            style={{ fontSize: 'clamp(2.5rem, 10.4vw, 10.5rem)', lineHeight: 0.84 }}
          >
            Ocasión
          </span>
        </div>
        <div className="pointer-events-none absolute right-5 bottom-5 hidden items-center gap-2 md:flex">
          <BrandMark size={22} tone="light" />
          <span className="t-label text-paper/25">maquinaria.click</span>
        </div>
      </div>
    </footer>
  )
}
