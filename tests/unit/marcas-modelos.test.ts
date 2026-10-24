/**
 * Tests del catálogo maestro de marcas y modelos (@/lib/marcas).
 *
 * El catálogo alimenta los filtros de marca/modelo del catálogo y del
 * buscador, el paso 2 de /publicar y la página /marcas. Estos tests blindan:
 *
 *  - Integridad: valores canónicos únicos y bien formados.
 *  - Cobertura: cada uno de los 12 tipos de la taxonomía de maquinaria tiene
 *    marcas propias (no son las mismas marcas para un tractor que para una
 *    excavadora o un taladro).
 *  - Agrupación: fabricante → modelo para los <optgroup> de la UI.
 *  - Slugs de /modelo/[slug]: únicos, limpios y con ida y vuelta.
 */
import {
  MARCAS_MODELOS,
  SUBCATEGORIAS_SLUG,
  modelosDeSubcategoria,
  modeloPorValor,
  agruparPorFabricante,
  etiquetaModelo,
  valoresUnicos,
  fabricantesUnicos,
  resumenFabricantes,
} from '@/lib/marcas'
import { categoriasData, getMarcaOptions } from '@/lib/categorias'

describe('catálogo maestro de marcas y modelos', () => {
  test('los valores canónicos son únicos y no vacíos', () => {
    const valores = MARCAS_MODELOS.map(m => m.valor)
    expect(new Set(valores).size).toBe(valores.length)
    for (const m of MARCAS_MODELOS) {
      expect(m.valor.trim().length).toBeGreaterThan(0)
      expect(m.fabricante.trim().length).toBeGreaterThan(0)
    }
  })

  test('cada entrada es apta para al menos una subcategoría válida', () => {
    for (const m of MARCAS_MODELOS) {
      expect(m.aptoPara.length).toBeGreaterThan(0)
      for (const slug of m.aptoPara) {
        expect(SUBCATEGORIAS_SLUG).toContain(slug)
      }
    }
  })

  test('los 12 tipos de maquinaria tienen marcas propias (≥3 fabricantes)', () => {
    for (const slug of SUBCATEGORIAS_SLUG) {
      const entradas = modelosDeSubcategoria(slug)
      expect(entradas.length).toBeGreaterThanOrEqual(3)
      const fabricantes = new Set(entradas.map(m => m.fabricante))
      expect(fabricantes.size).toBeGreaterThanOrEqual(3)
    }
  })

  test('las marcas son específicas por familia (no se mezclan)', () => {
    // Tractores: marcas agrícolas
    const aggTractores = modelosDeSubcategoria('tractores').map(m => m.fabricante)
    expect(aggTractores).toEqual(expect.arrayContaining([
      'John Deere', 'Kubota', 'New Holland', 'Case IH', 'Massey Ferguson', 'Fendt',
    ]))
    // Excavadoras: marcas de obra — NUNCA marcas agrícolas como tractor
    const aggExcavadoras = modelosDeSubcategoria('excavadoras').map(m => m.fabricante)
    expect(aggExcavadoras).toEqual(expect.arrayContaining([
      'Caterpillar', 'Komatsu', 'Volvo', 'Hitachi', 'JCB',
    ]))
    expect(aggExcavadoras).not.toContain('John Deere')
    // Herramienta eléctrica: sin marcas de obra
    const aggHerramienta = modelosDeSubcategoria('herramienta-electrica').map(m => m.fabricante)
    expect(aggHerramienta).toEqual(expect.arrayContaining(['Makita', 'Bosch', 'DeWalt']))
    expect(aggHerramienta).not.toContain('Caterpillar')
    expect(aggHerramienta).not.toContain('John Deere')
    // Sierra y poda: marcas de corte/poda
    const aggPoda = modelosDeSubcategoria('sierra-poda').map(m => m.fabricante)
    expect(aggPoda).toEqual(expect.arrayContaining(['Stihl', 'Husqvarna']))
  })

  test('un mismo fabricante puede cubrir varias subcategorías (aptoPara multi)', () => {
    const merlo = MARCAS_MODELOS.find(m => m.valor === 'Merlo')
    expect(merlo).toBeDefined()
    expect(merlo!.aptoPara).toEqual(expect.arrayContaining(['cargadoras', 'plataformas']))

    const makita = MARCAS_MODELOS.find(m => m.valor === 'Makita')
    expect(makita).toBeDefined()
    expect(makita!.aptoPara).toEqual(expect.arrayContaining(['herramienta-electrica', 'sierra-poda']))
  })

  test('getMarcaOptions devuelve las marcas de la subcategoría pedida', () => {
    expect(getMarcaOptions('agricola', 'Tractores')).toEqual(
      expect.arrayContaining(['John Deere 6M', 'Kubota M7', 'Fendt 500 Vario'])
    )
    expect(getMarcaOptions('obra', 'Excavadoras')).toEqual(
      expect.arrayContaining(['Caterpillar 320', 'Komatsu PC210'])
    )
    // La excavadora no ofrece tractores
    expect(getMarcaOptions('obra', 'Excavadoras')).not.toContain('John Deere 6M')
    // Subcategoría inexistente → lista vacía
    expect(getMarcaOptions('agricola', 'No existe')).toEqual([])
  })

  test('agruparPorFabricante agrupa y ordena alfabéticamente', () => {
    const grupos = agruparPorFabricante(modelosDeSubcategoria('excavadoras'))

    const cat = grupos.find(g => g.fabricante === 'Caterpillar')
    expect(cat).toBeDefined()
    expect(cat!.modelos.map(etiquetaModelo)).toContain('320')

    const komatsu = grupos.find(g => g.fabricante === 'Komatsu')
    expect(komatsu).toBeDefined()

    // Orden alfabético es-ES de los grupos.
    const nombres = grupos.map(g => g.fabricante)
    expect(nombres).toEqual([...nombres].sort((a, b) => a.localeCompare(b, 'es')))

    // Dentro de un fabricante, los modelos también van ordenados.
    const catValores = cat!.modelos.map(etiquetaModelo)
    expect(catValores).toEqual([...catValores].sort((a, b) => a.localeCompare(b, 'es')))
  })

  test('valoresUnicos deduplica y fabricantesUnicos ordena', () => {
    const modelos = modelosDeSubcategoria('tractores')
    const valores = valoresUnicos([...modelos, ...modelos])
    expect(new Set(valores).size).toBe(valores.length)

    const fabs = fabricantesUnicos(modelos)
    expect(fabs).toContain('John Deere')
    expect(fabs).toEqual([...fabs].sort((a, b) => a.localeCompare(b, 'es')))
  })

  test('resumenFabricantes muestra los primeros y un contador del resto', () => {
    const modelos = modelosDeSubcategoria('excavadoras')
    const resumen = resumenFabricantes(modelos, 3)
    expect(resumen).toMatch(/\+\d+$/)
    expect(resumen).toContain(' · ')
    expect(resumenFabricantes([], 3)).toBe('')
  })

  test('modeloPorValor resuelve valores del catálogo nuevo', () => {
    expect(modeloPorValor('John Deere 6M')).toBeDefined()
    expect(modeloPorValor('Caterpillar 320')).toBeDefined()
    expect(modeloPorValor('Makita')).toBeDefined()
    expect(modeloPorValor('Fiat Ducato')).toBeUndefined()
  })

  test('categoriasData expone las marcas estructuradas de cada subcategoría', () => {
    for (const cat of Object.values(categoriasData)) {
      for (const sub of cat.subs) {
        expect(sub.marcas.length).toBeGreaterThan(0)
        for (const m of sub.marcas) {
          expect(m.aptoPara).toContain(sub.slug)
        }
      }
    }
  })
})

/**
 * Slugs de las páginas de modelo (/modelo/[slug]).
 *
 * Cada una de estas URLs se va a indexar y a enlazar desde /marcas y desde el
 * sitemap, así que un slug duplicado significaría dos modelos peleando por la
 * misma página, y un slug que cambie rompería enlaces ya indexados.
 */
describe('slugs de las páginas de modelo', () => {
  const { slugModelo, modeloPorSlug } = require('@/lib/marcas')

  it('todos los modelos generan un slug no vacío', () => {
    for (const m of MARCAS_MODELOS) {
      expect(slugModelo(m).length).toBeGreaterThan(2)
    }
  })

  it('los slugs son únicos (no hay dos modelos en la misma URL)', () => {
    const slugs = MARCAS_MODELOS.map(slugModelo)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('son URLs limpias: minúsculas, sin acentos ni símbolos', () => {
    for (const m of MARCAS_MODELOS) {
      expect(slugModelo(m)).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    }
  })

  it('cada slug resuelve a su modelo (ida y vuelta)', () => {
    for (const m of MARCAS_MODELOS) {
      expect(modeloPorSlug(slugModelo(m))?.valor).toBe(m.valor)
    }
  })

  it('un slug inventado no resuelve a nada', () => {
    expect(modeloPorSlug('no-existe-este-modelo')).toBeUndefined()
    expect(modeloPorSlug('')).toBeUndefined()
  })

  it('los acentos y símbolos de los valores canónicos se normalizan', () => {
    const volvo = MARCAS_MODELOS.find(m => m.valor === 'Volvo EC210')
    expect(volvo && slugModelo(volvo)).toBe('volvo-ec210')
    const mob = MARCAS_MODELOS.find(m => m.valor === 'Cub Cadet')
    expect(mob && slugModelo(mob)).toBe('cub-cadet')
  })
})
