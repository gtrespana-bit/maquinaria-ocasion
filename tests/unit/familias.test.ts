/**
 * Tests de la taxonomía por familias de MaquinariaOcasión.
 *
 * El vertical de maquinaria se organiza en 3 FAMILIAS/CATEGORÍAS
 * (Agrícola / Obra / Herramientas) que agrupan los 12 tipos
 * (subcategorías). Familia y categoría son la misma clave: `FAMILIAS[k].key`
 * === `categoriasData[k]`. Estos tests blindan esa coherencia.
 */
import { FAMILIAS, familiaDeSub, categoriasData, TODAS_LAS_SUBS } from '@/lib/categorias'
import { SUBCATEGORIAS_SLUG } from '@/lib/marcas'

describe('taxonomía por familias', () => {
  test('hay exactamente 3 familias, con las claves nuevas', () => {
    expect(FAMILIAS.map(f => f.key)).toEqual(['agricola', 'obra', 'herramientas'])
  })

  test('las familias cubren los 12 tipos, sin solapes ni huecos', () => {
    const slugs = FAMILIAS.flatMap(f => f.subs)
    expect(slugs).toHaveLength(SUBCATEGORIAS_SLUG.length)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of SUBCATEGORIAS_SLUG) {
      expect(slugs).toContain(slug)
    }
  })

  test('cada slug de familia apunta a una subcategoría real', () => {
    const subSlugs = new Set(TODAS_LAS_SUBS.map(s => s.slug))
    for (const f of FAMILIAS) {
      for (const slug of f.subs) {
        expect(subSlugs).toContain(slug)
      }
    }
  })

  test('la clave de cada familia ES la clave de su categoría en categoriasData', () => {
    expect(Object.keys(categoriasData).sort()).toEqual(FAMILIAS.map(f => f.key).sort())
    for (const f of FAMILIAS) {
      const cat = categoriasData[f.key]
      expect(cat).toBeDefined()
      expect(cat.subs.map(s => s.slug)).toEqual([...f.subs])
    }
  })

  test('familiaDeSub resuelve la familia de cada tipo', () => {
    expect(familiaDeSub('tractores')?.key).toBe('agricola')
    expect(familiaDeSub('cosechadoras')?.key).toBe('agricola')
    expect(familiaDeSub('maquinaria-agricola')?.key).toBe('agricola')
    expect(familiaDeSub('ganaderia')?.key).toBe('agricola')
    expect(familiaDeSub('excavadoras')?.key).toBe('obra')
    expect(familiaDeSub('cargadoras')?.key).toBe('obra')
    expect(familiaDeSub('compactacion')?.key).toBe('obra')
    expect(familiaDeSub('plataformas')?.key).toBe('obra')
    expect(familiaDeSub('herramienta-electrica')?.key).toBe('herramientas')
    expect(familiaDeSub('motores')?.key).toBe('herramientas')
    expect(familiaDeSub('sierra-poda')?.key).toBe('herramientas')
    expect(familiaDeSub('taller-manual')?.key).toBe('herramientas')
    expect(familiaDeSub('no-existe')).toBeUndefined()
  })

  test('cada subcategoría solo aparece en su familia (4 + 4 + 4)', () => {
    expect(FAMILIAS.map(f => f.subs.length)).toEqual([4, 4, 4])
  })
})
