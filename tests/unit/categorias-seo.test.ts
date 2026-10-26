import { categoriasData } from '@/lib/categorias'
import {
  CATEGORIAS_SEO,
  CATEGORIAS_SEO_LIST,
  LANDINGS_CATEGORIA_LIST,
  getLandingCategoriaSEO,
} from '@/lib/categorias-seo'
import { SUBCATEGORIAS_SLUG } from '@/lib/marcas'

describe('páginas SEO de categorías', () => {
  it('cubre exactamente todas las categorías reales del catálogo', () => {
    expect(Object.keys(CATEGORIAS_SEO).sort()).toEqual(Object.keys(categoriasData).sort())
  })

  it('tiene contenido único y suficiente para cada landing', () => {
    const titles = CATEGORIAS_SEO_LIST.map((categoria) => categoria.titulo)
    const descriptions = CATEGORIAS_SEO_LIST.map((categoria) => categoria.descripcion)

    expect(new Set(titles).size).toBe(CATEGORIAS_SEO_LIST.length)
    expect(new Set(descriptions).size).toBe(CATEGORIAS_SEO_LIST.length)

    for (const categoria of CATEGORIAS_SEO_LIST) {
      expect(categoria.slug).toMatch(/^[a-z]+$/)
      expect(categoria.titulo.length).toBeGreaterThan(35)
      expect(categoria.descripcion.length).toBeGreaterThan(100)
      expect(categoria.introduccion.length).toBeGreaterThanOrEqual(2)
      expect(categoria.terminos.length).toBeGreaterThanOrEqual(5)
      expect(categoria.faq.length).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('landings nacionales de /categoria (familias + subcategorías)', () => {
  it('cubre las 3 familias y las 12 subcategorías, sin slugs repetidos', () => {
    const slugs = LANDINGS_CATEGORIA_LIST.map((l) => l.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(slugs).toEqual(expect.arrayContaining([
      ...Object.keys(CATEGORIAS_SEO),
      ...SUBCATEGORIAS_SLUG,
    ]))
    expect(LANDINGS_CATEGORIA_LIST).toHaveLength(
      Object.keys(CATEGORIAS_SEO).length + SUBCATEGORIAS_SLUG.length,
    )
  })

  it('cada landing trae contenido editorial suficiente y único', () => {
    const titulos = LANDINGS_CATEGORIA_LIST.map((l) => l.titulo)
    expect(new Set(titulos).size).toBe(titulos.length)
    for (const landing of LANDINGS_CATEGORIA_LIST) {
      expect(landing.slug).toMatch(/^[a-z-]+$/)
      expect(landing.descripcion.length).toBeGreaterThan(80)
      expect(landing.introduccion.length).toBeGreaterThanOrEqual(2)
      expect(landing.faq.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('resuelve familia y subcategoría con su familia y etiqueta de BD', () => {
    const familia = getLandingCategoriaSEO('agricola')
    expect(familia?.tipo).toBe('familia')
    expect(familia?.subEtiqueta).toBeNull()

    const sub = getLandingCategoriaSEO('tractores')
    expect(sub?.tipo).toBe('subcategoria')
    expect(sub?.familiaSlug).toBe('agricola')
    expect(sub?.subEtiqueta).toBe('Tractores')

    const plataformas = getLandingCategoriaSEO('plataformas')
    expect(plataformas?.familiaSlug).toBe('obra')
    expect(plataformas?.subEtiqueta).toBe('Plataformas elevadoras')

    expect(getLandingCategoriaSEO('no-existe')).toBeUndefined()
  })
})
