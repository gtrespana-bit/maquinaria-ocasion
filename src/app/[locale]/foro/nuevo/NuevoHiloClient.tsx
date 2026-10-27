'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2, Send } from 'lucide-react'
import LocalLink from '@/components/LocalLink'
import { useAuth } from '@/components/AuthProvider'
import { localeDeRuta } from '@/lib/locale-path'
import { routing } from '@/i18n/routing'
import type { ForoCategoria } from '@/lib/foro'

export default function NuevoHiloClient({ categorias }: { categorias: ForoCategoria[] }) {
  const t = useTranslations('foro')
  const { session, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const locale = localeDeRuta(pathname)
  const [categoriaId, setCategoriaId] = useState('')
  const [titulo, setTitulo] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (loading) {
    return (
      <div className="shell py-16">
        <p className="t-label text-ink/40">{t('loading')}</p>
        <div className="skeleton mt-6 h-8 w-1/2" />
        <div className="skeleton mt-3 h-40 w-full" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-20">
        <p className="t-eyebrow text-ink/40">Comunidad</p>
        <h1 className="t-display t-display-lg mt-5 text-ink">{t('newThread')}</h1>
        <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-muted">{t('loginRequired')}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <LocalLink href="/login" className="btn btn-ink btn-lg justify-center">{t('login')}</LocalLink>
          <LocalLink href="/register" className="btn btn-outline btn-lg justify-center">{t('register')}</LocalLink>
        </div>
      </div>
    )
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (enviando) return
    setError('')

    const tituloLimpio = titulo.trim()
    const cuerpoLimpio = cuerpo.trim()
    if (tituloLimpio.length < 8) return setError(t('errTitleShort'))
    if (tituloLimpio.length > 160) return setError(t('errTitleLong'))
    if (cuerpoLimpio.length < 10) return setError(t('errBodyShort'))
    if (cuerpoLimpio.length > 6000) return setError(t('errBodyLong'))
    if (!categoriaId) return setError(t('errCategory'))

    setEnviando(true)
    try {
      const res = await fetch('/api/foro/hilos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: tituloLimpio, cuerpo: cuerpoLimpio, categoria_id: categoriaId }) })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.id) {
        const prefijo = locale === routing.defaultLocale ? '' : `/${locale}`
        router.push(`${prefijo}/foro/hilo/${data.id}`)
        return
      }
      if (res.status === 429) {
        setError(t('errRate', { minutes: String(Math.max(1, Math.ceil((data.resetIn || 60000) / 60000))) }))
      } else if (data.error) {
        setError(String(data.error))
      } else {
        setError(t('errGeneric'))
      }
    } catch {
      setError(t('errGeneric'))
    } finally {
      setEnviando(false)
    }
  }

    'w-full border border-line-strong rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-signal/60 focus:border-brand-signal transition'
  return (
    <div className="bg-paper">
      <div className="shell max-w-3xl py-10 md:py-14">
        <LocalLink
          href="/foro"
          className="t-label inline-flex items-center gap-2 text-ink/45 transition-colors hover:text-ink"
        >
          <ArrowLeft size={11} aria-hidden="true" /> {t('backToForum')}
        </LocalLink>

        <p className="t-eyebrow mt-8 text-ink/40">Comunidad</p>
        <h1 className="t-display t-display-lg mt-5 text-ink">{t('newThread')}</h1>
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-muted">{t('newSubtitle')}</p>

        <form onSubmit={enviar} className="mt-8 space-y-6 border border-line bg-[#FBFAF5] p-6 md:p-8">
          <div>
            <label htmlFor="categoria" className="t-label mb-1.5 block text-ink/50">{t('categoryLabel')}</label>
            <select
              id="categoria"
              value={categoriaId}
              onChange={e => setCategoriaId(e.target.value)}
              className="field text-[15px]"
              required
            >
              <option value="">{t('selectCategory')}</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {locale === 'en' ? cat.nombre_en : cat.nombre_es}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="titulo" className="t-label mb-1.5 block text-ink/50">{t('titleLabel')}</label>
            <input
              id="titulo"
              type="text"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              maxLength={160}
              placeholder={t('titlePlaceholder')}
              className="field text-[15px]"
              required
            />
            <p className="t-label mt-1 text-ink/30">{titulo.trim().length}/160</p>
          </div>

          <div>
            <label htmlFor="cuerpo" className="t-label mb-1.5 block text-ink/50">{t('bodyLabel')}</label>
            <textarea
              id="cuerpo"
              value={cuerpo}
              onChange={e => setCuerpo(e.target.value)}
              rows={8}
              maxLength={6000}
              placeholder={t('bodyPlaceholder')}
              className="field resize-none text-[15px]"
              required
            />
            <p className="t-label mt-1 text-ink/30">{cuerpo.trim().length}/6000</p>
          </div>

          {error && (
            <p role="alert" className="border border-clay/40 bg-clay/[0.05] px-3 py-2 text-[13px] text-clay">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-line pt-5">
            <LocalLink href="/foro" className="t-label text-ink/50 transition-colors hover:text-ink">
              {t('cancel')}
            </LocalLink>
            <button
              type="submit"
              disabled={enviando}
              className="btn btn-ink btn-lg disabled:opacity-60"
            >
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
              {enviando ? t('posting') : t('submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
