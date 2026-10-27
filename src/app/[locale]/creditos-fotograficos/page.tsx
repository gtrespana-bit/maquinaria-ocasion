import type { Metadata } from 'next'
import { alternatesSeo } from '@/lib/seo'
import { setRequestLocale } from 'next-intl/server'
import registroDossiers from '@/lib/semilla-dossiers.json'

/**
 * Créditos fotográficos.
 *
 * Algunas fotografías de anuncios se publican bajo licencias que exigen
 * atribución (p. ej. CC BY / CC BY-SA) o bajo licencias directas cuyo titular
 * ha pedido constar aquí. La lista se alimenta del mismo registro que usa el
 * pipeline de importación (`src/lib/semilla-dossiers.json`), de modo que un
 * dossier con obligación de crédito no puede entrar en la web sin aparecer
 * en esta página: el importador bloquea la importación si el expediente no
 * declara atribución, cambios y una URL que apunte a esta ruta.
 *
 * Cada bloque lleva un ancla `#sem-xxx` para que el expediente interno pueda
 * referenciar el crédito exacto de cada anuncio.
 */

type DossierCredito = {
  ref: string
  marcaModelo: string
  autor: string
  fuente: string
  fuenteUrl: string
  licencia: string
  licenciaUrl: string
  cambios: string
}

function dossiersConCredito(): DossierCredito[] {
  const dossiers = (registroDossiers as { dossiers?: Record<string, any> }).dossiers || {}
  return Object.entries(dossiers)
    .filter(([, dossier]) => {
      const p = dossier?.procedencia || {}
      // Solo se listan los dossiers cuya licencia exige atribución pública
      // (CC BY / CC BY-SA) o que declaran un texto de crédito expreso.
      return /\bcc\s+by(?:\s|-)/i.test(String(p.licencia || '')) || String(p.atribucion || '').trim() !== ''
    })
    .map(([ref, dossier]) => {
      const p = dossier?.procedencia || {}
      return {
        ref,
        marcaModelo: String(dossier?.unidad?.marcaModelo || ref),
        autor: String(p.autor || ''),
        fuente: String(p.nombre || ''),
        fuenteUrl: String(p.url || ''),
        licencia: String(p.licencia || ''),
        licenciaUrl: String(p.licenciaUrl || ''),
        cambios: String(p.cambios || ''),
      }
    })
    .sort((a, b) => a.marcaModelo.localeCompare(b.marcaModelo))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'en' ? 'Photo credits' : 'Créditos fotográficos',
    alternates: alternatesSeo('/creditos-fotograficos'),
    robots: { index: true, follow: true },
  }
}

export default async function CreditosFotograficosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const en = locale === 'en'
  const creditos = dossiersConCredito()

  const t = en
    ? {
        titulo: 'Photo credits',
        entradilla:
          'Some listing photographs on MaquinariaOcasión are published under licences that require attribution, or under direct licences whose holders asked to be credited here. This page lists the author, source, licence and changes applied to each such set of photographs.',
        vacio:
          'There are currently no photographs published under a licence that requires a public credit. This page is updated whenever attributed photographs are published.',
        autor: 'Author',
        fuente: 'Source',
        licencia: 'Licence',
        cambios: 'Changes',
      }
    : {
        titulo: 'Créditos fotográficos',
        entradilla:
          'Algunas fotografías de anuncios de MaquinariaOcasión se publican bajo licencias que exigen atribución, o bajo licencias directas cuyos titulares han pedido constar aquí. Esta página recoge el autor, la fuente, la licencia y los cambios aplicados a cada conjunto de fotografías.',
        vacio:
          'En este momento no hay fotografías publicadas bajo una licencia que exija crédito público. Esta página se actualiza cuando se publiquen fotografías con atribución.',
        autor: 'Autor',
        fuente: 'Fuente',
        licencia: 'Licencia',
        cambios: 'Cambios',
      }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-black text-gray-800 mb-2">{t.titulo}</h1>
      <p className="text-gray-600 mb-8 leading-relaxed">{t.entradilla}</p>

      {creditos.length === 0 ? (
        <p className="text-gray-600 leading-relaxed">{t.vacio}</p>
      ) : (
        <div className="space-y-6">
          {creditos.map((credito) => (
            <section
              key={credito.ref}
              id={credito.ref.toLowerCase()}
              className="bg-gray-50 border border-gray-200 rounded-2xl p-5 scroll-mt-24"
            >
              <h2 className="text-lg font-bold text-gray-800 mb-3">{credito.marcaModelo}</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex flex-col sm:flex-row sm:gap-2">
                  <dt className="font-semibold text-gray-700 sm:w-40 shrink-0">{t.autor}</dt>
                  <dd className="text-gray-700">{credito.autor}</dd>
                </div>
                <div className="flex flex-col sm:flex-row sm:gap-2">
                  <dt className="font-semibold text-gray-700 sm:w-40 shrink-0">{t.fuente}</dt>
                  <dd className="text-gray-700">
                    {credito.fuenteUrl ? (
                      <a
                        href={credito.fuenteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-brand-signal"
                      >
                        {credito.fuente || credito.fuenteUrl}
                      </a>
                    ) : (
                      credito.fuente
                    )}
                  </dd>
                </div>
                <div className="flex flex-col sm:flex-row sm:gap-2">
                  <dt className="font-semibold text-gray-700 sm:w-40 shrink-0">{t.licencia}</dt>
                  <dd className="text-gray-700">
                    {credito.licenciaUrl ? (
                      <a
                        href={credito.licenciaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-brand-signal"
                      >
                        {credito.licencia}
                      </a>
                    ) : (
                      credito.licencia
                    )}
                  </dd>
                </div>
                {credito.cambios && (
                  <div className="flex flex-col sm:flex-row sm:gap-2">
                    <dt className="font-semibold text-gray-700 sm:w-40 shrink-0">{t.cambios}</dt>
                    <dd className="text-gray-700">{credito.cambios}</dd>
                  </div>
                )}
              </dl>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
