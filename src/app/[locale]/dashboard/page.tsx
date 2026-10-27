'use client'

import { useEffect, useState, lazy, Suspense } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { useTranslations } from 'next-intl'
import { Plus, X } from 'lucide-react'
import LocalLink from '@/components/LocalLink'
import { routing } from '@/i18n/routing'

import DashboardHeader from './components/DashboardHeader'
import DashboardNav, { normalizarTab, type DashboardTab } from './components/DashboardNav'
import PlanBar from './components/PlanBar'
import TabResumen from './components/TabResumen'
import TabMensajes from './components/tabs/TabMensajes'
import TabCreditos from './components/tabs/TabCreditos'
import TabRendimiento from './components/tabs/TabRendimiento'
import TabImportar from './components/tabs/TabImportar'
import TabFavoritos from './components/tabs/TabFavoritos'
import BoostModal from './components/modals/BoostModal'
import DestacadoModal from './components/modals/DestacadoModal'

const TabProductos = lazy(() => import('./components/tabs/TabProductos'))
const TabTienda = lazy(() => import('./components/tabs/TabTienda'))
const TabTratos = lazy(() => import('./components/tabs/TabTratos'))
const TabCuenta = lazy(() => import('./components/tabs/TabCuenta'))
const TabPlan = lazy(() => import('./components/tabs/TabPlan'))

// Hooks
import { useDashboard } from './hooks/useDashboard'
import { supabase } from '@/lib/supabase'

function PasswordModal({ user, setToast, onClose }: { user: any; setToast: (s: string | null) => void; onClose: () => void }) {
  const t = useTranslations('dashboard')
  const [pwActual, setPwActual] = useState('')
  const [pwNueva, setPwNueva] = useState('')
  const [pwRepetir, setPwRepetir] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwGuardando, setPwGuardando] = useState(false)

  async function handleCambiarPassword(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    if (pwNueva !== pwRepetir) { setPwError(t('pwMismatch')); return }
    if (pwNueva.length < 8) { setPwError(t('pwMinLength')); return }
    setPwGuardando(true)

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: pwActual })
    if (signInError || !signInData.user) {
      setPwError(t('pwWrong'))
      setPwGuardando(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: pwNueva })
    if (error) {
      setPwError(error.message)
    } else {
      setToast(t('pwSuccess'))
    }
    setPwGuardando(false)
    setTimeout(() => setToast(null), 4000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md border border-line bg-paper p-6" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between border-b border-ink pb-3">
          <h3 className="text-[16px] font-semibold tracking-[-0.02em] text-ink">{t('passwordTitle')}</h3>
          <button onClick={onClose} className="text-ink/40 transition-colors hover:text-ink" aria-label="Cerrar"><X size={16} /></button>
        </div>
        {pwError && <div className="mb-4 border border-clay/40 bg-clay/[0.05] px-3 py-2 text-[13px] text-clay">{pwError}</div>}
        <form onSubmit={handleCambiarPassword} className="space-y-4">
          <div>
            <label className="t-label mb-1 block text-ink/45">{t('pwCurrent')}</label>
            <input type="password" value={pwActual} onChange={e => setPwActual(e.target.value)} required className="field text-[13.5px]" placeholder={t('pwCurrentPlaceholder')} />
          </div>
          <div>
            <label className="t-label mb-1 block text-ink/45">{t('pwNew')}</label>
            <input type="password" value={pwNueva} onChange={e => setPwNueva(e.target.value)} required className="field text-[13.5px]" placeholder={t('pwNewPlaceholder')} />
          </div>
          <div>
            <label className="t-label mb-1 block text-ink/45">{t('pwRepeat')}</label>
            <input type="password" value={pwRepetir} onChange={e => setPwRepetir(e.target.value)} required className="field text-[13.5px]" placeholder={t('pwRepeatPlaceholder')} />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn btn-outline flex-1 justify-center">{t('cancelEdit')}</button>
            <button type="submit" disabled={pwGuardando} className="btn btn-ink flex-1 justify-center disabled:opacity-50">{pwGuardando ? t('pwSaving') : t('pwChange')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const { user, session, loading: authLoading } = useAuth()
  const router = useRouter()
  const data = useDashboard()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState<DashboardTab>('resumen')
  const [cambiarPw, setCambiarPw] = useState(false)
  const [abrirEdicion, setAbrirEdicion] = useState(0)
  const [guardandoPerfil, setGuardandoPerfil] = useState(false)
  const [boostTarget, setBoostTarget] = useState<{ productId: string; titulo: string } | null>(null)
  const [destacadoTarget, setDestacadoTarget] = useState<{ productId: string; titulo: string } | null>(null)

  // Read tab from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    if (tab) setActiveTab(normalizarTab(tab))
  }, [])

  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user || !file.type.startsWith('image/')) return
    if (file.size > 2 * 1024 * 1024) { data.setToast(t('imageTooLarge')); return }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', user.id)

    const res = await fetch('/api/foto-perfil', {
      method: 'POST',
      body: formData })
    const json = await res.json()

    if (!res.ok) {
      data.setToast(t('photoError') + json.error)
      return
    }

    data.setFotoUrl(json.url)
  }

  // Build locale-aware redirect path
  const redirectPath = (path: string) => {
    const currentLocale = (() => {
      for (const locale of routing.locales) {
        if (locale === routing.defaultLocale) continue
        if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) return locale
      }
      return routing.defaultLocale
    })()
    if (currentLocale === routing.defaultLocale) return path
    return `/${currentLocale}${path === '/' ? '' : path}`
  }

  async function handleLogout() {
    // ✅ FIX: Call API route to clear server-side cookies,
    // then signOut from singleton to clear localStorage + notify AuthProvider
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Continue even if API call fails
    }
    await supabase.auth.signOut()
    router.push(redirectPath('/'))
  }

  async function handleBoost(productId: string) {
    // Igual que el destacado: el boost lo aplica el servidor y de paso
    // invalida la caché para que el anuncio suba al primer puesto al instante.
    const res = await fetch('/api/productos/promocionar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, tipo: 'boost' }) })
    const result = await res.json().catch(() => ({}))
    if (!res.ok || !result?.ok) {
      data.setToast(`Error: ${result?.error || t('boostError')}`)
    } else {
      data.setCreditos(result.balance)
      data.setToast(t('boostApplied'))
      const { data: prods } = await supabase.from('productos').select('id, slug, titulo, precio_usd, estado, categoria_id, subcategoria, marca, ubicacion_ciudad, activo, visitas, creado_en, imagen_url, destacado, destacado_hasta, boosteado_en, estado_moderacion, vendido, vendido_en, comprador_id, pausado_por_plan').eq('user_id', user!.id).order('creado_en', { ascending: false })
      data.setProductos(prods || [])
    }
    setBoostTarget(null)
    setTimeout(() => data.setToast(null), 4000)
  }

  async function handleDestacar(productId: string, horas: number, incluidoPlan = false) {
    // El cobro va por el servidor: además de descontar los créditos invalida
    // la portada y el catálogo, así que el anuncio aparece destacado al
    // instante (antes el usuario pagaba y seguía viéndolo sin destacar).
    const res = await fetch('/api/productos/promocionar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, tipo: 'destacado', horas, incluidoPlan }) })
    const result = await res.json().catch(() => ({}))
    if (!res.ok || !result?.ok) {
      data.setToast(`Error: ${result?.error || t('featuredError')}`)
    } else {
      data.setCreditos(result.balance)
      data.setToast(t('featuredActivated', { hours: horas }))
      const { data: prods } = await supabase.from('productos').select('id, slug, titulo, precio_usd, estado, categoria_id, subcategoria, marca, ubicacion_ciudad, activo, visitas, creado_en, imagen_url, destacado, destacado_hasta, boosteado_en, estado_moderacion, vendido, vendido_en, comprador_id, pausado_por_plan').eq('user_id', user!.id).order('creado_en', { ascending: false })
      data.setProductos(prods || [])
    }
    setDestacadoTarget(null)
    setTimeout(() => data.setToast(null), 4000)
  }

  if (authLoading) {
    // Show loading state while authentication is being resolved
    return (
      <div className="shell max-w-[1180px] py-10">
        <p className="t-label text-ink/35">Cargando panel…</p>
        <div className="skeleton mt-6 h-16 w-full" />
        <div className="mt-6 grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-6">
          {[0, 1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 bg-paper" />)}
        </div>
        <div className="skeleton mt-6 h-48 w-full" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="shell flex min-h-[52vh] max-w-[640px] flex-col justify-center py-16">
        <div>
          <h2 className="t-display t-display-md text-ink">{t('loginRequired')}</h2>
          <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted">{t('loginRequiredDesc')}</p>
          <LocalLink href="/login" className="btn btn-ink btn-lg mt-6">{t('loginButton')}</LocalLink>
        </div>
      </div>
    )
  }

  const numPubsVendidas = data.productos.filter((p: any) => !p.activo && p.estado_moderacion !== 'rechazado').length

  return (
    <div className="shell max-w-[1180px] py-8 md:py-10">
      {/* Toast */}
      {data.toast && (
        <div className="fixed right-4 top-4 z-50 max-w-xs border border-ink bg-ink px-5 py-3 text-[13px] font-medium text-paper">
          {data.toast}
        </div>
      )}

      {/* Modals */}
      {boostTarget && (
        <BoostModal
          titulo={boostTarget.titulo}
          onClose={() => setBoostTarget(null)}
          onBoost={() => handleBoost(boostTarget.productId)}
        />
      )}
      {destacadoTarget && (
        <DestacadoModal
          titulo={destacadoTarget.titulo}
          creditos={data.creditos}
          onClose={() => setDestacadoTarget(null)}
          onDestacar={(h) => handleDestacar(destacadoTarget.productId, h)}
          onIncluido={() => handleDestacar(destacadoTarget.productId, 168, true)}
        />
      )}
      {cambiarPw && (
        <PasswordModal user={user} setToast={data.setToast} onClose={() => setCambiarPw(false)} />
      )}

      {/* Portada del panel: banda de tinta con lo importante de un vistazo */}
      <section className="mb-6 bg-ink text-paper">
        <div className="flex flex-wrap items-end justify-between gap-5 px-5 py-6 sm:px-7">
          <div>
            <p className="t-label text-paper/45">{t('yourPanel')}</p>
            <h1 className="t-display t-display-md mt-2 text-paper">
              Hola, {(data.nombre || user?.email?.split('@')[0] || '').split(' ')[0] || 'vendedor'}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LocalLink href="/publicar" className="btn btn-signal btn-sm justify-between">
              {t('publishNew')}
              <Plus size={14} strokeWidth={2} />
            </LocalLink>
            <button
              type="button"
              onClick={() => setActiveTab('creditos')}
              className="btn btn-outline-light btn-sm"
            >
              {t('buyCredits')}
            </button>
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-px border-t border-paper/15 bg-paper/15">
          {[
            { valor: data.visitasTotales, etiqueta: t('totalViews') },
            { valor: data.pubCount, etiqueta: t('activeProducts') },
            { valor: data.creditos, etiqueta: t('creditsLabel') },
          ].map(celda => (
            <div key={celda.etiqueta} className="bg-ink px-5 py-4 sm:px-7">
              <dd className="t-display t-num text-[1.85rem] leading-none text-signal">{celda.valor}</dd>
              <dt className="t-label mt-2 text-paper/50">{celda.etiqueta}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* Header */}
      <DashboardHeader
        user={user}
        nombre={data.nombre} setNombre={data.setNombre}
        telefono={data.telefono} setTelefono={data.setTelefono}
        estado={data.estado} setEstado={data.setEstado}
        ciudad={data.ciudad} setCiudad={data.setCiudad}
        tipoVendedor={data.tipoVendedor} setTipoVendedor={data.setTipoVendedor}
        fotoUrl={data.fotoUrl} setFotoUrl={data.setFotoUrl}
        verificado={data.verificado}
        nivelConfianza={data.nivelConfianza}
        resenasCount={data.resenas.length}
        promedioResenas={data.promedioResenas}
        setToast={data.setToast}
        setGuardando={setGuardandoPerfil}
        abrirEdicion={abrirEdicion}
        onFotoChange={handleFoto}
      />

      {/* Estado del plan: visible en todas las pestañas, no solo al quedarse sin cupo. */}
      <PlanBar onAbrirPlan={setActiveTab} />

      {/* Resumen */}
      <section className="mb-6 border border-ink/15 bg-paper shadow-[0_1px_0_rgba(12,14,13,0.06)]" aria-labelledby="rendimiento-titulo">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ink px-5 pb-3 pt-4">
          <h3 id="rendimiento-titulo" className="t-eyebrow text-ink">{t('performance')}</h3>
          <span className="t-label text-ink/35">{t('pubProgress', { count: data.pubCount })}</span>
        </div>
        <dl className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 md:grid-cols-6">
          {[
            { valor: data.visitasTotales, etiqueta: t('totalViews') },
            { valor: data.productos.length ? Math.round(data.visitasTotales / data.productos.length) : 0, etiqueta: t('avgPerProduct') },
            { valor: data.pubCount, etiqueta: t('activeProducts') },
            { valor: data.productos.filter((p: any) => p.boosteado_en || (p.destacado && p.destacado_hasta > new Date().toISOString())).length, etiqueta: t('promotedNow') },
            { valor: data.favoritosCount, etiqueta: t('favorites') },
            { valor: data.creditos, etiqueta: t('creditsLabel') },
          ].map(celda => (
            <div key={celda.etiqueta} className="bg-paper px-4 py-4 transition-colors hover:bg-paper-2/60">
              <dd className="t-display t-num text-[1.9rem] leading-none text-ink">{celda.valor}</dd>
              <dt className="t-label mt-2 text-ink/50">{celda.etiqueta}</dt>
            </div>
          ))}
        </dl>
        <div className="flex flex-col gap-3 border-t border-line px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-ink/60">{t('freeCredit')}</p>
          <div className="flex items-center gap-2.5">
            <span className="t-label text-ink/40">{t('pubProgress', { count: data.pubCount })}</span>
            <div className="h-1 w-24 bg-line">
              <div className="h-1 bg-ink transition-all" style={{ width: `${Math.min((data.pubCount / 10) * 100, 100)}%` }} />
            </div>
          </div>
        </div>
      </section>

      <div className="lg:flex lg:gap-8">
        <DashboardNav active={activeTab} onChange={setActiveTab} onLogout={handleLogout} />
        <div className="flex-1 min-w-0">
          {/* Tab Content */}
          {activeTab === 'resumen' && <TabResumen userId={user!.id} />}
          {activeTab === 'productos' && (
            <Suspense fallback={<div className="border border-line bg-[#FBFAF5] p-12 text-center"><p className="t-label text-ink/40">{t('loadingListings')}</p></div>}>
              <TabProductos
                productos={data.productos}
                onBoost={setBoostTarget}
                onDestacar={setDestacadoTarget}
                userId={user?.id ?? ''}
              />
            </Suspense>
          )}
          {activeTab === 'rendimiento' && (
            <Suspense fallback={<div className="border border-line bg-[#FBFAF5] p-12 text-center"><p className="t-label text-ink/40">Calculando tus métricas…</p></div>}>
              <TabRendimiento />
            </Suspense>
          )}
          {activeTab === 'importar' && (
            <Suspense fallback={<div className="border border-line bg-[#FBFAF5] p-12 text-center"><p className="t-label text-ink/40">Cargando…</p></div>}>
              <TabImportar />
            </Suspense>
          )}
          {activeTab === 'mensajes' && <TabMensajes />}
          {activeTab === 'creditos' && (
            <TabCreditos creditos={data.creditos} refreshCreditos={data.refreshAll} />
          )}
          {activeTab === 'tratos' && (
            <Suspense fallback={<div className="border border-line bg-[#FBFAF5] p-8 text-center"><p className="t-label text-ink/40">Cargando…</p></div>}>
              <TabTratos userId={user!.id} />
            </Suspense>
          )}
          {activeTab === 'tienda' && (
            <Suspense fallback={<div className="border border-line bg-[#FBFAF5] p-8 text-center"><p className="t-label text-ink/40">Cargando…</p></div>}>
              <TabTienda />
            </Suspense>
          )}
          {activeTab === 'favoritos' && <TabFavoritos favoritos={data.favoritos} />}
          {activeTab === 'plan' && (
            <Suspense fallback={<div className="border border-line bg-[#FBFAF5] p-8 text-center"><p className="t-label text-ink/40">Cargando tu plan…</p></div>}>
              <TabPlan onRefresh={data.refreshAll} />
            </Suspense>
          )}
          {activeTab === 'cuenta' && (
            <Suspense fallback={<div className="border border-line bg-[#FBFAF5] p-8 text-center"><p className="t-label text-ink/40">Cargando…</p></div>}>
              <TabCuenta
                verificado={data.verificado}
                nivelConfianza={data.nivelConfianza}
                badgesAuto={data.badgesAuto}
                resenas={data.resenas}
                promedioResenas={data.promedioResenas}
                numPubsActivas={data.pubCount}
                numPubsVendidas={numPubsVendidas}
                creadoEn={data.creadoEn}
                ultimaActividad={data.ultimaActividad}
                onEditarPerfil={() => {
                  setAbrirEdicion(value => value + 1)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                onPassword={() => setCambiarPw(true)}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  )
}
