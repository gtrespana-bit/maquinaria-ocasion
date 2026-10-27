'use client'

import LocalLink from '@/components/LocalLink'
import SiteAnnouncement from '@/components/SiteAnnouncement'
import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import {
  Menu,
  X,
  Search,
  MessageCircle,
  Zap,
  ChevronDown,
  ArrowRight,
  ArrowUpRight,
  Plus,
  Globe } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import BrandLogo from '@/components/BrandLogo'
import Avatar from '@/components/Avatar'
import { useTranslations } from 'next-intl'
import { TODAS_LAS_SUBS, FAMILIAS } from '@/lib/categorias'
import { enlaceCambioIdioma } from '@/lib/locale-path'

/**
 * Cabecera.
 *
 * Tres capas, como una publicación técnica: barra de utilidad (tinta), barra
 * principal (papel, sticky) y raíl de taxonomía (familias → tipos). El
 * mega-menú de «Comprar» abre un panel de ancho completo con las tres familias
 * y una llamada al tasador.
 */
export function Header() {
  const { user } = useAuth()
  const t = useTranslations()
  const pathname = usePathname()

  const [megaOpen, setMegaOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [creditoBalance, setCreditoBalance] = useState<number | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const creditoChecked = typeof creditoBalance === 'number'
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchInput = useRef<HTMLInputElement | null>(null)

  const isEn = pathname === '/en' || pathname.startsWith('/en/')
  const altLocaleHref = enlaceCambioIdioma(pathname)

  const familiasNav = FAMILIAS.map((f) => ({
    key: f.key,
    icon: f.icon,
    nombre: t(`familias.${f.key}.label`),
    desc: t(`familias.${f.key}.desc`),
    tipos: f.subs
      .map((slug) => TODAS_LAS_SUBS.find((s) => s.slug === slug))
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .map((s) => ({ id: s.slug, nombre: s.label, icon: s.icon, href: `/categoria/${s.slug}` })) }))

  // ── Estado de scroll: la cabecera gana peso visual al bajar ───────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── Bloqueo de scroll con el menú móvil / buscador abiertos ──────────────
  useEffect(() => {
    const open = mobileOpen
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInput.current?.focus(), 60)
  }, [searchOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false)
        setSearchOpen(false)
        setMegaOpen(false)
      }
      // Atajo de búsqueda (⌘K / Ctrl+K): esperado en un marketplace moderno.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Cierra los paneles al navegar
  useEffect(() => {
    setMobileOpen(false)
    setSearchOpen(false)
    setMegaOpen(false)
  }, [pathname])

  const enterMega = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setMegaOpen(true)
  }, [])
  const leaveMega = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setMegaOpen(false), 160)
  }, [])

  // ── Contadores de sesión (mensajes sin leer + créditos) ──────────────────
  useEffect(() => {
    if (!user) return
    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout>
    const controller = new AbortController()
    let sb: any = null
    let channel: { unsubscribe: () => void } | null = null
    let bc: BroadcastChannel | null = null

    async function fetchAll() {
      if (!sb) return
      timeoutId = setTimeout(() => controller.abort(), 5000)
      try {
        const [profileResponse, unreadResult] = await Promise.all([
          fetch('/api/perfil', { signal: controller.signal }),
          sb
            .from('mensajes')
            .select('id', { count: 'exact', head: true })
            .eq('destinatario_id', user!.id)
            .eq('leido', false)
            .abortSignal(controller.signal),
        ])
        if (!profileResponse.ok) throw new Error('No se pudo cargar el perfil')
        const profileJson = await profileResponse.json()
        clearTimeout(timeoutId)
        setCreditoBalance(profileJson.profile?.credito_balance ?? 0)
        setUnreadCount(unreadResult.count || 0)
      } catch {
        clearTimeout(timeoutId)
      }
    }

    async function init() {
      try {
        ;({ supabase: sb } = await import('@/lib/supabase'))
      } catch {
        return
      }
      if (cancelled) return
      fetchAll()
      channel = sb
        .channel('header-unread')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'mensajes', filter: `destinatario_id=eq.${user!.id}` },
          () => fetchAll()
        )
        .subscribe()
      bc = new BroadcastChannel('maquinariaocasion_unread_sync')
      bc.onmessage = () => fetchAll()
    }

    init()

    return () => {
      cancelled = true
      if (channel) sb?.removeChannel(channel)
      bc?.close()
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [user])

  const navLink = 'group relative flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium uppercase tracking-[0.12em] text-ink/75 transition-colors hover:text-ink'

  return (
    <>
      <SiteAnnouncement />

      <header
        className={`sticky top-0 z-50 ${
          scrolled ? 'shadow-[0_1px_0_rgba(12,14,13,0.12)]' : ''
        }`}
        onMouseLeave={leaveMega}
      >
        {/* ── Capa 1: barra de utilidad ─────────────────────────────────── */}
        <div className="hidden bg-ink text-paper/60 lg:block">
          <div className="shell flex h-8 items-center justify-between">
            <p className="t-label text-paper/60">
              Mercado de maquinaria de ocasión
              <span className="mx-2 text-signal">/</span>
              España
            </p>
            <nav className="flex items-center gap-6" aria-label="Información">
              <LocalLink href="/como-funciona" className="t-label text-paper/60 transition-colors hover:text-paper">
                {t('footer.howItWorks')}
              </LocalLink>
              <LocalLink href="/blog" className="t-label text-paper/60 transition-colors hover:text-paper">
                Guías
              </LocalLink>
              <LocalLink href="/sobre-nosotros" className="t-label text-paper/60 transition-colors hover:text-paper">
                {t('footer.aboutUs')}
              </LocalLink>
              <a
                href={altLocaleHref}
                onClick={(e) => {
                  e.preventDefault()
                  window.location.href = altLocaleHref
                }}
                className="t-label flex items-center gap-1.5 text-paper/60 transition-colors hover:text-signal"
                aria-label={isEn ? 'Cambiar a español' : 'Switch to English'}
              >
                <Globe size={11} strokeWidth={1.6} />
                {isEn ? 'ES' : 'EN'}
              </a>
            </nav>
          </div>
        </div>

        {/* ── Capa 2: barra principal ───────────────────────────────────── */}
        <div
          /* Opaco a propósito: al hacer scroll, las columnas sticky de la
             página pasan por debajo y no deben transparentarse. */
          className="border-b border-line bg-paper"
        >
          <div className="shell flex h-[62px] items-center gap-4 md:h-[74px]">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={t('header.openMenu')}
              className="btn btn-ghost -ml-2 px-2 py-2 lg:hidden"
            >
              <Menu size={22} strokeWidth={1.5} />
            </button>

            <BrandLogo href="/" size="md" showText="sm" />

            {/* Navegación de escritorio */}
            <nav className="ml-6 hidden items-center lg:flex" aria-label="Principal">
              <div onMouseEnter={enterMega} className="relative">
                <button
                  type="button"
                  aria-expanded={megaOpen}
                  aria-controls="mega-comprar"
                  onClick={() => setMegaOpen((v) => !v)}
                  onFocus={enterMega}
                  className={navLink}
                >
                  Comprar
                  <ChevronDown
                    size={13}
                    strokeWidth={1.8}
                    className={`transition-transform duration-300 ${megaOpen ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>
              <LocalLink href="/marcas" className={navLink} onMouseEnter={leaveMega}>
                {t('footer.brands')}
              </LocalLink>
              <LocalLink href="/tasador" className={navLink} onMouseEnter={leaveMega}>
                Tasador
              </LocalLink>
              <LocalLink href="/para-profesionales" className={navLink} onMouseEnter={leaveMega}>
                Profesionales
              </LocalLink>
            </nav>

            <div className="ml-auto flex items-center gap-1 md:gap-1.5">
              <button
                type="button"
                onClick={() => setSearchOpen((v) => !v)}
                aria-label={t('header.searchAria')}
                aria-expanded={searchOpen}
                className="flex items-center gap-2 border border-line px-2.5 py-2 text-ink/70 transition-colors hover:border-ink hover:text-ink md:px-3"
              >
                <Search size={16} strokeWidth={1.6} />
                <span className="t-label hidden text-ink/50 xl:block">Buscar</span>
                <span className="t-label hidden border border-line px-1 py-0.5 text-[10px] text-ink/40 xl:block">
                  ⌘K
                </span>
              </button>

              {user ? (
                <>
                  <LocalLink
                    href="/chat"
                    aria-label={t('header.messages')}
                    className="relative hidden px-2.5 py-2 text-ink/70 transition-colors hover:text-ink sm:block"
                  >
                    <MessageCircle size={18} strokeWidth={1.6} />
                    {unreadCount > 0 && (
                      <span className="t-num absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-signal px-1 text-[10px] font-bold text-ink">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </LocalLink>
                  <LocalLink
                    href="/publicar"
                    className="btn btn-signal btn-sm ml-1 hidden md:inline-flex"
                  >
                    <Plus size={14} strokeWidth={2} />
                    {t('header.publish')}
                  </LocalLink>
                  <LocalLink
                    href="/dashboard"
                    aria-label={t('header.myPanel')}
                    className="ml-1 hidden sm:block"
                  >
                    <Avatar
                      nombre={user?.user_metadata?.nombre || user?.email || 'U'}
                      fotoUrl={user?.user_metadata?.foto_perfil_url || null}
                      size="sm"
                    />
                  </LocalLink>
                  {creditoChecked && creditoBalance !== null && creditoBalance > 0 && (
                    <LocalLink
                      href="/creditos"
                      title={t('header.creditsTitle')}
                      className="t-label hidden items-center gap-1 border border-line px-2 py-1.5 text-ink/70 transition-colors hover:border-ink hover:text-ink lg:flex"
                    >
                      <Zap size={11} className="text-ink" />
                      {creditoBalance}
                    </LocalLink>
                  )}
                </>
              ) : (
                <>
                  <LocalLink
                    href="/login"
                    className="t-eyebrow hidden px-3 py-2 text-ink/75 transition-colors hover:text-ink md:inline-flex"
                  >
                    {t('header.signIn')}
                  </LocalLink>
                  <LocalLink href="/publicar" className="btn btn-signal btn-sm">
                    <span className="hidden sm:inline">{t('header.publish')}</span>
                    <span className="sm:hidden">Publicar</span>
                    <ArrowRight size={14} strokeWidth={2} className="hidden sm:block" />
                  </LocalLink>
                </>
              )}
            </div>
          </div>

          {/* ── Capa 3: raíl de taxonomía ──────────────────────────────── */}
          <div className="hidden border-t border-line/80 bg-paper md:block">
            <div className="shell flex h-10 items-center gap-1 overflow-x-auto hide-scrollbar">
              <LocalLink
                href="/catalogo"
                className="t-label mr-3 flex shrink-0 items-center gap-1.5 text-ink transition-opacity hover:opacity-60"
              >
                <span className="h-1.5 w-1.5 bg-signal" />
                Todo el catálogo
              </LocalLink>
              <span aria-hidden="true" className="mr-3 h-3 w-px shrink-0 bg-line" />
              {familiasNav.map((f, i) => (
                <div key={f.key} className="flex shrink-0 items-center">
                  {i > 0 && <span aria-hidden="true" className="mx-2 h-3 w-px bg-line" />}
                  <span className="t-label mr-1 flex items-center gap-1 text-ink/45">
                    {f.nombre}
                  </span>
                  {f.tipos.slice(0, 5).map((tipo) => (
                    <LocalLink
                      key={tipo.id}
                      href={tipo.href}
                      className="shrink-0 px-2 py-2 text-[13px] font-medium text-ink/70 transition-colors hover:text-ink"
                    >
                      {tipo.nombre}
                    </LocalLink>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Mega-menú: Comprar ──────────────────────────────────────── */}
        <div
          id="mega-comprar"
          onMouseEnter={enterMega}
          onMouseLeave={leaveMega}
          className={`absolute inset-x-0 top-full hidden border-b border-line bg-paper transition-all duration-300 lg:block ${
            megaOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0'
          }`}
        >
          <div className="shell grid grid-cols-12 gap-8 py-9">
            <div className="col-span-3">
              <p className="t-label mb-4 text-ink/45">Explorar por familia</p>
              <div className="space-y-5">
                {familiasNav.map((f) => (
                  <LocalLink
                    key={f.key}
                    href={`/categoria/${f.key}`}
                    className="group/f flex items-start gap-3"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-signal" />
                    <span>
                      <span className="block text-[15px] font-semibold leading-tight text-ink group-hover/f:underline group-hover/f:underline-offset-4">
                        {f.nombre}
                      </span>
                      <span className="t-label mt-1 block text-ink/40">{f.tipos.length} tipos</span>
                    </span>
                  </LocalLink>
                ))}
              </div>
            </div>
            {familiasNav.map((f) => (
              <div key={`col-${f.key}`} className="col-span-2">
                <p className="t-label mb-4 text-ink/45">{f.nombre}</p>
                <ul className="space-y-2.5">
                  {f.tipos.slice(0, 6).map((tipo) => (
                    <li key={tipo.id}>
                      <LocalLink
                        href={tipo.href}
                        className="group/t inline-flex items-center gap-1 text-[13.5px] text-ink/75 transition-colors hover:text-ink"
                      >
                        {tipo.nombre}
                        <ArrowUpRight
                          size={11}
                          className="opacity-0 transition-opacity group-hover/t:opacity-60"
                        />
                      </LocalLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="col-span-3">
              <div className="flex h-full flex-col justify-between bg-signal p-6 text-ink">
                <div>
                  <p className="t-label text-ink/60">Herramienta gratuita</p>
                  <p className="t-display mt-3 text-[1.75rem]">
                    ¿Cuánto vale
                    <br />
                    tu máquina?
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink/70">
                    Estimación en 2 minutos con datos reales del mercado.
                  </p>
                </div>
                <LocalLink href="/tasador" className="btn btn-ink btn-sm mt-6 self-start">
                  Abrir el tasador
                  <ArrowRight size={14} />
                </LocalLink>
              </div>
            </div>
          </div>
        </div>

        {/* ── Panel de búsqueda ───────────────────────────────────────── */}
        <div
          className={`absolute inset-x-0 top-full overflow-hidden border-b border-line bg-paper transition-[max-height,opacity] duration-300 ${
            searchOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="shell py-6">
            <form action="/buscar" method="GET" className="flex items-center gap-3">
              <Search size={22} strokeWidth={1.4} className="shrink-0 text-ink/40" />
              <label htmlFor="header-search" className="sr-only">
                {t('header.searchAria')}
              </label>
              <input
                ref={searchInput}
                id="header-search"
                name="q"
                type="search"
                placeholder={t('header.searchPlaceholder')}
                autoComplete="off"
                className="field t-display-sm border-0 border-b border-line-strong pb-3 pt-1 placeholder:text-ink/25"
              />
              <button type="submit" className="btn btn-ink btn-sm shrink-0">
                Buscar
                <ArrowRight size={14} />
              </button>
            </form>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="t-label mr-1 text-ink/40">Popular</span>
              {['Tractor', 'Miniexcavadora', 'Retroexcavadora', 'Cosechadora', 'Generador'].map(
                (q) => (
                  <LocalLink
                    key={q}
                    href={`/buscar?q=${encodeURIComponent(q)}`}
                    className="border border-line px-2.5 py-1.5 text-[13px] text-ink/70 transition-colors hover:border-ink hover:text-ink"
                  >
                    {q}
                  </LocalLink>
                )
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Menú móvil a pantalla completa ─────────────────────────────── */}
      <div
        className={`fixed inset-0 z-[70] lg:hidden ${
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        aria-hidden={!mobileOpen}
      >
        <div
          className={`absolute inset-0 bg-ink transition-opacity duration-300 ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={`absolute inset-0 flex flex-col overflow-y-auto bg-ink text-paper transition-transform duration-500 ease-editorial ${
            mobileOpen ? 'translate-y-0' : '-translate-y-4 opacity-0'
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Menú"
        >
          <div className="shell flex h-[62px] shrink-0 items-center justify-between border-b border-line-dark">
            <BrandLogo href="/" tone="light" size="md" />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label={t('header.closeMenu')}
              className="p-2 text-paper/70 transition-colors hover:text-paper"
            >
              <X size={22} strokeWidth={1.5} />
            </button>
          </div>

          <nav className="shell flex-1 py-8" aria-label="Menú móvil">
            <ul>
              {[
                { href: '/catalogo', label: 'Catálogo completo', n: '01' },
                { href: '/publicar', label: 'Publicar gratis', n: '02' },
                { href: '/marcas', label: t('footer.brands'), n: '03' },
                { href: '/tasador', label: 'Tasador', n: '04' },
                { href: '/para-profesionales', label: 'Profesionales', n: '05' },
                { href: '/blog', label: 'Guías', n: '06' },
                { href: '/foro', label: t('foro.title'), n: '07' },
                { href: '/contacto', label: t('nav.contact'), n: '08' },
              ].map((item) => (
                <li key={item.href} className="border-b border-line-dark">
                  <LocalLink
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between py-4"
                  >
                    <span className="flex items-baseline gap-3">
                      <span className="t-label text-paper/35">{item.n}</span>
                      <span className="t-display text-[1.65rem] text-paper">{item.label}</span>
                    </span>
                    <ArrowUpRight size={18} className="text-signal" strokeWidth={1.6} />
                  </LocalLink>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-2">
              {familiasNav.map((f) => (
                <LocalLink
                  key={f.key}
                  href={`/categoria/${f.key}`}
                  onClick={() => setMobileOpen(false)}
                  className="border border-line-dark px-3 py-2 text-[13px] text-paper/70"
                >
                  {f.nombre}
                </LocalLink>
              ))}
            </div>

            {!user && (
              <div className="mt-8 grid grid-cols-2 gap-3">
                <LocalLink href="/login" onClick={() => setMobileOpen(false)} className="btn btn-outline-light">
                  {t('header.signIn')}
                </LocalLink>
                <LocalLink href="/register" onClick={() => setMobileOpen(false)} className="btn btn-signal">
                  {t('header.signUp')}
                </LocalLink>
              </div>
            )}
          </nav>

          <div className="shell shrink-0 border-t border-line-dark py-4">
            <a
              href={altLocaleHref}
              className="t-label flex items-center gap-2 text-paper/50"
              aria-label={isEn ? 'Cambiar a español' : 'Switch to English'}
            >
              <Globe size={12} /> {isEn ? 'Español' : 'English'}
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
