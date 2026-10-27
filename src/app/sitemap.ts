import type { MetadataRoute } from 'next'
import { hayDatosTitular } from '@/lib/datos-legales'
import { MARCAS_MODELOS, fabricantesUnicos, slugFabricante, slugModelo } from '@/lib/marcas'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { CIUDADES_SEO, CATEGORIAS_POPULARES } from '@/lib/ubicaciones-seo'
import { LANDINGS_CATEGORIA_LIST, SUBCATEGORIAS_SEO } from '@/lib/categorias-seo'
import { MIN_ANUNCIOS_LANDING_LOCAL } from '@/lib/seo-landings'
import { postsDelBlog } from '@/lib/blog-archivos'

const BASE_URL = 'https://maquinaria.click'
const PAGE_SIZE = 1000

// Tope duro de filas: evita que una tabla enorme convierta la generación del
// sitemap en una consulta sin fin (Google corta la descarga y Search Console
// lo marca como «no se ha podido obtener»).
const MAX_FILAS = 20000

// El sitemap se regenera periódicamente para descubrir anuncios nuevos sin
// necesitar un despliegue. El de imágenes conserva su caché independiente.
export const revalidate = 21600

const MODERACION = 'estado_moderacion.is.null,estado_moderacion.eq.aprobado'

/**
 * Columnas por orden de preferencia. Si una instalación no tiene `slug`
 * (esquema antiguo) o `es_demo`, se reintenta con la siguiente lista en vez
 * de devolver un sitemap vacío.
 */
const COLUMNAS = [
  'id, slug, user_id, actualizado_en, ubicacion_ciudad, subcategoria, marca, es_demo',
  'id, user_id, actualizado_en, ubicacion_ciudad, subcategoria, marca, es_demo',
  'id, user_id, actualizado_en, ubicacion_ciudad, subcategoria, marca',
]

type FilaProducto = {
  id: string | number
  slug?: string | null
  user_id?: string | null
  actualizado_en?: string | null
  ubicacion_ciudad?: string | null
  subcategoria?: string | null
  marca?: string | null
  es_demo?: boolean | null
}

/**
 * UNA sola pasada paginada sobre `productos`.
 *
 * Antes se hacían tres recorridos completos de la tabla (productos, conteos
 * de ciudad y stock de marcas). En una función que Google puede pedir en
 * frío eso multiplicaba la latencia y el riesgo de superar el tiempo máximo
 * de ejecución —un 504 es exactamente lo que Search Console reporta como
 * «no se ha podido obtener el sitemap»—. Ahora se lee una vez y se agrega
 * en memoria.
 *
 * Se piden todos los anuncios visibles (incluidos los de muestra), porque
 * las landings y las páginas de marca/modelo los cuentan igual que la web:
 * así el sitemap y el `robots` de cada página usan el mismo criterio. Las
 * fichas de producto sí excluyen los anuncios `es_demo`, que llevan noindex.
 */
async function getInventario(supabase: any): Promise<FilaProducto[]> {
  if (!supabase) return []

  for (const columnas of COLUMNAS) {
    const filas: FilaProducto[] = []
    let fallo = false

    // Supabase puede limitar una respuesta a 1.000 filas aunque el límite
    // pedido sea mayor; paginar evita dejar anuncios fuera del sitemap.
    for (let offset = 0; offset < MAX_FILAS; offset += PAGE_SIZE) {
      const { data, error } = await supabase
        .from('productos')
        .select(columnas)
        .eq('activo', true)
        .or(MODERACION)
        .order('id', { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1)

      if (error) {
        fallo = true
        break
      }

      const pagina = (data || []) as FilaProducto[]
      filas.push(...pagina)
      if (pagina.length < PAGE_SIZE) return filas
    }

    if (!fallo) return filas
  }

  return []
}

function normalize(value: string | null | undefined) {
  return (value || '')
    .trim()
    .toLocaleLowerCase('es-ES')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

type Analisis = {
  /** Anuncios reales (sin `es_demo`): los únicos con ficha indexable. */
  productos: FilaProducto[]
  ciudades: Set<string>
  ciudadCategorias: Set<string>
  fabricantes: Set<string>
  modelos: Set<string>
}

/**
 * Agrega el inventario en memoria:
 *  · fichas de producto indexables (`es_demo` fuera)
 *  · landings locales con inventario suficiente
 *  · marcas/modelos con al menos un anuncio visible
 */
function analizar(inventario: FilaProducto[]): Analisis {
  const cityByName = new Map<string, string>()
  for (const city of CIUDADES_SEO) {
    cityByName.set(normalize(city.nombre), city.slug)
    if (city.municipio) cityByName.set(normalize(city.municipio), city.slug)
  }

  const categoryByName = new Map(
    SUBCATEGORIAS_SEO.map((category) => [normalize(category.categoria), category.slug]),
  )
  const modeloPorValor = new Map(MARCAS_MODELOS.map((modelo) => [modelo.valor, modelo]))

  const conteoCiudades = new Map<string, number>()
  const conteoCombos = new Map<string, number>()
  const fabricantes = new Set<string>()
  const modelos = new Set<string>()
  const productos: FilaProducto[] = []

  for (const producto of inventario) {
    if (producto.es_demo !== true) productos.push(producto)

    const citySlug = cityByName.get(normalize(producto.ubicacion_ciudad))
    if (citySlug) {
      conteoCiudades.set(citySlug, (conteoCiudades.get(citySlug) || 0) + 1)

      const categorySlug = categoryByName.get(normalize(producto.subcategoria))
      if (categorySlug && CATEGORIAS_POPULARES.includes(categorySlug)) {
        const combo = `${citySlug}/${categorySlug}`
        conteoCombos.set(combo, (conteoCombos.get(combo) || 0) + 1)
      }
    }

    const modelo = producto.marca ? modeloPorValor.get(producto.marca) : undefined
    if (modelo) {
      fabricantes.add(slugFabricante(modelo.fabricante))
      modelos.add(slugModelo(modelo))
    }
  }

  return {
    productos,
    ciudades: new Set(
      [...conteoCiudades].filter(([, n]) => n >= MIN_ANUNCIOS_LANDING_LOCAL).map(([slug]) => slug),
    ),
    ciudadCategorias: new Set(
      [...conteoCombos].filter(([, n]) => n >= MIN_ANUNCIOS_LANDING_LOCAL).map(([combo]) => combo),
    ),
    fabricantes,
    modelos,
  }
}

/** Sin duplicados: Google descarta las entradas repetidas de un sitemap. */
function sinDuplicados(urls: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const vistas = new Set<string>()
  return urls.filter((entry) => {
    if (vistas.has(entry.url)) return false
    vistas.add(entry.url)
    return true
  })
}

/** URLs que no dependen de la base de datos: siempre publicables. */
function urlsEditoriales(): MetadataRoute.Sitemap {
  const staticPaths: {
    path: string
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
    priority: number
  }[] = [
    { path: '', changeFrequency: 'daily', priority: 1 },
    { path: '/catalogo', changeFrequency: 'daily', priority: 0.9 },
    { path: '/blog', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/foro', changeFrequency: 'daily', priority: 0.7 },
    { path: '/publicar', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/creditos', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/politica-de-privacidad', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/politica-de-cookies', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/terminos-y-condiciones', changeFrequency: 'yearly', priority: 0.3 },
    ...(hayDatosTitular()
      ? [{ path: '/aviso-legal', changeFrequency: 'yearly' as const, priority: 0.3 }]
      : []),
    { path: '/marcas', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/tiendas', changeFrequency: 'daily', priority: 0.8 },
    { path: '/comprar-a-particulares', changeFrequency: 'daily', priority: 0.8 },
    { path: '/comprar-a-profesionales', changeFrequency: 'daily', priority: 0.8 },
    { path: '/como-funciona', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/para-profesionales', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/tasador', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/como-instalar-app', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/contacto', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/faq', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/sobre-nosotros', changeFrequency: 'monthly', priority: 0.5 },
  ]

  // No se inventa una fecha común de última modificación para páginas que no
  // han cambiado. La portada canonical es / con barra final.
  const staticUrls: MetadataRoute.Sitemap = staticPaths.map((page) => ({
    url: page.path ? `${BASE_URL}${page.path}` : `${BASE_URL}/`,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))

  // Familias (3) + subcategorías (12): las landings nacionales indexables.
  const categoryUrls: MetadataRoute.Sitemap = LANDINGS_CATEGORIA_LIST.map((category) => ({
    url: `${BASE_URL}/categoria/${category.slug}`,
    changeFrequency: 'daily',
    priority: category.tipo === 'familia' ? 0.9 : 0.8,
  }))

  const blogUrls: MetadataRoute.Sitemap = postsDelBlog().map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    ...(post.fecha ? { lastModified: post.fecha } : {}),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticUrls, ...categoryUrls, ...blogUrls]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const editoriales = urlsEditoriales()
  let dinamicas: MetadataRoute.Sitemap = []

  // Todo lo que depende de Supabase va aquí dentro: si la base de datos falla,
  // el sitemap se sirve igualmente con las URLs editoriales (nunca un 500,
  // que es lo que Search Console interpreta como sitemap ilegible).
  try {
    const supabase = getSupabaseServerClient()

    if (supabase) {
      const inventario = await getInventario(supabase)
      const datos = analizar(inventario)

      const productUrls: MetadataRoute.Sitemap = datos.productos.map((product) => {
        const lastModified = product.actualizado_en
          ? new Date(product.actualizado_en)
          : undefined
        const validLastModified = lastModified && !Number.isNaN(lastModified.getTime())
          ? lastModified
          : undefined

        return {
          url: `${BASE_URL}/producto/${product.slug || product.id}`,
          ...(validLastModified ? { lastModified: validLastModified } : {}),
          changeFrequency: 'weekly',
          priority: 0.8,
        }
      })

      const sellerIds = [
        ...new Set(datos.productos.map((product) => product.user_id).filter(Boolean)),
      ] as string[]

      const vendorUrls: MetadataRoute.Sitemap = sellerIds.slice(0, 1000).map((id) => ({
        url: `${BASE_URL}/vendedor/${id}`,
        changeFrequency: 'weekly',
        priority: 0.5,
      }))

      const tiendaUrls: MetadataRoute.Sitemap = []
      if (sellerIds.length > 0) {
        try {
          const { data: tiendas, error: tiendasError } = await supabase
            .from('perfiles')
            .select('id, slug')
            .eq('tienda_activa', true)
            .not('slug', 'is', null)
            .in('id', sellerIds.slice(0, 1000))
            .limit(1000)

          if (!tiendasError) {
            for (const tienda of tiendas || []) {
              if (!tienda.slug) continue
              tiendaUrls.push({
                url: `${BASE_URL}/tienda/${tienda.slug}`,
                changeFrequency: 'daily',
                priority: 0.7,
              })
            }
          }
        } catch {
          // Sin tiendas: el resto del sitemap sigue siendo válido.
        }
      }

      // Hilos del foro visibles (RLS público): se descubren sin deploy.
      const foroUrls: MetadataRoute.Sitemap = []
      try {
        const { data: foroHilos } = await supabase
          .from('foro_hilos')
          .select('id, actualizado_en')
          .eq('estado_moderacion', 'aprobado')
          .order('actualizado_en', { ascending: false })
          .limit(1000)

        for (const hilo of foroHilos || []) {
          const lastModified = hilo.actualizado_en ? new Date(hilo.actualizado_en) : undefined
          const validLastModified = lastModified && !Number.isNaN(lastModified.getTime())
            ? lastModified
            : undefined
          foroUrls.push({
            url: `${BASE_URL}/foro/hilo/${hilo.id}`,
            ...(validLastModified ? { lastModified: validLastModified } : {}),
            changeFrequency: 'daily',
            priority: 0.6,
          })
        }
      } catch {
        // Foro no disponible (tabla ausente o RLS): se omite sin romper nada.
      }

      const marcaUrls: MetadataRoute.Sitemap = fabricantesUnicos(MARCAS_MODELOS)
        .filter((f) => datos.fabricantes.has(slugFabricante(f)))
        .map((f) => ({
          url: `${BASE_URL}/marca/${slugFabricante(f)}`,
          changeFrequency: 'weekly',
          priority: 0.7,
        }))

      const modeloUrls: MetadataRoute.Sitemap = MARCAS_MODELOS
        .filter((model) => datos.modelos.has(slugModelo(model)))
        .map((model) => ({
          url: `${BASE_URL}/modelo/${slugModelo(model)}`,
          changeFrequency: 'daily',
          priority: 0.8,
        }))

      const cityUrls: MetadataRoute.Sitemap = CIUDADES_SEO
        .filter((city) => datos.ciudades.has(city.slug))
        .map((city) => ({
          url: `${BASE_URL}/${city.slug}`,
          changeFrequency: 'weekly',
          priority: 0.7,
        }))

      const cityCategoryUrls: MetadataRoute.Sitemap = []
      for (const city of CIUDADES_SEO) {
        for (const category of CATEGORIAS_POPULARES) {
          if (!datos.ciudadCategorias.has(`${city.slug}/${category}`)) continue
          cityCategoryUrls.push({
            url: `${BASE_URL}/${city.slug}/${category}`,
            changeFrequency: 'weekly',
            priority: 0.6,
          })
        }
      }

      dinamicas = [
        ...marcaUrls,
        ...modeloUrls,
        ...cityUrls,
        ...cityCategoryUrls,
        ...productUrls,
        ...vendorUrls,
        ...tiendaUrls,
        ...foroUrls,
      ]
    }
  } catch {
    // Si Supabase falla, se mantienen las URLs estáticas y editoriales.
    dinamicas = []
  }

  return sinDuplicados([...editoriales, ...dinamicas])
}
