'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { History, Plus, Trash2, FileSearch, Settings2 } from 'lucide-react'
import { Badge, Button, Card, Empty, Loading, Modal, RefreshButton, SearchInput, Segmented, formatDateTime, formatNumber } from './AdminUi'
import { apiJson } from './admin-utils'

type AuditRow = {
  id: string
  tabla_afectada: string
  operacion: 'INSERT' | 'UPDATE' | 'DELETE'
  usuario_id: string | null
  datos_antiguos: Record<string, any> | null
  datos_nuevos: Record<string, any> | null
  ip_address: string | null
  user_agent: string | null
  fecha_registro: string
}

const DIAS = 30

export default function AdminAuditoria({ notify }: { notify: (msg: string) => void }) {
  const [rows, setRows] = useState<AuditRow[]>([])
  const [resumen, setResumen] = useState<Record<string, Record<string, number>>>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tabla, setTabla] = useState('')
  const [operacion, setOperacion] = useState<'' | 'INSERT' | 'UPDATE' | 'DELETE'>('')
  const [query, setQuery] = useState('')
  const [detail, setDetail] = useState<AuditRow | null>(null)
  const [cleanup, setCleanup] = useState(false)
  const [cleanupBusy, setCleanupBusy] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const params = new URLSearchParams({ limite: '200', dias: String(DIAS) })
      if (tabla) params.set('tabla', tabla)
      if (operacion) params.set('operacion', operacion)
      const [audit, summary] = await Promise.all([
        apiJson<{ ok: boolean; data: AuditRow[] }>(`/api/admin/auditoria?${params.toString()}`),
        apiJson<{ ok: boolean; porTabla: Record<string, Record<string, number>> }>('/api/admin/auditoria/resumen?dias=7'),
      ])
      setRows(audit.data || [])
      setResumen(summary.porTabla || {})
    } catch (e: any) {
      notify( e.message)
    }
    setLoading(false)
    setRefreshing(false)
  }, [tabla, operacion, notify])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    if (!query) return rows
    const q = query.toLowerCase()
    return rows.filter((r) =>
      (r.tabla_afectada || '').toLowerCase().includes(q) ||
      (r.usuario_id || '').toLowerCase().includes(q) ||
      r.operacion.toLowerCase().includes(q),
    )
  }, [rows, query])

  async function runCleanup() {
    setCleanupBusy(true)
    try {
      const res = await apiJson<{ ok: boolean; eliminados: number }>('/api/admin/auditoria/limpiar', { method: 'POST' })
      notify(` ${res.eliminados} registros antiguos limpiados`)
      setCleanup(false)
      await load(true)
    } catch (e: any) {
      notify( e.message)
    }
    setCleanupBusy(false)
  }

  const tablas = Array.from(new Set(rows.map((r) => r.tabla_afectada).filter(Boolean))).sort()

  const resumenTotal = useMemo(() => Object.values(resumen).reduce((s, ops) => s + (ops.INSERT || 0) + (ops.UPDATE || 0) + (ops.DELETE || 0), 0), [resumen])

  if (loading) return <Loading label="Cargando auditoría…" />

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><History size={22} /></span>
          <div>
            <h2 className="text-xl font-semibold text-ink">Auditoría</h2>
            <p className="text-[12.5px] leading-relaxed text-ink/55">{formatNumber(filtered.length)} eventos en los últimos {DIAS} días · {formatNumber(resumenTotal)} esta semana</p>
          </div>
        </div>
        <RefreshButton onClick={() => load(true)} loading={refreshing} />
      </div>

      {/* resumen */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {['productos', 'perfiles', 'transacciones_creditos', 'mensajes'].map((tablaKey) => (
          <Card key={tablaKey} bodyClassName="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/35">{tablaKey}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <Badge tone="green">I {formatNumber(resumen[tablaKey]?.INSERT || 0)}</Badge>
              <Badge tone="yellow">U {formatNumber(resumen[tablaKey]?.UPDATE || 0)}</Badge>
              <Badge tone="red">D {formatNumber(resumen[tablaKey]?.DELETE || 0)}</Badge>
            </div>
          </Card>
        ))}
      </div>

      {/* filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select value={tabla} onChange={(e) => setTabla(e.target.value)} className="h-9 rounded-xl border border-line bg-[#FBFAF5] px-3 text-sm outline-none focus:border-ink">
            <option value="">Todas las tablas</option>
            {tablas.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <Segmented items={[
            { id: '' as const, label: 'Todas' },
            { id: 'INSERT' as const, label: 'Insertar' },
            { id: 'UPDATE' as const, label: 'Actualizar' },
            { id: 'DELETE' as const, label: 'Borrar' },
          ]} value={operacion} onChange={setOperacion} />
        </div>
        <div className="flex gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Filtrar por tabla, usuario…" className="w-full md:w-72" />
          <Button size="sm" variant="outline" onClick={() => setCleanup(true)}><Trash2 size={14} /> Limpiar antiguos</Button>
        </div>
      </div>

      <Card bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-line bg-paper-2/70 text-xs uppercase tracking-wide text-ink/55">
              <tr>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-3 py-3 font-semibold">Tabla</th>
                <th className="px-3 py-3 font-semibold">Operación</th>
                <th className="px-3 py-3 font-semibold">Usuario</th>
                <th className="px-3 py-3 text-right font-semibold">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((r) => (
                <tr key={r.id} className="transition hover:bg-paper-2/70">
                  <td className="whitespace-nowrap px-4 py-3 text-[11.5px] text-ink/45">{formatDateTime(r.fecha_registro)}</td>
                  <td className="px-3 py-3 font-medium text-ink">{r.tabla_afectada}</td>
                  <td className="px-3 py-3"><Badge tone={r.operacion === 'INSERT' ? 'green' : r.operacion === 'UPDATE' ? 'yellow' : 'red'}>{r.operacion}</Badge></td>
                  <td className="px-3 py-3 text-[11.5px] text-ink/45">{r.usuario_id || '—'}</td>
                  <td className="px-3 py-3 text-right"><Button size="xs" variant="outline" onClick={() => setDetail(r)}><FileSearch size={12} /> Ver</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <Empty title="Sin eventos" subtitle="No hay registros con estos filtros." />}
      </Card>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={`${detail?.operacion} · ${detail?.tabla_afectada}`} subtitle={formatDateTime(detail?.fecha_registro)} size="lg">
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-paper-2 p-4 text-sm">
              <div><span className="text-ink/35">Usuario</span><p className="break-all text-xs">{detail.usuario_id || '—'}</p></div>
              <div><span className="text-ink/35">IP</span><p className="font-semibold">{detail.ip_address || '—'}</p></div>
              <div className="col-span-2"><span className="text-ink/35">User agent</span><p className="break-words text-xs">{detail.user_agent || '—'}</p></div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {detail.datos_antiguos && (
                <div>
                  <h4 className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-clay"><Plus className="h-3 w-3 rotate-45" /> Antes</h4>
                  <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-clay/[0.07] p-3 text-[11px] text-clay">{JSON.stringify(detail.datos_antiguos, null, 2)}</pre>
                </div>
              )}
              {detail.datos_nuevos && (
                <div>
                  <h4 className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-moss"><Plus className="h-3 w-3" /> Después</h4>
                  <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-moss/10 p-3 text-[11px] text-moss">{JSON.stringify(detail.datos_nuevos, null, 2)}</pre>
                </div>
              )}
            </div>
            {!detail.datos_antiguos && !detail.datos_nuevos && <p className="text-[12.5px] leading-relaxed text-ink/55">No hay datos adjuntos en este evento.</p>}
          </div>
        )}
      </Modal>

      <Modal open={cleanup} onClose={() => setCleanup(false)} title="Limpiar auditoría antigua" size="sm" footer={<><Button variant="outline" onClick={() => setCleanup(false)}>Cancelar</Button><Button variant="danger" onClick={runCleanup} disabled={cleanupBusy}><Trash2 size={14} /> {cleanupBusy ? 'Limpiando…' : 'Limpiar +90 días'}</Button></>}>
        <div className="text-[12.5px] leading-relaxed text-ink/55">
          <p className="mb-2 flex items-center gap-2"><Settings2 size={16} className="text-indigo-500" /> Eliminará registros de auditoría con más de 90 días para mantener la base ligera.</p>
          <p className="text-[11.5px] text-ink/45">Esta acción no afecta los datos de negocio, únicamente el historial de cambios antiguo.</p>
        </div>
      </Modal>
    </div>
  )
}
