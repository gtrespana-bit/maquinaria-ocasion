'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { CheckCircle, ArrowRight, RefreshCw } from 'lucide-react'
import LocalLink from '@/components/LocalLink'
import { useRouter } from 'next/navigation'

function ConfirmacionContent() {
  const t = useTranslations('auth')
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [resending, setResending] = useState(false)
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    setEmail(sessionStorage.getItem('tempEmail') || 'tu correo electrónico')
  }, [])

  const handleConfirmClick = () => {
    sessionStorage.removeItem('tempEmail')
    router.push('/login')
  }

  const handleResend = async () => {
    if (!email || email === 'tu correo electrónico') return
    setResending(true)
    setResendStatus('idle')

    try {
      // El reenvío se hace en el servidor (POST /api/reconfirmar) para que el
      // correo salga por el SMTP de la propia app (confirmacion-email.ts) y no
      // por el SMTP de Supabase, que dejó de funcionar.
      const res = await fetch('/api/reconfirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }) })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setResendStatus('error')
        console.error('Resend error:', data.error)
      } else {
        setResendStatus('success')
      }
    } catch (e: any) {
      setResendStatus('error')
      console.error('Resend error:', e?.message || e)
    }
    setResending(false)
  }

  return (
    <div className="bg-paper">
      <div className="shell max-w-[560px] py-16 md:py-24">
        <p className="t-eyebrow text-ink/40">Cuenta</p>
        <h1 className="t-display t-display-lg mt-5 text-ink">{t('confirmacion.title')}</h1>

        <div className="mt-8 border border-line bg-[#FBFAF5]">
          <div className="flex items-center gap-3 border-b border-ink px-5 py-3">
            <CheckCircle size={14} strokeWidth={1.8} className="shrink-0 text-moss" aria-hidden="true" />
            <p className="t-label text-ink">Solicitud registrada</p>
          </div>

          <div className="border-b border-line bg-paper-2/60 px-5 py-4">
            <p className="t-label text-ink/40">{t('confirmacion.sent_to')}</p>
            <p className="t-num mt-1 break-all text-[13px] font-medium text-ink">{email}</p>
          </div>

          <div className="px-5 py-5">
            <p className="text-[13.5px] leading-relaxed text-ink/65">{t('confirmacion.instructions')}</p>
          </div>

          <div className="border-t border-line px-5 py-5">
            <p className="text-[12.5px] font-semibold text-ink">{t('confirmacion.not_received')}</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink/45">{t('confirmacion.resend_hint')}</p>
            <button
              onClick={handleResend}
              disabled={resending || !email || email === 'tu correo electrónico'}
              className="btn btn-outline btn-sm mt-3 w-full justify-center disabled:opacity-40"
            >
              {resending ? (
                <>
                  <RefreshCw size={11} className="animate-spin" />
                  Enviando…
                </>
              ) : resendStatus === 'success' ? (
                <>
                  <CheckCircle size={11} />
                  Email reenviado
                </>
              ) : (
                <>
                  <RefreshCw size={11} />
                  Reenviar email de confirmación
                </>
              )}
            </button>
            {resendStatus === 'error' && (
              <p className="mt-2 text-[11.5px] text-clay">Error al reenviar. Verifica que el email sea correcto.</p>
            )}
          </div>
        </div>

        <button onClick={handleConfirmClick} className="btn btn-ink btn-lg mt-6 w-full justify-between">
          {t('confirmacion.confirmed')}
          <ArrowRight size={14} />
        </button>

        <p className="t-label mt-5 text-ink/30">{t('confirmacion.footer')}</p>
      </div>
    </div>
  )
}

export default ConfirmacionContent
