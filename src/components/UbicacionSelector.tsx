'use client'

import { ESTADOS, getMunicipiosNombres, getMunicipios } from '@/lib/ubicaciones'

interface UbicacionSelectorProps {
  estado: string
  ciudad: string  // se mantiene como "ciudad" para compatibilidad, pero ahora es el municipio
  onChange: (estado: string, ciudad: string) => void
  showCapital?: boolean  // mostrar la capital del municipio como hint
}

export default function UbicacionSelector({ estado, ciudad, onChange, showCapital = false }: UbicacionSelectorProps) {
  const municipios = estado ? getMunicipiosNombres(estado) : []
  const todosProvincias = estado ? getMunicipios(estado) : []

  // Encontrar la capital del municipio seleccionado para mostrar como hint
  const capitalSeleccionada = showCapital && estado && ciudad 
    ? todosProvincias.find(m => m.nombre === ciudad)?.capital 
    : null

  return (
    <div className="border border-line bg-paper p-3">
      {/* ✅ ACCESIBILIDAD: h3 → h2 para orden secuencial */}
      <h2 className="t-label mb-2.5 text-ink/50">
        Ubicación en España
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* ✅ ACCESIBILIDAD: htmlFor + id para vincular label con select */}
        <div>
          <label htmlFor="ubicacion-estado" className="t-label mb-1 block text-ink/45">Comunidad Autónoma</label>
          <select
            id="ubicacion-estado"
            value={estado}
            onChange={(e) => { onChange(e.target.value, '') }}
            className="field text-[12.5px]"
          >
            <option value="">Toda España</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        {/* ✅ ACCESIBILIDAD: htmlFor + id para vincular label con select */}
        <div>
          <label htmlFor="ubicacion-municipio" className="t-label mb-1 block text-ink/45">
            Provincia
          </label>
          <select
            id="ubicacion-municipio"
            value={ciudad}
            onChange={(e) => { onChange(estado, e.target.value) }}
            disabled={!estado}
            className="field text-[12.5px] disabled:opacity-45"
          >
            <option value="">Todas las provincias</option>
            {municipios.map((m) => (
              <option key={m} value={m}>
                {m}
                {capitalSeleccionada === m && showCapital ? ` (${getMunicipios(estado).find(x => x.nombre === m)?.capital || ''})` : ''}
              </option>
            ))}
          </select>
          {capitalSeleccionada && (
            <p className="t-label mt-1 text-ink/35">Capital: {capitalSeleccionada}</p>
          )}
        </div>

        {/* Limpiar */}
        {(estado || ciudad) && (
          <button
            onClick={() => onChange('', '')}
            aria-label="Limpiar filtro de ubicación"
            className="t-label col-span-1 border border-clay/30 py-1.5 text-center text-clay transition-colors hover:bg-clay/[0.05] sm:col-span-2"
          >
            ✕ Limpiar ubicación
          </button>
        )}
      </div>
    </div>
  )
}