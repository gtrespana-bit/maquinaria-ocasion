import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { alternatesSeo } from '@/lib/seo'

// La página es un formulario cliente, pero su metadata debe seguir siendo
// específica: sin este layout heredaba el título genérico de la portada.
export const metadata: Metadata = {
  title: 'Publica tu maquinaria gratis en España',
  description:
    'Publica gratis tu maquinaria de ocasión. Añade fotos, precio y ficha técnica y habla directamente con compradores de toda España.',
  alternates: alternatesSeo('/publicar'),
  openGraph: {
    title: 'Publica tu maquinaria gratis en España',
    description:
      'Crea tu anuncio con fotos, precio y ficha técnica y contacta con compradores de toda España.',
    url: 'https://maquinaria.click/publicar',
    siteName: 'MaquinariaOcasión',
    type: 'website',
    locale: 'es_ES',
    images: [{ url: '/og-image.webp', width: 1200, height: 630, alt: 'Publica tu maquinaria en MaquinariaOcasión' }] } }

export default function PublicarLayout({ children }: { children: ReactNode }) {
  return children
}
