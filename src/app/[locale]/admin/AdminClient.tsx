'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShieldAlert,
  Users,
  ShieldCheck,
  CreditCard,
  History,
  Tag,
  Megaphone,
  Download,
  Settings2,
  LogIn,
  LogOut,
  ArrowLeft,
  Menu,
  X,
  Sparkles,
  Handshake,
  Ticket,
  BarChart3,
  MessageSquare } from 'lucide-react'
import LocalLink from '@/components/LocalLink'
import { useAuth } from '@/components/AuthProvider'
import { ADMIN_EMAILS } from '@/lib/admin-config'
import AdminDashboard from './components/AdminDashboard'
import AdminPublicaciones from './components/AdminPublicaciones'
import AdminUsuarios from './components/AdminUsuarios'
import AdminModeracion from './components/AdminModeracion'
import AdminForo from './components/AdminForo'
import AdminTransacciones from './components/AdminTransacciones'
import AdminAuditoria from './components/AdminAuditoria'
import AdminCategorias from './components/AdminCategorias'
import AdminComunicacion from './components/AdminComunicacion'
import AdminExportar from './components/AdminExportar'
import AdminAjustes from './components/AdminAjustes'
import AdminCupones from './components/AdminCupones'
import AdminAudiencia from './components/AdminAudiencia'
import VerificacionTab from './VerificacionTab'
import AdminReservas from './AdminReservas'
import { Badge } from './components/AdminUi'
import {apiJson, type Perfil } from './components/admin-utils'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Vista general' },
  { id: 'audiencia', label: 'Audiencia', icon: BarChart3, description: 'Visitantes y actividad' },
  { id: 'publicaciones', label: 'Publicaciones', icon: Package, description: 'Gestión de productos' },
  { id: 'moderacion', label: 'Moderación', icon: ShieldAlert, description: 'Reportes y pendientes' },
  { id: 'foro', label: 'Foro', icon: MessageSquare, description: 'Hilos y respuestas' },
  { id: 'usuarios', label: 'Usuarios', icon: Users, description: 'Perfiles y créditos' },
  { id: 'verificacion', label: 'Verificación', icon: ShieldCheck, description: 'Vendedores' },
  { id: 'reservas', label: 'Reservas', icon: Handshake, description: 'Reservas con señal' },
  { id: 'transacciones', label: 'Transacciones', icon: CreditCard, description: 'Pagos y créditos' },
  { id: 'auditoria', label: 'Auditoría', icon: History, description: 'Historial de cambios' },
  { id: 'categorias', label: 'Categorías', icon: Tag, description: 'Organización' },
  { id: 'comunicacion', label: 'Comunicación', icon: Megaphone, description: 'Banners del sitio' },
  { id: 'cupones', label: 'Planes y cupones', icon: Ticket, description: 'Planes, mes gratis, cupones' },
  { id: 'exportar', label: 'Exportar', icon: Download, description: 'CSV y JSON' },
  { id: 'ajustes', label: 'Ajustes', icon: Settings2, description: 'Salud del sistema' },
]

export default function AdminPage() {
  const { user, session, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState('dashboard')
  const [toast, setToast] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [perfiles, setPerfiles] = useState<Record<string, Perfil>>({})
  const [counts, setCounts] = useState({ transacciones: 0, publicaciones: 0, moderacion: 0, verificacion: 0, foro: 0 })
  const navRef = useRef<HTMLElement>(null)

  const isAdmin = ADMIN_EMAILS.includes((user?.email || '').toLowerCase())
  const activeNav = NAV.find((n) => n.id === tab) || NAV[0]

  function notify(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    if (!session || !user) return
    if (!isAdmin) {
      setToast('No tienes permisos de admin')
      setTimeout(() => router.push('/'), 1500)
      return
    }
    const urlTab =
      (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : null) ??
      searchParams?.get('tab')
    if (urlTab && NAV.some((n) => n.id === urlTab)) setTab(urlTab)
  }, [user, session, isAdmin, searchParams, router])

  useEffect(() => {
    const activeBtn = navRef.current?.querySelector<HTMLElement>('[data-active="true"]')
    if (activeBtn && typeof activeBtn.scrollIntoView === 'function') {
      activeBtn.scrollIntoView({ block: 'nearest' })
    }
  }, [tab])

  async function loadPerfiles() {
    try {
      const res = await apiJson<{ ok: boolean; usuarios: Perfil[] }>('/api/admin/usuarios')
      const m: Record<string, Perfil> = {}
      ;(res.usuarios || []).forEach((p) => (m[p.id] = p))
      setPerfiles(m)
    } catch {
      // El panel puede seguir funcionando sin el enriquecimiento.
    }
  }

  async function loadCounts() {
    try {
      const res = await fetch('/api/admin/counts', { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.ok) return
      const c = json.counts || {}
      setCounts({
        transacciones: c.transacciones || 0,
        publicaciones: c.publicaciones || 0,
        moderacion: (c.publicaciones || 0) + (c.denuncias || 0),
        verificacion: c.verificacion || 0,
        foro: c.foro || 0 })
    } catch {
      // Sin contadores la navegación sigue disponible.
    }
  }

  useEffect(() => {
    if (isAdmin && session) {
      loadPerfiles()
      loadCounts()
    }
  }, [isAdmin, session, tab])

  function navigate(next: string) {
    setTab(next)
    setMobileOpen(false)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', next)
      window.history.replaceState(null, '', url.toString())
    }
  }

  async function handleLogout() {
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.auth.signOut()
    } catch {
      // continuar con el logout del servidor
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST', keepalive: true })
    } catch {
      // no crítico
    }
    window.location.href = '/'
  }

  function badgeFor(tabKey: string): number {
    if (tabKey === 'transacciones') return counts.transacciones
    if (tabKey === 'publicaciones') return counts.publicaciones
    if (tabKey === 'moderacion') return counts.moderacion
    if (tabKey === 'verificacion') return counts.verificacion
    if (tabKey === 'foro') return counts.foro
    return 0
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-md px-5 py-24" role="status" aria-live="polite">
        <p className="t-label text-ink/35">Comprobando tu sesión…</p>
        <div className="skeleton mt-5 h-3 w-2/3" />
        <div className="skeleton mt-2 h-3 w-1/3" />
      </div>
    )
  }

  if (!session || !user) {
    return (
      <div className="mx-auto w-full max-w-md px-5 py-20 md:py-28">
        <p className="t-eyebrow text-ink/40">Acceso restringido</p>
        <h1 className="t-display t-display-lg mt-5 text-ink">Inicia sesión para continuar</h1>
        <p className="mt-4 text-[13.5px] leading-relaxed text-muted">
          El panel administrativo está disponible únicamente para usuarios autorizados.
        </p>
        <button
          type="button"
          onClick={() => router.push('/login?redirect=/admin')}
          className="btn btn-ink btn-lg mt-8"
        >
          <LogIn size={14} /> Iniciar sesión
        </button>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto w-full max-w-md px-5 py-20 md:py-28">
        <p className="t-eyebrow text-ink/40">Acceso denegado</p>
        <h2 className="t-display t-display-md mt-5 text-ink">No tienes permisos</h2>
        <p className="mt-3 text-[13.5px] leading-relaxed text-muted">Esta sección es solo para administradores.</p>
        <button onClick={() => router.push('/')} className="btn btn-outline btn-lg mt-8">Volver al inicio</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper">
      {toast && (
        <div role="status" aria-live="polite" aria-atomic="true" className="fixed right-4 top-4 z-[100] max-w-xs border border-ink bg-ink px-4 py-2.5 text-[12.5px] font-medium text-paper">
          {toast}
        </div>
      )}

      {/* mobile top bar */}
      <div className="sticky top-0 z-40 border-b border-ink bg-[#FBFAF5] px-4 py-2 lg:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1.5 text-ink/55 transition-colors hover:text-ink" aria-label="Abrir navegación">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span className="t-label text-ink">{activeNav.label}</span>
          </div>
          <LocalLink href="/" className="t-label text-ink/45 transition-colors hover:text-ink">Ver sitio</LocalLink>
        </div>
        {mobileOpen && (
          <div className="mt-2 grid max-h-[calc(100vh-4rem)] grid-cols-2 gap-1.5 overflow-y-auto overscroll-contain pb-1">
            {NAV.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => navigate(n.id)}
                className={`flex items-center gap-2 border px-2.5 py-2 text-left text-[11.5px] font-medium transition-colors ${tab === n.id ? 'border-ink bg-ink text-paper' : 'border-line bg-paper text-ink/60'}`}
              >
                <n.icon size={13} strokeWidth={1.6} /> {n.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto flex max-w-[1600px]">
        {/* sidebar */}
        <aside
          onWheel={(e) => {
            const nav = navRef.current
            if (!nav || nav.contains(e.target as Node)) return
            nav.scrollTop += e.deltaY
          }}
          className="sticky top-0 hidden h-screen max-h-screen w-64 flex-shrink-0 self-start flex-col overflow-y-auto overscroll-contain border-r border-line bg-[#FBFAF5] px-3 py-5 lg:flex"
        >
          <div className="mb-6 flex shrink-0 items-center gap-3 px-2">
            <span className="flex h-9 w-9 items-center justify-center bg-ink text-paper"><Sparkles size={15} strokeWidth={1.6} /></span>
            <div>
              <p className="text-[12.5px] font-semibold tracking-[-0.01em] text-ink">Admin MaquinariaOcasión</p>
              <p className="t-label mt-0.5 text-ink/35">Control total</p>
            </div>
          </div>

          <nav
            ref={navRef}
            aria-label="Secciones del panel"
            className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1"
          >
            {NAV.map((n) => (
              <button
                key={n.id}
                type="button"
                data-active={tab === n.id ? 'true' : undefined}
                aria-current={tab === n.id ? 'page' : undefined}
                onClick={() => navigate(n.id)}
                className={`group flex w-full items-center gap-2.5 border-l-2 px-2.5 py-2 text-left transition-colors ${tab === n.id ? 'border-ink bg-[#FBFAF5] text-ink' : 'border-transparent text-ink/55 hover:border-line hover:bg-[#FBFAF5] hover:text-ink'}`}
              >
                <n.icon size={14} strokeWidth={1.6} />
                <span className="flex-1">
                  <span className="block text-[12.5px] font-medium">{n.label}</span>
                  <span className={`block text-[10.5px] leading-snug ${tab === n.id ? 'text-ink/45' : 'text-ink/30'}`}>{n.description}</span>
                </span>
                {badgeFor(n.id) ? <Badge tone={tab === n.id ? 'dark' : 'red'}>{badgeFor(n.id)}</Badge> : null}
              </button>
            ))}
          </nav>

          <div className="mt-4 shrink-0 space-y-2 border-t border-line pt-4">
            <div className="border border-line bg-paper px-2.5 py-2">
              <p className="truncate text-[11.5px] font-medium text-ink/70">{user.email}</p>
              <p className="t-label mt-0.5 text-ink/30">Administrador</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => router.push('/')} className="t-label flex flex-1 items-center justify-center gap-1.5 border border-line px-2.5 py-2 text-ink/50 transition-colors hover:border-ink hover:text-ink">
                <ArrowLeft size={11} /> Sitio
              </button>
              <button onClick={handleLogout} className="t-label flex flex-1 items-center justify-center gap-1.5 border border-line px-2.5 py-2 text-ink/50 transition-colors hover:border-clay hover:text-clay">
                <LogOut size={11} /> Salir
              </button>
            </div>
          </div>
        </aside>

        {/* content */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-7 hidden items-end justify-between gap-6 border-b border-ink pb-4 lg:flex">
            <div>
              <p className="t-eyebrow text-ink/40">Administración</p>
              <h1 className="t-display t-display-md mt-3 text-ink">{activeNav.label}</h1>
              <p className="t-label mt-2 text-ink/35">{activeNav.description} · {user.email}</p>
            </div>
            <LocalLink href="/" className="btn btn-outline btn-sm shrink-0">
              <ArrowLeft size={11} /> Volver al sitio
            </LocalLink>
          </div>

          <div className="space-y-4">
            {tab === 'dashboard' && <AdminDashboard notify={notify} jump={navigate} />}
            {tab === 'audiencia' && <AdminAudiencia notify={notify} />}
            {tab === 'publicaciones' && <AdminPublicaciones notify={notify} />}
            {tab === 'moderacion' && <AdminModeracion notify={notify} adminEmail={user.email || ''} />}
            {tab === 'foro' && <AdminForo notify={notify} />}
            {tab === 'usuarios' && <AdminUsuarios notify={notify} />}
            {tab === 'verificacion' && <VerificacionTab notify={notify} />}
            {tab === 'reservas' && <AdminReservas notify={notify} />}
            {tab === 'transacciones' && <AdminTransacciones notify={notify} perfiles={perfiles} onPerfilesChange={setPerfiles} />}
            {tab === 'auditoria' && <AdminAuditoria notify={notify} />}
            {tab === 'categorias' && <AdminCategorias notify={notify} />}
            {tab === 'comunicacion' && <AdminComunicacion notify={notify} />}
            {tab === 'cupones' && <AdminCupones notify={notify} />}
            {tab === 'exportar' && <AdminExportar notify={notify} />}
            {tab === 'ajustes' && <AdminAjustes notify={notify} />}
          </div>
        </main>
      </div>
    </div>
  )
}
