'use client'

import { Star } from 'lucide-react'

interface SellerReputationProps {
  nivel: number           // 0-5
  numResenas: number
  promedioResenas: number
  numPubsActivas: number
  numPubsVendidas: number
  antiguedadDias: number
  ultimaActividad: string | null
  verificado: boolean
  badges: string[]
  size?: 'sm' | 'md' | 'lg'
}

const NIVELES: Record<number, { nombre: string; desc: string; bg: string; text: string; border: string }> = {
  0: { nombre: 'Bronce', desc: 'Vendedor Novel', bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
  1: { nombre: 'Plata', desc: 'Vendedor en Ascenso', bg: 'bg-paper-2', text: 'text-ink/75', border: 'border-line-strong' },
  2: { nombre: 'Oro', desc: 'Vendedor Confiable', bg: 'bg-paper-2', text: 'text-ink', border: 'border-yellow-300' },
  3: { nombre: 'Platino', desc: 'Vendedor Premium', bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' },
  4: { nombre: 'Diamante', desc: 'Vendedor Élite', bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-line' },
  5: { nombre: 'Maestro', desc: 'Vendedor Legendario', bg: 'bg-signal/15', text: 'text-ink', border: 'border-line-strong' } }

const BADGE_CONFIG: Record<string, { label: string; color: string; tooltip: string }> = {
  vendedor_activo: { label: '🟢 Vendedor Activo', color: 'bg-moss/10 text-moss border-line', tooltip: 'Publicó en los últimos 7 días' },
  '10_ventas': { label: '📦 10+ ventas', color: 'bg-paper-2 text-ink border-line', tooltip: 'Más de 10 ventas' },
  '20_ventas': { label: '📦 20+ ventas', color: 'bg-paper-2 text-blue-800 border-line', tooltip: 'Más de 20 ventas' },
  '50_ventas': { label: '🏆 50+ ventas', color: 'bg-paper-2 text-purple-800 border-line', tooltip: 'Más de 50 ventas' },
  '20_publicaciones': { label: '📋 20+ publicaciones', color: 'bg-paper-2 text-ink/75 border-line', tooltip: 'Más de 20 publicaciones' },
  '50_publicaciones': { label: '📋 50+ publicaciones', color: 'bg-paper-2 text-ink border-line', tooltip: 'Más de 50 publicaciones' },
  '100_publicaciones': { label: '⭐ 100+ publicaciones', color: 'bg-signal/15 text-ink border-line', tooltip: 'Más de 100 publicaciones en total' },
  buena_reputacion: { label: '⭐ Buena reputación', color: 'bg-signal/15 text-ink border-line', tooltip: '5+ reseñas con promedio 4.0+' },
  top_vendedor: { label: '👑 Top Vendedor', color: 'bg-signal/15 text-ink border-amber-300', tooltip: '10+ reseñas con promedio 4.5+' } }

function getLastActivityText(ultimaActividad: string | null): string {
  if (!ultimaActividad) return ''
  const diff = Math.floor((Date.now() - new Date(ultimaActividad).getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Activo hoy'
  if (diff === 1) return 'Activo ayer'
  if (diff < 7) return `Activo hace ${diff} días`
  if (diff < 30) return `Última vez hace ${Math.floor(diff / 7)} sem.`
  return `Última vez hace ${Math.floor(diff / 30)} meses`
}

export default function SellerReputation({
  nivel, numResenas, promedioResenas, numPubsActivas,
  numPubsVendidas, antiguedadDias, ultimaActividad,
  verificado, badges, size = 'md' }: SellerReputationProps) {
  const isCompact = size === 'sm'
  const ICONOS: Record<number, string> = { 0: '🥉', 1: '🥈', 2: '🥇', 3: '💎', 4: '💠', 5: '👑' }
  const cfg = NIVELES[Math.min(nivel, 5)]
  const icon = ICONOS[Math.min(nivel, 5)]
  if (!cfg) return null

  return (
    <div className="space-y-3">
      {/* Fila 1: Nivel principal + Reseñas inline */}
      <div className="flex flex-wrap items-center gap-2">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${cfg.bg} ${cfg.border}`}>
          <span className="text-base leading-none">{icon}</span>
          <span className={`text-xs font-bold ${cfg.text}`}>
            {cfg.nombre} — {cfg.desc}
          </span>
          {nivel > 0 && (
            <span className={`text-[11.5px] italic ${cfg.text.replace(/800/g, '500').replace(/700/g, '500').replace(/600/g, '400')}`}>
              · Nivel {nivel}
            </span>
          )}
        </div>
        {numResenas > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <Star size={12} className="text-yellow-400 fill-yellow-400" />
            {promedioResenas.toFixed(1)} · {numResenas} reseña{numResenas !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Fila 2: Badges automáticos */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {badges.slice(0, isCompact ? 4 : 6).map(badge => {
            const bCfg = BADGE_CONFIG[badge]
            if (!bCfg) return null
            return (
              <span
                key={badge}
                className={`inline-flex items-center text-[12px] font-medium px-2.5 py-0.5 rounded-full border ${bCfg.color}`}
                title={bCfg.tooltip}
              >
                {bCfg.label}
              </span>
            )
          })}
        </div>
      )}

      {/* Fila 3: Info adicional (solo md/lg) */}
      {!isCompact && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-muted pt-3 border-t border-line">
          <div>📦 {numPubsActivas} activas, {numPubsVendidas} vendidas</div>
          <div>
            {verificado ? '✅ Verificado · ' : ''}{getLastActivityText(ultimaActividad) || `Miembro hace ${Math.floor(antiguedadDias / 30 || 0)} meses`}
          </div>
          <div className="hidden sm:block">
            ⭐ {promedioResenas.toFixed(1)} · {numResenas} reseña{numResenas !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  )
}
