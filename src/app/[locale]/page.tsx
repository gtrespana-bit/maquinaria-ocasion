import { serializeJsonLd } from '@/lib/serialize-json-ld'
import LocalLink from '@/components/LocalLink'
import Image from 'next/image'
import {
  Search,
  FileCheck,
  ShieldCheck,
  MapPin,
  ArrowRight,
  ArrowUpRight,
  ArrowDown,
  CheckCircle2,
  Camera,
  MessageCircle,
  BadgeCheck,
  Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase-server-client'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { productUrl } from '@/lib/product-url'
import { formatPrecio } from '@/lib/precio'
import { alternatesSeo } from '@/lib/seo'
import { MARCA } from '@/lib/marca'
import { TODAS_LAS_SUBS, FAMILIAS } from '@/lib/categorias'
import { CIUDADES_SEO } from '@/lib/ubicaciones-seo'
import { aplicarOrdenCatalogo, ordenarProductosCatalogo } from '@/lib/catalog-consulta'
import { Reveal, CountUp } from '@/components/ui/Motion'
import { Eyebrow, ArrowLink, SectionHead, Ticker } from '@/components/ui/Bits'
import ProductCard from '@/components/ProductCard'
import Avatar from '@/components/Avatar'
import fs from 'fs'
import path from 'path'

// ── Metadata ──────────────────────────────────────────────────────────────

function generateItemListSchema(products: any[], baseUrl: string) {
  // Los anuncios sembrados por la plataforma siguen visibles en las tarjetas
  // (sin ninguna etiqueta que los distinga), pero sus fichas llevan noindex y
  // no deben declararse como ofertas reales en datos estructurados.
  const indexableProducts = (products || []).filter(
    (product) => product.es_demo !== true && product.vendido !== true
  )
  if (indexableProducts.length === 0) return null

  const itemListElements = indexableProducts.map((product, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `${baseUrl}/producto/${product.slug || product.id}`,
    name: product.titulo,
    description: product.descripcion || `Maquinaria de ocasión en España`,
    image: product.imagen_url || `${baseUrl}/placeholder-product.webp`,
    offers: {
      '@type': 'Offer',
      price: product.precio_usd || 0,
      priceCurrency: 'EUR',
      availability: product.reservado
        ? 'https://schema.org/LimitedAvailability'
        : 'https://schema.org/InStock' } }))

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: itemListElements,
    numberOfItems: indexableProducts.length,
    description: `${MARCA.etiquetaVertical} en España — ${MARCA.nombre}` }
}

export async function generateMetadata({
  params }: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params

  return {
    title: MARCA.etiquetaVertical,
    description: MARCA.seo.descripcionCorta,
    keywords: [...MARCA.seo.keywords],
    authors: [{ name: MARCA.nombre }],
    creator: MARCA.nombre,
    publisher: MARCA.nombre,
    alternates: alternatesSeo('/'),
    openGraph: {
      title: MARCA.etiquetaVertical,
      description: MARCA.seo.descripcionCorta,
      url: MARCA.url,
      siteName: MARCA.nombre,
      images: [
        {
          url: `${MARCA.url}/og-image.webp`,
          width: 1200,
          height: 630,
          alt: 'MaquinariaOcasión — Maquinaria agrícola, de obra y herramientas de ocasión en España' },
      ],
      locale: locale === 'en' ? 'en_US' : 'es_ES',
      type: 'website' },
    twitter: {
      card: 'summary_large_image',
      title: MARCA.etiquetaVertical,
      description: MARCA.seo.descripcionCorta,
      images: [`${MARCA.url}/og-image.webp`] },
    robots: { index: true, follow: true } }
}

// La home lista anuncios recién publicados: con 10 minutos se refresca sola y
// cada publicación la invalida al instante con `revalidarListadosPublicos()`.
export const revalidate = 600

// ── Datos ─────────────────────────────────────────────────────────────────

const MODERACION = 'estado_moderacion.is.null,estado_moderacion.eq.aprobado'
const PRODUCT_COLS = 'id, slug, titulo, precio_usd, estado, imagen_url, ubicacion_ciudad, subcategoria, creado_en, boosteado_en, destacado, destacado_hasta, vendedor_tipo, es_demo, vendido, reservado'

async function getProductos(limit = 8, subcategorias?: string[], categoria?: string) {
  if (!supabase) return []
  try {
    let q = supabase.from('productos').select(PRODUCT_COLS).eq('activo', true).or(MODERACION)
    if (categoria) {
      const { data: catRow } = await supabase
        .from('categorias')
        .select('id')
        .eq('nombre', categoria)
        .maybeSingle()
      if (!catRow) return []
      q = q.eq('categoria_id', catRow.id)
    } else if (subcategorias && subcategorias.length === 1) {
      q = q.eq('subcategoria', subcategorias[0])
    } else if (subcategorias && subcategorias.length > 1) {
      q = q.in('subcategoria', subcategorias)
    }
    const { data, error } = await aplicarOrdenCatalogo(q).limit(limit)
    if (error) return []
    return ordenarProductosCatalogo((data || []) as any)
  } catch {
    return []
  }
}

function getProvinciasPopulares() {
  const slugs = [
    'madrid', 'barcelona', 'valencia', 'sevilla', 'malaga', 'alicante',
    'murcia', 'asturias', 'baleares', 'las-palmas', 'santa-cruz-de-tenerife', 'zaragoza',
  ]
  return slugs
    .map((slug) => CIUDADES_SEO.find((c) => c.slug === slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
}

function getUltimasGuias(limit = 3) {
  const dir = path.join(process.cwd(), 'src/content/blog')
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf-8')
      const get = (key: string) =>
        raw.match(new RegExp(`^${key}:\\s*\\"?(.*?)\\"?$`, 'm'))?.[1]?.replace(/^\\"|\\"$/g, '') || ''
      return {
        slug: file.replace(/\.md$/, ''),
        title: get('title'),
        excerpt: get('excerpt'),
        date: get('date'),
        readTime: get('readTime') }
    })
    .filter((g) => g.title)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
}

async function getConteos() {
  if (!supabase) return null
  try {
    const [anuncios, vendedores] = await Promise.all([
      supabase.from('productos').select('id', { count: 'exact', head: true }).eq('activo', true).or(MODERACION),
      supabase.from('perfiles').select('id', { count: 'exact', head: true }).eq('verificado', true),
    ])
    if (anuncios.error || vendedores.error) return null
    return { anuncios: anuncios.count ?? 0, vendedores: vendedores.count ?? 0 }
  } catch {
    return null
  }
}

async function countProductosFamilia(categoria: string): Promise<number | null> {
  if (!supabase) return null
  try {
    const { data: catRow } = await supabase
      .from('categorias')
      .select('id')
      .eq('nombre', categoria)
      .maybeSingle()
    if (!catRow) return 0
    const { count, error } = await supabase
      .from('productos')
      .select('id', { count: 'exact', head: true })
      .eq('activo', true)
      .eq('categoria_id', catRow.id)
      .or(MODERACION)
    if (error) return null
    return count ?? 0
  } catch {
    return null
  }
}

/** Anuncios con precio reducido respecto al anterior registrado. */
async function getPreciosReducidos(
  limit = 8
): Promise<{ p: any; precioAnterior: number; descuento: number }[]> {
  if (!supabase) return []
  try {
    const { data: cambios, error } = await supabase
      .from('historial_precios')
      .select('producto_id, precio_anterior, precio_nuevo')
      .order('creado_en', { ascending: false })
      .limit(120)
    if (error || !cambios || cambios.length === 0) return []
    const ultimos = new Map<string, number>()
    for (const c of cambios) {
      if (!ultimos.has(c.producto_id)) ultimos.set(c.producto_id, Number(c.precio_anterior))
    }
    const ids = [...ultimos.keys()].slice(0, 60)
    if (ids.length === 0) return []
    const { data: prods } = await supabase
      .from('productos')
      .select(PRODUCT_COLS)
      .eq('activo', true)
      .or(MODERACION)
      .in('id', ids)
    if (!prods || prods.length === 0) return []
    const reducidos: { p: any; precioAnterior: number; descuento: number }[] = []
    for (const p of prods as any[]) {
      const antes = ultimos.get(p.id) || 0
      const actual = Number(p.precio_usd || 0)
      if (antes > 0 && actual > 0 && actual < antes) {
        reducidos.push({ p, precioAnterior: antes, descuento: Math.round((1 - actual / antes) * 100) })
      }
    }
    reducidos.sort((a, b) => b.descuento - a.descuento)
    return reducidos.slice(0, limit)
  } catch {
    return []
  }
}

async function getTestimonios(limit = 3) {
  if (!supabase) return []
  try {
    const { data, error } = await supabase
      .from('resenas')
      .select('id, puntuacion, comentario, creado_en, comprador_id, producto:productos(titulo, slug)')
      .gte('puntuacion', 4)
      .not('comentario', 'is', null)
      .order('creado_en', { ascending: false })
      .limit(15)
    if (error || !data || data.length === 0) return []
    const buenos = (data as any[]).filter((r) => (r.comentario || '').trim().length >= 15).slice(0, limit)
    if (buenos.length === 0) return []
    const ids = [...new Set(buenos.map((r) => r.comprador_id).filter(Boolean))]
    const nombres: Record<string, string> = {}
    if (ids.length > 0) {
      const { data: perfiles } = await supabase.from('perfiles').select('id, nombre').in('id', ids)
      for (const pf of perfiles || []) if (pf.nombre) nombres[pf.id] = pf.nombre
    }
    return buenos.map((r) => ({ ...r, comprador_nombre: nombres[r.comprador_id] || null }))
  } catch {
    return []
  }
}

async function getVendedoresDestacados(limit = 6) {
  if (!supabase) return []
  try {
    const { data: prods, error } = await supabase
      .from('productos')
      .select('user_id')
      .eq('activo', true)
      .eq('vendedor_verificado', true)
      .or(MODERACION)
      .limit(500)
    if (error || !prods || prods.length === 0) return []
    const conteo = new Map<string, number>()
    for (const pr of prods as any[]) {
      if (pr.user_id) conteo.set(pr.user_id, (conteo.get(pr.user_id) || 0) + 1)
    }
    const ids = [...conteo.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map((e) => e[0])
    if (ids.length === 0) return []
    const { data: perfiles } = await supabase
      .from('perfiles')
      .select('id, nombre, tipo_vendedor, foto_perfil_url')
      .in('id', ids)
    const porId = new Map((perfiles || []).map((pf: any) => [pf.id, pf]))
    return ids
      .map((id) => porId.get(id))
      .filter((pf: any) => pf && pf.nombre)
      .map((pf: any) => ({ ...pf, anuncios: conteo.get(pf.id) || 0 }))
  } catch {
    return []
  }
}

// ── Arquetipos visuales ───────────────────────────────────────────────────

const FOTO_FAMILIA: Record<string, string> = {
  agricola: '/images/anuncios/tractor-1.jpg',
  obra: '/images/anuncios/excavadora-1.jpg',
  herramientas: '/images/anuncios/herramientas.jpg' }

const FAMILIA_INDEX: Record<string, string> = {
  agricola: '01',
  obra: '02',
  herramientas: '03' }

function frascoProducto(p: any) {
  return {
    id: p.id,
    slug: p.slug ?? null,
    titulo: p.titulo,
    precio_usd: p.precio_usd ?? null,
    imagen_url: p.imagen_url ?? null,
    ubicacion_ciudad: p.ubicacion_ciudad ?? null,
    ubicacion_estado: p.ubicacion_estado ?? null,
    estado: p.estado ?? '',
    boosteado_en: p.boosteado_en ?? null,
    destacado: p.destacado ?? null,
    destacado_hasta: p.destacado_hasta ?? null,
    vendedor_verificado: p.vendedor_verificado ?? null,
    vendedor_tipo: p.vendedor_tipo ?? null,
    reservado: p.reservado ?? null,
    es_demo: p.es_demo ?? null }
}

// ── Página ────────────────────────────────────────────────────────────────

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()

  const [recientes, agricola, obra, herramientas] = await Promise.all([
    getProductos(8),
    getProductos(4, undefined, 'agricola'),
    getProductos(4, undefined, 'obra'),
    getProductos(4, undefined, 'herramientas'),
  ])
  const itemsPorFamilia: Record<string, any[]> = { agricola, obra, herramientas }

  const [conteos, reducidos, conteosFamilia, testimonios, destacados] = await Promise.all([
    getConteos(),
    getPreciosReducidos(6),
    Promise.all(FAMILIAS.map((f) => countProductosFamilia(f.key))),
    getTestimonios(3),
    getVendedoresDestacados(6),
  ])
  const conteoPorFamilia: Record<string, number | null> = {}
  FAMILIAS.forEach((f, i) => {
    conteoPorFamilia[f.key] = conteosFamilia[i]
  })
  const nf = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-ES')

  const provincias = getProvinciasPopulares()
  const guias = getUltimasGuias(3)
  const subs = TODAS_LAS_SUBS
  const jsonLd = generateItemListSchema(recientes, 'https://maquinaria.click')

  const pilares = [
    { icon: FileCheck, title: t('home.trust.items.0.title'), desc: t('home.trust.items.0.desc') },
    { icon: ShieldCheck, title: t('home.trust.items.1.title'), desc: t('home.trust.items.1.desc') },
    { icon: Zap, title: t('home.trust.items.2.title'), desc: t('home.trust.items.2.desc') },
    { icon: MapPin, title: t('home.trust.items.3.title'), desc: t('home.trust.items.3.desc') },
  ]

  const pasos = [
    { n: '01', icon: Camera, title: t('home.how.step1Title'), desc: t('home.how.step1Desc') },
    { n: '02', icon: MessageCircle, title: t('home.how.step2Title'), desc: t('home.how.step2Desc') },
    { n: '03', icon: BadgeCheck, title: t('home.how.step3Title'), desc: t('home.how.step3Desc') },
  ]

  // Marcas presentes en el catálogo maestro: dan textura de mercado real.
  const marcasTicker = [
    'John Deere', 'New Holland', 'Massey Ferguson', 'Fendt', 'Case IH', 'Claas',
    'Kubota', 'Caterpillar', 'JCB', 'Volvo CE', 'Komatsu', 'Takeuchi',
    'Manitou', 'Liebherr', 'Bobcat', 'Deutz-Fahr', 'Valtra', 'Horsch',
  ]

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      )}

      {/* ══════════════════════════════════════════════════════════════════
          HERO — fotografía a sangre, titular editorial y buscador en línea
          ══════════════════════════════════════════════════════════════════ */}
      <section className="on-dark relative isolate overflow-hidden bg-ink text-paper">
        <Image
          src="/images/hero-machinery.jpg"
          alt={t('home.hero.heroImageAlt')}
          fill
          priority
          quality={80}
          fetchPriority="high"
          sizes="100vw"
          className="object-cover object-[62%_center] opacity-[0.82] md:object-center"
        />
        {/* Tratamiento: degradado lateral para el texto + refuerzo inferior */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(100deg,#0C0E0D_0%,rgba(12,14,13,0.94)_34%,rgba(12,14,13,0.55)_62%,rgba(12,14,13,0.35)_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent"
        />
        <div aria-hidden="true" className="blueprint absolute inset-0 opacity-40" />

        <div className="shell relative pb-0 pt-14 md:pt-20 lg:pt-24">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
            {/* Titular */}
            <div className="lg:col-span-7 xl:col-span-7">
              <Reveal>
                <Eyebrow tone="signal" marker="rule">
                  {t('home.hero.badge')}
                </Eyebrow>
              </Reveal>

              <Reveal delay={80}>
                <h1 className="t-display t-display-xl mt-7 text-paper">
                  {t('home.hero.claim')}
                  <br />
                  <span className="t-serif-italic text-signal">{t('home.hero.claimAccent')}</span>
                </h1>
              </Reveal>

              <Reveal delay={160}>
                <p className="mt-7 max-w-lg text-[15px] leading-relaxed text-paper/70 md:text-base">
                  {t('home.hero.subtitle')}
                </p>
              </Reveal>

              <Reveal delay={220}>
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <LocalLink href="/catalogo" className="btn btn-signal btn-lg">
                    {t('home.hero.explore')}
                    <ArrowRight size={16} />
                  </LocalLink>
                  <LocalLink
                    href="/publicar"
                    className="link-rule t-eyebrow text-paper"
                  >
                    {t('home.hero.publishFree')}
                    <ArrowUpRight size={13} />
                  </LocalLink>
                </div>
              </Reveal>
            </div>

            {/* Buscador: panel de papel, el objeto protagonista */}
            <div className="lg:col-span-5 xl:col-span-5">
              <Reveal delay={260}>
                <form
                  action="/catalogo"
                  method="GET"
                  className="relative border border-paper/15 bg-paper p-5 text-ink md:p-6"
                >
                  <div className="flex items-baseline justify-between border-b border-line pb-4">
                    <p className="t-label text-ink/60">{t('home.hero.panelTitle')}</p>
                    <span className="t-label text-ink/30">01 / 04</span>
                  </div>

                  <div className="mt-5 space-y-4">
                    <label className="block">
                      <span className="t-label text-ink/50">{t('home.hero.searchPlaceholder')}</span>
                      <div className="mt-1 flex items-center gap-2 border-b border-line-strong focus-within:border-ink">
                        <Search size={16} strokeWidth={1.6} className="shrink-0 text-ink/35" />
                        <input
                          type="search"
                          name="q"
                          placeholder="John Deere 6120M…"
                          className="w-full bg-transparent py-2.5 text-[15px] text-ink placeholder:text-ink/30 focus:outline-none"
                          aria-label={t('home.hero.searchPlaceholder')}
                        />
                      </div>
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                      <label className="select-wrap block">
                        <span className="t-label text-ink/50">{t('home.hero.filterType')}</span>
                        <select
                          name="subcategoria"
                          className="field pr-5 font-medium"
                          aria-label={t('home.hero.filterType')}
                        >
                          <option value="">{t('home.hero.allTypes')}</option>
                          {FAMILIAS.map((f) => (
                            <optgroup key={f.key} label={t(`familias.${f.key}.label`)}>
                              {f.subs.map((slug) => {
                                const s = subs.find((x) => x.slug === slug)
                                if (!s) return null
                                return (
                                  <option key={s.slug} value={s.label}>
                                    {s.label}
                                  </option>
                                )
                              })}
                            </optgroup>
                          ))}
                        </select>
                      </label>

                      <label className="select-wrap block">
                        <span className="t-label text-ink/50">{t('home.hero.filterProvince')}</span>
                        <select name="ciudad" className="field pr-5 font-medium" aria-label={t('home.hero.filterProvince')}>
                          <option value="">{t('home.hero.allProvinces')}</option>
                          {provincias.map((p) => (
                            <option key={p.slug} value={p.nombre}>
                              {p.nombre}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <label className="block">
                        <span className="t-label text-ink/50">{t('home.hero.priceMin')}</span>
                        <input
                          type="number"
                          name="precioMin"
                          min="0"
                          inputMode="numeric"
                          placeholder="0"
                          className="field t-num"
                        />
                      </label>
                      <label className="block">
                        <span className="t-label text-ink/50">{t('home.hero.priceMax')}</span>
                        <input
                          type="number"
                          name="precioMax"
                          min="0"
                          inputMode="numeric"
                          placeholder="150.000"
                          className="field t-num"
                        />
                      </label>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-ink mt-6 w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Search size={15} />
                      {t('home.hero.searchButton')}
                    </span>
                    <ArrowRight size={15} />
                  </button>

                  <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5">
                    {subs.slice(0, 5).map((s) => (
                      <LocalLink
                        key={s.slug}
                        href={`/categoria/${s.slug}`}
                        className="text-[12px] text-ink/55 underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
                      >
                        {s.label}
                      </LocalLink>
                    ))}
                    <LocalLink
                      href="/catalogo"
                      className="text-[12px] font-semibold text-ink underline decoration-signal decoration-2 underline-offset-4"
                    >
                      {t('home.hero.seeAll')}
                    </LocalLink>
                  </div>
                </form>
              </Reveal>
            </div>
          </div>

          {/* Datos en vivo + acceso al catálogo */}
          <Reveal delay={320}>
            <div className="mt-14 grid grid-cols-2 items-start gap-x-6 gap-y-7 border-t border-paper/15 py-7 md:mt-20 md:grid-cols-4 md:gap-8 md:items-end">
              <div>
                <p className="t-display t-display-sm t-num text-paper">
                  {conteos ? <CountUp to={conteos.anuncios} /> : '—'}
                </p>
                <p className="t-label mt-1.5 text-paper/45">Anuncios activos</p>
              </div>
              <div>
                <p className="t-display t-display-sm t-num text-paper">
                  {conteos ? <CountUp to={conteos.vendedores} /> : '—'}
                </p>
                <p className="t-label mt-1.5 text-paper/45">Vendedores verificados</p>
              </div>
              <div>
                <p className="t-display t-display-sm t-num text-paper">52</p>
                <p className="t-label mt-1.5 text-paper/45">Provincias cubiertas</p>
              </div>
              <div className="col-span-2 flex items-center justify-start md:col-span-1 md:justify-end">
                <LocalLink
                  href="/como-funciona"
                  className="t-eyebrow flex items-center gap-2 whitespace-nowrap text-paper/60 transition-colors hover:text-paper"
                >
                  {t('home.how.moreInfo')}
                  <ArrowDown size={13} className="text-signal" />
                </LocalLink>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Marquesina de fabricantes */}
        <div className="relative border-y border-paper/15 bg-ink/60 py-3.5 backdrop-blur-sm">
          <Ticker items={marcasTicker} tone="dark" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          MANIFIESTO — el criterio del mercado
          ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-paper">
        <div className="shell py-16 md:py-24">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-5">
              <Reveal>
                <Eyebrow marker="dot">{t('home.trust.kicker')}</Eyebrow>
                <h2 className="t-display t-display-lg mt-6 whitespace-pre-line text-ink">
                  {t('home.trust.title')}
                </h2>
                <p className="mt-6 max-w-md text-[15px] leading-relaxed text-muted">
                  {t('home.trust.subtitle')}
                </p>
              </Reveal>

              <Reveal delay={120}>
                <figure className="mt-10 border-l-2 border-signal pl-5">
                  <blockquote className="t-serif text-[1.35rem] leading-[1.25] text-ink">
                    «{t('home.trust.quote')}»
                  </blockquote>
                  <figcaption className="t-label mt-3 text-muted">
                    {t('home.trust.quoteAuthor')}
                  </figcaption>
                </figure>
              </Reveal>
            </div>

            <div className="lg:col-span-7">
              <div className="grid grid-cols-1 sm:grid-cols-2">
                {pilares.map((p, i) => (
                  <Reveal
                    key={p.title}
                    delay={i * 90}
                    className={`border-t border-line py-7 ${
                      i % 2 === 0 ? 'sm:border-r sm:pr-7 sm:pl-0' : 'sm:pl-7'
                    } ${i >= 2 ? 'sm:border-t' : ''}`}
                  >
                    <span className="t-label text-ink/35">0{i + 1}</span>
                    <p.icon size={22} strokeWidth={1.4} className="mt-5 text-ink" />
                    <h3 className="mt-4 text-[17px] font-semibold tracking-[-0.02em] text-ink">
                      {p.title}
                    </h3>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{p.desc}</p>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FAMILIAS — tres puertas de entrada
          ══════════════════════════════════════════════════════════════════ */}
      <section className="border-t border-line bg-paper-2/60">
        <div className="shell py-16 md:py-24">
          <Reveal>
            <SectionHead
              index="01"
              eyebrow={t('home.sections.familiesEyebrow')}
              title={t('home.sections.familiesTitle')}
              subtitle={t('home.sections.familiesNote')}
              href="/catalogo"
              linkLabel={t('home.categories.viewAll')}
            />
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
            {FAMILIAS.map((f, i) => (
              <Reveal key={f.key} delay={i * 100}>
                <LocalLink
                  href={`/categoria/${f.key}`}
                  className="group/f relative flex h-[440px] flex-col justify-between overflow-hidden border border-line bg-ink p-6 text-paper md:h-[500px]"
                >
                  <Image
                    src={FOTO_FAMILIA[f.key] || '/placeholder-product.webp'}
                    alt={t(`familias.${f.key}.label`)}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover opacity-70 saturate-[0.8] transition-[transform,opacity,filter] duration-700 ease-editorial group-hover/f:scale-[1.04] group-hover/f:opacity-90 group-hover/f:saturate-100"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,14,13,0.72)_0%,rgba(12,14,13,0.1)_38%,rgba(12,14,13,0.86)_100%)]"
                  />

                  <div className="relative flex items-start justify-between">
                    <span className="t-label text-paper/60">{FAMILIA_INDEX[f.key]}</span>
                    {conteoPorFamilia[f.key] != null && (conteoPorFamilia[f.key] as number) > 0 ? (
                      <span className="t-label border border-paper/25 px-2 py-1 text-paper/70 tabular-nums">
                        {nf.format(conteoPorFamilia[f.key] as number)} anuncios
                      </span>
                    ) : (
                      <span className="t-label border border-paper/25 px-2 py-1 text-paper/60">
                        Catálogo
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <h3 className="t-display t-display-sm text-paper">{t(`familias.${f.key}.label`)}</h3>
                    <p className="mt-2 max-w-[28ch] text-[13px] leading-relaxed text-paper/60 line-clamp-2">
                      {t(`familias.${f.key}.desc`)}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-x-3 gap-y-1">
                      {f.subs.slice(0, 3).map((slug) => {
                        const s = subs.find((x) => x.slug === slug)
                        if (!s) return null
                        return (
                          <span key={s.slug} className="t-label text-paper/45">
                            {s.label}
                          </span>
                        )
                      })}
                      {f.subs.length > 3 && (
                        <span className="t-label text-paper/30">+{f.subs.length - 3}</span>
                      )}
                    </div>
                    <span className="mt-6 flex items-center gap-2 text-[13px] font-semibold text-signal">
                      Ver catálogo
                      <ArrowRight
                        size={15}
                        className="transition-transform duration-300 group-hover/f:translate-x-1.5"
                      />
                    </span>
                  </div>
                </LocalLink>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          RECIÉN PUBLICADAS
          ══════════════════════════════════════════════════════════════════ */}
      <section className="border-t border-line bg-paper">
        <div className="shell py-16 md:py-24">
          <Reveal>
            <SectionHead
              index="02"
              eyebrow={t('home.sections.recentEyebrow')}
              title={t('home.recent.title')}
              subtitle={t('home.recent.subtitle')}
              href="/catalogo"
              linkLabel={t('home.recent.viewAll')}
            />
          </Reveal>

          {recientes.length === 0 ? (
            <Reveal>
              <div className="mt-10 flex flex-col items-start gap-4 border border-dashed border-line-strong p-10">
                <p className="t-display t-display-sm text-ink">{t('home.sections.emptyTitle')}</p>
                <p className="max-w-md text-sm text-muted">{t('home.sections.emptyDesc')}</p>
                <LocalLink href="/publicar" className="btn btn-ink btn-sm">
                  {t('home.sections.emptyCta')}
                  <ArrowRight size={14} />
                </LocalLink>
              </div>
            </Reveal>
          ) : (
            <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-4">
              {recientes.map((p: any, i: number) => (
                <Reveal key={p.id} delay={(i % 4) * 70}>
                  <ProductCard p={frascoProducto(p)} priority={i < 2} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          BAJADAS DE PRECIO — transparencia de mercado
          ══════════════════════════════════════════════════════════════════ */}
      {reducidos.length > 0 && (
        <section className="border-t border-line bg-paper-2/60">
          <div className="shell py-14 md:py-20">
            <Reveal>
              <SectionHead
                eyebrow={t('home.sections.railEyebrow')}
                title={t('home.reduced.title')}
                subtitle={t('home.reduced.subtitle')}
                href="/catalogo"
                linkLabel={t('home.viewAll')}
              />
            </Reveal>
            <Reveal delay={120}>
              <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 hide-scrollbar">
                {reducidos.map((r) => (
                  <LocalLink
                    key={r.p.id}
                    href={productUrl(r.p)}
                    className="group/r w-[78vw] shrink-0 snap-start border border-line bg-[#FBFAF5] sm:w-[46vw] lg:w-[calc((100%-3rem)/4)]"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-paper-2">
                      <Image
                        src={r.p.imagen_url || '/placeholder-product.webp'}
                        alt={r.p.titulo}
                        fill
                        sizes="(max-width: 640px) 78vw, 25vw"
                        className="object-cover saturate-[0.9] transition-transform duration-700 ease-editorial group-hover/r:scale-[1.03]"
                      />
                      <span className="t-label absolute left-0 top-0 bg-clay px-2 py-1.5 text-paper">
                        {t('home.sections.priceDrop', { percent: r.descuento })}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="line-clamp-1 text-[14px] font-semibold text-ink">{r.p.titulo}</h3>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="t-display t-num text-[1.15rem] text-ink">
                          {formatPrecio(r.p.precio_usd || 0)}
                        </span>
                        <span className="t-num text-[12px] text-muted line-through">
                          {formatPrecio(r.precioAnterior)}
                        </span>
                      </div>
                    </div>
                  </LocalLink>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          CÓMO FUNCIONA — vender en tres pasos
          ══════════════════════════════════════════════════════════════════ */}
      <section className="on-dark relative overflow-hidden border-t border-line-dark bg-ink text-paper">
        <div aria-hidden="true" className="blueprint absolute inset-0 opacity-50" />
        <div className="shell relative py-16 md:py-24">
          <Reveal>
            <SectionHead
              index="03"
              eyebrow={t('home.sections.howEyebrow')}
              title={t('home.how.title')}
              subtitle={t('home.how.subtitle')}
              href="/como-funciona"
              linkLabel={t('home.how.moreInfo')}
              tone="light"
            />
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-px border-t border-line-dark md:grid-cols-3">
            {pasos.map((p, i) => (
              <Reveal
                key={p.n}
                delay={i * 110}
                className={`border-b border-line-dark py-8 md:border-b-0 md:pr-8 md:pt-9 ${
                  i > 0 ? 'md:border-l md:border-line-dark md:pl-8' : ''
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <span className="t-display t-num text-[2.6rem] leading-none text-signal">{p.n}</span>
                  <p.icon size={20} strokeWidth={1.3} className="text-paper/40" />
                </div>
                <h3 className="mt-8 text-[19px] font-semibold tracking-[-0.02em] text-paper">
                  {p.title}
                </h3>
                <p className="mt-2.5 max-w-sm text-[13.5px] leading-relaxed text-paper/55">{p.desc}</p>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120}>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <LocalLink href="/publicar" className="btn btn-signal">
                {t('home.how.cta')}
                <ArrowRight size={15} />
              </LocalLink>
              <p className="t-eyebrow text-paper/40">0 € · Sin comisiones · 5 minutos</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          VENDEDORES + OPINIONES — prueba social
          ══════════════════════════════════════════════════════════════════ */}
      {(destacados.length > 0 || testimonios.length > 0) && (
        <section className="border-t border-line bg-paper">
          <div className="shell py-16 md:py-24">
            {destacados.length > 0 && (
              <>
                <Reveal>
                  <SectionHead
                    index="04"
                    eyebrow={t('home.sellers.kicker')}
                    title={t('home.sellers.title')}
                    subtitle={t('home.sellers.subtitle')}
                    href="/catalogo"
                    linkLabel={t('home.viewAll')}
                  />
                </Reveal>
                <div className="mt-9 grid grid-cols-2 gap-px border-y border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
                  {destacados.map((d: any, i: number) => (
                    <Reveal key={d.id} delay={i * 60}>
                      <LocalLink
                        href={`/vendedor/${d.id}`}
                        className="group/s flex h-full flex-col items-start gap-3 bg-paper p-5 transition-colors hover:bg-paper-2"
                      >
                        <Avatar nombre={d.nombre} fotoUrl={d.foto_perfil_url || null} size="md" />
                        <p className="line-clamp-1 text-[14px] font-semibold text-ink group-hover/s:underline group-hover/s:underline-offset-4">
                          {d.nombre}
                        </p>
                        <p className="t-label flex items-center gap-1 text-moss">
                          <CheckCircle2 size={10} strokeWidth={2.4} />
                          Verificado
                        </p>
                        <p className="t-label mt-auto text-ink/40 tabular-nums">
                          {d.anuncios} anuncios
                        </p>
                      </LocalLink>
                    </Reveal>
                  ))}
                </div>
              </>
            )}

            {testimonios.length > 0 && (
              <div className={destacados.length > 0 ? 'mt-16' : ''}>
                <Reveal>
                  <SectionHead
                    eyebrow={t('home.sections.testimonialsEyebrow')}
                    title={t('home.testimonials.title')}
                    subtitle={t('home.testimonials.subtitle')}
                  />
                </Reveal>
                <div className="mt-9 grid grid-cols-1 gap-5 md:grid-cols-3">
                  {testimonios.map((r: any, i: number) => (
                    <Reveal key={r.id} delay={i * 90}>
                      <figure className="flex h-full flex-col border-t-2 border-ink bg-[#FBFAF5] p-6">
                        <div className="flex items-center gap-1" aria-label={`${r.puntuacion}/5`}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <span
                              key={n}
                              aria-hidden="true"
                              className={`h-1.5 w-4 ${n <= r.puntuacion ? 'bg-ink' : 'bg-line-strong'}`}
                            />
                          ))}
                          <span className="t-label ml-2 text-muted">{r.puntuacion}.0</span>
                        </div>
                        <blockquote className="t-serif mt-5 line-clamp-4 flex-1 text-[1.1rem] leading-[1.4] text-ink">
                          «{r.comentario}»
                        </blockquote>
                        <figcaption className="mt-6 border-t border-line pt-4">
                          <p className="text-[13px] font-semibold text-ink">
                            {r.comprador_nombre || t('home.testimonials.buyer')}
                          </p>
                          {r.producto?.titulo && (
                            <p className="t-label mt-1 truncate text-muted">{r.producto.titulo}</p>
                          )}
                        </figcaption>
                      </figure>
                    </Reveal>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MERCADO POR FAMILIA — tres rejillas compactas
          ══════════════════════════════════════════════════════════════════ */}
      {FAMILIAS.some((f) => (itemsPorFamilia[f.key] || []).length > 0) && (
        <section className="border-t border-line bg-paper-2/60">
          <div className="shell py-16 md:py-24">
            <Reveal>
              <SectionHead
                index="05"
                eyebrow={t('home.kicker.market')}
                title="El catálogo, por familia"
                subtitle="Cada mundo con su propia lógica: aperos agrícolas, equipos de obra y herramienta profesional."
                href="/catalogo"
                linkLabel={t('home.viewAll')}
              />
            </Reveal>

            {FAMILIAS.map(
              (f) =>
                (itemsPorFamilia[f.key] || []).length > 0 && (
                  <div key={f.key} className="mt-12">
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
                      <div className="flex items-baseline gap-3">
                        <span className="t-label text-ink/35">{FAMILIA_INDEX[f.key]}</span>
                        <h3 className="t-display t-display-sm text-ink">{t(`familias.${f.key}.label`)}</h3>
                      </div>
                      <ArrowLink href={`/categoria/${f.key}`}>{t('home.viewAll')}</ArrowLink>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
                      {(itemsPorFamilia[f.key] || []).slice(0, 4).map((p: any) => (
                        <ProductCard key={p.id} p={frascoProducto(p)} />
                      ))}
                    </div>
                  </div>
                )
            )}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TERRITORIO + GUÍAS
          ══════════════════════════════════════════════════════════════════ */}
      <section className="border-t border-line bg-paper">
        <div className="shell py-16 md:py-24">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-16">
            {/* Provincias */}
            <div className="lg:col-span-5">
              <Reveal>
                <SectionHead
                  index="06"
                  eyebrow={t('home.sections.provincesEyebrow')}
                  title={t('home.provinces.title')}
                  subtitle={t('home.provinces.subtitle')}
                  align="stack"
                />
              </Reveal>
              <ul className="mt-8 border-t border-line">
                {provincias.map((p, i) => (
                  <Reveal key={p.slug} delay={i * 40} as="li" className="border-b border-line">
                    <LocalLink
                      href={`/${p.slug}`}
                      className="group/p flex items-center justify-between gap-4 py-3.5"
                    >
                      <span className="flex items-baseline gap-3">
                        <span className="t-label text-ink/30">{String(i + 1).padStart(2, '0')}</span>
                        <span className="text-[16px] font-medium text-ink transition-transform duration-300 group-hover/p:translate-x-1">
                          {p.nombre}
                        </span>
                      </span>
                      <ArrowUpRight
                        size={15}
                        strokeWidth={1.5}
                        className="text-ink/25 transition-colors group-hover/p:text-ink"
                      />
                    </LocalLink>
                  </Reveal>
                ))}
              </ul>
              <div className="mt-6">
                <ArrowLink href="/catalogo">Ver todas las provincias</ArrowLink>
              </div>
            </div>

            {/* Guías */}
            <div className="lg:col-span-7">
              <Reveal>
                <SectionHead
                  index="07"
                  eyebrow={t('home.sections.guidesEyebrow')}
                  title={t('home.guides.title')}
                  subtitle={t('home.guides.subtitle')}
                  href="/blog"
                  linkLabel={t('home.guides.viewAll')}
                />
              </Reveal>
              <div className="mt-8 divide-y divide-line border-y border-line">
                {guias.map((g, i) => (
                  <Reveal key={g.slug} delay={i * 80}>
                    <LocalLink href={`/blog/${g.slug}`} className="group/g flex items-start gap-5 py-6">
                      <span className="t-label mt-1 shrink-0 text-ink/30">{String(i + 1).padStart(2, '0')}</span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[19px] font-semibold leading-snug tracking-[-0.02em] text-ink group-hover/g:underline group-hover/g:underline-offset-4">
                          {g.title}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-[13.5px] leading-relaxed text-muted">
                          {g.excerpt}
                        </p>
                        <p className="t-label mt-3 text-ink/40">{g.readTime}</p>
                      </div>
                      <ArrowUpRight
                        size={18}
                        strokeWidth={1.4}
                        className="mt-1 shrink-0 text-ink/20 transition-all duration-300 group-hover/g:-translate-y-0.5 group-hover/g:translate-x-0.5 group-hover/g:text-ink"
                      />
                    </LocalLink>
                  </Reveal>
                ))}
              </div>

              {guias.length === 0 && (
                <p className="mt-8 text-sm text-muted">Próximamente: guías de compra y precios.</p>
              )}

              {/* Acceso al tasador, dentro de la columna editorial */}
              <Reveal delay={160}>
                <LocalLink
                  href="/tasador"
                  className="group/t mt-10 flex items-center justify-between gap-6 border border-ink bg-signal p-6"
                >
                  <div>
                    <p className="t-label text-ink/55">Herramienta gratuita</p>
                    <p className="t-display mt-2 text-[1.5rem] text-ink">¿Cuánto vale tu máquina?</p>
                  </div>
                  <ArrowRight
                    size={26}
                    strokeWidth={1.4}
                    className="shrink-0 text-ink transition-transform duration-300 group-hover/t:translate-x-1.5"
                  />
                </LocalLink>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          CIERRE — publicar
          ══════════════════════════════════════════════════════════════════ */}
      <section className="on-dark relative overflow-hidden bg-ink text-paper">
        <div aria-hidden="true" className="hazard absolute inset-x-0 top-0 h-2 opacity-90" />
        <div className="shell relative py-20 md:py-28">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end">
            <Reveal className="lg:col-span-8">
              <Eyebrow tone="signal" marker="dot">
                {t('home.cta.note')}
              </Eyebrow>
              <h2 className="t-display t-display-lg mt-6 text-paper">
                {t('home.cta.title').replace('?', '')}
                <span className="text-signal">.</span>
              </h2>
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-paper/60">
                {t('home.cta.subtitle')}
              </p>
            </Reveal>
            <Reveal delay={140} className="lg:col-span-4 lg:justify-self-end">
              <div className="flex flex-col items-start gap-4 lg:items-end">
                <LocalLink href="/publicar" className="btn btn-signal btn-lg w-full justify-between lg:w-auto">
                  {t('home.cta.publishNow')}
                  <ArrowRight size={16} />
                </LocalLink>
                <LocalLink href="/catalogo" className="btn btn-outline-light btn-lg w-full justify-between lg:w-auto">
                  {t('home.cta.explore')}
                  <ArrowUpRight size={16} />
                </LocalLink>
                <LocalLink
                  href="/tasador"
                  className="t-eyebrow mt-1 text-paper/50 underline decoration-paper/20 underline-offset-4 transition-colors hover:text-paper"
                >
                  {t('home.cta.estimator')}
                </LocalLink>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  )
}
