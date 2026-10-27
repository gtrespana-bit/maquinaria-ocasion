/**
 * Lectura de los artículos del blog.
 *
 * El blog vive en `src/content/blog/*.md` (no en Supabase). Esta lectura la
 * usaban el sitemap y el feed RSS con copias casi idénticas; centralizarla
 * evita que un día el sitemap anuncie un post que el feed no conoce (o al
 * revés) y permite reutilizarla para IndexNow.
 */
import fs from 'fs'
import path from 'path'
import { limpiarComillas } from './seo'

export interface PostArchivo {
  slug: string
  /** `date:` del frontmatter, si existe y es una fecha válida. */
  fecha?: Date
}

function extraerFecha(raw: string): Date | undefined {
  const match = raw.match(/^date:\s*(.+)$/m)
  if (!match) return undefined
  const fecha = new Date(limpiarComillas(match[1]))
  return Number.isNaN(fecha.getTime()) ? undefined : fecha
}

/** Todos los posts, ordenados por fecha descendente (los sin fecha, al final). */
export function postsDelBlog(): PostArchivo[] {
  const dir = path.join(process.cwd(), 'src/content/blog')
  if (!fs.existsSync(dir)) return []

  const posts = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const slug = file.replace(/\.md$/, '')
      try {
        const raw = fs.readFileSync(path.join(dir, file), 'utf-8')
        const fecha = extraerFecha(raw)
        return fecha ? { slug, fecha } : { slug }
      } catch {
        // Sin fecha válida, la URL se incluye sin inventar lastmod.
        return { slug }
      }
    })

  return posts.sort((a, b) => (b.fecha?.getTime() || 0) - (a.fecha?.getTime() || 0))
}
