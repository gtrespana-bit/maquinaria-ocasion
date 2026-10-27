'use client'

import { useState, useEffect } from 'react'
import LocalLink from '@/components/LocalLink'
import { Smartphone } from 'lucide-react'
import { useTranslations } from 'next-intl'

type BotonDescargarAppProps = {
  variant?: 'default' | 'light'
}

/**
 * Boton "Descarga Nuestra App" que solo se muestra si el usuario
 * NO esta visitando desde la PWA ya instalada.
 */
export function BotonDescargarApp({ variant = 'default' }: BotonDescargarAppProps = {}) {
  const t = useTranslations('common')
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowButton(false)
      return
    }
    if ((window.navigator as any).standalone === true) {
      setShowButton(false)
      return
    }
    setShowButton(true)
  }, [])

  if (!showButton) return null

  const className = variant === 'light'
    ? 'inline-flex items-center gap-2 bg-[#FBFAF5] border-2 border-white/50 text-paper px-6 py-3 rounded-xl font-bold text-base hover:bg-[#FBFAF5] transition'
    : 'inline-flex items-center gap-2 bg-[#FBFAF5] border-2 border-white/30 text-paper px-6 py-3 rounded-xl font-bold text-base hover:bg-[#FBFAF5] transition'

  return (
    <LocalLink
      href="/como-instalar-app"
      className={className}
    >
      <Smartphone size={18} />
      <span>{t('downloadApp')}</span>
    </LocalLink>
  )
}
