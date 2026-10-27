'use client'

import LocalLink from '@/components/LocalLink'
import { WifiOff, RefreshCw, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

export const dynamic = 'force-dynamic'

export default function OfflinePage() {
  const t = useTranslations('offline')

  return (
    <div className="relative overflow-hidden bg-ink text-paper">
      <div className="blueprint absolute inset-0 opacity-[0.35]" aria-hidden="true" />
      <div className="shell relative flex min-h-[70vh] items-center py-20 md:py-28">
        <div className="max-w-[560px]">
          <p className="t-eyebrow flex items-center gap-2 text-paper/45">
            <span className="inline-block h-1.5 w-1.5 bg-signal" aria-hidden="true" />
            Sin conexión
          </p>

          <span className="mt-8 flex h-12 w-12 items-center justify-center border border-paper/25 text-paper/70">
            <WifiOff size={20} strokeWidth={1.5} />
          </span>

          <h1 className="t-display t-display-lg mt-6 text-paper">{t('title')}</h1>

          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-paper/70">
            Parece que perdiste la conexión a internet. Revisa tu WiFi o datos móviles y vuelve a intentarlo:
            el catálogo te espera donde lo dejaste.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => window.location.reload()}
              className="btn btn-signal btn-lg justify-between"
            >
              <RefreshCw size={15} />
              Reintentar
            </button>
            <LocalLink href="/" className="btn btn-outline-light btn-lg justify-between">
              Ir al inicio
              <ArrowRight size={15} />
            </LocalLink>
          </div>

          <p className="t-label mt-12 border-t border-paper/15 pt-5 text-paper/35">
            MaquinariaOcasión · maquinaria.click
          </p>
        </div>
      </div>
    </div>
  )
}
