'use client'

import Avatar from '@/components/Avatar'
import BadgeVerificado from '@/components/BadgeVerificado'
import BadgeTipoVendedor, { TIPOS_VENDEDOR } from '@/components/BadgeTipoVendedor'
import { getMunicipiosNombres, ESTADOS } from '@/lib/ubicaciones'
import { Camera, Edit, X, Save, Phone, MapPin, Mail } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

// Nivel de confianza: se expresa con trama y contraste, no con emojis.
// Los tonos suben de neutro a señal según el nivel (0 → 5).
const NIVELES: Record<number, { nombreKey: string; bg: string; text: string; border: string }> = {
  0: { nombreKey: 'levelBronze', bg: 'bg-paper-2', text: 'text-ink/60', border: 'border-line' },
  1: { nombreKey: 'levelSilver', bg: 'bg-paper-2', text: 'text-ink/70', border: 'border-line-strong' },
  2: { nombreKey: 'levelGold', bg: 'bg-signal/20', text: 'text-ink', border: 'border-signal-deep/40' },
  3: { nombreKey: 'levelPlatinum', bg: 'bg-signal/35', text: 'text-ink', border: 'border-signal-deep/50' },
  4: { nombreKey: 'levelDiamond', bg: 'bg-signal/55', text: 'text-ink', border: 'border-ink/20' },
  5: { nombreKey: 'levelMaster', bg: 'bg-signal', text: 'text-ink', border: 'border-ink' } }

export default function DashboardHeader({
  user,
  nombre, setNombre, telefono, setTelefono, estado, setEstado, ciudad, setCiudad,
  tipoVendedor, setTipoVendedor,
  fotoUrl, setFotoUrl,
  verificado, nivelConfianza, resenasCount, promedioResenas,
  setToast, setGuardando, onFotoChange,
  abrirEdicion = 0 }: {
  user: any
  nombre: string; setNombre: (s: string) => void
  telefono: string; setTelefono: (s: string) => void
  estado: string; setEstado: (s: string) => void
  ciudad: string; setCiudad: (s: string) => void
  tipoVendedor: string; setTipoVendedor: (s: string) => void
  fotoUrl: string | null; setFotoUrl: (s: string | null) => void
  verificado: boolean
  nivelConfianza: number
  resenasCount: number
  promedioResenas: number
  setToast: (msg: string | null) => void
  setGuardando: (b: boolean) => void
  onFotoChange: (e: any) => Promise<void>
  abrirEdicion?: number
}) {
  const t = useTranslations('dashboard')
  const tTipos = useTranslations('tiposVendedor')
  const [editando, setEditando] = useState(false)

  useEffect(() => {
    if (abrirEdicion) setEditando(true)
  }, [abrirEdicion])
  const municipiosDisponibles = estado ? getMunicipiosNombres(estado) : []

  async function handleGuardar() {
    if (!nombre.trim() || !user) return
    setGuardando(true)
    try {
      const response = await fetch('/api/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, telefono, estado, ciudad, tipo_vendedor: tipoVendedor }) })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setToast(t('saveError') + (result.error || 'Error desconocido'))
      } else {
        if (result.profile?.tipo_vendedor) setTipoVendedor(result.profile.tipo_vendedor)
        setEditando(false)
        setToast(t('profileSaved'))
      }
    } catch {
      setToast(t('saveError') + 'Error de conexión')
    }
    setGuardando(false)
    setTimeout(() => setToast(null), 4000)
  }

  const n = Math.min(nivelConfianza, 5)
  const cfg = NIVELES[n]

  return (
    <div className="mb-6 border border-ink/15 border-t-2 border-t-ink bg-[#FBFAF5] p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <label className="relative group cursor-pointer flex-shrink-0">
          <Avatar nombre={nombre} fotoUrl={fotoUrl} size="lg" />
          <div className="absolute inset-0 flex items-center justify-center bg-ink/60 opacity-0 transition group-hover:opacity-100">
            <Camera size={18} className="text-paper" />
          </div>
          <input type="file" accept="image/*" onChange={onFotoChange} className="hidden" />
        </label>
        <div className="flex-1 min-w-0">
          {editando ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="t-label mb-1 block text-ink/45">{t('name')}</label>
                  <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} className="field text-[13px]" placeholder={t('namePlaceholder')} />
                </div>
                <div>
                  <label className="t-label mb-1 flex items-center gap-1 text-ink/45"><Phone size={12} /> {t('phone')}</label>
                  <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} className="field text-[13px]" placeholder="+34 600 123 456" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="t-label mb-1 flex items-center gap-1 text-ink/45"><MapPin size={12} /> {t('state')}</label>
                  <select value={estado} onChange={e => setEstado(e.target.value)} className="field text-[13px]">
                    <option value="">{t('selectType')}</option>
                    {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="t-label mb-1 block text-ink/45">{t('municipality')}</label>
                  <select value={ciudad} onChange={e => setCiudad(e.target.value)} className="field text-[13px]" disabled={!estado}>
                    <option value="">{t('selectType')}</option>
                    {municipiosDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="t-label mb-2 block text-ink/45">{t('sellerTypeLabel')}</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {TIPOS_VENDEDOR.map(tipo => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => setTipoVendedor(tipo)}
                      className={`border p-2.5 text-left transition-colors ${
                        tipoVendedor === tipo
                          ? 'border-ink bg-signal'
                          : 'border-line bg-paper hover:border-ink'
                      }`}
                    >
                      <span className="block text-[13px] font-semibold text-ink">
                        {tTipos(tipo)}
                      </span>
                      <span className="mt-0.5 block text-[12px] leading-snug text-ink/55">
                        {tTipos(`${tipo}Desc`)}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink/40">{t('sellerTypeHint')}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleGuardar} className="btn btn-ink btn-sm">
                  <Save size={14} /> {t('save')}
                </button>
                <button onClick={() => setEditando(false)} className="btn btn-outline btn-sm">
                  <X size={14} /> {t('cancelEdit')}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-[21px] font-semibold tracking-[-0.025em] text-ink">
                  {nombre || <button onClick={() => setEditando(true)} className="text-[13px] font-medium text-ink underline underline-offset-4">{t('addName')}</button>}
                </h2>
                {user?.email && <p className="mt-1 flex items-center gap-1.5 text-[13px] text-ink/50"><Mail size={12} /> {user.email}</p>}
                {(ciudad || estado) && <p className="flex items-center gap-1.5 text-[13px] text-ink/50"><MapPin size={12} /> {[ciudad, estado].filter(Boolean).join(', ')}</p>}
                {/* Badges */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <BadgeTipoVendedor tipo={tipoVendedor} />
                  {verificado && <BadgeVerificado size="sm" />}
                  <div className="inline-flex items-center gap-1.5 text-xs">
                    <span className={`inline-flex items-center gap-1.5 border px-2 py-0.5 ${cfg.bg} ${cfg.border}`}>
                      <span aria-hidden="true" className={`h-1.5 w-1.5 ${cfg.text === 'text-ink' ? 'bg-ink' : 'bg-ink/40'}`} />
                      <span className={`t-label ${cfg.text}`}>{t(cfg.nombreKey)}</span>
                    </span>
                    {resenasCount > 0 && (
                      <span className="t-label text-ink/40">{t('reviewsSummary', { rating: promedioResenas.toFixed(1), count: resenasCount })}</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="btn btn-outline btn-sm w-full justify-center sm:w-auto"
              >
                <Edit size={14} aria-hidden="true" /> {t('editProfile')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
