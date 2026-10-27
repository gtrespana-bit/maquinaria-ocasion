import { serializeJsonLd } from '@/lib/serialize-json-ld'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import LocalLink from '@/components/LocalLink'
import fs from 'fs'
import path from 'path'
import { ArrowLeft, Calendar, Clock, Tag, ArrowRight } from 'lucide-react'
import { alternatesSeo, descripcionSeo, limpiarComillas, tituloSeo } from '@/lib/seo'

interface Post {
  slug: string
  title: string
  excerpt: string
  date: string
  readTime: string
  tags: string[]
  category: string
  content: string
  ogImage?: string
}

function getPostBySlug(slug: string): Post | null {
  const filePath = path.join(process.cwd(), 'src/content/blog', `${slug}.md`)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  
  const parts = raw.split('---\n')
  const frontmatterRaw = parts[1]
  const contentRaw = parts.slice(2).join('---\n').trim()

  const lines = frontmatterRaw.split('\n').filter(l => !l.startsWith('#'))
  const frontmatter: Record<string, string> = {}
  lines.forEach(line => {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim()
      const value = line.substring(colonIndex + 1).trim()
      frontmatter[key] = limpiarComillas(value)
    }
  })

  return {
    slug,
    title: frontmatter.title || slug,
    excerpt: frontmatter.excerpt || '',
    date: frontmatter.date || '',
    readTime: frontmatter.readTime || '5 min',
    tags: frontmatter.tags ? frontmatter.tags.split(',').map(t => t.trim()) : [],
    category: frontmatter.category || 'General',
    content: contentRaw,
    ogImage: frontmatter.ogImage }
}

function getAllSlugs(): string[] {
  const dir = path.join(process.cwd(), 'src/content/blog')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).filter(f => f.endsWith('.md')).map(f => f.replace('.md', ''))
}

export function generateStaticParams(): { slug: string }[] {
  return getAllSlugs().map(slug => ({ slug }))
}

export async function generateMetadata(props: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params
  const post = getPostBySlug(slug)
  if (!post) return { title: 'Post no encontrado' }

  const ogImg = post.ogImage || 'https://maquinaria.click/api/og/catalog?categoria=agricola'
  const description = descripcionSeo(post.excerpt)
  return {
    title: tituloSeo(post.title),
    description,
    alternates: alternatesSeo(`/blog/${post.slug}`),
    openGraph: {
      title: post.title,
      description,
      url: `https://maquinaria.click/blog/${post.slug}`,
      siteName: 'MaquinariaOcasión',
      type: 'article',
      locale: 'es_ES',
      images: [{ url: ogImg, width: 1200, height: 630, alt: post.title }],
      publishedTime: post.date,
      authors: ['MaquinariaOcasión'],
      tags: post.tags },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: [ogImg] } }
}

function generateArticleSchema(post: Post) {
  const SITIO = 'https://maquinaria.click'
  const articleUrl = SITIO + '/blog/' + post.slug
  const breadcrumb = {
    "@type": "BreadcrumbList",
    "@id": articleUrl + "#breadcrumb",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Inicio", "item": SITIO + "/" },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": SITIO + "/blog" },
      { "@type": "ListItem", "position": 3, "name": post.title, "item": articleUrl }
    ]
  }
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": articleUrl + "#article",
    "headline": post.title,
    "description": post.excerpt,
    "datePublished": post.date,
    "dateModified": post.date,
    "author": {
      "@type": "Organization",
      "name": "MaquinariaOcasión",
      "url": SITIO
    },
    "publisher": {
      "@type": "Organization",
      "name": "MaquinariaOcasión",
      "url": SITIO,
      "logo": {
        "@type": "ImageObject",
        "url": SITIO + "/logo-maquinariaocasion.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": articleUrl
    },
    "image": post.ogImage ? [post.ogImage] : [SITIO + "/og-image.webp"],
    "articleSection": post.category,
    "keywords": post.tags.join(', '),
    "inLanguage": "es-ES",
    "isPartOf": { "@id": SITIO + "/#website" },
    // Speakable: titulares y entradilla para Assistant / voz
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": ["h1", ".blog-excerpt", "h2"]
    }
  }
  return {
    "@context": "https://schema.org",
    "@graph": [breadcrumb, article]
  }
}

function inlineFormat(text: string): string {
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-ink">$1</strong>')
  text = text.replace(/_(.+?)_/g, '<em>$1</em>')
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-brand-primary font-semibold hover:underline underline-offset-2">$1</a>')
  return text
}

function renderMarkdown(content: string): string {
  const blocks = content.split(/\n\n+/)
  const htmlParts: string[] = []

  for (const rawBlock of blocks) {
    const lines = rawBlock.trim().split('\n')

    // Table detection
    if (lines.length >= 2 && lines[0].startsWith('|') && lines[1].startsWith('|')) {
      const headerCells = lines[0].split('|').filter(c => c.trim() !== '')
      const dataLines = lines.slice(2).filter(l => l.trim().startsWith('|'))
      
      htmlParts.push('<div class="overflow-x-auto my-6 rounded-xl border border-line shadow-sm">')
      htmlParts.push('<table class="w-full text-sm">')
      // Header
      htmlParts.push('<thead class="bg-brand-primary text-paper">')
      htmlParts.push('<tr>')
      for (const cell of headerCells) {
        htmlParts.push(`<th class="px-4 py-3 font-bold text-left whitespace-nowrap">${inlineFormat(cell.trim())}</th>`)
      }
      htmlParts.push('</tr></thead>')
      // Body
      htmlParts.push('<tbody class="divide-y divide-line">')
      for (const dl of dataLines) {
        const cells = dl.split('|').filter(c => c.trim() !== '')
        htmlParts.push('<tr class="hover:bg-paper-2/50">')
        for (const cell of cells) {
          htmlParts.push(`<td class="px-4 py-3 text-ink/75 whitespace-nowrap">${inlineFormat(cell.trim())}</td>`)
        }
        htmlParts.push('</tr>')
      }
      htmlParts.push('</tbody></table></div>')
      continue
    }

    // Headers
    if (lines[0].startsWith('# ')) {
      htmlParts.push(`<h1 class="text-3xl font-black text-ink mt-8 mb-6">${inlineFormat(lines[0].replace('# ', ''))}</h1>`)
      continue
    }
    if (lines[0].startsWith('## ')) {
      htmlParts.push(`<h2 class="text-2xl font-bold text-ink mt-10 mb-4">${inlineFormat(lines[0].replace('## ', ''))}</h2>`)
      continue
    }
    if (lines[0].startsWith('### ')) {
      htmlParts.push(`<h3 class="text-xl font-bold text-ink mt-8 mb-4">${inlineFormat(lines[0].replace('### ', ''))}</h3>`)
      continue
    }

    // Blockquote
    if (lines[0].startsWith('> ')) {
      const quoteText = lines.map(l => l.replace(/^> ?/, '')).join(' ')
      htmlParts.push(`<blockquote class="border-l-4 border-ink bg-paper-2 rounded-r-lg pl-5 py-4 my-6"><p class="text-ink/75 italic text-sm leading-relaxed">${inlineFormat(quoteText)}</p></blockquote>`)
      continue
    }

    // Numbered list
    if (lines.length > 0 && lines[0].match(/^\d+\. /)) {
      htmlParts.push('<ol class="space-y-3 my-4 list-none counter-reset: step">')
      let idx = 0
      for (const line of lines) {
        idx++
        const text = line.replace(/^\d+\. /, '')
        htmlParts.push(`<li class="flex items-start gap-3 text-ink/75"><span class="flex-shrink-0 w-7 h-7 rounded-full bg-brand-primary text-paper text-sm font-bold flex items-center justify-center">${idx}</span><span class="leading-relaxed">${inlineFormat(text)}</span></li>`)
      }
      htmlParts.push('</ol>')
      continue
    }

    // Unordered list
    if (lines.length > 0 && lines[0].match(/^- /)) {
      htmlParts.push('<ul class="space-y-2 my-4">')
      for (const line of lines) {
        const text = line.replace(/^- /, '')
        htmlParts.push(`<li class="flex items-start gap-2 text-ink/75"><span class="text-brand-primary mt-1">•</span><span class="leading-relaxed">${inlineFormat(text)}</span></li>`)
      }
      htmlParts.push('</ul>')
      continue
    }

    // Horizontal rule
    if (lines[0].match(/^---$/)) {
      htmlParts.push('<hr class="my-8 border-line" />')
      continue
    }

    // Regular paragraph
    const paraText = lines.join(' ')
    if (paraText.trim()) {
      htmlParts.push(`<p class="text-ink/75 leading-relaxed my-4">${inlineFormat(paraText)}</p>`)
    }
  }

  return htmlParts.join('\n')
}

// Static pages for SSR
export default async function BlogPost(props: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await props.params
  setRequestLocale(locale)
  const post = getPostBySlug(slug)
  const t = await getTranslations({ locale, namespace: 'blog' })

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center md:px-8">
        <h1 className="t-display t-display-md text-ink">{t('postNotFound')}</h1>
        <LocalLink href="/blog" className="btn btn-outline mt-6">
          <ArrowLeft size={14} /> {t('backToBlog')}
        </LocalLink>
      </div>
    )
  }

  const htmlContent = renderMarkdown(post.content)
  // Índice del artículo: se extrae del HTML ya renderizado para no duplicar la
  // fuente de verdad. Si no hay al menos dos h2, no se pinta columna lateral.
  const tocHtml = Array.from(htmlContent.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g))
    .map((m) => m[1].replace(/<[^>]+>/g, '').trim())
    .map((titulo) => `<p>${titulo}</p>`)
    .join('')
  const articleSchema = generateArticleSchema(post)

  return (
    <article className="bg-paper">
      {/* Article Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleSchema) }}
      />

      <header className="border-b border-line">
        <div className="shell pb-10 pt-8 md:pb-14 md:pt-12">
          <nav aria-label="Migas de pan" className="t-eyebrow flex flex-wrap items-center gap-2 text-ink/40">
            <LocalLink href="/" className="transition-colors hover:text-ink">{t('home')}</LocalLink>
            <span className="text-ink/25">/</span>
            <LocalLink href="/blog" className="transition-colors hover:text-ink">Guías</LocalLink>
            <span className="text-ink/25">/</span>
            <span className="max-w-[46ch] truncate text-ink/60">{post.title}</span>
          </nav>

          <div className="mt-8 max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="t-label bg-signal px-2 py-1 text-ink">{post.category}</span>
              <span className="t-label flex items-center gap-1.5 text-ink/40">
                <Calendar size={11} /> {post.date}
              </span>
              <span className="t-label flex items-center gap-1.5 text-ink/40">
                <Clock size={11} /> {post.readTime}
              </span>
            </div>
            <h1 className="t-display t-display-lg mt-6 text-ink">{post.title}</h1>
            <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-muted">{post.excerpt}</p>
          </div>
        </div>
      </header>

      <div className="shell py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Columna lateral: navegación del artículo */}
          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-[var(--header-offset)] lg:z-10">
              <p className="t-label border-b border-line pb-2 text-ink/40">En este artículo</p>
              <div className="doc-toc mt-3 space-y-1.5 text-[13px] leading-snug text-ink/60" dangerouslySetInnerHTML={{ __html: tocHtml }} />
              <LocalLink
                href="/blog"
                className="mt-6 inline-flex items-center gap-2 border-t border-line pt-4 text-[13px] font-medium text-ink/60 transition-colors hover:text-ink"
              >
                <ArrowLeft size={13} /> {t('backToBlog')}
              </LocalLink>
            </div>
          </aside>

          <div className="lg:col-span-9 lg:border-l lg:border-line lg:pl-10">
            <div
              className="doc max-w-[68ch]"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            {post.tags.length > 0 && (
              <div className="mt-10 max-w-[68ch] border-t border-line pt-4">
                <ul className="flex flex-wrap items-center gap-1.5">
                  {post.tags.map(tag => (
                    <li
                      key={tag}
                      className="t-label flex items-center gap-1.5 border border-line px-2 py-1 text-ink/50"
                    >
                      <Tag size={9} /> {tag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA */}
      <section className="on-dark bg-ink text-paper">
        <div className="shell flex flex-col gap-6 py-14 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h2 className="t-display t-display-sm text-paper">{t('haveSomething')}</h2>
            <p className="mt-3 text-[14px] leading-relaxed text-paper/60">{t('publishFreeDesc')}</p>
          </div>
          <LocalLink href="/publicar" className="btn btn-signal btn-lg shrink-0">
            {t('publishFree')} <ArrowRight size={16} />
          </LocalLink>
        </div>
      </section>

      {/* Más artículos */}
      <section className="bg-paper">
        <div className="shell py-12 md:py-16">
          <h2 className="t-eyebrow border-b border-ink pb-3 text-ink">{t('moreArticles')}</h2>
          <div className="border-t border-line">
            {getAllSlugs()
              .filter(s => s !== slug)
              .slice(0, 3)
              .map((s, i) => {
                const other = getPostBySlug(s)
                if (!other) return null
                return (
                  <LocalLink
                    key={s}
                    href={`/blog/${s}`}
                    className="group/r flex items-start gap-5 border-b border-line py-5"
                  >
                    <span className="t-label mt-1 shrink-0 text-ink/25">{String(i + 1).padStart(2, '0')}</span>
                    <div className="min-w-0 flex-1">
                      <p className="t-label text-ink/45">{other.category}</p>
                      <h3 className="mt-1.5 text-[17px] font-semibold leading-snug tracking-[-0.02em] text-ink group-hover/r:underline group-hover/r:underline-offset-4">
                        {other.title}
                      </h3>
                      <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">{other.excerpt}</p>
                    </div>
                    <ArrowRight
                      size={15}
                      strokeWidth={1.5}
                      className="mt-1 shrink-0 text-ink/25 transition-transform duration-300 group-hover/r:translate-x-1 group-hover/r:text-ink"
                    />
                  </LocalLink>
                )
              })}
          </div>
        </div>
      </section>

      {/* Enlaces internos al marketplace: la autoridad del blog debe terminar
          en categorías/búsquedas reales, no evaporarse al salir del artículo. */}
      <section className="border-t border-line bg-paper-2/50">
        <div className="shell py-10 md:py-12">
          <h3 className="t-eyebrow text-ink/45">{t('exploreTitle')}</h3>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {(post.tags || [])
              .map((tag) => tag.toLowerCase())
              .map((tag) => {
                // Destinos reales de la vertical de maquinaria. Los enlaces
                // internos del blog solo pueden apuntar a rutas que existen:
                // subcategoría (label) o familia de la taxonomía de Fase 3.
                const sub = (label: string) => ({
                  label,
                  href: `/catalogo?subcategoria=${encodeURIComponent(label)}` })
                const fam = (label: string, key: string) => ({
                  label,
                  href: `/catalogo?categoria=${key}` })
                if (/tractor|agricola|siembra|abono|aperos/.test(tag)) return sub('Tractores')
                if (/cosechadora|cosecha|vendimi/.test(tag)) return sub('Cosechadoras')
                if (/ganaderia|ganado|estabulo|orde/.test(tag)) return sub('Ganadería')
                if (/miniexcavadora|excavadora|zanja|demolicion|hidraulic/.test(tag)) return sub('Excavadoras')
                if (/retro|cargadora|carga frontal/.test(tag)) return sub('Cargadoras')
                if (/compactac|apison|rodillo/.test(tag)) return sub('Compactación')
                if (/plataforma|tijera|elevaci[oó]n/.test(tag)) return sub('Plataformas elevadoras')
                if (/motosierra|sierra y poda|poda/.test(tag)) return sub('Sierra y poda')
                if (/herramienta el[eé]ctrica|rotomartillo|taladro|atornillador|bater/.test(tag)) return sub('Herramienta eléctrica')
                if (/motor|generador|electr[oó]geno|bobinado/.test(tag)) return sub('Motores y generadores')
                if (/taller|llave|destornillador/.test(tag)) return sub('Taller manual')
                if (/obra|reforma|construccion|civil/.test(tag)) return fam('Maquinaria de obra', 'obra')
                if (/herramientas/.test(tag)) return fam('Herramientas y motores', 'herramientas')
                if (/agro|campo|explotacion/.test(tag)) return fam('Maquinaria agrícola', 'agricola')
                if (/itp|ficha t[eé]cnica|legal|documentaci[oó]n|factura|aduana|homolog|\bce\b/.test(tag)) {
                  return { label: t('catSafeBuy'), href: '/catalogo' }
                }
                if (/compra|checklist|segunda mano|consejo|ocasi[oó]n|usado|revisi[oó]n|iva|impuesto|tasa|matriculaci[oó]n|precio|coste|presupuesto|horas de uso/.test(tag)) {
                  return { label: t('catTasador'), href: '/tasador' }
                }
                return null
              })
              .filter((v, i, a) => v && a.findIndex(x => x && x.href === v.href) === i)
              .slice(0, 4)
              .map((l: { label: string; href: string } | null) =>
                l ? (
                  <LocalLink
                    key={l.href}
                    href={l.href}
                    className="t-label border border-line bg-paper px-2.5 py-1.5 text-ink/60 transition-colors hover:border-ink hover:text-ink"
                  >
                    {l.label}
                  </LocalLink>
                ) : null
              )}
            <LocalLink
              href="/catalogo"
              className="t-label bg-ink px-2.5 py-1.5 text-paper"
            >
              {t('catCatalog')}
            </LocalLink>
            <LocalLink
              href="/publicar"
              className="t-label bg-signal px-2.5 py-1.5 text-ink"
            >
              {t('catPublish')}
            </LocalLink>
          </div>
        </div>
      </section>
    </article>
  )
}
