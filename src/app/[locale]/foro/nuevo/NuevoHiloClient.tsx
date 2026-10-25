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
      <div className="min-h-[50vh] flex items-center justify-center text-gray-500 font-bold">
        {t('loading')}
      </div>
    )
  }

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-black text-gray-900 mb-3">{t('newThread')}</h1>
        <p className="text-gray-600 mb-8">{t('loginRequired')}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <LocalLink href="/login" className="w-full sm:w-auto bg-brand-signal text-brand-darkNav font-black px-8 py-3 rounded-xl hover:brightness-110 transition">
            {t('login')}
          </LocalLink>
          <LocalLink href="/register" className="w-full sm:w-auto border-2 border-gray-300 text-gray-800 font-black px-8 py-3 rounded-xl hover:border-brand-signal transition">
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
        body: JSON.stringify({ titulo: tituloLimpio, cuerpo: cuerpoLimpio, categoria_id: categoriaId }),
      })
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

  const inputCls =
    'w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-signal/60 focus:border-brand-signal transition'

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <LocalLink href="/foro" className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-brand-signal transition mb-6">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> {t('backToForum')}
      </LocalLink>

      <h1 className="text-3xl font-black text-gray-900 mb-2">{t('newThread')}</h1>
      <p className="text-gray-600 mb-8">{t('newSubtitle')}</p>

      <form onSubmit={enviar} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
        <div>
          <label htmlFor="categoria" className="block text-sm font-black text-gray-800 mb-1.5">{t('categoryLabel')}</label>
          <select
            id="categoria"
            value={categoriaId}
            onChange={e => setCategoriaId(e.target.value)}
            className={inputCls}
            required
          >
            <option value="">{t('selectCategory')}</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.icono || '💬'} {locale === 'en' ? cat.nombre_en : cat.nombre_es}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="titulo" className="block text-sm font-black text-gray-800 mb-1.5">{t('titleLabel')}</label>
          <input
            id="titulo"
            type="text"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            maxLength={160}
            placeholder={t('titlePlaceholder')}
            className={inputCls}
            required
          />
          <p className="text-xs text-gray-400 mt-1">{titulo.trim().length}/160</p>
        </div>

        <div>
          <label htmlFor="cuerpo" className="block text-sm font-black text-gray-800 mb-1.5">{t('bodyLabel')}</label>
          <textarea
            id="cuerpo"
            value={cuerpo}
            onChange={e => setCuerpo(e.target.value)}
            rows={8}
            maxLength={6000}
            placeholder={t('bodyPlaceholder')}
            className={inputCls}
            required
          />
          <p className="text-xs text-gray-400 mt-1">{cuerpo.trim().length}/6000</p>
        </div>

        {error && (
          <p role="alert" className="text-sm font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3">
          <LocalLink href="/foro" className="text-sm font-bold text-gray-500 hover:text-gray-800 transition">
            {t('cancel')}
          </LocalLink>
          <button
            type="submit"
            disabled={enviando}
            className="inline-flex items-center gap-2 bg-brand-signal text-brand-darkNav font-black px-6 py-3 rounded-xl hover:brightness-110 transition disabled:opacity-60"
          >
            {enviando ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Send className="w-4 h-4" aria-hidden="true" />}
            {enviando ? t('posting') : t('submit')}
          </button>
        </div>
      </form>
    </div>
  )
}
