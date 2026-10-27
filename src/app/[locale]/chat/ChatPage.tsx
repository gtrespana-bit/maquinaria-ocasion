'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import Avatar from '@/components/Avatar'
import { Send, ArrowLeft, Search, User, Trash2, ExternalLink, Star, MessageSquare } from 'lucide-react'
import LocalLink from '@/components/LocalLink'
import { useTranslations } from 'next-intl'

type Conversacion = {
  id: string
  user1_id: string
  user2_id: string
  producto_id: string | null
  ultimo_mensaje: string | null
  ultimo_mensaje_en: string | null
  creado_en: string
  otro_nombre: string
  otro_foto: string | null
  otro_email: string | null
  producto_titulo: string | null
  no_leidos: number
}

type Mensaje = {
  id: string
  conversacion_id: string
  remitente_id: string
  destinatario_id: string | null
  contenido: string
  leido: boolean
  creado_en: string
}

function formatTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Ahora'
  if (diffMin < 60) return `${diffMin}m`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}d`
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function slugProducto(titulo: string, id: string): string {
  return titulo.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/(^\-|-$)/g, '') + '-' + id.substring(0, 8)
}

export default function ChatPageClient() {
  const t = useTranslations('chat')
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const productoId = searchParams?.get('producto_id')
  const vendedorId = searchParams?.get('vendedor_id')

  const conversationParam = searchParams?.get('conversation')
  const openedLinkRef = useRef('')
  // No cachear conversaciones sin aislarlas por usuario: filtra datos al cambiar de cuenta.
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([])
  const [convId, setConvId] = useState<string | null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [texto, setTexto] = useState('')
  const loadingRef = useRef(false)
  const [busqueda, setBusqueda] = useState('')
  const [showMobileChat, setShowMobileChat] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [reabrirChat, setReabrirChat] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const bcRef = useRef<BroadcastChannel | null>(null)

  const mensajesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const userRef = useRef(user)
  const authIdRef = useRef(user?.id)
  const convIdRef = useRef(convId)
  userRef.current = user
  if (authIdRef.current !== user?.id) {
    authIdRef.current = user?.id
    openedLinkRef.current = ''
  }
  convIdRef.current = convId

  // ─── Estados reseña comprador ───
  const [mostrarResena, setMostrarResena] = useState(false)
  const [ratingResena, setRatingResena] = useState(5)
  const [comentarioResena, setComentarioResena] = useState('')
  const [enviandoResena, setEnviandoResena] = useState(false)
  const [puedeResenar, setPuedeResenar] = useState(false)
  const [productoOwnerId, setProductoOwnerId] = useState<string | null>(null)
  const [yaDejoResena, setYaDejoResena] = useState(false)

  // BroadcastChannel para sincronizar badge con Header
  useEffect(() => {
    if (typeof window === 'undefined') return
    const bc = new BroadcastChannel('maquinariaocasion_unread_sync')
    bcRef.current = bc
    return () => bc.close()
  }, [])

  // ─── Auth guard ───
  useEffect(() => {
    if (authLoading) return
    if (!user) router.push('/login')
  }, [user, authLoading, router])

  // ─── Auto-scroll + focus input when conversation opens ───
  useEffect(() => {
    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' })
  }, [mensajes])

  // Focus input automatically when a conversation is selected / opened
  useEffect(() => {
    if (convId) {
      const tm = setTimeout(() => inputRef.current?.focus(), 120)
      return () => clearTimeout(tm)
    }
  }, [convId])

  // Scroll instantly when conversation changes so input is visible immediately
  useEffect(() => {
    if (convId && chatContainerRef.current) {
      // instant scroll, then smooth will take over for new messages
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [convId])

  // ─── Cargar owner del producto y verificar reseña comprador ───
  useEffect(() => {
    if (!convId || !user) return
    setProductoOwnerId(null)
    setPuedeResenar(false)
    setYaDejoResena(false)

    fetch('/api/chat/review-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ convId, userId: user.id }) })
    .then(async r => {
      const data = await r.json()
      setProductoOwnerId(data.productoOwnerId)
      setPuedeResenar(data.puedeResenar)
      setYaDejoResena(data.yaDejoResena)
    })
    .catch(err => console.error('[REVIEW-STATUS] error:', err))
  }, [convId, user])

  // ─── Cargar conversaciones ───
  const loadConversaciones = useCallback(async () => {
    const uid = userRef.current?.id
    if (!uid) { loadingRef.current = false; return }

    const { data: convs, error } = await supabase
      .from('conversaciones')
      .select('id, user1_id, user2_id, producto_id, ultimo_mensaje_en, ultimo_mensaje')
      .or(`user1_id.eq.${uid},user2_id.eq.${uid}`)
      .order('ultimo_mensaje_en', { ascending: false })

    if (error) { console.error('Error loading convs:', error); return }

    const otroIds = [...new Set(convs?.map((c: any) => c.user1_id === uid ? c.user2_id : c.user1_id).filter(Boolean) || [])]
    const prodIds = [...new Set(convs?.filter((c: any) => c.producto_id).map((c: any) => c.producto_id as string) || [])]

    // Also fetch profiles/products for URL params if they exist
    if (vendedorId && !otroIds.includes(vendedorId)) otroIds.push(vendedorId)
    if (productoId && !prodIds.includes(productoId)) prodIds.push(productoId)

    // Fetch perfiles via API server-side (bypass RLS) / productos via supabase client
    let perfilMap = new Map<string, { nombre: string; foto: string | null; email: string | null }>()
    if (otroIds.length) {
      try {
        const resp = await fetch(`/api/user-bulk?ids=${encodeURIComponent(otroIds.join(','))}`)
        const json = await resp.json()
        json.profiles?.forEach((p: { id: string; nombre: string; foto_perfil_url: string | null }) => {
          perfilMap.set(p.id, { nombre: p.nombre || 'Usuario', foto: p.foto_perfil_url || null, email: null })
        })
      } catch (e) { console.error('Error fetching user-bulk:', e) }
    }
    const [, productosRes] = await Promise.all([
      Promise.resolve(null),
      prodIds.length ? supabase.from('productos').select('id, titulo').in('id', prodIds) : Promise.resolve({ data: [] }),
    ])

    const prodMap = new Map<string, string>()
    productosRes.data?.forEach((p: any) => prodMap.set(p.id, p.titulo || ''))

    // Unread count
    const unreadMap = new Map<string, number>()
    if (convs && convs.length > 0) {
      const { data: unreadData } = await supabase
        .from('mensajes')
        .select('conversacion_id')
        .eq('destinatario_id', uid)
        .eq('leido', false)
        .in('conversacion_id', convs.map((c: any) => c.id))
      unreadData?.forEach((m: { conversacion_id: string }) => {
        const count = unreadMap.get(m.conversacion_id) || 0
        unreadMap.set(m.conversacion_id, count + 1)
      })
    }

    const enriched: Conversacion[] = (convs || []).map((c: any) => {
      const otroId = c.user1_id === uid ? c.user2_id : c.user1_id
      const p = perfilMap.get(otroId)
      return {
        ...c,
        otro_nombre: p?.nombre || 'Usuario',
        otro_foto: p?.foto || null,
        otro_email: p?.email || null,
        producto_titulo: c.producto_id ? (prodMap.get(c.producto_id) || null) : null,
        no_leidos: unreadMap.get(c.id) || 0 }
    })

    if (userRef.current?.id !== uid) return
    setConversaciones(enriched)
    const linkKey = `${uid}:${conversationParam || ''}:${productoId || ''}:${vendedorId || ''}`
    if (openedLinkRef.current === linkKey) return
    openedLinkRef.current = linkKey
    if (conversationParam) {
      const requested = enriched.find(c => c.id === conversationParam)
      if (requested) {
        setMensajes([])
        setConvId(requested.id)
        setShowMobileChat(true)
      }
      return
    }

    // If URL has producto_id + vendedor_id, try to find or create conv
    if (productoId && vendedorId && vendedorId !== uid) {
      // La API decide el destinatario actual, también si existía un chat ficticio.
      try {
        const response = await fetch('/api/crear-conversacion', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vendedorId, productoId }) })
        const result = await response.json().catch(() => ({}))
        if (!response.ok || !result?.id) {
          setToastMsg(result.error || 'No se pudo abrir la conversación')
          openedLinkRef.current = ''
          return
        }
        const recipientId = result.user1_id === uid ? result.user2_id : result.user1_id
        if (!perfilMap.has(recipientId)) {
          const resp = await fetch(`/api/user-bulk?ids=${encodeURIComponent(recipientId)}`)
          const data = await resp.json()
          for (const p of data.profiles || []) {
            perfilMap.set(p.id, { nombre: p.nombre || 'Usuario', foto: p.foto_perfil_url || null, email: null })
          }
        }
        if (userRef.current?.id !== uid) return
        const perfil = perfilMap.get(recipientId)
        setConversaciones(prev => [{
          ...result,
          otro_nombre: perfil?.nombre || 'Usuario',
          otro_foto: perfil?.foto || null,
          otro_email: null,
          producto_titulo: prodMap.get(productoId) || null,
          no_leidos: 0 }, ...prev.filter(c => c.id !== result.id)])
        setConvId(result.id)
        setShowMobileChat(true)
      } catch {
        openedLinkRef.current = ''
        setToastMsg('No hay conexión. Vuelve a intentarlo.')
      }
    }
  }, [productoId, vendedorId, conversationParam])

  useEffect(() => {
    setConversaciones([])
    setMensajes([])
    setConvId(null)
    setReabrirChat(null)
    setToastMsg(null)
    setTexto('')
  }, [user?.id])

  // Load once
  useEffect(() => {
    if (authLoading || !user) return
    loadingRef.current = true
    setLoadingConvs(true)
    loadConversaciones().catch(() => { openedLinkRef.current = ''; setToastMsg('No se pudieron cargar las conversaciones') }).finally(() => { loadingRef.current = false; setLoadingConvs(false) })
  }, [user, authLoading, loadConversaciones])

  // ─── Cargar mensajes ───
  const loadMensajes = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('mensajes')
      .select('id, remitente_id, destinatario_id, contenido, leido, creado_en, conversacion_id')
      .eq('conversacion_id', id)
      .order('creado_en', { ascending: true })

    if (error) { console.error('Error loading msgs:', error); return }
    if (convIdRef.current !== id) return
    setMensajes(data || [])
  }, [])

  // Load messages on mount/conv change (realtime handles live updates)
  useEffect(() => {
    if (!convId) return
    loadMensajes(convId)
  }, [convId, loadMensajes])

  // ─── Realtime: listen for new inserts en mensajes ───
  useEffect(() => {
    if (!user) return
    const sub = supabase
      .channel('chat-msgs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes' }, (payload: any) => {
        const nuevo = payload.new as any
        if (nuevo.conversacion_id === convIdRef.current) {
          setMensajes(prev => {
            if (prev.some(m => m.id === nuevo.id)) return prev
            return [...prev, nuevo]
          })
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [user])

  // También INSERT: una conversación nueva debe aparecer sin recargar la página.
  useEffect(() => {
    if (!user) return
    const sub = supabase.channel('chat-convs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversaciones' }, () => {
        loadConversaciones().catch(() => {})
      })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [user, loadConversaciones])

  // Deep links y mensajes recibidos con el chat abierto también cuentan como leídos.
  useEffect(() => {
    if (!convId || !user) return
    fetch('/api/mensajes-leidos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversacion_id: convId }) }).then(r => {
      if (!r.ok) return
      setConversaciones(prev => prev.map(c => c.id === convId ? { ...c, no_leidos: 0 } : c))
      bcRef.current?.postMessage({ action: 'refresh-unread' })
    }).catch(() => {})
  }, [convId, user, mensajes.length])

  // ─── Seleccionar conversacion ───
  const seleccionarConv = async (id: string) => {
    setConvId(id)
    setMensajes([])
    setReabrirChat(null)
    setShowMobileChat(true)
    // Marcar como leido via API server-side (evita RLS bloqueante)
    try {
      const resp = await fetch('/api/mensajes-leidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversacion_id: id, destinatario_id: user!.id })
      })
      if (resp.ok) {
        // Señal al Header para refrescar badge
        bcRef.current?.postMessage({ action: 'refresh-unread' })
        localStorage.setItem('maquinariaocasion_unread_refresh', Date.now().toString())
      }
    } catch (e) {
      console.error('Error marcando leidos:', e)
    }
    setConversaciones(prev => prev.map(c => c.id === id ? { ...c, no_leidos: 0 } : c))
    await loadMensajes(id)
  }

  // ─── Eliminar conversacion ───
  const eliminarConv = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(t('deleteConversation'))) return
    const response = await fetch('/api/eliminar-conversacion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversacionId: id }) })
    if (!response.ok) {
      const result = await response.json().catch(() => ({}))
      setToastMsg(result.error || 'No se pudo eliminar la conversación')
      setTimeout(() => setToastMsg(null), 4000)
      return
    }
    setConversaciones(prev => prev.filter(c => c.id !== id))
    if (convId === id) {
      setConvId(null)
      setShowMobileChat(false)
      setMensajes([])
    }
  }

  // ─── Enviar reseña comprador → vendedor ───
  const enviarResenaComprador = async () => {
    if (!convId || !user || enviandoResena || !productoOwnerId) return
    const conv = conversaciones.find(c => c.id === convId)
    if (!conv || !conv.producto_id) return

    setEnviandoResena(true)
    try {
      const resp = await fetch('/api/admin/enviar-resena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluador_id: user.id,
          evaluado_id: productoOwnerId,
          producto_id: conv.producto_id,
          puntuacion: ratingResena,
          comentario: comentarioResena.trim() || null }) })
      const json = await resp.json()
      if (!resp.ok) {
        console.error('Error enviando reseña:', json)
        alert(t('reviewError') + (json.error || json._error || ''))
        setEnviandoResena(false)
        return
      }
      setMostrarResena(false)
      setYaDejoResena(true)
      setComentarioResena('')
      setRatingResena(5)
    } catch (e) {
      console.error('Error enviando reseña:', e)
      alert(t('connectionError'))
    }
    setEnviandoResena(false)
  }

  // ─── Enviar mensaje ───
  const enviarMensaje = async () => {
    const msg = texto.trim()
    if (!msg || !convId || !user || enviando) return
    setEnviando(true)

    // Get conversation to find recipient
    const conv = conversaciones.find(c => c.id === convId)
    if (!conv) { console.error('ChatPage: conversacion no encontrada', convId); setEnviando(false); return }
    const destinatarioId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id

    try {
      const response = await fetch('/api/enviar-mensaje', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversacion_id: convId, destinatario_id: destinatarioId, contenido: msg }) })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        if (result.code === 'CONVERSACION_SEMILLA_CERRADA') setReabrirChat(result.reabrir)
        setToastMsg(result.error || 'No se pudo enviar. Inténtalo de nuevo.')
        return
      }
      setTexto('')
      await loadMensajes(convId)
      // keep focus on input after sending
      setTimeout(() => inputRef.current?.focus(), 0)
    } catch {
      setToastMsg('No hay conexión. Tu mensaje no se ha borrado; puedes reintentarlo.')
    } finally {
      setEnviando(false)
    }
  }

  // ─── Loading ───
  if (authLoading || !user) {
    return (
      <div className="mx-auto flex h-[calc(100dvh-56px-4rem)] max-w-[1180px] flex-col gap-4 px-5 py-4 md:h-[calc(100dvh-100px)] md:max-h-[820px] md:px-8">
        <p className="t-eyebrow shrink-0 border-b border-ink pb-3 text-ink">Mensajes</p>
        <div className="flex flex-1 flex-col gap-3 border border-line bg-[#FBFAF5] p-4">
          <p className="t-label text-ink/30">Cargando conversaciones…</p>
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton h-9 w-9" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-2.5 w-1/3" />
                <div className="skeleton h-2.5 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const filtradas = conversaciones.filter(c =>
    c.otro_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.producto_titulo?.toLowerCase() ?? '').includes(busqueda.toLowerCase())
  )
  const convActual = conversaciones.find(c => c.id === convId)

  return (
    <div className="mx-auto flex h-[calc(100dvh-56px-4rem)] max-w-[1180px] flex-col gap-3 px-5 py-4 md:h-[calc(100dvh-100px)] md:max-h-[820px] md:px-8">
      {toastMsg && (
        <div role="alert" className="flex shrink-0 items-center justify-between border border-clay/40 bg-clay/[0.06] px-3 py-2 text-[12.5px] text-clay">
          <span>{toastMsg}</span>
          <button type="button" onClick={() => setToastMsg(null)} className="t-label ml-3 shrink-0 underline underline-offset-4">Cerrar</button>
        </div>
      )}
      {reabrirChat && (
        <div className="shrink-0 border border-line bg-paper-2 px-3 py-2 text-[12.5px] text-ink/60">
          El historial se conserva aquí. Las nuevas consultas las atiende MaquinariaOcasión.
          <LocalLink href={reabrirChat} className="ml-2 font-medium text-ink underline underline-offset-4">Abrir chat con el equipo</LocalLink>
        </div>
      )}
      <div className="flex shrink-0 items-end justify-between gap-4 border-b border-ink pb-3">
        <h1 className="t-display t-display-md text-ink">Mensajes</h1>
        <span className="t-label pb-1 text-ink/30">{conversaciones.length} conversaciones</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden border border-line bg-[#FBFAF5]">
        <div className="flex flex-col md:flex-row flex-1 min-h-0">
          {/* ─── Sidebar ─── */}
          <div className={`${showMobileChat ? 'hidden md:flex' : 'flex'} min-h-0 w-full flex-col border-r border-line bg-[#FBFAF5] md:w-[300px]`}>
            <div className="shrink-0 border-b border-line p-2.5">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink/35" aria-hidden="true" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar conversación…"
                  className="field h-9 pl-8 text-[12.5px]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {loadingConvs && conversaciones.length === 0 ? (
                <div className="space-y-4 p-3">
                  {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="skeleton h-9 w-9 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="skeleton h-2.5 w-3/4" />
                        <div className="skeleton h-2.5 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filtradas.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
                  <User size={22} strokeWidth={1.3} className="mb-3 text-ink/20" aria-hidden="true" />
                  <p className="text-[12.5px] font-medium text-ink/70">{conversaciones.length === 0 ? 'No hay conversaciones' : 'Sin resultados'}</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-ink/40">Envía un mensaje a un vendedor desde cualquier anuncio</p>
                </div>
              ) : (
                filtradas.map(c => (
                  <div
                    key={c.id}
                    className={`group relative flex w-full items-start gap-3 border-b border-line border-l-2 p-3 text-left transition-colors ${convId === c.id ? 'border-l-ink bg-signal/15' : 'border-l-transparent bg-[#FBFAF5] hover:bg-paper-2'}`}
                  >
                    <button
                      onClick={(e) => eliminarConv(c.id, e)}
                      className="absolute right-1 top-1 p-1 text-ink/25 opacity-0 transition hover:text-clay group-hover:opacity-100"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={() => seleccionarConv(c.id)}
                      className="flex items-start gap-3 w-full cursor-pointer text-left"
                    >
                      <Avatar nombre={c.otro_nombre} fotoUrl={c.otro_foto} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="truncate text-[12.5px] font-semibold text-ink">{c.otro_nombre}</p>
                          {c.ultimo_mensaje_en && (
                            <span className="t-num ml-2 shrink-0 text-[10px] text-ink/35">{formatTime(c.ultimo_mensaje_en)}</span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-[11.5px] text-ink/50">{c.ultimo_mensaje || 'Sin mensajes'}</p>
                        {c.producto_titulo && c.producto_id && (
                          <a
                            href={`/producto/${c.producto_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex max-w-[92%] items-center gap-1 truncate text-[10.5px] text-ink/40 hover:text-ink hover:underline"
                            onClick={(e) => e.stopPropagation()}
                            title={t('viewProductNewTab')}
                          >
                            {c.producto_titulo}
                          </a>
                        )}
                      </div>
                      {c.no_leidos > 0 && (
                        <span className="t-num flex h-5 min-w-5 shrink-0 items-center justify-center bg-ink px-1 text-[10px] text-paper">{c.no_leidos}</span>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ─── Chat ─── */}
          <div className={`${showMobileChat ? 'flex' : 'hidden md:flex'} min-h-0 flex-1 flex-col bg-paper`}>
            {!convId ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <MessageSquare size={24} strokeWidth={1.2} className="mb-3 text-ink/20" aria-hidden="true" />
                <p className="text-[12.5px] font-medium text-ink/70">Selecciona una conversación</p>
                <p className="mt-1 text-[11.5px] text-ink/40">O escribe a un vendedor desde un anuncio</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex shrink-0 items-center gap-3 border-b border-line bg-[#FBFAF5] px-3 py-2.5 md:px-4">
                  <button onClick={() => setShowMobileChat(false)} className="-ml-1 p-1.5 text-ink/50 transition-colors hover:text-ink md:hidden">
                    <ArrowLeft size={16} />
                  </button>
                  {convActual && (
                    <>
                      <Avatar nombre={convActual.otro_nombre} fotoUrl={convActual.otro_foto} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-ink">{convActual.otro_nombre}</p>
                        {convActual.producto_titulo && convActual.producto_id && (
                          <LocalLink
                            href={`/producto/${convActual.producto_id}`}
                            className="flex items-center gap-1 truncate text-[10.5px] text-ink/45 transition-colors hover:text-ink"
                          >
                            <span className="truncate">{convActual.producto_titulo}</span>
                            <ExternalLink size={9} className="shrink-0" />
                          </LocalLink>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Mensajes - flex-1 scrollable */}
                <div ref={chatContainerRef} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto bg-paper p-3 md:p-4">
                  {mensajes.map(m => {
                    const esMio = m.remitente_id === user?.id
                    return (
                      <div key={m.id} className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[78%] px-3.5 py-2.5 ${esMio ? 'bg-ink text-paper' : 'border border-line bg-[#FBFAF5] text-ink'}`}>
                          <p className="whitespace-pre-wrap break-words text-[13.5px] leading-[1.5]">{m.contenido}</p>
                          <p className={`t-num mt-1 text-[9.5px] ${esMio ? 'text-paper/45' : 'text-ink/35'}`}>
                            {formatHora(m.creado_en)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  {puedeResenar && (
                    <div className="flex justify-center pt-2">
                      <button
                        onClick={() => setMostrarResena(true)}
                        className="btn btn-signal btn-sm inline-flex items-center gap-2"
                      >
                        <Star size={11} /> Deja tu reseña al vendedor
                      </button>
                    </div>
                  )}
                  {enviando && (
                    <div className="flex justify-end">
                      <div className="bg-ink/60 px-3.5 py-2.5 text-[12.5px] text-paper">
                        Enviando…
                      </div>
                    </div>
                  )}
                  <div ref={mensajesEndRef} />
                </div>

                {/* Input - ALWAYS VISIBLE, shrink-0, prominent */}
                <div className="z-10 shrink-0 border-t border-line bg-[#FBFAF5] p-2.5 md:p-3">
                  {/* Respuestas rápidas (patrón marketplace): completan el
                      redactor con un toque; nunca se envían solas. */}
                  <div
                    className="hide-scrollbar flex gap-1.5 overflow-x-auto pb-2.5"
                    role="group"
                    aria-label={t('quickReplies.title')}
                  >
                    {(['available', 'negotiable', 'delivery', 'visit'] as const).map(k => (
                      <button
                        key={k}
                        type="button"
                        disabled={enviando}
                        onClick={() => {
                          setTexto(prev => (prev.trim() ? `${prev.trim()} ` : '') + t(`quickReplies.${k}`))
                          inputRef.current?.focus()
                        }}
                        className="t-label shrink-0 whitespace-nowrap border border-line bg-paper px-2.5 py-1.5 text-ink/55 transition-colors hover:border-ink hover:bg-signal hover:text-ink disabled:opacity-50"
                      >
                        {t(`quickReplies.${k}`)}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-end gap-2 md:gap-3">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={texto}
                      onChange={e => setTexto(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensaje() } }}
                      placeholder={t('typeMessage')}
                      className="field h-11 text-[13.5px] disabled:opacity-50"
                      disabled={enviando}
                      autoComplete="off"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={enviarMensaje}
                    disabled={!texto.trim() || enviando}
                    className="flex h-11 w-11 shrink-0 items-center justify-center bg-ink text-paper transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Enviar mensaje"
                  >
                    {enviando ? (
                      <div className="h-4 w-4 animate-spin border border-paper/40 border-t-paper" />
                    ) : (
                      <Send size={15} />
                    )}
                  </button>
                  </div>
                </div>

                {/* ─── Modal reseña comprador ─── */}
                {mostrarResena && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="resena-titulo"
                    tabIndex={-1}
                    onKeyDown={(e) => { if (e.key === 'Escape') setMostrarResena(false) }}
                    onClick={() => setMostrarResena(false)}
                  >
                    <div className="w-full max-w-md border border-line-strong bg-[#FBFAF5] p-6" onClick={e => e.stopPropagation()}>
                      <h3 id="resena-titulo" className="text-[15px] font-semibold tracking-[-0.015em] text-ink">Deja tu reseña</h3>
                      <p className="mb-4 mt-1 text-[12.5px] text-ink/50">¿Cómo fue tu experiencia con {convActual?.otro_nombre}?</p>

                      <div className="flex justify-center gap-1 mb-4">
                        {[1,2,3,4,5].map(i => (
                          <button key={i} type="button" onClick={() => setRatingResena(i)} className="transition hover:scale-110">
                            <Star size={24} className={i <= ratingResena ? 'fill-signal text-ink' : 'text-line-strong'} />
                          </button>
                        ))}
                      </div>

                      <textarea
                        value={comentarioResena}
                        onChange={e => setComentarioResena(e.target.value)}
                        maxLength={500}
                        placeholder={t('reviewPlaceholder')}
                        className="field mb-4 h-24 resize-none text-[13px]"
                      />
                      <p className="t-label -mt-3 mb-4 text-right text-ink/30">{comentarioResena.length}/500</p>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setMostrarResena(false)}
                          className="btn btn-outline flex-1 justify-center"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={enviarResenaComprador}
                          disabled={enviandoResena}
                          className="btn btn-ink flex-1 justify-center disabled:opacity-50"
                        >
                          {enviandoResena ? t('sending') : t('sendReview')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
