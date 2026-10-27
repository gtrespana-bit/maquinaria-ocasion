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
      <div className="shell flex min-h-[56vh] flex-col justify-center py-16 md:py-24">
        <p className="t-eyebrow text-ink/40">Herramienta</p>
        <h1 className="t-display t-display-lg mt-5 max-w-2xl text-ink">{t('comparar.title')}</h1>
        <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-muted">{t('comparar.empty')}</p>
        <div className="mt-8">
          <LocalLink href="/catalogo" className="btn btn-ink btn-lg">
            {t('comparar.emptyCta')}
            <span aria-hidden="true">→</span>
          </LocalLink>
        </div>
        <p className="t-label mt-10 flex items-center gap-2 border-t border-line pt-5 text-ink/30">
          <GitCompare size={12} /> {t('comparar.subtitle')}
        </p>
      </div>
    )
  }

  // Snapshot + datos frescos (frescos ganan cuando llegan)
  const columnas = lista.map(i => ({ ...i, ...(frescos[i.id] || {}) }))
  const disponibles = columnas.filter(c => !cargado || frescos[c.id])

  const filas: { label: string; render: (c: any) => React.ReactNode }[] = [
    {
      label: t('comparar.price'),
      render: c => <span className="t-display t-num whitespace-nowrap text-[1.15rem] leading-none text-ink">{formatPrecio(c.precio_usd || 0)}</span> },
    { label: t('comparar.status'), render: c => <span className="text-[13px] font-medium text-ink/75">{c.estado || '—'}</span> },
    { label: t('comparar.year'), render: c => <span className="t-num text-[13px] text-ink/70">{spec(c, 'Año', 'Ano', 'Año de matriculación')}</span> },
    { label: t('comparar.hours'), render: c => <span className="t-num text-[13px] text-ink/70">{spec(c, 'Horas de uso', 'Horas', 'Horas de uso (h)')}</span> },
    {
      label: t('comparar.location'),
      render: c => <span className="text-[13px] text-ink/70">{[c.ubicacion_ciudad, c.ubicacion_estado].filter(Boolean).join(' · ') || '—'}</span> },
    {
      label: t('comparar.seller'),
      render: c => (
        <span className="inline-flex flex-col items-start gap-1">
          {c.vendedor_tipo && <BadgeTipoVendedor tipo={c.vendedor_tipo} />}
          {c.vendedor_verificado && (
            <span className="t-label inline-flex items-center gap-1 border border-moss/30 bg-moss-soft px-1.5 py-1 text-moss">
              <ShieldCheck size={9} /> {t('productCard.verified')}
            </span>
          )}
          {!c.vendedor_tipo && !c.vendedor_verificado && '—'}
        </span>
      ) },
  ]

  return (
    <div className="bg-paper">
      <header className="border-b border-line">
        <div className="shell flex flex-wrap items-end justify-between gap-6 pb-8 pt-10 md:pb-10 md:pt-12">
          <div>
            <p className="t-eyebrow text-ink/40">{t('comparar.cta')}</p>
            <h1 className="t-display t-display-lg mt-4 text-ink">{t('comparar.title')}</h1>
            <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-muted">{t('comparar.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={vaciar}
            className="t-label inline-flex items-center gap-2 border border-line px-3 py-2 text-ink/60 transition-colors hover:border-clay hover:text-clay"
          >
            <Trash2 size={11} /> {t('comparar.clear')}
          </button>
        </div>
      </header>

      <div className="shell py-10 md:py-12">
        <div className="overflow-x-auto border border-line bg-[#FBFAF5]">
          <table className="w-full min-w-[680px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="w-28 p-3 md:w-36 md:p-4" scope="col">
                  <span className="sr-only">{t('comparar.specsTitle')}</span>
                </th>
                {columnas.map(c => (
                  <th key={c.id} className="min-w-[170px] p-3 align-top md:p-4">
                    <div className="relative mb-2.5 h-24 overflow-hidden border border-line bg-paper-2 md:h-28">
                      {c.imagen_url ? (
                        <Image src={c.imagen_url} alt={c.titulo} fill sizes="200px" className="object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center bg-paper-2" />
                      )}
                      <button
                        type="button"
                        onClick={() => quitar(c.id)}
                        aria-label={t('comparar.removeAria')}
                        className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center border border-line bg-paper/95 text-ink/60 transition-colors hover:bg-ink hover:text-paper"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <LocalLink
                      href={productUrl(c)}
                      className="line-clamp-2 block text-[13px] font-semibold leading-snug text-ink hover:underline hover:underline-offset-4"
                    >
                      {c.titulo}
                    </LocalLink>
                    {!cargado ? null : !frescos[c.id] ? (
                      <span className="t-label mt-1 block text-clay">{t('comparar.unavailable')}</span>
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((fila, idx) => (
                <tr key={fila.label} className={`border-t border-line ${idx % 2 === 0 ? 'bg-paper-2/40' : 'bg-transparent'}`}>
                  <th scope="row" className="t-label p-3 align-middle text-ink/45 md:p-4">
                    {fila.label}
                  </th>
                  {columnas.map(c => (
                    <td key={c.id} className="p-3 align-middle md:p-4">
                      {fila.render(c)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-line bg-transparent">
                <th scope="row" className="t-label p-3 text-ink/25 md:p-4">—</th>
                {columnas.map(c => (
                  <td key={c.id} className="p-3 md:p-4">
                    <LocalLink href={productUrl(c)} className="btn btn-ink btn-sm whitespace-nowrap">
                      <ExternalLink size={11} /> {t('comparar.viewDetail')}
                    </LocalLink>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {disponibles.length < columnas.length && (
          <p className="t-label mt-3 text-ink/35">{t('comparar.unavailable')}</p>
        )}
      </div>
    </div>
  )
}
