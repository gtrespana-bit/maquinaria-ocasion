'use client'

import Image from 'next/image'

interface AvatarProps {
  nombre: string
  fotoUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  sm: { w: 8, h: 8, text: 'text-sm' },
  md: { w: 12, h: 12, text: 'text-lg' },
  lg: { w: 16, h: 16, text: 'text-2xl' },
  xl: { w: 24, h: 24, text: 'text-4xl' } }

export default function Avatar({ nombre, fotoUrl, size = 'md', className = '' }: AvatarProps) {
  const s = sizeMap[size]
  const initials = nombre ? nombre.charAt(0).toUpperCase() : '?'
  // Paleta contenida: la identidad del vendedor no debe competir con la
  // tipografía ni con el amarillo de señal.
  const bgColors = [
    'bg-ink', 'bg-ink-3', 'bg-[#3D4A3E]', 'bg-[#4A3F35]',
    'bg-[#2F3B44]', 'bg-[#4B3A3A]', 'bg-[#3A3A46]',
  ]
  const colorIndex = (nombre || '').charCodeAt(0) % bgColors.length
  const bgColor = bgColors[colorIndex]

  if (!fotoUrl) {
    return (
      <div
        className={`rounded-full ${bgColor} text-paper flex items-center justify-center font-bold ${s.text} flex-shrink-0 ${className}`}
        style={{ width: `${s.w * 4}px`, height: `${s.h * 4}px` }}
      >
        {initials}
      </div>
    )
  }

  return (
    <div
      className={`rounded-full overflow-hidden flex-shrink-0 relative ${className}`}
      style={{ width: `${s.w * 4}px`, height: `${s.h * 4}px` }}
    >
      <Image
        src={fotoUrl}
        alt={nombre || 'Avatar'}
        fill
        className="object-cover"
        onError={(e) => {
          // ✅ CORREGIDO: Fallback a iniciales con flag para prevenir loops
          const target = e.target as HTMLImageElement

          // Si ya procesamos el error, no hacer nada (prevenir loops)
          if (target.dataset.errorHandled === 'true') return
          target.dataset.errorHandled = 'true'

          target.style.display = 'none'
          const parent = target.parentElement
          if (parent) {
            parent.classList.add(bgColor, 'text-paper', 'flex', 'items-center', 'justify-center', 'font-bold', s.text)
            parent.innerHTML = initials
          }
        }}
      />
    </div>
  )
}