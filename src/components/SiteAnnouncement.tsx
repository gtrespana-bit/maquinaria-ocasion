'use client'

import { useEffect, useState } from 'react'
import { X, ArrowRight } from 'lucide-react'
import LocalLink from '@/components/LocalLink'

type Announcement = {
  id: string
  titulo: string
  mensaje: string
  emoji: string | null
  enlace: string | null
  enlace_texto: string | null
}

/**
 * Banda de anuncio administrable desde el panel.
 *
 * Se oculta si no hay anuncio activo (o si la tabla todavía no existe), para
 * que la home nunca arranque con un hueco.
 */
export default function SiteAnnouncement() {
  const [anuncio, setAnuncio] = useState<Announcement | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/anuncios/active')
      .then((r) => (r.ok ? r.json() : { anuncio: null }))
      .then((d) => {
        if (!cancelled) setAnuncio(d?.anuncio || null)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (!anuncio || dismissed) return null

  return (
    <div className="on-dark bg-ink text-paper">
      <div className="shell flex min-h-[38px] items-center gap-3 py-2">
        <span aria-hidden="true" className="hidden h-1.5 w-1.5 shrink-0 bg-signal sm:block" />
        <p className="min-w-0 flex-1 text-[12.5px] leading-snug text-paper/80">
          <span className="t-label mr-2 text-signal">{anuncio.titulo}</span>
          {anuncio.mensaje}
          {anuncio.enlace && (
            <LocalLink
              href={anuncio.enlace}
              className="ml-2 inline-flex items-baseline gap-1 border-b border-signal/60 font-medium text-paper hover:border-signal"
            >
              {anuncio.enlace_texto || 'Ver más'}
              <ArrowRight size={11} />
            </LocalLink>
          )}
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Cerrar anuncio"
          className="shrink-0 p-1 text-paper/50 transition-colors hover:text-paper"
        >
          <X size={14} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  )
}
