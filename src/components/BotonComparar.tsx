'use client'

import { Check, GitCompare } from 'lucide-react'
import { useComparar, type ItemComparar} from '@/lib/comparar'
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
      className={`z-20 flex h-8 w-8 items-center justify-center border transition-all active:scale-95 ${
        activo
          ? 'border-ink bg-signal text-ink'
          : 'border-line bg-paper/85 text-ink/60 backdrop-blur-sm hover:border-ink hover:bg-signal hover:text-ink'
      } ${className}`}
    >
      {activo ? <Check size={14} strokeWidth={2.5} /> : <GitCompare size={13} strokeWidth={2} />}
    </button>
  )
}
