/**
 * Normaliza un enlace de vídeo a una URL embebible.
 *
 * Soporta YouTube (watch, youtu.be, shorts, embed), Vimeo y Google Drive.
 * Cualquier otra URL se devuelve como enlace normal (la ficha muestra un
 * botón «Ver vídeo» en lugar de un iframe).
 */
export type VideoEmbed =
  | { tipo: 'iframe'; src: string }
  | { tipo: 'enlace'; href: string }
  | null

const MAX_LARGO = 500

export function normalizarVideoUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const limpio = raw.trim()
  if (!limpio || limpio.length > MAX_LARGO) return null
  try {
    const u = new URL(limpio.startsWith('http') ? limpio : `https://${limpio}`)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
    return u.toString()
  } catch {
    return null
  }
}

function idYouTube(u: URL): string | null {
  const host = u.hostname.replace(/^www\./, '')
  if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null
  if (host === 'm.youtube.com') return u.searchParams.get('v')
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (u.pathname === '/watch') return u.searchParams.get('v')
    const m = u.pathname.match(/^\/(shorts|embed|live)\/([\w-]{5,})/)
    return m ? m[2] : null
  }
  return null
}

export function embedDeVideo(raw: unknown): VideoEmbed {
  const href = normalizarVideoUrl(raw)
  if (!href) return null
  let u: URL
  try {
    u = new URL(href)
  } catch {
    return null
  }

  const yt = idYouTube(u)
  if (yt && /^[\w-]{5,}$/.test(yt)) {
    return { tipo: 'iframe', src: `https://www.youtube-nocookie.com/embed/${yt}` }
  }

  const host = u.hostname.replace(/^www\./, '')
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const m = u.pathname.match(/^\/(?:video\/)?(\d+)/)
    if (m) return { tipo: 'iframe', src: `https://player.vimeo.com/video/${m[1]}` }
  }

  if (host === 'drive.google.com') {
    const m = u.pathname.match(/\/file\/d\/([\w-]{10,})/)
    if (m) return { tipo: 'iframe', src: `https://drive.google.com/file/d/${m[1]}/preview` }
  }

  return { tipo: 'enlace', href }
}
