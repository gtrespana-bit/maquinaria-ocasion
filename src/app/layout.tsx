import { serializeJsonLd } from '@/lib/serialize-json-ld'
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'

// Lazy load heavy providers to reduce initial JS & main-thread work
import dynamic from 'next/dynamic'
const AuthProvider = dynamic(() => import('@/components/AuthProvider').then(m => ({ default: m.AuthProvider })))
import RootClientEffects from '@/components/RootClientEffects'
import GoogleAnalyticsScript from '@/components/GoogleAnalyticsScript'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import CookieConsent from '@/components/CookieConsent'

// Fuente Inter autohospedada (woff2 locales) en lugar de next/font/google.
const inter = localFont({
  src: [
    { path: './fonts/inter-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/inter-latin-400-italic.woff2', weight: '400', style: 'italic' },
    { path: './fonts/inter-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './fonts/inter-latin-500-italic.woff2', weight: '500', style: 'italic' },
    { path: './fonts/inter-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: './fonts/inter-latin-600-italic.woff2', weight: '600', style: 'italic' },
    { path: './fonts/inter-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: './fonts/inter-latin-700-italic.woff2', weight: '700', style: 'italic' },
    { path: './fonts/inter-latin-900-normal.woff2', weight: '900', style: 'normal' },
    { path: './fonts/inter-latin-900-italic.woff2', weight: '900', style: 'italic' },
  ],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})

export const viewport: Viewport = {
  themeColor: '#0F172A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  colorScheme: 'light',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://maquinaria.click'),
  title: {
    default: 'Maquinaria agrícola, de obra y herramientas de ocasión | MaquinariaOcasión',
    template: '%s | MaquinariaOcasión',
  },
  description:
    'Marketplace especializado en maquinaria agrícola, maquinaria de obra y herramientas de segunda mano en España. Anuncios con precio, fotos y ficha técnica. Publica gratis.',
  keywords: [
    'maquinaria agrícola segunda mano',
    'maquinaria de obra de ocasión',
    'tractores de segunda mano',
    'miniexcavadora usada',
    'herramientas de segunda mano',
    'maquinaria usada España',
    'aperos agrícolas ocasión',
    'maquinaria de construcción usada',
  ],
  authors: [{ name: 'MaquinariaOcasión' }],
  creator: 'MaquinariaOcasión',
  publisher: 'MaquinariaOcasión',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://maquinaria.click',
    siteName: 'MaquinariaOcasión',
    title: 'Maquinaria agrícola, de obra y herramientas de ocasión | MaquinariaOcasión',
    description: 'Marketplace especializado en maquinaria agrícola, de obra y herramientas de segunda mano en España. Publica gratis.',
    images: [
      {
        url: '/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'MaquinariaOcasión — Maquinaria agrícola, de obra y herramientas de ocasión en España',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Maquinaria agrícola, de obra y herramientas de ocasión',
    description: 'Marketplace especializado en maquinaria agrícola, de obra y herramientas de segunda mano en España. Publica gratis.',
    images: ['/og-image.webp'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  category: 'marketplace',
}

/**
 * Origen de Supabase para el preconnect del <head>.
 *
 * Se lee de la MISMA variable que usan los clientes (NEXT_PUBLIC_SUPABASE_URL)
 * en lugar de fijarlo a mano: durante el relanzamiento apuntaba al proyecto
 * viejo de marketplace-vzla mientras las claves eran del de MaquinariaOcasión, y
 * eso produjo el `401 Invalid API key` en todo el sitio.
 */
const SUPABASE_ORIGIN =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://proyecto-supabase-a-configurar.supabase.co'

// IMPORTANTE — LAYOUT RAÍZ 100% ESTÁTICO. (ver comentario original)
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <head>
        <GoogleAnalyticsScript />
        <link rel="preconnect" href={SUPABASE_ORIGIN} />
        <link rel="dns-prefetch" href={SUPABASE_ORIGIN} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MaquinariaOcasión" />
        <meta name="application-name" content="MaquinariaOcasión" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="geo.region" content="ES" />
        <meta name="geo.placename" content="España" />
        <meta name="language" content="Spanish" />
        <meta name="revisit-after" content="1 days" />
        <meta name="rating" content="General" />
        <meta name="distribution" content="Global" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': 'https://maquinaria.click/#organization',
                  name: 'MaquinariaOcasión',
                  url: 'https://maquinaria.click/',
                  logo: {
                    '@type': 'ImageObject',
                    url: 'https://maquinaria.click/logo-maquinariaocasion.png',
                    width: 320,
                    height: 320
                  },
                  email: process.env.CONTACTO_EMAIL?.trim() || 'soporte@maquinaria.click',
                  contactPoint: {
                    '@type': 'ContactPoint',
                    email: process.env.CONTACTO_EMAIL?.trim() || 'soporte@maquinaria.click',
                    contactType: 'customer service',
                    availableLanguage: ['Spanish', 'English'],
                    areaServed: 'ES'
                  },
                  areaServed: { '@type': 'Country', name: 'España' }
                },
                {
                  '@type': 'WebSite',
                  '@id': 'https://maquinaria.click/#website',
                  name: 'MaquinariaOcasión',
                  url: 'https://maquinaria.click/',
                  inLanguage: 'es-ES',
                  description:
                    'Marketplace especializado en maquinaria y herramienta de ocasión en España.',
                  publisher: { '@id': 'https://maquinaria.click/#organization' },
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: {
                      '@type': 'EntryPoint',
                      urlTemplate: 'https://maquinaria.click/catalogo?q={search_term_string}'
                    },
                    'query-input': 'required name=search_term_string'
                  }
                }
              ]
            })
          }}
        />
      </head>
      <body className="bg-white antialiased" suppressHydrationWarning>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-primary focus:text-white focus:rounded-lg focus:shadow-lg">
          Saltar al contenido principal
        </a>
        <AuthProvider>
          {children}
        </AuthProvider>
        <GoogleAnalytics />
        {/* AVISO DE COOKIES — debe permanecer montado en TODAS las páginas.
            El Consent Mode es estricto: sin pulsar «Aceptar», `localStorage`
            nunca vale 'accepted', no se descarga gtag.js y GA4 (ni Vercel
            Analytics ni AnaliticaVisitas) no envían nada. En 2026-10 se detectó
            que el banner había quedado sin montar y la web entera medía 0
            visitas en Analytics. No quitarlo sin sustituirlo por otro mecanismo
            de consentimiento que escriba la misma clave (`cookie-consent`). */}
        <CookieConsent />
        <RootClientEffects />
      </body>
    </html>
  )
}
