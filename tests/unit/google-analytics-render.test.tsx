/** @jest-environment node */

import { renderToStaticMarkup } from 'react-dom/server'
import GoogleAnalyticsScript from '@/components/GoogleAnalyticsScript'
import { GA_BOOTSTRAP_ID } from '@/lib/google-analytics'

const ID_PRUEBA = 'G-TEST1234'

it('incluye la instalación de GA en el HTML del head sin ejecutar React en el navegador', () => {
  const html = renderToStaticMarkup(
    <html>
      {/* eslint-disable-next-line @next/next/no-head-element -- SSR del layout App Router, no Pages Router */}
      <head><GoogleAnalyticsScript id={ID_PRUEBA} /></head>
      <body />
    </html>,
  )

  expect(html).toContain(`<head><script id="${GA_BOOTSTRAP_ID}">`)
  expect(html).toContain(`https://www.googletagmanager.com/gtag/js?id=${ID_PRUEBA}`)
  expect(html).toContain(`gtag('config', "${ID_PRUEBA}",`)
  expect(html).toContain("analytics_storage: 'denied'")
  // No debe haber un script remoto incondicional ni un preload/preconnect a
  // Google, que abrirían una conexión antes de aceptar las cookies.
  expect(html).not.toContain('<script src=')
  expect(html).not.toContain('<link')
  expect(html.match(/<script /g)).toHaveLength(1)
})

it.each([null, 'off', 'GTM-ABCD123', '</script><script>alert(1)</script>'])('sin un ID GA4 válido (%s) no emite el snippet', (id) => {
  expect(renderToStaticMarkup(<GoogleAnalyticsScript id={id} />)).toBe('')
})
