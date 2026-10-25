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
  nombreCategoria,
} from '@/lib/foro'

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
    robots: { index: true, follow: true },
  }
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
    <div className="min-h-screen bg-gray-50">
      <section className="bg-brand-darkNav text-white">
        <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
          <p className="text-brand-signal font-black uppercase tracking-wide text-xs mb-3 flex items-center gap-2">
            <MessagesSquare className="w-4 h-4" aria-hidden="true" /> {t('foro.kicker')}
          </p>
          <h1 className="text-3xl sm:text-4xl font-black mb-3">{t('foro.title')}</h1>
          <p className="text-gray-300 max-w-2xl">{t('foro.subtitle')}</p>
          <LocalLink
            href="/foro/nuevo"
            className="mt-6 inline-flex items-center gap-2 bg-brand-signal text-brand-darkNav font-black px-6 py-3 rounded-xl hover:brightness-110 transition"
          >
            <PlusCircle className="w-5 h-5" aria-hidden="true" /> {t('foro.newThread')}
          </LocalLink>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <nav aria-label={t('foro.categoriesLabel')} className="flex flex-wrap gap-2 mb-8">
          <LocalLink
            href="/foro"
            className={`px-4 py-2 rounded-full text-sm font-black transition ${
              !catSlug ? 'bg-brand-darkNav text-white' : 'bg-white text-gray-700 border border-gray-200 hover:border-brand-signal'
            }`}
          >
            {t('foro.all')}
          </LocalLink>
          {categorias.map(cat => (
            <LocalLink
              key={cat.id}
              href={`/foro?cat=${cat.slug}`}
              className={`px-4 py-2 rounded-full text-sm font-bold transition ${
                catSlug === cat.slug ? 'bg-brand-darkNav text-white' : 'bg-white text-gray-700 border border-gray-200 hover:border-brand-signal'
              }`}
            >
              <span aria-hidden="true" className="mr-1">{cat.icono || '💬'}</span>
              {nombreCategoria(cat, locale)}
            </LocalLink>
          ))}
        </nav>

        {categoriaActiva && (
          <p className="text-sm text-gray-500 mb-4">{nombreCategoria(categoriaActiva, locale)} — {hilos.length} {hilos.length === 1 ? t('foro.threadOne') : t('foro.threadMany')}</p>
        )}

        {hilos.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center">
            <MessageSquare className="w-8 h-8 mx-auto text-gray-300 mb-3" aria-hidden="true" />
            <p className="text-gray-600 font-bold mb-4">{t('foro.empty')}</p>
            <LocalLink href="/foro/nuevo" className="inline-flex items-center gap-2 bg-brand-signal text-brand-darkNav font-black px-5 py-2.5 rounded-xl hover:brightness-110 transition">
              <PlusCircle className="w-4 h-4" aria-hidden="true" /> {t('foro.newThread')}
            </LocalLink>
          </div>
        ) : (
          <ul className="space-y-4">
            {hilos.map(hilo => {
              const cat = hilo.foro_categorias
              const autor = autores[hilo.user_id]
              const fecha = hilo.actualizado_en || hilo.creado_en
              return (
                <li key={hilo.id}>
                  <LocalLink
                    href={`/foro/hilo/${hilo.id}`}
                    className="block bg-white border border-gray-200 rounded-2xl p-5 hover:border-brand-signal hover:shadow-sm transition group"
                  >
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-gray-500 mb-2">
                      <span aria-hidden="true">{cat?.icono || '💬'}</span>
                      {nombreCategoria(cat, locale)}
                      {hilo.cerrado && (
                        <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase">{t('foro.closed')}</span>
                      )}
                    </div>
                    <h2 className="text-lg font-black text-gray-900 group-hover:text-brand-signal transition mb-1">
                      {hilo.titulo}
                    </h2>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3" style={{ whiteSpace: 'pre-line' }}>
                      {hilo.cuerpo}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-semibold">
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                        {hilo.mensajes_count || 0} {t('foro.repliesCount')}
                      </span>
                      {autor && <span>{autor}</span>}
                      <span>{haceTiempo(fecha, locale)}</span>
                    </div>
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
