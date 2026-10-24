import {
  isAllowedImageUrl,
  validateImages,
  normalizeContactMethods,
  validateSpecifications,
  resolveCategoryId,
  resolveSubcategory,
  validLocation,
  parsePrice,
} from '@/lib/productos-editar'

describe('parsePrice', () => {
  it('permite valores nulos o vacíos', () => {
    expect(parsePrice(null)).toEqual({ valid: true, value: null })
    expect(parsePrice(undefined)).toEqual({ valid: true, value: null })
    expect(parsePrice('')).toEqual({ valid: true, value: null })
  })

  it('parsea precios enteros y decimales con punto o coma', () => {
    expect(parsePrice(25000)).toEqual({ valid: true, value: 25000 })
    expect(parsePrice('32000')).toEqual({ valid: true, value: 32000 })
    expect(parsePrice('45000.50')).toEqual({ valid: true, value: 45000.5 })
    expect(parsePrice('45000,75')).toEqual({ valid: true, value: 45000.75 })
  })

  it('rechaza precios negativos, cero o no numéricos', () => {
    expect(parsePrice(-100)).toEqual({ valid: false, value: null })
    expect(parsePrice(0)).toEqual({ valid: false, value: null })
    expect(parsePrice('cero')).toEqual({ valid: false, value: null })
  })
})

describe('resolveSubcategory', () => {
  it('resuelve labels canónicos de subcategorías de maquinaria', () => {
    expect(resolveSubcategory('Tractores')).toBe('Tractores')
    expect(resolveSubcategory('Cosechadoras')).toBe('Cosechadoras')
    expect(resolveSubcategory('Excavadoras')).toBe('Excavadoras')
    expect(resolveSubcategory('Plataformas elevadoras')).toBe('Plataformas elevadoras')
    expect(resolveSubcategory('Herramienta eléctrica')).toBe('Herramienta eléctrica')
    expect(resolveSubcategory('Sierra y poda')).toBe('Sierra y poda')
    expect(resolveSubcategory('Taller manual')).toBe('Taller manual')
  })

  it('resuelve slugs de subcategorías al label oficial', () => {
    expect(resolveSubcategory('tractores')).toBe('Tractores')
    expect(resolveSubcategory('maquinaria-agricola')).toBe('Maquinaria agrícola')
    expect(resolveSubcategory('excavadoras')).toBe('Excavadoras')
    expect(resolveSubcategory('compactacion')).toBe('Compactación')
    expect(resolveSubcategory('plataformas')).toBe('Plataformas elevadoras')
    expect(resolveSubcategory('herramienta-electrica')).toBe('Herramienta eléctrica')
    expect(resolveSubcategory('sierra-poda')).toBe('Sierra y poda')
  })

  it('resuelve comparaciones case-insensitive', () => {
    expect(resolveSubcategory('tractores')).toBe('Tractores')
    expect(resolveSubcategory('TRACTORES')).toBe('Tractores')
    expect(resolveSubcategory('sierra y poda')).toBe('Sierra y poda')
  })

  it('devuelve null solo si es vacío; un valor legado se conserva tal cual', () => {
    expect(resolveSubcategory('')).toBeNull()
    expect(resolveSubcategory(null)).toBeNull()
    // Anuncios legados (demo antigua): el tipo se conserva para no perder datos.
    expect(resolveSubcategory('Gran Volumen')).toBe('Gran Volumen')
    expect(resolveSubcategory('Minicamper')).toBe('Minicamper')
    expect(resolveSubcategory('algo_desconocido')).toBe('algo_desconocido')
  })
})

describe('validLocation', () => {
  it('permite ubicaciones válidas de España', () => {
    expect(validLocation('Madrid', 'Madrid', '', '')).toBe(true)
    expect(validLocation('Cataluña', 'Barcelona', '', '')).toBe(true)
    expect(validLocation('Andalucía', 'Sevilla', '', '')).toBe(true)
  })

  it('permite Ceuta y Melilla', () => {
    expect(validLocation('Ceuta', 'Ceuta', '', '')).toBe(true)
    expect(validLocation('Melilla', 'Melilla', '', '')).toBe(true)
  })

  it('permite ubicaciones intactas de publicaciones existentes aunque sean legadas', () => {
    expect(validLocation('Miranda', 'Caracas', 'Miranda', 'Caracas')).toBe(true)
  })

  it('permite omitir la ubicación si está vacía', () => {
    expect(validLocation('', '', '', '')).toBe(true)
  })

  it('rechaza estados no válidos cuando se modifica', () => {
    expect(validLocation('EstadoFicticio', 'Ciudad', '', '')).toBe(false)
  })
})

describe('isAllowedImageUrl y validateImages', () => {
  it('permite placeholders locales y rutas relativas', () => {
    expect(isAllowedImageUrl('/placeholder-product.webp')).toBe(true)
    expect(isAllowedImageUrl('/placeholder-product.png')).toBe(true)
    expect(isAllowedImageUrl('/semilla-fotos/gran-volumen/boxer-1.jpg')).toBe(true)
  })

  it('permite URLs del propio dominio', () => {
    expect(isAllowedImageUrl('https://maquinariaocasion.online/fotos/1.webp')).toBe(true)
    expect(isAllowedImageUrl('https://sub.maquinariaocasion.online/fotos/1.webp')).toBe(true)
  })

  it('permite Supabase Storage y R2', () => {
    expect(isAllowedImageUrl('https://xyz.supabase.co/storage/v1/object/public/bucket/foto.jpg')).toBe(true)
    expect(isAllowedImageUrl('https://xyz.supabase.co/storage/v1/render/image/public/bucket/foto.jpg')).toBe(true)
  })

  it('permite fotos ya existentes del anuncio aunque sean legadas', () => {
    const current = new Set(['https://servidor-antiguo.com/foto.jpg'])
    expect(isAllowedImageUrl('https://servidor-antiguo.com/foto.jpg', current)).toBe(true)
  })

  it('validateImages conserva hasta 10 imágenes válidas', () => {
    const urls = [
      '/placeholder-product.webp',
      'https://maquinariaocasion.online/foto1.jpg',
      'https://xyz.supabase.co/storage/v1/object/public/bucket/foto2.jpg',
    ]
    expect(validateImages(urls)).toEqual(urls)
  })

  it('validateImages rechaza arrays con más de 10 imágenes o URLs no permitidas', () => {
    expect(validateImages(new Array(11).fill('/placeholder-product.webp'))).toBeNull()
    expect(validateImages(['https://sitio-malicioso.com/malware.png'])).toBeNull()
  })
})

describe('normalizeContactMethods', () => {
  it('normaliza email, teléfono, whatsapp y messenger válidos', () => {
    const input = {
      email: '  test@example.com  ',
      telefono: '+34 600 123 456',
      whatsapp: '+34 600 987 654',
      messenger: 'https://m.me/miusuario',
    }
    expect(normalizeContactMethods(input)).toEqual({
      email: 'test@example.com',
      telefono: '+34 600 123 456',
      whatsapp: '+34 600 987 654',
      messenger: 'https://m.me/miusuario',
    })
  })

  it('no falla si el usuario dejó solo el prefijo (+34 o +) o messenger vacío, sino que los omite limpiamente', () => {
    const input = {
      telefono: '+34 ',
      whatsapp: '+',
      messenger: 'https://m.me/',
      email: 'valido@example.com',
    }
    expect(normalizeContactMethods(input)).toEqual({
      email: 'valido@example.com',
    })
  })

  it('rechaza emails malformados', () => {
    expect(normalizeContactMethods({ email: 'no-es-un-email' })).toBeNull()
  })
})

describe('resolveCategoryId', () => {
  it('resuelve la categoría legada camper existente (compatibilidad)', async () => {
    const sbMock = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: 42 }, error: null }),
          }),
        }),
      }),
    }
    const id = await resolveCategoryId(sbMock, 'camper')
    expect(id).toBe(42)
  })

  it('con categoría vacía usa la categoría por defecto y la crea si falta', async () => {
    const sbMock = {
      from: jest.fn((table: string) => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: 99 }, error: null }),
          }),
        }),
      })),
    }
    const id = await resolveCategoryId(sbMock, '')
    expect(id).toBe(99)
  })
})

describe('validateSpecifications', () => {
  it('limpia y acepta especificaciones válidas', () => {
    const input = {
      'Año de matriculación': '2021',
      Kilómetros: '45000',
      Combustible: 'Diésel',
    }
    expect(validateSpecifications(input)).toEqual(input)
  })

  it('acepta null o undefined como objeto vacío', () => {
    expect(validateSpecifications(null)).toEqual({})
    expect(validateSpecifications(undefined)).toEqual({})
  })

  it('rechaza más de 30 especificaciones', () => {
    const specs: Record<string, string> = {}
    for (let i = 0; i < 35; i++) specs[`campo_${i}`] = 'valor'
    expect(validateSpecifications(specs)).toBeNull()
  })
})
