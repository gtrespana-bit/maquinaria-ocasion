import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import LocalLink from '@/components/LocalLink'
import { ArrowLeft, Lock, MessageSquare } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { alternatesSeo } from '@/lib/seo'
import { serializeJsonLd } from '@/lib/serialize-json-ld'
import {
  autoresForo,
  getHiloForo,
  getMensajesForo,
  haceTiempo,
  nombreCategoria,
} from '@/lib/foro'
import ResponderClient from './ResponderClient'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Props = { params: Promise<{ locale: string; id: string }> }

export const revalidate = 30

async function getHiloSeguro(id: string) {
  if (!UUID_RE.test(id)) return null
  return getHiloForo(id)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params
  setRequestLocale(locale)
  const t = await getTranslations()
  const hilo = await getHiloSeguro(id)
  if (!hilo) return { title: t('foro.title'), robots: { index: false } }

  const excerpt = hilo.cuerpo.replace(/\s+/g, ' ').slice(0, 155)
  return {
    title: `${hilo.titulo} · ${t('foro.title')}`,
    description: excerpt,
    alternates: alternatesSeo(`/foro/hilo/${id}`),
    robots: { index: true, follow: true },
  }
}

export default async function HiloPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const t = await getTranslations()

  if (!UUID_RE.test(id)) notFound()

  const hilo = await getHiloSeguro(id)
  if (!hilo) notFound()

  const mensajes = await getMensajesForo(hilo.id)
  const autores = await autoresForo([hilo.user_id, ...mensajes.map(m => m.user_id)])
  const cat = hilo.foro_categorias
  const autorNombre = autores[hilo.user_id] || t('foro.unknownUser')
  const fechaPublicacion = hilo.creado_en || hilo.actualizado_en
  const fechaModificacion = hilo.actualizado_en || hilo.creado_en
  const enRevision = hilo.estado_moderacion === 'pendiente'

  const jsonLd = serializeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: hilo.titulo,
    text: hilo.cuerpo.slice(0, 500),
    articleSection: nombreCategoria(cat, locale),
    datePublished: fechaPublicacion,
    dateModified: fechaModificacion,
    author: { '@type': 'Person', name: autorNombre },
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/ReplyAction',
      userInteractionCount: hilo.mensajes_count || 0,
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <LocalLink href="/foro" className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-brand-signal transition mb-6">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> {t('foro.backToForum')}
        </LocalLink>

        <article className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wide text-gray-500 mb-3">
            <span className="inline-flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-full">
              <span aria-hidden="true">{cat?.icono || '💬'}</span>
              {nombreCategoria(cat, locale)}
            </span>
            {hilo.cerrado && (
              <span className="inline-flex items-center gap-1 bg-gray-200 text-gray-600 px-2.5 py-1 rounded-full">
                <Lock className="w-3 h-3" aria-hidden="true" /> {t('foro.closed')}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">{hilo.titulo}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 font-semibold mb-6">
            <span className="font-black text-gray-800">{autorNombre}</span>
            <span>{haceTiempo(fechaPublicacion, locale)}</span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="w-4 h-4" aria-hidden="true" />
              {hilo.mensajes_count || 0} {t('foro.repliesCount')}
            </span>
          </div>

          {enRevision && (
            <p className="text-sm font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-6">
              {t('foro.pendingNote')}
            </p>
          )}
          {hilo.cerrado && (
            <p className="text-sm font-bold text-gray-600 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 mb-6">
              {t('foro.closedNotice')}
            </p>
          )}

          <div className="text-gray-800 leading-relaxed whitespace-pre-line">{hilo.cuerpo}</div>
        </article>

        <section className="mt-8" aria-labelledby="respuestas-titulo">
          <h2 id="respuestas-titulo" className="text-lg font-black text-gray-900 mb-4">
            {t('foro.answersTitle')} ({mensajes.length})
          </h2>

          {mensajes.length === 0 ? (
            <p className="text-gray-500 font-semibold mb-6">{t('foro.noReplies')}</p>
          ) : (
            <ul className="space-y-4 mb-6">
              {mensajes.map(msg => (
                <li key={msg.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 font-semibold mb-2">
                    <span className="font-black text-gray-800">{autores[msg.user_id] || t('foro.unknownUser')}</span>
                    <span>{haceTiempo(msg.creado_en, locale)}</span>
                  </div>
                  <div className="text-gray-800 leading-relaxed whitespace-pre-line">{msg.cuerpo}</div>
                </li>
              ))}
            </ul>
          )}

          <ResponderClient hiloId={hilo.id} cerrado={!!hilo.cerrado} />
        </section>
      </div>
    </div>
  )
}
