'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ShieldCheck,
  ShieldOff,
  CreditCard,
  ExternalLink,
  CheckSquare,
  Square,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Gift } from 'lucide-react'
import { Badge, Button, Card, Confirm, Empty, Loading, Modal, RefreshButton, SearchInput, Segmented, formatDate, formatDateTime, formatNumber } from './AdminUi'
import {apiJson, type Perfil } from './admin-utils'
import RegalarPlanModal from './RegalarPlanModal'
import { diasRestantesDePlan, etiquetaPlan, planVigente } from '@/lib/planes-regalo'

const PAGE_SIZE = 25

const NIVELES = ['', '', '', '', '', '']

const TONO_PACK: Record<string, 'blue' | 'brand' | 'purple'> = {
  starter: 'blue',
  plus: 'brand',
  unlimited: 'purple' }

/** Plan vigente del usuario, con los días que le quedan. */
function PackBadge({ perfil }: { perfil: Perfil }) {
  if (!planVigente(perfil.plan_anuncios, perfil.plan_hasta)) {
    return <span className="t-label text-ink/35">—</span>
  }
  const dias = diasRestantesDePlan(perfil.plan_hasta)
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <Badge tone={TONO_PACK[perfil.plan_anuncios || ''] || 'gray'}>{etiquetaPlan(perfil.plan_anuncios)}</Badge>
      <span className="text-[11.5px] text-ink/35">{dias != null ? `${dias} días` : 'sin caducidad'}</span>
    </span>
  )
}

export default function AdminUsuarios({ notify }: { notify: (msg: string) => void }) {
  const [users, setUsers] = useState<Perfil[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [query, setQuery] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'verificados' | 'no_verificados' | 'con_creditos' | 'sin_creditos' | 'con_pack' | 'sin_pack'>('todos')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [creditModal, setCreditModal] = useState<Perfil | null>(null)
  const [creditTipo, setCreditTipo] = useState<'sumar' | 'restar'>('sumar')
  const [creditCantidad, setCreditCantidad] = useState('')
  const [creditMotivo, setCreditMotivo] = useState('')
  const [creditBusy, setCreditBusy] = useState(false)
  const [regaloModal, setRegaloModal] = useState<Perfil | null>(null)
  const [detail, setDetail] = useState<Perfil | null>(null)
  const [bulkVerify, setBulkVerify] = useState(false)
  const [busyBulk, setBusyBulk] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await apiJson<{ ok: boolean; usuarios: Perfil[] }>('/api/admin/usuarios')
      setUsers(res.usuarios || [])
      setSelected(new Set())
      setPage(1)
    } catch (e: any) {
      notify( e.message)
    }
    setLoading(false)
    setRefreshing(false)
  }, [notify])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    let list = [...users]
    if (filtro === 'verificados') list = list.filter((u) => u.verificado)
    if (filtro === 'no_verificados') list = list.filter((u) => !u.verificado)
    if (filtro === 'con_creditos') list = list.filter((u) => (u.credito_balance || 0) > 0)
    if (filtro === 'sin_creditos') list = list.filter((u) => !(u.credito_balance || 0))
    if (filtro === 'con_pack') list = list.filter((u) => planVigente(u.plan_anuncios, u.plan_hasta))
    if (filtro === 'sin_pack') list = list.filter((u) => !planVigente(u.plan_anuncios, u.plan_hasta))
    if (query) {
      const q = query.toLowerCase()
      list = list.filter((u) =>
        (u.nombre || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.telefono || '').toLowerCase().includes(q) ||
        (u.ciudad || '').toLowerCase().includes(q) ||
        (u.estado || '').toLowerCase().includes(q),
      )
    }
    list.sort((a, b) => new Date(b.creado_en || 0).getTime() - new Date(a.creado_en || 0).getTime())
    return list
  }, [users, query, filtro])

  const pageItems = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const totalCredits = useMemo(() => users.reduce((s, u) => s + (u.credito_balance || 0), 0), [users])

  async function toggleVerificado(u: Perfil, estado: boolean) {
    setBusyId(u.id)
    try {
      await apiJson('/api/admin/toggle-verificado', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: u.id, verificado: estado }) })
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, verificado: estado } : x))
      notify(estado ? ' Usuario verificado' : ' Verificación removida')
    } catch (e: any) {
      notify( e.message)
    }
    setBusyId(null)
  }

  async function ajustarCreditos() {
    if (!creditModal || !creditCantidad || Number(creditCantidad) <= 0) return
    setCreditBusy(true)
    try {
      await apiJson('/api/admin/ajustar-creditos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: creditModal.id,
          cantidad: Number(creditCantidad),
          tipo: creditTipo,
          motivo: creditMotivo || (creditTipo === 'sumar' ? 'Ajuste admin' : 'Descuento admin') }) })
      notify(`Créditos ${creditTipo === 'sumar' ? 'añadidos' : 'descontados'} a ${creditModal.nombre || 'usuario'}`)
      setCreditModal(null)
      setCreditCantidad('')
      setCreditMotivo('')
      await load(true)
    } catch (e: any) {
      notify( e.message)
    }
    setCreditBusy(false)
  }

  async function bulkSetVerificado(estado: boolean) {
    if (!selected.size) return
    setBusyBulk(true)
    let ok = 0
    let fail = 0
    for (const id of Array.from(selected)) {
      try {
        await apiJson('/api/admin/toggle-verificado', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: id, verificado: estado }) })
        ok += 1
      } catch {
        fail += 1
      }
    }
    setBulkVerify(false)
    setSelected(new Set())
    setBusyBulk(false)
    notify(estado ? ` ${ok} usuarios verificados${fail ? ` · ${fail} fallaron` : ''}` : ` ${ok} verificación removida${fail ? ` · ${fail} fallaron` : ''}`)
    await load(true)
  }

  const conPack = users.filter((u) => planVigente(u.plan_anuncios, u.plan_hasta)).length
  const filtros = [
    { id: 'todos' as const, label: `Todos (${users.length})` },
    { id: 'con_pack' as const, label: `Con plan (${conPack})` },
    { id: 'sin_pack' as const, label: `Sin plan (${users.length - conPack})` },
    { id: 'verificados' as const, label: `Verificados (${users.filter((u) => u.verificado).length})` },
    { id: 'no_verificados' as const, label: `Sin verificar (${users.filter((u) => !u.verificado).length})` },
    { id: 'con_creditos' as const, label: `Con créditos (${users.filter((u) => (u.credito_balance || 0) > 0).length})` },
    { id: 'sin_creditos' as const, label: `Sin créditos (${users.filter((u) => !(u.credito_balance || 0)).length})` },
  ]

  if (loading) return <Loading label="Cargando usuarios…" />

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink">Usuarios</h2>
          <p className="text-[13px] leading-relaxed text-ink/55">{formatNumber(filtered.length)} mostrados · {formatNumber(users.length)} registrados · {formatNumber(totalCredits)} créditos emitidos</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-brand-primary/30 bg-ink/5 px-3 py-1.5">
              <span className="t-label text-ink/45">{selected.size} seleccionados</span>
              <Button size="xs" variant="success" onClick={() => setBulkVerify(true)}>Verificar</Button>
              <Button size="xs" variant="ghost" onClick={() => setSelected(new Set())}>Quitar</Button>
            </div>
          )}
          <RefreshButton onClick={() => load(true)} loading={refreshing} />
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented items={filtros} value={filtro} onChange={(v) => { setFiltro(v); setPage(1) }} />
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1) }} placeholder="Nombre, email, teléfono, ciudad…" className="w-full lg:w-80" />
      </div>

      <Card bodyClassName="p-0">
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-paper-2/70 text-xs uppercase tracking-wide text-ink/55">
              <tr>
                <th className="px-4 py-3"><button onClick={() => setSelected((prev) => selected.size === pageItems.length ? new Set() : new Set(pageItems.map((u) => u.id)))} className="flex items-center gap-1 font-semibold">{selected.size === pageItems.length && pageItems.length ? <CheckSquare size={14} /> : <Square size={14} />} All</button></th>
                <th className="px-3 py-3 font-semibold">Usuario</th>
                <th className="px-3 py-3 font-semibold">Contacto</th>
                <th className="px-3 py-3 font-semibold">Ubicación</th>
                <th className="px-3 py-3 text-right font-semibold">Créditos</th>
                <th className="px-3 py-3 text-center font-semibold">Verificado</th>
                <th className="px-3 py-3 font-semibold">Plan</th>
                <th className="px-3 py-3 font-semibold">Nivel</th>
                <th className="px-3 py-3 font-semibold">Registro</th>
                <th className="px-3 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pageItems.map((u) => (
                <tr key={u.id} className="transition hover:bg-paper-2/70">
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected((prev) => { const n = new Set(prev); if (n.has(u.id)) n.delete(u.id); else n.add(u.id); return n })}>
                      {selected.has(u.id) ? <CheckSquare size={17} className="text-ink" /> : <Square size={17} className="text-ink/35" />}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <button onClick={() => setDetail(u)} className="flex items-center gap-3 text-left">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${u.verificado ? 'bg-blue-50 text-ink' : 'bg-paper-2 text-ink/55'}`}>{u.nombre?.slice(0, 1) || '?'}</span>
                      <span>
                        <span className="block font-semibold text-ink hover:text-ink">{u.nombre || 'Sin nombre'}</span>
                        <span className="block t-label text-ink/35">{u.email || '—'}</span>
                      </span>
                    </button>
                  </td>
                  <td className="px-3 py-3 text-[12.5px] text-ink/45">
                    <p>{u.telefono || '—'}</p>
                    {u.verificado && <Badge tone="blue" className="mt-1">Verified</Badge>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-[12.5px] text-ink/45">{[u.ciudad, u.estado].filter(Boolean).join(', ') || '—'}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-ink">{formatNumber(u.credito_balance)}</td>
                  <td className="px-3 py-3 text-center">
                    <button disabled={busyId === u.id} onClick={() => toggleVerificado(u, !u.verificado)} className={`rounded-full px-2 py-1 text-xs font-bold transition ${u.verificado ? 'bg-paper-2 text-ink hover:bg-blue-200' : 'bg-paper-2 text-ink/55 hover:bg-blue-50 hover:text-ink'}`}>
                      {u.verificado ? 'Sí' : 'No'}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <PackBadge perfil={u} />
                  </td>
                  <td className="px-3 py-3 text-center text-lg">{NIVELES[u.nivel_confianza ?? 0] || '—'}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-[12.5px] text-ink/45">{formatDate(u.creado_en)}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setRegaloModal(u)} title="Regalar plan" className="rounded-lg p-1.5 text-ink/35 transition hover:bg-ink/10 hover:text-ink"><Gift size={15} /></button>
                      <button onClick={() => { setCreditModal(u); setCreditTipo('sumar'); setCreditCantidad(''); setCreditMotivo('') }} title="Ajustar créditos" className="rounded-lg p-1.5 text-ink/35 transition hover:bg-moss/10 hover:text-moss"><CreditCard size={15} /></button>
                      <button onClick={() => toggleVerificado(u, !u.verificado)} disabled={busyId === u.id} title={u.verificado ? 'Quitar verificación' : 'Verificar'} className="rounded-lg p-1.5 text-ink/35 transition hover:bg-blue-50 hover:text-ink">{u.verificado ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}</button>
                      <a href={`/vendedor/${u.id}`} target="_blank" rel="noopener noreferrer" title="Ver perfil público" className="rounded-lg p-1.5 text-ink/35 transition hover:bg-blue-50 hover:text-ink"><ExternalLink size={15} /></a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* mobile cards */}
        <div className="divide-y divide-line lg:hidden">
          {pageItems.map((u) => (
            <div key={u.id} className="space-y-2 p-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelected((prev) => { const n = new Set(prev); if (n.has(u.id)) n.delete(u.id); else n.add(u.id); return n })}>{selected.has(u.id) ? <CheckSquare size={18} className="text-ink" /> : <Square size={18} className="text-ink/35" />}</button>
                <span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${u.verificado ? 'bg-blue-50 text-ink' : 'bg-paper-2 text-ink/55'}`}>{u.nombre?.slice(0, 1) || '?'}</span>
                <div className="min-w-0 flex-1">
                  <button onClick={() => setDetail(u)} className="block w-full truncate text-left font-semibold text-ink">{u.nombre || 'Sin nombre'}</button>
                  <p className="truncate text-[12.5px] text-ink/45">{u.email || u.telefono || '—'}</p>
                </div>
                <span className="text-lg font-semibold text-ink">{formatNumber(u.credito_balance)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-[12.5px] text-ink/45">{formatDate(u.creado_en)} · {NIVELES[u.nivel_confianza ?? 0]}</div>
                <div className="flex gap-1">
                  <button onClick={() => setRegaloModal(u)} title="Regalar plan" className="rounded-lg p-2 text-ink/35 hover:bg-ink/10 hover:text-ink"><Gift size={16} /></button>
                  <button onClick={() => toggleVerificado(u, !u.verificado)} disabled={busyId === u.id} className="rounded-lg p-2 text-ink/35 hover:bg-blue-50 hover:text-ink">{u.verificado ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}</button>
                  <button onClick={() => { setCreditModal(u); setCreditTipo('sumar'); setCreditCantidad(''); setCreditMotivo('') }} className="rounded-lg p-2 text-ink/35 hover:bg-moss/10 hover:text-moss"><CreditCard size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {pageItems.length === 0 && <Empty title="No se encontraron usuarios" subtitle="Prueba con otra búsqueda o filtro." />}
      </Card>

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between rounded-2xl border border-line bg-[#FBFAF5] px-4 py-3">
          <p className="text-[12.5px] text-ink/45">Página {page} de {totalPages}</p>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={14} /> Anterior</Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente <ChevronRight size={14} /></Button>
          </div>
        </div>
      )}

      {/* detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.nombre || 'Usuario'} subtitle={detail?.email || ''} size="md">
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-paper-2 p-4 text-sm">
              <div><span className="text-ink/35">Teléfono</span><p className="font-semibold text-ink">{detail.telefono || '—'}</p></div>
              <div><span className="text-ink/35">Ubicación</span><p className="font-semibold text-ink">{[detail.ciudad, detail.estado].filter(Boolean).join(', ') || '—'}</p></div>
              <div><span className="text-ink/35">Créditos</span><p className="font-semibold text-ink">{formatNumber(detail.credito_balance)}</p></div>
              <div><span className="text-ink/35">Nivel</span><p className="font-semibold">{NIVELES[detail.nivel_confianza ?? 0] || '—'}</p></div>
              <div><span className="text-ink/35">Registro</span><p className="font-semibold">{formatDateTime(detail.creado_en)}</p></div>
              <div><span className="text-ink/35">Verificado</span><p className="font-semibold">{detail.verificado ? 'Sí' : 'No'}</p></div>
              <div><span className="text-ink/35">Plan</span><p className="font-semibold"><PackBadge perfil={detail} /></p></div>
              <div><span className="text-ink/35">Tipo de cuenta</span><p className="font-semibold">{detail.tipo_vendedor === 'taller' ? 'Taller' : detail.tipo_vendedor === 'profesional' ? 'Profesional' : 'Particular'}</p></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={detail.verificado ? 'outline' : 'success'} disabled={busyId === detail.id} onClick={() => { toggleVerificado(detail, !detail.verificado); setDetail(null) }}>{detail.verificado ? <><ShieldOff size={14} /> Quitar verificación</> : <><ShieldCheck size={14} /> Verificar</>}</Button>
              <Button size="sm" variant="secondary" onClick={() => { setRegaloModal(detail); setDetail(null) }}><Gift size={14} /> Regalar plan</Button>
              <Button size="sm" variant="secondary" onClick={() => { setCreditModal(detail); setCreditTipo('sumar'); setCreditCantidad(''); setCreditMotivo(''); setDetail(null) }}><CreditCard size={14} /> Ajustar créditos</Button>
              <a href={`/vendedor/${detail.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-line-strong px-3 t-label text-ink/45 transition hover:bg-paper-2"><ExternalLink size={14} /> Ver perfil público</a>
            </div>
          </div>
        )}
      </Modal>

      {/* credits modal */}
      <Modal
        open={!!creditModal}
        onClose={() => setCreditModal(null)}
        title={`Ajustar créditos · ${creditModal?.nombre || 'usuario'}`}
        subtitle={creditModal ? `Balance actual: ${formatNumber(creditModal.credito_balance)}` : ''}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreditModal(null)}>Cancelar</Button>
            <Button variant={creditTipo === 'sumar' ? 'success' : 'danger'} onClick={ajustarCreditos} disabled={!creditCantidad || Number(creditCantidad) <= 0 || creditBusy}>
              {creditBusy ? <RefreshCw className="animate-spin" size={14} /> : null} {creditTipo === 'sumar' ? 'Añadir' : 'Descontar'} {creditCantidad || '?'} créditos
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Segmented items={[{ id: 'sumar' as const, label: ' Añadir' }, { id: 'restar' as const, label: ' Descontar' }]} value={creditTipo} onChange={setCreditTipo} />
          <div>
            <label className="mb-1 block t-label text-ink/45">Cantidad</label>
            <input type="number" min="1" value={creditCantidad} onChange={(e) => setCreditCantidad(e.target.value)} placeholder="Ej: 5" className="w-full field text-[13px] outline-none " autoFocus />
          </div>
          <div>
            <label className="mb-1 block t-label text-ink/45">Motivo (opcional)</label>
            <input type="text" value={creditMotivo} onChange={(e) => setCreditMotivo(e.target.value)} placeholder="Ej: Bonus, corrección…" className="w-full field text-[13px] outline-none " />
          </div>
        </div>
      </Modal>

      <RegalarPlanModal
        usuario={regaloModal}
        onClose={() => setRegaloModal(null)}
        onDone={() => load(true)}
        notify={notify}
      />

      <Confirm
        open={bulkVerify}
        onClose={() => setBulkVerify(false)}
        onConfirm={() => bulkSetVerificado(true)}
        loading={busyBulk}
        title="Verificar usuarios en lote"
        message={`Se marcará como verificados a ${selected.size} usuarios.`}
        confirmLabel="Verificar"
      />
    </div>
  )
}
