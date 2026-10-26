import { ImageResponse } from 'next/og'
import { TODAS_LAS_SUBS, familiaDeSub } from '@/lib/categorias'
import { formatPrecio } from '@/lib/precio'

export const runtime = 'edge'
export const alt = 'MaquinariaOcasión — Catálogo'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * Imagen Open Graph de /catalogo (y de sus vistas filtradas).
 *
 * Antes este fichero pintaba categorías de una taxonomía anterior: al
 * compartir el catálogo en WhatsApp o redes se veía una imagen con categorías
 * que no existen en MaquinariaOcasión. Ahora los tipos salen del registro real
 * (todos los subs de la taxonomía), así que la imagen no puede
 * desincronizarse.
 */
const SUBS = TODAS_LAS_SUBS

// Paleta por familia: verde para agrícola, grafito para obra, ámbar para
// herramienta. Se elige por la familia de la subcategoría (slug).
const FAMILIA_COLOR: Record<string, string> = {
  agricola: '#166534',
  obra: '#1E293B',
  herramientas: '#B45309',
}
const COLOR_POR_DEFECTO = '#0F172A'
const ICONO_POR_DEFECTO = '🚜'
const POR_DEFECTO = { name: 'Maquinaria y herramienta', icon: ICONO_POR_DEFECTO, color: COLOR_POR_DEFECTO }

function resolverCategoria(param?: string) {
  if (!param) return POR_DEFECTO
  const sub = SUBS.find((s) => s.slug === param || s.label.toLowerCase() === param.toLowerCase())
  if (!sub) return POR_DEFECTO
  const familia = familiaDeSub(sub.slug)
  return {
    name: sub.label,
    icon: sub.icon || ICONO_POR_DEFECTO,
    color: FAMILIA_COLOR[familia?.key ?? ''] || COLOR_POR_DEFECTO,
  }
}

export default async function Image({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const param = typeof searchParams?.subcategoria === 'string' ? searchParams.subcategoria : undefined
  const cat = resolverCategoria(param)
  const rangoPrecio = `De ${formatPrecio(12000)} a ${formatPrecio(250000)}+`

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: cat.color,
          backgroundImage:
            'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.18) 0%, transparent 40%), radial-gradient(circle at 75% 75%, rgba(0,0,0,0.25) 0%, transparent 40%)',
          padding: '40px',
          color: 'white',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div style={{ fontSize: '120px', marginBottom: '20px' }}>{cat.icon}</div>
        <h1
          style={{
            fontSize: '58px',
            fontWeight: 'bold',
            textAlign: 'center',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {cat.name}
        </h1>
        <p style={{ fontSize: '32px', marginTop: '20px', textAlign: 'center', opacity: 0.92 }}>{rangoPrecio}</p>
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'white',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          maquinaria.click
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
