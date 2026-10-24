/**
 * Tests del registro de filtros técnicos del catálogo.
 *
 * Lo que se protege aquí:
 *  1. Que la captura (/publicar) y el filtro (catálogo) no diverjan: cada
 *     filtro tiene que existir como campo de formulario en alguna
 *     subcategoría de su familia y sus opciones tienen que salir de la misma
 *     lista.
 *  2. Que los filtros se traduzcan a UNA condición de contención JSONB (`@>`,
 *     el operador que cubre el índice GIN `productos_especificaciones_idx`) y no
 *     a una condición por campo con `->>`.
 *  3. Que parámetros desconocidos o vacíos no ensucien la consulta ni la caché.
 *  4. Que los filtros específicos se muestren por familia (transversales
 *     solas sin contexto; transversales + específicos con ella).
 */
import {
  FILTROS_TECNICOS,
  CAMPOS_TECNICOS,
  PARAMETROS_TECNICOS,
  RANGOS_NUMERICOS,
  camposPorCategoria,
  filtrosDeCategoria,
  gruposDeFiltros,
  leerFiltrosTecnicos,
  limpiarFiltrosTecnicos,
  hayFiltrosTecnicos,
  especificacionesDeFiltros,
  aplicarFiltrosTecnicos,
  firmaFiltrosTecnicos,
  leerFiltrosRango,
  limpiarFiltrosRango,
  hayFiltrosRango,
  firmaFiltrosRango,
  parsearNumeroEs,
} from '@/lib/filtros-tecnicos'
import { categoriasData, resolverCampos, TODAS_LAS_SUBS } from '@/lib/categorias'

describe('registro de filtros técnicos', () => {
  test('los parámetros y las claves JSONB de la unión son únicos', () => {
    const params = FILTROS_TECNICOS.map(f => f.param)
    const campos = FILTROS_TECNICOS.map(f => f.campo)

    expect(new Set(params).size).toBe(params.length)
    expect(new Set(campos).size).toBe(campos.length)
    expect(PARAMETROS_TECNICOS).toEqual(params)
    expect(CAMPOS_TECNICOS).toEqual(Object.fromEntries(FILTROS_TECNICOS.map(f => [f.param, f.campo])))
  })

  test('las tres familias tienen su conjunto con transversales y específicos', () => {
    expect(Object.keys(camposPorCategoria).sort()).toEqual(['agricola', 'herramientas', 'obra'])
    for (const filtros of Object.values(camposPorCategoria)) {
      // 3 transversales + 3 específicos por familia
      expect(filtros).toHaveLength(6)
      expect(filtros.map(f => f.param)).toEqual(
        expect.arrayContaining(['combustible', 'documentacion', 'transporte'])
      )
    }
    expect(camposPorCategoria.agricola.map(f => f.param)).toEqual(
      expect.arrayContaining(['traccion', 'enganche', 'pto'])
    )
    expect(camposPorCategoria.obra.map(f => f.param)).toEqual(
      expect.arrayContaining(['traccion', 'capacidad', 'medidas'])
    )
    expect(camposPorCategoria.herramientas.map(f => f.param)).toEqual(
      expect.arrayContaining(['potenciaW', 'tension', 'bateriaIncluida'])
    )
  })

  test('sin familia solo se muestran los filtros transversales', () => {
    const filtros = filtrosDeCategoria(undefined)
    expect(filtros.map(f => f.param).sort()).toEqual(['combustible', 'documentacion', 'transporte'])
    expect(filtrosDeCategoria('no-existe')).toEqual(filtros)
  })

  test('misma param ⇒ misma campo JSONB en todas las familias (tracción)', () => {
    const porParam = new Map<string, string>()
    for (const filtros of Object.values(camposPorCategoria)) {
      for (const f of filtros) {
        const previa = porParam.get(f.param)
        if (previa) expect(f.campo).toBe(previa)
        else porParam.set(f.param, f.campo)
      }
    }
  })

  test('cada filtro ofrece opciones y su clave i18n es de catalog.filters', () => {
    for (const filtros of Object.values(camposPorCategoria)) {
      for (const filtro of filtros) {
        expect(filtro.opciones.length).toBeGreaterThan(0)
        expect(filtro.i18n).toMatch(/^catalog\.filters\./)
      }
    }
  })

  test('los grupos se construyen por familia sin grupos vacíos', () => {
    const deAgri = gruposDeFiltros('agricola')
    expect(deAgri.map(g => g.grupo)).toEqual(['tecnica', 'documentacion', 'logistica'])
    for (const grupo of deAgri) {
      expect(grupo.filtros.every(f => f.grupo === grupo.grupo)).toBe(true)
    }
    const sinContexto = gruposDeFiltros(undefined)
    expect(sinContexto.map(g => g.grupo)).toEqual(['tecnica', 'documentacion', 'logistica'])
    // Sin familia no hay filtros de logística específicos… los transversales
    // sí incluyen uno en logística (transporte): el grupo existe.
    expect(sinContexto.flatMap(g => g.filtros).length).toBe(3)
  })

  test('cada filtro existe como campo del formulario de su familia con las mismas opciones', () => {
    for (const [catKey, filtros] of Object.entries(camposPorCategoria)) {
      const camposDeCat = categoriasData[catKey].subs.flatMap(sub => resolverCampos(sub))
      for (const filtro of filtros) {
        const campo = camposDeCat.find(c => c.label === filtro.campo)
        expect(campo).toBeDefined()
        expect(campo!.type).toBe('select')
        // Las opciones del filtro son un subconjunto de las del formulario: el
        // filtro nunca ofrece un valor que el vendedor no pueda declarar.
        for (const opcion of filtro.opciones) {
          expect(campo!.options).toContain(opcion)
        }
      }
    }
  })

  test('los campos transversales están en todas las subcategorías y no se repiten', () => {
    for (const sub of TODAS_LAS_SUBS) {
      const labels = resolverCampos(sub).map(c => c.label)
      const repetidos = labels.filter((l, i) => labels.indexOf(l) !== i)
      expect(repetidos).toEqual([])
      expect(labels).toEqual(
        expect.arrayContaining(['Año', 'Horas de uso', 'Combustible', 'Potencia (CV)', 'Peso (kg)', '¿Incluye transporte?', 'Documentación'])
      )
    }
  })
})

describe('lectura de filtros desde la query string', () => {
  test('lee los parámetros conocidos y descarta vacíos y desconocidos', () => {
    const params = new URLSearchParams('combustible=Diésel&transporte=Sí&precioMin=20000&marca=&raro=1')

    expect(leerFiltrosTecnicos(params)).toEqual({ combustible: 'Diésel', transporte: 'Sí' })
  })

  test('acepta la forma de searchParams de Next.js (string | string[])', () => {
    expect(leerFiltrosTecnicos({ tension: '400 V', documentacion: ['Parcial'], marca: 'CAT', vacio: '' })).toEqual({
      tension: '400 V',
      documentacion: 'Parcial',
    })
  })

  test('sin parámetros devuelve un objeto vacío', () => {
    expect(leerFiltrosTecnicos(null)).toEqual({})
    expect(leerFiltrosTecnicos(undefined)).toEqual({})
    expect(leerFiltrosTecnicos(new URLSearchParams())).toEqual({})
  })

  test('recorta espacios y descarta parámetros desconocidos', () => {
    expect(limpiarFiltrosTecnicos({ combustible: '  Diésel  ', inventado: 'x', pto: '   ' })).toEqual({ combustible: 'Diésel' })
    expect(hayFiltrosTecnicos({ inventado: 'x' })).toBe(false)
    expect(hayFiltrosTecnicos({ combustible: 'Diésel' })).toBe(true)
    expect(hayFiltrosTecnicos(null)).toBe(false)
  })
})

describe('traducción a la consulta de Supabase', () => {
  test('traduce los parámetros a las claves del JSONB especificaciones', () => {
    expect(especificacionesDeFiltros({ capacidad: 'Más de 3 t', bateriaIncluida: 'Sí' })).toEqual({
      'Capacidad de carga': 'Más de 3 t',
      'Batería incluida': 'Sí',
    })
  })

  test('aplica todos los filtros en UNA contención JSONB (índice GIN)', () => {
    const llamadas: unknown[] = []
    const query = {
      contains: (column: string, value: Record<string, string>) => {
        llamadas.push([column, value])
        return query
      },
    }

    const resultado = aplicarFiltrosTecnicos(query, { combustible: 'Diésel', traccion: 'Oruga', documentacion: 'Parcial' })

    expect(resultado).toBe(query)
    expect(llamadas).toEqual([
      ['especificaciones', { 'Combustible': 'Diésel', 'Tracción': 'Oruga', 'Documentación': 'Parcial' }],
    ])
  })

  test('sin filtros activos devuelve la consulta intacta (una sola llamada por query)', () => {
    const contains = jest.fn()
    const query = { contains }

    expect(aplicarFiltrosTecnicos(query, {})).toBe(query)
    expect(aplicarFiltrosTecnicos(query, { precioMin: '20000' })).toBe(query)
    expect(contains).not.toHaveBeenCalled()
  })
})

describe('firma de filtros', () => {
  test('es estable e independiente del orden de las claves', () => {
    const a = firmaFiltrosTecnicos({ combustible: 'Diésel', transporte: 'Sí' })
    const b = firmaFiltrosTecnicos({ transporte: 'Sí', combustible: 'Diésel' })

    expect(a).toBe(b)
    expect(a).toBe('combustible=Diésel&transporte=Sí')
  })

  test('cambia al cambiar un valor y se vacía sin filtros', () => {
    expect(firmaFiltrosTecnicos({ combustible: 'Diésel' })).not.toBe(firmaFiltrosTecnicos({ combustible: 'Gasolina' }))
    expect(firmaFiltrosTecnicos({})).toBe('')
    expect(firmaFiltrosTecnicos(null)).toBe('')
  })
})

describe('rangos numéricos', () => {
  test('los rangos son horas de uso (lte) y año (gte) con columna generada esperada', () => {
    expect(RANGOS_NUMERICOS.map(r => r.param)).toEqual(['horasMax', 'anioMin'])
    for (const r of RANGOS_NUMERICOS) {
      expect(r.columnaGenerada).toMatch(/^espec_/)
      expect(r.campo).toBeTruthy()
      expect(r.claves).toContain(r.campo)
    }
    expect(RANGOS_NUMERICOS.find(r => r.param === 'horasMax')!.operador).toBe('lte')
    expect(RANGOS_NUMERICOS.find(r => r.param === 'horasMax')!.columnaGenerada).toBe('espec_horas')
    expect(RANGOS_NUMERICOS.find(r => r.param === 'anioMin')!.operador).toBe('gte')
    expect(RANGOS_NUMERICOS.find(r => r.param === 'anioMin')!.columnaGenerada).toBe('espec_anio')
  })

  test('parsea números en formato español e internacional', () => {
    expect(parsearNumeroEs('145000')).toBe(145000)
    expect(parsearNumeroEs('145.000')).toBe(145000)
    expect(parsearNumeroEs('12,5')).toBe(12.5)
    expect(parsearNumeroEs('200')).toBe(200)
    expect(parsearNumeroEs(240)).toBe(240)
    expect(parsearNumeroEs('abc')).toBeNull()
    expect(parsearNumeroEs('')).toBeNull()
    expect(parsearNumeroEs('1450.500')).toBe(1450500) // heurístico US/miles → un solo número
  })

  test('lee y limpia los rangos de la query string', () => {
    expect(leerFiltrosRango(new URLSearchParams('horasMax=5000&anioMin=2015'))).toEqual({
      horasMax: 5000, anioMin: 2015,
    })
    expect(leerFiltrosRango(new URLSearchParams('horasMax=abc&foo=1'))).toEqual({})
    expect(limpiarFiltrosRango({ horasMax: '5000', anioMin: 2015, raro: 'x' })).toEqual({ horasMax: 5000, anioMin: 2015 })
    expect(hayFiltrosRango({ horasMax: 1 })).toBe(true)
    expect(hayFiltrosRango({ raro: 1 })).toBe(false)
    expect(hayFiltrosRango(null)).toBe(false)
  })

  test('firma de rangos estable e independiente del orden', () => {
    const a = firmaFiltrosRango({ horasMax: 5000, anioMin: 2015 })
    const b = firmaFiltrosRango({ anioMin: 2015, horasMax: 5000 })
    expect(a).toBe(b)
    expect(a).toBe('horasMax=5000&anioMin=2015')
    expect(firmaFiltrosRango({})).toBe('')
  })
})
