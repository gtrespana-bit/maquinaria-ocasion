/**
 * GET /api/cron/indexnow — red de seguridad de IndexNow.
 *
 * Los avisos salen en el momento de publicar o editar un anuncio, pero una
 * petición puede perderse (el buscador estaba caído, el proceso murió tras el
 * INSERT…). Este cron repasa lo cambiado en las últimas horas y lo reenvía:
 *
 *   · por defecto: anuncios con `actualizado_en` en las últimas 26 h (algo más
 *     que la frecuencia diaria, para no dejar huecos entre ejecuciones) y posts
 *     del blog con fecha de los últimos 7 días.
 *   · `?todo=1`: TODAS las URLs del sitemap, siempre.
 *
 * La PRIMERA vez que corre (no hay `indexnow_siembra` en `plataforma_ajustes`)
 * manda el sitemap completo, para que el dominio entre en el índice de Bing sin
 * esperar a que cada anuncio se vuelva a tocar. A partir de ahí solo manda lo
 * nuevo: IndexNow penaliza reenviar URLs que no han cambiado.
 *
 * Requiere `CRON_SECRET` (Vercel envía `Authorization: Bearer …`).
 * Programa: diario a las 06:37 UTC (ver vercel.json).
 */
import { NextRequest, NextResponse } from 'next/server'
import sitemap from '@/app/sitemap'
import { postsDelBlog } from '@/lib/blog-archivos'
import {
  enviarIndexNow,
  urlEnviable,
  urlsDeAnuncio,
  type AnuncioParaIndexNow,
} from '@/lib/indexnow'
import { MARCA } from '@/lib/marca'
import { sbAdmin } from '@/lib/sb-admin'

const HORAS_ANUNCIOS = 26
const DIAS_BLOG = 7
const CLAVE_SIEMBRA = 'indexnow_siembra'

/** ¿Ya se hizo la siembra inicial del sitemap? */
async function siembraHecha(): Promise<boolean> {
  const { data, error } = await sbAdmin()
    .from('plataforma_ajustes')
    .select('clave')
    .eq('clave', CLAVE_SIEMBRA)
    .maybeSingle()
  if (error) return false
  return Boolean(data)
}

/** Marca la siembra como hecha (y las URLs enviadas) para no repetirla. */
async function marcarSiembra(urls: number): Promise<void> {
  try {
    await sbAdmin().from('plataforma_ajustes').upsert({
      clave: CLAVE_SIEMBRA,
      valor: { enviadas: urls, fecha: new Date().toISOString() },
      actualizado_en: new Date().toISOString() })
  } catch {
    // Si no se puede guardar, el peor caso es repetir la siembra mañana.
  }
}

/** Todas las URLs públicas del sitemap, filtradas por lo que acepta IndexNow. */
async function urlsDelSitemap(): Promise<string[]> {
  const entradas = await sitemap()
  return entradas.map((entrada) => entrada.url).filter(urlEnviable)
}

async function urlsRecientes(): Promise<{ urls: string[]; anuncios: number; posts: number }> {
  const urls = new Set<string>()

  // ── Anuncios cambiados en las últimas horas ──────────────────
  const desde = new Date(Date.now() - HORAS_ANUNCIOS * 60 * 60 * 1000).toISOString()
  const { data, error } = await sbAdmin()
    .from('productos')
    .select(
      'id, slug, activo, vendido, es_demo, estado_moderacion, ubicacion_ciudad, ' +
        'ubicacion_estado, subcategoria, actualizado_en',
    )
    .eq('activo', true)
    .or('estado_moderacion.is.null,estado_moderacion.eq.aprobado')
    .gte('actualizado_en', desde)
    .order('actualizado_en', { ascending: false })
    .limit(1000)

  if (error) throw new Error(`productos: ${error.message}`)

  for (const anuncio of (data || []) as unknown as AnuncioParaIndexNow[]) {
    for (const url of urlsDeAnuncio(anuncio)) urls.add(url)
  }

  // ── Posts del blog recientes ─────────────────────────────────
  const limite = Date.now() - DIAS_BLOG * 24 * 60 * 60 * 1000
  const posts = postsDelBlog().filter((post) => (post.fecha?.getTime() || 0) >= limite)
  for (const post of posts) urls.add(`${MARCA.url}/blog/${post.slug}`)

  return {
    urls: [...urls],
    anuncios: (data || []).length,
    posts: posts.length,
  }
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const todo = request.nextUrl.searchParams.get('todo') === '1'

  try {
    if (todo) {
      const urls = await urlsDelSitemap()
      const resultado = await enviarIndexNow(urls)
      return NextResponse.json({
        modo: 'sitemap',
        candidatas: urls.length,
        ...resultado })
    }

    // Primera ejecución: siembra completa del sitemap.
    if (!(await siembraHecha())) {
      const urls = await urlsDelSitemap()
      const resultado = await enviarIndexNow(urls)
      if (resultado.enviado) await marcarSiembra(resultado.urls)
      return NextResponse.json({
        modo: 'siembra-inicial',
        candidatas: urls.length,
        ...resultado })
    }

    const { urls, anuncios, posts } = await urlsRecientes()
    const resultado = await enviarIndexNow(urls)
    return NextResponse.json({
      modo: 'recientes',
      anuncios,
      posts,
      candidatas: urls.length,
      ...resultado })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error inesperado' },
      { status: 500 },
    )
  }
}
