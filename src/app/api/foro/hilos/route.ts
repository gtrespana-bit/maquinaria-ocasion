import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireUser } from '@/lib/require-auth'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { verificarContenido } from '@/lib/moderacion'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Crear un hilo del foro.
 * - Sesión obligatoria, 5 hilos/hora por usuario.
 * - Moderación de contenido: limpio → aprobado, sospechoso → pendiente de
 *   revisión, prohibido → 400. Solo el autor ve su hilo pendiente (RLS).
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req)
    if ('response' in auth) return auth.response
    const userId = auth.user.id

    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const titulo = typeof body.titulo === 'string' ? body.titulo.trim() : ''
    const cuerpo = typeof body.cuerpo === 'string' ? body.cuerpo.trim() : ''
    const categoriaId = typeof body.categoria_id === 'string' ? body.categoria_id : ''

    if (titulo.length < 8 || titulo.length > 160) {
      return NextResponse.json({ error: 'El título debe tener entre 8 y 160 caracteres' }, { status: 400 })
    }
    if (cuerpo.length < 10 || cuerpo.length > 6000) {
      return NextResponse.json({ error: 'El mensaje debe tener entre 10 y 6000 caracteres' }, { status: 400 })
    }
    if (!UUID_RE.test(categoriaId)) {
      return NextResponse.json({ error: 'Categoría no válida' }, { status: 400 })
    }

    const rl = await checkRateLimit('foro:hilo', userId, { ip: getClientIp(req) })
    if (!rl.ok) {
      return NextResponse.json({
        error: `Demasiados hilos seguidos. Espera ${Math.ceil(rl.resetIn / 60000)} min`,
        resetIn: rl.resetIn,
      }, { status: 429 })
    }

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    )

    const { data: categoria } = await sb
      .from('foro_categorias')
      .select('id')
      .eq('id', categoriaId)
      .maybeSingle()
    if (!categoria) {
      return NextResponse.json({ error: 'La categoría no existe' }, { status: 404 })
    }

    const veredicto = verificarContenido(`${titulo}\n${cuerpo}`)
    if (veredicto.nivel === 'prohibido') {
      return NextResponse.json({ error: 'Este mensaje contiene contenido no permitido' }, { status: 400 })
    }
    const estado = veredicto.nivel === 'sospechoso' ? 'pendiente' : 'aprobado'

    const { data, error } = await sb.from('foro_hilos').insert({
      categoria_id: categoriaId,
      user_id: userId,
      titulo,
      cuerpo,
      estado_moderacion: estado,
      motivo_moderacion: estado === 'pendiente' ? 'Revisión automática: términos sospechosos' : null,
    }).select('id, estado_moderacion').single()

    if (error || !data) {
      return NextResponse.json({ error: 'No se pudo crear el hilo' }, { status: 500 })
    }

    return NextResponse.json({ id: data.id, estado: data.estado_moderacion }, { status: 201 })
  } catch (error) {
    console.error('foro/hilos POST error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
