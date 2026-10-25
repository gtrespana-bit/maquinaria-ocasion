import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getCategoriasForo } from '@/lib/foro'
import NuevoHiloClient from './NuevoHiloClient'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()

  return {
    title: t('foro.newThread'),
    description: t('foro.newSubtitle'),
    robots: { index: false, follow: false },
  }
}

export default async function NuevoHiloPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const categorias = await getCategoriasForo()

  return <NuevoHiloClient categorias={categorias} />
}
