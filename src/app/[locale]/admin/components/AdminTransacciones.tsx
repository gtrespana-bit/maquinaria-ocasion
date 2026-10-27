'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Check,
  X,
  Eye,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Loader2,
  DollarSign } from 'lucide-react'
import { Badge, Button, Card, Empty, Loading, Modal, RefreshButton, SearchInput, Segmented, formatDateTime, formatMoney, formatNumber } from './AdminUi'
import {apiJson, type Transaccion, type Perfil } from './admin-utils'

const PAGE_SIZE = 20

export default function AdminTransacciones({
  notify,
  perfiles,
  onPerfilesChange }: {
  notify: (msg: string) => void
  perfiles: Record<string, Perfil>
  onPerfilesChange: (perfiles: Record<string, Perfil>) => void
}) {
  const [items, setItems] = useState<Transaccion[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [estado, setEstado] = useState<'pendiente' | 'aprobado' | 'rechazado' | 'todas'>('pendiente')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [detail, setDetail] = useState<Transaccion | null>(null)
  const [enviando, setEnviando] = useState<string | null>(null)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await apiJson<{ transacciones: Transaccion[] }>('/api/admin/transacciones?limit=500')
      const list = res.transacciones || []
      setItems(list)
      // enrich perfiles
      const ids = Array.from(new Set(list.map((t) => t.user_id).filter(Boolean))).slice(0, 100)
      if (ids.length) {
        try {
          const pRes = await apiJson<{ ok: boolean; perfiles: Perfil[] }>('/api/admin/perfiles-ids', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userIds: ids }) })
          const m: Record<string, Perfil> = {}
          ;(pRes.perfiles || []).forEach((p) => (m[p.id] = p))
          onPerfilesChange(m)
        } catch {}
      }
    } catch (e: any) {
      notify( e.message)
    }
    setLoading(false)
    setRefreshing(false)
  }, [notify, onPerfilesChange])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    let list = [...items]
    if (estado !== 'todas') list = list.filter((t) => t.estado === estado)
    if (query) {
      const q = query.toLowerCase()
      list = list.filter((t) =>
        (perfiles[t.user_id]?.nombre || '').toLowerCase().includes(q) ||
        (perfiles[t.user_id]?.email || '').toLowerCase().includes(q) ||
        (t.metodo_pago || '').toLowerCase().includes(q),
      )
    }
    list.sort((a, b) => new Date(b.creado_en || 0).getTime() - new Date(a.creado_en || 0).getTime())
    return list
  }, [items, estado, query, perfiles])

  const pageItems = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  const approved = useMemo(() => items.filter((t) => t.estado === 'aprobado' && t.tipo === 'compra'), [items])
  const ingresos = useMemo(() => approved.reduce((s, t) => s + (Number(t.precio_usd) || 0), 0), [approved])
  const creditosAprobados = useMemo(() => approved.reduce((s, t) => s + Number(t.monto || 0), 0), [approved])

  async function aprobar(t: Transaccion) {
    setBusyId(t.id)
    try {
      await apiJson('/api/admin/aprobar-transaccion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: t.id }) })
      notify(` +${t.monto} créditos aprobados`)

      // notificaciones
      try {
        await fetch('/api/email-creditos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: t.user_id, cantidad: t.monto }) })
        await fetch('/api/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetUserId: t.user_id, titulo: ' Créditos recibidos', cuerpo: `Se aprobaron ${t.monto} créditos en tu cuenta.`, click_url: '/creditos' }) })
      } catch {}
      await load(true)
    } catch (e: any) {
      notify( e.message)
    }
    setBusyId(null)
  }

  async function rechazar(id: string) {
    setBusyId(id)
    try {
      await apiJson('/api/admin/rechazar-transaccion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transactionId: id }) })
      notify('Transacción rechazada')
      setItems((prev) => prev.map((t) => t.id === id ? { ...t, estado: 'rechazado' } : t))
    } catch (e: any) {
      notify( e.message)
    }
    setBusyId(null)
  }

  async function enviarRecordatorio(t: Transaccion) {
    setEnviando(t.id)
    try {
      if (t.metodo_pago && /(bizum|transfer|paypal)/i.test(t.metodo_pago)) {
        await fetch('/api/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUserId: t.user_id, titulo: ' Recordatorio de pago', cuerpo: `Tu compra de ${t.monto} créditos está pendiente de aprobación.`, click_url: '/creditos' }) })
      }
      notify('Recordatorio enviado')
    } catch (e: any) {
      notify( e.message)
    }
    setEnviando(null)
  }

  if (loading) return <Loading label="Cargando transacciones…" />

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink">Transacciones y créditos</h2>
          <p className="text-[12.5px] leading-relaxed text-ink/55">{formatNumber(ingresos)} € aprobados · {formatNumber(creditosAprobados)} créditos emitidos</p>
        </div>
        <RefreshButton onClick={() => load(true)} loading={refreshing} />
      </div>

      {/* metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card bodyClassName="p-4">
          <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-clay/[0.07] text-clay"><Wallet size={17} /></span><div><p className="text-2xl font-semibold text-ink">{items.filter((t) => t.estado === 'pendiente').length}</p><p className="text-[11.5px] text-ink/45">Pendientes</p></div></div>
        </Card>
        <Card bodyClassName="p-4">
          <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-moss/10 text-moss"><Check size={17} /></span><div><p className="text-2xl font-semibold text-ink">{approved.length}</p><p className="text-[11.5px] text-ink/45">Aprobadas</p></div></div>
        </Card>
        <Card bodyClassName="p-4">
          <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-paper-2 text-signal-deep"><CreditCard size={17} /></span><div><p className="text-2xl font-semibold text-ink">{formatMoney(ingresos)}</p><p className="text-[11.5px] text-ink/45">Ingresos (€)</p></div></div>
        </Card>
        <Card bodyClassName="p-4">
          <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-ink"><DollarSign size={17} /></span><div><p className="text-2xl font-semibold text-ink">{formatNumber(creditosAprobados)}</p><p className="text-[11.5px] text-ink/45">Créditos emitidos</p></div></div>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented items={[
          { id: 'pendiente' as const, label: `Pendientes (${items.filter((t) => t.estado === 'pendiente').length})` },
          { id: 'aprobado' as const, label: `Aprobadas (${items.filter((t) => t.estado === 'aprobado').length})` },
          { id: 'rechazado' as const, label: `Rechazadas (${items.filter((t) => t.estado === 'rechazado').length})` },
          { id: 'todas' as const, label: 'Todas' },
        ]} value={estado} onChange={(v) => { setEstado(v); setPage(1) }} />
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1) }} placeholder="Usuario, email, método…" className="w-full sm:w-72" />
      </div>

      <div className="space-y-3">
        {pageItems.length === 0 && <Empty title="No hay transacciones" subtitle="Cambia el filtro o la búsqueda." />}
        {pageItems.map((t) => {
          const perfil = perfiles[t.user_id] || {}
          const pendiente = t.estado === 'pendiente'
          return (
            <Card key={t.id} bodyClassName="p-4" className={pendiente ? 'border-yellow-300' : ''}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 items-start gap-4">
                  <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${pendiente ? 'bg-paper-2 text-signal-deep' : t.estado === 'aprobado' ? 'bg-moss/10 text-moss' : 'bg-clay/[0.07] text-clay'}`}>
                    {pendiente ? <Loader2 size={19} /> : t.estado === 'aprobado' ? <Check size={19} /> : <X size={19} />}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-semibold text-ink">+{t.monto} créditos</span>
                      <Badge tone={pendiente ? 'yellow' : t.estado === 'aprobado' ? 'green' : 'red'}>{t.estado}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] leading-relaxed text-ink/55">
                      <span className="font-semibold text-ink">{perfil.nombre || 'Usuario'}</span>
                      {perfil.email && <span className="text-[11.5px] text-ink/45">{perfil.email}</span>}
                      <span>·</span>
                      <span>{t.metodo_pago || '—'}</span>
                      <span>·</span>
                      <span className="text-xs">{formatDateTime(t.creado_en)}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3">
                      <span className="text-xs font-bold text-moss">{formatMoney(t.precio_usd)} €</span>
                      {t.comprobante_url && (
                        <a href={`/api/admin/comprobante?url=${encodeURIComponent(t.comprobante_url)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-ink hover:underline"><Eye size={13} /> Ver comprobante</a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-shrink-0 flex-wrap gap-2">
                  {pendiente && <Button size="sm" variant="success" disabled={busyId === t.id} onClick={() => aprobar(t)}>{busyId === t.id ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />} Aprobar</Button>}
                  {pendiente && <Button size="sm" variant="danger" disabled={busyId === t.id} onClick={() => rechazar(t.id)}><X size={14} /> Rechazar</Button>}
                  {pendiente && <Button size="sm" variant="outline" disabled={enviando === t.id} onClick={() => enviarRecordatorio(t)}>{enviando === t.id ? <Loader2 className="animate-spin" size={14} /> : <></>} Recordar</Button>}
                  {t.comprobante_url && <Button size="sm" variant="outline" onClick={() => setDetail(t)}><Eye size={14} /> Detalle</Button>}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between rounded-2xl border border-line bg-[#FBFAF5] px-4 py-3">
          <p className="text-[11.5px] text-ink/45">Página {page} de {totalPages}</p>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={14} /> Anterior</Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente <ChevronRight size={14} /></Button>
          </div>
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Detalle de transacción" subtitle={formatDateTime(detail?.creado_en)} size="md">
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-paper-2 p-4 text-sm">
              <div><span className="text-ink/35">Usuario</span><p className="font-semibold">{perfiles[detail.user_id]?.nombre || '—'}</p></div>
              <div><span className="text-ink/35">Créditos</span><p className="font-semibold text-ink">+{detail.monto}</p></div>
              <div><span className="text-ink/35">Precio</span><p className="font-semibold text-moss">{formatMoney(detail.precio_usd)}</p></div>
              <div><span className="text-ink/35">Método</span><p className="font-semibold">{detail.metodo_pago || '—'}</p></div>
              <div><span className="text-ink/35">Estado</span><Badge tone={detail.estado === 'aprobado' ? 'green' : detail.estado === 'pendiente' ? 'yellow' : 'red'}>{detail.estado}</Badge></div>
              <div><span className="text-ink/35">ID</span><p className="break-all text-xs">{detail.id}</p></div>
            </div>
            {detail.comprobante_url && <a href={`/api/admin/comprobante?url=${encodeURIComponent(detail.comprobante_url)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink hover:bg-blue-50"><Eye size={15} /> Abrir comprobante</a>}
            {detail.estado === 'pendiente' && <div className="flex gap-2"><Button variant="success" onClick={() => { aprobar(detail); setDetail(null) }} disabled={busyId === detail.id}><Check size={14} /> Aprobar</Button><Button variant="danger" onClick={() => { rechazar(detail.id); setDetail(null) }} disabled={busyId === detail.id}><X size={14} /> Rechazar</Button></div>}
          </div>
        )}
      </Modal>
    </div>
  )
}
