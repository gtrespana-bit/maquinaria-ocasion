import { serializeJsonLd } from '@/lib/serialize-json-ld'
import LocalLink from '@/components/LocalLink'
import BotonComparar from '@/components/BotonComparar'
import Avatar from '@/components/Avatar'
import BadgeTipoVendedor from '@/components/BadgeTipoVendedor'
import Image from 'next/image'
import {
  Search, Star, FileCheck, ShieldCheck, MapPin, ChevronRight, ArrowRight, Package, CheckCircle2,
  Tractor, Hammer, Wrench, Zap, Gauge, Camera, MessageCircle, BadgeCheck,
} from 'lucide-react'
import { supabase } from '@/lib/supabase-server-client'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { productUrl } from '@/lib/product-url'
import { formatPrecio } from '@/lib/precio'
import { alternatesSeo } from '@/lib/seo'
import { MARCA } from '@/lib/marca'
import { TODAS_LAS_SUBS, FAMILIAS } from '@/lib/categorias'
import { resumenFabricantes } from '@/lib/marcas'
import { CIUDADES_SEO } from '@/lib/ubicaciones-seo'
import { aplicarOrdenCatalogo, ordenarProductosCatalogo } from '@/lib/catalog-consulta'
import fs from 'fs'
import path from 'path'

// ── Metadata ──────────────────────────────────────────────────────────────

function generateItemListSchema(products: any[], baseUrl: string) {
  // Los anuncios sembrados por la plataforma siguen visibles en las tarjetas
  // (sin ninguna etiqueta que los distinga), pero sus fichas llevan noindex y
  // no deben declararse como ofertas reales en datos estructurados: describir
  // una máquina que no está en venta como una oferta en Stock en el JSON-LD sí
  // sería un problema.
  const indexableProducts = (products || []).filter((product) => product.es_demo !== true && product.vendido !== true)
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
      availability: product.reservado ? 'https://schema.org/LimitedAvailability' : 'https://schema.org/InStock',
    },
  }))

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: itemListElements,
    numberOfItems: indexableProducts.length,
    description: `${MARCA.etiquetaVertical} en España — ${MARCA.nombre}`,
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
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
          alt: 'MaquinariaOcasión — Maquinaria agrícola, de obra y herramientas de ocasión en España',
        },
      ],
      locale: locale === 'en' ? 'en_US' : 'es_ES',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: MARCA.etiquetaVertical,
      description: MARCA.seo.descripcionCorta,
      images: [`${MARCA.url}/og-image.webp`],
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

// La home lista anuncios recién publicados: sin `revalidate` se prerenderizaba
// una sola vez y el CDN la servía con `s-maxage=31536000`, así que un anuncio
// nuevo no aparecía hasta el siguiente despliegue. Con 10 minutos (el mismo
// margen que /catalogo) la portada se refresca sola y, además, cada publicación
// la invalida al instante con `revalidarListadosPublicos()`.
export const revalidate = 600

// ── Datos ─────────────────────────────────────────────────────────────────

const MODERACION = 'estado_moderacion.is.null,estado_moderacion.eq.aprobado'
const PRODUCT_COLS = 'id, slug, titulo, precio_usd, estado, imagen_url, ubicacion_ciudad, subcategoria, creado_en, boosteado_en, destacado, destacado_hasta, vendedor_tipo, es_demo, vendido, reservado'

async function getProductos(limit = 8, subcategorias?: string[], categoria?: string) {
  if (!supabase) return []
  try {
    let q = supabase
      .from('productos')
      .select(PRODUCT_COLS)
      .eq('activo', true)
      .or(MODERACION)
    if (categoria) {
      // Familia → fila de `categorias` → categoria_id (mismo patrón que
      // /buscar, /categoria/[categoria] y useProductLoader).
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
    // El ORDER BY va en SQL (no solo en memoria): si solo ordenáramos los N
    // más recientes, un boost sobre un anuncio antiguo no llegaría a portada.
    const { data, error } = await aplicarOrdenCatalogo(q).limit(limit)
    if (error) return []
    return ordenarProductosCatalogo((data || []) as any)
  } catch {
    return []
  }
}

/** Provincias más visitadas para el módulo de enlaces locales. */
function getProvinciasPopulares() {
  const slugs = ['madrid', 'barcelona', 'valencia', 'sevilla', 'malaga', 'alicante', 'murcia', 'asturias', 'baleares', 'las-palmas', 'santa-cruz-de-tenerife', 'zaragoza']
  return slugs
    .map(slug => CIUDADES_SEO.find(c => c.slug === slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
}

/** Últimas guías del blog para la sección de contenido de la home. */
function getUltimasGuias(limit = 3) {
  const dir = path.join(process.cwd(), 'src/content/blog')
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf-8')
      const get = (key: string) => raw.match(new RegExp(`^${key}:\\s*\"?(.*?)\"?$`, 'm'))?.[1]?.replace(/^\"|\"$/g, '') || ''
      return {
        slug: file.replace(/\.md$/, ''),
        title: get('title'),
        excerpt: get('excerpt'),
        date: get('date'),
        readTime: get('readTime'),
      }
    })
    .filter(g => g.title)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
}

function relativeTime(iso?: string | null, t?: any): string | null {
  if (!iso || !t) return null
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return t('home.timeAgo.now')
  if (mins < 60) return t('home.timeAgo.minutes', { count: mins })
  const hours = Math.floor(mins / 60)
  if (hours < 24) return t('home.timeAgo.hours', { count: hours })
  const days = Math.floor(hours / 24)
  if (days < 7) return t('home.timeAgo.days', { count: days })
  return null
}

/** Fotos de cabecera por familia (arquetipos del propio catálogo). */
const FOTO_FAMILIA: Record<string, string> = {
  agricola: '/images/anuncios/tractor-1.jpg',
  obra: '/images/anuncios/excavadora-1.jpg',
  herramientas: '/images/anuncios/herramientas.jpg',
}

const ICONO_FILIA: Record<string, any> = {
  agricola: Tractor,
  obra: Hammer,
  herramientas: Wrench,
}

/** Conteos en vivo (la home se regenera con revalidate) para las señales de confianza. */
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

/** Nº de anuncios activos de una familia (para el mosaico con conteo). */
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

/**
 * Anuncios con precio reducido (transparencia de precios): el último cambio
 * de `historial_precios` subió… no: bajó el precio respecto al anterior y el
 * precio actual sigue por debajo de ese «antes».
 */
async function getPreciosReducidos(limit = 8): Promise<{ p: any; precioAnterior: number; descuento: number }[]> {
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

/** Testimonios: las últimas reseñas positivas con comentario (§4 del roadmap). */
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
    const buenos = (data as any[]).filter(r => (r.comentario || '').trim().length >= 15).slice(0, limit)
    if (buenos.length === 0) return []
    const ids = [...new Set(buenos.map(r => r.comprador_id).filter(Boolean))]
    let nombres: Record<string, string> = {}
    if (ids.length > 0) {
      const { data: perfiles } = await supabase.from('perfiles').select('id, nombre').in('id', ids)
      for (const pf of perfiles || []) if (pf.nombre) nombres[pf.id] = pf.nombre
    }
    return buenos.map(r => ({ ...r, comprador_nombre: nombres[r.comprador_id] || null }))
  } catch {
    return []
  }
}

/** Vendedores destacados: verificados con más anuncios activos (§4). */
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
    const ids = [...conteo.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(e => e[0])
    if (ids.length === 0) return []
    const { data: perfiles } = await supabase
      .from('perfiles')
      .select('id, nombre, tipo_vendedor, foto_perfil_url')
      .in('id', ids)
    const porId = new Map((perfiles || []).map((pf: any) => [pf.id, pf]))
    return ids
      .map(id => porId.get(id))
      .filter((pf: any) => pf && pf.nombre)
      .map((pf: any) => ({ ...pf, anuncios: conteo.get(pf.id) || 0 }))
  } catch {
    return []
  }
}

// ── Componentes ───────────────────────────────────────────────────────────

function ProductCard({ p, highlighted = false, priority = false, t, precioAnterior, descuento }: { p: any; highlighted?: boolean; priority?: boolean; t: any; precioAnterior?: number | null; descuento?: number | null }) {
  const imgUrl = p.imagen_url || '/placeholder-product.webp'
  const meta = [p.estado, p.ubicacion_ciudad || '', relativeTime(p.creado_en, t)].filter(Boolean).join(' · ')

  return (
    <LocalLink
      href={productUrl(p)}
      className={`bg-white rounded-2xl overflow-hidden group block border shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-1.5 ${
        highlighted
          ? 'border-brand-signal border-2'
          : 'border-gray-200/80 hover:border-brand-signal/70'
      }`}
    >
      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
        <BotonComparar item={{ id: p.id, slug: p.slug ?? null, titulo: p.titulo, precio_usd: p.precio_usd ?? null, imagen_url: p.imagen_url ?? null }} className="absolute bottom-2 right-2" />
        {highlighted && (
          <div className="absolute top-3 left-3 z-10 bg-brand-signal text-brand-darkNav text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
            <Star size={11} className="fill-current" /> {t('home.productCard.featured')}
          </div>
        )}
        {descuento && descuento > 0 && precioAnterior ? (
          <div className="absolute top-3 right-3 z-10 bg-brand-orange text-white text-[11px] font-black px-2 py-1 rounded-lg shadow-md tabular-nums">
            −{descuento}%
          </div>
        ) : null}
        <Image
          src={imgUrl}
          alt={p.titulo}
          fill
          sizes="(max-width: 480px) 45vw, (max-width: 768px) 45vw, (max-width: 1024px) 23vw, 320px"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          priority={priority}
          fetchPriority={priority ? 'high' : 'auto'}
          quality={75}
        />
        {/* Precio sobre la foto — el dato que más pesa en la decisión */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-darkNav/90 via-brand-darkNav/55 to-transparent p-3 pt-8">
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="text-xl font-black tracking-tight text-white leading-none">{formatPrecio(p.precio_usd || 0)}</p>
            {descuento && descuento > 0 && precioAnterior ? (
              <span className="text-[11px] font-bold text-white/70 line-through leading-none">
                {t('home.productCard.priceBefore')} {formatPrecio(precioAnterior)}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="px-4 py-3">
        <h3 className="font-bold text-gray-900 truncate group-hover:text-brand-darkNav transition-colors">
          {p.titulo}
        </h3>
        <p className="text-[11px] text-gray-500 mt-1 truncate flex items-center gap-1">
          <MapPin size={11} className="shrink-0 text-brand-signal-dark" />
          {meta}
        </p>
      </div>
    </LocalLink>
  )
}

function SectionHeader({ title, subtitle, href, viewAll, kicker }: { title: string; subtitle?: string; href: string; viewAll: string; kicker?: string }) {
  return (
    <div className="flex items-end justify-between mb-6 gap-3">
      <div>
        {kicker && <p className="kicker mb-2">{kicker}</p>}
        <h2 className="text-2xl md:text-4xl font-black tracking-tight text-brand-darkNav">{title}</h2>
        {subtitle && <p className="text-gray-500 mt-1.5 text-sm md:text-base max-w-2xl">{subtitle}</p>}
      </div>
      <LocalLink
        href={href}
        className="hidden sm:inline-flex items-center gap-1.5 text-sm font-black text-brand-darkNav bg-brand-signal hover:bg-brand-signal-dark px-4 py-2 rounded-full transition shadow-card flex-shrink-0"
      >
        {viewAll} <ArrowRight size={15} />
      </LocalLink>
    </div>
  )
}

function SectionGrid({ items, t }: { items: any[]; t: any }) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
        {t('home.sectionEmpty')}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
      {items.map((p, i) => (
        <ProductCard key={p.id} p={p} t={t} priority={i < 4} />
      ))}
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────────────────

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()

  const [recientes, agricola, obra, herramientas] = await Promise.all([
    getProductos(8),
    getProductos(8, undefined, 'agricola'),
    getProductos(8, undefined, 'obra'),
    getProductos(8, undefined, 'herramientas'),
  ])
  const itemsPorFamilia: Record<string, any[]> = { agricola, obra, herramientas }

  const [conteos, reducidos, conteosFamilia, testimonios, destacados] = await Promise.all([
    getConteos(),
    getPreciosReducidos(8),
    Promise.all(FAMILIAS.map(f => countProductosFamilia(f.key))),
    getTestimonios(3),
    getVendedoresDestacados(6),
  ])
  const conteoPorFamilia: Record<string, number | null> = {}
  FAMILIAS.forEach((f, i) => { conteoPorFamilia[f.key] = conteosFamilia[i] })
  const nf = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-ES')

  const provincias = getProvinciasPopulares()
  const guias = getUltimasGuias(3)
  const subs = TODAS_LAS_SUBS
  const jsonLd = generateItemListSchema(recientes, 'https://maquinaria.click')

  const beneficios = [
    { icon: ShieldCheck, label: t('home.stats.verified'), desc: t('home.stats.verifiedDesc') },
    { icon: MapPin, label: t('home.stats.allSpain'), desc: t('home.stats.allSpainDesc') },
    { icon: FileCheck, label: t('home.stats.documentation'), desc: t('home.stats.documentationDesc') },
    { icon: Zap, label: t('home.stats.free'), desc: t('home.stats.freeDesc') },
  ]

  const pasos = [
    { n: '01', icon: Camera, title: t('home.how.step1Title'), desc: t('home.how.step1Desc') },
    { n: '02', icon: MessageCircle, title: t('home.how.step2Title'), desc: t('home.how.step2Desc') },
    { n: '03', icon: BadgeCheck, title: t('home.how.step3Title'), desc: t('home.how.step3Desc') },
  ]

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      )}

      {/* ═══════════ HERO — claim a la izquierda, buscador-panel a la derecha ═══════════ */}
      <section className="relative bg-brand-darkNav text-white overflow-hidden">
        <Image
          src="/hero.jpg"
          alt={t('home.hero.heroImageAlt')}
          fill
          priority
          quality={80}
          fetchPriority="high"
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-darkNav via-brand-darkNav/92 to-brand-darkNav/60" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-darkNav via-transparent to-brand-darkNav/60" aria-hidden="true" />
        {/* halo de señal */}
        <div className="absolute -top-40 right-[-10%] w-[560px] h-[560px] rounded-full bg-brand-signal/10 blur-3xl" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-4 py-14 md:py-24">
          <div className="grid lg:grid-cols-[1.05fr,0.95fr] gap-10 lg:gap-14 items-center">
            {/* ── Columna izquierda: promesa + CTA + beneficios ── */}
            <div>
              <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-brand-signal/40 rounded-full pl-2 pr-4 py-1.5 text-xs font-semibold mb-6">
                <span className="w-2 h-2 rounded-full bg-brand-signal animate-pulse" aria-hidden="true" />
                {t('home.hero.chip')}
              </span>
              <h1 className="text-[2.6rem] leading-[1.03] sm:text-6xl xl:text-7xl font-black tracking-tighter max-w-3xl">
                {t('home.hero.title1')}{' '}
                <span className="text-brand-signal">{t('home.hero.title2')}</span>
              </h1>
              <p className="mt-5 text-lg text-gray-300 max-w-xl leading-relaxed">{t('home.hero.subtitle')}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  t('home.hero.audiencePrivate'),
                  t('home.hero.audienceWorkshops'),
                  t('home.hero.audiencePro'),
                  t('home.hero.audienceBuyers'),
                ].map(a => (
                  <span
                    key={a}
                    className="text-xs font-bold bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-3.5 py-1.5"
                  >
                    {a}
                  </span>
                ))}
              </div>

              {/* CTAs: primario de señal, secundario fantasma — uno manda */}
              <div className="mt-7 flex flex-wrap gap-3">
                <LocalLink
                  href="/catalogo"
                  className="btn-signal inline-flex items-center gap-2 px-7 py-3.5 text-base"
                >
                  <Search size={18} /> {t('home.hero.findMachinery')}
                </LocalLink>
                <LocalLink
                  href="/publicar"
                  className="inline-flex items-center gap-2 border border-white/30 hover:border-brand-signal hover:text-brand-signal backdrop-blur-sm font-bold px-6 py-3.5 rounded-xl transition"
                >
                  📢 {t('home.hero.sellFree')}
                </LocalLink>
              </div>

              {/* Benefit bar (patrón ganador: 4 señales de confianza arriba del fold) */}
              <div className="mt-9 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-white/10 pt-6">
                {beneficios.map(b => (
                  <div key={b.label} className="flex items-start gap-2.5">
                    <span className="shrink-0 w-9 h-9 rounded-lg bg-brand-signal/15 border border-brand-signal/40 flex items-center justify-center">
                      <b.icon size={17} className="text-brand-signal" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-black leading-tight text-white">{b.label}</p>
                      <p className="text-[11px] text-gray-400 leading-tight mt-0.5 line-clamp-2">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Columna derecha: el buscador como objeto protagonista ── */}
            <div className="lg:pl-2">
              <form
                action="/catalogo"
                method="GET"
                className="bg-white rounded-3xl p-5 sm:p-6 shadow-panel text-gray-800 border border-white/20"
              >
                <p className="kicker mb-4">{t('home.hero.filterType')}</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 focus-within:ring-2 focus-within:ring-brand-signal">
                    <Search size={18} className="text-gray-400 shrink-0" />
                    <input
                      type="text"
                      name="q"
                      placeholder={t('home.hero.searchPlaceholder')}
                      className="w-full py-3 text-sm bg-transparent focus:outline-none"
                      aria-label={t('home.hero.searchPlaceholder')}
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <select
                      name="subcategoria"
                      className="w-full px-4 py-3 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-signal font-medium"
                      aria-label={t('home.hero.filterType')}
                    >
                      <option value="">{t('home.hero.allTypes')}</option>
                      {FAMILIAS.map(f => (
                        <optgroup key={f.key} label={`${f.icon} ${t(`familias.${f.key}.label`)}`}>
                          {f.subs.map(slug => {
                            const s = subs.find(x => x.slug === slug)
                            if (!s) return null
                            return <option key={s.slug} value={s.label}>{s.icon} {s.label}</option>
                          })}
                        </optgroup>
                      ))}
                    </select>
                    <select
                      name="ciudad"
                      className="w-full px-4 py-3 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-signal font-medium"
                      aria-label={t('home.hero.filterProvince')}
                    >
                      <option value="">{t('home.hero.allProvinces')}</option>
                      {provincias.map(p => (
                        <option key={p.slug} value={p.nombre}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input
                      type="number"
                      name="precioMin"
                      min="0"
                      placeholder={t('home.hero.priceMin')}
                      className="w-full px-4 py-3 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-signal"
                      aria-label={t('home.hero.priceMin')}
                    />
                    <input
                      type="number"
                      name="precioMax"
                      min="0"
                      placeholder={t('home.hero.priceMax')}
                      className="w-full px-4 py-3 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-signal"
                      aria-label={t('home.hero.priceMax')}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-brand-darkNav hover:bg-brand-primary text-brand-signal font-black px-6 py-3.5 rounded-xl transition flex items-center justify-center gap-2 text-base"
                  >
                    <Search size={18} /> {t('home.hero.searchButton')}
                  </button>
                </div>

                {/* Accesos rápidos por tipo */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {subs.map(s => (
                    <LocalLink
                      key={s.slug}
                      href={`/catalogo?subcategoria=${encodeURIComponent(s.label)}`}
                      className="text-xs font-bold bg-gray-100 hover:bg-brand-signal hover:text-brand-darkNav border border-gray-200 rounded-full px-3 py-1.5 transition"
                    >
                      {s.icon} {s.label}
                    </LocalLink>
                  ))}
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ EXPLORA POR FAMILIA — mosaico con foto (inmediatamente bajo el fold) ═══════════ */}
      <div className="max-w-7xl mx-auto px-4">
        <section className="py-12">
          <SectionHeader
            title={t('home.categories.title')}
            subtitle={t('home.categories.subtitle')}
            href="/marcas"
            viewAll={t('home.categories.viewAll')}
            kicker={t('home.kicker.buy')}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {FAMILIAS.map(f => {
              const Icono = ICONO_FILIA[f.key] || Wrench
              return (
                <LocalLink
                  key={f.key}
                  href={`/catalogo?categoria=${f.key}`}
                  className="group relative rounded-3xl overflow-hidden h-72 md:h-80 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1.5 block border border-brand-darkNav/10"
                >
                  <Image
                    src={FOTO_FAMILIA[f.key] || '/placeholder-product.webp'}
                    alt={t(`familias.${f.key}.label`)}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-darkNav via-brand-darkNav/70 to-brand-darkNav/10" aria-hidden="true" />
                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <span className="w-11 h-11 rounded-xl bg-brand-signal text-brand-darkNav flex items-center justify-center mb-3 shadow-signal-glow">
                      <Icono size={22} strokeWidth={2.4} />
                    </span>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-2xl font-black text-white tracking-tight">{t(`familias.${f.key}.label`)}</h3>
                      {conteoPorFamilia[f.key] != null && conteoPorFamilia[f.key]! > 0 && (
                        <span className="text-[11px] font-black text-brand-signal bg-brand-darkNav/70 border border-brand-signal/40 rounded-full px-2.5 py-0.5 tabular-nums">
                          {t('home.categories.countLabel', { count: nf.format(conteoPorFamilia[f.key]!) })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300 mt-1.5 line-clamp-2 leading-snug">{t(`familias.${f.key}.desc`)}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5 max-h-[54px] overflow-hidden">
                      {f.subs.slice(0, 4).map(slug => {
                        const s = subs.find(x => x.slug === slug)
                        if (!s) return null
                        return (
                          <span
                            key={s.slug}
                            title={resumenFabricantes(s.marcas, 4)}
                            className="text-[11px] font-bold bg-white/12 border border-white/20 text-white rounded-full px-2.5 py-1"
                          >
                            {s.icon} {s.label}
                          </span>
                        )
                      })}
                    </div>
                    <span className="absolute top-5 right-5 w-10 h-10 rounded-full bg-brand-signal text-brand-darkNav flex items-center justify-center translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <ArrowRight size={18} strokeWidth={2.6} />
                    </span>
                  </div>
                </LocalLink>
              )
            })}
          </div>
        </section>

        {/* ═══════════ RECIENTES ═══════════ */}
        <section className="pb-12">
          <SectionHeader
            title={t('home.recent.title')}
            subtitle={t('home.recent.subtitle')}
            href="/catalogo"
            viewAll={t('home.recent.viewAll')}
            kicker={t('home.kicker.new')}
          />
          <SectionGrid items={recientes} t={t} />
        </section>

        {/* ═══════════ PRECIOS REDUCIDOS — transparencia (historial público) ═══════════ */}
        {reducidos.length > 0 && (
          <section className="pb-12">
            <SectionHeader
              title={t('home.reduced.title')}
              subtitle={t('home.reduced.subtitle')}
              href="/catalogo"
              viewAll={t('home.viewAll')}
              kicker={t('home.kicker.reduced')}
            />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {reducidos.map(r => (
                <ProductCard
                  key={r.p.id}
                  p={r.p}
                  t={t}
                  precioAnterior={r.precioAnterior}
                  descuento={r.descuento}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ═══════════ BANDA DE CONFIANZA — oscura con iconos de señal ═══════════ */}
      <section className="band-dark border-y-4 border-brand-signal">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
          {[
            {
              icon: ShieldCheck,
              label: conteos && conteos.vendedores > 0
                ? t('home.stats.verifiedCount', { count: nf.format(conteos.vendedores) })
                : t('home.stats.verified'),
              desc: t('home.stats.verifiedDesc'),
            },
            {
              icon: Package,
              label: conteos && conteos.anuncios > 0
                ? t('home.stats.listings', { count: nf.format(conteos.anuncios) })
                : t('home.recent.title'),
              desc: t('home.recent.subtitle'),
            },
            { icon: MapPin, label: t('home.stats.allSpain'), desc: t('home.stats.allSpainDesc') },
            { icon: FileCheck, label: t('home.stats.documentation'), desc: t('home.stats.documentationDesc') },
            { icon: Zap, label: t('home.stats.free'), desc: t('home.stats.freeDesc') },
            { icon: Gauge, label: t('home.stats.range'), desc: t('home.stats.rangeDesc') },
          ].map(s => (
            <div key={s.label} className="text-center md:text-left">
              <span className="inline-flex w-11 h-11 rounded-xl bg-brand-signal/15 border border-brand-signal/40 items-center justify-center mb-3">
                <s.icon size={20} className="text-brand-signal" />
              </span>
              <p className="font-black text-white text-sm leading-tight">{s.label}</p>
              <p className="text-xs text-gray-400 mt-1 leading-snug">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4">
        {/* ═══════════ VENDEDORES DESTACADOS — prueba social temprana ═══════════ */}
        {destacados.length > 0 && (
          <section className="pt-12">
            <SectionHeader
              title={t('home.sellers.title')}
              subtitle={t('home.sellers.subtitle')}
              href="/catalogo"
              viewAll={t('home.viewAll')}
              kicker={t('home.sellers.kicker')}
            />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {destacados.map(d => (
                <LocalLink
                  key={d.id}
                  href={`/vendedor/${d.id}`}
                  className="group bg-white rounded-2xl border border-gray-200/80 shadow-card p-4 flex flex-col items-center text-center hover:shadow-card-hover hover:-translate-y-1 hover:border-brand-signal transition-all duration-200"
                >
                  <Avatar nombre={d.nombre} fotoUrl={d.foto_perfil_url || null} size="md" />
                  <p className="text-sm font-black text-gray-900 mt-2.5 line-clamp-1 group-hover:text-brand-darkNav">{d.nombre}</p>
                  <span className="mt-1">{d.tipo_vendedor ? <BadgeTipoVendedor tipo={d.tipo_vendedor} /> : null}</span>
                  <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    <CheckCircle2 size={10} /> {t('productCard.verified')}
                  </span>
                  <span className="mt-2 text-[11px] font-black text-brand-darkNav bg-brand-signal/20 border border-brand-signal/50 rounded-full px-2.5 py-0.5 tabular-nums">
                    {t('home.sellers.count', { count: d.anuncios })}
                  </span>
                </LocalLink>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════ FAMILIAS: PRODUCTOS POR CATEGORÍA ═══════════ */}
        {FAMILIAS.map(f => (
          <section key={f.key} className="py-12">
            <SectionHeader
              title={t(`familias.${f.key}.label`)}
              subtitle={t(`familias.${f.key}.desc`)}
              href={`/catalogo?categoria=${f.key}`}
              viewAll={t('home.viewAll')}
              kicker={t('home.kicker.market')}
            />
            <SectionGrid items={itemsPorFamilia[f.key] || []} t={t} />
          </section>
        ))}

        {/* ═══════════ VENDE EN 3 PASOS (cómo funciona) ═══════════ */}
        <section className="pb-12">
          <SectionHeader
            title={t('home.how.title')}
            subtitle={t('home.how.subtitle')}
            href="/como-funciona"
            viewAll={t('home.how.moreInfo')}
            kicker={t('home.how.eyebrow')}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {pasos.map(p => (
              <div
                key={p.n}
                className="bg-white rounded-2xl border border-gray-200/80 shadow-card p-6 relative overflow-hidden group hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200"
              >
                <span className="absolute -top-3 -right-2 text-7xl font-black text-brand-signal/15 select-none group-hover:text-brand-signal/30 transition" aria-hidden="true">
                  {p.n}
                </span>
                <span className="w-12 h-12 rounded-xl bg-brand-darkNav text-brand-signal flex items-center justify-center mb-4">
                  <p.icon size={22} />
                </span>
                <h3 className="font-black text-lg text-brand-darkNav">{p.title}</h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <LocalLink href="/publicar" className="btn-signal inline-flex items-center gap-2 px-6 py-3">
              ⚡ {t('home.how.cta')}
            </LocalLink>
          </div>
        </section>

        {/* ═══════════ ¿QUIÉN VENDE AQUÍ? ═══════════ */}
        <section className="pb-12">
          <SectionHeader
            title={t('home.audiences.title')}
            subtitle={t('home.audiences.subtitle')}
            href="/publicar"
            viewAll={t('home.audiences.viewAll')}
            kicker={t('home.kicker.sell')}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {[
              { icon: '👤', key: 'private', vendedor: 'particular', plural: 'particulares' },
              { icon: '🔧', key: 'workshop', vendedor: 'taller', plural: 'talleres' },
              { icon: '🏢', key: 'pro', vendedor: 'profesional', plural: 'profesionales' },
            ].map(a => (
              <div
                key={a.key}
                className="group bg-white rounded-2xl border border-gray-200/80 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 p-6 flex flex-col"
              >
                <span className="w-12 h-12 rounded-xl bg-brand-signal/15 border border-brand-signal/40 flex items-center justify-center text-2xl mb-4" aria-hidden="true">
                  {a.icon}
                </span>
                <h3 className="font-black text-gray-900 text-lg">{t(`home.audiences.${a.key}.title`)}</h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed flex-1">
                  {t(`home.audiences.${a.key}.desc`)}
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <LocalLink
                    href="/publicar"
                    className="inline-flex items-center justify-center gap-1.5 text-sm font-black text-brand-darkNav bg-brand-signal hover:bg-brand-signal-dark px-4 py-2.5 rounded-xl transition"
                  >
                    {t('home.audiences.cta')} <ArrowRight size={14} />
                  </LocalLink>
                  <LocalLink
                    href={`/catalogo?vendedor=${a.vendedor}`}
                    className="inline-flex items-center justify-center gap-1 text-sm font-bold text-gray-600 hover:text-brand-darkNav border border-gray-200 hover:border-brand-darkNav px-4 py-2.5 rounded-xl transition"
                  >
                    {t('home.audiences.buyCta', { tipo: t(`tiposVendedor.${a.plural}`) })}
                  </LocalLink>
                  {a.key !== 'private' && (
                    <LocalLink
                      href="/para-profesionales"
                      className="inline-flex items-center justify-center gap-1 text-sm font-bold text-brand-darkNav hover:underline transition"
                    >
                      {t('home.audiences.plansCta')} <ArrowRight size={13} />
                    </LocalLink>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════ GUÍAS (enlazado al blog = frescor + long-tail) ═══════════ */}
        {guias.length > 0 && (
          <section className="pb-12">
            <SectionHeader
              title={t('home.guides.title')}
              subtitle={t('home.guides.subtitle')}
              href="/blog"
              viewAll={t('home.guides.viewAll')}
              kicker={t('home.kicker.learn')}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
              {guias.map(g => (
                <LocalLink
                  key={g.slug}
                  href={`/blog/${g.slug}`}
                  className="group bg-white rounded-2xl border border-gray-200/80 border-t-4 border-t-brand-signal shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 p-6 flex flex-col"
                >
                  <p className="text-xs font-black uppercase tracking-widest text-brand-signal-dark mb-2">{g.readTime}</p>
                  <h3 className="font-black text-gray-900 text-lg group-hover:text-brand-darkNav transition-colors leading-snug">{g.title}</h3>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-3 flex-1">{g.excerpt}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-black text-brand-darkNav">
                    {t('home.guides.readMore')} <ArrowRight size={14} />
                  </span>
                </LocalLink>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════ PROVINCIAS POPULARES ═══════════ */}
        <section className="pb-12">
          <SectionHeader
            title={t('home.provinces.title')}
            subtitle={t('home.provinces.subtitle')}
            href="/catalogo"
            viewAll={t('home.viewAll')}
            kicker={t('home.kicker.near')}
          />
          <div className="flex flex-wrap gap-2.5">
            {provincias.map(p => (
              <LocalLink
                key={p.slug}
                href={`/${p.slug}`}
                className="group flex items-center gap-1.5 bg-white border border-gray-200 hover:border-brand-darkNav hover:bg-brand-signal rounded-full px-4 py-2.5 text-sm font-bold text-gray-700 hover:text-brand-darkNav transition"
              >
                <MapPin size={14} className="text-brand-signal-dark group-hover:text-brand-darkNav" />
                {t('home.provinces.link', { province: p.nombre })}
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition" />
              </LocalLink>
            ))}
          </div>
        </section>

        {/* ═══════════ TESTIMONIOS — reseñas reales con producto enlazado ═══════════ */}
        {testimonios.length > 0 && (
          <section className="pb-12">
            <SectionHeader
              title={t('home.testimonials.title')}
              subtitle={t('home.testimonials.subtitle')}
              href="/catalogo"
              viewAll={t('home.viewAll')}
              kicker={t('home.testimonials.kicker')}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
              {testimonios.map(r => (
                <figure key={r.id} className="bg-white rounded-2xl border border-gray-200/80 border-t-4 border-t-brand-signal shadow-card p-5 flex flex-col">
                  <div className="flex gap-0.5" aria-label={`${r.puntuacion}/5`}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} size={15} className={i <= r.puntuacion ? 'fill-brand-signal text-brand-signal' : 'text-gray-300'} />
                    ))}
                  </div>
                  <blockquote className="text-sm text-gray-700 leading-relaxed mt-3 line-clamp-4 flex-1">
                    «{r.comentario}»
                  </blockquote>
                  <figcaption className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                    <span className="font-black text-gray-900">{r.comprador_nombre || t('home.testimonials.buyer')}</span>
                    {r.producto?.titulo && (
                      <>
                        {' · '}
                        {r.producto.slug ? (
                          <LocalLink href={`/producto/${r.producto.slug}`} className="text-brand-darkNav font-bold underline decoration-brand-signal decoration-2 underline-offset-2 hover:text-brand-signal-dark">
                            {r.producto.titulo}
                          </LocalLink>
                        ) : (
                          <span className="font-semibold">{r.producto.titulo}</span>
                        )}
                      </>
                    )}
                    <span className="block mt-1 text-gray-400">
                      {new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(r.creado_en))}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ═══════════ CTA — banda de señal a sangre (letrero industrial) ═══════════ */}
      <section className="band-signal">
        <div className="max-w-7xl mx-auto px-4 py-14 md:py-20 relative overflow-hidden">
          <div className="absolute -right-20 -top-24 w-72 h-72 rounded-full bg-brand-darkNav/10 blur-3xl" aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 w-1.5 bg-brand-darkNav/80" aria-hidden="true" />
          <div className="max-w-3xl relative">
            <p className="kicker mb-4">{t('home.cta.note')}</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-brand-darkNav leading-[1.05]">
              {t('home.cta.title')}
            </h2>
            <p className="mt-4 text-brand-darkNav/80 text-lg max-w-2xl">{t('home.cta.subtitle')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LocalLink href="/publicar" className="btn-dark inline-flex items-center gap-2 px-8 py-4 text-base">
                📢 {t('home.cta.publishNow')}
              </LocalLink>
              <LocalLink
                href="/catalogo"
                className="inline-flex items-center gap-2 border-2 border-brand-darkNav text-brand-darkNav font-black px-8 py-4 rounded-xl hover:bg-brand-darkNav hover:text-brand-signal transition"
              >
                {t('home.cta.explore')} <ArrowRight size={18} />
              </LocalLink>
            </div>
            <div className="mt-5">
              <LocalLink
                href="/tasador"
                className="inline-flex items-center gap-1.5 text-sm font-black text-brand-darkNav underline decoration-brand-darkNav/40 decoration-2 underline-offset-4 hover:decoration-brand-darkNav transition"
              >
                {t('home.cta.estimator')}
              </LocalLink>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
