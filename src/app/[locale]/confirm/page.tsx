'use client'

import BrandLogo from '@/components/BrandLogo'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, Loader2, XCircle } from 'lucide-react'
import LocalLink from '@/components/LocalLink'
import { supabase } from '@/lib/supabase'
import { useTranslations } from 'next-intl'

type Estado = 'loading' | 'success' | 'error'
type Parametro = (clave: string) => string | null

export default function ConfirmEmailPage() {
  const t = useTranslations('confirmEmail')
  const router = useRouter()
  const [status, setStatus] = useState<Estado>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [yaLogueado, setYaLogueado] = useState(false)

  useEffect(() => {
    let cancelled = false

    const terminarExito = () => {
      if (cancelled) return
      setStatus('success')
      setTimeout(() => {
        if (cancelled) return
        router.push('/dashboard')
      }, 3000)
    }

    const terminarError = (msg: string) => {
      if (cancelled) return
      setStatus('error')
      setErrorMsg(msg)
    }

    async function confirmAccount() {
      try {
        // ── 1. Leer parámetros de la URL ─────────────────────────────────
        // El email de confirmación puede traer el token de varias formas:
        //   a) ?token_hash=…&type=signup  (token para verificar con verifyOtp)
        //   b) #access_token=…&type=signup (Supabase ya validó el token y
        //      redirige con una sesión implícita en el fragmento)
        //   c) ?code=…&flow_id=…          (callback PKCE)
        //   d) sin parámetros              (Supabase ya la procesó al cargar)
        const query = new URLSearchParams(window.location.search)
        const hash = window.location.hash
        const hashParams = hash && hash.length > 1 ? new URLSearchParams(hash.substring(1)) : null
        const get: Parametro = (k) => hashParams?.get(k) ?? query.get(k)

        const type = get('type')
        const tokenHash = get('token_hash') || get('token')
        const accessToken = get('access_token')
        const refreshToken = get('refresh_token')
        const code = get('code')
        const errorUrl = get('error') || query.get('error_description')

        // Si Supabase devolvió error en la URL pero la sesión ya existe y está
        // confirmada, el clic SÍ funcionó (p. ej. enlace reutilizado).
        if (errorUrl) {
          const { data: sesionExistente } = await supabase.auth.getSession()
          if (sesionExistente.session?.user?.email_confirmed_at) {
            setYaLogueado(true)
            terminarExito()
            return
          }
        }

        // ── 2. Sesión implícita ya emitida por Supabase ──────────────────
        // (Enlace verificado por GET /verify → redirect con #access_token…)
        if (accessToken && refreshToken) {
          const { error: errorSet } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken })
          if (!errorSet) {
            setYaLogueado(true)
            terminarExito()
            return
          }
          // Si falla, seguir e intentar verifyOtp por si el token viene aparte.
        }

        // ── 3. Token de verificación (token_hash / token + type) ─────────
        if (tokenHash && type) {
          // El tipo 'email' que a veces llega en el enlace equivale a 'signup'.
          const tipoOtp = type === 'email' ? 'signup' : type
          const { data: dataOtp, error: errorOtp } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: tipoOtp as 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' })
          if (errorOtp) {
            // Token inválido/expirado: quizá el usuario YA confirmó antes y
            // reutilizó el enlace. Comprobar sesión antes de rendirse.
            const { data: sesionExistente } = await supabase.auth.getSession()
            if (sesionExistente.session?.user?.email_confirmed_at) {
              setYaLogueado(true)
              terminarExito()
            } else {
              terminarError(errorOtp.message || t('confirmError'))
            }
            return
          }
          if (dataOtp.session?.user?.email_confirmed_at) setYaLogueado(true)
          terminarExito()
          return
        }

        // ── 4. Callback PKCE (?code=…): intercambiar por sesión ─────────
        if (code) {
          const { error: errorCode } = await supabase.auth.exchangeCodeForSession(code)
          if (errorCode) {
            terminarError(errorCode.message || t('confirmError'))
            return
          }
          const { data } = await supabase.auth.getSession()
          if (data.session?.user?.email_confirmed_at) setYaLogueado(true)
          terminarExito()
          return
        }

        // ── 5. Sin parámetros: ver si supabase-js ya procesó la sesión ───
        const { data: sessionData, error } = await supabase.auth.getSession()
        if (sessionData.session?.user?.email_confirmed_at) {
          setYaLogueado(true)
          terminarExito()
        } else {
          terminarError((error as any)?.message || t('noToken'))
        }
      } catch (e: any) {
        terminarError(e?.message || t('confirmError'))
      }
    }

    confirmAccount()
    return () => {
      cancelled = true
    }
  }, [router, t])

  const titulo =
    status === 'success' ? t('success') : status === 'error' ? t('error') : t('loading')

  return (
    <div className="shell py-14 md:py-20">
      <div className="mx-auto w-full max-w-[440px]">
        <div className="flex items-center justify-between border-b border-ink pb-4">
          <BrandLogo href="/" size="md" priority />
          <span className="t-label text-ink/40">Cuenta</span>
        </div>

        <h1 className="t-display t-display-sm mt-8 text-ink">{titulo}</h1>

        <div className="mt-8 border border-line bg-[#FBFAF5] p-6 sm:p-8">
          {status === 'loading' && (
            <div className="flex items-start gap-3">
              <Loader2 size={18} className="mt-0.5 shrink-0 animate-spin text-ink/50" />
              <p className="text-[14px] leading-relaxed text-muted">{t('loadingDesc')}</p>
            </div>
          )}

          {status === 'success' && (
            <>
              <span className="flex h-12 w-12 items-center justify-center border border-moss bg-moss text-paper">
                <Check size={22} strokeWidth={1.6} />
              </span>
              <p className="mt-5 text-[14px] leading-relaxed text-ink/75">
                {yaLogueado ? t('successDescDashboard') : t('successDesc')}
              </p>
              <LocalLink
                href={yaLogueado ? '/dashboard' : '/login'}
                className="btn btn-ink btn-lg mt-6 w-full justify-between"
              >
                {yaLogueado ? t('goDashboard') : t('goLogin')}
                <ArrowRight size={15} />
              </LocalLink>
            </>
          )}

          {status === 'error' && (
            <>
              <span className="flex h-12 w-12 items-center justify-center border border-clay/40 bg-clay/[0.06] text-clay">
                <XCircle size={22} strokeWidth={1.6} />
              </span>
              <p className="mt-5 border border-clay/30 bg-clay/[0.04] p-3 text-[13px] leading-relaxed text-clay">
                {errorMsg || t('errorDefault')}
              </p>
              <LocalLink href="/login" className="btn btn-outline btn-lg mt-6 w-full justify-between">
                {t('resendLogin')}
                <ArrowRight size={15} />
              </LocalLink>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
