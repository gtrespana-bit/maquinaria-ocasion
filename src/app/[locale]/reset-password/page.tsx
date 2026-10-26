'use client'

import BrandLogo from '@/components/BrandLogo'
import { useState, useEffect } from 'react'
import LocalLink from '@/components/LocalLink'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { establecerSesionDesdeEnlace } from '@/lib/sesion-desde-enlace'
import { AlertCircle, XCircle } from 'lucide-react'
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
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500">{t('checking')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <BrandLogo href="/" size="lg" className="justify-center" priority />
          <h1 className="text-2xl font-bold text-gray-800 mt-4">
            {success ? t('titleSuccess') : t('title')}
          </h1>
          <p className="text-gray-500 mt-1">
            {success ? t('subtitleSuccess') : t('subtitle')}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-lg mb-6 text-sm">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-green-700 font-semibold text-lg">{t('successText')}</p>
              <LocalLink
                href="/login"
                className="inline-block mt-6 bg-brand-primary text-white px-8 py-3 rounded-lg font-bold hover:bg-brand-dark transition"
              >
                {t('goLogin')}
              </LocalLink>
            </div>
          ) : enlaceInvalido ? (
            <div className="text-center py-8">
              <div className="flex justify-center mb-6">
                <div className="bg-red-100 rounded-full p-4">
                  <XCircle className="text-red-600" size={48} />
                </div>
              </div>
              <p className="text-gray-800 font-semibold text-lg">{t('linkInvalidTitle')}</p>
              <p className="text-gray-500 mt-2">{t('linkInvalidDesc')}</p>
              <LocalLink
                href="/login"
                className="inline-block mt-6 bg-brand-primary text-white px-8 py-3 rounded-lg font-bold hover:bg-brand-dark transition"
              >
                {t('requestNewLink')}
              </LocalLink>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('newPw')}</label>
                <input
                  type="password" autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('newPwPlaceholder')}
                  required
                  minLength={8}
                  className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-accent text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('repeatPw')}</label>
                <input
                  type="password" autoComplete="new-password"
                  value={confirmedPassword}
                  onChange={(e) => setConfirmedPassword(e.target.value)}
                  placeholder={t('repeatPwPlaceholder')}
                  required
                  minLength={8}
                  className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-accent text-gray-900 bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-primary text-white py-3 rounded-lg font-bold hover:bg-brand-dark transition disabled:opacity-50"
              >
                {loading ? t('saving') : t('submit')}
              </button>

              <p className="text-center text-sm text-gray-500 mt-4">
                <LocalLink href="/login" className="text-brand-primary font-semibold hover:underline">
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
