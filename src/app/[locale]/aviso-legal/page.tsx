import type { Metadata } from 'next'
import { alternatesSeo } from '@/lib/seo'
import { setRequestLocale } from 'next-intl/server'
import DocumentoLegal from '@/components/DocumentoLegal'
import {AVISO_LEGAL, type IdiomaLegal } from '@/lib/textos-legales'
import { datosTitular, hayDatosTitular } from '@/lib/datos-legales'

/**
 * Aviso legal (LSSI art. 10).
 *
 * Los datos del titular NO están en el código: se leen del entorno
 * (`src/lib/datos-legales.ts`) para poder rellenarlos en Vercel sin publicar
 * datos fiscales en el repositorio. Mientras falten, la página no se indexa y
 * el pie no la enlaza, de modo que una web en producción nunca muestra un aviso
 * legal incompleto.
 */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const idioma: IdiomaLegal = locale === 'en' ? 'en' : 'es'
  return {
    title: AVISO_LEGAL[idioma].titulo,
    alternates: alternatesSeo('/aviso-legal'),
    // Sin los datos del titular, esta página no debe aparecer en Google.
    robots: hayDatosTitular() ? { index: true, follow: true } : { index: false, follow: true } }
}

export default async function AvisoLegalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const idioma: IdiomaLegal = locale === 'en' ? 'en' : 'es'
  const documento = AVISO_LEGAL[idioma]
  const titular = datosTitular()
  const esIngles = idioma === 'en'

  const etiquetas = esIngles
    ? { nombre: 'Name', nif: 'Tax ID', domicilio: 'Address', email: 'Email', registro: 'Registry details', pendiente: 'Pending completion' }
    : { nombre: 'Nombre o razón social', nif: 'NIF/CIF', domicilio: 'Domicilio', email: 'Correo electrónico', registro: 'Datos registrales', pendiente: 'Pendiente de completar' }

  const filas: Array<[string, string]> = [
    [etiquetas.nombre, titular.nombre],
    [etiquetas.nif, titular.nif],
    [etiquetas.domicilio, titular.domicilio],
    [etiquetas.email, titular.email],
  ]
  if (titular.registro) filas.push([etiquetas.registro, titular.registro])

  return (
    <DocumentoLegal
      documento={documento}
      bloqueInicial={
        <div className="border border-line bg-[#FBFAF5] p-5">
          <p className="t-label border-b border-line pb-2 text-ink/40">Titular del sitio</p>
          <dl className="mt-3 divide-y divide-line/70">
            {filas.map(([etiqueta, valor]) => (
              <div key={etiqueta} className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-2">
                <dt className="t-label shrink-0 pt-0.5 text-ink/45 sm:w-52">{etiqueta}</dt>
                <dd className="text-[13.5px] text-ink/80">
                  {valor || <span className="italic text-ink/35">{etiquetas.pendiente}</span>}
                </dd>
              </div>
            ))}
          </dl>
          {!hayDatosTitular() && (
            <p className="mt-4 border border-signal-deep/40 bg-signal-soft/40 px-3 py-2 text-[13px] leading-relaxed text-ink/70">
              {esIngles
                ? 'This page is not yet linked from the footer or indexed by search engines: the owner’s identification details are being completed.'
                : 'Esta página aún no se enlaza desde el pie ni se indexa en buscadores: se están completando los datos identificativos del titular.'}
            </p>
          )}
        </div>
      }
    />
  )
}
