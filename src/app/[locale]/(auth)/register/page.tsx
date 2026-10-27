'use client'

import BrandLogo from '@/components/BrandLogo'
import { useState } from 'react'
import LocalLink from '@/components/LocalLink'
import { useRouter, usePathname } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { routing } from '@/i18n/routing'
import { TIPOS_VENDEDOR, type TipoVendedor} from '@/components/BadgeTipoVendedor'

export default function RegisterPage() {
  const t = useTranslations('auth')
  const tTipos = useTranslations('tiposVendedor')
  const router = useRouter()
  const pathname = usePathname()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [tipoVendedor, setTipoVendedor] = useState<TipoVendedor>('particular')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Ingresa un email válido')
      return
    }

    // Validación de nombre
    if (!nombre || nombre.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres')
      return
    }

    // Validación de contraseña — NIST 800-63B: longitud mínima, sin reglas
    // de composición obligatoria (las reglas de mayúscula/número generan
    // contraseñas que se olvidan y usuarios que no vuelven).
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    if (password !== repeatPassword) {
      setError(t('register.password_mismatch'))
      return
    }

    setLoading(true)

    // Nota: teléfono y ubicación NO se piden aquí. Se piden en contexto
    // (ubicación al publicar, teléfono al configurar contacto) para no
    // frenar el registro.
    //
    // El registro se hace en el servidor (POST /api/register) en vez de
    // `supabase.auth.signUp()` directo: así el email de confirmación lo envía
    // la propia app por su SMTP (src/lib/confirmacion-email.ts) y no depende
    // del SMTP del Dashboard de Supabase (que dejó de enviar cuando la cuenta
    // Zoho se degradó al plan gratuito, sin acceso SMTP).
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password, tipo: tipoVendedor }) })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error || 'Error al crear la cuenta. Inténtalo de nuevo.')
        setLoading(false)
        return
      }

      // Mostrar mensaje de confirmación y redirigir a pantalla de confirmación
      sessionStorage.setItem('tempEmail', email)
      // Redirect with locale prefix
      const locale = (() => {
        for (const l of routing.locales) {
          if (l === routing.defaultLocale) continue
          if (pathname === `/${l}` || pathname.startsWith(`/${l}/`)) return l
        }
        return routing.defaultLocale
      })()
      const confirmPath = locale === routing.defaultLocale ? '/confirmacion' : `/${locale}/confirmacion`
      router.push(confirmPath)
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    }
    setLoading(false)
  }

  return (
    <div className="grid min-h-[calc(100vh-140px)] grid-cols-1 lg:grid-cols-2">
      {/* Panel editorial */}
      <aside className="on-dark relative hidden overflow-hidden bg-ink px-12 py-16 text-paper lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="blueprint absolute inset-0 opacity-60" />
        <div className="relative">
          <BrandLogo href="/" tone="light" size="md" />
        </div>
        <div className="relative max-w-md">
          <p className="t-eyebrow text-signal">Cuenta gratuita</p>
          <p className="t-display mt-6 text-[2.6rem] text-paper">
            Publica tu máquina.
            <br />
            <span className="t-serif-italic text-signal">Sin cuotas.</span>
          </p>
          <ul className="mt-10 space-y-3 border-t border-line-dark pt-6">
            {[
              '1 crédito gratis al registrarte',
              '5 créditos más al publicar 10 anuncios',
              'Chat directo y panel de rendimiento',
            ].map((item, i) => (
              <li key={item} className="flex items-baseline gap-3 text-[13.5px] text-paper/60">
                <span aria-hidden="true" className="t-label text-signal/70">{String(i + 1).padStart(2, '0')}</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="t-label relative text-paper/30">maquinaria.click</p>
      </aside>

      {/* Formulario */}
      <div className="flex items-center justify-center px-5 py-14 md:px-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-8">
            <div className="lg:hidden">
              <BrandLogo href="/" size="lg" priority />
            </div>
            <h1 className="t-display t-display-md mt-6 text-ink">{t('register.title')}</h1>
            <p className="mt-2 text-[14px] text-muted">{t('register.subtitle')}</p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-2 border border-clay/40 bg-clay/[0.05] p-3 text-[13px] text-clay">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="t-label mb-1 block text-ink/50">{t('register.name')}</label>
              <input
                type="text"
                name="name"
                autoComplete="name"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                required
                className="field text-[15px]"
              />
            </div>

            <div>
              <label className="t-label mb-1 block text-ink/50">{t('register.email')}</label>
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

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="t-label mb-1 block text-ink/50">{t('register.password')}</label>
                <input
                  type="password"
                  name="new-password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mín. 8 caracteres"
                  required
                  className="field text-[15px]"
                />
              </div>
              <div>
                <label className="t-label mb-1 block text-ink/50">{t('register.repeat_password')}</label>
                <input
                  type="password"
                  name="confirm-password"
                  autoComplete="new-password"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  required
                  className="field text-[15px]"
                />
              </div>
            </div>

            {/* Tipo de vendedor: define el sello del anuncio, no limita el registro. */}
            <fieldset className="border-t border-line pt-5">
              <legend className="t-label mb-2 text-ink/50">{t('register.sellerTypeLabel')}</legend>
              <div className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-3">
                {TIPOS_VENDEDOR.map((tipo, i) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setTipoVendedor(tipo)}
                    aria-pressed={tipoVendedor === tipo}
                    className={`p-3 text-left transition-colors ${
                      tipoVendedor === tipo ? 'bg-signal' : 'bg-[#FBFAF5] hover:bg-paper'
                    }`}
                  >
                    <span className="t-label block text-ink/40">{String(i + 1).padStart(2, '0')}</span>
                    <span className="mt-1 block text-[13px] font-semibold text-ink">{tTipos(tipo)}</span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-ink/55">
                      {tTipos(`${tipo}Desc`)}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11.5px] leading-relaxed text-ink/45">{t('register.sellerTypeHint')}</p>
            </fieldset>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-ink btn-lg w-full justify-between disabled:opacity-60"
            >
              {loading ? t('register.creating') : t('register.submit')}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <p className="t-label mt-6 text-center text-ink/50">
            {t('register.has_account')}{' '}
            <LocalLink href="/login" className="text-ink underline underline-offset-4">
              {t('register.login')}
            </LocalLink>
          </p>
        </div>
      </div>
    </div>
  )
}
