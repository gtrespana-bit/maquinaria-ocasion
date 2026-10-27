'use client'

import { formatPrecio } from '@/lib/precio'

import { useRouter } from 'next/navigation'
import LocalLink from '@/components/LocalLink'
import Image from 'next/image'
import BadgeVerificado from '@/components/BadgeVerificado'
import BadgeTipoVendedor from '@/components/BadgeTipoVendedor'
import Avatar from '@/components/Avatar'
import { MapPin, Phone, Mail, MessageSquare, Star, ArrowLeft, ShoppingBag, Store } from 'lucide-react'
import SellerReputation from '@/components/SellerReputation'
import { useTranslations } from 'next-intl'
import { productUrl } from '@/lib/product-url'
import { enlaceWhatsApp } from '@/lib/telefono'

interface VendedorClientProps {
  vendedor: any
  productos: any[]
  resenas: any[]
  promedio: number
}

export default function VendedorClient({
  vendedor,
  productos,
  resenas,
  promedio }: VendedorClientProps) {
  const t = useTranslations('seller')
  const router = useRouter()
  const vendedorId = vendedor.id

  // Métodos de contacto (genéricos del perfil, si hay)
  const tieneWhatsApp = vendedor.whatsapp_disponible && vendedor.telefono
  const tieneTelefono = vendedor.telefono_disponible && vendedor.telefono
  const tieneEmail = vendedor.email_disponible && vendedor.email_publico

  const estrellasRender = (rating: number, size = 16) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={size}
        className={i < Math.round(rating) ? 'fill-signal text-signal' : 'text-ink/20'}
      />
    ))
  }

  return (
    <div className="bg-paper">
      <div className="shell py-8 md:py-12">
        <button
          onClick={() => router.back()}
          className="t-label mb-6 inline-flex items-center gap-2 text-ink/50 transition-colors hover:text-ink"
        >
          <ArrowLeft size={12} /> {t('back')}
        </button>

        {/* Perfil del vendedor */}
        <section className="border border-line bg-[#FBFAF5] p-6 md:p-8">
          <div className="flex flex-col items-start gap-6 sm:flex-row">
            <Avatar nombre={vendedor.nombre || t('seller')} fotoUrl={vendedor.foto_perfil_url} size="xl" />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="t-display t-display-md text-ink">{vendedor.nombre || t('seller')}</h1>
                {vendedor.verificado && <BadgeVerificado size="md" />}
                {vendedor.tipo_vendedor && <BadgeTipoVendedor tipo={vendedor.tipo_vendedor} size="md" />}
              </div>

              {(vendedor.ciudad || vendedor.estado) && (
                <p className="t-label mt-2 flex items-center gap-1.5 text-ink/45">
                  <MapPin size={11} strokeWidth={1.8} /> {[vendedor.ciudad, vendedor.estado].filter(Boolean).join(', ')}
                </p>
              )}

              {/* Si es un profesional con tienda abierta, su escaparate es la
                  página buena: stock completo, horario y web. */}
              {vendedor.tienda_activa && vendedor.slug && (
                <LocalLink
                  href={`/tienda/${vendedor.slug}`}
                  className="mt-3 inline-flex items-center gap-2 border border-line px-2.5 py-1.5 text-[13px] font-medium text-ink transition-colors hover:border-ink"
                >
                  <Store size={13} strokeWidth={1.6} /> Ver la tienda completa
                </LocalLink>
              )}

              <div className="mt-4">
                <SellerReputation
                  nivel={vendedor.nivel_confianza || 0}
                  numResenas={resenas.length}
                  promedioResenas={promedio}
                  numPubsActivas={productos.length}
                  numPubsVendidas={vendedor.total_vendidas || 0}
                  antiguedadDias={vendedor.antiguedad_dias || Math.floor((Date.now() - new Date(vendedor.creado_en).getTime()) / (1000*60*60*24))}
                  ultimaActividad={vendedor.ultima_actividad}
                  verificado={vendedor.verificado}
                  badges={vendedor.badges_automaticos || []}
                  size="md"
                />
              </div>

              {/* Contacto */}
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  onClick={() => router.push(`/chat?vendedor=${vendedorId}`)}
                  className="btn btn-ink btn-sm"
                >
                  <MessageSquare size={13} strokeWidth={1.7} /> {t('sendMessage')}
                </button>
                {tieneWhatsApp && (
                  <a
                    href={enlaceWhatsApp(vendedor.telefono || '')}
                    target="_blank"
                    className="btn btn-sm justify-center bg-[#1FA855] text-paper hover:bg-[#188646]"
                  >
                    WhatsApp
                  </a>
                )}
                {tieneTelefono && (
                  <a href={`tel:${vendedor.telefono}`} className="btn btn-outline btn-sm">
                    <Phone size={13} strokeWidth={1.7} /> {t('call')}
                  </a>
                )}
                {tieneEmail && vendedor.email_publico && (
                  <a href={`mailto:${vendedor.email_publico}`} className="btn btn-outline btn-sm">
                    <Mail size={13} strokeWidth={1.7} /> Email
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Reseñas */}
        {resenas.length > 0 && (
          <section className="mt-12">
            <h2 className="t-eyebrow border-b border-ink pb-3 text-ink">
              {t('reviews')} ({resenas.length})
            </h2>
            <ul className="border-t border-line">
              {resenas.map(r => (
                <li key={r.id} className="border-b border-line py-4">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-0.5" aria-hidden="true">{estrellasRender(r.puntuacion, 11)}</span>
                    <span className="t-label ml-auto text-ink/35">
                      {new Date(r.creado_en).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {r.producto?.titulo && (
                    <p className="t-label mt-2 text-ink/40">{r.producto.titulo}</p>
                  )}
                  {r.comentario ? (
                    <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-ink/70">{r.comentario}</p>
                  ) : (
                    <p className="mt-1.5 text-[13px] italic text-ink/35">{t('noComment')}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Productos del vendedor */}
        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink pb-3">
            <h2 className="t-display t-display-sm text-ink">
              {t('listingsBy', { name: vendedor.nombre || t('seller') })} ({productos.length})
            </h2>
            <ShoppingBag size={14} strokeWidth={1.5} className="text-ink/25" aria-hidden="true" />
          </div>

          {productos.length === 0 ? (
            <div className="mt-6 border border-line bg-[#FBFAF5] px-6 py-12 text-center">
              <p className="text-[13.5px] text-muted">{t('noListings')}</p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {productos.map(p => (
                <LocalLink
                  key={p.id}
                  href={productUrl(p)}
                  className="group/card border border-line bg-[#FBFAF5] transition-colors hover:border-ink"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-paper-2">
                    {p.imagen_url ? (
                      <Image
                        src={p.imagen_url}
                        alt={p.titulo}
                        width={400}
                        height={300}
                        sizes="(max-width: 768px) 92vw, (max-width: 1024px) 45vw, 24vw"
                        className="h-full w-full object-cover saturate-[0.92] transition-[transform,filter] duration-700 group-hover/card:scale-[1.035] group-hover/card:saturate-100"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-[12px] text-ink/30">{t('noPhoto')}</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="truncate text-[13.5px] font-medium text-ink">{p.titulo}</h3>
                    <p className="t-display t-num mt-2 text-[1.15rem] leading-none text-ink">
                      {formatPrecio(p.precio_usd || 0)}
                    </p>
                  </div>
                </LocalLink>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
