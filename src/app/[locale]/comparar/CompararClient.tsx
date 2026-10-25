'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import LocalLink from '@/components/LocalLink'
import BadgeTipoVendedor from '@/components/BadgeTipoVendedor'
import { supabase } from '@/lib/supabase'
import { useComparar } from '@/lib/comparar'
import { productUrl } from '@/lib/product-url'
import { formatPrecio } from '@/lib/precio'
import { useTranslations } from 'next-intl'
import { GitCompare, Trash2, ShieldCheck, X, ExternalLink } from 'lucide-react'

const COLS =
  'id, slug, titulo, precio_usd, imagen_url, estado, ubicacion_ciudad, ubicacion_estado, vendedor_tipo, vendedor_verificado, especificaciones'

/** Lee una clave de especificaciones con alias habituales (ES/variaciones). */
function spec(p: any, ...claves: string[]): string {
  const esp = p?.especificaciones
  if (!esp) return '—'
  for (const k of claves) {
    const v = esp[k]
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v)
  }
  return '—'
}

export default function CompararClient() {
  const t = useTranslations()
  const { lista, quitar, vaciar } = useComparar()
  const [frescos, setFrescos] = useState<Record<string, any>>({})
  const [cargado, setCargado] = useState(false)

  const ids = useMemo(() => lista.map(i => i.id).join(','), [lista])

  // Datos frescos de Supabase: precio y ficha de HOLO (el snapshot de
  // localStorage solo pinta el primer frame y los campos estables).
  useEffect(() => {
    const idList = ids ? ids.split(',').filter(Boolean) : []
    if (idList.length === 0) {
      setFrescos({})
      setCargado(false)
      return
    }
    let cancelado = false
    ;(async () => {
      try {
        const { data } = await supabase
          .from('productos')
          .select(COLS)
          .in('id', idList)
        if (cancelado) return
        const mapa: Record<string, any> = {}
        for (const p of data || []) mapa[p.id] = p
        setFrescos(mapa)
        setCargado(true)
      } catch {
        if (!cancelado) setCargado(true)
      }
    })()
    return () => { cancelado = true }
  }, [ids])

  if (lista.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 md:py-24 text-center">
        <span className="inline-flex w-16 h-16 rounded-2xl bg-brand-signal/15 border border-brand-signal/40 items-center justify-center mb-5">
          <GitCompare size={30} className="text-brand-signal-dark" />
        </span>
        <h1 className="text-2xl md:text-4xl font-black tracking-tight text-brand-darkNav">{t('comparar.title')}</h1>
        <p className="text-gray-500 mt-3">{t('comparar.empty')}</p>
        <LocalLink href="/catalogo" className="btn-signal inline-flex items-center gap-2 px-6 py-3 mt-7">
          {t('comparar.emptyCta')} →
        </LocalLink>
      </div>
    )
  }

  // Snapshot + datos frescos (frescos ganan cuando llegan)
  const columnas = lista.map(i => ({ ...i, ...(frescos[i.id] || {}) }))
  const disponibles = columnas.filter(c => !cargado || frescos[c.id])

  const filas: { label: string; render: (c: any) => React.ReactNode }[] = [
    {
      label: t('comparar.price'),
      render: c => <span className="text-lg font-black text-brand-darkNav whitespace-nowrap">{formatPrecio(c.precio_usd || 0)}</span>,
    },
    { label: t('comparar.status'), render: c => <span className="text-sm font-bold text-gray-700">{c.estado || '—'}</span> },
    { label: t('comparar.year'), render: c => <span className="text-sm text-gray-700">{spec(c, 'Año', 'Ano', 'Año de matriculación')}</span> },
    { label: t('comparar.hours'), render: c => <span className="text-sm text-gray-700">{spec(c, 'Horas de uso', 'Horas', 'Horas de uso (h)')}</span> },
    {
      label: t('comparar.location'),
      render: c => <span className="text-sm text-gray-700">{[c.ubicacion_ciudad, c.ubicacion_estado].filter(Boolean).join(' · ') || '—'}</span>,
    },
    {
      label: t('comparar.seller'),
      render: c => (
        <span className="inline-flex flex-col items-start gap-1">
          {c.vendedor_tipo && <BadgeTipoVendedor tipo={c.vendedor_tipo} />}
          {c.vendedor_verificado && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              <ShieldCheck size={10} /> {t('productCard.verified')}
            </span>
          )}
          {!c.vendedor_tipo && !c.vendedor_verificado && '—'}
        </span>
      ),
    },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="kicker mb-2">{t('comparar.cta')}</p>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-brand-darkNav">{t('comparar.title')}</h1>
          <p className="text-sm text-gray-500 mt-1.5">{t('comparar.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={vaciar}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-full px-4 py-2 transition"
        >
          <Trash2 size={14} /> {t('comparar.clear')}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-card overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="p-3 md:p-4 w-28 md:w-36" scope="col">
                <span className="sr-only">{t('comparar.specsTitle')}</span>
              </th>
              {columnas.map(c => (
                <th key={c.id} className="p-3 md:p-4 align-top min-w-[170px]">
                  <div className="relative rounded-xl overflow-hidden bg-gray-100 h-24 md:h-28 mb-2.5">
                    {c.imagen_url ? (
                      <Image src={c.imagen_url} alt={c.titulo} fill sizes="200px" className="object-cover" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-xl">🔧</span>
                    )}
                    <button
                      type="button"
                      onClick={() => quitar(c.id)}
                      aria-label={t('comparar.removeAria')}
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 hover:bg-brand-signal text-gray-700 hover:text-brand-darkNav flex items-center justify-center shadow-card transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <LocalLink
                    href={productUrl(c)}
                    className="block text-sm font-bold text-brand-darkNav hover:underline leading-snug line-clamp-2"
                  >
                    {c.titulo}
                  </LocalLink>
                  {!cargado ? null : !frescos[c.id] ? (
                    <span className="text-[11px] font-bold text-amber-700">{t('comparar.unavailable')}</span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, idx) => (
              <tr key={fila.label} className={idx % 2 === 0 ? 'bg-gray-50/60' : 'bg-white'}>
                <th scope="row" className="p-3 md:p-4 text-xs font-black uppercase tracking-wide text-gray-500 align-middle">
                  {fila.label}
                </th>
                {columnas.map(c => (
                  <td key={c.id} className="p-3 md:p-4 align-middle">
                    {fila.render(c)}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t border-gray-200 bg-white">
              <th scope="row" className="p-3 md:p-4 text-xs font-black uppercase tracking-wide text-gray-500">—</th>
              {columnas.map(c => (
                <td key={c.id} className="p-3 md:p-4">
                  <LocalLink
                    href={productUrl(c)}
                    className="inline-flex items-center gap-1.5 text-xs font-black text-brand-darkNav bg-brand-signal hover:bg-brand-signal-dark rounded-full px-3 py-2 transition whitespace-nowrap"
                  >
                    <ExternalLink size={12} /> {t('comparar.viewDetail')}
                  </LocalLink>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {disponibles.length < columnas.length && (
        <p className="text-xs text-gray-400 mt-3">{t('comparar.unavailable')}</p>
      )}
    </div>
  )
}
