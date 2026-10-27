'use client'

import { useEffect, useRef } from 'react'
import { X, Zap } from 'lucide-react'

export default function BoostModal({ titulo, onBoost, onClose }: { titulo: string; onBoost: () => void; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    // Focus dialog on open
    dialogRef.current?.focus()
    // Prevent background scroll
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="boost-modal-title"
        tabIndex={-1}
        className="w-full max-w-md border border-line-strong bg-[#FBFAF5] p-6 outline-none"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-ink pb-3">
          <h3 id="boost-modal-title" className="text-[16px] font-semibold tracking-[-0.02em] text-ink">Subir al nº 1 — 7 días</h3>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="text-ink/40 transition-colors hover:text-ink focus:outline-none focus:ring-2 focus:ring-ink"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <p className="mb-3 text-[13px] leading-relaxed text-ink/65">
          <strong>{titulo}</strong>
        </p>
        <p className="mb-2">
          Tu publicación pasará a la <strong>primera posición</strong> del catálogo y de la portada,
          y se mantendrá ahí durante <strong>7 días</strong>.
        </p>
        <p className="mb-3 text-[13px] leading-relaxed text-ink/65">
          Si otra persona sube su anuncio después, compartiréis la parte alta de la lista: el orden
          entre anuncios subidos lo decide la fecha de la subida.
        </p>
        <div className="mb-6 flex items-center gap-2 border border-signal-deep/40 bg-signal/15 p-3">
          <Zap size={14} strokeWidth={1.6} className="text-ink" aria-hidden="true" />
          <span className="t-label text-ink">Costo: 1 crédito</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="btn btn-outline flex-1 justify-center"
          >
            Cancelar
          </button>
          <button
            onClick={onBoost}
            className="btn btn-ink flex-1 justify-center"
          >
            Subir al nº 1 · 1 crédito
          </button>
        </div>
      </div>
    </div>
  )
}
