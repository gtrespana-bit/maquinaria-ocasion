'use client'

/**
 * Reservas con señal (Fase 1.2, confirmación del vendedor) — panel admin.
 *
 * El dinero no pasa por la plataforma: el comprador paga la señal directamente
 * al vendedor y es EL VENDEDOR quien la confirma desde su dashboard. Aquí el
 * admin supervisa la actividad y puede cerrar reservas (completar una venta o
 * cancelar con motivo). Ya no hay comprobantes que revisar.
 */

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Loader2, RefreshCw, X } from 'lucide-react'
import { ETIQUETAS_ESTADO_RESERVA, normalizarEstadoReserva, type EstadoReserva} from '@/lib/reservas'
import { apiJson } from './components/admin-utils'

interface Reserva {
  id: string
  producto_id: string
  importe: number
  estado: string
  metodo_pago: string
  comision: number | null
  mensaje: string | null
  motivo_cancelacion: string | null
  expira_en: string
  created_at: string
  revisado_en: string | null
  productos: { id: string; titulo: string | null; precio_usd: number | null; slug: string | null; user_id: string } | null
  comprador: { id: string; nombre: string | null; email: string | null; telefono: string | null } | null
  vendedor: { id: string; nombre: string | null; email: string | null; telefono: string | null } | null
}

interface Stats {
  solicitadas: number
  activas: number
  completadas: number
  total: number
}

type Filtro = 'vivas' | 'solicitadas' | 'activas' | 'todas'

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'vivas', label: 'Vivas' },
  { id: 'solicitadas', label: 'Solicitadas' },
  { id: 'activas', label: 'Activas' },
  { id: 'todas', label: 'Todas' },
]

const fecha = (valor?: string | null) => {
  if (!valor) return '—'
  try {
    return new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(valor))
  } catch {
    return valor
  }
}

export default function AdminReservas({ notify }: { notify: (msg: string) => void }) {
  const [filtro, setFiltro] = useState<Filtro>('vivas')
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [cargando, setCargando] = useState(true)
  const [trabajando, setTrabajando] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [pendienteMigracion, setPendienteMigracion] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/reservas?estado=${filtro}`, { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      if (json.pendienteMigracion) { setPendienteMigracion(true); return }
      if (!res.ok || !json.ok) { setError(json.error || 'No se pudieron cargar las reservas'); return }
      setReservas(json.reservas || [])
      setStats(json.stats || null)
    } catch {
      setError('No se pudieron cargar las reservas')
    } finally {
      setCargando(false)
    }
  }, [filtro])

  useEffect(() => { cargar() }, [cargar])

  async function accion(reserva: Reserva, id: string) {
    let motivo = ''
    if (id === 'cancelar') {
      const entrada = window.prompt('Motivo de la cancelación:')
      if (entrada === null) return
      motivo = entrada.trim()
      if (!motivo) { notify('El motivo es obligatorio'); return }
    }
    setTrabajando(reserva.id)
    try {
      await apiJson('/api/admin/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservaId: reserva.id, accion: id, motivo }) })
      notify('Reserva actualizada')
      await cargar()
    } catch (e: any) {
      notify(e?.message || 'No se pudo actualizar la reserva')
    } finally {
      setTrabajando(null)
    }
  }

  if (pendienteMigracion) {
    return (
      <div className="rounded-xl border border-line bg-signal/10 p-5">
        <h3 className="font-bold text-ink mb-1">Migración de reservas pendiente</h3>
        <p className="text-sm text-ink">
          Aplica <code className="rounded bg-signal/15 px-1">supabase/migrations/202609160001_reservas.sql</code> y{' '}
          <code className="rounded bg-signal/15 px-1">202609170004_reservas_confirmacion_vendedor.sql</code> para
          activar las reservas.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Solicitadas', valor: stats.solicitadas, tono: 'text-amber-700' },
            { label: 'Activas', valor: stats.activas, tono: 'text-moss' },
            { label: 'Completadas', valor: stats.completadas, tono: 'text-ink' },
            { label: 'Total', valor: stats.total, tono: 'text-ink' },
          ].map(c => (
            <div key={c.label} className="rounded-xl border border-line bg-[#FBFAF5] p-3">
              <p className="text-[12.5px] text-ink/45">{c.label}</p>
              <p className={`text-xl font-semibold ${c.tono}`}>{c.valor}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {FILTROS.map(f => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltro(f.id)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              filtro === f.id ? 'border-brand-primary bg-ink text-paper' : 'border-line bg-[#FBFAF5] text-ink/55 hover:bg-paper-2'
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          type="button"
          onClick={cargar}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-line bg-[#FBFAF5] px-3 py-1.5 t-label text-ink/45/55 hover:bg-paper-2"
        >
          <RefreshCw size={13} /> Actualizar
        </button>
      </div>

      {error && <p className="rounded-lg border border-clay/30 bg-clay/[0.07] px-3 py-2 text-sm text-clay">{error}</p>}

      {cargando ? (
        <div className="rounded-xl border border-line bg-[#FBFAF5] p-8 text-center text-ink/55">
          <Loader2 size={20} className="mx-auto animate-spin" />
        </div>
      ) : reservas.length === 0 ? (
        <div className="rounded-xl border border-line bg-[#FBFAF5] p-8 text-center text-ink/55">
          No hay reservas en este filtro.
        </div>
      ) : (
        <div className="space-y-3">
          {reservas.map(r => {
            const estado = normalizarEstadoReserva(r.estado) as EstadoReserva
            const etiqueta = ETIQUETAS_ESTADO_RESERVA[estado]
            const vivas = ['solicitada', 'activa'].includes(estado)
            return (
              <div key={r.id} className="rounded-xl border border-line bg-[#FBFAF5] p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{r.productos?.titulo || 'Anuncio'}</p>
                    <p className="text-[12.5px] text-ink/45">
                      {r.productos?.precio_usd ? `${r.productos.precio_usd} € de precio · ` : ''}
                      Del {fecha(r.created_at)} · {estado === 'activa' ? `expira ${fecha(r.expira_en)}` : 'sin confirmar'}
                    </p>
                  </div>
                  <span className={`rounded-full border px-2 py-1 text-[12px] font-bold ${etiqueta?.tono || 'border-line bg-paper-2'}`}>
                    {etiqueta?.label || r.estado}
                  </span>
                </div>

                <div className="mt-2 grid gap-1 text-xs text-ink sm:grid-cols-2">
                  <p>
                    <strong>{r.importe} €</strong> de señal · {r.metodo_pago}
                    {r.comision ? ` · comisión ${r.comision} €` : ''}
                  </p>
                  <p>
                    Comprador: {r.comprador?.nombre || r.comprador?.email || r.comprador?.id || '—'}
                    {r.comprador?.telefono ? ` (${r.comprador.telefono})` : ''}
                  </p>
                  <p>
                    Vendedor: {r.vendedor?.nombre || r.vendedor?.email || r.vendedor?.id || '—'}
                    {r.vendedor?.telefono ? ` (${r.vendedor.telefono})` : ''}
                  </p>
                  {r.revisado_en && <p>Revisada: {fecha(r.revisado_en)}</p>}
                </div>

                {r.mensaje && <p className="mt-1 text-xs italic text-ink/55">“{r.mensaje}”</p>}
                {r.motivo_cancelacion && <p className="mt-1 text-xs text-clay">Motivo: {r.motivo_cancelacion}</p>}

                <div className="mt-3 flex flex-wrap gap-2">
                  {r.productos?.id && (
                    <a
                      href={`/producto/${r.productos.slug || r.productos.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-3 py-2 t-label text-ink/45 hover:bg-paper-2"
                    >
                      Ver anuncio
                    </a>
                  )}

                  {vivas && (
                    <>
                      <button
                        type="button"
                        onClick={() => accion(r, 'completar')}
                        disabled={trabajando === r.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-bold text-paper hover:bg-brand-dark disabled:opacity-50"
                      >
                        {trabajando === r.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                        Marcar entregada
                      </button>
                      <button
                        type="button"
                        onClick={() => accion(r, 'cancelar')}
                        disabled={trabajando === r.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gray-700 px-3 py-2 text-xs font-bold text-paper hover:bg-ink disabled:opacity-50"
                      >
                        {trabajando === r.id ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
                        Cancelar
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
