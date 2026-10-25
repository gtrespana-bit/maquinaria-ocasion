import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireUser } from '@/lib/require-auth'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { verificarContenido } from '@/lib/moderacion'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Responder en un hilo del foro.
 * - Sesión obligatoria, 30 respuestas/hora por usuario.
 * - Hilo cerrado → 409. Moderación idéntica a la de los hilos.
 * - Tras insertar se incrementa `mensajes_count` y `actualizado_en` del hilo
 *   (cosmético: si falla, la respuesta ya está guardada).
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

    const hiloId = typeof body.hilo_id === 'string' ? body.hilo_id : ''
    const cuerpo = typeof body.cuerpo === 'string' ? body.cuerpo.trim() : ''

    if (!UUID_RE.test(hiloId)) {
      return NextResponse.json({ error: 'Hilo no válido' }, { status: 400 })
    }
    if (cuerpo.length < 2 || cuerpo.length > 4000) {
      return NextResponse.json({ error: 'La respuesta debe tener entre 2 y 4000 caracteres' }, { status: 400 })
    }

    const rl = await checkRateLimit('foro:mensaje', userId, { ip: getClientIp(req) })
    if (!rl.ok) {
      return NextResponse.json({
        error: `Demasiadas respuestas seguidas. Espera ${Math.ceil(rl.resetIn / 60000)} min`,
        resetIn: rl.resetIn,
      }, { status: 429 })
    }

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    )

    const { data: hilo } = await sb
      .from('foro_hilos')
      .select('id, cerrado, mensajes_count')
      .eq('id', hiloId)
      .maybeSingle()
    if (!hilo) {
      return NextResponse.json({ error: 'Hilo no encontrado' }, { status: 404 })
    }
    if (hilo.cerrado) {
      return NextResponse.json({ error: 'Este hilo está cerrado' }, { status: 409 })
    }

    const veredicto = verificarContenido(cuerpo)
    if (veredicto.nivel === 'prohibido') {
      return NextResponse.json({ error: 'Este mensaje contiene contenido no permitido' }, { status: 400 })
    }
    const estado = veredicto.nivel === 'sospechoso' ? 'pendiente' : 'aprobado'

    const { data, error } = await sb.from('foro_mensajes').insert({
      hilo_id: hiloId,
      user_id: userId,
      cuerpo,
      estado_moderacion: estado,
      motivo_moderacion: estado === 'pendiente' ? 'Revisión automática: términos sospechosos' : null,
    }).select('id, estado_moderacion').single()

    if (error || !data) {
      return NextResponse.json({ error: 'No se pudo enviar la respuesta' }, { status: 500 })
    }

    try {
      await sb
        .from('foro_hilos')
        .update({
          mensajes_count: (hilo.mensajes_count || 0) + 1,
          actualizado_en: new Date().toISOString(),
        })
        .eq('id', hiloId)
    } catch {
      // El contador y el orden son cosméticos: la respuesta ya se guardó.
    }

    return NextResponse.json({ id: data.id, estado: data.estado_moderacion }, { status: 201 })
  } catch (error) {
    console.error('foro/mensajes POST error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
