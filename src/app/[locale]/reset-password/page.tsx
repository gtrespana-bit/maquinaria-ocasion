'use client'

import BrandLogo from '@/components/BrandLogo'
import { useState, useEffect } from 'react'
import LocalLink from '@/components/LocalLink'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { establecerSesionDesdeEnlace } from '@/lib/sesion-desde-enlace'
import { AlertCircle, ArrowRight, Check, Loader2, XCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function ResetPasswordPage() {
  const t = useTranslations('resetPassword')
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmedPassword, setConfirmedPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [enlaceInvalido, setEnlaceInvalido] = useState(false)

  useEffect(() => {
    // El enlace del correo llega con los tokens en el fragmento de la URL
    // (#access_token=…). El cliente usa flujo PKCE y NO consume ese
    // fragmento solo: hay que establecer la sesión explícitamente o
    // `updateUser` falla con «Auth session missing!».
    let cancelado = false
    establecerSesionDesdeEnlace(supabase)
      .then((resultado) => {
        if (cancelado) return
        if (!resultado.ok) setEnlaceInvalido(true)
      })
      .catch(() => {
        if (!cancelado) setEnlaceInvalido(true)
      })
      .finally(() => {
        if (!cancelado) setCheckingSession(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError(t('pwMinError'))
      return
    }

    if (password !== confirmedPassword) {
      setError(t('pwMismatchError'))
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      // Sesión de recuperación perdida/caducada: mismo estado que un enlace
      // inválido, en vez del mensaje crudo en inglés de supabase-js.
      if (/session/i.test(error.message)) {
        setEnlaceInvalido(true)
      } else {
        setError(error.message)
      }
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    }

    setLoading(false)
  }

  if (checkingSession) {
    return (
      <div className="shell flex min-h-[60vh] items-center justify-center py-16">
        <div className="flex items-center gap-3 text-muted">
          <Loader2 size={16} className="animate-spin" />
          <p className="t-label text-ink/50">{t('checking')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="shell py-14 md:py-20">
      <div className="mx-auto w-full max-w-[440px]">
        <div className="flex items-center justify-between border-b border-ink pb-4">
          <BrandLogo href="/" size="md" priority />
          <span className="t-label text-ink/40">Acceso</span>
        </div>

        <h1 className="t-display t-display-sm mt-8 text-ink">
          {success ? t('titleSuccess') : enlaceInvalido ? t('linkInvalidTitle') : t('title')}
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          {success ? t('subtitleSuccess') : enlaceInvalido ? t('linkInvalidDesc') : t('subtitle')}
        </p>

        <div className="mt-8 border border-line bg-[#FBFAF5] p-6 sm:p-8">
          {error && (
            <div className="mb-6 flex items-start gap-2 border border-clay/40 bg-clay/[0.05] p-3 text-[13px] text-clay">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center border border-moss bg-moss text-paper">
                <Check size={22} strokeWidth={1.6} />
              </span>
              <p className="mt-5 text-[14px] leading-relaxed text-ink/75">{t('successText')}</p>
              <LocalLink href="/login" className="btn btn-ink btn-lg mt-6 w-full justify-between">
                {t('goLogin')}
                <ArrowRight size={15} />
              </LocalLink>
            </div>
          ) : enlaceInvalido ? (
            <div className="text-center">
              <span className="flex h-12 w-12 items-center justify-center border border-clay/40 bg-clay/[0.06] text-clay">
                <XCircle size={22} strokeWidth={1.6} />
              </span>
              <p className="t-label mt-5 border-t border-line pt-4 text-ink/45">Los enlaces caducan en 24 horas</p>
              <LocalLink href="/login" className="btn btn-ink btn-lg mt-5 w-full justify-between">
                {t('requestNewLink')}
                <ArrowRight size={15} />
              </LocalLink>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-6">
              <div>
                <label htmlFor="rp-pw" className="t-label mb-1 block text-ink/50">
                  {t('newPw')}
                </label>
                <input
                  id="rp-pw"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('newPwPlaceholder')}
                  required
                  minLength={8}
                  className="field text-[15px]"
                />
              </div>

              <div>
                <label htmlFor="rp-pw2" className="t-label mb-1 block text-ink/50">
                  {t('repeatPw')}
                </label>
                <input
                  id="rp-pw2"
                  type="password"
                  autoComplete="new-password"
                  value={confirmedPassword}
                  onChange={(e) => setConfirmedPassword(e.target.value)}
                  placeholder={t('repeatPwPlaceholder')}
                  required
                  minLength={8}
                  className="field text-[15px]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-ink btn-lg w-full justify-between disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  <>
                    {t('submit')}
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              <p className="t-label border-t border-line pt-4 text-center text-ink/45">
                <LocalLink href="/login" className="link-rule text-ink/70">
                  {t('backToLogin')}
                </LocalLink>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
