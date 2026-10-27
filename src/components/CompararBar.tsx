'use client'

import { usePathname } from 'next/navigation'
import Image from 'next/image'
import LocalLink from '@/components/LocalLink'
import { useComparar } from '@/lib/comparar'
import { useTranslations } from 'next-intl'
import { GitCompare, Trash2 } from 'lucide-react'

/**
 * Barra flotante del comparador: aparece con ≥1 anuncio en la lista y lleva
 * a /comparar. Se oculta en la propia página de comparación y fuera del
 * chrome público (el admin no la monta).
 */
export default function CompararBar() {
  const t = useTranslations()
  const pathname = usePathname()
  const { lista, vaciar } = useComparar()

  if (lista.length === 0) return null
  if (pathname?.includes('/comparar')) return null

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 bottom-[4.75rem] md:bottom-6 z-40 w-[calc(100%-2rem)] max-w-md"
      role="region"
      aria-label={t('comparar.title')}
    >
      <div className="bg-brand-darkNav text-white rounded-2xl shadow-panel border-2 border-brand-signal/70 px-3 py-2.5 flex items-center gap-3">
        {/* Miniaturas de la selección */}
        <div className="flex -space-x-2 shrink-0" aria-hidden="true">
          {lista.map(i => (
            <span key={i.id} className="relative w-9 h-9 rounded-lg overflow-hidden border border-white/30 bg-brand-dark">
              {i.imagen_url ? (
                <Image src={i.imagen_url} alt="" fill sizes="36px" className="object-cover" />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-[10px] text-white/60">🔧</span>
              )}
            </span>
          ))}
        </div>

        <span className="text-xs font-black flex-1 leading-tight">
          {t('comparar.barCount', { count: lista.length })}
        </span>

        <LocalLink
          href="/comparar"
          className="bg-brand-signal text-brand-darkNav text-xs font-black px-3.5 py-2 rounded-full hover:bg-brand-signal-dark transition flex items-center gap-1.5 shrink-0"
        >
          <GitCompare size={14} strokeWidth={2.6} /> {t('comparar.cta')}
        </LocalLink>

        <button
          type="button"
          onClick={vaciar}
          aria-label={t('comparar.clear')}
          title={t('comparar.clear')}
          className="p-1.5 text-white/60 hover:text-white transition shrink-0"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}
