import { serializeJsonLd } from '@/lib/serialize-json-ld'
import type { Metadata } from 'next'
import LocalLink from '@/components/LocalLink'
import fs from 'fs'
import path from 'path'
import { Calendar, ArrowRight, Clock, TrendingUp } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { limpiarComillas } from '@/lib/seo'

interface Post {
  slug: string
  title: string
  excerpt: string
  date: string
  readTime: string
  tags: string[]
  category: string
  featured?: boolean
}

function getPosts(): Post[] {
  const dir = path.join(process.cwd(), 'src/content/blog')
  if (!fs.existsSync(dir)) return []

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'))
  return files.map(file => {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8')
    const slug = file.replace('.md', '')
    
    const titleMatch = content.match(/^title:\s*(.+)$/m)
    const excerptMatch = content.match(/^excerpt:\s*(.+)$/m)
    const dateMatch = content.match(/^date:\s*(.+)$/m)
    const readTimeMatch = content.match(/^readTime:\s*(.+)$/m)
    const tagsMatch = content.match(/^tags:\s*(.+)$/m)
    const categoryMatch = content.match(/^category:\s*(.+)$/m)
    const featuredMatch = content.match(/^featured:\s*(.+)$/m)

    return {
      slug,
      title: limpiarComillas(titleMatch?.[1]) || slug,
      excerpt: limpiarComillas(excerptMatch?.[1]),
      date: limpiarComillas(dateMatch?.[1]),
      readTime: limpiarComillas(readTimeMatch?.[1]) || '5 min',
      tags: tagsMatch ? tagsMatch[1].split(',').map(t => t.trim()) : [],
      category: limpiarComillas(categoryMatch?.[1]) || 'General',
      featured: featuredMatch?.[1] === 'true' }
  }).sort((a, b) => {
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    return b.date.localeCompare(a.date)
  })
}

export const metadata: Metadata = {
  title: 'Guías de compra y venta de maquinaria',
  description: 'Guías para comprar y vender maquinaria de ocasión: precios, horas de uso, documentación y consejos para elegir en España.',
  alternates: {
    canonical: 'https://maquinaria.click/blog',
    languages: {
      'es-ES': 'https://maquinaria.click/blog',
      'x-default': 'https://maquinaria.click/blog' },
    types: {
      'application/rss+xml': 'https://maquinaria.click/feed.xml' } },
  openGraph: {
    title: 'Guías de compra y venta de maquinaria',
    description: 'Guías de compra de maquinaria: precios, documentación y consejos para elegir.',
    url: 'https://maquinaria.click/blog',
    siteName: 'MaquinariaOcasión',
    type: 'website',
    locale: 'es_ES' } }

const categoryIcons: Record<string, string> = {
  'Guías': '🧭',
  'Legal': '⚖️',
  'Precios': '💰',
  'Emprendimiento': '🚀',
  'Consejos': '💡',
  'Seguridad': '🛡️',
  'Tendencias': '📊' }

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'blog' })
  const posts = getPosts()
  const featured = posts.filter(p => p.featured)
  const regular = posts.filter(p => !p.featured)

  const SITIO = 'https://maquinaria.click'
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITIO + '/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: SITIO + '/blog' },
    ] }
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': SITIO + '/blog#collection',
    name: 'Blog de Compra y Venta en España',
    description: 'Guías, precios del mercado español y consejos para comprar y vender sin estafas.',
    url: SITIO + '/blog',
    isPartOf: { '@id': SITIO + '/#website' },
    breadcrumb: { '@id': SITIO + '/blog#breadcrumb' },
    mainEntity: posts.length > 0 ? { '@id': SITIO + '/blog#itemlist' } : undefined }
  const itemListJsonLd = posts.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': SITIO + '/blog#itemlist',
    name: 'Artículos del blog',
    numberOfItems: posts.length,
    itemListElement: posts.map((post, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: SITIO + '/blog/' + post.slug,
      name: post.title })) } : null
  const graphJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [breadcrumbJsonLd, collectionJsonLd, ...(itemListJsonLd ? [itemListJsonLd] : [])] }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(graphJsonLd) }} />
      <header className="border-b border-line bg-paper">
        <div className="shell pb-12 pt-10 md:pb-16 md:pt-14">
          <p className="t-eyebrow text-ink/45">Guías de compra</p>
          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="t-display t-display-lg text-ink lg:col-span-8">
              {t('title')}{' '}
              <span className="t-serif-italic">MaquinariaOcasión</span>
            </h1>
            <p className="text-[15px] leading-relaxed text-muted lg:col-span-4 lg:border-l lg:border-line lg:pl-6">
              {t('subtitle')}
            </p>
          </div>
        </div>
      </header>

      {/* Destacados */}
      {featured.length > 0 && (
        <section className="border-b border-line bg-paper-2/50">
          <div className="shell py-12 md:py-16">
            <div className="flex items-baseline gap-3 border-b border-ink pb-3">
              <TrendingUp size={13} strokeWidth={1.8} className="text-ink" />
              <h2 className="t-eyebrow text-ink">{t('featured')}</h2>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {featured.map((post) => (
                <LocalLink
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group/f block border border-line bg-[#FBFAF5] p-6 transition-colors hover:border-ink md:p-8"
                >
                  <div className="flex items-center gap-2">
                    <span className="t-label bg-signal px-2 py-1 text-ink">{post.category}</span>
                  </div>
                  <h3 className="t-display t-display-sm mt-5 text-ink">{post.title}</h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-muted line-clamp-3">{post.excerpt}</p>
                  <div className="t-label mt-5 flex items-center gap-4 text-ink/40">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={11} /> {post.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={11} /> {post.readTime}
                    </span>
                  </div>
                </LocalLink>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Todos */}
      <section className="bg-paper">
        <div className="shell py-12 md:py-16">
          {featured.length > 0 && (
            <div className="mb-8 flex items-baseline gap-3 border-b border-ink pb-3">
              <h2 className="t-eyebrow text-ink">{t('allArticles')}</h2>
            </div>
          )}
          {regular.length === 0 && featured.length === 0 && (
            <p className="py-12 text-center text-sm text-muted">{t('comingSoon')}</p>
          )}
          <div className="border-t border-line">
            {regular.map((post, i) => (
              <LocalLink
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group/r flex items-start gap-5 border-b border-line py-6 md:gap-8"
              >
                <span className="t-label mt-1.5 shrink-0 text-ink/30">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="t-label text-ink/45">{post.category}</p>
                  <h3 className="mt-2 text-[19px] font-semibold leading-snug tracking-[-0.02em] text-ink group-hover/r:underline group-hover/r:underline-offset-4">
                    {post.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-[13.5px] leading-relaxed text-muted">{post.excerpt}</p>
                  <div className="t-label mt-3 flex items-center gap-4 text-ink/35">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={10} /> {post.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={10} /> {post.readTime}
                    </span>
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  strokeWidth={1.5}
                  className="mt-1 shrink-0 text-ink/25 transition-transform duration-300 group-hover/r:translate-x-1 group-hover/r:text-ink"
                />
              </LocalLink>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="on-dark bg-ink text-paper">
        <div className="shell flex flex-col gap-6 py-14 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h2 className="t-display t-display-sm text-paper">{t('ctaTitle')}</h2>
            <p className="mt-3 text-[14px] leading-relaxed text-paper/60">{t('ctaDesc')}</p>
          </div>
          <LocalLink href="/publicar" className="btn btn-signal btn-lg shrink-0">
            {t('ctaButton')} <ArrowRight size={16} />
          </LocalLink>
        </div>
      </section>
    </>
  )
}
