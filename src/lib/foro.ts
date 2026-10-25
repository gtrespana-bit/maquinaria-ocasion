import { supabase } from '@/lib/supabase-server-client'

/**
 * Lecturas del foro en servidor (RLS de lectura pública) y helpers de
 * presentación compartidos por el índice, el hilo y los JSON-LD.
 */

export type ForoCategoria = {
  id: string
  slug: string
  nombre_es: string
  nombre_en: string
  descripcion_es: string | null
  descripcion_en: string | null
  icono: string | null
  orden: number
}

export type ForoHilo = {
  id: string
  categoria_id: string
  user_id: string
  titulo: string
  cuerpo: string
  estado_moderacion: string | null
  motivo_moderacion: string | null
  cerrado: boolean | null
  mensajes_count: number | null
  actualizado_en: string | null
  creado_en: string | null
  foro_categorias: ForoCategoria | null
}

export type ForoMensaje = {
  id: string
  hilo_id: string
  user_id: string
  cuerpo: string
  estado_moderacion: string | null
  creado_en: string | null
}

/** Nombre localizado de una categoría (fallback: ES). */
export function nombreCategoria(cat: ForoCategoria | null | undefined, locale: string): string {
  if (!cat) return ''
  return locale === 'en' ? cat.nombre_en || cat.nombre_es : cat.nombre_es
}

/** Descripción localizada de una categoría. */
export function descripcionCategoria(cat: ForoCategoria | null | undefined, locale: string): string {
  if (!cat) return ''
  return (locale === 'en' ? cat.descripcion_en || cat.descripcion_es : cat.descripcion_es) || ''
}

/** «hace 3 días» / «3 days ago» con unidades cortas. */
export function haceTiempo(iso: string | null | undefined, locale: string): string {
  if (!iso) return ''
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return ''
  const seg = Math.max(0, Math.floor((Date.now() - fecha.getTime()) / 1000))
  const en = locale === 'en'
  if (seg < 60) return en ? 'just now' : 'ahora mismo'

  // Mayor unidad que encaja, en segundos por unidad.
  const umbrales: Array<[number, string, string]> = [
    [31557600, 'año', 'year'],
    [2629800, 'mes', 'month'],
    [604800, 'semana', 'week'],
    [86400, 'día', 'day'],
    [3600, 'hora', 'hour'],
    [60, 'minuto', 'minute'],
  ]
  const [segundos, es, eng] = umbrales.find(([s]) => seg >= s) ?? [60, 'minuto', 'minute']
  const cuenta = Math.floor(seg / segundos)
  const plural = cuenta === 1
    ? (en ? eng : es)
    : (en ? `${eng}s` : (/aeiouáéíóú$/i.test(es) ? `${es}s` : `${es}es`))
  return en ? `${cuenta} ${plural} ago` : `hace ${cuenta} ${plural}`
}

/** Lista de categorías ordenada (lectura pública). */
export async function getCategoriasForo(): Promise<ForoCategoria[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('foro_categorias')
    .select('id, slug, nombre_es, nombre_en, descripcion_es, descripcion_en, icono, orden')
    .order('orden', { ascending: true })
  return (data as ForoCategoria[] | null) ?? []
}

/** Hilos visibles, opcionalmente de una categoría, más recientes primero. */
export async function getHilosForo(categoriaId?: string, limite = 50): Promise<ForoHilo[]> {
  if (!supabase) return []
  let q = supabase
    .from('foro_hilos')
    .select('*, foro_categorias(*)')
    .eq('estado_moderacion', 'aprobado')
    .order('actualizado_en', { ascending: false })
    .limit(limite)
  if (categoriaId) q = q.eq('categoria_id', categoriaId)
  const { data } = await q
  return (data as ForoHilo[] | null) ?? []
}

/** Un hilo por id (null si no existe o no es visible). */
export async function getHiloForo(id: string): Promise<ForoHilo | null> {
  if (!supabase) return null
  const { data } = await supabase
    .from('foro_hilos')
    .select('*, foro_categorias(*)')
    .eq('id', id)
    .maybeSingle()
  return (data as ForoHilo | null) ?? null
}

/** Respuestas de un hilo en orden cronológico (solo aprobadas). */
export async function getMensajesForo(hiloId: string): Promise<ForoMensaje[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('foro_mensajes')
    .select('*')
    .eq('hilo_id', hiloId)
    .eq('estado_moderacion', 'aprobado')
    .order('creado_en', { ascending: true })
  return (data as ForoMensaje[] | null) ?? []
}

/** Nombres de autores (user_id → perfiles) en dos pasos: no hay FK directa. */
export async function autoresForo(userIds: string[]): Promise<Record<string, string>> {
  const ids = [...new Set(userIds.filter(Boolean))]
  if (!supabase || ids.length === 0) return {}
  const { data } = await supabase.from('perfiles').select('id, nombre').in('id', ids)
  const mapa: Record<string, string> = {}
  for (const fila of (data as Array<{ id: string; nombre: string | null }> | null) ?? []) {
    mapa[fila.id] = fila.nombre || ''
  }
  return mapa
}
