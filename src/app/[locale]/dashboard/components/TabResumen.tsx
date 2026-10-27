'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { TrendingUp, Eye, MessageCircle, BarChart3 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import LocalLink from '@/components/LocalLink'
import type { DashboardTab } from './DashboardNav'

export default function TabResumen({
  userId,
  onIr }: {
  userId: string
  onIr?: (tab: DashboardTab) => void
}) {
  const t = useTranslations('dashboard')
  const [stats, setStats] = useState<any>(null)
  // Preferencia de avisos por email. `null` mientras se carga, para no
  // enseñar el interruptor en la posición equivocada durante un instante.
  const [avisosEmail, setAvisosEmail] = useState<boolean | null>(null)
  const [guardandoAvisos, setGuardandoAvisos] = useState(false)

  useEffect(() => {
    async function loadStats() {
      const uid = userId

      const { count: activos } = await supabase
        .from('productos')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', uid)
        .eq('activo', true)

      const { data: productos } = await supabase
        .from('productos')
        .select('visitas')
        .eq('user_id', uid)
        .eq('activo', true)

      const totalVisitas = productos?.reduce((sum: number, p: any) => sum + (p.visitas || 0), 0) || 0

      const { count: mensajesNoLeidos } = await supabase
        .from('mensajes')
        .select('id', { count: 'exact', head: true })
        .eq('destinatario_id', uid)
        .eq('leido', false)

      const { count: favoritos } = await supabase
        .from('favoritos')
        .select('id', { count: 'exact', head: true })
        .in('producto_id',
          (await supabase.from('productos').select('id').eq('user_id', uid).eq('activo', true))
            ?.data?.map((p: any) => p.id) || []
        )

      const { count: vendidos } = await supabase
        .from('productos')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', uid)
        .eq('activo', false)

      setStats({
        activos: activos || 0,
        totalVisitas,
        mensajesNoLeidos: mensajesNoLeidos || 0,
        favoritos,
        vendidos: vendidos || 0 })
    }
    loadStats()
  }, [userId])

  // Se lee y escribe por /api/perfil: la tabla `perfiles` tiene permisos por
  // columna y esta preferencia no está expuesta al navegador a propósito.
  useEffect(() => {
    let vivo = true
    fetch('/api/perfil')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!vivo) return
        // Sin dato todavía: el valor por defecto es avisar.
        setAvisosEmail(d?.profile?.email_avisos_mensajes !== false)
      })
      .catch(() => { if (vivo) setAvisosEmail(null) })
    return () => { vivo = false }
  }, [userId])

  async function cambiarAvisos(valor: boolean) {
    const previo = avisosEmail
    setAvisosEmail(valor)       // respuesta inmediata
    setGuardandoAvisos(true)
    try {
      const r = await fetch('/api/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_avisos_mensajes: valor }) })
      if (!r.ok) setAvisosEmail(previo)   // revertir si el servidor lo rechaza
    } catch {
      setAvisosEmail(previo)
    } finally {
      setGuardandoAvisos(false)
    }
  }

  if (!stats) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-4 w-1/4" />
        <div className="grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-24 bg-paper" />)}
        </div>
      </div>
    )
  }

  const tarjetas = [
    { label: t('activeListings'), value: stats.activos, icon: BarChart3 },
    { label: t('totalVisits'), value: new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(Number(stats.totalVisitas)), icon: Eye },
    { label: t('unreadMessages'), value: stats.mensajesNoLeidos, icon: MessageCircle, alerta: stats.mensajesNoLeidos > 0 },
    { label: t('savedFavorites'), value: stats.favoritos || 0, icon: TrendingUp },
  ]

  return (
    <div>
      <h3 className="t-eyebrow border-b border-ink pb-3 text-ink">{t('summaryTitle')}</h3>

      <dl className="grid grid-cols-2 gap-px border border-line border-t-0 bg-line lg:grid-cols-4">
        {tarjetas.map(item => {
          const Icon = item.icon
          return (
            <div key={item.label} className="bg-[#FBFAF5] px-4 py-4">
              <Icon size={15} strokeWidth={1.6} aria-hidden="true" className={item.alerta ? 'text-clay' : 'text-ink/25'} />
              <dd className={`t-display t-num mt-3 text-[1.75rem] leading-none ${item.alerta ? 'text-clay' : 'text-ink'}`}>{item.value}</dd>
              <dt className="t-label mt-2 text-ink/45">{item.label}</dt>
            </div>
          )
        })}
      </dl>

      {avisosEmail !== null && (
        <div className="mt-3 flex items-center justify-between gap-4 border border-line bg-[#FBFAF5] px-4 py-3">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-ink">Avisarme por email de mensajes nuevos</p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink/50">
              Solo si no los has leído en unos minutos. Quien responde antes, vende.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={avisosEmail}
            aria-label="Avisarme por email de mensajes nuevos"
            disabled={guardandoAvisos}
            className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors disabled:opacity-50 ${avisosEmail ? 'border-ink bg-ink' : 'border-line-strong bg-paper-2'}`}
          >
            <span className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${avisosEmail ? 'left-6 bg-paper' : 'left-0.5 bg-line-strong'}`} />
          </button>
        </div>
      )}

      {stats.vendidos > 0 && (
        <div className="mt-3 flex items-center gap-2.5 border border-moss/30 bg-moss-soft px-4 py-3">
          <span className="h-1.5 w-1.5 shrink-0 bg-moss" aria-hidden="true" />
          <p className="text-[13px] text-moss">
            <strong className="font-semibold">{stats.vendidos}</strong> {stats.vendidos === 1 ? 'anuncio vendido' : 'anuncios vendidos'}
          </p>
        </div>
      )}
    </div>
  )
}
