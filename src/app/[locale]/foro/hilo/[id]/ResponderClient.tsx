'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Loader2, Send } from 'lucide-react'
import LocalLink from '@/components/LocalLink'
import { useAuth } from '@/components/AuthProvider'

export default function ResponderClient({ hiloId, cerrado }: { hiloId: string; cerrado: boolean }) {
  const t = useTranslations('foro')
  const { session, loading } = useAuth()
  const router = useRouter()

  const [cuerpo, setCuerpo] = useState('')
  const [error, setError] = useState('')
  const [nota, setNota] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (cerrado) return null

  if (loading) {
    return <div className="text-sm text-ink/45 font-semibold py-3">{t('loading')}</div>
  }

  if (!session) {
    return (
      <div className="bg-[#FBFAF5] border border-dashed border-line-strong rounded-2xl p-6 text-center">
        <p className="text-ink/75 font-bold mb-4">{t('loginRequired')}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <LocalLink href="/login" className="w-full sm:w-auto bg-brand-signal text-brand-darkNav font-black px-6 py-2.5 rounded-xl hover:brightness-110 transition">
            {t('login')}
          </LocalLink>
          <LocalLink href="/register" className="w-full sm:w-auto border-2 border-line-strong text-ink font-black px-6 py-2.5 rounded-xl hover:border-brand-signal transition">
            {t('register')}
          </LocalLink>
        </div>
      </div>
    )
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (enviando) return
    setError('')
    setNota('')

    const cuerpoLimpio = cuerpo.trim()
    if (cuerpoLimpio.length < 2) return setError(t('errReplyShort'))
    if (cuerpoLimpio.length > 4000) return setError(t('errReplyLong'))

    setEnviando(true)
    try {
      const res = await fetch('/api/foro/mensajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hilo_id: hiloId, cuerpo: cuerpoLimpio }) })
      const data = await res.json().catch(() => ({}))

      if (res.ok && data.id) {
        setCuerpo('')
        if (data.estado === 'pendiente') setNota(t('pendingReplyNote'))
        router.refresh()
        return
      }
      if (res.status === 409) {
        setError(t('closedNotice'))
        router.refresh()
      } else if (res.status === 429) {
        setError(t('errRate', { minutes: String(Math.max(1, Math.ceil((data.resetIn || 60000) / 60000))) }))
      } else if (res.status === 401) {
        setError(t('loginRequired'))
      } else {
        setError(data.error ? String(data.error) : t('errGeneric'))
      }
    } catch {
      setError(t('errGeneric'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="bg-[#FBFAF5] border border-line rounded-2xl p-5 sm:p-6">
      <label htmlFor="respuesta" className="block text-sm font-black text-ink mb-1.5">
        {t('replyLabel')}
      </label>
      <textarea
        id="respuesta"
        value={cuerpo}
        onChange={e => setCuerpo(e.target.value)}
        rows={5}
        maxLength={4000}
        placeholder={t('replyPlaceholder')}
        className="w-full border border-line-strong rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-signal/60 focus:border-brand-signal transition"
        required
      />
      <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
        <p className="text-xs text-ink/45">{cuerpo.trim().length}/4000</p>
        <button
          type="submit"
          disabled={enviando}
          className="inline-flex items-center gap-2 bg-brand-signal text-brand-darkNav font-black px-6 py-2.5 rounded-xl hover:brightness-110 transition disabled:opacity-60"
        >
          {enviando ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Send className="w-4 h-4" aria-hidden="true" />}
          {enviando ? t('replyPosting') : t('replySubmit')}
        </button>
      </div>
      {nota && (
        <p role="status" className="text-sm font-bold text-moss bg-moss/10 border border-moss/30 rounded-lg px-3 py-2 mt-3">
          {nota}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm font-bold text-clay bg-clay/[0.07] border border-clay/30 rounded-lg px-3 py-2 mt-3">
          {error}
        </p>
      )}
    </form>
  )
}
