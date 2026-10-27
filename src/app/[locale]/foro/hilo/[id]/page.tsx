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
  nombreCategoria } from '@/lib/foro'
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
    robots: { index: true, follow: true } }
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
      userInteractionCount: hilo.mensajes_count || 0 } })

  return (
    <div className="bg-paper">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <div className="shell max-w-4xl py-8 md:py-12">
        <LocalLink
          href="/foro"
          className="t-label inline-flex items-center gap-2 text-ink/45 transition-colors hover:text-ink"
        >
          <ArrowLeft size={11} aria-hidden="true" /> {t('foro.backToForum')}
        </LocalLink>

        <article className="mt-6 border border-line bg-[#FBFAF5] p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="t-label border border-line px-2 py-1 text-ink/50">
              {nombreCategoria(cat, locale)}
            </span>
            {hilo.cerrado && (
              <span className="t-label inline-flex items-center gap-1 border border-line px-2 py-1 text-ink/40">
                <Lock size={9} aria-hidden="true" /> {t('foro.closed')}
              </span>
            )}
          </div>

          <h1 className="t-display t-display-md mt-4 text-ink">{hilo.titulo}</h1>

          <div className="t-label mt-3 flex flex-wrap items-center gap-3 border-b border-line pb-4 text-ink/40">
            <span className="text-ink/70">{autorNombre}</span>
            <span>{haceTiempo(fechaPublicacion, locale)}</span>
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare size={10} aria-hidden="true" />
              {hilo.mensajes_count || 0} {t('foro.repliesCount')}
            </span>
          </div>

          {enRevision && (
            <p className="mt-5 border border-signal-deep/40 bg-signal-soft/40 px-3 py-2 text-[12.5px] text-ink/70">
              {t('foro.pendingNote')}
            </p>
          )}
          {hilo.cerrado && (
            <p className="mt-5 border border-line bg-paper-2/60 px-3 py-2 text-[12.5px] text-ink/60">
              {t('foro.closedNotice')}
            </p>
          )}

          <div className="mt-5 whitespace-pre-line text-[15px] leading-[1.75] text-ink/80">{hilo.cuerpo}</div>
        </article>

        <section className="mt-12" aria-labelledby="respuestas-titulo">
          <h2 id="respuestas-titulo" className="t-eyebrow flex items-baseline justify-between border-b border-ink pb-3 text-ink">
            {t('foro.answersTitle')}
            <span className="t-num text-[11px] text-ink/40">{mensajes.length}</span>
          </h2>

          {mensajes.length === 0 ? (
            <p className="mt-6 text-[13.5px] font-medium text-muted">{t('foro.noReplies')}</p>
          ) : (
            <ul className="mt-2 divide-y divide-line border-b border-line">
              {mensajes.map(msg => (
                <li key={msg.id} className="py-5">
                  <div className="t-label flex flex-wrap items-center gap-3 text-ink/40">
                    <span className="text-ink/70">{autores[msg.user_id] || t('foro.unknownUser')}</span>
                    <span>{haceTiempo(msg.creado_en, locale)}</span>
                  </div>
                  <div className="mt-2 whitespace-pre-line text-[14px] leading-[1.7] text-ink/75">{msg.cuerpo}</div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8">
            <ResponderClient hiloId={hilo.id} cerrado={!!hilo.cerrado} />
          </div>
        </section>
      </div>
    </div>
  )
}