'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Lock, LockOpen, MessageSquare, Trash2, X } from 'lucide-react'
import LocalLink from '@/components/LocalLink'
import {
  Badge, Button, Card, Empty, Loading, RefreshButton, SearchInput, Segmented, timeAgo,
} from './AdminUi'
import { apiJson } from './admin-utils'

type Hilo = {
  id: string
  titulo: string
  cuerpo: string
  estado_moderacion: string | null
  motivo_moderacion: string | null
  cerrado: boolean | null
  mensajes_count: number | null
  actualizado_en: string | null
  creado_en: string | null
  autor: string
  categoria: { nombre_es: string; nombre_en: string; icono: string | null; slug: string } | null
}

type Mensaje = {
  id: string
  hilo_id: string
  cuerpo: string
  creado_en: string | null
  autor: string
  hilo: { id: string; titulo: string } | null
}

/**
 * Pestaña «Foro» del panel admin: cola de moderación de hilos y respuestas
 * con los mismos verbos que el resto del panel (aprobar / cerrar / eliminar),
 * leyendo siempre por API server-side: el RLS público no muestra lo pendiente.
 */
export default function AdminForo({ notify }: { notify: (msg: string) => void }) {
  const [hilos, setHilos] = useState<Hilo[]>([])
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState<'pendientes' | 'respuestas' | 'todos'>('pendientes')
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const json = await apiJson<{ ok: boolean; hilos: Hilo[]; mensajes: Mensaje[] }>('/api/admin/foro', { cache: 'no-store' })
      setHilos(json.hilos || [])
      setMensajes(json.mensajes || [])
    } catch (e: any) {
      notify('❌ ' + (e?.message || 'Error cargando el foro'))
    }
    setLoading(false)
    setRefreshing(false)
  }, [notify])

  useEffect(() => {
    load()
  }, [load])

  async function accion(action: string, id: string, okMsg: string) {
    setBusyId(id)
    try {
      await apiJson('/api/admin/foro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id }),
      })
      notify('✅ ' + okMsg)
      await load(true)
    } catch (e: any) {
      notify('❌ ' + e.message)
    }
    setBusyId(null)
  }

  function eliminarHilo(h: Hilo) {
    if (!window.confirm(`¿Eliminar el hilo «${h.titulo}» y todas sus respuestas? No se puede deshacer.`)) return
    void accion('eliminar', h.id, 'Hilo eliminado')
  }

  function eliminarMensaje(m: Mensaje) {
    if (!window.confirm('¿Eliminar esta respuesta? No se puede deshacer.')) return
    void accion('eliminar-mensaje', m.id, 'Respuesta eliminada')
  }

  const pendientes = useMemo(() => hilos.filter(h => h.estado_moderacion === 'pendiente'), [hilos])

  const filtrados = useMemo(() => {
    const base = tab === 'pendientes' ? pendientes : hilos
    if (!query) return base
    const q = query.toLowerCase()
    return base.filter(h =>
      h.titulo.toLowerCase().includes(q) ||
      h.autor.toLowerCase().includes(q) ||
      (h.categoria?.nombre_es || '').toLowerCase().includes(q),
    )
  }, [hilos, pendientes, query, tab])

  if (loading) return <Loading label="Cargando foro…" />

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><MessageSquare size={22} /></span>
          <div>
            <h2 className="text-xl font-black text-gray-900">Foro</h2>
            <p className="text-sm text-gray-500">{pendientes.length} hilos pendientes · {mensajes.length} respuestas pendientes · {hilos.length} hilos en total</p>
          </div>
        </div>
        <RefreshButton onClick={() => load(true)} loading={refreshing} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          items={[
            { id: 'pendientes' as const, label: `⏳ Pendientes (${pendientes.length})` },
            { id: 'respuestas' as const, label: `💬 Respuestas (${mensajes.length})` },
            { id: 'todos' as const, label: `📄 Todos (${hilos.length})` },
          ]}
          value={tab}
          onChange={setTab}
        />
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar hilos…" className="w-full sm:w-72" />
      </div>

      {tab === 'respuestas' && (
        <div className="space-y-3">
          {mensajes.length === 0 && <Empty icon="✅" title="Sin respuestas pendientes" subtitle="No hay respuestas esperando revisión." />}
          {mensajes.map(m => (
            <Card key={m.id} bodyClassName="p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <LocalLink href={`/foro/hilo/${m.hilo_id}`} target="_blank" rel="noopener noreferrer" className="font-bold text-gray-800 hover:text-brand-primary truncate">
                      {m.hilo?.titulo || 'Hilo'}
                    </LocalLink>
                    <Badge tone="yellow">pendiente</Badge>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{m.autor} · {timeAgo(m.creado_en)}</p>
                  <p className="mt-2 text-sm text-gray-600 whitespace-pre-line line-clamp-4">{m.cuerpo}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="success" disabled={busyId === m.id} onClick={() => accion('aprobar-mensaje', m.id, 'Respuesta aprobada')}>
                    <Check size={14} /> Aprobar
                  </Button>
                  <Button size="sm" variant="danger" disabled={busyId === m.id} onClick={() => eliminarMensaje(m)}>
                    <Trash2 size={14} /> Eliminar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab !== 'respuestas' && (
        <div className="space-y-3">
          {filtrados.length === 0 && (
            <Empty
              icon={tab === 'pendientes' ? '🎉' : '🗂️'}
              title={tab === 'pendientes' ? 'Sin hilos por revisar' : 'Sin resultados'}
              subtitle={tab === 'pendientes' ? 'La cola del foro está limpia.' : 'Prueba con otra búsqueda.'}
            />
          )}
          {filtrados.map(h => (
            <Card key={h.id} bodyClassName="p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <LocalLink href={`/foro/hilo/${h.id}`} target="_blank" rel="noopener noreferrer" className="font-bold text-gray-800 hover:text-brand-primary">
                      <span aria-hidden="true" className="mr-1">{h.categoria?.icono || '💬'}</span>
                      {h.titulo}
                    </LocalLink>
                    {h.estado_moderacion === 'pendiente' && <Badge tone="yellow">pendiente</Badge>}
                    {h.estado_moderacion === 'aprobado' && <Badge tone="green">aprobado</Badge>}
                    {!!h.cerrado && <Badge tone="gray"><Lock size={11} className="mr-1 inline" />cerrado</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {h.categoria?.nombre_es || '—'} · {h.autor} · {timeAgo(h.actualizado_en || h.creado_en)} · {h.mensajes_count || 0} respuestas
                  </p>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{h.cuerpo}</p>
                  {h.motivo_moderacion && h.estado_moderacion === 'pendiente' && (
                    <p className="mt-2 rounded-lg bg-orange-50 px-2.5 py-1.5 text-xs text-orange-700">⚠️ {h.motivo_moderacion}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <LocalLink href={`/foro/hilo/${h.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-gray-300 px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50">
                    Ver
                  </LocalLink>
                  {h.estado_moderacion === 'pendiente' && (
                    <Button size="sm" variant="success" disabled={busyId === h.id} onClick={() => accion('aprobar', h.id, 'Hilo aprobado')}>
                      <Check size={14} /> Aprobar
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === h.id}
                    onClick={() => accion(h.cerrado ? 'abrir' : 'cerrar', h.id, h.cerrado ? 'Hilo reabierto' : 'Hilo cerrado')}
                  >
                    {h.cerrado ? <LockOpen size={14} /> : <Lock size={14} />}
                    {h.cerrado ? 'Abrir' : 'Cerrar'}
                  </Button>
                  <Button size="sm" variant="danger" disabled={busyId === h.id} onClick={() => eliminarHilo(h)}>
                    <X size={14} /> Eliminar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
