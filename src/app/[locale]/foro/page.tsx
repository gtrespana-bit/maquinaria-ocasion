import type { Metadata } from 'next'
import LocalLink from '@/components/LocalLink'
import { MessageSquare, PlusCircle, MessagesSquare } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { alternatesSeo } from '@/lib/seo'
import {
  autoresForo,
  getCategoriasForo,
  getHilosForo,
  haceTiempo,
  nombreCategoria } from '@/lib/foro'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ cat?: string }>
}

export const revalidate = 60

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()

  return {
    title: t('foro.title'),
    description: t('foro.description'),
    alternates: alternatesSeo('/foro'),
    robots: { index: true, follow: true } }
}

export default async function ForoPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()
  const { cat: catSlug } = await searchParams

  const categorias = await getCategoriasForo()
  const categoriaActiva = catSlug ? categorias.find(c => c.slug === catSlug) : undefined
  // Slug desconocido: no mezclar con «todos», mostrar vacío.
  const hilos = catSlug && !categoriaActiva ? [] : await getHilosForo(categoriaActiva?.id, 50)
  const autores = await autoresForo(hilos.map(h => h.user_id))

  return (
    <div className="bg-paper">
      <header className="on-dark relative overflow-hidden bg-ink text-paper">
        <div aria-hidden="true" className="blueprint absolute inset-0 opacity-40" />
        <div className="shell relative pb-12 pt-10 md:pb-16 md:pt-14">
          <p className="t-eyebrow flex items-center gap-2 text-signal">
            <MessagesSquare className="h-3 w-3" strokeWidth={1.8} aria-hidden="true" /> {t('foro.kicker')}
          </p>
          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="t-display t-display-lg text-paper lg:col-span-7">{t('foro.title')}</h1>
            <p className="text-[14.5px] leading-relaxed text-paper/60 lg:col-span-5 lg:border-l lg:border-line-dark lg:pl-6">
              {t('foro.subtitle')}
            </p>
          </div>
          <div className="mt-8">
            <LocalLink href="/foro/nuevo" className="btn btn-signal">
              <PlusCircle className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" /> {t('foro.newThread')}
            </LocalLink>
          </div>
        </div>
      </header>

      <div className="shell py-10 md:py-14">
        <nav aria-label={t('foro.categoriesLabel')} className="hide-scrollbar flex gap-1 overflow-x-auto border-y border-line py-2">
          <LocalLink
            href="/foro"
            className={`t-label shrink-0 whitespace-nowrap px-2.5 py-1.5 transition-colors ${
              !catSlug ? 'bg-ink text-paper' : 'text-ink/55 hover:bg-paper-2 hover:text-ink'
            }`}
          >
            {t('foro.all')}
          </LocalLink>
          {categorias.map(cat => (
            <LocalLink
              key={cat.id}
              href={`/foro?cat=${cat.slug}`}
              className={`t-label shrink-0 whitespace-nowrap px-2.5 py-1.5 transition-colors ${
                catSlug === cat.slug ? 'bg-ink text-paper' : 'text-ink/55 hover:bg-paper-2 hover:text-ink'
              }`}
            >
              {nombreCategoria(cat, locale)}
            </LocalLink>
          ))}
        </nav>

        {categoriaActiva && (
          <p className="t-label mt-6 text-ink/45">
            {nombreCategoria(categoriaActiva, locale)} — {hilos.length}{' '}
            {hilos.length === 1 ? t('foro.threadOne') : t('foro.threadMany')}
          </p>
        )}

        {hilos.length === 0 ? (
          <div className="mt-6 border border-line bg-paper-2/40 px-6 py-16 text-center">
            <p className="t-display t-display-sm text-ink/30">{t('foro.empty')}</p>
            <LocalLink href="/foro/nuevo" className="btn btn-ink mt-6">
              <PlusCircle className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" /> {t('foro.newThread')}
            </LocalLink>
          </div>
        ) : (
          <ul className="mt-6 border-t border-line">
            {hilos.map(hilo => {
              const cat = hilo.foro_categorias
              const autor = autores[hilo.user_id]
              const fecha = hilo.actualizado_en || hilo.creado_en
              return (
                <li key={hilo.id}>
                  <LocalLink
                    href={`/foro/hilo/${hilo.id}`}
                    className="group/row block border-b border-line py-5"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="t-label text-ink/40">{nombreCategoria(cat, locale)}</span>
                      {hilo.cerrado && (
                        <span className="t-label border border-line px-1.5 py-0.5 text-ink/40">{t('foro.closed')}</span>
                      )}
                      <span className="t-label ml-auto flex items-center gap-1.5 text-ink/35">
                        <MessageSquare className="h-2.5 w-2.5" aria-hidden="true" />
                        {hilo.mensajes_count || 0}
                      </span>
                    </div>
                    <h2 className="mt-2 text-[18px] font-semibold leading-snug tracking-[-0.02em] text-ink group-hover/row:underline group-hover/row:underline-offset-4">
                      {hilo.titulo}
                    </h2>
                    <p className="mt-1.5 line-clamp-2 max-w-3xl text-[13.5px] leading-relaxed text-muted" style={{ whiteSpace: 'pre-line' }}>
                      {hilo.cuerpo}
                    </p>
                    <p className="t-label mt-2.5 flex flex-wrap items-center gap-3 text-ink/35">
                      {autor && <span className="text-ink/55">{autor}</span>}
                      <span>{haceTiempo(fecha, locale)}</span>
                    </p>
                  </LocalLink>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
