import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

// Carga una fuente local (TTF) para no depender de la CDN en runtime:
// sin red externa la imagen 500.
type LocalFont = { data: Buffer; weight: number; style: 'normal' }
let cachedFonts: LocalFont[] | null = null
function getLocalFonts(): LocalFont[] {
  if (cachedFonts) return cachedFonts
  const dir = path.join(process.cwd(), 'src', 'app', 'fonts')
  const wanted: [string, number][] = [
    ['inter-latin-400-normal.ttf', 400],
    ['inter-latin-700-normal.ttf', 700],
    ['inter-latin-900-normal.ttf', 900],
  ]
  const fonts: LocalFont[] = []
  for (const [file, weight] of wanted) {
    try {
      fonts.push({ data: fs.readFileSync(path.join(dir, file)), weight, style: 'normal' })
    } catch {
      // Fuente no disponible: seguimos con el resto (o sin fuentes).
    }
  }
  cachedFonts = fonts
  return fonts
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const categoria = searchParams.get('categoria') || 'agricola'

  const categorias: Record<string, { name: string; tagline: string; color: string }> = {
    agricola: { name: 'Maquinaria agrícola', tagline: 'Tractores, cosechadoras y aperos de ocasión', color: '#15803D' },
    obra: { name: 'Maquinaria de obra', tagline: 'Excavadoras, cargadores y plataformas', color: '#0F172A' },
    herramientas: { name: 'Herramienta profesional', tagline: 'Herramienta eléctrica, motores y taller', color: '#EA580C' },
    tractores: { name: 'Tractores de ocasión', tagline: 'De compactos de finca a 200 CV', color: '#15803D' },
    cosechadoras: { name: 'Cosechadoras', tagline: 'Grano y forraje de segunda mano', color: '#16A34A' },
    'maquinaria-agricola': { name: 'Aperos agrícolas', tagline: 'Sembradoras, arados y segadoras', color: '#1E293B' },
    ganaderia: { name: 'Maquinaria de ganadería', tagline: 'Ordeñadoras y bienestar animal', color: '#0F172A' },
    excavadoras: { name: 'Excavadoras', tagline: 'De 1,5 a 40 toneladas', color: '#C2410C' },
    cargadoras: { name: 'Cargadores', tagline: 'Frontales y articulados', color: '#EA580C' },
    compactacion: { name: 'Compactación', tagline: 'Rodillos y vibradores de obra', color: '#1E293B' },
    plataformas: { name: 'Plataformas elevadoras', tagline: 'Tijeras y torres para trabajar en altura', color: '#16A34A' },
    'herramienta-electrica': { name: 'Herramienta eléctrica', tagline: 'Taladros, amoladoras y sierras', color: '#EA580C' },
    motores: { name: 'Motores y generadores', tagline: 'Diésel, gasolina e inverter', color: '#0F172A' },
    'sierra-poda': { name: 'Sierras y poda', tagline: 'Motosierras y tijeras de segunda mano', color: '#15803D' },
    'taller-manual': { name: 'Herramienta de taller', tagline: 'Llaves, dados y compresores', color: '#1E293B' },
  }

  const cat = categorias[categoria] || categorias.agricola

  // SIN EMOJI: satori los renderiza fetchando SVG desde una CDN (jsdelivr).
  // Si no hay red externa, la imagen falla. Usamos formas geométricas.
  const localFonts = getLocalFonts()
  // Buffer es un Uint8Array válido para satori; `any` evita la fricción de
  // tipos Buffer<ArrayBufferLike> de TS 5.7+ y del union `Weight`.
  const fontOptions: any = localFonts.map(f => ({
    data: f.data,
    weight: f.weight,
    style: 'normal',
    name: 'Inter',
  }))

  return new ImageResponse(
    (
      <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: cat.color, backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 0%, transparent 40%), radial-gradient(circle at 75% 75%, rgba(0,0,0,0.2) 0%, transparent 40%)', padding: '40px', color: 'white', fontFamily: 'Inter, sans-serif' }}>
        {/* Marca: piñón geométrico neutro (maquinaria), sin dependencias externas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '24px' }}>
          <div style={{ width: '96px', height: '96px', borderRadius: '50%', border: '14px solid rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '34px', height: '34px', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '6px' }} />
          </div>
          <div style={{ width: '140px', height: '26px', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '8px' }} />
          <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.9)' }} />
        </div>
        <h1 style={{ fontSize: '58px', fontWeight: 'bold', textAlign: 'center', textShadow: '2px 2px 4px rgba(0,0,0,0.5)', lineHeight: 1.2 }}>{cat.name}</h1>
        <p style={{ fontSize: '34px', marginTop: '18px', textAlign: 'center', opacity: 0.9 }}>{cat.tagline}</p>
        <div style={{ position: 'absolute', bottom: '20px', fontSize: '24px', fontWeight: 'bold', color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>maquinaria.click</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: fontOptions,
    }
  )
}
