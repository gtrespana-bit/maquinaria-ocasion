'use client'

import { useState } from 'react'
import { ShieldCheck, Star, UserRound } from 'lucide-react'
import dynamic from 'next/dynamic'
import TabReputacion from './TabReputacion'

const SolicitarVerificacion = dynamic(() => import('@/components/SolicitarVerificacion'), { ssr: false })

type Props = {
  verificado: boolean
  nivelConfianza: number
  badgesAuto: string[]
  resenas: any[]
  promedioResenas: number
  numPubsActivas: number
  numPubsVendidas: number
  creadoEn: string | null
  ultimaActividad: string | null
  onEditarPerfil: () => void
  onPassword: () => void
}

export default function TabCuenta(props: Props) {
  const [ver, setVer] = useState<'reputacion' | 'verificacion'>('reputacion')

  return (
    <div className="space-y-5">
      <div className="border border-line bg-[#FBFAF5] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-ink flex items-center gap-2">
            <UserRound size={18} className="text-brand-accent" aria-hidden="true" />
            Tu perfil público
          </h3>
          <p className="text-[12.5px] text-ink/55 mt-0.5">
            Nombre, foto, teléfono y tipo de vendedor se editan arriba, en la cabecera.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={props.onEditarPerfil}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-ink text-paper hover:bg-brand-dark"
          >
            Editar perfil
          </button>
          <button
            type="button"
            onClick={props.onPassword}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-line text-ink hover:bg-paper-2"
          >
            Contraseña
          </button>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-paper-2 rounded-xl w-fit" role="tablist" aria-label="Confianza">
        <button
          type="button"
          role="tab"
          aria-selected={ver === 'reputacion'}
          onClick={() => setVer('reputacion')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            ver === 'reputacion' ? 'bg-[#FBFAF5] text-ink ' : 'text-ink/60'
          }`}
        >
          <Star size={16} aria-hidden="true" />
          Reputación
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={ver === 'verificacion'}
          onClick={() => setVer('verificacion')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            ver === 'verificacion' ? 'bg-[#FBFAF5] text-ink ' : 'text-ink/60'
          }`}
        >
          <ShieldCheck size={16} aria-hidden="true" />
          Verificación
        </button>
      </div>

      {ver === 'reputacion' ? (
        <TabReputacion
          verificado={props.verificado}
          nivelConfianza={props.nivelConfianza}
          badgesAuto={props.badgesAuto}
          resenas={props.resenas}
          promedioResenas={props.promedioResenas}
          numPubsActivas={props.numPubsActivas}
          numPubsVendidas={props.numPubsVendidas}
          creadoEn={props.creadoEn}
          ultimaActividad={props.ultimaActividad}
        />
      ) : (
        <SolicitarVerificacion />
      )}
    </div>
  )
}
