/**
 * IndexNow — aviso inmediato a los buscadores que lo soportan (Bing, Yandex,
 * Seznam, Naver…; Google NO lo usa, va por sitemap) de que una URL nueva o
 * modificada existe.
 *
 * Cómo funciona (https://www.indexnow.org/documentation):
 *  1. El dominio demuestra propiedad con un fichero de texto en la raíz que
 *     contiene la clave: `/{clave}.txt` → ver `public/`.
 *  2. Se hace un POST a `https://api.indexnow.org/indexnow` con `host`, `key`,
 *     `keyLocation` y `urlList` (máx. 10.000 URLs por petición, mismo host).
 *
 * Reglas que aplica este módulo, porque IndexNow penaliza el abuso:
 *  · Solo se envían URLs indexables: nada de anuncios de muestra (`es_demo`,
 *    que llevan noindex), ni `/en`, ni rutas privadas.
 *  · Nunca lanza: si el buscador está caído, la publicación del anuncio no se
 *    ve afectada. Todo queda en un `console.warn` y en el resultado devuelto.
 *  · En previews y en desarrollo no se envía nada (evita avisar de URLs que
 *    todavía no son públicas).
 */
import { MARCA } from './marca'
import { getCiudadByMunicipioYEstado } from './ubicaciones-seo'
import { SUBCATEGORIAS_SEO } from './categorias-seo'

/** Clave pública del dominio. Debe coincidir con `public/{clave}.txt`. */
export const INDEXNOW_KEY =
  process.env.INDEXNOW_KEY?.trim() || '76e0410c624a49c890a8f681cbeb8da8'

const BASE_URL = MARCA.url
const HOST = MARCA.dominio
const ENDPOINT = 'https://api.indexnow.org/indexnow'
const MAX_URLS = 10000
const TIMEOUT_MS = 8000

/** Rutas que nunca se envían (privadas o con noindex). */
const RUTAS_PRIVADAS = [
  '/admin',
  '/dashboard',
  '/mi-perfil',
  '/chat',
  '/confirm',
  '/confirmacion',
  '/reset-password',
  '/eliminar-cuenta',
  '/offline',
  '/buscar',
  '/en',
]

export type AnuncioParaIndexNow = {
  slug?: string | null
  id?: string | null
  activo?: boolean | null
  vendido?: boolean | null
  es_demo?: boolean | null
  estado_moderacion?: string | null
  ubicacion_ciudad?: string | null
  ubicacion_estado?: string | null
  subcategoria?: string | null
}

/**
 * ¿Merece la pena avisar de este anuncio?
 * Misma regla que el sitemap: activo, sin vender, sin moderación pendiente y
 * sin ser muestra (esas fichas llevan `noindex`).
 */
export function anuncioIndexable(anuncio: AnuncioParaIndexNow): boolean {
  if (!anuncio) return false
  if (anuncio.activo === false) return false
  if (anuncio.vendido === true) return false
  if (anuncio.es_demo === true) return false
  if (anuncio.estado_moderacion && anuncio.estado_moderacion !== 'aprobado') return false
  return Boolean(anuncio.slug || anuncio.id)
}

/**
 * URLs que cambian al publicar/editar un anuncio: su ficha y las landings que
 * lo listan (provincia y provincia+subcategoría), que son las que también se
 * revalidan en `revalidarListadosPublicos`.
 */
export function urlsDeAnuncio(anuncio: AnuncioParaIndexNow): string[] {
  if (!anuncioIndexable(anuncio)) return []

  const identificador = String(anuncio.slug || anuncio.id)
  const urls = [`${BASE_URL}/producto/${identificador}`]

  const ciudad = anuncio.ubicacion_ciudad
    ? getCiudadByMunicipioYEstado(anuncio.ubicacion_ciudad, anuncio.ubicacion_estado || '')
    : undefined
  if (ciudad) {
    urls.push(`${BASE_URL}/${ciudad.slug}`)
    const sub = anuncio.subcategoria
      ? SUBCATEGORIAS_SEO.find((s) => s.categoria === anuncio.subcategoria)
      : undefined
    if (sub) urls.push(`${BASE_URL}/${ciudad.slug}/${sub.slug}`)
  }

  return urls
}

/** ¿Esta URL se puede enviar a IndexNow? (https, mismo host, indexable) */
export function urlEnviable(url: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  if (parsed.protocol !== 'https:') return false
  if (parsed.hostname !== HOST) return false
  const ruta = parsed.pathname
  return !RUTAS_PRIVADAS.some(
    (privada) => ruta === privada || ruta.startsWith(`${privada}/`),
  )
}

export type PayloadIndexNow = {
  host: string
  key: string
  keyLocation: string
  urlList: string[]
}

/**
 * Construye el JSON que espera la API, limpio: sin duplicados, sin URLs de
 * otro host y con el tope de 10.000 que impone el protocolo.
 * Devuelve `null` si no queda ninguna URL válida.
 */
export function payloadIndexNow(urls: string[], clave = INDEXNOW_KEY): PayloadIndexNow | null {
  const lista = [...new Set(urls)].filter(urlEnviable).slice(0, MAX_URLS)
  if (lista.length === 0) return null
  return {
    host: HOST,
    key: clave,
    keyLocation: `${BASE_URL}/${clave}.txt`,
    urlList: lista,
  }
}

/** En preview/desarrollo no se avisa a nadie: esas URLs no son las públicas. */
export function puedeEnviarIndexNow(): boolean {
  if (process.env.INDEXNOW_DISABLED === '1') return false
  if (process.env.VERCEL_ENV === 'preview') return false
  if (process.env.NODE_ENV === 'test') return false
  return true
}

export type ResultadoIndexNow = {
  enviado: boolean
  status?: number
  urls: number
  motivo?: string
}

/**
 * Envía las URLs a IndexNow. Nunca lanza: devuelve el resultado y deja el
 * detalle en el log. `deps.fetch` permite inyectar un fetch en los tests.
 */
export async function enviarIndexNow(
  urls: string[],
  deps: { fetchImpl?: typeof fetch; clave?: string } = {},
): Promise<ResultadoIndexNow> {
  const payload = payloadIndexNow(urls, deps.clave)
  if (!payload) return { enviado: false, urls: 0, motivo: 'sin URLs indexables' }
  if (!puedeEnviarIndexNow()) {
    return { enviado: false, urls: payload.urlList.length, motivo: 'entorno no productivo' }
  }

  const hacerFetch = deps.fetchImpl || fetch

  try {
    const respuesta = await hacerFetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    // 200 y 202 significan «recibido»; 4xx son fallos de clave/formato y
    // 429 es límite de peticiones (se reintentará con el cron).
    const enviado = respuesta.status === 200 || respuesta.status === 202
    if (!enviado) {
      console.warn(`[indexnow] respuesta ${respuesta.status} al enviar ${payload.urlList.length} URLs`)
    }
    return { enviado, status: respuesta.status, urls: payload.urlList.length }
  } catch (error) {
    console.warn('[indexnow] no se pudo enviar:', error instanceof Error ? error.message : error)
    return {
      enviado: false,
      urls: payload.urlList.length,
      motivo: error instanceof Error ? error.message : 'error de red',
    }
  }
}

/**
 * Atajo para las rutas de publicación/edición: lanza el aviso en segundo plano
 * sin bloquear la respuesta al usuario.
 */
export function avisarIndexNowDeAnuncio(anuncio: AnuncioParaIndexNow): void {
  const urls = urlsDeAnuncio(anuncio)
  if (urls.length === 0) return
  void enviarIndexNow(urls).catch(() => {
    // enviarIndexNow ya captura; esto es solo una red de seguridad.
  })
}
