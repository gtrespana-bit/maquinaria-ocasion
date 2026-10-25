'use client'

import { useMemo, useState } from 'react'
import LocalLink from '@/components/LocalLink'
import { FAMILIAS, TODAS_LAS_SUBS } from '@/lib/categorias'
import { MARCAS_MODELOS } from '@/lib/marcas'
import { productUrl } from '@/lib/product-url'
import { formatPrecio } from '@/lib/precio'
import { veredictoPrecio, type RangoPrecio } from '@/lib/tasador'
import { useTranslations } from 'next-intl'
import { Calculator, TrendingUp, TrendingDown, Minus, ArrowRight, ExternalLink } from 'lucide-react'

interface Resultado {
  alcance: string
  rango: RangoPrecio
  muestra: { id: string; slug: string | null; titulo: string; precio_usd: number }[]
}

const VEREDICTO_CLASE = {
  dentro: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  encima: 'bg-orange-50 border-orange-200 text-orange-800',
  abajo: 'bg-sky-50 border-sky-200 text-sky-800',
} as const

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
          tuPrecio: tuPrecio ? Number(tuPrecio) : undefined,
        }),
      })
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

  const inputCls = 'w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-signal'
  const labelCls = 'block text-sm font-bold text-gray-900 mb-1.5'

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">
      <p className="kicker mb-3">{t('tasador.ctaPublicar')}</p>
      <h1 className="text-3xl md:text-5xl font-black tracking-tight text-brand-darkNav">{t('tasador.title')}</h1>
      <p className="text-gray-500 mt-3 max-w-2xl">{t('tasador.subtitle')}</p>

      <form onSubmit={estimar} className="bg-white rounded-3xl border border-gray-200 shadow-card p-5 sm:p-7 mt-7">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="tasador-sub" className={labelCls}>{t('tasador.subLabel')}</label>
            <select id="tasador-sub" value={subSlug} onChange={e => { setSubSlug(e.target.value); setMarca('') }} className={inputCls}>
              <option value="">—</option>
              {FAMILIAS.map(f => (
                <optgroup key={f.key} label={`${f.icon} ${t(`familias.${f.key}.label`)}`}>
                  {f.subs.map(slug => {
                    const s = TODAS_LAS_SUBS.find(x => x.slug === slug)
                    if (!s) return null
                    return <option key={s.slug} value={s.slug}>{s.icon} {s.label}</option>
                  })}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tasador-marca" className={labelCls}>{t('tasador.marcaLabel')}</label>
            <select id="tasador-marca" value={marca} onChange={e => setMarca(e.target.value)} className={inputCls}>
              <option value="">—</option>
              {marcasOpciones.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="tasador-anio" className={labelCls}>{t('tasador.anioLabel')}</label>
            <input id="tasador-anio" type="number" min="1900" max="2100" value={anio} onChange={e => setAnio(e.target.value)} placeholder="2018" className={inputCls} />
          </div>
          <div>
            <label htmlFor="tasador-horas" className={labelCls}>{t('tasador.horasLabel')}</label>
            <input id="tasador-horas" type="number" min="0" step="100" value={horas} onChange={e => setHoras(e.target.value)} placeholder="4500" className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="tasador-precio" className={labelCls}>{t('tasador.tuPrecioLabel')}</label>
            <input id="tasador-precio" type="number" min="0" step="1" value={tuPrecio} onChange={e => setTuPrecio(e.target.value)} placeholder={t('tasador.tuPrecioPlaceholder')} className={inputCls} />
          </div>
        </div>

        <button type="submit" disabled={cargando} className="btn-signal w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 mt-5 disabled:opacity-60">
          <Calculator size={18} />
          {cargando ? '…' : t('tasador.calcular')}
        </button>
        {error && <p className="text-sm text-red-600 font-semibold mt-3">{error}</p>}
      </form>

      {resultado && rango && (
        <div className="mt-7">
          {rango.n === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center">
              <p className="font-black text-brand-darkNav">{t('tasador.sinResultados')}</p>
              <p className="text-sm text-gray-500 mt-2">{t('tasador.sinResultadosHint')}</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                <p className="text-sm font-black text-gray-500">{t('tasador.count', { count: rango.n })}</p>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-bold">{t('tasador.rangeLabel')}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Mín', valor: rango.min },
                  { label: t('tasador.medianLabel'), valor: rango.mediana },
                  { label: 'Máx', valor: rango.max },
                ].map(c => (
                  <div key={c.label} className="bg-white rounded-2xl border border-gray-200/80 shadow-card p-4 text-center">
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">{c.label}</p>
                    <p className="text-lg sm:text-2xl font-black text-brand-darkNav mt-1 tabular-nums">
                      {c.valor != null ? formatPrecio(c.valor) : '—'}
                    </p>
                  </div>
                ))}
              </div>

              {veredicto && tuPrecio && (
                <div className={`rounded-2xl border-2 p-4 mt-4 flex items-center gap-3 ${VEREDICTO_CLASE[veredicto]}`}>
                  {veredicto === 'dentro' ? <Minus size={20} /> : veredicto === 'encima' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  <div>
                    <p className="font-black text-sm">
                      {veredicto === 'dentro' ? t('tasador.inRange') : veredicto === 'encima' ? t('tasador.above') : t('tasador.below')}
                    </p>
                    <p className="text-sm opacity-80">
                      {t('tasador.yourPriceLabel')}: <strong className="tabular-nums">{formatPrecio(Number(tuPrecio))}</strong>
                      {' · '}p25–p75 {formatPrecio(rango.p25 || 0)} – {formatPrecio(rango.p75 || 0)}
                    </p>
                  </div>
                </div>
              )}

              {resultado.muestra.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-3">{t('tasador.muestraTitle')}</h2>
                  <ul className="grid sm:grid-cols-2 gap-2.5">
                    {resultado.muestra.map(m => (
                      <li key={m.id}>
                        <LocalLink
                          href={productUrl(m)}
                          className="group flex items-center justify-between gap-3 bg-white border border-gray-200/80 rounded-xl px-4 py-3 hover:border-brand-signal hover:shadow-card transition"
                        >
                          <span className="text-sm font-bold text-gray-800 truncate group-hover:text-brand-darkNav">{m.titulo}</span>
                          <span className="text-sm font-black text-brand-darkNav tabular-nums whitespace-nowrap">{formatPrecio(m.precio_usd)}</span>
                        </LocalLink>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-7 flex flex-wrap gap-3">
                <LocalLink href="/publicar" className="btn-signal inline-flex items-center gap-2 px-6 py-3">
                  {t('tasador.ctaPublicar')} <ArrowRight size={16} />
                </LocalLink>
                <LocalLink href="/catalogo" className="inline-flex items-center gap-1.5 text-sm font-black text-brand-darkNav border-2 border-brand-darkNav rounded-xl px-5 py-3 hover:bg-brand-darkNav hover:text-brand-signal transition">
                  {t('comparar.emptyCta')} <ExternalLink size={14} />
                </LocalLink>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
