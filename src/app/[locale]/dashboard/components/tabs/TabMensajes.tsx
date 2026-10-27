'use client'

import LocalLink from '@/components/LocalLink'
import { MessageSquare, ArrowRight } from 'lucide-react'

export default function TabMensajes() {
  return (
    <div className="border border-line bg-[#FBFAF5] p-8 sm:p-10">
      <div className="max-w-md">
        <div className="w-12 h-12 border border-line bg-paper-2 flex items-center justify-center mb-4">
          <MessageSquare size={22} className="text-ink" aria-hidden="true" />
        </div>
        <h3 className="text-[15px] font-semibold tracking-[-0.015em] text-ink mb-2">Conversaciones</h3>
        <p className="text-ink/60 text-sm leading-relaxed">
          El chat es en tiempo real. Ábrelo para responder a compradores: quien contesta antes, vende.
        </p>
        <LocalLink
          href="/chat"
          className="btn btn-ink btn-sm mt-6"
        >
          Abrir chat
          <ArrowRight size={16} aria-hidden="true" />
        </LocalLink>
      </div>
    </div>
  )
}
