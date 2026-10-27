'use client'

import BrandLogo from '@/components/BrandLogo'
import { useState } from 'react'
import LocalLink from '@/components/LocalLink'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { routing } from '@/i18n/routing'
import { getSafeRedirectPath } from '@/lib/safe-redirect'

function getLocaleFromPathname(pathname: string): string {
  for (const locale of routing.locales) {
    if (locale === routing.defaultLocale) continue
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return locale
    }
  }
  return routing.defaultLocale
}

export default function LoginPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = getLocaleFromPathname(pathname)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showResend, setShowResend] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendYaConfirmado, setResendYaConfirmado] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')

  // Build locale-aware redirect path
  const redirectPath = (path: string) => {
    if (locale === routing.defaultLocale || path === `/${locale}` || path.startsWith(`/${locale}/`)) return path
    return `/${locale}${path === '/' ? '' : path}`
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // ✅ FIX: Use API route for login so server-side cookies are written.
      // This ensures the middleware and server components can read the auth session.
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }) })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos. Verifica tus datos.'
          : data.error)
        setLoading(false)
        return
      }

      // ✅ FIX: Sync the singleton client with the session from the API.
      // This fires onAuthStateChange → AuthProvider picks it up → session is set.
      if (data.session?.access_token && data.session?.refresh_token) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token })
        
        // Wait briefly to allow AuthProvider to process the session change
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Only accept local, relative destinations to prevent open redirects.
      const destination = getSafeRedirectPath(searchParams.get('redirect')) || '/dashboard'
      router.push(redirectPath(destination))
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.')
    }
    setLoading(false)
  }

  const handleResendConfirmation = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResendLoading(true)
    setResendSuccess(false)
    setResendYaConfirmado(false)

    // El reenvío se hace en el servidor (POST /api/reconfirmar) para que el
    // correo salga por el SMTP de la propia app y no por el de Supabase
    // (roto cuando la cuenta Zoho se degradó a plan gratuito sin SMTP).
    try {
      const res = await fetch('/api/reconfirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }) })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error || 'No se pudo reenviar el email. Inténtalo de nuevo.')
        setResendSuccess(false)
      } else {
        setResendYaConfirmado(data.yaRegistrado === true)
        setResendSuccess(true)
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
      setResendSuccess(false)
    }
    setResendLoading(false)
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetError('')
    setResetLoading(true)

    // El email sale por el canal de la propia app (POST /api/password-reset:
    // Resend API o SMTP) y no por el SMTP del Dashboard de Supabase.
    try {
      const res = await fetch('/api/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setResetError(data.error || 'No se pudo enviar el correo. Inténtalo de nuevo.')
      } else {
        setResetSent(true)
      }
    } catch {
      setResetError('Error de conexión. Intenta de nuevo.')
    }
    setResetLoading(false)
  }

  return (
    <div className="grid min-h-[calc(100vh-140px)] grid-cols-1 lg:grid-cols-2">
      {/* Panel editorial: solo escritorio */}
      <aside className="on-dark relative hidden overflow-hidden bg-ink px-12 py-16 text-paper lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="blueprint absolute inset-0 opacity-60" />
        <div className="relative">
          <BrandLogo href="/" tone="light" size="md" />
        </div>
        <div className="relative max-w-md">
          <p className="t-eyebrow text-signal">Cuenta MaquinariaOcasión</p>
          <p className="t-display mt-6 text-[2.6rem] text-paper">
            Tu maquinaria,
            <br />
            <span className="t-serif-italic text-signal">en el mercado.</span>
          </p>
          <ul className="mt-10 space-y-3 border-t border-line-dark pt-6">
            {['Publicar gratis, sin comisiones', 'Chat directo con compradores', 'Panel con tus anuncios y su rendimiento'].map((item) => (
              <li key={item} className="flex items-baseline gap-3 text-[13.5px] text-paper/60">
                <span aria-hidden="true" className="h-1 w-1 shrink-0 bg-signal" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="t-label relative text-paper/30">maquinaria.click</p>
      </aside>

      {/* Formulario */}
      <div className="flex items-center justify-center px-5 py-14 md:px-10">
        <div className="w-full max-w-[400px]">
        <div className="mb-9">
          <div className="lg:hidden">
            <BrandLogo href="/" size="lg" priority />
          </div>
          <h1 className="t-display t-display-md mt-6 text-ink">{t('login.title')}</h1>
          <p className="mt-2 text-[14px] text-muted">{t('login.subtitle')}</p>
        </div>

        <div>
          {error && (
            <div className="mb-6 flex items-start gap-2 border border-clay/40 bg-clay/[0.05] p-3 text-[13px] text-clay">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="t-label mb-1 block text-ink/50">{t('login.email')}</label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="field text-[15px]"
              />
            </div>

            <div>
              <label className="t-label mb-1 block text-ink/50">{t('login.password')}</label>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                required
                className="field text-[15px]"
              />
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowReset(!showReset)}
                className="t-label text-ink/60 underline underline-offset-4 transition-colors hover:text-ink"
              >
                {t('login.forgot_password')}
              </button>
            </div>

            {showReset && !resetSent ? (
              <div className="border border-line bg-paper-2/60 p-4">
                <p className="mb-3 text-[13px] text-ink/70">{t('login.reset_title')}</p>
                {resetError && (
                  <p className="text-sm text-clay mb-3">{resetError}</p>
                )}
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    className="field text-[14px]"
                  />
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="btn btn-ink btn-sm w-full"
                  >
                    {resetLoading ? t('login.sending') : t('login.reset_submit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReset(false)}
                    className="w-full text-[13px] text-muted transition-colors hover:text-ink"
                  >
                    {t('login.cancel')}
                  </button>
                </form>
              </div>
            ) : showReset && resetSent ? (
              <div className="border border-moss/30 bg-moss-soft p-4 text-center">
                <p className="mb-2 text-[13px] font-semibold text-moss">{t('login.link_sent')}</p>
                <p className="text-[13px] text-moss/80">
                  {t('login.reset_sent')}
                </p>
                <button
                  type="button"
                  onClick={() => { setShowReset(false); setResetSent(false) }}
                  className="text-sm text-brand-primary font-semibold hover:underline mt-3"
                >
                  {t('login.reset_back')}
                </button>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-ink w-full btn-lg"
            >
              {loading ? t('login.submitting') : t('login.submit')}
            </button>
          </form>

          <p className="mt-8 text-center text-[13px] text-muted">
            {t('login.no_account')}{' '}
            <LocalLink href="/register" className="font-semibold text-ink underline decoration-signal decoration-2 underline-offset-4">
              {t('login.register')}
            </LocalLink>
          </p>

          {/* Botón para reenviar email de confirmación */}
          {!showResend ? (
            <p className="mt-3 text-center text-[13px] text-muted">
              {t('login.resend_prompt')}
              <button
                type="button"
                onClick={() => setShowResend(true)}
                className="ml-1 font-semibold text-ink underline decoration-signal decoration-2 underline-offset-4"
              >
                {t('login.resend')}
              </button>
            </p>
          ) : (
            <div className="mt-4 border border-line bg-paper-2/60 p-4">
              {resendSuccess ? (
                <div className="text-center">
                  <div className="mb-2 flex items-center justify-center gap-2 text-[13px] font-semibold text-moss">
                    {resendYaConfirmado ? t('login.resend_already') : t('login.resend_success')}
                  </div>
                  <p className="mb-3 text-[13px] text-muted">
                    {resendYaConfirmado ? t('login.resend_already_desc') : t('login.resend_success_desc')}
                    {!resendYaConfirmado && <strong> {email}</strong>}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowResend(false)}
                    className="text-[13px] font-semibold text-ink underline underline-offset-4"
                  >
                    {t('login.reset_back')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResendConfirmation} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-ink/75 mb-1.5">
                      {t('login.email')}
                    </label>
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      inputMode="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                      className="field text-[14px]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={resendLoading}
                    className="btn btn-ink btn-sm w-full"
                  >
                    {resendLoading ? t('login.sending') : t('login.resend')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResend(false)}
                    className="w-full text-[13px] text-muted transition-colors hover:text-ink"
                  >
                    {t('login.cancel')}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  )
}
