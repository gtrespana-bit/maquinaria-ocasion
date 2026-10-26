/**
 * Tests de resolución de campos técnicos de MaquinariaOcasión.
 *
 * Verifica que las subcategorías de maquinaria resuelven correctamente sus
 * opciones dinámicas:
 *  - `Año` → últimos 30 años.
 *  - `Marca` (si aparece como campo) → hereda las marcas de la subcategoría.
 * Y que TODAS las subcategorías incluyen los campos transversales de la
 * taxonomía (Año, Horas de uso, Combustible, Potencia (CV), Peso (kg),
 * ¿Incluye transporte?, Documentación) además de los específicos de su
 * familia.
 */
import {
  categoriasData,
  resolverCampos,
  esCampoAnio,
  getSubConfig,
  getSubBySlug,
  getMarcaOptions,
  TODAS_LAS_SUBS,
} from '@/lib/categorias'

describe('resolverCampos: campos técnicos de maquinaria', () => {
  test('Tractores resuelve Año con los últimos 30 años', () => {
    const sub = getSubConfig('agricola', 'Tractores')
    const campos = resolverCampos(sub)
    const anio = campos.find(c => esCampoAnio(c))

    expect(anio).toBeDefined()
    expect(anio!.options!.length).toBe(30)
    expect(anio!.options![0]).toBe(String(new Date().getFullYear()))
  })

  test('Tractores ofrece las marcas agrícolas', () => {
    const marcas = getMarcaOptions('agricola', 'Tractores')

    expect(marcas).toEqual(
      expect.arrayContaining(['John Deere 6M', 'Kubota M7', 'Case IH Puma'])
    )
  })

  test('Excavadoras ofrece marcas de obra, no las agrícolas', () => {
    const marcas = getMarcaOptions('obra', 'Excavadoras')

    expect(marcas).toEqual(expect.arrayContaining(['Caterpillar 320', 'Komatsu PC210']))
    expect(marcas).not.toContain('John Deere 6M')
  })

  test('todas las subcategorías incluyen los campos transversales', () => {
    const transversales = [
      'Año',
      'Horas de uso',
      'Combustible',
      'Potencia (CV)',
      'Peso (kg)',
      '¿Incluye transporte?',
      'Documentación',
    ]
    for (const sub of TODAS_LAS_SUBS) {
      const campos = resolverCampos(sub).map(c => c.label)
      for (const bloque of transversales) {
        expect(campos).toContain(bloque)
      }
    }
  })

  test('cada subcategoría de la familia tiene sus filtros propios como campos', () => {
    const esperadosPorFamilia: Record<string, string[]> = {
      agricola: ['Tracción', 'Enganche', 'Toma de fuerza (PTO)', 'Transmisión'],
      obra: ['Tracción', 'Medidas de transporte'],
      herramientas: ['Potencia (W)', 'Tensión', 'Batería incluida'],
    }
    for (const [catKey, labels] of Object.entries(esperadosPorFamilia)) {
      for (const sub of categoriasData[catKey].subs) {
        const campos = resolverCampos(sub).map(c => c.label)
        for (const label of labels) {
          expect(campos).toContain(label)
        }
      }
    }
  })

  test('las opciones de Tracción son las de su familia (agrícola ≠ obra)', () => {
    const agri = resolverCampos(getSubConfig('agricola', 'Tractores'))
      .find(c => c.label === 'Tracción')
    expect(agri!.options).toEqual(['4x4', '4x2', 'Sin tracción'])

    const obra = resolverCampos(getSubConfig('obra', 'Excavadoras'))
      .find(c => c.label === 'Tracción')
    expect(obra!.options).toEqual(['Oruga', 'Ruedas 4x2', 'Ruedas 4x4'])
  })

  test('Documentación ofrece la documentación de maquinaria (CE y factura)', () => {
    const campos = resolverCampos(getSubConfig('obra', 'Excavadoras'))
    const doc = campos.find(c => c.label === 'Documentación')
    expect(doc!.options).toEqual([
      'Factura y libro de instrucciones',
      'Declaración CE / ficha técnica',
      'Parcial',
      'Sin documentación',
    ])
    expect(campos.find(c => c.label === 'Distintivo Ambiental DGT')).toBeUndefined()
  })

  test('los 12 slugs de subcategoría son únicos y kebab-case', () => {
    const slugs = TODAS_LAS_SUBS.map(s => s.slug)
    expect(slugs).toHaveLength(12)
    expect(new Set(slugs).size).toBe(12)
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9-]+$/)
    }
    expect(getSubBySlug('agricola', 'tractores')?.label).toBe('Tractores')
    expect(getSubBySlug('obra', 'excavadoras')?.label).toBe('Excavadoras')
    expect(getSubBySlug('herramientas', 'sierra-poda')?.label).toBe('Sierra y poda')
  })

  test('los labels de subcategoría son únicos en toda la taxonomía (productos.subcategoria)', () => {
    const labels = TODAS_LAS_SUBS.map(s => s.label)
    expect(new Set(labels).size).toBe(labels.length)
  })
})
