import {
  PLANES_PRO,
  descuentoAnualPct,
  diasRestantesTrial,
  etiquetaPlan,
  precioMensualEquivalente,
  precioPlan,
} from '@/lib/planes-anuncios'

describe('precios de los packs', () => {
  test('el anual equivale a 10 mensualidades (2 meses gratis)', () => {
    for (const plan of PLANES_PRO) {
      expect(precioPlan(plan.id, 'anual')).toBe(plan.precioMes * 10)
      expect(precioPlan(plan.id, 'mensual')).toBe(plan.precioMes)
    }
    expect(PLANES_PRO).toHaveLength(2)
    expect(precioPlan('starter', 'mensual')).toBe(19)
    expect(precioPlan('starter', 'anual')).toBe(190)
    expect(precioPlan('unlimited', 'mensual')).toBe(49)
    expect(precioPlan('unlimited', 'anual')).toBe(490)
  })

  test('el descuento anual es el real, no uno inventado', () => {
    for (const plan of PLANES_PRO) {
      const pct = descuentoAnualPct(plan.id)
      const ahorro = plan.precioMes * 12 - plan.precioAnual
      // 2 meses de 12 = 16,67 % → redondeado a 17.
      expect(pct).toBe(17)
      expect(ahorro).toBe(plan.precioMes * 2)
    }
  })

  test('el equivalente mensual no redondea a la baja el precio', () => {
    expect(precioMensualEquivalente('starter')).toBeCloseTo(15.83, 2)
    expect(precioMensualEquivalente('unlimited')).toBeCloseTo(40.83, 2)
  })

  test('etiqueta del plan siempre tiene un nombre humano', () => {
    expect(etiquetaPlan('starter')).toBe('Básico')
    expect(etiquetaPlan('unlimited')).toBe('Profesional')
    expect(etiquetaPlan('gratis')).toBe('Gratis')
    expect(etiquetaPlan(null)).toBe('Gratis')
    // El plan provisional anterior se nombra como tal, no se confunde con el actual.
    expect(etiquetaPlan('plus')).toBe('Profesional (anterior)')
  })
})

describe('cuenta atrás del mes de prueba', () => {
  const alta = new Date('2026-10-01T10:00:00+02:00')

  test('30 días desde el alta', () => {
    expect(diasRestantesTrial({ creadoEn: alta, diasGratis: 30, ahora: new Date('2026-10-10T10:00:00+02:00') })).toBe(21)
    expect(diasRestantesTrial({ creadoEn: alta, diasGratis: 30, ahora: new Date('2026-10-30T10:00:00+02:00') })).toBe(1)
  })

  test('nunca devuelve días negativos', () => {
    expect(diasRestantesTrial({ creadoEn: alta, diasGratis: 30, ahora: new Date('2026-12-01T10:00:00+01:00') })).toBe(0)
    expect(diasRestantesTrial({ creadoEn: null, diasGratis: 30 })).toBe(0)
  })

  test('sin alta no hay prueba', () => {
    expect(diasRestantesTrial({ creadoEn: null })).toBe(0)
  })
})
