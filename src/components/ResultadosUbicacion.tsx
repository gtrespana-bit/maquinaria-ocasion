'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ESTADOS, getMunicipiosNombres } from '@/lib/ubicaciones'
import { Search, MapPin, ChevronDown, X } from 'lucide-react'

type ProductoCat = {
  id: string
  titulo: string
  precio_usd: number
  estado: string
  imagen_url: string | null
  ubicacion_ciudad: string | null
  ubicacion_estado: string | null
  creado_en: string
  boosteado_en: string | null
  destacado: boolean
  destacado_hasta: string | null
  vendedor_verificado: boolean | null
  subcategoria: string | null
}

export default function ResultadosUbicacion({
  q, loading, resultCount, estadoParam, ciudadParam, onUbicacionChange
}: {
  q: string
  loading: boolean
  resultCount: number
  estadoParam: string
  ciudadParam: string
  onUbicacionChange: (estado: string, ciudad: string) => void
}) {
  const [abierto, setAbierto] = useState(false)
  const [ciudades, setCiudades] = useState<string[]>([])

  useEffect(() => {
    setCiudades(estadoParam ? getMunicipiosNombres(estadoParam) : [])
  }, [estadoParam])

  const textoUbicacion = ciudadParam
    ? ciudadParam
    : estadoParam
      ? estadoParam
      : 'Toda España'

  return (
    <div className="bg-[#FBFAF5] rounded-xl p-4 mb-4 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <div>
          {q && <h1 className="text-xl font-bold text-ink">Resultados para &ldquo;{q}&rdquo;</h1>}
          {!loading && <p className="text-sm text-muted mt-1">{resultCount} resultado{resultCount !== 1 ? 's' : ''}</p>}
        </div>
        <form action="/buscar" method="GET" className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <input name="q" defaultValue={q} placeholder="Buscar..." className="w-full border rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-signal-deep" />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          </div>
          <button type="submit" className="bg-signal text-ink px-5 rounded-lg font-bold text-sm hover:bg-accent/90 transition whitespace-nowrap">Buscar</button>
        </form>
      </div>

      {/* Selector de ubicacion */}
      <div className="relative">
        <button
          onClick={() => setAbierto(!abierto)}
          className="inline-flex items-center gap-2 bg-paper-2 hover:bg-paper-2 border rounded-lg px-4 py-2 text-sm font-medium text-ink/75 transition"
        >
          <MapPin size={16} className="text-brand-primary" />
          <span className={ciudadParam || estadoParam ? 'text-ink' : 'text-muted'}>
            {textoUbicacion}
          </span>
          <ChevronDown size={14} className={`transition-transform ${abierto ? 'rotate-180' : ''}`} />
        </button>

        {(estadoParam || ciudadParam) && (
          <button onClick={() => onUbicacionChange('', '')} className="ml-2 text-xs text-clay hover:text-clay flex items-center gap-1">
            <X size={12} /> Quitar
          </button>
        )}

        {abierto && (
          <div className="absolute top-full left-0 mt-2 bg-[#FBFAF5] border rounded-xl shadow-xl p-4 w-72 z-50 animate-fadeIn">
            <div className="mb-3">
              <label className="block text-xs font-medium text-muted mb-1">Estado</label>
              <select
                value={estadoParam}
                onChange={(e) => onUbicacionChange(e.target.value, '')}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal-deep"
              >
                <option value="">Toda España</option>
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Municipio</label>
              <select
                value={ciudadParam}
                onChange={(e) => onUbicacionChange(estadoParam, e.target.value)}
                disabled={!estadoParam}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal-deep disabled:bg-paper-2 disabled:text-muted"
              >
                <option value="">Todos los municipios</option>
                {ciudades.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
