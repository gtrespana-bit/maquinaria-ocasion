'use client'

import { useCallback, useEffect, useState } from 'react'
import { Megaphone, Plus, Pause, Play, Trash2, Send, Link2 } from 'lucide-react'
import { Badge, Button, Card, Empty, Loading, Modal, RefreshButton, formatDate, formatDateTime } from './AdminUi'
import {apiJson, type AnuncioGlobal } from './admin-utils'

export default function AdminComunicacion({ notify }: { notify: (msg: string) => void }) {
  const [items, setItems] = useState<AnuncioGlobal[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [edit, setEdit] = useState<AnuncioGlobal | null>(null)
  const [form, setForm] = useState({
    titulo: '',
    mensaje: '',
    emoji: '',
    enlace: '',
    enlace_texto: '',
    expira_en: '',
    activo: true })
  const [busy, setBusy] = useState(false)
  const [deleteItem, setDeleteItem] = useState<AnuncioGlobal | null>(null)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await apiJson<{ ok: boolean; anuncios: AnuncioGlobal[] }>('/api/admin/anuncios')
      setItems(res.anuncios || [])
    } catch (e: any) {
      notify( e.message)
    }
    setLoading(false)
    setRefreshing(false)
  }, [notify])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setForm({ titulo: '', mensaje: '', emoji: '', enlace: '', enlace_texto: '', expira_en: '', activo: true })
    setCreateOpen(true)
  }

  function openEdit(a: AnuncioGlobal) {
    setForm({
      titulo: a.titulo || '',
      mensaje: a.mensaje || '',
      emoji: a.emoji || '',
      enlace: a.enlace || '',
      enlace_texto: a.enlace_texto || '',
      expira_en: a.expira_en ? a.expira_en.slice(0, 10) : '',
      activo: !!a.activo })
    setEdit(a)
  }

  async function save() {
    if (!form.titulo.trim() || !form.mensaje.trim()) {
      notify('Título y mensaje son obligatorios')
      return
    }
    setBusy(true)
    const body = {
      titulo: form.titulo.trim(),
      mensaje: form.mensaje.trim(),
      emoji: form.emoji || '',
      enlace: form.enlace.trim() || null,
      enlace_texto: form.enlace_texto.trim() || null,
      expira_en: form.expira_en ? new Date(`${form.expira_en}T23:59:59`).toISOString() : null,
      activo: form.activo }
    try {
      if (edit) {
        await apiJson(`/api/admin/anuncios?id=${edit.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        notify('Anuncio actualizado')
      } else {
        await apiJson('/api/admin/anuncios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        notify('Anuncio publicado en el sitio')
      }
      setCreateOpen(false)
      setEdit(null)
      await load(true)
    } catch (e: any) {
      notify( e.message)
    }
    setBusy(false)
  }

  async function toggleActivo(a: AnuncioGlobal) {
    setBusy(true)
    try {
      await apiJson(`/api/admin/anuncios?id=${a.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activo: !a.activo }) })
      notify(a.activo ? ' Anuncio desactivado' : ' Anuncio activado')
      await load(true)
    } catch (e: any) {
      notify( e.message)
    }
    setBusy(false)
  }

  async function borrar() {
    if (!deleteItem) return
    setBusy(true)
    try {
      await apiJson(`/api/admin/anuncios?id=${deleteItem.id}`, { method: 'DELETE' })
      notify('Anuncio eliminado')
      setDeleteItem(null)
      await load(true)
    } catch (e: any) {
      notify( e.message)
    }
    setBusy(false)
  }

  if (loading) return <Loading label="Cargando comunicaciones…" />

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink/10 text-ink"><Megaphone size={22} /></span>
          <div>
            <h2 className="text-xl font-semibold text-ink">Comunicación</h2>
            <p className="text-[13px] leading-relaxed text-ink/55">Banners del sitio · {items.filter((a) => a.activo).length} activos</p>
          </div>
        </div>
        <div className="flex gap-2">
          <RefreshButton onClick={() => load(true)} loading={refreshing} />
          <Button onClick={openCreate}><Plus size={15} /> Nuevo anuncio</Button>
        </div>
      </div>

      {/* preview */}
      <Card title="Vista previa del banner" subtitle="Así lo verán los usuarios en el sitio" bodyClassName="p-4">
        <div className="on-dark flex items-center gap-3 bg-ink px-4 py-2.5 text-paper">
          <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 bg-signal" />
          <p className="min-w-0 flex-1 text-[13px] leading-snug text-paper/80">
            <span className="t-label mr-2 text-signal">{form.titulo || 'Título del anuncio'}</span>
            {form.mensaje || 'Mensaje que verán los usuarios…'}
            {form.enlace && (
              <span className="ml-2 border-b border-signal/60 font-medium text-paper">
                {form.enlace_texto || 'Ver más'}
              </span>
            )}
          </p>
        </div>
      </Card>

      <div className="space-y-3">
        {items.length === 0 && <Empty title="Sin anuncios" subtitle="Crea un banner global para informar a toda la comunidad." action={<Button onClick={openCreate}><Plus size={15} /> Crear el primero</Button>} />}
        {items.map((a) => (
          <Card key={a.id} bodyClassName="p-4" className={a.activo ? 'border-ink/40' : ''}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 items-start gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13.5px] font-semibold text-ink">{a.titulo}</p>
                    <Badge tone={a.activo ? 'green' : 'gray'}>{a.activo ? 'Activo' : 'Pausado'}</Badge>
                    {a.expira_en && <Badge tone="yellow">expira {formatDate(a.expira_en)}</Badge>}
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink/55">{a.mensaje}</p>
                  {a.enlace && <a href={a.enlace} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 t-label text-ink/45 hover:underline"><Link2 size={12} /> {a.enlace_texto || a.enlace}</a>}
                  <p className="mt-1 t-label text-ink/35">{formatDateTime(a.creado_en)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant="outline" onClick={() => openEdit(a)}><Send size={13} /> Editar</Button>
                <Button size="sm" variant={a.activo ? 'outline' : 'success'} disabled={busy} onClick={() => toggleActivo(a)}>{a.activo ? <Pause size={13} /> : <Play size={13} />} {a.activo ? 'Pausar' : 'Activar'}</Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleteItem(a)}><Trash2 size={13} /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={createOpen || !!edit} onClose={() => { setCreateOpen(false); setEdit(null) }} title={edit ? 'Editar anuncio' : 'Nuevo anuncio global'} subtitle="Aparecerá en la parte superior del sitio" size="lg" footer={<><Button variant="outline" onClick={() => { setCreateOpen(false); setEdit(null) }}>Cancelar</Button><Button onClick={save} disabled={busy}><Send size={15} /> {edit ? 'Guardar' : 'Publicar'}</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="t-label mb-1.5 block text-ink/45">Título *</label>
            <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="field text-[13px]" />
          </div>
          <div className="sm:col-span-2">
            <label className="t-label mb-1.5 block text-ink/45">Mensaje *</label>
            <textarea rows={3} value={form.mensaje} onChange={(e) => setForm({ ...form, mensaje: e.target.value })} className="field text-[13px]" />
          </div>
          <div>
            <label className="t-label mb-1.5 block text-ink/45">Enlace (opcional)</label>
            <input value={form.enlace} onChange={(e) => setForm({ ...form, enlace: e.target.value })} placeholder="https://..." className="field text-[13px]" />
          </div>
          <div>
            <label className="t-label mb-1.5 block text-ink/45">Texto del enlace</label>
            <input value={form.enlace_texto} onChange={(e) => setForm({ ...form, enlace_texto: e.target.value })} placeholder="Ej: Ver detalles" className="field text-[13px]" />
          </div>
          <div>
            <label className="t-label mb-1.5 block text-ink/45">Expira (opcional)</label>
            <input type="date" value={form.expira_en} onChange={(e) => setForm({ ...form, expira_en: e.target.value })} className="field text-[13px]" />
          </div>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} className="h-4 w-4 rounded border-line-strong text-ink" />
            <span className="text-[13px] font-medium text-ink">Publicar activo de inmediato</span>
          </label>
        </div>
      </Modal>

      <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="Eliminar anuncio" size="sm" footer={<><Button variant="outline" onClick={() => setDeleteItem(null)}>Cancelar</Button><Button variant="danger" onClick={borrar} disabled={busy}><Trash2 size={14} /> Eliminar</Button></>}>
        <p className="text-[13px] leading-relaxed text-ink/55">Se eliminará el anuncio <strong>{deleteItem?.titulo}</strong>. Esta acción no puede deshacerse.</p>
      </Modal>
    </div>
  )
}
