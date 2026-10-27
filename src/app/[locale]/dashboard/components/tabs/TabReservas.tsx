'use client'

/**
 * Pestaña"Reservas" del dashboard (Fase 1.2 — reserva con señal, confirmación
 * del vendedor).
 *
 * Dos vistas en la misma pestaña porque el interesado casi siempre es el mismo:
 *  -"Como comprador": solicitudes que yo he enviado; sigo el estado
 *    (solicitada → activa cuando el vendedor confirma la señal).
 *  -"Como vendedor": solicitudes de mis anuncios; aquí confirmo cuando recibo
 *    la señal (la reserva pasa a activa y bloquea el anuncio) o la rechazo.
 */

import { useCallback, useEffect, useState } from 'react'
import LocalLink from '@/components/LocalLink'
import Image from 'next/image'
import { CalendarClock, CheckCircle2, Loader2, X } from 'lucide-react'
import { ETIQUETAS_ESTADO_RESERVA, normalizarEstadoReserva, type EstadoReserva} from '@/lib/reservas'
import { formatPrecio } from '@/lib/precio'

interface Reserva {
  id: string
  producto_id: string
  comprador_id: string
  vendedor_id: string
  importe: number
  estado: string
  metodo_pago: string
  mensaje?: string | null
  motivo_cancelacion?: string | null
  expira_en: string
  created_at: string
  productos?: { id: string; titulo: string; precio_usd: number; imagen_url?: string | null; slug?: string | null } | null
  perfiles?: { nombre?: string | null; email?: string | null; telefono?: string | null } | null
}

function fecha(iso?: string | null) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

export default function TabReservas({ userId }: { userId: string }) {
  const [vista, setVista] = useState<'comprador' | 'vendedor'>('comprador')
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [cargando, setCargando] = useState(true)
  const [pendienteMigracion, setPendienteMigracion] = useState(false)
  const [aviso, setAviso] = useState('')
  const [trabajando, setTrabajando] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const res = await fetch(`/api/reservas?scope=${vista}`, { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      if (json.pendienteMigracion) setPendienteMigracion(true)
      setReservas(json.reservas || [])
    } catch {
      setAviso('No se pudieron cargar las reservas')
    } finally {
      setCargando(false)
    }
  }, [vista])

  useEffect(() => { cargar() }, [cargar])

  async function confirmar(reserva: Reserva, accion: 'confirmar' | 'rechazar') {
    setAviso('')
    setTrabajando(reserva.id)
    try {
      let motivo: string | null = null
      if (accion === 'rechazar') {
        const entrada = window.prompt('Motivo del rechazo (se lo mostramos al comprador):')
        if (entrada === null) return
        motivo = entrada.trim()
        if (!motivo) { setAviso('El motivo es obligatorio'); return }
      }
      const res = await fetch('/api/reservas/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservaId: reserva.id, accion, motivo }) })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.ok) setAviso(json.error || 'No se pudo actualizar la reserva')
      else await cargar()
    } catch {
      setAviso('No se pudo actualizar la reserva')
    } finally {
      setTrabajando(null)
    }
  }

  async function cancelar(reserva: Reserva) {
    const texto = normalizarEstadoReserva(reserva.estado) === 'activa'
      ? 'La señal ya está confirmada: al cancelar quedará constancia de que debes devolverla. ¿Continuar?'
      : '¿Cancelar la solicitud de reserva?'
    if (!window.confirm(texto)) return
    await fetch('/api/reservas/cancelar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservaId: reserva.id, motivo: vista === 'vendedor' ? 'Cancelada por el vendedor' : 'Cancelada por el comprador' }) })
    await cargar()
  }

  if (pendienteMigracion) {
    return (
      <div className="bg-signal/10 border border-line rounded-xl p-5">
        <h3 className="font-semibold text-ink mb-1">Reservas aún no disponibles</h3>
        <p className="text-sm text-ink">
          Falta aplicar la migración de base de datos de reservas. En cuanto esté aplicada, aparecerán aquí tus reservas.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 bg-paper-2 p-1 rounded-xl w-fit">
        {(['comprador', 'vendedor'] as const).map(v => (
          <button
            key={v}
            type="button"
            onClick={() => setVista(v)}
            className={`text-sm font-semibold px-4 py-2 rounded-lg transition ${
              vista === v ? 'bg-[#FBFAF5] text-ink ' : 'text-ink/60 hover:text-ink'
            }`}
          >
            {v === 'comprador' ? 'Mis reservas' : 'En mis anuncios'}
          </button>
        ))}
      </div>

      {aviso && <p className="text-sm text-clay bg-clay/[0.07] border border-clay/30 rounded-lg px-3 py-2">{aviso}</p>}

      {cargando ? (
        <div className="border border-line bg-[#FBFAF5] p-8 text-center text-ink/60">
          <Loader2 size={20} className="animate-spin mx-auto" />
        </div>
      ) : reservas.length === 0 ? (
        <div className="bg-[#FBFAF5]  border border-line p-8 text-center">
          <CalendarClock size={44} className="text-ink/40 mx-auto mb-3" />
          <h3 className="text-[14px] font-semibold text-ink mb-1">
            {vista === 'comprador' ? 'Todavía no has reservado nada' : 'Nadie ha reservado tus anuncios'}
          </h3>
          <p className="text-[12.5px] text-ink/55">
            {vista === 'comprador'
              ? 'Cuando solicites una reserva con señal, el vendedor la confirmará al recibir el pago y la verás aquí.'
              : 'Cuando un comprador solicite reservar uno de tus anuncios, lo verás aquí para confirmar la señal cuando te llegue el pago.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservas.map(r => {
            const estado = normalizarEstadoReserva(r.estado) as EstadoReserva
            const etiqueta = ETIQUETAS_ESTADO_RESERVA[estado]
            const p = r.productos
            return (
              <div key={r.id} className="bg-[#FBFAF5]  border border-line p-4">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-lg bg-paper-2 flex-shrink-0 overflow-hidden relative">
                    {p?.imagen_url ? (
                      <Image src={p.imagen_url} alt={p.titulo || ''} fill sizes="80px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink/40 text-xs">Sin foto</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <LocalLink href={`/producto/${p?.id || r.producto_id}`} className="font-semibold text-ink hover:text-ink line-clamp-2">
                        {p?.titulo || 'Anuncio'}
                      </LocalLink>
                      <span className={`text-[11px] font-semibold px-2 py-1 rounded-full border whitespace-nowrap ${etiqueta?.tono || 'bg-paper-2 border-line'}`}>
                        {etiqueta?.label || r.estado}
                      </span>
                    </div>

                    <p className="text-sm text-ink mt-1">
                      <strong>{formatPrecio(r.importe)}</strong> de señal · {r.metodo_pago}
                      {p?.precio_usd ? <span className="text-ink/60"> · precio {formatPrecio(p.precio_usd)}</span> : null}
                    </p>
                    <p className="text-[11.5px] text-ink/45 mt-0.5">
                      {vista === 'vendedor' && r.perfiles ? `${r.perfiles.nombre || r.perfiles.email || 'Comprador'} · ` : ''}
                      Del {fecha(r.created_at)} · {estado === 'activa' ? `válida hasta ${fecha(r.expira_en)}` : 'a la espera de confirmación'}
                    </p>
                    {etiqueta?.descripcion && <p className="text-[11.5px] text-ink/45 mt-1">{etiqueta.descripcion}</p>}
                    {r.motivo_cancelacion && <p className="text-xs text-clay mt-1">Motivo: {r.motivo_cancelacion}</p>}
                    {r.mensaje && <p className="text-[11.5px] text-ink/45 mt-1 italic">“{r.mensaje}”</p>}

                    <div className="flex flex-wrap gap-2 mt-3">
                      {estado === 'solicitada' && vista === 'vendedor' && (
                        <>
                          <button
                            type="button"
                            onClick={() => confirmar(r, 'confirmar')}
                            disabled={trabajando === r.id}
                            className="inline-flex items-center gap-1.5 bg-signal text-ink text-xs font-semibold px-3 py-2 rounded-lg hover:bg-signal-dark disabled:opacity-50"
                          >
                            {trabajando === r.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                            Confirmar señal
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmar(r, 'rechazar')}
                            disabled={trabajando === r.id}
                            className="inline-flex items-center gap-1.5 border border-clay/30 text-clay text-xs font-semibold px-3 py-2 rounded-lg hover:bg-clay/[0.07] disabled:opacity-50"
                          >
                            <X size={13} /> Rechazar
                          </button>
                        </>
                      )}

                      {['solicitada', 'activa'].includes(estado) && (
                        <button
                          type="button"
                          onClick={() => cancelar(r)}
                          className="inline-flex items-center gap-1.5 border border-line text-ink/60 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-paper-2"
                        >
                          <X size={13} /> Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
