'use client'

import { useMemo, useState } from 'react'
import LocalLink from '@/components/LocalLink'
import { FAMILIAS, TODAS_LAS_SUBS } from '@/lib/categorias'
import { MARCAS_MODELOS } from '@/lib/marcas'
import { productUrl } from '@/lib/product-url'
import { formatPrecio } from '@/lib/precio'
import { veredictoPrecio, type RangoPrecio} from '@/lib/tasador'
import { useTranslations } from 'next-intl'
import { Calculator, TrendingUp, TrendingDown, Minus, ArrowRight, ExternalLink } from 'lucide-react'

interface Resultado {
  alcance: string
  rango: RangoPrecio
  muestra: { id: string; slug: string | null; titulo: string; precio_usd: number }[]
}


const VEREDICTO_TONO = {
  dentro: 'border-moss/30 bg-moss-soft text-moss',
  encima: 'border-clay/35 bg-clay/[0.06] text-clay',
  abajo: 'border-line bg-paper-2/60 text-ink/70' } as const

export default function TasadorClient() {
  const t = useTranslations()
  const [subSlug, setSubSlug] = useState('')
  const [marca, setMarca] = useState('')
  const [anio, setAnio] = useState('')
  const [horas, setHoras] = useState('')
  const [tuPrecio, setTuPrecio] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  const marcasOpciones = useMemo(() => {
    const modelos = subSlug ? MARCAS_MODELOS.filter(m => m.aptoPara.includes(subSlug as any)) : MARCAS_MODELOS
    const unicas = [...new Set(modelos.map(m => m.fabricante))].sort((a, b) => a.localeCompare(b, 'es'))
    return unicas
  }, [subSlug])

  const rango = resultado?.rango
  const veredicto = veredictoPrecio(tuPrecio, rango ?? { n: 0, min: null, p25: null, mediana: null, p75: null, max: null })

  async function estimar(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true)
    setError(null)
    try {
      const sub = TODAS_LAS_SUBS.find(s => s.slug === subSlug)
      const res = await fetch('/api/tasador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subcategoria: sub ? sub.label : undefined,
          marca: marca || undefined,
          anio: anio ? Number(anio) : undefined,
          horas: horas ? Number(horas) : undefined,
          tuPrecio: tuPrecio ? Number(tuPrecio) : undefined }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        setError(data.error || 'Error')
        setResultado(null)
        return
      }
      setResultado({ alcance: data.alcance, rango: data.rango, muestra: data.muestra || [] })
    } catch {
      setError('Error de conexión')
      setResultado(null)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="bg-paper">
      <header className="border-b border-line">
        <div className="shell pb-10 pt-10 md:pb-14 md:pt-14">
          <p className="t-eyebrow text-ink/45">Tasador</p>
          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="t-display t-display-lg text-ink lg:col-span-8">{t('tasador.title')}</h1>
            <p className="text-[15px] leading-relaxed text-muted lg:col-span-4 lg:border-l lg:border-line lg:pl-6">
              {t('tasador.subtitle')}
            </p>
          </div>
        </div>
      </header>

      <div className="shell py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Formulario */}
          <form onSubmit={estimar} className="lg:col-span-5">
            <div className="flex items-baseline justify-between border-b border-ink pb-3">
              <h2 className="t-eyebrow text-ink">Datos de la máquina</h2>
              <span className="t-label text-ink/30">01</span>
            </div>

            <div className="mt-6 space-y-5 border border-line bg-[#FBFAF5] p-5 md:p-6">
              <div>
                <label htmlFor="tasador-sub" className="t-label mb-1.5 block text-ink/50">{t('tasador.subLabel')}</label>
                <select id="tasador-sub" value={subSlug} onChange={e => { setSubSlug(e.target.value); setMarca('') }} className="field text-[15px]">
                  <option value="">—</option>
                  {FAMILIAS.map(f => (
                    <optgroup key={f.key} label={t(`familias.${f.key}.label`)}>
                      {f.subs.map(slug => {
                        const s = TODAS_LAS_SUBS.find(x => x.slug === slug)
                        if (!s) return null
                        return <option key={s.slug} value={s.slug}>{s.label}</option>
                      })}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="tasador-marca" className="t-label mb-1.5 block text-ink/50">{t('tasador.marcaLabel')}</label>
                <select id="tasador-marca" value={marca} onChange={e => setMarca(e.target.value)} className="field text-[15px]">
                  <option value="">—</option>
                  {marcasOpciones.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tasador-anio" className="t-label mb-1.5 block text-ink/50">{t('tasador.anioLabel')}</label>
                  <input id="tasador-anio" type="number" min="1900" max="2100" value={anio} onChange={e => setAnio(e.target.value)} placeholder="2018" className="field t-num text-[15px]" />
                </div>
                <div>
                  <label htmlFor="tasador-horas" className="t-label mb-1.5 block text-ink/50">{t('tasador.horasLabel')}</label>
                  <input id="tasador-horas" type="number" min="0" step="100" value={horas} onChange={e => setHoras(e.target.value)} placeholder="4500" className="field t-num text-[15px]" />
                </div>
              </div>

              <div className="border-t border-line pt-5">
                <label htmlFor="tasador-precio" className="t-label mb-1.5 block text-ink/50">{t('tasador.tuPrecioLabel')}</label>
                <input id="tasador-precio" type="number" min="0" step="1" value={tuPrecio} onChange={e => setTuPrecio(e.target.value)} placeholder={t('tasador.tuPrecioPlaceholder')} className="field t-num text-[15px]" />
              </div>

              <button type="submit" disabled={cargando} className="btn btn-ink btn-lg w-full justify-between disabled:opacity-60">
                {cargando ? 'Calculando…' : t('tasador.calcular')}
                <Calculator size={15} strokeWidth={1.8} />
              </button>
              {error && <p className="border border-clay/40 bg-clay/[0.05] p-2.5 text-[12.5px] text-clay">{error}</p>}
            </div>

            <p className="mt-4 text-[12px] leading-relaxed text-ink/45">
              Calculamos la horquilla con los anuncios comparables de nuestro inventario. Sin registro y sin coste.
            </p>
          </form>

          {/* Resultado */}
          <div className="lg:col-span-7">
            <div className="flex items-baseline justify-between border-b border-ink pb-3">
              <h2 className="t-eyebrow text-ink">Estimación de mercado</h2>
              <span className="t-label text-ink/30">02</span>
            </div>

            {!resultado && (
              <div className="mt-6 border border-line bg-paper-2/40 px-6 py-16 text-center">
                <p className="t-display t-display-sm text-ink/30">Sin datos todavía</p>
                <p className="mx-auto mt-3 max-w-sm text-[13.5px] leading-relaxed text-muted">
                  Rellena la subcategoría, la marca y, si los tienes, el año y las horas de uso. Cuantos más
                  datos, más estrecha es la horquilla.
                </p>
              </div>
            )}

            {resultado && rango && (
              <div className="mt-6">
                {rango.n === 0 ? (
                  <div className="border border-dashed border-line-strong px-6 py-14 text-center">
                    <p className="t-display t-display-sm text-ink">{t('tasador.sinResultados')}</p>
                    <p className="mt-3 text-[13.5px] text-muted">{t('tasador.sinResultadosHint')}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="t-label text-ink/50">{t('tasador.count', { count: rango.n })}</p>
                      <p className="t-label text-ink/30">{t('tasador.rangeLabel')}</p>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-px border border-line bg-line">
                      {[
                        { label: 'Mín', valor: rango.min },
                        { label: t('tasador.medianLabel'), valor: rango.mediana },
                        { label: 'Máx', valor: rango.max },
                      ].map(c => (
                        <div key={c.label} className="bg-[#FBFAF5] p-4 text-center">
                          <p className="t-label text-ink/40">{c.label}</p>
                          <p className="t-display t-num mt-2 text-[1.5rem] leading-none text-ink sm:text-[1.9rem]">
                            {c.valor != null ? formatPrecio(c.valor) : '—'}
                          </p>
                        </div>
                      ))}
                    </div>

                    {veredicto && tuPrecio && (
                      <div className={`mt-4 flex items-center gap-3 border p-4 ${VEREDICTO_TONO[veredicto]}`}>
                        {veredicto === 'dentro' ? <Minus size={16} /> : veredicto === 'encima' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        <div>
                          <p className="text-[13.5px] font-semibold">
                            {veredicto === 'dentro' ? t('tasador.inRange') : veredicto === 'encima' ? t('tasador.above') : t('tasador.below')}
                          </p>
                          <p className="mt-0.5 text-[12.5px] opacity-80">
                            {t('tasador.yourPriceLabel')}: <strong className="t-num">{formatPrecio(Number(tuPrecio))}</strong>
                            {' · '}p25–p75 {formatPrecio(rango.p25 || 0)} – {formatPrecio(rango.p75 || 0)}
                          </p>
                        </div>
                      </div>
                    )}

                    {resultado.muestra.length > 0 && (
                      <div className="mt-8">
                        <h3 className="t-eyebrow border-b border-line pb-2 text-ink/50">{t('tasador.muestraTitle')}</h3>
                        <ul className="divide-y divide-line">
                          {resultado.muestra.map(m => (
                            <li key={m.id}>
                              <LocalLink href={productUrl(m)} className="group flex items-center justify-between gap-4 py-3">
                                <span className="truncate text-[13.5px] font-medium text-ink/85 group-hover:underline group-hover:underline-offset-4">
                                  {m.titulo}
                                </span>
                                <span className="t-num shrink-0 text-[13.5px] font-semibold text-ink">{formatPrecio(m.precio_usd)}</span>
                              </LocalLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-8 flex flex-wrap gap-3">
                      <LocalLink href="/publicar" className="btn btn-signal">
                        {t('tasador.ctaPublicar')} <ArrowRight size={15} />
                      </LocalLink>
                      <LocalLink href="/catalogo" className="btn btn-outline">
                        {t('comparar.emptyCta')} <ExternalLink size={13} />
                      </LocalLink>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
