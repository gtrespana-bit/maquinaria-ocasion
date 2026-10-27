/** @jest-environment node */

import {
  anuncioIndexable,
  enviarIndexNow,
  payloadIndexNow,
  urlEnviable,
  urlsDeAnuncio,
} from '@/lib/indexnow'

const anuncioBase = {
  slug: 'tractor-kubota-m5',
  id: 'abc-123',
  activo: true,
  vendido: false,
  es_demo: false,
  estado_moderacion: 'aprobado',
  ubicacion_ciudad: 'Sevilla',
  ubicacion_estado: 'Andalucía',
  subcategoria: 'Tractores',
}

describe('IndexNow', () => {
  describe('anuncioIndexable', () => {
    it('acepta un anuncio activo, aprobado y real', () => {
      expect(anuncioIndexable(anuncioBase)).toBe(true)
    })

    it.each([
      ['de muestra (noindex)', { es_demo: true }],
      ['vendido', { vendido: true }],
      ['pausado', { activo: false }],
      ['en moderación', { estado_moderacion: 'pendiente' }],
    ])('rechaza un anuncio %s', (_caso, extra) => {
      expect(anuncioIndexable({ ...anuncioBase, ...extra })).toBe(false)
    })

    it('rechaza un anuncio sin slug ni id', () => {
      expect(anuncioIndexable({ ...anuncioBase, slug: null, id: null })).toBe(false)
    })
  })

  describe('urlsDeAnuncio', () => {
    it('devuelve la ficha y las landings de provincia', () => {
      const urls = urlsDeAnuncio(anuncioBase)
      expect(urls[0]).toBe('https://maquinaria.click/producto/tractor-kubota-m5')
      expect(urls).toContain('https://maquinaria.click/sevilla')
      expect(urls).toContain('https://maquinaria.click/sevilla/tractores')
    })

    it('no devuelve nada para un anuncio que no se indexa', () => {
      expect(urlsDeAnuncio({ ...anuncioBase, es_demo: true })).toEqual([])
    })

    it('sin ciudad SEO solo devuelve la ficha', () => {
      const urls = urlsDeAnuncio({
        ...anuncioBase,
        ubicacion_ciudad: 'Pueblo sin landing',
        ubicacion_estado: 'Ninguna' })
      expect(urls).toEqual(['https://maquinaria.click/producto/tractor-kubota-m5'])
    })
  })

  describe('urlEnviable', () => {
    it.each([
      ['otro host', 'https://www.maquinaria.click/producto/x', false],
      ['http sin TLS', 'http://maquinaria.click/producto/x', false],
      ['privada', 'https://maquinaria.click/admin/anuncios', false],
      ['inglés (noindex)', 'https://maquinaria.click/en/catalogo', false],
      ['buscador (noindex)', 'https://maquinaria.click/buscar?q=tractor', false],
      ['ficha pública', 'https://maquinaria.click/producto/x', true],
      ['landing', 'https://maquinaria.click/sevilla/tractores', true],
    ])('%s', (_caso, url, esperado) => {
      expect(urlEnviable(url)).toBe(esperado)
    })
  })

  describe('payloadIndexNow', () => {
    it('deduplica, filtra y arma el JSON del protocolo', () => {
      const payload = payloadIndexNow([
        'https://maquinaria.click/producto/a',
        'https://maquinaria.click/producto/a',
        'https://otro-dominio.com/x',
        'https://maquinaria.click/en/x',
      ])

      expect(payload).toEqual({
        host: 'maquinaria.click',
        key: '76e0410c624a49c890a8f681cbeb8da8',
        keyLocation: 'https://maquinaria.click/76e0410c624a49c890a8f681cbeb8da8.txt',
        urlList: ['https://maquinaria.click/producto/a'] })
    })

    it('devuelve null si no queda ninguna URL válida', () => {
      expect(payloadIndexNow(['https://ejemplo.com/a'])).toBeNull()
    })

    it('respeta el tope de 10.000 URLs por petición', () => {
      const muchas = Array.from(
        { length: 10050 },
        (_, i) => `https://maquinaria.click/producto/${i}`,
      )
      expect(payloadIndexNow(muchas)?.urlList).toHaveLength(10000)
    })
  })

  describe('enviarIndexNow', () => {
    const envOriginal = process.env

    beforeEach(() => {
      // `puedeEnviarIndexNow` no envía en test/preview: se simula producción.
      process.env = { ...envOriginal, NODE_ENV: 'production' }
      delete process.env.INDEXNOW_DISABLED
      delete process.env.VERCEL_ENV
    })

    afterEach(() => {
      process.env = envOriginal
      jest.restoreAllMocks()
    })

    it('hace un POST con el payload y da por bueno un 200', async () => {
      const fetchImpl = jest.fn().mockResolvedValue({ status: 200 } as Response)

      const resultado = await enviarIndexNow(
        ['https://maquinaria.click/producto/a'],
        { fetchImpl: fetchImpl as unknown as typeof fetch },
      )

      expect(resultado).toEqual({ enviado: true, status: 200, urls: 1 })
      const [url, init] = fetchImpl.mock.calls[0]
      expect(url).toBe('https://api.indexnow.org/indexnow')
      expect(init.method).toBe('POST')
      expect(JSON.parse(init.body).urlList).toEqual(['https://maquinaria.click/producto/a'])
    })

    it('no lanza si el buscador devuelve 429', async () => {
      const fetchImpl = jest.fn().mockResolvedValue({ status: 429 } as Response)
      jest.spyOn(console, 'warn').mockImplementation(() => {})

      const resultado = await enviarIndexNow(
        ['https://maquinaria.click/producto/a'],
        { fetchImpl: fetchImpl as unknown as typeof fetch },
      )

      expect(resultado.enviado).toBe(false)
      expect(resultado.status).toBe(429)
    })

    it('no lanza si la red falla', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {})
      const fetchImpl = jest.fn().mockRejectedValue(new Error('ECONNRESET'))

      const resultado = await enviarIndexNow(
        ['https://maquinaria.click/producto/a'],
        { fetchImpl: fetchImpl as unknown as typeof fetch },
      )

      expect(resultado.enviado).toBe(false)
      expect(resultado.motivo).toContain('ECONNRESET')
    })

    it('no hace la petición si no hay URLs indexables', async () => {
      const fetchImpl = jest.fn()

      const resultado = await enviarIndexNow(['https://ejemplo.com/a'], {
        fetchImpl: fetchImpl as unknown as typeof fetch })

      expect(resultado.enviado).toBe(false)
      expect(resultado.motivo).toBe('sin URLs indexables')
      expect(fetchImpl).not.toHaveBeenCalled()
    })

    it('no envía en preview de Vercel', async () => {
      process.env.VERCEL_ENV = 'preview'
      const fetchImpl = jest.fn()

      const resultado = await enviarIndexNow(
        ['https://maquinaria.click/producto/a'],
        { fetchImpl: fetchImpl as unknown as typeof fetch },
      )

      expect(resultado.motivo).toBe('entorno no productivo')
      expect(fetchImpl).not.toHaveBeenCalled()
    })
  })
})
