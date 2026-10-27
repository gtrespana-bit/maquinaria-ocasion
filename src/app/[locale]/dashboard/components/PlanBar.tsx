'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, CreditCard, Sparkles } from 'lucide-react'
import { etiquetaPlan } from '@/lib/planes-anuncios'
import type { DashboardTab } from './DashboardNav'

type Estado = {
  plan: string
  planContratado: string
  planPagoVigente: boolean
  trial: boolean
  diasTrial: number
  trialGracia?: boolean
  diasGracia?: number
  pagoFallido?: boolean
  pausadosPorPlan?: number
  cupo: { usados: number; max: number | null; restantes: number | null; plan?: string }
}

/**
 * Franja de estado del plan, visible en todas las pestañas del panel.
 *
 * Antes el plan solo aparecía cuando el usuario se quedaba sin cupo. Es el
 * peor momento para explicar que existe un pack: ya está frustrado. Esta
 * franja lo mantiene visible (y con la cuenta atrás de la prueba) sin tapar
 * el contenido.
 */
export default function PlanBar({ onAbrirPlan }: { onAbrirPlan: (tab: DashboardTab) => void }) {
  const [estado, setEstado] = useState<Estado | null>(null)

  useEffect(() => {
    let vivo = true
    const cargar = () => {
      fetch('/api/planes/estado', { cache: 'no-store' })
        .then(r => (r.ok ? r.json() : null))
        .then(d => {
          if (!vivo || !d?.ok) return
          setEstado(d)
        })
        .catch(() => {})
    }
    cargar()
    // Tras empezar la prueba o reactivar anuncios, la franja debe reflejarlo
    // sin obligar a recargar la página.
    window.addEventListener('plan-actualizado', cargar)
    return () => {
      vivo = false
      window.removeEventListener('plan-actualizado', cargar)
    }
  }, [])

  if (!estado) return null

  const cupo = estado.cupo
  const nombre = estado.trial
    ? `Prueba ${etiquetaPlan(estado.cupo.plan || 'starter')}`
    : estado.trialGracia
      ? 'Prueba terminada (gracia)'
      : etiquetaPlan(estado.planPagoVigente ? estado.planContratado : estado.plan)

  let texto = `${nombre}`
  if (cupo.max == null) texto += ' · anuncios ilimitados'
  else texto += ` · ${cupo.usados}/${cupo.max} anuncios`
  if (estado.trial && estado.diasTrial > 0) texto += ` · quedan ${estado.diasTrial} días`
  if (estado.trialGracia) texto += ` · ${estado.diasGracia || 0} días de gracia`
  if (estado.pausadosPorPlan) texto += ` · ${estado.pausadosPorPlan} pausado${estado.pausadosPorPlan === 1 ? '' : 's'}`

  const fallo = Boolean(estado.pagoFallido)
  const destacar = Boolean(estado.trial || estado.trialGracia || !estado.planPagoVigente)

  return (
    <button
      type="button"
      onClick={() => onAbrirPlan('plan')}
      className={`mb-5 flex w-full items-center justify-between gap-3 border px-4 py-3 text-left transition-colors ${
        fallo
          ? 'border-clay/50 bg-clay/[0.05] hover:bg-clay/10'
          : destacar
            ? 'border-signal-deep/40 bg-signal/20 hover:bg-signal/30'
            : 'border-line bg-[#FBFAF5] hover:bg-paper-2'
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        {fallo ? (
          <CreditCard size={15} strokeWidth={1.6} className="shrink-0 text-clay" aria-hidden="true" />
        ) : (
          <Sparkles size={15} strokeWidth={1.6} className={destacar ? 'shrink-0 text-ink/70' : 'shrink-0 text-moss'} aria-hidden="true" />
        )}
        <span className={`truncate text-[13px] font-medium ${fallo ? 'text-clay' : 'text-ink'}`}>
          {fallo ? 'Cobro pendiente: ' : 'Plan: '}
          {texto}
        </span>
      </span>
      <span className={`t-label flex shrink-0 items-center gap-1.5 ${fallo ? 'text-clay' : destacar ? 'text-ink/70' : 'text-ink/45'}`}>
        {fallo
          ? 'Actualizar'
          : estado.trial || estado.trialGracia
            ? 'Activar'
            : estado.planPagoVigente
              ? 'Gestionar'
              : 'Ver planes'}
        <ArrowRight size={11} aria-hidden="true" />
      </span>
    </button>
  )
}
