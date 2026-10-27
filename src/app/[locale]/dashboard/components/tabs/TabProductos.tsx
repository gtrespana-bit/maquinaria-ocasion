'use client'

import { formatPrecio } from '@/lib/precio'

import { useEffect, useRef, useState } from 'react'
import LocalLink from '@/components/LocalLink'
import { Package, X, Pause, Play, Edit, Zap, Star, CheckCircle2, ArrowLeft, Send, RefreshCw, Plus, MoreHorizontal, Eye } from 'lucide-react'
import { productUrl } from '@/lib/product-url'
import { boostVigente } from '@/lib/catalog-consulta'
import Image from 'next/image'

type Filtro = 'activos' | 'pausados' | 'vendidos' | 'todos'

function BadgeEstado({
  vendido,
  activo,
  pausadoPorPlan }: {
  vendido: boolean
  activo: boolean
  pausadoPorPlan?: boolean
}) {
  if (vendido) {
    return <span className="t-label border border-ink bg-ink px-1.5 py-0.5 text-paper">Vendido</span>
  }
  if (activo) {
    return <span className="t-label border border-moss/30 bg-moss-soft px-1.5 py-0.5 text-moss">Activo</span>
  }
  if (pausadoPorPlan) {
    return (
      <span
        className="t-label border border-signal-deep/40 bg-signal/20 px-1.5 py-0.5 text-ink/70"
        title="Lo pausó el sistema al bajar el cupo. No se ha borrado."
      >
        Pausado por cupo
      </span>
    )
  }
  return <span className="t-label border border-line bg-paper-2 px-1.5 py-0.5 text-ink/50">Pausado</span>
}

export default function TabProductos({
  productos,
  onBoost,
  onDestacar,
  userId }: {
  productos: any[]
  onBoost: (m: { productId: string; titulo: string }) => void
  onDestacar: (m: { productId: string; titulo: string }) => void
  userId: string
}) {
  const mediaVisitas = (() => {
    const vivos = (productos || []).filter((p: any) => p.activo && !p.vendido)
    if (vivos.length < 2) return null
    const total = vivos.reduce((s: number, p: any) => s + (p.visitas || 0), 0)
    return total / vivos.length
  })()

  const [filtro, setFiltro] = useState<Filtro>('activos')
  const [vendidoModal, setVendidoModal] = useState<string | null>(null)
  const [vendidoPaso, setVendidoPaso] = useState<'tipo' | 'comprador' | 'reseña' | 'confirmado'>('tipo')
  const [interesados, setInteresados] = useState<any[]>([])
  const [compradorInfo, setCompradorInfo] = useState<{ id: string; nombre: string } | null>(null)
  const [cargandoVendidos, setCargandoVendidos] = useState(false)
  const [enviandoResena, setEnviandoResena] = useState(false)
  const [rating, setRating] = useState(5)
  const [comentarioResena, setComentarioResena] = useState('')
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null)
  const [cupo, setCupo] = useState<{ usados: number; max: number | null; puedePublicar: boolean; profesional: boolean; trial: boolean } | null>(null)

  useEffect(() => {
    fetch('/api/cupo-anuncios')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d?.ok) setCupo(d) })
      .catch(() => {})
  }, [])
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function fuera(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAbierto(null)
      }
    }
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [])

  const nActivos = productos.filter((p: any) => p.activo && !p.vendido).length
  const nPausados = productos.filter((p: any) => !p.activo && !p.vendido).length
  const nVendidos = productos.filter((p: any) => p.vendido).length

  const lista = productos.filter((p: any) => {
    if (filtro === 'activos') return p.activo && !p.vendido
    if (filtro === 'pausados') return !p.activo && !p.vendido
    if (filtro === 'vendidos') return p.vendido
    return true
  })

  const cerrarMenus = () => setMenuAbierto(null)

  const abrirVendido = async (productoId: string) => {
    cerrarMenus()
    setVendidoModal(productoId)
    setVendidoPaso('tipo')
    setCompradorInfo(null)
    setInteresados([])
    setRating(5)
    setComentarioResena('')

    if (!userId) return
    setCargandoVendidos(true)
    try {
      const res = await fetch(`/api/admin/marcar-vendido?productoId=${productoId}&userId=${userId}`)
      const data = await res.json()
      if (data.ok && data.interesados) setInteresados(data.interesados)
    } catch {
      // fail silently
    }
    setCargandoVendidos(false)
  }

  const reactivarVendido = async (productoId: string) => {
    cerrarMenus()
    if (!confirm('¿Reactivar esta publicacion como no vendida?')) return
    const res = await fetch('/api/productos/reactivar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productoId }) })
    if (!res.ok) {
      const result = await res.json().catch(() => ({}))
      alert('Error: ' + (result.error || 'no se pudo reactivar'))
      return
    }
    window.location.reload()
  }

  const marcarVendidoSimple = async (productoId: string, vendidoEn: string) => {
    const res = await fetch('/api/admin/marcar-vendido', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productoId, userId, vendidoEn }) })
    if (!res.ok) {
      const d = await res.json()
      alert('Error: ' + d.error)
      return
    }
    setVendidoPaso('confirmado')
  }

  const seleccionarComprador = (comprador: { userId: string; nombre: string }) => {
    setCompradorInfo({ id: comprador.userId, nombre: comprador.nombre })
    setVendidoPaso('reseña')
  }

  const venderSinResena = async () => {
    if (!vendidoModal || !compradorInfo) return
    cerrarMenus()

    const res = await fetch('/api/admin/marcar-vendido', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productoId: vendidoModal,
        userId,
        vendidoEn: 'plataforma',
        compradorId: compradorInfo.id }) })

    if (!res.ok) {
      const d = await res.json()
      alert('Error: ' + d.error)
      return
    }

    await enviarMensajeComprador(compradorInfo.id)
    setVendidoPaso('confirmado')
  }

  const enviarResena = async () => {
    if (!vendidoModal || !compradorInfo) return
    setEnviandoResena(true)
    cerrarMenus()

    const res1 = await fetch('/api/admin/marcar-vendido', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productoId: vendidoModal,
        userId,
        vendidoEn: 'plataforma',
        compradorId: compradorInfo.id }) })

    if (!res1.ok) {
      const d = await res1.json()
      setEnviandoResena(false)
      alert('Error al marcar vendido: ' + d.error)
      return
    }

    const res2 = await fetch('/api/admin/enviar-resena', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        producto_id: vendidoModal,
        evaluador_id: userId,
        evaluado_id: compradorInfo.id,
        puntuacion: rating,
        comentario: comentarioResena.trim() || null }) })

    setEnviandoResena(false)
    const data2 = await res2.json()
    if (!res2.ok) {
      console.warn('Reseña falló:', data2.error)
    }

    await enviarMensajeComprador(compradorInfo.id)
    setVendidoPaso('confirmado')
  }

  const enviarMensajeComprador = async (compradorId: string) => {
    if (!vendidoModal) return
    try {
      const convResponse = await fetch('/api/crear-conversacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendedorId: userId, otroUsuarioId: compradorId, productoId: vendidoModal }) })
      const conv = await convResponse.json().catch(() => ({}))
      if (!convResponse.ok || !conv.id) return

      await fetch('/api/enviar-mensaje', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversacion_id: conv.id,
          destinatario_id: compradorId,
          contenido: '✅ ¡Tu compra fue exitosa! El vendedor ha confirmado la venta. ¿Cómo fue tu experiencia? Déjale una reseña para ayudar a la comunidad. ⭐' }) })
    } catch {
      // La venta ya está guardada; la notificación es secundaria.
    }
  }

  const pausarActivar = async (id: string, activoActual: boolean) => {
    cerrarMenus()
    const res = await fetch('/api/productos/editar', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: id, activo: !activoActual }) })

    if (!res.ok) {
      const result = await res.json().catch(() => ({}))
      alert('Error: ' + (result.error || 'No se pudo actualizar la publicación'))
      return
    }

    window.location.reload()
  }

  const renovarProducto = async (id: string) => {
    cerrarMenus()
    const res = await fetch('/api/productos/renovar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: id }) })
    const result = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert('Error: ' + (result.error || 'No se pudo renovar la publicación'))
      return
    }
    window.location.reload()
  }

  const eliminarProducto = async (id: string) => {
    cerrarMenus()
    if (!confirm('¿Eliminar esta publicación permanentemente? Esta acción no se puede deshacer y se borrarán también las fotos.')) return
    const res = await fetch('/api/admin/eliminar-producto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: id }) })
    const result = await res.json()
    if (!res.ok) {
      alert('Error: ' + (result.error || 'no se pudo eliminar'))
      return
    }
    window.location.reload()
  }

  if (productos.length === 0) {
    return (
      <div className="border border-line bg-[#FBFAF5] px-6 py-14 text-center">
        <Package size={22} strokeWidth={1.3} className="mx-auto mb-4 text-ink/25" aria-hidden="true" />
        <h3 className="text-[15px] font-semibold tracking-[-0.015em] text-ink">Aún no tienes anuncios</h3>
        <p className="mt-1.5 text-[12.5px] text-ink/55">Publica el primero en un par de minutos. Es gratis.</p>
        <LocalLink href="/publicar" className="btn btn-ink mt-6">
          <Plus size={13} aria-hidden="true" /> Publicar ahora
        </LocalLink>
      </div>
    )
  }

  const now = new Date().toISOString()
  const nowTs = Date.now()
  const chips: { id: Filtro; label: string; n: number }[] = [
    { id: 'activos', label: 'Activos', n: nActivos },
    { id: 'pausados', label: 'Pausados', n: nPausados },
    { id: 'vendidos', label: 'Vendidos', n: nVendidos },
    { id: 'todos', label: 'Todos', n: productos.length },
  ]

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 border-b border-ink pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="t-eyebrow text-ink">Anuncios</h3>
          <p className="text-[12.5px] text-ink/55">
            {nActivos} activos · {nVendidos} vendidos
            {cupo ? ` · cupo ${cupo.usados}/${cupo.max == null ? '∞' : cupo.max}` : ''}
            {cupo?.trial && cupo.profesional ? ' · mes de prueba' : ''}
          </p>
          {cupo && !cupo.puedePublicar && (
            <p className="mt-1 text-[11.5px] text-clay">
              Cupo lleno.{' '}
              <LocalLink href="/para-profesionales" className="underline font-semibold">
                Ver planes
              </LocalLink>
            </p>
          )}
        </div>
        <LocalLink href="/publicar" className="btn btn-ink btn-sm justify-center">
          <Plus size={12} aria-hidden="true" /> Nuevo anuncio
        </LocalLink>
      </div>

      <div className="hide-scrollbar mb-4 flex gap-1.5 overflow-x-auto" role="tablist" aria-label="Filtrar anuncios">
        {chips.map(c => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={filtro === c.id}
            onClick={() => setFiltro(c.id)}
            className={`t-label whitespace-nowrap border px-2.5 py-1.5 transition-colors ${
              filtro === c.id
                ? 'border-ink bg-ink text-paper'
                : 'border-line bg-[#FBFAF5] text-ink/55 hover:border-ink hover:text-ink'
            }`}
          >
            {c.label} <span className="t-num opacity-60">{c.n}</span>
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <div className="border border-line bg-[#FBFAF5] px-6 py-10 text-center text-[12.5px] text-ink/50">
          No hay anuncios en este filtro.
        </div>
      ) : (
        <ul className="divide-y divide-line border border-line bg-[#FBFAF5]">
          {lista.map((p) => {
            const isBoosted = boostVigente(p.boosteado_en)
            const isFeatured = p.destacado && p.destacado_hasta && p.destacado_hasta > now
            const isVendido = p.vendido === true
            const abierto = menuAbierto === p.id
            const puedeRenovar = !isVendido && p.activo && p.creado_en && (nowTs - new Date(p.creado_en).getTime()) >= 7 * 864e5
            const difVisitas = (() => {
              if (mediaVisitas == null || mediaVisitas <= 0 || isVendido || !p.activo) return null
              const dif = Math.round((((p.visitas || 0) - mediaVisitas) / mediaVisitas) * 100)
              if (Math.abs(dif) < 25) return null
              return dif
            })()

            return (
              <li key={p.id} className="p-3 transition-colors hover:bg-paper-2/60 sm:p-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <LocalLink href={productUrl(p)} className="relative h-16 w-16 shrink-0 overflow-hidden border border-line bg-paper-2 sm:h-[4.5rem] sm:w-[4.5rem]">
                    {p.imagen_url ? (
                      <Image src={p.imagen_url} alt="" className="object-cover" fill sizes="72px" />
                    ) : (
                      <span className="flex h-full items-center justify-center text-[10px] text-ink/40">Sin foto</span>
                    )}
                    {isVendido && (
                      <span className="t-label absolute inset-0 flex items-center justify-center bg-ink/80 text-paper">Vendido</span>
                    )}
                  </LocalLink>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <LocalLink href={productUrl(p)} className="block truncate text-[13px] font-medium text-ink hover:underline hover:underline-offset-4">
                          {p.titulo}
                        </LocalLink>
                        <p className="t-num mt-0.5 text-[13px] font-semibold text-ink">{formatPrecio(p.precio_usd || 0)}</p>
                      </div>
                      <BadgeEstado vendido={isVendido} activo={!!p.activo} pausadoPorPlan={!!p.pausado_por_plan} />
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink/50">
                      <span className="t-num inline-flex items-center gap-1"><Eye size={10} aria-hidden="true" /> {p.visitas || 0}</span>
                      {difVisitas != null && (
                        <span className={difVisitas < 0 ? 'text-amber-700 font-medium' : 'text-emerald-700 font-medium'}>
                          {difVisitas < 0 ? `${Math.abs(difVisitas)} % menos que tu media` : `${difVisitas} % más que tu media`}
                        </span>
                      )}
                      {isBoosted && <span className="text-amber-700 font-medium">En el nº 1</span>}
                      {isFeatured && (
                        <span className="text-ink/45">Destacado hasta {new Date(p.destacado_hasta).toLocaleDateString('es-ES')}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                  <LocalLink
                    href={`/producto/editar/${p.id}`}
                    className="t-label inline-flex items-center gap-1.5 border border-line px-2.5 py-1.5 text-ink/70 transition-colors hover:border-ink hover:text-ink"
                  >
                    <Edit size={11} aria-hidden="true" /> Editar
                  </LocalLink>
                  {!isVendido && p.activo && (
                    <button
                      type="button"
                      onClick={() => onDestacar({ productId: p.id, titulo: p.titulo })}
                      className="t-label inline-flex items-center gap-1.5 border border-ink bg-ink px-2.5 py-1.5 text-paper transition-opacity hover:opacity-85"
                    >
                      <Star size={11} aria-hidden="true" /> Destacar
                    </button>
                  )}
                  {isVendido && (
                    <button
                      type="button"
                      onClick={() => reactivarVendido(p.id)}
                      className="t-label inline-flex items-center gap-1.5 border border-line px-2.5 py-1.5 text-ink/70 transition-colors hover:border-ink hover:text-ink"
                    >
                      <Play size={11} aria-hidden="true" /> Reactivar
                    </button>
                  )}

                  <div className="relative" ref={abierto ? menuRef : undefined}>
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={abierto}
                      aria-label="Más acciones"
                      onClick={() => setMenuAbierto(abierto ? null : p.id)}
                      className="border border-line p-1.5 text-ink/50 transition-colors hover:border-ink hover:text-ink"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                    {abierto && (
                      <div role="menu" className="absolute right-0 top-full z-20 mt-1 w-52 border border-line-strong bg-[#FBFAF5] py-1">
                        {!isVendido && p.activo && (
                          <>
                            <button type="button" role="menuitem" onClick={() => { onBoost({ productId: p.id, titulo: p.titulo }); cerrarMenus() }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] text-ink/80 hover:bg-paper-2">
                              <Zap size={12} strokeWidth={1.6} className="text-ink/50" /> Subir al nº 1
                            </button>
                            <button type="button" role="menuitem" onClick={() => abrirVendido(p.id)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] text-ink/80 hover:bg-paper-2">
                              <CheckCircle2 size={12} strokeWidth={1.6} className="text-moss" /> Marcar vendido
                            </button>
                            {puedeRenovar && (
                              <button type="button" role="menuitem" onClick={() => renovarProducto(p.id)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] text-ink/80 hover:bg-paper-2">
                                <RefreshCw size={12} strokeWidth={1.6} /> Renovar
                              </button>
                            )}
                          </>
                        )}
                        {!isVendido && (
                          <button type="button" role="menuitem" onClick={() => pausarActivar(p.id, p.activo)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] text-ink/80 hover:bg-paper-2">
                            {p.activo ? <Pause size={12} strokeWidth={1.6} /> : <Play size={12} strokeWidth={1.6} />} {p.activo ? 'Pausar' : 'Activar'}
                          </button>
                        )}
                        {!isVendido && (
                          <button type="button" role="menuitem" onClick={() => eliminarProducto(p.id)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] text-clay hover:bg-clay/[0.06]">
                            <X size={12} strokeWidth={1.6} /> Eliminar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {vendidoModal && (
        <div
          className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="vendido-titulo"
          tabIndex={-1}
          onKeyDown={(e) => { if (e.key === 'Escape') setVendidoModal(null) }}
        >
          <div className="w-full max-w-md border border-line-strong bg-[#FBFAF5] p-6">
            <div className="flex items-center justify-between mb-4">
              {vendidoPaso !== 'tipo' ? (
                <button onClick={() => setVendidoPaso('tipo')} className="flex items-center gap-1 text-sm text-ink hover:underline">
                  <ArrowLeft size={16} /> Atrás
                </button>
              ) : <div />}
              <button onClick={() => setVendidoModal(null)} aria-label="Cerrar modal" className="text-ink/40 transition-colors hover:text-ink">
                <X size={16} />
              </button>
            </div>

            {vendidoPaso === 'tipo' && (
              <>
                <h3 id="vendido-titulo" className="mb-2 text-[15px] font-semibold tracking-[-0.015em] text-ink">¿Cómo se vendió?</h3>
                <p className="mb-6 text-[12.5px] leading-relaxed text-ink/55">Esto marca tu anuncio como vendido y ya no aparecerá activo.</p>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      if (interesados.length > 0) {
                        setVendidoPaso('comprador')
                      } else {
                        marcarVendidoSimple(vendidoModal, 'plataforma')
                      }
                    }}
                    className="w-full border border-moss/30 bg-moss-soft p-4 text-left transition-colors hover:border-moss"
                  >
                    <p className="text-[13px] font-semibold text-moss">Vendido en esta plataforma</p>
                    <p className="mt-1 text-[11.5px] text-moss/75">
                      {interesados.length > 0
                        ? `${interesados.length} persona(s) te contactaron por este producto`
                        : 'No hubo mensajes por este producto'
                      }
                    </p>
                  </button>
                  <button
                    onClick={() => marcarVendidoSimple(vendidoModal, 'otra_pagina')}
                    className="w-full border border-line bg-paper-2 p-4 text-left transition-colors hover:border-ink"
                  >
                    <p className="text-[13px] font-semibold text-ink">Vendido en otro lugar</p>
                    <p className="mt-1 text-[11.5px] text-ink/45">Facebook, WhatsApp, en persona, etc.</p>
                  </button>
                  <button
                    onClick={() => marcarVendidoSimple(vendidoModal, 'no_especificado')}
                    className="w-full border border-line bg-paper-2 p-4 text-left transition-colors hover:border-ink"
                  >
                    <p className="text-[13px] font-semibold text-ink">Prefiero no decir</p>
                    <p className="mt-1 text-[11.5px] text-ink/45">Solo marca el anuncio como vendido</p>
                  </button>
                </div>
              </>
            )}

            {vendidoPaso === 'comprador' && (
              <>
                <h3 className="mb-2 text-[15px] font-semibold tracking-[-0.015em] text-ink">¿A quién le vendiste?</h3>
                <p className="mb-4 text-[12.5px] leading-relaxed text-ink/55">Selecciona a la persona que te contactó por este producto.</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {cargandoVendidos ? (
                    <p className="t-label py-8 text-center text-ink/35">Cargando…</p>
                  ) : interesados.length === 0 ? (
                    <p className="py-4 text-center text-[12.5px] text-ink/45">Nadie te contactó por este producto</p>
                  ) : (
                    <>
                      {interesados.map((inter) => (
                        <button
                          key={inter.userId}
                          onClick={() => seleccionarComprador(inter)}
                          className="w-full border border-line bg-paper p-3 text-left transition-colors hover:border-ink hover:bg-signal/10"
                        >
                          <p className="text-[13px] font-medium text-ink">{inter.nombre}</p>
                          {inter.ultimoMensaje && (
                            <p className="mt-0.5 truncate text-[11.5px] text-ink/45">&ldquo;{inter.ultimoMensaje}&rdquo;</p>
                          )}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          setCompradorInfo({ id: '', nombre: '' })
                          setVendidoPaso('reseña')
                        }}
                        className="t-label w-full p-3 text-center text-ink/45 hover:text-ink hover:underline"
                      >
                        Omitir (no fue ninguno de estos)
                      </button>
                    </>
                  )}
                </div>
              </>
            )}

            {vendidoPaso === 'reseña' && (
              <>
                <div className="mb-4 flex items-center gap-3 border-b border-line pb-3">
                  <CheckCircle2 size={18} strokeWidth={1.6} className="shrink-0 text-moss" />
                  <h3 className="text-[15px] font-semibold tracking-[-0.015em] text-ink">Venta registrada</h3>
                </div>
                <div className="mb-4 border border-line bg-paper-2 p-4">
                  <p className="mb-3 text-[12.5px] text-ink/70">
                    ¿Quieres dejarle una reseña a{' '}
                    <span className="text-ink">
                      {compradorInfo && compradorInfo.nombre ? compradorInfo.nombre : 'este comprador'}
                    </span>
                    ?
                  </p>
                  <div className="flex justify-center mb-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <button key={i} onClick={() => setRating(i)} className="hover:scale-110 transition">
                          <Star size={28} className={i <= rating ? 'fill-signal text-ink' : 'text-line-strong'} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="t-label text-center text-ink/45">{['Muy mala', 'Mala', 'Regular', 'Buena', 'Excelente'][rating - 1]}</p>
                </div>
                <textarea
                  value={comentarioResena}
                  onChange={e => setComentarioResena(e.target.value)}
                  rows={2}
                  className="field resize-none text-[13.5px]"
                  maxLength={300}
                  placeholder="¿Algo que quieras comentar? (opcional)"
                />
                <p className="t-label mt-1 text-right text-ink/35">{comentarioResena.length}/300</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={venderSinResena}
                    className="btn btn-outline flex-1 justify-center"
                  >
                    Sin reseña
                  </button>
                  <button
                    onClick={enviarResena}
                    disabled={enviandoResena}
                    className="btn btn-ink flex-1 justify-center disabled:opacity-50"
                  >
                    <Send size={14} /> {enviandoResena ? 'Enviando...' : 'Enviar reseña'}
                  </button>
                </div>
              </>
            )}

            {vendidoPaso === 'confirmado' && (
              <div className="py-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-moss/30 bg-moss-soft">
                  <CheckCircle2 size={22} strokeWidth={1.6} className="text-moss" />
                </div>
                <h3 className="mb-2 text-[17px] font-semibold tracking-[-0.02em] text-ink">Anuncio vendido</h3>
                <p className="mb-6 text-[12.5px] leading-relaxed text-ink/55">Tu anuncio ya está marcado como vendido. El comprador recibió un mensaje.</p>
                <button
                  onClick={() => { setVendidoModal(null); window.location.reload() }}
                  className="btn btn-ink btn-lg"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
