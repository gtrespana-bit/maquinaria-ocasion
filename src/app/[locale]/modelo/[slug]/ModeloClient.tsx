'use client'

import { useMemo, useState } from 'react'
import LocalLink from '@/components/LocalLink'
import ProductCard, { type ProductCardData } from '@/components/ProductCard'
import { formatPrecio } from '@/lib/precio'
import type { Estadisticas, EstadisticasTramo } from '@/lib/precios-mercado'
import type { MarcaModelo } from '@/lib/marcas'
import { Info, Search, ArrowRight } from 'lucide-react'

const ANIO = new Date().getFullYear()

export default function ModeloClient({
  modelo,
  etiqueta,
  anuncios,
  est,
  tramos,
  hermanos }: {
  modelo: MarcaModelo
  etiqueta: string
  anuncios: any[]
  est: Estadisticas | null
  tramos: EstadisticasTramo[]
  hermanos: { valor: string; etiqueta: string; slug: string }[]
}) {
  const [busqueda, setBusqueda] = useState('')

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return anuncios
    return anuncios.filter(a => (a.titulo || '').toLowerCase().includes(q))
  }, [anuncios, busqueda])

  const fmt = (n: number) => formatPrecio(n)

  return (
    <div className="bg-paper">
      <header className="border-b border-line">
        <div className="shell pb-10 pt-8 md:pb-14 md:pt-12">
          <nav aria-label="Migas de pan" className="t-eyebrow flex flex-wrap items-center gap-2 text-ink/40">
            <LocalLink href="/marcas" className="transition-colors hover:text-ink">Marcas</LocalLink>
            <span className="text-ink/25">/</span>
            <span>{modelo.fabricante}</span>
            <span className="text-ink/25">/</span>
            <span aria-current="page" className="text-ink">{etiqueta}</span>
          </nav>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="t-display t-display-lg text-ink lg:col-span-8">
              {modelo.valor} de ocasión:{' '}
              <span className="t-serif-italic">precios reales {ANIO}</span>
            </h1>
            <p className="text-[14.5px] leading-relaxed text-muted lg:col-span-4 lg:border-l lg:border-line lg:pl-6">
              {est ? (
                <>
                  Una <strong className="font-semibold text-ink">{modelo.valor}</strong> de segunda
                  mano cuesta <strong className="font-semibold text-ink">{fmt(est.mediana)}</strong> de
                  mediana en España, calculado con los {est.muestra} anuncios activos ahora mismo en
                  MaquinariaOcasión.
                </>
              ) : (
                <>
                  Todavía no hay anuncios suficientes de{' '}
                  <strong className="font-semibold text-ink">{modelo.valor}</strong> para publicar
                  precios de mercado fiables. En cuanto los haya, aparecerán aquí.
                </>
              )}
            </p>
          </div>
        </div>
      </header>

      <div className="shell py-12 md:py-16">
        {est ? (
          <>
            <section aria-label="Estadísticas de precio">
              <div className="flex items-baseline justify-between border-b border-ink pb-3">
                <h2 className="t-eyebrow text-ink">Mercado de segunda mano</h2>
                <span className="t-label text-ink/30">Datos de hoy</span>
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
                <Metrica
                  destacada
                  valor={fmt(est.mediana)}
                  etiqueta="Precio mediano"
                  nota="La mitad cuesta menos, la mitad más"
                />
                <Metrica
                  valor={`${fmt(est.p25)} – ${fmt(est.p75)}`}
                  etiqueta="Rango habitual"
                  nota="Lo que se paga normalmente"
                />
                {est.horasMediana != null && (
                  <Metrica
                    valor={`${est.horasMediana.toLocaleString('es-ES')} h`}
                    etiqueta="Horas medianas"
                    nota="Desgaste típico de la muestra"
                  />
                )}
                {est.anioMediano != null && (
                  <Metrica
                    valor={String(est.anioMediano)}
                    etiqueta="Año mediano"
                    nota="Antigüedad de los anuncios"
                  />
                )}
              </dl>
            </section>

            <div className="mt-5 flex gap-3 border border-line bg-paper-2/50 p-4">
              <Info size={15} strokeWidth={1.6} className="mt-0.5 shrink-0 text-ink/40" aria-hidden="true" />
              <p className="text-[12.5px] leading-relaxed text-ink/60">
                Usamos la <strong className="font-semibold text-ink">mediana</strong> y no la media
                porque un solo anuncio muy caro distorsionaría el resultado. El{' '}
                <strong className="font-semibold text-ink">rango habitual</strong> deja fuera el 25 %
                más barato y el 25 % más caro: es lo que de verdad te vas a encontrar. Datos
                actualizados cada hora con los anuncios activos.
              </p>
            </div>

            {tramos.length > 0 && (
              <section className="mt-14" aria-labelledby="tramos">
                <h2 id="tramos" className="t-display t-display-sm text-ink">
                  Cuánto cuesta según los años
                </h2>
                <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted">
                  Precio de una {modelo.valor} según su antigüedad. Solo se muestran los tramos con
                  anuncios suficientes.
                </p>

                <div className="mt-6 overflow-x-auto border border-line bg-[#FBFAF5]">
                  <table className="w-full min-w-[640px] text-[13px]">
                    <thead>
                      <tr className="border-b border-line bg-paper-2/70 text-left">
                        <th scope="col" className="t-label px-4 py-3 text-ink">Antigüedad</th>
                        <th scope="col" className="t-label px-4 py-3 text-ink">Precio mediano</th>
                        <th scope="col" className="t-label px-4 py-3 text-ink/70">Rango habitual</th>
                        <th scope="col" className="t-label px-4 py-3 text-ink/70">Horas medianas</th>
                        <th scope="col" className="t-label px-4 py-3 text-right text-ink/70">Anuncios</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tramos.map(t => (
                        <tr key={t.id} className="border-t border-line">
                          <th scope="row" className="px-4 py-3 text-left font-medium text-ink">{t.etiqueta}</th>
                          <td className="t-num px-4 py-3 font-semibold text-ink">{fmt(t.mediana)}</td>
                          <td className="t-num px-4 py-3 text-ink/65">
                            {fmt(t.p25)} – {fmt(t.p75)}
                          </td>
                          <td className="t-num px-4 py-3 text-ink/65">
                            {t.horasMediana != null ? `${t.horasMediana.toLocaleString('es-ES')} h` : '—'}
                          </td>
                          <td className="t-num px-4 py-3 text-right text-ink/40">{t.muestra}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="flex gap-3 border border-line bg-paper-2/50 p-5">
            <Info size={16} strokeWidth={1.6} className="mt-0.5 shrink-0 text-ink/45" aria-hidden="true" />
            <div className="text-[13px] leading-relaxed text-ink/70">
              <p className="font-semibold text-ink">Sin datos de precio todavía</p>
              <p className="mt-1">
                Preferimos no enseñar un precio antes que enseñar uno que no se sostenga.
                Necesitamos al menos 5 anuncios activos de este modelo para calcular estadísticas
                fiables.
              </p>
            </div>
          </div>
        )}

        {/* Anuncios */}
        <section className="mt-14" aria-labelledby="anuncios-modelo">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-3">
            <h2 id="anuncios-modelo" className="t-display t-display-sm text-ink">
              {anuncios.length > 0
                ? `${anuncios.length} ${anuncios.length === 1 ? 'anuncio' : 'anuncios'} de ${modelo.valor}`
                : `Anuncios de ${modelo.valor}`}
            </h2>
            {anuncios.length > 4 && (
              <div className="relative w-full sm:w-72">
                <Search size={14} strokeWidth={1.6} className="absolute left-0 top-1/2 -translate-y-1/2 text-ink/35" aria-hidden="true" />
                <input
                  type="search"
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Filtrar por título…"
                  aria-label={`Filtrar anuncios de ${modelo.valor}`}
                  className="field pl-6 text-[13px]"
                />
              </div>
            )}
          </div>

          {filtrados.length === 0 ? (
            <div className="mt-6 border border-line bg-[#FBFAF5] px-6 py-14 text-center">
              <p className="text-[15px] font-medium text-ink">
                {anuncios.length === 0
                  ? `Ahora mismo no hay ninguna ${modelo.valor} publicada.`
                  : 'Ningún anuncio coincide con tu filtro.'}
              </p>
              {anuncios.length === 0 && (
                <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-muted">
                  Vuelve en unos días o revisa el catálogo completo: entran máquinas nuevas cada
                  semana.
                </p>
              )}
              <LocalLink href="/catalogo" className="btn btn-ink mt-6">
                Ver todo el catálogo
              </LocalLink>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {filtrados.map((p: ProductCardData) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </section>

        {/* Contexto del modelo */}
        {modelo.nota && (
          <section className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-12">
            <h2 className="t-display t-display-sm text-ink lg:col-span-4">Sobre la {modelo.valor}</h2>
            <p className="text-[14.5px] leading-relaxed text-ink/75 lg:col-span-8 lg:border-l lg:border-line lg:pl-8">
              {modelo.nota}
            </p>
          </section>
        )}

        {/* Enlazado interno */}
        {hermanos.length > 0 && (
          <section className="mt-14">
            <h2 className="t-eyebrow border-b border-line pb-2 text-ink/50">
              Otros modelos de {modelo.fabricante}
            </h2>
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {hermanos.map(h => (
                <li key={h.slug}>
                  <LocalLink
                    href={`/modelo/${h.slug}`}
                    className="t-label inline-block border border-line px-2.5 py-1.5 text-ink/60 transition-colors hover:border-ink hover:text-ink"
                  >
                    {h.etiqueta}
                  </LocalLink>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* CTA vendedor */}
        <section className="on-dark mt-14 bg-ink px-6 py-10 text-paper md:px-10 md:py-12">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <h2 className="t-display t-display-md text-paper">¿Vendes una {modelo.valor}?</h2>
              <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-paper/60">
                {est
                  ? `Ahora ya sabes lo que vale: la mediana está en ${fmt(est.mediana)}. Publica gratis y llega a compradores que buscan justo este modelo.`
                  : 'Publica gratis y llega a compradores que buscan justo este modelo.'}
              </p>
            </div>
            <div className="lg:col-span-5 lg:border-l lg:border-line-dark lg:pl-8">
              <LocalLink href="/publicar" className="btn btn-signal btn-lg">
                Publicar mi anuncio gratis
                <ArrowRight size={15} />
              </LocalLink>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function Metrica({
  valor,
  etiqueta,
  nota,
  destacada }: {
  valor: string
  etiqueta: string
  nota?: string
  destacada?: boolean
}) {
  return (
    <div className={`p-5 ${destacada ? 'bg-signal' : 'bg-[#FBFAF5]'}`}>
      <dt className="t-label text-ink/45">{etiqueta}</dt>
      <dd className="t-display t-num mt-3 text-[1.55rem] leading-none text-ink md:text-[1.9rem]">{valor}</dd>
      {nota && <p className="mt-2 text-[11.5px] leading-snug text-ink/45">{nota}</p>}
    </div>
  )
}
