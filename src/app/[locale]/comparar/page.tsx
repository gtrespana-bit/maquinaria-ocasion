import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { alternatesSeo } from '@/lib/seo'
import CompararClient from './CompararClient'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()

  return {
    title: t('comparar.title'),
    description: t('comparar.subtitle'),
    alternates: alternatesSeo('/comparar'),
    // Página utilitaria con contenido del usuario: no aporta indexación.
    robots: { index: false, follow: false },
  }
}

export default async function CompararPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  return <CompararClient />
}
