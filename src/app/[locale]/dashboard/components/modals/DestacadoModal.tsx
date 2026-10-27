'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Star } from 'lucide-react'
import LocalLink from '@/components/LocalLink'

export default function DestacadoModal({
  titulo,
  creditos,
  onDestacar,
  onIncluido,
  onClose }: {
  titulo: string
  creditos: number
  destacadosRestantes?: number
  onDestacar: (horas: number) => void
  onIncluido?: () => void
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [restantes, setRestantes] = useState(0)
  useEffect(() => {
    fetch('/api/cupo-anuncios')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d?.ok) setRestantes(d.destacadosRestantes || 0) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    dialogRef.current?.focus()
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
        aria-labelledby="destacado-modal-title"
        tabIndex={-1}
        className="w-full max-w-md border border-line-strong bg-[#FBFAF5] p-6 outline-none"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-ink pb-3">
          <h3 id="destacado-modal-title" className="text-[16px] font-semibold tracking-[-0.02em] text-ink">Destacar publicación</h3>
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
        <p className="mb-3 text-[13px] leading-relaxed text-ink/65">Tu publicación aparecerá:</p>
        <ul className="mb-6 space-y-1.5 text-[12.5px] text-ink/65" role="list">
          <li className="flex items-start gap-2">
            <Star size={11} strokeWidth={2} className="mt-1 shrink-0 text-ink/40" aria-hidden="true" />
            <span>En la <strong className="font-semibold text-ink">página principal</strong> como destacado</span>
          </li>
          <li className="flex items-start gap-2">
            <Star size={11} strokeWidth={2} className="mt-1 shrink-0 text-ink/40" aria-hidden="true" />
            <span>Con <strong className="font-semibold text-ink">prioridad</strong> en resultados de búsqueda</span>
          </li>
        </ul>
        {restantes > 0 && onIncluido && (
          <button
            type="button"
            onClick={onIncluido}
            className="mb-4 w-full border border-moss/35 bg-moss-soft p-3 text-left transition-colors hover:border-moss"
          >
            <span className="block text-[13px] font-semibold text-moss">Usar destacado del plan · 7 días</span>
            <span className="mt-0.5 block text-[11.5px] text-moss/80">Te quedan {restantes} este mes. No gasta créditos.</span>
          </button>
        )}
        <div className="space-y-2 mb-6">
          {[
            { horas: 12, creditos: 4 },
            { horas: 24, creditos: 6 },
            { horas: 48, creditos: 10 },
          ].map(op => (
            <button
              key={op.horas}
              onClick={() => onDestacar(op.horas)}
              disabled={creditos < op.creditos}
              className={`flex w-full items-center justify-between border p-3 transition-colors focus:outline-none focus:ring-2 focus:ring-ink ${
                creditos >= op.creditos
                  ? 'border-line bg-paper hover:border-ink hover:bg-signal/15'
                  : 'cursor-not-allowed border-line bg-paper-2 opacity-50'
              }`}
              aria-label={`Destacar ${op.horas} horas por ${op.creditos} créditos`}
            >
              <span className="t-num text-[13px] font-semibold text-ink">{op.horas} h</span>
              <span className="t-num text-[12.5px] text-ink/60">{op.creditos} créditos</span>
              {creditos < op.creditos && <span className="t-label text-clay">insuficiente</span>}
            </button>
          ))}
        </div>
        <LocalLink
          href="/creditos"
          className="t-label block text-center text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-ink focus:outline-none focus:ring-2 focus:ring-ink"
        >
          ¿Necesitas más créditos? Comprar
        </LocalLink>
      </div>
    </div>
  )
}
