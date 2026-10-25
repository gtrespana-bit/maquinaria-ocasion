import { calcularRango, percentil, parseNumeroEspec, veredictoPrecio, RANGO_VACIO } from '@/lib/tasador'

test('percentil por rank-order más cercano', () => {
  const l = [10, 20, 30, 40, 50]
  expect(percentil(l, 0.5)).toBe(30)
  expect(percentil(l, 0.25)).toBe(20)
  expect(percentil(l, 0.75)).toBe(40)
  expect(percentil([], 0.5)).toBeNull()
})

test('calcularRango ignora basura y calcula min/p25/mediana/p75/max', () => {
  const r = calcularRango([100, 200, 300, 400, 500, 0, -5, 'x', null])
  expect(r.n).toBe(5)
  expect(r.min).toBe(100)
  expect(r.p25).toBe(200)
  expect(r.mediana).toBe(300)
  expect(r.p75).toBe(400)
  expect(r.max).toBe(500)
  expect(calcularRango([])).toEqual(RANGO_VACIO)
  expect(calcularRango(['a', 0])).toEqual(RANGO_VACIO)
})

test('parseNumeroEspec entiende formatos ES/US del JSONB', () => {
  expect(parseNumeroEspec('145000')).toBe(145000)
  expect(parseNumeroEspec('145.000')).toBe(145000)
  expect(parseNumeroEspec('12,5')).toBe(12.5)
  expect(parseNumeroEspec('1.450,5')).toBe(1450.5)
  expect(parseNumeroEspec('1450.5')).toBe(1450.5)
  expect(parseNumeroEspec(4500)).toBe(4500)
  expect(parseNumeroEspec('')).toBeNull()
  expect(parseNumeroEspec('abc')).toBeNull()
  expect(parseNumeroEspec(null)).toBeNull()
})

test('veredictoPrecio: dentro del rango p25–p75, encima o abajo', () => {
  const rango = calcularRango([10, 20, 30, 40, 50, 60])
  expect(veredictoPrecio(35, rango)).toBe('dentro')
  expect(veredictoPrecio(90, rango)).toBe('encima')
  expect(veredictoPrecio(5, rango)).toBe('abajo')
  expect(veredictoPrecio('', rango)).toBeNull()
  expect(veredictoPrecio(35, RANGO_VACIO)).toBeNull()
})
