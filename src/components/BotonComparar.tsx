'use client'

import { Check, GitCompare } from 'lucide-react'
import { useComparar, type ItemComparar } from '@/lib/comparar'
import { useTranslations } from 'next-intl'

/**
 * Chip «añadir a comparación» para las tarjetas de anuncio.
 *
 * Va DENTRO del enlace de la tarjeta (es donde el usuario está mirando los
 * productos), así que cancela la navegación en el click propio
 * (`preventDefault` + `stopPropagation`): tocar el chip no abre la ficha.
 */
export default function BotonComparar({ item, className = '' }: { item: ItemComparar; className?: string }) {
  const t = useTranslations()
  const { lista, alternar } = useComparar()
  const activo = lista.some(x => x.id === item.id)

  return (
    <button
      type="button"
      aria-pressed={activo}
      aria-label={activo ? t('comparar.removeAria') : `${t('comparar.addAria')}: ${item.titulo}`}
      title={activo ? t('comparar.removeAria') : t('comparar.addAria')}
      onClick={e => {
        e.preventDefault()
        e.stopPropagation()
        alternar(item)
      }}
      className={`z-20 w-8 h-8 rounded-full flex items-center justify-center shadow-card border transition-all active:scale-95 ${
        activo
          ? 'bg-brand-signal border-brand-signal text-brand-darkNav'
          : 'bg-white/95 backdrop-blur-sm border-white text-gray-600 hover:bg-brand-signal hover:border-brand-signal hover:text-brand-darkNav'
      } ${className}`}
    >
      {activo ? <Check size={15} strokeWidth={3} /> : <GitCompare size={14} strokeWidth={2.5} />}
    </button>
  )
}
