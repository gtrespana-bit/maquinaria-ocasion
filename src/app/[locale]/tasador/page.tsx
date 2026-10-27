import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { alternatesSeo } from '@/lib/seo'
import TasadorClient from './TasadorClient'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()

  return {
    title: t('tasador.title'),
    description: t('tasador.subtitle'),
    alternates: alternatesSeo('/tasador'),
    robots: { index: true, follow: true } }
}

export default async function TasadorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  return <TasadorClient />
}
