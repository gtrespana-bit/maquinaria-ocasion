'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import LocalLink from '@/components/LocalLink'
import ProductCard, { type ProductCardData } from '@/components/ProductCard'
import BadgeVerificado from '@/components/BadgeVerificado'
import BadgeTipoVendedor from '@/components/BadgeTipoVendedor'
import { getPrecioEur, formatPrecio } from '@/lib/precio'
import {
  Globe,
  MapPin,
  Clock,
  Star,
  Store,
  Share2,
  Check,
  Search } from 'lucide-react'

interface Perfil {
  id: string
  slug: string
  nombre: string | null
  descripcion: string | null
  web: string | null
  portada_url: string | null
  horario: string | null
  direccion: string | null
  ciudad: string | null
  estado: string | null
  verificado: boolean | null
  foto_perfil_url: string | null
  tipo_vendedor: string | null
  creado_en: string | null
}

export default function TiendaClient({
  perfil,
  productos,
  totalResenas,
  promedio }: {
  perfil: Perfil
  productos: any[]
  totalResenas: number
  promedio: number
}) {
  const [busqueda, setBusqueda] = useState('')
  const [copiado, setCopiado] = useState(false)

  const ubicacion = [perfil.ciudad, perfil.estado].filter(Boolean).join(', ')
  const esTaller = perfil.tipo_vendedor === 'taller'

  // Rango de precios: al comprador le dice de un vistazo si esta tienda juega
  // en su presupuesto antes de recorrer 40 anuncios.
  const { minimo, maximo } = useMemo(() => {
    const precios = productos.map(getPrecioEur).filter(p => p > 0)
    if (precios.length === 0) return { minimo: 0, maximo: 0 }
    return { minimo: Math.min(...precios), maximo: Math.max(...precios) }
  }, [productos])

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return productos
    return productos.filter(p => (p.titulo || '').toLowerCase().includes(q))
  }, [productos, busqueda])

  const anoAlta = perfil.creado_en ? new Date(perfil.creado_en).getFullYear() : null

  const compartir = async () => {
    const url = `https://maquinaria.click/tienda/${perfil.slug}`
    try {
      if (navigator.share) {
        await navigator.share({ title: perfil.nombre || 'Tienda', url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      /* el usuario canceló: no es un error */
    }
  }

  return (
    <div className="bg-paper">
      {/* Portada: imagen si existe, si no un campo de trama sobre tinta */}
      <div className="relative h-40 overflow-hidden border-b border-line bg-ink md:h-56">
        {perfil.portada_url ? (
          <Image
            src={perfil.portada_url}
            alt=""
            fill
            className="object-cover opacity-80"
            sizes="100vw"
            priority
          />
        ) : (
          <div aria-hidden="true" className="blueprint absolute inset-0 opacity-50" />
        )}
      </div>

      <div className="shell">
        {/* Cabecera */}
        <div className="relative -mt-12 border border-line bg-[#FBFAF5] p-6 md:-mt-14 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="h-20 w-20 shrink-0 overflow-hidden border border-line bg-paper md:h-24 md:w-24">
              {perfil.foto_perfil_url ? (
                <Image
                  src={perfil.foto_perfil_url}
                  alt={perfil.nombre || 'Logo'}
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-ink/25">
                  <Store size={26} strokeWidth={1.3} />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="t-display t-display-md text-ink">{perfil.nombre || 'Tienda'}</h1>
                {perfil.verificado && <BadgeVerificado size="md" />}
                <BadgeTipoVendedor tipo={perfil.tipo_vendedor} size="md" />
              </div>

              <p className="t-label mt-2 text-ink/45">
                {esTaller ? 'Taller de maquinaria' : 'Vendedor profesional'}
                {anoAlta ? ` · Desde ${anoAlta}` : ''}
              </p>

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] text-ink/60">
                {ubicacion && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={12} strokeWidth={1.6} className="text-ink/35" />
                    {perfil.direccion ? `${perfil.direccion}, ${ubicacion}` : ubicacion}
                  </span>
                )}
                {perfil.horario && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={12} strokeWidth={1.6} className="text-ink/35" />
                    {perfil.horario}
                  </span>
                )}
                {perfil.web && (
                  <a
                    href={perfil.web}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-1.5 font-medium text-ink underline underline-offset-4"
                  >
                    <Globe size={12} strokeWidth={1.6} />
                    Web oficial
                  </a>
                )}
                {totalResenas > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Star size={12} className="fill-signal text-signal" />
                    <strong className="t-num font-semibold text-ink">{promedio}</strong>
                    <span className="text-ink/40">
                      ({totalResenas} {totalResenas === 1 ? 'reseña' : 'reseñas'})
                    </span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 gap-2 md:flex-col">
              <button onClick={compartir} className="btn btn-outline btn-sm justify-center">
                {copiado ? <Check size={14} className="text-moss" /> : <Share2 size={14} />}
                {copiado ? 'Enlace copiado' : 'Compartir'}
              </button>
              <LocalLink href={`/vendedor/${perfil.id}`} className="btn btn-ink btn-sm justify-center">
                Contactar
              </LocalLink>
            </div>
          </div>

          {perfil.descripcion && (
            <p className="mt-6 whitespace-pre-line border-t border-line pt-5 text-[13.5px] leading-relaxed text-ink/70">
              {perfil.descripcion}
            </p>
          )}
        </div>

        {/* Resumen del stock */}
        <dl className="mt-6 grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
          <div className="bg-paper px-4 py-4">
            <dd className="t-display t-num text-[1.5rem] leading-none text-ink">{productos.length}</dd>
            <dt className="t-label mt-2 text-ink/45">
              {productos.length === 1 ? 'anuncio en stock' : 'anuncios en stock'}
            </dt>
          </div>
          {minimo > 0 && (
            <div className="bg-paper px-4 py-4">
              <dd className="t-display t-num text-[1.5rem] leading-none text-ink">{formatPrecio(minimo)}</dd>
              <dt className="t-label mt-2 text-ink/45">desde</dt>
            </div>
          )}
          {maximo > 0 && (
            <div className="bg-paper px-4 py-4">
              <dd className="t-display t-num text-[1.5rem] leading-none text-ink">{formatPrecio(maximo)}</dd>
              <dt className="t-label mt-2 text-ink/45">hasta</dt>
            </div>
          )}
          {totalResenas > 0 && (
            <div className="bg-signal px-4 py-4">
              <dd className="t-display t-num text-[1.5rem] leading-none text-ink">{promedio}</dd>
              <dt className="t-label mt-2 text-ink/55">{totalResenas} valoraciones</dt>
            </div>
          )}
        </dl>

        {/* Stock */}
        <div className="mt-14 flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-3">
          <h2 className="t-display t-display-sm text-ink">Stock de {perfil.nombre || 'la tienda'}</h2>
          {productos.length > 4 && (
            <div className="relative w-full sm:w-72">
              <Search size={14} strokeWidth={1.6} className="absolute left-0 top-1/2 -translate-y-1/2 text-ink/35" aria-hidden="true" />
              <input
                type="search"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar en este stock…"
                aria-label="Buscar en el stock de la tienda"
                className="field pl-6 text-[13px]"
              />
            </div>
          )}
        </div>

        {filtrados.length === 0 ? (
          <div className="mt-6 mb-16 border border-line bg-[#FBFAF5] px-6 py-14 text-center">
            <p className="mx-auto max-w-md text-[14px] leading-relaxed text-muted">
              {productos.length === 0
                ? 'Esta tienda todavía no tiene anuncios publicados.'
                : 'Ningún anuncio coincide con tu búsqueda.'}
            </p>
            {productos.length > 0 && (
              <button onClick={() => setBusqueda('')} className="btn btn-outline mt-5">
                Ver todo el stock
              </button>
            )}
          </div>
        ) : (
          <div className="mb-16 mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {filtrados.map((p: ProductCardData) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
