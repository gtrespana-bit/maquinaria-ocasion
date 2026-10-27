import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { alternatesSeo } from '@/lib/seo'

// /creditos es una página cliente; la metadata vive en este layout para no
// convertir el formulario de compra en un componente de servidor.
export const metadata: Metadata = {
  title: 'Créditos y destacados para tu maquinaria',
  description:
    'Compra créditos para destacar tu maquinaria y conseguir más visibilidad. Paquetes desde 5 €, sin suscripción y con pago seguro.',
  alternates: alternatesSeo('/creditos'),
  openGraph: {
    title: 'Créditos y destacados para tu maquinaria',
    description:
      'Destaca tu anuncio de maquinaria con créditos desde 5 €, sin suscripción.',
    url: 'https://maquinaria.click/creditos',
    siteName: 'MaquinariaOcasión',
    type: 'website',
    locale: 'es_ES',
    images: [{ url: '/og-image.webp', width: 1200, height: 630, alt: 'Créditos MaquinariaOcasión' }] } }

export default function CreditosLayout({ children }: { children: ReactNode }) {
  return children
}
