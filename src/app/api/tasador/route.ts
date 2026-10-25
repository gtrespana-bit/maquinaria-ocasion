import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server-client'
import { calcularRango, parseNumeroEspec, RANGO_VACIO, type RangoPrecio } from '@/lib/tasador'

/**
 * Estimador de precios (§2 del roadmap de marketplace).
 *
 * Recibe tipo (subcategoría) y, opcionalmente, marca/año/horas, y devuelve el
 * rango de precios de los anuncios comparables del portal (min/p25/mediana/
 * p75/max) más una muestra. Es el mismo «observatorio» que luego se enlaza
 * desde el form de publicar.
 *
 * Búsqueda en cascada: tipo+marca → tipo → marca. Se usa el primer escalón
 * con ≥3 comparables; si ninguno llega a 3, se responde con lo mejor que haya.
 * Los filtros de año/horas (ventanas) solo se aplican si dejan ≥3 anuncios.
 */

const MODERACION = 'estado_moderacion.is.null,estado_moderacion.eq.aprobado'
const COLS = 'id, slug, titulo, precio_usd, marca, subcategoria, especificaciones'
const MIN_COMPARABLES = 3
const LIMITE = 300

interface Candidato {
  id: string
  slug: string | null
  titulo: string
  precio_usd: number | null
  marca: string | null
  subcategoria: string | null
  especificaciones: Record<string, unknown> | null
}

async function buscarCandidatos(subcategoria?: string, marca?: string): Promise<{ datos: Candidato[]; alcance: string }> {
  const base = () =>
    supabase!
      .from('productos')
      .select(COLS)
      .eq('activo', true)
      .or(MODERACION)
      .order('creado_en', { ascending: false })
      .limit(LIMITE)

  const escalones: { nombre: string; q: () => any }[] = []
  if (subcategoria && marca) {
    escalones.push({ nombre: 'tipo+marca', q: () => base().eq('subcategoria', subcategoria).eq('marca', marca) })
  }
  if (subcategoria) {
    escalones.push({ nombre: 'tipo', q: () => base().eq('subcategoria', subcategoria) })
  }
  if (marca) {
    escalones.push({ nombre: 'marca', q: () => base().eq('marca', marca) })
  }
  if (escalones.length === 0) {
    escalones.push({ nombre: 'portal', q: () => base() })
  }

  let mejor: { datos: Candidato[]; alcance: string } = { datos: [], alcance: escalones[0].nombre }
  for (const e of escalones) {
    const { data, error } = await e.q()
    if (error) continue
    const datos = (data || []) as Candidato[]
    if (datos.length > mejor.datos.length) mejor = { datos, alcance: e.nombre }
    if (datos.length >= MIN_COMPARABLES) return { datos, alcance: e.nombre }
  }
  return mejor
}

export async function POST(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Servicio no disponible' }, { status: 503 })
    }

    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const subcategoria = typeof body.subcategoria === 'string' && body.subcategoria.trim()
      ? body.subcategoria.trim().slice(0, 80)
      : undefined
    const marca = typeof body.marca === 'string' && body.marca.trim()
      ? body.marca.trim().slice(0, 60)
      : undefined
    const anio = Number.isFinite(Number(body.anio)) && Number(body.anio) > 0 ? Number(body.anio) : null
    const horas = Number.isFinite(Number(body.horas)) && Number(body.horas) > 0 ? Number(body.horas) : null
    const tuPrecio = Number.isFinite(Number(body.tuPrecio)) && Number(body.tuPrecio) > 0
      ? Number(body.tuPrecio)
      : null

    const { datos, alcance } = await buscarCandidatos(subcategoria, marca)
    if (datos.length === 0) {
      return NextResponse.json({ ok: true, alcance, rango: RANGO_VACIO, muestra: [] })
    }

    // Ventanas: ±5 años y ±40% de horas (mínimo 500 h). Solo afinan si no
    // dejan la muestra por debajo de MIN_COMPARABLES: mejor un rango amplio
    // con pocos datos finos que un rango con 2 anuncios.
    let filtrados = datos
    if (anio != null) {
      const conAnio = filtrados.filter(c => {
        const a = parseNumeroEspec(c.especificaciones?.['Año'] ?? c.especificaciones?.['Ano'])
        return a != null && Math.abs(a - anio) <= 5
      })
      if (conAnio.length >= MIN_COMPARABLES) filtrados = conAnio
    }
    if (horas != null) {
      const margen = Math.max(500, horas * 0.4)
      const conHoras = filtrados.filter(c => {
        const h = parseNumeroEspec(
          c.especificaciones?.['Horas de uso'] ?? c.especificaciones?.['Horas'] ?? c.especificaciones?.['Horas de uso (h)']
        )
        return h != null && Math.abs(h - horas) <= margen
      })
      if (conHoras.length >= MIN_COMPARABLES) filtrados = conHoras
    }

    const rango: RangoPrecio = calcularRango(filtrados.map(c => c.precio_usd))

    // Muestra: los más cercanos a la mediana (representativos del rango)
    const mediana = rango.mediana ?? 0
    const muestra = [...filtrados]
      .filter(c => Number(c.precio_usd) > 0)
      .sort((a, b) => Math.abs(Number(a.precio_usd) - mediana) - Math.abs(Number(b.precio_usd) - mediana))
      .slice(0, 6)
      .map(c => ({ id: c.id, slug: c.slug, titulo: c.titulo, precio_usd: Number(c.precio_usd) }))

    return NextResponse.json({
      ok: true,
      alcance,
      rango,
      muestra,
      tuPrecio,
      veredicto: null, // lo calcula el cliente con veredictoPrecio()
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error inesperado' }, { status: 500 })
  }
}
