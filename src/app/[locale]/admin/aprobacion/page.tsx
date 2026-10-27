'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Check, CheckCircle2, X, Loader2, RefreshCw, Shield } from 'lucide-react'
import LocalLink from '@/components/LocalLink'

const ADMIN_EMAILS = ['gtrespana@gmail.com']

export default function AprobacionPage() {
  const { user, session } = useAuth()
  const router = useRouter()
  const [pendientes, setPendientes] = useState<any[]>([])
  const [procesando, setProcesando] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)

  const isAdmin = ADMIN_EMAILS.includes(user?.email || '')

  useEffect(() => {
    if (!session || !user) return
    if (!isAdmin) {
      setTimeout(() => router.push('/'), 2000)
      return
    }
    cargar()
  }, [user, session, isAdmin, router])

  async function cargar() {
    setCargando(true)
    const response = await fetch('/api/admin/transacciones?estado=pendiente&limit=200')
    const result = await response.json().catch(() => ({}))
    if (!response.ok) {
      console.error('Error:', result.error)
    } else {
      setPendientes(result.transacciones || [])
    }
    setCargando(false)
  }

  async function aprobar(id: string, userId: string, monto: number) {
    setProcesando(id)
    const response = await fetch('/api/admin/aprobar-transaccion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId: id }) })
    setProcesando(null)
    if (!response.ok) {
      const result = await response.json().catch(() => ({}))
      alert(`Error: ${result.error || 'No se pudo aprobar'}`)
    } else {
      // Email notification
      try {
        fetch('/api/email-creditos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, cantidad: monto }) }).catch(() => {})
      } catch {}
      await cargar()
    }
  }

  async function rechazar(id: string) {
    if (!confirm('¿Rechazar esta transacción?')) return
    setProcesando(id)
    const response = await fetch('/api/admin/rechazar-transaccion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId: id }) })
    if (!response.ok) {
      const result = await response.json().catch(() => ({}))
      alert(`Error: ${result.error || 'No se pudo rechazar'}`)
    }
    setProcesando(null)
    await cargar()
  }

  if (!session) return null
  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-ink mb-4"> Acceso denegado</h2>
          <p className="text-ink/55">No tienes permisos.</p>
          <LocalLink href="/" className="mt-4 text-ink hover:underline">Volver</LocalLink>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-signal p-2 rounded-xl">
            <Shield size={20} className="text-ink" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-ink">Aprobación rápida</h1>
            <p className="text-ink/55 text-sm">Revisa comprobantes y aprueba pagos</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={cargar} className="p-2 rounded-lg hover:bg-paper-2 text-ink/55" title="Refrescar">
            <RefreshCw size={16} />
          </button>
          <LocalLink href="/admin" className="text-sm text-ink hover:underline px-3 py-2 bg-[#FBFAF5] rounded-lg border">
             Admin completo
          </LocalLink>
        </div>
      </div>

      {/* Content */}
      {cargando ? (
        <div className="text-center py-20">
          <Loader2 size={32} className="mx-auto text-ink animate-spin" />
          <p className="text-ink/55 mt-4">Cargando...</p>
        </div>
      ) : pendientes.length === 0 ? (
        <div className="bg-[#FBFAF5] rounded-xl p-12 text-center border">
          <p className="mb-4 text-ink/25"><CheckCircle2 size={26} strokeWidth={1.3} /></p>
          <p className="text-lg font-semibold text-ink">No hay pagos pendientes</p>
          <p className="text-ink/55 text-sm mt-2">Todo limpio</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendientes.map((t) => (
            <div key={t.id} className="bg-[#FBFAF5] rounded-xl border border-line p-5 ">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-ink">{t.monto} créditos</span>
                    <span className="bg-signal/15 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-bold">PENDIENTE</span>
                  </div>
                  <p className="text-[12.5px] leading-relaxed text-ink/55"> {t.precio_usd ? `${t.precio_usd} €` : '?'} — {t.metodo_pago || 'N/A'}</p>
                  <p className="text-[11.5px] text-ink/45">{new Intl.DateTimeFormat('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(t.creado_en))} {new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date(t.creado_en))}</p>

                  {/* Comprobante */}
                  {t.comprobante_url && (
                    <div className="mt-3">
                      <a
                        href={`/api/admin/comprobante?url=${encodeURIComponent(t.comprobante_url)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-blue-50 text-ink px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-paper-2 transition border border-line"
                      >
                         Ver comprobante de pago
                      </a>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-2 sm:flex-col">
                  <button
                    onClick={() => aprobar(t.id, t.user_id, t.monto)}
                    disabled={procesando === t.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-paper px-5 py-2.5 rounded-lg font-bold hover:bg-green-600 transition disabled:opacity-50"
                  >
                    {procesando === t.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Aprobar
                  </button>
                  <button
                    onClick={() => rechazar(t.id)}
                    disabled={procesando === t.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-clay/10 text-clay px-5 py-2.5 rounded-lg font-bold hover:bg-red-200 transition disabled:opacity-50"
                  >
                    <X size={16} />
                    Rechazar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
