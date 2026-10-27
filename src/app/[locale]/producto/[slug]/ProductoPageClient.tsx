'use client'

import { Component, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import LocalLink from '@/components/LocalLink'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { MapPin, Tag, MessageCircle, Phone, Mail, Shield, Clock, Heart, Share2, CheckCircle2, CalendarClock, GitCompare, Check, Play, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { embedDeVideo } from '@/lib/video-embed'
import {veredictoPrecio, parseNumeroEspec, type Veredicto } from '@/lib/tasador'
import { useComparar } from '@/lib/comparar'
import Avatar from '@/components/Avatar'
import ReportarButton from '@/components/ReportarButton'
import BadgeVerificado from '@/components/BadgeVerificado'
import BadgeTipoVendedor from '@/components/BadgeTipoVendedor'
import BotonReservar, { AvisoReservado } from '@/components/ReservaProducto'
import ImageGallery from '@/components/ImageGallery'
import SellerReputation from '@/components/SellerReputation'
import { resolveContactMethods } from '@/lib/contact-methods'
import { enlaceWhatsApp } from '@/lib/telefono'
import { agruparFichaTecnica, camposFichaExtras } from '@/lib/categorias'
import { formatPrecio } from '@/lib/precio'
import { useTranslations } from 'next-intl'

// Error boundary to catch render errors
class ProductErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean}> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error: Error) { console.error('ProductPage error:', error) }
  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Algo salió mal</h1>
          <p className="text-gray-500 mb-6">Error al cargar el producto. Intenta recargar la página.</p>
          <LocalLink href="/" className="inline-block bg-brand-primary text-white px-8 py-3 rounded-lg font-bold">Volver al inicio</LocalLink>
        </div>
      )
    }
    return this.props.children
  }
}

export interface EstadoReserva {
  reservado: boolean
  reservado_hasta?: string | null
  reserva_propia_estado?: string | null
}

interface ProductoPageClientProps {
  initialProduct: any
  favoritosCount?: number
  reserva?: EstadoReserva | null
  /**
   * Anuncio sembrado por la plataforma (columna `es_demo`). No se marca en la
   * interfaz —la ficha debe leerse como cualquier otra— pero mantiene dos
   * límites que no dependen del aspecto: no se ofrecen contactos inventados y
   * no se habilita el pago con señal sobre una máquina
   * que no existe. Las consultas de estos anuncios llegan al equipo.
   */
  esDemo?: boolean
}

function ProductoPageClientInner({
  initialProduct,
  favoritosCount = 0,
  reserva = null,
  esDemo = false }: ProductoPageClientProps) {
  const [reservaEstado, setReservaEstado] = useState<string | null>(reserva?.reserva_propia_estado || null)
  const t = useTranslations('productDetail')
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  // URL canónica para el redirect post-login: slug si existe, UUID si no
  const slug = initialProduct?.slug || initialProduct?.id || ''
  const esNuevaPublicacion = searchParams.get('nuevo') === '1'

  // Auto-remove ?nuevo=1 from URL after showing banner
  useEffect(() => {
    if (esNuevaPublicacion && window.location.search.includes('nuevo=1')) {
      if (window.history.replaceState) {
        setTimeout(() => {
          window.history.replaceState({}, '', window.location.pathname)
        }, 5000)
      }
    }
  }, [esNuevaPublicacion])

  const [producto] = useState(initialProduct)
  const [vendedor, setVendedor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [totalResenas, setTotalResenas] = useState(0)
  const [esFavorito, setEsFavorito] = useState(false)
  const { lista, alternar } = useComparar()
  // Veredicto «precio justo» contra los comparables reales del portal
  // (§5A del roadmap). Sin precio, sin datos o en anuncios demo → nada.
  const [precioJusto, setPrecioJusto] = useState<Veredicto>(null)
  const [precioJustoComparables, setPrecioJustoComparables] = useState(0)

  // Pide el rango al estimador (misma API que /tasador) con los datos de la
  // ficha: subtipo, marca y año/horas del JSONB. Se omite en demos (precios
  // de siembra) y cuando hay menos de 3 comparables (nada que comparar).
  useEffect(() => {
    const precio = Number(producto?.precio_usd || 0)
    if (!precio || esDemo) return
    let cancelado = false
    ;(async () => {
      try {
        const esp = producto.especificaciones || {}
        const res = await fetch('/api/tasador', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subcategoria: producto.subcategoria || undefined,
            marca: producto.marca || undefined,
            anio: parseNumeroEspec(esp['Año'] ?? esp['Ano']) ?? undefined,
            horas: parseNumeroEspec(esp['Horas de uso'] ?? esp['Horas'] ?? esp['Horas de uso (h)']) ?? undefined,
            tuPrecio: precio }) })
        const data = await res.json().catch(() => null)
        if (cancelado || !data?.ok || !data.rango || (data.rango.n ?? 0) < 3) return
        const v = veredictoPrecio(precio, data.rango)
        if (v) {
          setPrecioJusto(v)
          setPrecioJustoComparables(data.rango.n)
        }
      } catch {
        // silencio: el indicador es opcional
      }
    })()
    return () => { cancelado = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [producto?.id])
  const [toggleandoFav, setToggleandoFav] = useState(false)
  const [vendedorStats, setVendedorStats] = useState<any>(null)
  const [historial, setHistorial] = useState<any[]>([])
  const [copiado, setCopiado] = useState(false)
  // Invitados: en vez de redirigir a login de golpe, se explica el paso y
  // se ofrece la alternativa inmediata (WhatsApp) — el muro mata compradores.
  const [pedirCuenta, setPedirCuenta] = useState(false)

  useEffect(() => {
    if (!producto) return
    async function loadAll() {
      // Single RPC call: consolidates 6 queries into 1 round-trip
      const { data: detalle, error } = await supabase.rpc('obtener_detalle_producto', {
        p_producto_id: producto.id,
        p_user_id: user?.id || null })

      if (!error && detalle) {
        if (detalle.vendedor) setVendedor(detalle.vendedor)
        if (detalle.stats) {
          const anti = producto.user_id
            ? Math.floor((Date.now() - new Date(producto.creado_en).getTime()) / (1000 * 60 * 60 * 24))
            : 0
          setVendedorStats({ ...detalle.stats, antiguedad: anti })
        }
        if (detalle.totalResenas != null) setTotalResenas(detalle.totalResenas)
        if (detalle.esFavorito != null) setEsFavorito(detalle.esFavorito)
        if (detalle.historial) setHistorial(detalle.historial)
      }

      // Fire and forget: el RPC incrementa solo visitas de forma atómica.
      // No se usa UPDATE directo porque los visitantes no son dueños del
      // producto y no deben poder modificar otras columnas.
      supabase.rpc('incrementar_visitas', { p_producto_id: producto.id }).then()

      setLoading(false)
    }
    loadAll()
  }, [producto, user])

  const handleContacto = () => {
    if (authLoading) return
    if (!user) { setPedirCuenta(true); return }
    router.push(`/chat?producto_id=${producto.id}&vendedor_id=${producto.user_id}`)
  }

  // Compartir (momento pico: banner de "publicado con éxito")
  const anuncioUrl = () => (typeof window !== 'undefined' ? window.location.href : '')

  const handleShareWhatsapp = () => {
    const texto = `${producto.titulo} — ${anuncioUrl()}`
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer')
  }

  const handleCopiarEnlace = async () => {
    try {
      await navigator.clipboard.writeText(anuncioUrl())
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      // clipboard no disponible (http, permiso denegado) — silencioso
    }
  }

  const toggleFavorito = async () => {
    if (authLoading) return
    if (!user) { router.push(`/login?redirect=/producto/${slug}`); return }
    if (toggleandoFav) return
    setToggleandoFav(true)
    try {
      const res = await fetch('/api/favorito/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
        body: JSON.stringify({
          productId: producto.id,
          isFavorited: esFavorito, // true = remove, false = add
          productoTitle: producto.titulo }) })
      const data = await res.json()
      if (data.action === 'removed') setEsFavorito(false)
      else if (data.action === 'added') setEsFavorito(true)
    } catch (e) {
      // Fallback to direct supabase if API fails
      if (esFavorito) {
        await supabase.from('favoritos').delete().eq('user_id', user.id).eq('producto_id', producto.id)
        setEsFavorito(false)
      } else {
        await supabase.from('favoritos').insert({ user_id: user.id, producto_id: producto.id })
        setEsFavorito(true)
      }
    }
    setToggleandoFav(false)
  }

  if (loading) return (
    <div className="shell animate-pulse space-y-5 py-10">
      <div className="skeleton h-3 w-48" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-8">
          <div className="skeleton aspect-[4/3] w-full rounded-none" />
          <div className="skeleton h-8 w-3/4" />
          <div className="skeleton h-32 w-full" />
        </div>
        <div className="skeleton h-96 lg:col-span-4" />
      </div>
    </div>
  )

  if (!producto) return (
    <div className="shell py-24 text-center">
      <h1 className="t-display t-display-md text-ink">{t('notFound')}</h1>
      <LocalLink href="/" className="btn btn-ink mt-8">{t('backHome')}</LocalLink>
    </div>
  )



  // En un anuncio sembrado solo se ofrece chat con la plataforma: los teléfonos
  // de la semilla son inventados y, en España, un número inventado puede ser el
  // de una persona real. Por eso nunca se muestran, aunque la ficha no lleve
  // ninguna etiqueta que la distinga.
  const contactos = esDemo
    ? { hasProductConfiguration: true, phone: '', whatsapp: '', email: '', messengerUrl: '' }
    : resolveContactMethods(producto.metodos_contacto, vendedor?.telefono || '')
  const contactPhone = contactos.phone
  // WhatsApp y teléfono pueden ser números distintos. No usar el teléfono
  // como preferencia cuando el anunciante configuró expresamente WhatsApp.
  const whatsappPhone = contactos.whatsapp || (!contactos.hasProductConfiguration ? contactPhone : '')
  const metodos = {
    chat: true,
    // Publicaciones antiguas sin contacto específico conservan el fallback
    // telefónico visible del perfil. Las nuevas solo muestran lo configurado.
    whatsapp: Boolean(whatsappPhone),
    telefono: contactos.hasProductConfiguration ? Boolean(contactos.phone) : false,
    email: Boolean(contactos.email),
    messenger: Boolean(contactos.messengerUrl) }
  const imagenes = producto.imagenes && producto.imagenes.length > 0 ? producto.imagenes : producto.imagen_url ? [producto.imagen_url] : []
  const videoEmbed = embedDeVideo(producto.video_url)
  // Enlace construido con el helper compartido: antes anteponía el prefijo de
  // Venezuela ('58') y todos los móviles españoles quedaban en un número
  // inexistente, así que el botón de WhatsApp no funcionaba.
  const whatsappLink = enlaceWhatsApp(whatsappPhone, t('whatsappMsg', { title: producto.titulo }))

  return (
    <div className="shell py-8 md:py-10">
      {producto.vendido && (
        <div className="mb-7 flex items-start gap-3 border border-line bg-paper-2/70 p-5">
          <CheckCircle2 size={18} strokeWidth={1.8} className="mt-0.5 shrink-0 text-ink/60" />
          <div>
            <p className="text-[15px] font-semibold text-ink">{t('soldBannerTitle')}</p>
            <p className="mt-1 text-[13.5px] text-muted">{t('soldBannerDesc')}</p>
          </div>
        </div>
      )}
      {esNuevaPublicacion && (
        <div className="mb-7 border border-moss/25 bg-moss-soft p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center bg-moss text-paper">
              <Check size={15} strokeWidth={2.6} />
            </span>
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold text-moss">{t('successTitle')}</h3>
              <p className="mt-1 text-[13.5px] text-moss/80">{t('successDesc')}</p>
              <p className="t-label mt-2 text-moss/70">{t('successFree')}</p>
              {/* Pico de dopamina del vendedor: compartir = tráfico gratis de SU red */}
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleShareWhatsapp}
                  className="inline-flex items-center gap-1.5 bg-[#25D366] text-white text-xs font-bold px-3 py-2 rounded-lg hover:brightness-95 transition"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  {t('shareWhatsapp')}
                </button>
                <button
                  type="button"
                  onClick={handleCopiarEnlace}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border transition ${
                    copiado
                      ? 'bg-green-100 border-green-400 text-green-800'
                      : 'bg-white border-green-300 text-green-800 hover:bg-green-50'
                  }`}
                >
                  <Share2 size={14} />
                  {copiado ? t('copied') : t('copyLink')}
                </button>
              </div>
              {/* Momento de máxima intención: acaba de publicar y ve su anuncio.
                  Aquí sí tiene sentido ofrecer visibilidad, no antes. */}
              <div className="mt-3 flex flex-wrap gap-2">
                <LocalLink
                  href="/dashboard?tab=productos"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-200"
                >
                  ⭐ {t('successBoostCta')}
                </LocalLink>
                <LocalLink
                  href="/para-profesionales"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-white px-3 py-2 text-xs font-bold text-green-800 hover:bg-green-50"
                >
                  {t('successPlansCta')}
                </LocalLink>
              </div>
            </div>
          </div>
        </div>
      )}
      <nav className="t-eyebrow mb-7 flex items-center gap-2 overflow-x-auto text-ink/40 hide-scrollbar" aria-label="Breadcrumb">
        <LocalLink href="/" className="flex-shrink-0 transition-colors hover:text-ink">{t('breadcrumbHome')}</LocalLink>
        <span aria-hidden="true" className="flex-shrink-0 text-ink/25">/</span>
        <LocalLink href="/catalogo" className="flex-shrink-0 transition-colors hover:text-ink">{t('breadcrumbCatalog')}</LocalLink>
        {producto.subcategoria && (
          <>
            <span aria-hidden="true" className="flex-shrink-0 text-ink/25">/</span>
            <span className="flex-shrink-0 capitalize">{producto.subcategoria}</span>
          </>
        )}
        <span aria-hidden="true" className="flex-shrink-0 text-ink/25">/</span>
        <span className="flex-shrink-0 truncate text-ink">{producto.titulo}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="space-y-8 lg:col-span-8">
          {imagenes.length > 0 ? (
            <div className="border border-line bg-[#FBFAF5]"><ImageGallery images={imagenes} alt={producto.titulo} /></div>
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center border border-line bg-paper-2">
              <Tag size={42} strokeWidth={1.2} className="text-ink/25" />
            </div>
          )}
          {videoEmbed && (
            <div className="border border-line bg-[#FBFAF5]">
              <div className="border-b border-line px-5 py-3">
                <h2 className="t-label flex items-center gap-2 text-ink/60">
                  <Play size={11} aria-hidden="true" /> {t('product.video')}
                </h2>
              </div>
              {videoEmbed.tipo === 'iframe' ? (
                <div className="aspect-video mt-3">
                  <iframe
                    src={videoEmbed.src}
                    title={t('product.video')}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="p-4">
                  <a
                    href={videoEmbed.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-black text-brand-darkNav bg-brand-signal hover:bg-brand-signal-dark rounded-full px-4 py-2 transition"
                  >
                    <ExternalLink size={14} /> {t('product.video')}
                  </a>
                </div>
              )}
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="t-label border border-ink px-2 py-1 text-ink">{producto.estado}</span>
              {producto.marca && <span className="t-label text-ink/55">{producto.marca}</span>}
              {producto.subcategoria && (
                <span className="t-label text-ink/55">· {producto.subcategoria}</span>
              )}
              {(reserva?.reservado || reservaEstado === 'activa') && (
                <span className="t-label inline-flex items-center gap-1.5 bg-signal px-2 py-1 text-ink">
                  <CalendarClock size={10} aria-hidden="true" /> {t('reservadoBadge')}
                </span>
              )}
            </div>
            <h1 className="t-display t-display-md mt-4 text-ink">{producto.titulo}</h1>
            {producto.descripcion && (
              <p className="mt-5 max-w-2xl whitespace-pre-line text-[15px] leading-[1.7] text-ink/75">
                {producto.descripcion}
              </p>
            )}

            {/* Ficha técnica en cuatro bloques (técnica / estado /
                documentación / logística); las claves legadas de los anuncios
                demo antiguos se agrupan en "Ficha técnica". El estado viene de
                la columna `productos.estado`, no del JSONB. */}
            {(() => {
              const grupos = agruparFichaTecnica({
                ...producto.especificaciones,
                Estado: producto.estado })
              const extras = camposFichaExtras(producto.especificaciones)
              if (grupos.length === 0 && extras.length === 0) return null
              return (
                <div className="mt-10">
                  <h2 className="t-eyebrow border-b border-ink pb-3 text-ink">{t('specsTitle')}</h2>
                  <div className="mt-6 grid grid-cols-1 gap-x-12 gap-y-8 sm:grid-cols-2">
                    {grupos.map((grupo) => (
                      <div key={grupo.titulo}>
                        <h3 className="t-label mb-2 flex items-center gap-2 text-ink/45">
                          <span aria-hidden="true">{grupo.icon}</span> {grupo.titulo}
                        </h3>
                        <dl>
                          {grupo.filas.map(([k, v]) => (
                            <div key={k} className="spec-row">
                              <dt className="shrink-0 text-[13px] text-ink/60">{k}</dt>
                              <span className="spec-lead" aria-hidden="true" />
                              <dd className="text-right text-[13.5px] font-medium text-ink">{String(v)}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    ))}
                    {extras.length > 0 && (
                      <div>
                        <h3 className="t-label mb-2 text-ink/45">{t('specsTitle')}</h3>
                        <dl>
                          {extras.map(([k, v]) => (
                            <div key={k} className="spec-row">
                              <dt className="shrink-0 text-[13px] text-ink/60">{k}</dt>
                              <span className="spec-lead" aria-hidden="true" />
                              <dd className="text-right text-[13.5px] font-medium text-ink">{String(v)}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>
          <div className="border-t border-line pt-7">
            <h2 className="t-eyebrow flex items-center gap-2 text-ink">
              <Shield size={13} strokeWidth={1.6} /> {t('buySafe')}
            </h2>
            <ul className="mt-5 grid grid-cols-1 gap-x-10 gap-y-3 md:grid-cols-2">
              {[t('safeTip1'), t('safeTip2'), t('safeTip3'), t('safeTip4')].map((tip) => (
                <li key={tip} className="flex items-baseline gap-3 text-[13.5px] leading-relaxed text-ink/70">
                  <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 bg-signal" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="sticky top-28 border border-ink bg-[#FBFAF5] p-6">
            <p className="t-label text-ink/45">Precio de venta</p>
            <p className="t-display mt-2 text-[2.6rem] leading-none text-ink t-num">{formatPrecio(producto.precio_usd || 0)}</p>
            {precioJusto && (
              <div
                className={`t-label mt-3 inline-flex flex-wrap items-center gap-1.5 border px-2 py-1.5 ${
                  precioJusto === 'dentro'
                    ? 'border-moss/30 bg-moss-soft text-moss'
                    : precioJusto === 'encima'
                      ? 'border-clay/30 bg-clay/[0.06] text-clay'
                      : 'border-line bg-paper-2 text-ink/70'
                }`}
              >
                {precioJusto === 'dentro' ? <Minus size={12} /> : precioJusto === 'encima' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {precioJusto === 'dentro' ? t('product.fair.inRange') : precioJusto === 'encima' ? t('product.fair.above') : t('product.fair.below')}
                {precioJustoComparables >= 3 && (
                  <LocalLink href="/tasador" className="underline underline-offset-2 font-bold opacity-80 hover:opacity-100">
                    {t('product.fair.link')}
                  </LocalLink>
                )}
              </div>
            )}
            <div className="t-label my-4 flex flex-wrap items-center gap-4 border-b border-line pb-4 text-ink/45">
              <span className="flex items-center gap-1"><Clock size={14} /> {t('published')}</span>
              <span className="flex items-center gap-1">
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx={12} cy={12} r={3} /></svg>
                {producto.visitas || 0} {t('views')}
              </span>
              {favoritosCount > 0 && (
                <span className="flex items-center gap-1 font-semibold text-ink">
                  <Heart size={12} /> {t('savedCount', { count: favoritosCount })}
                </span>
              )}
            </div>

            {historial.length > 0 && (
              <div className="mb-4 border border-line bg-paper-2/60 p-3">
                <p className="t-label mb-2 flex items-center gap-1.5 text-ink/55">{t('priceHistory')}</p>
                <div className="space-y-1.5">
                  {historial.slice(0, 3).map((h: any) => {
                    const pct = ((h.precio_nuevo - h.precio_anterior) / h.precio_anterior * 100).toFixed(0)
                    const subio = Number(pct) > 0
                    return (
                      <div key={h.id} className="flex items-center justify-between text-xs">
                        <span className="text-ink/45">{new Intl.DateTimeFormat('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(h.creado_en))}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-ink/40 line-through">{formatPrecio(h.precio_anterior)}</span>
                          <span className="font-semibold text-ink">{formatPrecio(h.precio_nuevo)}</span>
                          <span className={`t-num px-1 font-semibold ${subio ? 'bg-clay/10 text-clay' : 'bg-moss-soft text-moss'}`}>
                            {subio ? '↑' : '↓'}{Math.abs(Number(pct))}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}


            {/* Reserva con señal: el comprador solicita, el vendedor confirma la
                señal al recibirla y entonces el anuncio queda reservado. No se
                ofrece en anuncios sembrados: cobrar una señal por una máquina
                que no existe no es una decisión de diseño. */}
            {!producto.vendido && !esDemo && (
              <BotonReservar
                producto={producto}
                userId={user?.id || null}
                reservadoInicial={!!reserva?.reservado}
                reservadoHastaInicial={reserva?.reservado_hasta || null}
                onEstadoReserva={setReservaEstado}
              />
            )}




            {vendedor && (
              <div className="mb-5 border-y border-line py-4">
                <LocalLink href={`/vendedor/${vendedor.id}`} className="group/v flex items-center gap-3">
                  <Avatar nombre={vendedor.nombre || 'Vendedor'} fotoUrl={vendedor.foto_perfil_url} />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-semibold text-ink group-hover/v:underline group-hover/v:underline-offset-4">
                        {vendedor.nombre || 'Vendedor'}
                      </p>
                      {vendedor.verificado && <BadgeVerificado size="sm" />}
                    </div>
                    <span className="inline-block mt-1">
                      <BadgeTipoVendedor tipo={vendedor.tipo_vendedor} />
                    </span>
                    {vendedor.ciudad && <p className="t-label mt-1 text-ink/45">{vendedor.ciudad}{vendedor.estado ? `, ${vendedor.estado}` : ''}</p>}
                  </div>
                </LocalLink>
                {vendedorStats && (
                  <div className="mt-2 ml-0">
                    <SellerReputation nivel={vendedor.nivel_confianza || 0} numResenas={vendedorStats.resenasCount} promedioResenas={vendedorStats.resenasAvg} numPubsActivas={vendedorStats.activas} numPubsVendidas={vendedorStats.vendidas} verificado={vendedor.verificado} badges={vendedor.badges_automaticos || []} antiguedadDias={vendedorStats.antiguedad || 0} ultimaActividad={vendedor.ultima_actividad || null} size="sm" />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              {!producto.vendido && (
              <>
              <div className="grid grid-cols-2 gap-2">
                {metodos.chat && (
                  <button onClick={handleContacto} className="btn btn-ink justify-center text-[13px]">
                    <MessageCircle size={16} /> {t('chat')}
                  </button>
                )}
                {metodos.whatsapp && whatsappLink && (
                  <a href={whatsappLink} target="_blank" className="btn justify-center gap-2 bg-[#1FA855] text-[13px] text-white hover:bg-[#178c46]">
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                    WhatsApp
                  </a>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {metodos.telefono && contactPhone && (
                  <a href={`tel:${contactPhone}`} className="btn btn-outline justify-center text-[13px]"><Phone size={15} /> {t('call')}</a>
                )}
                {metodos.email && (
                  <a href={`mailto:${contactos.email}`} className="btn btn-outline justify-center text-[13px]"><Mail size={15} /> Email</a>
                )}
                {metodos.messenger && (
                  <a href={contactos.messengerUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline justify-center text-[13px]"><MessageCircle size={15} /> Messenger</a>
                )}
              </div>
              </>
              )}
            </div>

            {pedirCuenta && !user && (
              <div className="mt-4 border border-line bg-paper-2/60 p-4">
                <p className="text-[13.5px] font-semibold text-ink">{t('guestNudgeTitle')}</p>
                <p className="mt-1 mb-3 text-[12.5px] text-muted">{t('guestNudgeDesc')}</p>
                <div className="flex flex-wrap gap-2">
                  <LocalLink
                    href={`/register?redirect=/producto/${slug}`}
                    onClick={() => setPedirCuenta(false)}
                    className="btn btn-ink btn-sm"
                  >
                    {t('guestNudgeCreate')}
                  </LocalLink>
                  <LocalLink
                    href={`/login?redirect=/producto/${slug}`}
                    onClick={() => setPedirCuenta(false)}
                    className="btn btn-outline btn-sm"
                  >
                    {t('guestNudgeLogin')}
                  </LocalLink>
                  {metodos.whatsapp && whatsappLink && (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setPedirCuenta(false)}
                      className="t-label px-2 py-2 text-moss underline underline-offset-4"
                    >
                      {t('guestNudgeWhatsapp')} →
                    </a>
                  )}
                </div>
              </div>
            )}

            {(producto.ubicacion_ciudad || producto.ubicacion_estado) && (
              <div className="t-label mt-4 flex items-center gap-2 border-t border-line pt-4 text-ink/50">
                <MapPin size={12} /> {producto.ubicacion_ciudad}
                {producto.ubicacion_ciudad && producto.ubicacion_estado ? ', ' : ''}
                {producto.ubicacion_estado}
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <button
                onClick={toggleFavorito}
                disabled={toggleandoFav}
                className={`flex flex-1 items-center justify-center gap-1.5 border py-2.5 text-[12px] font-medium transition ${
                  esFavorito ? 'border-clay/40 bg-clay/[0.06] text-clay' : 'border-line text-ink/70 hover:border-ink hover:text-ink'
                }`}
              >
                <Heart size={14} className={esFavorito ? 'fill-clay' : ''} />
                {esFavorito ? t('saved') : t('save')}
              </button>
              <button
                onClick={() => navigator.share?.({ title: producto.titulo, url: window.location.href })}
                className="flex flex-1 items-center justify-center gap-1.5 border border-line py-2.5 text-[12px] font-medium text-ink/70 transition-colors hover:border-ink hover:text-ink"
              >
                <Share2 size={14} /> {t('shareBtn')}
              </button>
              <button
                type="button"
                aria-pressed={lista.some(x => x.id === producto.id)}
                onClick={() => alternar({ id: producto.id, slug: producto.slug ?? null, titulo: producto.titulo, precio_usd: producto.precio_usd ?? null, imagen_url: producto.imagen_url ?? null })}
                className={`flex flex-1 items-center justify-center gap-1.5 border py-2.5 text-[12px] font-medium transition ${
                  lista.some((x) => x.id === producto.id)
                    ? 'border-ink bg-signal font-semibold text-ink'
                    : 'border-line text-ink/70 hover:border-ink hover:text-ink'
                }`}
              >
                {lista.some((x) => x.id === producto.id) ? <Check size={14} /> : <GitCompare size={14} />}
                {t('comparar.cta')}
              </button>
              <ReportarButton productoId={producto.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductoPageClient(props: ProductoPageClientProps) {
  return (
    <ProductErrorBoundary>
      <ProductoPageClientInner {...props} />
    </ProductErrorBoundary>
  )
}
