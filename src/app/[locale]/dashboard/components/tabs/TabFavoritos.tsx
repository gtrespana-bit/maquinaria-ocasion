'use client'

import { formatPrecio } from '@/lib/precio'

import LocalLink from '@/components/LocalLink'
import { Heart, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { productUrl } from '@/lib/product-url'
import Image from 'next/image'

export default function TabFavoritos({ favoritos }: { favoritos: any[] }) {
  if (favoritos.length === 0) {
    return (
      <div className="bg-[#FBFAF5]  border border-line p-8 text-center">
        <Heart size={48} className="text-ink/60 mx-auto mb-4" />
        <h3 className="text-[15px] font-semibold tracking-[-0.015em] text-ink mb-2">Tus favoritos</h3>
        <p className="text-ink/60">Guarda publicaciones que te interesen para verlas después.</p>
      </div>
    )
  }

  return (
    <div className="bg-[#FBFAF5]  border border-line p-5">
      <h3 className="font-semibold text-lg mb-4">Mis favoritos ({favoritos.length})</h3>
      <div className="space-y-3">
        {favoritos.map((fav: any) => {
          const p = fav.productos
          return (
            <div key={fav.producto_id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-paper-2 border border-line transition">
              <LocalLink href={productUrl(p)} className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-16 h-16 rounded-lg bg-paper-2 flex-shrink-0 overflow-hidden">
                  {p.imagen_url ? (
                    <Image src={p.imagen_url} alt={p.titulo} className="w-full h-full object-cover" fill sizes="100px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink/60 text-xs">Sin foto</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-ink truncate">{p.titulo}</h4>
                  <p className="text-sm text-ink font-semibold">{formatPrecio(p.precio_usd || 0)}</p>
                  {p.ubicacion_ciudad && <p className="text-[11.5px] text-ink/45">{p.ubicacion_ciudad}</p>}
                </div>
              </LocalLink>
              <button onClick={async () => { await supabase.from('favoritos').delete().eq('producto_id', p.id); window.location.reload() }} className="p-2 hover:bg-red-50 rounded-lg transition text-red-500" title="Quitar de favoritos">
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
