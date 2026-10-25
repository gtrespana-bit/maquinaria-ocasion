import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/require-auth'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const ACCIONES_HILO = ['aprobar', 'cerrar', 'abrir', 'eliminar'] as const
const ACCIONES_MENSAJE = ['aprobar-mensaje', 'eliminar-mensaje'] as const
const ACCIONES = [...ACCIONES_HILO, ...ACCIONES_MENSAJE] as const
type Accion = (typeof ACCIONES)[number]

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

/**
 * Cola de moderación del foro (solo admin):
 * - GET: hilos (todos los estados, incluidos pendientes que el RLS público no
 *   muestra) + respuestas pendientes, con categoría y autor resueltos.
 * - POST: aprobar / cerrar / abrir / eliminar hilo, aprobar / eliminar
 *   respuesta. El borrado de un hilo cascada a sus respuestas (FK ON DELETE).
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req)
    if ('response' in auth) return auth.response

    const sb = serviceClient()

    const [hilosRes, mensajesRes] = await Promise.all([
      sb
        .from('foro_hilos')
        .select(
          'id, titulo, cuerpo, estado_moderacion, motivo_moderacion, cerrado, mensajes_count, actualizado_en, creado_en, user_id, foro_categorias(nombre_es, nombre_en, icono, slug)',
        )
        .order('actualizado_en', { ascending: false })
        .limit(200),
      sb
        .from('foro_mensajes')
        .select('id, hilo_id, cuerpo, creado_en, user_id, foro_hilos(id, titulo)')
        .eq('estado_moderacion', 'pendiente')
        .order('creado_en', { ascending: true })
        .limit(100),
    ])

    if (hilosRes.error || mensajesRes.error) {
      const error = hilosRes.error || mensajesRes.error
      return NextResponse.json({ error: error!.message }, { status: 500 })
    }

    const hilos = (hilosRes.data || []) as any[]
    const mensajes = (mensajesRes.data || []) as any[]

    const ids = [...new Set([
      ...hilos.map(h => h.user_id),
      ...mensajes.map(m => m.user_id),
    ].filter(Boolean))]
    const { data: perfiles } = ids.length
      ? await sb.from('perfiles').select('id, nombre').in('id', ids)
      : { data: [] as any[] }
    const nombres: Record<string, string> = {}
    for (const p of (perfiles as any[] | null) || []) nombres[p.id] = p.nombre || ''

    return NextResponse.json({
      ok: true,
      hilos: hilos.map(h => ({
        ...h,
        categoria: h.foro_categorias,
        autor: nombres[h.user_id] || '—',
      })),
      mensajes: mensajes.map(m => ({
        ...m,
        hilo: m.foro_hilos,
        autor: nombres[m.user_id] || '—',
      })),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error desconocido' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req)
    if ('response' in auth) return auth.response

    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const action = body.action as Accion
    const id = typeof body.id === 'string' ? body.id : ''
    if (!ACCIONES.includes(action)) {
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'id no válido' }, { status: 400 })
    }

    const sb = serviceClient()

    if (action === 'eliminar') {
      const { error } = await sb.from('foro_hilos').delete().eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    if (action === 'eliminar-mensaje') {
      const { data: msg } = await sb
        .from('foro_mensajes')
        .select('id, hilo_id, foro_hilos(mensajes_count)')
        .eq('id', id)
        .maybeSingle()
      if (!msg) return NextResponse.json({ error: 'Respuesta no encontrada' }, { status: 404 })

      const { error } = await sb.from('foro_mensajes').delete().eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // El contador se incrementa al crear la respuesta: al eliminarla, bajarlo.
      const hilo = msg.foro_hilos as unknown as { mensajes_count: number | null } | null
      const actual = hilo?.mensajes_count || 0
      await sb
        .from('foro_hilos')
        .update({ mensajes_count: Math.max(0, actual - 1) })
        .eq('id', msg.hilo_id)
      return NextResponse.json({ ok: true })
    }

    if (action === 'aprobar-mensaje') {
      const { error } = await sb
        .from('foro_mensajes')
        .update({ estado_moderacion: 'aprobado', motivo_moderacion: null })
        .eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    const updateData = action === 'aprobar'
      ? { estado_moderacion: 'aprobado', motivo_moderacion: null }
      : action === 'cerrar'
        ? { cerrado: true }
        : action === 'abrir'
          ? { cerrado: false }
          : null
    if (!updateData) {
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }

    const { error } = await sb.from('foro_hilos').update(updateData).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error desconocido' }, { status: 500 })
  }
}
